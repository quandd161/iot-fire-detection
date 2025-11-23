#!/bin/bash

echo "========================================"
echo "Gas Detection System - Quick Start"
echo "========================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[1/3] Installing dependencies..."
    npm install
    echo ""
else
    echo "[1/3] Dependencies already installed ✓"
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "[2/3] Creating .env file from template..."
    cp .env.example .env
    echo "Please edit .env file with your MQTT configuration!"
    echo ""
else
    echo "[2/3] Configuration file exists ✓"
    echo ""
fi

echo "[3/3] Starting server..."
echo ""
echo "========================================"
echo "Server will start at:"
echo "- HTTP: http://localhost:3000"
echo "- WebSocket: ws://localhost:8080"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start
