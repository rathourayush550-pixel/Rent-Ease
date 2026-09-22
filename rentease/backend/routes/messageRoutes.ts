import { Router } from 'express';
import { getConversations, getMessagesWithUser, sendMessage } from '../controllers/messageController.ts';
import { authenticate } from '../middleware/auth.ts';

const router = Router();

router.get('/conversations', authenticate, getConversations);
router.get('/thread/:otherUserId', authenticate, getMessagesWithUser);
router.post('/send', authenticate, sendMessage);

export default router;
