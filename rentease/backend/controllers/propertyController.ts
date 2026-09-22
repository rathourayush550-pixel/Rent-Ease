import { Response } from 'express';
import { getDatabase, saveDatabase } from '../database/db.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { Property, PropertyType, FurnishedStatus } from '../models/types.ts';

export const enrichProperty = (property: Property, db = getDatabase()): Property => {
  const owner = db.users.find((u) => u.id === property.owner_id);
  const images = db.property_images
    .filter((img) => img.property_id === property.id)
    .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
    .map((img) => img.image_url);

  const amenityIds = db.property_amenities
    .filter((pa) => pa.property_id === property.id)
    .map((pa) => pa.amenity_id);

  const amenities = db.amenities
    .filter((a) => amenityIds.includes(a.id))
    .map((a) => a.name);

  const reviews = db.reviews.filter((r) => r.property_id === property.id);
  const average_rating =
    reviews.length > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
      : 5.0;

  return {
    ...property,
    owner_name: owner ? owner.name : 'Verified Landlord',
    owner_email: owner ? owner.email : '',
    owner_phone: owner ? owner.phone : '',
    owner_avatar: owner ? owner.avatar : '',
    owner_verified: owner ? owner.is_verified : false,
    images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'],
    amenities,
    average_rating,
    review_count: reviews.length,
  };
};

