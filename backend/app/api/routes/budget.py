"""
Budget management API routes for admin.
"""

import logging
from typing import Any, Dict, Optional
from uuid import uuid4
from datetime import datetime

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field

from app.services.supabase_service import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter()


class CreateBudgetModel(BaseModel):
    company_id: Optional[str] = Field(None, description="Company ID (optional)")
    company_name: str = Field(..., description="Company name")
    total_amount: float = Field(..., description="Total budget amount")
    monthly_limit: Optional[float] = Field(None, description="Monthly spending limit")
    currency: str = Field(default="PKR", description="Currency code")


class UpdateBudgetModel(BaseModel):
    total_amount: Optional[float] = None
    monthly_limit: Optional[float] = None
    company_name: Optional[str] = None


class AddFundsModel(BaseModel):
    amount: float = Field(..., description="Amount to add to budget")
    notes: Optional[str] = Field(None, description="Notes for the transaction")


@router.get("/admin/budgets")
async def get_budgets() -> Dict[str, Any]:
    """Get all company budgets."""
    logger.info("📥 GET /admin/budgets")
    supabase = get_supabase_client()
    
    try:
        # 1. Fetch all approved reimbursements to calculate used amounts (Always available)
        reimbursements_resp = supabase.table("reimbursements") \
            .select("company_id, amount_approved, amount_claimed, created_at") \
            .eq("status", "approved") \
            .execute()
        
        # Aggregate used (approved) amount per company
        used_by_company = {}
        monthly_used_by_company = {}
        
        now = datetime.now()
        current_month = now.month
        current_year = now.year

        if reimbursements_resp.data:
            for r in reimbursements_resp.data:
                cid = r.get("company_id")
                # Prefer amount_approved, fallback to amount_claimed
                amount = r.get("amount_approved") or r.get("amount_claimed") or 0
                created_at_str = r.get("created_at")
                
                if cid:
                    used_by_company[cid] = used_by_company.get(cid, 0) + amount
                    if created_at_str:
                        try:
                            r_date = datetime.fromisoformat(created_at_str.replace("Z", "+00:00").split("+")[0])
                            if r_date.month == current_month and r_date.year == current_year:
                                monthly_used_by_company[cid] = monthly_used_by_company.get(cid, 0) + amount
                        except Exception:
                            pass

        # 2. Try to fetch budgets from company_budgets table
        budgets_data = []
        try:
            resp = supabase.table("company_budgets") \
                .select("*, companies(company_name)") \
                .order("last_updated", desc=True) \
                .execute()
            budgets_data = resp.data or []
        except Exception as e:
            # Fallback if table doesn't exist: fetch from companies table
            if "does not exist" in str(e).lower() or "42P01" in str(e):
                logger.warning("company_budgets table missing, falling back to companies list")
                comp_resp = supabase.table("companies").select("company_id, company_name").execute()
                for c in (comp_resp.data or []):
                    budgets_data.append({
                        "budget_id": "virtual-" + c.get("company_id"),
                        "company_id": c.get("company_id"),
                        "company_name": c.get("company_name"),
                        "total_balance": 0, # Default for missing table
                        "monthly_limit": 0,
                        "last_updated": datetime.now().isoformat()
                    })
            else:
                raise e

        # 3. Construct final response
        budgets = []
        for b in budgets_data:
            cid = b.get("company_id")
            total = b.get("total_balance", 0) or 0
            
            used = used_by_company.get(cid, 0)
            remaining = total - used
            
            utilization = 0
            if total > 0:
                utilization = round((used / total) * 100, 1)
            elif used > 0:
                utilization = 100 # If total is 0 but used > 0, treat as 100% or more
            
            company_name = "Unknown Company"
            if b.get("company_name"):
                company_name = b.get("company_name")
            elif b.get("companies") and isinstance(b["companies"], dict):
                company_name = b["companies"].get("company_name", "Unknown Company")

            budgets.append({
                "budget_id": b.get("budget_id"),
                "company_id": cid,
                "company_name": company_name,
                "total_amount": total,
                "used_amount": used,
                "remaining_amount": remaining,
                "utilization_percentage": utilization,
                "monthly_limit": b.get("monthly_limit", 0) or 0,
                "monthly_used": monthly_used_by_company.get(cid, 0),
                "status": "healthy" if remaining >= 0 else "critical",
                "currency": "PKR",
                "last_updated": b.get("last_updated", "")
            })
        
        return {"success": True, "data": budgets}
        
    except Exception as e:
        logger.error(f"Error fetching budgets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/budgets")
