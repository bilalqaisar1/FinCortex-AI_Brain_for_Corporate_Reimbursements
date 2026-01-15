"""
Email notification service for FinCortex.
Handles sending emails on claim status changes (submitted, approved, rejected).
"""

import os
import logging
from typing import Optional
from datetime import datetime
import httpx

logger = logging.getLogger(__name__)


class EmailService:
    """
    Email service using Resend API.
    Configure RESEND_API_KEY in environment variables.
    Falls back to logging if API key is not configured.
    """
    
    def __init__(self):
        self.api_key = os.getenv("RESEND_API_KEY")
        self.from_email = os.getenv("EMAIL_FROM", "FinCortex <notifications@fincortex.com>")
        self.base_url = "https://api.resend.com/emails"
        self.enabled = bool(self.api_key)
        
        if not self.enabled:
            logger.warning("Email service disabled: RESEND_API_KEY not configured")
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Send an email using Resend API.
        
        Args:
            to_email: Recipient email address
            subject: Email subject line
            html_content: HTML body of the email
            text_content: Plain text fallback (optional)
        
        Returns:
            True if email was sent successfully, False otherwise
        """
        if not self.enabled:
            logger.info(f"[EMAIL MOCK] To: {to_email}, Subject: {subject}")
            return True
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.base_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "from": self.from_email,
                        "to": [to_email],
                        "subject": subject,
                        "html": html_content,
                        "text": text_content or ""
                    }
                )
                
                if response.status_code == 200:
                    logger.info(f"Email sent successfully to {to_email}")
                    return True
                else:
                    logger.error(f"Failed to send email: {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Email service error: {e}")
            return False
    
    def _get_email_template(self, template_type: str, data: dict) -> tuple[str, str]:
        """
        Get email template for different notification types.
        
        Returns:
            Tuple of (html_content, text_content)
        """
        templates = {
            "claim_submitted": self._claim_submitted_template,
            "claim_approved": self._claim_approved_template,
            "claim_rejected": self._claim_rejected_template,
            "claim_needs_revision": self._claim_needs_revision_template,
        }
        
        template_func = templates.get(template_type)
        if template_func:
            return template_func(data)
        
        return ("<p>Notification</p>", "Notification")
    
    def _claim_submitted_template(self, data: dict) -> tuple[str, str]:
        """Template for claim submission confirmation."""
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #0891b2, #3b82f6); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }}
                .footer {{ background: #1e293b; color: #94a3b8; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; }}
                .amount {{ font-size: 24px; font-weight: bold; color: #0891b2; }}
                .status {{ display: inline-block; padding: 4px 12px; background: #fef3c7; color: #92400e; border-radius: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🧾 Claim Submitted</h1>
                </div>
                <div class="content">
                    <p>Hi {data.get('user_name', 'there')},</p>
                    <p>Your reimbursement claim has been submitted successfully.</p>
                    <p><strong>Receipt Code:</strong> {data.get('receipt_code', 'N/A')}</p>
                    <p><strong>Amount:</strong> <span class="amount">${data.get('amount', '0.00')}</span></p>
                    <p><strong>Category:</strong> {data.get('category', 'N/A')}</p>
                    <p><strong>Status:</strong> <span class="status">Pending Review</span></p>
                    <p>Your manager will review this claim shortly. You'll receive an email once a decision is made.</p>
                </div>
                <div class="footer">
                    <p>FinCortex - AI-Powered Expense Management</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text = f"""
        Claim Submitted
        
        Hi {data.get('user_name', 'there')},
        
        Your reimbursement claim has been submitted successfully.
        
        Receipt Code: {data.get('receipt_code', 'N/A')}
        Amount: ${data.get('amount', '0.00')}
        Category: {data.get('category', 'N/A')}
        Status: Pending Review
        
        Your manager will review this claim shortly.
        
        - FinCortex Team
        """
        
        return (html, text)
    
    def _claim_approved_template(self, data: dict) -> tuple[str, str]:
        """Template for claim approval notification."""
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }}
                .footer {{ background: #1e293b; color: #94a3b8; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; }}
                .amount {{ font-size: 24px; font-weight: bold; color: #10b981; }}
                .status {{ display: inline-block; padding: 4px 12px; background: #d1fae5; color: #065f46; border-radius: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Claim Approved!</h1>
                </div>
                <div class="content">
                    <p>Hi {data.get('user_name', 'there')},</p>
                    <p>Great news! Your reimbursement claim has been approved.</p>
                    <p><strong>Receipt Code:</strong> {data.get('receipt_code', 'N/A')}</p>
                    <p><strong>Approved Amount:</strong> <span class="amount">${data.get('amount', '0.00')}</span></p>
                    <p><strong>Approved By:</strong> {data.get('approver_name', 'Manager')}</p>
                    <p><strong>Status:</strong> <span class="status">Approved</span></p>
                    {f"<p><strong>Comments:</strong> {data.get('comments')}</p>" if data.get('comments') else ""}
                    <p>The reimbursement will be processed according to your company's payment schedule.</p>
                </div>
                <div class="footer">
                    <p>FinCortex - AI-Powered Expense Management</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text = f"""
        Claim Approved!
        
        Hi {data.get('user_name', 'there')},
        
        Great news! Your reimbursement claim has been approved.
        
        Receipt Code: {data.get('receipt_code', 'N/A')}
        Approved Amount: ${data.get('amount', '0.00')}
        Approved By: {data.get('approver_name', 'Manager')}
        Status: Approved
        
        The reimbursement will be processed according to your company's payment schedule.
        
        - FinCortex Team
        """
        
        return (html, text)
    
    def _claim_rejected_template(self, data: dict) -> tuple[str, str]:
        """Template for claim rejection notification."""
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }}
                .footer {{ background: #1e293b; color: #94a3b8; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; }}
                .status {{ display: inline-block; padding: 4px 12px; background: #fee2e2; color: #991b1b; border-radius: 20px; }}
                .reason {{ background: #fef2f2; border-left: 4px solid #ef4444; padding: 10px 15px; margin: 15px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>❌ Claim Rejected</h1>
                </div>
                <div class="content">
                    <p>Hi {data.get('user_name', 'there')},</p>
                    <p>Unfortunately, your reimbursement claim has been rejected.</p>
                    <p><strong>Receipt Code:</strong> {data.get('receipt_code', 'N/A')}</p>
                    <p><strong>Amount:</strong> ${data.get('amount', '0.00')}</p>
                    <p><strong>Status:</strong> <span class="status">Rejected</span></p>
                    <div class="reason">
                        <strong>Reason:</strong><br>
                        {data.get('rejection_reason', 'No reason provided.')}
                    </div>
                    <p>If you believe this was an error, please contact your manager or submit a new claim with the required corrections.</p>
                </div>
                <div class="footer">
                    <p>FinCortex - AI-Powered Expense Management</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text = f"""
        Claim Rejected
        
        Hi {data.get('user_name', 'there')},
        
        Unfortunately, your reimbursement claim has been rejected.
        
        Receipt Code: {data.get('receipt_code', 'N/A')}
        Amount: ${data.get('amount', '0.00')}
        Status: Rejected
        
        Reason: {data.get('rejection_reason', 'No reason provided.')}
        
        If you believe this was an error, please contact your manager.
        
        - FinCortex Team
        """
        
        return (html, text)
    
    def _claim_needs_revision_template(self, data: dict) -> tuple[str, str]:
        """Template for claim needs revision notification."""
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }}
                .footer {{ background: #1e293b; color: #94a3b8; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; }}
                .status {{ display: inline-block; padding: 4px 12px; background: #fef3c7; color: #92400e; border-radius: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⚠️ Revision Required</h1>
                </div>
                <div class="content">
                    <p>Hi {data.get('user_name', 'there')},</p>
                    <p>Your reimbursement claim requires some corrections before it can be approved.</p>
                    <p><strong>Receipt Code:</strong> {data.get('receipt_code', 'N/A')}</p>
                    <p><strong>Status:</strong> <span class="status">Needs Revision</span></p>
                    <p><strong>Required Changes:</strong></p>
                    <p>{data.get('revision_notes', 'Please review and resubmit.')}</p>
                    <p>Please make the necessary corrections and resubmit your claim.</p>
                </div>
                <div class="footer">
                    <p>FinCortex - AI-Powered Expense Management</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text = f"""
        Revision Required
        
        Hi {data.get('user_name', 'there')},
        
        Your reimbursement claim requires some corrections.
        
        Receipt Code: {data.get('receipt_code', 'N/A')}
        Status: Needs Revision
        
        Required Changes: {data.get('revision_notes', 'Please review and resubmit.')}
        
        - FinCortex Team
        """
        
        return (html, text)
    
    async def notify_claim_submitted(
        self,
        to_email: str,
        user_name: str,
        receipt_code: str,
        amount: str,
        category: str
    ) -> bool:
        """Send notification when a claim is submitted."""
        data = {
            "user_name": user_name,
            "receipt_code": receipt_code,
            "amount": amount,
            "category": category
        }
        html, text = self._get_email_template("claim_submitted", data)
        return await self.send_email(
            to_email=to_email,
            subject=f"Claim Submitted - {receipt_code}",
            html_content=html,
            text_content=text
        )
    
    async def notify_claim_approved(
        self,
        to_email: str,
        user_name: str,
        receipt_code: str,
        amount: str,
        approver_name: str,
        comments: Optional[str] = None
    ) -> bool:
        """Send notification when a claim is approved."""
        data = {
            "user_name": user_name,
            "receipt_code": receipt_code,
            "amount": amount,
            "approver_name": approver_name,
            "comments": comments
        }
        html, text = self._get_email_template("claim_approved", data)
        return await self.send_email(
            to_email=to_email,
            subject=f"✅ Claim Approved - {receipt_code}",
            html_content=html,
            text_content=text
        )
    
    async def notify_claim_rejected(
        self,
        to_email: str,
        user_name: str,
        receipt_code: str,
        amount: str,
        rejection_reason: str
    ) -> bool:
        """Send notification when a claim is rejected."""
        data = {
            "user_name": user_name,
            "receipt_code": receipt_code,
            "amount": amount,
            "rejection_reason": rejection_reason
        }
        html, text = self._get_email_template("claim_rejected", data)
        return await self.send_email(
            to_email=to_email,
            subject=f"❌ Claim Rejected - {receipt_code}",
            html_content=html,
            text_content=text
        )


# Singleton instance
email_service = EmailService()
