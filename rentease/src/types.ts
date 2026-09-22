export type UserRole = 'tenant' | 'owner' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  bio?: string;
  is_verified: boolean;
  is_blocked: boolean;
  created_at: string;
  propertyCount?: number;
  rentalCount?: number;
}

export type PropertyType = 'Apartment' | 'House' | 'Villa' | 'Studio' | 'Condo' | 'Townhouse';
export type FurnishedStatus = 'Furnished' | 'Semi-Furnished' | 'Unfurnished';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Property {
  id: number;
  owner_id: number;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: PropertyType;
  monthly_rent: number;
  security_deposit: number;
  furnished_status: FurnishedStatus;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  is_available: boolean;
  approval_status: ApprovalStatus;
  rejection_reason?: string;
  created_at: string;
  updated_at?: string;

  // Enriched fields
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  owner_avatar?: string;
  owner_verified?: boolean;
  images?: string[];
  amenities?: string[];
  average_rating?: number;
  review_count?: number;
}

export interface Amenity {
  id: number;
  name: string;
  icon: string;
}

export type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface Booking {
  id: number;
  property_id: number;
  tenant_id: number;
  move_in_date: string;
  lease_duration_months: number;
  occupants_count: number;
  status: BookingStatus;
  message?: string;
  rejection_note?: string;
  created_at: string;
  property?: Property;
  tenant?: User;
}

export type RentalStatus = 'active' | 'completed' | 'terminated';

export interface Rental {
  id: number;
  booking_id: number;
  property_id: number;
  tenant_id: number;
  owner_id: number;
  monthly_rent: number;
  security_deposit: number;
  start_date: string;
  end_date: string;
  status: RentalStatus;
  created_at: string;
  property?: Property;
  tenant?: User;
  owner?: User;
  payments?: Payment[];
  maintenance?: MaintenanceRequest[];
}

export type PaymentType = 'Rent' | 'Security Deposit' | 'Maintenance Fee' | 'Other';
export type PaymentMethod = 'Credit Card' | 'Bank Transfer' | 'UPI' | 'Debit Card' | 'Cash';
export type PaymentStatus = 'paid' | 'pending' | 'overdue';

export interface Payment {
  id: number;
  rental_id: number;
  tenant_id: number;
  amount: number;
  payment_type: PaymentType;
  month_year: string;
  payment_method: PaymentMethod;
  transaction_ref: string;
  status: PaymentStatus;
  paid_at?: string;
  created_at: string;
  property_title?: string;
  property_city?: string;
  tenant_name?: string;
  tenant_email?: string;
  owner_id?: number;
}

export type MaintenanceCategory = 'Plumbing' | 'Electrical' | 'Appliance' | 'HVAC' | 'Carpentry' | 'Other';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'emergency';
export type MaintenanceStatus = 'pending' | 'in_progress' | 'resolved';

export interface MaintenanceRequest {
  id: number;
  rental_id: number;
  property_id: number;
  tenant_id: number;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  image_url?: string;
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
  property_title?: string;
  property_address?: string;
  tenant_name?: string;
  tenant_phone?: string;
  owner_id?: number;
}

export interface Review {
  id: number;
  property_id: number;
  tenant_id: number;
  rating: number;
  comment: string;
  created_at: string;
  tenant_name?: string;
  tenant_avatar?: string;
  property_title?: string;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  property_id?: number;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  receiver_name?: string;
  property_title?: string;
}

export interface Conversation {
  contact: User;
  lastMessage: Message;
  unreadCount: number;
}

export type NotificationType = 'booking' | 'rental' | 'payment' | 'maintenance' | 'system';

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  is_read: boolean;
  created_at: string;
}
