import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface AlertMessage {
  type: 'success' | 'error';
  text: string;
}

interface AlertBannerProps {
  alert: AlertMessage | null;
  onClose: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alert, onClose }) => {
  if (!alert) return null;

  const isSuccess = alert.type === 'success';

  return (
    <div
      className={`p-4 rounded-xl border flex items-start justify-between shadow-sm transition-all duration-200 mb-6 ${
        isSuccess
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : 'bg-rose-50 border-rose-200 text-rose-900'
      }`}
    >
      <div className="flex items-start space-x-3">
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
        )}
        <div>
          <p className="text-sm font-medium">{alert.text}</p>
        </div>
      </div>
      <button
        onClick={onClose}
        className={`p-1 rounded-md transition-colors ${
          isSuccess
            ? 'text-emerald-700 hover:bg-emerald-100'
            : 'text-rose-700 hover:bg-rose-100'
        }`}
        aria-label="Cerrar alerta"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
