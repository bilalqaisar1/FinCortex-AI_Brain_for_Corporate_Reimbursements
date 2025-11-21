"""
Test script to verify Supabase RPC function works.
Run with: python test_rpc.py
"""
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.supabase_rpc_service import test_rpc_function

if __name__ == "__main__":
    try:
        test_rpc_function()
        print("✅ Test completed successfully!")
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        sys.exit(1)


