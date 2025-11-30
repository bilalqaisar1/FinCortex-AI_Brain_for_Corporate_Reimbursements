from fastapi import APIRouter, HTTPException, Depends
from models.schemas import ReceiptUpload, ToolResponse
from services.vision_service import VisionService
from services.openai_service import OpenAIService
import base64
import json

router = APIRouter()
vision_service = VisionService()
openai_service = OpenAIService()

@router.post("/process-receipt", response_model=ToolResponse)
async def process_receipt(receipt: ReceiptUpload):
    try:
        # Extract text from receipt image
        vision_result = vision_service.extract_text_from_receipt(receipt.file_content)
        if not vision_result["success"]:
            return ToolResponse(success=False, error=vision_result["error"])
        
        extracted_text = vision_result["full_text"]
        
        return ToolResponse(
            success=True,
            data={
                "extracted_text": extracted_text,
                "user_id": receipt.user_id,
                "paragraphs": vision_result.get("paragraphs", []),
                "vision_service": "google" if vision_service.vision_available else "mock"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process-receipt-end-to-end", response_model=ToolResponse)
async def process_receipt_end_to_end(receipt: ReceiptUpload):
    try:
        # Extract text from receipt image
        vision_result = vision_service.extract_text_from_receipt(receipt.file_content)
        if not vision_result["success"]:
            return ToolResponse(success=False, error=vision_result["error"])
        
        extracted_text = vision_result["full_text"]
        
        # Use OpenAI to extract structured data
        openai_result = openai_service.extract_receipt_fields(extracted_text)
        if not openai_result["success"]:
            return ToolResponse(success=False, error=openai_result["error"])
        
        extracted_data = openai_result["extracted_data"]
        
        return ToolResponse(
            success=True,
            data={
                "extracted_text": extracted_text,
                "structured_data": extracted_data,
                "user_id": receipt.user_id,
                "vision_service": "google" if vision_service.vision_available else "mock",
                "openai_processing": "success"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-receipt-structure", response_model=ToolResponse)
async def analyze_receipt_structure(receipt: ReceiptUpload):
    try:
        # Use enhanced document structure detection
        structure_result = vision_service.detect_document_structure(receipt.file_content)
        if not structure_result["success"]:
            return ToolResponse(success=False, error=structure_result["error"])
        
        return ToolResponse(
            success=True,
            data={
                "structure_analysis": structure_result,
                "user_id": receipt.user_id,
                "vision_service": "google" if vision_service.vision_available else "mock"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/vision-status")
async def get_vision_status():
    """Check Google Vision API status"""
    return {
        "vision_available": vision_service.vision_available,
        "service_type": "google" if vision_service.vision_available else "mock",
        "message": "Google Vision API is configured and ready" if vision_service.vision_available else "Using mock vision service - configure GOOGLE_APPLICATION_CREDENTIALS for full functionality"
    }