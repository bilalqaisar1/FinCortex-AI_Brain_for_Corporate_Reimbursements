"""
Category and subcategory management endpoints.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.supabase_service import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Helper: resolve company_id from admin_id
# ---------------------------------------------------------------------------
def _resolve_company_id(supabase, admin_id: str) -> Optional[str]:
    """Look up the company_id for the given admin_id."""
    try:
        resp = (
            supabase.table("companies")
            .select("company_id")
            .eq("admin_id", admin_id)
            .limit(1)
            .execute()
        )
        if resp.data:
            return resp.data[0].get("company_id")
    except Exception as e:
        logger.warning("Failed to resolve company_id for admin %s: %s", admin_id, e)
    return None


class CreateCategoryRequest(BaseModel):
    """Request to create a new category."""
    category_name: str = Field(..., min_length=1)
    description: Optional[str] = None
    admin_id: Optional[str] = None


class CreateSubcategoryRequest(BaseModel):
    """Request to create a new subcategory."""
    subcategory_name: str = Field(..., min_length=1)
    category_id: int = Field(..., description="Parent category ID")
    description: Optional[str] = None


@router.post("/categories")
async def create_category(request: CreateCategoryRequest) -> Dict[str, Any]:
    """
    Create a new expense category if it doesn't exist.
    Scoped to the admin's company via company_id.
    """
    category_name = request.category_name.strip()
    logger.info("📥 POST /categories - Request received: category_name='%s', admin_id='%s'",
                category_name, request.admin_id)

    try:
        supabase = get_supabase_client()

        # Resolve company_id for scoping
        company_id = None
        if request.admin_id:
            company_id = _resolve_company_id(supabase, request.admin_id)
            logger.info("Resolved company_id=%s for admin_id=%s", company_id, request.admin_id)

        # Check for existing category (scoped to company if available)
        try:
            query = supabase.table("expense_categories").select("category_id, category_name, company_id")
            if company_id:
                query = query.eq("company_id", company_id)
            existing = query.execute()
        except Exception as query_exc:
            logger.warning("Failed to fetch existing categories, proceeding with creation: %s", query_exc)
            existing = type("obj", (object,), {"data": []})()

        matched_category = None
        if existing.data:
            for cat in existing.data:
                if cat["category_name"].lower() == category_name.lower():
                    matched_category = cat
                    break

        if matched_category:
            response_data = {
                "success": True,
                "data": {
                    "category_id": matched_category["category_id"],
                    "category_name": matched_category["category_name"],
                    "created": False,
                },
            }
            logger.info(
                "✅ POST /categories - Category already exists: category_id=%s, category_name='%s'",
                matched_category["category_id"],
                matched_category["category_name"],
            )
            return response_data

        insert_payload: Dict[str, Any] = {
            "category_name": category_name,
        }
        if request.description:
            insert_payload["description"] = request.description
        if company_id:
            insert_payload["company_id"] = company_id
        if request.admin_id:
            insert_payload["admin_uuid"] = request.admin_id

        try:
            insert_result = supabase.table("expense_categories").insert(insert_payload).execute()

            if insert_result.data and len(insert_result.data) > 0:
                inserted_category = insert_result.data[0]
            else:
                query = (
                    supabase.table("expense_categories")
                    .select("category_id, category_name")
                    .eq("category_name", category_name)
                )
                if company_id:
                    query = query.eq("company_id", company_id)
                query_result = query.limit(1).execute()
                if not query_result.data:
                    raise Exception("Failed to retrieve inserted category")
                inserted_category = query_result.data[0]
        except Exception as insert_exc:
            logger.error("Category insert failed: %s", insert_exc)
            raise Exception(f"Failed to insert category: {str(insert_exc)}") from insert_exc

        response_data = {
            "success": True,
            "data": {
                "category_id": inserted_category["category_id"],
                "category_name": inserted_category["category_name"],
                "created": True,
            },
        }
        logger.info(
            "✅ POST /categories - Category created successfully: category_id=%s, category_name='%s'",
            inserted_category["category_id"],
            inserted_category["category_name"],
        )
        return response_data

    except Exception as exc:
        error_msg = f"Failed to create category: {str(exc)}"
        logger.error("❌ POST /categories - Error: %s", error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail=error_msg) from exc


@router.post("/subcategories")
async def create_subcategory(request: CreateSubcategoryRequest) -> Dict[str, Any]:
    """
    Create a new expense subcategory if it doesn't exist.

    Returns the created or existing subcategory ID.
    """
    subcategory_name = request.subcategory_name.strip()
    logger.info("📥 POST /subcategories - Request received: subcategory_name='%s', category_id=%s",
                subcategory_name, request.category_id)

    try:
        supabase = get_supabase_client()

        # Fetch all subcategories for this category and filter in Python
        try:
            existing = (
                supabase.table("expense_subcategories")
                .select("subcategory_id, subcategory_name, category_id")
                .eq("category_id", request.category_id)
                .execute()
            )
        except Exception as query_exc:
            logger.warning("Failed to fetch existing subcategories, proceeding with creation: %s", query_exc)
            existing = type("obj", (object,), {"data": []})()

        matched_subcat = None
        if existing.data:
            for subcat in existing.data:
                if subcat["subcategory_name"].lower() == subcategory_name.lower():
                    matched_subcat = subcat
                    break

        if matched_subcat:
            response_data = {
                "success": True,
                "data": {
                    "subcategory_id": matched_subcat["subcategory_id"],
                    "subcategory_name": matched_subcat["subcategory_name"],
                    "category_id": matched_subcat["category_id"],
                    "created": False,
                },
            }
            logger.info(
                "✅ POST /subcategories - Subcategory already exists: subcategory_id=%s, subcategory_name='%s'",
                matched_subcat["subcategory_id"],
                matched_subcat["subcategory_name"],
            )
            return response_data

        insert_payload = {
            "subcategory_name": subcategory_name,
            "category_id": request.category_id,
            "description": request.description,
        }

        try:
            insert_result = supabase.table("expense_subcategories").insert(insert_payload).execute()

            if insert_result.data and len(insert_result.data) > 0:
                inserted_subcat = insert_result.data[0]
            else:
                query_result = (
                    supabase.table("expense_subcategories")
                    .select("subcategory_id, subcategory_name, category_id")
                    .eq("subcategory_name", subcategory_name)
                    .eq("category_id", request.category_id)
                    .limit(1)
                    .execute()
                )
                if not query_result.data:
                    raise Exception("Failed to retrieve inserted subcategory")
                inserted_subcat = query_result.data[0]
        except Exception as insert_exc:
            logger.error("Subcategory insert failed: %s", insert_exc)
            raise Exception(f"Failed to insert subcategory: {str(insert_exc)}") from insert_exc

        response_data = {
            "success": True,
            "data": {
                "subcategory_id": inserted_subcat["subcategory_id"],
                "subcategory_name": inserted_subcat["subcategory_name"],
                "category_id": inserted_subcat["category_id"],
                "created": True,
            },
        }
        logger.info(
            "✅ POST /subcategories - Subcategory created successfully: subcategory_id=%s, subcategory_name='%s'",
            inserted_subcat["subcategory_id"],
            inserted_subcat["subcategory_name"],
        )
        return response_data

    except Exception as exc:
        error_msg = f"Failed to create subcategory: {str(exc)}"
        logger.error("❌ POST /subcategories - Error: %s", error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail=error_msg) from exc


@router.get("/categories")
async def get_categories(admin_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Fetch categories and their subcategories.
    Scoped by admin's company_id when admin_id is provided.
    """
    try:
        supabase = get_supabase_client()

        query = supabase.table("expense_categories").select(
            "*, subcategories:expense_subcategories(*)"
        )

        # Apply company-scoping if admin_id is provided
        if admin_id:
            company_id = _resolve_company_id(supabase, admin_id)
            if company_id:
                query = query.eq("company_id", company_id)
                logger.info("GET /categories scoped to company_id=%s", company_id)

        result = query.execute()

        return {
            "success": True,
            "data": result.data
        }
    except Exception as e:
        logger.error(f"Failed to fetch categories: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/categories/{category_id}")
