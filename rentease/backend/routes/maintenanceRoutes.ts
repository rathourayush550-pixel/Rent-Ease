import { Router } from 'express';
import {
  createMaintenanceRequest,
  getMaintenanceRequests,
  updateMaintenanceStatus,
} from '../controllers/maintenanceController.ts';
import { authenticate, authorize } from '../middleware/auth.ts';

const router = Router();

router.get('/', authenticate, getMaintenanceRequests);
router.post('/', authenticate, authorize('tenant'), createMaintenanceRequest);
router.put('/:id/status', authenticate, authorize('owner', 'admin'), updateMaintenanceStatus);

export default router;
