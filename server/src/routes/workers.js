import { Router } from 'express';
import {
  getWorkers, getWorkerById, updateWorkerProfile,
  searchWorkers, getSuggestedWorkers, toggleAvailability,
  getNearbyWorkers,
} from '../controllers/workerController.js';
import { protect } from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';

const router = Router();

// Company-only routes
router.get('/search', protect, roleGuard('company'), searchWorkers);
router.get('/nearby', protect, roleGuard('company'), getNearbyWorkers);
router.get('/suggested/:jobId', protect, roleGuard('company'), getSuggestedWorkers);

// Public routes
router.get('/', getWorkers);
router.get('/:id', getWorkerById);

// Worker-only routes
router.put('/:id', protect, roleGuard('worker'), updateWorkerProfile);
router.put('/:id/availability', protect, roleGuard('worker'), toggleAvailability);

export default router;
