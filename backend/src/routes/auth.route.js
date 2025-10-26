import { Router } from 'express';
const router = Router();
import { login, logout, signup, updateProfile } from '../controllers/auth.controller.js';
import { protectRouter } from '../middleware/auth.middleware.js';

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.put('/update-profile', protectRouter, updateProfile);

export default router;