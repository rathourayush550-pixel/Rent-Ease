import { Response } from 'express';
import { getDatabase, saveDatabase } from '../database/db.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { enrichProperty } from './propertyController.ts';

export const getAdminStats = (_req: AuthRequest, res: Response): void => {
  const db = getDatabase();

  const totalUsers = db.users.length;
  const tenantsCount = db.users.filter((u) => u.role === 'tenant').length;
  const ownersCount = db.users.filter((u) => u.role === 'owner').length;
  const pendingOwners = db.users.filter((u) => u.role === 'owner' && !u.is_verified).length;

  const totalProperties = db.properties.length;
  const approvedProperties = db.properties.filter((p) => p.approval_status === 'approved').length;
  const pendingProperties = db.properties.filter((p) => p.approval_status === 'pending').length;

  const activeRentals = db.rentals.filter((r) => r.status === 'active').length;
  const totalBookings = db.bookings.length;

  const totalRentCollected = db.payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingComplaints = db.maintenance_requests.filter((m) => m.status === 'pending' || m.status === 'in_progress').length;

  // Property distribution by type
  const propertyTypesMap: Record<string, number> = {};
  db.properties.forEach((p) => {
    propertyTypesMap[p.property_type] = (propertyTypesMap[p.property_type] || 0) + 1;
  });

  // City breakdown
  const cityMap: Record<string, number> = {};
  db.properties.forEach((p) => {
    cityMap[p.city] = (cityMap[p.city] || 0) + 1;
  });

  res.json({
    success: true,
    stats: {
      totalUsers,
      tenantsCount,
      ownersCount,
      pendingOwners,
      totalProperties,
      approvedProperties,
      pendingProperties,
      activeRentals,
      totalBookings,
      totalRentCollected,
      pendingComplaints,
      propertyTypesMap,
      cityMap,
      tableCounts: {
        users: db.users.length,
        properties: db.properties.length,
        property_images: db.property_images.length,
        amenities: db.amenities.length,
        property_amenities: db.property_amenities.length,
        bookings: db.bookings.length,
        rentals: db.rentals.length,
        payments: db.payments.length,
        maintenance_requests: db.maintenance_requests.length,
        reviews: db.reviews.length,
        messages: db.messages.length,
        notifications: db.notifications.length,
      },
    },
  });
};

