
import os
from supabase import create_client, Client
from dotenv import load_dotenv

env_path = os.path.join(os.getcwd(), "backend", ".env")
load_dotenv(env_path)

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("❌ Missing environment variables")
    exit(1)

supabase: Client = create_client(url, key)

sql = """
CREATE TABLE IF NOT EXISTS public.in_app_notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    category VARCHAR(50) DEFAULT 'general',
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    related_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.in_app_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.in_app_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access" ON public.in_app_notifications FOR ALL USING (true) WITH CHECK (true);
"""

try:
    print("Trying to execute SQL via rpc('exec_sql')...")
    response = supabase.rpc("exec_sql", {"sql": sql}).execute()
    print("✅ SQL execution attempt finished.")
except Exception as e:
    print(f"❌ RPC 'exec_sql' failed: {e}")
