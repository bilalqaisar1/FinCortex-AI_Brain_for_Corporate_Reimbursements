"""
JWT Authentication utility for decoding Supabase tokens.
Extracts user_id, role, and company_id from the JWT payload.
"""

from jose import jwt, JWTError, ExpiredSignatureError
from typing import Dict, Any, Optional
from fastapi import HTTPException, Header
from config.settings import settings
from services.supabase_service import SupabaseService


class UserIdentity:
    """Decoded user identity from JWT + database lookup."""

    def __init__(self, user_id: str, role: str, company_id: Optional[str] = None,
                 email: Optional[str] = None, full_name: Optional[str] = None,
                 manager_id: Optional[str] = None):
        self.user_id = user_id
        self.role = role  # "employee" | "manager" | "admin"
        self.company_id = company_id
        self.email = email
        self.full_name = full_name
        self.manager_id = manager_id  # For managers: their own ID; for employees: their manager's ID

    def is_employee(self) -> bool:
        return self.role == "employee" or self.role == "user"

    def is_manager(self) -> bool:
        return self.role == "manager"

    def is_admin(self) -> bool:
        return self.role == "admin"


_supabase_service = SupabaseService()


def decode_supabase_jwt(token: str) -> Dict[str, Any]:
    """
    Decode a Supabase JWT token.
    Supabase uses the JWT secret derived from the project's settings.
    """
    try:
        # Remove 'Bearer ' prefix if present
        if token.startswith("Bearer "):
            token = token[7:]

        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


async def get_current_user(authorization: Optional[str] = Header(None)) -> UserIdentity:
    """
    FastAPI dependency that extracts and validates user identity from JWT.
    Falls back to basic user_id extraction if full profile lookup fails.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header is required")

    payload = decode_supabase_jwt(authorization)

    user_id = payload.get("sub")
    email = payload.get("email")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: missing user ID")

    # Look up user role and company from Supabase
    role, company_id, full_name, manager_id = await _lookup_user_role(user_id, email)

    return UserIdentity(
        user_id=user_id,
        role=role,
        company_id=company_id,
        email=email,
        full_name=full_name,
        manager_id=manager_id,
    )


async def _lookup_user_role(user_id: str, email: Optional[str] = None):
    """
    Look up user role from Supabase tables.
    Checks admins, managers, and users tables in order.
    Returns (role, company_id, full_name, manager_id).
    """
    try:
        client = _supabase_service.client

        # Check admins table
        admin_result = client.table("admins").select(
            "admin_id, full_name, email, company_id"
        ).eq("admin_id", user_id).execute()

        if admin_result.data and len(admin_result.data) > 0:
            admin = admin_result.data[0]
            return "admin", admin.get("company_id"), admin.get("full_name"), None

        # Check managers table
        manager_result = client.table("managers").select(
            "manager_id, full_name, email, company_id"
        ).eq("manager_id", user_id).execute()

        if manager_result.data and len(manager_result.data) > 0:
            manager = manager_result.data[0]
            return "manager", manager.get("company_id"), manager.get("full_name"), manager.get("manager_id")

        # Check users table
        user_result = client.table("users").select(
            "user_id, full_name, email, company_id, manager_id"
        ).eq("user_id", user_id).execute()

        if user_result.data and len(user_result.data) > 0:
            user = user_result.data[0]
            return "employee", user.get("company_id"), user.get("full_name"), user.get("manager_id")

        # Fallback if email-based lookup
        if email:
            user_by_email = client.table("users").select(
                "user_id, full_name, email, company_id, manager_id"
            ).eq("email", email).execute()

            if user_by_email.data and len(user_by_email.data) > 0:
                user = user_by_email.data[0]
                return "employee", user.get("company_id"), user.get("full_name"), user.get("manager_id")

        # Default to employee if not found
        return "employee", None, None, None

    except Exception as e:
        print(f"Warning: Could not look up user role: {e}")
        return "employee", None, None, None
