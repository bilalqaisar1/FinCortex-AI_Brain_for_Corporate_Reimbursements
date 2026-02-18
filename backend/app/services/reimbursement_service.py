"""
Business logic for creating reimbursements and related records.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

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
    admin_id: Optional[UUID]
    manager_id: Optional[UUID]
    department_id: Optional[int]
    company_id: Optional[UUID]
    vendor_name: str
    vendor_type: Optional[str]
    address: Optional[str]
    invoice_number: Optional[str]
    payment_method: Optional[str]
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


def _get_or_create_vendor(name: str, vendor_type: Optional[str], address: Optional[str]) -> int:
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
        
        insert_response = supabase.table("vendors").insert(
            vendor_data,
            returning="representation",
        ).execute()
        if not insert_response.data:
            raise ReimbursementServiceError("Failed to create vendor: no data returned")
        return insert_response.data[0]["vendor_id"]
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
                # quantity column is integer; cast decimal safely
                "quantity": int(quantity),
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
    company_id: Optional[UUID] = None
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
    # Enrich context: manager, department, admin, company
    try:
        user_response = (
            supabase.table("users")
            .select("manager_id, department_id, admin_id")
            .eq("user_id", str(submission.user_id))
            .single()
            .execute()
        )
        user_row = user_response.data if user_response and user_response.data else {}
    except Exception as exc:
        logger.warning("Could not fetch user context: %s", exc)
        user_row = {}

    # Infer manager_id/department_id from user record when not provided
    if not submission.manager_id and user_row.get("manager_id"):
        try:
            submission.manager_id = UUID(user_row["manager_id"])
        except Exception:
            submission.manager_id = None
    if submission.department_id is None and user_row.get("department_id") is not None:
        submission.department_id = user_row["department_id"]
    if submission.company_id is None and user_row.get("company_id") is not None:
        try:
             submission.company_id = UUID(user_row["company_id"])
        except Exception:
             pass

    # Infer admin_id from manager if missing
    if not submission.admin_id and submission.manager_id:
        try:
            mgr_response = (
                supabase.table("managers")
                .select("manager_admin_id")
                .eq("manager_id", str(submission.manager_id))
                .single()
                .execute()
            )
            if mgr_response.data and mgr_response.data.get("manager_admin_id"):
                try:
                    submission.admin_id = UUID(mgr_response.data["manager_admin_id"])
                except Exception:
                    submission.admin_id = None
        except Exception as exc:
            logger.warning("Could not fetch manager admin_id: %s", exc)

    # Infer company_id: prefer provided, else by admin, else via company_managers for manager
    if submission.company_id is None:
        # Try admin -> companies.admin_id
        if submission.admin_id:
            try:
                comp_resp = (
                    supabase.table("companies")
                    .select("company_id")
                    .eq("admin_id", str(submission.admin_id))
                    .limit(1)
                    .single()
                    .execute()
                )
                if comp_resp.data and comp_resp.data.get("company_id"):
                    submission.company_id = UUID(comp_resp.data["company_id"])
            except Exception as exc:
                logger.warning("Could not fetch company by admin_id: %s", exc)

        # If still None, try manager mapping
        if submission.company_id is None and submission.manager_id:
            try:
                cm_resp = (
                    supabase.table("managers")
                    .select("manager_company_id")
                    .eq("manager_id", str(submission.manager_id))
                    .limit(1)
                    .single()
                    .execute()
                )
                if cm_resp.data and cm_resp.data.get("manager_company_id"):
                    submission.company_id = UUID(cm_resp.data["manager_company_id"])
            except Exception as exc:
                logger.warning("Could not fetch company by manager_id: %s", exc)
    
    try:
        vendor_id = _get_or_create_vendor(
            submission.vendor_name, 
            submission.vendor_type, 
            submission.address
        )
    except ReimbursementServiceError:
        raise
    except Exception as exc:
        logger.error("Unexpected error getting/creating vendor: %s", exc)
        raise ReimbursementServiceError(f"Failed to process vendor: {str(exc)}") from exc

    # Validate receipt_type_id exists in DB; seed if table is empty
    if submission.receipt_type_id is not None:
        try:
            rt_check = (
                supabase.table("receipt_types")
                .select("receipt_type_id")
                .execute()
            )
            existing_ids = {r["receipt_type_id"] for r in (rt_check.data or [])}

            if not existing_ids:
                # Table is empty — seed the standard receipt types
                seed_types = [
                    {"type_name": "Paper"},
                    {"type_name": "Bank Transfer"},
                    {"type_name": "Bill"},
                    {"type_name": "Invoice"},
                    {"type_name": "Digital Receipt"},
                    {"type_name": "Credit Card Statement"},
                ]
                try:
                    seed_resp = supabase.table("receipt_types").insert(seed_types).execute()
                    existing_ids = {r["receipt_type_id"] for r in (seed_resp.data or [])}
                    logger.info("Seeded receipt_types table with %d entries", len(existing_ids))
                except Exception as seed_exc:
                    logger.warning("Could not seed receipt_types: %s", seed_exc)

            if submission.receipt_type_id not in existing_ids:
                logger.warning(
                    "receipt_type_id %s not found in receipt_types table, setting to None",
                    submission.receipt_type_id,
                )
                submission.receipt_type_id = None
        except Exception as rt_exc:
            logger.warning("Could not validate receipt_type_id: %s", rt_exc)
            submission.receipt_type_id = None

    # Parse amount
    amount_claimed = _parse_decimal(submission.amount_claimed, "0")
    
    # Insert main reimbursement record with duplicate receipt_code fallback
    def _insert_reimbursement(receipt_code: str):
        return supabase.table("reimbursements").insert(
            {
                "receipt_code": receipt_code.strip(),
                "user_id": str(submission.user_id),
                "admin_id": str(submission.admin_id) if submission.admin_id else None,
                "manager_id": str(submission.manager_id) if submission.manager_id else None,
                "department_id": submission.department_id,
                "company_id": str(submission.company_id) if submission.company_id else None,
                "vendor_id": vendor_id,
                "invoice_number": submission.invoice_number.strip() if submission.invoice_number else None,
                "payment_method": submission.payment_method.strip() if submission.payment_method else "unknown",
                "category_id": submission.category_id,
                "subcategory_id": submission.subcategory_id,
                "receipt_type_id": submission.receipt_type_id,
                "amount_claimed": str(amount_claimed),
                "description": submission.description.strip() if submission.description else None,
                "expense_date": submission.expense_date,
                "status": "pending",
            },
            returning="representation",
        ).execute()

    try:
        try:
            reimbursement_response = _insert_reimbursement(submission.receipt_code)
        except APIError as exc:
            # Handle duplicate receipt_code by retrying with a generated code
            if "receipt_code" in exc.message.lower() and getattr(exc, "code", None) in ("23505", None):
                fallback_code = f"RC-{uuid4().hex[:8].upper()}"
                logger.warning(
                    "Duplicate receipt_code '%s' detected; retrying with '%s'",
                    submission.receipt_code,
                    fallback_code,
                )
                reimbursement_response = _insert_reimbursement(fallback_code)
            else:
                raise

        if not reimbursement_response.data:
            raise ReimbursementServiceError("Failed to create reimbursement: no data returned")
    except APIError as exc:
        logger.error("Reimbursement insertion failed: %s", exc.message)
        raise ReimbursementServiceError(f"Failed to create reimbursement: {exc.message}") from exc
    except Exception as exc:
        logger.error("Unexpected error creating reimbursement: %s", exc)
        raise ReimbursementServiceError(f"Unexpected error: {str(exc)}") from exc

    reimbursement = reimbursement_response.data[0]
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
