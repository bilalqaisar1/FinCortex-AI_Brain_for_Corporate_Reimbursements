"""
In-app notification management API routes.
"""

import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, Body

from app.services.supabase_service import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/notifications")
async def get_notifications(user_id: str = Query(...)) -> List[Dict[str, Any]]:
    """Fetch all in-app notifications for a specific user."""
    logger.info(f"📥 GET /notifications?user_id={user_id}")
    supabase = get_supabase_client()
    try:
        resp = supabase.table("in_app_notifications") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .limit(50) \
            .execute()
        return resp.data
    except Exception as e:
        logger.error(f"Error fetching notifications: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/notifications")
async def update_notification_status(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """Update notification status (mark read, etc)."""
    action = payload.get("action")
    notification_id = payload.get("notification_id")
    user_id = payload.get("user_id")
    
    logger.info(f"📥 POST /notifications - Action: {action}")
    supabase = get_supabase_client()
    
    try:
        if action == "mark_read" and notification_id:
            supabase.table("in_app_notifications") \
                .update({"is_read": True}) \
                .eq("notification_id", notification_id) \
                .execute()
            return {"success": True}
        
        elif action == "mark_all_read" and user_id:
            supabase.table("in_app_notifications") \
                .update({"is_read": True}) \
                .eq("user_id", user_id) \
                .execute()
            return {"success": True}
        
        else:
            raise HTTPException(status_code=400, detail="Invalid action or missing parameters")
            
    except Exception as e:
        logger.error(f"Error updating notification status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
