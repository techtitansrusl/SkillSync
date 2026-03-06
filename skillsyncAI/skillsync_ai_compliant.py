import os, re, json, nltk, pytesseract, pdfplumber, pandas as pd, numpy as np
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import joblib, warnings, shutil, tempfile
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import List
import uvicorn

warnings.filterwarnings('ignore')
nltk.download('stopwords', quiet=True); nltk.download('wordnet', quiet=True); nltk.download('punkt', quiet=True)

lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))

COMMON_SKILLS = {
    "python", "java", "c++", "c#", "javascript", "typescript", "react", "angular", "vue",
    "node.js", "django", "flask", "spring", "sql", "mysql", "postgresql", "mongodb",
    "aws", "azure", "gcp", "docker", "kubernetes", "git", "linux", "html", "css",
    "machine learning", "deep learning", "nlp", "tensorflow", "pytorch", "pandas", "numpy",
    "scikit-learn", "data analysis", "project management", "agile", "scrum", "leadership",
    "communication", "problem solving"
}

def preprocess_text(text):
    if not isinstance(text, str): return ""
    text = re.sub(r'[^a-zA-Z\s]', ' ', text.lower())
    tokens = nltk.word_tokenize(text)
    return ' '.join([lemmatizer.lemmatize(w) for w in tokens if w not in stop_words])

def extract_skills(text):
    if not text: return set()
    text_lower = text.lower()
    return {skill for skill in COMMON_SKILLS if re.search(r"\b" + re.escape(skill) + r"\b", text_lower)}

def extract_experience_years(text):
    matches = re.findall(r"(\d+)(?:\+)?\s*-?\s*(?:\d+)?\s*years?", text.lower() or "")
    return float(max([int(m) for m in matches])) if matches else 0.0

class EmbeddingModel:
    def __init__(self):
        self.sbert = SentenceTransformer('all-MiniLM-L6-v2')
    def get_similarity(self, text1, text2):
        emb = self.sbert.encode([text1, text2])
        return float(cosine_similarity([emb[0]], [emb[1]])[0][0])

def generate_explanation(cv_text, jd_text, final_score_value):
    cv_sk, jd_sk = extract_skills(cv_text), extract_skills(jd_text)
    matched, missing = cv_sk.intersection(jd_sk), jd_sk.difference(cv_sk)
    cv_exp, req_exp = extract_experience_years(cv_text), extract_experience_years(jd_text)

    msg = f"Overall Match Score: {final_score_value:.2f}/100\n"
    if matched: msg += f"Matched Skills: {', '.join(sorted(matched))}\n"
    if missing: msg += f"Missing Skills: {', '.join(sorted(missing))}\n"
    msg += f"Experience: {cv_exp} years (Required: {req_exp} years)\n"

    if final_score_value >= 80: qual = "Shortlisted"
    elif final_score_value >= 50: qual = "Low match but Review"
    else: qual = "Rejected"

    return {"insight": f"{msg}\nRecommendation: {qual}", "matched": list(matched), "missing": list(missing), "cv_exp": cv_exp, "req_exp": req_exp}

# API Config
MODEL_PATH = "data/trained_classifier.pkl"
app = FastAPI(title="SkillSync AI Engine")
embedder = None; classifier = None

@app.on_event("startup")
async def startup_event():
    global embedder, classifier
    embedder = EmbeddingModel()
    if os.path.exists(MODEL_PATH): classifier = joblib.load(MODEL_PATH)

@app.post("/process_job")
async def process_job(payload: dict):
    jd_text = payload.get('job_description_text', '')
    results = []
    for cv in payload.get('cvs', []):
        try:
            with pdfplumber.open(cv['file_path']) as pdf:
                cv_text = "\n".join([p.extract_text() for p in pdf.pages if p.extract_text()])

            sim = embedder.get_similarity(cv_text, jd_text)
            cv_sk, jd_sk = extract_skills(cv_text), extract_skills(jd_text)
            overlap = len(cv_sk.intersection(jd_sk)) / max(len(jd_sk), 1)
            cv_exp, jd_exp = extract_experience_years(cv_text), extract_experience_years(jd_text)
            exp_gap = abs(cv_exp - jd_exp)

            final_score = sim * 100
            if classifier:
                features = np.array([[sim, overlap, exp_gap]])
                final_score = classifier.predict_proba(features)[0][1] * 100 if hasattr(classifier, 'predict_proba') else float(classifier.predict(features)[0]) * 100

            results.append({
                "cv_id": cv['cv_id'], 
                "score": final_score, 
                "status": "shortlisted" if final_score >= 70 else "review", 
                "explanation": generate_explanation(cv_text, jd_text, final_score)["insight"]
            })
        except Exception as e:
            results.append({"cv_id": cv['cv_id'], "score": 0, "status": "failed", "explanation": str(e)})
    return {"results": results}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
