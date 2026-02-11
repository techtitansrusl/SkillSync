import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/authMiddleware';

export const getJobs = async (req: AuthRequest, res: Response) => {
    try {
        const { recruiterId } = req.query;
        const where: any = {};

        if (recruiterId) {
            where.recruiterId = recruiterId as string;
        } else {
            // If fetching for applicant (no specific recruiter), only show active jobs
            where.status = 'ACTIVE';
        }

        const jobs = await prisma.job.findMany({
            where,
            include: {
                recruiter: {
                    select: { companyName: true }
                },
                qualifications: true,
                skills: true,
                _count: {
                    select: { cvs: true }
                }
            },
            orderBy: { postedDate: 'desc' }
        });

        // Map _count.cvs to applicantsCount for frontend compatibility
        const jobsWithCount = jobs.map(job => {
            const { _count, ...jobData } = job;
            return {
                ...jobData,
                applicantsCount: _count?.cvs || 0
            };
        });

        res.json(jobsWithCount);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
};

export const createJob = async (req: AuthRequest, res: Response) => {
    const { title, description, location, salary, qualifications, skills } = req.body;
    const recruiterId = req.user?.id;

    if (!recruiterId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        // qualifications and skills should be arrays of strings
        // But our model expects objects with jobId.
        // Prisma create can handle nested creates.

        const jobData: any = {
            title,
            description,
            location,
            salary,
            recruiterId,
            status: 'ACTIVE'
        };

        if (qualifications && Array.isArray(qualifications)) {
            jobData.qualifications = {
                create: qualifications.map((q: string) => ({ qualification: q }))
            };
        }

        if (skills && Array.isArray(skills)) {
            jobData.skills = {
                create: skills.map((s: string) => ({ skill: s }))
            };
        }

        const job = await prisma.job.create({
            data: jobData,
            include: {
                qualifications: true,
                skills: true
            }
        });
        res.status(201).json(job);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create job' });
    }
};

export const getJobById = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    try {
        const job = await prisma.job.findUnique({
            where: { id },
            include: {
                recruiter: { select: { companyName: true, user: { select: { name: true, email: true } } } },
                qualifications: true,
                skills: true,
                _count: {
                    select: { cvs: true }
                }
            }
        });
        if (!job) return res.status(404).json({ error: 'Job not found' });

        const { _count, ...jobData } = job;
        const jobWithCount = {
            ...jobData,
            applicantsCount: _count?.cvs || 0
        };

        res.json(jobWithCount);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch job' });
    }
};

export const deleteJob = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const recruiterId = req.user?.id;

    if (!recruiterId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const job = await prisma.job.findUnique({
            where: { id }
        });

        if (!job) return res.status(404).json({ error: 'Job not found' });

        if (job.recruiterId !== recruiterId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await prisma.job.delete({
            where: { id }
        });

        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ error: 'Failed to delete job' });
    }
};
