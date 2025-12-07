"""
DTO models and schemas for receipt upload and reimbursement creation.
"""
from __future__ import annotations

from datetime import date
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class ReimbursementItemSchema(BaseModel):
    """Schema for reimbursement line item."""
    item: str = Field(..., description="Item name", min_length=1)
    price: str = Field(..., description="Unit price as string")
    quantity: Optional[str] = Field(None, description="Quantity string")


class ReceiptUploadResponseSchema(BaseModel):
    """Response schema for receipt upload endpoint."""
    success: bool = Field(..., description="Operation success status")
    data: Dict[str, Any] = Field(..., description="OCR extraction results")


class ReimbursementCreateRequestSchema(BaseModel):
    """Request schema for creating reimbursement."""
    receipt_code: str = Field(..., description="Unique receipt identifier", min_length=1)
    user_id: UUID = Field(..., description="Submitting user ID")
    vendor_name: str = Field(..., description="Vendor name", min_length=1)
    vendor_type: Optional[str] = Field(None, description="Vendor type/category")
    address: Optional[str] = Field(None, description="Vendor address")
    expense_date: Optional[date] = Field(None, description="Expense date")
    category_id: Optional[int] = Field(None, description="Expense category ID")
    subcategory_id: Optional[int] = Field(None, description="Expense subcategory ID")
    receipt_type_id: Optional[int] = Field(None, description="Receipt type ID")
    amount_claimed: str = Field(..., description="Total claimed amount", min_length=1)
    description: Optional[str] = Field(None, description="Expense description")
    invoice_number: Optional[str] = Field(None, description="Original invoice number")
    items: List[ReimbursementItemSchema] = Field(default_factory=list, description="Line items")
    ocr_raw_text: Optional[str] = Field(None, description="Raw OCR text")
    ocr_structured: Optional[Dict[str, Any]] = Field(None, description="Structured OCR JSON")

    @field_validator("expense_date", mode="before")
    @classmethod
    def parse_date(cls, v):
        """Parse date string to date object."""
        if isinstance(v, str):
            try:
                from datetime import datetime
                return datetime.fromisoformat(v).date()
            except ValueError:
                try:
                    from datetime import datetime
                    return datetime.strptime(v, "%Y-%m-%d").date()
                except ValueError:
                    return None
        return v


class ReimbursementCreateResponseSchema(BaseModel):
    """Response schema for reimbursement creation."""
    success: bool = Field(..., description="Operation success status")
    data: Dict[str, Any] = Field(..., description="Created reimbursement details")

