import { Response } from 'express';
import { getDatabase, saveDatabase } from '../database/db.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { Booking, Rental, Payment } from '../models/types.ts';
import { enrichProperty } from './propertyController.ts';

export const createBookingRequest = (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required to submit booking.' });
      return;
    }

    const {
      property_id,
      move_in_date,
      lease_duration_months = 12,
      occupants_count = 1,
      message,
    } = req.body;

    if (!property_id || !move_in_date) {
      res.status(400).json({ success: false, message: 'Please provide property ID and target move-in date.' });
      return;
    }

    const db = getDatabase();
    const property = db.properties.find((p) => p.id === Number(property_id));

    if (!property) {
      res.status(404).json({ success: false, message: 'Property not found.' });
      return;
    }

    if (!property.is_available) {
      res.status(400).json({ success: false, message: 'This property is currently occupied or unavailable.' });
      return;
    }

    // Check if tenant already has an active or pending booking for this property
    const existingBooking = db.bookings.find(
      (b) => b.property_id === property.id && b.tenant_id === req.user!.id && (b.status === 'pending' || b.status === 'accepted')
    );

    if (existingBooking) {
      res.status(400).json({
        success: false,
        message: 'You already have an active or pending rental application for this property.',
      });
      return;
    }

    const newBookingId = db.bookings.length > 0 ? Math.max(...db.bookings.map((b) => b.id)) + 1 : 1;
    const newBooking: Booking = {
      id: newBookingId,
      property_id: property.id,
      tenant_id: req.user.id,
      move_in_date,
      lease_duration_months: Number(lease_duration_months),
      occupants_count: Number(occupants_count),
      status: 'pending',
      message: message ? message.trim() : '',
      created_at: new Date().toISOString(),
    };

    db.bookings.push(newBooking);

    // Notify owner
    const nextNotifId = db.notifications.length > 0 ? Math.max(...db.notifications.map((n) => n.id)) + 1 : 1;
    db.notifications.push({
      id: nextNotifId,
      user_id: property.owner_id,
      title: 'New Rental Application Received',
      message: `${req.user.name} applied to rent "${property.title}" starting ${move_in_date}.`,
      type: 'booking',
      link: '/owner/requests',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    saveDatabase();

    res.status(201).json({
      success: true,
      message: 'Rental application submitted successfully. The property owner will review your request.',
      booking: newBooking,
    });
  } catch (error) {
    console.error('Error submitting booking request:', error);
    res.status(500).json({ success: false, message: 'Failed to submit rental request.' });
  }
};

export const getTenantBookings = (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const bookings = db.bookings
    .filter((b) => b.tenant_id === req.user!.id)
    .map((b) => {
      const prop = db.properties.find((p) => p.id === b.property_id);
      return {
        ...b,
        property: prop ? enrichProperty(prop, db) : undefined,
      };
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({
    success: true,
    bookings,
  });
};

export const getOwnerBookingRequests = (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const ownerProperties = db.properties.filter((p) => p.owner_id === req.user!.id).map((p) => p.id);

  const bookings = db.bookings
    .filter((b) => ownerProperties.includes(b.property_id))
    .map((b) => {
      const prop = db.properties.find((p) => p.id === b.property_id);
      const tenant = db.users.find((u) => u.id === b.tenant_id);
      const { password: _, ...tenantClean } = tenant || {};
      return {
        ...b,
        property: prop ? enrichProperty(prop, db) : undefined,
        tenant: tenantClean,
      };
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({
    success: true,
    requests: bookings,
  });
};

export const updateBookingStatus = (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const { status, rejection_note } = req.body; // 'accepted' or 'rejected'

    if (!['accepted', 'rejected', 'cancelled'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status update.' });
      return;
    }

    const db = getDatabase();
    const booking = db.bookings.find((b) => b.id === Number(id));

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking request not found.' });
      return;
    }

    const property = db.properties.find((p) => p.id === booking.property_id);
    if (!property) {
      res.status(404).json({ success: false, message: 'Property not found.' });
      return;
    }

    // Authorization check
    if (req.user?.role !== 'admin' && property.owner_id !== req.user?.id) {
      res.status(403).json({ success: false, message: 'Unauthorized to respond to this request.' });
      return;
    }

    booking.status = status;
    if (rejection_note) booking.rejection_note = rejection_note;
    booking.updated_at = new Date().toISOString();

    let createdRental: Rental | null = null;

    if (status === 'accepted') {
      // 1. Mark property as occupied
      property.is_available = false;

      // 2. Reject other pending bookings for this property automatically
      db.bookings.forEach((otherB) => {
        if (otherB.property_id === property.id && otherB.id !== booking.id && otherB.status === 'pending') {
          otherB.status = 'rejected';
          otherB.rejection_note = 'Property was leased to another applicant.';
        }
      });

      // 3. Create active Rental lease
      const nextRentalId = db.rentals.length > 0 ? Math.max(...db.rentals.map((r) => r.id)) + 1 : 1;
      const startDate = new Date(booking.move_in_date);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + (booking.lease_duration_months || 12));

      createdRental = {
        id: nextRentalId,
        booking_id: booking.id,
        property_id: property.id,
        tenant_id: booking.tenant_id,
        owner_id: property.owner_id,
        monthly_rent: property.monthly_rent,
        security_deposit: property.security_deposit,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'active',
        created_at: new Date().toISOString(),
      };
      db.rentals.push(createdRental);

      // 4. Generate initial payment invoices (Security Deposit + First Month Rent)
      let nextPaymentId = db.payments.length > 0 ? Math.max(...db.payments.map((p) => p.id)) + 1 : 1;
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const currentMonth = `${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}`;

      // Security deposit
      db.payments.push({
        id: nextPaymentId++,
        rental_id: nextRentalId,
        tenant_id: booking.tenant_id,
        amount: property.security_deposit,
        payment_type: 'Security Deposit',
        month_year: 'Initial Move-in',
        payment_method: 'Bank Transfer',
        transaction_ref: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

      // First month rent
      db.payments.push({
        id: nextPaymentId++,
        rental_id: nextRentalId,
        tenant_id: booking.tenant_id,
        amount: property.monthly_rent,
        payment_type: 'Rent',
        month_year: currentMonth,
        payment_method: 'Bank Transfer',
        transaction_ref: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    }

    // Send notification to Tenant
    const nextNotifId = db.notifications.length > 0 ? Math.max(...db.notifications.map((n) => n.id)) + 1 : 1;
    db.notifications.push({
      id: nextNotifId,
      user_id: booking.tenant_id,
      title: status === 'accepted' ? 'Rental Request Accepted! 🎉' : 'Rental Request Update',
      message: status === 'accepted'
        ? `Congratulations! Your rental request for "${property.title}" has been accepted. Your active lease has started.`
        : `Your rental application for "${property.title}" was not approved at this time.`,
      type: status === 'accepted' ? 'rental' : 'booking',
      link: status === 'accepted' ? '/tenant/rentals' : '/tenant/bookings',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    saveDatabase();

    res.json({
      success: true,
      message: status === 'accepted'
        ? 'Application approved! Active lease created and payment records generated.'
        : 'Application status updated.',
      booking,
      rental: createdRental,
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking status.' });
  }
};
