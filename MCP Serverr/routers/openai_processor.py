from fastapi import APIRouter, HTTPException
from models.schemas import ToolResponse
from services.openai_service import OpenAIService
from pydantic import BaseModel

router = APIRouter()
openai_service = OpenAIService()

class ExtractTextRequest(BaseModel):
    extracted_text: str

@router.post("/extract-receipt-fields", response_model=ToolResponse)
async def extract_receipt_fields(request: ExtractTextRequest):
    try:
        result = openai_service.extract_receipt_fields(request.extracted_text)
        if result["success"]:
            return ToolResponse(success=True, data=result["extracted_data"])
        else:
            return ToolResponse(success=False, error=result["error"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process-natural-language", response_model=ToolResponse)
async def process_natural_language(query: str, context: dict = None):
    try:
        result = openai_service.process_natural_language_query(query, context)
        if result["success"]:
            return ToolResponse(success=True, data=result["analysis"])
        else:
            return ToolResponse(success=False, error=result["error"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))