async def delete_category(category_id: int, admin_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Delete a category by ID.
    Verifies company ownership if admin_id is provided.
    Cleans up all referencing tables before deleting.
    """
    try:
        supabase = get_supabase_client()

        # Verify ownership: category must belong to admin's company
        if admin_id:
            company_id = _resolve_company_id(supabase, admin_id)
            if company_id:
                cat_check = (
                    supabase.table("expense_categories")
                    .select("category_id, company_id")
                    .eq("category_id", category_id)
                    .limit(1)
                    .execute()
                )
                if cat_check.data:
                    cat_company = cat_check.data[0].get("company_id")
                    if cat_company and cat_company != company_id:
                        raise HTTPException(
                            status_code=403,
                            detail="Access denied: Category does not belong to your company"
                        )

        # 1. Nullify subcategory_id in reimbursements for all subcategories of this category
        subcats = supabase.table("expense_subcategories").select("subcategory_id").eq("category_id", category_id).execute()
        if subcats.data:
            subcat_ids = [s['subcategory_id'] for s in subcats.data]
            supabase.table("reimbursements").update({"subcategory_id": None}).in_("subcategory_id", subcat_ids).execute()
            supabase.table("reimbursement_rules").delete().in_("subcategory_id", subcat_ids).execute()

        # 2. Nullify category_id in reimbursements
        supabase.table("reimbursements").update({"category_id": None}).eq("category_id", category_id).execute()

        # 3. Delete rules for this category
        supabase.table("reimbursement_rules").delete().eq("category_id", category_id).execute()

        # 4. Nullify category_id in company_budgets
        try:
            supabase.table("company_budgets").update({"category_id": None}).eq("category_id", category_id).execute()
        except Exception as budget_err:
            logger.warning(f"Could not nullify company_budgets.category_id: {budget_err}")
            try:
                supabase.table("company_budgets").delete().eq("category_id", category_id).execute()
            except Exception as budget_del_err:
                logger.warning(f"Could not delete company_budgets rows: {budget_del_err}")

        # 5. Delete subcategories
        supabase.table("expense_subcategories").delete().eq("category_id", category_id).execute()

        # 6. Delete the category
        result = supabase.table("expense_categories").delete().eq("category_id", category_id).execute()

        if not result.data:
             return {
                "success": False,
                "message": "Category not found or already deleted"
            }

        return {
            "success": True,
            "message": "Category deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        error_str = str(e)
        logger.error(f"Failed to delete category: {e}")
        if "foreign key" in error_str.lower() or "23503" in error_str:
            raise HTTPException(
                status_code=409,
                detail="This category cannot be deleted because it is still referenced by other records (e.g., budgets or claims). Please remove those references first."
            )
        raise HTTPException(status_code=500, detail=error_str)


@router.delete("/subcategories/{subcategory_id}")
async def delete_subcategory(subcategory_id: int) -> Dict[str, Any]:
    """
    Delete a subcategory by ID.
    """
    try:
        supabase = get_supabase_client()

        # 1. Nullify subcategory_id in reimbursements
        supabase.table("reimbursements").update({"subcategory_id": None}).eq("subcategory_id", subcategory_id).execute()

        # 2. Delete rules for this subcategory
        supabase.table("reimbursement_rules").delete().eq("subcategory_id", subcategory_id).execute()

        # 3. Delete subcategory
        result = supabase.table("expense_subcategories").delete().eq("subcategory_id", subcategory_id).execute()

        if not result.data:
             raise HTTPException(status_code=404, detail="Subcategory not found")

        return {
            "success": True,
            "message": "Subcategory deleted successfully"
        }
    except Exception as e:
        logger.error(f"Failed to delete subcategory: {e}")
        raise HTTPException(status_code=500, detail=str(e))
