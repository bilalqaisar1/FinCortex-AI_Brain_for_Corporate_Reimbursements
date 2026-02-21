from typing import List, Dict, Any, Optional
from services.openai_service import OpenAIService
from services.supabase_service import SupabaseService
from services.role_access_service import (
    validate_read_only,
    get_role_sql_constraints,
    get_system_prompt,
    check_access_violation,
)
from utils.jwt_auth import UserIdentity
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
        """Execute a READ-ONLY SQL query and return results."""
        # Strict read-only enforcement
        if not validate_read_only(query):
            return {
                "success": False,
                "error": "Query rejected: Only SELECT queries are allowed. Data modification is not permitted."
            }

        try:
            result = db.execute(text(query))
            rows = result.fetchall()
            columns = result.keys()

            data = []
            for row in rows:
                data.append(dict(zip(columns, row)))

            return {
                "success": True,
                "data": data,
                "row_count": len(data)
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def chat(
        self,
        user_id: str,
        message: str,
        conversation_history: List[Dict] = None,
        db: Session = None,
        identity: Optional[UserIdentity] = None,
    ) -> Dict[str, Any]:
        """
        Main chat method for RAG chatbot with role-based access control.
        """
        try:
            # Step 1: Check for access violations based on role
            if identity:
                violation = check_access_violation(message, identity)
                if violation:
                    return {
                        "success": True,
                        "response": violation,
                        "sources": [],
                        "role": identity.role,
                    }

            # Step 2: Get database schema
            try:
                schema = self.get_database_schema(db)
            except Exception as schema_error:
                print(f"ERROR getting schema: {schema_error}")
                return {
                    "success": False,
                    "error": f"Failed to get database schema: {str(schema_error)}",
                    "response": "I'm having trouble accessing the database schema. Please check the database connection."
                }

            # Step 3: Determine if this is a database query
            try:
                is_db_query = self._is_database_query(message)
            except Exception:
                is_db_query = False

            if is_db_query:
                try:
                    return self._handle_database_query(message, schema, db, identity)
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
                try:
                    return self._handle_reimbursement_query(
                        user_id, message, conversation_history, db, identity
                    )
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
            'all records', 'all data', 'everything',
            'budget', 'balance', 'remaining', 'spent', 'total',
            'claims', 'pending', 'approved', 'rejected',
            'how much', 'how many', 'recent', 'history', 'latest',
            'expense', 'category', 'department', 'team', 'status', 'tell',
        ]
        message_lower = message.lower()
        return any(keyword in message_lower for keyword in db_keywords)

    def _handle_database_query(
        self,
        message: str,
        schema: str,
        db: Session,
        identity: Optional[UserIdentity] = None,
    ) -> Dict[str, Any]:
        """Handle database queries with role-based SQL generation."""
        try:
            # Generate role-aware SQL query
            sql_result = self._generate_sql_from_natural_language(message, schema, identity)

            if not sql_result["success"]:
                return {
                    "success": False,
                    "response": f"Could not generate SQL query: {sql_result.get('error', 'Unknown error')}"
                }

            sql_query = sql_result["sql_query"]

            # Double-check read-only enforcement
            if not validate_read_only(sql_query):
                return {
                    "success": True,
                    "response": (
                        "I'm a read-only assistant and cannot perform data modifications. "
                        "I can help you find information about reimbursements, budgets, and claims."
                    ),
                    "sources": [],
                }

            # Execute the SQL query
            exec_result = self.execute_sql_query(sql_query, db)

            if not exec_result["success"]:
                return {
                    "success": False,
                    "response": f"I encountered an issue retrieving that data. Please try rephrasing your question."
                }

            # Generate natural language response
            response = self._format_query_results(message, sql_query, exec_result, identity)

            return {
                "success": True,
                "response": response,
                "sources": ["database_query"],
                "data": exec_result.get("data", []),
                "role": identity.role if identity else None,
            }

        except Exception as e:
            return {
                "success": False,
                "response": f"Error processing your query: {str(e)}"
            }

    def _generate_sql_from_natural_language(
        self,
        message: str,
        schema: str,
        identity: Optional[UserIdentity] = None,
    ) -> Dict[str, Any]:
        """Generate a role-constrained SQL query from natural language."""
        try:
            role_constraints = ""
            if identity:
                role_constraints = get_role_sql_constraints(identity)

            prompt = f"""
            You are a SQL expert for a corporate reimbursement system. Generate a safe, READ-ONLY SQLite query.

            DATABASE SCHEMA:
            {schema}

            {role_constraints}

            USER REQUEST: {message}

            CRITICAL RULES:
            1. Return ONLY the SQL query, no explanations
            2. Use proper SQLite syntax
            3. ONLY generate SELECT statements — never INSERT, UPDATE, DELETE, DROP, ALTER
            4. Limit results to 50 rows unless the user asks for more (e.g., "all")
            5. For "latest", "recent", or "last" items, always use ORDER BY created_at DESC LIMIT X
            6. Use table and column names exactly as shown in the schema
            7. Always apply the role constraints above — this is a security requirement
            8. If the role constraints specify a user_id filter, you MUST include it
            9. Do not use quotes around table or column names unless necessary

            Generate the SQL query:
            """

            response = self.openai_service.client.chat.completions.create(
                model=self.openai_service.model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a SQL expert for a reimbursement system. "
                            "Generate accurate, READ-ONLY SQLite queries. "
                            "Return ONLY the SQL query with no markdown formatting or explanations. "
                            "NEVER generate INSERT, UPDATE, DELETE, or any data modification statement."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.1,
                max_tokens=500,
            )

            sql_query = response.choices[0].message.content.strip()
            sql_query = sql_query.replace("```sql", "").replace("```", "").strip()

            return {"success": True, "sql_query": sql_query}

        except Exception as e:
            return {"success": False, "error": str(e)}

    def _format_query_results(
        self,
        original_query: str,
        sql_query: str,
        exec_result: Dict,
        identity: Optional[UserIdentity] = None,
    ) -> str:
        """Format query results into a professional natural language response."""
        try:
            data = exec_result.get("data", [])
            row_count = exec_result.get("row_count", 0)

            if row_count == 0:
                return "No records found for your query. This could mean there are no matching entries for the selected criteria or time period."

            role_context = ""
            if identity:
                role_context = f"\nThe user's role is {identity.role}. Address them appropriately."

            prompt = f"""
            The user asked: "{original_query}"
            {role_context}

            Results ({row_count} rows):
            {json.dumps(data[:20], indent=2, default=str)}
            {"(showing first 20 of " + str(row_count) + " results)" if row_count > 20 else ""}

            Please provide a clear, professional response that:
            1. Directly answers the user's question
            2. Presents data in a readable format (use bullet points or a summary)
            3. Formats currency amounts with ₹ symbol
            4. Formats dates in a readable way
            5. NEVER show raw SQL queries or internal database IDs
            6. Keep the response concise and business-friendly
            """

            system_content = (
                "You are FinCortex AI Assistant. Present database results in a clear, "
                "professional, business-friendly format. Never show raw SQL or internal IDs. "
                "Use ₹ for currency. Be concise."
            )

            response = self.openai_service.client.chat.completions.create(
                model=self.openai_service.model,
                messages=[
                    {"role": "system", "content": system_content},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=1000,
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            return f"Found {row_count} results but encountered an error formatting the response. Please try again."

    def _handle_reimbursement_query(
        self,
        user_id: str,
        message: str,
        conversation_history: List[Dict],
        db: Session,
        identity: Optional[UserIdentity] = None,
    ) -> Dict[str, Any]:
        """Handle reimbursement-specific queries with role awareness."""
        try:
            analysis_result = self.openai_service.process_natural_language_query(
                message, {"user_id": user_id}
            )

            if not analysis_result["success"]:
                return {
                    "success": False,
                    "error": "Failed to analyze query",
                    "response": "I'm sorry, I couldn't understand your query. Please try again."
                }

            analysis = analysis_result["analysis"]
            intent = analysis.get("intent", "unknown")

            context_data = self._get_relevant_context(user_id, intent, analysis.get("parameters", {}), db)

            response_result = self._generate_response(
                user_id=user_id,
                message=message,
                intent=intent,
                context_data=context_data,
                conversation_history=conversation_history or [],
                identity=identity,
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
                "message": "I'm a read-only assistant. To submit a receipt or expense, please use the Claims section in your dashboard.",
                "required_fields": ["merchant_name", "transaction_date", "total_amount"],
                "supported_categories": ["food", "travel", "office_supplies", "entertainment", "other"]
            }

        return context

    def _generate_response(
        self,
        user_id: str,
        message: str,
        intent: str,
        context_data: Dict,
        conversation_history: List[Dict],
        identity: Optional[UserIdentity] = None,
    ) -> Dict[str, Any]:
        """Generate role-aware response using OpenAI with context."""
        try:
            context_str = self._format_context(context_data)
            history_str = self._format_conversation_history(conversation_history)

            system_prompt = get_system_prompt(identity) if identity else (
                "You are FinCortex AI Assistant, a helpful reimbursement system assistant. "
                "Help users with reimbursement queries, budget checks, and status information. "
                "You are read-only and cannot modify any data."
            )

            prompt = f"""
            Query Intent: {intent}

            Context Data:
            {context_str}

            Conversation History:
            {history_str}

            User's Current Question: {message}

            Provide a helpful, accurate response based on the available context.
            If you don't have enough information, be honest about what you can and cannot answer.
            """

            response = self.openai_service.client.chat.completions.create(
                model=self.openai_service.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=500,
            )

            answer = response.choices[0].message.content

            return {
                "success": True,
                "response": answer,
                "sources": list(context_data.keys()) if context_data else [],
                "role": identity.role if identity else None,
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
            context_parts.append(f"{key.upper()}:\n{str(value)}")

        return "\n\n".join(context_parts)

    def _format_conversation_history(self, history: List[Dict]) -> str:
        """Format conversation history into a readable string."""
        if not history:
            return "No previous conversation history."

        # Keep last 10 turns for context window management
        recent = history[-10:]
        history_parts = []
        for i, turn in enumerate(recent, 1):
            role = turn.get("role", "unknown")
            content = turn.get("content", "")
            history_parts.append(f"Turn {i} ({role}): {content}")

        return "\n".join(history_parts)