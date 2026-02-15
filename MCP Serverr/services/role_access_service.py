"""
Role-based access control service.
Generates SQL constraints and system prompt context based on user role.
"""

from typing import Optional, List
from utils.jwt_auth import UserIdentity


# Dangerous SQL keywords that must never be executed
BLOCKED_SQL_KEYWORDS = [
    "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE",
    "CREATE", "GRANT", "REVOKE", "EXEC", "EXECUTE",
    "INTO",   # catches INSERT INTO
    "SET",    # catches UPDATE ... SET
]


def validate_read_only(sql_query: str) -> bool:
    """
    Validate that a SQL query is strictly read-only.
    Returns True if the query is safe (SELECT only), False otherwise.
    """
    normalized = sql_query.strip().upper()

    # Must start with SELECT or WITH (for CTEs)
    if not (normalized.startswith("SELECT") or normalized.startswith("WITH")):
        return False

    # Check for any blocked keywords as standalone words
    for keyword in BLOCKED_SQL_KEYWORDS:
        # Use word boundary check: keyword must be surrounded by non-alpha chars
        import re
        if re.search(rf'\b{keyword}\b', normalized):
            # Allow "INTO" only if it's part of SELECT ... INTO which we also block
            return False

    return True


def get_role_sql_constraints(identity: UserIdentity) -> str:
    """
    Generate SQL WHERE clause constraints based on user role.
    These are injected into the AI's SQL generation prompt.
    """
    if identity.is_admin():
        if identity.company_id:
            return f"""
ROLE CONSTRAINTS (ADMIN - Company-wide access):
- You have full read-only access to ALL data within company_id = '{identity.company_id}'
- Always filter by company_id when the table has that column
- You can see all users, managers, reimbursements, budgets, and analytics
- Present company-wide summaries and aggregations
"""
        return """
ROLE CONSTRAINTS (ADMIN - Full access):
- You have full read-only access to ALL data
- Present company-wide summaries and aggregations
"""

    if identity.is_manager():
        return f"""
ROLE CONSTRAINTS (MANAGER - Team access):
- User ID: '{identity.user_id}'
- You can see your OWN data (where user_id = '{identity.user_id}' or manager_id = '{identity.user_id}')
- You can see data for employees who report to you (where manager_id = '{identity.user_id}')
- For reimbursements: show records where user_id = '{identity.user_id}' OR the reimbursement belongs to a user whose manager_id = '{identity.user_id}'
- You CANNOT see organization-wide admin data or other managers' team data
- For team summaries, only include employees under your management
"""

    # Employee (default)
    return f"""
ROLE CONSTRAINTS (EMPLOYEE - Personal access only):
- User ID: '{identity.user_id}'
- You can ONLY see YOUR OWN data
- ALL queries MUST include: WHERE user_id = '{identity.user_id}'
- You CANNOT see other users' data, manager analytics, or admin reports
- Only show personal reimbursements, budgets, claims, and history
"""


def get_system_prompt(identity: UserIdentity) -> str:
    """
    Build the full system prompt for the RAG chatbot based on user role.
    """
    role_label = identity.role.upper()
    name_greeting = f" {identity.full_name}" if identity.full_name else ""

    return f"""You are FinCortex AI Assistant — a secure, role-aware assistant for the corporate reimbursement platform.

CURRENT USER:
- Name:{name_greeting}
- Role: {role_label}
- User ID: {identity.user_id}

YOUR RULES:
1. You are a READ-ONLY assistant. You NEVER modify, insert, update, or delete data.
2. If asked to modify data, politely refuse and explain you can only provide information.
3. NEVER expose raw SQL queries, internal IDs of other users, or authentication tokens in your responses.
4. Keep responses professional, concise, and business-friendly.
5. Present numbers clearly with currency symbols (₹), proper dates, and formatted totals.
6. If data is unavailable, explain gracefully: "No records found for the selected period."
7. If a request violates access permissions, respond: "I'm sorry, but I don't have access to that information based on your current role."
8. For ambiguous questions, ask a clarifying question.

{get_role_sql_constraints(identity)}

RESPONSE STYLE:
- Use professional, concise language
- Format currency amounts clearly (e.g., ₹12,500.00)
- Format dates in a readable way (e.g., February 13, 2026)
- Use bullet points or tables for multiple items
- Never use technical jargon unless the user asks for it
"""


def check_access_violation(message: str, identity: UserIdentity) -> Optional[str]:
    """
    Check if a user's message attempts to access data outside their role.
    Returns a refusal message if violated, None if OK.
    """
    message_lower = message.lower()

    if identity.is_employee():
        # Employee trying to access admin/manager features
        admin_keywords = [
            "all users", "all employees", "company-wide", "organization",
            "total company", "all departments", "all managers", "every user",
            "all reimbursements for everyone", "company analytics",
            "all teams", "entire company"
        ]
        for keyword in admin_keywords:
            if keyword in message_lower:
                return (
                    "I'm sorry, but I can only show you your own reimbursement data. "
                    "Company-wide or team-level information is not available for your role. "
                    "Please contact your manager or admin for broader reports."
                )

    if identity.is_manager():
        # Manager trying to access org-wide admin data
        admin_only_keywords = [
            "all departments", "company-wide analytics", "all managers",
            "organization total", "every department", "all teams budget",
            "company profit", "company loss"
        ]
        for keyword in admin_only_keywords:
            if keyword in message_lower:
                return (
                    "I can show you data for your team and your own records, "
                    "but company-wide analytics across all departments are only available to admins. "
                    "Please contact your administrator for organization-level reports."
                )

    # Check for data modification attempts (all roles)
    modification_keywords = [
        "delete", "remove", "update", "change", "modify", "edit",
        "approve my", "reject my", "mark as", "set status",
        "add a reimbursement", "create a claim", "submit"
    ]
    for keyword in modification_keywords:
        if keyword in message_lower:
            # Only block if it seems like a command, not a question about the process
            question_words = ["how to", "how do i", "can i", "what is the process", "where to"]
            is_question = any(q in message_lower for q in question_words)
            if not is_question:
                return (
                    "I'm a read-only assistant and cannot make changes to data. "
                    "I can help you find information about your reimbursements, budgets, and claims. "
                    "To make changes, please use the appropriate forms in the dashboard."
                )

    return None
