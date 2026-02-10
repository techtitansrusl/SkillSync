CREATE DATABASE IF NOT EXISTS skillsync_db;

USE skillsync_db;

-- Users table to store authentication details and common attributes
CREATE TABLE user (
    user_id VARCHAR(36) NOT NULL, -- UUID
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    role ENUM('RECRUITER', 'APPLICANT') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id)
);

-- Recruiter details, linked to user
CREATE TABLE recruiter (
    user_id VARCHAR(36) NOT NULL,
    company_name VARCHAR(100),
    PRIMARY KEY (user_id),
    CONSTRAINT fk_recruiter_user FOREIGN KEY (user_id) REFERENCES user (user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Applicant details, linked to user
CREATE TABLE applicant (
    user_id VARCHAR(36) NOT NULL,
    resume_url VARCHAR(255),
    PRIMARY KEY (user_id),
    CONSTRAINT fk_applicant_user FOREIGN KEY (user_id) REFERENCES user (user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Job descriptions posted by recruiters
CREATE TABLE job_description (
    job_id VARCHAR(36) NOT NULL,
    recruiter_id VARCHAR(36) NOT NULL,
    title VARCHAR(100) NOT NULL,
    salary DECIMAL(10, 2),
    description TEXT,
    location VARCHAR(100),
    posted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('ACTIVE', 'CLOSED', 'DRAFT') DEFAULT 'ACTIVE',
    PRIMARY KEY (job_id),
    CONSTRAINT fk_job_recruiter FOREIGN KEY (recruiter_id) REFERENCES recruiter (user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Qualifications required for a job
CREATE TABLE job_qualification (
    job_id VARCHAR(36) NOT NULL,
    qualification VARCHAR(200) NOT NULL,
    PRIMARY KEY (job_id, qualification),
    CONSTRAINT fk_qualification_job FOREIGN KEY (job_id) REFERENCES job_description (job_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Skills required for a job
CREATE TABLE job_skill (
    job_id VARCHAR(36) NOT NULL,
    skill VARCHAR(100) NOT NULL,
    PRIMARY KEY (job_id, skill),
    CONSTRAINT fk_skill_job FOREIGN KEY (job_id) REFERENCES job_description (job_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- CV submissions by applicants
CREATE TABLE cv (
    cv_id VARCHAR(36) NOT NULL,
    applicant_id VARCHAR(36) NOT NULL,
    job_id VARCHAR(36) NOT NULL,
    format VARCHAR(20),
    file_name VARCHAR(100),
    file_url VARCHAR(255),
    submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (cv_id),
    CONSTRAINT fk_cv_applicant FOREIGN KEY (applicant_id) REFERENCES applicant (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_cv_job FOREIGN KEY (job_id) REFERENCES job_description (job_id) ON DELETE CASCADE
);

-- Results of CV processing/analysis
CREATE TABLE result (
    result_id VARCHAR(36) NOT NULL,
    cv_id VARCHAR(36) NOT NULL UNIQUE,
    processed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comment TEXT,
    status VARCHAR(20),
    score INT,
    PRIMARY KEY (result_id),
    CONSTRAINT fk_result_cv FOREIGN KEY (cv_id) REFERENCES cv (cv_id) ON DELETE CASCADE
);