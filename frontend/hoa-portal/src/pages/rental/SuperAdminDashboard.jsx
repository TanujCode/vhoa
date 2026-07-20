import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Home, FileText, CreditCard, ShieldCheck, 
  Search, RefreshCw, AlertCircle, CheckCircle2, XCircle, ArrowUpRight,
  ChevronRight, Activity, TrendingUp, Sparkles, Filter, UserCheck, Wrench
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
    <div className="p-3 sm:p-5 space-y-4 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/90 to-sky-50/80 dark:from-[#162535] dark:via-[#1A2E44] dark:to-[#162535] text-slate-900 dark:text-white p-4 sm:p-5 shadow-xs border border-indigo-100 dark:border-white/10">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-400/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 top-0 w-56 h-56 bg-indigo-400/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-100 dark:bg-indigo-500/20 border border-blue-200 dark:border-indigo-400/30 text-blue-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-2 shadow-xs">
              <ShieldCheck size={13} className="text-blue-600 dark:text-indigo-400" /> Platform Owner Control
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-1">
              Rental System Super Admin Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-300/90 text-xs sm:text-sm max-w-2xl leading-normal">
              Global overview of all registered Landlords, Tenants, Properties, and system-wide transactions across the Rental platform.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="px-3.5 py-2 bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 text-slate-800 dark:text-white rounded-xl text-xs font-bold border border-slate-200 dark:border-white/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh Data
            </button>
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
                      {l.active_status ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 sm:px-5 text-right">
                      <button
                        onClick={() => handleToggleStatus(l)}
                        disabled={togglingId === l.user_id}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                          l.active_status
                            ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                            : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        {togglingId === l.user_id ? "..." : (l.active_status ? "Deactivate" : "Activate")}
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
