import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';

// Route imports
import authRoutes from './src/routes/auth.js';
import jobRoutes from './src/routes/jobs.js';
import workerRoutes from './src/routes/workers.js';
import applicationRoutes from './src/routes/applications.js';
import hireRoutes from './src/routes/hires.js';
import ratingRoutes from './src/routes/ratings.js';
import chatRoutes from './src/routes/chat.js';
import notificationRoutes from './src/routes/notifications.js';
import walletRoutes from './src/routes/wallet.js';
import escrowRoutes from './src/routes/escrow.js';
import attendanceRoutes from './src/routes/attendance.js';
import dashboardRoutes from './src/routes/dashboard.js';
import settingsRoutes from './src/routes/settings.js';
import { applyToJob } from './src/controllers/applicationController.js';
import { protect } from './src/middleware/auth.js';
import roleGuard from './src/middleware/roleGuard.js';

// Load env vars
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.io setup for real-time features
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Make io accessible in routes via req.app
app.set('io', io);

// Track online users for live status
const onlineUsers = new Map(); // userId → socketId

// --------------- Middleware ---------------
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --------------- API Routes ---------------
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/hires', hireRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);

// Direct alias and custom endpoints for job applications and online check
app.post('/api/apply-job', protect, roleGuard('worker'), applyToJob);
app.get('/api/auth/users/:id/online-status', protect, (req, res) => {
  const isOnline = onlineUsers.has(req.params.id);
  res.json({ success: true, isOnline });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), onlineUsers: onlineUsers.size });
});

// --------------- Socket.io Events ---------------
io.on('connection', (socket) => {
  console.log(`⚡ Socket connected: ${socket.id}`);

  // Join personal notification room & track online status
  socket.on('join', (userId) => {
    socket.join(userId);
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`User ${userId} joined their room (${onlineUsers.size} online)`);

    // Broadcast updated online count and user status
    io.emit('onlineCount', { count: onlineUsers.size });
    io.emit('userStatus', { userId, status: 'online' });
  });

  // Join chat room
  socket.on('joinChat', (roomId) => {
    socket.join(`chat_${roomId}`);
  });

  // Leave chat room
  socket.on('leaveChat', (roomId) => {
    socket.leave(`chat_${roomId}`);
  });

  // Handle chat message
  socket.on('sendMessage', (data) => {
    io.to(`chat_${data.roomId}`).emit('newMessage', data);
  });

  // Typing indicator for chat
  socket.on('typing', (data) => {
    socket.to(`chat_${data.roomId}`).emit('userTyping', {
      userId: data.userId,
      name: data.name,
      isTyping: data.isTyping,
    });
  });

  // Handle live worker availability toggle
  // Companies see workers go online/offline in real-time
  socket.on('workerStatusChange', (data) => {
    io.emit('workerAvailabilityChanged', {
      workerId: data.workerId,
      isInstantAvailable: data.isInstantAvailable,
      name: data.name,
    });
  });

  // Handle hire response (worker accepts/rejects in real-time)
  socket.on('hireResponse', (data) => {
    // Emit to the company who sent the hire request
    if (data.companyId) {
      io.to(data.companyId).emit('hireResponseUpdate', {
        hireRequestId: data.hireRequestId,
        status: data.status,
        workerName: data.workerName,
        jobTitle: data.jobTitle,
      });
    }
  });

  // Handle live job status updates
  socket.on('jobStatusChange', (data) => {
    socket.broadcast.emit('jobStatusUpdated', data);
  });

  socket.on('disconnect', () => {
    // Remove from online tracking
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('onlineCount', { count: onlineUsers.size });
      io.emit('userStatus', { userId: socket.userId, status: 'offline' });
    }
    console.log(`🔌 Socket disconnected: ${socket.id} (${onlineUsers.size} online)`);
  });
});

// --------------- Global Error Handler ---------------
app.use((err, _req, res, _next) => {
  console.error('❌ Error:', err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// --------------- Start Server ---------------
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`🚀 KaamSetu server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();

export { io };