export const getProperties = (req: AuthRequest, res: Response): void => {
  try {
    const {
      search,
      city,
      type,
      furnished,
      minPrice,
      maxPrice,
      bedrooms,
      amenities,
      ownerId,
      status, // 'all', 'approved', 'pending'
      sort = 'newest',
    } = req.query;

    const db = getDatabase();
    let results = db.properties.map((p) => enrichProperty(p, db));

    // Admin or specific owner filter
    if (ownerId) {
      results = results.filter((p) => p.owner_id === Number(ownerId));
    } else if (req.user?.role !== 'admin') {
      // General public/tenant view: only show approved
      results = results.filter((p) => p.approval_status === 'approved');
    }

    if (status && req.user?.role === 'admin') {
      if (status !== 'all') {
        results = results.filter((p) => p.approval_status === status);
      }
    }

    // Search keyword (matches title, description, city, address)
    if (search) {
      const q = String(search).toLowerCase().trim();
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.state.toLowerCase().includes(q)
      );
    }

    if (city) {
      const c = String(city).toLowerCase().trim();
      results = results.filter((p) => p.city.toLowerCase().includes(c));
    }

    if (type && type !== 'all') {
      results = results.filter((p) => p.property_type.toLowerCase() === String(type).toLowerCase());
    }

    if (furnished && furnished !== 'all') {
      results = results.filter((p) => p.furnished_status.toLowerCase() === String(furnished).toLowerCase());
    }

    if (minPrice) {
      results = results.filter((p) => p.monthly_rent >= Number(minPrice));
    }

    if (maxPrice) {
      results = results.filter((p) => p.monthly_rent <= Number(maxPrice));
    }

    if (bedrooms && bedrooms !== 'all') {
      const beds = Number(bedrooms);
      if (beds >= 4) {
        results = results.filter((p) => p.bedrooms >= 4);
      } else {
        results = results.filter((p) => p.bedrooms === beds);
      }
    }

    if (amenities) {
      const requiredAmenities = String(amenities).split(',').map((a) => a.trim().toLowerCase());
      results = results.filter((p) =>
        requiredAmenities.every((reqAmenity) =>
          (p.amenities || []).some((pa) => pa.toLowerCase().includes(reqAmenity))
        )
      );
    }

    // Sorting
    if (sort === 'price_asc') {
      results.sort((a, b) => a.monthly_rent - b.monthly_rent);
    } else if (sort === 'price_desc') {
      results.sort((a, b) => b.monthly_rent - a.monthly_rent);
    } else if (sort === 'rating') {
      results.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
    } else {
      // newest
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    res.json({
      success: true,
      count: results.length,
      properties: results,
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve properties.' });
  }
};

export const getFeaturedProperties = (_req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const approved = db.properties
    .filter((p) => p.approval_status === 'approved')
    .map((p) => enrichProperty(p, db))
    .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
    .slice(0, 6);

  res.json({
    success: true,
    properties: approved,
  });
};

export const getPropertyById = (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const db = getDatabase();
  const property = db.properties.find((p) => p.id === Number(id));

  if (!property) {
    res.status(404).json({ success: false, message: 'Property not found.' });
    return;
  }

  const enriched = enrichProperty(property, db);
  const reviews = db.reviews
    .filter((r) => r.property_id === property.id)
    .map((r) => {
      const tenant = db.users.find((u) => u.id === r.tenant_id);
      return {
        ...r,
        tenant_name: tenant ? tenant.name : 'Verified Tenant',
        tenant_avatar: tenant ? tenant.avatar : '',
      };
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({
    success: true,
    property: enriched,
    reviews,
  });
};

export const createProperty = (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user || (req.user.role !== 'owner' && req.user.role !== 'admin')) {
      res.status(403).json({ success: false, message: 'Only registered owners or admins can list properties.' });
      return;
    }

    const {
      title,
      description,
      address,
      city,
      state,
      zip_code,
      property_type = 'Apartment',
      monthly_rent,
      security_deposit,
      furnished_status = 'Furnished',
      bedrooms = 1,
      bathrooms = 1,
      area_sqft = 600,
      amenities = [], // string array or ID array
      images = [], // string array of URLs
    } = req.body;

    if (!title || !description || !address || !city || !monthly_rent) {
      res.status(400).json({ success: false, message: 'Please provide all required fields.' });
      return;
    }

    const db = getDatabase();
    const newPropertyId = db.properties.length > 0 ? Math.max(...db.properties.map((p) => p.id)) + 1 : 1;

    // By default, if the owner is already verified by admin, auto-approve; otherwise set to pending
    const isAutoApproved = req.user.role === 'admin' || req.user.is_verified;

    const newProperty: Property = {
      id: newPropertyId,
      owner_id: req.user.id,
      title: title.trim(),
      description: description.trim(),
      address: address.trim(),
      city: city.trim(),
      state: (state || 'CA').trim(),
      zip_code: (zip_code || '90001').trim(),
      property_type: property_type as PropertyType,
      monthly_rent: Number(monthly_rent),
      security_deposit: Number(security_deposit || monthly_rent),
      furnished_status: furnished_status as FurnishedStatus,
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      area_sqft: Number(area_sqft),
      is_available: true,
      approval_status: isAutoApproved ? 'approved' : 'pending',
      created_at: new Date().toISOString(),
    };

    db.properties.push(newProperty);

    // Save images
    const imageList = Array.isArray(images) && images.length > 0
      ? images
      : ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'];

    let nextImgId = db.property_images.length > 0 ? Math.max(...db.property_images.map((i) => i.id)) + 1 : 1;
    imageList.forEach((url: string, index: number) => {
      db.property_images.push({
        id: nextImgId++,
        property_id: newPropertyId,
        image_url: url.trim(),
        is_primary: index === 0,
      });
    });

    // Save amenities
    if (Array.isArray(amenities)) {
      amenities.forEach((amenityInput: string | number) => {
        let amenityId = typeof amenityInput === 'number' ? amenityInput : null;
        if (!amenityId) {
          const match = db.amenities.find((a) => a.name.toLowerCase() === String(amenityInput).toLowerCase());
          if (match) amenityId = match.id;
        }

        if (amenityId) {
          db.property_amenities.push({
            property_id: newPropertyId,
            amenity_id: amenityId,
          });
        }
      });
    }

    // Notify admins if pending
    if (!isAutoApproved) {
      const admins = db.users.filter((u) => u.role === 'admin');
      let nextNotifId = db.notifications.length > 0 ? Math.max(...db.notifications.map((n) => n.id)) + 1 : 1;
      admins.forEach((admin) => {
        db.notifications.push({
          id: nextNotifId++,
          user_id: admin.id,
          title: 'New Property Listing for Review',
          message: `"${newProperty.title}" was submitted by ${req.user!.name} and awaits approval.`,
          type: 'system',
          link: '/admin/properties',
          is_read: false,
          created_at: new Date().toISOString(),
        });
      });
    }

    saveDatabase();

    res.status(201).json({
      success: true,
      message: isAutoApproved
        ? 'Property published successfully!'
        : 'Property submitted! It is currently pending admin verification.',
      property: enrichProperty(newProperty, db),
    });
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ success: false, message: 'Failed to create property.' });
  }
};

