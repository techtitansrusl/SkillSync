import { Router } from 'express';
import { submitCv, getMyCvs, getJobCvs } from '../controllers/applicationController';
import { authenticateToken } from '../middleware/authMiddleware';
import { upload } from '../controllers/uploadController';

const router = Router();

// 'cv' is the field name in the form-data
router.post('/', authenticateToken, upload.single('cv'), submitCv);
router.get('/my', authenticateToken, getMyCvs);
router.get('/job/:jobId', authenticateToken, getJobCvs);

export default router;
