"""
SMTP Email Verification Service
Python implementation inspired by Truemail (https://github.com/truemail-rb/truemail)

Validation Levels:
1. Regex - Syntax validation
2. MX - DNS MX record validation
3. MX Blacklist - Check against blacklisted MX servers
4. SMTP - Real SMTP connection verification
"""

import re
import socket
import smtplib
import dns.resolver
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class ValidationLevel(str, Enum):
    REGEX = "regex"
    MX = "mx"
    MX_BLACKLIST = "mx_blacklist"
    SMTP = "smtp"


@dataclass
class EmailValidationResult:
    email: str
    valid: bool
    validation_type: ValidationLevel
    errors: List[str]
    mx_records: Optional[List[str]] = None
    smtp_debug: Optional[str] = None
    
    def to_dict(self) -> Dict:
        return {
            "email": self.email,
            "valid": self.valid,
            "validation_type": self.validation_type.value,
            "errors": self.errors,
            "mx_records": self.mx_records,
            "smtp_debug": self.smtp_debug
        }


class EmailVerifier:
    """
    Email verification service with multiple validation levels
    """
    
    # RFC 5322 compliant email regex (simplified)
    EMAIL_REGEX = re.compile(
        r'^[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'
    )
    
    # Common disposable/temporary email domains to blacklist
    DISPOSABLE_DOMAINS = {
        'tempmail.com', 'guerrillamail.com', '10minutemail.com',
        'throwaway.email', 'mailinator.com', 'trashmail.com'
    }
    
    # Known problematic MX servers
    MX_BLACKLIST = {
        'fake-mx.example.com',
        'blackhole.example.com'
    }
    
    def __init__(
        self,
        from_email: str = "verify@example.com",
        timeout: int = 10,
        connection_attempts: int = 2,
        smtp_safe_check: bool = True
    ):
        """
        Initialize email verifier
        
        Args:
            from_email: Email to use in SMTP MAIL FROM command
            timeout: Socket timeout in seconds
            connection_attempts: Number of retry attempts for SMTP
            smtp_safe_check: If True, don't actually send RCPT TO (safer)
        """
        self.from_email = from_email
        self.timeout = timeout
        self.connection_attempts = connection_attempts
        self.smtp_safe_check = smtp_safe_check
        
    def validate_regex(self, email: str) -> EmailValidationResult:
        """
        Level 1: Validate email syntax using regex
        """
        errors = []
        
        if not email or not isinstance(email, str):
            errors.append("Email is empty or invalid type")
            return EmailValidationResult(
                email=email,
                valid=False,
                validation_type=ValidationLevel.REGEX,
                errors=errors
            )
        
        email = email.strip().lower()
        
        if not self.EMAIL_REGEX.match(email):
            errors.append("Invalid email format")
        
        if '@' not in email:
            errors.append("Missing @ symbol")
        elif email.count('@') > 1:
            errors.append("Multiple @ symbols")
        
        local, domain = email.rsplit('@', 1) if '@' in email else ('', '')
        
        if len(local) > 64:
            errors.append("Local part exceeds 64 characters")
        
        if len(domain) > 255:
            errors.append("Domain exceeds 255 characters")
        
        if domain in self.DISPOSABLE_DOMAINS:
            errors.append(f"Disposable email domain: {domain}")
        
        return EmailValidationResult(
            email=email,
            valid=len(errors) == 0,
            validation_type=ValidationLevel.REGEX,
            errors=errors
        )
    
    def validate_mx(self, email: str) -> EmailValidationResult:
        """
        Level 2: Validate DNS MX records exist for domain
        """
        regex_result = self.validate_regex(email)
        if not regex_result.valid:
            return regex_result
        
        email = email.strip().lower()
        domain = email.split('@')[1]
        errors = []
        mx_records = []
        
        try:
            # Query MX records
            mx_records_raw = dns.resolver.resolve(domain, 'MX')
            mx_records = [str(r.exchange).rstrip('.') for r in mx_records_raw]
            
            if not mx_records:
                errors.append(f"No MX records found for domain: {domain}")
        
        except dns.resolver.NXDOMAIN:
            errors.append(f"Domain does not exist: {domain}")
        except dns.resolver.NoAnswer:
            errors.append(f"No MX records for domain: {domain}")
        except dns.resolver.Timeout:
            errors.append(f"DNS query timeout for domain: {domain}")
        except Exception as e:
            errors.append(f"DNS lookup error: {str(e)}")
        
        return EmailValidationResult(
            email=email,
            valid=len(errors) == 0,
            validation_type=ValidationLevel.MX,
            errors=errors,
            mx_records=mx_records
        )
    
    def validate_mx_blacklist(self, email: str) -> EmailValidationResult:
        """
        Level 3: Check if MX servers are blacklisted
        """
        mx_result = self.validate_mx(email)
        if not mx_result.valid:
            return mx_result
        
        errors = []
        
        for mx in mx_result.mx_records or []:
            if mx in self.MX_BLACKLIST:
                errors.append(f"MX server is blacklisted: {mx}")
        
        return EmailValidationResult(
            email=email,
            valid=len(errors) == 0,
            validation_type=ValidationLevel.MX_BLACKLIST,
            errors=errors,
            mx_records=mx_result.mx_records
        )
    
    def validate_smtp(self, email: str) -> EmailValidationResult:
        """
        Level 4: Validate via SMTP connection (most thorough)
        """
        mx_blacklist_result = self.validate_mx_blacklist(email)
        if not mx_blacklist_result.valid:
            return mx_blacklist_result
        
        email = email.strip().lower()
        errors = []
        smtp_debug = []
        
        mx_records = mx_blacklist_result.mx_records or []
        if not mx_records:
            errors.append("No MX records to test")
            return EmailValidationResult(
                email=email,
                valid=False,
                validation_type=ValidationLevel.SMTP,
                errors=errors,
                mx_records=mx_records
            )
        
        # Try each MX record in order
        for mx_host in mx_records:
            for attempt in range(self.connection_attempts):
                try:
                    smtp_debug.append(f"Attempting connection to {mx_host} (attempt {attempt + 1})")
                    
                    # Connect to SMTP server
                    server = smtplib.SMTP(timeout=self.timeout)
                    server.set_debuglevel(0)
                    
                    code, message = server.connect(mx_host)
                    smtp_debug.append(f"Connected: {code} {message.decode()}")
                    
                    # HELO/EHLO
                    server.ehlo_or_helo_if_needed()
                    smtp_debug.append("EHLO successful")
                    
                    # MAIL FROM
                    code, message = server.mail(self.from_email)
                    smtp_debug.append(f"MAIL FROM: {code} {message.decode()}")
                    
                    if not self.smtp_safe_check:
                        # RCPT TO (actually check if recipient exists)
                        # WARNING: Some servers may flag this as suspicious
                        code, message = server.rcpt(email)
                        smtp_debug.append(f"RCPT TO: {code} {message.decode()}")
                        
                        if code != 250:
                            errors.append(f"Recipient rejected: {message.decode()}")
                    
                    server.quit()
                    smtp_debug.append("Connection closed successfully")
                    
                    # If we got here, email is valid
                    return EmailValidationResult(
                        email=email,
                        valid=True,
                        validation_type=ValidationLevel.SMTP,
                        errors=[],
                        mx_records=mx_records,
                        smtp_debug="\n".join(smtp_debug)
                    )
                
                except smtplib.SMTPServerDisconnected:
                    error_msg = f"Server disconnected: {mx_host}"
                    smtp_debug.append(error_msg)
                    errors.append(error_msg)
                
                except smtplib.SMTPConnectError as e:
                    error_msg = f"Connection error to {mx_host}: {str(e)}"
                    smtp_debug.append(error_msg)
                    errors.append(error_msg)
                
                except socket.timeout:
                    error_msg = f"Connection timeout to {mx_host}"
                    smtp_debug.append(error_msg)
                    errors.append(error_msg)
                
                except Exception as e:
                    error_msg = f"SMTP error with {mx_host}: {str(e)}"
                    smtp_debug.append(error_msg)
                    errors.append(error_msg)
        
        # If all MX records failed
        return EmailValidationResult(
            email=email,
            valid=False,
            validation_type=ValidationLevel.SMTP,
            errors=errors,
            mx_records=mx_records,
            smtp_debug="\n".join(smtp_debug)
        )
    
    def verify(
        self,
        email: str,
        validation_level: ValidationLevel = ValidationLevel.MX
    ) -> EmailValidationResult:
        """
        Verify email with specified validation level
        
        Args:
            email: Email address to verify
            validation_level: Level of validation to perform
            
        Returns:
            EmailValidationResult with validation details
        """
        try:
            if validation_level == ValidationLevel.REGEX:
                return self.validate_regex(email)
            elif validation_level == ValidationLevel.MX:
                return self.validate_mx(email)
            elif validation_level == ValidationLevel.MX_BLACKLIST:
                return self.validate_mx_blacklist(email)
            elif validation_level == ValidationLevel.SMTP:
                return self.validate_smtp(email)
            else:
                return EmailValidationResult(
                    email=email,
                    valid=False,
                    validation_type=validation_level,
                    errors=[f"Unknown validation level: {validation_level}"]
                )
        except Exception as e:
            logger.error(f"Email verification error for {email}: {str(e)}")
            return EmailValidationResult(
                email=email,
                valid=False,
                validation_type=validation_level,
                errors=[f"Verification error: {str(e)}"]
            )
    
    def verify_batch(
        self,
        emails: List[str],
        validation_level: ValidationLevel = ValidationLevel.MX
    ) -> List[EmailValidationResult]:
        """
        Verify multiple emails
        
        Args:
            emails: List of email addresses
            validation_level: Level of validation to perform
            
        Returns:
            List of EmailValidationResult objects
        """
        results = []
        for email in emails:
            result = self.verify(email, validation_level)
            results.append(result)
        return results
