"""
Fraud detection service for FinCortex.
Detects duplicate receipts and flags suspicious claims.
"""

import hashlib
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from dataclasses import dataclass

from app.services.supabase_service import get_supabase_client

logger = logging.getLogger(__name__)


@dataclass
class DuplicateResult:
    """Result of duplicate detection check."""
    is_duplicate: bool
    similarity_score: float
    matching_reimbursement_id: Optional[str] = None
    matching_receipt_code: Optional[str] = None
    reason: Optional[str] = None


@dataclass
class FraudCheckResult:
    """Result of fraud detection check."""
    is_suspicious: bool
    risk_score: float  # 0.0 to 1.0
    flags: List[str]
    details: Dict[str, Any]


class FraudDetectionService:
    """
    Fraud detection service for reimbursement claims.
    Checks for duplicates, anomalies, and policy violations.
    """
    
    def __init__(self):
        self.supabase = get_supabase_client()
    
    def compute_receipt_hash(self, receipt_data: Dict[str, Any]) -> str:
        """
        Compute a hash for receipt data to detect duplicates.
        
        Args:
            receipt_data: Dictionary containing receipt details
        
        Returns:
            SHA256 hash of normalized receipt data
        """
        # Normalize data for consistent hashing
        normalized = {
            "amount": str(receipt_data.get("total_amount", "")).strip(),
            "vendor": str(receipt_data.get("vendor_name", "")).strip().lower(),
            "date": str(receipt_data.get("purchase_date", "")).strip(),
        }
        
        # Create hash from normalized data
        hash_input = f"{normalized['amount']}|{normalized['vendor']}|{normalized['date']}"
        return hashlib.sha256(hash_input.encode()).hexdigest()
    
    async def check_for_duplicates(
        self,
        user_id: str,
        receipt_data: Dict[str, Any],
        days_lookback: int = 90
    ) -> DuplicateResult:
        """
        Check if a receipt is a duplicate of an existing submission.
        
        Args:
            user_id: User submitting the claim
            receipt_data: Receipt details to check
            days_lookback: How many days back to check for duplicates
        
        Returns:
            DuplicateResult with detection outcome
        """
        try:
            # Compute hash for the new receipt
            new_hash = self.compute_receipt_hash(receipt_data)
            
            # Get recent reimbursements for this user
            cutoff_date = (datetime.now() - timedelta(days=days_lookback)).isoformat()
            
            response = self.supabase.table("reimbursements").select(
                "reimbursement_id, receipt_code, amount_claimed, vendor_name, expense_date, receipt_hash"
            ).eq(
                "user_id", user_id
            ).gte(
                "created_at", cutoff_date
            ).execute()
            
            existing_claims = response.data or []
            
            for claim in existing_claims:
                # Check by hash first (exact match)
                if claim.get("receipt_hash") == new_hash:
                    return DuplicateResult(
                        is_duplicate=True,
                        similarity_score=1.0,
                        matching_reimbursement_id=claim.get("reimbursement_id"),
                        matching_receipt_code=claim.get("receipt_code"),
                        reason="Exact match found - same vendor, amount, and date"
                    )
                
                # Check for near-duplicates (same amount and vendor, close date)
                existing_hash = self.compute_receipt_hash({
                    "total_amount": claim.get("amount_claimed"),
                    "vendor_name": claim.get("vendor_name"),
                    "purchase_date": claim.get("expense_date")
                })
                
                if existing_hash == new_hash:
                    return DuplicateResult(
                        is_duplicate=True,
                        similarity_score=0.95,
                        matching_reimbursement_id=claim.get("reimbursement_id"),
                        matching_receipt_code=claim.get("receipt_code"),
                        reason="Similar receipt found - same vendor, amount, and date"
                    )
                
                # Check for same amount and vendor within 7 days
                new_amount = str(receipt_data.get("total_amount", "")).strip()
                existing_amount = str(claim.get("amount_claimed", "")).strip()
                new_vendor = str(receipt_data.get("vendor_name", "")).strip().lower()
                existing_vendor = str(claim.get("vendor_name", "")).strip().lower()
                
                if new_amount == existing_amount and new_vendor == existing_vendor:
                    return DuplicateResult(
                        is_duplicate=True,
                        similarity_score=0.85,
                        matching_reimbursement_id=claim.get("reimbursement_id"),
                        matching_receipt_code=claim.get("receipt_code"),
                        reason="Potential duplicate - same vendor and amount"
                    )
            
            return DuplicateResult(
                is_duplicate=False,
                similarity_score=0.0,
                reason="No duplicates found"
            )
            
        except Exception as e:
            logger.error(f"Duplicate check error: {e}")
            return DuplicateResult(
                is_duplicate=False,
                similarity_score=0.0,
                reason=f"Check failed: {str(e)}"
            )
    
    async def check_for_fraud(
        self,
        user_id: str,
        receipt_data: Dict[str, Any],
        claim_amount: float
    ) -> FraudCheckResult:
        """
        Perform comprehensive fraud detection on a claim.
        
        Args:
            user_id: User submitting the claim
            receipt_data: Receipt details
            claim_amount: Total claim amount
        
        Returns:
            FraudCheckResult with risk assessment
        """
        flags = []
        risk_score = 0.0
        details = {}
        
        try:
            # 1. Check for duplicates
            duplicate_result = await self.check_for_duplicates(user_id, receipt_data)
            if duplicate_result.is_duplicate:
                flags.append("DUPLICATE_RECEIPT")
                risk_score += 0.4
                details["duplicate"] = {
                    "matching_receipt": duplicate_result.matching_receipt_code,
                    "similarity": duplicate_result.similarity_score,
                    "reason": duplicate_result.reason
                }
            
            # 2. Check for unusual amount
            if claim_amount > 10000:
                flags.append("HIGH_AMOUNT")
                risk_score += 0.2
                details["amount_flag"] = f"Amount ${claim_amount} exceeds typical threshold"
            
            # 3. Check for weekend/holiday submission
            purchase_date = receipt_data.get("purchase_date")
            if purchase_date:
                try:
                    parsed_date = datetime.fromisoformat(purchase_date.replace("Z", "+00:00"))
                    if parsed_date.weekday() >= 5:  # Saturday or Sunday
                        flags.append("WEEKEND_PURCHASE")
                        risk_score += 0.1
                        details["weekend_flag"] = "Receipt dated on weekend"
                except:
                    pass
            
            # 4. Check submission frequency
            recent_count = await self._get_recent_submission_count(user_id, days=7)
            if recent_count > 10:
                flags.append("HIGH_FREQUENCY")
                risk_score += 0.15
                details["frequency_flag"] = f"{recent_count} submissions in last 7 days"
            
            # 5. Check for round numbers (potential indicator of manual/fake receipts)
            if claim_amount > 0 and claim_amount == round(claim_amount):
                if claim_amount % 100 == 0:
                    flags.append("ROUND_AMOUNT")
                    risk_score += 0.05
                    details["round_amount_flag"] = "Amount is a round number"
            
            # Cap risk score at 1.0
            risk_score = min(risk_score, 1.0)
            
            return FraudCheckResult(
                is_suspicious=risk_score >= 0.3,
                risk_score=risk_score,
                flags=flags,
                details=details
            )
            
        except Exception as e:
            logger.error(f"Fraud check error: {e}")
            return FraudCheckResult(
                is_suspicious=False,
                risk_score=0.0,
                flags=["CHECK_ERROR"],
                details={"error": str(e)}
            )
    
    async def _get_recent_submission_count(self, user_id: str, days: int) -> int:
        """Get count of submissions in recent days."""
        try:
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
            
            response = self.supabase.table("reimbursements").select(
                "reimbursement_id",
                count="exact"
            ).eq(
                "user_id", user_id
            ).gte(
                "created_at", cutoff_date
            ).execute()
            
            return response.count or 0
        except:
            return 0
    
    async def flag_suspicious_claim(
        self,
        reimbursement_id: str,
        flags: List[str],
        risk_score: float,
        details: Dict[str, Any]
    ) -> bool:
        """
        Flag a claim as suspicious in the database.
        
        Args:
            reimbursement_id: ID of the reimbursement
            flags: List of fraud flags
            risk_score: Calculated risk score
            details: Additional details
        
        Returns:
            True if flagged successfully
        """
        try:
            self.supabase.table("reimbursements").update({
                "fraud_flags": flags,
                "fraud_risk_score": risk_score,
                "fraud_details": details,
                "is_flagged": True
            }).eq(
                "reimbursement_id", reimbursement_id
            ).execute()
            
            logger.info(f"Flagged reimbursement {reimbursement_id} with risk score {risk_score}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to flag claim: {e}")
            return False


# Singleton instance
fraud_detection_service = FraudDetectionService()
