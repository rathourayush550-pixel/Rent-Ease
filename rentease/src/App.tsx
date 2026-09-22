import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { DemoAccountBar } from './components/DemoAccountBar.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { Building2 } from 'lucide-react';

// Pages
import { Home } from './pages/Home.tsx';
import { Properties } from './pages/Properties.tsx';
import { PropertyDetails } from './pages/PropertyDetails.tsx';
import { About } from './pages/About.tsx';
import { Contact } from './pages/Contact.tsx';
import { Login } from './pages/Login.tsx';
import { Register } from './pages/Register.tsx';
import { TenantPortal } from './pages/TenantPortal.tsx';
import { OwnerPortal } from './pages/OwnerPortal.tsx';
import { AdminPortal } from './pages/AdminPortal.tsx';

const AppContent: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname + window.location.search || '/';
  });

  const { user, isLoading } = useAuth();

  // Listen to browser navigation (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname + window.location.search || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (path !== currentPath) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const viewProperty = (id: number) => {
    navigate(`/property/${id}`);
  };

  // Extract path without query parameters for matching
  const pathname = currentPath.split('?')[0];

  // While checking session
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 text-stone-700">
        <div className="w-10 h-10 border-3 border-stone-300 border-t-amber-500 rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
          Loading RentEase...
        </p>
      </div>
    );
  }

  // If user is not authenticated: Must create an account or sign in first
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans selection:bg-amber-400 selection:text-stone-950">
        {/* 1-Click Role Switcher for testing */}
        <DemoAccountBar onNavigate={navigate} />

        {/* Minimal Header for Onboarding Visitors */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate('/register')}
            >
              <div className="w-9 h-9 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center shadow-md">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-stone-900 block leading-tight">
                  Rent<span className="text-amber-600">Ease</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 block -mt-0.5">
                  Rental & Property Hub
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => navigate('/login')}
                className={`px-3.5 py-1.5 font-semibold rounded-lg transition-colors ${
                  pathname === '/login'
                    ? 'bg-stone-100 text-stone-900'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className={`px-3.5 py-1.5 font-semibold rounded-lg transition-colors shadow-2xs ${
                  pathname !== '/login'
                    ? 'bg-stone-900 text-white hover:bg-stone-800'
                    : 'bg-stone-200 text-stone-800 hover:bg-stone-300'
                }`}
              >
                Create Account
              </button>
            </div>
          </div>
        </header>

        {/* Account Requirement Notice */}
        <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-2 text-center text-xs text-amber-900 font-medium">
          🔒 <strong>Welcome to RentEase!</strong> Please create an account or sign in first to access rental listings, submit leases, and use landlord or admin tools.
        </div>

        {/* Auth Forms */}
        <main className="flex-1 w-full flex items-center justify-center py-6">
          {pathname === '/login' ? (
            <Login onNavigate={navigate} />
          ) : (
            <Register onNavigate={navigate} />
          )}
        </main>

        <Footer onNavigate={navigate} />
      </div>
    );
  }

  // Authenticated: Full Website Access
  // Property detail route matcher: /property/:id or /properties/:id
  const propertyDetailMatch = pathname.match(/^\/(?:property|properties)\/(\d+)$/);
  const detailPropertyId = propertyDetailMatch ? parseInt(propertyDetailMatch[1], 10) : null;

  const renderCurrentView = () => {
    // Redirect /login or /register to portal if already authenticated
    if (pathname === '/login' || pathname === '/register') {
      if (user.role === 'admin') {
        return <AdminPortal currentPath={currentPath} onNavigate={navigate} onViewProperty={viewProperty} />;
      }
      if (user.role === 'owner') {
        return <OwnerPortal currentPath={currentPath} onNavigate={navigate} onViewProperty={viewProperty} />;
      }
      return <TenantPortal currentPath={currentPath} onNavigate={navigate} onViewProperty={viewProperty} />;
    }

    // 1. Property Details View
    if (detailPropertyId) {
      return (
        <PropertyDetails
          propertyId={detailPropertyId}
          onBack={() => navigate('/properties')}
          onNavigate={navigate}
        />
      );
    }

    // 2. Public Properties Catalog
    if (pathname === '/properties') {
      return (
        <Properties
          initialSearch={currentPath}
          onViewProperty={viewProperty}
          onNavigate={navigate}
        />
      );
    }

    // 3. About Page
    if (pathname === '/about') {
      return <About onNavigate={navigate} />;
    }

    // 4. Contact Page
    if (pathname === '/contact') {
      return <Contact onNavigate={navigate} />;
    }

    // 5. Tenant Portal Routes
    if (pathname.startsWith('/tenant')) {
      return (
        <TenantPortal
          currentPath={currentPath}
          onNavigate={navigate}
          onViewProperty={viewProperty}
        />
      );
    }

    // 6. Landlord / Owner Portal Routes
    if (pathname.startsWith('/owner')) {
      return (
        <OwnerPortal
          currentPath={currentPath}
          onNavigate={navigate}
          onViewProperty={viewProperty}
        />
      );
    }

    // 7. Admin Console Routes
    if (pathname.startsWith('/admin')) {
      return (
        <AdminPortal
          currentPath={currentPath}
          onNavigate={navigate}
          onViewProperty={viewProperty}
        />
      );
    }

    // Default: Home Page
    return <Home onNavigate={navigate} onViewProperty={viewProperty} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans selection:bg-amber-400 selection:text-stone-950">
      {/* 1-Click Role Switcher for instant testing */}
      <DemoAccountBar onNavigate={navigate} />

      {/* Main Top Navigation */}
      <Navbar currentPath={currentPath} onNavigate={navigate} />

      {/* Main Dynamic View */}
      <main className="flex-1 w-full">{renderCurrentView()}</main>

      {/* Global Footer */}
      <Footer onNavigate={navigate} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
