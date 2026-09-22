import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Property,
  PropertyImage,
  Amenity,
  Booking,
  Rental,
  Payment,
  MaintenanceRequest,
  Review,
  Message,
  Notification,
} from '../models/types.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'rentease_db.json');
const BACKUP_FILE = path.join(DATA_DIR, 'rentease_db.backup.json');

export interface DatabaseStore {
  users: User[];
  properties: Property[];
  property_images: PropertyImage[];
  amenities: Amenity[];
  property_amenities: { property_id: number; amenity_id: number }[];
  bookings: Booking[];
  rentals: Rental[];
  payments: Payment[];
  maintenance_requests: MaintenanceRequest[];
  reviews: Review[];
  messages: Message[];
  notifications: Notification[];
}

let dbInstance: DatabaseStore | null = null;
let saveTimeout: NodeJS.Timeout | null = null;

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Ensures all collection arrays exist in the database store to prevent undefined errors.
 */
function sanitizeDatabaseStore(data: Partial<DatabaseStore>): DatabaseStore {
  return {
    users: Array.isArray(data.users) ? data.users : [],
    properties: Array.isArray(data.properties) ? data.properties : [],
    property_images: Array.isArray(data.property_images) ? data.property_images : [],
    amenities: Array.isArray(data.amenities) ? data.amenities : [],
    property_amenities: Array.isArray(data.property_amenities) ? data.property_amenities : [],
    bookings: Array.isArray(data.bookings) ? data.bookings : [],
    rentals: Array.isArray(data.rentals) ? data.rentals : [],
    payments: Array.isArray(data.payments) ? data.payments : [],
    maintenance_requests: Array.isArray(data.maintenance_requests) ? data.maintenance_requests : [],
    reviews: Array.isArray(data.reviews) ? data.reviews : [],
    messages: Array.isArray(data.messages) ? data.messages : [],
    notifications: Array.isArray(data.notifications) ? data.notifications : [],
  };
}

/**
 * Synchronously flushes database to disk using atomic rename to guarantee zero file corruption.
 */
export function flushDatabaseSync(): void {
  if (!dbInstance) return;
  try {
    ensureDataDirectory();
    const tempFile = `${DATA_FILE}.${Date.now()}.${Math.random().toString(36).substring(2, 7)}.tmp`;
    const payload = JSON.stringify(dbInstance, null, 2);
    fs.writeFileSync(tempFile, payload, 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);

    // Keep a backup copy for disaster recovery
    try {
      fs.copyFileSync(DATA_FILE, BACKUP_FILE);
    } catch {
      // Ignore backup copy non-critical error
    }
  } catch (err) {
    console.error('CRITICAL: Failed to write database snapshot to disk:', err);
  }
}

/**
 * Debounced and immediate database persistence.
 */
export function saveDatabase(immediate: boolean = true): void {
  if (!dbInstance) return;

  if (immediate) {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    flushDatabaseSync();
  } else {
    if (!saveTimeout) {
      saveTimeout = setTimeout(() => {
        saveTimeout = null;
        flushDatabaseSync();
      }, 500);
    }
  }
}

export function getDatabase(): DatabaseStore {
  if (dbInstance) {
    return dbInstance;
  }

  ensureDataDirectory();

  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      dbInstance = sanitizeDatabaseStore(parsed);

      // Ensure Admin user reflects Ayush Rathour and deduplicate any conflicting accounts
      const adminUser = dbInstance.users.find((u) => u.role === 'admin' || u.id === 1);
      if (adminUser) {
        adminUser.name = 'Ayush Rathour';
        adminUser.email = 'rathourayush550@gmail.com';
        adminUser.bio = 'RentEase Lead System Administrator & Owner. Full platform control.';
        // Deduplicate any accidental duplicate account with the same email
        const duplicateUsers = dbInstance.users.filter((u) => u.id !== adminUser.id && u.email.toLowerCase() === 'rathourayush550@gmail.com');
        if (duplicateUsers.length > 0) {
          duplicateUsers.forEach((dup) => {
            if (dup.password) adminUser.password = dup.password;
            dbInstance!.properties.forEach((p) => {
              if (p.owner_id === dup.id) p.owner_id = adminUser.id;
            });
          });
          dbInstance.users = dbInstance.users.filter((u) => u.id === adminUser.id || u.email.toLowerCase() !== 'rathourayush550@gmail.com');
        }
        flushDatabaseSync();
      }

      return dbInstance;
    } catch (err) {
      console.warn('Existing database corrupted or invalid JSON. Checking backup file...', err);
      if (fs.existsSync(BACKUP_FILE)) {
        try {
          const backupContent = fs.readFileSync(BACKUP_FILE, 'utf-8');
          dbInstance = sanitizeDatabaseStore(JSON.parse(backupContent));
          const adminUser = dbInstance.users.find((u) => u.role === 'admin' || u.id === 1);
          if (adminUser) {
            adminUser.name = 'Ayush Rathour';
            adminUser.email = 'rathourayush550@gmail.com';
          }
          flushDatabaseSync();
          return dbInstance;
        } catch {
          console.warn('Backup file could not be recovered. Reseeding initial data.');
        }
      }
    }
  }

  dbInstance = seedInitialData();
  flushDatabaseSync();
  return dbInstance;
}

