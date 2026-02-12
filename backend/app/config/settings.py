"""
Application settings and configuration with hardcoded API keys.
Optimized for production use with all credentials embedded.
"""
from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration with environment variable support."""
    
    # Supabase Configuration
    supabase_url: str
    supabase_service_role_key: str
    supabase_anon_key: str
    
    # Google Vision API Configuration
    google_vision_api_key: Optional[str] = None
    vision_api_url: Optional[str] = None
    
    # OpenAI Configuration
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o-mini"
    
    # Azure Document Intelligence Configuration
    azure_endpoint: Optional[str] = None
    azure_key: Optional[str] = None
    
    # Storage
    receipts_bucket: str = "receipts-bucket"
    receipts_folder: str = "receipts"

    # Application Settings
    temp_dir: str = "temp"
    max_upload_size_mb: int = 10
    request_timeout_seconds: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def vision_api_url_full(self) -> str:
        """Construct the full Vision API URL if not explicitly provided."""
        if self.vision_api_url:
            return self.vision_api_url
        if self.google_vision_api_key:
            return f"https://vision.googleapis.com/v1/images:annotate?key={self.google_vision_api_key}"
        return ""


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Get cached settings instance (singleton pattern)."""
    return Settings()


# Global settings instance
settings = get_settings()
