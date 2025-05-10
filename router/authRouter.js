import express from 'express';
import authController from '../controller/authController.js';

const router = express.Router();

// Auth Router Functions
router.post('/login', authController.loginUser);
router.post('/signup', authController.signupUser);
router.get('/verify', authController.JwtVerify);

export default router;
