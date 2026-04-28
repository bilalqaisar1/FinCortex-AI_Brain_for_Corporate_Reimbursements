"""
Ollama configuration and client instantiation.
Provides asynchronous clients for interacting with the local or remote Ollama instance.
"""
import httpx
from openai import AsyncOpenAI

from app.config.settings import settings

def _format_url(url: str) -> str:
    """Ensure the URL has a correct scheme."""
    if not url.startswith("http://") and not url.startswith("https://"):
        return f"http://{url}"
    return url

OLLAMA_BASE_URL = _format_url(settings.ollama_url)

def get_ollama_http_client() -> httpx.AsyncClient:
    """
    Returns an configured httpx AsyncClient tailored for the Ollama native API.
    Uses increased timeouts suitable for large Vision Models initialization.
    """
    return httpx.AsyncClient(
        base_url=OLLAMA_BASE_URL,
        timeout=httpx.Timeout(180.0, connect=10.0) # Extended timeout for large model (e.g., 235b) inference
    )

def get_ollama_openai_client() -> AsyncOpenAI:
    """
    Returns an AsyncOpenAI client configured to communicate with the Ollama instance
    using the OpenAI-compatible v1 endpoints. 
    This allows drop-in replacement of existing OpenAI pipelines.
    """
    return AsyncOpenAI(
        base_url=f"{OLLAMA_BASE_URL}/v1",
        api_key="ollama", # Dummy key required by the OpenAI client specification
        http_client=get_ollama_http_client()
    )

def get_vision_model_name() -> str:
    """
    Returns the designated Ollama vision model from settings.
    """
    return settings.ollama_vision_model
