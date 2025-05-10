'use strict';
import express from 'express';
import {Server} from 'socket.io';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import indexRouter from '../../router/index.js';
import UserSchema from '../models/mongo_collections/userModel.js';
import Conversation from '../models/mongo_collections/conversationModel.js';
import { socketAuth } from '../middleware/auth.js';

dotenv.config();

export const app = express();
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_DOMAIN_LIST ? process.env.ALLOWED_DOMAIN_LIST.split(',') : '*',
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000 // Increased timeout for better performance
});

// Use the socketAuth middleware for socket connections
io.use(socketAuth);

// Optimized maps for user tracking
const onlineUsers = new Map(); // userId -> socketId
const userSockets = new Map(); // socketId -> userId

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    socket.decoded = decoded;
    socket.userId = decoded._id;
    
    // Checking if user has a previous session
    const oldSocketId = onlineUsers.get(decoded._id);
    if (oldSocketId) {
      // Force disconnect previous socket
      io.sockets.sockets.get(oldSocketId)?.disconnect(true);
    }
    
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.use((req, res, next) => {
  res.header('Access-Control-Max-Age', '86400');
  next();
});

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cookieParser());
app.use(compression());

const limiter = rateLimit({
  windowMs: process.env.RATE_LIMITER_WINDOWMS || 900000,
  max: process.env.RATE_LIMITER_MAX_REQUEST || 100000,
  message: process.env.RATE_LIMITER_MESSAGE || "Too many requests, please try again later."
});

if (process.env.ALLOWED_DOMAIN_LIST) {
  const allowedDomains = process.env.ALLOWED_DOMAIN_LIST.split(',');
  // app.use(cors({ origin: allowedDomains }));
  console.log("Production Cors Detected")
  console.log(`Domains: ${allowedDomains}`)
  // app.use(cors({ origin: '*' }))
  // app.use(cors({
  //   origin: '*',
  //   credentials: true,
  //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  //   allowedHeaders: ['Content-Type', 'Authorization']
  // }));
  app.use(cors({
    origin: allowedDomains,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
} else {
  console.log("Local Cors Detected")
  app.use(cors({
    origin: 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
}

app.use(limiter);
app.use('/api/v1', indexRouter);

// Socket.io setup
io.on('connection', async (socket) => {
  const userId = socket.userId;
  
  await UserSchema.updateOnlineStatus(userId, true);
  
  // Storing socket mapping
  onlineUsers.set(userId, socket.id);
  userSockets.set(socket.id, userId);
  
  socket.join(`user:${userId}`);
  
  socket.broadcast.emit('user_status', {
    userId: userId,
    status: 'online'
  });
  
  socket.emit('online_users', Array.from(onlineUsers.keys()));
  
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
  });
  
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });
  
  socket.on('send_message', async (data) => {
    try {
      const sender = await UserSchema.findById(userId).select('name email _id');
      
      if (!sender) {
        console.error('Sender not found:', userId);
        return;
      }
      
      const enrichedMessage = {
        ...data,
        sender: {
          _id: sender._id,
          name: sender.name,
          email: sender.email
        },
        timestamp: new Date()
      };
      
      socket.to(`conversation:${data.conversationId}`).emit('new_message', enrichedMessage);
      
      if (data.recipient && onlineUsers.has(data.recipient)) {
        socket.to(`user:${data.recipient}`).emit('conversation_updated', {
          conversationId: data.conversationId,
          lastMessage: {
            content: data.content,
            sender: userId,
            timestamp: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Error sending message via socket:', error);
    }
  });
  
  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
      userId: userId,
      conversationId: data.conversationId,
      isTyping: true
    });
  });
  
  // Handle stopped typing
  socket.on('stop_typing', (data) => {
    socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
      userId: userId,
      conversationId: data.conversationId,
      isTyping: false
    });
  });
  
  // Handle messages read
  socket.on('messages_read', (data) => {
    socket.to(`conversation:${data.conversationId}`).emit('messages_read_update', {
      conversationId: data.conversationId,
      messageIds: data.messageIds,
      readBy: userId
    });
  });
  
  socket.on('create_conversation', async (data) => {
    try {
      if (!data.participants || data.participants.length !== 2) {
        return socket.emit('error', { message: 'Invalid participants data' });
      }
      
      if (data.participants[0] !== userId) {
        return socket.emit('error', { message: 'Unauthorized operation' });
      }
      
      const conversation = await Conversation.getOrCreateConversation(
        data.participants[0], 
        data.participants[1]
      );
      
      socket.join(`conversation:${conversation._id}`);
      
      socket.emit('conversation_created', conversation);
      
      const otherUserId = data.participants.find(id => id !== userId);
      const otherUserSocketId = onlineUsers.get(otherUserId);
      
      if (otherUserSocketId) {
        const otherUserSocket = io.sockets.sockets.get(otherUserSocketId);
        if (otherUserSocket) {
          otherUserSocket.join(`conversation:${conversation._id}`);
          
          otherUserSocket.emit('conversation_created', conversation);
        }
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      socket.emit('error', { message: 'Error creating conversation' });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', async () => {
    await UserSchema.updateOnlineStatus(userId, false);
    
    // Removing from tracking maps
    onlineUsers.delete(userId);
    userSockets.delete(socket.id);
    
    // Notifying to all users about offline status
    io.emit('user_status', {
      userId: userId,
      status: 'offline'
    });
    
  });
});

export default server;
