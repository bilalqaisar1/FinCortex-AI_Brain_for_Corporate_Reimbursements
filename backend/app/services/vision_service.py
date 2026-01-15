"""
Google Vision API service for OCR text extraction.
Optimized for concurrent requests with proper error handling.
"""
import base64
import logging
from typing import Optional

import requests

from app.config.settings import settings

logger = logging.getLogger(__name__)


class VisionServiceError(Exception):
    """Custom exception for Vision service errors."""
    pass


def extract_text_from_image(image_path: str, timeout: Optional[int] = None) -> str:
    """
    Extract text from an image using Google Cloud Vision API.
    
    Args:
        image_path: Path to the image file
        timeout: Request timeout in seconds (defaults to settings value)
    
    Returns:
        Extracted text as a single string
    
    Raises:
        VisionServiceError: If OCR extraction fails
    """
    timeout = timeout or settings.request_timeout_seconds
    
    try:
        # Read and encode image
        with open(image_path, "rb") as img_file:
            img_base64 = base64.b64encode(img_file.read()).decode("utf-8")
        
        # Prepare Vision API request
        request_body = {
            "requests": [
                {
                    "image": {"content": img_base64},
                    "features": [{"type": "TEXT_DETECTION"}],
                }
            ]
        }
        
        # Make API call
        response = requests.post(
            settings.vision_api_url_full,
            json=request_body,
            timeout=timeout,
        )
        
        # Handle HTTP errors
        if response.status_code != 200:
            error_detail = response.text[:500]  # Limit error message length
            raise VisionServiceError(
                f"Vision API HTTP error {response.status_code}: {error_detail}"
            )
        
        result = response.json()
        
        # Handle API errors
        if "error" in result:
            error_message = result["error"].get("message", "Unknown error")
            raise VisionServiceError(f"Vision API Error: {error_message}")
        
        # Extract text from response
        annotations = result.get("responses", [{}])[0].get("textAnnotations", [])
        if not annotations:
            return ""
        
        # First element usually contains full text block
        full_text = annotations[0].get("description", "")
        extracted_text = full_text.strip()
        
        logger.info("✅ Google Vision service: OCR extraction successful")
        return extracted_text
        
    except requests.exceptions.RequestException as e:
        logger.error("❌ Google Vision service: Network error")
        raise VisionServiceError(f"Network error during OCR extraction: {str(e)}")
    except VisionServiceError:
        logger.error("❌ Google Vision service: OCR extraction failed")
        raise
    except Exception as e:
        logger.error("❌ Google Vision service: Unexpected error")
        raise VisionServiceError(f"Unexpected error during OCR extraction: {str(e)}")

