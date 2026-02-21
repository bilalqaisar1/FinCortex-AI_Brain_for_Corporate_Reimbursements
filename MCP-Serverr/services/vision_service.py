import base64
import requests
from typing import List, Dict, Any
from config.settings import settings

class VisionService:
    def __init__(self):
        self.api_key = settings.GOOGLE_VISION_API_KEY
        self.api_url = f"https://vision.googleapis.com/v1/images:annotate?key={self.api_key}"
        self.vision_available = bool(self.api_key)
    
    def extract_text_from_receipt(self, image_content: str) -> Dict[str, Any]:
        """
        Extract text from receipt using Google Vision REST API
        """
        if not self.vision_available:
            return self._mock_vision_service(image_content)
        
        try:
            # Prepare the request payload
            request_data = {
                "requests": [
                    {
                        "image": {
                            "content": image_content
                        },
                        "features": [
                            {
                                "type": "TEXT_DETECTION",
                                "maxResults": 1
                            }
                        ]
                    }
                ]
            }
            
            # Make API request
            response = requests.post(self.api_url, json=request_data, timeout=30)
            response.raise_for_status()
            result = response.json()
            
            # Extract text from response
            if 'responses' in result and result['responses']:
                text_annotations = result['responses'][0].get('textAnnotations', [])
                if text_annotations:
                    full_text = text_annotations[0].get('description', '')
                    
                    return {
                        'success': True,
                        'full_text': full_text,
                        'raw_response': result
                    }
            
            return {
                'success': False,
                'error': 'No text found in image'
            }
                
        except Exception as e:
            return {
                'success': False,
                'error': f"Vision API error: {str(e)}"
            }
    
    def _mock_vision_service(self, image_content: str) -> Dict[str, Any]:
        """
        Mock vision service for testing
        """
        mock_receipt_text = """
        STORE NAME: Example Supermarket
        DATE: 2024-01-15
        TIME: 14:30:22
        
        ITEMS:
        Groceries          $25.99
        Office Supplies    $15.50
        Tax                $3.32
        
        TOTAL: $44.81
        PAYMENT: Credit Card ****1234
        THANK YOU FOR SHOPPING WITH US!
        """
        
        return {
            'success': True,
            'full_text': mock_receipt_text,
            'raw_response': 'Mock vision service response'
        }