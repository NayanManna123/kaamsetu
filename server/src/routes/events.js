import { Router } from 'express';
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getCompanyEvents,
  getEvents,
  getEventById,
  registerForEvent,
  checkInUser,
  getEventAnalytics,
  bookInterviewSlot,
  updateCandidateStatus,
  bulkUpdateCandidateStatus,
  getEventChat,
  sendEventChatMessage,
  getParticipationCertificate,
} from '../controllers/eventController.js';
import { protect } from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';

const router = Router();

// --- General Discovery & Details ---
router.get('/', getEvents);
router.get('/company', protect, roleGuard('company'), getCompanyEvents); // placed before general /:id to avoid ID conflict
router.get('/:id', getEventById);

// --- Worker registrations & slot booking ---
router.post('/register', protect, roleGuard('worker'), registerForEvent);
router.post('/:id/book-slot', protect, roleGuard('worker'), bookInterviewSlot);
router.get('/:id/certificate', protect, roleGuard('worker'), getParticipationCertificate);

// --- Check-in system ---
router.post('/checkin', protect, checkInUser); // Scanner hits check-in

// --- Company event management ---
router.post('/create', protect, roleGuard('company'), createEvent);
router.put('/update', protect, roleGuard('company'), updateEvent); // ID in body
router.put('/update/:id', protect, roleGuard('company'), updateEvent);
router.put('/:id', protect, roleGuard('company'), updateEvent);

router.delete('/delete', protect, roleGuard('company'), deleteEvent); // ID in query/body
router.delete('/delete/:id', protect, roleGuard('company'), deleteEvent);
router.delete('/:id', protect, roleGuard('company'), deleteEvent);

// --- Advanced hiring dashboard actions & analytics ---
router.get('/:id/analytics', protect, roleGuard('company'), getEventAnalytics);
router.put('/:id/candidates/bulk-status', protect, roleGuard('company'), bulkUpdateCandidateStatus);
router.put('/:id/candidates/:registrationId/status', protect, roleGuard('company'), updateCandidateStatus);

// --- Real-time Q&A Event Chat ---
router.get('/:id/chat', protect, getEventChat);
router.post('/:id/chat', protect, sendEventChatMessage);

export default router;
