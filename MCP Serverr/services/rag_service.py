from typing import List, Dict, Any, Optional
from services.openai_service import OpenAIService
from services.supabase_service import SupabaseService
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text
import json

class RAGService:
    def __init__(self):
        self.openai_service = OpenAIService()
        self.supabase_service = SupabaseService()
    
    def get_database_schema(self, db: Session) -> str:
        """Get database schema information for SQL generation."""
        try:
            inspector = inspect(db.bind)
            tables = inspector.get_table_names()
            
            schema_info = []
            for table_name in tables:
                columns = inspector.get_columns(table_name)
                column_info = []
                for col in columns:
                    col_type = str(col['type'])
                    nullable = "NULL" if col['nullable'] else "NOT NULL"
                    column_info.append(f"  - {col['name']} ({col_type}) {nullable}")
                
                table_schema = f"Table: {table_name}\n" + "\n".join(column_info)
                schema_info.append(table_schema)
            
            return "\n\n".join(schema_info)
        except Exception as e:
            return f"Error getting schema: {str(e)}"
    
    def execute_sql_query(self, query: str, db: Session) -> Dict[str, Any]:
        """Execute a SQL query and return results."""
        try:
            result = db.execute(text(query))
            
            # Check if it's a SELECT query
            if query.strip().upper().startswith('SELECT'):
                rows = result.fetchall()
                columns = result.keys()
                
                # Convert to list of dicts
                data = []
                for row in rows:
                    data.append(dict(zip(columns, row)))
                
                return {
                    "success": True,
                    "data": data,
                    "row_count": len(data)
                }
            else:
                # For non-SELECT queries
                db.commit()
                return {
                    "success": True,
                    "message": "Query executed successfully",
                    "rows_affected": result.rowcount
                }
                
        except Exception as e:
            db.rollback()
            return {
                "success": False,
                "error": str(e)
            }
    
    def chat(self, user_id: str, message: str, conversation_history: List[Dict] = None, db: Session = None) -> Dict[str, Any]:
        """
        Main chat method for RAG chatbot with SQL query support
        """
        try:
            # Get database schema
            try:
                schema = self.get_database_schema(db)
            except Exception as schema_error:
                print(f"ERROR getting schema: {schema_error}")
                import traceback
                traceback.print_exc()
                return {
                    "success": False,
                    "error": f"Failed to get database schema: {str(schema_error)}",
                    "response": "I'm having trouble accessing the database schema. Please check the database connection."
                }
            
            # First, determine if this is a database query
            try:
                is_db_query = self._is_database_query(message)
            except Exception as detect_error:
                print(f"ERROR detecting query type: {detect_error}")
                is_db_query = False
            
            if is_db_query:
                # Generate and execute SQL query
                try:
                    return self._handle_database_query(message, schema, db)
                except Exception as db_error:
                    print(f"ERROR handling database query: {db_error}")
                    import traceback
                    traceback.print_exc()
                    return {
                        "success": False,
                        "error": str(db_error),
                        "response": f"Error processing database query: {str(db_error)}"
                    }
            else:
                # Handle as a regular reimbursement query
                try:
                    return self._handle_reimbursement_query(user_id, message, conversation_history, db)
                except Exception as reimbursement_error:
                    print(f"ERROR handling reimbursement query: {reimbursement_error}")
                    import traceback
                    traceback.print_exc()
                    return {
                        "success": False,
                        "error": str(reimbursement_error),
                        "response": f"Error processing reimbursement query: {str(reimbursement_error)}"
                    }
                
        except Exception as e:
            print(f"CRITICAL ERROR in chat method: {e}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": str(e),
                "response": "I'm sorry, I encountered an error while processing your request."
            }
    
    def _is_database_query(self, message: str) -> bool:
        """Determine if the message is asking for database information."""
        db_keywords = [
            'list', 'show', 'display', 'get', 'fetch', 'select',
            'table', 'data', 'database', 'query', 'sql',
            'admin', 'user', 'reimbursement', 'conversation',
            'all records', 'all data', 'everything'
        ]
        message_lower = message.lower()
        return any(keyword in message_lower for keyword in db_keywords)
    
    def _handle_database_query(self, message: str, schema: str, db: Session) -> Dict[str, Any]:
        """Handle database queries by generating and executing SQL."""
        try:
            # Generate SQL query using OpenAI
            sql_result = self._generate_sql_from_natural_language(message, schema)
            
            if not sql_result["success"]:
                return {
                    "success": False,
                    "response": f"Could not generate SQL query: {sql_result.get('error', 'Unknown error')}"
                }
            
            sql_query = sql_result["sql_query"]
            
            # Execute the SQL query
            exec_result = self.execute_sql_query(sql_query, db)
            
            if not exec_result["success"]:
                error_msg = f"Error executing query: {exec_result.get('error', 'Unknown error')}\n\nGenerated SQL:\n"
                return {
                    "success": False,
                    "response": error_msg + sql_query
                }
            
            # Generate natural language response from results
            response = self._format_query_results(message, sql_query, exec_result)
            
            return {
                "success": True,
                "response": response,
                "sources": ["database_query"],
                "sql_query": sql_query,
                "data": exec_result.get("data", [])
            }
            
        except Exception as e:
            return {
                "success": False,
                "response": f"Error processing database query: {str(e)}"
            }
    
    def _generate_sql_from_natural_language(self, message: str, schema: str) -> Dict[str, Any]:
        """Generate SQL query from natural language using OpenAI."""
        try:
            prompt = f"""
            You are a SQL expert. Generate a SQLite query based on the user's request.
            
            DATABASE SCHEMA:
            {schema}
            
            USER REQUEST: {message}
            
            IMPORTANT RULES:
            1. Return ONLY the SQL query, no explanations
            2. Use proper SQLite syntax
            3. For SELECT queries, limit to 100 rows unless specified otherwise
            4. Use table and column names exactly as shown in the schema
            5. Do not use quotes around table or column names unless necessary
            
            Generate the SQL query:
            """
            
            response = self.openai_service.client.chat.completions.create(
                model=self.openai_service.model,
                messages=[
                    {"role": "system", "content": "You are a SQL expert. Generate accurate SQLite queries. Return ONLY the SQL query with no markdown formatting or explanations."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=500
            )
            
            sql_query = response.choices[0].message.content.strip()
            
            # Clean up the SQL query (remove markdown code blocks if present)
            sql_query = sql_query.replace("```sql", "").replace("```", "").strip()
            
            return {
                "success": True,
                "sql_query": sql_query
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _format_query_results(self, original_query: str, sql_query: str, exec_result: Dict) -> str:
        """Format query results into a natural language response."""
        try:
            data = exec_result.get("data", [])
            row_count = exec_result.get("row_count", 0)
            
            if row_count == 0:
                return f"No data found for your query: '{original_query}'\\n\\nExecuted SQL:\\n{sql_query}"
            
            # Generate natural language summary using OpenAI
            prompt = f"""
            The user asked: "{original_query}"
            
            I executed this SQL query:
            {sql_query}
            
            Results ({row_count} rows):
            {json.dumps(data, indent=2, default=str)}
            
            Please provide a clear, natural language response that:
            1. Summarizes the results
            2. Presents the data in a readable format
            3. Answers the user's original question
            
            If there are many rows, show a summary and mention the total count.
            """
            
            response = self.openai_service.client.chat.completions.create(
                model=self.openai_service.model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that explains database query results in clear, natural language."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            natural_response = response.choices[0].message.content.strip()
            
            # Append the SQL query for transparency
            separator = "\n\n---\nExecuted SQL: "
            return natural_response + separator + sql_query
            
        except Exception as e:
            error_msg = f"Found {row_count} results. Error formatting response: {str(e)}\n\nSQL: {sql_query}\n\nRaw data: "
            return error_msg + json.dumps(data[:5], indent=2, default=str)
    
    def _handle_reimbursement_query(self, user_id: str, message: str, conversation_history: List[Dict], db: Session) -> Dict[str, Any]:
        """Handle reimbursement-specific queries (original functionality)."""
        try:
            # First, analyze the user's query to understand intent
            analysis_result = self.openai_service.process_natural_language_query(message, {"user_id": user_id})
            
            if not analysis_result["success"]:
                return {
                    "success": False,
                    "error": "Failed to analyze query",
                    "response": "I'm sorry, I couldn't understand your query. Please try again."
                }
            
            analysis = analysis_result["analysis"]
            intent = analysis.get("intent", "unknown")
            
            # Get relevant data based on intent
            context_data = self._get_relevant_context(user_id, intent, analysis.get("parameters", {}), db)
            
            # Generate response using context
            response_result = self._generate_response(
                user_id=user_id,
                message=message,
                intent=intent,
                context_data=context_data,
                conversation_history=conversation_history or []
            )
            
            return response_result
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "response": "I'm sorry, I encountered an error while processing your request."
            }
    
    def _get_relevant_context(self, user_id: str, intent: str, parameters: Dict, db: Session) -> Dict[str, Any]:
        """Get relevant context data based on query intent."""
        context = {}
        
        if intent in ["query_reimbursements", "check_status", "get_history"]:
            status = parameters.get('status')
            context["reimbursements"] = self.supabase_service.get_user_reimbursements(user_id, status, db)
            
        if intent in ["get_stats", "check_totals"]:
            context["statistics"] = self.supabase_service.get_reimbursement_stats(user_id, db)
            
        if intent in ["submit_receipt", "add_expense"]:
            context["submission_guidelines"] = {
                "required_fields": ["merchant_name", "transaction_date", "total_amount"],
                "supported_categories": ["food", "travel", "office_supplies", "entertainment", "other"]
            }
        
        return context
    
    def _generate_response(self, user_id: str, message: str, intent: str, context_data: Dict, conversation_history: List[Dict]) -> Dict[str, Any]:
        """Generate response using OpenAI with context."""
        try:
            context_str = self._format_context(context_data)
            history_str = self._format_conversation_history(conversation_history)
            
            prompt = f"""
            You are a helpful reimbursement assistant. Use the following context to answer the user's question accurately and helpfully.

            User ID: {user_id}
            Query Intent: {intent}
            
            Context Data:
            {context_str}
            
            Conversation History:
            {history_str}
            
            User's Current Question: {message}
            
            Please provide a helpful, accurate response based on the available context. If you don't have enough information, be honest about what you can and cannot do.
            """
            
            response = self.openai_service.client.chat.completions.create(
                model=self.openai_service.model,
                messages=[
                    {"role": "system", "content": "You are a reimbursement system assistant. Help users with reimbursement queries, submission guidelines, and status checks."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            answer = response.choices[0].message.content
            
            return {
                "success": True,
                "response": answer,
                "sources": list(context_data.keys()) if context_data else []
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "response": "I'm sorry, I encountered an error while generating a response."
            }
    
    def _format_context(self, context_data: Dict) -> str:
        """Format context data into a readable string."""
        if not context_data:
            return "No specific context data available."
        
        context_parts = []
        for key, value in context_data.items():
            context_parts.append(f"{key.upper()}:\\n{str(value)}")
        
        return "\\n\\n".join(context_parts)
    
    def _format_conversation_history(self, history: List[Dict]) -> str:
        """Format conversation history into a readable string."""
        if not history:
            return "No previous conversation history."
        
        history_parts = []
        for i, turn in enumerate(history, 1):
            role = turn.get("role", "unknown")
            content = turn.get("content", "")
            history_parts.append(f"Turn {i} ({role}): {content}")
        
        return "\\n".join(history_parts)