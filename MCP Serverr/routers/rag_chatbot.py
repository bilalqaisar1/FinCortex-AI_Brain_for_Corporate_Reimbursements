from fastapi import APIRouter, HTTPException, Depends
from models.schemas import ChatMessage, ChatResponse, ToolResponse
from services.rag_service import RAGService
from core.database import get_db
from sqlalchemy.orm import Session

router = APIRouter()
rag_service = RAGService()

# In-memory storage for conversation history (for demo purposes)
conversations = {}

@router.post("/chat", response_model=ChatResponse)
async def chat(chat_message: ChatMessage, db: Session = Depends(get_db)):
    try:
        # Get conversation history for the user
        conversation_id = chat_message.conversation_id or "default"
        key = f"{chat_message.user_id}_{conversation_id}"
        history = conversations.get(key, [])
        
        # Get response from RAG service
        result = rag_service.chat(
            user_id=chat_message.user_id,
            message=chat_message.message,
            conversation_history=history,
            db=db
        )
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))
        
        # Update conversation history
        history.append({"role": "user", "content": chat_message.message})
        history.append({"role": "assistant", "content": result["response"]})
        conversations[key] = history
        
        return ChatResponse(
            response=result["response"],
            conversation_id=conversation_id,
            sources=result.get("sources", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reset-conversation", response_model=ToolResponse)
async def reset_conversation(user_id: str, conversation_id: str = "default"):
    try:
        key = f"{user_id}_{conversation_id}"
        if key in conversations:
            del conversations[key]
        return ToolResponse(success=True, message="Conversation reset successfully")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))