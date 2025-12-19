from __future__ import annotations

import logging
import uuid
from typing import Optional

from app.services.supabase_service import get_supabase_client

logger = logging.getLogger(__name__)


def upload_receipt_bytes_to_bucket(
    file_bytes: bytes,
    *,
    original_filename: str,
    content_type: str,
    bucket_name: str = "receipts-bucket",
    prefix: Optional[str] = None,
) -> dict:
    """
    Upload compressed receipt bytes to Supabase Storage and return public URL + path.
    """
    supabase = get_supabase_client()
    unique_name = f"{uuid.uuid4().hex}_{original_filename}"
    folder = prefix.strip("/") if prefix else "receipts"
    storage_path = f"{folder}/{unique_name}"

    # Upload
    upload_response = supabase.storage.from_(bucket_name).upload(
        storage_path,
        file_bytes,
        {
            "content-type": content_type or "application/octet-stream",
            # storage3/httpx expects string header values
            "upsert": "true",
        },
    )
    if upload_response and hasattr(upload_response, "error") and upload_response.error:
        raise RuntimeError(f"Upload failed: {upload_response.error}")

    public_url = supabase.storage.from_(bucket_name).get_public_url(storage_path)

    logger.info("Image uploaded to bucket successfully")
    logger.info("Public URL: %s", public_url)

    return {
        "path": storage_path,
        "public_url": public_url,
        "file_name": original_filename,
        "content_type": content_type or "application/octet-stream",
    }


