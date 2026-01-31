from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, Dict
from app.api.deps import get_current_user
from app.models import User, PendingAction
from app.core.config import settings
from app.core.composio_config import TOOL_CONFIG_MAP, get_auth_config_id
import httpx
import urllib.parse

router = APIRouter()

@router.post("/gmail/connect")
async def connect_gmail(redirect_url: str = None, user: User = Depends(get_current_user)):
    """
    Initiate Gmail connection via Composio.
    Returns the redirect URL for the user to authenticate.
    Optional redirect_url param allows returning to a specific page after OAuth.
    """
    # Using v1/connected_accounts which is the current standard (often called v2/v3 in SDKs but v1 in generic API paths sometimes, OR it is v1/connected_accounts)
    # The deprecated one was v1/connections.
    url = "https://backend.composio.dev/api/v3/connected_accounts" 
    headers = {"x-api-key": settings.COMPOSIO_API_KEY}
    
    if not settings.COMPOSIO_API_KEY or not settings.COMPOSIO_AUTH_CONFIG_ID:
         raise HTTPException(status_code=500, detail="Composio configuration missing")

    payload = {
        "auth_config": {"id": settings.COMPOSIO_AUTH_CONFIG_ID},
        "connection": {"user_id": user.clerk_id}
    }
    
    # Add custom redirect if provided (Composio may support this in some integrations)
    if redirect_url:
        payload["redirect_url"] = redirect_url
    
    async with httpx.AsyncClient() as client:

        resp = await client.post(url, json=payload, headers=headers)
        if resp.status_code not in [200, 201, 202]:

             raise HTTPException(status_code=400, detail=f"Composio Error: {resp.text}")
        
        data = resp.json()

        
        connection_id = data.get("id") or data.get("connection_id")
        composio_redirect = data.get("redirectUrl") or data.get("redirect_url")
        
        if not connection_id:
            raise HTTPException(status_code=500, detail="No connection_id returned from Composio")

        # Store connection_id
        user.gmail_connection_id = connection_id
        await user.save()
        
        # If user provided a redirect_url, append it as a query param so frontend can redirect after OAuth
        final_redirect = composio_redirect
        if redirect_url and composio_redirect:
            # Append our redirect as a query param (some OAuth flows support this)
            separator = "&" if "?" in composio_redirect else "?"
            final_redirect = f"{composio_redirect}{separator}return_to={redirect_url}"
        
        return {"redirect_url": final_redirect, "return_to": redirect_url}

@router.get("/gmail/status")
async def get_gmail_status(user: User = Depends(get_current_user)):
    """
    Check the status of the Gmail connection.
    """
    if not user.gmail_connection_id:
        return {"status": "INACTIVE"}
        
    # Verify with Composio
    url = f"https://backend.composio.dev/api/v3/connected_accounts/{user.gmail_connection_id}"
    headers = {"x-api-key": settings.COMPOSIO_API_KEY}
    
    if not settings.COMPOSIO_API_KEY:
         return {"status": "INACTIVE"} # Config missing

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                # Check status field. might be "status": "ACTIVE" or "connected"
                status = data.get("status")
                if status == "ACTIVE" or status == "CONNECTED":
                    return {"status": "ACTIVE"}
        except Exception:
            pass # Fallback to inactive on error
    
    return {"status": "INACTIVE"}

@router.post("/slack/connect")
async def connect_slack(user: User = Depends(get_current_user)):
    """
    Initiate Slack connection via Composio.
    """
    url = "https://backend.composio.dev/api/v3/connected_accounts" 
    headers = {"x-api-key": settings.COMPOSIO_API_KEY}
    
    if not settings.COMPOSIO_API_KEY:
         raise HTTPException(status_code=500, detail="Composio configuration missing")

    SLACK_AUTH_CONFIG_ID = "ac_YPQ1Q5xomR5i"

    payload = {
        "auth_config": {"id": SLACK_AUTH_CONFIG_ID},
        "connection": {"user_id": user.clerk_id}
    }
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload, headers=headers)
        if resp.status_code not in [200, 201, 202]:
 
             raise HTTPException(status_code=400, detail=f"Composio Error: {resp.text}")
        
        data = resp.json()
        
        connection_id = data.get("id") or data.get("connection_id")
        redirect_url = data.get("redirectUrl") or data.get("redirect_url")
        
        if not connection_id:
            raise HTTPException(status_code=500, detail="No connection_id returned from Composio")

        user.slack_connection_id = connection_id
        await user.save()
        
        return {"redirect_url": redirect_url}

@router.get("/slack/status")
async def get_slack_status(user: User = Depends(get_current_user)):
    if not user.slack_connection_id:
        return {"status": "INACTIVE"}
        
    url = f"https://backend.composio.dev/api/v3/connected_accounts/{user.slack_connection_id}"
    headers = {"x-api-key": settings.COMPOSIO_API_KEY}
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                status = data.get("status")
                if status == "ACTIVE" or status == "CONNECTED":
                    return {"status": "ACTIVE"}
        except Exception:
            pass 
    
    return {"status": "INACTIVE"}

