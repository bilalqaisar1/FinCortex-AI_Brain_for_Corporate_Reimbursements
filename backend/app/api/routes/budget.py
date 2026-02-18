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
    admin_id: str = Field(..., description="Admin ID for company resolution")
    total_amount: float = Field(..., description="Total budget amount")
    monthly_limit: Optional[float] = Field(None, description="Monthly spending limit")
    category_id: Optional[int] = Field(None, description="Optional category ID for allocation (Legacy)")
    department_id: Optional[int] = Field(None, description="Department ID for allocation")
    currency: str = Field(default="PKR", description="Currency code")


class UpdateBudgetModel(BaseModel):
    total_amount: Optional[float] = None
    monthly_limit: Optional[float] = None
    company_name: Optional[str] = None


class AddFundsModel(BaseModel):
    amount: float = Field(..., description="Amount to add to budget")
    notes: Optional[str] = Field(None, description="Notes for the transaction")


class TopUpModel(BaseModel):
    admin_id: str = Field(..., description="Admin ID for company resolution")
    amount: float = Field(..., gt=0, description="Amount to add to company balance")


@router.get("/admin/budgets")
async def get_budgets(admin_id: Optional[str] = None) -> Dict[str, Any]:
    """Get all company budgets for the specified admin."""
    logger.info(f"📥 GET /admin/budgets (admin_id: {admin_id})")
    if not admin_id:
        return {"success": True, "data": []}
        
    supabase = get_supabase_client()
    
    # Resolve Company ID
    company_id = None
    try:
        comp_resp = supabase.table("companies").select("company_id").eq("admin_id", admin_id).execute()
        if comp_resp.data:
            company_id = comp_resp.data[0].get("company_id")
    except Exception as e:
        logger.error(f"Error resolving company for budget fetch: {e}")
        
    if not company_id:
        return {"success": True, "data": []}
    
    try:
        # 1. Fetch approved reimbursements for THIS company only
        reimbursements_resp = supabase.table("reimbursements") \
            .select("company_id, amount_approved, amount_claimed, created_at, department_id") \
            .eq("company_id", company_id) \
            .eq("status", "approved") \
            .execute()
        
        # Aggregate used (approved) amount per company AND department
        used_by_dept = {} # department_id -> amount
        monthly_used_by_dept = {}
        
        # Also maintain global usage for safety/legacy
        used_global = 0
        
        now = datetime.now()
        current_month = now.month
        current_year = now.year

        if reimbursements_resp.data:
            for r in reimbursements_resp.data:
                # Prefer amount_approved, fallback to amount_claimed
                amount = r.get("amount_approved") or r.get("amount_claimed") or 0
                created_at_str = r.get("created_at")
                did = r.get("department_id")
                
                # Global usage (just in case)
                used_global += amount
                
                # Dept usage
                if did:
                    used_by_dept[did] = used_by_dept.get(did, 0) + amount

                if created_at_str:
                    try:
                        r_date = datetime.fromisoformat(created_at_str.replace("Z", "+00:00").split("+")[0])
                        if r_date.month == current_month and r_date.year == current_year:
                             if did:
                                monthly_used_by_dept[did] = monthly_used_by_dept.get(did, 0) + amount
                    except Exception:
                        pass

        # 2. Try to fetch budgets from company_budgets table (Join with Departments)
        budgets_data = []
        account_balance = 0
        total_allocated = 0
        company_name_resolved = "Unknown Company"
        
        try:
            # Fetch company info (balance)
            comp_info = supabase.table("companies").select("account_balance, company_name").eq("company_id", company_id).single().execute()
            if comp_info.data:
                account_balance = comp_info.data.get("account_balance", 0) or 0
                company_name_resolved = comp_info.data.get("company_name", "Unknown Company")
            
            # Fetch budgets with Department names
            resp = supabase.table("company_budgets") \
                .select("*, departments(department_name)") \
                .eq("company_id", company_id) \
                .order("last_updated", desc=True) \
                .execute()
            budgets_data = resp.data or []
            
            # Calculate total allocated
            total_allocated = sum(b.get("total_balance", 0) or 0 for b in budgets_data)
            
        except Exception as e:
            # Fallback logic if needed, but we've already resolved company_id
            logger.error(f"Error fetching budgets/company data: {e}")
            raise e

        # 3. Construct final response
        budgets = []
        for b in budgets_data:
            cid = b.get("company_id")
            did = b.get("department_id")
            total = b.get("total_balance", 0) or 0
            
            # Match usage by department if available
            used = 0
            monthly_used = 0
            
            if did:
                 used = used_by_dept.get(did, 0)
                 monthly_used = monthly_used_by_dept.get(did, 0)
            
            remaining = max(0, total - used)
            
            utilization = 0
            if total > 0:
                utilization = min(100, round((used / total) * 100, 1))
            elif used > 0:
                utilization = 100 
            
            # Resolve Name
            department_name = "General Budget"
            if b.get("departments") and isinstance(b["departments"], dict):
                department_name = b["departments"].get("department_name", "Unknown Dept")
            elif did:
                 department_name = f"Department {did}"
            elif b.get("category_id"):
                 department_name = f"Category ID {b.get('category_id')}"

            budgets.append({
                "budget_id": b.get("budget_id"),
                "company_id": cid,
                "company_name": company_name_resolved,
                "department_name": department_name, # Frontend expects this now (or category_name, we can send both to be safe)
                "category_name": department_name, # Backward compatibility for frontend
                "total_amount": total,
                "used_amount": used,
                "remaining_amount": remaining,
                "utilization_percentage": utilization,
                "monthly_limit": b.get("monthly_limit", 0) or 0,
                "monthly_used": monthly_used,
                "status": "healthy" if (total - used) >= 0 else "critical",
                "currency": "PKR",
                "last_updated": b.get("last_updated", ""),
                "account_balance": account_balance,
                "total_allocated": total_allocated
            })
        
        return {
            "success": True, 
            "data": budgets,
            "account_balance": account_balance,
            "total_allocated": total_allocated,
            "company_name": company_name_resolved
        }
        
    except Exception as e:
        logger.error(f"Error fetching budgets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/budgets")
