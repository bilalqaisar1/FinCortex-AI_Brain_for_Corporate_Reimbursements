from typing import List, Dict, Any

def get_available_tools() -> List[Dict[str, Any]]:
    """
    Return list of available MCP tools
    """
    return [
        {
            "name": "process_receipt",
            "description": "Process a receipt image and extract text using Google Vision API",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "ID of the user"},
                    "file_name": {"type": "string", "description": "Name of the file"},
                    "file_content": {"type": "string", "description": "Base64 encoded image content"}
                },
                "required": ["user_id", "file_name", "file_content"]
            }
        },
        {
            "name": "process_receipt_end_to_end",
            "description": "Process receipt image and extract structured data using Vision API and OpenAI",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "ID of the user"},
                    "file_name": {"type": "string", "description": "Name of the file"},
                    "file_content": {"type": "string", "description": "Base64 encoded image content"}
                },
                "required": ["user_id", "file_name", "file_content"]
            }
        },
        {
            "name": "extract_receipt_fields",
            "description": "Extract structured fields from receipt text using OpenAI",
            "parameters": {
                "type": "object",
                "properties": {
                    "extracted_text": {"type": "string", "description": "Text extracted from receipt"}
                },
                "required": ["extracted_text"]
            }
        },
        {
            "name": "chat_with_rag",
            "description": "Chat with RAG-based reimbursement chatbot",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "ID of the user"},
                    "message": {"type": "string", "description": "Message from the user"},
                    "conversation_id": {"type": "string", "description": "ID of the conversation"}
                },
                "required": ["user_id", "message"]
            }
        },
        {
            "name": "get_user_reimbursements",
            "description": "Get reimbursements for a user with optional status filter",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "ID of the user"},
                    "status": {"type": "string", "description": "Status to filter by (pending, approved, rejected, paid)"}
                },
                "required": ["user_id"]
            }
        },
        {
            "name": "get_reimbursement_stats",
            "description": "Get reimbursement statistics for a user",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "ID of the user"}
                },
                "required": ["user_id"]
            }
        },
        {
            "name": "submit_reimbursement",
            "description": "Submit a new reimbursement request",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "ID of the user"},
                    "receipt_data": {"type": "object", "description": "Structured receipt data"},
                    "purpose": {"type": "string", "description": "Purpose of the reimbursement"}
                },
                "required": ["user_id", "receipt_data"]
            }
        }
    ]