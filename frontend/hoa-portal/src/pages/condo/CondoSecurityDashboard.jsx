import React, { useState, useEffect } from 'react';
import { 
  Shield, Key, Package, RefreshCw, CheckCircle2, ArrowRight
} from 'lucide-react';
import API from '../../services/api';
import { toast } from 'react-hot-toast';

export default function CondoSecurityDashboard({ user, setActivePage }) {
  const commName = user?.community_name || 'My Condo Building';
  const commId = user?.community_id;

  const [stats, setStats] = useState({
    activeVisitors: 0,
    pendingParcels: 0
  });
  const [loading, setLoading] = useState(true);
  const [verifyOtp, setVerifyOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifiedPass, setVerifiedPass] = useState(null);

  const fetchStats = async () => {
    if (!commId) return;
    try {
      setLoading(true);
      // Fetch visitors count
      const visRes = await API.get(`/condo/operations/visitors?community_id=${commId}`);
      const activeVis = (visRes.data || []).filter(p => p.status === 'ACTIVE').length;

      // Fetch parcels count
      const parcRes = await API.get(`/condo/operations/parcels?community_id=${commId}`);
      const pendingParc = (parcRes.data || []).filter(p => p.status === 'RECEIVED' || p.status === 'AWAITING_COLLECTION').length;

      setStats({
        activeVisitors: activeVis,
        pendingParcels: pendingParc
      });
    } catch (err) {
      console.error("Failed to load security stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [commId]);

  const handleVerifyPass = async (e) => {
    e.preventDefault();
    if (!verifyOtp.trim() || verifyOtp.trim().length < 4) {
      toast.error("Please enter a valid access code.");
      return;
    }

    try {
      setVerifying(true);
      setVerifiedPass(null);
      const res = await API.put('/condo/operations/visitors/verify', {
        otp_code: verifyOtp.trim(),
        community_id: commId
      });

      toast.success(`Access Granted: verified ${res.data.guest_name}!`);
      setVerifiedPass(res.data);
      setVerifyOtp('');
      fetchStats();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Invalid access code or pass expired.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="p-0 space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-white font-sans">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-50/80 via-emerald-50/90 to-cyan-50/80 dark:from-[#162535] dark:via-[#152E3C] dark:to-[#162535] text-slate-905 dark:text-white p-5 border border-teal-100 dark:border-white/10 shadow-xs">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-teal-400/10 dark:bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-teal-100 dark:bg-teal-500/20 border border-teal-200 dark:border-teal-400/30 text-teal-700 dark:text-teal-300 text-[10px] font-bold uppercase tracking-widest mb-2 shadow-xs">
            🛡️ Security Desk Active
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-1">
            Gate & Lobby Control Desk
          </h1>
          <p className="text-slate-600 dark:text-slate-350 text-xs sm:text-sm max-w-2xl leading-normal">
            Welcome to the security console for <span className="font-bold text-slate-905 dark:text-white">{commName}</span>. Monitor visitor entry passes, verify gate QR codes, and log incoming resident parcels.
          </p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Visitors */}
        <div className="bg-white dark:bg-[#162535] p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-500/10 text-teal-600 rounded-xl">
              <Key size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Guest Passes</p>
              <h4 className="text-lg font-black mt-0.5">{loading ? "..." : `${stats.activeVisitors} Active`}</h4>
            </div>
          </div>
          <button 
            onClick={() => setActivePage('visitors')}
            className="p-2 hover:bg-slate-50 dark:hover:bg-white/5 text-teal-500 hover:text-teal-600 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowRight size={20} />
          </button>
        </div>

        {/* Card 2: Parcels */}
        <div className="bg-white dark:bg-[#162535] p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-550 rounded-xl">
              <Package size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Packages Awaiting Pickup</p>
              <h4 className="text-lg font-black mt-0.5">{loading ? "..." : `${stats.pendingParcels} Logs`}</h4>
            </div>
          </div>
          <button 
            onClick={() => setActivePage('parcels')}
            className="p-2 hover:bg-slate-50 dark:hover:bg-white/5 text-amber-500 hover:text-amber-600 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>

      {/* Main Verification Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Verification Card */}
        <div className="lg:col-span-2 bg-white dark:bg-[#162535] border border-slate-200/85 dark:border-white/10 p-6 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
            <Shield size={18} />
            <h3 className="text-xs font-bold uppercase tracking-wider">Verify Gate Pass Code</h3>
          </div>

          <form onSubmit={handleVerifyPass} className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              maxLength="6"
              placeholder="Enter 6-Digit Gate Code..." 
              value={verifyOtp}
              onChange={e => setVerifyOtp(e.target.value.replace(/\D/g, ''))}
              className="flex-1 bg-slate-50 dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-905 dark:text-white placeholder-slate-400 font-mono font-bold tracking-widest focus:outline-none focus:border-teal-500 transition-all"
            />
            <button
              type="submit"
              disabled={verifying}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-teal-500/20"
            >
              {verifying ? <RefreshCw size={14} className="animate-spin" /> : "Verify Access"}
            </button>
          </form>

          {/* Verification Result Display */}
          {verifiedPass && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Access Granted</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">GUEST NAME</p>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">{verifiedPass.guest_name}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">DESTINATION UNIT</p>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">Unit {verifiedPass.unit_no}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">VEHICLE PLATE</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{verifiedPass.vehicle_no || 'None'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">RESIDENT NAME</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{verifiedPass.resident_name}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Operations / Guidelines */}
        <div className="bg-white dark:bg-[#162535] border border-slate-200/85 dark:border-white/10 p-6 rounded-3xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Desk Operations</h3>
          
          <div className="space-y-3 text-xs">
            <div 
              onClick={() => setActivePage('visitors')}
              className="p-3 bg-slate-50 hover:bg-teal-50 dark:bg-white/5 dark:hover:bg-teal-950/15 border border-slate-150 dark:border-white/5 hover:border-teal-500/30 rounded-xl cursor-pointer transition-all flex items-center justify-between"
            >
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Visitor Pass Log</p>
                <p className="text-[10px] text-slate-400 mt-0.5">View today's gate check-in ledger</p>
              </div>
              <ArrowRight size={14} className="text-slate-400" />
            </div>

            <div 
              onClick={() => setActivePage('parcels')}
              className="p-3 bg-slate-50 hover:bg-amber-50 dark:bg-white/5 dark:hover:bg-amber-950/15 border border-slate-150 dark:border-white/5 hover:border-amber-500/30 rounded-xl cursor-pointer transition-all flex items-center justify-between"
            >
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Receive Package</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Log package arrival for residents</p>
              </div>
              <ArrowRight size={14} className="text-slate-400" />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
