from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "EXPEDITE"

    # ─── Local-first / Single-user mode ───────────────────────────────────────
    # When LOCAL_MODE=True the app starts without any cloud dependencies.
    # Perfect for dev/demo on a Mac without MongoDB.
    LOCAL_MODE: bool = True
    USE_SQL_BACKEND: bool = True          # Use SQLite instead of MongoDB
    LOCAL_API_KEY: str = "expedite-local-dev"
    LOCAL_USER_ID: str = "arya-local"
    LOCAL_USER_EMAIL: str = "arya@local.dev"
    DATABASE_URL: Optional[str] = None    # SQLite path, e.g. "sqlite:///./expedite.db"

    # ─── MongoDB (cloud / production) ─────────────────────────────────────────
    MONGODB_URI: Optional[str] = None

    # ─── Auth (Clerk) ─────────────────────────────────────────────────────────
    VITE_CLERK_PUBLISHABLE_KEY: Optional[str] = None
    CLERK_SECRET_KEY: Optional[str] = None

    # ─── LLM Providers ────────────────────────────────────────────────────────
    LLM_PROVIDER: str = "groq"            # groq | mlx | gemini | openai
    GROQ_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    MLX_MODEL: str = "mlx-community/Meta-Llama-3-8B-Instruct-4bit"
    GEMINI_MODEL: str = "gemini-1.5-flash"
    OPENAI_MODEL: str = "gpt-4o-mini"

    # ─── External Data APIs ───────────────────────────────────────────────────
    HUNTER_API_KEY: Optional[str] = None       # Email finding (Hunter.io)
    APOLLO_API_KEY: Optional[str] = None       # Contact enrichment
    FIRECRAWL_API_KEY: Optional[str] = None    # Web scraping fallback
    GITHUB_TOKEN: Optional[str] = None         # GitHub Recruiter Agent

    # ─── Outreach / Integrations ──────────────────────────────────────────────
    COMPOSIO_API_KEY: Optional[str] = None
    COMPOSIO_AUTH_CONFIG_ID: Optional[str] = None

    # ─── Voice Agent (Vapi) ───────────────────────────────────────────────────
    VAPI_API_KEY: Optional[str] = None
    VAPI_PHONE_NUMBER_ID: Optional[str] = None
    VAPI_ASSISTANT_ID: Optional[str] = None    # Pre-configured Vapi assistant
    VAPI_PUBLIC_KEY: Optional[str] = None      # Webhook signature verification
    BLAND_API_KEY: Optional[str] = None        # Bland.ai fallback

    # ─── Unipile (LinkedIn/Email via API) ────────────────────────────────────
    UNIPILE_DSN: Optional[str] = None
    UNIPILE_API_KEY: Optional[str] = None

    # ─── Neo4j Knowledge Graph ────────────────────────────────────────────────
    NEO4J_URI: Optional[str] = None
    NEO4J_USERNAME: Optional[str] = None
    NEO4J_PASSWORD: Optional[str] = None
    NEO4J_DATABASE: str = "neo4j"
    AURA_INSTANCEID: Optional[str] = None
    AURA_INSTANCENAME: Optional[str] = None

    # ─── Observability (LangSmith) ────────────────────────────────────────────
    LANGSMITH_API_KEY: Optional[str] = None
    LANGSMITH_PROJECT: str = "EXPEDITE"
    LANGCHAIN_TRACING_V2: bool = False

    # ─── CORS / Deployment ────────────────────────────────────────────────────
    FRONTEND_URL: Optional[str] = None
    CORS_ORIGINS: Optional[str] = None    # Comma-separated additional origins

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
