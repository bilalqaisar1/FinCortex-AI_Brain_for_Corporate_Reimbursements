"""
Policy Service — evaluates reimbursement claims against admin-defined rules.

Exports:
  - check_policy(claim_data: dict) -> List[dict]   # returns list of flag dicts
  - save_policy_violations(reimbursement_id, flags, supabase) -> None
"""

import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from uuid import uuid4

logger = logging.getLogger(__name__)


async def check_policy(claim_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Evaluate a claim against all active reimbursement_rules for the company/admin.
    Returns a list of flag dicts: [{code, message, severity, rule_id?}]
    """
    from app.services.supabase_service import get_supabase_client

    flags: List[Dict[str, Any]] = []

    try:
        supabase = get_supabase_client()

        company_id = claim_data.get("company_id")
        user_id = claim_data.get("user_id")
        category_id = claim_data.get("category_id")
        amount = float(claim_data.get("amount_claimed") or 0)
        vendor_name = (claim_data.get("vendor_name") or "").lower()
        description = (claim_data.get("description") or "").lower()
        items = claim_data.get("items") or []

        # Resolve admin from company
        admin_id = None
        if company_id:
            try:
                comp_resp = supabase.table("companies").select("admin_id").eq("company_id", company_id).limit(1).execute()
                if comp_resp.data:
                    admin_id = comp_resp.data[0].get("admin_id")
            except Exception as e:
                logger.warning(f"Could not resolve admin from company: {e}")

        if not admin_id:
            logger.info("check_policy: No admin_id resolved, skipping rule evaluation.")
            return flags

        # Fetch all active rules created by this admin
        rules_resp = supabase.table("reimbursement_rules") \
            .select("*") \
            .eq("created_by", admin_id) \
            .eq("is_active", True) \
            .execute()

        rules = rules_resp.data or []
        logger.info(f"check_policy: Evaluating {len(rules)} rules for admin {admin_id}")

        for rule in rules:
            rule_id = rule.get("rule_id")
            rule_name = rule.get("rule_name", "Unknown Rule")
            severity = rule.get("severity", "medium")
            rule_category_id = rule.get("category_id")

            # Skip rule if it's scoped to a different category
            if rule_category_id and category_id and str(rule_category_id) != str(category_id):
                continue

            # 1. max_amount check
            max_amount = rule.get("max_amount")
            if max_amount and float(max_amount) > 0:
                if amount > float(max_amount):
                    flags.append({
                        "code": "MAX_AMOUNT_EXCEEDED",
                        "message": f"{rule_name}: Amount PKR {amount:,.0f} exceeds max allowed PKR {float(max_amount):,.0f}",
                        "severity": severity,
                        "rule_id": str(rule_id) if rule_id else None,
                    })

            # 2. monthly_limit check (compare against current month total for user)
            monthly_limit = rule.get("monthly_limit")
            if monthly_limit and float(monthly_limit) > 0 and user_id:
                try:
                    now = datetime.now(timezone.utc)
                    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
                    monthly_resp = supabase.table("reimbursements") \
                        .select("amount_claimed") \
                        .eq("user_id", user_id) \
                        .gte("created_at", month_start) \
                        .in_("status", ["pending", "approved"]) \
                        .execute()
                    monthly_total = sum(float(r.get("amount_claimed") or 0) for r in (monthly_resp.data or []))
                    if monthly_total + amount > float(monthly_limit):
                        flags.append({
                            "code": "MONTHLY_LIMIT_EXCEEDED",
                            "message": f"{rule_name}: Monthly spend PKR {monthly_total + amount:,.0f} would exceed limit of PKR {float(monthly_limit):,.0f}",
                            "severity": severity,
                            "rule_id": str(rule_id) if rule_id else None,
                        })
                except Exception as ml_err:
                    logger.warning(f"Monthly limit check failed: {ml_err}")

            # 3. max_claims_per_day check
            max_claims_per_day = rule.get("max_claims_per_day")
            if max_claims_per_day and int(max_claims_per_day) > 0 and user_id:
                try:
                    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
                    daily_resp = supabase.table("reimbursements") \
                        .select("reimbursement_id") \
                        .eq("user_id", user_id) \
                        .gte("created_at", today_start) \
                        .execute()
                    daily_count = len(daily_resp.data or [])
                    if daily_count >= int(max_claims_per_day):
                        flags.append({
                            "code": "MAX_CLAIMS_PER_DAY_EXCEEDED",
                            "message": f"{rule_name}: {daily_count} claims submitted today exceeds daily max of {int(max_claims_per_day)}",
                            "severity": severity,
                            "rule_id": str(rule_id) if rule_id else None,
                        })
                except Exception as cd_err:
                    logger.warning(f"Daily claims check failed: {cd_err}")

            # 4. restricted_keywords check
            restricted_kw = rule.get("restricted_keywords") or ""
            if restricted_kw.strip():
                keywords = [kw.strip().lower() for kw in restricted_kw.split(",") if kw.strip()]
                text_to_check = f"{vendor_name} {description} " + " ".join(
                    (item.get("item_name") or "").lower() for item in items
                )
                matched = [kw for kw in keywords if kw in text_to_check]
                if matched:
                    flags.append({
                        "code": "RESTRICTED_KEYWORD_DETECTED",
                        "message": f"{rule_name}: Restricted keyword(s) detected — {', '.join(matched)}",
                        "severity": severity,
                        "rule_id": str(rule_id) if rule_id else None,
                    })

    except Exception as e:
        logger.error(f"check_policy error: {e}")

    return flags


async def save_policy_violations(
    reimbursement_id: str,
    flags: List[Dict[str, Any]],
    supabase: Any
) -> None:
    """
    Persist policy violation flags to the policy_violations table.
    Silently skips if table does not exist.
    """
    if not flags:
        return

    try:
        rows = []
        for flag in flags:
            rows.append({
                "violation_id": str(uuid4()),
                "reimbursement_id": reimbursement_id,
                "violation_code": flag.get("code", "POLICY_BREACH"),
                "message": flag.get("message", "Policy violation detected"),
                "severity": flag.get("severity", "medium"),
                "rule_id": flag.get("rule_id"),
                "detected_at": datetime.now(timezone.utc).isoformat(),
            })

        supabase.table("policy_violations").insert(rows).execute()
        logger.info(f"Saved {len(rows)} violations for reimbursement {reimbursement_id}")
    except Exception as e:
        # Table may not exist — non-fatal
        logger.warning(f"save_policy_violations skipped: {e}")
