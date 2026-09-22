import React, { useState, useEffect } from 'react';
import { Property, Review } from '../types.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { RequestRentModal } from '../components/modals/RequestRentModal.tsx';
import { ContactOwnerModal } from '../components/modals/ContactOwnerModal.tsx';
import { ReviewModal } from '../components/modals/ReviewModal.tsx';
import { StatusBadge } from '../components/StatusBadge.tsx';
import {
  ArrowLeft,
  MapPin,
  Star,
  Bed,
  Bath,
  Maximize2,
  ShieldCheck,
  Calendar,
  CheckCircle,
  MessageSquare,
  Sparkles,
  Wifi,
  Car,
  Waves,
  Dumbbell,
  Wind,
  Home,
  Dog,
  Shirt,
  Shield,
  Phone,
  Mail,
  User,
  Check,
} from 'lucide-react';

interface PropertyDetailsProps {
  propertyId: number;
  onBack: () => void;
  onNavigate: (path: string) => void;
}

export const PropertyDetails: React.FC<PropertyDetailsProps> = ({
  propertyId,
  onBack,
  onNavigate,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Modals state
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await api.properties.getById(propertyId);
      if (res.success) {
        setProperty(res.property);
        setReviews(res.reviews || []);
        if (res.property.images && res.property.images.length > 0) {
          setSelectedPhoto(res.property.images[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load property details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [propertyId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getAmenityIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('wifi')) return <Wifi className="w-4 h-4 text-amber-600" />;
    if (lower.includes('parking')) return <Car className="w-4 h-4 text-amber-600" />;
    if (lower.includes('pool')) return <Waves className="w-4 h-4 text-amber-600" />;
    if (lower.includes('gym') || lower.includes('fitness')) return <Dumbbell className="w-4 h-4 text-amber-600" />;
    if (lower.includes('air') || lower.includes('ac')) return <Wind className="w-4 h-4 text-amber-600" />;
    if (lower.includes('balcony')) return <Home className="w-4 h-4 text-amber-600" />;
    if (lower.includes('pet')) return <Dog className="w-4 h-4 text-amber-600" />;
    if (lower.includes('washer') || lower.includes('laundry')) return <Shirt className="w-4 h-4 text-amber-600" />;
    if (lower.includes('security')) return <Shield className="w-4 h-4 text-amber-600" />;
    return <CheckCircle className="w-4 h-4 text-amber-600" />;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="h-8 w-40 bg-stone-200 rounded animate-pulse" />
        <div className="h-96 bg-stone-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900">Property Not Found</h2>
        <p className="text-xs text-stone-500">The requested rental listing is no longer available.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold"
        >
          Back to Listings
        </button>
      </div>
    );
  }

  const galleryImages =
    property.images && property.images.length > 0
      ? property.images
      : ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'];

  return (
    <div id="page-property-details" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-medium border border-stone-700 animate-in slide-in-from-top-4">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Top Bar */}
      <div className="flex items-center justify-between">
        <button
          id="btn-back-to-properties"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white border border-stone-200 px-3 py-1.5 rounded-xl hover:bg-stone-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Browse</span>
        </button>

        <div className="flex items-center gap-2">
          <StatusBadge status={property.approval_status} type="approval" />
          {!property.is_available ? (
            <span className="px-2.5 py-1 text-xs font-bold bg-rose-600 text-white rounded-full">
              Occupied
            </span>
          ) : (
            <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-full">
              Available to Lease
            </span>
          )}
        </div>
      </div>

      {/* Title & Location Header */}
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-stone-900 text-white rounded-md">
            {property.property_type}
          </span>
          <span className="px-2.5 py-0.5 text-xs font-semibold bg-stone-100 text-stone-800 rounded-md">
            {property.furnished_status}
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            {property.average_rating || 5.0} ({property.review_count || 0} reviews)
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
          {property.title}
        </h1>

        <p className="text-xs sm:text-sm text-stone-500 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
          {property.address}, {property.city}, {property.state} {property.zip_code}
        </p>
      </div>

      {/* Image Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-2xl overflow-hidden shadow-sm">
        {/* Main Big Photo */}
        <div className="md:col-span-3 aspect-[16/10] bg-stone-100 relative group overflow-hidden">
          <img
            src={selectedPhoto || galleryImages[0]}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-300"
          />
        </div>

        {/* Thumbnail Column */}
        <div className="grid grid-cols-4 md:grid-cols-1 gap-2 md:max-h-full overflow-y-auto">
          {galleryImages.map((img, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedPhoto(img)}
              className={`aspect-video rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                selectedPhoto === img ? 'border-amber-500 shadow-md ring-2 ring-amber-500/20' : 'border-transparent opacity-80 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Layout: Details vs Sticky Action Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details, Amenities, Landlord, Reviews */}
        <div className="lg:col-span-2 space-y-8">
          {/* Key Specs Bar */}
          <div className="grid grid-cols-3 gap-4 bg-white p-5 rounded-2xl border border-stone-200 text-center shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-stone-400">
                <Bed className="w-5 h-5 text-amber-600" />
              </div>
              <span className="block text-base font-extrabold text-stone-900">{property.bedrooms} Beds</span>
              <span className="text-[11px] text-stone-400 uppercase font-semibold">Bedrooms</span>
            </div>

            <div className="space-y-1 border-x border-stone-100">
              <div className="flex items-center justify-center gap-1.5 text-stone-400">
                <Bath className="w-5 h-5 text-amber-600" />
              </div>
              <span className="block text-base font-extrabold text-stone-900">{property.bathrooms} Baths</span>
              <span className="text-[11px] text-stone-400 uppercase font-semibold">Bathrooms</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-stone-400">
                <Maximize2 className="w-5 h-5 text-amber-600" />
              </div>
              <span className="block text-base font-extrabold text-stone-900">{property.area_sqft}</span>
              <span className="text-[11px] text-stone-400 uppercase font-semibold">Square Feet</span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
            <h2 className="text-lg font-bold text-stone-900">About this Property</h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Amenities Grid */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" /> Amenities & Features Included
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {property.amenities && property.amenities.length > 0 ? (
                property.amenities.map((amenity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs font-semibold text-stone-700"
                  >
                    {getAmenityIcon(amenity)}
                    <span>{amenity}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-400">Basic residential amenities included.</p>
              )}
            </div>
          </div>

          {/* Landlord Profile Card */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-stone-900">Listed By Verified Landlord</h2>
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified Host
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-3">
                <img
                  src={
                    property.owner_avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
                  }
                  alt={property.owner_name}
                  className="w-14 h-14 rounded-2xl object-cover border border-stone-200 shadow-sm"
                />
                <div>
                  <h3 className="text-sm font-bold text-stone-900">{property.owner_name}</h3>
                  <p className="text-xs text-stone-500">Property Owner & Manager</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">Prompt response rate (under 1 hr)</p>
                </div>
              </div>

              <button
                id="btn-open-contact-owner"
                onClick={() => {
                  if (!isAuthenticated) onNavigate('/login');
                  else setIsContactModalOpen(true);
                }}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shrink-0"
              >
                <MessageSquare className="w-4 h-4 text-amber-600" />
                <span>Message Host</span>
              </button>
            </div>
          </div>

          {/* Reviews & Ratings */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-900 rounded-xl font-black text-xl flex items-center gap-1">
                  <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                  {property.average_rating || 5.0}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900">Tenant Reviews</h2>
                  <p className="text-xs text-stone-500">{reviews.length} authenticated reviews</p>
                </div>
              </div>

              <button
                id="btn-open-write-review"
                onClick={() => {
                  if (!isAuthenticated) onNavigate('/login');
                  else setIsReviewModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-stone-900 text-white text-xs font-semibold rounded-xl hover:bg-stone-800 transition-colors shadow-sm"
              >
                Write Review
              </button>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-xs text-stone-400 py-4 text-center">
                  No reviews yet. Be the first tenant to leave feedback!
                </p>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-xl bg-stone-50/70 border border-stone-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            rev.tenant_avatar ||
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
                          }
                          alt={rev.tenant_name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <span className="text-xs font-bold text-stone-900">{rev.tenant_name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{rev.rating}.0</span>
                      </div>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">{rev.comment}</p>
                    <span className="text-[10px] text-stone-400 block">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Action Box */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white p-6 rounded-2xl border border-stone-200 shadow-xl space-y-6">
            {/* Price Header */}
            <div className="flex items-baseline justify-between pb-4 border-b border-stone-100">
              <div>
                <span className="text-3xl font-black text-stone-900 tracking-tight">
                  ${property.monthly_rent.toLocaleString()}
                </span>
                <span className="text-xs text-stone-500 font-medium"> / month</span>
              </div>

              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Verified
              </span>
            </div>

            {/* Financial Details */}
            <div className="space-y-2 text-xs text-stone-600 bg-stone-50 p-3.5 rounded-xl border border-stone-100">
              <div className="flex justify-between">
                <span>Monthly Rent:</span>
                <strong className="text-stone-900">${property.monthly_rent.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span>Security Deposit:</span>
                <strong className="text-stone-900">${property.security_deposit.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span>Application Fee:</span>
                <strong className="text-emerald-600">$0 (Free)</strong>
              </div>
              <div className="border-t border-stone-200 pt-2 flex justify-between font-bold text-stone-900">
                <span>Total Due at Move-in:</span>
                <span className="text-amber-600 font-extrabold text-sm">
                  ${(property.monthly_rent + property.security_deposit).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="space-y-2">
              <button
                id="btn-apply-to-rent"
                onClick={() => {
                  if (!isAuthenticated) onNavigate('/login');
                  else setIsRentModalOpen(true);
                }}
                disabled={!property.is_available}
                className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-sm transition-all shadow-md active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>{property.is_available ? 'Request to Rent' : 'Currently Occupied'}</span>
              </button>

              <button
                id="btn-side-contact-owner"
                onClick={() => {
                  if (!isAuthenticated) onNavigate('/login');
                  else setIsContactModalOpen(true);
                }}
                className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-stone-500" />
                <span>Inquire with Landlord</span>
              </button>
            </div>

            {/* Trust Assurances */}
            <div className="pt-2 border-t border-stone-100 space-y-2 text-[11px] text-stone-500">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Legally compliant digital lease agreement</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Direct in-app rent payment receipts</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>No charges until application is accepted</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <RequestRentModal
        property={property}
        isOpen={isRentModalOpen}
        onClose={() => setIsRentModalOpen(false)}
        onSuccess={() => {
          showToast('Rental application sent successfully! The landlord will review it.');
          fetchDetails();
        }}
        onNavigateToLogin={() => onNavigate('/login')}
      />

      <ContactOwnerModal
        property={property}
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        onSuccess={() => {
          showToast('Message sent! You can continue the chat in Messages.');
          onNavigate(user?.role === 'owner' ? '/owner/messages' : '/tenant/messages');
        }}
        onNavigateToLogin={() => onNavigate('/login')}
      />

      <ReviewModal
        property={property}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSuccess={() => {
          showToast('Thank you! Your review has been published.');
          fetchDetails();
        }}
      />
    </div>
  );
};
