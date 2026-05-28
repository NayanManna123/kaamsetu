import { Router } from 'express';
import { checkIn, checkOut, getAttendanceStatus, getJobAttendance } from '../controllers/attendanceController.js';
import { protect } from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';

const router = Router();

router.use(protect);

router.post('/check-in', roleGuard('worker'), checkIn);
router.post('/check-out', roleGuard('worker'), checkOut);
router.get('/status/:jobId', roleGuard('worker'), getAttendanceStatus);
router.get('/job/:jobId', roleGuard('company'), getJobAttendance);

export default router;
