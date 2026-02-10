import { Router } from 'express';
import { generateJobDescription, analyzeResume, processJobCandidates } from '../controllers/aiController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/job-description', authenticateToken, generateJobDescription);
router.post('/analyze-resume', authenticateToken, analyzeResume);
router.post('/process-candidates', authenticateToken, processJobCandidates);

export default router;
