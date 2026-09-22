import React, { useState } from 'react';
import { api } from '../../services/api.ts';
import { Property } from '../../types.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { X, Send, MessageSquare, AlertCircle } from 'lucide-react';

interface ContactOwnerModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (targetUserId: number) => void;
  onNavigateToLogin: () => void;
}

export const ContactOwnerModal: React.FC<ContactOwnerModalProps> = ({
  property,
  isOpen,
  onClose,
  onSuccess,
  onNavigateToLogin,
}) => {
  const { isAuthenticated } = useAuth();
  const [message, setMessage] = useState(`Hi ${property.owner_name}, I am interested in "${property.title}" and would like to ask a few questions.`);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onNavigateToLogin();
      return;
    }

    if (!message.trim()) {
      setError('Please write a message.');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      await api.messages.send({
        receiver_id: property.owner_id,
        property_id: property.id,
        message: message.trim(),
      });

      onSuccess(property.owner_id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      id="modal-contact-owner"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">Message Landlord</h3>
              <p className="text-xs text-stone-500">Direct message to {property.owner_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSend} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Your Message
            </label>
            <textarea
              id="input-contact-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            />
          </div>

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
              id="btn-send-contact-message"
              disabled={isSending}
              className="px-5 py-2.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5 text-amber-400" />
              <span>{isSending ? 'Sending...' : 'Send Message'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
