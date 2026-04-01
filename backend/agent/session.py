"""
Session management — tracks conversation history and working directory per session
"""

from dataclasses import dataclass, field
from typing import Optional
import os


@dataclass
class Message:
    role: str   # "user" | "assistant" | "tool"
    content: str
    tool_name: Optional[str] = None
    tool_result: Optional[str] = None


@dataclass
class AgentSession:
    session_id: str
    history: list[Message] = field(default_factory=list)
    cwd: str = field(default_factory=os.getcwd)
    interrupted: bool = False

    def add_message(self, role: str, content: str, **kwargs):
        self.history.append(Message(role=role, content=content, **kwargs))

    def get_ollama_messages(self) -> list[dict]:
        """Convert history to Ollama-compatible message format."""
        msgs = []
        for m in self.history:
            if m.role == "tool":
                msgs.append({"role": "tool", "content": m.tool_result or ""})
            else:
                msgs.append({"role": m.role, "content": m.content})
        return msgs

    def clear(self):
        self.history.clear()


class SessionManager:
    def __init__(self):
        self._sessions: dict[str, AgentSession] = {}

    def get_or_create(self, session_id: str) -> AgentSession:
        if session_id not in self._sessions:
            self._sessions[session_id] = AgentSession(session_id=session_id)
        return self._sessions[session_id]

    def disconnect(self, session_id: str):
        # Keep session in memory for reconnect — don't delete
        pass

    def delete(self, session_id: str):
        self._sessions.pop(session_id, None)
