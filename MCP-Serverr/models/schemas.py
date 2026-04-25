from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class ReimbursementStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID = "paid"

class ReceiptUpload(BaseModel):
    user_id: str
    file_name: str
    file_content: str  # base64 encoded
    claim_config: Optional[Dict[str, Any]] = None

class ExtractedReceiptData(BaseModel):
    merchant_name: Optional[str] = None
    transaction_date: Optional[str] = None
    total_amount: Optional[float] = None
    tax_amount: Optional[float] = None
    items: List[Dict[str, Any]] = []
    currency: Optional[str] = "USD"
    category: Optional[str] = None

class ReimbursementRequest(BaseModel):
    user_id: str
    receipt_data: ExtractedReceiptData
    purpose: Optional[str] = None
    project_code: Optional[str] = None

class ChatMessage(BaseModel):
    user_id: str
    message: str
    conversation_id: Optional[str] = None
    token: Optional[str] = None  # Supabase JWT token for auth

class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    sources: Optional[List[Dict]] = None
    role: Optional[str] = None  # User role used for the response

class ToolResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    error: Optional[str] = None

class UserReimbursementQuery(BaseModel):
    user_id: str
    status: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class ReimbursementStatsQuery(BaseModel):
    user_id: str