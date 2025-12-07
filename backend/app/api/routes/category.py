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


class CreateCategoryRequest(BaseModel):
    """Request to create a new category."""
    category_name: str = Field(..., min_length=1)
    company_id: Optional[int] = Field(None, description="Company ID (optional)")
    description: Optional[str] = None


class CreateSubcategoryRequest(BaseModel):
    """Request to create a new subcategory."""
    subcategory_name: str = Field(..., min_length=1)
    category_id: int = Field(..., description="Parent category ID")
    description: Optional[str] = None


@router.post("/categories")
async def create_category(request: CreateCategoryRequest) -> Dict[str, Any]:
    """
    Create a new expense category if it doesn't exist.
    
    Returns the created or existing category ID.
    """
    supabase = get_supabase_client()
    
    # Check if category already exists (case-insensitive)
    existing = (
        supabase.table("expense_categories")
        .select("category_id, category_name")
        .ilike("category_name", request.category_name.strip())
        .limit(1)
        .execute()
    )
    
    if existing.data:
        # Return existing category
        category = existing.data[0]
        # Verify exact match (case-insensitive)
        if category["category_name"].lower() == request.category_name.strip().lower():
            return {
                "success": True,
                "data": {
                    "category_id": category["category_id"],
                    "category_name": category["category_name"],
                    "created": False,
                },
            }
    
    # Create new category
    try:
        insert_data = {
            "category_name": request.category_name.strip(),
            "description": request.description,
        }
        if request.company_id:
            insert_data["company_id"] = request.company_id
        
        result = (
            supabase.table("expense_categories")
            .insert(insert_data)
            .select("category_id, category_name")
            .single()
            .execute()
        )
        
        return {
            "success": True,
            "data": {
                "category_id": result.data["category_id"],
                "category_name": result.data["category_name"],
                "created": True,
            },
        }
    except Exception as exc:
        logger.error("Failed to create category: %s", exc)
        raise HTTPException(status_code=500, detail=f"Failed to create category: {str(exc)}") from exc


@router.post("/subcategories")
async def create_subcategory(request: CreateSubcategoryRequest) -> Dict[str, Any]:
    """
    Create a new expense subcategory if it doesn't exist.
    
    Returns the created or existing subcategory ID.
    """
    supabase = get_supabase_client()
    
    # Check if subcategory already exists for this category (case-insensitive)
    existing = (
        supabase.table("expense_subcategories")
        .select("subcategory_id, subcategory_name, category_id")
        .eq("category_id", request.category_id)
        .ilike("subcategory_name", request.subcategory_name.strip())
        .limit(1)
        .execute()
    )
    
    if existing.data:
        # Verify exact match (case-insensitive)
        subcat = existing.data[0]
        if subcat["subcategory_name"].lower() == request.subcategory_name.strip().lower():
            return {
                "success": True,
                "data": {
                    "subcategory_id": subcat["subcategory_id"],
                    "subcategory_name": subcat["subcategory_name"],
                    "category_id": subcat["category_id"],
                    "created": False,
                },
            }
    
    # Create new subcategory
    try:
        result = (
            supabase.table("expense_subcategories")
            .insert({
                "subcategory_name": request.subcategory_name.strip(),
                "category_id": request.category_id,
                "description": request.description,
            })
            .select("subcategory_id, subcategory_name, category_id")
            .single()
            .execute()
        )
        
        return {
            "success": True,
            "data": {
                "subcategory_id": result.data["subcategory_id"],
                "subcategory_name": result.data["subcategory_name"],
                "category_id": result.data["category_id"],
                "created": True,
            },
        }
    except Exception as exc:
        logger.error("Failed to create subcategory: %s", exc)
        raise HTTPException(status_code=500, detail=f"Failed to create subcategory: {str(exc)}") from exc

