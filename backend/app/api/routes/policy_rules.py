"""
Policy Rules API routes for admin.
Allows admins to define rules that are automatically applied to claims.
"""

import logging
from typing import Any, Dict, Optional, List
from uuid import uuid4
from datetime import datetime

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
async def get_policy_rules(company_id: Optional[str] = None) -> Dict[str, Any]:
    """Get all policy rules."""
    logger.info(f"📥 GET /admin/policy-rules (company_id: {company_id})")
    supabase = get_supabase_client()
    
    try:
        query = supabase.table("reimbursement_rules").select("*")
        if company_id:
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
async def create_policy_rule(payload: CreatePolicyRuleModel = Body(...)) -> Dict[str, Any]:
    """Create a new policy rule."""
    logger.info(f"📥 POST /admin/policy-rules - Name: {payload.rule_name}, Type: {payload.rule_type}")
    supabase = get_supabase_client()
    
    try:
        reimb_rule_data = {
            "category_id": int(payload.category_id) if payload.category_id and payload.category_id.isdigit() else None,
            "created_by": payload.company_id,
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
async def update_policy_rule(rule_id: str, payload: UpdatePolicyRuleModel = Body(...)) -> Dict[str, Any]:
    """Update an existing policy rule."""
    logger.info(f"📥 PUT /admin/policy-rules/{rule_id}")
    supabase = get_supabase_client()
    
    try:
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
async def delete_policy_rule(rule_id: str) -> Dict[str, Any]:
    """Delete a policy rule."""
    logger.info(f"📥 DELETE /admin/policy-rules/{rule_id}")
    supabase = get_supabase_client()
    
    try:
        # Handle composite IDs
        actual_rule_id = rule_id.split('_')[0]
        if actual_rule_id.isdigit():
            supabase.table("reimbursement_rules").delete().eq("rule_id", int(actual_rule_id)).execute()
        
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
