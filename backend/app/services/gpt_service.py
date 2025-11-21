"""
OpenAI GPT service for structuring OCR text into JSON.
Optimized for concurrent requests with proper error handling.
"""
import json
import logging
from typing import Dict, Any

from openai import OpenAI
from openai import OpenAIError

from app.config.settings import settings

logger = logging.getLogger(__name__)


class GPTServiceError(Exception):
    """Custom exception for GPT service errors."""
    pass


# Initialize OpenAI client (thread-safe, can be reused)
_client: OpenAI | None = None


def _get_client() -> OpenAI:
    """Get or create OpenAI client instance (singleton pattern)."""
    global _client
    if _client is None:
        _client = OpenAI(api_key=settings.openai_api_key)
    return _client


def structure_text_with_openai(extracted_text: str) -> Dict[str, Any]:
    """
    Send extracted OCR text to OpenAI to parse into structured receipt JSON.
    
    Args:
        extracted_text: Raw OCR text from receipt image
    
    Returns:
        Structured receipt data as Python dictionary
    
    Raises:
        GPTServiceError: If GPT structuring fails
    """
    system_message = """You convert noisy OCR text from receipts into a single, clean JSON object.

Output must ALWAYS be a valid JSON dictionary with exactly these top-level keys:
- "Vendor Name": string
- "Date": string
- "Categories": string
- "Subcategories": string
- "items": array of objects
- "Address": string
- "Total Amount": string
- "Invoice Number": string

For each object in "items", use exactly this structure:
- "item": string            // item name
- "price": string           // price for this line or unit, including currency symbol if present

Rules:
1. If any field is missing or unreadable in the OCR text, infer a reasonable value from context (vendor, items, layout).
2. If you cannot infer a text field, set it to an empty string "".
4. Detect and correct obviously wrong prices, such as values that are off by orders of magnitude (for example, "Bread 29000" should likely be "29.00" or "2.90" depending on the rest of the receipt). Fix common OCR issues like missing decimals, extra zeros, or misread characters.
5. Ensure that the prices in "items" are as consistent as possible with the "Total Amount". If the printed total looks wrong but item prices look reasonable, prefer correcting the total.
6. Infer "Categories" and "Subcategories" based on the vendor and item names (for example: groceries, meals, transport, fuel, lodging, office supplies).
7. Do not include any keys other than the ones specified above.
8. Return JSON only. Do not include explanations, markdown, or any text around the JSON.

The input is raw OCR text of a single receipt."""

    try:
        client = _get_client()
        
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": extracted_text},
            ],
            temperature=0,
            max_tokens=2000,
        )
        
        raw_content = response.choices[0].message.content.strip()
        
        # Robustly extract JSON from response (handle markdown code blocks, etc.)
        try:
            start = raw_content.find("{")
            end = raw_content.rfind("}")
            if start != -1 and end != -1:
                json_str = raw_content[start : end + 1]
            else:
                json_str = raw_content
            
            structured_output = json.loads(json_str)
            
            logger.info("✅ GPT service: Text structuring successful")
            return structured_output
            
        except json.JSONDecodeError as e:
            logger.error("❌ GPT service: JSON parsing failed")
            raise GPTServiceError(f"Failed to parse GPT JSON output: {str(e)}")
            
    except OpenAIError as e:
        logger.error("❌ GPT service: API error")
        raise GPTServiceError(f"OpenAI API error: {str(e)}")
    except GPTServiceError:
        logger.error("❌ GPT service: Text structuring failed")
        raise
    except Exception as e:
        logger.error("❌ GPT service: Unexpected error")
        raise GPTServiceError(f"Unexpected error during GPT structuring: {str(e)}")

