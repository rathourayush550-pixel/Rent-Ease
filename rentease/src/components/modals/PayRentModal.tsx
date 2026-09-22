import React, { useState } from 'react';
import { Payment } from '../../types.ts';
import { api } from '../../services/api.ts';
import { X, CreditCard, Landmark, QrCode, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface PayRentModalProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PayRentModal: React.FC<PayRentModalProps> = ({
  payment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [method, setMethod] = useState<'Credit Card' | 'Bank Transfer' | 'UPI'>('Credit Card');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8921');
  const [expiry, setExpiry] = useState('08/28');
  const [cvv, setCvv] = useState('382');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<string | null>(null);

  if (!isOpen || !payment) return null;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      const res = await api.payments.payRent({
        payment_id: payment.id,
        payment_method: method,
        card_last4: '8921',
      });

      setSuccessReceipt(res.payment.transaction_ref);
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccessReceipt(null);
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Payment processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="modal-pay-rent"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900">Rent Payment Gateway</h3>
            <p className="text-xs text-stone-500">Secure 256-Bit Encrypted Checkout</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {successReceipt ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-stone-900">Payment Successful!</h4>
              <p className="text-xs text-stone-500">
                Transaction Reference: <strong className="text-stone-800">{successReceipt}</strong>
              </p>
              <span className="text-[11px] text-stone-400 block">Updating lease records...</span>
            </div>
          ) : (
            <form onSubmit={handlePay} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Invoice Summary */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Invoice Purpose:</span>
                  <span className="font-semibold text-stone-900">{payment.payment_type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Billing Period:</span>
                  <span className="font-semibold text-stone-900">{payment.month_year}</span>
                </div>
                <div className="flex justify-between">
                  <span>Property:</span>
                  <span className="font-semibold text-stone-900 truncate max-w-[200px]">
                    {payment.property_title || 'Rental Unit'}
                  </span>
                </div>
                <div className="border-t border-stone-200 pt-2 flex justify-between items-baseline">
                  <span className="font-bold text-stone-900">Total Due:</span>
                  <span className="text-lg font-black text-amber-600">
                    ${payment.amount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod('Credit Card')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      method === 'Credit Card'
                        ? 'border-amber-600 bg-amber-50/50 text-amber-900 ring-2 ring-amber-500/20'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-amber-600" />
                    <span>Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('Bank Transfer')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      method === 'Bank Transfer'
                        ? 'border-amber-600 bg-amber-50/50 text-amber-900 ring-2 ring-amber-500/20'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <Landmark className="w-4 h-4 text-amber-600" />
                    <span>Net Banking</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('UPI')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      method === 'UPI'
                        ? 'border-amber-600 bg-amber-50/50 text-amber-900 ring-2 ring-amber-500/20'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-amber-600" />
                    <span>UPI / QR</span>
                  </button>
                </div>
              </div>

              {/* Method Details */}
              {method === 'Credit Card' && (
                <div className="space-y-3 bg-stone-50/60 p-3 rounded-xl border border-stone-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      id="input-card-number"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white"
                      placeholder="4532 •••• •••• ••••"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        CVV Code
                      </label>
                      <input
                        type="password"
                        value={cvv}
                        maxLength={4}
                        onChange={(e) => setCvv(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 bg-white"
                        placeholder="•••"
                      />
                    </div>
                  </div>
                </div>
              )}

              {method === 'UPI' && (
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center space-y-2 text-xs">
                  <p className="font-semibold text-stone-800">Scan & Pay via any UPI App</p>
                  <div className="w-32 h-32 mx-auto bg-white border border-stone-300 rounded-lg flex items-center justify-center p-2 shadow-sm">
                    <QrCode className="w-24 h-24 text-stone-800" />
                  </div>
                  <span className="text-[11px] text-stone-500 font-mono">rentease.pay@upi</span>
                </div>
              )}

              {method === 'Bank Transfer' && (
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1.5 text-stone-700">
                  <div className="flex justify-between">
                    <span>Account Name:</span>
                    <strong className="text-stone-900">RentEase Escrow Services</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Account Number:</span>
                    <strong className="text-stone-900 font-mono">9812-4019-3382</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Routing Number:</span>
                    <strong className="text-stone-900 font-mono">021000021</strong>
                  </div>
                </div>
              )}

              {/* Security Note */}
              <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Simulated PCI-DSS payment simulator for college demonstration</span>
              </div>

              {/* Submit Button */}
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
                  id="btn-confirm-pay-rent"
                  disabled={isProcessing}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors shadow-sm"
                >
                  {isProcessing ? 'Processing Payment...' : `Authorize $${payment.amount.toLocaleString()}`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
