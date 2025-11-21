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
    return [str(v) if v is not None else "" for v in values]


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


