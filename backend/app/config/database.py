"""
Supabase database connection and client management.
Shows connection status on startup.
"""
import logging
import sys

from app.services.supabase_service import get_supabase_client

logger = logging.getLogger(__name__)

# Initialize Supabase connection on module import
try:
    supabase_client = get_supabase_client()
    logger.info("✅ Database (Supabase) connection established successfully")
    print("✅ Database (Supabase) connection established successfully", file=sys.stdout)
except Exception as exc:
    error_msg = f"❌ Database (Supabase) connection failed: {exc}"
    logger.error(error_msg)
    print(error_msg, file=sys.stderr)
    raise


def get_db():
    """
    Dependency function for FastAPI to get Supabase client.
    Returns the singleton Supabase client instance.
    
    Note: Supabase client is thread-safe and can be reused across requests.
    """
    return get_supabase_client()
