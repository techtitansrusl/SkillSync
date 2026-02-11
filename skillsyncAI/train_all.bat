@echo off
REM Activate venv
call .venv\Scripts\activate.bat

REM Build and Train using manage_ai.py CLI
python manage_ai.py all

echo Done. Press any key to exit.
pause
