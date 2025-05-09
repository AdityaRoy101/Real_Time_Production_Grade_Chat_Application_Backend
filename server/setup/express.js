'use strict';
import express from 'express';
import {Server} from 'socket.io';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import indexRouter from '../../router/index.js';

// Load environment variables
dotenv.config();

export const app = express();
const server = http.createServer(app);

// Initialize Socket.io with the HTTP server
export const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_DOMAIN_LIST ? process.env.ALLOWED_DOMAIN_LIST.split(' ') : '*',
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token) {
    jwt.verify(token, process.env.SECRET, (err, decoded) => {
      if (err) return next(new Error('Authentication error'));
      socket.decoded = decoded;
      next();
    });
  } else {
    next(new Error('Authentication error'));
  }
});

app.use((req, res, next) => {
  res.header('Access-Control-Max-Age', '86400');
  next();
});

app.use(express.urlencoded({extended: false}));
app.use(express.json());

const limiter = rateLimit({
  windowMs: process.env.RATE_LIMITER_WINDOWMS || 900000,
  max: process.env.RATE_LIMITER_MAX_REQUEST || 100000,
  message: process.env.RATE_LIMITER_MESSAGE || "Too many requests, please try again later."
});

if (process.env.ALLOWED_DOMAIN_LIST) {
  const allowedDomains = process.env.ALLOWED_DOMAIN_LIST.split(' ');
  app.use(
    cors({ origin: allowedDomains })
  );
}

app.use(limiter);
app.use(compression());
app.use(cookieParser());
app.use('/api/v1', indexRouter);

// Basic Socket.io setup for chat
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });
  
  socket.on('send_message', (data) => {
    socket.to(data.room).emit('receive_message', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

export default server;
