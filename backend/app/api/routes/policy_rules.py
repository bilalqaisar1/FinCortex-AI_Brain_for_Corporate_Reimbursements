"""
Policy Rules API routes for admin.
Allows admins to define rules that are automatically applied to claims.
"""

import logging
from typing import Any, Dict, Optional, List
from uuid import uuid4
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field

from app.services.supabase_service import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter()


class CreatePolicyRuleModel(BaseModel):
    rule_name: str = Field(..., description="Name of the rule")
    rule_type: str = Field(..., description="Type: max_claims_per_day, max_amount, monthly_limit, restricted_keywords")
    rule_value: str = Field(..., description="Value for the rule (number or comma-separated keywords)")
    category_id: Optional[str] = Field(None, description="Optional category ID to scope rule")
    company_id: Optional[str] = Field(None, description="Optional company ID to scope rule")
    description: Optional[str] = Field(None, description="Description of the rule")
    is_active: bool = Field(default=True, description="Whether rule is active")
    severity: str = Field(default="high", description="Violation severity: low, medium, high, critical")


class UpdatePolicyRuleModel(BaseModel):
    rule_name: Optional[str] = None
    rule_type: Optional[str] = None
    rule_value: Optional[str] = None
    category_id: Optional[str] = None
    company_id: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    severity: Optional[str] = None


@router.get("/admin/policy-rules")
async def get_policy_rules(
    admin_id: Optional[str] = None,
    company_id: Optional[str] = None
) -> Dict[str, Any]:
    """Get all policy rules."""
    logger.info(f"📥 GET /admin/policy-rules (admin_id: {admin_id}, company_id: {company_id})")
    supabase = get_supabase_client()
    
    try:
        # 1. Resolve Company ID if not provided
        if not company_id and admin_id:
            logger.info(f"🔍 Resolving company for admin: {admin_id}")
            comp_resp = supabase.table("companies").select("company_id").eq("admin_id", admin_id).limit(1).execute()
            if comp_resp.data:
                company_id = comp_resp.data[0].get("company_id")
        
        # 2. Enforce company_id for security
        if not company_id:
            logger.warning("⚠️ No company_id resolved for policy rules fetch. Returning empty.")
            return {"success": True, "data": []}

        query = supabase.table("reimbursement_rules").select("*")
        query = query.eq("created_by", company_id)
        
        resp = query.order("created_at", desc=True).execute()
        
        # Transform reimbursement_rules to policy_rules format for frontend
        rules = []
        for r in (resp.data or []):
            # Monthly Limit Rule
            if r.get("monthly_limit"):
                rules.append({
                    "rule_id": str(r.get("rule_id")),
                    "rule_name": f"Monthly Limit - Category {r.get('category_id')}",
                    "rule_type": "monthly_limit",
                    "rule_value": str(r.get("monthly_limit")),
                    "category_id": str(r.get("category_id")),
                    "description": f"Monthly limit for category {r.get('category_id')}",
                    "is_active": True,
                    "severity": "high",
                    "created_at": r.get("created_at"),
                    "updated_at": r.get("updated_at")
                })
            
            # Max Amount Rule
            if r.get("max_amount"):
                rules.append({
                    "rule_id": f"{r.get('rule_id')}_max",
                    "rule_name": f"Max Amount - Category {r.get('category_id')}",
                    "rule_type": "max_amount",
                    "rule_value": str(r.get("max_amount")),
                    "category_id": str(r.get("category_id")),
                    "description": f"Maximum amount per claim for category {r.get('category_id')}",
                    "is_active": True,
                    "severity": "high",
                    "created_at": r.get("created_at"),
                    "updated_at": r.get("updated_at")
                })

            # Restricted Keywords Rule
            if r.get("restricted_keywords"):
                rules.append({
                    "rule_id": f"{r.get('rule_id')}_keywords",
                    "rule_name": f"Restricted Keywords - Category {r.get('category_id')}",
                    "rule_type": "restricted_keywords",
                    "rule_value": r.get("restricted_keywords"),
                    "category_id": str(r.get("category_id")),
                    "description": f"Restricted items for category {r.get('category_id')}",
                    "is_active": True,
                    "severity": "critical",
                    "created_at": r.get("created_at"),
                    "updated_at": r.get("updated_at")
                })
        
        return {"success": True, "data": rules}
        
    except Exception as e:
        logger.error(f"Error fetching policy rules: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/policy-rules")
