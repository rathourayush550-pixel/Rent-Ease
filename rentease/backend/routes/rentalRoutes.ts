import { Router } from 'express';
import { getRentals, getRentalById, terminateRental } from '../controllers/rentalController.ts';
import { authenticate, authorize } from '../middleware/auth.ts';

const router = Router();

router.get('/', authenticate, getRentals);
router.get('/:id', authenticate, getRentalById);
router.put('/:id/terminate', authenticate, authorize('owner', 'admin'), terminateRental);

export default router;
