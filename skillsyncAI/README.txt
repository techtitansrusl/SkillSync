For windows explorer:
1) Train/update model:
   - Double-click train_all.bat

2) Run AI service:
   - Double-click run_server.bat
   - Open http://127.0.0.1:8001/docs

3) Test:
   - Use POST /process_job with cv1.pdf



For manage_ai.py (Recommended):

python manage_ai.py build   # build training_pairs.csv
python manage_ai.py train   # train model using training_pairs.csv (When only model code is tweaked)
python manage_ai.py all     # build + train (When Datasets change)
python manage_ai.py stats   # show basic dataset statistics
python manage_ai.py preview # show few sample pairs
python manage_ai.py preview 3 # show 3 sample pairs
python manage_ai.py preview 5 # show 5 sample pairs
.\run_server.bat # Run server

JSON Code:
{
  "job_id": "J001",
  "job_description_text": "We are looking for a Python backend developer with experience in Django, REST APIs, and SQL.",
  "cvs": [
    {
      "cv_id": "CV001",
      "file_path": "D:\\SkillSync\\skillsyncAI\\data\\cv1.pdf"
    }
  ]
}
