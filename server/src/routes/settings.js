import { Router } from 'express';
import {
  getSocialLinks,
  updateSocialLinks,
  getUserSettings,
  updateUserSettings,
} from '../controllers/settingsController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Global app social links
router.get('/social-links', getSocialLinks);
router.put('/social-links', protect, updateSocialLinks);

// User settings
router.get('/user', protect, getUserSettings);
router.put('/user', protect, updateUserSettings);

export default router;
