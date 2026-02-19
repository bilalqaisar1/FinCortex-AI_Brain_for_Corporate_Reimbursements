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
    department_id: Optional[str] = Field(None, description="Optional department ID; null means all departments")
    company_id: Optional[str] = Field(None, description="Optional company ID to scope rule")
    description: Optional[str] = Field(None, description="Description of the rule")
    is_active: bool = Field(default=True, description="Whether rule is active")
    severity: str = Field(default="high", description="Violation severity: low, medium, high, critical")


class UpdatePolicyRuleModel(BaseModel):
    rule_name: Optional[str] = None
    rule_type: Optional[str] = None
    rule_value: Optional[str] = None
    category_id: Optional[str] = None
    department_id: Optional[str] = None
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
        # 1. Resolve admin_id (created_by references admins table)
        if not admin_id:
            logger.warning("⚠️ No admin_id provided for policy rules fetch. Returning empty.")
            return {"success": True, "data": []}

        query = supabase.table("reimbursement_rules").select("*")
        query = query.eq("created_by", admin_id)
        
        resp = query.order("created_at", desc=True).execute()
        
        # Transform reimbursement_rules to policy_rules format for frontend
        rules = []
        for r in (resp.data or []):
            stored_name = r.get("rule_name") or ""
            stored_severity = r.get("severity") or "high"
            stored_is_active = r.get("is_active") if r.get("is_active") is not None else True
            stored_description = r.get("description") or ""
            dept_id = r.get("department_id")
            cat_id = r.get("category_id")
            
            # Determine rule_type and rule_value from the data
            rule_type = None
            rule_value = "0"
            
            mcpd = r.get("max_claims_per_day") or 0
            max_amt = float(r.get("max_amount") or 0)
            monthly = float(r.get("monthly_limit") or 0)
            keywords = (r.get("restricted_keywords") or "").strip()
            
            if mcpd and int(mcpd) > 0:
                rule_type = "max_claims_per_day"
                rule_value = str(int(mcpd))
            elif max_amt > 0:
                rule_type = "max_amount"
                rule_value = str(max_amt)
            elif monthly > 0:
                rule_type = "monthly_limit"
                rule_value = str(monthly)
            elif keywords:
                rule_type = "restricted_keywords"
                rule_value = keywords
            elif stored_name:
                # Fallback: rule exists with metadata but no recognizable value
                rule_type = "max_amount"
                rule_value = "0"
            else:
                continue  # Skip rows with no useful data
            
            # Auto-generate name if not stored
            if not stored_name:
                type_labels = {
                    "max_claims_per_day": "Max Claims Per Day",
                    "max_amount": f"Max Amount - Category {cat_id}",
                    "monthly_limit": f"Monthly Limit - Category {cat_id}",
                    "restricted_keywords": f"Restricted Keywords",
                }
                stored_name = type_labels.get(rule_type, "Policy Rule")
            
            rules.append({
                "rule_id": str(r.get("rule_id")),
                "rule_name": stored_name,
                "rule_type": rule_type,
                "rule_value": rule_value,
                "category_id": str(cat_id) if cat_id else None,
                "department_id": str(dept_id) if dept_id else None,
                "description": stored_description,
                "is_active": stored_is_active,
                "severity": stored_severity,
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
        # 1. Resolve admin_id for created_by (FK to admins table)
        if not admin_id:
            raise HTTPException(status_code=400, detail="Admin ID is required to create a rule")

        # Build insert payload aligned to actual DB columns
        reimb_rule_data = {
            # NOT NULL columns with defaults
            "max_amount": 0,
            "monthly_limit": 0,
            # Nullable columns
            "category_id": int(payload.category_id) if payload.category_id and payload.category_id.isdigit() else None,
            "department_id": int(payload.department_id) if payload.department_id and payload.department_id.isdigit() else None,
            "restricted_keywords": "",
            "max_claims_per_day": 0,
            "created_by": admin_id,
            "updated_at": datetime.now().isoformat(),
            # Metadata columns (added via ALTER)
            "rule_name": payload.rule_name,
            "description": payload.description or "",
            "severity": payload.severity,
            "is_active": payload.is_active,
        }
        
        # Set the rule-type-specific value
        if payload.rule_type == "max_amount":
            reimb_rule_data["max_amount"] = float(payload.rule_value)
        elif payload.rule_type == "monthly_limit":
            reimb_rule_data["monthly_limit"] = float(payload.rule_value)
        elif payload.rule_type == "restricted_keywords":
            reimb_rule_data["restricted_keywords"] = payload.rule_value
        elif payload.rule_type == "max_claims_per_day":
            reimb_rule_data["max_claims_per_day"] = int(payload.rule_value)
        
        logger.info(f"Inserting rule data: {reimb_rule_data}")
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
) -> Dict[str, Any]:
    """Update an existing policy rule."""
    logger.info(f"📥 PUT /admin/policy-rules/{rule_id} (admin_id: {admin_id})")
    supabase = get_supabase_client()
    
    try:
        # 1. Verify admin_id is provided (created_by FK to admins table)
        if not admin_id:
            raise HTTPException(status_code=400, detail="Admin ID is required to verify ownership")

        # 2. Get actual rule ID (supporting composite IDs)
        if rule_id.isdigit():
            actual_rule_id = int(rule_id)
        else:
            actual_rule_id = int(rule_id.split('_')[0])

        # 3. Verify ownership (created_by could be admin_id or company_id for older rules)
        rule_check = supabase.table("reimbursement_rules").select("created_by").eq("rule_id", actual_rule_id).single().execute()
        if not rule_check.data:
            raise HTTPException(status_code=404, detail="Rule not found")
        
        rule_owner = rule_check.data.get("created_by")
        # Allow if created_by matches admin_id directly, OR if the rule belongs to the admin's company
        is_owner = (rule_owner == admin_id)
        if not is_owner:
            # Check if rule was created by admin's company_id (backward compat)
            comp_resp = supabase.table("companies").select("company_id").eq("admin_id", admin_id).limit(1).execute()
            company_id = comp_resp.data[0].get("company_id") if comp_resp.data else None
            is_owner = (rule_owner == company_id)
        
        if not is_owner:
            logger.warning(f"⚠️ Security: Admin {admin_id} tried to update rule {actual_rule_id} belonging to another admin")
            raise HTTPException(status_code=403, detail="Access denied: Rule does not belong to your organization")

        reimb_update = {"updated_at": datetime.now().isoformat()}
        
        # Metadata columns
        if payload.rule_name is not None:
            reimb_update["rule_name"] = payload.rule_name
        if payload.description is not None:
            reimb_update["description"] = payload.description
        if payload.is_active is not None:
            reimb_update["is_active"] = payload.is_active
        if payload.severity is not None:
            reimb_update["severity"] = payload.severity
        if payload.category_id is not None:
            reimb_update["category_id"] = int(payload.category_id) if payload.category_id.isdigit() else None
        if payload.department_id is not None:
            reimb_update["department_id"] = int(payload.department_id) if payload.department_id and payload.department_id.isdigit() else None
        
        # Rule value mapped to correct DB column based on rule_type
        if payload.rule_value is not None and payload.rule_type is not None:
            # Reset all rule value columns first, then set the active one
            reimb_update["max_amount"] = 0
            reimb_update["monthly_limit"] = 0
            reimb_update["restricted_keywords"] = ""
            reimb_update["max_claims_per_day"] = 0
            
            if payload.rule_type == "max_amount":
                reimb_update["max_amount"] = float(payload.rule_value)
            elif payload.rule_type == "monthly_limit":
                reimb_update["monthly_limit"] = float(payload.rule_value)
            elif payload.rule_type == "restricted_keywords":
                reimb_update["restricted_keywords"] = payload.rule_value
            elif payload.rule_type == "max_claims_per_day":
                reimb_update["max_claims_per_day"] = int(payload.rule_value)
        
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
             
        # 1. Resolve Company ID from admin_id for backward compat ownership check
        comp_resp = supabase.table("companies").select("company_id").eq("admin_id", admin_id).limit(1).execute()
        company_id = comp_resp.data[0].get("company_id") if comp_resp.data else None

        # 2. Get actual rule ID (supporting composite IDs)
        actual_rule_id_str = rule_id.split('_')[0]
        if not actual_rule_id_str.isdigit():
            raise HTTPException(status_code=400, detail="Invalid rule ID format")
        actual_rule_id = int(actual_rule_id_str)

        # 3. Verify ownership (created_by could be admin_id or company_id for older rules)
        rule_check = supabase.table("reimbursement_rules").select("created_by").eq("rule_id", actual_rule_id).single().execute()
        if not rule_check.data:
            raise HTTPException(status_code=404, detail="Rule not found")
        
        rule_owner = rule_check.data.get("created_by")
        if rule_owner != admin_id and rule_owner != company_id:
            logger.warning(f"⚠️ Security: Admin {admin_id} tried to delete rule {actual_rule_id} belonging to another admin")
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
        # NOTE: Filter policy_flags != null in Python to avoid Supabase client JSONB filter issues
        query = supabase.table("reimbursements") \
            .select("reimbursement_id, user_id, receipt_code, amount_claimed, flags, status, created_at, category_id") \
            .eq("company_id", company_id) \
            .gte("created_at", start_date) \
            .order("created_at", desc=True)
            
        resp = query.execute()
        # Filter out reimbursements without policy flags in Python
        reimbursements = [r for r in (resp.data or []) if r.get("flags")]
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
