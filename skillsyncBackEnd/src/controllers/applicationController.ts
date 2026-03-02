import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendNotification } from '../utils/emailService';
import { createNotification } from './notificationController';

export const submitCv = async (req: AuthRequest, res: Response) => {
    // The file is uploaded by multer middleware before this controller
    const { jobId } = req.body;
    const applicantId = req.user?.id;

    if (!req.file) return res.status(400).json({ error: 'No CV file uploaded' });

    try {
        // If applicant, check for existing application
        if (applicantId && req.user?.role === 'APPLICANT') {
            const existingCv = await prisma.cv.findFirst({
                where: { applicantId, jobId }
            });

            if (existingCv) {
                return res.status(400).json({ error: 'You have already applied for this job' });
            }
        }

        // Normalize path
        const fileUrl = `/uploads/cvs/${req.file.filename}`;

        const cv = await prisma.cv.create({
            data: {
                jobId,
                applicantId: req.user?.role === 'APPLICANT' ? applicantId : null,
                format: req.file.mimetype,
                fileName: req.file.originalname,
                fileUrl: fileUrl
            }
        });

        // Async notification notification (don't await to avoid delaying response)
        if (req.user?.role === 'APPLICANT' && req.user.email) {
            const job = await prisma.job.findUnique({
                where: { id: jobId },
                include: { recruiter: true }
            });
            sendNotification(req.user.email, 'CV_SUBMITTED', {
                userName: req.user.name,
                jobTitle: job?.title || 'Job'
            }).catch(err => console.error("Email notification error:", err));

            createNotification(req.user.id, 'Application Submitted', `Your CV for "${job?.title || 'Job'}" has been received.`).catch(err => console.error("In-system notification error:", err));

            // Notify Recruiter
            if (job?.recruiterId) {
                createNotification(job.recruiterId, 'New Application', `A new candidate has applied for your job post: "${job.title}".`).catch(err => console.error("Recruiter in-system notification error:", err));
            }
        }

        res.status(201).json(cv);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to submit CV' });
    }
};

export const bulkUpload = async (req: AuthRequest, res: Response) => {
    const { jobId } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!jobId) return res.status(400).json({ error: 'Job ID is required' });
    if (!files || files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

    try {
        const uploadPromises = files.map(file => {
            const fileUrl = `/uploads/cvs/${file.filename}`;
            return prisma.cv.create({
                data: {
                    jobId,
                    applicantId: null, // Recruiter upload
                    format: file.mimetype,
                    fileName: file.originalname,
                    fileUrl: fileUrl
                }
            });
        });

        const results = await Promise.all(uploadPromises);

        // Async notification for recruiter
        if (req.user?.email && req.user?.role === 'RECRUITER') {
            const job = await prisma.job.findUnique({ where: { id: jobId } });
            sendNotification(req.user.email, 'RECRUITER_BULK_UPLOAD', {
                userName: req.user.name,
                jobTitle: job?.title || 'Job',
                count: results.length
            }).catch(err => console.error("Bulk upload notification error:", err));

            createNotification(req.user.id, 'Bulk Upload Complete', `Successfully uploaded ${results.length} CVs for "${job?.title || 'Job'}".`).catch(err => console.error("In-system notification error:", err));
        }

        res.status(201).json({ message: `Successfully uploaded ${results.length} CVs`, count: results.length });
    } catch (error) {
        console.error("Bulk upload error:", error);
        res.status(500).json({ error: 'Failed to upload some files' });
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
    const jobId = req.params.jobId as string;

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

export const updateCv = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user?.id;

    if (!req.file) return res.status(400).json({ error: 'No CV file uploaded' });

    try {
        const cv = await prisma.cv.findUnique({
            where: { id }
        });

        if (!cv) return res.status(404).json({ error: 'CV not found' });

        if (cv.applicantId !== userId) {
            return res.status(403).json({ error: 'Unauthorized to update this CV' });
        }

        const newFileUrl = `/uploads/cvs/${req.file.filename}`;

        await prisma.$transaction(async (tx) => {
            // Archive old CV
            await tx.archivedCv.create({
                data: {
                    cvId: cv.id,
                    fileUrl: cv.fileUrl || '',
                    fileName: cv.fileName || 'Unknown'
                }
            });

            // Update CV record
            await tx.cv.update({
                where: { id },
                data: {
                    fileUrl: newFileUrl,
                    fileName: req.file?.originalname || cv.fileName,
                    format: req.file?.mimetype || cv.format,
                    submittedDate: new Date()
                }
            });

            // Reset results
            await tx.result.deleteMany({
                where: { cvId: id }
            });
        });

        // Trigger notification
        if (req.user?.email) {
            const job = await prisma.job.findUnique({
                where: { id: cv.jobId },
                include: { recruiter: true }
            });
            sendNotification(req.user.email, 'CV_UPDATED', {
                userName: req.user.name,
                jobTitle: job?.title || 'Job'
            }).catch(err => console.error("Email notification error:", err));

            createNotification(req.user.id, 'CV Updated', `Your CV for "${job?.title || 'Job'}" has been updated and re-queued for AI screening.`).catch(err => console.error("In-system notification error:", err));

            // Notify Recruiter
            if (job?.recruiterId) {
                createNotification(job.recruiterId, 'CV Updated', `An applicant has updated their CV for your job: "${job.title}".`).catch(err => console.error("Recruiter in-system notification error:", err));
            }
        }

        res.json({ message: 'CV updated and archived successfully' });
    } catch (error) {
        console.error("CV update error:", error);
        res.status(500).json({ error: 'Failed to update CV' });
    }
};

export const withdrawApplication = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user?.id;

    try {
        const cv = await (prisma.cv as any).findUnique({
            where: { id },
            include: {
                result: true,
                job: { include: { recruiter: true } }
            }
        });

        if (!cv) return res.status(404).json({ error: 'Application not found' });

        if (cv.applicantId !== userId) {
            return res.status(403).json({ error: 'Unauthorized to withdraw this application' });
        }

        // Block if screening has occurred (Result record exists and isn't already Withdrawn)
        if (cv.result && cv.result.status?.toLowerCase() !== 'withdrawn') {
            return res.status(400).json({ error: 'Cannot withdraw an application after screening has started or a score has been assigned.' });
        }

        const currentStatus = cv.result?.status?.toLowerCase() || 'pending';

        if (currentStatus === 'withdrawn') {
            return res.status(400).json({ error: 'Application is already withdrawn' });
        }

        await prisma.result.upsert({
            where: { cvId: id },
            update: {
                status: 'Withdrawn',
                processedDate: new Date()
            },
            create: {
                cvId: id,
                status: 'Withdrawn',
                score: 0,
                comment: 'Withdrawn by applicant'
            }
        });

        // Notify Recruiter
        if (cv.job?.recruiterId) {
            await createNotification(
                cv.job.recruiterId,
                'Application Withdrawn',
                `An applicant has withdrawn their application for "${cv.job.title}".`
            );
        }

        // Notify Applicant
        await createNotification(
            userId,
            'Withdrawal Successful',
            `You have successfully withdrawn your application for "${cv.job?.title || 'Job'}".`
        );

        res.json({ message: 'Application withdrawn successfully' });
    } catch (error) {
        console.error("Withdrawal error:", error);
        res.status(500).json({ error: 'Failed to withdraw application' });
    }
};
