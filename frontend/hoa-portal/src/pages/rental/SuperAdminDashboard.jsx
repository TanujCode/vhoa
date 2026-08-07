import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Home, FileText, CreditCard, ShieldCheck, 
  Search, RefreshCw, AlertCircle, CheckCircle2, XCircle, ArrowUpRight,
  ChevronRight, Activity, TrendingUp, Sparkles, Filter, UserCheck, Wrench, Trash2
} from 'lucide-react';
import API from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const SuperAdminDashboard = ({ user, setActivePage }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [stats, setStats] = useState(null);
  const [landlords, setLandlords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, landlordsRes] = await Promise.all([
        API.get('/rental/superadmin/stats'),
        API.get('/rental/landlords')
      ]);

      setStats(statsRes.data);
      setLandlords(landlordsRes.data || []);
    } catch (err) {
      console.error("Failed to load SuperAdmin rental dashboard data:", err);
      setError(err?.response?.data?.detail || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  const [deletingId, setDeletingId] = useState(null);

  const handleToggleStatus = async (landlord) => {
    try {
      setTogglingId(landlord.user_id);
      const newStatus = !landlord.active_status;
      await API.put(`/rental/landlords/${landlord.user_id}/status?active_status=${newStatus}`);
      setLandlords(prev => prev.map(l => l.user_id === landlord.user_id ? { ...l, active_status: newStatus } : l));
    } catch (err) {
      console.error("Failed to toggle landlord status:", err);
      alert(err?.response?.data?.detail || "Failed to update status.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteLandlord = async (landlord) => {
    if (!window.confirm(`Are you sure you want to permanently delete Landlord "${landlord.full_name || landlord.email_id}" and all their properties/leases/tenants? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(landlord.user_id);
      await API.delete(`/rental/landlords/${landlord.user_id}`);
      setLandlords(prev => prev.filter(l => l.user_id !== landlord.user_id));
      alert("Landlord deleted successfully.");
    } catch (err) {
      console.error("Failed to delete landlord:", err);
      alert(err?.response?.data?.detail || "Failed to delete landlord registration.");
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered Landlords
  const filteredLandlords = landlords.filter(l => {
    const nameMatch = (l.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (l.email_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (l.user_code || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'active') return nameMatch && l.active_status;
    if (statusFilter === 'inactive') return nameMatch && !l.active_status;
    return nameMatch;
  });

  return (
    <div className="space-y-6 text-slate-900 dark:text-white pb-12 text-left">
      
      {/* ── Page Header & Highlight Card matching HOA ── */}
      <div className="bg-white dark:bg-[#1E2E42] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 sm:p-8 text-slate-800 dark:text-white shadow-sm dark:shadow-none relative overflow-hidden flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 group">
        {/* Subtle premium light blue glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/[0.03] dark:bg-blue-500/[0.02] rounded-full blur-3xl pointer-events-none" />

        {/* Left: Premium Welcome & Metadata */}
        <div className="flex-1 min-w-0 relative z-10 space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight flex items-center gap-2">
              Welcome back, {user?.name?.split(' ')[0] || 'Admin'}! <Sparkles className="w-6 h-6 text-blue-500 animate-pulse shrink-0" />
            </h1>
            <p className="text-slate-500 dark:text-gray-455 text-xs mt-1 font-medium">
              Rental System Console • Real-Time Workspace Summary
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="inline-flex items-center text-[10px] font-bold text-slate-600 dark:text-slate-355 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-xl border border-slate-200/50 dark:border-white/10 font-mono">
              Role: Super Admin
            </span>
            <span className="inline-flex items-center text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
              ACTIVE
            </span>
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-gray-300 bg-slate-50 dark:bg-white/[0.02] px-2.5 py-1 rounded-xl border border-slate-200/40 dark:border-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition"
            >
              <RefreshCw size={11} className={loading ? "animate-spin" : ""} /> Refresh Data
            </button>
          </div>
        </div>

        {/* Right side stats block matching HOA layout */}
        <div className="relative z-10 w-full lg:w-auto mt-5 lg:mt-0 pt-5 lg:pt-0 border-t border-slate-200/60 dark:border-white/5 lg:border-t-0">
          <div className="grid grid-cols-2 sm:flex sm:flex-row sm:items-center sm:justify-around lg:justify-end gap-5 sm:gap-8 lg:gap-11 w-full">
            <div className="text-center flex flex-col items-center min-w-[65px]">
              <p className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">{loading ? "..." : (stats?.total_landlords || 0)}</p>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-gray-455 uppercase tracking-widest mt-1">Landlords</p>
            </div>
            <div className="text-center flex flex-col items-center min-w-[65px]">
              <p className="text-3xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">{loading ? "..." : (stats?.total_properties || 0)}</p>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-gray-455 uppercase tracking-widest mt-1">Properties</p>
            </div>
            <div className="text-center flex flex-col items-center min-w-[65px]">
              <p className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">{loading ? "..." : (stats?.total_tenants || 0)}</p>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-gray-455 uppercase tracking-widest mt-1">Tenants</p>
            </div>
            <div className="text-center flex flex-col items-center min-w-[65px]">
              <p className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-500 font-mono tracking-tight">{loading ? "..." : `$${Math.round(stats?.gross_collected || 0).toLocaleString()}`}</p>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-gray-455 uppercase tracking-widest mt-1">Gross Vol</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button onClick={fetchDashboardData} className="font-bold underline text-xs">Retry</button>
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Total Landlords */}
        <div className="bg-white dark:bg-[#162535] p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
              Landlords
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <Building2 size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {loading ? "..." : (stats?.total_landlords || 0)}
            </h3>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">
              Registered Accounts
            </span>
          </div>
        </div>

        {/* Card 2: Total Properties */}
        <div className="bg-white dark:bg-[#162535] p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
              Platform Properties
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
              <Home size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {loading ? "..." : (stats?.total_properties || 0)}
            </h3>
            <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-2 py-0.5 rounded-md">
              {stats?.total_units || 0} Total Units
            </span>
          </div>
        </div>

        {/* Card 3: Total Tenants */}
        <div className="bg-white dark:bg-[#162535] p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
              Registered Tenants
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Users size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {loading ? "..." : (stats?.total_tenants || 0)}
            </h3>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md">
              {stats?.total_active_leases || 0} Active Leases
            </span>
          </div>
        </div>

        {/* Card 4: Platform Gross Rent Collected */}
        <div className="bg-white dark:bg-[#162535] p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
              Gross Volume
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {loading ? "..." : `$${(stats?.gross_collected || 0).toLocaleString()}`}
            </h3>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-md">
              Paid Rent Volume
            </span>
          </div>
        </div>

      </div>

      {/* Landlords Management Directory */}
      <div className="bg-white dark:bg-[#162535] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
        
        {/* Section Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="text-blue-500" size={20} /> Registered Landlords Directory
            </h2>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
              Manage accounts, properties, and active status for all landlords registered on the platform.
            </p>
          </div>

          {/* Controls: Search & Status Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-3 py-2 text-xs text-slate-700 dark:text-gray-300 font-medium outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Landlords Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-white/10">
                <th className="py-3 px-4 sm:px-5">Landlord</th>
                <th className="py-3 px-4 sm:px-5">Contact Info</th>
                <th className="py-3 px-4 sm:px-5 text-center">Properties</th>
                <th className="py-3 px-4 sm:px-5 text-center">Units</th>
                <th className="py-3 px-4 sm:px-5 text-center">Active Tenants</th>
                <th className="py-3 px-4 sm:px-5">Status</th>
                <th className="py-3 px-4 sm:px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 font-mono text-xs">
                    Loading landlords directory...
                  </td>
                </tr>
              ) : filteredLandlords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 text-xs">
                    No registered landlords found matching your search.
                  </td>
                </tr>
              ) : (
                filteredLandlords.map((l) => (
                  <tr key={l.user_id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    
                    {/* Landlord Name & ID */}
                    <td className="py-3 px-4 sm:px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 font-bold flex items-center justify-center text-xs border border-indigo-500/20 shrink-0">
                          {(l.first_name?.[0] || 'L')}{(l.last_name?.[0] || 'D')}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs">
                            {l.full_name || `${l.first_name} ${l.last_name}`}
                          </div>
                          <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                            {l.user_code}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="py-3 px-4 sm:px-5 text-xs text-slate-600 dark:text-gray-300">
                      <div>{l.email_id}</div>
                      <div className="text-[10px] text-slate-400">{l.mobile_number || 'No Mobile'}</div>
                    </td>

                    {/* Properties Count */}
                    <td className="py-3 px-4 sm:px-5 text-center font-bold text-slate-900 dark:text-white">
                      <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 text-xs">
                        {l.properties_count}
                      </span>
                    </td>

                    {/* Units Count */}
                    <td className="py-3 px-4 sm:px-5 text-center font-bold text-slate-900 dark:text-white">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-300 text-xs">
                        {l.units_count}
                      </span>
                    </td>

                    {/* Active Tenants Count */}
                    <td className="py-3 px-4 sm:px-5 text-center font-bold text-slate-900 dark:text-white">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 text-xs">
                        {l.active_tenants_count}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 sm:px-5">
                      <button
                        onClick={() => handleToggleStatus(l)}
                        disabled={togglingId === l.user_id}
                        className="focus:outline-none cursor-pointer disabled:opacity-60 transition-transform active:scale-95 text-left inline-flex"
                        title={l.active_status ? "Click to Deactivate" : "Click to Activate"}
                      >
                        {l.active_status ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Inactive
                          </span>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 sm:px-5 text-right">
                      <button
                        onClick={() => handleDeleteLandlord(l)}
                        disabled={deletingId === l.user_id}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-all cursor-pointer disabled:opacity-50 inline-flex items-center justify-center border border-transparent hover:border-rose-500/20"
                        title="Delete Landlord"
                      >
                        <Trash2 size={16} className={deletingId === l.user_id ? "animate-spin" : ""} />
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Access Modules Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
          Platform Management Shortcuts
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div 
            onClick={() => setActivePage('properties_hub')}
            className="p-5 bg-white dark:bg-[#162535] rounded-3xl border border-slate-200/80 dark:border-white/10 hover:border-blue-500/50 cursor-pointer group transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                <Home size={22} />
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
              Properties & Units
            </h4>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
              Inspect all registered properties & unit status across landlords.
            </p>
          </div>

          <div 
            onClick={() => setActivePage('tenants_hub')}
            className="p-5 bg-white dark:bg-[#162535] rounded-3xl border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/50 cursor-pointer group transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <Users size={22} />
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
              Tenants Hub
            </h4>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
              View tenant accounts, active leases, and contact records.
            </p>
          </div>

          <div 
            onClick={() => setActivePage('leases_hub')}
            className="p-5 bg-white dark:bg-[#162535] rounded-3xl border border-slate-200/80 dark:border-white/10 hover:border-purple-500/50 cursor-pointer group transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                <FileText size={22} />
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
              Lease Agreements
            </h4>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
              Review platform-wide lease contracts and signatures.
            </p>
          </div>

          <div 
            onClick={() => setActivePage('servicereq')}
            className="p-5 bg-white dark:bg-[#162535] rounded-3xl border border-slate-200/80 dark:border-white/10 hover:border-amber-500/50 cursor-pointer group transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                <Wrench size={22} />
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
              Maintenance Desk
            </h4>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
              Track maintenance requests logged by tenants and landlords.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default SuperAdminDashboard;
