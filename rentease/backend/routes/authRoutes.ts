import { Router } from 'express';
import { register, login, getMe, updateProfile, demoLogin } from '../controllers/authController.ts';
import { authenticate } from '../middleware/auth.ts';
import { authRateLimiter } from '../middleware/rateLimiter.ts';

const router = Router();

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/demo-login', authRateLimiter, demoLogin);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);

export default router;
