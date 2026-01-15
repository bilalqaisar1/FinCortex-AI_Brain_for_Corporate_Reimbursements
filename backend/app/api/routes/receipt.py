"""
Receipt processing API routes.
Handles image upload, OCR extraction, GPT structuring, and reimbursement creation.
"""
from __future__ import annotations

import json
import logging
import os
import shutil
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ValidationError

from app.services.receipt_processing_service import (
    process_receipt,
    ReceiptProcessingError,
)
from app.services.reimbursement_service import (
    ReimbursementItemPayload,
    ReimbursementSubmission,
    ReimbursementServiceError,
    create_reimbursement,
)
from app.services.policy_service import check_policy
from app.services.storage_service import StorageUploadError, upload_receipt_to_bucket
from app.services.remote_receipt_service import process_remote_receipt
from app.services.supabase_rpc_service import get_expense_categories_with_subcategories, SupabaseRPCError
from app.services.fraud_detection_service import fraud_detection_service
from app.services.email_service import email_service
from app.services.supabase_service import get_supabase_client
from app.config.settings import settings

logger = logging.getLogger(__name__)

router = APIRouter()


class ReimbursementItemModel(BaseModel):
    item: str = Field(..., description="Item name")
    price: str = Field(..., description="Unit price as string")
    quantity: Optional[str] = Field(None, description="Quantity string")


class ReimbursementPayloadModel(BaseModel):
    receipt_code: Optional[str] = Field(None, description="Unique receipt identifier")
    invoice_number: Optional[str] = Field(None, description="Original invoice number")
    admin_id: Optional[UUID] = Field(None, description="Admin user ID")
    manager_id: Optional[UUID] = Field(None, description="Manager user ID")
    department_id: Optional[int] = Field(None, description="Department ID")
    company_id: Optional[UUID] = Field(None, description="Company ID (usually inferred)")
    vendor_name: str = Field(..., description="Vendor name")
    vendor_type: Optional[str] = Field(None, description="Vendor type/category")
    address: Optional[str] = Field(None, description="Vendor address")
    expense_date: Optional[str] = Field(None, description="Expense date (YYYY-MM-DD)")
    category_id: Optional[int] = Field(None, description="Expense category ID")
    subcategory_id: Optional[int] = Field(None, description="Expense subcategory ID")
    receipt_type_id: Optional[int] = Field(None, description="Receipt type ID")
    payment_method: Optional[str] = Field(None, description="Payment method (cash/card/etc.)")
    total_amount: str = Field(..., description="Total claimed amount")
    description: Optional[str] = Field(None, description="Expense description")
    user_id: UUID = Field(..., description="Submitting user ID")
    items: List[ReimbursementItemModel] = Field(default_factory=list)
    ocr_raw_text: Optional[str] = Field(None, description="Raw OCR text")
    ocr_structured: Optional[Dict[str, Any]] = Field(None, description="Structured OCR JSON")


def _generate_temp_filename(original_filename: str) -> str:
    """Generate a unique temporary filename."""
    _, ext = os.path.splitext(original_filename or "file")
    return f"{uuid.uuid4().hex}{ext}"


def _normalize_receipt_code(payload: ReimbursementPayloadModel) -> str:
    if payload.invoice_number:
        return payload.invoice_number.strip()
    if payload.receipt_code:
        return payload.receipt_code.strip()
    return f"RC-{uuid.uuid4().hex[:8].upper()}"


def _normalize_date(date_str: Optional[str]) -> Optional[str]:
    if not date_str:
        return None
    try:
        parsed = datetime.fromisoformat(date_str)
        return parsed.date().isoformat()
    except ValueError:
        try:
            parsed = datetime.strptime(date_str, "%Y-%m-%d")
            return parsed.date().isoformat()
        except ValueError:
            return None


