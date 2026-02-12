@echo off
call "%~dp0.venv\Scripts\activate.bat"
uvicorn app:app --reload --host 0.0.0.0 --port 8000
