import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-5 z-50 sm:max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-200">
      <div className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3 ${
        toast.type === 'success' 
          ? 'bg-[#1C281F] text-white border-[#2A3F31]' 
          : toast.type === 'error'
          ? 'bg-[#430C13] text-white border-[#58111A]'
          : 'bg-[#1C2024] text-white border-[#2E353B]'
      }`}>
        {toast.type === 'success' ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <h4 className="text-xs sm:text-sm font-semibold">{toast.title}</h4>
          {toast.description && (
            <p className="text-xs text-white/80 mt-0.5 leading-relaxed">{toast.description}</p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-white/60 hover:text-white transition-colors p-1 -mr-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
