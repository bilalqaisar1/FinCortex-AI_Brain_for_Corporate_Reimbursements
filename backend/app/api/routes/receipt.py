"""
Receipt processing API routes.
Handles image upload, OCR extraction, and GPT structuring.
"""
import os
import shutil
import uuid
import logging
from typing import Any, Dict

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

from app.services.receipt_processing_service import (
    process_receipt,
    ReceiptProcessingError,
)
from app.config.settings import settings

logger = logging.getLogger(__name__)

router = APIRouter()


def _generate_temp_filename(original_filename: str) -> str:
    """Generate a unique temporary filename."""
    _, ext = os.path.splitext(original_filename or "file")
    return f"{uuid.uuid4().hex}{ext}"


@router.post("/receipt/upload")
async def upload_receipt(file: UploadFile = File(...)) -> JSONResponse:
    """
    Upload receipt image and process it through OCR + GPT.
    
    Args:
        file: Uploaded receipt image file
    
    Returns:
        JSON response with raw_text and structured data
    
    Raises:
        HTTPException: If file processing fails
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload an image file (PNG, JPG, JPEG, etc.)"
        )
    
    # Create temp directory if it doesn't exist
    temp_dir = os.path.abspath(settings.temp_dir)
    os.makedirs(temp_dir, exist_ok=True)
    
    # Generate unique filename
    temp_filename = _generate_temp_filename(file.filename or "receipt")
    saved_path = os.path.join(temp_dir, temp_filename)
    
    try:
        # Save uploaded file
        with open(saved_path, "wb") as out_file:
            shutil.copyfileobj(file.file, out_file)
        
        logger.info("Image successfully uploaded: %s", temp_filename)
        
        # Process receipt through OCR + GPT
        result = process_receipt(saved_path)
        
        logger.info("Receipt processing completed successfully")
        
        return JSONResponse(
            content={
                "success": True,
                "data": result,
            }
        )
        
    except ReceiptProcessingError as e:
        logger.error("Receipt processing failed: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error during receipt upload: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process receipt: {str(e)}"
        )
    finally:
        # Clean up temporary file
        try:
            if os.path.exists(saved_path):
                os.remove(saved_path)
        except Exception as e:
            logger.warning("Failed to delete temporary file %s: %s", saved_path, str(e))
        finally:
            file.file.close()