function seedInitialData(): DatabaseStore {
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('admin123', salt);
  const ownerHash = bcrypt.hashSync('owner123', salt);
  const tenantHash = bcrypt.hashSync('tenant123', salt);

  const users: User[] = [
    {
      id: 1,
      name: 'Ayush Rathour',
      email: 'rathourayush550@gmail.com',
      password: adminHash,
      role: 'admin',
      phone: '+1 (555) 019-2831',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      bio: 'RentEase Lead System Administrator & Owner. Full platform control.',
      is_verified: true,
      is_blocked: false,
      created_at: '2026-01-01T08:00:00Z',
    },
    {
      id: 2,
      name: 'Sarah Jenkins',
      email: 'owner@rentease.com',
      password: ownerHash,
      role: 'owner',
      phone: '+1 (555) 438-9201',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      bio: 'Professional property manager with over 8 years of experience managing luxury urban residences and modern family homes.',
      is_verified: true,
      is_blocked: false,
      created_at: '2026-01-05T09:30:00Z',
    },
    {
      id: 3,
      name: 'Marcus Sterling',
      email: 'marcus@rentease.com',
      password: ownerHash,
      role: 'owner',
      phone: '+1 (555) 612-8849',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      bio: 'Independent real-estate investor specializing in downtown executive studios and boutique suburban townhouses.',
      is_verified: true,
      is_blocked: false,
      created_at: '2026-01-10T11:15:00Z',
    },
    {
      id: 4,
      name: 'Alex Rivera',
      email: 'tenant@rentease.com',
      password: tenantHash,
      role: 'tenant',
      phone: '+1 (555) 902-1145',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      bio: 'Software engineer looking for peaceful, well-lit spaces with reliable high-speed internet and parking.',
      is_verified: true,
      is_blocked: false,
      created_at: '2026-01-12T14:20:00Z',
    },
    {
      id: 5,
      name: 'Priya Sharma',
      email: 'priya@rentease.com',
      password: tenantHash,
      role: 'tenant',
      phone: '+1 (555) 234-7712',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      bio: 'Architecture graduate student interested in eco-friendly apartments and pet-friendly properties.',
      is_verified: true,
      is_blocked: false,
      created_at: '2026-01-18T16:00:00Z',
    },
    {
      id: 6,
      name: 'David Kim',
      email: 'david.owner@rentease.com',
      password: ownerHash,
      role: 'owner',
      phone: '+1 (555) 789-3321',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      bio: 'New property owner awaiting admin verification for waterfront condos in Miami.',
      is_verified: false,
      is_blocked: false,
      created_at: '2026-02-01T10:00:00Z',
    },
  ];

  const amenities: Amenity[] = [
    { id: 1, name: 'High-Speed Wi-Fi', icon: 'Wifi' },
    { id: 2, name: 'Central Air Conditioning', icon: 'Wind' },
    { id: 3, name: 'Dedicated Covered Parking', icon: 'Car' },
    { id: 4, name: 'Swimming Pool', icon: 'Waves' },
    { id: 5, name: 'In-Unit Washer & Dryer', icon: 'Shirt' },
    { id: 6, name: 'Modern Fitness Center', icon: 'Dumbbell' },
    { id: 7, name: 'Pet Friendly', icon: 'PawPrint' },
    { id: 8, name: 'Private Balcony / Terrace', icon: 'Maximize' },
    { id: 9, name: '24/7 Security & CCTV', icon: 'ShieldCheck' },
    { id: 10, name: 'Elevator Access', icon: 'ChevronsUp' },
    { id: 11, name: 'Dishwasher & Modern Kitchen', icon: 'Utensils' },
    { id: 12, name: 'Smart Home Automation', icon: 'Cpu' },
  ];

  const properties: Property[] = [
    {
      id: 1,
      owner_id: 2,
      title: 'The Skyline Penthouse & Sky Terrace',
      description: 'Stunning light-filled luxury penthouse overlooking the city skyline. Features floor-to-ceiling panoramic glass windows, custom chef kitchen with marble island, and private rooftop deck. Close to premium transit, cafes, and central financial district.',
      address: '742 Highland Avenue, Suite 18A',
      city: 'Seattle',
      state: 'WA',
      zip_code: '98101',
      property_type: 'Apartment',
      monthly_rent: 3200,
      security_deposit: 3200,
      furnished_status: 'Furnished',
      bedrooms: 3,
      bathrooms: 2,
      area_sqft: 1650,
      is_available: true,
      approval_status: 'approved',
      created_at: '2026-01-10T10:00:00Z',
    },
    {
      id: 2,
      owner_id: 2,
      title: 'Oakwood Contemporary Suburban Villa',
      description: 'Charming 4-bedroom detached family residence in a quiet tree-lined cul-de-sac. Features a manicured private fenced backyard, heated double garage, solar power array, and spacious open-concept living area.',
      address: '1408 Whispering Pines Road',
      city: 'Austin',
      state: 'TX',
      zip_code: '78704',
      property_type: 'Villa',
      monthly_rent: 4100,
      security_deposit: 4100,
      furnished_status: 'Semi-Furnished',
      bedrooms: 4,
      bathrooms: 3,
      area_sqft: 2400,
      is_available: true,
      approval_status: 'approved',
      created_at: '2026-01-14T12:00:00Z',
    },
    {
      id: 3,
      owner_id: 3,
      title: 'SoHo Industrial Loft & Studio',
      description: 'Authentic brick-and-timber loft with 14-foot exposed beam ceilings, polished concrete floors, and designer track lighting. Perfect for creative professionals or remote tech founders needing an inspiring workspace.',
      address: '215 Mercer Street, Apt 4B',
      city: 'New York',
      state: 'NY',
      zip_code: '10012',
      property_type: 'Studio',
      monthly_rent: 2850,
      security_deposit: 2850,
      furnished_status: 'Furnished',
      bedrooms: 1,
      bathrooms: 1,
      area_sqft: 920,
      is_available: false, // Currently leased by Alex Rivera
      approval_status: 'approved',
      created_at: '2026-01-15T14:00:00Z',
    },
    {
      id: 4,
      owner_id: 3,
      title: 'Boutique Garden Townhouse in Lincoln Park',
      description: 'Elegantly restored 3-story brownstone townhouse. Enjoy hardwood herringbone floors, dual fireplaces, chef gas range, and a private stone-paved English garden patio.',
      address: '882 West Webster Avenue',
      city: 'Chicago',
      state: 'IL',
      zip_code: '60614',
      property_type: 'Townhouse',
      monthly_rent: 3600,
      security_deposit: 3600,
      furnished_status: 'Unfurnished',
      bedrooms: 3,
      bathrooms: 2,
      area_sqft: 1850,
      is_available: true,
      approval_status: 'approved',
      created_at: '2026-01-20T09:30:00Z',
    },
    {
      id: 5,
      owner_id: 2,
      title: 'Marina Bay Coastal Sunset Condo',
      description: 'Modern waterfront condo with direct ocean breezes, resort-style heated lap pool, concierge lobby, and secure private marina access. Wake up to breathtaking sunrise vistas over the bay.',
      address: '1020 Ocean Breeze Blvd, #504',
      city: 'Miami',
      state: 'FL',
      zip_code: '33139',
      property_type: 'Condo',
      monthly_rent: 2950,
      security_deposit: 3000,
      furnished_status: 'Furnished',
      bedrooms: 2,
      bathrooms: 2,
      area_sqft: 1200,
      is_available: true,
      approval_status: 'approved',
      created_at: '2026-01-22T11:00:00Z',
    },
    {
      id: 6,
      owner_id: 3,
      title: 'Silicon Valley Executive Eco-Home',
      description: 'Zero-emission smart home equipped with Tesla Powerwall backup, high-efficiency heat pump, filtered water system, and gigabit fiber ethernet wired to every room. Minutes from major tech campuses.',
      address: '320 University View Drive',
      city: 'San Francisco',
      state: 'CA',
      zip_code: '94107',
      property_type: 'House',
      monthly_rent: 4600,
      security_deposit: 5000,
      furnished_status: 'Furnished',
      bedrooms: 3,
      bathrooms: 2,
      area_sqft: 1750,
      is_available: true,
      approval_status: 'approved',
      created_at: '2026-01-25T15:00:00Z',
    },
    {
      id: 7,
      owner_id: 6,
      title: 'South Beach Designer Studio (Pending Review)',
      description: 'Newly renovated studio steps from the beach. Modern tile finish, stainless steel kitchenette, and tropical palm courtyard view. Awaiting admin listing verification.',
      address: '445 Collins Ave, Apt 3',
      city: 'Miami',
      state: 'FL',
      zip_code: '33139',
      property_type: 'Studio',
      monthly_rent: 1950,
      security_deposit: 1950,
      furnished_status: 'Furnished',
      bedrooms: 1,
      bathrooms: 1,
      area_sqft: 550,
      is_available: true,
      approval_status: 'pending',
      created_at: '2026-02-05T10:00:00Z',
    },
  ];

  const property_images: PropertyImage[] = [
    // Prop 1 - Seattle Penthouse
    { id: 1, property_id: 1, image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80', is_primary: true },
    { id: 2, property_id: 1, image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80', is_primary: false },
    { id: 3, property_id: 1, image_url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80', is_primary: false },
    { id: 4, property_id: 1, image_url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80', is_primary: false },

    // Prop 2 - Austin Villa
    { id: 5, property_id: 2, image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80', is_primary: true },
    { id: 6, property_id: 2, image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80', is_primary: false },
    { id: 7, property_id: 2, image_url: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80', is_primary: false },

    // Prop 3 - SoHo Loft
    { id: 8, property_id: 3, image_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80', is_primary: true },
    { id: 9, property_id: 3, image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80', is_primary: false },
    { id: 10, property_id: 3, image_url: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=1200&q=80', is_primary: false },

    // Prop 4 - Chicago Townhouse
    { id: 11, property_id: 4, image_url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80', is_primary: true },
    { id: 12, property_id: 4, image_url: 'https://images.unsplash.com/photo-1600573472591-ee6c8e695394?auto=format&fit=crop&w=1200&q=80', is_primary: false },

    // Prop 5 - Miami Coastal Condo
    { id: 13, property_id: 5, image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80', is_primary: true },
    { id: 14, property_id: 5, image_url: 'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=1200&q=80', is_primary: false },

    // Prop 6 - San Francisco Eco-Home
    { id: 15, property_id: 6, image_url: 'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?auto=format&fit=crop&w=1200&q=80', is_primary: true },
    { id: 16, property_id: 6, image_url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80', is_primary: false },

    // Prop 7 - Miami Studio
    { id: 17, property_id: 7, image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80', is_primary: true },
  ];

  const property_amenities = [
    { property_id: 1, amenity_id: 1 },
    { property_id: 1, amenity_id: 2 },
    { property_id: 1, amenity_id: 3 },
    { property_id: 1, amenity_id: 5 },
    { property_id: 1, amenity_id: 6 },
    { property_id: 1, amenity_id: 8 },
    { property_id: 1, amenity_id: 9 },
    { property_id: 1, amenity_id: 10 },
    { property_id: 1, amenity_id: 11 },

    { property_id: 2, amenity_id: 1 },
    { property_id: 2, amenity_id: 2 },
    { property_id: 2, amenity_id: 3 },
    { property_id: 2, amenity_id: 4 },
    { property_id: 2, amenity_id: 5 },
    { property_id: 2, amenity_id: 7 },
    { property_id: 2, amenity_id: 8 },

    { property_id: 3, amenity_id: 1 },
    { property_id: 3, amenity_id: 2 },
    { property_id: 3, amenity_id: 5 },
    { property_id: 3, amenity_id: 7 },
    { property_id: 3, amenity_id: 11 },

    { property_id: 4, amenity_id: 1 },
    { property_id: 4, amenity_id: 2 },
    { property_id: 4, amenity_id: 3 },
    { property_id: 4, amenity_id: 8 },
    { property_id: 4, amenity_id: 9 },

    { property_id: 5, amenity_id: 1 },
    { property_id: 5, amenity_id: 2 },
    { property_id: 5, amenity_id: 4 },
    { property_id: 5, amenity_id: 6 },
    { property_id: 5, amenity_id: 8 },
    { property_id: 5, amenity_id: 9 },
    { property_id: 5, amenity_id: 10 },

    { property_id: 6, amenity_id: 1 },
    { property_id: 6, amenity_id: 2 },
    { property_id: 6, amenity_id: 3 },
    { property_id: 6, amenity_id: 5 },
    { property_id: 6, amenity_id: 12 },

    { property_id: 7, amenity_id: 1 },
    { property_id: 7, amenity_id: 2 },
    { property_id: 7, amenity_id: 8 },
  ];

  const bookings: Booking[] = [
    {
      id: 1,
      property_id: 3,
      tenant_id: 4, // Alex Rivera
      move_in_date: '2026-02-01',
      lease_duration_months: 12,
      occupants_count: 1,
      status: 'accepted',
      message: 'Hello Marcus, I am a senior engineer working hybrid in Manhattan. Clean, non-smoker with exceptional rental references.',
      created_at: '2026-01-20T10:00:00Z',
    },
    {
      id: 2,
      property_id: 1,
      tenant_id: 5, // Priya Sharma
      move_in_date: '2026-04-01',
      lease_duration_months: 6,
      occupants_count: 1,
      status: 'pending',
      message: 'Hi Sarah! I am moving to Seattle for an architectural residency project. Would love to lease your stunning skyline penthouse.',
      created_at: '2026-02-10T14:30:00Z',
    },
  ];

  const rentals: Rental[] = [
    {
      id: 1,
      booking_id: 1,
      property_id: 3,
      tenant_id: 4,
      owner_id: 3,
      monthly_rent: 2850,
      security_deposit: 2850,
      start_date: '2026-02-01',
      end_date: '2027-01-31',
      status: 'active',
      created_at: '2026-01-22T16:00:00Z',
    },
  ];

  const payments: Payment[] = [
    {
      id: 1,
      rental_id: 1,
      tenant_id: 4,
      amount: 2850,
      payment_type: 'Security Deposit',
      month_year: 'Initial Move-in',
      payment_method: 'Bank Transfer',
      transaction_ref: 'TXN-90218-SEC',
      status: 'paid',
      paid_at: '2026-01-25T11:00:00Z',
      created_at: '2026-01-25T11:00:00Z',
    },
    {
      id: 2,
      rental_id: 1,
      tenant_id: 4,
      amount: 2850,
      payment_type: 'Rent',
      month_year: 'February 2026',
      payment_method: 'Credit Card',
      transaction_ref: 'TXN-94182-FEB',
      status: 'paid',
      paid_at: '2026-02-01T09:15:00Z',
      created_at: '2026-02-01T09:15:00Z',
    },
    {
      id: 3,
      rental_id: 1,
      tenant_id: 4,
      amount: 2850,
      payment_type: 'Rent',
      month_year: 'March 2026',
      payment_method: 'Bank Transfer',
      transaction_ref: 'TXN-98231-MAR',
      status: 'paid',
      paid_at: '2026-03-01T08:30:00Z',
      created_at: '2026-03-01T08:30:00Z',
    },
    {
      id: 4,
      rental_id: 1,
      tenant_id: 4,
      amount: 2850,
      payment_type: 'Rent',
      month_year: 'April 2026',
      payment_method: 'Bank Transfer',
      transaction_ref: 'TXN-PENDING-APR',
      status: 'pending',
      created_at: '2026-03-25T00:00:00Z',
    },
  ];

  const maintenance_requests: MaintenanceRequest[] = [
    {
      id: 1,
      rental_id: 1,
      property_id: 3,
      tenant_id: 4,
      title: 'Kitchen Sink Slow Drain & Pressure Drop',
      description: 'The kitchen sink water flow is slightly sluggish and drains slowly after running dishes for a few minutes.',
      category: 'Plumbing',
      priority: 'medium',
      status: 'resolved',
      resolution_notes: 'Plumber visited on Feb 8th. Cleared P-trap aerator and tested drainage. Flowing at full volume.',
      resolved_at: '2026-02-08T15:00:00Z',
      created_at: '2026-02-06T10:15:00Z',
    },
    {
      id: 2,
      rental_id: 1,
      property_id: 3,
      tenant_id: 4,
      title: 'Balcony Door Handle Loose',
      description: 'The locking latch on the sliding terrace door feels loose when engaging the deadbolt.',
      category: 'Carpentry',
      priority: 'low',
      status: 'in_progress',
      created_at: '2026-03-15T11:45:00Z',
    },
  ];

  const reviews: Review[] = [
    {
      id: 1,
      property_id: 3,
      tenant_id: 4,
      rating: 5,
      comment: 'Exceptional loft! The natural light in the morning is magnificent, high ceilings make it feel twice as big, and Marcus is by far the most professional landlord I have had. Highly recommended.',
      created_at: '2026-02-28T18:00:00Z',
    },
    {
      id: 2,
      property_id: 1,
      tenant_id: 5,
      rating: 5,
      comment: 'Toured this penthouse last week - the views over Puget Sound and Mount Rainier are simply unmatched. Very clean building with great security.',
      created_at: '2026-02-15T14:20:00Z',
    },
    {
      id: 3,
      property_id: 2,
      tenant_id: 4,
      rating: 4,
      comment: 'Very quiet and peaceful suburban neighborhood. Spacious rooms and high-grade finishes.',
      created_at: '2026-01-28T10:00:00Z',
    },
  ];

  const messages: Message[] = [
    {
      id: 1,
      sender_id: 4,
      receiver_id: 3,
      property_id: 3,
      message: 'Hi Marcus, just wanted to confirm that the package delivery locker code works smoothly. Thanks again for setting up the lease!',
      is_read: true,
      created_at: '2026-02-02T10:30:00Z',
    },
    {
      id: 2,
      sender_id: 3,
      receiver_id: 4,
      property_id: 3,
      message: 'Glad to hear that Alex! Let me know if you ever need any assistance or local neighborhood recommendations.',
      is_read: true,
      created_at: '2026-02-02T11:15:00Z',
    },
    {
      id: 3,
      sender_id: 4,
      receiver_id: 3,
      property_id: 3,
      message: 'Hi Marcus, the technician arrived on time and resolved the kitchen sink drain. Everything is in top shape!',
      is_read: false,
      created_at: '2026-02-08T16:00:00Z',
    },
  ];

  const notifications: Notification[] = [
    {
      id: 1,
      user_id: 4,
      title: 'Booking Request Approved',
      message: 'Your rental request for SoHo Industrial Loft & Studio was approved by Marcus Sterling.',
      type: 'booking',
      link: '/tenant/rentals',
      is_read: true,
      created_at: '2026-01-22T16:00:00Z',
    },
    {
      id: 2,
      user_id: 4,
      title: 'Upcoming Rent Reminder',
      message: 'Your April 2026 rent payment of $2,850.00 is due soon.',
      type: 'payment',
      link: '/tenant/payments',
      is_read: false,
      created_at: '2026-03-25T08:00:00Z',
    },
    {
      id: 3,
      user_id: 2,
      title: 'New Rental Request Received',
      message: 'Priya Sharma submitted a rental application for The Skyline Penthouse.',
      type: 'booking',
      link: '/owner/requests',
      is_read: false,
      created_at: '2026-02-10T14:30:00Z',
    },
    {
      id: 4,
      user_id: 1,
      title: 'New Listing Pending Verification',
      message: 'David Kim submitted "South Beach Designer Studio" requiring admin review.',
      type: 'system',
      link: '/admin/properties',
      is_read: false,
      created_at: '2026-02-05T10:05:00Z',
    },
  ];

  return {
    users,
    amenities,
    properties,
    property_images,
    property_amenities,
    bookings,
    rentals,
    payments,
    maintenance_requests,
    reviews,
    messages,
    notifications,
  };
}
