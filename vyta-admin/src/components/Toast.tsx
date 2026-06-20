import { useEffect, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
  key?: string;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle2 size={16} className="text-emerald-500" />,
    error: <AlertCircle size={16} className="text-red-500" />,
    warning: <AlertTriangle size={16} className="text-amber-500" />,
    info: <Info size={16} className="text-blue-500" />,
  };

  const borders = {
    success: 'border-l-emerald-500',
    error: 'border-l-red-500',
    warning: 'border-l-amber-500',
    info: 'border-l-blue-500',
  };

  return (
    <div
      className={`bg-white border border-aws-border rounded shadow-lg border-l-4 ${borders[toast.type]} px-4 py-3 flex items-start space-x-3 min-w-[300px] max-w-[420px] animate-[slideIn_0.2s_ease]`}
    >
      <span className="shrink-0 mt-0.5">{icons[toast.type]}</span>
      <p className="text-[13px] text-aws-heading flex-1">{toast.message}</p>
      <button onClick={() => onDismiss(toast.id)} className="shrink-0 text-gray-400 hover:text-gray-600">
        <X size={14} />
      </button>
    </div>
  );
}

let toastIdCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = `toast-${++toastIdCounter}`;
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toastContainer = toasts.length > 0 && (
    <div className="fixed top-4 right-4 z-[100] flex flex-col space-y-2">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
      ))}
    </div>
  );

  return { toasts, addToast, dismissToast, toastContainer };
}
