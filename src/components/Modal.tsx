import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-[var(--color-primary-dark)]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-2xl border border-[var(--color-neutral-light)] w-full max-w-lg overflow-hidden transform transition-all z-10 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-neutral-light)]">
          <h3 className="text-lg font-bold text-[var(--color-primary)]">{title}</h3>
          <button
            onClick={onClose}
            className="text-[var(--color-secondary)] hover:text-[var(--color-primary)] focus:outline-none transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto text-[var(--color-neutral-text)]">
          {children}
        </div>
      </div>
    </div>
  );
};
