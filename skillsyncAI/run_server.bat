@echo off
call "%~dp0.venv\Scripts\activate.bat"
python -c "import json; nb=json.load(open('skillsync_ai_core.ipynb', encoding='utf-8')); exec('\n'.join([''.join(c['source']) for c in nb['cells'] if c['cell_type']=='code' and 'export_to_script' not in ''.join(c['source'])]))"
