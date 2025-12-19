"""
Receipt processing orchestrator.
Coordinates Vision OCR and GPT structuring services.
"""
import logging
from typing import Dict, Any, List, Optional

from app.services.vision_service import extract_text_from_image, VisionServiceError
from app.services.gpt_service import structure_text_with_openai, GPTServiceError

logger = logging.getLogger(__name__)


class ReceiptProcessingError(Exception):
    """Custom exception for receipt processing errors."""
    pass


def process_receipt(
    image_path: str,
    *,
    admin_uuid: Optional[str] = None,
    categories_data: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Full pipeline: Extract OCR text from image, then structure it with GPT.
    
    Args:
        image_path: Path to the receipt image file
        admin_uuid: Optional admin UUID to scope allowed categories/subcategories
        categories_data: Optional pre-fetched categories/subcategories to avoid extra RPC
    
    Returns:
        Dictionary with keys:
            - "raw_text": Extracted OCR text
            - "structured": Structured JSON from GPT
    
    Raises:
        ReceiptProcessingError: If any step fails
    """
    try:
        # Step 1: Extract text using Google Vision
        raw_text = extract_text_from_image(image_path)
        
        if not raw_text:
            raise ReceiptProcessingError("No text extracted from image. Please ensure the image contains readable text.")
        
        # Step 2: Structure text using GPT
        structured_data = structure_text_with_openai(
            raw_text,
            admin_uuid=admin_uuid,
            categories_data=categories_data,
        )
        
        return {
            "raw_text": raw_text,
            "structured": structured_data,
        }
        
    except VisionServiceError as e:
        raise ReceiptProcessingError(f"OCR extraction failed: {str(e)}")
    except GPTServiceError as e:
        raise ReceiptProcessingError(f"Text structuring failed: {str(e)}")
    except ReceiptProcessingError:
        raise
    except Exception as e:
        error_msg = f"Unexpected error during receipt processing: {str(e)}"
        logger.error("❌ Receipt processing: Unexpected error - %s", error_msg)
        raise ReceiptProcessingError(error_msg)

