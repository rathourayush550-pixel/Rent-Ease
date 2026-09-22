import React from 'react';
import { Building2, Download, ShieldCheck, Database, Layers, CheckCircle } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-stone-900 text-stone-300 pt-12 pb-8 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-stone-800">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <div
              onClick={() => onNavigate('/')}
              className="flex items-center gap-2.5 cursor-pointer text-white"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                Rent<span className="text-amber-400">Ease</span>
              </span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Complete full-stack rental and property management ecosystem designed for modern tenants, property landlords, and platform administrators.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-300/90 bg-stone-800/80 p-2.5 rounded-lg border border-stone-700/50">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Verified tenancy contracts & secure transaction auditing.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-100 mb-3.5">
              Explore Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('/properties')}
                  className="hover:text-amber-400 transition-colors"
                >
                  All Rental Properties
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/properties?type=Apartment')}
                  className="hover:text-amber-400 transition-colors"
                >
                  City Apartments & Studios
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/properties?type=Villa')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Suburban Villas & Houses
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/about')}
                  className="hover:text-amber-400 transition-colors"
                >
                  System Architecture & Roles
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/contact')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Contact & Support
                </button>
              </li>
            </ul>
          </div>

          {/* Roles Portals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-100 mb-3.5">
              Role Portals
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('/tenant/dashboard')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tenant Portal (Alex Rivera)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/owner/dashboard')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                  <span>Landlord Portal (Sarah Jenkins)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/admin/dashboard')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
                  <span>Admin Console (Ayush Rathour)</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Trust & Platform Security */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-100 mb-3.5">
              Trust & Security
            </h4>
            <p className="text-xs text-stone-400 mb-3 leading-relaxed">
              Every property listing undergoes landlord credential review and verified tenancy status checks.
            </p>
            <div className="space-y-2 text-xs text-stone-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Stateless JWT Authentication</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Encrypted Credential Hashing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Role-Based Access Control</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} RentEase. All rights reserved. Academic Full-Stack Project.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-500" /> React 19 • Node Express • Cloud Architecture
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
