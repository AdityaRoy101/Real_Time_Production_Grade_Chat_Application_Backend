import express from 'express';
import chatController from '../controller/chatController.js';
import { requireAuth } from '../server/middleware/auth.js';

const router = express.Router();

// authentication middleware
router.use(requireAuth);

// Conversation routes
router.get('/conversation/:userId/:otherUserId', chatController.getConversation);
router.get('/conversations/:userId', chatController.getUserConversations);

// Message routes
router.post('/messages', chatController.sendMessage);
router.get('/messages/:conversationId', chatController.getMessages);
router.post('/read', chatController.markAsRead);
router.get('/users/:userId', chatController.getAllUsers);

export default router;