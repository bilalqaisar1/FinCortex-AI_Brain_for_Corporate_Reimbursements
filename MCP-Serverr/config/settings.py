from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # API Settings
    PROJECT_NAME: str = "Reimbursement MCP Server"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    
    # Supabase Configuration
    SUPABASE_URL: str
    SUPABASE_KEY: str  # Using service role key for backend
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_JWT_SECRET: str = ""  # JWT secret for token verification
    
    # Google Vision API Configuration
    GOOGLE_VISION_API_KEY: Optional[str] = None
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None
    
    # OpenAI Configuration
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    # Database
    DATABASE_URL: str = "sqlite:///./reimbursement.db"
    
    # Azure Document Intelligence Configuration
    AZURE_ENDPOINT: Optional[str] = None
    AZURE_KEY: Optional[str] = None
    
    # MCP Server
    MCP_SERVER_HOST: str = "0.0.0.0"
    MCP_SERVER_PORT: int = 8001
    
    # Storage (from your existing settings)
    RECEIPTS_BUCKET: str = "receipts-bucket"
    RECEIPTS_FOLDER: str = "receipts"
    TEMP_DIR: str = "temp"
    MAX_UPLOAD_SIZE_MB: int = 10
    REQUEST_TIMEOUT_SECONDS: int = 30
    
    class Config:
        env_file = ".env"

settings = Settings()