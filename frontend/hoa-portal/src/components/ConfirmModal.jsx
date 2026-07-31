import React from 'react';
import ReactDOM from 'react-dom';
import { AlertTriangle, Trash2, X, CheckCircle, Info } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'danger',
  singleButton = false
}) {
  if (!isOpen) return null;

  const getIconDetails = () => {
    switch (type) {
      case 'danger':
        return {
          Icon: Trash2,
          bg: 'bg-red-500/10 text-red-500 border border-red-500/20',
          btnClass: 'bg-red-600 hover:bg-red-500 shadow-red-500/10 hover:shadow-red-500/20'
        };
      case 'success':
        return {
          Icon: CheckCircle,
          bg: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
          btnClass: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/10 hover:shadow-emerald-500/20'
        };
      case 'warning':
        return {
          Icon: AlertTriangle,
          bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
          btnClass: 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/10 hover:shadow-amber-500/20'
        };
      case 'info':
      default:
        return {
          Icon: Info,
          bg: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
          btnClass: 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/10 hover:shadow-blue-500/20'
        };
    }
  };

  const details = getIconDetails();
  const Icon = details.Icon;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scale-up text-center space-y-4">
        
        {/* Close Button */}
        <div className="flex justify-end -mt-2 -mr-2">
          <button 
            type="button"
            onClick={onCancel || onConfirm}
            className="text-slate-400 hover:text-slate-650 dark:text-gray-500 dark:hover:text-white transition-colors cursor-pointer outline-none"
          >
            <X size={18} />
          </button>
        </div>

        {/* Icon */}
        <div className="flex justify-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${details.bg}`}>
            <Icon size={24} />
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-900 dark:text-white leading-none">
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium px-4">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex gap-3">
          {!singleButton && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer text-slate-700 dark:text-slate-300"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${details.btnClass}`}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
