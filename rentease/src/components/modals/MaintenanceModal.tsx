import React, { useState } from 'react';
import { api } from '../../services/api.ts';
import { Rental } from '../../types.ts';
import { X, Wrench, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

interface MaintenanceModalProps {
  rentals: Rental[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  rentals,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedRentalId, setSelectedRentalId] = useState<number>(rentals[0]?.id || 1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Plumbing');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRentalId || !title.trim() || !description.trim()) {
      setError('Please provide rental property, complaint title, and description.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.maintenance.create({
        rental_id: Number(selectedRentalId),
        title: title.trim(),
        category,
        priority,
        description: description.trim(),
        image_url: imageUrl ? imageUrl.trim() : undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit maintenance request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="modal-create-maintenance"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">Raise Maintenance Ticket</h3>
              <p className="text-xs text-stone-500">Report an issue to your landlord or property manager</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Select Active Lease */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Select Leased Property
            </label>
            <select
              id="select-maintenance-rental"
              value={selectedRentalId}
              onChange={(e) => setSelectedRentalId(Number(e.target.value))}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            >
              {rentals.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.property?.title || `Lease #${r.id}`} ({r.property?.city || 'Residence'})
                </option>
              ))}
            </select>
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Category
              </label>
              <select
                id="select-maintenance-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              >
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Appliance">Appliance</option>
                <option value="HVAC">Heating / AC</option>
                <option value="Carpentry">Carpentry & Locks</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Urgency Priority
              </label>
              <select
                id="select-maintenance-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 font-medium"
              >
                <option value="low">Low (Cosmetic/Convenience)</option>
                <option value="medium">Medium (Standard Repair)</option>
                <option value="high">High (Impacting Daily Routine)</option>
                <option value="emergency">Emergency (Leak / Hazard)</option>
              </select>
            </div>
          </div>

          {/* Issue Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Issue Summary
            </label>
            <input
              type="text"
              id="input-maintenance-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Leaking kitchen faucet or heating not turning on"
              required
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Detailed Description
            </label>
            <textarea
              id="input-maintenance-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact room location, how long it has been occurring, and any relevant steps..."
              required
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Photo URL (Optional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            />
          </div>

          {/* Buttons */}
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
              id="btn-submit-maintenance"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-xl transition-colors shadow-sm"
            >
              {isSubmitting ? 'Submitting Ticket...' : 'File Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
