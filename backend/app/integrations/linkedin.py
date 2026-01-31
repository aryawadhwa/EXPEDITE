"""
LinkedIn Integration Module
Uses Composio SDK
https://docs.composio.dev/reference/sdk-reference/python
"""

from typing import Dict, Optional
from app.core.config import settings
from composio import Composio

LINKEDIN_AUTH_CONFIG_ID = "ac_SdzD1ondK6Zi"

# Lazy initialization
_composio_client = None

def get_composio_client():
    global _composio_client
    if _composio_client is None:
        if not settings.COMPOSIO_API_KEY:
            raise ValueError("COMPOSIO_API_KEY is not set")
        _composio_client = Composio(api_key=settings.COMPOSIO_API_KEY)
    return _composio_client


async def send_message(user_id: str, member_id: str, message: str) -> Dict:
    """
    Send a direct message to a LinkedIn member.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        member_id: LinkedIn member URN or profile ID
        message: Message content
        
    Returns:
        Dict with success status and response data
    """
    try:
        client = get_composio_client()
        
        result = client.tools.execute(
            slug="LINKEDIN_SEND_MESSAGE",
            arguments={
                "recipient_id": member_id,
                "message": message
            },
            user_id=user_id,
            dangerously_skip_version_check=True,
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"ERROR: LinkedIn send_message failed: {e}")
        return {"success": False, "error": str(e)}


async def send_connection_request(user_id: str, member_id: str, message: Optional[str] = None) -> Dict:
    """
    Send a connection request to a LinkedIn member.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        member_id: LinkedIn member URN or profile URL
        message: Optional personalized note (max 300 chars)
        
    Returns:
        Dict with success status and response data
    """
    try:
        client = get_composio_client()
        
        arguments = {
            "invitee_profile_url": member_id
        }
        
        if message:
            arguments["message"] = message[:300]  # LinkedIn limit
        
        result = client.tools.execute(
            slug="LINKEDIN_SEND_INVITATION",
            arguments=arguments,
            user_id=user_id,
            dangerously_skip_version_check=True,
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"ERROR: LinkedIn send_connection_request failed: {e}")
        return {"success": False, "error": str(e)}


async def publish_post(user_id: str, content: str, visibility: str = "PUBLIC") -> Dict:
    """
    Publish a post on LinkedIn feed.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        content: Post content text
        visibility: PUBLIC, CONNECTIONS, or LOGGED_IN
        
    Returns:
        Dict with success status and response data
    """
    try:
        client = get_composio_client()
        
        result = client.tools.execute(
            slug="LINKEDIN_CREATE_LINKED_IN_POST",
            arguments={
                "text": content,
                "visibility": visibility
            },
            user_id=user_id,
            dangerously_skip_version_check=True,
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"ERROR: LinkedIn publish_post failed: {e}")
        return {"success": False, "error": str(e)}


async def get_profile(user_id: str, profile_url: Optional[str] = None) -> Dict:
    """
    Get LinkedIn profile information (own profile or by URL).
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        profile_url: Optional profile URL to fetch (if None, fetches own profile)
        
    Returns:
        Dict with success status and profile data
    """
    try:
        client = get_composio_client()
        
        slug = "LINKEDIN_GET_OWN_PROFILE" if not profile_url else "LINKEDIN_GET_PROFILE"
        arguments = {}
        
        if profile_url:
            arguments["profile_url"] = profile_url
        
        result = client.tools.execute(
            slug=slug,
            arguments=arguments,
            user_id=user_id,
            dangerously_skip_version_check=True,
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"ERROR: LinkedIn get_profile failed: {e}")
        return {"success": False, "error": str(e)}


async def get_messages(user_id: str, conversation_id: Optional[str] = None) -> Dict:
    """
    Get LinkedIn messages/conversations.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        conversation_id: Optional specific conversation to fetch
        
    Returns:
        Dict with success status and messages data
    """
    try:
        client = get_composio_client()
        
        arguments = {}
        if conversation_id:
            arguments["conversation_id"] = conversation_id
        
        result = client.tools.execute(
            slug="LINKEDIN_GET_MESSAGES",
            arguments=arguments,
            user_id=user_id,
            dangerously_skip_version_check=True,
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"ERROR: LinkedIn get_messages failed: {e}")
        return {"success": False, "error": str(e)}
