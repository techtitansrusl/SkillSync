import express from 'express';
import { getProfile, updateProfile, getApplicantById } from '../controllers/applicantController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Applicant routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

// Recruiter route (to view applicant profile by ID)
router.get('/:id', authenticateToken, getApplicantById);

export default router;
