"""
Reimbursement management API routes.
Handles status updates (approval, rejection) and notifications.
"""

import logging
from typing import Any, Dict, Optional
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field

from app.services.supabase_service import get_supabase_client
from app.services.email_service import email_service
from app.services.supabase_rpc_service import get_all_reimbursements_by_manager
from postgrest.exceptions import APIError

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/reimbursements/user/{user_id}")
async def get_user_reimbursements(user_id: str) -> Dict[str, Any]:
    """Fetch all reimbursements for a specific user."""
    logger.info(f"📥 GET /reimbursements/user/{user_id}")
    supabase = get_supabase_client()
    try:
        resp = supabase.table("reimbursements").select("*, categories:expense_categories(category_name)").eq("user_id", user_id).order("created_at", desc=True).execute()
        return {"success": True, "data": resp.data}
    except Exception as e:
        logger.error(f"Error fetching user reimbursements: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reimbursements/manager/{manager_id}")
async def get_manager_reimbursements(manager_id: str) -> Dict[str, Any]:
    """Fetch all reimbursements pending for a manager's team."""
    logger.info(f"📥 GET /reimbursements/manager/{manager_id}")
    try:
        # Using the RPC if possible, or direct query
        # Based on get_all_reimbursements_by_manager RPC
        reimbursements = get_all_reimbursements_by_manager(manager_id)
        return {"success": True, "data": reimbursements}
    except Exception as e:
        logger.error(f"Error fetching manager reimbursements: {e}")
        # Fallback to direct query if RPC fails
        try:
            supabase = get_supabase_client()
            resp = supabase.table("reimbursements") \
                .select("*, users!inner(full_name, email), categories:expense_categories(category_name)") \
                .eq("manager_id", manager_id) \
                .execute()
            return {"success": True, "data": resp.data}
        except Exception as fallback_err:
            logger.error(f"Fallback fetch failed: {fallback_err}")
            raise HTTPException(status_code=500, detail=str(e))


class StatusUpdateModel(BaseModel):
    status: str = Field(..., description="New status (approved, rejected, needs_revision)")
    comments: Optional[str] = Field(None, description="Manager comments or rejection reason")
    approver_id: str = Field(..., description="Manager UUID performing the action")


