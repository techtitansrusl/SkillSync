import { Router } from 'express';
import { submitCv, getMyCvs, getJobCvs, bulkUpload, updateCv, withdrawApplication } from '../controllers/applicationController';
import { authenticateToken } from '../middleware/authMiddleware';
import { upload } from '../controllers/uploadController';

const router = Router();

// 'cv' is the field name in the form-data
router.post('/', authenticateToken, upload.single('cv'), submitCv);
router.post('/bulk', authenticateToken, upload.array('cvs', 50), bulkUpload);
router.put('/:id', authenticateToken, upload.single('cv'), updateCv);
router.get('/my', authenticateToken, getMyCvs);
router.get('/job/:jobId', authenticateToken, getJobCvs);
router.post('/:id/withdraw', authenticateToken, withdrawApplication);

export default router;
