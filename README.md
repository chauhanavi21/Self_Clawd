# CLAWD — Local AI Coding Agent

```
 ██████╗██╗      █████╗ ██╗    ██╗██████╗
██╔════╝██║     ██╔══██╗██║    ██║██╔══██╗
██║     ██║     ███████║██║ █╗ ██║██║  ██║
██║     ██║     ██╔══██║██║███╗██║██║  ██║
╚██████╗███████╗██║  ██║╚███╔███╔╝██████╔╝
 ╚═════╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═════╝
```

> A fully local AI coding agent. Like Claude Code, but running 100% on your machine.
> No API keys. No cloud. No cost per token.

---

## What it does

CLAWD is an agent loop that connects a local LLM (via Ollama) to a set of coding tools:

| Tool | What it does |
|------|-------------|
| `read_file` | Read any file with optional line ranges |
| `write_file` | Create or overwrite files |
| `patch_file` | Surgical line-range replacement |
| `run_command` | Execute shell commands (build, test, git, etc.) |
| `search_code` | Grep/regex search across your codebase |
| `find_files` | Find files by name or glob pattern |
| `list_dir` | List directory contents (recursive supported) |
| `delete_file` | Delete a file |
| `create_dir` | Create directories |
| `file_info` | File metadata, size, line count |

The agent reads your task, decides which tools to call, executes them, sees the results, and loops — until the task is done.

---

## System Requirements

- **OS:** Windows 10/11 (scripts are `.bat` files)
- **RAM:** 8GB minimum, 16GB recommended
- **Storage:** ~5–15GB for model files
- **CPU:** Any modern x64 processor (Intel Core 7 150U works great)
- **GPU:** Optional — Ollama uses CPU by default, GPU speeds it up

---

## Quick Start

### Step 1 — Install prerequisites

1. **Python 3.10+** — https://python.org (check "Add to PATH")
2. **Node.js 18+** — https://nodejs.org
3. **Ollama** — https://ollama.com/download

### Step 2 — Pull a model

Open a terminal and run one of these (pick based on your RAM):

```bash
# Best for coding, uses ~4GB RAM — RECOMMENDED for 16GB systems
ollama pull qwen2.5-coder:7b

# Fastest, uses ~2GB RAM — good for quick tasks
ollama pull llama3.2:3b

# Most powerful, uses ~8GB RAM — if you want max quality
ollama pull codellama:13b
```

### Step 3 — Set up CLAWD

Double-click `setup.bat` or run in terminal:

```
setup.bat
```

This installs Python and Node.js dependencies automatically.

### Step 4 — Start

```
start.bat
```

This opens two terminal windows (backend + frontend) and launches your browser at `http://localhost:5173`.

---

## Architecture

```
┌─────────────────────────────────────────┐
│           CLAWD Frontend (React)         │
│         Terminal-style dark UI           │
│      WebSocket streaming display         │
└──────────────────┬──────────────────────┘
                   │ WebSocket ws://localhost:8000/ws/{session}
┌──────────────────▼──────────────────────┐
│          CLAWD Backend (FastAPI)         │
│                                          │
│  ┌─────────────┐    ┌─────────────────┐ │
│  │ AgentRunner │    │  ToolRegistry   │ │
│  │             │───▶│                 │ │
│  │  LLM Loop   │    │  read_file      │ │
│  │  (max 12x)  │◀───│  write_file     │ │
│  │             │    │  run_command    │ │
│  └──────┬──────┘    │  search_code   │ │
│         │           │  ...8 more...   │ │
│  ┌──────▼──────┐    └─────────────────┘ │
│  │   Ollama    │                        │
│  │   Client    │                        │
│  └──────┬──────┘                        │
└─────────┼───────────────────────────────┘
          │ HTTP streaming
┌─────────▼──────────┐
│  Ollama (local LLM) │
│  qwen2.5-coder:7b   │
│  runs on your CPU   │
└─────────────────────┘
```

### Agent Loop (per message)

```
User message
    │
    ▼
Build system prompt (with tool definitions)
    │
    ▼
Send to Ollama → stream tokens to UI
    │
    ▼
Parse ```tool``` blocks from response
    │
    ├── No tool calls? → DONE
    │
    ▼
Execute each tool → stream result to UI
    │
    ▼
Add tool results to conversation history
    │
    ▼
Loop (max 12 iterations)
```

---

## Project Structure

```
clawd/
├── backend/
│   ├── main.py              # FastAPI app + WebSocket endpoint
│   ├── requirements.txt     # Python deps
│   ├── agent/
│   │   ├── runner.py        # Core agent loop + Ollama client
│   │   └── session.py       # Session & conversation history
│   ├── tools/
│   │   └── registry.py      # All 10 tools implemented here
│   └── api/
│       └── routes.py        # REST routes (/tools, /models, /health)
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx           # Main terminal UI
│       ├── index.css         # Global dark theme
│       ├── components/
│       │   └── MessageBlock.jsx  # Message renderer (user/tool/markdown)
│       └── hooks/
│           └── useAgentSocket.js  # WebSocket hook with auto-reconnect
├── scripts/
│   ├── setup.bat            # Dependency installer
│   └── start.bat            # Launch everything
├── setup.bat                # Root shortcut
└── start.bat                # Root shortcut
```

---

## Usage Tips

### Setting your project directory
Click the green path in the **cwd** bar at the top and type your project folder.
Example: `C:\Users\Avi\projects\my-app`

### Example prompts
- *"Read package.json and tell me what this project does"*
- *"Find all files with TODO comments and fix them"*
- *"Run the tests and fix any failures"*
- *"Create a new REST endpoint for user authentication"*
- *"Refactor this function to be more readable"*
- *"Search for all usages of console.log and remove them"*

### Interrupting the agent
Click **■ stop** at any time to interrupt the agent mid-loop.

### Switching models
```bash
ollama pull deepseek-coder-v2:16b
```
The agent auto-detects your available models and picks the best one.

---

## Troubleshooting

**"Cannot connect to Ollama"**
Run `ollama serve` in a terminal and keep it running.

**Agent gives generic answers without using tools**
Make sure your model supports instruction following. `qwen2.5-coder:7b` is the most reliable.

**Slow responses**
Normal on CPU — `qwen2.5-coder:7b` takes ~1–3 seconds per token on Intel Core 7.
Use `llama3.2:3b` for faster (but less capable) responses.

**Frontend shows "connecting..."**
Make sure the backend is running (`python main.py` in the `backend/` folder).

---

## Extending CLAWD

To add a new tool, open `backend/tools/registry.py` and add to `_register_all()`:

```python
self.register(
    name="my_tool",
    description="What this tool does",
    parameters={
        "param1": {"type": "string", "description": "..."},
    },
    handler=self._my_tool_handler,
)

def _my_tool_handler(self, args: dict, cwd: str) -> str:
    # implement here
    return "result as string"
```

The agent will automatically pick it up and use it.

---

## Inspired by

- **claw-code** (instructkr) — harness architecture patterns
- **Claude Code** (Anthropic) — the original agentic coding tool
- **Ollama** — local LLM runtime

Built from scratch. No proprietary source used.
