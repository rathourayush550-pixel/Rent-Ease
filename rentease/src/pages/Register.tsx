import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Building2, Lock, Mail, User, Phone, ArrowRight, Home, Building } from 'lucide-react';
import { UserRole } from '../types.ts';

interface RegisterProps {
  onNavigate: (path: string) => void;
}

export const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  const { register, isLoading } = useAuth();
  const [role, setRole] = useState<UserRole>('tenant');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register({
        name,
        email,
        phone,
        password,
        role,
      });

      if (role === 'owner') onNavigate('/owner/dashboard');
      else onNavigate('/tenant/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    }
  };

  return (
    <div id="page-register" className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white max-w-md w-full p-8 rounded-3xl border border-stone-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 text-amber-400 flex items-center justify-center mx-auto shadow-md">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Create your Account</h1>
          <p className="text-xs text-stone-500">Join the RentEase rental and property ecosystem</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Account Role Selector */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1.5">I am registering as a:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="btn-register-role-tenant"
                onClick={() => setRole('tenant')}
                className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                  role === 'tenant'
                    ? 'border-amber-600 bg-amber-50/60 text-amber-950 ring-2 ring-amber-500/20'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Home className="w-4 h-4 text-amber-600" />
                <span>Tenant / Renter</span>
              </button>

              <button
                type="button"
                id="btn-register-role-owner"
                onClick={() => setRole('owner')}
                className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                  role === 'owner'
                    ? 'border-amber-600 bg-amber-50/60 text-amber-950 ring-2 ring-amber-500/20'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Building className="w-4 h-4 text-amber-600" />
                <span>Property Owner</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Full Legal Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="input-register-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jordan Hayes"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                id="input-register-email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jordan@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                id="input-register-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 019-2834"
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
                id="input-register-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            id="btn-submit-register"
            disabled={isLoading}
            className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <span>{isLoading ? 'Creating Account...' : 'Complete Registration'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-stone-500 pt-2 border-t border-stone-100">
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('/login')}
            className="text-amber-600 font-bold hover:underline"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
