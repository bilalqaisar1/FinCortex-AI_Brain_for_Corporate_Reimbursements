
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load from backend/.env
env_path = os.path.join(os.getcwd(), "backend", ".env")
load_dotenv(env_path)

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
anon_key = os.environ.get("SUPABASE_ANON_KEY")

if not url or not key:
    print(f"❌ Missing environment variables in {env_path}")
    print(f"URL: {url}")
    print(f"Key present: {bool(key)}")
    exit(1)

supabase: Client = create_client(url, key)

print(f"Connecting to: {url}")

try:
    # Try to fetch from the table
    response = supabase.table("in_app_notifications").select("*").limit(1).execute()
    print(f"✅ Table 'in_app_notifications' exists. Count: {len(response.data)}")
except Exception as e:
    print(f"❌ Error accessing table 'in_app_notifications': {e}")

try:
    if anon_key:
        anon_supabase: Client = create_client(url, anon_key)
        response = anon_supabase.table("in_app_notifications").select("*").limit(1).execute()
        print(f"✅ Anon access check: {len(response.data)} records (expected 0 if RLS is on)")
except Exception as e:
    print(f"ℹ️ Anon access check error (likely RLS): {e}")

try:
    # Check for 'notifications' table too
    response = supabase.table("notifications").select("*").limit(1).execute()
    print(f"✅ Table 'notifications' exists. Count: {len(response.data)}")
except Exception as e:
    print(f"❌ Error accessing table 'notifications': {e}")
