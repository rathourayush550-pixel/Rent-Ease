import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import {
  Booking,
  Rental,
  Payment,
  MaintenanceRequest,
  Conversation,
  Message,
  User,
} from '../types.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { PayRentModal } from '../components/modals/PayRentModal.tsx';
import { MaintenanceModal } from '../components/modals/MaintenanceModal.tsx';
import {
  LayoutDashboard,
  FileText,
  Home,
  CreditCard,
  Wrench,
  MessageSquare,
  Clock,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Send,
  Plus,
  ArrowRight,
  User as UserIcon,
  ShieldCheck,
  Building,
  MapPin,
  HelpCircle,
} from 'lucide-react';

interface TenantPortalProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onViewProperty: (id: number) => void;
}

export const TenantPortal: React.FC<TenantPortalProps> = ({
  currentPath,
  onNavigate,
  onViewProperty,
}) => {
  const { user } = useAuth();

  // Active section based on URL or local state
  const getInitialTab = () => {
    if (currentPath.includes('/tenant/bookings')) return 'bookings';
    if (currentPath.includes('/tenant/rentals')) return 'rentals';
    if (currentPath.includes('/tenant/payments')) return 'payments';
    if (currentPath.includes('/tenant/maintenance')) return 'maintenance';
    if (currentPath.includes('/tenant/messages')) return 'messages';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab());

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [currentPath]);

  // Data states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedPaymentForModal, setSelectedPaymentForModal] = useState<Payment | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, rentalsRes, paymentsRes, maintRes, convRes] = await Promise.all([
        api.bookings.getTenantBookings().catch(() => ({ success: false, bookings: [] })),
        api.rentals.getAll().catch(() => ({ success: false, rentals: [] })),
        api.payments.getAll().catch(() => ({ success: false, payments: [] })),
        api.maintenance.getAll().catch(() => ({ success: false, requests: [] })),
        api.messages.getConversations().catch(() => ({ success: false, conversations: [] })),
      ]);

      if (bookingsRes.success) setBookings(bookingsRes.bookings || []);
      if (rentalsRes.success) setRentals(rentalsRes.rentals || []);
      if (paymentsRes.success) setPayments(paymentsRes.payments || []);
      if (maintRes.success) setMaintenance(maintRes.requests || []);
      if (convRes.success) {
        setConversations(convRes.conversations || []);
        if (convRes.conversations && convRes.conversations.length > 0 && !activeChatUser) {
          setActiveChatUser(convRes.conversations[0].contact);
        }
      }
    } catch (err) {
      console.error('Error fetching tenant data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Load chat thread when active chat user changes
  useEffect(() => {
    if (!activeChatUser) return;
    const fetchChat = async () => {
      try {
        const res = await api.messages.getThread(activeChatUser.id);
        if (res.success) {
          setChatMessages(res.messages || []);
        }
      } catch (err) {
        console.error('Failed to load chat thread:', err);
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

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking request?')) return;
    try {
      await api.bookings.updateStatus(bookingId, { status: 'cancelled' });
      setActionSuccess('Booking request cancelled.');
      setTimeout(() => setActionSuccess(null), 3000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking.');
    }
  };

  const handlePayRentClick = (payment: Payment) => {
    setSelectedPaymentForModal(payment);
    setIsPayModalOpen(true);
  };

  const pendingPayments = payments.filter((p) => p.status === 'pending' || p.status === 'overdue');
  const activeRental = rentals.find((r) => r.status === 'active') || rentals[0];

  return (
    <div id="page-tenant-portal" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 to-stone-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs uppercase tracking-wider border border-emerald-500/30">
              Tenant Workspace
            </span>
            {user?.is_verified && (
              <span className="flex items-center gap-1 text-xs text-stone-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Renter
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hello, {user?.name || 'Tenant'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 max-w-xl">
            Manage your lease agreements, schedule rent payments, report maintenance issues, and communicate directly with landlords.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="btn-tenant-browse"
            onClick={() => onNavigate('/properties')}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Building className="w-3.5 h-3.5 text-amber-400" />
            <span>Find New Properties</span>
          </button>
          {rentals.length > 0 && (
            <button
              id="btn-tenant-new-ticket"
              onClick={() => setIsMaintenanceModalOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Report Issue</span>
            </button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-stone-200 text-xs font-medium scrollbar-none">
        <button
          id="tab-tenant-dashboard"
          onClick={() => {
            setActiveTab('dashboard');
            onNavigate('/tenant/dashboard');
          }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'dashboard'
              ? 'bg-stone-900 text-white font-bold shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard Overview</span>
        </button>

        <button
          id="tab-tenant-bookings"
          onClick={() => {
            setActiveTab('bookings');
            onNavigate('/tenant/bookings');
          }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'bookings'
              ? 'bg-stone-900 text-white font-bold shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Booking Requests ({bookings.length})</span>
        </button>

        <button
          id="tab-tenant-rentals"
          onClick={() => {
            setActiveTab('rentals');
            onNavigate('/tenant/rentals');
          }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'rentals'
              ? 'bg-stone-900 text-white font-bold shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>My Leases ({rentals.length})</span>
        </button>

        <button
          id="tab-tenant-payments"
          onClick={() => {
            setActiveTab('payments');
            onNavigate('/tenant/payments');
          }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all relative ${
            activeTab === 'payments'
              ? 'bg-stone-900 text-white font-bold shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Rent & Invoices</span>
          {pendingPayments.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        <button
          id="tab-tenant-maintenance"
          onClick={() => {
            setActiveTab('maintenance');
            onNavigate('/tenant/maintenance');
          }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'maintenance'
              ? 'bg-stone-900 text-white font-bold shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Maintenance ({maintenance.length})</span>
        </button>

        <button
          id="tab-tenant-messages"
          onClick={() => {
            setActiveTab('messages');
            onNavigate('/tenant/messages');
          }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'messages'
              ? 'bg-stone-900 text-white font-bold shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Landlord Chat</span>
        </button>
      </div>

      {/* TAB CONTENT: DASHBOARD OVERVIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Active Tenancies
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-stone-900">{rentals.length}</span>
                <Home className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-[11px] text-stone-500">
                {activeRental ? `Current: ${activeRental.property?.title}` : 'No active rental yet'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Pending Due
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-rose-600">
                  $
                  {pendingPayments
                    .reduce((acc, p) => acc + Number(p.amount), 0)
                    .toLocaleString()}
                </span>
                <CreditCard className="w-5 h-5 text-rose-500" />
              </div>
              <p className="text-[11px] text-stone-500">
                {pendingPayments.length} unpaid rent invoice(s)
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Applications
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-stone-900">{bookings.length}</span>
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-[11px] text-stone-500">
                {bookings.filter((b) => b.status === 'pending').length} under landlord review
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Open Complaints
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-stone-900">
                  {maintenance.filter((m) => m.status !== 'resolved').length}
                </span>
                <Wrench className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-[11px] text-stone-500">
                {maintenance.filter((m) => m.status === 'in_progress').length} in progress
              </p>
            </div>
          </div>

          {/* Active Lease Spotlight */}
          {activeRental ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Primary Active Residence
                  </span>
                  <h3 className="text-xl font-bold text-stone-900 mt-1">
                    {activeRental.property?.title}
                  </h3>
                  <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    {activeRental.property?.address}, {activeRental.property?.city},{' '}
                    {activeRental.property?.state}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewProperty(activeRental.property_id)}
                    className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors"
                  >
                    View Property Specs
                  </button>
                  <button
                    onClick={() => setIsMaintenanceModalOpen(true)}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-colors"
                  >
                    Request Repair
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/60">
                  <span className="text-stone-400 font-semibold block text-[10px] uppercase">
                    Monthly Rent
                  </span>
                  <span className="text-base font-black text-stone-900">
                    ${activeRental.monthly_rent.toLocaleString()}
                  </span>
                </div>
                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/60">
                  <span className="text-stone-400 font-semibold block text-[10px] uppercase">
                    Security Deposit
                  </span>
                  <span className="text-base font-black text-stone-900">
                    ${activeRental.security_deposit.toLocaleString()}
                  </span>
                </div>
                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/60">
                  <span className="text-stone-400 font-semibold block text-[10px] uppercase">
                    Lease Term Start
                  </span>
                  <span className="text-sm font-bold text-stone-800">
                    {new Date(activeRental.start_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/60">
                  <span className="text-stone-400 font-semibold block text-[10px] uppercase">
                    Lease Term End
                  </span>
                  <span className="text-sm font-bold text-stone-800">
                    {new Date(activeRental.end_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Landlord Contact Card */}
              {activeRental.owner && (
                <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200/60 flex items-center justify-between flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        activeRental.owner.avatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
                      }
                      alt={activeRental.owner.name}
                      className="w-10 h-10 rounded-full object-cover border border-amber-300"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-stone-900">{activeRental.owner.name}</span>
                        <span className="text-[10px] bg-amber-200/60 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                          Landlord
                        </span>
                      </div>
                      <span className="text-stone-500">{activeRental.owner.email} • {activeRental.owner.phone}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveChatUser(activeRental.owner!);
                      setActiveTab('messages');
                      onNavigate('/tenant/messages');
                    }}
                    className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    <span>Chat with Landlord</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Home className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900">No Active Lease Contract</h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                You currently do not have any active rental leases. Search properties and submit an application to start renting.
              </p>
              <button
                onClick={() => onNavigate('/properties')}
                className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl shadow-sm inline-flex items-center gap-2"
              >
                <span>Browse Rental Listings</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Pending Invoices Quick Table */}
          {pendingPayments.length > 0 && (
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-rose-600" />
                  <span>Pending Invoices Requiring Payment</span>
                </h3>
                <button
                  onClick={() => setActiveTab('payments')}
                  className="text-xs text-amber-600 hover:underline font-semibold"
                >
                  View All ({payments.length})
                </button>
              </div>

              <div className="divide-y divide-stone-100">
                {pendingPayments.map((pay) => (
                  <div key={pay.id} className="py-3 flex items-center justify-between flex-wrap gap-3 text-xs">
                    <div>
                      <p className="font-bold text-stone-900">
                        {pay.payment_type} – {pay.month_year}
                      </p>
                      <p className="text-stone-500 text-[11px]">
                        Property: {pay.property_title || 'Active Rental'} • Ref #{pay.transaction_ref}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm font-black text-rose-600">
                        ${pay.amount.toLocaleString()}
                      </span>
                      <button
                        onClick={() => handlePayRentClick(pay)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-xs transition-colors"
                      >
                        Pay Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: BOOKING APPLICATIONS */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-lg font-bold text-stone-900">My Rental Applications</h2>
              <p className="text-xs text-stone-500">
                Track requests submitted to landlords for residential leases.
              </p>
            </div>
            <button
              onClick={() => onNavigate('/properties')}
              className="px-3.5 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors"
            >
              Find More Listings
            </button>
          </div>

          {bookings.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <FileText className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="text-xs text-stone-500">You haven't submitted any rental applications yet.</p>
              <button
                onClick={() => onNavigate('/properties')}
                className="px-4 py-2 bg-amber-500 text-stone-950 rounded-xl text-xs font-bold"
              >
                Browse Available Units
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-5 rounded-2xl border border-stone-200 bg-stone-50/40 hover:bg-stone-50 transition-colors space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={booking.status} type="booking" />
                        <span className="text-[11px] text-stone-400">
                          Submitted on {new Date(booking.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4
                        onClick={() => onViewProperty(booking.property_id)}
                        className="text-sm font-bold text-stone-900 hover:text-amber-600 cursor-pointer transition-colors"
                      >
                        {booking.property?.title || `Property #${booking.property_id}`}
                      </h4>
                      <p className="text-xs text-stone-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        {booking.property?.address}, {booking.property?.city}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-stone-900">
                        ${booking.property?.monthly_rent?.toLocaleString()}/mo
                      </span>
                      {booking.status === 'pending' && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl font-medium transition-colors"
                        >
                          Cancel Request
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-3 rounded-xl border border-stone-200/70">
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase font-semibold block">
                        Desired Move-In
                      </span>
                      <span className="font-bold text-stone-800">
                        {new Date(booking.move_in_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase font-semibold block">
                        Duration
                      </span>
                      <span className="font-bold text-stone-800">
                        {booking.lease_duration_months} Months
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase font-semibold block">
                        Occupants
                      </span>
                      <span className="font-bold text-stone-800">
                        {booking.occupants_count} Person(s)
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase font-semibold block">
                        Application Ref
                      </span>
                      <span className="font-mono text-stone-600">REQ-00{booking.id}</span>
                    </div>
                  </div>

                  {booking.message && (
                    <div className="text-xs text-stone-600 bg-white p-3 rounded-xl border border-stone-200/60">
                      <span className="font-bold text-stone-700 block mb-0.5">Your Note to Landlord:</span>
                      "{booking.message}"
                    </div>
                  )}

                  {booking.status === 'accepted' && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                      <span>
                        Landlord accepted! Your lease is active. View under <strong>My Leases</strong>.
                      </span>
                      <button
                        onClick={() => setActiveTab('rentals')}
                        className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-500"
                      >
                        View Lease
                      </button>
                    </div>
                  )}

                  {booking.status === 'rejected' && booking.rejection_note && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                      <strong>Landlord Feedback:</strong> {booking.rejection_note}
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
            <h2 className="text-lg font-bold text-stone-900">Active & Historical Leases</h2>
            <p className="text-xs text-stone-500">
              Formal lease agreements created after landlord approval of your booking request.
            </p>
          </div>

          {rentals.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Home className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="text-xs text-stone-500">No tenancy records found.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {rentals.map((rental) => (
                <div
                  key={rental.id}
                  className="p-6 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={rental.status} type="lease" />
                        <span className="text-xs font-mono text-stone-400">LEASE-TEN-{rental.id}</span>
                      </div>
                      <h3 className="text-base font-bold text-stone-900 mt-1">
                        {rental.property?.title}
                      </h3>
                      <p className="text-xs text-stone-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        {rental.property?.address}, {rental.property?.city}, {rental.property?.state}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewProperty(rental.property_id)}
                        className="px-3 py-1.5 text-xs font-semibold bg-white border border-stone-300 rounded-xl hover:bg-stone-50"
                      >
                        Listing Details
                      </button>
                      <button
                        onClick={() => setIsMaintenanceModalOpen(true)}
                        className="px-3.5 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl transition-colors"
                      >
                        Request Repair
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-4 rounded-xl border border-stone-200">
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase font-bold block">
                        Monthly Rent
                      </span>
                      <span className="text-base font-extrabold text-stone-900">
                        ${rental.monthly_rent.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase font-bold block">
                        Deposit Held
                      </span>
                      <span className="text-base font-extrabold text-stone-900">
                        ${rental.security_deposit.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase font-bold block">
                        Tenancy Commenced
                      </span>
                      <span className="font-bold text-stone-800">
                        {new Date(rental.start_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase font-bold block">
                        Tenancy Expiration
                      </span>
                      <span className="font-bold text-stone-800">
                        {new Date(rental.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {rental.owner && (
                    <div className="flex items-center justify-between text-xs bg-white p-3.5 rounded-xl border border-stone-200/80">
                      <div className="flex items-center gap-2.5">
                        <UserIcon className="w-4 h-4 text-stone-400" />
                        <div>
                          <span className="font-bold text-stone-900">{rental.owner.name}</span>
                          <span className="text-stone-500 ml-2">
                            ({rental.owner.phone || rental.owner.email})
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setActiveChatUser(rental.owner!);
                          setActiveTab('messages');
                        }}
                        className="text-xs text-amber-600 font-bold hover:underline flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat Landlord</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: PAYMENTS & INVOICES */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Rent Payments & Invoices</h2>
              <p className="text-xs text-stone-500">
                Simulate online rent settlements using Credit Card, UPI, or Bank Transfer.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-stone-600">
                Pending Balance:{' '}
                <strong className="text-rose-600 font-bold">
                  $
                  {pendingPayments
                    .reduce((sum, p) => sum + Number(p.amount), 0)
                    .toLocaleString()}
                </strong>
              </span>
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400">
              No payment invoices recorded for this account.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-400 font-semibold uppercase text-[10px]">
                    <th className="py-3 px-3">Invoice & Period</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Payment Method</th>
                    <th className="py-3 px-3">Transaction Ref</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {payments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3.5 px-3">
                        <p className="font-bold text-stone-900">{pay.month_year}</p>
                        <p className="text-[11px] text-stone-500">{pay.property_title || 'Active Rental'}</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-800 font-medium">
                          {pay.payment_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-extrabold text-stone-900">
                        ${pay.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3">
                        <StatusBadge status={pay.status} type="payment" />
                      </td>
                      <td className="py-3.5 px-3 text-stone-600">
                        {pay.payment_method || '—'}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-[11px] text-stone-500">
                        {pay.transaction_ref}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {pay.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Paid {pay.paid_at ? new Date(pay.paid_at).toLocaleDateString() : ''}
                          </span>
                        ) : (
                          <button
                            onClick={() => handlePayRentClick(pay)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-2xs transition-colors"
                          >
                            Pay Rent
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: MAINTENANCE REQUESTS */}
      {activeTab === 'maintenance' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Maintenance & Repair Tickets</h2>
              <p className="text-xs text-stone-500">
                Report electrical, plumbing, HVAC, or appliance issues directly to your landlord.
              </p>
            </div>

            <button
              id="btn-open-maintenance-modal"
              disabled={rentals.length === 0}
              onClick={() => setIsMaintenanceModalOpen(true)}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Report New Issue</span>
            </button>
          </div>

          {rentals.length === 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900">
              Note: You can submit maintenance tickets once you have an active tenancy agreement.
            </div>
          )}

          {maintenance.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400 space-y-2">
              <Wrench className="w-8 h-8 text-stone-300 mx-auto" />
              <p>No maintenance requests logged.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {maintenance.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-5 rounded-2xl border border-stone-200 bg-stone-50/40 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={ticket.status} type="maintenance" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 bg-stone-200/70 px-1.5 py-0.5 rounded">
                          {ticket.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            ticket.priority === 'emergency'
                              ? 'bg-rose-100 text-rose-800'
                              : ticket.priority === 'high'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {ticket.priority} priority
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-stone-900">{ticket.title}</h4>
                      <p className="text-[11px] text-stone-500">
                        {ticket.property_title || 'Rental Unit'} • Logged{' '}
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 bg-white p-3 rounded-xl border border-stone-200/60 leading-relaxed">
                    {ticket.description}
                  </p>

                  {ticket.image_url && (
                    <div className="rounded-xl overflow-hidden border border-stone-200 h-32 bg-stone-100">
                      <img
                        src={ticket.image_url}
                        alt={ticket.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {ticket.resolution_notes && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                      <span className="font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Landlord Resolution
                        Notes:
                      </span>
                      <p>{ticket.resolution_notes}</p>
                      {ticket.resolved_at && (
                        <span className="text-[10px] text-emerald-600 block">
                          Resolved on {new Date(ticket.resolved_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: MESSAGES WITH LANDLORD */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs grid grid-cols-1 md:grid-cols-3 min-h-[520px]">
          {/* Contacts Sidebar */}
          <div className="border-r border-stone-200 p-4 space-y-3 bg-stone-50/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 px-2">
              Landlord Conversations
            </h3>

            {conversations.length === 0 ? (
              <div className="p-4 text-center text-xs text-stone-400">
                No active message threads. Inquire on any property page to start a chat.
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
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
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
                {/* Chat Header */}
                <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        activeChatUser.avatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
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

                {/* Message List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50/30">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-12 text-xs text-stone-400">
                      Send a message to begin conversation with {activeChatUser.name}.
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

                {/* Input Field */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-stone-200 flex items-center gap-2 bg-white"
                >
                  <input
                    type="text"
                    id="input-tenant-chat-message"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder={`Message ${activeChatUser.name}...`}
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <button
                    type="submit"
                    id="btn-tenant-send-message"
                    disabled={!newMessageText.trim()}
                    className="p-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white rounded-xl transition-colors"
                  >
                    <Send className="w-4 h-4 text-amber-400" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-stone-400">
                Select a contact on the left to start messaging.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pay Rent Modal */}
      <PayRentModal
        payment={selectedPaymentForModal}
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        onSuccess={() => {
          setActionSuccess('Rent payment successful! Receipt recorded.');
          setTimeout(() => setActionSuccess(null), 3500);
          loadData();
        }}
      />

      {/* Maintenance Request Modal */}
      <MaintenanceModal
        rentals={rentals}
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        onSuccess={() => {
          setActionSuccess('Maintenance request submitted to your landlord.');
          setTimeout(() => setActionSuccess(null), 3500);
          loadData();
        }}
      />
    </div>
  );
};
