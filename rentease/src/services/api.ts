import {
  User,
  Property,
  Amenity,
  Booking,
  Rental,
  Payment,
  MaintenanceRequest,
  Review,
  Conversation,
  Message,
  Notification,
} from '../types.ts';

const TOKEN_KEY = 'rentease_auth_token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = (): void => localStorage.removeItem(TOKEN_KEY);

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({ success: false, message: 'Server error' }));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ success: boolean; token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (userData: any) =>
      request<{ success: boolean; token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    demoLogin: (role: 'tenant' | 'owner' | 'admin') =>
      request<{ success: boolean; token: string; user: User }>('/api/auth/demo-login', {
        method: 'POST',
        body: JSON.stringify({ role }),
      }),
    getMe: () => request<{ success: boolean; user: User }>('/api/auth/me'),
    updateProfile: (profile: Partial<User>) =>
      request<{ success: boolean; user: User; message: string }>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profile),
      }),
  },

  // Properties
  properties: {
    getAll: (params?: Record<string, any>) => {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            query.append(key, String(val));
          }
        });
      }
      return request<{ success: boolean; count: number; properties: Property[] }>(
        `/api/properties?${query.toString()}`
      );
    },
    getFeatured: () => request<{ success: boolean; properties: Property[] }>('/api/properties/featured'),
    getAmenities: () => request<{ success: boolean; amenities: Amenity[] }>('/api/properties/amenities'),
    getById: (id: number | string) =>
      request<{ success: boolean; property: Property; reviews: Review[] }>(`/api/properties/${id}`),
    create: (propertyData: any) =>
      request<{ success: boolean; property: Property; message: string }>('/api/properties', {
        method: 'POST',
        body: JSON.stringify(propertyData),
      }),
    update: (id: number | string, propertyData: any) =>
      request<{ success: boolean; property: Property; message: string }>(`/api/properties/${id}`, {
        method: 'PUT',
        body: JSON.stringify(propertyData),
      }),
    delete: (id: number | string) =>
      request<{ success: boolean; message: string }>(`/api/properties/${id}`, {
        method: 'DELETE',
      }),
  },

  // Bookings
  bookings: {
    createRequest: (data: {
      property_id: number;
      move_in_date: string;
      lease_duration_months: number;
      occupants_count: number;
      message?: string;
    }) =>
      request<{ success: boolean; booking: Booking; message: string }>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getTenantBookings: () =>
      request<{ success: boolean; bookings: Booking[] }>('/api/bookings/tenant'),
    getOwnerRequests: () =>
      request<{ success: boolean; requests: Booking[] }>('/api/bookings/owner'),
    updateStatus: (id: number | string, data: { status: string; rejection_note?: string }) =>
      request<{ success: boolean; booking: Booking; rental?: Rental; message: string }>(
        `/api/bookings/${id}/status`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      ),
  },

  // Rentals
  rentals: {
    getAll: () => request<{ success: boolean; rentals: Rental[] }>('/api/rentals'),
    getById: (id: number | string) =>
      request<{ success: boolean; rental: Rental }>(`/api/rentals/${id}`),
    terminate: (id: number | string) =>
      request<{ success: boolean; rental: Rental; message: string }>(`/api/rentals/${id}/terminate`, {
        method: 'PUT',
      }),
  },

  // Payments
  payments: {
    getAll: () => request<{ success: boolean; payments: Payment[] }>('/api/payments'),
    payRent: (data: { payment_id: number; payment_method: string; card_last4?: string }) =>
      request<{ success: boolean; payment: Payment; message: string }>('/api/payments/pay', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getOwnerIncomeStats: () =>
      request<{
        success: boolean;
        stats: {
          totalCollected: number;
          pendingAmount: number;
          totalProperties: number;
          occupiedProperties: number;
          occupancyRate: number;
          transactionCount: number;
        };
      }>('/api/payments/income-stats'),
  },

  // Maintenance
  maintenance: {
    getAll: () => request<{ success: boolean; requests: MaintenanceRequest[] }>('/api/maintenance'),
    create: (data: {
      rental_id: number;
      title: string;
      description: string;
      category: string;
      priority: string;
      image_url?: string;
    }) =>
      request<{ success: boolean; request: MaintenanceRequest; message: string }>('/api/maintenance', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateStatus: (id: number | string, data: { status: string; resolution_notes?: string }) =>
      request<{ success: boolean; request: MaintenanceRequest; message: string }>(
        `/api/maintenance/${id}/status`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      ),
  },

  // Reviews
  reviews: {
    getForProperty: (propertyId: number | string) =>
      request<{ success: boolean; reviews: Review[] }>(`/api/reviews?propertyId=${propertyId}`),
    create: (data: { property_id: number; rating: number; comment: string }) =>
      request<{ success: boolean; review: Review; message: string }>('/api/reviews', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: number | string) =>
      request<{ success: boolean; message: string }>(`/api/reviews/${id}`, {
        method: 'DELETE',
      }),
  },

  // Messages
  messages: {
    getConversations: () =>
      request<{ success: boolean; conversations: Conversation[] }>('/api/messages/conversations'),
    getThread: (otherUserId: number | string) =>
      request<{ success: boolean; otherUser: User; messages: Message[] }>(
        `/api/messages/thread/${otherUserId}`
      ),
    send: (data: { receiver_id: number; property_id?: number; message: string }) =>
      request<{ success: boolean; message: string; data: Message }>('/api/messages/send', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Notifications
  notifications: {
    getAll: () =>
      request<{ success: boolean; notifications: Notification[]; unreadCount: number }>(
        '/api/notifications'
      ),
    markRead: (id: number | string = 'all') =>
      request<{ success: boolean; message: string }>(`/api/notifications/${id}/read`, {
        method: 'PUT',
      }),
  },

  // Admin
  admin: {
    getStats: () =>
      request<{
        success: boolean;
        stats: {
          totalUsers: number;
          tenantsCount: number;
          ownersCount: number;
          pendingOwners: number;
          totalProperties: number;
          approvedProperties: number;
          pendingProperties: number;
          activeRentals: number;
          totalBookings: number;
          totalRentCollected: number;
          pendingComplaints: number;
          propertyTypesMap: Record<string, number>;
          cityMap: Record<string, number>;
          tableCounts: Record<string, number>;
        };
      }>('/api/admin/stats'),
    getUsers: (params?: { role?: string; search?: string }) => {
      const query = new URLSearchParams();
      if (params?.role) query.append('role', params.role);
      if (params?.search) query.append('search', params.search);
      return request<{ success: boolean; users: User[] }>(`/api/admin/users?${query.toString()}`);
    },
    toggleBlock: (userId: number | string) =>
      request<{ success: boolean; message: string; user: { id: number; name: string; is_blocked: boolean } }>(
        `/api/admin/users/${userId}/block`,
        { method: 'PUT' }
      ),
    verifyOwner: (ownerId: number | string) =>
      request<{ success: boolean; message: string; user: User }>(
        `/api/admin/owners/${ownerId}/verify`,
        { method: 'PUT' }
      ),
    updateApproval: (propertyId: number | string, data: { status: string; rejection_reason?: string }) =>
      request<{ success: boolean; message: string; property: Property }>(
        `/api/admin/properties/${propertyId}/approval`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      ),
    getDatabaseSchema: () =>
      request<{
        success: boolean;
        engine: string;
        tables: { name: string; rows: number; primary_key: string; foreign_keys?: string[] }[];
      }>('/api/admin/database-schema'),
  },
};
