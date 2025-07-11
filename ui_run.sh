#!/bin/bash
set -e

# 1. Set up virtual environment if not present
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi

# 2. Activate virtual environment
source venv/bin/activate

# 3. Install requirements
pip install -r requirements.txt

# 4. Start FastAPI server (with reload for dev) in background
uvicorn api_server:app --reload &
SERVER_PID=$!

# 5. Wait a moment for server to start, then open UI in browser
sleep 2
xdg-open http://127.0.0.1:8000/ui/index.html &

# 6. Wait for server process to finish
wait $SERVER_PID 
