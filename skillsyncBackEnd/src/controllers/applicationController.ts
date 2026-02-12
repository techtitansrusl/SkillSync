import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/authMiddleware';

export const submitCv = async (req: AuthRequest, res: Response) => {
    // The file is uploaded by multer middleware before this controller
    // req.file contains the file info
    const { jobId } = req.body;
    const applicantId = req.user?.id;

    if (!applicantId) return res.status(401).json({ error: 'Unauthorized' });
    if (!req.file) return res.status(400).json({ error: 'No CV file uploaded' });

    try {
        // Check for existing application
        const existingCv = await prisma.cv.findFirst({
            where: {
                applicantId,
                jobId
            }
        });

        if (existingCv) {
            return res.status(400).json({ error: 'You have already applied for this job' });
        }

        // Normalize path
        const fileUrl = `/uploads/cvs/${req.file.filename}`;

        const cv = await prisma.cv.create({
            data: {
                jobId,
                applicantId,
                format: req.file.mimetype,
                fileName: req.file.originalname,
                fileUrl: fileUrl
            }
        });
        res.status(201).json(cv);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to submit CV' });
    }
};

export const getMyCvs = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const cvs = await prisma.cv.findMany({
            where: { applicantId: userId },
            include: {
                job: {
                    include: { recruiter: { select: { companyName: true } } }
                },
                result: true
            }
        });
        res.json(cvs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch CVs' });
    }
};

export const getJobCvs = async (req: AuthRequest, res: Response) => {
    const { jobId } = req.params;

    try {
        const cvs = await prisma.cv.findMany({
            where: { jobId },
            include: {
                applicant: {
                    include: { user: { select: { name: true, email: true } } }
                },
                result: true
            }
        });
        res.json(cvs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch CVs' });
    }
};
