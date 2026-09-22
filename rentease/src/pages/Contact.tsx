import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, HelpCircle, CheckCircle2, ChevronDown } from 'lucide-react';

interface ContactProps {
  onNavigate?: (path: string) => void;
}

export const Contact: React.FC<ContactProps> = ({ onNavigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('tenant');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const faqs = [
    {
      q: 'How does a rental application transition into an active lease?',
      a: 'When a tenant finds a property, they submit a rental request specifying move-in date and duration. The landlord reviews this under "Tenant Applications". Once the landlord clicks "Accept", the system automatically creates a formal Rental Tenancy record, generates monthly rent invoice schedules, and marks the property as occupied.',
    },
    {
      q: 'How does the online payment simulator work?',
      a: 'The tenant navigates to "Pay Rent & Invoices", selects the pending bill, and chooses Credit Card, UPI, or Bank Transfer. Submitting the payment records a transaction reference, timestamps the payment, updates the invoice status to "paid", and recalculates the landlord’s collected income.',
    },
    {
      q: 'How are maintenance complaints resolved?',
      a: 'Tenants log an issue with category (e.g. Plumbing, Electrical), urgency priority, description, and optional photo. Landlords can view the ticket in their portal, change status from Pending -> In Progress -> Resolved, and append resolution notes for the tenant.',
    },
    {
      q: 'How does RentEase ensure property listing authenticity?',
      a: 'All submitted properties undergo administrator verification to validate address accuracy, specifications, and owner credentials before being published in the public search index.',
    },
  ];

  return (
    <div id="page-contact" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Contact & Support</h1>
        <p className="text-xs sm:text-sm text-stone-500 max-w-lg mx-auto">
          Need assistance or have feedback regarding the RentEase Property Management System? Get in touch with our team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact Form */}
        <div className="md:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-stone-900">Send an Inquiry</h2>

          {submitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-emerald-900">Message Received!</h3>
              <p className="text-xs text-emerald-700">
                Thank you for contacting RentEase. Your inquiry has been logged for evaluation.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setMessage('');
                  setSubject('');
                }}
                className="mt-3 px-4 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-semibold"
              >
                Send Another Note
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    id="input-contact-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    id="input-contact-email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@rentease.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Your Role</label>
                  <select
                    id="select-contact-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-white"
                  >
                    <option value="tenant">Prospective or Current Tenant</option>
                    <option value="owner">Property Owner / Landlord</option>
                    <option value="admin">College Faculty / Evaluator</option>
                    <option value="other">Other Inquiry</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Subject</label>
                  <input
                    type="text"
                    id="input-contact-subject"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Leasing questions, bug report, etc."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Detailed Message</label>
                <textarea
                  id="input-contact-textarea"
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we assist you today?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <button
                type="submit"
                id="btn-submit-contact"
                className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" />
                <span>Submit Message</span>
              </button>
            </form>
          )}
        </div>

        {/* Contact Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-stone-900">Project Help Desk</h3>
            <div className="space-y-3 text-xs text-stone-600">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                <span>support@rentease.internal</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                <span>+1 (800) 555-RENT</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                <span>College Engineering Dept, Lab 402</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 p-6 rounded-3xl border border-amber-200 text-xs text-amber-900 space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-amber-950">
              <HelpCircle className="w-4 h-4 text-amber-600" /> Demo Credentials Tip
            </h4>
            <p className="leading-relaxed">
              Use the top banner bar to switch instantly between Tenant, Landlord, and Administrator without entering manual credentials.
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-stone-900">Frequently Asked Questions</h2>
        <div className="divide-y divide-stone-100">
          {faqs.map((faq, idx) => (
            <div key={idx} className="py-4">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-stone-900 hover:text-amber-600 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    openFaq === idx ? 'rotate-180 text-amber-600' : 'text-stone-400'
                  }`}
                />
              </button>
              {openFaq === idx && (
                <p className="mt-2 text-xs text-stone-600 leading-relaxed pl-2 border-l-2 border-amber-400">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
