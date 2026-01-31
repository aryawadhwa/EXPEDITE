"""
Centralized Composio Configuration
Eliminates duplicate TOOL_CONFIG_MAP definitions across the codebase
"""

from app.core.config import settings
from composio import Composio
from typing import Optional

# Centralized Tool Configuration Map
TOOL_CONFIG_MAP = {
    "gmail": settings.COMPOSIO_AUTH_CONFIG_ID,
    "slack": "ac_YPQ1Q5xomR5i",
    "discord": "ac_OGB7yIAcaMvY",
    "discord_bot": "ac_FaFbZvKQhqj7",
    "telegram": "ac_ktmRNM3mDtJP",
    "github": "ac_UE__S2Ls9sMT",
    "reddit": "ac_2_IjyXggGH8F",
    "perplexity": "ac_9u_yICXpCVs4",
    "google_sheets": "ac_E9vuh1t4AzEu",
    "sheets": "ac_E9vuh1t4AzEu",  # Alias
    "linkedin": "ac_SdzD1ondK6Zi",
    "twitter": "ac_46x65PoeAWsM",
}

# Singleton Composio client
_composio_client: Optional[Composio] = None


def get_composio_client() -> Composio:
    """
    Get or create the global Composio client instance.
    Thread-safe singleton pattern.
    """
    global _composio_client
    if _composio_client is None:
        if not settings.COMPOSIO_API_KEY:
            raise ValueError("COMPOSIO_API_KEY is not set in environment variables")
        _composio_client = Composio(api_key=settings.COMPOSIO_API_KEY)
    return _composio_client


def get_auth_config_id(tool: str) -> Optional[str]:
    """
    Get the auth config ID for a given tool.
    
    Args:
        tool: Tool name (e.g., 'gmail', 'slack', 'linkedin')
        
    Returns:
        Auth config ID or None if tool not found
    """
    return TOOL_CONFIG_MAP.get(tool.lower())
