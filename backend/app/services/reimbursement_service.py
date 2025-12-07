"""
Business logic for creating reimbursements and related records.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Optional
from uuid import UUID

from postgrest import APIError

from app.services.supabase_service import get_supabase_client

logger = logging.getLogger(__name__)


@dataclass
class ReimbursementItemPayload:
    item: str
    price: str
    quantity: Optional[str] = None


@dataclass
class ReimbursementSubmission:
    receipt_code: str
    user_id: UUID
    vendor_name: str
    vendor_type: Optional[str]
    address: Optional[str]
    category_id: Optional[int]
    subcategory_id: Optional[int]
    receipt_type_id: Optional[int]
    amount_claimed: str
    expense_date: Optional[str]
    description: Optional[str]
    items: List[ReimbursementItemPayload]
    ocr_raw_text: Optional[str]
    ocr_structured: Optional[Dict[str, Any]]


class ReimbursementServiceError(ValueError):
    """Base error for reimbursement service."""


def _parse_decimal(value: str, fallback: str = "0") -> Decimal:
    """Parse a string to Decimal with fallback."""
    try:
        cleaned = (value or fallback).strip()
        if not cleaned:
            return Decimal(fallback)
        return Decimal(cleaned)
    except (InvalidOperation, AttributeError, TypeError):
        return Decimal(fallback)


def _get_or_create_vendor(name: str, vendor_type: Optional[str], address: Optional[str], company_id: Optional[int] = None) -> int:
    """
    Get existing vendor by name (case-insensitive) or create new one.
    Updates vendor if new address/type provided.
    """
    supabase = get_supabase_client()
    
    if not name or not name.strip():
        raise ReimbursementServiceError("Vendor name is required")

    vendor_name_clean = name.strip()
    
    # Case-insensitive exact match search for existing vendor
    # Note: ilike without wildcards performs case-insensitive exact match
    response = (
        supabase.table("vendors")
        .select("vendor_id, vendor_name, vendor_type, address")
        .ilike("vendor_name", vendor_name_clean)
        .limit(1)
        .execute()
    )

    if response.data:
        vendor = response.data[0]
        vendor_id = vendor["vendor_id"]
        updates: Dict[str, Any] = {}
        
        # Update vendor if new information provided
        if address and address.strip() and not vendor.get("address"):
            updates["address"] = address.strip()
        if vendor_type and vendor_type.strip() and not vendor.get("vendor_type"):
            updates["vendor_type"] = vendor_type.strip()
        
        if updates:
            try:
                supabase.table("vendors").update(updates).eq("vendor_id", vendor_id).execute()
            except APIError as exc:
                logger.warning("Failed to update vendor %s: %s", vendor_id, exc.message)
        
        return vendor_id

    # Create new vendor
    try:
        vendor_data = {
            "vendor_name": vendor_name_clean,
            "vendor_type": vendor_type.strip() if vendor_type and vendor_type.strip() else None,
            "address": address.strip() if address and address.strip() else None,
        }
        if company_id:
            vendor_data["company_id"] = company_id
        
        insert_response = (
            supabase.table("vendors")
            .insert(vendor_data)
            .select("vendor_id")
            .single()
            .execute()
        )
        return insert_response.data["vendor_id"]
    except APIError as exc:
        logger.error("Failed to create vendor: %s", exc.message)
        raise ReimbursementServiceError(f"Failed to create vendor: {exc.message}") from exc


def _insert_items(reimbursement_id: int, items: List[ReimbursementItemPayload]) -> None:
    """Insert reimbursement line items into database."""
    if not items:
        return
    
    supabase = get_supabase_client()
    records = []
    
    for item in items:
        if not item.item or not item.item.strip():
            continue
        
        quantity = _parse_decimal(item.quantity or "1", "1")
        unit_price = _parse_decimal(item.price or "0", "0")
        total_price = quantity * unit_price
        
        records.append(
            {
                "reimbursement_id": reimbursement_id,
                "item_name": item.item.strip(),
                "quantity": float(quantity),
                "unit_price": str(unit_price),
                "total_price": str(total_price),
            }
        )
    
    if records:
        try:
            supabase.table("reimbursement_items").insert(records).execute()
        except APIError as exc:
            logger.error("Failed to insert reimbursement items: %s", exc.message)
            raise ReimbursementServiceError(f"Failed to insert items: {exc.message}") from exc


def _insert_attachment(
    reimbursement_id: int,
    *,
    file_name: str,
    storage_path: str,
    content_type: str,
) -> None:
    """Insert reimbursement attachment record."""
    supabase = get_supabase_client()
    
    try:
        supabase.table("reimbursement_attachments").insert(
            {
                "reimbursement_id": reimbursement_id,
                "file_name": file_name,
                "file_path": storage_path,
                "file_type": content_type,
            }
        ).execute()
    except APIError as exc:
        logger.error("Failed to insert attachment: %s", exc.message)
        raise ReimbursementServiceError(f"Failed to insert attachment: {exc.message}") from exc


def _insert_ocr_snapshot(
    reimbursement_id: int, 
    raw_text: Optional[str], 
    structured: Optional[Dict[str, Any]]
) -> None:
    """Insert OCR extraction snapshot if data exists."""
    if not raw_text and not structured:
        return
    
    supabase = get_supabase_client()
    
    try:
        supabase.table("ocr_extractions").insert(
            {
                "reimbursement_id": reimbursement_id,
                "raw_text": raw_text,
                "extracted_json": structured,
            }
        ).execute()
    except APIError as exc:
        logger.warning("Failed to insert OCR snapshot: %s", exc.message)
        # Don't fail the whole operation if OCR snapshot fails


def create_reimbursement(
    submission: ReimbursementSubmission, 
    *, 
    attachment: Optional[Dict[str, Any]] = None,
    company_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Create reimbursement record with related data.
    
    Args:
        submission: Reimbursement submission data
        attachment: Optional attachment metadata (file_name, path, content_type)
    
    Returns:
        Dict with reimbursement_id and receipt_code
    
    Raises:
        ReimbursementServiceError: If creation fails
    """
    supabase = get_supabase_client()

    # Get user's company_id if not provided
    if company_id is None:
        try:
            user_response = (
                supabase.table("users")
                .select("company_id")
                .eq("user_id", str(submission.user_id))
                .single()
                .execute()
            )
            if user_response.data and user_response.data.get("company_id"):
                company_id = user_response.data["company_id"]
        except Exception as exc:
            logger.warning("Could not fetch user company_id: %s", exc)
    
    # Get or create vendor
    try:
        vendor_id = _get_or_create_vendor(
            submission.vendor_name, 
            submission.vendor_type, 
            submission.address,
            company_id=company_id
        )
    except ReimbursementServiceError:
        raise
    except Exception as exc:
        logger.error("Unexpected error getting/creating vendor: %s", exc)
        raise ReimbursementServiceError(f"Failed to process vendor: {str(exc)}") from exc

    # Parse amount
    amount_claimed = _parse_decimal(submission.amount_claimed, "0")
    
    # Insert main reimbursement record
    try:
        reimbursement_response = (
            supabase.table("reimbursements")
            .insert(
                {
                    "receipt_code": submission.receipt_code.strip(),
                    "user_id": str(submission.user_id),
                    "vendor_id": vendor_id,
                    "category_id": submission.category_id,
                    "subcategory_id": submission.subcategory_id,
                    "receipt_type_id": submission.receipt_type_id,
                    "amount_claimed": str(amount_claimed),
                    "description": submission.description.strip() if submission.description else None,
                    "expense_date": submission.expense_date,
                }
            )
            .select("reimbursement_id, receipt_code")
            .single()
            .execute()
        )
    except APIError as exc:
        logger.error("Reimbursement insertion failed: %s", exc.message)
        raise ReimbursementServiceError(f"Failed to create reimbursement: {exc.message}") from exc
    except Exception as exc:
        logger.error("Unexpected error creating reimbursement: %s", exc)
        raise ReimbursementServiceError(f"Unexpected error: {str(exc)}") from exc

    reimbursement = reimbursement_response.data
    reimbursement_id = reimbursement["reimbursement_id"]

    # Insert related records
    try:
        if submission.items:
            _insert_items(reimbursement_id, submission.items)

        if attachment:
            _insert_attachment(
                reimbursement_id,
                file_name=attachment.get("file_name", ""),
                storage_path=attachment.get("path", ""),
                content_type=attachment.get("content_type", "application/octet-stream"),
            )

        _insert_ocr_snapshot(reimbursement_id, submission.ocr_raw_text, submission.ocr_structured)
    except ReimbursementServiceError:
        # If related records fail, we should rollback or handle gracefully
        # For now, log and re-raise
        logger.error("Failed to insert related records for reimbursement %s", reimbursement_id)
        raise

    logger.info("Successfully created reimbursement %s with receipt_code %s", 
                reimbursement_id, reimbursement["receipt_code"])
    
    return reimbursement
