
import asyncio
from app.services.supabase_rpc_service import get_expense_categories_with_subcategories
import json

def test_categories():
    admin_uuid = "f7f0c11f-5a14-4151-a735-59faf88ad5f9"
    print(f"Testing fetching categories for admin: {admin_uuid}")
    
    try:
        categories = get_expense_categories_with_subcategories(admin_uuid)
        
        print("\n" + "="*80)
        print(f"Fetched {len(categories)} categories")
        print("="*80)
        print(json.dumps(categories, indent=2, ensure_ascii=False))
        print("="*80 + "\n")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_categories()
