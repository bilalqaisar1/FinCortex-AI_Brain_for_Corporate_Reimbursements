"""
Admin API routes for dashboard statistics, activity, and pending approvals.
"""

import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException

from app.services.supabase_service import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/admin/stats")
async def get_admin_stats(admin_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Get dashboard statistics for admin.
    Returns: total claims, pending approvals, budget utilization, policy violations.
    REQUIRES admin_id to filter by that admin's company.
    """
    logger.info(f"📥 GET /admin/stats (admin_id: {admin_id})")
    if not admin_id:
        # For security and multi-tenancy, we return empty stats if no admin_id provided
        logger.warning("No admin_id provided to /admin/stats")
        return {
            "success": True,
            "company_name": "No Admin Resolved",
            "data": _get_empty_stats_data()
        }

    supabase = get_supabase_client()
    
    company_id = None
    company_name = "Your Company"
    
    logger.info(f"Resolving company for admin_id: {admin_id}")
    try:
        # Resolve company for this admin
        # Try companies table (standard link)
        comp_resp = supabase.table("companies").select("company_id, company_name").eq("admin_id", admin_id).execute()
        if comp_resp.data and len(comp_resp.data) > 0:
            company_id = comp_resp.data[0].get("company_id")
            company_name = comp_resp.data[0].get("company_name", "Your Company")
            logger.info(f"Resolved company_id: {company_id}, company_name: {company_name}")
        else:
            # Check users table as fallback
            user_resp = supabase.table("users").select("company_id").eq("user_id", admin_id).execute()
            if user_resp.data and len(user_resp.data) > 0:
                company_id = user_resp.data[0].get("company_id")
                logger.info(f"Resolved company_id from users: {company_id}")
                
        if not company_id:
            logger.warning(f"Could not resolve company for admin {admin_id}")
            return {
                "success": True,
                "data": _get_empty_stats_data(company_name="New Account")
            }
    except Exception as e:
        logger.error(f"Error resolving company for admin {admin_id}: {e}")
        return {
            "success": False, 
            "error": f"Resolution error: {str(e)}",
            "data": _get_empty_stats_data(company_name="Error State")
        }
    
    try:
        now = datetime.now()
        logger.info(f"Fetching claims stats. Company: {company_id}")
        
        # 1. Total Claims (this month)
        first_day_this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        first_day_last_month = (first_day_this_month - timedelta(days=1)).replace(day=1)
        
        # This month's claims
        this_month_resp = supabase.table("reimbursements").select("reimbursement_id", count="exact") \
            .eq("company_id", company_id) \
            .gte("created_at", first_day_this_month.isoformat()) \
            .limit(1) \
            .execute()
        this_month_count = this_month_resp.count or 0
        
        # Last month's claims (for change calculation)
        last_month_resp = supabase.table("reimbursements").select("reimbursement_id", count="exact") \
            .eq("company_id", company_id) \
            .gte("created_at", first_day_last_month.isoformat()) \
            .lt("created_at", first_day_this_month.isoformat()) \
            .limit(1) \
            .execute()
        last_month_count = last_month_resp.count or 0
        
        # Calculate percentage change
        if last_month_count > 0:
            change_pct = ((this_month_count - last_month_count) / last_month_count) * 100
            change_str = f"{'+' if change_pct >= 0 else ''}{change_pct:.0f}%"
        else:
            change_str = "+100%" if this_month_count > 0 else "0%"
        
        # 2. Pending Approvals
        pending_resp = supabase.table("reimbursements").select("reimbursement_id", count="exact") \
            .eq("status", "pending") \
            .eq("company_id", company_id) \
            .limit(1).execute()
        pending_count = pending_resp.count or 0
        
        # New pending (last 24 hours)
        yesterday = now - timedelta(days=1)
        new_pending_resp = supabase.table("reimbursements").select("reimbursement_id", count="exact") \
            .eq("status", "pending") \
            .eq("company_id", company_id) \
            .gte("created_at", yesterday.isoformat()) \
            .limit(1).execute()
        new_pending = new_pending_resp.count or 0
        
        # 3. Budget Utilization
        budget_utilization = 0
        budget_change = "0%"
        try:
            # Use company_budgets table
            b_query = supabase.table("company_budgets").select("total_balance")
            if company_id:
                b_query = b_query.eq("company_id", company_id)
            budgets_resp = b_query.execute()

            if budgets_resp and budgets_resp.data:
                total_budget = sum(b.get("total_balance", 0) or 0 for b in budgets_resp.data)
                
                # Fetch approved reimbursements to calculate used amount
                total_used = 0
                r_query = supabase.table("reimbursements").select("amount_claimed") \
                    .eq("status", "approved")
                if company_id:
                    r_query = r_query.eq("company_id", company_id)
                
                reimb_resp = r_query.execute()
                if reimb_resp.data:
                    total_used = sum(float(r.get("amount_claimed", 0) or 0) for r in reimb_resp.data)

                if total_budget > 0:
                    budget_utilization = round((total_used / total_budget) * 100)
        except Exception as budget_err:
            logger.warning(f"Could not fetch budgets for stats: {budget_err}")
        
        # 4. Policy Violations (this week)
        first_day_this_week = now - timedelta(days=now.weekday())
        first_day_this_week = first_day_this_week.replace(hour=0, minute=0, second=0, microsecond=0)
        
        violations_count = 0
        resolved_count = 0
        try:
            # Get total count
            v_query = supabase.table("policy_violations").select("violation_id", count="exact")
            if company_id:
                v_query = v_query.eq("company_id", company_id)
            
            violations_resp = v_query.gte("created_at", first_day_this_week.isoformat()).limit(1).execute()
            violations_count = violations_resp.count or 0
            
            # Get resolved count - try defensive query
            try:
                res_query = supabase.table("policy_violations").select("violation_id", count="exact") \
                    .or_("resolved.eq.true,is_resolved.eq.true") \
                    .gte("created_at", first_day_this_week.isoformat())
                
                if company_id:
                    res_query = res_query.eq("company_id", company_id)
                
                res_resp = res_query.limit(1).execute()
                resolved_count = res_resp.count or 0
            except Exception:
                # If 'or' or columns fail, just leave as 0
                pass
        except Exception:
            # Fallback to reimbursements with flags
            try:
                f_query = supabase.table("reimbursements").select("reimbursement_id", count="exact").not_.is_("flags", "null")
                if company_id:
                    f_query = f_query.eq("company_id", company_id)
                flagged_resp = f_query.gte("created_at", first_day_this_week.isoformat()).execute()
                violations_count = flagged_resp.count or 0
            except Exception:
                pass
        
        return {
            "success": True,
            "data": {
                "company_name": company_name,
                "total_claims": {
                    "value": this_month_count,
                    "change": change_str,
                    "description": "This month"
                },
                "pending_approvals": {
                    "value": pending_count,
                    "change": f"{new_pending} new" if new_pending > 0 else "No new",
                    "description": "Require attention"
                },
                "budget_utilization": {
                    "value": budget_utilization,
                    "change": budget_change,
                    "description": f"For {company_name}" if company_id else "Across all companies"
                },
                "policy_violations": {
                    "value": violations_count,
                    "change": f"{resolved_count} resolved" if resolved_count > 0 else "0 resolved",
                    "description": "This week"
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching admin stats: {e}")
        return {
            "success": False,
            "error": str(e),
            "data": _get_empty_stats_data(company_name=company_name)
        }


@router.get("/admin/pending-approvals")
async def get_pending_approvals(admin_id: Optional[str] = None) -> Dict[str, Any]:
    """Get list of pending approval claims with details."""
    logger.info(f"📥 GET /admin/pending-approvals (admin_id: {admin_id})")
    supabase = get_supabase_client()
    
    company_id = None
    if admin_id:
        try:
            comp_resp = supabase.table("companies").select("company_id").eq("admin_id", admin_id).execute()
            if comp_resp.data and len(comp_resp.data) > 0:
                company_id = comp_resp.data[0].get("company_id")
        except Exception:
            pass
    
    try:
        # Build query
        query = supabase.table("reimbursements") \
            .select("reimbursement_id, receipt_code, user_id, amount_claimed, category_id, status, created_at, flags, users(full_name), expense_categories(category_name)") \
            .eq("status", "pending")
        
        if not company_id:
            return {"success": True, "data": []}
            
        query = query.eq("company_id", company_id)
            
        try:
            resp = query.order("created_at", desc=True).limit(10).execute()
        except Exception as e:
            if "flags" in str(e):
                logger.warning("flags column missing in reimbursements, trying without it")
                query = supabase.table("reimbursements") \
                    .select("reimbursement_id, receipt_code, user_id, amount_claimed, category_id, status, created_at, users(full_name), expense_categories(category_name)") \
                    .eq("status", "pending")
                if not company_id:
                    return {"success": True, "data": []}
                query = query.eq("company_id", company_id)
                resp = query.order("created_at", desc=True).limit(10).execute()
            else:
                raise e
        
        approvals = []
        for r in (resp.data or []):
            # Determine priority based on amount and flags
            amount = r.get("amount_claimed", 0) or 0
            flags = r.get("flags") or []
            
            if flags or amount > 50000:
                priority = "high"
            elif amount > 20000:
                priority = "medium"
            else:
                priority = "low"
            
            # Calculate time ago
            created_at = r.get("created_at", "")
            time_ago = "Unknown"
            if created_at:
                try:
                    created = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                    delta = datetime.now(created.tzinfo) - created
                    if delta.days > 0:
                        time_ago = f"{delta.days} days ago"
                    elif delta.seconds >= 3600:
                        time_ago = f"{delta.seconds // 3600} hours ago"
                    else:
                        time_ago = f"{delta.seconds // 60} minutes ago"
                except Exception:
                    pass
            
            approvals.append({
                "id": r.get("receipt_code", r.get("reimbursement_id", ""))[:10],
                "reimbursement_id": r.get("reimbursement_id"),
                "user": r.get("users", {}).get("full_name", "Unknown User") if r.get("users") else "Unknown User",
                "amount": f"PKR {amount:,.0f}",
                "category": r.get("expense_categories", {}).get("category_name", "General") if r.get("expense_categories") else "General",
                "reason": flags[0].get("message", "Pending review") if flags else "Pending review",
                "priority": priority,
                "submitted": time_ago
            })
        
        return {"success": True, "data": approvals}
        
    except Exception as e:
        logger.error(f"Error fetching pending approvals: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/recent-activity")
async def get_recent_activity(admin_id: Optional[str] = None) -> Dict[str, Any]:
    """Get recent system activity."""
    logger.info(f"📥 GET /admin/recent-activity (admin_id: {admin_id})")
    supabase = get_supabase_client()
    
    company_id = None
    if admin_id:
        try:
            comp_resp = supabase.table("companies").select("company_id").eq("admin_id", admin_id).single().execute()
            if comp_resp.data:
                company_id = comp_resp.data.get("company_id")
        except Exception:
            pass
            
    try:
        # Fetch recent reimbursements with status changes
        query = supabase.table("reimbursements") \
            .select("reimbursement_id, receipt_code, status, amount_claimed, created_at, updated_at, users(full_name)")
            
        if not company_id:
            return {"success": True, "data": []}
            
        query = query.eq("company_id", company_id)
            
        resp = query.order("updated_at", desc=True).limit(10).execute()
        
        activities = []
        for r in (resp.data or []):
            status = r.get("status", "pending")
            user_name = r.get("users", {}).get("full_name", "Unknown") if r.get("users") else "Unknown"
            amount = r.get("amount_claimed", 0) or 0
            
            # Determine activity type and action
            if status == "approved":
                action = "Claim approved"
                activity_type = "approval"
            elif status == "rejected":
                action = "Claim rejected"
                activity_type = "rejection"
            elif status == "pending":
                action = "User submitted claim"
                activity_type = "submission"
            else:
                action = f"Claim {status}"
                activity_type = "other"
            
            # Calculate time ago
            timestamp = r.get("updated_at") or r.get("created_at", "")
            time_ago = "Unknown"
            if timestamp:
                try:
                    ts = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                    delta = datetime.now(ts.tzinfo) - ts
                    if delta.days > 0:
                        time_ago = f"{delta.days} days ago"
                    elif delta.seconds >= 3600:
                        time_ago = f"{delta.seconds // 3600} hours ago"
                    else:
                        time_ago = f"{delta.seconds // 60} minutes ago"
                except Exception:
                    pass
            
            activities.append({
                "action": action,
                "user": user_name,
                "amount": f"PKR {amount:,.0f}",
                "time": time_ago,
                "type": activity_type
            })
        
        return {"success": True, "data": activities}
        
    except Exception as e:
        logger.error(f"Error fetching recent activity: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/analytics")
async def get_admin_analytics(admin_id: Optional[str] = None, period: str = "30d") -> Dict[str, Any]:
    """
    Get comprehensive analytics for admin dashboard.
    Returns: total claims, total amount, average claim, active users, 
             claims breakdown by status, top category, top department.
    """
    logger.info(f"📥 GET /admin/analytics (admin_id: {admin_id}, period: {period})")
    supabase = get_supabase_client()
    
    # Determine date range based on period
    now = datetime.now()
    if period == "7d":
        start_date = now - timedelta(days=7)
    elif period == "90d":
        start_date = now - timedelta(days=90)
    elif period == "1y":
        start_date = now - timedelta(days=365)
    else:  # Default 30d
        start_date = now - timedelta(days=30)
    
    # Get previous period for trend calculation
    period_days = (now - start_date).days
    prev_start = start_date - timedelta(days=period_days)
    
    company_id = None
    if admin_id:
        try:
            comp_resp = supabase.table("companies").select("company_id").eq("admin_id", admin_id).execute()
            if comp_resp.data and len(comp_resp.data) > 0:
                company_id = comp_resp.data[0].get("company_id")
        except Exception:
            pass
    
    try:
        # 1. Fetch all reimbursements in period
        query = supabase.table("reimbursements") \
            .select("reimbursement_id, status, amount_claimed, amount_approved, user_id, category_id, department_id, created_at") \
            .gte("created_at", start_date.isoformat())
        
        if not company_id:
            return {"success": True, "data": _get_empty_analytics_data()}
        
        query = query.eq("company_id", company_id)
        
        resp = query.execute()
        current_data = resp.data or []
        
        # 2. Fetch previous period data for trends
        prev_query = supabase.table("reimbursements") \
            .select("reimbursement_id, status, amount_claimed") \
            .gte("created_at", prev_start.isoformat()) \
            .lt("created_at", start_date.isoformat())
        
        if not company_id:
            prev_data = []
        else:
            prev_query = prev_query.eq("company_id", company_id)
            prev_resp = prev_query.execute()
            prev_data = prev_resp.data or []
        
        # 3. Calculate metrics
        total_claims = len(current_data)
        prev_total_claims = len(prev_data)
        
        # Total Amount and Average Claim should only count APPROVED claims
        approved_data = [r for r in current_data if r.get("status") == "approved"]
        prev_approved_data = [r for r in prev_data if r.get("status") == "approved"]
        
        total_amount = sum(float(r.get("amount_approved") or r.get("amount_claimed") or 0) for r in approved_data)
        prev_total_amount = sum(float(r.get("amount_approved") or r.get("amount_claimed") or 0) for r in prev_approved_data)
        
        average_claim = total_amount / len(approved_data) if len(approved_data) > 0 else 0
        
        # Status breakdown
        approved_claims = len([r for r in current_data if r.get("status") == "approved"])
        pending_claims = len([r for r in current_data if r.get("status") == "pending"])
        rejected_claims = len([r for r in current_data if r.get("status") == "rejected"])
        
        # Active users (unique user_ids)
        active_users = len(set(r.get("user_id") for r in current_data if r.get("user_id")))
        
        # 4. Top Category
        category_counts = {}
        for r in current_data:
            cat_id = r.get("category_id")
            if cat_id:
                category_counts[cat_id] = category_counts.get(cat_id, 0) + 1
        
        top_category = "N/A"
        if category_counts:
            top_cat_id = max(category_counts, key=category_counts.get)
            try:
                cat_resp = supabase.table("expense_categories").select("category_name").eq("category_id", top_cat_id).single().execute()
                if cat_resp.data:
                    top_category = cat_resp.data.get("category_name", "N/A")
            except Exception:
                top_category = f"Category {top_cat_id}"
        
        # 5. Top Department
        dept_counts = {}
        for r in current_data:
            dept_id = r.get("department_id")
            if dept_id:
                dept_counts[dept_id] = dept_counts.get(dept_id, 0) + 1
        
        top_department = "N/A"
        if dept_counts:
            top_dept_id = max(dept_counts, key=dept_counts.get)
            try:
                dept_resp = supabase.table("departments").select("department_name").eq("department_id", top_dept_id).single().execute()
                if dept_resp.data:
                    top_department = dept_resp.data.get("department_name", "N/A")
            except Exception:
                top_department = f"Dept {top_dept_id}"
        
        # 6. Calculate trends
        monthly_trend = 0
        if prev_total_claims > 0:
            monthly_trend = round(((total_claims - prev_total_claims) / prev_total_claims) * 100, 1)
        elif total_claims > 0:
            monthly_trend = 100
        
        weekly_trend = 0
        if prev_total_amount > 0:
            weekly_trend = round(((total_amount - prev_total_amount) / prev_total_amount) * 100, 1)
        elif total_amount > 0:
            weekly_trend = 100

        # 7. Fetch Active Users & Managers Lists
        active_managers_count = 0
        active_users_list = []
        active_managers_list = []
        claims_list = []
        all_managers = []
        mgr_dept_map = {}  # department_id -> manager_name
        mgr_id_name_map = {}  # manager_id -> manager_name
        
        try:
            # Fetch departments for mapping (departments table has no company_id column)
            d_query = supabase.table("departments").select("department_id, department_name")
            dept_resp = d_query.execute()
            dept_map = {d["department_id"]: d["department_name"] for d in (dept_resp.data or [])}
            
            # --- Managers: query the dedicated managers table ---
            # Use select("*") to get ALL columns regardless of naming convention
            try:
                mgr_resp = supabase.table("managers") \
                    .select("*") \
                    .eq("manager_admin_id", admin_id) \
                    .execute()
                all_managers = mgr_resp.data or []
                
                # If no results with manager_admin_id, try filtering by company_id
                if not all_managers and company_id:
                    mgr_resp = supabase.table("managers") \
                        .select("*") \
                        .eq("manager_company_id", company_id) \
                        .execute()
                    all_managers = mgr_resp.data or []
                
                for m in all_managers:
                    is_active = m.get("is_active", True)
                    dept_id = m.get("manager_department_id")
                    dept_name = dept_map.get(dept_id, "Unknown")
                    # Try both possible column names for manager name
                    mgr_name = m.get("full_name") or m.get("manager_name") or "Unknown"
                    mgr_email = m.get("email") or m.get("manager_email") or ""
                    
                    if is_active:
                        mgr_dept_map[dept_id] = mgr_name
                        mgr_id_name_map[m.get("manager_id")] = mgr_name
                        active_managers_list.append({
                            "id": m.get("manager_id"),
                            "name": mgr_name,
                            "email": mgr_email,
                            "department": dept_name,
                            "status": "Active",
                            "role": "manager"
                        })
                
                active_managers_count = len(active_managers_list)
                logger.info(f"Found {active_managers_count} active managers for admin {admin_id}")
            except Exception as mgr_err:
                logger.warning(f"Error fetching managers from managers table: {mgr_err}")
            
            # --- Users: fetch all users for this admin's company ---
            # The users table has NO company_id column. Users are linked via:
            #   1. admin_id column (direct link to the admin who created them)
            #   2. manager_id -> managers table (manager_admin_id = admin_id)
            all_users = []
            seen_user_ids = set()
            
            # Method 1: Fetch users by admin_id
            if admin_id:
                u_resp_1 = supabase.table("users").select("*").eq("admin_id", admin_id).execute()
                for u in (u_resp_1.data or []):
                    uid = u.get("user_id")
                    if uid and uid not in seen_user_ids:
                        seen_user_ids.add(uid)
                        all_users.append(u)
            
            # Method 2: Fetch users via their manager_id (managers belonging to this admin)
            manager_ids = [m.get("manager_id") for m in all_managers if m.get("manager_id")]
            for mgr_id in manager_ids:
                u_resp_2 = supabase.table("users").select("*").eq("manager_id", mgr_id).execute()
                for u in (u_resp_2.data or []):
                    uid = u.get("user_id")
                    if uid and uid not in seen_user_ids:
                        seen_user_ids.add(uid)
                        all_users.append(u)
            
            # Process user list
            for u in all_users:
                # Users table uses 'status' string field, not boolean 'is_active'
                user_status = (u.get("status") or "").lower()
                if user_status not in ("active", ""):
                    continue
                dept_id = u.get("department_id")
                dept_name = dept_map.get(dept_id, "Unknown")
                mgr_id = u.get("manager_id")
                assigned_mgr = mgr_id_name_map.get(mgr_id) or mgr_dept_map.get(dept_id, "Unassigned")
                
                active_users_list.append({
                    "id": u.get("user_id"),
                    "name": u.get("full_name", "Unknown"),
                    "email": u.get("email"),
                    "department": dept_name,
                    "status": "Active",
                    "role": "employee",
                    "assigned_manager": assigned_mgr
                })
            
            # Override active_users count with actual DB count (non-admin active users)
            active_users = len(active_users_list)
            logger.info(f"Found {active_users} active users for company {company_id}")

            # --- Build Claims List for the modal ---
            # Build user_id -> name map
            user_id_name = {u.get("user_id"): u.get("full_name", "Unknown") for u in all_users}
            user_id_dept = {u.get("user_id"): u.get("department_id") for u in all_users}
            user_id_mgr = {u.get("user_id"): u.get("manager_id") for u in all_users}
            
            # Fetch ALL reimbursements for this company (not period-filtered)
            all_claims_resp = supabase.table("reimbursements") \
                .select("reimbursement_id, receipt_code, status, amount_claimed, amount_approved, user_id, department_id, created_at") \
                .eq("company_id", company_id) \
                .order("created_at", desc=True) \
                .execute()
            all_claims = all_claims_resp.data or []
            
            for c in all_claims:
                uid = c.get("user_id")
                dept_id = c.get("department_id") or user_id_dept.get(uid)
                mgr_id = user_id_mgr.get(uid)
                claims_list.append({
                    "id": c.get("receipt_code") or c.get("reimbursement_id", "")[:10],
                    "reimbursement_id": c.get("reimbursement_id"),
                    "employee_name": user_id_name.get(uid, "Unknown"),
                    "department": dept_map.get(dept_id, "Unknown"),
                    "manager": mgr_id_name_map.get(mgr_id) or mgr_dept_map.get(dept_id, "N/A"),
                    "status": c.get("status", "pending"),
                    "amount": float(c.get("amount_approved") or c.get("amount_claimed") or 0),
                    "created_at": c.get("created_at")
                })

        except Exception as user_err:
            logger.error(f"Error fetching users/managers for analytics: {user_err}")
        
        return {
            "success": True,
            "data": {
                "period": f"Last {period_days} days",
                "totalClaims": total_claims,
                "totalAmount": total_amount,
                "averageClaim": round(average_claim, 2),
                "approvedClaims": approved_claims,
                "pendingClaims": pending_claims,
                "rejectedClaims": rejected_claims,
                "topCategory": top_category,
                "topDepartment": top_department,
                "monthlyTrend": monthly_trend,
                "weeklyTrend": weekly_trend,
                "activeUsers": active_users,
                "activeManagers": active_managers_count,
                "managersList": active_managers_list,
                "usersList": active_users_list,
                "claimsList": claims_list
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching admin analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _get_empty_analytics_data() -> Dict[str, Any]:
    """Helper to return empty analytics structure."""
    return {
        "period": "N/A",
        "totalClaims": 0,
        "totalAmount": 0,
        "averageClaim": 0,
        "approvedClaims": 0,
        "pendingClaims": 0,
        "rejectedClaims": 0,
        "topCategory": "N/A",
        "topDepartment": "N/A",
        "monthlyTrend": 0,
        "weeklyTrend": 0,
        "activeUsers": 0,
        "activeManagers": 0,
        "managersList": [],
        "usersList": [],
        "claimsList": []
    }


def _get_empty_stats_data(company_name: str = "New Account") -> Dict[str, Any]:
    """Helper to return empty structure for new or unauthenticated accounts."""
    return {
        "company_name": company_name,
        "total_claims": {"value": 0, "change": "0%", "description": "This month"},
        "pending_approvals": {"value": 0, "change": "No new", "description": "Require attention"},
        "budget_utilization": {"value": 0, "change": "0%", "description": "New account"},
        "policy_violations": {"value": 0, "change": "0 resolved", "description": "This week"}
    }
