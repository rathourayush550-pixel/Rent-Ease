import { Router } from 'express';
import {
  getAdminStats,
  getAllUsers,
  toggleUserBlock,
  verifyOwner,
  updatePropertyApproval,
  getRawDatabaseSchema,
} from '../controllers/adminController.ts';
import { authenticate, authorize } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.put('/users/:id/block', toggleUserBlock);
router.put('/owners/:id/verify', verifyOwner);
router.put('/properties/:id/approval', updatePropertyApproval);
router.get('/database-schema', getRawDatabaseSchema);

export default router;
