@echo off
echo ========================================
echo Gas Detection System - Quick Start
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [1/3] Installing dependencies...
    call npm install
    echo.
) else (
    echo [1/3] Dependencies already installed ✓
    echo.
)

REM Check if .env exists
if not exist ".env" (
    echo [2/3] Creating .env file from template...
    copy .env.example .env
    echo Please edit .env file with your MQTT configuration!
    echo.
) else (
    echo [2/3] Configuration file exists ✓
    echo.
)

echo [3/3] Starting server...
echo.
echo ========================================
echo Server will start at:
echo - HTTP: http://localhost:3000
echo - WebSocket: ws://localhost:8080
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.

npm start
