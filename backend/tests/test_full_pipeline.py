
import sys
import os
from dotenv import load_dotenv
import logging

# Configure logging to see the fallback warnings
logging.basicConfig(level=logging.INFO)

# Load environment variables from backend/.env
load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), '../.env')))

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.receipt_processing_service import process_receipt

def test_full_pipeline():
    print("\n--- Testing Full Processing Pipeline with Fallback ---")
    
    # Use the uploaded image from metadata
    image_path = "/home/ubuntu/.gemini/antigravity/brain/7219320e-7a33-4b7d-aab3-18c9acd55399/uploaded_image_1768315895103.png"
    
    if not os.path.exists(image_path):
        print(f"❌ Test image not found at {image_path}")
        return

    try:
        print(f"Processing receipt: {image_path}...")
        # This calls the full pipeline: Vision -> Fallback to OpenAI OCR -> OpenAI Structure
        result = process_receipt(image_path)
        
        print("\n✅ PIPELINE SUCCESS!")
        print("\n--- Extracted Data Preview ---")
        print(f"Vendor: {result.get('structured', {}).get('Vendor Name')}")
        print(f"Date: {result.get('structured', {}).get('Date')}")
        print(f"Total: {result.get('structured', {}).get('Total Amount')}")
        print(f"Categories: {result.get('structured', {}).get('Categories')}")
        print("----------------------------")
        
        # Print full raw text
        raw_text = result.get('raw_text', '')
        print("\n--- Raw OCR Text Extracted ---")
        print(raw_text)
        print("------------------------------")
        
    except Exception as e:
        print(f"\n❌ PIPELINE FAILED: {str(e)}")

if __name__ == "__main__":
    test_full_pipeline()
