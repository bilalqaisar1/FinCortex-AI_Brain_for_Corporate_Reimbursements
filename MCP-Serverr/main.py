import requests
import json
import base64
from typing import Dict, Any, List, Optional
from config.settings import settings

class MCPReimbursementClient:
    def __init__(self, base_url: str = None):
        self.base_url = base_url or f"http://{settings.MCP_SERVER_HOST}:{settings.MCP_SERVER_PORT}"
        self.api_prefix = settings.API_PREFIX
    
    def _make_request(self, endpoint: str, method: str = "POST", data: Dict = None, files: Dict = None):
        """Helper method to make HTTP requests"""
        url = f"{self.base_url}{self.api_prefix}{endpoint}"
        
        try:
            if method == "POST":
                if files:
                    response = requests.post(url, files=files, data=data)
                else:
                    response = requests.post(url, json=data)
            elif method == "GET":
                response = requests.get(url, params=data)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            print(f"API Request failed: {e}")
            return {"success": False, "error": str(e)}
    
    def get_vision_status(self) -> Dict[str, Any]:
        """Check Google Vision API status"""
        return self._make_request("/ocr/vision-status", method="GET")
    
    def process_receipt(self, image_path: str, user_id: str) -> Dict[str, Any]:
        """Process receipt image and extract structured data"""
        # Read and encode image
        with open(image_path, "rb") as image_file:
            image_content = base64.b64encode(image_file.read()).decode('utf-8')
        
        data = {
            "user_id": user_id,
            "file_name": image_path.split("/")[-1],
            "file_content": image_content
        }
        
        return self._make_request("/ocr/process-receipt", data=data)
    
    def extract_receipt_fields(self, extracted_text: str) -> Dict[str, Any]:
        """Extract structured fields from receipt text using OpenAI"""
        data = {
            "extracted_text": extracted_text
        }
        
        return self._make_request("/openai/extract-receipt-fields", data=data)
    
    def process_receipt_end_to_end(self, image_path: str, user_id: str) -> Dict[str, Any]:
        """Complete end-to-end receipt processing"""
        with open(image_path, "rb") as image_file:
            image_content = base64.b64encode(image_file.read()).decode('utf-8')
        
        data = {
            "user_id": user_id,
            "file_name": image_path.split("/")[-1],
            "file_content": image_content
        }
        
        return self._make_request("/ocr/process-receipt-end-to-end", data=data)
    
    def analyze_receipt_structure(self, image_path: str, user_id: str) -> Dict[str, Any]:
        """Analyze receipt structure using enhanced vision detection"""
        with open(image_path, "rb") as image_file:
            image_content = base64.b64encode(image_file.read()).decode('utf-8')
        
        data = {
            "user_id": user_id,
            "file_name": image_path.split("/")[-1],
            "file_content": image_content
        }
        
        return self._make_request("/ocr/analyze-receipt-structure", data=data)
    
    def chat_with_rag(self, user_id: str, message: str, conversation_id: str = None) -> Dict[str, Any]:
        """Chat with RAG-based chatbot"""
        data = {
            "user_id": user_id,
            "message": message,
            "conversation_id": conversation_id
        }
        
        return self._make_request("/rag/chat", data=data)
    
    def get_user_reimbursements(self, user_id: str, status: str = None) -> Dict[str, Any]:
        """Get user reimbursements using SQL tool"""
        data = {
            "user_id": user_id,
            "status": status
        }
        
        return self._make_request("/tools/user-reimbursements", data=data, method="GET")
    
    def get_reimbursement_stats(self, user_id: str) -> Dict[str, Any]:
        """Get reimbursement statistics"""
        data = {
            "user_id": user_id
        }
        
        return self._make_request("/tools/reimbursement-stats", data=data, method="GET")
    
    def submit_reimbursement(self, user_id: str, receipt_data: Dict, purpose: str = None) -> Dict[str, Any]:
        """Submit new reimbursement request"""
        data = {
            "user_id": user_id,
            "receipt_data": receipt_data,
            "purpose": purpose
        }
        
        return self._make_request("/tools/submit-reimbursement", data=data)

# Test function
def test_mcp_server():
    """Test the MCP server functionality"""
    client = MCPReimbursementClient()
    
    print("Testing MCP Reimbursement Server...")
    
    # Test health check
    try:
        health_response = requests.get(f"{client.base_url}/health")
        print(f"Health Check: {health_response.json()}")
    except:
        print("Server is not running. Please start the server first.")
        return
    
    # Test vision status
    print("\n1. Testing Vision API Status:")
    vision_status = client.get_vision_status()
    print(f"Vision Status: {json.dumps(vision_status, indent=2)}")
    
    # Test tools listing
    print("\n2. Testing Tools Listing:")
    tools_response = requests.get(f"{client.base_url}/tools")
    print(f"Available Tools: {len(tools_response.json()['tools'])} tools")
    
    # Test RAG chatbot
    print("\n3. Testing RAG Chatbot:")
    rag_response = client.chat_with_rag(
        user_id="test_user_123",
        message="What are my total reimbursements for this month?"
    )
    print(f"RAG Response: {json.dumps(rag_response, indent=2)}")
    
    # Test reimbursement tools
    print("\n4. Testing Reimbursement Tools:")
    stats_response = client.get_reimbursement_stats(user_id="test_user_123")
    print(f"Stats Response: {json.dumps(stats_response, indent=2)}")
    
    # Test OCR with mock service (will work even without Google Vision credentials)
    print("\n5. Testing OCR Processing:")
    # Create a simple test by encoding a small image or using any image file
    try:
        # Try to use any image file that exists, or create a minimal one
        import tempfile
        from PIL import Image, ImageDraw
        
        # Create a simple test receipt image
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_file:
            # Create a simple image with text
            img = Image.new('RGB', (400, 200), color='white')
            d = ImageDraw.Draw(img)
            d.text((10, 10), "Test Receipt", fill='black')
            d.text((10, 30), "Total: $25.99", fill='black')
            img.save(temp_file.name, 'JPEG')
            temp_image_path = temp_file.name
        
        ocr_response = client.process_receipt_end_to_end(
            image_path=temp_image_path,
            user_id="test_user_123"
        )
        print(f"OCR Response: {json.dumps(ocr_response, indent=2)}")
        
    except Exception as e:
        print(f"OCR test skipped (PIL not available): {e}")
        # Fallback to testing with mock service directly
        ocr_response = client.process_receipt_end_to_end(
            image_path="any_nonexistent_image.jpg",  # This will trigger mock service
            user_id="test_user_123"
        )
        print(f"OCR Response (Mock): {json.dumps(ocr_response, indent=2)}")

if __name__ == "__main__":
    test_mcp_server()