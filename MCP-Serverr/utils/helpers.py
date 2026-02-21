import base64
import json
from typing import Any, Dict

def encode_image_to_base64(image_path: str) -> str:
    """
    Encode image file to base64 string
    """
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def decode_base64_to_image(base64_string: str, output_path: str):
    """
    Decode base64 string to image file
    """
    with open(output_path, "wb") as image_file:
        image_file.write(base64.b64decode(base64_string))

def format_currency(amount: float, currency: str = "USD") -> str:
    """
    Format currency amount
    """
    if currency == "USD":
        return f"${amount:.2f}"
    elif currency == "EUR":
        return f"€{amount:.2f}"
    else:
        return f"{amount:.2f} {currency}"

def validate_receipt_data(data: Dict[str, Any]) -> bool:
    """
    Validate extracted receipt data
    """
    required_fields = ["merchant_name", "total_amount"]
    
    for field in required_fields:
        if field not in data or not data[field]:
            return False
    
    try:
        float(data["total_amount"])
    except (ValueError, TypeError):
        return False
    
    return True