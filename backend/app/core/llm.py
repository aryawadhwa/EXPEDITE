from typing import Optional

from app.core.config import settings


def create_chat_llm(
    temperature: float = 0.2,
    model_name: Optional[str] = None,
    max_tokens: Optional[int] = None,
    prefer_provider: Optional[str] = None,
):
    """
    Create a chat model with provider fallback:
    1) preferred/default provider
    2) fallback to OpenAI gpt-4o-mini
    """
    provider = (prefer_provider or settings.LLM_PROVIDER or "gemini").lower()

    if provider == "mlx":
        try:
            from langchain_community.chat_models.mlx import ChatMLX
            from langchain_community.llms.mlx_pipeline import MLXPipeline
            
            pipeline_kwargs = {"temperature": temperature}
            if max_tokens is not None:
                pipeline_kwargs["max_tokens"] = max_tokens
            else:
                pipeline_kwargs["max_tokens"] = 1000
                
            mlx_llm = MLXPipeline.from_model_id(
                model_id=model_name or settings.MLX_MODEL,
                pipeline_kwargs=pipeline_kwargs
            )
                
            return ChatMLX(llm=mlx_llm)
        except Exception as e:
            print(f"MLX fallback failed: {e}")
            pass

    if provider == "gemini":
        try:
            if settings.GEMINI_API_KEY:
                from langchain_google_genai import ChatGoogleGenerativeAI

                kwargs = {
                    "google_api_key": settings.GEMINI_API_KEY,
                    "model": model_name or settings.GEMINI_MODEL,
                    "temperature": temperature,
                }
                if max_tokens is not None:
                    kwargs["max_output_tokens"] = max_tokens
                return ChatGoogleGenerativeAI(**kwargs)
        except Exception:
            # Fall through to OpenAI fallback
            pass

    if settings.OPENAI_API_KEY:
        from langchain_openai import ChatOpenAI

        kwargs = {
            "openai_api_key": settings.OPENAI_API_KEY,
            "model": model_name or settings.OPENAI_MODEL,
            "temperature": temperature,
        }
        if max_tokens is not None:
            kwargs["max_tokens"] = max_tokens
        return ChatOpenAI(**kwargs)

    raise RuntimeError(
        "No valid LLM provider configured. Set GEMINI_API_KEY or OPENAI_API_KEY."
    )
