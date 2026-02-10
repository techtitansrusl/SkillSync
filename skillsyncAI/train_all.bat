@echo off
REM Activate venv
call .venv\Scripts\activate.bat

REM Build training pairs
python build_training_pairs.py

REM Train model
python train_model.py

echo Done. Press any key to exit.
pause
