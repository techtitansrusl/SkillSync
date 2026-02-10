from pathlib import Path
import joblib
import numpy as np

from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

from models.embeddings import EmbeddingModel
from models.scoring import cosine_similarity
from nlp.text_extraction import extract_text_from_pdf
from nlp.feature_extraction import calculate_skill_overlap, calculate_experience_gap

app = FastAPI(title="SkillSync AI Service")

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "trained_classifier.pkl"

# Load Sentence-BERT once at service startup
embedding_model = EmbeddingModel()

# Load trained classifier (logistic regression) if available
classifier = None
if MODEL_PATH.exists():
    saved = joblib.load(MODEL_PATH)
    saved = joblib.load(MODEL_PATH)
    # Handle both old (dict with 'classifier' key only) and new (metadata rich) formats
    if isinstance(saved, dict):
        classifier = saved.get("classifier")
    else:
        # Fallback if it was saved directly as the object (unlikely based on previous code but safe)
        classifier = saved
    print("Loaded trained classifier from", MODEL_PATH)
else:
    print("WARNING: trained classifier not found, falling back to similarity threshold only.")


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

            # base score from cosine similarity, mapped to [0, 100]
            base_score = (sim + 1.0) * 50.0

            if classifier is not None:
                # classifier was trained on [sim, skill_overlap, exp_gap]
                X = np.array([[sim, skill_overlap, exp_gap]])
                prob_shortlist = float(classifier.predict_proba(X)[0, 1])
                model_score = (base_score + prob_shortlist * 100.0) / 2.0
                explanation = (
                    f"Sim: {sim:.2f}, Skills: {skill_overlap:.2f}, Gap: {exp_gap} yrs -> Shortlist Prob: {prob_shortlist:.2f}"
                )
            else:
                model_score = base_score
                explanation = (
                    f"Similarity score {model_score:.2f} computed using Sentence-BERT "
                    f"between the CV content and the job description."
                )

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
