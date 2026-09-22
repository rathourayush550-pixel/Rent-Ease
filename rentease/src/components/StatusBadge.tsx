import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'booking' | 'payment' | 'maintenance' | 'approval' | 'lease';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'booking', size = 'sm' }) => {
  const norm = status.toLowerCase();

  let colorClasses = 'bg-stone-100 text-stone-700 border-stone-200';
  let label = status;

  if (norm === 'accepted' || norm === 'paid' || norm === 'resolved' || norm === 'approved' || norm === 'active') {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (norm === 'active') label = 'Active Lease';
    if (norm === 'approved') label = 'Approved';
    if (norm === 'resolved') label = 'Resolved';
    if (norm === 'paid') label = 'Paid';
    if (norm === 'accepted') label = 'Accepted';
  } else if (norm === 'pending' || norm === 'in_progress') {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    if (norm === 'in_progress') label = 'In Progress';
    if (norm === 'pending') label = 'Pending';
  } else if (norm === 'rejected' || norm === 'overdue' || norm === 'terminated' || norm === 'cancelled') {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
    if (norm === 'rejected') label = 'Rejected';
    if (norm === 'overdue') label = 'Overdue';
    if (norm === 'terminated') label = 'Terminated';
    if (norm === 'cancelled') label = 'Cancelled';
  } else if (norm === 'emergency' || norm === 'high') {
    colorClasses = 'bg-rose-100 text-rose-800 border-rose-300 font-semibold';
    label = norm.toUpperCase();
  }

  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeClasses} ${colorClasses} whitespace-nowrap`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
};
