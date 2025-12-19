from __future__ import annotations

import logging
import os
from typing import Any, Dict, Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from app.services.remote_receipt_service import process_remote_receipt

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/remote-receipt")
async def upload_remote_receipt(
    file: UploadFile = File(...),
    reimbursement_id: Optional[str] = Form(None),
    admin_prefix: Optional[str] = Form(None),
) -> Dict[str, Any]:
    """
    Compress image, upload to storage bucket, get public URL, and (optionally) store in reimbursement_attachments.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image file.")

    try:
        file_bytes = await file.read()
        original_filename = file.filename or "receipt"

        result = process_remote_receipt(
            file_bytes=file_bytes,
            original_filename=original_filename,
            content_type=file.content_type or "application/octet-stream",
            reimbursement_id=reimbursement_id,
            admin_prefix=admin_prefix,
        )

        return {
            "success": True,
            "data": result,
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Failed to process remote receipt: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process remote receipt: {exc}") from exc

    finally:
        try:
            await file.close()
        except Exception:
            pass