from pydantic import BaseModel
class ConnectRequest(BaseModel):
    tool: str
    params: Optional[Dict[str, str]] = None

@router.post("/connect")
async def connect_tool(req: ConnectRequest, user: User = Depends(get_current_user)):
    """
    Generic endpoint to connect any tool.
    Returns Composio redirect URL.
    """
    tool = req.tool.lower()
    auth_config_id = get_auth_config_id(tool)
    
    auth_mode = "unknown"

    payload = {
        "connection": {"user_id": user.clerk_id}
    }
    
    redirect_url = None
    if req.params and "redirect_url" in req.params:
        redirect_url = req.params.pop("redirect_url")

    if req.params:
        # Pass user inputs as top-level 'data' (common for Composio inputs)
        payload["data"] = req.params

    if redirect_url:
        # Try both common variations for V3 API
        payload["redirectUrl"] = redirect_url
        payload["redirect_uri"] = redirect_url

    if auth_config_id:
        payload["auth_config"] = {"id": auth_config_id}
        auth_mode = "auth_config"
    else:
         payload["integrationId"] = tool 
         auth_mode = "integrationId"
    
    url = "https://backend.composio.dev/api/v3/connected_accounts" 
    headers = {"x-api-key": settings.COMPOSIO_API_KEY}
    
    async with httpx.AsyncClient() as client:

        resp = await client.post(url, json=payload, headers=headers)
        
        if resp.status_code not in [200, 201, 202]:
             raise HTTPException(status_code=400, detail=f"Composio Error: {resp.text}")
        
        data = resp.json()
        connection_id = data.get("id") or data.get("connection_id")
        composio_redirect = data.get("redirectUrl") or data.get("redirect_url")
        
        if not connection_id:
            raise HTTPException(status_code=500, detail="No connection_id returned")

        # Save connection
        if tool == "gmail":
            user.gmail_connection_id = connection_id
        elif tool == "slack":
            user.slack_connection_id = connection_id
        else:
            if not user.other_connections:
                user.other_connections = {}
            user.other_connections[tool] = connection_id
            
        await user.save()
        
        # Return the Composio URL directly. 
        # If payload['redirectUrl'] works, Composio will handle the final redirect.
        return {"redirect_url": composio_redirect, "connection_id": connection_id}

@router.get("/")
async def list_integrations(user: User = Depends(get_current_user)):
    """List all connected integrations"""
    connected = []
    
    # helper
    def add_if_exists(name, conn_id):
        if conn_id:
            connected.append({
                "name": name,
                "status": "CONNECTED",
                "connection_id": conn_id
            })

    add_if_exists("gmail", user.gmail_connection_id)
    add_if_exists("slack", user.slack_connection_id)
    
    if user.other_connections:
        for name, conn_id in user.other_connections.items():
            add_if_exists(name, conn_id)
            
    return {"integrations": connected}

@router.delete("/{tool}")
async def disconnect_integration(tool: str, user: User = Depends(get_current_user)):
    """Disconnect an integration"""
    tool = tool.lower()
    
    if tool == "gmail":
        user.gmail_connection_id = None
    elif tool == "slack":
        user.slack_connection_id = None
    elif user.other_connections and tool in user.other_connections:
        del user.other_connections[tool]
    else:
        return {"status": "ignored", "message": "Tool not found or already disconnected"}
        
    await user.save()
    return {"status": "disconnected", "tool": tool}

@router.get("/{tool}/status")
async def get_tool_status(tool: str, user: User = Depends(get_current_user)):
    """Check the status of any integration"""
    tool = tool.lower()
    
    # Get connection ID for the tool
    connection_id = None
    if tool == "gmail":
        connection_id = user.gmail_connection_id
    elif tool == "slack":
        connection_id = user.slack_connection_id
    elif user.other_connections:
        connection_id = user.other_connections.get(tool)
    
    if not connection_id:
        return {"status": "INACTIVE", "tool": tool}
    
    # Verify connection status with Composio
    if settings.COMPOSIO_API_KEY:
        url = f"https://backend.composio.dev/api/v3/connected_accounts/{connection_id}"
        headers = {"x-api-key": settings.COMPOSIO_API_KEY}
        
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(url, headers=headers, timeout=10.0)
                if resp.status_code == 200:
                    data = resp.json()
                    status = data.get("status", "UNKNOWN")
                    # Only return ACTIVE if explicitly connected
                    if status in ["ACTIVE", "CONNECTED"]:
                        return {"status": "ACTIVE", "tool": tool, "connection_id": connection_id}
                    else:
                        return {"status": status, "tool": tool, "connection_id": connection_id}
            except Exception as e:
                pass
    
    # Fallback: If we can't verify, we should probably be cautious. 
    # But for UX, if we have an ID, typically we assume pending/inactive if check failed?
    # Returning INACTIVE ensures we don't assume success erroneously.
    return {"status": "INACTIVE", "tool": tool, "connection_id": connection_id}
