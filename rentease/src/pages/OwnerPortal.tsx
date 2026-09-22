import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import {
  Property,
  Booking,
  Rental,
  Payment,
  MaintenanceRequest,
  Conversation,
  Message,
  User,
  PropertyType,
  FurnishedStatus,
  Amenity,
} from '../types.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import {
  LayoutDashboard,
  Building2,
  FileText,
  Home,
  CreditCard,
  Wrench,
  MessageSquare,
  PlusCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  TrendingUp,
  MapPin,
  Calendar,
  Send,
  Trash2,
  Edit,
  Eye,
  Check,
  X,
  UploadCloud,
  Layers,
  Users,
  ShieldCheck,
} from 'lucide-react';

interface OwnerPortalProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onViewProperty: (id: number) => void;
}

export const OwnerPortal: React.FC<OwnerPortalProps> = ({
  currentPath,
  onNavigate,
  onViewProperty,
}) => {
  const { user } = useAuth();

  const getInitialTab = () => {
    if (currentPath.includes('/owner/properties/add')) return 'add-property';
    if (currentPath.includes('/owner/properties')) return 'properties';
    if (currentPath.includes('/owner/requests')) return 'requests';
    if (currentPath.includes('/owner/rentals')) return 'rentals';
    if (currentPath.includes('/owner/payments')) return 'payments';
    if (currentPath.includes('/owner/maintenance')) return 'maintenance';
    if (currentPath.includes('/owner/messages')) return 'messages';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab());

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [currentPath]);

  // Data states
  const [properties, setProperties] = useState<Property[]>([]);
  const [requests, setRequests] = useState<Booking[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [incomeStats, setIncomeStats] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [availableAmenities, setAvailableAmenities] = useState<Amenity[]>([]);

  // Add property form state
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formType, setFormType] = useState<PropertyType>('Apartment');
  const [formFurnished, setFormFurnished] = useState<FurnishedStatus>('Furnished');
  const [formRent, setFormRent] = useState('');
  const [formDeposit, setFormDeposit] = useState('');
  const [formBeds, setFormBeds] = useState('2');
  const [formBaths, setFormBaths] = useState('2');
  const [formSqft, setFormSqft] = useState('1100');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formZip, setFormZip] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formNewImageUrl, setFormNewImageUrl] = useState('');
  const [formAmenities, setFormAmenities] = useState<string[]>([]);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Ticket resolution state
  const [resolvingTicketId, setResolvingTicketId] = useState<number | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [propsRes, reqsRes, rentalsRes, paysRes, maintRes, statsRes, convRes, amenRes] =
        await Promise.all([
          api.properties.getAll({ ownerId: user?.id }).catch(() => ({ success: false, properties: [] })),
          api.bookings.getOwnerRequests().catch(() => ({ success: false, requests: [] })),
          api.rentals.getAll().catch(() => ({ success: false, rentals: [] })),
          api.payments.getAll().catch(() => ({ success: false, payments: [] })),
          api.maintenance.getAll().catch(() => ({ success: false, requests: [] })),
          api.payments.getOwnerIncomeStats().catch(() => ({ success: false, stats: null })),
          api.messages.getConversations().catch(() => ({ success: false, conversations: [] })),
          api.properties.getAmenities().catch(() => ({ success: false, amenities: [] })),
        ]);

      if (propsRes.success) setProperties(propsRes.properties || []);
      if (reqsRes.success) setRequests(reqsRes.requests || []);
      if (rentalsRes.success) setRentals(rentalsRes.rentals || []);
      if (paysRes.success) setPayments(paysRes.payments || []);
      if (maintRes.success) setMaintenance(maintRes.requests || []);
      if (statsRes.success) setIncomeStats(statsRes.stats);
      if (amenRes.success) setAvailableAmenities(amenRes.amenities || []);
      if (convRes.success) {
        setConversations(convRes.conversations || []);
        if (convRes.conversations && convRes.conversations.length > 0 && !activeChatUser) {
          setActiveChatUser(convRes.conversations[0].contact);
        }
      }
    } catch (err) {
      console.error('Error loading landlord data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Load chat messages
  useEffect(() => {
    if (!activeChatUser) return;
    const fetchChat = async () => {
      try {
        const res = await api.messages.getThread(activeChatUser.id);
        if (res.success) setChatMessages(res.messages || []);
      } catch (err) {
        console.error('Chat load error:', err);
      }
    };
    fetchChat();
  }, [activeChatUser]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatUser || !newMessageText.trim()) return;
    try {
      const res = await api.messages.send({
        receiver_id: activeChatUser.id,
        message: newMessageText.trim(),
      });
      if (res.success) {
        setChatMessages((prev) => [...prev, res.data]);
        setNewMessageText('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleBookingAction = async (bookingId: number, status: 'accepted' | 'rejected') => {
    const note =
      status === 'rejected'
        ? prompt('Please enter a reason for rejecting this application (optional):')
        : undefined;

    try {
      const res = await api.bookings.updateStatus(bookingId, {
        status,
        rejection_note: note || undefined,
      });
      if (res.success) {
        setActionSuccess(
          status === 'accepted'
            ? 'Application accepted! Active lease created and invoices generated.'
            : 'Application rejected.'
        );
        setTimeout(() => setActionSuccess(null), 3500);
        loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    }
  };

  const handleUpdateTicket = async (ticketId: number, status: string, notes?: string) => {
    try {
      await api.maintenance.updateStatus(ticketId, {
        status,
        resolution_notes: notes,
      });
      setActionSuccess('Ticket status updated successfully.');
      setTimeout(() => setActionSuccess(null), 3000);
      setResolvingTicketId(null);
      setResolutionText('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket.');
    }
  };

  const handleAddImage = () => {
    if (formNewImageUrl.trim()) {
      setFormImages((prev) => [...prev, formNewImageUrl.trim()]);
      setFormNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleAmenity = (name: string) => {
    setFormAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formRent || !formAddress || !formCity) {
      setFormError('Please fill in all required property information.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    const defaultImages =
      formImages.length > 0
        ? formImages
        : [
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
          ];

    try {
      const res = await api.properties.create({
        title: formTitle.trim(),
        description: formDesc.trim(),
        address: formAddress.trim(),
        city: formCity.trim(),
        state: formState.trim() || 'CA',
        zip_code: formZip.trim() || '94103',
        property_type: formType,
        monthly_rent: Number(formRent),
        security_deposit: Number(formDeposit) || Number(formRent) * 1.5,
        furnished_status: formFurnished,
        bedrooms: Number(formBeds),
        bathrooms: Number(formBaths),
        area_sqft: Number(formSqft),
        images: defaultImages,
        amenities: formAmenities,
      });

      if (res.success) {
        setActionSuccess('Property listed successfully and pending admin verification.');
        setTimeout(() => setActionSuccess(null), 3500);
        // Reset form
        setFormTitle('');
        setFormDesc('');
        setFormRent('');
        setFormDeposit('');
        setFormAddress('');
        setFormCity('');
        setFormImages([]);
        setFormAmenities([]);
        setActiveTab('properties');
        onNavigate('/owner/properties');
        loadData();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to list property.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const openMaintenance = maintenance.filter((m) => m.status !== 'resolved');

  return (
    <div id="page-owner-portal" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 to-stone-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs uppercase tracking-wider border border-blue-500/30">
              Landlord & Owner Console
            </span>
            {user?.is_verified && (
              <span className="flex items-center gap-1 text-xs text-stone-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Landlord
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 max-w-xl">
            Manage your rental portfolio, evaluate tenant applications, monitor gross rental yields, and supervise maintenance requests.
          </p>
        </div>

        <button
          id="btn-owner-add-property-top"
          onClick={() => {
            setActiveTab('add-property');
            onNavigate('/owner/properties/add');
          }}
          className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>List New Property</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-stone-200 text-xs font-medium scrollbar-none">
        <button
          id="tab-owner-dashboard"
          onClick={() => {
            setActiveTab('dashboard');
            onNavigate('/owner/dashboard');
          }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'dashboard'
              ? 'bg-stone-900 text-white font-bold shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Portfolio Overview</span>
        </button>

        <button
          id="tab-owner-properties"
          onClick={() => {
            setActiveTab('properties');
            onNavigate('/owner/properties');
          }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'properties'
              ? 'bg-stone-900 text-white font-bold shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>My Listings ({properties.length})</span>
        </button>

        <button
          id="tab-owner-requests"
          onClick={() => {
            setActiveTab('requests');
            onNavigate('/owner/requests');
          }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all relative ${
            activeTab === 'requests'
              ? 'bg-stone-900 text-white font-bold shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Tenant Applications</span>
          {pendingRequests.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          )}
        </button>

        <button
          id="tab-owner-rentals"
          onClick={() => {
            setActiveTab('rentals');
            onNavigate('/owner/rentals');
          }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'rentals'
              ? 'bg-stone-900 text-white font-bold shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Active Tenancies ({rentals.length})</span>
        </button>

        <button
          id="tab-owner-payments"
          onClick={() => {
            setActiveTab('payments');
            onNavigate('/owner/payments');
          }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'payments'
              ? 'bg-stone-900 text-white font-bold shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Income & Rent Ledger</span>
        </button>

        <button
          id="tab-owner-maintenance"
          onClick={() => {
            setActiveTab('maintenance');
            onNavigate('/owner/maintenance');
          }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all relative ${
            activeTab === 'maintenance'
              ? 'bg-stone-900 text-white font-bold shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Maintenance Tickets ({openMaintenance.length})</span>
        </button>

        <button
          id="tab-owner-messages"
          onClick={() => {
            setActiveTab('messages');
            onNavigate('/owner/messages');
          }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'messages'
              ? 'bg-stone-900 text-white font-bold shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Direct Inquiries</span>
        </button>

        <button
          id="tab-owner-add-property"
          onClick={() => {
            setActiveTab('add-property');
            onNavigate('/owner/properties/add');
          }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ml-auto ${
            activeTab === 'add-property'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
              : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Add Listing</span>
        </button>
      </div>

      {/* TAB CONTENT: DASHBOARD OVERVIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Total Properties
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-stone-900">{properties.length}</span>
                <Building2 className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-[11px] text-stone-500">
                {properties.filter((p) => p.approval_status === 'approved').length} verified & listed
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Occupancy Rate
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-600">
                  {incomeStats?.occupancyRate || 0}%
                </span>
                <Users className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-[11px] text-stone-500">
                {rentals.filter((r) => r.status === 'active').length} occupied residential unit(s)
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Collected Gross Rent
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-stone-900">
                  ${(incomeStats?.totalCollected || 0).toLocaleString()}
                </span>
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-[11px] text-stone-500">
                ${(incomeStats?.pendingAmount || 0).toLocaleString()} pending invoicing
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Pending Applications
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-blue-600">{pendingRequests.length}</span>
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-[11px] text-stone-500">Awaiting landlord approval</p>
            </div>
          </div>

          {/* Pending Tenant Requests Spotlight */}
          {pendingRequests.length > 0 && (
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Tenant Applications Requiring Review</span>
                </h3>
                <button
                  onClick={() => setActiveTab('requests')}
                  className="text-xs text-amber-600 font-bold hover:underline"
                >
                  View All ({requests.length})
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl border border-blue-100 bg-blue-50/40 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-stone-900">
                          {req.tenant?.name || 'Applicant'}
                        </h4>
                        <p className="text-[11px] text-stone-500">
                          {req.tenant?.email} • {req.tenant?.phone}
                        </p>
                        <p className="text-xs font-semibold text-stone-800 mt-1">
                          Property: {req.property?.title}
                        </p>
                      </div>
                      <span className="text-xs font-extrabold text-stone-900">
                        ${req.property?.monthly_rent?.toLocaleString()}/mo
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-600 grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-blue-100">
                      <span>Move-In: {new Date(req.move_in_date).toLocaleDateString()}</span>
                      <span>Duration: {req.lease_duration_months} mos</span>
                      <span>Occupants: {req.occupants_count}</span>
                      <span>App #{req.id}</span>
                    </div>

                    {req.message && (
                      <p className="text-[11px] text-stone-600 italic">"{req.message}"</p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleBookingAction(req.id, 'accepted')}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                      >
                        Accept & Create Lease
                      </button>
                      <button
                        onClick={() => handleBookingAction(req.id, 'rejected')}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Portfolio Grid */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>Recent Properties</span>
              </h3>
              <button
                onClick={() => setActiveTab('properties')}
                className="text-xs text-amber-600 font-bold hover:underline"
              >
                Manage All ({properties.length})
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {properties.slice(0, 3).map((prop) => (
                <div
                  key={prop.id}
                  className="rounded-2xl border border-stone-200 overflow-hidden hover:shadow-md transition-shadow bg-white"
                >
                  <div className="h-36 overflow-hidden relative">
                    <img
                      src={prop.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80'}
                      alt={prop.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <StatusBadge status={prop.approval_status} type="approval" />
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <h4 className="text-xs font-bold text-stone-900 truncate">{prop.title}</h4>
                    <p className="text-[11px] text-stone-500 truncate">{prop.city}, {prop.state}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                      <span className="text-sm font-extrabold text-stone-900">
                        ${prop.monthly_rent.toLocaleString()}
                        <span className="text-[10px] font-normal text-stone-500">/mo</span>
                      </span>
                      <button
                        onClick={() => onViewProperty(prop.id)}
                        className="text-xs text-amber-600 font-semibold hover:underline"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MY LISTINGS */}
      {activeTab === 'properties' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Listed Rental Properties</h2>
              <p className="text-xs text-stone-500">
                View status, availability, and administrative approvals for all your properties.
              </p>
            </div>
            <button
              onClick={() => {
                setActiveTab('add-property');
                onNavigate('/owner/properties/add');
              }}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Another Property</span>
            </button>
          </div>

          {properties.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400 space-y-3">
              <Building2 className="w-10 h-10 text-stone-300 mx-auto" />
              <p>You haven't listed any properties yet.</p>
              <button
                onClick={() => setActiveTab('add-property')}
                className="px-4 py-2 bg-amber-500 text-stone-950 font-bold rounded-xl"
              >
                List Your First Property
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((prop) => (
                <div
                  key={prop.id}
                  className="rounded-2xl border border-stone-200 bg-stone-50/30 overflow-hidden flex flex-col justify-between hover:shadow-sm transition-all"
                >
                  <div>
                    <div className="h-44 relative overflow-hidden bg-stone-100">
                      <img
                        src={prop.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80'}
                        alt={prop.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <StatusBadge status={prop.approval_status} type="approval" />
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            prop.is_available
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-200 text-stone-800'
                          }`}
                        >
                          {prop.is_available ? 'Available' : 'Occupied'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h4 className="text-sm font-bold text-stone-900 truncate">{prop.title}</h4>
                      <p className="text-xs text-stone-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        {prop.address}, {prop.city}, {prop.state}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-stone-600 pt-2 border-t border-stone-200/60">
                        <span>{prop.bedrooms} Beds</span>
                        <span>•</span>
                        <span>{prop.bathrooms} Baths</span>
                        <span>•</span>
                        <span>{prop.area_sqft} sqft</span>
                      </div>

                      {prop.rejection_reason && prop.approval_status === 'rejected' && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800">
                          <strong>Admin Note:</strong> {prop.rejection_reason}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <span className="text-base font-extrabold text-stone-900">
                        ${prop.monthly_rent.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-stone-500 block -mt-0.5">per month</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewProperty(prop.id)}
                        className="p-2 hover:bg-stone-100 text-stone-600 rounded-lg text-xs font-semibold flex items-center gap-1"
                        title="View Public Page"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: ADD NEW PROPERTY FORM */}
      {activeTab === 'add-property' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="pb-4 border-b border-stone-100">
            <h2 className="text-lg font-bold text-stone-900">List a New Property for Rent</h2>
            <p className="text-xs text-stone-500">
              Provide thorough specifications. New properties undergo admin approval before appearing in public searches.
            </p>
          </div>

          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateProperty} className="space-y-6 text-xs">
            {/* Title & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-stone-700 mb-1">Property Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Modern High-Rise Loft with City Skyline Views"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Property Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as PropertyType)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-white"
                >
                  <option value="Apartment">Apartment</option>
                  <option value="House">House</option>
                  <option value="Villa">Villa</option>
                  <option value="Studio">Studio</option>
                  <option value="Condo">Condo</option>
                  <option value="Townhouse">Townhouse</option>
                </select>
              </div>
            </div>

            {/* Pricing & Dimensions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Monthly Rent ($) *</label>
                <input
                  type="number"
                  required
                  value={formRent}
                  onChange={(e) => setFormRent(e.target.value)}
                  placeholder="2400"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Security Deposit ($)</label>
                <input
                  type="number"
                  value={formDeposit}
                  onChange={(e) => setFormDeposit(e.target.value)}
                  placeholder="3000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Furnished Status</label>
                <select
                  value={formFurnished}
                  onChange={(e) => setFormFurnished(e.target.value as FurnishedStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-white"
                >
                  <option value="Furnished">Furnished</option>
                  <option value="Semi-Furnished">Semi-Furnished</option>
                  <option value="Unfurnished">Unfurnished</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Area (Sq. Ft)</label>
                <input
                  type="number"
                  value={formSqft}
                  onChange={(e) => setFormSqft(e.target.value)}
                  placeholder="1200"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Beds & Baths */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Bedrooms</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formBeds}
                  onChange={(e) => setFormBeds(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Bathrooms</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formBaths}
                  onChange={(e) => setFormBaths(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Address */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-stone-700 mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="742 Evergreen Terrace"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  placeholder="San Francisco"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">State / Zip</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    placeholder="CA"
                    className="w-1/2 px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <input
                    type="text"
                    value={formZip}
                    onChange={(e) => setFormZip(e.target.value)}
                    placeholder="94103"
                    className="w-1/2 px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Highlight property perks, natural light, nearby transit, floor details, etc."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Images */}
            <div className="space-y-2">
              <label className="block font-semibold text-stone-700">Photo Gallery URLs</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formNewImageUrl}
                  onChange={(e) => setFormNewImageUrl(e.target.value)}
                  placeholder="Paste direct image URL (https://...)"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold transition-colors"
                >
                  Add Photo
                </button>
              </div>

              {formImages.length > 0 && (
                <div className="flex gap-3 overflow-x-auto py-2">
                  {formImages.map((img, idx) => (
                    <div key={idx} className="relative w-24 h-20 shrink-0 rounded-xl overflow-hidden border border-stone-200">
                      <img src={img} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Amenities Checkboxes */}
            <div className="space-y-2">
              <label className="block font-semibold text-stone-700">Included Amenities</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {availableAmenities.map((amen) => {
                  const checked = formAmenities.includes(amen.name);
                  return (
                    <button
                      type="button"
                      key={amen.id}
                      onClick={() => handleToggleAmenity(amen.name)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-colors ${
                        checked
                          ? 'border-amber-600 bg-amber-50/70 text-amber-950 font-bold'
                          : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <span>{amen.name}</span>
                      {checked && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              id="btn-submit-create-property"
              disabled={formSubmitting}
              className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm flex items-center gap-2 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>{formSubmitting ? 'Submitting Listing...' : 'Publish Property Listing'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB CONTENT: TENANT APPLICATIONS / REQUESTS */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="pb-4 border-b border-stone-100">
            <h2 className="text-lg font-bold text-stone-900">Tenant Booking Applications</h2>
            <p className="text-xs text-stone-500">
              When you accept an application, the system automatically marks the property as occupied and generates formal lease tenancies.
            </p>
          </div>

          {requests.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400">
              No booking applications received yet.
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 rounded-2xl border border-stone-200 bg-stone-50/40 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={req.status} type="booking" />
                        <span className="text-xs text-stone-400 font-mono">REQ-00{req.id}</span>
                      </div>
                      <h4 className="text-sm font-bold text-stone-900 mt-1">
                        Application from {req.tenant?.name}
                      </h4>
                      <p className="text-xs text-stone-500">
                        {req.tenant?.email} • {req.tenant?.phone}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-stone-900 block">
                        ${req.property?.monthly_rent?.toLocaleString()}/mo
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Property: {req.property?.title}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-3 rounded-xl border border-stone-200/80">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Requested Move-In
                      </span>
                      <span className="font-bold text-stone-800">
                        {new Date(req.move_in_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Duration
                      </span>
                      <span className="font-bold text-stone-800">
                        {req.lease_duration_months} Months
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Occupants
                      </span>
                      <span className="font-bold text-stone-800">{req.occupants_count}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Submitted Date
                      </span>
                      <span className="text-stone-600">
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {req.message && (
                    <div className="text-xs bg-white p-3 rounded-xl border border-stone-200/60 text-stone-700">
                      <strong>Tenant Statement:</strong> "{req.message}"
                    </div>
                  )}

                  {req.status === 'pending' && (
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={() => handleBookingAction(req.id, 'accepted')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors"
                      >
                        Accept Application & Issue Lease
                      </button>
                      <button
                        onClick={() => handleBookingAction(req.id, 'rejected')}
                        className="px-4 py-2 bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Decline Application
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: ACTIVE LEASES */}
      {activeTab === 'rentals' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="pb-4 border-b border-stone-100">
            <h2 className="text-lg font-bold text-stone-900">Active Tenancies Directory</h2>
            <p className="text-xs text-stone-500">
              Contracted leases, monthly billings, and tenant contact cards.
            </p>
          </div>

          {rentals.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400">
              No active tenant leases currently.
            </div>
          ) : (
            <div className="space-y-4">
              {rentals.map((rental) => (
                <div
                  key={rental.id}
                  className="p-5 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={rental.status} type="lease" />
                        <span className="text-xs font-mono text-stone-400">LEASE-00{rental.id}</span>
                      </div>
                      <h4 className="text-sm font-bold text-stone-900 mt-1">
                        {rental.property?.title}
                      </h4>
                      <p className="text-xs text-stone-500">
                        Tenant: <strong>{rental.tenant?.name}</strong> ({rental.tenant?.email} • {rental.tenant?.phone})
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-extrabold text-stone-900">
                        ${rental.monthly_rent.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-stone-500 block">monthly rent</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-3 rounded-xl border border-stone-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Start Date
                      </span>
                      <span className="font-bold text-stone-800">
                        {new Date(rental.start_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        End Date
                      </span>
                      <span className="font-bold text-stone-800">
                        {new Date(rental.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Deposit Escrow
                      </span>
                      <span className="font-bold text-stone-800">
                        ${rental.security_deposit.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Actions
                      </span>
                      <button
                        onClick={() => {
                          setActiveChatUser(rental.tenant!);
                          setActiveTab('messages');
                        }}
                        className="text-amber-600 font-bold hover:underline"
                      >
                        Message Tenant
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: PAYMENTS & INCOME LEDGER */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Income & Rent Ledger</h2>
              <p className="text-xs text-stone-500">
                Audited record of tenant rent deposits, transactions, and pending dues.
              </p>
            </div>

            <div className="bg-emerald-50 text-emerald-900 px-4 py-2 rounded-2xl border border-emerald-200 text-xs">
              Total Rent Collected:{' '}
              <strong className="text-sm font-extrabold text-emerald-700">
                ${(incomeStats?.totalCollected || 0).toLocaleString()}
              </strong>
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400">
              No rent transactions recorded.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-400 font-semibold uppercase text-[10px]">
                    <th className="py-3 px-3">Period</th>
                    <th className="py-3 px-3">Tenant Name</th>
                    <th className="py-3 px-3">Property Unit</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Method</th>
                    <th className="py-3 px-3">Ref Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-stone-50/60">
                      <td className="py-3 px-3 font-bold text-stone-900">{p.month_year}</td>
                      <td className="py-3 px-3">{p.tenant_name || 'Tenant'}</td>
                      <td className="py-3 px-3">{p.property_title || 'Rental'}</td>
                      <td className="py-3 px-3 font-extrabold text-stone-900">
                        ${p.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={p.status} type="payment" />
                      </td>
                      <td className="py-3 px-3">{p.payment_method || '—'}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-stone-500">
                        {p.transaction_ref}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: MAINTENANCE RESOLUTION */}
      {activeTab === 'maintenance' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="pb-4 border-b border-stone-100">
            <h2 className="text-lg font-bold text-stone-900">Maintenance & Repair Management</h2>
            <p className="text-xs text-stone-500">
              Supervise work orders submitted by tenants, dispatch contractors, and append resolution notes.
            </p>
          </div>

          {maintenance.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400">
              No maintenance complaints logged for your properties.
            </div>
          ) : (
            <div className="space-y-4">
              {maintenance.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-5 rounded-2xl border border-stone-200 bg-stone-50/40 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={ticket.status} type="maintenance" />
                        <span className="text-[10px] font-bold uppercase bg-stone-200 px-1.5 py-0.5 rounded text-stone-700">
                          {ticket.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            ticket.priority === 'emergency'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {ticket.priority} priority
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-stone-900 mt-1">{ticket.title}</h4>
                      <p className="text-xs text-stone-500">
                        Tenant: {ticket.tenant_name} • Unit: {ticket.property_title}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {ticket.status !== 'in_progress' && ticket.status !== 'resolved' && (
                        <button
                          onClick={() => handleUpdateTicket(ticket.id, 'in_progress')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
                        >
                          Mark In-Progress
                        </button>
                      )}
                      {ticket.status !== 'resolved' && (
                        <button
                          onClick={() => {
                            setResolvingTicketId(ticket.id);
                            setResolutionText(ticket.resolution_notes || '');
                          }}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                        >
                          Resolve Ticket
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-stone-700 bg-white p-3 rounded-xl border border-stone-200/80">
                    {ticket.description}
                  </p>

                  {ticket.image_url && (
                    <div className="rounded-xl overflow-hidden border border-stone-200 h-36 w-60 bg-stone-100">
                      <img
                        src={ticket.image_url}
                        alt={ticket.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {resolvingTicketId === ticket.id && (
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                      <label className="block text-xs font-bold text-emerald-950">
                        Resolution Notes for Tenant:
                      </label>
                      <textarea
                        rows={2}
                        value={resolutionText}
                        onChange={(e) => setResolutionText(e.target.value)}
                        placeholder="e.g. Plumber replaced the P-trap valve; tested and clear."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-300 bg-white focus:outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateTicket(ticket.id, 'resolved', resolutionText)}
                          className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl"
                        >
                          Confirm Resolved
                        </button>
                        <button
                          onClick={() => setResolvingTicketId(null)}
                          className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-200/60 rounded-xl"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {ticket.resolution_notes && ticket.status === 'resolved' && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                      <strong>Resolution Notes:</strong> {ticket.resolution_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: MESSAGING */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs grid grid-cols-1 md:grid-cols-3 min-h-[520px]">
          {/* Contacts Sidebar */}
          <div className="border-r border-stone-200 p-4 space-y-3 bg-stone-50/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 px-2">
              Tenant Conversations
            </h3>

            {conversations.length === 0 ? (
              <div className="p-4 text-center text-xs text-stone-400">
                No active conversations yet.
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <button
                    key={conv.contact.id}
                    onClick={() => setActiveChatUser(conv.contact)}
                    className={`w-full p-3 rounded-2xl text-left flex items-center gap-3 transition-colors ${
                      activeChatUser?.id === conv.contact.id
                        ? 'bg-white shadow-xs border border-stone-200'
                        : 'hover:bg-white/80'
                    }`}
                  >
                    <img
                      src={
                        conv.contact.avatar ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'
                      }
                      alt={conv.contact.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-stone-900 truncate">
                          {conv.contact.name}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="w-4 h-4 bg-amber-500 text-stone-950 font-bold rounded-full text-[10px] flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 truncate mt-0.5">
                        {conv.lastMessage.message}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active Chat Thread */}
          <div className="md:col-span-2 flex flex-col h-[520px]">
            {activeChatUser ? (
              <>
                <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        activeChatUser.avatar ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'
                      }
                      alt={activeChatUser.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">{activeChatUser.name}</h4>
                      <p className="text-[10px] text-stone-400 capitalize">
                        {activeChatUser.role} • {activeChatUser.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50/30">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-12 text-xs text-stone-400">
                      Send a message to reply to {activeChatUser.name}.
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs sm:max-w-sm rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                              isMe
                                ? 'bg-stone-900 text-white rounded-br-xs'
                                : 'bg-white text-stone-800 border border-stone-200 rounded-bl-xs shadow-2xs'
                            }`}
                          >
                            <p>{msg.message}</p>
                            <span
                              className={`text-[9px] mt-1 block text-right ${
                                isMe ? 'text-stone-400' : 'text-stone-400'
                              }`}
                            >
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-stone-200 flex items-center gap-2 bg-white"
                >
                  <input
                    type="text"
                    id="input-owner-chat-message"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder={`Message ${activeChatUser.name}...`}
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <button
                    type="submit"
                    id="btn-owner-send-message"
                    disabled={!newMessageText.trim()}
                    className="p-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white rounded-xl transition-colors"
                  >
                    <Send className="w-4 h-4 text-amber-400" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-stone-400">
                Select a tenant on the left to start messaging.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
