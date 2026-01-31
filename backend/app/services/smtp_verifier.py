"""
SMTP Email Verifier
Free email verification using SMTP handshake
Based on: https://github.com/mattlawlis/SMTP-Email-Verifier
"""

import re
import smtplib
import dns.resolver
import logging
from typing import Dict, Optional
from asyncio import get_event_loop, to_thread

logger = logging.getLogger(__name__)

class SMTPEmailVerifier:
    """
    Verify email deliverability using SMTP handshake
    
    This is a FREE alternative to paid email verification services.
    It works by:
    1. Validating email syntax
    2. Looking up MX records for the domain
    3. Attempting SMTP handshake to verify the email exists
    
    Limitations:
    - Some ISPs block port 25 (SMTP)
    - Catch-all domains may give false positives
    - Slower than API-based verification
    - Some servers block verification attempts
    """
    
    def __init__(self):
        self.timeout = 10  # seconds
        self.from_email = "verify@yourdomain.com"  # Change this
    
    def validate_syntax(self, email: str) -> bool:
        """Quick syntax check using regex"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    def get_mx_records(self, domain: str) -> list:
        """Get MX records for domain, sorted by priority"""
        try:
            mx_records = dns.resolver.resolve(domain, 'MX')
            # Sort by priority (lower is better)
            return sorted([(r.preference, str(r.exchange)) for r in mx_records])
        except Exception as e:
            logger.warning(f"MX lookup failed for {domain}: {e}")
            return []
    
    def verify_smtp_sync(self, email: str) -> Dict:
        """
        Verify email via SMTP handshake (synchronous)
        
        Returns:
            {
                "email": str,
                "valid": bool,
                "smtp_verified": bool,
                "reason": str,
                "mx_server": str
            }
        """
        # 1. Syntax check
        if not self.validate_syntax(email):
            return {
                "email": email,
                "valid": False,
                "smtp_verified": False,
                "reason": "invalid_syntax",
                "mx_server": None
            }
        
        # 2. Extract domain
        domain = email.split('@')[1]
        
        # 3. Get MX records
        mx_records = self.get_mx_records(domain)
        if not mx_records:
            return {
                "email": email,
                "valid": False,
                "smtp_verified": False,
                "reason": "no_mx_records",
                "mx_server": None
            }
        
        # 4. Try SMTP handshake with each MX server
        for priority, mx_server in mx_records:
            try:
                # Remove trailing dot from MX server
                mx_server = mx_server.rstrip('.')
                
                logger.info(f"Trying SMTP verification for {email} via {mx_server}")
                
                # Connect to mail server
                with smtplib.SMTP(timeout=self.timeout) as smtp:
                    smtp.connect(mx_server, 25)
                    smtp.helo(smtp.local_hostname)
                    smtp.mail(self.from_email)
                    
                    # This is the key check
                    code, message = smtp.rcpt(email)
                    
                    if code == 250:
                        # Email accepted - it exists!
                        logger.info(f"✓ SMTP verified: {email} via {mx_server}")
                        return {
                            "email": email,
                            "valid": True,
                            "smtp_verified": True,
                            "reason": "smtp_accepted",
                            "mx_server": mx_server
                        }
                    else:
                        # Email rejected
                        logger.info(f"✗ SMTP rejected: {email} (code: {code})")
                        return {
                            "email": email,
                            "valid": False,
                            "smtp_verified": True,
                            "reason": f"smtp_rejected_{code}",
                            "mx_server": mx_server
                        }
            
            except smtplib.SMTPServerDisconnected:
                logger.warning(f"SMTP server {mx_server} disconnected")
                continue
            
            except smtplib.SMTPConnectError:
                logger.warning(f"Cannot connect to {mx_server}")
                continue
            
            except Exception as e:
                logger.warning(f"SMTP error for {mx_server}: {e}")
                continue
        
        # All MX servers failed
        return {
            "email": email,
            "valid": False,
            "smtp_verified": False,
            "reason": "smtp_connection_failed",
            "mx_server": None
        }
    
    async def verify_smtp(self, email: str) -> Dict:
        """
        Async wrapper for SMTP verification
        
        Usage:
            verifier = SMTPEmailVerifier()
            result = await verifier.verify_smtp("test@example.com")
        """
        # Run synchronous SMTP in thread pool
        loop = get_event_loop()
        return await to_thread(self.verify_smtp_sync, email)
    
    async def verify_batch(self, emails: list) -> list:
        """
        Verify multiple emails
        
        Note: This runs sequentially to avoid being flagged as spam.
        For parallel verification, use Hunter.io API instead.
        """
        results = []
        for email in emails:
            result = await self.verify_smtp(email)
            results.append(result)
        return results


# Convenience function
async def verify_email_smtp(email: str) -> Dict:
    """
    Quick SMTP verification
    
    Usage:
        from app.services.smtp_verifier import verify_email_smtp
        result = await verify_email_smtp("test@example.com")
    """
    verifier = SMTPEmailVerifier()
    return await verifier.verify_smtp(email)
