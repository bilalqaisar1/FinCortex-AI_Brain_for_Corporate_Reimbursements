from fastapi import APIRouter, HTTPException, Depends
from models.schemas import ReceiptUpload, ToolResponse
from services.vision_service import VisionService
from services.openai_service import OpenAIService
from services.azure_service import AzureService
import base64
import json
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

vision_service = VisionService()
openai_service = OpenAIService()
azure_service = AzureService()

@router.post("/receipt-text-extraction-azure", response_model=ToolResponse)
async def receipt_text_extraction_azure(receipt: ReceiptUpload):
    try:
        result = azure_service.extract_text_from_receipt(receipt.file_content)
        if result["success"]:
            return ToolResponse(success=True, data={"extracted_text": result["full_text"], "tables": result.get("tables", [])})
        else:
            return ToolResponse(success=False, error=result["error"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/receipt-text-extraction-openai", response_model=ToolResponse)
async def receipt_text_extraction_openai(receipt: ReceiptUpload):
    try:
        result = openai_service.extract_text_with_vision(receipt.file_content)
        if result["success"]:
            return ToolResponse(success=True, data={"extracted_text": result["full_text"]})
        else:
            return ToolResponse(success=False, error=result["error"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/receipt-structuring-tool", response_model=ToolResponse)
async def receipt_structuring_tool(extracted_text: str, claim_config: dict = None, admin_id: str = None):
    try:
        result = openai_service.extract_receipt_fields(extracted_text, claim_config=claim_config)
        if result["success"]:
            return ToolResponse(success=True, data=result["extracted_data"])
        else:
            return ToolResponse(success=False, error=result["error"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/receipt-validation-tool", response_model=ToolResponse)
async def receipt_validation_tool(structured_data: dict):
    # Basic validation logic
    required_fields = ["vendor_name", "total_bill", "date"]
    missing_fields = [field for field in required_fields if not structured_data.get(field)]
    
    if missing_fields:
        return ToolResponse(success=True, data={"valid": False, "missing_fields": missing_fields})
    return ToolResponse(success=True, data={"valid": True})

@router.post("/error-handling-and-retry-tool", response_model=ToolResponse)
async def error_handling_and_retry_tool(error_message: str, retry_count: int = 0):
    # Logic to determine if we should retry or fallback
    can_retry = retry_count < 3
    should_fallback = "Azure" in error_message or "timeout" in error_message.lower()
    
    return ToolResponse(success=True, data={
        "can_retry": can_retry,
        "should_fallback": should_fallback,
        "next_action": "retry" if can_retry and not should_fallback else "fallback" if should_fallback else "fail"
    })

@router.post("/logging-and-audit-tool", response_model=ToolResponse)
async def logging_and_audit_tool(user_id: str, operation: str, details: dict):
    logger.info(f"AUDIT LOG: User {user_id} performed {operation}. Details: {json.dumps(details)}")
    return ToolResponse(success=True, message="Operation logged successfully")

@router.post("/process-receipt-end-to-end", response_model=ToolResponse)
async def process_receipt_end_to_end(receipt: ReceiptUpload):
    """
    Agentic Orchestrator (Intelligence Layer):
    This tool reasons over the extracted data and coordinates other tools.
    """
    user_id = receipt.user_id
    image_content = receipt.file_content
    
    # 1. Start Logging/Audit
    await logging_and_audit_tool(user_id, "receipt_processing_start", {"status": "initiated"})
    
    # 2. Decision: Try Azure first (Primary OCR)
    logger.info("🤖 Agent Decision: Using Azure Document Intelligence (Primary)")
    extraction_result = await receipt_text_extraction_azure(receipt)
    
    source = "azure"
    if not extraction_result.success:
        # 3. Reasoning & Error Handling: Fallback to OpenAI
        error_msg = extraction_result.error or "Azure failed"
        logger.warning(f"🤖 Agent Reasoning: Azure failed ({error_msg}). Falling back to OpenAI Vision.")
        
        await logging_and_audit_tool(user_id, "ocr_fallback", {"error": error_msg, "fallback_to": "openai"})
        
        extraction_result = await receipt_text_extraction_openai(receipt)
        source = "openai_vision"
        
        if not extraction_result.success:
            logger.error(f"❌ Both OCR methods failed.")
            await logging_and_audit_tool(user_id, "receipt_processing_failed", {"error": "All OCR methods failed"})
            return ToolResponse(success=False, error="Critical: All OCR and Fallback methods exhausted.")
    
    extracted_text = extraction_result.data.get("extracted_text")
    
    # 4. Structuring: Convert text to JSON
    logger.info(f"🤖 Agent Decision: Structuring text using OpenAI (Source: {source})")
    struct_result = await receipt_structuring_tool(extracted_text, claim_config=receipt.claim_config)
    
    if not struct_result.success:
        logger.error(f"❌ Structuring failed.")
        await logging_and_audit_tool(user_id, "structuring_failed", {"error": struct_result.error})
        return ToolResponse(success=False, error=f"Structuring failed: {struct_result.error}")
    
    structured_data = struct_result.data
    
    # 5. Validation: Verify extracted data
    logger.info("🤖 Agent Decision: Validating structured data")
    validation_result = await receipt_validation_tool(structured_data)
    
    validation_status = "valid"
    if not validation_result.data.get("valid"):
        validation_status = "partially_valid"
        missing = validation_result.data.get("missing_fields")
        logger.warning(f"🤖 Agent Reasoning: Data missing required fields: {missing}")
        await logging_and_audit_tool(user_id, "validation_warning", {"missing_fields": missing})

    # 6. Category Enforcement: Server-side validation (never trust GPT alone)
    claim_config = getattr(receipt, 'claim_config', None) or {}
    categories = claim_config.get('categories', [])
    if categories:
        try:
            allowed_cats = set()
            allowed_subcats = set()
            for cat in categories:
                cat_name = (cat.get("category_name") or "").strip().lower()
                if cat_name:
                    allowed_cats.add(cat_name)
                for sub in cat.get("subcategories", []):
                    sub_name = (sub.get("subcategory_name") or "").strip().lower()
                    if sub_name:
                        allowed_subcats.add(sub_name)

            items = structured_data.get("items", [])
            allowed_display = ", ".join(c.title() for c in sorted(allowed_cats)) if allowed_cats else "(none)"

            for item in items:
                item_cat = (item.get("category") or "").strip().lower()
                item_subcat = (item.get("subcategory") or "").strip().lower()
                matches_cat = item_cat in allowed_cats
                matches_subcat = item_subcat in allowed_subcats if item_subcat else False

                if not (matches_cat or matches_subcat):
                    item["is_reimbursable"] = False
                    original_cat = item.get("category") or "Unknown"
                    if not allowed_cats:
                        item["rejection_reason"] = (
                            "No reimbursement categories configured for this company. "
                            "All items are non-reimbursable."
                        )
                    else:
                        item["rejection_reason"] = (
                            f"Category '{original_cat}' is not in the company's "
                            f"allowed reimbursement categories: {allowed_display}"
                        )

            logger.info(
                "🛡️ MCP Category enforcement applied: allowed=%s, items_checked=%d",
                allowed_display, len(items),
            )
        except Exception as enforce_exc:
            logger.warning("⚠️ MCP Category enforcement failed: %s", enforce_exc)

    # 7. Final Audit & Success
    await logging_and_audit_tool(user_id, "receipt_processing_complete", {
        "source": source,
        "validation": validation_status,
        "vendor": structured_data.get("vendor_name")
    })
    
    return ToolResponse(
        success=True,
        data={
            "extracted_text": extracted_text,
            "structured_data": structured_data,
            "user_id": user_id,
            "ocr_source": source,
            "validation_status": validation_status
        }
    )

# Keeping old endpoints for compatibility if needed, but they are now redundant with the above
@router.post("/process-receipt", response_model=ToolResponse)
async def process_receipt(receipt: ReceiptUpload):
    return await receipt_text_extraction_azure(receipt)

@router.get("/vision-status")
async def get_vision_status():
    """Check API status"""
    return {
        "azure_available": azure_service.azure_available,
        "openai_available": True,
        "message": "MCP AI Services status check"
    }