@router.put("/reimbursements/{reimbursement_id}/status")
async def update_reimbursement_status(
    reimbursement_id: str,
    payload: StatusUpdateModel = Body(...)
) -> Dict[str, Any]:
    """
    Update reimbursement status and trigger notifications.
    Satisfies User Story 5.1 and 5.2.
    """
    logger.info(f"📥 PUT /reimbursements/{reimbursement_id}/status - Status: {payload.status}")
    
    supabase = get_supabase_client()
    
    try:
        # 1. Fetch current reimbursement details (include company_id and department_id for budget check)
        reimb_resp = supabase.table("reimbursements").select(
            "reimbursement_id, receipt_code, user_id, amount_claimed, vendor_id, status, company_id, department_id"
        ).eq("reimbursement_id", reimbursement_id).single().execute()
        
        if not reimb_resp.data:
            raise HTTPException(status_code=404, detail="Reimbursement not found")
        
        reimb = reimb_resp.data
        user_id = reimb["user_id"]

        # 1b. BUDGET VALIDATION — block approval if claim exceeds available department budget
        if payload.status == "approved":
            claim_amount = float(reimb.get("amount_claimed", 0) or 0)
            company_id = reimb.get("company_id")
            department_id = reimb.get("department_id")

            if company_id and department_id:
                try:
                    # Fetch department budget
                    budget_resp = supabase.table("company_budgets") \
                        .select("total_balance") \
                        .eq("company_id", company_id) \
                        .eq("department_id", department_id) \
                        .limit(1) \
                        .execute()

                    if budget_resp.data:
                        total_budget = float(budget_resp.data[0].get("total_balance", 0) or 0)

                        # Calculate already-used budget (sum of approved claims in this dept)
                        used_resp = supabase.table("reimbursements") \
                            .select("amount_approved, amount_claimed") \
                            .eq("company_id", company_id) \
                            .eq("department_id", department_id) \
                            .eq("status", "approved") \
                            .execute()

                        used_budget = 0.0
                        for r in (used_resp.data or []):
                            used_budget += float(r.get("amount_approved") or r.get("amount_claimed") or 0)

                        available_budget = total_budget - used_budget

                        if claim_amount > available_budget:
                            logger.warning(
                                "⚠️ Budget exceeded for dept %s: claim=%.2f, available=%.2f, total=%.2f, used=%.2f",
                                department_id, claim_amount, available_budget, total_budget, used_budget
                            )
                            raise HTTPException(
                                status_code=400,
                                detail={
                                    "error_code": "budget_exceeded",
                                    "message": f"Insufficient department budget. Available: PKR {available_budget:,.0f}, Claim: PKR {claim_amount:,.0f}",
                                    "available_budget": available_budget,
                                    "claim_amount": claim_amount,
                                    "total_budget": total_budget,
                                    "used_budget": used_budget
                                }
                            )
                except HTTPException:
                    raise
                except Exception as budget_err:
                    logger.warning(f"⚠️ Budget check failed (non-blocking): {budget_err}")
        
        # 2. Update status in database
        update_data = {
            "status": payload.status,
            "manager_comments": payload.comments,
            "updated_at": "now()"
        }
        
        # Add approver specific fields if they exist in schema
        # Assuming schema has approved_by or similar
        
        update_resp = None
        try:
            update_resp = supabase.table("reimbursements").update(update_data).eq("reimbursement_id", reimbursement_id).execute()
        except APIError as e:
            # Fallback: If manager_comments or updated_at column missing, retry without them
            error_str = str(e)
            retry_needed = False
            
            if "manager_comments" in error_str:
                logger.warning(f"manager_comments column missing, removing from payload for {reimbursement_id}")
                update_data.pop("manager_comments", None)
                retry_needed = True
                
            if "updated_at" in error_str:
                logger.warning(f"updated_at column missing, removing from payload for {reimbursement_id}")
                update_data.pop("updated_at", None)
                retry_needed = True

            if retry_needed or e.code == "PGRST204":
                # If specific column wasn't in error message but code implies schema issue, try removing both
                if not retry_needed:
                     update_data.pop("manager_comments", None)
                     update_data.pop("updated_at", None)
                
                update_resp = supabase.table("reimbursements").update(update_data).eq("reimbursement_id", reimbursement_id).execute()
            else:
                raise e
        
        if not update_resp.data:
            raise HTTPException(status_code=500, detail="Failed to update reimbursement status")

        # 3. Fetch user info for notifications
        user_resp = supabase.table("users").select("full_name, email").eq("user_id", user_id).single().execute()
        user_data = user_resp.data or {"full_name": "Employee", "email": None}
        
        # 4. Trigger Email Notification (User Story 5.1)
        if user_data.get("email"):
            try:
                if payload.status == "approved":
                    await email_service.notify_claim_approved(
                        to_email=user_data["email"],
                        user_name=user_data["full_name"],
                        receipt_code=reimb["receipt_code"],
                        amount=reimb["amount_claimed"],
                        approver_name="Manager", # Can be fetched from approver_id if needed
                        comments=payload.comments
                    )
                elif payload.status == "rejected":
                    await email_service.notify_claim_rejected(
                        to_email=user_data["email"],
                        user_name=user_data["full_name"],
                        receipt_code=reimb["receipt_code"],
                        amount=reimb["amount_claimed"],
                        rejection_reason=payload.comments or "Policy violation"
                    )
            except Exception as email_err:
                logger.error(f"Failed to send status email: {email_err}")

        # 5. Trigger In-App Notification (User Story 5.2)
        try:
            notification_title = "✅ Claim Approved" if payload.status == "approved" else "❌ Claim Rejected"
            if payload.status == "needs_revision":
                notification_title = "⚠️ Revision Required"
                
            supabase.table("in_app_notifications").insert({
                "user_id": user_id,
                "title": notification_title,
                "message": f"Your claim for {reimb['receipt_code']} has been {payload.status}.",
                "type": "success" if payload.status == "approved" else "error" if payload.status == "rejected" else "warning",
                "category": "claim",
                "related_id": reimbursement_id
            }).execute()
        except Exception as notify_err:
            logger.error(f"Failed to create in-app notification: {notify_err}")

        return {
            "success": True,
            "message": f"Reimbursement {payload.status} successfully",
            "data": update_resp.data[0]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error updating status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/reimbursements/user/{user_id}/dashboard-stats")
async def get_user_dashboard_stats(user_id: str) -> Dict[str, Any]:
    """
    Fetch aggregated statistics for user dashboard.
    """
    logger.info(f"📥 GET /reimbursements/user/{user_id}/dashboard-stats")
    supabase = get_supabase_client()
    try:
        # 1. Fetch all reimbursements for calculations
        resp = supabase.table("reimbursements") \
            .select("*, categories:expense_categories(category_name)") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .execute()
        
        claims = resp.data or []
        now = datetime.now()
        current_year = now.year
        
        # 2. Basic Stats
        total_reimbursed_ytd = 0
        pending_count = 0
        approved_count = 0
        rejected_count = 0
        
        category_spend = {} # category_name -> total_amount

        for c in claims:
            status = c.get("status", "pending")
            amount = float(c.get("amount_claimed", 0) or 0)
            created_at = c.get("created_at", "")
            
            # Check if this year
            is_this_year = False
            if created_at:
                try:
                    c_year = datetime.fromisoformat(created_at.replace("Z", "+00:00")).year
                    if c_year == current_year:
                        is_this_year = True
                except Exception:
                    pass

            if status == "approved":
                approved_count += 1
                if is_this_year:
                    total_reimbursed_ytd += amount
            elif status == "pending":
                pending_count += 1
            elif status == "rejected":
                rejected_count += 1
            
            # Category spend (only approved claims)
            if status == "approved":
                cat_name = "Other"
                if c.get("categories") and isinstance(c["categories"], dict):
                    cat_name = c["categories"].get("category_name", "Other")
                
                category_spend[cat_name] = category_spend.get(cat_name, 0) + amount

        # 3. Calculations
        total_resolved = approved_count + rejected_count
        approval_rate = round((approved_count / total_resolved * 100)) if total_resolved > 0 else 0
        
        avg_claim_amount = total_reimbursed_ytd / approved_count if approved_count > 0 else 0
        
        # Approval times
        approval_deltas = []
        for c in claims:
            if c.get("status") == "approved" and c.get("updated_at") and c.get("created_at"):
                try:
                    updated = datetime.fromisoformat(c["updated_at"].replace("Z", "+00:00"))
                    created = datetime.fromisoformat(c["created_at"].replace("Z", "+00:00"))
                    approval_deltas.append((updated - created).total_seconds())
                except Exception:
                    pass
        
        fastest_approval = "—"
        slowest_approval = "—"
        if approval_deltas:
            fastest_sec = min(approval_deltas)
            slowest_sec = max(approval_deltas)
            
            if fastest_sec < 3600:
                fastest_approval = f"{int(fastest_sec / 60)}m"
            elif fastest_sec < 86400:
                fastest_approval = f"{round(fastest_sec / 3600, 1)}h"
            else:
                fastest_approval = f"{round(fastest_sec / 86400, 1)}d"
                
            if slowest_sec < 3600:
                slowest_approval = f"{int(slowest_sec / 60)}m"
            elif slowest_sec < 86400:
                slowest_approval = f"{round(slowest_sec / 3600, 1)}h"
            else:
                slowest_approval = f"{round(slowest_sec / 86400, 1)}d"

        allowed_reimbursement = 150000.00 # Placeholder for now
        remaining_reimbursement = max(0, allowed_reimbursement - total_reimbursed_ytd)
        
        # 4. Spending by Category Percentage (Donut)
        total_approved_spend = sum(category_spend.values())
        spending_distribution = []
        if total_approved_spend > 0:
            for cat, amt in category_spend.items():
                spending_distribution.append({
                    "category": cat,
                    "amount": amt,
                    "percentage": round((amt / total_approved_spend) * 100)
                })
        
        # 5. Budget Overview (Progress bars)
        # Use expense_categories (admin-defined) as the primary source of categories,
        # augmented with limits from reimbursement_rules where available.
        category_limits = {}
        try:
            # Resolve user → admin_id → company_id
            user_admin_resp = supabase.table("users").select("admin_id").eq("user_id", user_id).single().execute()
            rule_admin_id = user_admin_resp.data.get("admin_id") if user_admin_resp.data else None
            
            company_id_for_cats = None
            if rule_admin_id:
                comp_resp = supabase.table("companies").select("company_id").eq("admin_id", rule_admin_id).limit(1).execute()
                if comp_resp.data:
                    company_id_for_cats = comp_resp.data[0].get("company_id")
            
            if company_id_for_cats:
                # Fetch ALL company categories from expense_categories
                cats_resp = supabase.table("expense_categories") \
                    .select("category_id, category_name") \
                    .eq("company_id", company_id_for_cats) \
                    .execute()
                
                # Build category_id → name mapping
                cat_id_to_name = {}
                for cat_row in (cats_resp.data or []):
                    cat_id = cat_row.get("category_id")
                    cat_name = cat_row.get("category_name", "Unknown")
                    cat_id_to_name[cat_id] = cat_name
                    # Default limit; will be overridden by rules if available
                    category_limits[cat_name] = 0
                
                # Fetch limits from reimbursement_rules where available
                if rule_admin_id:
                    rules_resp = supabase.table("reimbursement_rules") \
                        .select("category_id, max_amount, monthly_limit") \
                        .eq("created_by", rule_admin_id) \
                        .eq("is_active", True) \
                        .execute()
                    
                    for r in (rules_resp.data or []):
                        cid = r.get("category_id")
                        limit_val = float(r.get("monthly_limit") or r.get("max_amount") or 0)
                        cat_name = cat_id_to_name.get(cid)
                        if cat_name and limit_val > 0:
                            category_limits[cat_name] = limit_val
        except Exception as cat_err:
            logger.warning(f"Could not fetch dynamic category limits: {cat_err}")
        
        # Fallback: use hardcoded limits only if no company categories found at all
        if not category_limits:
            category_limits = {
                "Travel": 50000,
                "Meals & Entertainment": 20000,
                "Office Supplies": 15000,
                "Communication": 10000,
                "Medical": 30000,
                "Training & Development": 25000,
                "Utilities": 5000,
                "Other": 10000
            }
        
        budget_overview = []
        for cat, limit in category_limits.items():
            used = category_spend.get(cat, 0)
            budget_overview.append({
                "category": cat,
                "used": used,
                "limit": limit,
                "percentage": round((used / limit * 100)) if limit > 0 else 0
            })

        return {
            "success": True,
            "data": {
                "kpis": [
                    {
                        "label": "Total Reimbursed (YTD)",
                        "value": f"PKR {total_reimbursed_ytd:,.2f}",
                        "sub": "+0% vs last month", # Placeholder
                        "subClass": "text-emerald-400"
                    },
                    {
                        "label": "Allowed Reimbursement",
                        "value": f"PKR {allowed_reimbursement:,.2f}",
                        "sub": f"Remaining: PKR {remaining_reimbursement:,.2f}",
                        "subClass": "text-muted-foreground"
                    },
                    {
                        "label": "Pending Claims",
                        "value": str(pending_count),
                        "sub": f"{pending_count} claim{'s' if pending_count != 1 else ''} require attention",
                        "subClass": "text-amber-400"
                    },
                    {
                        "label": "Approval Rate",
                        "value": f"{approval_rate}%",
                        "sub": "Based on resolved claims",
                        "subClass": "text-emerald-400"
                    }
                ],
                "recent_claims": claims[:5],
                "spending_distribution": spending_distribution,
                "budget_overview": budget_overview,
                "total_spend": total_approved_spend,
                "avg_claim_amount": avg_claim_amount,
                "fastest_approval": fastest_approval,
                "slowest_approval": slowest_approval
            }
        }
    except Exception as e:
        logger.error(f"Error fetching user dashboard stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reimbursements/manager/{manager_id}/stats")
async def get_manager_dashboard_stats(manager_id: str) -> Dict[str, Any]:
    """
    Fetch aggregated statistics for manager dashboard and analytics.
    """
    logger.info(f"📥 GET /reimbursements/manager/{manager_id}/stats")
    supabase = get_supabase_client()
    try:
        # 1. Fetch Manager Info
        manager_resp = supabase.table("managers") \
            .select("manager_company_id") \
            .eq("manager_id", manager_id) \
            .execute()
        
        manager_data = manager_resp.data[0] if manager_resp.data else {}
        company_id = manager_data.get("manager_company_id")
        
        # 2. Fetch Team Users Count
        users_resp = supabase.table("users") \
            .select("user_id", count="exact") \
            .eq("manager_id", manager_id) \
            .execute()
        team_member_count = users_resp.count or 0
        
        # 3. Fetch all reimbursements for the manager's team
        resp = supabase.table("reimbursements") \
            .select("*, categories:expense_categories(category_name), users(full_name, email)") \
            .eq("manager_id", manager_id) \
            .order("created_at", desc=True) \
            .execute()
        
        claims = resp.data or []
        
        # 4. Aggregate Metrics
        total_claims = len(claims)
        total_amount = 0
        pending_count = 0
        approved_count = 0
        rejected_count = 0
        
        category_stats = {} 
        monthly_trend = {} 
        user_performance = {} 
        
        for c in claims:
            status = c.get("status", "pending")
            amount = float(c.get("amount_claimed", 0) or 0)
            created_at_str = c.get("created_at", "")
            updated_at_str = c.get("updated_at", "")
            user_id = c.get("user_id")
            user_name = c.get("users", {}).get("full_name") if c.get("users") else "Unknown Employee"
            cat_name = c.get("categories", {}).get("category_name") if c.get("categories") else "Other"
            
            if status == "pending":
                pending_count += 1
            elif status == "approved":
                approved_count += 1
                total_amount += amount
            elif status == "rejected":
                rejected_count += 1
            
            if cat_name not in category_stats:
                category_stats[cat_name] = {"count": 0, "amount": 0}
            category_stats[cat_name]["count"] += 1
            category_stats[cat_name]["amount"] += amount
            
            if created_at_str:
                try:
                    dt = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                    month_key = dt.strftime("%b")
                    if month_key not in monthly_trend:
                        monthly_trend[month_key] = {"claims": 0, "amount": 0, "month": month_key}
                    monthly_trend[month_key]["claims"] += 1
                    monthly_trend[month_key]["amount"] += amount
                except Exception:
                    pass
            
            if user_id:
                if user_id not in user_performance:
                    user_performance[user_id] = {"user": user_name, "claims": 0, "amount": 0, "total_time_sec": 0, "resolved_count": 0}
                user_performance[user_id]["claims"] += 1
                user_performance[user_id]["amount"] += amount
                
                if status in ["approved", "rejected"] and created_at_str and updated_at_str:
                    try:
                        c_dt = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                        u_dt = datetime.fromisoformat(updated_at_str.replace("Z", "+00:00"))
                        user_performance[user_id]["total_time_sec"] += (u_dt - c_dt).total_seconds()
                        user_performance[user_id]["resolved_count"] += 1
                    except Exception:
                        pass

        total_resolved = approved_count + rejected_count
        approval_rate = round((approved_count / total_resolved * 100), 1) if total_resolved > 0 else 0
        average_claim = round(total_amount / approved_count, 2) if approved_count > 0 else 0
        
        top_categories = []
        sum_amount = sum(d["amount"] for d in category_stats.values())
        for cat, data in category_stats.items():
            top_categories.append({
                "category": cat,
                "count": data["count"],
                "amount": data["amount"],
                "percentage": round((data["amount"] / sum_amount * 100), 1) if sum_amount > 0 else 0
            })
        top_categories.sort(key=lambda x: x["amount"], reverse=True)
        
        performance_list = []
        for uid, p in user_performance.items():
            avg_sec = p["total_time_sec"] / p["resolved_count"] if p["resolved_count"] > 0 else 0
            if avg_sec == 0:
                avg_time = "—"
            elif avg_sec < 3600:
                avg_time = f"{int(avg_sec / 60)}m"
            elif avg_sec < 86400:
                avg_time = f"{round(avg_sec / 3600, 1)}h"
            else:
                avg_time = f"{round(avg_sec / 86400, 1)}d"
                
            performance_list.append({
                "user": p["user"],
                "claims": p["claims"],
                "amount": p["amount"],
                "avgTime": avg_time
            })
        performance_list.sort(key=lambda x: x["amount"], reverse=True)
        
        month_order = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        trend_list = []
        for m in month_order:
            if m in monthly_trend:
                trend_list.append(monthly_trend[m])
        
        budget_utilization = 0
        if company_id:
            try:
                budget_resp = supabase.table("company_budgets") \
                    .select("total_balance") \
                    .eq("company_id", company_id) \
                    .execute()
                if budget_resp.data and len(budget_resp.data) > 0:
                    total_balance = float(budget_resp.data[0].get("total_balance", 0) or 0)
                    if total_balance > 0:
                        budget_utilization = round((total_amount / total_balance * 100))
            except Exception as e:
                logger.warning(f"Failed to fetch budget for manager {manager_id}: {e}")

        return {
            "success": True,
            "data": {
                "totalClaims": total_claims,
                "totalAmount": total_amount,
                "averageClaim": average_claim,
                "approvalRate": approval_rate,
                "pendingCount": pending_count,
                "teamMemberCount": team_member_count,
                "budgetUtilization": budget_utilization,
                "topCategories": top_categories,
                "monthlyTrend": trend_list,
                "teamPerformance": performance_list
            }
        }
    except Exception as e:
        logger.error(f"Error fetching manager stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
