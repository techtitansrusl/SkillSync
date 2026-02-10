import joblib
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split

from models.embeddings import EmbeddingModel
from models.scoring import cosine_similarity

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"
MODEL_DIR.mkdir(exist_ok=True)

def load_data():
    path = DATA_DIR / "training_pairs.csv"
    df = pd.read_csv(path)

    df["cv_text"] = df["cv_text"].fillna("").astype(str)
    df["job_text"] = df["job_text"].fillna("").astype(str)
    df["label"] = df["label"].astype(int)

    # mark which source each row came from (MainDataset01 or MainDataset02)
    if "source_dataset" in df.columns:
        pass
    else:
        # if column is missing for some reason, default
        df["source_dataset"] = "unknown"

    return df

def parse_skill_list(text: str) -> set[str]:
    # Skills are stored as comma-separated; normalize to lowercase, strip
    parts = [s.strip().lower() for s in str(text).split(",") if s.strip()]
    return set(parts)

def build_handcrafted_features(df: pd.DataFrame) -> np.ndarray:
    """
    Build additional features for rows from MainDataset01:
      - skill_overlap: fraction of job skills present in resume skills
      - exp_gap: candidate_exp - required_exp (rough)
    For other sources, these features are set to 0.
    """
    skill_overlap = []
    exp_gap = []

    for _, row in df.iterrows():
        if row.get("source_dataset", "") == "MainDataset01":
            # resume and job skills as comma-separated strings
            # These columns exist only in MainDataset01 CSV
            # (we will fillna to avoid KeyErrors)
            resume_skills = parse_skill_list(row.get("resume_skills", row.get("Skills", "")))
            job_skills = parse_skill_list(row.get("job_skills", row.get("Required_Skills", "")))

            if job_skills:
                overlap = len(resume_skills & job_skills) / len(job_skills)
            else:
                overlap = 0.0

            # experience gap: candidate - required (if required_exp column exists)
            try:
                cand_exp = float(row.get("Experience_Years", 0))
            except (TypeError, ValueError):
                cand_exp = 0.0
            try:
                req_exp = float(row.get("Required_Experience_Years", 0))
            except (TypeError, ValueError):
                req_exp = 0.0

            gap = cand_exp - req_exp
        else:
            overlap = 0.0
            gap = 0.0

        skill_overlap.append(overlap)
        exp_gap.append(gap)

    return np.column_stack([skill_overlap, exp_gap])

def build_features(df: pd.DataFrame, embedding_model: EmbeddingModel):
    cv_texts = df["cv_text"].tolist()
    job_texts = df["job_text"].tolist()

    print("Encoding CV texts...")
    cv_embs = embedding_model.encode(cv_texts)
    print("Encoding Job texts...")
    job_embs = embedding_model.encode(job_texts)

    sims = []
    for cv_vec, job_vec in zip(cv_embs, job_embs):
        sims.append(cosine_similarity(cv_vec, job_vec))
    sims = np.array(sims).reshape(-1, 1)

    print("Building handcrafted features...")
    extra_feats = build_handcrafted_features(df)

    # Final feature matrix: [similarity, skill_overlap, exp_gap]
    X = np.hstack([sims, extra_feats])
    y = df["label"].values

    return X, y

def main():
    print("Loading training data...")
    df = load_data()
    print(f"Total pairs: {len(df)}")

    print("Initializing embedding model...")
    emb_model = EmbeddingModel()

    print("Building features (this may take a while)...")
    X, y = build_features(df, emb_model)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("Training Logistic Regression classifier...")
    clf = LogisticRegression(max_iter=1000)
    clf.fit(X_train, y_train)

    print("Evaluating on test set...")
    y_pred = clf.predict(X_test)
    print("Confusion matrix:")
    print(confusion_matrix(y_test, y_pred))
    print("\nClassification report:")
    print(classification_report(y_test, y_pred))

    model_path = MODEL_DIR / "trained_classifier.pkl"
    joblib.dump({"classifier": clf}, model_path)
    print(f"Saved trained classifier to {model_path}")

if __name__ == "__main__":
    main()
