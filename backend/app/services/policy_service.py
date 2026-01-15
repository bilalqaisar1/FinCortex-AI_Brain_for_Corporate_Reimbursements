
import logging
from typing import Dict, List, Any, Optional
from decimal import Decimal
from datetime import datetime, timedelta
from app.services.supabase_service import get_supabase_client

logger = logging.getLogger(__name__)

class PolicyViolation:
    RESTRICTED_ITEM = "restricted_item"
    LIMIT_EXCEEDED = "limit_exceeded"
    MAX_AMOUNT_EXCEEDED = "max_amount_exceeded"
    MAX_CLAIMS_PER_DAY = "max_claims_per_day"

async def check_policy(reimbursement_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Check a reimbursement claim against defined policies and rules.
    
    Returns:
        List of flags/warnings found.
    """
    flags = []
    category_id = reimbursement_data.get("category_id")
    subcategory_id = reimbursement_data.get("subcategory_id")
    user_id = reimbursement_data.get("user_id")
    company_id = reimbursement_data.get("company_id")
    amount_claimed = Decimal(str(reimbursement_data.get("amount_claimed", 0)))
    
    supabase = get_supabase_client()
    
    # 0. Resolve company_id if only user_id is provided
    if user_id and not company_id:
        try:
            # Attempt to fetch directly if admin_id exists (might fail if schema issue)
            try:
                user_resp = supabase.table("users").select("admin_id").eq("user_id", user_id).single().execute()
                if user_resp.data and user_resp.data.get("admin_id"):
                    company_id = user_resp.data.get("admin_id")
            except Exception:
                # If admin_id column doesn't exist or other error, ignore
                pass
                
            # Fallback: Try to find via manager linkage if user has a manager
            if not company_id:
                user_ctx = supabase.table("users").select("manager_id").eq("user_id", user_id).single().execute()
                if user_ctx.data and user_ctx.data.get("manager_id"):
                     comp_mgr = supabase.table("managers").select("company_id").eq("manager_id", user_ctx.data["manager_id"]).single().execute()
                     if comp_mgr.data:
                         company_id = comp_mgr.data.get("company_id")
        except Exception as e:
            logger.warning(f"Could not resolve company_id for user {user_id}: {e}")

    # NEW: Check Max Claims Per Day rule from policy_rules table
    await _check_max_claims_per_day(user_id, company_id, flags, supabase)

    # 1. Fetch relevant rule
    query = supabase.table("reimbursement_rules").select("*").eq("category_id", category_id)
    if subcategory_id:
        query = query.eq("subcategory_id", subcategory_id)
    
    if company_id:
        # Rules can be company specific or global (if created_by is null)
        # Try finding company specific first
        query = query.or_(f"created_by.eq.{company_id},created_by.is.null")
        query = query.order("created_by", desc=True) # Company specific (non-null) first
    
    rules_resp = query.execute()
    rule = rules_resp.data[0] if rules_resp.data else None
    
    if not rule:
        logger.warning(f"No rule found for category {category_id} and company {company_id}. Using default safety checks.")
        # We continue to check restricted items even if no rule exists
        rule = {} 

    # 2. Check Max Amount
    max_amount = Decimal(str(rule.get("max_amount", 0)))
    if max_amount > 0 and amount_claimed > max_amount:
        flags.append({
            "code": PolicyViolation.MAX_AMOUNT_EXCEEDED,
            "message": f"Claim amount PKR {amount_claimed} exceeds the maximum allowed for this category (PKR {max_amount}).",
            "severity": "high"
        })

    # 3. Check Monthly Limit
    monthly_limit = Decimal(str(rule.get("monthly_limit", 0)))
    if monthly_limit > 0:
        # Calculate current month's spending
        now = datetime.now()
        first_day = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
        
        spending_resp = supabase.table("reimbursements") \
            .select("amount_claimed") \
            .eq("user_id", user_id) \
            .eq("category_id", category_id) \
            .neq("status", "rejected") \
            .gte("created_at", first_day) \
            .execute()
        
        current_spending = sum(Decimal(str(r["amount_claimed"])) for r in spending_resp.data or [])
        if current_spending + amount_claimed > monthly_limit:
            flags.append({
                "code": PolicyViolation.LIMIT_EXCEEDED,
                "message": f"This claim would exceed your monthly limit of PKR {monthly_limit} for this category. Current spending: PKR {current_spending}.",
                "severity": "high"
            })

    # 4. Check for Restricted Items
    # Note: Using fallback if column doesn't exist yet
    restricted_keywords_str = rule.get("restricted_keywords", "")
    if not restricted_keywords_str:
        # Default safety keywords if none provided in rule
        restricted_keywords_str = "alcohol,tobacco,liquor,cigarette,spa,massage,luxury,jewelry"
        
    keywords = [k.strip().lower() for k in restricted_keywords_str.split(",") if k.strip()]
    
    # Check vendor name, description, and line items
    text_to_scan = (
        f"{reimbursement_data.get('vendor_name', '')} "
        f"{reimbursement_data.get('description', '')} "
        f"{' '.join([item.get('item_name', '') for item in reimbursement_data.get('items', [])])}"
    ).lower()
    
    found_keywords = [k for k in keywords if k in text_to_scan]
    if found_keywords:
        flags.append({
            "code": PolicyViolation.RESTRICTED_ITEM,
            "message": f"Claim contains potentially restricted items or keywords: {', '.join(found_keywords)}.",
            "severity": "critical"
        })

    return flags


async def _check_max_claims_per_day(user_id: str, company_id: Optional[str], flags: List[Dict[str, Any]], supabase) -> None:
    """
    Check if user has exceeded the maximum claims per day limit.
    Fetches the rule from policy_rules table if it exists.
    """
    if not user_id:
        return
    
    try:
        # The policy_rules table doesn't exist in the current schema.
        # This check is currently disabled until a proper table for daily limits is added.
        return
        
        if max_claims_limit <= 0:
            return
        
        # Count user's claims submitted today
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        
        today_claims_resp = supabase.table("reimbursements") \
            .select("reimbursement_id", count="exact") \
            .eq("user_id", user_id) \
            .gte("created_at", today_start) \
            .execute()
        
        today_claims_count = today_claims_resp.count or 0
        
        if today_claims_count >= max_claims_limit:
            flags.append({
                "code": PolicyViolation.MAX_CLAIMS_PER_DAY,
                "message": f"You have already submitted {today_claims_count} claims today. Maximum allowed per day is {max_claims_limit}.",
                "severity": "high"
            })
            
    except Exception as e:
        logger.warning(f"Error checking max claims per day: {e}")

