import { Request, Response } from 'express';
import { GoogleGenAI } from "@google/genai";
import axios from 'axios';
import { prisma } from '../index';
import path from 'path';

const apiKey = process.env.API_KEY;
const AI_SERVICE_URL = 'http://localhost:8000';

export const generateJobDescription = async (req: Request, res: Response) => {
    const { title } = req.body;
    // ... (Keep existing Gemini logic if desired, or simpler fallback)
    if (!apiKey) {
        return res.json({
            description: `Responsibilites for ${title}:\n- Lead the development team.\n- Coordinate with stakeholders.\n- Ensure code quality.\n\nRequirements:\n- 5+ years experience.\n- Strong communication skills.`
        });
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: `Write a professional job description for a "${title}". 
            Include a brief summary, key responsibilities, and required qualifications. 
            Format it clearly with bullet points. Keep it under 200 words.`,
        });
        res.json({ description: response.text || "No description generated." });
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: "Error generating description." });
    }
};

export const analyzeResume = async (req: Request, res: Response) => {
    // Legacy endpoint, keeping for backward compatibility if needed, 
    // but the main logic is now in processJobCandidates
    return res.status(501).json({ error: "Use processJobCandidates for full analysis" });
};

export const processJobCandidates = async (req: Request, res: Response) => {
    const { jobId } = req.body;

    try {
        // 1. Fetch Job Description
        const job = await prisma.job.findUnique({
            where: { id: jobId },
            include: { cvs: true } // format, fileName, fileUrl are in CV model
        });

        if (!job) {
            return res.status(404).json({ error: "Job not found" });
        }

        if (!job.description) {
            return res.status(400).json({ error: "Job has no description to match against." });
        }

        // 2. Prepare Payload for Python AI Service
        // Python service expects: { job_id, job_description_text, cvs: [{ cv_id, file_path }] }

        // We need the absolute path for the Python service to read the file
        // The UploadController saves files to d:\SkillSync\skillsyncBackEnd\uploads\cvs\filename
        // We stored relative path in DB (or we should have). 
        // Let's assume fileUrl in CV table is relative like '/uploads/cvs/filename.pdf'

        const uploadsDir = path.join(__dirname, '../../'); // Root of Backend

        const cvsPayload = job.cvs.map(cv => {
            // Construct absolute path. 
            // If fileUrl is "/uploads/cvs/..." remove leading slash
            const relativePath = cv.fileUrl ? cv.fileUrl.substring(1) : '';
            const absolutePath = path.join(uploadsDir, relativePath);

            return {
                cv_id: cv.id,
                file_path: absolutePath
            };
        });

        if (cvsPayload.length === 0) {
            return res.json({ message: "No CVs to process", results: [] });
        }

        // 3. Call Python Service
        const pythonResponse = await axios.post(`${AI_SERVICE_URL}/process_job`, {
            job_id: job.id,
            job_description_text: job.description,
            cvs: cvsPayload
        });

        const results = pythonResponse.data.results; // List of { cv_id, score, status, explanation }

        // 4. Save Results to DB
        // Using Prisma transaction for atomic updates
        const updatePromises = results.map((r: any) => {
            return prisma.result.upsert({
                where: { cvId: r.cv_id },
                update: {
                    score: Math.round(r.score),
                    status: r.status,
                    comment: r.explanation,
                    processedDate: new Date()
                },
                create: {
                    cvId: r.cv_id,
                    score: Math.round(r.score),
                    status: r.status,
                    comment: r.explanation
                }
            });
        });

        await prisma.$transaction(updatePromises);

        res.json({ message: "Processing complete", results });

    } catch (error) {
        console.error("AI Processing Error:", error);
        res.status(500).json({ error: "Failed to process candidates." });
    }
};
