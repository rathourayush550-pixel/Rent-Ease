import React, { useState } from 'react';
import { api } from '../../services/api.ts';
import { Property } from '../../types.ts';
import { X, Star, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ReviewModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  property,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please provide your review feedback.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.reviews.create({
        property_id: property.id,
        rating,
        comment: comment.trim(),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="modal-submit-review"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900">Leave a Review</h3>
            <p className="text-xs text-stone-500">Rate your experience at {property.title}</p>
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

          {/* Star Rating Picker */}
          <div className="text-center py-2">
            <span className="block text-xs font-semibold text-stone-600 mb-2">Overall Rating</span>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(rating)}
                  className="p-1 text-amber-400 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-stone-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-stone-700 mt-2 block">
              {rating === 5 ? 'Excellent 🌟' : rating === 4 ? 'Very Good 👍' : rating === 3 ? 'Average' : 'Needs Improvement'}
            </span>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Your Feedback & Experience
            </label>
            <textarea
              id="input-review-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you love about the apartment? How was the landlord responsiveness, neighborhood, and amenities?"
              required
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            />
          </div>

          {/* Submit */}
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
              id="btn-publish-review"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl transition-colors shadow-sm"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
