import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

def setup():
    env_path = os.path.join(os.getcwd(), "backend", ".env")
    if not os.path.exists(env_path):
        env_path = os.path.join(os.getcwd(), ".env")
        
    load_dotenv(env_path)
    
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("❌ Missing URL or KEY")
        return

    supabase: Client = create_client(url, key)
    
    print("=== Checking Approved Reimbursements ===")
    try:
        res = supabase.table("reimbursements").select("reimbursement_id, company_id, status, amount_approved").eq("status", "approved").execute()
        if res.data:
            for r in res.data:
                print(f"  ID: {r.get('reimbursement_id')}, company_id: {r.get('company_id')}, amount_approved: {r.get('amount_approved')}")
        else:
            print("  No approved reimbursements found.")
    except Exception as e:
        print(f"❌ Failed to inspect reimbursements: {e}")

    print("\n=== Checking Company Budgets ===")
    try:
        res = supabase.table("company_budgets").select("budget_id, company_id, total_balance").execute()
        if res.data:
            for b in res.data:
                print(f"  budget_id: {b.get('budget_id')}, company_id: {b.get('company_id')}, total_balance: {b.get('total_balance')}")
        else:
            print("  No budgets found in company_budgets.")
    except Exception as e:
        print(f"❌ Failed to inspect company_budgets: {e}")

if __name__ == "__main__":
    setup()
