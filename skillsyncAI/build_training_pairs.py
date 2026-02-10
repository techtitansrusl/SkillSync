import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

def build_from_main01():
    path = DATA_DIR / "MainDataset01.csv"
    df = pd.read_csv(path)

    # Expected columns: Candidate_ID, Resume_Text, Skills, Education,
    # Experience_Years, Job_ID, Job_Title, Required_Skills, Job_Fit_Score, Outcome
    df["cv_text"] = df["Resume_Text"].fillna("") + " Skills: " + df["Skills"].fillna("")
    df["job_text"] = df["Job_Title"].fillna("") + " Skills: " + df["Required_Skills_For_The_Job"].fillna("")

    df["label"] = df["Outcome"].str.strip().str.lower().map(
        {"shortlisted": 1, "hired": 1, "rejected": 0}
    )
    df = df.dropna(subset=["label"])

    df_out = df[["cv_text", "job_text", "label"]].copy()
    df_out["source_dataset"] = "MainDataset01"

    return df_out

def build_from_main02():
    path = DATA_DIR / "MainDataset02.csv"
    df = pd.read_csv(path)

    # Expected columns: Resume, Job Roles, Job Description, Best Match
    df["cv_text"] = df["Resume"].fillna("")
    df["job_text"] = (
        df["Job Roles"].fillna("") + ". " + df["Job Description"].fillna("")
    )

    df["label"] = (df["Best Match"] != 0).astype(int)

    df_out = df[["cv_text", "job_text", "label"]].copy()
    df_out["source_dataset"] = "MainDataset02"

    return df_out

def main():
    main01_pairs = build_from_main01()
    main02_pairs = build_from_main02()

    combined = pd.concat([main01_pairs, main02_pairs], ignore_index=True)
    combined.insert(0, "pair_id", combined.index.astype(str).str.zfill(6))

    out_path = DATA_DIR / "training_pairs.csv"
    combined.to_csv(out_path, index=False)

    print(f"Saved {len(combined)} pairs to {out_path}")

if __name__ == "__main__":
    main()
