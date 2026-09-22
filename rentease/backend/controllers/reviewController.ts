import { Response } from 'express';
import { getDatabase, saveDatabase } from '../database/db.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { Review } from '../models/types.ts';

export const createReview = (req: AuthRequest, res: Response): void => {
  try {
    const { property_id, rating, comment } = req.body;

    if (!property_id || !rating || !comment) {
      res.status(400).json({ success: false, message: 'Please provide property ID, rating (1-5), and comment.' });
      return;
    }

    const ratingNum = Math.min(5, Math.max(1, Number(rating)));
    const db = getDatabase();
    const property = db.properties.find((p) => p.id === Number(property_id));

    if (!property) {
      res.status(404).json({ success: false, message: 'Property not found.' });
      return;
    }

    const nextId = db.reviews.length > 0 ? Math.max(...db.reviews.map((r) => r.id)) + 1 : 1;
    const newReview: Review = {
      id: nextId,
      property_id: property.id,
      tenant_id: req.user!.id,
      rating: ratingNum,
      comment: comment.trim(),
      created_at: new Date().toISOString(),
    };

    db.reviews.push(newReview);

    // Notify landlord
    const nextNotifId = db.notifications.length > 0 ? Math.max(...db.notifications.map((n) => n.id)) + 1 : 1;
    db.notifications.push({
      id: nextNotifId,
      user_id: property.owner_id,
      title: 'New Review on Your Property',
      message: `${req.user!.name} left a ${ratingNum}-star review on "${property.title}".`,
      type: 'system',
      link: `/properties/${property.id}`,
      is_read: false,
      created_at: new Date().toISOString(),
    });

    saveDatabase();

    const tenant = db.users.find((u) => u.id === req.user!.id);

    res.status(201).json({
      success: true,
      message: 'Review published successfully.',
      review: {
        ...newReview,
        tenant_name: tenant ? tenant.name : 'Verified Tenant',
        tenant_avatar: tenant ? tenant.avatar : '',
      },
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ success: false, message: 'Failed to submit review.' });
  }
};

export const getReviews = (req: AuthRequest, res: Response): void => {
  const { propertyId } = req.query;
  const db = getDatabase();

  let list = db.reviews;
  if (propertyId) {
    list = list.filter((r) => r.property_id === Number(propertyId));
  }

  const enriched = list.map((r) => {
    const tenant = db.users.find((u) => u.id === r.tenant_id);
    const property = db.properties.find((p) => p.id === r.property_id);
    return {
      ...r,
      tenant_name: tenant ? tenant.name : 'Verified Tenant',
      tenant_avatar: tenant ? tenant.avatar : '',
      property_title: property ? property.title : 'Property',
    };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({
    success: true,
    reviews: enriched,
  });
};

export const deleteReview = (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const db = getDatabase();
  const index = db.reviews.findIndex((r) => r.id === Number(id));

  if (index === -1) {
    res.status(404).json({ success: false, message: 'Review not found.' });
    return;
  }

  const review = db.reviews[index];
  if (req.user?.role !== 'admin' && review.tenant_id !== req.user?.id) {
    res.status(403).json({ success: false, message: 'Unauthorized to delete this review.' });
    return;
  }

  db.reviews.splice(index, 1);
  saveDatabase();

  res.json({
    success: true,
    message: 'Review deleted successfully.',
  });
};
