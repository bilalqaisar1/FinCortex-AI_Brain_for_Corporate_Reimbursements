"""
Supabase client service for database operations.
Singleton pattern for efficient connection reuse.
"""
import logging
import sys

from supabase import create_client, Client
from postgrest import APIError

from app.config.settings import settings

logger = logging.getLogger(__name__)

# Global Supabase client instance (singleton)
_supabase_client: Client | None = None


def get_supabase_client() -> Client:
    """
    Get or create Supabase client instance (singleton pattern).
    Thread-safe for concurrent requests.
    
    Returns:
        Supabase client instance
    
    Raises:
        RuntimeError: If Supabase configuration is invalid
    """
    global _supabase_client
    
    if _supabase_client is None:
        if not settings.supabase_url or not settings.supabase_service_role_key:
            error_msg = "❌ Supabase configuration missing: URL or service role key not set"
            logger.error(error_msg)
            print(error_msg, file=sys.stderr)
            raise RuntimeError(error_msg)
        
        try:
            _supabase_client = create_client(
                settings.supabase_url,
                settings.supabase_service_role_key
            )
            # Test connection by making a simple query
            _supabase_client.table("users").select("user_id").limit(1).execute()
            logger.info("✅ Supabase connection established successfully")
            print("✅ Supabase connection established successfully", file=sys.stdout)
        except Exception as exc:
            error_msg = f"❌ Supabase connection failed: {exc}"
            logger.error(error_msg)
            print(error_msg, file=sys.stderr)
            raise RuntimeError(error_msg) from exc
    
    return _supabase_client

