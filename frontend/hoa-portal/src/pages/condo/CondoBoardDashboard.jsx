import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, FileText, CheckCircle2, 
  RefreshCw, ShieldCheck, File
} from 'lucide-react';
import API from '../../services/api';

export default function CondoBoardDashboard({ user, setActivePage }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const commId = user?.community_id;
  const commName = user?.community_name || 'My Building';

  useEffect(() => {
    if (commId) {
      fetchRequests();
    }
  }, [commId]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get(`/condo/community/${commId}/join-requests/pending`);
      setRequests(res.data || []);
    } catch (err) {
      console.error("Failed to load requests for board:", err);
      setError(err?.response?.data?.detail || "Failed to load pending requests.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-0 space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-white font-sans">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/90 to-sky-50/80 dark:from-[#162535] dark:via-[#1A2E44] dark:to-[#162535] text-slate-900 dark:text-white p-4 sm:p-5 border border-indigo-100 dark:border-white/10 shadow-sm">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-400/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-400/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-widest mb-2 shadow-xs">
              <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" /> Board Director
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-1">
              {commName} Board Portal
            </h1>
            <p className="text-slate-600 dark:text-slate-300/90 text-xs sm:text-sm max-w-2xl leading-normal">
              Review building financials, community rules, and pending resident approvals with read/write access.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchRequests}
              disabled={loading}
              className="px-3.5 py-2 bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 text-slate-800 dark:text-white rounded-xl text-xs font-bold border border-slate-200 dark:border-white/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#162535] p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Building Name</p>
            <h4 className="text-lg font-bold truncate max-w-xs">{commName}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-[#162535] p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Registrations</p>
            <h4 className="text-xl font-bold">{loading ? "..." : requests.length} Join Requests</h4>
          </div>
        </div>
      </div>

      {/* Requests Readonly Directory */}
      <div className="bg-white dark:bg-[#162535] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-white/10">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="text-emerald-500" size={18} /> Residents Awaiting Approvals
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            View pending signups. Approvals are processed by the CAM property manager.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-white/10">
                <th className="py-3 px-5">Resident Name</th>
                <th className="py-3 px-5">Email ID</th>
                <th className="py-3 px-5">Unit / Apt</th>
                <th className="py-3 px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-slate-450 font-mono">Loading...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-slate-450">No pending join requests found.</td>
                </tr>
              ) : (
                requests.map(r => (
                  <tr key={r.request_id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-5 font-bold">
                      {r.full_name}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 dark:text-gray-400">
                      {r.email_id}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-indigo-600 dark:text-indigo-400">
                      {r.unit_no || 'N/A'}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 border border-amber-500/20 animate-pulse">
                        Awaiting CAM Action
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
