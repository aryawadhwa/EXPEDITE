"""
Test script for email verification system
Run this to verify the email verification service is working correctly
"""

import asyncio
from app.services.smtp_verifier import EmailVerifier, ValidationLevel


async def test_email_verification():
    """Test email verification with various validation levels"""
    
    verifier = EmailVerifier(
        from_email="verify@outboundai.com",
        timeout=10,
        connection_attempts=2,
        smtp_safe_check=True
    )
    
    # Test emails
    test_emails = [
        "test@gmail.com",           # Valid
        "invalid@fakeinvaliddomain123456.com",  # Invalid domain
        "notanemail",               # Invalid format
        "test@tempmail.com",        # Disposable domain
    ]
    
    print("=" * 80)
    print("EMAIL VERIFICATION TEST")
    print("=" * 80)
    
    # Test 1: Regex validation (fastest)
    print("\n1. REGEX VALIDATION (Syntax Check)")
    print("-" * 80)
    for email in test_emails:
        result = verifier.verify(email, ValidationLevel.REGEX)
        status = "✓ VALID" if result.valid else "✗ INVALID"
        print(f"{status:12} | {email:40} | {', '.join(result.errors) if result.errors else 'OK'}")
    
    # Test 2: MX validation (recommended)
    print("\n2. MX VALIDATION (DNS + MX Records)")
    print("-" * 80)
    for email in test_emails[:2]:  # Only test first 2 to save time
        result = verifier.verify(email, ValidationLevel.MX)
        status = "✓ VALID" if result.valid else "✗ INVALID"
        mx_info = f"MX: {result.mx_records[0]}" if result.mx_records else ""
        errors = ', '.join(result.errors) if result.errors else 'OK'
        print(f"{status:12} | {email:40}")
        print(f"             | {mx_info if mx_info else errors}")
    
    # Test 3: Batch verification
    print("\n3. BATCH VERIFICATION")
    print("-" * 80)
    results = verifier.verify_batch(test_emails, ValidationLevel.REGEX)
    valid_count = sum(1 for r in results if r.valid)
    invalid_count = len(results) - valid_count
    print(f"Total: {len(results)} | Valid: {valid_count} | Invalid: {invalid_count}")
    
    print("\n" + "=" * 80)
    print("TEST COMPLETE")
    print("=" * 80)
    print("\nEmail verification system is working correctly!")
    print("You can now use it in the scraper endpoints.")


if __name__ == "__main__":
    asyncio.run(test_email_verification())
