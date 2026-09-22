import React, { useState, useEffect } from 'react';
import { Property, PropertyType } from '../types.ts';
import { api } from '../services/api.ts';
import { PropertyCard } from '../components/PropertyCard.tsx';
import {
  Search,
  MapPin,
  Building,
  DollarSign,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Key,
  FileCheck,
  CreditCard,
  Wrench,
  Users,
} from 'lucide-react';

interface HomeProps {
  onNavigate: (path: string) => void;
  onViewProperty: (id: number) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, onViewProperty }) => {
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Search Bar State
  const [locationQuery, setLocationQuery] = useState('');
  const [propertyType, setPropertyType] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.properties.getFeatured();
        if (res.success) {
          setFeaturedProperties(res.properties);
        }
      } catch (err) {
        console.error('Failed to load featured properties:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (locationQuery) params.append('location', locationQuery);
    if (propertyType) params.append('type', propertyType);
    if (maxPrice) params.append('maxPrice', maxPrice);

    onNavigate(`/properties?${params.toString()}`);
  };

  const propertyTypes: { type: PropertyType; label: string; icon: any }[] = [
    { type: 'Apartment', label: 'Apartments', icon: Building },
    { type: 'House', label: 'Houses', icon: Building },
    { type: 'Villa', label: 'Villas', icon: Building },
    { type: 'Studio', label: 'Studios', icon: Building },
    { type: 'Condo', label: 'Condominiums', icon: Building },
    { type: 'Townhouse', label: 'Townhouses', icon: Building },
  ];

  return (
    <div id="page-home" className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-800/80 border border-stone-700 text-amber-400 text-xs font-semibold shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Complete Rental & Property Management System</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Rent, Manage, and Live with <span className="text-amber-400">Total Ease</span>
          </h1>

          <p className="max-w-2xl mx-auto text-stone-300 text-sm sm:text-base leading-relaxed">
            A comprehensive platform connecting discerning tenants with verified landlords. Streamlined digital leasing, automated rent tracking, and real-time maintenance ticketing.
          </p>

          {/* Integrated Search Box */}
          <div className="max-w-4xl mx-auto mt-8 bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow-2xl border border-stone-200/80 text-stone-900">
            <form onSubmit={handleHeroSearch} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Location Input */}
              <div className="text-left px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-600">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Location
                </label>
                <div className="flex items-center gap-2 mt-0.5">
                  <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                  <input
                    type="text"
                    id="input-hero-location"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    placeholder="City or Neighborhood..."
                    className="w-full text-xs font-medium bg-transparent focus:outline-none placeholder:text-stone-400"
                  />
                </div>
              </div>

              {/* Property Type Dropdown */}
              <div className="text-left px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-600">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Property Type
                </label>
                <div className="flex items-center gap-2 mt-0.5">
                  <Building className="w-4 h-4 text-amber-600 shrink-0" />
                  <select
                    id="select-hero-type"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full text-xs font-medium bg-transparent focus:outline-none text-stone-800"
                  >
                    <option value="">Any Type</option>
                    <option value="Apartment">Apartment</option>
                    <option value="House">House</option>
                    <option value="Villa">Villa</option>
                    <option value="Studio">Studio</option>
                    <option value="Condo">Condo</option>
                    <option value="Townhouse">Townhouse</option>
                  </select>
                </div>
              </div>

              {/* Max Monthly Budget */}
              <div className="text-left px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-600">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Max Monthly Budget
                </label>
                <div className="flex items-center gap-2 mt-0.5">
                  <DollarSign className="w-4 h-4 text-amber-600 shrink-0" />
                  <select
                    id="select-hero-price"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full text-xs font-medium bg-transparent focus:outline-none text-stone-800"
                  >
                    <option value="">Any Price</option>
                    <option value="2000">Under $2,000</option>
                    <option value="3000">Under $3,000</option>
                    <option value="4000">Under $4,000</option>
                    <option value="5000">Under $5,000</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="btn-hero-search"
                className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95 text-xs sm:text-sm"
              >
                <Search className="w-4 h-4" />
                <span>Search Rentals</span>
              </button>
            </form>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-center border-t border-stone-700/60 text-xs">
            <div>
              <span className="block text-xl font-extrabold text-white">100%</span>
              <span className="text-stone-400">Verified Landlords</span>
            </div>
            <div>
              <span className="block text-xl font-extrabold text-white">0%</span>
              <span className="text-stone-400">Hidden Fees</span>
            </div>
            <div>
              <span className="block text-xl font-extrabold text-white">Instant</span>
              <span className="text-stone-400">Digital Lease Sign</span>
            </div>
            <div>
              <span className="block text-xl font-extrabold text-white">24/7</span>
              <span className="text-stone-400">Maintenance Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Handpicked Rentals
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Featured Properties Available Now
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Top-rated verified homes with modern amenities and verified owner profiles.
            </p>
          </div>

          <button
            id="btn-view-all-properties"
            onClick={() => onNavigate('/properties')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-900 hover:text-amber-600 transition-colors group"
          >
            <span>Browse All Properties</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-stone-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.slice(0, 6).map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onViewDetails={onViewProperty}
              />
            ))}
          </div>
        )}
      </section>

      {/* Explore by Property Type */}
      <section className="bg-stone-50 py-12 border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
              Find Your Ideal Living Space
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              From city-center studios to luxury family villas, explore accommodations tailored to your lifestyle.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {propertyTypes.map((item) => (
              <button
                key={item.type}
                onClick={() => onNavigate(`/properties?type=${item.type}`)}
                className="bg-white p-4 rounded-xl border border-stone-200 hover:border-amber-500 hover:shadow-sm text-center transition-all group flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-stone-950 transition-colors">
                  <Building className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-stone-800 group-hover:text-stone-950">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How RentEase Works Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
            Frictionless Tenancy
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mt-1">
            How RentEase Works
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            A seamless three-step journey from discovering a listing to managing your tenancy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base">
              1
            </div>
            <h3 className="text-base font-bold text-stone-900">Explore & Discover</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Filter by price, verified amenities, furnished state, and bedrooms. Inspect high-resolution photo galleries and verified owner credibility reviews.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base">
              2
            </div>
            <h3 className="text-base font-bold text-stone-900">Apply & Digital Lease</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Submit your desired move-in date and lease duration. The landlord reviews your application and accepts it, generating a legally binding digital lease.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base">
              3
            </div>
            <h3 className="text-base font-bold text-stone-900">Pay Rent & Report Issues</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Pay monthly rent online with automated receipts. Log maintenance requests for plumbing or electrical repairs with photo attachments and status tracking.
            </p>
          </div>
        </div>
      </section>

      {/* Landlord CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 rounded-3xl p-8 sm:p-12 text-white flex flex-col lg:flex-row items-center justify-between gap-8 border border-stone-800 shadow-xl">
          <div className="space-y-4 max-w-xl text-center lg:text-left">
            <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider rounded-md border border-amber-500/30">
              For Property Landlords & Owners
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              List Your Property & Maximize Rental Revenue
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Connect with vetted tenants, collect rent online without late chases, and manage property maintenance from a unified dashboard.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              id="btn-cta-list-property"
              onClick={() => onNavigate('/owner/properties/add')}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md text-center"
            >
              List a Property Now
            </button>
            <button
              onClick={() => onNavigate('/about')}
              className="px-6 py-3 bg-stone-800 hover:bg-stone-700 text-white font-medium rounded-xl text-xs sm:text-sm transition-all text-center border border-stone-700"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
