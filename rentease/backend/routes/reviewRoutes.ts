import { Router } from 'express';
import { createReview, getReviews, deleteReview } from '../controllers/reviewController.ts';
import { authenticate, authorize } from '../middleware/auth.ts';

const router = Router();

router.get('/', getReviews);
router.post('/', authenticate, authorize('tenant'), createReview);
router.delete('/:id', authenticate, deleteReview);

export default router;
