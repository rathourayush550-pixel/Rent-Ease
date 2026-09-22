import React from 'react';
import {
  Building2,
  Database,
  ShieldCheck,
  Server,
  Layers,
  Download,
  Users,
  CheckCircle,
  FileCode,
  Lock,
  ArrowRight,
} from 'lucide-react';

interface AboutProps {
  onNavigate: (path: string) => void;
}

export const About: React.FC<AboutProps> = ({ onNavigate }) => {
  return (
    <div id="page-about" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Title & Introduction */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          Academic Project Specification & Architecture
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
          RentEase – Complete Rental & Property Management System
        </h1>
        <p className="max-w-2xl mx-auto text-xs sm:text-sm text-stone-600 leading-relaxed">
          An original full-stack web application engineered to bridge the gap between rental seekers, residential landlords, and platform oversight through structured automation.
        </p>
      </div>

      {/* Core Project Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
            <Server className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="text-base font-bold text-stone-900">Full-Stack Architecture</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            RESTful Node.js + Express backend serving normalized JSON endpoints with stateless JWT authentication, password hashing, and clean role-based authorization.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
            <Database className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="text-base font-bold text-stone-900">Relational Data Persistence</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Normalized data architecture adhering to strict third-normal form (3NF) standards with automated foreign key constraints and transactional integrity.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="text-base font-bold text-stone-900">Three-Tier Role Security</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Distinct operational workspaces for Tenants (rent & tickets), Landlords (listings & cash flow), and Administrators (approvals & user moderation).
          </p>
        </div>
      </div>

      {/* Role Breakdown Detailed Sections */}
      <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-8">
        <h2 className="text-xl font-bold text-stone-900 pb-3 border-b border-stone-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-600" /> Role Workflows & Functional Scope
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tenant */}
          <div className="space-y-3 bg-stone-50 p-5 rounded-2xl border border-stone-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                Role 1: Tenant
              </span>
            </div>
            <h4 className="text-sm font-bold text-stone-900">Tenants & Renters</h4>
            <ul className="text-xs text-stone-600 space-y-1.5">
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>Multi-criteria search: price, city, type, furnishing, amenities</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>Digital rental application with move-in dates & occupants</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>Online rent payment simulator with invoice references</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>Maintenance complaint ticketing with photos and status tracking</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>In-app chat with landlords & verified reviews</span>
              </li>
            </ul>
          </div>

          {/* Landlord */}
          <div className="space-y-3 bg-stone-50 p-5 rounded-2xl border border-stone-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded">
                Role 2: Owner
              </span>
            </div>
            <h4 className="text-sm font-bold text-stone-900">Property Owners & Landlords</h4>
            <ul className="text-xs text-stone-600 space-y-1.5">
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                <span>Property listing wizard (photos, pricing, amenities, specs)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                <span>Application management (Accept / Reject with instant lease activation)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                <span>Active tenants directory and lease termination control</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                <span>Rental income metrics, occupancy tracking, and transaction records</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                <span>Maintenance resolution management with repair notes</span>
              </li>
            </ul>
          </div>

          {/* Administrator */}
          <div className="space-y-3 bg-stone-50 p-5 rounded-2xl border border-stone-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded">
                Role 3: Admin
              </span>
            </div>
            <h4 className="text-sm font-bold text-stone-900">Platform Administrator</h4>
            <ul className="text-xs text-stone-600 space-y-1.5">
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-purple-600 mt-0.5 shrink-0" />
                <span>System overview: users, listings, leases, GMV rent volume</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-purple-600 mt-0.5 shrink-0" />
                <span>Owner verification badge toggle and fraudulent account blocking</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-purple-600 mt-0.5 shrink-0" />
                <span>Property approvals & content moderation before public listing</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-purple-600 mt-0.5 shrink-0" />
                <span>Audit trail of all booking contracts & payment transfers</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-purple-600 mt-0.5 shrink-0" />
                <span>Centralized operational monitoring and system health metrics</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Explore Listings Banner */}
      <div className="bg-stone-900 text-white p-8 rounded-3xl border border-stone-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-bold uppercase">
            <ShieldCheck className="w-4 h-4" /> Trusted Rental Platform
          </div>
          <h3 className="text-xl font-bold">Ready to Experience RentEase?</h3>
          <p className="text-xs text-stone-400 leading-relaxed">
            Discover verified apartment listings, connect directly with property owners, and experience seamless online rental management.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/properties')}
          className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all shrink-0"
        >
          <span>Explore Verified Listings</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
