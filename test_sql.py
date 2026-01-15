
import os
from supabase import create_client, Client
from dotenv import load_dotenv

def test_exec_sql():
    env_path = os.path.join(os.getcwd(), "backend", ".env")
    load_dotenv(env_path)
    
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("❌ Missing URL or KEY")
        return

    supabase: Client = create_client(url, key)
    
    try:
        print("Executing 'SELECT 1' via exec_sql...")
        response = supabase.rpc("exec_sql", {"sql": "SELECT 1"}).execute()
        print(f"✅ Success! Response data: {response.data}")
    except Exception as e:
        print(f"❌ Failed: {e}")

if __name__ == "__main__":
    test_exec_sql()
