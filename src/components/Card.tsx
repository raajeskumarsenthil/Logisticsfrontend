import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, subtitle, children, className = '' }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-[var(--color-neutral-light)] p-5 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-bold text-[var(--color-primary)]">{title}</h3>}
          {subtitle && <p className="text-sm text-[var(--color-secondary)] mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};
