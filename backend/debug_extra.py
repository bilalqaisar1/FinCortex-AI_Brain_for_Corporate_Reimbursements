
import asyncio
from app.services.supabase_service import get_supabase_client

async def check():
    s = get_supabase_client()
    try:
        resp = s.table('departments').select('*').limit(1).execute()
        print('Depts:', list(resp.data[0].keys()) if resp.data else 'Empty')
    except Exception as e:
        print('Depts error:', e)
        
    try:
        resp = s.table('expense_categories').select('*').limit(1).execute()
        print('Cats:', list(resp.data[0].keys()) if resp.data else 'Empty')
    except Exception as e:
        print('Cats error:', e)

if __name__ == "__main__":
    asyncio.run(check())
