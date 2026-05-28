import { Router } from 'express';
import { getEscrowByJob, releaseEscrow, getCompanyEscrowStats } from '../controllers/escrowController.js';
import { protect } from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';

const router = Router();

router.use(protect);

router.get('/job/:jobId', getEscrowByJob);
router.put('/:escrowId/release', roleGuard('company'), releaseEscrow);
router.get('/stats', roleGuard('company'), getCompanyEscrowStats);

export default router;
