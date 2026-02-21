from typing import List, Dict, Any, Optional
from models.schemas import ReimbursementRequest
from sqlalchemy.orm import Session
from models.database_models import Reimbursement
from sqlalchemy import text
import json

class SupabaseService:
    def __init__(self):
        # For direct Supabase connection (if needed)
        try:
            from supabase import create_client
            from config.settings import settings
            self.client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            self.supabase_available = True
        except ImportError:
            self.supabase_available = False
            print("Supabase client not available. Using SQLAlchemy only.")
    
    def get_user_reimbursements(self, user_id: str, status: Optional[str] = None, db: Session = None) -> List[Dict[str, Any]]:
        """
        Get user reimbursements from database
        """
        try:
            query = db.query(Reimbursement).filter(Reimbursement.user_id == user_id)
            
            if status:
                query = query.filter(Reimbursement.status == status)
            
            reimbursements = query.order_by(Reimbursement.created_at.desc()).all()
            
            result = []
            for reimbursement in reimbursements:
                result.append({
                    "id": reimbursement.id,
                    "user_id": reimbursement.user_id,
                    "merchant_name": reimbursement.merchant_name,
                    "transaction_date": reimbursement.transaction_date.isoformat() if reimbursement.transaction_date else None,
                    "total_amount": reimbursement.total_amount,
                    "tax_amount": reimbursement.tax_amount,
                    "currency": reimbursement.currency,
                    "purpose": reimbursement.purpose,
                    "project_code": reimbursement.project_code,
                    "status": reimbursement.status,
                    "created_at": reimbursement.created_at.isoformat() if reimbursement.created_at else None,
                    "items": reimbursement.items or []
                })
            
            return result
            
        except Exception as e:
            print(f"Error getting user reimbursements: {e}")
            return []
    
    def get_reimbursement_stats(self, user_id: str, db: Session = None) -> Dict[str, Any]:
        """
        Get reimbursement statistics for a user
        """
        try:
            # Get total count and amounts by status
            stats_query = text("""
                SELECT 
                    status,
                    COUNT(*) as count,
                    SUM(total_amount) as total_amount
                FROM reimbursements 
                WHERE user_id = :user_id 
                GROUP BY status
            """)
            
            result = db.execute(stats_query, {"user_id": user_id})
            status_stats = {}
            
            for row in result:
                status_stats[row.status] = {
                    "count": row.count,
                    "total_amount": float(row.total_amount) if row.total_amount else 0.0
                }
            
            # Get overall totals
            total_query = text("""
                SELECT 
                    COUNT(*) as total_count,
                    SUM(total_amount) as overall_total
                FROM reimbursements 
                WHERE user_id = :user_id
            """)
            
            total_result = db.execute(total_query, {"user_id": user_id}).fetchone()
            
            return {
                "status_breakdown": status_stats,
                "total_reimbursements": total_result.total_count if total_result else 0,
                "overall_total_amount": float(total_result.overall_total) if total_result and total_result.overall_total else 0.0,
                "user_id": user_id
            }
            
        except Exception as e:
            print(f"Error getting reimbursement stats: {e}")
            return {
                "status_breakdown": {},
                "total_reimbursements": 0,
                "overall_total_amount": 0.0,
                "user_id": user_id
            }
    
    def submit_reimbursement(self, reimbursement_request: ReimbursementRequest, db: Session = None) -> Dict[str, Any]:
        """
        Submit a new reimbursement request
        """
        try:
            receipt_data = reimbursement_request.receipt_data
            
            # Create new reimbursement record
            reimbursement = Reimbursement(
                user_id=reimbursement_request.user_id,
                merchant_name=receipt_data.merchant_name or "Unknown Merchant",
                transaction_date=receipt_data.transaction_date or "2024-01-01",  # Default date
                total_amount=receipt_data.total_amount or 0.0,
                tax_amount=receipt_data.tax_amount,
                currency=receipt_data.currency or "USD",
                purpose=reimbursement_request.purpose,
                project_code=reimbursement_request.project_code,
                status="pending",
                items=receipt_data.items
            )
            
            db.add(reimbursement)
            db.commit()
            db.refresh(reimbursement)
            
            return {
                "success": True,
                "data": {
                    "id": reimbursement.id,
                    "status": reimbursement.status,
                    "message": "Reimbursement submitted successfully"
                }
            }
            
        except Exception as e:
            db.rollback()
            return {
                "success": False,
                "error": f"Failed to submit reimbursement: {str(e)}"
            }