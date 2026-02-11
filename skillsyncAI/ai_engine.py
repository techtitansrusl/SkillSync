import re
import pdfplumber
import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List, Set, Dict

# --- Configuration & Constants ---

COMMON_SKILLS = {
    "python", "java", "c++", "c#", "javascript", "typescript", "react", "angular", "vue",
    "node.js", "django", "flask", "spring", "sql", "mysql", "postgresql", "mongodb",
    "aws", "azure", "gcp", "docker", "kubernetes", "git", "linux", "html", "css",
    "machine learning", "deep learning", "nlp", "tensorflow", "pytorch", "pandas", "numpy",
    "scikit-learn", "data analysis", "project management", "agile", "scrum", "leadership",
    "communication", "problem solving"
}

# --- Core AI Engine ---

class EmbeddingModel:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        print(f"Loading {model_name}... this may take a bit the first time.")
        self.model = SentenceTransformer(model_name)
        print("Model loaded.")

    def encode(self, texts: List[str]) -> np.ndarray:
        return self.model.encode(
            texts,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b))

def normalize_score(sim: float) -> float:
    return (sim + 1.0) * 50.0

# --- NLP & Feature Extraction ---

def extract_text_from_pdf(path: str) -> str:
    text_parts = []
    try:
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                txt = page.extract_text() or ""
                text_parts.append(txt)
    except Exception as e:
        print(f"Error extracting PDF text: {e}")
    return "\n".join(text_parts)

def extract_skills(text: str) -> Set[str]:
    if not text:
        return set()
    text_lower = text.lower()
    found_skills = set()
    for skill in COMMON_SKILLS:
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, text_lower):
            found_skills.add(skill)
    return found_skills

def calculate_skill_overlap(cv_text: str, jd_text: str) -> float:
    skills1 = extract_skills(cv_text)
    skills2 = extract_skills(jd_text)
    if not skills1 and not skills2:
        return 0.0
    intersection = skills1.intersection(skills2)
    union = skills1.union(skills2)
    return len(intersection) / len(union) if union else 0.0

def extract_experience_years(text: str) -> float:
    if not text:
        return 0.0
    pattern = r"(\d+)(?:\+)?\s*-?\s*(?:\d+)?\s*years?"
    matches = re.findall(pattern, text.lower())
    if not matches:
        return 0.0
    years = [int(m) for m in matches]
    return float(max(years))

def calculate_experience_gap(cv_text: str, job_text: str) -> float:
    cv_exp = extract_experience_years(cv_text)
    job_exp = extract_experience_years(job_text)
    return cv_exp - job_exp

# --- Alignment Features: Explainability & Fairness ---

class ExplainabilityEngine:
    @staticmethod
    def generate_explanation(cv_text: str, jd_text: str, score: float) -> str:
        cv_skills = extract_skills(cv_text)
        jd_skills = extract_skills(jd_text)
        
        matched = cv_skills.intersection(jd_skills)
        missing = jd_skills.difference(cv_skills)
        
        explanation = f"Overall Match Score: {score:.2f}/100\n\n"
        
        if matched:
            explanation += f"✅ Key Skills Matched: {', '.join(sorted(matched))}\n"
        
        if missing:
            explanation += f"⚠️ Areas for Improvement (Missing): {', '.join(sorted(missing))}\n"
        
        cv_exp = extract_experience_years(cv_text)
        jd_exp = extract_experience_years(jd_text)
        if cv_exp >= jd_exp:
            explanation += f"⭐ Strength: Your {cv_exp} years of experience meets or exceeds the requirement ({jd_exp} years).\n"
        else:
            explanation += f"📉 Gap: Experience level ({cv_exp} years) is slightly below the target ({jd_exp} years).\n"
            
        return explanation

class BiasMitigator:
    @staticmethod
    def anonymize_text(text: str) -> str:
        # Simple placeholder for bias mitigation
        # Future: Use NER to mask names, locations, etc.
        return text

    @staticmethod
    def check_fairness(score: float, cv_text: str) -> float:
        # SRS Requirement: Fairness-aware scoring
        # Placeholder for AIF360/Fairlearn logic
        # For now, ensure the score is strictly in [0, 100]
        return max(0, min(100, score))
