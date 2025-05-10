import express from 'express';
import chatController from '../controller/chatController.js';

const router = express.Router();

// Conversation routes
router.get('/conversation/:userId/:otherUserId', chatController.getConversation);
router.get('/conversations/:userId', chatController.getUserConversations);

// Message routes
router.post('/message', chatController.sendMessage);
router.get('/messages/:conversationId', chatController.getMessages);
router.post('/read', chatController.markAsRead);
router.get('/users/:userId', chatController.getAllUsers);

export default router;