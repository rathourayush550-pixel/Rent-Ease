import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Shield, User, Building, ArrowRightLeft } from 'lucide-react';

interface DemoAccountBarProps {
  onNavigate?: (path: string) => void;
}

export const DemoAccountBar: React.FC<DemoAccountBarProps> = ({ onNavigate }) => {
  const { user, demoLogin, isLoading } = useAuth();

  const handleSwitch = async (role: 'tenant' | 'owner' | 'admin') => {
    try {
      await demoLogin(role);
      if (onNavigate) {
        if (role === 'tenant') onNavigate('/tenant/dashboard');
        else if (role === 'owner') onNavigate('/owner/dashboard');
        else if (role === 'admin') onNavigate('/admin/dashboard');
      }
    } catch (err) {
      console.error('Failed to switch demo account:', err);
    }
  };

  return (
    <div
      id="demo-account-bar"
      className="bg-stone-900 text-stone-200 text-xs py-2 px-4 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 shadow-inner"
    >
      <div className="flex items-center gap-2">
        <span className="bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded text-[11px] uppercase tracking-wider flex items-center gap-1 border border-amber-500/30">
          <ArrowRightLeft className="w-3 h-3" /> Quick Demo Switcher
        </span>
        <span className="text-stone-300 hidden sm:inline">
          {user ? (
            <>
              Active Role: <strong className="text-white capitalize">{user.role}</strong>
            </>
          ) : (
            'Test all 3 roles with real sample data'
          )}
        </span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          id="btn-demo-tenant"
          onClick={() => handleSwitch('tenant')}
          disabled={isLoading || user?.role === 'tenant'}
          className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors text-[11px] font-medium ${
            user?.role === 'tenant'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white'
          }`}
          title="Switch to Demo Tenant"
        >
          <User className="w-3 h-3" />
          <span>Tenant</span>
        </button>

        <button
          id="btn-demo-owner"
          onClick={() => handleSwitch('owner')}
          disabled={isLoading || user?.role === 'owner'}
          className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors text-[11px] font-medium ${
            user?.role === 'owner'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white'
          }`}
          title="Switch to Demo Owner"
        >
          <Building className="w-3 h-3" />
          <span>Owner</span>
        </button>

        <button
          id="btn-demo-admin"
          onClick={() => handleSwitch('admin')}
          disabled={isLoading || user?.role === 'admin'}
          className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors text-[11px] font-medium ${
            user?.role === 'admin'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white'
          }`}
          title="Switch to Demo Admin"
        >
          <Shield className="w-3 h-3" />
          <span>Admin</span>
        </button>
      </div>
    </div>
  );
};
