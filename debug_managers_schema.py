
import os
from supabase import create_client, Client
from dotenv import load_dotenv

def debug_managers_schema():
    # Load from backend/.env
    env_path = os.path.join(os.getcwd(), "backend", ".env")
    load_dotenv(env_path)
    
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("Missing URL or KEY")
        return

    supabase: Client = create_client(url, key)
    
    try:
        response = supabase.table("managers").select("*").limit(1).execute()
        if response.data:
            print("Columns found in 'managers' table:")
            print(list(response.data[0].keys()))
        else:
            print("No data in managers table")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_managers_schema()