async def create_budget(payload: CreateBudgetModel = Body(...)) -> Dict[str, Any]:
    """Create or update a budget allocation for the admin's company."""
    logger.info(f"📥 POST /admin/budgets - Admin: {payload.admin_id} - Dept: {payload.department_id}")
    supabase = get_supabase_client()
    
    try:
        # 1. Resolve Company
        comp_resp = supabase.table("companies").select("company_id").eq("admin_id", payload.admin_id).execute()
        if not comp_resp.data:
            raise HTTPException(status_code=404, detail="Company not found for this admin")
        
        company_id = comp_resp.data[0].get("company_id")
        
        # 2. Verify account balance
        comp_info = supabase.table("companies").select("account_balance").eq("company_id", company_id).single().execute()
        account_balance = comp_info.data.get("account_balance", 0) or 0
        
        if payload.total_amount > account_balance:
            raise HTTPException(
                status_code=400, 
                detail=f"Budget exceeds company balance. Available: PKR {account_balance:,.0f}, Requested: PKR {payload.total_amount:,.0f}"
            )

        # 3. Handle allocation (Automatic Balance Deduction)
        # We decrease the company balance by the amount of the budget
        new_balance = account_balance - payload.total_amount
        supabase.table("companies").update({"account_balance": new_balance}).eq("company_id", company_id).execute()

        budget_data = {
            "company_id": company_id,
            "total_balance": payload.total_amount,
            "monthly_limit": payload.monthly_limit,
            "category_id": payload.category_id,
            "department_id": payload.department_id,
            "last_updated": datetime.now().isoformat()
        }
        
        # Upsert logic based on DEPARTMENT (primary) or Category (legacy fallback)
        query = supabase.table("company_budgets").select("budget_id").eq("company_id", company_id)
        
        if payload.department_id:
            query = query.eq("department_id", payload.department_id)
        elif payload.category_id:
             query = query.eq("category_id", payload.category_id)
        else:
            # Global fall back
            query = query.is_("department_id", "null").is_("category_id", "null")
            
        existing = query.execute()
        
        if existing.data:
            budget_id = existing.data[0].get("budget_id")
            # If it exists, we are REPLACING the budget. 
            # In a real system, we might want to handle deltas, but for simplicity:
            # We already deducted the NEW amount. We should REFUND the OLD amount.
            old_budget = supabase.table("company_budgets").select("total_balance").eq("budget_id", budget_id).single().execute()
            if old_budget.data:
                refund_amount = old_budget.data.get("total_balance", 0)
                final_balance = new_balance + refund_amount
                supabase.table("companies").update({"account_balance": final_balance}).eq("company_id", company_id).execute()

            resp = supabase.table("company_budgets").update(budget_data).eq("budget_id", budget_id).execute()
        else:
            resp = supabase.table("company_budgets").insert(budget_data).execute()
            
        return {
            "success": True,
            "message": f"Budget of {payload.total_amount} allocated. Account balance adjusted.",
            "data": resp.data[0] if resp.data else {}
        }
        
    except Exception as e:
        logger.error(f"Error creating budget: {e}")
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/admin/budgets/{budget_id}")
async def update_budget(budget_id: str, payload: UpdateBudgetModel = Body(...)) -> Dict[str, Any]:
    """Update an existing budget."""
    logger.info(f"📥 PUT /admin/budgets/{budget_id}")
    supabase = get_supabase_client()
    
    try:
        update_data = {"last_updated": datetime.now().isoformat()}

        # 1. Fetch budget and company info
        budget_info = supabase.table("company_budgets").select("company_id").eq("budget_id", budget_id).single().execute()
        if not budget_info.data:
            raise HTTPException(status_code=404, detail="Budget not found")
        
        company_id = budget_info.data.get("company_id")
        
        # 2. Check balance if amount is changing
        if payload.total_amount is not None:
            comp_info = supabase.table("companies").select("account_balance").eq("company_id", company_id).single().execute()
            account_balance = comp_info.data.get("account_balance", 0) or 0
            
            if payload.total_amount > account_balance:
                 raise HTTPException(
                    status_code=400, 
                    detail=f"Budget exceeds company balance. Available: PKR {account_balance:,.0f}, Requested: PKR {payload.total_amount:,.0f}"
                )
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
        # 1. Fetch current budget
        try:
            current = supabase.table("company_budgets").select("*").eq("budget_id", budget_id).single().execute()
        except Exception as e:
            logger.error(f"Error fetching budget {budget_id}: {e}")
            raise HTTPException(status_code=404, detail="Budget not found")
            
        if not current.data:
            raise HTTPException(status_code=404, detail="Budget not found")
        
        company_id = current.data.get("company_id")
        
        # 2. Verify account balance
        comp_info = supabase.table("companies").select("account_balance").eq("company_id", company_id).single().execute()
        account_balance = comp_info.data.get("account_balance", 0) or 0
        
        new_total = (current.data.get("total_balance", 0) or 0) + payload.amount
        
        if new_total > account_balance:
            raise HTTPException(
                status_code=400, 
                detail=f"Budget exceeds company balance. Available: PKR {account_balance:,.0f}, New Total: PKR {new_total:,.0f}"
            )
        
        # 3. Apply update
        # 3a. Update Budget
        resp = supabase.table("company_budgets").update({
            "total_balance": new_total,
            "last_updated": datetime.now().isoformat()
        }).eq("budget_id", budget_id).execute()
        
        # 3b. Deduct from Company Balance
        new_comp_balance = account_balance - payload.amount
        supabase.table("companies").update({
            "account_balance": new_comp_balance
        }).eq("company_id", company_id).execute()
        
        return {
            "success": True,
            "message": f"Added PKR {payload.amount:,.0f} to budget. Company balance: PKR {new_comp_balance:,.0f}",
            "data": resp.data[0] if resp.data else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding funds: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/budgets/top-up")
async def top_up_company_balance(payload: TopUpModel = Body(...)) -> Dict[str, Any]:
    """Top up the company's account balance."""
    logger.info(f"📥 POST /admin/budgets/top-up - Admin: {payload.admin_id}, Amount: {payload.amount}")
    supabase = get_supabase_client()
    
    try:
        # 1. Resolve Company
        comp_resp = supabase.table("companies").select("company_id, account_balance").eq("admin_id", payload.admin_id).execute()
        if not comp_resp.data:
            raise HTTPException(status_code=404, detail="Company not found for this admin")
        
        company_id = comp_resp.data[0].get("company_id")
        current_balance = comp_resp.data[0].get("account_balance", 0) or 0
        
        # 2. Update balance
        new_balance = current_balance + payload.amount
        resp = supabase.table("companies").update({"account_balance": new_balance}).eq("company_id", company_id).execute()
        
        return {
            "success": True,
            "message": f"Successfully topped up PKR {payload.amount:,.0f}. New balance: PKR {new_balance:,.0f}",
            "data": {"account_balance": new_balance}
        }
    except Exception as e:
        logger.error(f"Error topping up balance: {e}")
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/admin/budgets/{budget_id}")
async def delete_budget(budget_id: str) -> Dict[str, Any]:
    """Delete a budget and refund amount to company balance."""
    logger.info(f"📥 DELETE /admin/budgets/{budget_id}")
    supabase = get_supabase_client()
    
    try:
        # 1. Fetch budget to know how much to refund
        budget = supabase.table("company_budgets").select("company_id, total_balance").eq("budget_id", budget_id).single().execute()
        
        if budget.data:
            company_id = budget.data.get("company_id")
            refund_amount = budget.data.get("total_balance", 0)
            
            # 2. Refund balance
            comp = supabase.table("companies").select("account_balance").eq("company_id", company_id).single().execute()
            if comp.data:
                current_bal = comp.data.get("account_balance", 0)
                supabase.table("companies").update({"account_balance": current_bal + refund_amount}).eq("company_id", company_id).execute()

        # 3. Delete budget
        resp = supabase.table("company_budgets").delete().eq("budget_id", budget_id).execute()
        
        return {
            "success": True,
            "message": "Budget deleted and funds returned to company balance"
        }
        
    except Exception as e:
        logger.error(f"Error deleting budget: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/categories")
async def get_categories() -> Dict[str, Any]:
    """Get all available expense categories."""
    supabase = get_supabase_client()
    try:
        resp = supabase.table("expense_categories").select("*").order("category_id").execute()
        return {"success": True, "data": resp.data or []}
    except Exception as e:
        logger.error(f"Error fetching categories: {e}")
        return {"success": False, "error": str(e)}


@router.get("/admin/departments")
async def get_departments() -> Dict[str, Any]:
    """Get all departments."""
    supabase = get_supabase_client()
    try:
        resp = supabase.table("departments").select("*").order("department_id").execute()
        return {"success": True, "data": resp.data or []}
    except Exception as e:
        logger.error(f"Error fetching departments: {e}")
        return {"success": False, "error": str(e)}


@router.post("/admin/departments")
async def create_department(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """Create a new department."""
    supabase = get_supabase_client()
    department_name = payload.get("department_name", "").strip()

    if not department_name:
        return {"success": False, "error": "Department name is required"}

    try:
        resp = supabase.table("departments").insert({"department_name": department_name}).execute()
        return {"success": True, "data": resp.data[0] if resp.data else None}
    except Exception as e:
        logger.error(f"Error creating department: {e}")
        return {"success": False, "error": str(e)}


@router.delete("/admin/departments/{department_id}")
async def delete_department(department_id: int) -> Dict[str, Any]:
    """Delete a department by ID."""
    supabase = get_supabase_client()
    try:
        resp = supabase.table("departments").delete().eq("department_id", department_id).execute()
        return {"success": True, "data": resp.data}
    except Exception as e:
        logger.error(f"Error deleting department: {e}")
        return {"success": False, "error": str(e)}


@router.get("/manager/budget")
async def get_manager_budget(manager_id: str) -> Dict[str, Any]:
    """Get budget allocation and spending for the manager's department."""
    logger.info(f"📥 GET /manager/budget (manager_id: {manager_id})")
    
    supabase = get_supabase_client()
    
    try:
        # 1. Fetch Manager Profile to get Department and Company
        # Manager ID likely maps to auth.uid() in a real scenario, but we accept it as param for now
        manager_resp = supabase.table("managers") \
            .select("manager_id, manager_company_id, manager_department_id, full_name, departments(department_name)") \
            .eq("manager_id", manager_id) \
            .limit(1) \
            .execute()
            
        if not manager_resp.data or len(manager_resp.data) == 0:
            # Manager not found in managers table
            raise HTTPException(status_code=404, detail="Manager profile not found")
            
        manager_data = manager_resp.data[0]
        company_id = manager_data.get("manager_company_id")
        department_id = manager_data.get("manager_department_id")
        department_name = "Unknown Department"
        
        # Safe extraction of nested department name
        dept_info = manager_data.get("departments")
        if dept_info and isinstance(dept_info, dict):
            department_name = dept_info.get("department_name", "Unknown Department")
            
        if not company_id:
             raise HTTPException(status_code=400, detail="Manager is not associated with a company")
             
        # 2. Fetch Department-Specific Budget
        # Look for a budget in company_budgets where department_id matches
        
        total_budget = 0
        monthly_limit = 0
        budget_id = None
        
        if department_id:
            try:
                budget_query = supabase.table("company_budgets") \
                    .select("*") \
                    .eq("company_id", company_id) \
                    .eq("department_id", department_id) \
                    .limit(1) \
                    .execute()
                
                if budget_query.data:
                    budget_data = budget_query.data[0]
                    total_budget = budget_data.get("total_balance", 0) or 0
                    monthly_limit = budget_data.get("monthly_limit", 0) or 0
                    budget_id = budget_data.get("budget_id")
            except Exception as e:
                logger.warning(f"Error fetching department budget: {e}")
        
        # 3. Calculate Spending (Reimbursements)
        # Filter by company AND department
        try:
            reimb_query = supabase.table("reimbursements") \
                .select("reimbursement_id, amount_claimed, amount_approved, status, created_at, description, expense_categories(category_name)") \
                .eq("company_id", company_id)
                
            if department_id:
                 reimb_query = reimb_query.eq("department_id", department_id)
                 
            reimb_resp = reimb_query.order("created_at", desc=True).limit(50).execute() # Limit to last 50 for performance
            reimbursements = reimb_resp.data or []
        except Exception as e:
            logger.error(f"Error fetching reimbursements: {e}")
            reimbursements = []
        
        used_budget = 0
        monthly_used = 0
        
        now = datetime.now()
        current_month = now.month
        current_year = now.year
        
        category_spending = {} # category_name -> spent_amount
        recent_transactions = []
        
        for r in reimbursements:
            status = r.get("status")
            # Use approved amount if available, otherwise claimed
            amount = r.get("amount_approved") or r.get("amount_claimed") or 0 
            
            # Count towards usage if Approved
            if status == "approved":
                used_budget += amount
                
                # Monthly check
                created_at_str = r.get("created_at")
                if created_at_str:
                    try:
                        # Handle potential timezone formats
                        dt_str = created_at_str.replace("Z", "+00:00")
                        if "+" in dt_str:
                             r_date = datetime.fromisoformat(dt_str.split("+")[0])
                        else:
                             r_date = datetime.fromisoformat(dt_str)
                             
                        if r_date.month == current_month and r_date.year == current_year:
                             monthly_used += amount
                    except Exception:
                        pass
            
            # Category breakdown (include all statuses or just approved? Usually approved + pending shows 'committed' spend)
            # For this view, let's include Approved and Pending in category breakdown to show "potential" spend
            if status in ["approved", "pending"]:
                cat_info = r.get("expense_categories")
                cat_name = "Uncategorized"
                if cat_info and isinstance(cat_info, dict):
                     cat_name = cat_info.get("category_name", "Uncategorized")
                
                if cat_name not in category_spending:
                    category_spending[cat_name] = 0
                category_spending[cat_name] += amount
            
            # Add to recent transactions list
            if len(recent_transactions) < 5:
                # Format date nicely
                date_str = r.get("created_at")
                
                recent_transactions.append({
                    "id": r.get("reimbursement_id"),
                    "type": "Debit", 
                    "amount": amount,
                    "description": r.get("description") or "Reimbursement", # Short description
                    "date": date_str,
                    "status": status
                })

        # 4. Prepare UI Data
        
        # Convert category spending to list
        categories_ui = []
        for cat_name, spent in category_spending.items():
            limit = 0 # No per-category limit logic yet
            percentage = 0
            if total_budget > 0:
                 percentage = round((spent / total_budget) * 100, 1) # usage against DEPT total
            
            categories_ui.append({
                "category": cat_name,
                "used": spent,
                "limit": limit, 
                "percentage": percentage
            })
            
        remaining_budget = max(0, total_budget - used_budget)
        utilization_percentage = 0
        if total_budget > 0:
            utilization_percentage = min(100, round((used_budget / total_budget) * 100, 1))
        elif used_budget > 0:
            utilization_percentage = 100 # Over budget effectively if 0 allocated

        return {
            "success": True,
            "data": {
                "total_budget": total_budget,
                "used_budget": used_budget,
                "remaining_budget": remaining_budget,
                "utilization_percentage": utilization_percentage,
                "monthly_limit": monthly_limit,
                "monthly_used": monthly_used,
                "monthly_remaining": max(0, monthly_limit - monthly_used) if monthly_limit else 0,
                "department_name": department_name,
                "department_id": department_id,
                "categories": categories_ui,
                "recent_transactions": recent_transactions
            }
        }

    except Exception as e:
        logger.error(f"Error serving manager budget: {e}")
        # Return empty data structure on error to prevent frontend crash, or let 500 propagate?
        # Let's propagate so we know there's a bug.
        raise HTTPException(status_code=500, detail=str(e))
