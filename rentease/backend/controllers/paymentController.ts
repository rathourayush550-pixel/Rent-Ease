import { Response } from 'express';
import { getDatabase, saveDatabase } from '../database/db.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { PaymentMethod } from '../models/types.ts';

export const getPayments = (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const user = req.user!;

  let payments = db.payments;

  if (user.role === 'tenant') {
    payments = payments.filter((p) => p.tenant_id === user.id);
  } else if (user.role === 'owner') {
    const ownerRentals = db.rentals.filter((r) => r.owner_id === user.id).map((r) => r.id);
    payments = payments.filter((p) => ownerRentals.includes(p.rental_id));
  }

  const enriched = payments.map((p) => {
    const rental = db.rentals.find((r) => r.id === p.rental_id);
    const property = rental ? db.properties.find((pr) => pr.id === rental.property_id) : undefined;
    const tenant = db.users.find((u) => u.id === p.tenant_id);

    return {
      ...p,
      property_title: property ? property.title : 'Rental Unit',
      property_city: property ? property.city : '',
      tenant_name: tenant ? tenant.name : 'Tenant',
      tenant_email: tenant ? tenant.email : '',
      owner_id: rental ? rental.owner_id : undefined,
    };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({
    success: true,
    payments: enriched,
  });
};

export const payRent = (req: AuthRequest, res: Response): void => {
  try {
    const { payment_id, payment_method = 'Credit Card', card_last4 } = req.body;

    if (!payment_id) {
      res.status(400).json({ success: false, message: 'Payment ID is required.' });
      return;
    }

    const db = getDatabase();
    const payment = db.payments.find((p) => p.id === Number(payment_id));

    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment record not found.' });
      return;
    }

    if (payment.tenant_id !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Unauthorized to pay this invoice.' });
      return;
    }

    if (payment.status === 'paid') {
      res.status(400).json({ success: false, message: 'This invoice is already paid.' });
      return;
    }

    const rental = db.rentals.find((r) => r.id === payment.rental_id);
    const property = rental ? db.properties.find((p) => p.id === rental.property_id) : null;

    payment.status = 'paid';
    payment.payment_method = payment_method as PaymentMethod;
    payment.paid_at = new Date().toISOString();
    payment.transaction_ref = `TXN-${Math.floor(100000 + Math.random() * 900000)}-${card_last4 || 'SUCCESS'}`;

    // Notify landlord
    if (rental) {
      const nextNotifId = db.notifications.length > 0 ? Math.max(...db.notifications.map((n) => n.id)) + 1 : 1;
      db.notifications.push({
        id: nextNotifId,
        user_id: rental.owner_id,
        title: 'Rent Payment Received',
        message: `Payment of $${payment.amount.toLocaleString()} for ${payment.month_year} (${property?.title || 'property'}) received from ${req.user!.name}.`,
        type: 'payment',
        link: '/owner/payments',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    saveDatabase();

    res.json({
      success: true,
      message: 'Payment processed successfully! Digital receipt generated.',
      payment,
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ success: false, message: 'Payment processing failed.' });
  }
};

export const getOwnerIncomeStats = (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const ownerId = req.user!.id;

  const ownerRentals = db.rentals.filter((r) => r.owner_id === ownerId);
  const rentalIds = ownerRentals.map((r) => r.id);
  const ownerPayments = db.payments.filter((p) => rentalIds.includes(p.rental_id));

  const totalCollected = ownerPayments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = ownerPayments
    .filter((p) => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalProperties = db.properties.filter((p) => p.owner_id === ownerId).length;
  const occupiedProperties = db.properties.filter((p) => p.owner_id === ownerId && !p.is_available).length;
  const occupancyRate = totalProperties > 0 ? Math.round((occupiedProperties / totalProperties) * 100) : 0;

  res.json({
    success: true,
    stats: {
      totalCollected,
      pendingAmount,
      totalProperties,
      occupiedProperties,
      occupancyRate,
      transactionCount: ownerPayments.length,
    },
  });
};
