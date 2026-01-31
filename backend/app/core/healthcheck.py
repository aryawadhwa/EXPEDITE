"""
Healthcheck and Integration Validation
Tests all external API integrations on startup
"""

from typing import Dict
import asyncio
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

async def validate_all_integrations() -> Dict[str, str]:
    """
    Test each integration with a simple API call
    Returns: Dict of service_name -> status
    """
    from app.services.integrations import (
        HunterIntegration,
        GroqIntegration,
        OpenAIIntegration
    )
    
    results = {}
    
    # Test Hunter
    try:
        async with HunterIntegration() as hunter:
            # Test with a known domain
            result = await hunter.domain_search("stripe.com", limit=1)
            if isinstance(result, list):
                results['hunter'] = 'OK'
            else:
                results['hunter'] = 'FAIL: Invalid response structure'
    except Exception as e:
        results['hunter'] = f'ERROR: {str(e)}'
        logger.error(f"Hunter healthcheck failed: {e}", exc_info=True)
    
    # Test Groq
    try:
        llm = GroqIntegration()
        result = await llm.generate_json('Return JSON: {"test": true}')
        if result.get('test') == True:
            results['groq'] = 'OK'
        else:
            results['groq'] = 'FAIL: Invalid response'
    except Exception as e:
        results['groq'] = f'ERROR: {str(e)}'
        logger.error(f"Groq healthcheck failed: {e}", exc_info=True)
    
    # Test OpenAI (optional fallback)
    try:
        llm = OpenAIIntegration()
        result = await llm.generate_json('Return JSON: {"test": true}')
        if result.get('test') == True:
            results['openai'] = 'OK'
        else:
            results['openai'] = 'WARN: Invalid response (fallback only)'
    except Exception as e:
        results['openai'] = f'WARN: {str(e)} (fallback only)'
        logger.warning(f"OpenAI healthcheck failed (fallback only): {e}")
    
    return results


async def startup_validation():
    """Run on application startup"""
    logger.info("=" * 60)
    logger.info("[STARTUP] Validating integrations...")
    logger.info("=" * 60)
    
    health = await validate_all_integrations()
    
    for service, status in health.items():
        if 'OK' in status:
            logger.info(f"[STARTUP] ✅ {service.upper()}: {status}")
        elif 'WARN' in status:
            logger.warning(f"[STARTUP] ⚠️  {service.upper()}: {status}")
        else:
            logger.error(f"[STARTUP] ❌ {service.upper()}: {status}")
    
    # Check critical services (Hunter and Groq only)
    critical = ['hunter', 'groq']
    failed_critical = [k for k in critical if 'OK' not in health.get(k, '')]
    
    if failed_critical:
        logger.error(f"[STARTUP] ⚠️  CRITICAL services failed: {', '.join(failed_critical)}")
        logger.error("[STARTUP] System may not function correctly!")
    else:
        logger.info("[STARTUP] ✅ All critical services operational")
    
    logger.info("=" * 60)
    
    return health
