import express from 'express';
import auth from './authRouter.js';
import chat from './chatRouter.js';

const router = express.Router();

// User Auth
router.use('/auth', auth);
// Chat routes
router.use('/chat', chat);

export default router;