export const updateProperty = (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const property = db.properties.find((p) => p.id === Number(id));

    if (!property) {
      res.status(404).json({ success: false, message: 'Property not found.' });
      return;
    }

    if (req.user?.role !== 'admin' && property.owner_id !== req.user?.id) {
      res.status(403).json({ success: false, message: 'You are not authorized to update this listing.' });
      return;
    }

    const {
      title,
      description,
      address,
      city,
      state,
      zip_code,
      property_type,
      monthly_rent,
      security_deposit,
      furnished_status,
      bedrooms,
      bathrooms,
      area_sqft,
      is_available,
      images,
      amenities,
    } = req.body;

    if (title) property.title = title.trim();
    if (description) property.description = description.trim();
    if (address) property.address = address.trim();
    if (city) property.city = city.trim();
    if (state) property.state = state.trim();
    if (zip_code) property.zip_code = zip_code.trim();
    if (property_type) property.property_type = property_type;
    if (monthly_rent !== undefined) property.monthly_rent = Number(monthly_rent);
    if (security_deposit !== undefined) property.security_deposit = Number(security_deposit);
    if (furnished_status) property.furnished_status = furnished_status;
    if (bedrooms !== undefined) property.bedrooms = Number(bedrooms);
    if (bathrooms !== undefined) property.bathrooms = Number(bathrooms);
    if (area_sqft !== undefined) property.area_sqft = Number(area_sqft);
    if (is_available !== undefined) property.is_available = Boolean(is_available);
    property.updated_at = new Date().toISOString();

    if (Array.isArray(images) && images.length > 0) {
      db.property_images = db.property_images.filter((img) => img.property_id !== property.id);
      let nextImgId = db.property_images.length > 0 ? Math.max(...db.property_images.map((i) => i.id)) + 1 : 1;
      images.forEach((url: string, index: number) => {
        db.property_images.push({
          id: nextImgId++,
          property_id: property.id,
          image_url: url.trim(),
          is_primary: index === 0,
        });
      });
    }

    if (Array.isArray(amenities)) {
      db.property_amenities = db.property_amenities.filter((pa) => pa.property_id !== property.id);
      amenities.forEach((amenityInput: string | number) => {
        let aId = typeof amenityInput === 'number' ? amenityInput : null;
        if (!aId) {
          const match = db.amenities.find((a) => a.name.toLowerCase() === String(amenityInput).toLowerCase());
          if (match) aId = match.id;
        }
        if (aId) {
          db.property_amenities.push({ property_id: property.id, amenity_id: aId });
        }
      });
    }

    saveDatabase();

    res.json({
      success: true,
      message: 'Property updated successfully.',
      property: enrichProperty(property, db),
    });
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ success: false, message: 'Failed to update property.' });
  }
};

export const deleteProperty = (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const index = db.properties.findIndex((p) => p.id === Number(id));

    if (index === -1) {
      res.status(404).json({ success: false, message: 'Property not found.' });
      return;
    }

    const property = db.properties[index];
    if (req.user?.role !== 'admin' && property.owner_id !== req.user?.id) {
      res.status(403).json({ success: false, message: 'You are not authorized to delete this property.' });
      return;
    }

    // Remove cascading data
    db.properties.splice(index, 1);
    db.property_images = db.property_images.filter((img) => img.property_id !== property.id);
    db.property_amenities = db.property_amenities.filter((pa) => pa.property_id !== property.id);

    saveDatabase();

    res.json({
      success: true,
      message: 'Property and associated media deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ success: false, message: 'Failed to delete property.' });
  }
};

export const getAmenities = (_req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  res.json({
    success: true,
    amenities: db.amenities,
  });
};