async def create_budget(payload: CreateBudgetModel = Body(...)) -> Dict[str, Any]:
    """Create a new budget allocation."""
    logger.info(f"📥 POST /admin/budgets - Company: {payload.company_name}")
    supabase = get_supabase_client()
    
    try:
        budget_data = {
            "company_id": payload.company_id or str(uuid4()),
            "total_balance": payload.total_amount,
            "last_updated": datetime.now().isoformat()
        }
        
        resp = supabase.table("company_budgets").insert(budget_data).execute()
        
        if not resp.data:
            raise HTTPException(status_code=500, detail="Failed to create budget")
        
        return {
            "success": True,
            "message": "Budget created successfully",
            "data": resp.data[0]
        }
        
    except Exception as e:
        logger.error(f"Error creating budget: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/admin/budgets/{budget_id}")
async def update_budget(budget_id: str, payload: UpdateBudgetModel = Body(...)) -> Dict[str, Any]:
    """Update an existing budget."""
    logger.info(f"📥 PUT /admin/budgets/{budget_id}")
    supabase = get_supabase_client()
    
    try:
        update_data = {"last_updated": datetime.now().isoformat()}
        
        if payload.total_amount is not None:
            update_data["total_balance"] = payload.total_amount
        
        resp = supabase.table("company_budgets").update(update_data).eq("budget_id", budget_id).execute()
        
        if not resp.data:
            raise HTTPException(status_code=404, detail="Budget not found")
        
        return {
            "success": True,
            "message": "Budget updated successfully",
            "data": resp.data[0]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating budget: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/budgets/{budget_id}/add-funds")
async def add_funds_to_budget(budget_id: str, payload: AddFundsModel = Body(...)) -> Dict[str, Any]:
    """Add funds to an existing budget."""
    logger.info(f"📥 POST /admin/budgets/{budget_id}/add-funds - Amount: {payload.amount}")
    supabase = get_supabase_client()
    
    try:
        try:
            current = supabase.table("company_budgets").select("total_balance").eq("budget_id", budget_id).single().execute()
            table_name = "company_budgets"
        except Exception as e:
            logger.error(f"Error fetching budget {budget_id}: {e}")
            raise HTTPException(status_code=404, detail="Budget not found")
        
        if not current.data:
            raise HTTPException(status_code=404, detail="Budget not found")
        
        new_total = (current.data.get("total_balance", 0) or 0) + payload.amount
        
        resp = supabase.table(table_name).update({
            "total_balance": new_total,
            "last_updated": datetime.now().isoformat()
        }).eq("budget_id", budget_id).execute()
        
        return {
            "success": True,
            "message": f"Added {payload.amount} to budget. New total: {new_total}",
            "data": resp.data[0] if resp.data else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding funds: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/admin/budgets/{budget_id}")
async def delete_budget(budget_id: str) -> Dict[str, Any]:
    """Delete a budget."""
    logger.info(f"📥 DELETE /admin/budgets/{budget_id}")
    supabase = get_supabase_client()
    
    try:
        resp = supabase.table("company_budgets").delete().eq("budget_id", budget_id).execute()
        
        return {
            "success": True,
            "message": "Budget deleted successfully"
        }
        
    except Exception as e:
        logger.error(f"Error deleting budget: {e}")
        raise HTTPException(status_code=500, detail=str(e))
