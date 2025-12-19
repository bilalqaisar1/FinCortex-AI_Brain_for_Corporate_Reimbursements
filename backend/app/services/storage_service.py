"""
Supabase Storage helper utilities.
Handles uploads to receipts bucket and returns public URLs.
"""
from __future__ import annotations

import logging
import mimetypes
import os
import uuid
from dataclasses import dataclass
from typing import Optional

from postgrest import APIError

from app.config.settings import settings
from app.services.supabase_service import get_supabase_client

logger = logging.getLogger(__name__)


@dataclass
class StorageUploadResult:
    path: str
    public_url: str
    file_name: str
    content_type: str


class StorageUploadError(ValueError):
    """Raised when uploading to Supabase Storage fails."""


def _ensure_bucket_exists(bucket_name: str) -> None:
    supabase = get_supabase_client()
    try:
        # Attempt to create bucket; will fail gracefully if it already exists
        supabase.storage.create_bucket(bucket_name, {"public": True})
    except APIError as exc:
        # Ignore "Bucket already exists" errors
        if "already exists" not in exc.message.lower():
            raise
    except Exception:
        # Best-effort: ignore if bucket exists or creation not allowed
        pass


def upload_receipt_to_bucket(file_path: str, *, prefix: Optional[str] = None) -> StorageUploadResult:
    """
    Upload a receipt image/PDF to Supabase Storage and return its public URL.

    Args:
        file_path: Local path to the file to upload.
        prefix: Optional folder prefix within the bucket.

    Returns:
        StorageUploadResult with path and public URL.

    Raises:
        StorageUploadError: If upload fails.
    """
    supabase = get_supabase_client()
    bucket_name = settings.receipts_bucket
    _ensure_bucket_exists(bucket_name)

    mime_type, _ = mimetypes.guess_type(file_path)
    content_type = mime_type or "application/octet-stream"

    file_name = os.path.basename(file_path)
    unique_name = f"{uuid.uuid4().hex}_{file_name}"
    folder = prefix or settings.receipts_folder
    storage_path = f"{folder}/{unique_name}"

    try:
        # Read file content into bytes
        with open(file_path, "rb") as file_obj:
            file_content = file_obj.read()
        
        # Upload to Supabase Storage
        upload_response = supabase.storage.from_(bucket_name).upload(
            storage_path,
            file_content,
            {
                "content-type": content_type,
                # storage3/httpx requires header values to be strings
                "upsert": "true",
            },
        )
        
        # Verify upload was successful
        if upload_response and hasattr(upload_response, 'error') and upload_response.error:
            raise StorageUploadError(f"Upload failed: {upload_response.error}")
        
        # Get public URL
        public_url = supabase.storage.from_(bucket_name).get_public_url(storage_path)
        
        logger.info("Successfully uploaded file to storage: %s", storage_path)
        
        return StorageUploadResult(
            path=storage_path,
            public_url=public_url,
            file_name=file_name,
            content_type=content_type,
        )
    except Exception as exc:
        logger.error("Storage upload error: %s", exc)
        raise StorageUploadError(f"Failed to upload receipt to storage: {exc}") from exc


