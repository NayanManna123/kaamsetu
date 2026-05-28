import { Router } from 'express';
import { getBalance, getTransactions, withdrawFunds } from '../controllers/walletController.js';
import { protect } from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';

const router = Router();

router.use(protect);
router.use(roleGuard('worker')); // Only workers have wallets/earnings in this flow

router.get('/balance', getBalance);
router.get('/transactions', getTransactions);
router.post('/withdraw', withdrawFunds);

export default router;
