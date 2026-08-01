import React, { useState, useEffect } from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';

export default function GlobalModal() {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'alert', // 'alert' or 'confirm'
    message: '',
    resolve: null,
  });

  useEffect(() => {
    // Override window.alert
    window.alert = (message) => {
      return new Promise((resolve) => {
        setModalState({
          isOpen: true,
          type: 'alert',
          message: String(message),
          resolve,
        });
      });
    };

    // Expose window.customConfirm (promise-based)
    window.customConfirm = (message) => {
      return new Promise((resolve) => {
        setModalState({
          isOpen: true,
          type: 'confirm',
          message: String(message),
          resolve,
        });
      });
    };

    return () => {
      // Restore default behavior on unmount if needed
      delete window.customConfirm;
    };
  }, []);

  const handleClose = (value) => {
    const { resolve } = modalState;
    setModalState({ isOpen: false, type: 'alert', message: '', resolve: null });
    if (resolve) {
      resolve(value);
    }
  };

  if (!modalState.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200 animate-duration-200">
      <div className="bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl text-slate-900 dark:text-white animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
          {modalState.type === 'confirm' ? <HelpCircle size={28} /> : <AlertCircle size={28} />}
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          {(() => {
            if (modalState.type === 'confirm') return 'Confirm Action';
            const msg = modalState.message.toLowerCase();
            if (msg.includes('success') || msg.includes('successfully') || msg.includes('created') || msg.includes('updated') || msg.includes('deleted') || msg.includes('added')) {
              return 'Success';
            }
            if (msg.includes('error') || msg.includes('failed') || msg.includes('required') || msg.includes('invalid') || msg.includes('must contain')) {
              return 'Alert';
            }
            return 'Message';
          })()}
        </h3>
        <p className="text-xs text-slate-500 dark:text-gray-400 mb-6 leading-relaxed whitespace-pre-line">
          {modalState.message}
        </p>
        <div className="flex gap-3 justify-center">
          {modalState.type === 'confirm' ? (
            <>
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="flex-1 py-3 px-4 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-gray-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleClose(true)}
                className="flex-1 py-3 px-4 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 transition cursor-pointer"
              >
                Confirm
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => handleClose(true)}
              className="w-full py-3 px-4 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 transition cursor-pointer"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
