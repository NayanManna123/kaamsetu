import { Router } from 'express';
import {
  getWorkerDashboardStats,
  getCompanyDashboardStats,
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';

const router = Router();

router.get('/worker', protect, roleGuard('worker'), getWorkerDashboardStats);
router.get('/company', protect, roleGuard('company'), getCompanyDashboardStats);

export default router;
