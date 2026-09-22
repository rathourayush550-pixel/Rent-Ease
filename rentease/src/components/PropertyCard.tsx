import React from 'react';
import { Property } from '../types.ts';
import { MapPin, Star, Bed, Bath, Maximize2, ShieldCheck } from 'lucide-react';
import { StatusBadge } from './StatusBadge.tsx';

interface PropertyCardProps {
  property: Property;
  onViewDetails: (id: number) => void;
  showStatus?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onViewDetails,
  showStatus = false,
}) => {
  const primaryImage =
    property.images && property.images.length > 0
      ? property.images[0]
      : 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80';

  return (
    <div
      id={`property-card-${property.id}`}
      className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group"
    >
      {/* Property Image with Badges */}
      <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
        <img
          src={primaryImage}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-stone-900/85 text-white rounded-full backdrop-blur-sm shadow-sm">
            {property.property_type}
          </span>
          <span className="px-2.5 py-1 text-[11px] font-semibold bg-white/95 text-stone-800 rounded-full backdrop-blur-sm shadow-sm">
            {property.furnished_status}
          </span>
        </div>

        {/* Availability / Status Badges */}
        <div className="absolute top-3 right-3 flex items-center gap-1">
          {showStatus && property.approval_status !== 'approved' && (
            <StatusBadge status={property.approval_status} type="approval" />
          )}
          {!property.is_available ? (
            <span className="px-2.5 py-1 text-[11px] font-bold bg-rose-600 text-white rounded-full shadow-sm">
              Occupied
            </span>
          ) : (
            <span className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 text-white rounded-full shadow-sm">
              Available
            </span>
          )}
        </div>

        {/* Price Tag in Bottom Corner */}
        <div className="absolute bottom-3 left-3 bg-stone-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl text-white shadow-md">
          <span className="text-base font-extrabold tracking-tight">
            ${property.monthly_rent.toLocaleString()}
          </span>
          <span className="text-[11px] text-stone-300 font-normal"> / month</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Rating and Location */}
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
            <span className="flex items-center gap-1 text-stone-700 font-medium truncate max-w-[180px]">
              <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              {property.city}, {property.state}
            </span>

            <span className="flex items-center gap-1 bg-amber-50 text-amber-900 font-semibold px-2 py-0.5 rounded-md border border-amber-200/60 shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              {property.average_rating || 5.0} ({property.review_count || 0})
            </span>
          </div>

          {/* Title */}
          <h3
            onClick={() => onViewDetails(property.id)}
            className="text-base font-bold text-stone-900 hover:text-amber-600 transition-colors line-clamp-1 cursor-pointer"
            title={property.title}
          >
            {property.title}
          </h3>

          {/* Address */}
          <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">{property.address}</p>

          {/* Property Specs (Bed, Bath, Area) */}
          <div className="grid grid-cols-3 gap-2 py-3 my-3 border-y border-stone-100 text-xs text-stone-600">
            <div className="flex items-center gap-1.5 justify-center">
              <Bed className="w-4 h-4 text-stone-400" />
              <span>{property.bedrooms} Beds</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center border-x border-stone-100">
              <Bath className="w-4 h-4 text-stone-400" />
              <span>{property.bathrooms} Baths</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center">
              <Maximize2 className="w-4 h-4 text-stone-400" />
              <span>{property.area_sqft} sqft</span>
            </div>
          </div>

          {/* Key Amenities Preview */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {property.amenities.slice(0, 3).map((amenity, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-medium bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md"
                >
                  {amenity}
                </span>
              ))}
              {property.amenities.length > 3 && (
                <span className="text-[11px] font-medium text-stone-400 px-1 py-0.5">
                  +{property.amenities.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer: Landlord info and View button */}
        <div className="pt-2 flex items-center justify-between border-t border-stone-100 mt-1">
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span className="truncate max-w-[120px]">{property.owner_name}</span>
          </div>

          <button
            id={`btn-view-details-${property.id}`}
            onClick={() => onViewDetails(property.id)}
            className="px-3.5 py-1.5 text-xs font-semibold text-stone-900 bg-stone-100 hover:bg-stone-900 hover:text-white rounded-lg transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};
