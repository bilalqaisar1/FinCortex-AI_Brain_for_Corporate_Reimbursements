"""
Supabase RPC API routes.
Provides endpoints to call Supabase RPC functions from frontend.
"""
import logging
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Query

from app.services.supabase_rpc_service import (
    get_column_data_json,
    get_column_values,
    SupabaseRPCError,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/rpc/column-data")
async def get_column_data(
    table_name: str = Query(..., description="Name of the table"),
    column_name: str = Query(..., description="Name of the column"),
) -> Dict[str, Any]:
    """
    Get column data as JSON using Supabase RPC function.
    
    Args:
        table_name: Name of the table to query
        column_name: Name of the column to extract values from
    
    Returns:
        JSON response with table, column, and values
    
    Raises:
        HTTPException: If RPC call fails
    """
    try:
        result = get_column_data_json(table_name, column_name)
        return {
            "success": True,
            "data": result,
        }
    except SupabaseRPCError as e:
        logger.error("RPC call failed: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error in RPC endpoint: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to execute RPC: {str(e)}"
        )


@router.get("/rpc/column-values")
async def get_column_values_endpoint(
    table_name: str = Query(..., description="Name of the table"),
    column_name: str = Query(..., description="Name of the column"),
) -> Dict[str, Any]:
    """
    Get only the values array from a column using Supabase RPC.
    
    Args:
        table_name: Name of the table to query
        column_name: Name of the column to extract values from
    
    Returns:
        JSON response with values array
    
    Raises:
        HTTPException: If RPC call fails
    """
    try:
        values = get_column_values(table_name, column_name)
        return {
            "success": True,
            "data": {
                "table": table_name,
                "column": column_name,
                "values": values,
            },
        }
    except SupabaseRPCError as e:
        logger.error("RPC call failed: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error in RPC endpoint: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to execute RPC: {str(e)}"
        )


