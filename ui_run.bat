@echo off
REM 1. Set up virtual environment if not present
if not exist venv (
  python -m venv venv
)

REM 2. Activate virtual environment
call venv\Scripts\activate

REM 3. Install requirements
pip install -r requirements.txt

REM 4. Start FastAPI server (with reload for dev) in background
start "FastAPI Server" cmd /k uvicorn api_server:app --reload

REM 5. Wait a moment for server to start, then open UI in browser
ping 127.0.0.1 -n 3 > nul
start http://127.0.0.1:8000/ui/index.html 
