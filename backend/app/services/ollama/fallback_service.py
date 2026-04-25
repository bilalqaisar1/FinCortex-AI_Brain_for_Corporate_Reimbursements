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

async def extract_receipt_data_fallback(image_bytes: bytes, mime_type: str = "image/jpeg") -> Optional[Dict[str, Any]]:
    """
    Takes raw image bytes, encodes them to base64, and prompts the Ollama vision model
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

        # Step 2: Prompt engineering for deterministic 1-pass extraction
        prompt_instructions = """You are an ELITE SOTA FINANCIAL DATA EXTRACTION AI.
    Your sole purpose is to analyze the provided receipt or invoice image and extract structured data logically and accurately.
    
    STRICT RULES (Adhere or Fail):
    1. OUTPUT FORMAT:
       You must return a raw, syntactically perfect JSON object. ABSOLUTELY NO MARKDOWN FORMATTING, NO '```json' BLOCKS, AND NO EXPLANATIONS.
    
    2. JSON SCHEMA:
       {
           "vendor_name": "Name of the merchant or company",
           "date": "Date of transaction strictly in YYYY-MM-DD format",
           "total_amount": "Final sum of the receipt (numeric string, e.g. '150.00')",
           "invoice_number": "Invoice or receipt identifier, if present",
           "address": "Full physical address, if present",
           "items": [
               {
                   "item": "Name of purchased product or service",
                   "price": "Cost of line item as numeric string (e.g. '5.99')",
                   "quantity": "Quantity purchased as numeric string (e.g. '1')"
               }
           ]
       }
       
    3. BEHAVIOR:
       - Do not invent data. If a field is wholly missing from the image, omit it from the JSON.
       - Ensure floating point amounts exclude currency symbols (e.g. return "50.00" not "$50.00").
       - Maintain maximum OCR fidelity for item names.
    """

        logger.info(f"Initiating Ollama vision fallback using model {model}")

        # Step 3: Fast async I/O network call to local/remote Ollama cluster
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
