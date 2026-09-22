import React, { useState, useEffect } from 'react';
import { Property, PropertyType, FurnishedStatus } from '../types.ts';
import { api } from '../services/api.ts';
import { PropertyCard } from '../components/PropertyCard.tsx';
import {
  Search,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  Building,
  MapPin,
  Check,
  ChevronDown,
} from 'lucide-react';

interface PropertiesProps {
  initialSearch?: string;
  onViewProperty: (id: number) => void;
  onNavigate: (path: string) => void;
}

export const Properties: React.FC<PropertiesProps> = ({
  initialSearch = '',
  onViewProperty,
  onNavigate,
}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState<string>('');
  const [furnishedStatus, setFurnishedStatus] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [bedrooms, setBedrooms] = useState<string>('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Parse initial query params if present
  useEffect(() => {
    if (initialSearch) {
      const params = new URLSearchParams(initialSearch.replace('?', ''));
      if (params.get('location')) setCity(params.get('location') || '');
      if (params.get('type')) setPropertyType(params.get('type') || '');
      if (params.get('maxPrice')) setMaxPrice(params.get('maxPrice') || '');
      if (params.get('search')) setSearch(params.get('search') || '');
    }
  }, [initialSearch]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (search) params.search = search;
      if (city) params.city = city;
      if (propertyType) params.type = propertyType;
      if (furnishedStatus) params.furnished = furnishedStatus;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (bedrooms) params.bedrooms = bedrooms;
      if (selectedAmenities.length > 0) params.amenities = selectedAmenities.join(',');

      const res = await api.properties.getAll(params);
      if (res.success) {
        let items = res.properties;
        // Sort items client-side as well
        if (sortBy === 'price_asc') {
          items = [...items].sort((a, b) => a.monthly_rent - b.monthly_rent);
        } else if (sortBy === 'price_desc') {
          items = [...items].sort((a, b) => b.monthly_rent - a.monthly_rent);
        } else if (sortBy === 'rating') {
          items = [...items].sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        }
        setProperties(items);
      }
    } catch (err) {
      console.error('Failed to load properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [city, propertyType, furnishedStatus, minPrice, maxPrice, bedrooms, selectedAmenities, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProperties();
  };

  const toggleAmenity = (name: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  const resetFilters = () => {
    setSearch('');
    setCity('');
    setPropertyType('');
    setFurnishedStatus('');
    setMinPrice('');
    setMaxPrice('');
    setBedrooms('');
    setSelectedAmenities([]);
    setSortBy('newest');
  };

  const amenityOptions = [
    'High-Speed WiFi',
    'Dedicated Parking',
    'Swimming Pool',
    'Fitness Center',
    'Air Conditioning',
    'Private Balcony',
    'Pet Friendly',
    'In-unit Washer/Dryer',
    '24/7 Security & Doorman',
  ];

  return (
    <div id="page-properties" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner and Keyword Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Find Rental Properties
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Discover verified apartments, homes, and studios with clear lease terms.
          </p>
        </div>

        {/* Global Keyword Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-properties-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by neighborhood, title..."
              className="w-full text-xs pl-10 pr-3 py-2.5 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            />
          </div>
          <button
            type="submit"
            id="btn-properties-submit-search"
            className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm shrink-0"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="md:hidden p-2.5 bg-stone-100 text-stone-700 rounded-xl hover:bg-stone-200 shrink-0"
            aria-label="Toggle Filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Main Grid: Sidebar Filters & Results */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Filter Sidebar */}
        <aside
          className={`${
            showMobileFilters ? 'block' : 'hidden'
          } md:block md:col-span-1 space-y-6 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm h-fit`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <span className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-amber-600" /> Filter Listings
            </span>
            <button
              onClick={resetFilters}
              id="btn-reset-filters"
              className="text-xs text-stone-500 hover:text-amber-600 flex items-center gap-1 font-medium transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* City / Location */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-stone-400" /> City / Location
            </label>
            <select
              id="filter-select-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">All Cities</option>
              <option value="San Francisco">San Francisco, CA</option>
              <option value="New York">New York, NY</option>
              <option value="Seattle">Seattle, WA</option>
              <option value="Austin">Austin, TX</option>
              <option value="Chicago">Chicago, IL</option>
              <option value="Boston">Boston, MA</option>
            </select>
          </div>

          {/* Property Type */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-stone-400" /> Property Type
            </label>
            <select
              id="filter-select-type"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
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

          {/* Monthly Budget Range */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Monthly Rent Range ($)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                id="filter-min-price"
                placeholder="Min ($)"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-stone-200 bg-stone-50"
              />
              <input
                type="number"
                id="filter-max-price"
                placeholder="Max ($)"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-stone-200 bg-stone-50"
              />
            </div>
          </div>

          {/* Furnishing Status */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Furnishing Status
            </label>
            <select
              id="filter-select-furnished"
              value={furnishedStatus}
              onChange={(e) => setFurnishedStatus(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">All Statuses</option>
              <option value="Furnished">Furnished</option>
              <option value="Semi-Furnished">Semi-Furnished</option>
              <option value="Unfurnished">Unfurnished</option>
            </select>
          </div>

          {/* Bedrooms */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Bedrooms
            </label>
            <div className="grid grid-cols-5 gap-1 text-center">
              {['', '1', '2', '3', '4'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setBedrooms(val)}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    bedrooms === val
                      ? 'bg-amber-600 text-white'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {val === '' ? 'Any' : `${val}+`}
                </button>
              ))}
            </div>
          </div>

          {/* Amenities Multi-Checkboxes */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              Key Amenities
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {amenityOptions.map((amenity) => {
                const checked = selectedAmenities.includes(amenity);
                return (
                  <label
                    key={amenity}
                    className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer hover:text-stone-900 select-none py-0.5"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAmenity(amenity)}
                      className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                    />
                    <span>{amenity}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Results Area */}
        <main className="md:col-span-3 space-y-4">
          {/* Active Filter Bar & Sorting */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-xs">
            <span className="font-semibold text-stone-800">
              Showing <strong className="text-stone-950 font-bold">{properties.length}</strong> available properties
            </span>

            <div className="flex items-center gap-2">
              <span className="text-stone-500 font-medium">Sort by:</span>
              <select
                id="select-sort-properties"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {/* Property Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-84 bg-stone-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-8 space-y-3">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900">No matching properties found</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Try expanding your price range, clearing specific amenities, or searching a different city.
              </p>
              <button
                onClick={resetFilters}
                className="mt-2 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onViewDetails={onViewProperty}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
