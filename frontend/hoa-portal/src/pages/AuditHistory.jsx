import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, Shield, ChevronDown, Clock, User, Globe, Layers } from 'lucide-react';
import API from '../services/api';

const cleanDescription = (desc) => {
  if (!desc) return "";
  let clean = desc;
  clean = clean.replace(/User:\s+([^(]+)\s+\(ID:[^)]+\)/gi, '$1');
  clean = clean.replace(/User:\s+([^(]+)\s+\([^)]+\)/gi, '$1');
  clean = clean.replace(/Service Request\s+(\d+)/gi, 'Service Request #$1');
  clean = clean.replace(/\.?\s*Time\s*\(ET\):.*$/gi, '');
  clean = clean.replace(/\s+->\s+/g, ' ➔ ');
  return clean.trim();
};

const AuditHistory = ({ community, user }) => {
  const [logs, setLogs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [viewMode, setViewMode]       = useState('all');

  const role    = user?.role_name || user?.role || '';
  const isAdmin = ['super_admin', 'property_manager', 'board_member'].includes(role);

  useEffect(() => {
    if (community?.community_id || viewMode === 'my') fetchLogs();
  }, [community, viewMode, moduleFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let res;
      if (viewMode === 'my') {
        res = await API.get('/audit/my?limit=50');
      } else {
        const params = new URLSearchParams({ limit: 50 });
        if (community?.community_id) params.append('community_id', community.community_id);
        if (moduleFilter) params.append('module', moduleFilter);
        res = await API.get(`/audit?${params}`);
      }
      setLogs(res.data || []);
    } catch (err) {
      console.error('Audit fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    if (action?.includes('LOGIN'))     return 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20';
    if (action?.includes('CREATE'))    return 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 border border-teal-500/20';
    if (action?.includes('UPDATE') || action?.includes('STATUS')) return 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/20';
    if (action?.includes('DELETE'))    return 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 border border-red-500/20';
    if (action?.includes('FAILED') || action?.includes('LOCKED')) return 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 border border-red-500/20';
    if (action?.includes('DISPUTE'))   return 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border border-orange-500/20';
    if (action?.includes('PAYMENT') || action?.includes('PAY'))  return 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20';
    return 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-gray-400 border border-slate-200/30 dark:border-white/10';
  };

  const getModuleIcon = (module) => {
    const map = {
      auth: '🔐', community: '🏘️', violation: '⚠️',
      service_request: '🔧', amenity: '🏊', vendor: '🛠️',
      user: '👤', news: '📢', payment: '💰'
    };
    return map[module] || '📋';
  };

  const getModuleBadgeColor = (module) => {
    const map = {
      auth: 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20',
      payment: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      violation: 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20',
      amenity: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      service_request: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      vendor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
      news: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20',
      user: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
      community: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
    };
    return map[module] || 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-gray-400 border-slate-200/30 dark:border-white/10';
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const filteredLogs = logs.filter(log => {
    const q = search.toLowerCase();
    return !search ||
      log.action?.toLowerCase().includes(q) ||
      log.description?.toLowerCase().includes(q) ||
      log.user_name?.toLowerCase().includes(q) ||
      log.module?.toLowerCase().includes(q);
  });

  const modules = ['', 'auth', 'community', 'violation', 'service_request', 'amenity', 'vendor', 'user', 'news', 'payment'];

  // Resident view
  if (!isAdmin) {
    return (
      <div className="text-slate-900 dark:text-white">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">My Activity</h1>
            <p className="text-slate-500 dark:text-gray-400 mt-1 text-sm">Your recent actions</p>
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-2xl text-sm font-semibold transition disabled:opacity-60"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">{loading ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
        <AuditCards logs={logs} loading={loading} filteredLogs={filteredLogs}
          getActionColor={getActionColor} getModuleIcon={getModuleIcon}
          getModuleBadgeColor={getModuleBadgeColor} formatDate={formatDate} isAdmin={false} />
      </div>
    );
  }

  return (
    <div className="text-slate-900 dark:text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">Audit History</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1 text-sm">{community?.name}</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-2xl text-sm font-semibold transition disabled:opacity-60"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-5">
        {[
          { id: 'all', label: '📋 All Logs' },
          { id: 'my',  label: '👤 My Activity' },
        ].map(v => (
          <button key={v.id} onClick={() => setViewMode(v.id)}
            className={`px-5 py-2.5 rounded-2xl text-sm font-medium transition ${
              viewMode === v.id
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-500/20'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-gray-400 dark:hover:bg-white/20'
            }`}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-400" />
          <input
            type="text"
            placeholder="Search action, user, description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[#162535] border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-teal-500"
          />
        </div>
        <div className="relative">
          <select
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            className="bg-white dark:bg-[#162535] border border-slate-200 dark:border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 appearance-none cursor-pointer"
          >
            {modules.map(m => (
              <option key={m} value={m} className="text-slate-900 dark:text-white">
                {m ? `${getModuleIcon(m)} ${m}` : 'All Modules'}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={16} />
        </div>
      </div>

      <AuditCards logs={logs} loading={loading} filteredLogs={filteredLogs}
        getActionColor={getActionColor} getModuleIcon={getModuleIcon}
        getModuleBadgeColor={getModuleBadgeColor} formatDate={formatDate} isAdmin={true} />
    </div>
  );
};

// ── Card-based Audit Log List ─────────────────────────────────────────────────
const AuditCards = ({ logs, loading, filteredLogs, getActionColor, getModuleIcon, getModuleBadgeColor, formatDate, isAdmin }) => {
  if (loading && logs.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-16 text-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 dark:text-gray-400 text-sm">Loading audit logs...</p>
      </div>
    );
  }

  if (filteredLogs.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-16 text-center">
        <Shield size={32} className="mx-auto mb-3 opacity-40 text-slate-400" />
        <p className="text-slate-500 dark:text-gray-400 text-sm">No audit logs found.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden">
      {/* List header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Activity Log</h2>
        <span className="text-xs text-slate-500 dark:text-gray-500 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-full">
          {filteredLogs.length} records
        </span>
      </div>

      {/* Cards */}
      <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
        {filteredLogs.map((log, idx) => (
          <div
            key={log.audit_id || idx}
            className="px-4 py-4 sm:px-5 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
          >
            {/* Row 1: Action badge + Module badge + Time */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Action */}
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide uppercase ${getActionColor(log.action)}`}>
                {log.action}
              </span>

              {/* Module */}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getModuleBadgeColor(log.module)}`}>
                {getModuleIcon(log.module)} {log.module || 'system'}
              </span>

              {/* Time — pushed to end */}
              <span className="ml-auto flex items-center gap-1 text-[11px] text-slate-400 dark:text-gray-500 whitespace-nowrap">
                <Clock size={11} />
                {formatDate(log.created_at)}
              </span>
            </div>

            {/* Row 2: Description */}
            {log.description && (
              <p className="mt-2 text-xs text-slate-600 dark:text-gray-300 leading-relaxed line-clamp-2">
                {log.description ? cleanDescription(log.description) : '—'}
              </p>
            )}

            {/* Row 3: User + IP — only shown to admins */}
            {isAdmin && (
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
                {log.user_name && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-gray-400">
                    <User size={11} className="shrink-0" />
                    {log.user_name}
                  </span>
                )}
                {log.ip_address && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-gray-500 font-mono">
                    <Globe size={11} className="shrink-0" />
                    {log.ip_address}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuditHistory;