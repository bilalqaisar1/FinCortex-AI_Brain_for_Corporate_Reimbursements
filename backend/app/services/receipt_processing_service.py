"""
Receipt processing orchestrator via MCP Server.
Backend acts as a thin client to the Agentic MCP Server.
"""
import logging
import json
import base64
import requests
import os
import asyncio
from typing import Dict, Any, List, Optional
from app.config.settings import settings
from app.services.ollama.ollama_vl_model_service import extract_receipt_data_fallback

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
    claim_config: Optional[Dict[str, Any]] = None,
    categories_data: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Agentic Pipeline via MCP Server:
    The backend now acts as a thin client to the MCP Server which orchestrates the AI logic.
    """
    try:
        # Load and encode image
        with open(image_path, "rb") as image_file:
            image_bytes = image_file.read()
            image_content = base64.b64encode(image_bytes).decode('utf-8')
        
        # Call the end-to-end agentic tool on MCP
        payload = {
            "user_id": admin_uuid or "unknown_user",
            "file_name": os.path.basename(image_path),
            "file_content": image_content,
            "claim_config": claim_config
        }
        
        # Architectural Inversion: Try Local Ollama (Zero-Trust) FIRST
        try:
            logger.info("🤖 Querying Local Async Ollama Core First...")
            import concurrent.futures
            
            def run_local_core():
                new_loop = asyncio.new_event_loop()
                asyncio.set_event_loop(new_loop)
                try:
                    return new_loop.run_until_complete(extract_receipt_data_fallback(image_bytes, claim_config))
                finally:
                    new_loop.close()

            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                ocr_structured = pool.submit(run_local_core).result()
            
            if not ocr_structured:
                raise ReceiptProcessingError("Local Ollama refused or failed parsing.")
                
            logger.info("✅ Primary Local Ollama extraction succeeded.")
            return {
                "raw_text": "Extracted via Primary Local Ollama directly from image.",
                "structured": ocr_structured,
                "ocr_source": "ollama_local"
            }
            
        except Exception as local_e:
            logger.warning(f"Local Ollama Core failed ({str(local_e)}). Tripping Backup Circuit to Cloud MCP Orchestrator...")
            
            # Fire sync Cloud MCP Fallback
            try:
                mcp_response = _call_mcp_tool("/ocr/process-receipt-end-to-end", payload)
                
                if not mcp_response.get("success"):
                    error = mcp_response.get("error", "Unknown Cloud MCP error")
                    logger.error(f"❌ Cloud Backup Processing failed: {error}")
                    raise ReceiptProcessingError(error)
                
                data = mcp_response.get("data", {})
                logger.info("✅ Cloud Backup extraction succeeded gracefully.")
                return {
                    "raw_text": data.get("extracted_text", ""),
                    "structured": data.get("structured_data", {}),
                    "ocr_source": data.get("ocr_source", "cloud_mcp")
                }
            except Exception as mcp_e:
                error_chain = f"Complete systemic failure.\nLocal: {str(local_e)}\nCloud Backup: {str(mcp_e)}"
                logger.error(f"❌ {error_chain}")
                raise ReceiptProcessingError(error_chain)
                
    except Exception as e:
        if isinstance(e, ReceiptProcessingError):
            raise
        error_msg = f"Unexpected error during receipt processing: {str(e)}"
        logger.error("❌ Receipt processing: Unexpected error - %s", error_msg)
        raise ReceiptProcessingError(error_msg)

