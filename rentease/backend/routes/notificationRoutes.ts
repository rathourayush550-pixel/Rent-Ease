import { Router } from 'express';
import { getNotifications, markNotificationRead } from '../controllers/notificationController.ts';
import { authenticate } from '../middleware/auth.ts';

const router = Router();

router.get('/', authenticate, getNotifications);
router.put('/:id/read', authenticate, markNotificationRead);

export default router;
