from paddleocr import PaddleOCR
import os

# Initialize PaddleOCR with all default models
ocr = PaddleOCR(
    lang='en',
    use_textline_orientation=False
)

# Path to your image
img_path = 'C:\\Users\\User\\Desktop\\OCRs\\EasyOCR\\pic1.jpg'

def print_receipt_section(texts, scores, start_idx, count, title):
    print(f"\n{title}:")
    print("-" * 40)
    for i in range(start_idx, min(start_idx + count, len(texts))):
        confidence = float(scores[i])
        print(f"{texts[i]} (Confidence: {confidence:.2f})")

# Verify if the image exists
if not os.path.exists(img_path):
    print(f"Error: Image not found at {img_path}")
else:
    try:
        # Perform OCR
        print("Processing image...")
        result = ocr.ocr(img_path)
        
        # Print results in a readable format
        if isinstance(result, list) and result and len(result) > 0:
            try:
                # Extract texts and scores
                texts = result[0].get('rec_texts', [])
                scores = result[0].get('rec_scores', [])
                
                if texts and scores:
                    print("\n=== Receipt Details ===")
                    
                    # Header Information
                    print_receipt_section(texts, scores, 0, 7, "Business Information")
                    
                    # Transaction Details
                    next_idx = 7
                    print_receipt_section(texts, scores, next_idx, 8, "Transaction Information")
                    
                    # Items and Pricing
                    next_idx = 15
                    print_receipt_section(texts, scores, next_idx, 30, "Items and Pricing")
                    
                    # Payment Details
                    next_idx = 45
                    print_receipt_section(texts, scores, next_idx, 10, "Payment Information")
                    
                    # Footer Information
                    next_idx = 55
                    print_receipt_section(texts, scores, next_idx, len(texts) - next_idx, "Additional Information")
                    
                else:
                    print("No text was detected in the image.")
            except Exception as e:
                print(f"Error parsing results: {str(e)}")
                
    except Exception as e:
        print(f"An error occurred: {str(e)}")
