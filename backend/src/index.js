import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import messagesRoutes from './routes/messages.js';
import usersRoutes from './routes/users.js';

// Import middleware
import { verifyJWT, errorHandler, notFound, jsonParser } from './middleware/auth.js';

// Import models
import Message from './models/Message.js';
import User from './models/User.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// JSON parsing error handler
app.use(jsonParser);

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts',
});

app.use('/api/', globalLimiter);

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/secure-chat', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('[DB] MongoDB connected');
  } catch (error) {
    console.error('[DB] MongoDB connection error:', error);
    process.exit(1);
  }
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/users', usersRoutes);

// Socket.IO events with authentication
io.use((socket, next) => {
  // Optional: Verify JWT from socket handshake query
  const token = socket.handshake.auth.token;
  if (!token && socket.handshake.query.token) {
    // Token can be passed as query param or in auth object
  }
  next();
});

const userSockets = new Map(); // userId -> socketId mapping

io.on('connection', (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);

  socket.on('user-joined', async (data) => {
    const { userId, username } = data;
    userSockets.set(userId, socket.id);
    socket.userId = userId;

    console.log(`[Socket] User joined: ${username} (${userId})`);

    // Update user status to online
    await User.findByIdAndUpdate(userId, { status: 'online' });

    // Notify all users
    io.emit('user-joined', { userId, username, timestamp: new Date() });
  });

  socket.on('send-message', async (data) => {
    const { sender, receiver, encryptedContent, nonce } = data;

    console.log(`[Socket] Message from ${sender} to ${receiver}`);

    // Store message in database (already encrypted on client side)
    try {
      const message = new Message({
        sender,
        receiver,
        encryptedContent,
        nonce,
      });
      await message.save();
    } catch (error) {
      console.error('[Socket] Failed to store message:', error);
    }

    // Relay to recipient if online
    const recipientSocketId = userSockets.get(receiver);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('receive-message', {
        _id: data._id,
        sender,
        receiver,
        encryptedContent,
        nonce,
        timestamp: new Date(),
      });
    }

    // Send confirmation to sender
    socket.emit('message-sent', {
      _id: data._id,
      status: recipientSocketId ? 'delivered' : 'stored',
      timestamp: new Date(),
    });
  });

  socket.on('typing', (data) => {
    const { receiver } = data;
    const recipientSocketId = userSockets.get(receiver);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('typing', { sender: socket.userId });
    }
  });

  socket.on('stop-typing', (data) => {
    const { receiver } = data;
    const recipientSocketId = userSockets.get(receiver);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('stop-typing', { sender: socket.userId });
    }
  });

  socket.on('disconnect', async () => {
    console.log(`[Socket] User disconnected: ${socket.id}`);

    // Update user status to offline
    if (socket.userId) {
      await User.findByIdAndUpdate(socket.userId, { status: 'offline', lastLogin: new Date() });
      userSockets.delete(socket.userId);

      // Notify all users
      io.emit('user-disconnected', { userId: socket.userId, timestamp: new Date() });
    }
  });
});

// 404 handler
app.use(notFound);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`[Server] Listening on port ${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[Server] Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  });
};

startServer();

export { app, io, userSockets };
