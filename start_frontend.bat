@echo off
echo ============================================================
echo  FreightAI Frontend — React + Vite Dev Server
echo  Running on http://localhost:5173
echo  API proxy: /api → http://127.0.0.1:8000
echo ============================================================
echo.
echo NOTE: Start the backend first (start_backend.bat) in another terminal.
echo.
cd frontend
npm run dev
pause
