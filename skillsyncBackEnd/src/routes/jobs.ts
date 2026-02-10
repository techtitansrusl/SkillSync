import { Router } from 'express';
import { getJobs, createJob, getJobById, deleteJob } from '../controllers/jobController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getJobs);
router.get('/:id', getJobById);
router.post('/', authenticateToken, createJob);
router.delete('/:id', authenticateToken, deleteJob);

export default router;
