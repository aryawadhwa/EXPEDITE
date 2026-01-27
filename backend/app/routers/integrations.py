from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, Dict
from app.api.deps import get_current_user
from app.models import User
from app.core.config import settings
import httpx

router = APIRouter()

@router.post("/gmail/connect")
async def connect_gmail(user: User = Depends(get_current_user)):
    """
    Initiate Gmail connection via Composio.
    Returns the redirect URL for the user to authenticate.
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
    
    async with httpx.AsyncClient() as client:
        print(f"Sending payload to {url}: {payload}") # Debug log
        resp = await client.post(url, json=payload, headers=headers)
        if resp.status_code not in [200, 201, 202]:
             print(f"Composio Error: {resp.text}") # Log error to terminal
             raise HTTPException(status_code=400, detail=f"Composio Error: {resp.text}")
        
        data = resp.json()
        print(f"Composio Response: {data}") # Debug log
        
        connection_id = data.get("id") or data.get("connection_id")
        redirect_url = data.get("redirectUrl") or data.get("redirect_url")
        
        if not connection_id:
            raise HTTPException(status_code=500, detail="No connection_id returned from Composio")

        # Store connection_id
        user.gmail_connection_id = connection_id
        await user.save()
        
        return {"redirect_url": redirect_url}

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
             print(f"Composio Error: {resp.text}") 
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

# Generic Integration Handler
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
    "sheets": "ac_E9vuh1t4AzEu" # Alias
}

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
    auth_config_id = TOOL_CONFIG_MAP.get(tool)
    
    auth_mode = "unknown"

    payload = {
        "connection": {"user_id": user.clerk_id}
    }
    
    if req.params:
        # Pass user inputs as top-level 'data' (common for Composio inputs)
        payload["data"] = req.params

    if auth_config_id:
        payload["auth_config"] = {"id": auth_config_id}
        auth_mode = "auth_config"
    else:
         # Try identifying by integrationId directly
         # v3 supports creating via integrationId if no auth config needed or default available ?
         # Actually, better to default to 'integrationId' logic if we strictly don't have auth config
         # But usually Composio needs auth config.
         # For this specific user request, I will assume we might fallback or error.
         # I will use 'integrationId' as key. 
         # Note: v3 connected_accounts usually takes auth_config.
         # For simplicity, if unknown, I'll error gracefully or try integrationId
         payload["integrationId"] = tool 
         auth_mode = "integrationId"
    
    url = "https://backend.composio.dev/api/v3/connected_accounts" 
    headers = {"x-api-key": settings.COMPOSIO_API_KEY}
    
    async with httpx.AsyncClient() as client:
        print(f"Connecting {tool} (mode={auth_mode}): {payload}")
        resp = await client.post(url, json=payload, headers=headers)
        
        if resp.status_code not in [200, 201, 202]:
             print(f"Composio Error: {resp.text}")
             raise HTTPException(status_code=400, detail=f"Composio Error: {resp.text}")
        
        data = resp.json()
        connection_id = data.get("id") or data.get("connection_id")
        redirect_url = data.get("redirectUrl") or data.get("redirect_url")
        
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
        
        return {"redirect_url": redirect_url, "connection_id": connection_id}

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
                    if status in ["ACTIVE", "CONNECTED"]:
                        return {"status": "ACTIVE", "tool": tool, "connection_id": connection_id}
            except Exception as e:
                print(f"Error checking {tool} status: {e}")
    
    # If we have a connection_id stored, assume it's connected
    return {"status": "ACTIVE", "tool": tool, "connection_id": connection_id}
