"""
Receipt processing orchestrator via MCP Server.
Backend acts as a thin client to the Agentic MCP Server.
"""
import logging
import json
import base64
import requests
import os
from typing import Dict, Any, List, Optional
from app.config.settings import settings

logger = logging.getLogger(__name__)

# MCP Server Configuration
MCP_SERVER_URL = settings.mcp_server_url

class ReceiptProcessingError(Exception):
    """Custom exception for receipt processing errors."""
    pass

def _call_mcp_tool(endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Helper to call MCP Server tools"""
    url = f"{MCP_SERVER_URL}{endpoint}"
    try:
        response = requests.post(url, json=payload, timeout=60)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.error(f"MCP Tool call failed ({endpoint}): {str(e)}")
        raise ReceiptProcessingError(f"MCP Tool call failed: {str(e)}")

def process_receipt(
    image_path: str,
    *,
    admin_uuid: Optional[str] = None,
    categories_data: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Agentic Pipeline via MCP Server:
    The backend now acts as a thin client to the MCP Server which orchestrates the AI logic.
    """
    try:
        # Load and encode image
        with open(image_path, "rb") as image_file:
            image_content = base64.b64encode(image_file.read()).decode('utf-8')
        
        # Call the end-to-end agentic tool on MCP
        payload = {
            "user_id": admin_uuid or "unknown_user",
            "file_name": os.path.basename(image_path),
            "file_content": image_content,
            "categories": categories_data
        }
        
        logger.info("🤖 Calling MCP Agentic Orchestrator")
        mcp_response = _call_mcp_tool("/ocr/process-receipt-end-to-end", payload)
        
        if not mcp_response.get("success"):
            error = mcp_response.get("error", "Unknown MCP error")
            logger.error(f"❌ MCP Processing failed: {error}")
            raise ReceiptProcessingError(error)
        
        data = mcp_response.get("data", {})
        
        return {
            "raw_text": data.get("extracted_text", ""),
            "structured": data.get("structured_data", {}),
            "ocr_source": data.get("ocr_source", "unknown")
        }
        
    except Exception as e:
        if isinstance(e, ReceiptProcessingError):
            raise
        error_msg = f"Unexpected error during receipt processing: {str(e)}"
        logger.error("❌ Receipt processing: Unexpected error - %s", error_msg)
        raise ReceiptProcessingError(error_msg)

