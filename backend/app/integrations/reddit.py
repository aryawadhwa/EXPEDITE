"""
Reddit Integration Module
Uses Composio SDK
https://docs.composio.dev/reference/sdk-reference/python
"""

from typing import Dict, Optional
from app.core.composio_config import get_composio_client, get_auth_config_id

REDDIT_AUTH_CONFIG_ID = get_auth_config_id("reddit")


async def search_posts(user_id: str, query: str, subreddit: Optional[str] = None, limit: int = 25) -> Dict:
    """
    Search Reddit posts.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        query: Search query
        subreddit: Optional subreddit to search within
        limit: Number of results
        
    Returns:
        Dict with success status and search results
    """
    try:
        client = get_composio_client()
        
        arguments = {
            "query": query,
            "limit": min(limit, 100)
        }
        
        if subreddit:
            arguments["subreddit"] = subreddit
        
        result = client.tools.execute(
            slug="REDDIT_SEARCH_SUBMISSIONS",
            arguments=arguments,
            user_id=user_id,
            dangerously_skip_version_check=True,
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"ERROR: Reddit search_posts failed: {e}")
        return {"success": False, "error": str(e)}


async def create_post(user_id: str, subreddit: str, title: str, content: str, is_self: bool = True) -> Dict:
    """
    Create a post in a subreddit.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        subreddit: Target subreddit name (without r/)
        title: Post title
        content: Post content (text for self posts, URL for link posts)
        is_self: True for text post, False for link post
        
    Returns:
        Dict with success status and response data
    """
    try:
        client = get_composio_client()
        
        arguments = {
            "subreddit": subreddit.replace("r/", ""),
            "title": title,
            "kind": "self" if is_self else "link"
        }
        
        if is_self:
            arguments["text"] = content
        else:
            arguments["url"] = content
        
        result = client.tools.execute(
            slug="REDDIT_CREATE_REDDIT_POST",
            arguments=arguments,
            user_id=user_id,
            dangerously_skip_version_check=True,
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"ERROR: Reddit create_post failed: {e}")
        return {"success": False, "error": str(e)}


async def comment_post(user_id: str, post_id: str, comment: str) -> Dict:
    """
    Comment on a Reddit post.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        post_id: Reddit post ID (thing ID)
        comment: Comment content
        
    Returns:
        Dict with success status and response data
    """
    try:
        client = get_composio_client()
        
        result = client.tools.execute(
            slug="REDDIT_COMMENT",
            arguments={
                "thing_id": post_id,
                "text": comment
            },
            user_id=user_id,
            dangerously_skip_version_check=True,
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"ERROR: Reddit comment_post failed: {e}")
        return {"success": False, "error": str(e)}


async def get_subreddit_posts(user_id: str, subreddit: str, sort: str = "hot", limit: int = 25) -> Dict:
    """
    Get posts from a subreddit.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        subreddit: Subreddit name (without r/)
        sort: hot, new, top, rising
        limit: Number of posts
        
    Returns:
        Dict with success status and posts data
    """
    try:
        client = get_composio_client()
        
        action_map = {
            "hot": "REDDIT_GET_HOT_SUBMISSIONS",
            "new": "REDDIT_GET_NEW_SUBMISSIONS",
            "top": "REDDIT_GET_TOP_SUBMISSIONS",
            "rising": "REDDIT_GET_RISING_SUBMISSIONS"
        }
        
        slug = action_map.get(sort, "REDDIT_GET_HOT_SUBMISSIONS")
        
        result = client.tools.execute(
            slug=slug,
            arguments={
                "subreddit": subreddit.replace("r/", ""),
                "limit": min(limit, 100)
            },
            user_id=user_id,
            dangerously_skip_version_check=True,
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"ERROR: Reddit get_subreddit_posts failed: {e}")
        return {"success": False, "error": str(e)}
