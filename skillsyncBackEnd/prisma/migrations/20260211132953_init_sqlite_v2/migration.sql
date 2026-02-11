-- CreateTable
CREATE TABLE "user" (
    "user_id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'APPLICANT',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "recruiter" (
    "user_id" TEXT NOT NULL PRIMARY KEY,
    "company_name" TEXT NOT NULL,
    CONSTRAINT "recruiter_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "applicant" (
    "user_id" TEXT NOT NULL PRIMARY KEY,
    "resume_url" TEXT,
    CONSTRAINT "applicant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "job_description" (
    "job_id" TEXT NOT NULL PRIMARY KEY,
    "recruiter_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "salary" REAL,
    "description" TEXT,
    "location" TEXT,
    "posted_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT "job_description_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "recruiter" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "job_qualification" (
    "job_id" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,

    PRIMARY KEY ("job_id", "qualification"),
    CONSTRAINT "job_qualification_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_description" ("job_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "job_skill" (
    "job_id" TEXT NOT NULL,
    "skill" TEXT NOT NULL,

    PRIMARY KEY ("job_id", "skill"),
    CONSTRAINT "job_skill_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_description" ("job_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cv" (
    "cv_id" TEXT NOT NULL PRIMARY KEY,
    "applicant_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "format" TEXT,
    "file_name" TEXT,
    "file_url" TEXT,
    "submitted_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cv_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicant" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cv_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_description" ("job_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "result" (
    "result_id" TEXT NOT NULL PRIMARY KEY,
    "cv_id" TEXT NOT NULL,
    "processed_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,
    "status" TEXT,
    "score" INTEGER,
    CONSTRAINT "result_cv_id_fkey" FOREIGN KEY ("cv_id") REFERENCES "cv" ("cv_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "result_cv_id_key" ON "result"("cv_id");
