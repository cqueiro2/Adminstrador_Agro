
import React from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

export interface AlertProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ message, type = 'info', onClose }) => {
  const styles = {
    success: {
      container: "bg-emerald-50 border-emerald-100 text-emerald-800",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    },
    error: {
      container: "bg-red-50 border-red-100 text-red-800",
      icon: <XCircle className="w-5 h-5 text-red-500" />,
    },
    warning: {
      container: "bg-amber-50 border-amber-100 text-amber-800",
      icon: <AlertCircle className="w-5 h-5 text-amber-500" />,
    },
    info: {
      container: "bg-blue-50 border-blue-100 text-blue-800",
      icon: <Info className="w-5 h-5 text-blue-500" />,
    },
  };

  const currentStyle = styles[type];

  return (
    <div className={`p-4 rounded-2xl border flex items-start justify-between shadow-sm ${currentStyle.container}`}>
      <div className="flex items-start space-x-3">
        <div className="mt-0.5">{currentStyle.icon}</div>
        <div className="text-sm font-medium leading-relaxed">{message}</div>
      </div>
      {onClose && (
        <button 
          onClick={onClose} 
          className="ml-4 p-1 rounded-lg hover:bg-black/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
