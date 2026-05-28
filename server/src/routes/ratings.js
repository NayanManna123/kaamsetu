import { Router } from 'express';
import { createRating, getRatingsForUser } from '../controllers/ratingController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/', protect, createRating);
router.get('/user/:userId', getRatingsForUser);

export default router;
