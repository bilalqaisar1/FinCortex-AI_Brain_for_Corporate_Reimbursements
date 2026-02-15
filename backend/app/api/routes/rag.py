import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.services.rag_service import rag_service
from app.services.supabase_service import get_supabase_client

router = APIRouter()
logger = logging.getLogger(__name__)

class RAGRequest(BaseModel):
    message: str
    user_id: str
    conversation_id: Optional[str] = "default"
    token: Optional[str] = None

@router.post("/rag/chat")
async def chat_with_rag(request: RAGRequest) -> Dict[str, Any]:
    """
    RAG Chat Endpoint.
    - Validates user role via Supabase.
    - Calls RAG Service with strict context.
    - Returns AI response.
    """
    try:
        # 1. Validate User & Get Role/Dept
        supabase = get_supabase_client()
        
        # We trust the user_id from the request IF we can verify the token, 
        # but for this MVP we'll query the users table directly using the service role 
        # to ensure we get the correct role/dept for the *claimed* user_id.
        # In production, we'd verify the JWT token matches the user_id.
        
        user_resp = supabase.table("users").select("role, department_id, company_id").eq("user_id", request.user_id).single().execute()
        
        if not user_resp.data:
            raise HTTPException(status_code=404, detail="User not found")
            
        user_data = user_resp.data
        role = user_data.get("role", "employee") # Default to safest role
        department_id = user_data.get("department_id")
        company_id = user_data.get("company_id")
        
        # 2. Call RAG Service
        result = rag_service.query(
            user_id=request.user_id,
            message=request.message,
            role=role,
            department_id=department_id,
            company_id=company_id
        )
        
        return {
            "response": result.get("response"),
            "conversation_id": request.conversation_id,
            "sources": result.get("sources", [])
        }
        
    except HTTPException as he:
        # Pass through HTTP exceptions as structured responses if possible, or re-raise
        # But to avoid "trouble connecting", we return 200 with error message
        logger.error(f"RAG Endpoint HTTP Error: {he.detail}")
        return {
            "response": f"Authorization Error: {he.detail}",
            "conversation_id": request.conversation_id,
            "sources": []
        }
    except Exception as e:
        logger.error(f"RAG Endpoint Error: {e}")
        return {
            "response": "An unexpected system error occurred. Please contact support.",
            "conversation_id": request.conversation_id,
            "sources": []
        }
