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
from app.services.storage_service import StorageUploadError, upload_receipt_to_bucket
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
    vendor_name: str = Field(..., description="Vendor name")
    vendor_type: Optional[str] = Field(None, description="Vendor type/category")
    address: Optional[str] = Field(None, description="Vendor address")
    expense_date: Optional[str] = Field(None, description="Expense date (YYYY-MM-DD)")
    category_id: Optional[int] = Field(None, description="Expense category ID")
    subcategory_id: Optional[int] = Field(None, description="Expense subcategory ID")
    receipt_type_id: Optional[int] = Field(None, description="Receipt type ID")
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
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload an image file (PNG, JPG, JPEG, etc.)",
        )

    temp_dir = os.path.abspath(settings.temp_dir)
    os.makedirs(temp_dir, exist_ok=True)

    temp_filename = _generate_temp_filename(file.filename or "receipt")
    saved_path = os.path.join(temp_dir, temp_filename)

    try:
        with open(saved_path, "wb") as out_file:
            shutil.copyfileobj(file.file, out_file)

        logger.info("Image successfully uploaded: %s", temp_filename)

        result = process_receipt(saved_path)

        logger.info("Receipt processing completed successfully")

        return JSONResponse(
            content={
                "success": True,
                "data": result,
            }
        )

    except ReceiptProcessingError as exc:
        logger.error("Receipt processing failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Unexpected error during receipt upload: %s", exc)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process receipt: {str(exc)}",
        ) from exc
    finally:
        try:
            if os.path.exists(saved_path):
                os.remove(saved_path)
        except Exception as cleanup_error:
            logger.warning("Failed to delete temporary file %s: %s", saved_path, cleanup_error)
        finally:
            file.file.close()


@router.post("/reimbursements")
async def create_reimbursement_endpoint(
    receipt_code: str = Form(...),
    user_id: str = Form(...),
    vendor_name: str = Form(...),
    expense_date: str = Form(...),
    category_id: str = Form(...),
    receipt_type_id: str = Form(...),
    vendor_type: str = Form(...),
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
    try:
        items_list = json.loads(items) if items else []
        parsed_items = [ReimbursementItemModel(**item) for item in items_list]
    except (json.JSONDecodeError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail=f"Invalid items JSON: {exc}") from exc

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

    parsed_payload = ReimbursementPayloadModel(
        receipt_code=receipt_code,
        user_id=user_uuid,
        vendor_name=vendor_name,
        vendor_type=vendor_type.strip() if vendor_type else None,
        address=address.strip() if address else None,
        expense_date=expense_date,
        category_id=category_id_int,
        subcategory_id=subcategory_id_int,
        receipt_type_id=receipt_type_id_int,
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
            vendor_name=parsed_payload.vendor_name.strip(),
            vendor_type=parsed_payload.vendor_type.strip() if parsed_payload.vendor_type else None,
            address=parsed_payload.address.strip() if parsed_payload.address else None,
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

        return {
            "success": True,
            "data": {
                "reimbursement_id": reimbursement["reimbursement_id"],
                "receipt_code": reimbursement["receipt_code"],
                "attachment_url": storage_result.public_url,
            },
        }

    except (ReimbursementServiceError, StorageUploadError) as exc:
        logger.error("Reimbursement creation failed: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Unexpected error creating reimbursement: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to create reimbursement") from exc
    finally:
        try:
            if os.path.exists(saved_path):
                os.remove(saved_path)
        except Exception as cleanup_error:
            logger.warning("Failed to delete temporary file %s: %s", saved_path, cleanup_error)
        finally:
            receipt_file.file.close()
