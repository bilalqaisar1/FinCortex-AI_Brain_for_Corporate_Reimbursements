"""
Ollama Vision Fallback Service for Receipt and Document Analysis.
Used when primary cloud vision APIs (Google/Azure) are down, rate limited, or expired.
Ensures single-pass JSON extraction from an encoded image using an async architecture.
"""
import base64
import json
import logging
from typing import Dict, Any, Optional

from app.config.ollama import get_ollama_openai_client, get_vision_model_name

logger = logging.getLogger(__name__)

async def extract_receipt_data_fallback(image_bytes: bytes, claim_config: Optional[Dict[str, Any]] = None, mime_type: str = "image/jpeg") -> Optional[Dict[str, Any]]:
    """
    Takes raw image bytes and the company's master claim_config, and prompts the Ollama vision model
    to extract standard receipt fields in a pure JSON format.
    
    Operates in O(1) architectural flow stringing network I/O as non-blocking async,
    ensuring CPU availability during inference.
    
    Args:
        image_bytes: The raw byte content of the target image.
        mime_type: Target MIME format. Defaults to 'image/jpeg'.
        
    Returns:
        Structured dictionary of the extracted receipt properties, or None if extraction fails.
    """
    try:
        # Step 1: Base64 Encode
        # Offload encoding cleanly; minimizes overhead
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        data_uri = f"data:{mime_type};base64,{base64_image}"

        # Initialize the OpenAI compatible client pointing to Ollama
        client = get_ollama_openai_client()
        model = get_vision_model_name()

        config_str = json.dumps(claim_config, indent=2) if claim_config else "[]"
        # Step 2: Prompt engineering for deterministic 1-pass extraction
        prompt_instructions = f"""You are an ELITE SOTA FINANCIAL DATA EXTRACTION AI.
    Your sole purpose is to analyze the provided receipt or invoice image and extract structured data logically and accurately.
    
    ## CORPORATE POLICIES (STRICT EVALUATION):
    You must enforce strict accounting rules based on this exact Company Database Configuration:
    {config_str}
    
    STRICT RULES (Adhere or Fail):
    1. OUTPUT FORMAT:
       You must return a raw, syntactically perfect JSON object. ABSOLUTELY NO MARKDOWN FORMATTING, NO '```json' BLOCKS, AND NO EXPLANATIONS.
    
    2. JSON SCHEMA:
       {{
           "vendor_name": "Name of the merchant or company",
           "date": "Date of transaction strictly in YYYY-MM-DD format",
           "total_amount": "Final sum of the receipt (numeric string, e.g. '3009.50')",
           "currency_iso": "The 3-letter ISO code for the currency (e.g. USD, EUR, PKR). Infer from symbols.",
           "invoice_number": "Invoice or receipt identifier, if present",
           "address": "Full physical address, if present",
           "category": "Main category of the overall receipt (choose ONLY from ADMIN CONFIG).",
           "subcategory": "More specific subcategory if identifiable (choose ONLY from ADMIN CONFIG).",
           "tax_amount": "Full tax amount applied if visible (numeric string)",
           "items": [
               {{
                   "item": "Name of purchased product or service (DO NOT list taxes as separate items)",
                   "price": "Cost of line item as numeric string (e.g. '3009.50'). If GST or Tax was applied, the item price MUST BE GST-INCLUSIVE.",
                   "quantity": "Quantity purchased as numeric string (e.g. '1')",
                   "is_reimbursable": true or false. Return true ONLY if it cleanly matches an allowed category and is NOT restricted.,
                   "category": "The exact name of the matched category from the allowed config. If unclassifiable or restricted, return 'UNCLASSIFIED'",
                   "rejection_reason": "If is_reimbursable is false, explain why (e.g., 'Item matches restricted company rules'). Otherwise null."
               }}
           ]
       }}
       
    3. BEHAVIOR:
       - Do not invent data. If a field is wholly missing, omit it from the JSON.
       - Ensure floating point amounts exclude currency symbols.
       - CRITICAL MATH RULE: DO NOT list GST or Tax as separate line items. Instead, natively distribute and add the tax into the respective product `price` so each item's price is strictly GST-inclusive. The sum of item `price` * `quantity` MUST cleanly equal the `total_amount`.
       - If an item matches a string logically in `restricted_items`, set `is_reimbursable` to false.
    """

        logger.info(f"Initiating Ollama vision fallback using model {model}")

        # Step 3: Fast async I/O network call to local/remote Ollama cluster
        try:
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt_instructions},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": data_uri
                                }
                            }
                        ]
                    }
                ],
                response_format={"type": "json_object"},
                temperature=0.0, # Complete deterministic behavior
            )
        finally:
            await client.close()

        raw_content = response.choices[0].message.content
        if not raw_content:
            logger.warning("Ollama vision fallback returned empty content.")
            return None

        # Step 4: Graceful JSON Parsing
        # Qwen/Llama structures can occasionally trail strings; we defensively split markdown
        clean_content = raw_content.strip()
        if clean_content.startswith("```json"):
            clean_content = clean_content[7:]
        if clean_content.endswith("```"):
            clean_content = clean_content[:-3]

        parsed_json = json.loads(clean_content.strip())
        logger.info("Successfully extracted receipt data via Ollama fallback.")
        
        return parsed_json

    except json.JSONDecodeError as e:
        logger.error("Ollama model provided invalid JSON formatting", exc_info=True)
        return None
    except Exception as e:
        logger.error(f"Fallback Ollama Vision Service failed: {str(e)}", exc_info=True)
        # SOTA Rule 7 Enforcement ("The Black Box Rule"): 
        # NEVER bubble connection errors to the frontend. Suppress exception and return None.
        return None

async def evaluate_item_manual(item_name: str, claim_config: Dict[str, Any]) -> str:
    """
    SOTA Semantic Validator: Replaces primitive string-matching. 
    Evaluates manual items against the multi-tenant Database Configuration logically.
    """
    try:
        client = get_ollama_openai_client()
        model = get_vision_model_name()  # Re-use loaded model to prevent VRAM hot-swap delays
        
        config_str = json.dumps(claim_config, indent=2)
        
        prompt = f"""You are an elite corporate financial routing AI.
Your purpose is to logically categorize the manually entered line-item: '{item_name}'.

Here is the exact Corporate Database Config for this user's company:
{config_str}

RULES (Strict sequential logic):
1. Does this item logically match anything in the `restricted_items` array? If YES, reply ONLY with the exact word: "RESTRICTED"
2. If safe, does it logically map to any category inside the `categories` array? If YES, reply ONLY with the exact `name` of that category.
3. If it absolutely does not fit any allowed category, reply ONLY with the exact word: "UNCLASSIFIED"

Return NO code blocks, NO markdown, NO explanations. Just the single string result.
"""
        try:
            response = await client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0
            )
        finally:
            await client.close()
        
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        logger.warning(f"Semantic Validation bypassed (Fallback to rejection). Reason: {str(e)}")
        return "UNCLASSIFIED"
