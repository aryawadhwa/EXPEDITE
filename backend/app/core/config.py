
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "OutboundAI"
    MONGODB_URI: str
    VITE_CLERK_PUBLISHABLE_KEY: str # Actually not needed for backend verification usually, we check JWKS or Secret Key? 
    # Clerk usually verifies via JWKS using the Issuer URL. 
    # We might need CLERK_SECRET_KEY or CLERK_ISSUER_URL.
    # For simplicitly, let's assume we use CLERK_SECRET_KEY for backend SDK or verify via JWKS.
    # The prompt asked to verify Bearer token from frontend.
    
    CLERK_SECRET_KEY: Optional[str] = None # If using SDK
    GROQ_API_KEY: Optional[str] = None
    FIRECRAWL_API_KEY: Optional[str] = None
    COMPOSIO_API_KEY: Optional[str] = None
    COMPOSIO_AUTH_CONFIG_ID: Optional[str] = None

    # Neo4j Settings
    NEO4J_URI: Optional[str] = None
    NEO4J_USERNAME: Optional[str] = None
    NEO4J_PASSWORD: Optional[str] = None
    NEO4J_DATABASE: str = "neo4j"
    AURA_INSTANCEID: Optional[str] = None
    AURA_INSTANCENAME: Optional[str] = None

    # Unipile Settings
    UNIPILE_DSN: Optional[str] = None
    UNIPILE_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"

settings = Settings()
