from pathlib import Path
import joblib
import numpy as np
import logging
from logging.handlers import RotatingFileHandler
import os

from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

from ai_engine import (
    EmbeddingModel, 
    cosine_similarity, 
    extract_text_from_pdf,
    calculate_skill_overlap, 
    calculate_experience_gap,
    ExplainabilityEngine,
    BiasMitigator
)

app = FastAPI(title="SkillSync AI Service")

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "data" / "trained_classifier.pkl"

# Load S-BERT once at service startup (Context-aware matching requirement)
embedding_model = EmbeddingModel()

# Centralized Logging Setup
LOG_DIR = Path("d:/SkillSync/logs")
if not LOG_DIR.exists():
    LOG_DIR.mkdir(parents=True, exist_ok=True)

log_path = LOG_DIR / 'ai_service.log'
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler(log_path, maxBytes=10*1024*1024, backupCount=5),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("skillsync-ai")

logger.info("AI Service starting up...")

# Load trained classifier (Logistic Regression) - SDS requirement
classifier = None
if MODEL_PATH.exists():
    saved = joblib.load(MODEL_PATH)
    if isinstance(saved, dict):
        classifier = saved.get("classifier")
    else:
        classifier = saved
    logger.info(f"Loaded trained classifier from {MODEL_PATH}")
else:
    logger.warning("trained classifier not found, falling back to similarity threshold only.")


class CVInput(BaseModel):
    cv_id: str
    file_path: str  # Path on the AI server where the PDF is stored


class ProcessJobRequest(BaseModel):
    job_id: str
    job_description_text: str
    cvs: List[CVInput]


class CVResult(BaseModel):
    cv_id: str
    score: float
    rank: int
    status: str
    explanation: str


class ProcessJobResponse(BaseModel):
    job_id: str
    results: List[CVResult]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/process_job", response_model=ProcessJobResponse)
def process_job(req: ProcessJobRequest):
    """
    Main endpoint: given one job description and a list of CV PDFs,
    return a ranked shortlist with scores and explanations.
    """
    logger.info(f"Processing job {req.job_id} with {len(req.cvs)} CVs")
    jd_emb = embedding_model.encode([req.job_description_text])[0]

    results_raw = []

    for cv in req.cvs:
        cv_text = extract_text_from_pdf(cv.file_path)

        if not cv_text.strip():
            sim = -1.0
            model_score = 0.0
            explanation = "No readable text could be extracted from the CV PDF."
        else:
            cv_emb = embedding_model.encode([cv_text])[0]
            # 1. Similarity
            sim = cosine_similarity(cv_emb, jd_emb)
            
            # 2. Skill Overlap
            skill_overlap = calculate_skill_overlap(cv_text, req.job_description_text)
            
            # 3. Experience Gap
            exp_gap = calculate_experience_gap(cv_text, req.job_description_text)

            # base score from cosine similarity [0, 100]
            base_score = (sim + 1.0) * 50.0

            if classifier is not None:
                X = np.array([[sim, skill_overlap, exp_gap]])
                prob_shortlist = float(classifier.predict_proba(X)[0, 1])
                model_score = (base_score + prob_shortlist * 100.0) / 2.0
            else:
                model_score = base_score

            # Alignment: Fairness & Explainability requirements
            model_score = BiasMitigator.check_fairness(model_score, cv_text)
            explanation = ExplainabilityEngine.generate_explanation(cv_text, req.job_description_text, model_score)

        results_raw.append(
            {
                "cv_id": cv.cv_id,
                "score": model_score,
                "explanation": explanation,
            }
        )

    # rank by score (descending)
    results_raw.sort(key=lambda x: x["score"], reverse=True)

    cv_results: list[CVResult] = []
    for rank_idx, r in enumerate(results_raw, start=1):
        status = "Shortlisted" if r["score"] >= 60 else "Not Shortlisted"
        cv_results.append(
            CVResult(
                cv_id=r["cv_id"],
                score=round(r["score"], 2),
                rank=rank_idx,
                status=status,
                explanation=r["explanation"],
            )
        )

    return ProcessJobResponse(job_id=req.job_id, results=cv_results)