export const getAllUsers = (req: AuthRequest, res: Response): void => {
  const { role, search } = req.query;
  const db = getDatabase();

  let list = db.users;
  if (role && role !== 'all') {
    list = list.filter((u) => u.role === role);
  }

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }

  const sanitized = list.map((u) => {
    const { password: _, ...rest } = u;
    const propertyCount = db.properties.filter((p) => p.owner_id === u.id).length;
    const rentalCount = db.rentals.filter((r) => r.tenant_id === u.id).length;
    return {
      ...rest,
      propertyCount: u.role === 'owner' ? propertyCount : undefined,
      rentalCount: u.role === 'tenant' ? rentalCount : undefined,
    };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({
    success: true,
    users: sanitized,
  });
};

export const toggleUserBlock = (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const db = getDatabase();
  const user = db.users.find((u) => u.id === Number(id));

  if (!user) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  if (user.role === 'admin') {
    res.status(400).json({ success: false, message: 'Administrators cannot be blocked.' });
    return;
  }

  user.is_blocked = !user.is_blocked;
  user.updated_at = new Date().toISOString();
  saveDatabase();

  res.json({
    success: true,
    message: user.is_blocked ? `User ${user.name} has been blocked.` : `User ${user.name} has been unblocked.`,
    user: {
      id: user.id,
      name: user.name,
      is_blocked: user.is_blocked,
    },
  });
};

export const verifyOwner = (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const db = getDatabase();
  const user = db.users.find((u) => u.id === Number(id));

  if (!user || user.role !== 'owner') {
    res.status(404).json({ success: false, message: 'Property owner account not found.' });
    return;
  }

  user.is_verified = true;
  user.updated_at = new Date().toISOString();

  // Also auto-approve their pending properties
  db.properties
    .filter((p) => p.owner_id === user.id && p.approval_status === 'pending')
    .forEach((p) => {
      p.approval_status = 'approved';
    });

  // Notify owner
  const nextNotifId = db.notifications.length > 0 ? Math.max(...db.notifications.map((n) => n.id)) + 1 : 1;
  db.notifications.push({
    id: nextNotifId,
    user_id: user.id,
    title: 'Landlord Account Verified! 🛡️',
    message: 'Your property owner profile has been officially verified by administrators.',
    type: 'system',
    link: '/owner/properties',
    is_read: false,
    created_at: new Date().toISOString(),
  });

  saveDatabase();

  res.json({
    success: true,
    message: `Owner ${user.name} verified successfully.`,
    user,
  });
};

export const updatePropertyApproval = (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const { status, rejection_reason } = req.body; // 'approved' | 'rejected'

  if (!['approved', 'rejected', 'pending'].includes(status)) {
    res.status(400).json({ success: false, message: 'Invalid approval status.' });
    return;
  }

  const db = getDatabase();
  const property = db.properties.find((p) => p.id === Number(id));

  if (!property) {
    res.status(404).json({ success: false, message: 'Property not found.' });
    return;
  }

  property.approval_status = status;
  if (rejection_reason) property.rejection_reason = rejection_reason;
  property.updated_at = new Date().toISOString();

  // Notify owner
  const nextNotifId = db.notifications.length > 0 ? Math.max(...db.notifications.map((n) => n.id)) + 1 : 1;
  db.notifications.push({
    id: nextNotifId,
    user_id: property.owner_id,
    title: status === 'approved' ? 'Listing Approved & Live!' : 'Listing Review Update',
    message: status === 'approved'
      ? `"${property.title}" was approved by an admin and is now visible to tenants.`
      : `"${property.title}" was rejected: ${rejection_reason || 'Requires revisions.'}`,
    type: 'system',
    link: '/owner/properties',
    is_read: false,
    created_at: new Date().toISOString(),
  });

  saveDatabase();

  res.json({
    success: true,
    message: `Listing status updated to ${status}.`,
    property: enrichProperty(property, db),
  });
};

export const getRawDatabaseSchema = (_req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  res.json({
    success: true,
    engine: 'Relational Entity Storage Engine (3NF)',
    tables: [
      { name: 'users', rows: db.users.length, primary_key: 'id' },
      { name: 'properties', rows: db.properties.length, primary_key: 'id', foreign_keys: ['owner_id -> users(id)'] },
      { name: 'property_images', rows: db.property_images.length, primary_key: 'id', foreign_keys: ['property_id -> properties(id)'] },
      { name: 'amenities', rows: db.amenities.length, primary_key: 'id' },
      { name: 'property_amenities', rows: db.property_amenities.length, primary_key: '(property_id, amenity_id)', foreign_keys: ['property_id -> properties(id)', 'amenity_id -> amenities(id)'] },
      { name: 'bookings', rows: db.bookings.length, primary_key: 'id', foreign_keys: ['property_id -> properties(id)', 'tenant_id -> users(id)'] },
      { name: 'rentals', rows: db.rentals.length, primary_key: 'id', foreign_keys: ['booking_id -> bookings(id)', 'property_id -> properties(id)', 'tenant_id -> users(id)', 'owner_id -> users(id)'] },
      { name: 'payments', rows: db.payments.length, primary_key: 'id', foreign_keys: ['rental_id -> rentals(id)', 'tenant_id -> users(id)'] },
      { name: 'maintenance_requests', rows: db.maintenance_requests.length, primary_key: 'id', foreign_keys: ['rental_id -> rentals(id)', 'tenant_id -> users(id)'] },
      { name: 'reviews', rows: db.reviews.length, primary_key: 'id', foreign_keys: ['property_id -> properties(id)', 'tenant_id -> users(id)'] },
      { name: 'messages', rows: db.messages.length, primary_key: 'id', foreign_keys: ['sender_id -> users(id)', 'receiver_id -> users(id)'] },
      { name: 'notifications', rows: db.notifications.length, primary_key: 'id', foreign_keys: ['user_id -> users(id)'] },
    ],
  });
};
