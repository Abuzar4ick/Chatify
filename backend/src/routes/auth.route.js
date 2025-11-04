import { Router } from 'express';
const router = Router();
import { login, logout, signup, updateProfile } from '../controllers/auth.controller.js';
import { protectRouter } from '../middleware/auth.middleware.js';
import { arcjetProtection } from '../middleware/arcjet.middleware.js';

router.use(arcjetProtection);

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.put('/update-profile', protectRouter, updateProfile);

router.get("/check", protectRouter, (req, res) => res.status(200).json(req.user));

export default router;