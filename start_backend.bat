@echo off
echo ============================================================
echo  FreightAI Backend — FastAPI + ML Engine
echo  Running on http://127.0.0.1:8000
echo ============================================================
echo.
echo TIP: Run this from the project ROOT directory (AI-Project\)
echo Command: python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
echo.
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
pause
