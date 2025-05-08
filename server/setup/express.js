'use strict';
import express from 'express';
// import http from 'http';
import socketIo from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import bodyParser from 'body-parser';


export const app = express();
app.use((req, res, next) => {
	res.header('Access-Control-Max-Age', '86400');
	next();
});

var indexRouter = require('../../router/index');
app.use(bodyParser.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.resolve(__dirname, '../../public')));
// ============================================XXXXXXXXXXXXXXXXX=================================

// Main server file - sets up Express and Socket.IO
// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Import routes
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Set up Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Chat API is running');
});

// Initialize Socket.IO
require('./socket')(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));