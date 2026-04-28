"""
FastAPI application entry point.
"""
import sys
import os
sys.path.append(os.path.join(os.getcwd(), "venv", "Lib", "site-packages"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_v1_router
from app.config import database  # noqa: F401 - Initialize database connection
from app.config.settings import settings

app = FastAPI(
    title="FinCortex Backend",
    description="AI-powered corporate reimbursement management system",
    version="1.0.0",
)

# CORS - origins from environment
origins = [url.strip() for url in settings.frontend_url.split(",") if url.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_v1_router, prefix="/api/v1")


@app.get("/")
def root():
    """Root endpoint."""
    return {"ok": True, "message": "FinCortex Backend API"}
