
import os
import asyncio
from supabase import create_client, Client
from dotenv import load_dotenv

async def backfill():
    # Load env from parent dir or local
    load_dotenv()
    load_dotenv("../.env")
    load_dotenv("fin-cortex/.env.local")
    
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("Missing Supabase environment variables")
        return

    supabase: Client = create_client(url, key)
    
    print("Fetching reimbursements with null company_id...")
    res = supabase.table("reimbursements").select("reimbursement_id, user_id, manager_id").is_("company_id", "null").execute()
    
    if not res.data:
        print("No reimbursements found needing backfill.")
        return
    
    print(f"Found {len(res.data)} records to process.")
    
    for r in res.data:
        rid = r["reimbursement_id"]
        uid = r["user_id"]
        mid = r["manager_id"]
        
        company_id = None
        
        # 1. Try User
        user_res = supabase.table("users").select("company_id").eq("user_id", uid).single().execute()
        if user_res.data and user_res.data.get("company_id"):
            company_id = user_res.data["company_id"]
            print(f"  Resolved via User {uid} -> Company {company_id}")
        
        # 2. Try Manager
        if not company_id and mid:
            mgr_res = supabase.table("managers").select("manager_company_id").eq("manager_id", mid).single().execute()
            if mgr_res.data and mgr_res.data.get("manager_company_id"):
                company_id = mgr_res.data["manager_company_id"]
                print(f"  Resolved via Manager {mid} -> Company {company_id}")
                
        if company_id:
            supabase.table("reimbursements").update({"company_id": company_id}).eq("reimbursement_id", rid).execute()
            print(f"  ✅ Updated Reimbursement {rid}")
        else:
            print(f"  ❌ Could not resolve company for Reimbursement {rid}")

if __name__ == "__main__":
    asyncio.run(backfill())
