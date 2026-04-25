"""
Supabase RPC (Remote Procedure Call) service.
Handles calling PostgreSQL functions via Supabase.
"""
import logging
from typing import Any, Dict, List, Optional

from postgrest import APIError

from app.services.supabase_service import get_supabase_client

logger = logging.getLogger(__name__)


class SupabaseRPCError(Exception):
    """Custom exception for Supabase RPC errors."""
    pass


def get_column_data_json(table_name: str, column_name: str) -> Dict[str, Any]:
    """
    Call Supabase RPC function to get column data as JSON.
    
    This function calls the PostgreSQL function:
    get_column_data_json(table_name text, column_name text)
    
    Args:
        table_name: Name of the table to query
        column_name: Name of the column to extract values from
    
    Returns:
        Dictionary with structure:
        {
            "table": table_name,
            "column": column_name,
            "values": [list of values as strings]
        }
    
    Raises:
        SupabaseRPCError: If RPC call fails
    """
    try:
        supabase = get_supabase_client()
        
        # Call the RPC function
        response = supabase.rpc(
            "get_column_data_json",
            {
                "table_name": table_name,
                "column_name": column_name,
            }
        ).execute()
        
        # Supabase RPC returns data directly (not wrapped in response.data)
        result = response.data if hasattr(response, 'data') else response
        
        # Handle case where result might be a list with one element
        if isinstance(result, list) and len(result) > 0:
            result = result[0]
        
        # Validate result structure
        if not isinstance(result, dict):
            raise SupabaseRPCError(f"Unexpected RPC response format: {type(result)}")
        
        # Ensure values is a list
        if "values" in result and result["values"] is None:
            result["values"] = []
        
        logger.info("✅ Supabase RPC: get_column_data_json successful for %s.%s", table_name, column_name)
        
        # DEBUG: Print final output to terminal
        import json
        print("\n" + "="*80)
        print("🔍 DEBUG - RPC get_column_data_json FINAL OUTPUT")
        print("="*80)
        print(f"Table: {result.get('table', 'N/A')}")
        print(f"Column: {result.get('column', 'N/A')}")
        print(f"Values Count: {len(result.get('values', []))}")
        print(f"\nValues List:")
        print("-" * 80)
        values = result.get("values", [])
        for i, value in enumerate(values, 1):
            print(f"  {i:3d}. {value}")
        print("-" * 80)
        print(f"\n📤 Complete JSON Response:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        print("="*80 + "\n")
        
        return result
        
    except APIError as e:
        error_msg = f"Supabase RPC API error: {str(e)}"
        logger.error("❌ Supabase RPC: API error - %s", error_msg)
        raise SupabaseRPCError(error_msg) from e
    except Exception as e:
        error_msg = f"Unexpected error calling Supabase RPC: {str(e)}"
        logger.error("❌ Supabase RPC: Unexpected error - %s", error_msg)
        raise SupabaseRPCError(error_msg) from e


def get_column_values(table_name: str, column_name: str) -> List[str]:
    """
    Convenience function to get only the values array from get_column_data_json.
    
    Args:
        table_name: Name of the table to query
        column_name: Name of the column to extract values from
    
    Returns:
        List of string values from the column
    
    Raises:
        SupabaseRPCError: If RPC call fails
    """
    result = get_column_data_json(table_name, column_name)
    values = result.get("values", [])
    
    # Ensure all values are strings
    final_values = [str(v) if v is not None else "" for v in values]
    
    # DEBUG: Print final output to terminal
    print("\n" + "="*80)
    print("🔍 DEBUG - RPC get_column_values FINAL OUTPUT")
    print("="*80)
    print(f"Table: {table_name}")
    print(f"Column: {column_name}")
    print(f"Values Count: {len(final_values)}")
    print(f"\nValues List:")
    print("-" * 80)
    for i, value in enumerate(final_values, 1):
        print(f"  {i:3d}. {value}")
    print("="*80 + "\n")
    
    return final_values


def get_expense_categories_with_subcategories(admin_uuid: str) -> List[Dict[str, Any]]:
    """
    Fetch expense categories and their subcategories for a given admin.

    Calls the RPC function:
        get_expense_categories_with_subcategories(p_admin_uuid uuid)

    Args:
        admin_uuid: Admin UUID to filter categories.

    Returns:
        List of dicts: [{category_id, category_name, subcategories: [{subcategory_id, subcategory_name}]}]

    Raises:
        SupabaseRPCError: If the RPC call fails or returns unexpected data.
    """
    try:
        supabase = get_supabase_client()

        response = supabase.rpc(
            "get_expense_categories_with_subcategories",
            {"p_admin_uuid": admin_uuid},
        ).execute()

        result = response.data if hasattr(response, "data") else response

        if result is None:
            result = []

        if not isinstance(result, list):
            raise SupabaseRPCError(f"Unexpected RPC response format: {type(result)}")

        logger.info(
            "✅ Supabase RPC: get_expense_categories_with_subcategories successful for admin %s",
            admin_uuid,
        )

        # DEBUG: Print final output to terminal
        import json

        print("\n" + "=" * 80)
        print("🔍 DEBUG - RPC get_expense_categories_with_subcategories FINAL OUTPUT")
        print("=" * 80)
        print(f"Admin UUID: {admin_uuid}")
        print(f"Categories Count: {len(result)}")
        print("\nCategories:")
        print("-" * 80)
        for i, cat in enumerate(result, 1):
            print(f"  {i:3d}. {cat.get('category_name')} (ID: {cat.get('category_id')})")
            subs = cat.get("subcategories") or []
            print(f"       Subcategories ({len(subs)}):")
            for sub in subs:
                print(
                    f"         - {sub.get('subcategory_name')} (ID: {sub.get('subcategory_id')})"
                )
        print("-" * 80)
        print("\n📤 Complete JSON Response:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        print("=" * 80 + "\n")

        return result

    except APIError as e:
        error_msg = f"Supabase RPC API error: {str(e)}"
        logger.error("❌ Supabase RPC: API error - %s", error_msg)
        raise SupabaseRPCError(error_msg) from e
    except Exception as e:
        error_msg = f"Unexpected error calling Supabase RPC: {str(e)}"
        logger.error("❌ Supabase RPC: Unexpected error - %s", error_msg)
        raise SupabaseRPCError(error_msg) from e


def get_categories_direct(admin_uuid: str) -> List[Dict[str, Any]]:
    """
    Fetch expense categories and subcategories using direct table queries.

    This is a fallback/replacement for the RPC approach. It queries
    ``expense_categories`` filtered by ``admin_uuid``, then falls back to
    ``company_id``-based filtering (resolving the admin's company).

    **IMPORTANT**: This does NOT fall back to ALL categories to prevent
    cross-company data leakage. If no categories are found for the admin's
    company, an empty list is returned.

    Returns a list identical in shape to the RPC variant::

        [
            {
                "category_id": 1,
                "category_name": "Medical",
                "subcategories": [
                    {"subcategory_id": 10, "subcategory_name": "Lab Tests"},
                    ...
                ]
            },
            ...
        ]
    """
    try:
        supabase = get_supabase_client()

        # 1) Try to fetch categories scoped to this admin via admin_uuid
        resp = (
            supabase.table("expense_categories")
            .select("category_id, category_name, admin_uuid, company_id, subcategories:expense_subcategories(subcategory_id, subcategory_name)")
            .eq("admin_uuid", admin_uuid)
            .execute()
        )
        categories = resp.data or []

        # 2) If admin_uuid match returned nothing, try company_id-based filtering
        #    (categories may have been created with company_id but not admin_uuid)
        if not categories:
            logger.info(
                "No categories found for admin_uuid=%s; trying company_id-based lookup.",
                admin_uuid,
            )
            # Resolve company_id from admin_uuid
            comp_resp = (
                supabase.table("companies")
                .select("company_id")
                .eq("admin_id", admin_uuid)
                .limit(1)
                .execute()
            )
            if comp_resp.data:
                company_id = comp_resp.data[0].get("company_id")
                if company_id:
                    resp = (
                        supabase.table("expense_categories")
                        .select("category_id, category_name, admin_uuid, company_id, subcategories:expense_subcategories(subcategory_id, subcategory_name)")
                        .eq("company_id", company_id)
                        .execute()
                    )
                    categories = resp.data or []

        # 3) NO FALLBACK to ALL categories — this prevents cross-company leakage
        if not categories:
            logger.warning(
                "⚠️ No categories found for admin_uuid=%s (neither admin_uuid nor company_id match). "
                "Returning empty list to prevent data leakage.",
                admin_uuid,
            )

        logger.info(
            "✅ get_categories_direct: found %d categories for admin %s",
            len(categories),
            admin_uuid,
        )

        # DEBUG output
        import json
        print("\n" + "=" * 80)
        print("🔍 DEBUG - get_categories_direct OUTPUT")
        print("=" * 80)
        print(f"Admin UUID: {admin_uuid}")
        print(f"Categories Count: {len(categories)}")
        for i, cat in enumerate(categories, 1):
            subs = cat.get("subcategories") or []
            print(f"  {i}. {cat.get('category_name')} (ID: {cat.get('category_id')}) – {len(subs)} subcategories")
            for sub in subs:
                print(f"       - {sub.get('subcategory_name')} (ID: {sub.get('subcategory_id')})")
        print("=" * 80 + "\n")

        return categories

    except Exception as e:
        error_msg = f"get_categories_direct failed: {str(e)}"
        logger.error("❌ %s", error_msg)
        raise SupabaseRPCError(error_msg) from e


def get_users_by_manager(manager_id: str) -> List[Dict[str, Any]]:
    """
    Fetch users (team members) for a given manager.

    Calls the RPC function:
        get_users_by_manager(p_manager_id uuid)

    Args:
        manager_id: Manager UUID to filter users.

    Returns:
        List of dicts with user data including admin, company, and department info.

    Raises:
        SupabaseRPCError: If the RPC call fails or returns unexpected data.
    """
    try:
        supabase = get_supabase_client()

        response = supabase.rpc(
            "get_users_by_manager",
            {"p_manager_id": manager_id},
        ).execute()

        result = response.data if hasattr(response, "data") else response

        if result is None:
            result = []

        # Handle nested response structure [{"get_users_by_manager": [...]}]
        if isinstance(result, list) and len(result) > 0 and isinstance(result[0], dict):
            if "get_users_by_manager" in result[0]:
                result = result[0]["get_users_by_manager"]

        if not isinstance(result, list):
            raise SupabaseRPCError(f"Unexpected RPC response format: {type(result)}")

        logger.info(
            "✅ Supabase RPC: get_users_by_manager successful for manager %s",
            manager_id,
        )

        # DEBUG: Print final output to terminal
        import json

        print("\n" + "=" * 80)
        print("🔍 DEBUG - RPC get_users_by_manager FINAL OUTPUT")
        print("=" * 80)
        print(f"Manager ID: {manager_id}")
        print(f"Users Count: {len(result)}")
        print("\nTeam Members:")
        print("-" * 80)
        for i, user in enumerate(result, 1):
            print(f"  {i:3d}. {user.get('full_name')} ({user.get('email')})")
            print(f"       Employee Code: {user.get('employee_code') or 'N/A'}")
            print(f"       Department: {user.get('department', {}).get('department_name') or 'N/A'}")
            print(f"       Status: {user.get('status') or 'N/A'}")
        print("-" * 80)
        print("\n📤 Complete JSON Response:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        print("=" * 80 + "\n")

        return result

    except APIError as e:
        error_msg = f"Supabase RPC API error: {str(e)}"
        logger.error("❌ Supabase RPC: API error - %s", error_msg)
        raise SupabaseRPCError(error_msg) from e
    except Exception as e:
        error_msg = f"Unexpected error calling Supabase RPC: {str(e)}"
        logger.error("❌ Supabase RPC: Unexpected error - %s", error_msg)
        raise SupabaseRPCError(error_msg) from e



def get_all_reimbursements_by_manager(manager_id: str) -> List[Dict[str, Any]]:
    """
    Fetch all reimbursements for a given manager.

    Calls the RPC function:
        get_all_reimbursements_by_manager(p_manager_id uuid)

    Args:
        manager_id: Manager UUID to filter reimbursements.

    Returns:
        List of dicts with reimbursement data.

    Raises:
        SupabaseRPCError: If the RPC call fails or returns unexpected data.
    """
    try:
        supabase = get_supabase_client()

        response = supabase.rpc(
            "get_all_reimbursements_by_manager",
            {"p_manager_id": manager_id},
        ).execute()

        result = response.data if hasattr(response, "data") else response

        if result is None:
            result = []

        if not isinstance(result, list):
            raise SupabaseRPCError(f"Unexpected RPC response format: {type(result)}")

        # Supplement with flags from the reimbursements table
        # (RPC stored procedure may not return this column)
        try:
            reimb_ids = [r.get("reimbursement_id") for r in result if r.get("reimbursement_id")]
            if reimb_ids:
                flags_resp = supabase.table("reimbursements").select(
                    "reimbursement_id, flags"
                ).in_("reimbursement_id", reimb_ids).execute()
                flags_map = {
                    row["reimbursement_id"]: row.get("flags")
                    for row in (flags_resp.data or [])
                }
                for r in result:
                    rid = r.get("reimbursement_id")
                    if rid and rid in flags_map:
                        r["policy_flags"] = flags_map[rid]
                    elif "policy_flags" not in r:
                        r["policy_flags"] = None
        except Exception as flags_err:
            logger.warning("Could not supplement policy_flags: %s", flags_err)

        logger.info(
            "✅ Supabase RPC: get_all_reimbursements_by_manager successful for manager %s",
            manager_id,
        )

        return result

    except APIError as e:
        error_msg = f"Supabase RPC API error: {str(e)}"
        logger.error("❌ Supabase RPC: API error - %s", error_msg)
        raise SupabaseRPCError(error_msg) from e
    except Exception as e:
        error_msg = f"Unexpected error calling Supabase RPC: {str(e)}"
        logger.error("❌ Supabase RPC: Unexpected error - %s", error_msg)
        raise SupabaseRPCError(error_msg) from e



def get_reimbursement_full_detail(manager_id: str, user_id: str, reimbursement_id: str) -> Dict[str, Any]:
    """
    Fetch full details of a specific reimbursement.

    Calls the RPC function:
        get_reimbursement_full_detail(p_manager_id, p_user_id, p_reimbursement_id)

    Args:
        manager_id: Manager UUID
        user_id: User UUID (owner of reimbursement)
        reimbursement_id: UUID of the reimbursement

    Returns:
        Dict with full reimbursement details.

    Raises:
        SupabaseRPCError: If call fails or data is invalid.
    """
    try:
        supabase = get_supabase_client()

        response = supabase.rpc(
            "get_reimbursement_full_detail",
            {
                "p_manager_id": manager_id,
                "p_user_id": user_id,
                "p_reimbursement_id": reimbursement_id
            },
        ).execute()

        result = response.data if hasattr(response, "data") else response

        # Logic to unwrap list response if needed (Supabase sometimes returns single object in list)
        if isinstance(result, list) and len(result) > 0:
             # handle case like [{"get_reimbursement_full_detail": {...}}]
             if isinstance(result[0], dict) and "get_reimbursement_full_detail" in result[0]:
                 result = result[0]["get_reimbursement_full_detail"]
             else:
                 result = result[0]
        
        if not result:
            raise SupabaseRPCError("Reimbursement not found or access denied")

        # Supplement with flags from the reimbursements table
        # (RPC stored procedure may not return this column)
        try:
            if isinstance(result, dict) and "policy_flags" not in result:
                flags_resp = supabase.table("reimbursements").select(
                    "flags"
                ).eq("reimbursement_id", reimbursement_id).single().execute()
                if flags_resp.data:
                    result["policy_flags"] = flags_resp.data.get("flags")
        except Exception as flags_err:
            logger.warning("Could not supplement policy_flags for detail: %s", flags_err)

        logger.info(
            "✅ Supabase RPC: get_reimbursement_full_detail successful for ID %s",
            reimbursement_id,
        )

        return result

    except APIError as e:
        error_msg = f"Supabase RPC API error: {str(e)}"
        logger.error("❌ Supabase RPC: API error - %s", error_msg)
        raise SupabaseRPCError(error_msg) from e
    except Exception as e:
        error_msg = f"Unexpected error calling Supabase RPC: {str(e)}"
        logger.error("❌ Supabase RPC: Unexpected error - %s", error_msg)
        raise SupabaseRPCError(error_msg) from e


def test_rpc_function() -> None:
    """
    Test function to verify RPC is working.
    Tests with expense_categories.category_name.
    """
    print("\n" + "="*60)
    print("Testing Supabase RPC: get_column_data_json")
    print("="*60)
    
    try:
        result = get_column_data_json("expense_categories", "category_name")
        
        print(f"\n✅ RPC Call Successful!")
        print(f"\nTable: {result.get('table')}")
        print(f"Column: {result.get('column')}")
        print(f"\nValues ({len(result.get('values', []))} items):")
        print("-" * 60)
        
        values = result.get("values", [])
        for i, value in enumerate(values, 1):
            print(f"  {i}. {value}")
        
        print("-" * 60)
        print(f"\nFull JSON Response:")
        import json
        print(json.dumps(result, indent=2, ensure_ascii=False))
        print("="*60 + "\n")
        
    except SupabaseRPCError as e:
        print(f"\n❌ RPC Test Failed: {str(e)}\n")
        raise
    except Exception as e:
        print(f"\n❌ Unexpected Error: {str(e)}\n")
        raise


def get_managers_by_admin(admin_id: str) -> List[Dict[str, Any]]:
    """
    Fetch managers for a given admin.

    Args:
        admin_id: Admin UUID to filter managers.

    Returns:
        List of dicts with manager data.
    """
    try:
        supabase = get_supabase_client()

        # We query the 'managers' table directly
        response = supabase.from_("managers") \
            .select("*, roles(role_name), manager_department:departments(*)") \
            .eq("manager_admin_id", admin_id) \
            .execute()

        result = response.data

        logger.info("✅ Supabase: get_managers_by_admin successful for admin %s", admin_id)
        return result

    except Exception as e:
        error_msg = f"Failed to fetch managers by admin: {str(e)}"
        logger.error("❌ Supabase: Unexpected error - %s", error_msg)
        raise SupabaseRPCError(error_msg) from e

def check_reimbursement_limit(user_id: str, category_id: int, subcategory_id: Optional[int] = None) -> Dict[str, Any]:
    """
    Calls the get_allowed_reimbursement_amount RPC to determine if
    a user's submission breaks their current monthly allowance.
    """
    try:
        supabase = get_supabase_client()
        payload = {
            "p_user_id": user_id,
            "p_category_id": category_id,
        }
        if subcategory_id is not None:
            payload["p_subcategory_id"] = subcategory_id

        response = supabase.rpc("get_allowed_reimbursement_amount", payload).execute()
        result = response.data if hasattr(response, "data") else response
        
        if result and isinstance(result, list):
            result = result[0]
            
        return result or {}
    except Exception as e:
        logger.warning(f"Could not check reimbursement limit via RPC: {e}")
        return {}


def get_user_claim_config_rpc(user_id: str) -> Dict[str, Any]:
    """
    Calls the highly-optimized get_user_claim_config RPC to pull the unified JSON tree 
    of categories, subcategories, and restricted items cleanly bounded by the user's company_id.
    """
    try:
        supabase = get_supabase_client()
        response = supabase.rpc("get_user_claim_config", {"p_user_id": user_id}).execute()
        result = response.data if hasattr(response, "data") else response
        
        if result and isinstance(result, list):
            return result[0]
            
        return result or {}
    except Exception as e:
        logger.warning(f"Could not fetch unified user claim config via RPC: {e}")
        return {}


