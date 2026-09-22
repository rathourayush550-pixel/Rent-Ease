import React, { useState } from 'react';
import { Property } from '../../types.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { X, Calendar, Clock, Users, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';

interface RequestRentModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onNavigateToLogin: () => void;
}

export const RequestRentModal: React.FC<RequestRentModalProps> = ({
  property,
  isOpen,
  onClose,
  onSuccess,
  onNavigateToLogin,
}) => {
  const { user, isAuthenticated } = useAuth();

  // Next month first day default
  const defaultDate = new Date();
  defaultDate.setMonth(defaultDate.getMonth() + 1);
  defaultDate.setDate(1);
  const defaultDateStr = defaultDate.toISOString().split('T')[0];

  const [moveInDate, setMoveInDate] = useState(defaultDateStr);
  const [leaseDuration, setLeaseDuration] = useState(12);
  const [occupantsCount, setOccupantsCount] = useState(1);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onNavigateToLogin();
      return;
    }

    if (user?.role !== 'tenant') {
      setError('Only tenant accounts can submit rental applications. Please switch role to Tenant.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.bookings.createRequest({
        property_id: property.id,
        move_in_date: moveInDate,
        lease_duration_months: leaseDuration,
        occupants_count: occupantsCount,
        message,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalMoveIn = property.monthly_rent + property.security_deposit;

  return (
    <div
      id="modal-request-rent"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-stone-900">Rental Application</h3>
            <p className="text-xs text-stone-500">Apply to lease {property.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Pricing Summary Widget */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 space-y-1.5 text-xs text-stone-700">
            <div className="flex justify-between">
              <span>Monthly Rent:</span>
              <span className="font-semibold">${property.monthly_rent.toLocaleString()} / mo</span>
            </div>
            <div className="flex justify-between">
              <span>Security Deposit:</span>
              <span className="font-semibold">${property.security_deposit.toLocaleString()}</span>
            </div>
            <div className="border-t border-amber-200/60 pt-1.5 flex justify-between font-bold text-amber-950 text-sm">
              <span>Initial Move-in Cost:</span>
              <span>${totalMoveIn.toLocaleString()}</span>
            </div>
          </div>

          {/* Target Move In Date */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              Target Move-in Date
            </label>
            <input
              type="date"
              id="input-move-in-date"
              value={moveInDate}
              onChange={(e) => setMoveInDate(e.target.value)}
              required
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            />
          </div>

          {/* Duration and Occupants */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                Lease Duration
              </label>
              <select
                id="select-lease-duration"
                value={leaseDuration}
                onChange={(e) => setLeaseDuration(Number(e.target.value))}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              >
                <option value={6}>6 Months</option>
                <option value={12}>12 Months (Standard)</option>
                <option value={18}>18 Months</option>
                <option value={24}>24 Months</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-stone-400" />
                Occupants
              </label>
              <select
                id="select-occupants-count"
                value={occupantsCount}
                onChange={(e) => setOccupantsCount(Number(e.target.value))}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              >
                <option value={1}>1 Person</option>
                <option value={2}>2 People</option>
                <option value={3}>3 People</option>
                <option value={4}>4+ People</option>
              </select>
            </div>
          </div>

          {/* Tenant Intro Note */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Message to Landlord ({property.owner_name})
            </label>
            <textarea
              id="input-booking-message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Introduce yourself, your profession, and why you love this home..."
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            />
          </div>

          {/* Footer Action */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-booking-request"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl transition-colors shadow-sm"
            >
              {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
