"""
GitHub Integration Module
Uses Composio SDK
https://docs.composio.dev/reference/sdk-reference/python
"""

from typing import Dict, Optional, List
from app.core.config import settings
from composio import Composio

GITHUB_AUTH_CONFIG_ID = "ac_UE__S2Ls9sMT"

# Lazy initialization
_composio_client = None

def get_composio_client():
    global _composio_client
    if _composio_client is None:
        if not settings.COMPOSIO_API_KEY:
            raise ValueError("COMPOSIO_API_KEY is not set")
        _composio_client = Composio(api_key=settings.COMPOSIO_API_KEY)
    return _composio_client


async def create_issue(user_id: str, owner: str, repo: str, title: str, body: str, labels: Optional[List[str]] = None) -> Dict:
    """
    Create an issue in a GitHub repository.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        owner: Repository owner
        repo: Repository name
        title: Issue title
        body: Issue body
        labels: Optional list of labels
        
    Returns:
        Dict with success status and response data
    """
    try:
        client = get_composio_client()
        
        arguments = {
            "owner": owner,
            "repo": repo,
            "title": title,
            "body": body
        }
        
        if labels:
            arguments["labels"] = labels
        
        result = client.tools.execute(
            slug="GITHUB_CREATE_AN_ISSUE",
            arguments=arguments,
            user_id=user_id,
            dangerously_skip_version_check=True,
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"ERROR: GitHub create_issue failed: {e}")
        return {"success": False, "error": str(e)}


async def comment_issue(user_id: str, owner: str, repo: str, issue_number: int, body: str) -> Dict:
    """
    Comment on a GitHub issue.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        owner: Repository owner
        repo: Repository name
        issue_number: Issue number
        body: Comment body
        
    Returns:
        Dict with success status and response data
    """
    try:
        client = get_composio_client()
        
        result = client.tools.execute(
            slug="GITHUB_CREATE_AN_ISSUE_COMMENT",
            arguments={
                "owner": owner,
                "repo": repo,
                "issue_number": issue_number,
                "body": body
            },
            user_id=user_id,
            dangerously_skip_version_check=True,
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"ERROR: GitHub comment_issue failed: {e}")
        return {"success": False, "error": str(e)}


async def fetch_repo_info(user_id: str, owner: str, repo: str) -> Dict:
    """
    Fetch repository information.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        owner: Repository owner
        repo: Repository name
        
    Returns:
        Dict with success status and repo data
    """
    try:
        client = get_composio_client()
        
        result = client.tools.execute(
            slug="GITHUB_GET_A_REPOSITORY",
            arguments={
                "owner": owner,
                "repo": repo
            },
            user_id=user_id,
            dangerously_skip_version_check=True,
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"ERROR: GitHub fetch_repo_info failed: {e}")
        return {"success": False, "error": str(e)}


async def list_issues(user_id: str, owner: str, repo: str, state: str = "open") -> Dict:
    """
    List issues in a repository.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        owner: Repository owner
        repo: Repository name
        state: open, closed, or all
        
    Returns:
        Dict with success status and issues data
    """
    try:
        client = get_composio_client()
        
        result = client.tools.execute(
            slug="GITHUB_LIST_REPOSITORY_ISSUES",
            arguments={
                "owner": owner,
                "repo": repo,
                "state": state
            },
            user_id=user_id,
            dangerously_skip_version_check=True,
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"ERROR: GitHub list_issues failed: {e}")
        return {"success": False, "error": str(e)}


async def list_pull_requests(user_id: str, owner: str, repo: str, state: str = "open") -> Dict:
    """
    List pull requests in a repository.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        owner: Repository owner
        repo: Repository name
        state: open, closed, or all
        
    Returns:
        Dict with success status and PRs data
    """
    try:
        client = get_composio_client()
        
        result = client.tools.execute(
            slug="GITHUB_LIST_PULL_REQUESTS",
            arguments={
                "owner": owner,
                "repo": repo,
                "state": state
            },
            user_id=user_id,
            dangerously_skip_version_check=True,
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"ERROR: GitHub list_pull_requests failed: {e}")
        return {"success": False, "error": str(e)}


async def star_repo(user_id: str, owner: str, repo: str) -> Dict:
    """
    Star a GitHub repository.
    
    Args:
        user_id: Composio entity ID (e.g., clerk_id)
        owner: Repository owner
        repo: Repository name
        
    Returns:
        Dict with success status and response data
    """
    try:
        client = get_composio_client()
        
        result = client.tools.execute(
            slug="GITHUB_STAR_A_REPOSITORY_FOR_THE_AUTHENTICATED_USER",
            arguments={
                "owner": owner,
                "repo": repo
            },
            user_id=user_id,
            dangerously_skip_version_check=True,
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"ERROR: GitHub star_repo failed: {e}")
        return {"success": False, "error": str(e)}
