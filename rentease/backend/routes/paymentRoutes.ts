import { Router } from 'express';
import { getPayments, payRent, getOwnerIncomeStats } from '../controllers/paymentController.ts';
import { authenticate, authorize } from '../middleware/auth.ts';

const router = Router();

router.get('/', authenticate, getPayments);
router.post('/pay', authenticate, payRent);
router.get('/income-stats', authenticate, authorize('owner', 'admin'), getOwnerIncomeStats);

export default router;
