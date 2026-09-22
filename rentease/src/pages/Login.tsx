import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Home,
  Building,
  Shield,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '../types.ts';

interface LoginProps {
  onNavigate: (path: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { login, demoLogin, isLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('tenant');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const roleConfigs = [
    {
      id: 'tenant' as const,
      label: 'Tenant',
      sublabel: 'Renter Portal',
      icon: Home,
      description: 'Search rentals, submit lease requests, and pay rent.',
      sampleEmail: 'tenant@rentease.com',
      samplePassword: 'tenant123',
      activeStyles: 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20 shadow-2xs',
      iconColor: 'text-emerald-600',
    },
    {
      id: 'owner' as const,
      label: 'Landlord',
      sublabel: 'Property Owner',
      icon: Building,
      description: 'List properties, review tenant applications & track income.',
      sampleEmail: 'owner@rentease.com',
      samplePassword: 'owner123',
      activeStyles: 'border-blue-600 bg-blue-50/70 text-blue-950 ring-2 ring-blue-500/20 shadow-2xs',
      iconColor: 'text-blue-600',
    },
    {
      id: 'admin' as const,
      label: 'Admin',
      sublabel: 'Ayush Rathour',
      icon: Shield,
      description: 'Full system control, landlord verification & platform oversight.',
      sampleEmail: 'rathourayush550@gmail.com',
      samplePassword: 'admin123',
      activeStyles: 'border-purple-600 bg-purple-50/70 text-purple-950 ring-2 ring-purple-500/20 shadow-2xs',
      iconColor: 'text-purple-600',
    },
  ];

  const currentRole = roleConfigs.find((r) => r.id === selectedRole) || roleConfigs[0];

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
  };

  const handleAutoFill = () => {
    setEmail(currentRole.sampleEmail);
    setPassword(currentRole.samplePassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const loggedUser = await login({ email, password });
      const targetRole = loggedUser?.role || selectedRole;
      if (targetRole === 'admin') onNavigate('/admin/dashboard');
      else if (targetRole === 'owner') onNavigate('/owner/dashboard');
      else onNavigate('/tenant/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    setError(null);
    try {
      await demoLogin(role);
      if (role === 'tenant') onNavigate('/tenant/dashboard');
      else if (role === 'owner') onNavigate('/owner/dashboard');
      else if (role === 'admin') onNavigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    }
  };

  return (
    <div id="page-login" className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white max-w-md w-full p-8 rounded-3xl border border-stone-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 text-amber-400 flex items-center justify-center mx-auto shadow-md">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Welcome to RentEase</h1>
          <p className="text-xs text-stone-500">Sign in to your rental, landlord, or admin portal</p>
        </div>

        {/* Role Selector Box (Tenant, Landlord, Admin) */}
        <div
          id="role-selection-box"
          className="bg-stone-50 border border-stone-200/90 rounded-2xl p-3.5 space-y-3"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Choose Login Role
            </span>
            <span className="text-[11px] text-stone-500">
              Active: <strong className="text-stone-900 capitalize">{currentRole.label}</strong>
            </span>
          </div>

          {/* 3 Role Selection Cards */}
          <div className="grid grid-cols-3 gap-2">
            {roleConfigs.map((r) => {
              const Icon = r.icon;
              const isSelected = selectedRole === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  id={`btn-select-role-${r.id}`}
                  onClick={() => handleRoleSelect(r.id)}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    isSelected
                      ? r.activeStyles
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50 text-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? r.iconColor : 'text-stone-400'}`} />
                    <span className="text-xs font-bold">{r.label}</span>
                  </div>
                  <span className="text-[10px] text-stone-500 leading-tight">
                    {r.id === 'admin' ? 'Ayush' : r.sublabel}
                  </span>
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Role Info & Quick Action Bar */}
          <div className="bg-white rounded-xl p-2.5 border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="text-stone-600 text-[11px] leading-tight flex-1">
              <span className="font-semibold text-stone-900 block mb-0.5">
                {currentRole.label} Portal:
              </span>
              {currentRole.description}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                id={`btn-quick-login-${currentRole.id}`}
                onClick={() => handleQuickDemo(currentRole.id)}
                disabled={isLoading}
                className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-semibold text-[11px] transition-colors flex items-center gap-1 shadow-2xs"
                title={`Instant 1-Click Login as ${currentRole.label}`}
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>1-Click Login</span>
              </button>
              <button
                type="button"
                id="btn-autofill-credentials"
                onClick={handleAutoFill}
                className="px-2 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-medium text-[11px] transition-colors"
                title="Fill in credentials into form below"
              >
                Autofill
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              {currentRole.label} Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                id="input-login-email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={currentRole.sampleEmail}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                id="input-login-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            id="btn-submit-login"
            disabled={isLoading}
            className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <span>{isLoading ? 'Authenticating...' : `Sign In as ${currentRole.label}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-stone-500 pt-2 border-t border-stone-100">
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('/register')}
            className="text-amber-600 font-bold hover:underline"
          >
            Create an Account
          </button>
        </div>
      </div>
    </div>
  );
};
