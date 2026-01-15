
import asyncio
import os
from app.services.supabase_service import get_supabase_client

async def inspect_schema():
    supabase = get_supabase_client()
    
    tables = ["reimbursements", "users", "reimbursement_rules", "company_budgets"]
    
    print("--- Schema Inspection ---")
    for table in tables:
        print(f"\nChecking table: {table}")
        try:
            # We can't easily list columns via API without RLS allowing it or using a specific RPC.
            # But we can try to select * limit 1 and see keys.
            resp = supabase.table(table).select("*").limit(1).execute()
            if resp.data:
                print(f"Columns found: {list(resp.data[0].keys())}")
            else:
                print("Table is empty, trying to infer from error or assume generic fetch.")
                # If empty, we can't see keys. 
                # Let's try to insert a dummy row with the columns we expect to see if it errors? 
                # No, that's dangerous.
                # Let's just relay on the logs the user provided:
                # "column reimbursements.total_amount does not exist" -> code uses it, db doesn't have it.
                # "column managers.admin_id does not exist"
                # "column users.admin_id does not exist"
                # "column reimbursements.manager_comments does not exist"
        except Exception as e:
            print(f"Error accessing {table}: {e}")

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    loop.run_until_complete(inspect_schema())