async def create_policy_rule(
    payload: CreatePolicyRuleModel = Body(...),
    admin_id: Optional[str] = None
) -> Dict[str, Any]:
    """Create a new policy rule."""
    logger.info(f"📥 POST /admin/policy-rules - Name: {payload.rule_name}, Type: {payload.rule_type}")
    supabase = get_supabase_client()
    
    try:
        company_id = payload.company_id
        # 1. Resolve Company ID from admin_id if not in payload
        if not company_id and admin_id:
             comp_resp = supabase.table("companies").select("company_id").eq("admin_id", admin_id).limit(1).execute()
             if comp_resp.data:
                 company_id = comp_resp.data[0].get("company_id")
        
        if not company_id:
            raise HTTPException(status_code=400, detail="Company ID or Admin ID is required to create a rule")

        reimb_rule_data = {
            "category_id": int(payload.category_id) if payload.category_id and payload.category_id.isdigit() else None,
            "created_by": company_id,
            "updated_at": datetime.now().isoformat()
        }
        
        if payload.rule_type == "max_amount":
            reimb_rule_data["max_amount"] = float(payload.rule_value)
        elif payload.rule_type == "monthly_limit":
            reimb_rule_data["monthly_limit"] = float(payload.rule_value)
        elif payload.rule_type == "restricted_keywords":
            reimb_rule_data["restricted_keywords"] = payload.rule_value
        
        resp = supabase.table("reimbursement_rules").insert(reimb_rule_data).execute()
        if not resp.data:
            raise HTTPException(status_code=500, detail="Failed to create reimbursement rule")
            
        return {
            "success": True,
            "message": "Policy rule created successfully",
            "data": resp.data[0]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating policy rule: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/admin/policy-rules/{rule_id}")
async def update_policy_rule(
    rule_id: str, 
    payload: UpdatePolicyRuleModel = Body(...),
    admin_id: Optional[str] = None
) -> Dict[Dict[str, Any], Any]:
    """Update an existing policy rule."""
    logger.info(f"📥 PUT /admin/policy-rules/{rule_id} (admin_id: {admin_id})")
    supabase = get_supabase_client()
    
    try:
        # 1. Resolve Company ID from admin_id
        company_id = payload.company_id
        if not company_id and admin_id:
             comp_resp = supabase.table("companies").select("company_id").eq("admin_id", admin_id).limit(1).execute()
             if comp_resp.data:
                 company_id = comp_resp.data[0].get("company_id")
        
        if not company_id:
            raise HTTPException(status_code=400, detail="Company ID or Admin ID is required to verify ownership")

        # 2. Get actual rule ID (supporting composite IDs)
        if rule_id.isdigit():
            actual_rule_id = int(rule_id)
        else:
            actual_rule_id = int(rule_id.split('_')[0])

        # 3. Verify ownership
        rule_check = supabase.table("reimbursement_rules").select("created_by").eq("rule_id", actual_rule_id).single().execute()
        if not rule_check.data or rule_check.data.get("created_by") != company_id:
            logger.warning(f"⚠️ Security: Admin {admin_id} tried to update rule {actual_rule_id} belonging to another company")
            raise HTTPException(status_code=403, detail="Access denied: Rule does not belong to your organization")

        update_data = {"updated_at": datetime.now().isoformat()}
        
        if payload.rule_name is not None:
            update_data["rule_name"] = payload.rule_name
        if payload.rule_type is not None:
            update_data["rule_type"] = payload.rule_type
        if payload.rule_value is not None:
            update_data["rule_value"] = payload.rule_value
        if payload.category_id is not None:
            update_data["category_id"] = payload.category_id
        if payload.description is not None:
            update_data["description"] = payload.description
        if payload.is_active is not None:
            update_data["is_active"] = payload.is_active
        if payload.severity is not None:
            update_data["severity"] = payload.severity
        
        if rule_id.isdigit():
            actual_rule_id = int(rule_id)
        else:
            # Handle the composite IDs created in get_policy_rules (e.g. "1_max")
            actual_rule_id = int(rule_id.split('_')[0])

        reimb_update = {"updated_at": update_data["updated_at"]}
        if payload.category_id is not None:
            reimb_update["category_id"] = int(payload.category_id) if payload.category_id.isdigit() else None
        
        if payload.rule_value is not None:
            if payload.rule_type == "max_amount" or "max" in rule_id:
                reimb_update["max_amount"] = float(payload.rule_value)
            elif payload.rule_type == "monthly_limit" or "keywords" not in rule_id:
                reimb_update["monthly_limit"] = float(payload.rule_value)
            elif payload.rule_type == "restricted_keywords" or "keywords" in rule_id:
                reimb_update["restricted_keywords"] = payload.rule_value
        
        resp = supabase.table("reimbursement_rules").update(reimb_update).eq("rule_id", actual_rule_id).execute()
        
        if not resp.data:
            raise HTTPException(status_code=404, detail="Policy rule not found")
        
        return {
            "success": True,
            "message": "Policy rule updated successfully",
            "data": resp.data[0]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating policy rule: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/admin/policy-rules/{rule_id}")
async def delete_policy_rule(rule_id: str, admin_id: Optional[str] = None) -> Dict[str, Any]:
    """Delete a policy rule."""
    logger.info(f"📥 DELETE /admin/policy-rules/{rule_id} (admin_id: {admin_id})")
    supabase = get_supabase_client()
    
    try:
        if not admin_id:
             raise HTTPException(status_code=400, detail="Admin ID is required to verify ownership")
             
        # 1. Resolve Company ID from admin_id
        comp_resp = supabase.table("companies").select("company_id").eq("admin_id", admin_id).limit(1).execute()
        if not comp_resp.data:
            raise HTTPException(status_code=404, detail="Company not found for this admin")
        company_id = comp_resp.data[0].get("company_id")

        # 2. Get actual rule ID (supporting composite IDs)
        actual_rule_id_str = rule_id.split('_')[0]
        if not actual_rule_id_str.isdigit():
            raise HTTPException(status_code=400, detail="Invalid rule ID format")
        actual_rule_id = int(actual_rule_id_str)

        # 3. Verify ownership
        rule_check = supabase.table("reimbursement_rules").select("created_by").eq("rule_id", actual_rule_id).single().execute()
        if not rule_check.data or rule_check.data.get("created_by") != company_id:
            logger.warning(f"⚠️ Security: Admin {admin_id} tried to delete rule {actual_rule_id} belonging to another company")
            raise HTTPException(status_code=403, detail="Access denied: Rule does not belong to your organization")
            
        supabase.table("reimbursement_rules").delete().eq("rule_id", actual_rule_id).execute()
        
        return {
            "success": True,
            "message": "Policy rule deleted successfully"
        }
        
    except Exception as e:
        logger.error(f"Error deleting policy rule: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/policy-rules/types")
async def get_rule_types() -> Dict[str, Any]:
    """Get available policy rule types."""
    return {
        "success": True,
        "data": [
            {
                "type": "max_claims_per_day",
                "label": "Max Claims Per Day",
                "description": "Maximum number of claims a user can submit per day",
                "value_type": "number",
                "example": "3"
            },
            {
                "type": "max_amount",
                "label": "Maximum Amount",
                "description": "Maximum amount allowed per claim",
                "value_type": "number",
                "example": "50000"
            },
            {
                "type": "monthly_limit",
                "label": "Monthly Spending Limit",
                "description": "Maximum total spending per month per category",
                "value_type": "number",
                "example": "100000"
            },
            {
                "type": "restricted_keywords",
                "label": "Restricted Keywords",
                "description": "Comma-separated list of blocked items/vendors",
                "value_type": "text",
                "example": "alcohol,tobacco,luxury,spa"
            }
        ]
    }


@router.get("/admin/violations")
async def get_policy_violations(
    admin_id: Optional[str] = None,
    days: int = 30
) -> Dict[str, Any]:
    """
    Get a list of policy violations derived from reimbursement flags.
    """
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
        raise HTTPException(status_code=500, detail=str(e))

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
