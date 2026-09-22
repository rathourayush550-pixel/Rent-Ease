import { Response } from 'express';
import { getDatabase, saveDatabase } from '../database/db.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { MaintenanceRequest, MaintenanceCategory, MaintenancePriority, MaintenanceStatus } from '../models/types.ts';

export const createMaintenanceRequest = (req: AuthRequest, res: Response): void => {
  try {
    const {
      rental_id,
      title,
      description,
      category = 'Plumbing',
      priority = 'medium',
      image_url,
    } = req.body;

    if (!rental_id || !title || !description) {
      res.status(400).json({ success: false, message: 'Please provide rental lease ID, title, and issue details.' });
      return;
    }

    const db = getDatabase();
    const rental = db.rentals.find((r) => r.id === Number(rental_id));

    if (!rental) {
      res.status(404).json({ success: false, message: 'Active rental agreement not found.' });
      return;
    }

    if (rental.tenant_id !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'You can only raise complaints for your active rentals.' });
      return;
    }

    const nextId = db.maintenance_requests.length > 0 ? Math.max(...db.maintenance_requests.map((m) => m.id)) + 1 : 1;
    const newRequest: MaintenanceRequest = {
      id: nextId,
      rental_id: rental.id,
      property_id: rental.property_id,
      tenant_id: req.user!.id,
      title: title.trim(),
      description: description.trim(),
      category: category as MaintenanceCategory,
      priority: priority as MaintenancePriority,
      status: 'pending',
      image_url: image_url || undefined,
      created_at: new Date().toISOString(),
    };

    db.maintenance_requests.push(newRequest);

    // Notify owner
    const prop = db.properties.find((p) => p.id === rental.property_id);
    const nextNotifId = db.notifications.length > 0 ? Math.max(...db.notifications.map((n) => n.id)) + 1 : 1;
    db.notifications.push({
      id: nextNotifId,
      user_id: rental.owner_id,
      title: `Maintenance Complaint: ${priority.toUpperCase()} Priority`,
      message: `Tenant ${req.user!.name} reported: "${title}" at ${prop?.title || 'property'}.`,
      type: 'maintenance',
      link: '/owner/maintenance',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    saveDatabase();

    res.status(201).json({
      success: true,
      message: 'Maintenance ticket created successfully. The property manager has been notified.',
      request: newRequest,
    });
  } catch (error) {
    console.error('Error creating maintenance request:', error);
    res.status(500).json({ success: false, message: 'Failed to create maintenance complaint.' });
  }
};

export const getMaintenanceRequests = (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const user = req.user!;

  let list = db.maintenance_requests;

  if (user.role === 'tenant') {
    list = list.filter((m) => m.tenant_id === user.id);
  } else if (user.role === 'owner') {
    const ownerPropertyIds = db.properties.filter((p) => p.owner_id === user.id).map((p) => p.id);
    list = list.filter((m) => ownerPropertyIds.includes(m.property_id));
  }

  const enriched = list.map((m) => {
    const property = db.properties.find((p) => p.id === m.property_id);
    const tenant = db.users.find((u) => u.id === m.tenant_id);

    return {
      ...m,
      property_title: property ? property.title : 'Property Unit',
      property_address: property ? `${property.address}, ${property.city}` : '',
      tenant_name: tenant ? tenant.name : 'Tenant',
      tenant_phone: tenant ? tenant.phone : '',
      owner_id: property ? property.owner_id : undefined,
    };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({
    success: true,
    requests: enriched,
  });
};

export const updateMaintenanceStatus = (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const { status, resolution_notes } = req.body;

    if (!['pending', 'in_progress', 'resolved'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid maintenance status.' });
      return;
    }

    const db = getDatabase();
    const item = db.maintenance_requests.find((m) => m.id === Number(id));

    if (!item) {
      res.status(404).json({ success: false, message: 'Maintenance ticket not found.' });
      return;
    }

    const property = db.properties.find((p) => p.id === item.property_id);
    if (req.user?.role !== 'admin' && property?.owner_id !== req.user?.id) {
      res.status(403).json({ success: false, message: 'Unauthorized to update this complaint.' });
      return;
    }

    item.status = status as MaintenanceStatus;
    if (resolution_notes !== undefined) {
      item.resolution_notes = resolution_notes;
    }
    if (status === 'resolved') {
      item.resolved_at = new Date().toISOString();
    }
    item.updated_at = new Date().toISOString();

    // Notify tenant
    const nextNotifId = db.notifications.length > 0 ? Math.max(...db.notifications.map((n) => n.id)) + 1 : 1;
    db.notifications.push({
      id: nextNotifId,
      user_id: item.tenant_id,
      title: `Maintenance Update: ${status.replace('_', ' ').toUpperCase()}`,
      message: `Your maintenance ticket "${item.title}" status changed to ${status.replace('_', ' ')}.`,
      type: 'maintenance',
      link: '/tenant/maintenance',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    saveDatabase();

    res.json({
      success: true,
      message: `Maintenance status updated to ${status}.`,
      request: item,
    });
  } catch (error) {
    console.error('Error updating maintenance status:', error);
    res.status(500).json({ success: false, message: 'Failed to update maintenance status.' });
  }
};
