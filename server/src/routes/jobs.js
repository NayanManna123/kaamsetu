import { Router } from 'express';
import {
  createJob, getJobs, getJobById, updateJob, deleteJob,
  searchJobs, getUrgentJobs, getNearbyJobs, getRecommendedJobs, getMyJobs,
} from '../controllers/jobController.js';
import { protect } from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';

const router = Router();

// Public routes
router.get('/search', searchJobs);
router.get('/urgent', getUrgentJobs);
router.get('/nearby', getNearbyJobs);
router.get('/', getJobs);
router.get('/:id', getJobById);

// Protected routes
router.get('/feed/recommended', protect, roleGuard('worker'), getRecommendedJobs);
router.get('/manage/my', protect, roleGuard('company'), getMyJobs);
router.post('/', protect, roleGuard('company'), createJob);
router.put('/:id', protect, roleGuard('company'), updateJob);
router.delete('/:id', protect, roleGuard('company'), deleteJob);

export default router;
