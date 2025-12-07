"""
API v1 router - aggregates all v1 endpoints.
"""
from fastapi import APIRouter

from app.api.routes import receipt, rpc, receipt_code, category

api_v1_router = APIRouter()

# Include route modules
api_v1_router.include_router(receipt.router, tags=["receipt"])
api_v1_router.include_router(rpc.router, tags=["rpc"])
api_v1_router.include_router(receipt_code.router, tags=["receipt-code"])
api_v1_router.include_router(category.router, tags=["category"])


@api_v1_router.get("/health")
async def health() -> dict:
    """Health check endpoint."""
    return {"status": "ok"}
