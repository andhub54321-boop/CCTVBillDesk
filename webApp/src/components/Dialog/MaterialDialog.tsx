import React from 'react';

export interface DialogOptions {
  title: string;
  message: string;
  icon?: string;
  confirmText?: string;
  cancelText?: string | null;
  isDanger?: boolean;
}

interface MaterialDialogProps extends DialogOptions {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const MaterialDialog: React.FC<MaterialDialogProps> = ({
  isOpen,
  title,
  message,
  icon = 'info',
  confirmText = 'OK',
  cancelText = null,
  isDanger = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-300 no-print">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 transform transition-all duration-200 scale-100 flex flex-col animate-scale-up">
        <div className="flex items-center gap-3.5 mb-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner ${
              isDanger
                ? 'bg-red-100 text-red-600'
                : 'bg-blue-100 text-brand-800'
            }`}
          >
            <span className="material-icons text-2xl">{icon}</span>
          </div>
          <h4 className="text-base font-bold text-slate-900 leading-snug">{title}</h4>
        </div>

        <p className="text-xs text-slate-600 mb-6 leading-relaxed font-medium">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2.5">
          {cancelText && (
            <button
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 active:scale-95 transition"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-lg active:scale-95 transition ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-brand-800 hover:bg-brand-900'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
