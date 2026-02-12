
import asyncio
import logging
import sys
from datetime import datetime, timedelta

# Mock dependencies
from app.services.supabase_service import get_supabase_client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def get_policy_violations(admin_id, days=30):
    logger.info(f"📥 GET /admin/violations (admin_id: {admin_id})")
    supabase = get_supabase_client()
    
    try:
        # 1. Resolve Company ID
        company_id = None
        if admin_id:
             logger.info(f"DEBUG: Resolving company for admin {admin_id}")
             # distinct issue: maybe_single() throws 204 if used in certain ways with this client version
             # switching to limit(1) which is safer
             comp_resp = supabase.table("companies").select("company_id").eq("admin_id", admin_id).limit(1).execute()
             if comp_resp.data:
                 company_id = comp_resp.data[0].get("company_id")
        
        if not company_id:
            # Try finding via user table if admin_id is actually a user_id
             logger.info(f"DEBUG: Checking user table for admin {admin_id}")
             user_resp = supabase.table("users").select("company_id").eq("user_id", admin_id).limit(1).execute()
             if user_resp.data:
                 company_id = user_resp.data[0].get("company_id")
        
        logger.info(f"DEBUG: Resolved Company ID: {company_id}")
        
        if not company_id:
             return {"success": True, "data": []}

        # 2. Fetch reimbursements with flags (NO JOINS)
        # Calculate date threshold
        start_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        logger.info("DEBUG: Fetching reimbursements...")
        # Select specific columns to reduce risk of issues with * or hidden cols
        query = supabase.table("reimbursements") \
            .select("reimbursement_id, user_id, receipt_code, amount_claimed, flags, status, created_at, category_id") \
            .eq("company_id", company_id) \
            .not_.is_("flags", "null") \
            .gte("created_at", start_date) \
            .order("created_at", desc=True)
            
        resp = query.execute()
        reimbursements = resp.data or []
        logger.info(f"DEBUG: Fetched {len(reimbursements)} flagged reimbursements")
        
        # 3. Batch Fetch Users (Manual Join)
        user_ids = list(set([r.get("user_id") for r in reimbursements if r.get("user_id")]))
        user_map = {}
        if user_ids:
            try:
                logger.info(f"DEBUG: Fetching {len(user_ids)} users")
                # Fetch users in batch
                u_resp = supabase.table("users") \
                    .select("user_id, full_name, manager_id") \
                    .in_("user_id", user_ids) \
                    .execute()
                for u in (u_resp.data or []):
                    user_map[u["user_id"]] = u
            except Exception as e:
                logger.error(f"Error fetching users batch: {e}")

        # 4. Fetch Category Map (optimization)
        cat_map = {}
        try:
            logger.info("DEBUG: Fetching categories")
            cat_resp = supabase.table("expense_categories").select("category_id, category_name").eq("company_id", company_id).execute()
            if cat_resp.data:
                for c in cat_resp.data:
                    cat_map[c.get("category_id")] = c.get("category_name")
        except Exception:
             pass
        
        violations = []
        for r in reimbursements:
            flags = r.get("flags") or []
            
            # Manual User Join
            uid = r.get("user_id")
            user_data = user_map.get(uid, {})
            user_name = user_data.get("full_name", "Unknown User")
            
            # Handle category mapping safely
            cat_id = r.get("category_id")
            category_name = cat_map.get(cat_id, "General")
            
            # Resolve Manager Name
            manager_name = "Unknown" 

            for i, flag in enumerate(flags):
                # Map reimbursement status to violation status
                r_status = r.get("status", "pending")
                v_status = "pending"
                if r_status == "approved":
                    v_status = "resolved" 
                elif r_status == "rejected":
                    v_status = "dismissed"
                
                v_id = f"{r.get('reimbursement_id')}_{i}"
                
                def _format_time_ago(iso_timestamp: str) -> str:
                    if not iso_timestamp:
                        return "Unknown"
                    try:
                        dt = datetime.fromisoformat(iso_timestamp.replace("Z", "+00:00"))
                        delta = datetime.now(dt.tzinfo) - dt
                        if delta.days > 0:
                            return f"{delta.days} days ago"
                        hours = delta.seconds // 3600
                        if hours > 0:
                            return f"{hours} hours ago"
                        minutes = delta.seconds // 60
                        return f"{minutes} minutes ago"
                    except:
                        return iso_timestamp

                violations.append({
                    "id": v_id,
                    "userId": uid,
                    "userName": user_name,
                    "reimbursementId": r.get("receipt_code") or r.get("reimbursement_id"),
                    "amount": f"PKR {r.get('amount_claimed', 0):,.0f}",
                    "violationType": flag.get("code", "policy_breach"),
                    "description": flag.get("message", "Policy violation detected"),
                    "severity": flag.get("severity", "medium"),
                    "status": v_status,
                    "detectedAt": _format_time_ago(r.get("created_at")),
                    "category": category_name,
                    "department": "Engineering",
                    "manager": manager_name
                })
        
        logger.info(f"DEBUG: Returning {len(violations)} violations")
        return {
            "success": True, 
            "data": violations
        }

    except Exception as e:
        logger.error(f"Error fetching violations: {e}")
        import traceback
        traceback.print_exc()
        raise Exception(e)

if __name__ == "__main__":
    admin_id = "f7f0c11f-5a14-4151-a735-59faf88ad5f9"
    try:
        asyncio.run(get_policy_violations(admin_id))
        print("SUCCESS")
    except Exception as e:
        print("FAILURE")
