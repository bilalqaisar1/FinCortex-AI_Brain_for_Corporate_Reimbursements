from __future__ import annotations

import logging
from typing import Optional, Dict, Any

from app.services.image_compression_service import compress_image
from app.services.remote_storage_service import upload_receipt_bytes_to_bucket
from app.services.supabase_service import get_supabase_client

logger = logging.getLogger(__name__)


def process_remote_receipt(
    *,
    file_bytes: bytes,
    original_filename: str,
    content_type: str,
    reimbursement_id: Optional[str] = None,
    admin_prefix: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Compress image, upload to storage, and insert into reimbursement_attachments.
    """
    # Compress
    compressed_bytes = compress_image(file_bytes)

    # Upload
    upload_result = upload_receipt_bytes_to_bucket(
        compressed_bytes,
        original_filename=original_filename,
        content_type=content_type,
        prefix=admin_prefix or "receipts",
    )

    # Store in reimbursement_attachments if reimbursement_id provided
    attachment_id = None
    if reimbursement_id:
        supabase = get_supabase_client()
        insert_payload = {
            "reimbursement_id": reimbursement_id,
            "file_name": upload_result["file_name"],
            "file_path": upload_result["path"],
            "file_type": upload_result["content_type"],
        }
        try:
            res = supabase.table("reimbursement_attachments").insert(insert_payload).execute()
            if res.data and len(res.data) > 0:
                attachment_id = res.data[0].get("attachment_id")
            logger.info("Stored public url into reimbursement_attachments successfully")
        except Exception as exc:
            logger.error("Failed to store attachment record: %s", exc)
            raise

    return {
        "public_url": upload_result["public_url"],
        "path": upload_result["path"],
        "file_name": upload_result["file_name"],
        "content_type": upload_result["content_type"],
        "attachment_id": attachment_id,
    }


