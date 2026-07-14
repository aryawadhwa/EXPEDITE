from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.models import User, UserSettings
from app.core.config import settings
import jwt # pyjwt
from pydantic import BaseModel
from typing import Optional

security = HTTPBearer(auto_error=False)


class LocalUser(BaseModel):
    clerk_id: str
    email: str
    gmail_connection_id: Optional[str] = None
    slack_connection_id: Optional[str] = None
    other_connections: dict = {}
    settings: UserSettings = UserSettings()

    async def save(self):
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    if settings.LOCAL_MODE:
        if settings.LOCAL_API_KEY:
            provided = credentials.credentials if credentials else None
            if provided != settings.LOCAL_API_KEY:
                raise HTTPException(status_code=401, detail="Invalid local API key")
        return LocalUser(
            clerk_id=settings.LOCAL_USER_ID,
            email=settings.LOCAL_USER_EMAIL,
        )

    if not credentials:
        raise HTTPException(status_code=401, detail="Missing auth credentials")

    token = credentials.credentials
    
    # In a real app, verify the token signature using Clerk's JWKS or Secret Key
    # For this prototype, we'll decode unverified to get the 'sub' (User ID)
    # OR if we have the secret key, we verify.
    
    try:
        # Placeholder for full verification
        # jwks_client = jwt.PyJWKClient("https://<your-clerk-domain>/.well-known/jwks.json")
        # signing_key = jwks_client.get_signing_key_from_jwt(token)
        # payload = jwt.decode(token, signing_key.key, algorithms=["RS256"])
        
        # Simple decode for dev (WARNING: NOT SECURE FOR PRODUCTION WITHOUT SIG CHECK)
        payload = jwt.decode(token, options={"verify_signature": False})
        clerk_id = payload.get("sub")
        email = payload.get("email", "") # Might be in a different claim depending on config
        
        if not clerk_id:
             raise HTTPException(status_code=401, detail="Invalid token: missing sub")

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid authentication credentials: {e}")

    user = await User.find_one(User.clerk_id == clerk_id)
    if not user:
        # Create user on the fly if they don't exist
        user = User(clerk_id=clerk_id, email=email)
        await user.insert()
        
    return user
