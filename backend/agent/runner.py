"""
AgentRunner — the core agentic loop.

Flow per user message:
  1. Build system prompt with tool definitions
  2. Send to Ollama (streaming)
  3. Parse any tool calls from the response
  4. Execute tools, feed results back
  5. Loop until no more tool calls (max 10 iterations)
  6. Stream every step live to the WebSocket
"""

import json
import re
import asyncio
import httpx
from typing import Optional
from fastapi import WebSocket

from agent.session import AgentSession
from tools.registry import get_registry

OLLAMA_BASE = "http://127.0.0.1:11434"

# Best models for coding tasks, in preference order
# User should have at least one of these pulled
PREFERRED_MODELS = [
    "qwen2.5-coder:7b",
    "deepseek-coder-v2:16b",
    "codellama:13b",
    "llama3.2:3b",
    "mistral:7b",
    "llama3:8b",
]

SYSTEM_PROMPT = """You are CLAWD, an expert AI coding agent running locally on the user's machine.

You have access to the following tools to help you complete coding tasks:

{tool_definitions}

## How to use tools

When you need to use a tool, output a JSON block exactly like this:

```tool
{{
  "tool": "tool_name",
  "args": {{
    "param1": "value1",
    "param2": "value2"
  }}
}}
```

Rules:
- Always read files before editing them so you understand the context
- Make surgical edits — don't rewrite entire files unless necessary
- Run commands to verify your changes work (e.g., run tests, check syntax)
- Explain your reasoning in plain text around tool calls
- After all tool calls are done, give a clear summary of what you did
- If a task requires multiple steps, do them one at a time
- Never guess at file contents — always read first

## Working directory
The user's current working directory is: {cwd}

Be precise, thorough, and always verify your work.
"""


class AgentRunner:
    def __init__(self, session: AgentSession, websocket: WebSocket):
        self.session = session
        self.ws = websocket
        self.registry = get_registry()
        self._interrupted = False
        self._model: Optional[str] = None

    def interrupt(self):
        self._interrupted = True

    async def _send(self, event_type: str, data: dict):
        await self.ws.send_text(json.dumps({"type": event_type, **data}))

    async def _get_model(self) -> str:
        if self._model:
            return self._model
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(f"{OLLAMA_BASE}/api/tags", timeout=10)
                tags = resp.json().get("models", [])
                available = [m["name"] for m in tags]
                for pref in PREFERRED_MODELS:
                    for avail in available:
                        if pref.split(":")[0] in avail:
                            self._model = avail
                            return self._model
                if available:
                    self._model = available[0]
                    return self._model
            except Exception:
                pass
        return "llama3:8b"  # fallback

    async def run(self, user_message: str, cwd: str):
        self._interrupted = False
        self.session.cwd = cwd
        self.session.add_message("user", user_message)

        await self._send("agent_start", {"message": "Thinking..."})

        model = await self._get_model()
        await self._send("model_info", {"model": model})

        tool_defs = self._format_tool_definitions()
        system = SYSTEM_PROMPT.format(tool_definitions=tool_defs, cwd=cwd)

        max_iterations = 12
        iteration = 0

        while iteration < max_iterations and not self._interrupted:
            iteration += 1

            # Build messages for Ollama
            messages = [{"role": "system", "content": system}]
            messages.extend(self.session.get_ollama_messages())

            # Stream response from Ollama
            full_response = ""
            await self._send("llm_start", {"iteration": iteration})

            async with httpx.AsyncClient(timeout=120) as client:
                try:
                    async with client.stream(
                        "POST",
                        f"{OLLAMA_BASE}/api/chat",
                        json={
                            "model": model,
                            "messages": messages,
                            "stream": True,
                            "options": {
                                "temperature": 0.2,
                                "num_ctx": 8192,
                            }
                        }
                    ) as resp:
                        if resp.status_code >= 400:
                            err_text = ""
                            async for line in resp.aiter_lines():
                                if not line.strip():
                                    continue
                                try:
                                    j = json.loads(line)
                                    err_text = j.get("error") or line
                                except json.JSONDecodeError:
                                    err_text = err_text or line
                            await self._send("error", {
                                "message": err_text or f"Ollama returned HTTP {resp.status_code}"
                            })
                            return

                        async for line in resp.aiter_lines():
                            if self._interrupted:
                                break
                            if not line.strip():
                                continue
                            try:
                                chunk = json.loads(line)
                            except json.JSONDecodeError:
                                continue
                            if chunk.get("error"):
                                await self._send("error", {"message": str(chunk["error"])})
                                return
                            token = chunk.get("message", {}).get("content", "")
                            if token:
                                full_response += token
                                await self._send("token", {"content": token})
                            if chunk.get("done"):
                                break
                except httpx.ConnectError:
                    await self._send("error", {
                        "message": "Cannot connect to Ollama. Is it running? Run: ollama serve"
                    })
                    return

            if self._interrupted:
                await self._send("interrupted", {})
                return

            # Parse tool calls from the response
            tool_calls = self._parse_tool_calls(full_response)

            if not tool_calls:
                # No tool calls — agent is done
                if not full_response.strip():
                    await self._send("error", {
                        "message": "The model returned an empty response. If Ollama shows a memory error, use a smaller model (e.g. llama3.2:3b) or close other apps."
                    })
                    return
                self.session.add_message("assistant", full_response)
                await self._send("agent_done", {"message": "Done."})
                return

            # Execute each tool call
            self.session.add_message("assistant", full_response)

            for call in tool_calls:
                if self._interrupted:
                    break

                tool_name = call.get("tool", "")
                tool_args = call.get("args", {})

                await self._send("tool_call", {
                    "tool": tool_name,
                    "args": tool_args
                })

                result = await self.registry.call(tool_name, tool_args, cwd)

                await self._send("tool_result", {
                    "tool": tool_name,
                    "result": result[:4000] if len(result) > 4000 else result
                })

                # Add tool result to history so the LLM sees it
                self.session.add_message(
                    "tool",
                    f"Tool {tool_name} result:\n{result}",
                    tool_name=tool_name,
                    tool_result=result
                )

        if iteration >= max_iterations:
            await self._send("agent_done", {"message": "Reached max iterations."})

    def _parse_tool_calls(self, text: str) -> list[dict]:
        """Extract ```tool ... ``` blocks from LLM response."""
        pattern = r"```tool\s*\n(.*?)\n```"
        matches = re.findall(pattern, text, re.DOTALL)
        calls = []
        for m in matches:
            try:
                calls.append(json.loads(m.strip()))
            except json.JSONDecodeError:
                # Try to fix common JSON issues
                try:
                    fixed = m.strip().replace("'", '"')
                    calls.append(json.loads(fixed))
                except Exception:
                    pass
        return calls

    def _format_tool_definitions(self) -> str:
        tools = self.registry.list_all()
        lines = []
        for t in tools:
            lines.append(f"### {t['name']}")
            lines.append(f"{t['description']}")
            params = t.get("parameters", {})
            if params:
                lines.append("Parameters:")
                for pname, pinfo in params.items():
                    req = "" if pinfo.get("required", True) is False else " (required)"
                    lines.append(f"  - {pname}: {pinfo.get('description', '')}{req}")
            lines.append("")
        return "\n".join(lines)