@router.post("/receipt/upload")
async def upload_receipt(
    file: UploadFile = File(...),
    admin_uuid: Optional[str] = Form(None),
) -> JSONResponse:
    """
    Upload receipt image and process it through OCR + GPT.

    Args:
        file: Uploaded receipt image file
        admin_uuid: Optional admin UUID to scope categories/subcategories

    Returns:
        JSON response with raw_text and structured data

    Raises:
        HTTPException: If file processing fails
    """
    logger.info("📥 POST /receipt/upload - Request received: filename='%s', content_type='%s', admin_uuid='%s'", 
                file.filename, file.content_type, admin_uuid)
    
    if not file.content_type or not file.content_type.startswith("image/"):
        # Also allow PDF uploads
        allowed_types = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
        if file.content_type not in allowed_types:
            error_msg = "Invalid file type. Please upload an image (JPG, PNG) or PDF file."
            logger.error("❌ POST /receipt/upload - Validation error: %s", error_msg)
            logger.error("📤 POST /receipt/upload - Error response: status_code=400, detail='%s'", error_msg)
            raise HTTPException(
                status_code=400,
                detail=error_msg,
            )

    # File size validation - max 5MB (User Story 2.1.1)
    MAX_FILE_SIZE_MB = 5
    MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
    
    # Read file content to check size
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > MAX_FILE_SIZE_BYTES:
        error_msg = f"File size exceeds maximum allowed size of {MAX_FILE_SIZE_MB}MB. Your file is {file_size / (1024 * 1024):.2f}MB."
        logger.error("❌ POST /receipt/upload - File size validation error: %s", error_msg)
        raise HTTPException(
            status_code=400,
            detail=error_msg,
        )
    
    # Reset file position after reading
    await file.seek(0)

    temp_dir = os.path.abspath(settings.temp_dir)
    os.makedirs(temp_dir, exist_ok=True)

    temp_filename = _generate_temp_filename(file.filename or "receipt")
    saved_path = os.path.join(temp_dir, temp_filename)

    try:
        with open(saved_path, "wb") as out_file:
            shutil.copyfileobj(file.file, out_file)

        logger.info("✅ POST /receipt/upload - Image successfully saved: %s", temp_filename)

        categories_data = None
        if admin_uuid:
            try:
                categories_data = get_expense_categories_with_subcategories(admin_uuid)
            except SupabaseRPCError as rpc_exc:
                logger.warning(
                    "⚠️ Failed to fetch categories for admin %s: %s",
                    admin_uuid,
                    rpc_exc,
                )
            except Exception as rpc_exc:
                logger.warning(
                    "⚠️ Unexpected error fetching categories for admin %s: %s",
                    admin_uuid,
                    rpc_exc,
                )

        result = process_receipt(
            saved_path,
            admin_uuid=admin_uuid,
            categories_data=categories_data,
        )

        # --- NEW: Policy Engine Checks ---
        policy_flags = []
        try:
            structured = result.get("structured", {})
            policy_flags = await check_policy({
                "category_id": structured.get("category_id"),
                "subcategory_id": structured.get("subcategory_id"),
                "user_id": None, # Instant feedback doesn't have user_id context yet normally
                "amount_claimed": structured.get("Total Amount") or structured.get("total_amount"),
                "vendor_name": structured.get("Vendor Name") or structured.get("vendor_name"),
                "description": "",
                "items": [{"item_name": item.get("item")} for item in structured.get("items", [])]
            })
            result["policy_flags"] = policy_flags
        except Exception as policy_exc:
            logger.error(f"Policy engine execution during upload failed: {policy_exc}")

        response_data = {
            "success": True,
            "data": result,
        }
        logger.info("✅ POST /receipt/upload - Receipt processing completed successfully")
        logger.info("📤 POST /receipt/upload - Final response: success=True, data keys=%s", 
                   list(result.keys()) if isinstance(result, dict) else "N/A")

        return JSONResponse(content=response_data)

    except ReceiptProcessingError as exc:
        error_msg = str(exc)
        logger.error("❌ POST /receipt/upload - Receipt processing failed: %s", error_msg, exc_info=True)
        logger.error("📤 POST /receipt/upload - Error response: status_code=500, detail='%s'", error_msg)
        raise HTTPException(status_code=500, detail=error_msg) from exc
    except Exception as exc:
        error_msg = f"Failed to process receipt: {str(exc)}"
        logger.error("❌ POST /receipt/upload - Unexpected error: %s", error_msg, exc_info=True)
        logger.error("📤 POST /receipt/upload - Error response: status_code=500, detail='%s'", error_msg)
        raise HTTPException(
            status_code=500,
            detail=error_msg,
        ) from exc
    finally:
        try:
            if os.path.exists(saved_path):
                os.remove(saved_path)
        except Exception as cleanup_error:
            logger.warning("⚠️ POST /receipt/upload - Failed to delete temporary file %s: %s", 
                          saved_path, cleanup_error)
        finally:
            file.file.close()


