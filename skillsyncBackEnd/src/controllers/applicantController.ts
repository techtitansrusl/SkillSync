import { Request, Response } from 'express';
import { prisma } from '../index';

export const getProfile = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const applicant = await prisma.applicant.findUnique({
            where: { id: userId },
            include: { user: { select: { name: true, email: true } } }
        });

        if (!applicant) return res.status(404).json({ error: 'Applicant profile not found' });

        res.json({
            name: applicant.user.name,
            email: applicant.user.email,
            contact: applicant.contact,
            education: applicant.education,
            experience: applicant.experience,
            skills: applicant.skills,
            resumeUrl: applicant.resumeUrl
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { name, contact, education, experience, skills } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Mandatory fields validation
    if (!name || !contact) {
        return res.status(400).json({ error: 'Name and contact are mandatory' });
    }

    try {
        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { name }
            }),
            prisma.applicant.update({
                where: { id: userId },
                data: { contact, education, experience, skills }
            })
        ]);

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

export const getApplicantById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const recruiterId = (req as any).user?.id;

    if (!recruiterId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        // Business Rule: Recruiters should be able to view profiles of applicants 
        // who have applied to jobs posted by that recruiter.
        const application = await prisma.cv.findFirst({
            where: {
                applicantId: id,
                job: { recruiterId: recruiterId }
            }
        });

        if (!application) {
            return res.status(403).json({ error: 'You can only view profiles of candidates who applied to your jobs' });
        }

        const applicant = await prisma.applicant.findUnique({
            where: { id },
            include: { user: { select: { name: true, email: true } } }
        });

        if (!applicant) return res.status(404).json({ error: 'Applicant not found' });

        res.json({
            name: applicant.user.name,
            email: applicant.user.email,
            contact: applicant.contact,
            education: applicant.education,
            experience: applicant.experience,
            skills: applicant.skills,
            resumeUrl: applicant.resumeUrl
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch applicant profile' });
    }
};
