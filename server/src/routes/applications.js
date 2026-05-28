import { Router } from 'express';
import {
  applyToJob, getApplicationsForJob,
  getMyApplications, updateApplicationStatus,
} from '../controllers/applicationController.js';
import { protect } from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';

const router = Router();

router.post('/', protect, roleGuard('worker'), applyToJob);
router.get('/my', protect, roleGuard('worker'), getMyApplications);
router.get('/job/:jobId', protect, roleGuard('company'), getApplicationsForJob);
router.put('/:id/status', protect, roleGuard('company'), updateApplicationStatus);

export default router;
