import sys
import os
sys.path.append(os.path.join(os.getcwd(), "venv", "Lib", "site-packages"))

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from config.settings import settings
from routers import (
    ocr, 
    openai_processor, 
    rag_chatbot, 
    reimbursement_tools
)
from tools.mcp_tools import get_available_tools
from core.database import Base, engine
from models import database_models

# Create database tables
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create database tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    print("Starting MCP Reimbursement Server...")
    yield
    # Shutdown: Clean up resources
    print("Shutting down MCP Reimbursement Server...")

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="MCP Server for Reimbursement System with AI Tools",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with sub-prefixes
app.include_router(ocr.router, prefix=f"{settings.API_PREFIX}/ocr", tags=["OCR"])
app.include_router(openai_processor.router, prefix=f"{settings.API_PREFIX}/openai", tags=["OpenAI Processing"])
app.include_router(rag_chatbot.router, prefix=f"{settings.API_PREFIX}/rag", tags=["RAG Chatbot"])
app.include_router(reimbursement_tools.router, prefix=f"{settings.API_PREFIX}/tools", tags=["Reimbursement Tools"])

# Health check and info endpoints
@app.get("/")
async def root():
    return {
        "message": "MCP Reimbursement Server is running",
        "version": settings.VERSION,
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "MCP Reimbursement Server"}

@app.get("/tools")
async def list_tools():
    """List all available MCP tools"""
    return {
        "tools": get_available_tools(),
        "count": len(get_available_tools())
    }

# Run the server
if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host=settings.MCP_SERVER_HOST,
        port=settings.MCP_SERVER_PORT,
        reload=True,
        log_level="info"
    )