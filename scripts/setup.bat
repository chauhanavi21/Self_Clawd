@echo off
setlocal EnableDelayedExpansion
title CLAWD Setup

echo.
echo  ██████╗██╗      █████╗ ██╗    ██╗██████╗
echo ██╔════╝██║     ██╔══██╗██║    ██║██╔══██╗
echo ██║     ██║     ███████║██║ █╗ ██║██║  ██║
echo ██║     ██║     ██╔══██║██║███╗██║██║  ██║
echo ╚██████╗███████╗██║  ██║╚███╔███╔╝██████╔╝
echo  ╚═════╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═════╝
echo.
echo  Local AI Coding Agent - Setup Script
echo  =====================================
echo.

:: Check Python
echo [1/5] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Python not found. Install from https://python.org
    pause
    exit /b 1
)
python --version
echo  OK

:: Check Node
echo.
echo [2/5] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)
node --version
echo  OK

:: Backend deps
echo.
echo [3/5] Installing Python dependencies...
cd backend
python -m pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo  ERROR: pip install failed
    pause
    exit /b 1
)
echo  OK
cd ..

:: Frontend deps
echo.
echo [4/5] Installing frontend dependencies...
cd frontend
call npm install --silent
if errorlevel 1 (
    echo  ERROR: npm install failed
    pause
    exit /b 1
)
echo  OK
cd ..

:: Ollama check
echo.
echo [5/5] Checking Ollama...
ollama --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo  Ollama not found. You need to:
    echo  1. Download Ollama from: https://ollama.com/download
    echo  2. Install and run it
    echo  3. Pull a model: ollama pull qwen2.5-coder:7b
    echo.
    echo  Recommended models for your hardware (16GB RAM, Intel Core 7):
    echo    ollama pull qwen2.5-coder:7b     ^(best for coding, ~4GB^)
    echo    ollama pull llama3.2:3b           ^(fastest, ~2GB^)
    echo    ollama pull codellama:13b         ^(powerful, ~8GB^)
    echo.
) else (
    ollama --version
    echo  OK - Ollama found!
    echo.
    echo  Make sure you have a model pulled:
    echo    ollama pull qwen2.5-coder:7b
)

echo.
echo ======================================
echo  Setup complete! To start CLAWD:
echo    Run: start.bat
echo ======================================
echo.
pause
