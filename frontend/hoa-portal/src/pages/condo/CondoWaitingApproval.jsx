import React from 'react';
import { Clock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CondoWaitingApproval() {
  const navigate = useNavigate();

  const handleLogout = () => {
    const keys = ['condo_token', 'condo_session_token', 'condo_user'];
    keys.forEach(k => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
    navigate('/condo/login');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4 font-sans">
      <div className="max-w-md w-full bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-3xl p-8 text-center shadow-lg">
        <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>
        
        <h1 className="text-xl font-bold text-gray-900">
          Verification Pending! ⏳
        </h1>
        
        <p className="text-sm text-gray-500 mt-3 leading-relaxed">
          Your request to join the Condo building has been submitted successfully. The CAM Manager / Board Members are currently reviewing your address and identity proofs.
        </p>

        <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs font-mono text-gray-400">
          Status: <span className="text-amber-500 font-bold">PENDING_APPROVAL</span>
        </div>

        <button
          onClick={handleLogout}
          className="mt-8 w-full flex items-center justify-center space-x-2 py-3 px-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl font-medium transition-all text-sm cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out / Exit</span>
        </button>
      </div>
    </div>
  );
}