@router.post("/reimbursements")
async def create_reimbursement_endpoint(
    receipt_code: str = Form(...),
    user_id: str = Form(...),
    admin_id: Optional[str] = Form(None),
    manager_id: Optional[str] = Form(None),
    department_id: Optional[str] = Form(None),
    company_id: Optional[str] = Form(None),
    vendor_name: str = Form(...),
    expense_date: Optional[str] = Form(None),
    category_id: Optional[str] = Form(None),
    receipt_type_id: Optional[str] = Form(None),
    payment_method: Optional[str] = Form(None),
    vendor_type: Optional[str] = Form(None),
    amount_claimed: str = Form(...),
    subcategory_id: Optional[str] = Form(None),
    invoice_number: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    items: str = Form(...),  # JSON string
    ocr_raw_text: Optional[str] = Form(None),
    ocr_structured: Optional[str] = Form(None),  # JSON string
    receipt_file: UploadFile = File(...),
) -> Dict[str, Any]:
    """
    Persist reimbursement details, upload receipt to Supabase Storage,
    and create related records (items, attachments, OCR snapshot).
    """
    logger.info("📥 POST /reimbursements - Request received: receipt_code='%s', user_id='%s', vendor_name='%s', amount_claimed='%s'", 
                receipt_code, user_id, vendor_name, amount_claimed)
    
    try:
        items_list = json.loads(items) if items else []
        parsed_items = [ReimbursementItemModel(**item) for item in items_list]
        logger.info("✅ POST /reimbursements - Parsed %d items from JSON", len(parsed_items))
    except (json.JSONDecodeError, ValidationError) as exc:
        error_msg = f"Invalid items JSON: {exc}"
        logger.error("❌ POST /reimbursements - Validation error: %s", error_msg)
        logger.error("📤 POST /reimbursements - Error response: status_code=400, detail='%s'", error_msg)
        raise HTTPException(status_code=400, detail=error_msg) from exc

    ocr_structured_dict: Optional[Dict[str, Any]] = None
    if ocr_structured:
        try:
            ocr_structured_dict = json.loads(ocr_structured)
        except json.JSONDecodeError as exc:
            logger.warning("Failed to parse OCR structured data: %s", exc)
            ocr_structured_dict = None

    if not receipt_file.filename:
        raise HTTPException(status_code=400, detail="Receipt file is required.")

    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user_id format") from None

    admin_uuid: Optional[UUID] = None
    if admin_id:
        try:
            admin_uuid = UUID(admin_id)
        except ValueError:
            admin_uuid = None

    manager_uuid: Optional[UUID] = None
    if manager_id:
        try:
            manager_uuid = UUID(manager_id)
        except ValueError:
            manager_uuid = None

    company_uuid: Optional[UUID] = None
    if company_id:
        try:
            company_uuid = UUID(company_id)
        except ValueError:
            company_uuid = None

    try:
        department_id_int = int(department_id) if department_id and department_id.strip() else None
    except (ValueError, AttributeError):
        department_id_int = None

    # Parse integer IDs with validation
    try:
        category_id_int = int(category_id) if category_id and category_id.strip() else None
    except (ValueError, AttributeError):
        category_id_int = None
    
    try:
        subcategory_id_int = int(subcategory_id) if subcategory_id and subcategory_id.strip() else None
    except (ValueError, AttributeError):
        subcategory_id_int = None
    
    try:
        receipt_type_id_int = int(receipt_type_id) if receipt_type_id and receipt_type_id.strip() else None
    except (ValueError, AttributeError):
        receipt_type_id_int = None

    # Attempt to fall back to OCR structured category IDs / names if not provided
    def _extract_int(obj: Optional[Dict[str, Any]], key: str) -> Optional[int]:
        if not obj or key not in obj:
            return None
        try:
            return int(obj.get(key))
        except (TypeError, ValueError):
            return None

    def _extract_str(obj: Optional[Dict[str, Any]], keys: List[str]) -> Optional[str]:
        if not obj:
            return None
        for key in keys:
            val = obj.get(key)
            if isinstance(val, str) and val.strip():
                return val.strip()
        return None

    if category_id_int is None and ocr_structured_dict:
        category_id_int = _extract_int(ocr_structured_dict, "category_id") or _extract_int(
            ocr_structured_dict, "categoryId"
        )
    if subcategory_id_int is None and ocr_structured_dict:
        subcategory_id_int = _extract_int(ocr_structured_dict, "subcategory_id") or _extract_int(
            ocr_structured_dict, "subcategoryId"
        )

    # If still missing, try resolving by names via RPC using admin_id
    if (category_id_int is None or subcategory_id_int is None) and admin_uuid and ocr_structured_dict:
        ocr_cat_name = _extract_str(
            ocr_structured_dict,
            ["Categories", "Category", "category", "category_name", "categoryName"],
        )
        ocr_sub_name = _extract_str(
            ocr_structured_dict,
            ["Subcategories", "Subcategory", "subcategory", "subcategory_name", "subcategoryName"],
        )
        try:
            categories_data = get_expense_categories_with_subcategories(str(admin_uuid))
            def _norm(s: str) -> str:
                return s.strip().lower()

            matched_cat = None
            if ocr_cat_name:
                for cat in categories_data or []:
                    if _norm(cat.get("category_name", "")) == _norm(ocr_cat_name):
                        matched_cat = cat
                        category_id_int = cat.get("category_id")
                        break
            # If no category match but subcategory name exists, search all subs
            if matched_cat is None and ocr_sub_name:
                for cat in categories_data or []:
                    for sub in cat.get("subcategories") or []:
                        if _norm(sub.get("subcategory_name", "")) == _norm(ocr_sub_name):
                            matched_cat = cat
                            category_id_int = cat.get("category_id")
                            subcategory_id_int = sub.get("subcategory_id")
                            break
                    if matched_cat:
                        break

            # If category matched but subcategory still missing, try matching within that category
            if matched_cat and ocr_sub_name and subcategory_id_int is None:
                for sub in matched_cat.get("subcategories") or []:
                    if _norm(sub.get("subcategory_name", "")) == _norm(ocr_sub_name):
                        subcategory_id_int = sub.get("subcategory_id")
                        break
        except SupabaseRPCError as rpc_exc:
            logger.warning("Could not resolve categories via RPC: %s", rpc_exc)
        except Exception as rpc_exc:
            logger.warning("Unexpected error resolving categories via RPC: %s", rpc_exc)

    parsed_payload = ReimbursementPayloadModel(
        receipt_code=receipt_code,
        user_id=user_uuid,
        admin_id=admin_uuid,
        manager_id=manager_uuid,
        department_id=department_id_int,
        company_id=company_uuid,
        vendor_name=vendor_name,
        vendor_type=vendor_type.strip() if vendor_type else None,
        address=address.strip() if address else None,
        expense_date=expense_date,
        category_id=category_id_int,
        subcategory_id=subcategory_id_int,
        receipt_type_id=receipt_type_id_int,
        payment_method=payment_method.strip() if payment_method else None,
        total_amount=amount_claimed,
        description=description.strip() if description else None,
        invoice_number=invoice_number.strip() if invoice_number else None,
        items=parsed_items,
        ocr_raw_text=ocr_raw_text,
        ocr_structured=ocr_structured_dict,
    )

    temp_dir = os.path.abspath(settings.temp_dir)
    os.makedirs(temp_dir, exist_ok=True)
    temp_filename = _generate_temp_filename(receipt_file.filename)
    saved_path = os.path.join(temp_dir, temp_filename)

    try:
        with open(saved_path, "wb") as out_file:
            shutil.copyfileobj(receipt_file.file, out_file)

        storage_result = upload_receipt_to_bucket(
            saved_path,
            prefix=f"users/{parsed_payload.user_id}",
        )

        submission = ReimbursementSubmission(
            receipt_code=_normalize_receipt_code(parsed_payload),
            user_id=parsed_payload.user_id,
            admin_id=parsed_payload.admin_id,
            manager_id=parsed_payload.manager_id,
            department_id=parsed_payload.department_id,
            company_id=parsed_payload.company_id,
            vendor_name=parsed_payload.vendor_name.strip(),
            vendor_type=parsed_payload.vendor_type.strip() if parsed_payload.vendor_type else None,
            address=parsed_payload.address.strip() if parsed_payload.address else None,
            invoice_number=parsed_payload.invoice_number,
            payment_method=parsed_payload.payment_method,
            category_id=parsed_payload.category_id,
            subcategory_id=parsed_payload.subcategory_id,
            receipt_type_id=parsed_payload.receipt_type_id,
            amount_claimed=parsed_payload.total_amount,
            expense_date=_normalize_date(parsed_payload.expense_date),
            description=parsed_payload.description,
            items=[
                ReimbursementItemPayload(
                    item=item.item.strip(),
                    price=item.price,
                    quantity=item.quantity,
                )
                for item in parsed_payload.items
            ],
            ocr_raw_text=parsed_payload.ocr_raw_text,
            ocr_structured=parsed_payload.ocr_structured,
        )

        reimbursement = create_reimbursement(
            submission,
            attachment={
                "file_name": storage_result.file_name,
                "path": storage_result.path,
                "content_type": storage_result.content_type,
            },
        )
        
        reimbursement_id = reimbursement["reimbursement_id"]

        # --- NEW: Policy Engine Checks ---
        policy_flags = []
        try:
            policy_flags = await check_policy({
                "category_id": parsed_payload.category_id,
                "subcategory_id": parsed_payload.subcategory_id,
                "user_id": str(parsed_payload.user_id),
                "amount_claimed": parsed_payload.total_amount,
                "vendor_name": parsed_payload.vendor_name,
                "description": parsed_payload.description,
                "items": [{"item_name": item.item} for item in parsed_payload.items]
            })
            
            if policy_flags:
                logger.info(f"🚩 Policy flags detected for claim {reimbursement_id}: {policy_flags}")
                # Update reimbursement with policy flags if column exists
                try:
                    supabase = get_supabase_client()
                    supabase.table("reimbursements").update({
                        "policy_flags": policy_flags
                    }).eq("reimbursement_id", reimbursement_id).execute()
                except Exception as p_err:
                    logger.warning(f"Failed to save policy flags to DB: {p_err}")
        except Exception as policy_exc:
            logger.error(f"Policy engine execution failed: {policy_exc}")

        # --- NEW: Fraud Detection (User Story 3.2, 2.2.2) ---
        try:
            fraud_result = await fraud_detection_service.check_for_fraud(
                user_id=str(parsed_payload.user_id),
                receipt_data={
                    "total_amount": parsed_payload.total_amount,
                    "vendor_name": parsed_payload.vendor_name,
                    "purchase_date": parsed_payload.expense_date
                },
                claim_amount=float(parsed_payload.total_amount)
            )
            
            if fraud_result.is_suspicious:
                logger.warning(f"🚩 Claim {reimbursement_id} flagged as suspicious: {fraud_result.flags}")
                await fraud_detection_service.flag_suspicious_claim(
                    reimbursement_id=reimbursement_id,
                    flags=fraud_result.flags,
                    risk_score=fraud_result.risk_score,
                    details=fraud_result.details
                )
                
                # Create in-app notification for admin/manager about flagged claim
                supabase = get_supabase_client()
                if submission.manager_id:
                    supabase.table("in_app_notifications").insert({
                        "user_id": str(submission.manager_id),
                        "title": "🚩 Suspicious Claim Detected",
                        "message": f"A claim from {parsed_payload.vendor_name} for ${parsed_payload.total_amount} has been flagged for review.",
                        "type": "warning",
                        "category": "claim",
                        "related_id": reimbursement_id
                    }).execute()
        except Exception as fraud_exc:
            logger.error(f"Fraud detection integration failed: {fraud_exc}")

        # --- NEW: Email Notification (User Story 5.1) ---
        try:
            # Fetch user email for notification
            supabase = get_supabase_client()
            user_resp = supabase.table("users").select("full_name, email").eq("user_id", str(parsed_payload.user_id)).single().execute()
            if user_resp.data:
                user_data = user_resp.data
                await email_service.notify_claim_submitted(
                    to_email=user_data["email"],
                    user_name=user_data["full_name"],
                    receipt_code=reimbursement["receipt_code"],
                    amount=parsed_payload.total_amount,
                    category=str(parsed_payload.category_id)
                )
                
                # Also create in-app notification for user
                supabase.table("in_app_notifications").insert({
                    "user_id": str(parsed_payload.user_id),
                    "title": "🧾 Claim Submitted",
                    "message": f"Your claim for ${parsed_payload.total_amount} at {parsed_payload.vendor_name} has been submitted.",
                    "type": "success",
                    "category": "claim",
                    "related_id": reimbursement_id
                }).execute()
        except Exception as email_exc:
            logger.error(f"Notification integration failed: {email_exc}")

        # Auto-upload compressed copy to storage bucket (test mode)
        attachment_upload = None
        try:
            with open(saved_path, "rb") as fh:
                file_bytes = fh.read()
            attachment_upload = process_remote_receipt(
                file_bytes=file_bytes,
                original_filename=receipt_file.filename or temp_filename,
                content_type=receipt_file.content_type or "application/octet-stream",
                reimbursement_id=None,
                admin_prefix=f"uploads/{parsed_payload.user_id}",
            )
        except Exception as upload_exc:
            logger.warning("Auto bucket upload on receipt upload failed: %s", upload_exc)

        response_data = {
            "success": True,
            "data": {
                "reimbursement_id": reimbursement["reimbursement_id"],
                "receipt_code": reimbursement["receipt_code"],
                "attachment_url": storage_result.public_url,
                "auto_upload": attachment_upload,
                "policy_flags": policy_flags
            },
        }
        logger.info("✅ POST /reimbursements - Reimbursement created successfully: reimbursement_id=%s, receipt_code='%s'", 
                   reimbursement["reimbursement_id"], reimbursement["receipt_code"])
        logger.info("📤 POST /reimbursements - Final response: %s", response_data)
        return response_data

    except (ReimbursementServiceError, StorageUploadError) as exc:
        error_msg = str(exc)
        logger.error("❌ POST /reimbursements - Reimbursement creation failed: %s", error_msg, exc_info=True)
        logger.error("📤 POST /reimbursements - Error response: status_code=400, detail='%s'", error_msg)
        raise HTTPException(status_code=400, detail=error_msg) from exc
    except Exception as exc:
        error_msg = "Failed to create reimbursement"
        logger.error("❌ POST /reimbursements - Unexpected error: %s", str(exc), exc_info=True)
        logger.error("📤 POST /reimbursements - Error response: status_code=500, detail='%s'", error_msg)
        raise HTTPException(status_code=500, detail=error_msg) from exc
    finally:
        try:
            if os.path.exists(saved_path):
                os.remove(saved_path)
        except Exception as cleanup_error:
            logger.warning("Failed to delete temporary file %s: %s", saved_path, cleanup_error)
        finally:
            receipt_file.file.close()
