"""
Tool Registry — every tool CLAWD can call.
Inspired by claw-code's tool wiring architecture.

Tools:
  read_file       — read any file
  write_file      — write/overwrite a file
  list_dir        — list directory contents
  run_command     — execute shell commands
  search_code     — grep/search inside files
  find_files      — find files by name/pattern
  patch_file      — surgical line-range replacement
  delete_file     — delete a file
  create_dir      — create directory
  file_info       — metadata about a file
"""

import os
import subprocess
import fnmatch
import json
from dataclasses import dataclass
from typing import Any, Callable, Optional


@dataclass
class ToolDefinition:
    name: str
    description: str
    parameters: dict
    handler: Callable


class ToolRegistry:
    def __init__(self):
        self._tools: dict[str, ToolDefinition] = {}
        self._register_all()

    def _register_all(self):
        self.register(
            name="read_file",
            description="Read the contents of a file. Returns the file content as text.",
            parameters={
                "path": {"type": "string", "description": "Absolute or relative path to the file"},
                "start_line": {"type": "integer", "description": "Optional: start line (1-indexed)", "required": False},
                "end_line": {"type": "integer", "description": "Optional: end line (1-indexed)", "required": False},
            },
            handler=self._read_file,
        )
        self.register(
            name="write_file",
            description="Write content to a file. Creates the file if it doesn't exist, overwrites if it does.",
            parameters={
                "path": {"type": "string", "description": "Path to write to"},
                "content": {"type": "string", "description": "Content to write"},
            },
            handler=self._write_file,
        )
        self.register(
            name="patch_file",
            description="Replace a specific range of lines in a file. Use this for surgical edits.",
            parameters={
                "path": {"type": "string", "description": "Path to the file"},
                "start_line": {"type": "integer", "description": "Start line to replace (1-indexed, inclusive)"},
                "end_line": {"type": "integer", "description": "End line to replace (1-indexed, inclusive)"},
                "new_content": {"type": "string", "description": "New content to put in place of the replaced lines"},
            },
            handler=self._patch_file,
        )
        self.register(
            name="list_dir",
            description="List the contents of a directory, showing files and subdirectories.",
            parameters={
                "path": {"type": "string", "description": "Directory path to list. Defaults to current directory.", "required": False},
                "recursive": {"type": "boolean", "description": "Whether to list recursively", "required": False},
            },
            handler=self._list_dir,
        )
        self.register(
            name="run_command",
            description="Run a shell command and return stdout/stderr. Use for build, test, install, git, etc.",
            parameters={
                "command": {"type": "string", "description": "The command to run"},
                "cwd": {"type": "string", "description": "Working directory for the command", "required": False},
                "timeout": {"type": "integer", "description": "Timeout in seconds (default 30)", "required": False},
            },
            handler=self._run_command,
        )
        self.register(
            name="search_code",
            description="Search for a pattern inside files using grep. Returns matching lines with file and line number.",
            parameters={
                "pattern": {"type": "string", "description": "Search pattern (regex supported)"},
                "path": {"type": "string", "description": "Directory or file to search in", "required": False},
                "file_pattern": {"type": "string", "description": "Glob pattern to filter files, e.g. '*.py'", "required": False},
                "case_sensitive": {"type": "boolean", "description": "Case sensitive search (default true)", "required": False},
            },
            handler=self._search_code,
        )
        self.register(
            name="find_files",
            description="Find files by name or glob pattern within a directory.",
            parameters={
                "pattern": {"type": "string", "description": "Filename or glob pattern, e.g. '*.py', 'main.ts'"},
                "path": {"type": "string", "description": "Directory to search in", "required": False},
            },
            handler=self._find_files,
        )
        self.register(
            name="delete_file",
            description="Delete a file. Be careful — this is irreversible.",
            parameters={
                "path": {"type": "string", "description": "Path to the file to delete"},
            },
            handler=self._delete_file,
        )
        self.register(
            name="create_dir",
            description="Create a directory (and parents if needed).",
            parameters={
                "path": {"type": "string", "description": "Directory path to create"},
            },
            handler=self._create_dir,
        )
        self.register(
            name="file_info",
            description="Get metadata about a file: size, modified time, line count, language.",
            parameters={
                "path": {"type": "string", "description": "Path to the file"},
            },
            handler=self._file_info,
        )

    def register(self, name: str, description: str, parameters: dict, handler: Callable):
        self._tools[name] = ToolDefinition(
            name=name, description=description, parameters=parameters, handler=handler
        )

    def get(self, name: str) -> Optional[ToolDefinition]:
        return self._tools.get(name)

    def list_all(self) -> list[dict]:
        return [
            {"name": t.name, "description": t.description, "parameters": t.parameters}
            for t in self._tools.values()
        ]

    async def call(self, name: str, args: dict, cwd: str = ".") -> str:
        tool = self.get(name)
        if not tool:
            return f"Error: Unknown tool '{name}'"
        try:
            result = tool.handler(args, cwd)
            return result
        except Exception as e:
            return f"Tool error in {name}: {str(e)}"

    # ── Handlers ──────────────────────────────────────────────────────────────

    def _read_file(self, args: dict, cwd: str) -> str:
        path = self._resolve(args["path"], cwd)
        if not os.path.exists(path):
            return f"Error: File not found: {path}"
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()
        start = args.get("start_line")
        end = args.get("end_line")
        if start or end:
            s = (start or 1) - 1
            e = end or len(lines)
            lines = lines[s:e]
        numbered = [f"{i+1:4d} | {l}" for i, l in enumerate(lines)]
        content = "".join(numbered)
        if len(content) > 20000:
            content = content[:20000] + f"\n... [truncated, {len(lines)} lines total]"
        return content

    def _write_file(self, args: dict, cwd: str) -> str:
        path = self._resolve(args["path"], cwd)
        os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(args["content"])
        size = os.path.getsize(path)
        return f"Written {size} bytes to {path}"

    def _patch_file(self, args: dict, cwd: str) -> str:
        path = self._resolve(args["path"], cwd)
        if not os.path.exists(path):
            return f"Error: File not found: {path}"
        with open(path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        s = args["start_line"] - 1
        e = args["end_line"]
        new_lines = args["new_content"].splitlines(keepends=True)
        if not new_lines[-1].endswith("\n"):
            new_lines[-1] += "\n"
        lines[s:e] = new_lines
        with open(path, "w", encoding="utf-8") as f:
            f.writelines(lines)
        return f"Patched lines {args['start_line']}–{args['end_line']} in {path}"

    def _list_dir(self, args: dict, cwd: str) -> str:
        path = self._resolve(args.get("path", "."), cwd)
        recursive = args.get("recursive", False)
        if not os.path.isdir(path):
            return f"Error: Not a directory: {path}"
        result = []
        if recursive:
            for root, dirs, files in os.walk(path):
                dirs[:] = [d for d in dirs if not d.startswith(".") and d not in ("node_modules", "__pycache__", ".git")]
                rel = os.path.relpath(root, path)
                for f in files:
                    result.append(os.path.join(rel, f) if rel != "." else f)
                if len(result) > 500:
                    result.append("... [truncated]")
                    break
        else:
            for item in sorted(os.listdir(path)):
                full = os.path.join(path, item)
                tag = "/" if os.path.isdir(full) else ""
                result.append(f"{item}{tag}")
        return "\n".join(result) if result else "(empty directory)"

    def _run_command(self, args: dict, cwd: str) -> str:
        cmd = args["command"]
        work_dir = self._resolve(args.get("cwd", cwd), cwd)
        timeout = args.get("timeout", 30)
        try:
            proc = subprocess.run(
                cmd, shell=True, cwd=work_dir,
                capture_output=True, text=True, timeout=timeout
            )
            out = proc.stdout.strip()
            err = proc.stderr.strip()
            parts = []
            if out:
                parts.append(f"STDOUT:\n{out}")
            if err:
                parts.append(f"STDERR:\n{err}")
            parts.append(f"Exit code: {proc.returncode}")
            return "\n".join(parts) if parts else "(no output)"
        except subprocess.TimeoutExpired:
            return f"Error: Command timed out after {timeout}s"

    def _search_code(self, args: dict, cwd: str) -> str:
        pattern = args["pattern"]
        search_path = self._resolve(args.get("path", "."), cwd)
        file_pat = args.get("file_pattern", "*")
        case = args.get("case_sensitive", True)
        results = []
        flags = 0 if case else 2  # re.IGNORECASE = 2
        import re
        try:
            regex = re.compile(pattern, flags)
        except re.error as e:
            return f"Invalid regex: {e}"
        for root, dirs, files in os.walk(search_path):
            dirs[:] = [d for d in dirs if d not in ("node_modules", "__pycache__", ".git", "dist", ".venv")]
            for fname in files:
                if not fnmatch.fnmatch(fname, file_pat):
                    continue
                fpath = os.path.join(root, fname)
                try:
                    with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                        for i, line in enumerate(f, 1):
                            if regex.search(line):
                                rel = os.path.relpath(fpath, search_path)
                                results.append(f"{rel}:{i}: {line.rstrip()}")
                                if len(results) >= 100:
                                    results.append("... [max 100 results reached]")
                                    return "\n".join(results)
                except Exception:
                    continue
        return "\n".join(results) if results else "No matches found."

    def _find_files(self, args: dict, cwd: str) -> str:
        pattern = args["pattern"]
        search_path = self._resolve(args.get("path", "."), cwd)
        results = []
        for root, dirs, files in os.walk(search_path):
            dirs[:] = [d for d in dirs if d not in ("node_modules", "__pycache__", ".git", "dist", ".venv")]
            for fname in files:
                if fnmatch.fnmatch(fname, pattern):
                    results.append(os.path.relpath(os.path.join(root, fname), search_path))
                    if len(results) >= 200:
                        results.append("... [truncated]")
                        return "\n".join(results)
        return "\n".join(results) if results else "No files found."

    def _delete_file(self, args: dict, cwd: str) -> str:
        path = self._resolve(args["path"], cwd)
        if not os.path.exists(path):
            return f"Error: File not found: {path}"
        os.remove(path)
        return f"Deleted: {path}"

    def _create_dir(self, args: dict, cwd: str) -> str:
        path = self._resolve(args["path"], cwd)
        os.makedirs(path, exist_ok=True)
        return f"Created directory: {path}"

    def _file_info(self, args: dict, cwd: str) -> str:
        path = self._resolve(args["path"], cwd)
        if not os.path.exists(path):
            return f"Error: File not found: {path}"
        stat = os.stat(path)
        from datetime import datetime
        info = {
            "path": path,
            "size_bytes": stat.st_size,
            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "is_dir": os.path.isdir(path),
        }
        if not os.path.isdir(path):
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    lines = f.readlines()
                info["line_count"] = len(lines)
                ext = os.path.splitext(path)[1]
                info["extension"] = ext
            except Exception:
                info["line_count"] = "unreadable"
        return json.dumps(info, indent=2)

    def _resolve(self, path: str, cwd: str) -> str:
        if os.path.isabs(path):
            return path
        return os.path.normpath(os.path.join(cwd, path))


# Singleton
_registry = ToolRegistry()

def get_registry() -> ToolRegistry:
    return _registry
