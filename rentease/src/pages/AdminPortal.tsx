import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { User, Property } from '../types.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import {
  LayoutDashboard,
  Users,
  Shield,
  Database,
  Building2,
  FileCheck,
  CheckCircle2,
  XCircle,
  Download,
  Search,
  Lock,
  Unlock,
  BadgeCheck,
  Home,
  CreditCard,
  Wrench,
  DollarSign,
  AlertTriangle,
  Eye,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface AdminPortalProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onViewProperty: (id: number) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentPath,
  onNavigate,
  onViewProperty,
}) => {
  const { user } = useAuth();

  const getInitialTab = () => {
    if (currentPath.includes('/admin/users')) return 'users';
    if (currentPath.includes('/admin/properties')) return 'properties';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab());

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [currentPath]);

  // States
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [propertiesList, setPropertiesList] = useState<Property[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState<string>('');
  const [userSearch, setUserSearch] = useState<string>('');
  const [propertyFilter, setPropertyFilter] = useState<string>('pending');
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, propsRes] = await Promise.all([
        api.admin.getStats().catch(() => ({ success: false, stats: null })),
        api.admin.getUsers().catch(() => ({ success: false, users: [] })),
        api.properties.getAll().catch(() => ({ success: false, properties: [] })),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (usersRes.success) setUsersList(usersRes.users || []);
      if (propsRes.success) setPropertiesList(propsRes.properties || []);
    } catch (err) {
      console.error('Failed to load admin console data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleBlock = async (targetUser: User) => {
    const action = targetUser.is_blocked ? 'unblock' : 'block';
    if (!confirm(`Are you sure you want to ${action} ${targetUser.name}?`)) return;

    try {
      const res = await api.admin.toggleBlock(targetUser.id);
      if (res.success) {
        setActionNotice(res.message);
        setTimeout(() => setActionNotice(null), 3000);
        setUsersList((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, is_blocked: !u.is_blocked } : u))
        );
      }
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleVerifyOwner = async (owner: User) => {
    try {
      const res = await api.admin.verifyOwner(owner.id);
      if (res.success) {
        setActionNotice(res.message);
        setTimeout(() => setActionNotice(null), 3000);
        setUsersList((prev) =>
          prev.map((u) => (u.id === owner.id ? { ...u, is_verified: !u.is_verified } : u))
        );
      }
    } catch (err: any) {
      alert(err.message || 'Verification update failed');
    }
  };

  const handlePropertyApproval = async (propertyId: number, status: 'approved' | 'rejected') => {
    let reason: string | undefined;
    if (status === 'rejected') {
      const input = prompt('Enter a rejection reason for the property owner:');
      if (input === null) return;
      reason = input || 'Does not meet platform quality or verification requirements.';
    }

    try {
      const res = await api.admin.updateApproval(propertyId, {
        status,
        rejection_reason: reason,
      });
      if (res.success) {
        setActionNotice(`Property has been ${status}.`);
        setTimeout(() => setActionNotice(null), 3000);
        loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Approval update failed');
    }
  };

  // Filtered lists
  const filteredUsers = usersList.filter((u) => {
    if (userRoleFilter && u.role !== userRoleFilter) return false;
    if (userSearch) {
      const term = userSearch.toLowerCase();
      return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
    }
    return true;
  });

  const filteredProperties = propertiesList.filter((p) => {
    if (propertyFilter === 'all') return true;
    return p.approval_status === propertyFilter;
  });

  const pendingApprovalsCount = propertiesList.filter((p) => p.approval_status === 'pending').length;

  return (
    <div id="page-admin-portal" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 to-stone-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold text-xs uppercase tracking-wider border border-purple-500/30">
              System Administrator Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            RentEase Administration
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 max-w-xl">
            Audit user accounts, enforce owner verification compliance, review property listings, and supervise platform operations.
          </p>
        </div>
      </div>

      {actionNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-stone-200 text-xs font-medium scrollbar-none">
        <button
          id="tab-admin-overview"
          onClick={() => {
            setActiveTab('overview');
            onNavigate('/admin/dashboard');
          }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'overview'
              ? 'bg-stone-900 text-white font-bold shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Platform Metrics</span>
        </button>

        <button
          id="tab-admin-users"
          onClick={() => {
            setActiveTab('users');
            onNavigate('/admin/users');
          }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'users'
              ? 'bg-stone-900 text-white font-bold shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts ({usersList.length})</span>
        </button>

        <button
          id="tab-admin-properties"
          onClick={() => {
            setActiveTab('properties');
            onNavigate('/admin/properties');
          }}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all relative ${
            activeTab === 'properties'
              ? 'bg-stone-900 text-white font-bold shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Property Approvals</span>
          {pendingApprovalsCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
          )}
        </button>
      </div>

      {/* TAB CONTENT: PLATFORM METRICS OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Registered Users
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-stone-900">{stats?.totalUsers || 0}</span>
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-[11px] text-stone-500">
                {stats?.tenantsCount || 0} tenants • {stats?.ownersCount || 0} landlords
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Listings Under Review
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-amber-600">
                  {stats?.pendingProperties || 0}
                </span>
                <Shield className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-[11px] text-stone-500">
                {stats?.approvedProperties || 0} approved & live
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Active Leases
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-600">
                  {stats?.activeRentals || 0}
                </span>
                <Home className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-[11px] text-stone-500">
                {stats?.totalBookings || 0} total applications processed
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Platform GMV Rent
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-stone-900">
                  ${(stats?.totalRentCollected || 0).toLocaleString()}
                </span>
                <CreditCard className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-[11px] text-stone-500">Total settled rent volume</p>
            </div>
          </div>

          {/* Pending Approval Attention Box */}
          {pendingApprovalsCount > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>{pendingApprovalsCount} property listing(s) awaiting approval</span>
                </h3>
                <p className="text-xs text-amber-800">
                  Review specifications and quality criteria to publish or reject these units.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('properties')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
              >
                Review Listings
              </button>
            </div>
          )}

          {/* Platform System Health & Activity Card */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>System Health & Operational Status</span>
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                All Services Online
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/70 space-y-1">
                <span className="font-semibold text-stone-500 uppercase text-[10px] tracking-wider block">
                  Session & Authentication
                </span>
                <p className="font-bold text-stone-900">JWT Stateless Security Active</p>
                <p className="text-[11px] text-stone-500">256-bit signed token authorization</p>
              </div>

              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/70 space-y-1">
                <span className="font-semibold text-stone-500 uppercase text-[10px] tracking-wider block">
                  Listing Moderation Queue
                </span>
                <p className="font-bold text-stone-900">{pendingApprovalsCount} Listings Awaiting Review</p>
                <p className="text-[11px] text-stone-500">Verified landlord listings expedited</p>
              </div>

              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/70 space-y-1">
                <span className="font-semibold text-stone-500 uppercase text-[10px] tracking-wider block">
                  Lease & Tenancy Engine
                </span>
                <p className="font-bold text-stone-900">{stats?.activeRentals || 0} Active Leases Enforced</p>
                <p className="text-[11px] text-stone-500">Automated billing and ledger tracking</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: USER & OWNER CONTROL */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-lg font-bold text-stone-900">User Management & Moderation</h2>
              <p className="text-xs text-stone-500">
                Audit accounts, toggle landlord verification credentials, and restrict fraudulent access.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user name or email..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white"
              >
                <option value="">All Roles</option>
                <option value="tenant">Tenants</option>
                <option value="owner">Landlords (Owners)</option>
                <option value="admin">Administrators</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-3">User Profile</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Verification</th>
                  <th className="py-3 px-3 text-right">Moderation Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50/60">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            u.avatar ||
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
                          }
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-bold text-stone-900">{u.name}</p>
                          <p className="text-[11px] text-stone-400 font-mono">UID-{u.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'owner'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <p className="text-stone-900">{u.email}</p>
                      <p className="text-[11px] text-stone-400">{u.phone || 'No phone'}</p>
                    </td>

                    <td className="py-3.5 px-3">
                      {u.is_blocked ? (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                          Blocked
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                          Active
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      {u.role === 'owner' ? (
                        <button
                          onClick={() => handleVerifyOwner(u)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1 border transition-colors ${
                            u.is_verified
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                          }`}
                        >
                          <BadgeCheck className="w-3.5 h-3.5" />
                          <span>{u.is_verified ? 'Verified Owner' : 'Unverified'}</span>
                        </button>
                      ) : (
                        <span className="text-stone-400 text-[11px]">N/A</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleBlock(u)}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 ml-auto transition-colors ${
                            u.is_blocked
                              ? 'bg-stone-900 text-white hover:bg-stone-800'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          }`}
                        >
                          {u.is_blocked ? (
                            <>
                              <Unlock className="w-3.5 h-3.5" /> Unblock
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" /> Block
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PROPERTY APPROVALS */}
      {activeTab === 'properties' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Property Verification & Approvals</h2>
              <p className="text-xs text-stone-500">
                Every owner-listed property requires admin approval before being indexed in tenant search results.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPropertyFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  propertyFilter === 'pending'
                    ? 'bg-stone-900 text-white font-bold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Pending Review ({propertiesList.filter((p) => p.approval_status === 'pending').length})
              </button>
              <button
                onClick={() => setPropertyFilter('approved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  propertyFilter === 'approved'
                    ? 'bg-stone-900 text-white font-bold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Approved ({propertiesList.filter((p) => p.approval_status === 'approved').length})
              </button>
              <button
                onClick={() => setPropertyFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  propertyFilter === 'all'
                    ? 'bg-stone-900 text-white font-bold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                All ({propertiesList.length})
              </button>
            </div>
          </div>

          {filteredProperties.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400">
              No properties match the selected filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProperties.map((prop) => (
                <div
                  key={prop.id}
                  className="rounded-2xl border border-stone-200 bg-stone-50/40 p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="h-40 rounded-xl overflow-hidden relative bg-stone-100">
                      <img
                        src={prop.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80'}
                        alt={prop.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2.5 left-2.5">
                        <StatusBadge status={prop.approval_status} type="approval" />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-stone-900">{prop.title}</h4>
                      <p className="text-xs text-stone-500">
                        {prop.address}, {prop.city}, {prop.state}
                      </p>
                      <p className="text-xs text-stone-600 mt-1">
                        Owner: <strong>{prop.owner_name}</strong> ({prop.owner_email})
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs bg-white p-2.5 rounded-xl border border-stone-200">
                      <div>
                        <span className="text-[10px] uppercase text-stone-400 block font-bold">Rent</span>
                        <span className="font-extrabold text-stone-900">${prop.monthly_rent}/mo</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-stone-400 block font-bold">Deposit</span>
                        <span className="font-bold text-stone-800">${prop.security_deposit}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-stone-400 block font-bold">Specs</span>
                        <span className="text-stone-700">{prop.bedrooms}B / {prop.bathrooms}BA</span>
                      </div>
                    </div>

                    {prop.rejection_reason && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                        <strong>Rejection Reason:</strong> {prop.rejection_reason}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-stone-200 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onViewProperty(prop.id)}
                      className="px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-100 rounded-xl font-medium"
                    >
                      Inspect Details
                    </button>

                    <div className="flex items-center gap-2">
                      {prop.approval_status !== 'approved' && (
                        <button
                          onClick={() => handlePropertyApproval(prop.id, 'approved')}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                        >
                          Approve Listing
                        </button>
                      )}
                      {prop.approval_status !== 'rejected' && (
                        <button
                          onClick={() => handlePropertyApproval(prop.id, 'rejected')}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
