"""
CLAWD - Local AI Coding Agent
FastAPI backend with agent loop, tool registry, and streaming
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import asyncio
import json
import uuid
from datetime import datetime

from agent.runner import AgentRunner
from agent.session import SessionManager
from api.routes import router

app = FastAPI(title="CLAWD Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

session_manager = SessionManager()

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    session = session_manager.get_or_create(session_id)
    runner = AgentRunner(session, websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            
            if msg["type"] == "user_message":
                try:
                    await runner.run(msg["content"], msg.get("cwd", "."))
                except Exception as e:
                    await websocket.send_text(
                        json.dumps({"type": "error", "message": f"Agent error: {e}"})
                    )
            elif msg["type"] == "interrupt":
                runner.interrupt()
            elif msg["type"] == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
                
    except WebSocketDisconnect:
        session_manager.disconnect(session_id)

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
