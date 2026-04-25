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
from app.services.ollama.fallback_service import extract_receipt_data_fallback

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
            image_bytes = image_file.read()
            image_content = base64.b64encode(image_bytes).decode('utf-8')
        
        # Call the end-to-end agentic tool on MCP
        payload = {
            "user_id": admin_uuid or "unknown_user",
            "file_name": os.path.basename(image_path),
            "file_content": image_content,
            "categories": categories_data
        }
        
        try:
            logger.info("🤖 Calling MCP Agentic Orchestrator [DISABLED FOR TESTING - FORCING FALLBACK]")
            # mcp_response = _call_mcp_tool("/ocr/process-receipt-end-to-end", payload)
            
            # Artificially trigger the circuit breaker for testing
            raise ReceiptProcessingError("Simulated MCP API Failure to test Local Ollama circuit breaker")
            
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
        except ReceiptProcessingError as rpe:
            logger.warning(f"Cloud Agent/MCP offline or failed: {str(rpe)}. Tripping Circuit Breaker -> Local Ollama Fallback.")
            
            # Fire Async Ollama Fallback safely escaping the active event loop
            try:
                logger.warning("using ollama model for receipt processing")
                import concurrent.futures
                
                def run_fallback_safely():
                    new_loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(new_loop)
                    try:
                        return new_loop.run_until_complete(extract_receipt_data_fallback(image_bytes))
                    finally:
                        new_loop.close()

                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                    ocr_structured = pool.submit(run_fallback_safely).result()
                
                if not ocr_structured:
                    logger.info("receipt processing fail by ollama model")
                    raise ReceiptProcessingError("Ollama fallback returned None or failed to parse.")
                    
                logger.warning("receipt processing  by ollama model")
                logger.warning("✅ Ollama Fallback succeeded gracefully.")
                return {
                    "raw_text": "Extracted via Local Ollama Fallback directly from image.",
                    "structured": ocr_structured,
                    "ocr_source": "ollama_fallback"
                }
            except Exception as inner_e:
                logger.info(f"receipt processing fail ({str(inner_e)}) by ollama model")
                logger.error(f"❌ Ollama Fallback also failed: {str(inner_e)}")
                raise ReceiptProcessingError(f"Complete systemic failure (Cloud MCP + Local Ollama): {str(inner_e)}")
                
    except Exception as e:
        if isinstance(e, ReceiptProcessingError):
            raise
        error_msg = f"Unexpected error during receipt processing: {str(e)}"
        logger.error("❌ Receipt processing: Unexpected error - %s", error_msg)
        raise ReceiptProcessingError(error_msg)

