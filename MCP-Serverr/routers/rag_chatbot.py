from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
from models.schemas import ChatMessage, ChatResponse, ToolResponse
from services.rag_service import RAGService
from utils.jwt_auth import get_current_user, UserIdentity, decode_supabase_jwt
from core.database import get_db
from sqlalchemy.orm import Session

router = APIRouter()
rag_service = RAGService()

# In-memory storage for conversation history per user session
conversations = {}


@router.post("/chat", response_model=ChatResponse)
async def chat(
    chat_message: ChatMessage,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None),
):
    try:
        # Attempt JWT-based authentication
        identity: Optional[UserIdentity] = None

        # Try Authorization header first, then token field in body
        token = authorization or (
            f"Bearer {chat_message.token}" if chat_message.token else None
        )

        if token:
            try:
                identity = await get_current_user(token)
            except HTTPException:
                # Fall back to basic user_id if JWT fails
                identity = None

        # Use JWT user_id if available, otherwise use the body field
        user_id = identity.user_id if identity else chat_message.user_id

        # Get conversation history scoped to this user
        conversation_id = chat_message.conversation_id or "default"
        key = f"{user_id}_{conversation_id}"
        history = conversations.get(key, [])

        # Get response from RAG service with role context
        result = rag_service.chat(
            user_id=user_id,
            message=chat_message.message,
            conversation_history=history,
            db=db,
            identity=identity,
        )

        if not result.get("success", False):
            # Still return a response even on failure
            return ChatResponse(
                response=result.get("response", "I'm sorry, something went wrong."),
                conversation_id=conversation_id,
                sources=[],
                role=identity.role if identity else None,
            )

        # Update conversation history (scoped per user, never shared)
        history.append({"role": "user", "content": chat_message.message})
        history.append({"role": "assistant", "content": result["response"]})

        # Keep only last 20 turns to manage memory
        if len(history) > 20:
            history = history[-20:]

        conversations[key] = history

        return ChatResponse(
            response=result["response"],
            conversation_id=conversation_id,
            sources=result.get("sources", []),
            role=result.get("role") or (identity.role if identity else None),
        )
    except Exception as e:
        print(f"Chat endpoint error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reset-conversation", response_model=ToolResponse)
async def reset_conversation(
    user_id: str,
    conversation_id: str = "default",
    authorization: Optional[str] = Header(None),
):
    try:
        # If JWT is available, use the authenticated user_id
        if authorization:
            try:
                identity = await get_current_user(authorization)
                user_id = identity.user_id
            except HTTPException:
                pass

        key = f"{user_id}_{conversation_id}"
        if key in conversations:
            del conversations[key]
        return ToolResponse(success=True, message="Conversation reset successfully")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))