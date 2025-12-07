"""
Application settings and configuration with hardcoded API keys.
Optimized for production use with all credentials embedded.
"""
from functools import lru_cache
from typing import Optional


class Settings:
    """Application configuration with hardcoded credentials."""
    
    
    # Supabase Configuration
    supabase_url: str = "https://dczlyrrkjnxbmqkbgtgz.supabase.co"
    supabase_service_role_key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjemx5cnJram54Ym1xa2JndGd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE5MDEzNCwiZXhwIjoyMDczNzY2MTM0fQ.K5iOUvSwC1erFvE6qpHacm1XdpVtV_btfiSjqLgpYig"
    supabase_anon_key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjemx5cnJram54Ym1xa2JndGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxOTAxMzQsImV4cCI6MjA3Mzc2NjEzNH0.7hrt0vvZbguthdjU2CG6BynxpkYvoyXkBFhZBfwYxWc"
    
    # Google Vision API Configuration
    google_vision_api_key: str = "AIzaSyCxXYnYE_dhfGJz9ZLndFVpaj1oA-VUkBo"
    vision_api_url: str = "https://vision.googleapis.com/v1/images:annotate?key=AIzaSyCxXYnYE_dhfGJz9ZLndFVpaj1oA-VUkBo"
    
    # OpenAI Configuration
    openai_api_key: str = "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"
    openai_model: str = "gpt-4o-mini"
    
    # Storage
    receipts_bucket: str = "receipts-bucket"
    receipts_folder: str = "receipts"

    # Application Settings
    temp_dir: str = "temp"
    max_upload_size_mb: int = 10
    request_timeout_seconds: int = 30


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Get cached settings instance (singleton pattern)."""
    return Settings()


# Global settings instance
settings = get_settings()
