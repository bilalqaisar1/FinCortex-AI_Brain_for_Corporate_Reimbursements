from fastapi import APIRouter, HTTPException, Depends
from models.schemas import (
    ToolResponse, 
    ReimbursementRequest, 
    UserReimbursementQuery,
    ReimbursementStatsQuery
)
from services.supabase_service import SupabaseService
from core.database import get_db
from sqlalchemy.orm import Session

router = APIRouter()
supabase_service = SupabaseService()

@router.get("/user-reimbursements", response_model=ToolResponse)
async def get_user_reimbursements(
    user_id: str, 
    status: str = None,
    db: Session = Depends(get_db)
):
    try:
        data = supabase_service.get_user_reimbursements(user_id, status, db)
        return ToolResponse(success=True, data=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/user-reimbursements-query", response_model=ToolResponse)
async def get_user_reimbursements_query(
    query: UserReimbursementQuery,
    db: Session = Depends(get_db)
):
    try:
        data = supabase_service.get_user_reimbursements(
            query.user_id, 
            query.status,
            db
        )
        return ToolResponse(success=True, data=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reimbursement-stats", response_model=ToolResponse)
async def get_reimbursement_stats(
    user_id: str,
    db: Session = Depends(get_db)
):
    try:
        data = supabase_service.get_reimbursement_stats(user_id, db)
        return ToolResponse(success=True, data=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reimbursement-stats-query", response_model=ToolResponse)
async def get_reimbursement_stats_query(
    query: ReimbursementStatsQuery,
    db: Session = Depends(get_db)
):
    try:
        data = supabase_service.get_reimbursement_stats(query.user_id, db)
        return ToolResponse(success=True, data=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/submit-reimbursement", response_model=ToolResponse)
async def submit_reimbursement(
    reimbursement_request: ReimbursementRequest,
    db: Session = Depends(get_db)
):
    try:
        result = supabase_service.submit_reimbursement(reimbursement_request, db)
        if result["success"]:
            return ToolResponse(success=True, data=result["data"])
        else:
            return ToolResponse(success=False, error=result["error"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))