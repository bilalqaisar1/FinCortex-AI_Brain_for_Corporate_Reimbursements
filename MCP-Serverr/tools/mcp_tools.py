from typing import List, Dict, Any

def get_available_tools() -> List[Dict[str, Any]]:
    """
    Return list of available MCP tools
    """
    return [
        {
            "name": "receipt_text_extraction_azure",
            "description": "Extract raw text from a receipt document using Azure Document Intelligence (Primary)",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_content": {"type": "string", "description": "Base64 encoded file content (image/pdf)"}
                },
                "required": ["file_content"]
            }
        },
        {
            "name": "receipt_text_extraction_openai",
            "description": "Extract raw text from a receipt image using OpenAI Vision as a fallback OCR",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_content": {"type": "string", "description": "Base64 encoded image content"}
                },
                "required": ["file_content"]
            }
        },
        {
            "name": "receipt_structuring_tool",
            "description": "Convert unstructured receipt text into a structured JSON response",
            "parameters": {
                "type": "object",
                "properties": {
                    "extracted_text": {"type": "string", "description": "Raw text extracted from receipt"},
                    "admin_id": {"type": "string", "description": "Optional admin ID to fetch company-specific categories"}
                },
                "required": ["extracted_text"]
            }
        },
        {
            "name": "receipt_validation_tool",
            "description": "Validate the structured receipt data for correctness and completeness",
            "parameters": {
                "type": "object",
                "properties": {
                    "structured_data": {"type": "object", "description": "JSON data generated from structuring tool"}
                },
                "required": ["structured_data"]
            }
        },
        {
            "name": "error_handling_and_retry_tool",
            "description": "Handle errors and determine retry logic for failed tool calls",
            "parameters": {
                "type": "object",
                "properties": {
                    "error_message": {"type": "string", "description": "Error message to analyze"},
                    "retry_count": {"type": "integer", "description": "Current retry attempt"}
                },
                "required": ["error_message"]
            }
        },
        {
            "name": "logging_and_audit_tool",
            "description": "Log AI operations and tool calls for audit purposes",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "ID of the user"},
                    "operation": {"type": "string", "description": "Name of the operation"},
                    "details": {"type": "object", "description": "Operation details"}
                },
                "required": ["user_id", "operation"]
            }
        },
        {
            "name": "process_receipt_end_to_end",
            "description": "Process receipt using agentic pipeline (Azure -> OpenAI Fallback -> Structuring)",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "ID of the user"},
                    "file_content": {"type": "string", "description": "Base64 encoded image content"}
                },
                "required": ["user_id", "file_content"]
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
        }
    ]