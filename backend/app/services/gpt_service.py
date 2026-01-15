"""
OpenAI GPT service for structuring OCR text into JSON.
Optimized for concurrent requests with proper error handling.
"""
import json
import logging
import base64
import os
from typing import Dict, Any, List, Optional

from openai import OpenAI
from openai import OpenAIError

from app.config.settings import settings
from app.services.supabase_rpc_service import (
    get_expense_categories_with_subcategories,
    SupabaseRPCError,
)

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


def extract_text_with_openai_vision(image_path: str) -> str:
    """
    Use OpenAI's vision capability (GPT-4o-mini) as a fallback OCR.
    
    Args:
        image_path: Path to the image file
        
    Returns:
        Extracted raw text from the image
        
    Raises:
        GPTServiceError: If vision processing fails
    """
    try:
        # Read and encode image
        with open(image_path, "rb") as image_file:
            base64_image = base64.b64encode(image_file.read()).decode('utf-8')
            
        client = _get_client()
        
        # Determine media type based on extension
        ext = os.path.splitext(image_path)[1].lower()
        content_type = "image/jpeg"
        if ext == ".png":
            content_type = "image/png"
        elif ext == ".gif":
            content_type = "image/gif"
        elif ext == ".webp":
            content_type = "image/webp"

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "This is a receipt image. Please perform OCR and extract all readable text content exactly as it appears. If it's not a receipt, just extract all text you see regardless."},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{content_type};base64,{base64_image}"
                            },
                        },
                    ],
                }
            ],
            max_tokens=2000,
        )
        
        extracted_text = response.choices[0].message.content.strip()
        logger.info("✅ OpenAI Vision (OCR Fallback) extraction successful")
        return extracted_text

    except Exception as e:
        logger.error("❌ OpenAI Vision (OCR Fallback) failed: %s", str(e))
        raise GPTServiceError(f"OpenAI Vision OCR failed: {str(e)}")


def structure_text_with_openai(
    extracted_text: str,
    admin_uuid: Optional[str] = None,
    categories_data: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Send extracted OCR text to OpenAI to parse into structured receipt JSON.
    
    Args:
        extracted_text: Raw OCR text from receipt image
        admin_uuid: Optional admin UUID to scope allowed categories/subcategories
        categories_data: Optional pre-fetched categories/subcategories list to avoid extra RPC
    
    Returns:
        Structured receipt data as Python dictionary
    
    Raises:
        GPTServiceError: If GPT structuring fails
    """
    categories_hint = ""
    # Prefer passed categories_data to avoid extra RPC. Fallback to fetching by admin_uuid.
    categories_list: List[Dict[str, Any]] = categories_data or []
    print(f"🔍 admin_uuid value : {admin_uuid}")
    
    # Only fetch categories if not already provided and admin_uuid is available
    if not categories_list and admin_uuid:
        try:
            logger.debug("🔍 GPT service: Fetching categories for admin_uuid: %s", admin_uuid)
            categories_list = get_expense_categories_with_subcategories(admin_uuid)
            logger.debug("🔍 GPT service: RPC returned %d categories", len(categories_list) if categories_list else 0)
        except SupabaseRPCError as e:
            logger.warning(
                "⚠️ GPT service: Could not fetch categories for admin %s: %s",
                admin_uuid,
                e,
            )
            categories_list = []
        except Exception as e:
            logger.warning(
                "⚠️ GPT service: Unexpected error fetching categories for admin %s: %s",
                admin_uuid,
                e,
            )
            categories_list = []

    if categories_list:
        categories_hint = "\n\nAllowed Categories/Subcategories (from admin scope):\n"
        for cat in categories_list:
            categories_hint += f"- {cat.get('category_name', '')} (id: {cat.get('category_id', '')})\n"
            subs = cat.get("subcategories") or []
            for sub in subs:
                categories_hint += (
                    f"    • {sub.get('subcategory_name', '')} (id: {sub.get('subcategory_id', '')})\n"
                )

    system_message = f"""You convert noisy OCR text from receipts into a single, clean JSON object.

Output must ALWAYS be a valid JSON dictionary with exactly these top-level keys:
- "Vendor Name": string
- "Date": string
- "Categories": string           // human-friendly category name for display
- "Subcategories": string        // human-friendly subcategory name for display
- "category_id": number|null     // pick ID from the allowed list; null if no good match
- "subcategory_id": number|null  // pick ID from the allowed list; null if no good match
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
7. If an admin-scoped list of Categories/Subcategories is provided, choose from that list; if no suitable match, set category_id and subcategory_id to null. Always prefer IDs from that list and reflect the chosen names in Categories/Subcategories.
8. Do not include any keys other than the ones specified above.
9. Return JSON only. Do not include explanations, markdown, or any text around the JSON.{categories_hint}

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
            
            # DEBUG: Print final output to terminal
            print("\n" + "="*80)
            print("🔍 DEBUG - GPT Service FINAL OUTPUT")
            print("="*80)
            print("📤 Structured Receipt Data:")
            print("-" * 80)
            print(json.dumps(structured_output, indent=2, ensure_ascii=False))
            print("-" * 80)
            
            # Print key fields for quick reference
            print("\n📋 Key Fields Summary:")
            print(f"  Vendor Name: {structured_output.get('Vendor Name', 'N/A')}")
            print(f"  Date: {structured_output.get('Date', 'N/A')}")
            print(f"  Total Amount: {structured_output.get('Total Amount', 'N/A')}")
            print(f"  Invoice Number: {structured_output.get('Invoice Number', 'N/A')}")
            print(f"  Categories: {structured_output.get('Categories', 'N/A')} (id: {structured_output.get('category_id', 'N/A')})")
            print(f"  Subcategories: {structured_output.get('Subcategories', 'N/A')} (id: {structured_output.get('subcategory_id', 'N/A')})")
            print(f"  Address: {structured_output.get('Address', 'N/A')}")
            items = structured_output.get('items', [])
            print(f"  Items Count: {len(items)}")
            if items:
                print(f"  Items:")
                for i, item in enumerate(items, 1):
                    print(f"    {i}. {item.get('item', 'N/A')} - {item.get('price', 'N/A')}")
            print("="*80 + "\n")
            
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

