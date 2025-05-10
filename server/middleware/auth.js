import jwt from 'jsonwebtoken';
import UserSchema from '../models/mongo_collections/userModel.js';

// Authentication middleware
export const requireAuth = async (req, res, next) => {
  // Trying cookie-based auth first
  const token = req.cookies.token;
  
  // Then trying Bearer token from Authorization header
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;
  
  const finalToken = token || bearerToken;
  
  if (!finalToken) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(finalToken, process.env.SECRET);
    
    const user = await UserSchema.findById(decoded._id).select('_id name email');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    console.error('Authentication middleware error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Socket.io authentication middleware
export const socketAuth = async (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    socket.decoded = decoded;
    socket.userId = decoded._id;
    
    // Checking if user exists in database
    const user = await UserSchema.findById(decoded._id);
    if (!user) {
      return next(new Error('User not found'));
    }
    
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
};