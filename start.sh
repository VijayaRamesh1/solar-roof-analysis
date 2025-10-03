#!/bin/bash

# 🚀 Project SolisCAN - One-Command Startup Script
# This script starts both backend and frontend servers

echo "🌟 Starting Project SolisCAN..."
echo "=================================="
echo ""

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if backend directory exists
if [ ! -d "$SCRIPT_DIR/backend" ]; then
    echo -e "${RED}❌ Error: backend directory not found${NC}"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "$SCRIPT_DIR/frontend" ]; then
    echo -e "${RED}❌ Error: frontend directory not found${NC}"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Error: Python 3 is not installed${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js/npm is not installed${NC}"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✅ Cleanup complete${NC}"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Check if data files exist
echo -e "${BLUE}📊 Checking data files...${NC}"
if [ ! -f "$SCRIPT_DIR/data/buildings.geojson" ]; then
    echo -e "${YELLOW}⚠️  Warning: buildings.geojson not found${NC}"
    echo "   Run 'python backend/fetch_data_auto.py' to fetch data"
fi

# Start Backend Server
echo -e "${BLUE}🔧 Starting Backend Server...${NC}"
cd "$SCRIPT_DIR/backend"

# Check if Flask is installed
if ! python3 -c "import flask" 2>/dev/null; then
    echo -e "${YELLOW}📦 Installing Python dependencies...${NC}"
    pip3 install -r requirements.txt
fi

# Start backend in background
python3 serve_api.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started on http://localhost:5001 (PID: $BACKEND_PID)${NC}"

# Wait for backend to start
echo -e "${BLUE}⏳ Waiting for backend to be ready...${NC}"
sleep 3

# Check if backend is running
if ! curl -s http://localhost:5001/api/health > /dev/null; then
    echo -e "${RED}❌ Backend failed to start. Check logs/backend.log${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend is ready!${NC}"

# Start Frontend Server
echo ""
echo -e "${BLUE}🎨 Starting Frontend Development Server...${NC}"
cd "$SCRIPT_DIR/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
    npm install
fi

# Start frontend in background
BROWSER=none npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"

# Wait for frontend to start
echo -e "${BLUE}⏳ Waiting for frontend to be ready...${NC}"
sleep 8

# Check if frontend is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${YELLOW}⚠️  Frontend may still be starting...${NC}"
fi

echo ""
echo -e "${GREEN}=================================="
echo "🎉 Project SolisCAN is running!"
echo "==================================${NC}"
echo ""
echo -e "${BLUE}🌐 URLs:${NC}"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5001"
echo "   API Docs: http://localhost:5001/api/health"
echo ""
echo -e "${BLUE}📝 Logs:${NC}"
echo "   Backend:  logs/backend.log"
echo "   Frontend: logs/frontend.log"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "   - Press Ctrl+C to stop both servers"
echo "   - Refresh browser if app doesn't load immediately"
echo "   - Check logs if you encounter issues"
echo ""
echo -e "${GREEN}🚀 Opening browser...${NC}"
sleep 2

# Open browser based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open http://localhost:3000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open http://localhost:3000 2>/dev/null
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows
    start http://localhost:3000
fi

echo ""
echo -e "${GREEN}✨ Enjoy your solar visualization!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Keep script running and show status
while true; do
    # Check if processes are still running
    if ! ps -p $BACKEND_PID > /dev/null; then
        echo -e "${RED}❌ Backend stopped unexpectedly${NC}"
        break
    fi
    if ! ps -p $FRONTEND_PID > /dev/null; then
        echo -e "${RED}❌ Frontend stopped unexpectedly${NC}"
        break
    fi
    
    sleep 5
done

# Cleanup will be called automatically by trap
