"""
Twitter/X Integration Module
Uses Composio SDK
https://docs.composio.dev/reference/sdk-reference/python
"""

from typing import Dict, Optional
from app.core.config import settings
from composio import Composio

TWITTER_AUTH_CONFIG_ID = "ac_46x65PoeAWsM"

# Lazy initialization
_composio_client = None

def get_composio_client():
    global _composio_client
    if _composio_client is None:
        if not settings.COMPOSIO_API_KEY:
            raise ValueError("COMPOSIO_API_KEY is not set")
        _composio_client = Composio(api_key=settings.COMPOSIO_API_KEY)
    return _composio_client


async def post_tweet(user_id: str, text: str, reply_to_id: Optional[str] = None) -> Dict:
    """
    Post a tweet.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        text: Tweet content (max 280 chars)
        reply_to_id: Optional tweet ID to reply to
        
    Returns:
        Dict with success status and response data
    """
    try:
        client = get_composio_client()
        
        slug = "TWITTER_CREATION_OF_A_POST" if not reply_to_id else "TWITTER_REPLY_TO_A_POST"
        
        arguments = {
            "text": text[:280]
        }
        
        if reply_to_id:
            arguments["tweet_id"] = reply_to_id
        
        result = client.tools.execute(
            slug=slug,
            arguments=arguments,
            user_id=user_id,
            dangerously_skip_version_check=True,
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"ERROR: Twitter post_tweet failed: {e}")
        return {"success": False, "error": str(e)}


async def reply(user_id: str, tweet_id: str, text: str) -> Dict:
    """
    Reply to a tweet.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        tweet_id: Tweet ID to reply to
        text: Reply content
        
    Returns:
        Dict with success status and response data
    """
    return await post_tweet(user_id, text, reply_to_id=tweet_id)


async def like_tweet(user_id: str, tweet_id: str) -> Dict:
    """
    Like a tweet.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        tweet_id: Tweet ID to like
        
    Returns:
        Dict with success status and response data
    """
    try:
        client = get_composio_client()
        
        result = client.tools.execute(
            slug="TWITTER_LIKE_A_POST",
            arguments={"tweet_id": tweet_id},
            user_id=user_id,
            dangerously_skip_version_check=True,
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"ERROR: Twitter like_tweet failed: {e}")
        return {"success": False, "error": str(e)}


async def retweet(user_id: str, tweet_id: str) -> Dict:
    """
    Retweet a tweet.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        tweet_id: Tweet ID to retweet
        
    Returns:
        Dict with success status and response data
    """
    try:
        client = get_composio_client()
        
        result = client.tools.execute(
            slug="TWITTER_REPOST_A_POST",
            arguments={"tweet_id": tweet_id},
            user_id=user_id,
            dangerously_skip_version_check=True,
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"ERROR: Twitter retweet failed: {e}")
        return {"success": False, "error": str(e)}


async def get_timeline(user_id: str, count: int = 20) -> Dict:
    """
    Get user's Twitter timeline.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        count: Number of tweets to fetch
        
    Returns:
        Dict with success status and timeline data
    """
    try:
        client = get_composio_client()
        
        result = client.tools.execute(
            slug="TWITTER_GET_HOME_TIMELINE",
            arguments={"max_results": min(count, 100)},
            user_id=user_id,
            dangerously_skip_version_check=True,
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"ERROR: Twitter get_timeline failed: {e}")
        return {"success": False, "error": str(e)}


async def get_mentions(user_id: str) -> Dict:
    """
    Get mentions of the authenticated user.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        
    Returns:
        Dict with success status and mentions data
    """
    try:
        client = get_composio_client()
        
        result = client.tools.execute(
            slug="TWITTER_GET_USER_MENTIONS",
            arguments={},
            user_id=user_id,
            dangerously_skip_version_check=True,
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"ERROR: Twitter get_mentions failed: {e}")
        return {"success": False, "error": str(e)}
