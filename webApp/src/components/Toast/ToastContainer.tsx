import React from 'react';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface ToastContainerProps {
  toasts: ToastMessage[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none no-print">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-semibold shadow-2xl text-white transform transition-all duration-300 animate-slide-in-right ${
              isSuccess
                ? 'bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 shadow-emerald-950/40'
                : 'bg-red-600/95 backdrop-blur-md border border-red-400'
            }`}
          >
            <span
              className={`material-icons text-base ${
                isSuccess ? 'text-emerald-400' : 'text-white'
              }`}
            >
              {isSuccess ? 'check_circle' : 'error'}
            </span>
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};
