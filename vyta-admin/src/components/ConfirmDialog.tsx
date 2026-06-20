import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const variantStyles = {
    danger: {
      icon: 'bg-red-50 border-red-200 text-red-600',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: 'bg-amber-50 border-amber-200 text-amber-600',
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    info: {
      icon: 'bg-blue-50 border-blue-200 text-blue-600',
      button: 'bg-aws-blue-accent hover:bg-blue-700 text-white',
    },
  };

  const s = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px]" onClick={onCancel}>
      <div
        className="bg-white rounded-lg w-full max-w-sm border border-aws-border shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-aws-border">
          <div className="flex items-center space-x-2">
            <AlertTriangle size={16} className={variant === 'danger' ? 'text-red-500' : variant === 'warning' ? 'text-amber-500' : 'text-blue-500'} />
            <h2 className="text-[15px] font-bold text-aws-heading">{title}</h2>
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-black">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-start space-x-3">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${s.icon}`}>
              <AlertTriangle size={16} />
            </div>
            <p className="text-[13px] text-aws-text-secondary leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex justify-end space-x-3 px-5 py-4 border-t border-aws-border bg-gray-50/50">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-1.5 text-[13px] font-medium text-aws-text-secondary hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-1.5 text-[13px] font-bold rounded-md transition-colors flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${s.button}`}
          >
            {loading && (
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
