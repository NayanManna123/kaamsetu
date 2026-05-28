import { ChatRoom, Message } from '../models/Chat.js';

/**
 * @desc    Get or create a chat room between two users
 * @route   POST /api/chat/room
 * @access  Private
 *
 * Improvement: When creating with a jobId, auto-sends job details as first message
 */
export const getOrCreateRoom = async (req, res) => {
  try {
    const { participantId, jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ success: false, message: 'Job ID is required to start a chat room' });
    }

    // Security: Only allow chat if user applied for job (or owns it)
    const Application = (await import('../models/Application.js')).default;
    const Job = (await import('../models/Job.js')).default;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const application = await Application.findOne({
      job: jobId,
      $or: [
        { worker: req.user._id },
        { worker: participantId }
      ]
    });

    if (!application) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: A worker must apply for the job to start a chat' 
      });
    }

    // Check if room already exists for this job and participants
    let room = await ChatRoom.findOne({
      participants: { $all: [req.user._id, participantId] },
      job: jobId,
    }).populate('participants', 'name avatar role');

    if (!room) {
      room = await ChatRoom.create({
        participants: [req.user._id, participantId],
        job: jobId,
      });

      // Auto-send job details as first message
      try {
        const jobDetailsMsg = `📋 Job Details:\n🏷 ${job.title}\n💰 ₹${job.pay}/${job.payType === 'fixed' ? 'fixed' : 'day'}\n📍 ${job.location?.address || job.location?.city || 'Location TBD'}\n⏱ ${job.duration || '1 day'}\n👥 ${job.workersNeeded} workers needed`;

        await Message.create({
          room: room._id,
          sender: req.user._id,
          content: jobDetailsMsg,
        });

        await ChatRoom.findByIdAndUpdate(room._id, {
          lastMessage: {
            content: jobDetailsMsg,
            sender: req.user._id,
            timestamp: new Date(),
          },
        });
      } catch (e) {
        console.warn('Auto job message failed:', e.message);
      }

      room = await ChatRoom.findById(room._id)
        .populate('participants', 'name avatar role')
        .populate('job', 'title pay payType location');
    }

    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get messages for a chat room
 * @route   GET /api/chat/room/:roomId/messages
 * @access  Private
 */
export const getMessages = async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Chat room not found' });
    }

    // Access Control: Only participants can access chat
    if (!room.participants.some(id => id.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this conversation' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ room: req.params.roomId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Send a message in a chat room
 * @route   POST /api/chat/room/:roomId/messages
 * @access  Private
 *
 * Improvement: Notifies recipient via socket (not just room broadcast)
 */
export const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;

    const room = await ChatRoom.findById(req.params.roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Chat room not found' });
    }

    // Access Control: Only participants can send messages
    if (!room.participants.some(id => id.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized to message in this room' });
    }

    const message = await Message.create({
      room: req.params.roomId,
      sender: req.user._id,
      content,
    });

    // Update last message on room
    await ChatRoom.findByIdAndUpdate(req.params.roomId, {
      lastMessage: {
        content,
        sender: req.user._id,
        timestamp: new Date(),
      },
    });

    const populated = await Message.findById(message._id).populate(
      'sender',
      'name avatar'
    );

    // Emit via Socket.io to the chat room
    const io = req.app.get('io');
    if (io) {
      io.to(`chat_${req.params.roomId}`).emit('newMessage', populated);

      // Also notify all participants who aren't in the room
      for (const participant of room.participants) {
        if (participant.toString() !== req.user._id.toString()) {
          io.to(participant.toString()).emit('notification', {
            type: 'message',
            title: '💬 New Message',
            message: `${req.user.name}: ${content.substring(0, 60)}${content.length > 60 ? '...' : ''}`,
            data: { roomId: req.params.roomId },
          });
        }
      }
    }

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all chat rooms for current user
 * @route   GET /api/chat/rooms
 * @access  Private
 */
export const getMyRooms = async (req, res) => {
  try {
    const rooms = await ChatRoom.find({
      participants: req.user._id,
    })
      .populate('participants', 'name avatar role')
      .populate('job', 'title pay')
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ success: true, count: rooms.length, data: rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
