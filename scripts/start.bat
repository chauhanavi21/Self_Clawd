@echo off
title CLAWD - Local AI Coding Agent

echo.
echo  Starting CLAWD...
echo.

:: Check if ollama is running
curl -s http://localhost:11434/api/tags >nul 2>&1
if errorlevel 1 (
    echo  Starting Ollama in background...
    start /B ollama serve
    timeout /t 3 /nobreak >nul
)

:: Start backend in a new window
echo  [1/2] Starting backend (FastAPI on port 8000)...
:: Use py launcher when python.exe is not on PATH (common on Windows)
start "CLAWD Backend" cmd /k "cd /d %~dp0..\backend && (where python >nul 2>&1 && python main.py || py main.py)"

:: Wait for backend to be ready
echo  Waiting for backend...
timeout /t 3 /nobreak >nul

:: Start frontend in a new window
echo  [2/2] Starting frontend (React on port 5173)...
start "CLAWD Frontend" cmd /k "cd /d %~dp0..\frontend && npm run dev"

:: Wait then open browser
timeout /t 4 /nobreak >nul
echo.
echo  Opening CLAWD in browser...
start http://localhost:5173

echo.
echo  ====================================
echo   CLAWD is running!
echo   Open: http://localhost:5173
echo  ====================================
echo.
echo  Press any key to stop all services...
pause >nul

:: Kill processes on exit
taskkill /FI "WindowTitle eq CLAWD Backend*" /F >nul 2>&1
taskkill /FI "WindowTitle eq CLAWD Frontend*" /F >nul 2>&1
echo  Stopped.
