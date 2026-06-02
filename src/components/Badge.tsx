import React from 'react';

interface BadgeProps {
  variant:
    | 'pending'
    | 'assigned'
    | 'picked_up'
    | 'delivered'
    | 'failed'
    | 'urgent'
    | 'normal'
    | 'available'
    | 'offline'
    | 'busy';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant, children }) => {
  const styles: Record<BadgeProps['variant'], string> = {
    pending: 'bg-[var(--color-secondary-light)] text-[var(--color-primary-dark)]',
    assigned: 'bg-[var(--color-primary-light)] text-white',
    picked_up: 'bg-[var(--color-tertiary-light)] text-white',
    delivered: 'bg-emerald-100 text-emerald-800',
    failed: 'bg-rose-100 text-rose-800',
    urgent: 'bg-rose-100 text-rose-800 border border-rose-200',
    normal: 'bg-[var(--color-neutral-light)] text-[var(--color-neutral-text)]',
    available: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
    offline: 'bg-slate-500/15 text-slate-400 border border-slate-500/25',
    busy: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${styles[variant]}`}>
      {children}
    </span>
  );
};
