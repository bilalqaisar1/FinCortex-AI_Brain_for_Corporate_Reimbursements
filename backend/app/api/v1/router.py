"""
API v1 router - aggregates all v1 endpoints.
"""
import logging

from fastapi import APIRouter

from app.api.routes import receipt, rpc, receipt_code, category, remote_receipt

logger = logging.getLogger(__name__)

api_v1_router = APIRouter()

# Include route modules
api_v1_router.include_router(receipt.router, tags=["receipt"])
api_v1_router.include_router(rpc.router, tags=["rpc"])
api_v1_router.include_router(receipt_code.router, tags=["receipt-code"])
api_v1_router.include_router(category.router, tags=["category"])
api_v1_router.include_router(remote_receipt.router, tags=["remote-receipt"])


@api_v1_router.get("/health")
async def health() -> dict:
    """Health check endpoint."""
    logger.info("📥 GET /health - Request received")
    response_data = {"status": "ok"}
    logger.info("✅ GET /health - Health check successful")
    logger.info("📤 GET /health - Final response: %s", response_data)
    return response_data
