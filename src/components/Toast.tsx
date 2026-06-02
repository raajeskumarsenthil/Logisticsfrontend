import React, { createContext, useContext, useState, useCallback } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface ToastContextType {
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((toast) => {
          const bgColors = {
            success: 'bg-emerald-50 border border-emerald-200 text-emerald-800',
            error: 'bg-rose-50 border border-rose-200 text-rose-800',
            warning: 'bg-amber-50 border border-amber-200 text-amber-800',
            info: 'bg-[var(--color-primary-light)]/10 border border-[var(--color-primary-light)]/30 text-[var(--color-primary-dark)]',
          };

          return (
            <div
              key={toast.id}
              className={`p-4 rounded-lg shadow-lg flex items-start justify-between transition-all duration-300 translate-x-0 ${bgColors[toast.type]}`}
            >
              <div className="flex items-center gap-2">
                {toast.type === 'success' && <span>🎉</span>}
                {toast.type === 'error' && <span>🚨</span>}
                {toast.type === 'warning' && <span>⚠️</span>}
                {toast.type === 'info' && <span>ℹ️</span>}
                <span className="text-sm font-medium">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-4 text-[var(--color-secondary)] hover:text-[var(--color-primary)] focus:outline-none text-lg leading-none"
              >
                &times;
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
