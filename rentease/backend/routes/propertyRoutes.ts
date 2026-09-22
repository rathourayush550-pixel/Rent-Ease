import { Router } from 'express';
import {
  getProperties,
  getFeaturedProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getAmenities,
} from '../controllers/propertyController.ts';
import { authenticate, optionalAuthenticate, authorize } from '../middleware/auth.ts';

const router = Router();

router.get('/', optionalAuthenticate, getProperties);
router.get('/featured', getFeaturedProperties);
router.get('/amenities', getAmenities);
router.get('/:id', optionalAuthenticate, getPropertyById);
router.post('/', authenticate, authorize('owner', 'admin'), createProperty);
router.put('/:id', authenticate, authorize('owner', 'admin'), updateProperty);
router.delete('/:id', authenticate, authorize('owner', 'admin'), deleteProperty);

export default router;
