# SkillSync - AI-Powered Resume Screening System

This repository contains the full source code for SkillSync, an AI-powered recruitment platform.

## System Architecture

The project is divided into three main components:

1.  **skillsyncFrontEnd**: React + Vite application for the user interface (Recruiters & Applicants).
2.  **skillsyncBackEnd**: Node.js + Express + Prisma (SQLite) API handling business logic and file uploads.
3.  **skillsyncAI**: Python + FastAPI service for Resume Parsing and Candidate Ranking.
4.  **skillsyncDB**: Database schema reference (SQL).

## Prerequisites

-   **Node.js** (v18+)
-   **Python** (v3.10+)
-   **npm**

## Setup & Installation

### 1. Backend Setup
```bash
cd skillsyncBackEnd
npm install
# Initialize Database
npx prisma generate
npx prisma db push
# Seed Database (Optional)
npm run seed
```
*Note: Ensure `.env` file exists with `DATABASE_URL="file:./dev.db"` and `JWT_SECRET`.*

### 2. Frontend Setup
```bash
cd skillsyncFrontEnd
npm install
```

### 3. AI Service Setup
```bash
cd skillsyncAI
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Windows (CMD):
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## How to Run

To run the full system, you need to start all three services in separate terminals.

### Terminal 1: AI Service (Port 8000)
```bash
cd skillsyncAI
.\run_server.bat
# Note: This runs the production logic directly from skillsync_ai_core.ipynb
```

### Terminal 2: Backend API (Port 4000)
```bash
cd skillsyncBackEnd
npm run dev
```

### Terminal 3: Frontend UI (Port 3000)
```bash
cd skillsyncFrontEnd
npm run dev
```

## Usage

1.  Open your browser and navigate to `http://localhost:3000`.
2.  **Role Enforcement**: Choose your role (Applicant/Recruiter) correctly during login. The system strictly verifies your registered role.
3.  **Recruiter Flow**:
    -   Register as a Recruiter.
    -   Post a new Job (use AI generation for description).
    -   Bulk upload CVs.
    -   Screen candidates to see AI scores and insights in the **Master AI Notebook** (`skillsync_ai_core.ipynb`).
4.  **Applicant Flow**:
    -   Register as an Applicant.
    -   Browse Jobs and Apply.
    -   **Withdrawal**: You can withdraw your application *only* before the AI screening has started. Once a score is assigned, withdrawal is restricted to maintain process integrity.
