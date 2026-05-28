import { Router } from 'express';
import { 
  register, 
  login, 
  getMe, 
  updateProfile,
  verifyEmailOtp,
  verifyPhoneOtp,
  resendOtp 
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmailOtp);
router.post('/verify-phone', verifyPhoneOtp);
router.post('/resend-otp', resendOtp);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;
