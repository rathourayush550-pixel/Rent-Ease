import { Router } from 'express';
import {
  createBookingRequest,
  getTenantBookings,
  getOwnerBookingRequests,
  updateBookingStatus,
} from '../controllers/bookingController.ts';
import { authenticate, authorize } from '../middleware/auth.ts';

const router = Router();

router.post('/', authenticate, authorize('tenant'), createBookingRequest);
router.get('/tenant', authenticate, authorize('tenant', 'admin'), getTenantBookings);
router.get('/owner', authenticate, authorize('owner', 'admin'), getOwnerBookingRequests);
router.put('/:id/status', authenticate, authorize('owner', 'admin'), updateBookingStatus);

export default router;
