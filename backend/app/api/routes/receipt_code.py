"""
Receipt code generation API.
Generates unique receipt codes based on maximum expense categories.
"""
import logging
from fastapi import APIRouter, HTTPException

from app.services.supabase_service import get_supabase_client
from app.services.supabase_rpc_service import SupabaseRPCError

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/receipt-code/generate")
async def generate_receipt_code() -> dict:
    """
    Generate a unique receipt code based on maximum expense categories.
    
    Format: RC-{YYYYMMDD}-{category_count:03d}-{sequence:04d}
    Example: RC-20250118-010-0001
    
    Returns:
        Dictionary with generated receipt_code
    """
    try:
        supabase = get_supabase_client()
        
        # Get maximum category_id from expense_categories
        response = supabase.table("expense_categories").select("category_id").order("category_id", desc=True).limit(1).execute()
        
        max_category_id = 0
        if response.data and len(response.data) > 0:
            max_category_id = response.data[0].get("category_id", 0)
        
        # Get count of reimbursements for today to generate sequence
        from datetime import datetime
        today = datetime.now().strftime("%Y%m%d")
        
        # Count reimbursements with today's date prefix
        today_prefix = f"RC-{today}"
        try:
            count_response = supabase.table("reimbursements").select("receipt_code", count="exact").like("receipt_code", f"{today_prefix}%").execute()
            sequence = (count_response.count or 0) + 1
        except Exception:
            # If table doesn't exist or query fails, start from 1
            sequence = 1
        
        # Generate receipt code: RC-YYYYMMDD-{max_category_id:03d}-{sequence:04d}
        receipt_code = f"RC-{today}-{max_category_id:03d}-{sequence:04d}"
        
        logger.info("✅ Receipt code generated: %s", receipt_code)
        
        return {
            "success": True,
            "data": {
                "receipt_code": receipt_code,
            },
        }
        
    except Exception as e:
        logger.error("❌ Receipt code generation failed: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate receipt code: {str(e)}"
        )

