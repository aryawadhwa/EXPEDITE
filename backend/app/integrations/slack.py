"""
Slack Integration Module
Uses Composio SDK
https://docs.composio.dev/reference/sdk-reference/python
"""

from typing import Dict, Optional, List
from app.core.composio_config import get_composio_client, get_auth_config_id

SLACK_AUTH_CONFIG_ID = get_auth_config_id("slack")


async def send_message(user_id: str, channel: str, text: str, thread_ts: Optional[str] = None) -> Dict:
    """
    Send a message to a Slack channel or user.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        channel: Channel ID or user ID (e.g., C01234567 or U01234567)
        text: Message text
        thread_ts: Optional thread timestamp to reply in thread
        
    Returns:
        Dict with success status and response data
    """
    try:
        client = get_composio_client()
        
        arguments = {
            "channel": channel,
            "text": text
        }
        
        if thread_ts:
            arguments["thread_ts"] = thread_ts
        
        result = client.tools.execute(
            slug="SLACK_SENDS_A_MESSAGE_TO_A_SLACK_CHANNEL",
            arguments=arguments,
            user_id=user_id,
            dangerously_skip_version_check=True,
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"ERROR: Slack send_message failed: {e}")
        return {"success": False, "error": str(e)}


async def create_thread(user_id: str, channel: str, text: str) -> Dict:
    """
    Create a new message that can serve as a thread parent.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        channel: Channel ID
        text: Message text
        
    Returns:
        Dict with success status and response data (includes thread_ts)
    """
    return await send_message(user_id, channel, text)


async def reply_to_thread(user_id: str, channel: str, thread_ts: str, text: str) -> Dict:
    """
    Reply to an existing thread.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        channel: Channel ID
        thread_ts: Thread timestamp
        text: Reply text
        
    Returns:
        Dict with success status and response data
    """
    return await send_message(user_id, channel, text, thread_ts=thread_ts)


async def post_to_channel(user_id: str, channel: str, text: str, blocks: Optional[list] = None) -> Dict:
    """
    Post a message to a channel with optional rich formatting.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        channel: Channel ID or name
        text: Fallback text
        blocks: Optional Slack blocks for rich formatting
        
    Returns:
        Dict with success status and response data
    """
    try:
        client = get_composio_client()
        
        arguments = {
            "channel": channel,
            "text": text
        }
        
        if blocks:
            arguments["blocks"] = blocks
        
        result = client.tools.execute(
            slug="SLACK_SENDS_A_MESSAGE_TO_A_SLACK_CHANNEL",
            arguments=arguments,
            user_id=user_id,
            dangerously_skip_version_check=True,
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"ERROR: Slack post_to_channel failed: {e}")
        return {"success": False, "error": str(e)}


async def get_channel_messages(user_id: str, channel: str, limit: int = 100) -> Dict:
    """
    Get recent messages from a channel.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        channel: Channel ID
        limit: Number of messages to fetch
        
    Returns:
        Dict with success status and messages data
    """
    try:
        client = get_composio_client()
        
        result = client.tools.execute(
            slug="SLACK_LIST_MESSAGES_IN_CHANNEL",
            arguments={
                "channel": channel,
                "limit": min(limit, 1000)
            },
            user_id=user_id,
            dangerously_skip_version_check=True,
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"ERROR: Slack get_channel_messages failed: {e}")
        return {"success": False, "error": str(e)}


async def list_channels(user_id: str) -> Dict:
    """
    List available Slack channels.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        
    Returns:
        Dict with success status and channels data
    """
    try:
        client = get_composio_client()
        
        result = client.tools.execute(
            slug="SLACK_LIST_ALL_SLACK_CHANNELS",
            arguments={},
            user_id=user_id,
            dangerously_skip_version_check=True,
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"ERROR: Slack list_channels failed: {e}")
        return {"success": False, "error": str(e)}


async def search_messages(user_id: str, query: str) -> Dict:
    """
    Search for messages in Slack.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        query: Search query
        
    Returns:
        Dict with success status and search results
    """
    try:
        client = get_composio_client()
        
        result = client.tools.execute(
            slug="SLACK_SEARCH_FOR_A_MESSAGE_IN_SLACK",
            arguments={"query": query},
            user_id=user_id,
            dangerously_skip_version_check=True,
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"ERROR: Slack search_messages failed: {e}")
        return {"success": False, "error": str(e)}
