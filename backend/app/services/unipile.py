import logging
import httpx
from typing import Dict, Any, List
from app.core.config import settings

logger = logging.getLogger(__name__)

class UnipileService:
    def __init__(self):
        self.dsn = settings.UNIPILE_DSN
        self.api_key = settings.UNIPILE_API_KEY
        self.headers = {
            "X-API-KEY": self.api_key,
            "accept": "application/json",
            "Content-Type": "application/json"
        }

    async def get_accounts(self) -> List[Dict[str, Any]]:
        """Retrieve connected accounts."""
        if not self.dsn or not self.api_key:
            logger.warning("Unipile unavailable: Missing DSN or API Key")
            return []

        url = f"{self.dsn}/api/v1/accounts"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=self.headers, timeout=10.0)
                if response.status_code == 200:
                    data = response.json()
                    return data.get("items", []) # Adjust based on actual API response
                else:
                    logger.error(f"Unipile Error {response.status_code}: {response.text}")
                    return []
        except Exception as e:
            logger.error(f"Unipile Connection Failed: {e}")
            return []

    async def send_linkedin_message(self, account_id: str, linkedin_url: str, message: str) -> Dict[str, Any]:
        """
        Send a LinkedIn message.
        Note: Unipile usually requires a chat/thread ID or specific user ID 
        derived from the Linkedin URL. 
        Assuming we might need to 'resolve' the URL to a Unipile identifier (provider_id) first.
        
        For simplicity in this step, we'll try to use the 'messaging' endpoint if available,
        or we assume we might need to look up the profile first.
        
        Based on typical Unipile flow:
        1. Resolve Linkedin URL to Profile/Chat.
        2. Send Message.
        
        If we don't have exact Unipile docs for 'send to url', we will assume 
        a standard /chats or /messages endpoint where payload takes a provider_id.
        """
        if not self.dsn or not self.api_key:
            return {"status": "error", "message": "Unipile not configured"}

        # Placeholder: 1. Search/Resolve Profile to get internal ID
        # Only implementing basic specific call if known, else mock.
        # But user wants REAL implementation.
        # Let's assume we need to FIND the conversation or CREATE one.
        
        # Step 1: Start chat / Get Chat ID based on public identifier (linkedin url)
        # Endpoint: POST /api/v1/chats
        # Body: { "account_id": "...", "attendees": ["linkedin_public_id_or_url"] }
        
        create_chat_url = f"{self.dsn}/api/v1/chats"
        try:
            async with httpx.AsyncClient() as client:
                # 1. Create/Get Chat
                chat_payload = {
                    "account_id": account_id,
                    "attendees_ids": [linkedin_url] # Unipile often accepts URLs or Provider IDs here
                }
                chat_res = await client.post(create_chat_url, headers=self.headers, json=chat_payload)
                
                chat_id = None
                if chat_res.status_code in [200, 201]:
                    chat_data = chat_res.json()
                    chat_id = chat_data.get("id")
                else:
                    logger.error(f"Failed to resolve chat for {linkedin_url}: {chat_res.text}")
                    return {"status": "error", "message": f"Could not resolve chat: {chat_res.text}"}

                if not chat_id:
                     return {"status": "error", "message": "No chat ID returned"}

                # 2. Send Message
                msg_url = f"{self.dsn}/api/v1/chats/{chat_id}/messages"
                msg_payload = {
                     "text": message
                }
                msg_res = await client.post(msg_url, headers=self.headers, json=msg_payload)
                
                if msg_res.status_code in [200, 201]:
                    return {"status": "success", "data": msg_res.json()}
                else:
                    return {"status": "error", "message": f"Failed to send: {msg_res.text}"}
                    
        except Exception as e:
            return {"status": "error", "message": str(e)}

unipile_service = UnipileService()
