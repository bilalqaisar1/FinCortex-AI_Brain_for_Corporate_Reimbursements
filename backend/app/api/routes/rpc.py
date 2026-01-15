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
    get_expense_categories_with_subcategories,
    get_all_reimbursements_by_manager,
    get_reimbursement_full_detail,
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
    logger.info("📥 GET /rpc/column-data - Request received: table_name='%s', column_name='%s'", 
                table_name, column_name)
    
    try:
        result = get_column_data_json(table_name, column_name)
        response_data = {
            "success": True,
            "data": result,
        }
        logger.info("✅ GET /rpc/column-data - RPC call successful: table='%s', column='%s', values_count=%d", 
                   table_name, column_name, len(result.get("values", [])))
        logger.info("📤 GET /rpc/column-data - Final response: success=True, data keys=%s", 
                   list(result.keys()) if isinstance(result, dict) else "N/A")
        return response_data
    except SupabaseRPCError as e:
        error_msg = str(e)
        logger.error("❌ GET /rpc/column-data - RPC call failed: %s", error_msg, exc_info=True)
        logger.error("📤 GET /rpc/column-data - Error response: status_code=500, detail='%s'", error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        error_msg = f"Failed to execute RPC: {str(e)}"
        logger.error("❌ GET /rpc/column-data - Unexpected error: %s", error_msg, exc_info=True)
        logger.error("📤 GET /rpc/column-data - Error response: status_code=500, detail='%s'", error_msg)
        raise HTTPException(
            status_code=500,
            detail=error_msg
        )


@router.get("/rpc/categories-with-subcategories")
async def get_categories_with_subcategories(
    admin_uuid: str = Query(..., description="Admin UUID to scope categories"),
) -> Dict[str, Any]:
    """
    Fetch expense categories with their subcategories for a given admin.
    """
    logger.info(
        "📥 GET /rpc/categories-with-subcategories - Request received: admin_uuid='%s'",
        admin_uuid,
    )
    try:
        result = get_expense_categories_with_subcategories(admin_uuid)
        response_data = {
            "success": True,
            "data": result,
        }
        logger.info(
            "✅ GET /rpc/categories-with-subcategories - RPC call successful: admin_uuid='%s', categories=%d",
            admin_uuid,
            len(result),
        )
        logger.info(
            "📤 GET /rpc/categories-with-subcategories - Final response: success=True"
        )
        return response_data
    except SupabaseRPCError as e:
        error_msg = str(e)
        logger.error(
            "❌ GET /rpc/categories-with-subcategories - RPC call failed: %s",
            error_msg,
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        error_msg = f"Failed to fetch categories with subcategories: {str(e)}"
        logger.error(
            "❌ GET /rpc/categories-with-subcategories - Unexpected error: %s",
            error_msg,
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail=error_msg)



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
    logger.info("📥 GET /rpc/column-values - Request received: table_name='%s', column_name='%s'", 
                table_name, column_name)
    
    try:
        values = get_column_values(table_name, column_name)
        response_data = {
            "success": True,
            "data": {
                "table": table_name,
                "column": column_name,
                "values": values,
            },
        }
        logger.info("✅ GET /rpc/column-values - RPC call successful: table='%s', column='%s', values_count=%d", 
                   table_name, column_name, len(values))
        logger.info("📤 GET /rpc/column-values - Final response: success=True, values_count=%d", len(values))
        return response_data
    except SupabaseRPCError as e:
        error_msg = str(e)
        logger.error("❌ GET /rpc/column-values - RPC call failed: %s", error_msg, exc_info=True)
        logger.error("📤 GET /rpc/column-values - Error response: status_code=500, detail='%s'", error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        error_msg = f"Failed to execute RPC: {str(e)}"
        logger.error("❌ GET /rpc/column-values - Unexpected error: %s", error_msg, exc_info=True)
        logger.error("📤 GET /rpc/column-values - Error response: status_code=500, detail='%s'", error_msg)
        raise HTTPException(
            status_code=500,
            detail=error_msg
        )


@router.get("/rpc/users-by-manager")
async def get_users_by_manager_endpoint(
    manager_id: str = Query(..., description="Manager UUID to fetch team members"),
) -> Dict[str, Any]:
    """
    Get all users (team members) for a given manager.
    
    Args:
        manager_id: Manager UUID to filter users
    
    Returns:
        JSON response with users array
    
    Raises:
        HTTPException: If RPC call fails
    """
    logger.info("📥 GET /rpc/users-by-manager - Request received: manager_id='%s'", manager_id)
    
    try:
        from app.services.supabase_rpc_service import get_users_by_manager
        
        users = get_users_by_manager(manager_id)
        response_data = {
            "success": True,
            "data": {
                "manager_id": manager_id,
                "users": users,
                "count": len(users),
            },
        }
        logger.info("✅ GET /rpc/users-by-manager - RPC call successful: manager_id='%s', users_count=%d", 
                   manager_id, len(users))
        logger.info("📤 GET /rpc/users-by-manager - Final response: success=True, users_count=%d", len(users))
        return response_data
    except SupabaseRPCError as e:
        error_msg = str(e)
        logger.error("❌ GET /rpc/users-by-manager - RPC call failed: %s", error_msg, exc_info=True)
        logger.error("📤 GET /rpc/users-by-manager - Error response: status_code=500, detail='%s'", error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        error_msg = f"Failed to fetch users by manager: {str(e)}"
        logger.error("❌ GET /rpc/users-by-manager - Unexpected error: %s", error_msg, exc_info=True)
        logger.error("📤 GET /rpc/users-by-manager - Error response: status_code=500, detail='%s'", error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/rpc/managers-by-admin")
async def get_managers_by_admin_endpoint(
    admin_id: str = Query(..., description="Admin UUID to fetch managers"),
) -> Dict[str, Any]:
    """
    Get all managers for a given admin.
    
    Args:
        admin_id: Admin UUID to filter managers
    
    Returns:
        JSON response with managers array
    
    Raises:
        HTTPException: If RPC call fails
    """
    logger.info("📥 GET /rpc/managers-by-admin - Request received: admin_id='%s'", admin_id)
    
    try:
        from app.services.supabase_rpc_service import get_managers_by_admin
        
        managers = get_managers_by_admin(admin_id)
        response_data = {
            "success": True,
            "data": {
                "admin_id": admin_id,
                "managers": managers,
                "count": len(managers),
            },
        }
        logger.info("✅ GET /rpc/managers-by-admin - Successful: admin_id='%s', count=%d", 
                   admin_id, len(managers))
        return response_data
    except SupabaseRPCError as e:
        error_msg = str(e)
        logger.error("❌ GET /rpc/managers-by-admin - Failed: %s", error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        error_msg = f"Failed to fetch managers by admin: {str(e)}"
        logger.error("❌ GET /rpc/managers-by-admin - Unexpected error: %s", error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/rpc/reimbursements-by-manager")
async def get_reimbursements_by_manager_endpoint(
    manager_id: str = Query(..., description="Manager UUID to fetch reimbursements"),
) -> Dict[str, Any]:
    """
    Get all reimbursements for a given manager.

    Args:
        manager_id: Manager UUID to filter reimbursements

    Returns:
        JSON response with reimbursements array

    Raises:
        HTTPException: If RPC call fails
    """
    logger.info("📥 GET /rpc/reimbursements-by-manager - Request received: manager_id='%s'", manager_id)

    try:
        from app.services.supabase_rpc_service import get_all_reimbursements_by_manager

        reimbursements = get_all_reimbursements_by_manager(manager_id)
        response_data = {
            "success": True,
            "data": {
                "manager_id": manager_id,
                "reimbursements": reimbursements,
                "count": len(reimbursements),
            },
        }
        logger.info("✅ GET /rpc/reimbursements-by-manager - RPC call successful: manager_id='%s', count=%d",
                   manager_id, len(reimbursements))
        return response_data
    except SupabaseRPCError as e:
        error_msg = str(e)
        logger.error("❌ GET /rpc/reimbursements-by-manager - RPC call failed: %s", error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        error_msg = f"Failed to fetch reimbursements by manager: {str(e)}"
        logger.error("❌ GET /rpc/reimbursements-by-manager - Unexpected error: %s", error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/rpc/reimbursement-detail")
async def get_reimbursement_detail_endpoint(
    manager_id: str = Query(..., description="Manager UUID"),
    user_id: str = Query(..., description="User UUID (reimbursement owner)"),
    reimbursement_id: str = Query(..., description="Reimbursement UUID"),
) -> Dict[str, Any]:
    """
    Get full details of a specific reimbursement.

    Args:
        manager_id: Manager UUID
        user_id: User UUID
        reimbursement_id: Reimbursement UUID

    Returns:
        JSON response with full reimbursement details

    Raises:
        HTTPException: If RPC call fails
    """
    logger.info("📥 GET /rpc/reimbursement-detail - Request received: id='%s'", reimbursement_id)

    try:
        from app.services.supabase_rpc_service import get_reimbursement_full_detail

        detail = get_reimbursement_full_detail(manager_id, user_id, reimbursement_id)
        response_data = {
            "success": True,
            "data": detail,
        }
        logger.info("✅ GET /rpc/reimbursement-detail - RPC call successful for ID '%s'", reimbursement_id)
        return response_data
    except SupabaseRPCError as e:
        error_msg = str(e)
        logger.error("❌ GET /rpc/reimbursement-detail - RPC call failed: %s", error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        error_msg = f"Failed to fetch reimbursement details: {str(e)}"
        logger.error("❌ GET /rpc/reimbursement-detail - Unexpected error: %s", error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail=error_msg)


