
import sys
import os
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), '../.env')))

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.vision_service import extract_text_from_image
from app.config.settings import settings

def test_ocr():
    print(f"Testing Vision API URL: {settings.vision_api_url_full[:50]}...")
    
    # Use the uploaded image from metadata
    image_path = "/home/ubuntu/.gemini/antigravity/brain/7219320e-7a33-4b7d-aab3-18c9acd55399/uploaded_image_1768315895103.png"
    
    if not os.path.exists(image_path):
        print(f"❌ Test image not found at {image_path}")
        return

    try:
        print(f"Extracting text from {image_path}...")
        text = extract_text_from_image(image_path)
        print("\n✅ OCR SUCCESS!")
        print("--- Extracted Text Preview ---")
        print(text[:500] + "..." if len(text) > 500 else text)
        print("----------------------------")
    except Exception as e:
        print(f"\n❌ OCR FAILED: {str(e)}")

if __name__ == "__main__":
    test_ocr()
