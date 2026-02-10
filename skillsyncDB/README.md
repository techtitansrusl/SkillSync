# SkillSync Database Schema

This directory contains the SQL schema definition for the SkillSync application.

## Structure

The schema uses a relational model with the following tables:

-   `user`: Core user table storing authentication and common info.
-   `recruiter`: Extension of the user table for recruiter-specific data.
-   `applicant`: Extension of the user table for applicant-specific data.
-   `job_description`: Jobs posted by recruiters.
-   `job_qualification`: Multi-valued attribute for job qualifications.
-   `job_skill`: Multi-valued attribute for job skills.
-   `cv`: CVs submitted by applicants for specific jobs.
-   `result`: Analysis results for a submitted CV.

## Naming Conventions

-   Tables and columns use `snake_case`.
-   Primary keys are generally named `id` or `{table}_id`.
-   Foreign keys follow the `{related_table}_id` pattern.

## Usage

This SQL file serves as a reference for the database structure. The actual backend implementation uses Prisma ORM, which is synchronized to match this schema.
