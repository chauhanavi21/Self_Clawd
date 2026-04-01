"""REST API routes for CLAWD"""

from fastapi import APIRouter
import httpx
import uuid

from tools.registry import get_registry

router = APIRouter()

# 127.0.0.1 avoids Windows resolving localhost to ::1 when Ollama listens on IPv4 only
OLLAMA_BASE = "http://127.0.0.1:11434"


@router.get("/tools")
async def list_tools():
    """List all available tools."""
    return {"tools": get_registry().list_all()}


@router.get("/models")
async def list_models():
    """List available Ollama models."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{OLLAMA_BASE}/api/tags")
            data = resp.json()
            models = [m["name"] for m in data.get("models", [])]
            return {"models": models, "ollama_running": True}
    except Exception:
        return {"models": [], "ollama_running": False}


@router.get("/session/new")
async def new_session():
    """Generate a new session ID."""
    return {"session_id": str(uuid.uuid4())}


@router.get("/ollama/status")
async def ollama_status():
    """Check if Ollama is running."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{OLLAMA_BASE}/api/tags")
            models = [m["name"] for m in resp.json().get("models", [])]
            return {"running": True, "models": models}
    except Exception:
        return {"running": False, "models": []}
