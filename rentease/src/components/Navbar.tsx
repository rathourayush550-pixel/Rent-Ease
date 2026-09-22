import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Building2,
  Bell,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Home,
  FileText,
  CreditCard,
  Wrench,
  MessageSquare,
  Shield,
  PlusCircle,
  CheckCircle,
} from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const { user, isAuthenticated, logout, notifications, unreadNotifications, markNotificationsAsRead } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNav = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setNotifDropdownOpen(false);
  };

  const getPortalHomePath = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'owner') return '/owner/dashboard';
    return '/tenant/dashboard';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            id="brand-logo"
            onClick={() => handleNav('/')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-stone-900 to-stone-800 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-stone-900 flex items-center gap-1">
                Rent<span className="text-amber-600">Ease</span>
              </span>
              <span className="block text-[10px] uppercase font-semibold tracking-wider text-stone-400 -mt-1">
                Rental & Property System
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              id="nav-link-home"
              onClick={() => handleNav('/')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                currentPath === '/' ? 'text-stone-900 bg-stone-100 font-semibold' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              Home
            </button>
            <button
              id="nav-link-properties"
              onClick={() => handleNav('/properties')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                currentPath === '/properties' ? 'text-stone-900 bg-stone-100 font-semibold' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              Browse Properties
            </button>
            <button
              id="nav-link-about"
              onClick={() => handleNav('/about')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                currentPath === '/about' ? 'text-stone-900 bg-stone-100 font-semibold' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              About
            </button>
            <button
              id="nav-link-contact"
              onClick={() => handleNav('/contact')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                currentPath === '/contact' ? 'text-stone-900 bg-stone-100 font-semibold' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              Contact
            </button>

            {/* Role-Specific Portal Button */}
            {isAuthenticated && (
              <button
                id="nav-link-portal"
                onClick={() => handleNav(getPortalHomePath())}
                className="ml-2 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-amber-700" />
                <span>
                  {user?.role === 'admin'
                    ? 'Admin Console'
                    : user?.role === 'owner'
                    ? 'Owner Portal'
                    : 'Tenant Portal'}
                </span>
              </button>
            )}
          </nav>

          {/* Right Actions: Notifications & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <>
                {/* Add Property Quick Action for Landlords */}
                {user?.role === 'owner' && (
                  <button
                    id="btn-quick-add-property"
                    onClick={() => handleNav('/owner/properties/add')}
                    className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors shadow-sm"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>List Property</span>
                  </button>
                )}

                {/* Notifications Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    id="btn-notifications-toggle"
                    onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                    className="relative p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotifications > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </button>

                  {/* Notifications Popover */}
                  {notifDropdownOpen && (
                    <div
                      id="notifications-popover"
                      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                    >
                      <div className="px-4 py-2 border-b border-stone-100 flex items-center justify-between">
                        <span className="font-semibold text-stone-900 text-sm">Notifications</span>
                        {unreadNotifications > 0 && (
                          <button
                            onClick={() => markNotificationsAsRead('all')}
                            className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-stone-50">
                        {notifications.length === 0 ? (
                          <div className="py-6 text-center text-xs text-stone-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.slice(0, 6).map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                markNotificationsAsRead(notif.id);
                                if (notif.link) handleNav(notif.link);
                              }}
                              className={`px-4 py-3 hover:bg-stone-50 cursor-pointer transition-colors ${
                                !notif.is_read ? 'bg-amber-50/50' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-semibold text-stone-900">{notif.title}</p>
                                {!notif.is_read && (
                                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-stone-600 mt-0.5 line-clamp-2">{notif.message}</p>
                              <span className="text-[10px] text-stone-400 mt-1 block">
                                {new Date(notif.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu Dropdown */}
                <div className="relative" ref={userRef}>
                  <button
                    id="btn-user-profile-menu"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-full hover:bg-stone-100 border border-stone-200 transition-colors"
                  >
                    <img
                      src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                      alt={user?.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <span className="text-xs font-medium text-stone-800 hidden sm:inline max-w-[100px] truncate">
                      {user?.name.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                  </button>

                  {userDropdownOpen && (
                    <div
                      id="user-profile-dropdown"
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-50"
                    >
                      <div className="px-4 py-2.5 border-b border-stone-100">
                        <p className="text-xs font-bold text-stone-900 truncate">{user?.name}</p>
                        <p className="text-[11px] text-stone-500 truncate">{user?.email}</p>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-stone-100 text-stone-700">
                            {user?.role}
                          </span>
                          {user?.is_verified && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium">
                              <CheckCircle className="w-3 h-3" /> Verified
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => handleNav(getPortalHomePath())}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                        >
                          <LayoutDashboard className="w-4 h-4 text-stone-400" />
                          <span>My Portal Dashboard</span>
                        </button>

                        {user?.role === 'tenant' && (
                          <>
                            <button
                              onClick={() => handleNav('/tenant/bookings')}
                              className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                            >
                              <FileText className="w-4 h-4 text-stone-400" />
                              <span>My Booking Requests</span>
                            </button>
                            <button
                              onClick={() => handleNav('/tenant/rentals')}
                              className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                            >
                              <Home className="w-4 h-4 text-stone-400" />
                              <span>Active Leases</span>
                            </button>
                            <button
                              onClick={() => handleNav('/tenant/payments')}
                              className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                            >
                              <CreditCard className="w-4 h-4 text-stone-400" />
                              <span>Pay Rent & Invoices</span>
                            </button>
                            <button
                              onClick={() => handleNav('/tenant/maintenance')}
                              className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                            >
                              <Wrench className="w-4 h-4 text-stone-400" />
                              <span>Maintenance Requests</span>
                            </button>
                          </>
                        )}

                        {user?.role === 'owner' && (
                          <>
                            <button
                              onClick={() => handleNav('/owner/properties')}
                              className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                            >
                              <Building2 className="w-4 h-4 text-stone-400" />
                              <span>My Listed Properties</span>
                            </button>
                            <button
                              onClick={() => handleNav('/owner/requests')}
                              className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                            >
                              <FileText className="w-4 h-4 text-stone-400" />
                              <span>Tenant Applications</span>
                            </button>
                            <button
                              onClick={() => handleNav('/owner/payments')}
                              className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                            >
                              <CreditCard className="w-4 h-4 text-stone-400" />
                              <span>Income & Rent Records</span>
                            </button>
                          </>
                        )}

                        {user?.role === 'admin' && (
                          <>
                            <button
                              onClick={() => handleNav('/admin/users')}
                              className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                            >
                              <UserIcon className="w-4 h-4 text-stone-400" />
                              <span>User & Owner Control</span>
                            </button>
                            <button
                              onClick={() => handleNav('/admin/properties')}
                              className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                            >
                              <Shield className="w-4 h-4 text-stone-400" />
                              <span>Property Approvals</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleNav(user?.role === 'owner' ? '/owner/messages' : user?.role === 'admin' ? '/admin/dashboard' : '/tenant/messages')}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4 text-stone-400" />
                          <span>Direct Messages</span>
                        </button>
                      </div>

                      <div className="border-t border-stone-100 pt-1">
                        <button
                          id="btn-user-logout"
                          onClick={() => {
                            logout();
                            handleNav('/');
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="btn-nav-login"
                  onClick={() => handleNav('/login')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  Sign In
                </button>
                <button
                  id="btn-nav-register"
                  onClick={() => handleNav('/register')}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors shadow-sm"
                >
                  Get Started
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              id="btn-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-stone-600 hover:text-stone-900 rounded-lg"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div id="mobile-menu-drawer" className="md:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 space-y-2">
          <button
            onClick={() => handleNav('/')}
            className="w-full text-left px-3 py-2 text-sm font-medium text-stone-700 rounded-lg hover:bg-stone-100"
          >
            Home
          </button>
          <button
            onClick={() => handleNav('/properties')}
            className="w-full text-left px-3 py-2 text-sm font-medium text-stone-700 rounded-lg hover:bg-stone-100"
          >
            Browse Properties
          </button>
          <button
            onClick={() => handleNav('/about')}
            className="w-full text-left px-3 py-2 text-sm font-medium text-stone-700 rounded-lg hover:bg-stone-100"
          >
            About System
          </button>
          <button
            onClick={() => handleNav('/contact')}
            className="w-full text-left px-3 py-2 text-sm font-medium text-stone-700 rounded-lg hover:bg-stone-100"
          >
            Contact
          </button>

          {isAuthenticated ? (
            <div className="pt-2 border-t border-stone-100">
              <button
                onClick={() => handleNav(getPortalHomePath())}
                className="w-full text-left px-3 py-2 text-sm font-semibold text-amber-700 bg-amber-50 rounded-lg"
              >
                Go to {user?.role.toUpperCase()} Portal
              </button>
              <button
                onClick={() => {
                  logout();
                  handleNav('/');
                }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg mt-1"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-stone-100 flex flex-col gap-2">
              <button
                onClick={() => handleNav('/login')}
                className="w-full py-2 text-center text-sm font-semibold text-stone-800 bg-stone-100 rounded-lg"
              >
                Sign In
              </button>
              <button
                onClick={() => handleNav('/register')}
                className="w-full py-2 text-center text-sm font-semibold text-white bg-stone-900 rounded-lg"
              >
                Register Account
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
