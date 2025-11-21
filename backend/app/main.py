"""
FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_v1_router
from app.config import database  # noqa: F401 - Initialize database connection

app = FastAPI(
    title="FinCortex Backend",
    description="AI-powered corporate reimbursement management system",
    version="1.0.0",
)

# CORS - allow local frontend
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
