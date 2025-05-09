import express from 'express';
import auth from './authRouter.js';

const router = express.Router();

// User Auth
router.use('/auth', auth);

export default router;