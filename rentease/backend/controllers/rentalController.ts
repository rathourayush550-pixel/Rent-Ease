import { Response } from 'express';
import { getDatabase, saveDatabase } from '../database/db.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { enrichProperty } from './propertyController.ts';

export const getRentals = (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const user = req.user!;

  let rentals = db.rentals;

  if (user.role === 'tenant') {
    rentals = rentals.filter((r) => r.tenant_id === user.id);
  } else if (user.role === 'owner') {
    rentals = rentals.filter((r) => r.owner_id === user.id);
  }

  const enriched = rentals.map((r) => {
    const property = db.properties.find((p) => p.id === r.property_id);
    const tenant = db.users.find((u) => u.id === r.tenant_id);
    const owner = db.users.find((u) => u.id === r.owner_id);

    const { password: _p1, ...cleanTenant } = tenant || {};
    const { password: _p2, ...cleanOwner } = owner || {};

    return {
      ...r,
      property: property ? enrichProperty(property, db) : undefined,
      tenant: cleanTenant,
      owner: cleanOwner,
    };
  });

  res.json({
    success: true,
    rentals: enriched,
  });
};

export const getRentalById = (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const db = getDatabase();
  const rental = db.rentals.find((r) => r.id === Number(id));

  if (!rental) {
    res.status(404).json({ success: false, message: 'Rental lease not found.' });
    return;
  }

  const user = req.user!;
  if (user.role !== 'admin' && rental.tenant_id !== user.id && rental.owner_id !== user.id) {
    res.status(403).json({ success: false, message: 'Unauthorized access to this lease.' });
    return;
  }

  const property = db.properties.find((p) => p.id === rental.property_id);
  const tenant = db.users.find((u) => u.id === rental.tenant_id);
  const owner = db.users.find((u) => u.id === rental.owner_id);
  const payments = db.payments.filter((p) => p.rental_id === rental.id);
  const maintenance = db.maintenance_requests.filter((m) => m.rental_id === rental.id);

  const { password: _p1, ...cleanTenant } = tenant || {};
  const { password: _p2, ...cleanOwner } = owner || {};

  res.json({
    success: true,
    rental: {
      ...rental,
      property: property ? enrichProperty(property, db) : undefined,
      tenant: cleanTenant,
      owner: cleanOwner,
      payments,
      maintenance,
    },
  });
};

export const terminateRental = (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const db = getDatabase();
  const rental = db.rentals.find((r) => r.id === Number(id));

  if (!rental) {
    res.status(404).json({ success: false, message: 'Rental lease not found.' });
    return;
  }

  if (req.user?.role !== 'admin' && rental.owner_id !== req.user?.id) {
    res.status(403).json({ success: false, message: 'Only owner or administrator can terminate lease.' });
    return;
  }

  rental.status = 'terminated';
  rental.updated_at = new Date().toISOString();

  // Restore property availability
  const property = db.properties.find((p) => p.id === rental.property_id);
  if (property) {
    property.is_available = true;
  }

  saveDatabase();

  res.json({
    success: true,
    message: 'Rental agreement terminated. Property availability restored.',
    rental,
  });
};
