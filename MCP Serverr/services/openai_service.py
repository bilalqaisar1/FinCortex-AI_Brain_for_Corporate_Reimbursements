import openai
from typing import Dict, Any, List
import json
import re
from config.settings import settings

class OpenAIService:
    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
    
    def extract_receipt_fields(self, extracted_text: str, categories: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Use OpenAI to extract structured data from receipt text.
        When admin-defined categories are provided, uses strict allow-list logic
        for reimbursability decisions.
        """
        try:
            has_admin_categories = bool(categories)
            categories_str = "No specific categories provided. Infer standard business categories."
            if categories:
                cat_list = []
                for cat in categories:
                    subs = cat.get('subcategories', [])
                    sub_entries = []
                    for sub in subs:
                        sub_name = sub.get('subcategory_name', '')
                        sub_id = sub.get('subcategory_id', '')
                        sub_entries.append(f"{sub_name} (SubID: {sub_id})")
                    cat_info = f"- {cat.get('category_name')} (ID: {cat.get('category_id')})"
                    if sub_entries:
                        cat_info += f" [Subcategories: {', '.join(sub_entries)}]"
                    cat_list.append(cat_info)
                categories_str = "\n".join(cat_list)

            # Build the reimbursability rules based on whether admin categories exist
            if has_admin_categories and categories_str != "No specific categories provided. Infer standard business categories.":
                reimbursability_rules = f"""
            STRICT REIMBURSABILITY RULES (COMPANY POLICY — THESE ARE ABSOLUTE AND MUST NOT BE IGNORED):
            - The ALLOWED CATEGORIES list below is the COMPLETE, EXHAUSTIVE list of reimbursable categories.
            - An item is reimbursable (is_reimbursable: true) ONLY IF its natural category or subcategory
              EXACTLY matches one of the ALLOWED CATEGORIES listed below.
            - IF AN ITEM DOES NOT FIT ANY ALLOWED CATEGORY, IT MUST BE MARKED is_reimbursable: false.
              NO EXCEPTIONS. This is the most important rule.
            - DO NOT invent categories. DO NOT use "Uncategorized", "General", or "Other".
            - DO NOT assume any category is allowed unless it appears in the ALLOWED CATEGORIES list.

            EXAMPLES OF CORRECT BEHAVIOR:
            - If ALLOWED CATEGORIES are "Medical" and "Travel":
              * "Bananas" (Grocery) → is_reimbursable: false, rejection_reason: "Category 'Grocery' is not in allowed categories: Medical, Travel"
              * "Bluetooth Care" (Electronics) → is_reimbursable: false, rejection_reason: "Category 'Electronics' is not in allowed categories: Medical, Travel"
              * "Dining Table" (Furniture) → is_reimbursable: false, rejection_reason: "Category 'Furniture' is not in allowed categories: Medical, Travel"
              * "Prescription Medicine" (Medical) → is_reimbursable: true, rejection_reason: null
              * "Flight Ticket" (Travel) → is_reimbursable: true, rejection_reason: null
              * "Wine Bottle" (Alcohol) → is_reimbursable: false, rejection_reason: "Category 'Alcohol' is not in allowed categories: Medical, Travel"
            - For reimbursable items, set rejection_reason to null.

            CURRENT ALLOWED CATEGORIES:
            {categories_str}
            """
            elif categories is not None and len(categories) == 0:
                # Admin exists but has defined ZERO categories → nothing is reimbursable
                reimbursability_rules = """
            STRICT REIMBURSABILITY RULES (COMPANY POLICY — NO CATEGORIES CONFIGURED):
            - The company administrator has NOT configured any reimbursement categories.
            - Therefore, ALL items must be marked is_reimbursable: false.
            - Set rejection_reason to: "No reimbursement categories configured for this company. All items are non-reimbursable."
            - NO EXCEPTIONS. Every single item must be non-reimbursable.
            """
            else:
                reimbursability_rules = """
            REIMBURSABILITY RULES (DEFAULT — NO COMPANY CATEGORIES DEFINED):
            - Mark is_reimbursable: false for alcohol, tobacco, personal entertainment,
              or obvious non-business items.
            - All other items default to is_reimbursable: true.
            - Set rejection_reason to a short explanation for non-reimbursable items, null otherwise.
            """

            prompt = f"""
            Analyze this receipt text and extract ALL relevant information with high precision.

            REQUIRED FIELDS:
            1. vendor_name: Complete shop or business name
            2. date: Transaction date in YYYY-MM-DD format
            3. time: Transaction time in HH:MM format (or null if missing)
            4. category: Main category of the purchase (choose ONLY from ALLOWED CATEGORIES if provided, else infer)
            5. sub_category: More specific category if identifiable (choose ONLY from ALLOWED CATEGORIES if provided)
            6. items: List of purchased items. For EACH item return:
                - item_name: Full description
                - quantity: Default 1 if not shown
                - price: Total price for this item
                - category: Assign from ALLOWED CATEGORIES if possible, else item's natural category
                - subcategory: Assign from ALLOWED CATEGORIES subcategories if possible, else null
                - is_reimbursable: Boolean — see STRICT REIMBURSABILITY RULES below
                - rejection_reason: String explanation if not reimbursable, null if reimbursable
            7. total_bill: Final total amount of the receipt
            8. tax: Full tax amount applied
            {reimbursability_rules}

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
                "category": "string (Must be one of the allowed categories or 'Uncategorized')",
                "sub_category": "string (Must be one of the allowed subcategories or null)",
                "category_id": number (ID of the matched category or null),
                "subcategory_id": number (ID of the matched subcategory or null),
                "items": [
                    {{
                        "item_name": "string",
                        "quantity": number,
                        "price": number,
                        "category": "string (Item-level category)",
                        "subcategory": "string or null",
                        "is_reimbursable": boolean,
                        "rejection_reason": "string or null"
                    }}
                ],
                "total_bill": number,
                "tax": number
            }}"""
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert receipt parser with high attention to detail. Extract ALL items and fields from receipts with precision. Always return valid JSON matching the exact schema requested. Be thorough - capture every line item, calculate missing values when possible, and infer logical information from context."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=2000
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
    
    def extract_text_with_vision(self, image_content: str) -> Dict[str, Any]:
        """
        Use OpenAI's vision capability (GPT-4o-mini) as a fallback OCR.
        
        Args:
            image_content: Base64 encoded image content
            
        Returns:
            Extracted raw text from the image
        """
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "This is a receipt image. Please perform OCR and extract all readable text content exactly as it appears. If it's not a receipt, just extract all text you see regardless."},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_content}"
                                },
                            },
                        ],
                    }
                ],
                max_tokens=2000,
            )
            
            extracted_text = response.choices[0].message.content.strip()
            
            return {
                "success": True,
                "full_text": extracted_text,
                "raw_response": "OpenAI Vision processing successful"
            }

        except Exception as e:
            logger.error(f"❌ OpenAI Vision (OCR Fallback) failed: {str(e)}")
            return {
                "success": False,
                "error": f"OpenAI Vision OCR failed: {str(e)}"
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