import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split

from ai_engine import (
    EmbeddingModel, 
    cosine_similarity, 
    calculate_skill_overlap, 
    calculate_experience_gap
)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
# MODEL_DIR is now DATA_DIR to simplify


def build_training_pairs():
    """Rebuild training_pairs.csv from MainDataset01 and MainDataset02."""
    print("Building training_pairs.csv ...")

    # MainDataset01
    main01_path = DATA_DIR / "MainDataset01.csv"
    df1 = pd.read_csv(main01_path)

    df1["cv_text"] = df1["Resume_Text"].fillna("") + " Skills: " + df1["Skills"].fillna("")
    df1["job_text"] = (
        df1["Job_Title"].fillna("") + " Skills: " + df1["Required_Skills_For_The_Job"].fillna("")
    )
    df1["label"] = df1["Outcome"].str.strip().str.lower().map(
        {"shortlisted": 1, "hired": 1, "rejected": 0}
    )
    df1 = df1.dropna(subset=["label"])
    df1_out = df1[["cv_text", "job_text", "label"]].copy()
    df1_out["source_dataset"] = "MainDataset01"

    # MainDataset02
    main02_path = DATA_DIR / "MainDataset02.csv"
    df2 = pd.read_csv(main02_path)

    df2["cv_text"] = df2["Resume"].fillna("")
    df2["job_text"] = df2["Job Roles"].fillna("") + ". " + df2["Job Description"].fillna("")
    df2["label"] = (df2["Best Match"] != 0).astype(int)
    df2_out = df2[["cv_text", "job_text", "label"]].copy()
    df2_out["source_dataset"] = "MainDataset02"

    combined = pd.concat([df1_out, df2_out], ignore_index=True)
    combined.insert(0, "pair_id", combined.index.astype(str).str.zfill(6))

    out_path = DATA_DIR / "training_pairs.csv"
    combined.to_csv(out_path, index=False)
    print(f"Saved {len(combined)} pairs to {out_path}")


def load_data(limit: int = None):
    path = DATA_DIR / "training_pairs.csv"
    df = pd.read_csv(path)
    if limit:
        print(f"Limiting dataset to {limit} rows for testing purposes.")
        df = df.head(limit)
    df["cv_text"] = df["cv_text"].fillna("").astype(str)
    df["job_text"] = df["job_text"].fillna("").astype(str)
    df["label"] = df["label"].astype(int)
    if "source_dataset" not in df.columns:
        df["source_dataset"] = "unknown"
    return df


def build_features(df: pd.DataFrame, emb_model: EmbeddingModel):
    cv_texts = df["cv_text"].tolist()
    job_texts = df["job_text"].tolist()

    print("Encoding CV texts...")
    cv_embs = emb_model.encode(cv_texts)
    print("Encoding Job texts...")
    job_embs = emb_model.encode(job_texts)

    # 1. Vectorized cosine similarity
    sims = np.sum(cv_embs * job_embs, axis=1)
    
    # 2. Skill Overlap
    print("Calculating skill overlaps...")
    skill_overlaps = [calculate_skill_overlap(c, j) for c, j in zip(cv_texts, job_texts)]
    
    # 3. Experience Gap
    print("Calculating experience gaps...")
    exp_gaps = [calculate_experience_gap(c, j) for c, j in zip(cv_texts, job_texts)]

    # Combine into (N, 3) matrix
    X = np.column_stack((sims, skill_overlaps, exp_gaps))
    y = df["label"].values
    return X, y


def train_model(limit: int = None):
    print("Loading training data...")
    df = load_data(limit)
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

    model_path = DATA_DIR / "trained_classifier.pkl"
    
    # Save a dictionary with metadata to ensure the app knows how to use this model
    model_data = {
        "classifier": clf,
        "model_name": "sentence-transformers/all-MiniLM-L6-v2",
        "feature_columns": ["cosine_similarity", "skill_overlap", "experience_gap"],
        "version": "2.0"
    }
    joblib.dump(model_data, model_path)
    print(f"Saved trained classifier and metadata to {model_path}")


def show_stats():
    """Print basic label and source stats from training_pairs.csv."""
    df = load_data()
    print(f"Total pairs: {len(df)}")
    print("\nLabel distribution (0 = not match, 1 = match):")
    print(df["label"].value_counts(normalize=False))
    print("\nLabel distribution (percent):")
    print(df["label"].value_counts(normalize=True) * 100)

    print("\nPairs per source_dataset:")
    print(df["source_dataset"].value_counts())


def preview_samples(n: int = 3):
    """Print a few example cv_text / job_text pairs."""
    df = load_data()
    print(f"Showing {n} sample pairs:\n")
    for _, row in df.sample(n).iterrows():
        print(f"pair_id: {row.get('pair_id', 'N/A')}")
        print(f"source_dataset: {row.get('source_dataset', 'N/A')}")
        print(f"label: {row['label']}")
        print("\nCV TEXT:")
        print(row["cv_text"][:400], "..." if len(row["cv_text"]) > 400 else "")
        print("\nJOB TEXT:")
        print(row["job_text"][:400], "..." if len(row["job_text"]) > 400 else "")
        print("-" * 80)


def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python manage_ai.py build      # build training_pairs.csv")
        print("  python manage_ai.py train      # train model using training_pairs.csv")
        print("  python manage_ai.py all        # build + train")
        print("  python manage_ai.py stats      # show basic dataset statistics")
        print("  python manage_ai.py preview    # show a few sample pairs")
        sys.exit(1)

    cmd = sys.argv[1].lower()

    args = sys.argv[2:]
    limit = None
    if "--limit" in args:
        idx = args.index("--limit")
        if idx + 1 < len(args):
            limit = int(args[idx + 1])
    
    if cmd == "build":
        build_training_pairs()
    elif cmd == "train":
        train_model(limit=limit)
    elif cmd == "all":
        build_training_pairs()
        train_model(limit=limit)
    elif cmd == "stats":
        show_stats()
    elif cmd == "preview":
        # optional second argument: how many samples
        n = 3
        if len(sys.argv) >= 3:
            try:
                n = int(sys.argv[2])
            except ValueError:
                pass
        preview_samples(n)
    else:
        print(f"Unknown command: {cmd}")
        sys.exit(1)


if __name__ == "__main__":
    main()
