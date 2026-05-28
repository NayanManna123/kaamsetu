import { Router } from 'express';
import {
  getOrCreateRoom, getMessages, sendMessage, getMyRooms,
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/rooms', protect, getMyRooms);
router.post('/room', protect, getOrCreateRoom);
router.get('/room/:roomId/messages', protect, getMessages);
router.post('/room/:roomId/messages', protect, sendMessage);

export default router;
