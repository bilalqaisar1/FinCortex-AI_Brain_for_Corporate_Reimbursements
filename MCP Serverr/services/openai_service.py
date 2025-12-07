import openai
from typing import Dict, Any, List
import json
import re
from config.settings import settings

class OpenAIService:
    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
    
    def extract_receipt_fields(self, extracted_text: str) -> Dict[str, Any]:
        """
        Use OpenAI to extract structured data from receipt text
        """
        try:
            prompt = f"""
            Analyze this receipt text and extract ALL relevant information with high precision.

            REQUIRED FIELDS:
            1. vendor_name: Complete shop or business name
            2. date: Transaction date in YYYY-MM-DD format
            3. time: Transaction time in HH:MM format (or null if missing)
            4. category: Main category of the purchase (e.g., food, grocery, electronics, etc.)
            5. sub_category: More specific category if identifiable
            6. items: List of purchased items. For EACH item return:
                - item_name: Full description
                - quantity: Default 1 if not shown
                - price: Total price for this item
            7. total_bill: Final total amount of the receipt
            8. tax: Full tax amount applied

            EXTRACTION RULES:
            - Capture ALL items exactly as they appear.
            - If quantity is written like "2x" or "x2", parse correctly.
            - If total item price is given but quantity is >1, calculate unit price internally if needed.
            - If date format is ambiguous, assume MM/DD/YYYY (US style).
            - Infer missing data logically but mark uncertainty.
            - Currency should be inferred where possible.
            - Output must follow the exact JSON structure.

            Receipt Text:
            {extracted_text}

            Return ONLY this JSON with NO additional text:
            {{
                "vendor_name": "string",
                "date": "YYYY-MM-DD",
                "time": "HH:MM or null",
                "category": "string",
                "sub_category": "string or null",
                "items": [
                    {{
                        "item_name": "string",
                        "quantity": number,
                        "price": number
                    }}
                ],
                "total_bill": number,
                "tax": number
            }}
            """
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert receipt parser with high attention to detail. Extract ALL items and fields from receipts with precision. Always return valid JSON matching the exact schema requested. Be thorough - capture every line item, calculate missing values when possible, and infer logical information from context."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=1000
            )
            
            # Extract JSON from response
            content = response.choices[0].message.content.strip()
            
            # Clean the response to extract only JSON
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                extracted_data = json.loads(json_str)
                
                return {
                    "success": True,
                    "extracted_data": extracted_data,
                    "raw_response": content
                }
            else:
                return {
                    "success": False,
                    "error": "Could not extract JSON from response",
                    "raw_response": content
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"OpenAI API error: {str(e)}"
            }
    
    def process_natural_language_query(self, query: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Process natural language queries for reimbursement system
        """
        try:
            context_str = json.dumps(context, indent=2) if context else "No additional context"
            
            prompt = f"""
            Process this natural language query about reimbursements and determine the intent and required action.
            
            Query: {query}
            Context: {context_str}
            
            Analyze the query and return JSON with:
            - intent: primary intent (query_reimbursements, submit_receipt, ask_question, etc.)
            - parameters: extracted parameters (date_range, status, amount_range, etc.)
            - sql_query: suggested SQL query if applicable
            - response_template: template for how to respond
            - requires_db_query: boolean indicating if database query is needed
            """
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a reimbursement system assistant. Analyze queries and determine appropriate actions."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            content = response.choices[0].message.content.strip()
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            
            if json_match:
                analysis = json.loads(json_match.group())
                return {
                    "success": True,
                    "analysis": analysis,
                    "raw_response": content
                }
            else:
                return {
                    "success": True,
                    "analysis": {
                        "intent": "unknown",
                        "parameters": {},
                        "requires_db_query": False,
                        "response_template": "I'll help you with your reimbursement query."
                    },
                    "raw_response": content
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"OpenAI processing error: {str(e)}"
            }
    
    def generate_sql_query(self, natural_language: str, schema_info: str) -> Dict[str, Any]:
        """
        Generate SQL query from natural language
        """
        try:
            prompt = f"""
            Database Schema Information:
            {schema_info}
            
            Natural Language Query: {natural_language}
            
            Generate a SQL query that answers this question. Return ONLY the SQL query without explanations.
            """
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a SQL expert. Generate accurate SQL queries based on natural language requests."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=500
            )
            
            sql_query = response.choices[0].message.content.strip()
            
            return {
                "success": True,
                "sql_query": sql_query,
                "raw_response": sql_query
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"SQL generation error: {str(e)}"
            }