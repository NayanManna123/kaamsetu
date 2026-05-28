import { Router } from 'express';
import {
  sendHireRequest, bulkHire, getHireRequestsForWorker,
  getHireRequestsByCompany, respondToHireRequest,
} from '../controllers/hireController.js';
import { protect } from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';

const router = Router();

router.post('/', protect, roleGuard('company'), sendHireRequest);
router.post('/bulk', protect, roleGuard('company'), bulkHire);
router.get('/worker', protect, roleGuard('worker'), getHireRequestsForWorker);
router.get('/company', protect, roleGuard('company'), getHireRequestsByCompany);
router.put('/:id/respond', protect, roleGuard('worker'), respondToHireRequest);

export default router;
