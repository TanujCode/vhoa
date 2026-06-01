import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, Filter, Shield } from 'lucide-react';
import API from '../services/api';

const cleanDescription = (desc) => {
  if (!desc) return "";
  let clean = desc;
  
  // Simplify "User: Name (ID: ..., Email: ..., Role: ...)" -> "Name"
  clean = clean.replace(/User:\s+([^(]+)\s+\(ID:[^)]+\)/gi, '$1');
  clean = clean.replace(/User:\s+([^(]+)\s+\([^)]+\)/gi, '$1');
  
  // Format "Service Request 15" -> "Service Request #15"
  clean = clean.replace(/Service Request\s+(\d+)/gi, 'Service Request #$1');
  
  // Strip time zone / audit time stamp if any
  clean = clean.replace(/\.?\s*Time\s*\(ET\):.*$/gi, '');
  
  // Nice arrow symbol transition
  clean = clean.replace(/\s+->\s+/g, ' ➔ ');
  
  return clean.trim();
};

const AuditHistory = ({ community, user }) => {
  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [viewMode, setViewMode]   = useState('all'); // 'all' | 'my'

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
    if (action?.includes('LOGIN'))     return 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400';
    if (action?.includes('CREATE'))    return 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400';
    if (action?.includes('UPDATE') || action?.includes('STATUS')) return 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300';
    if (action?.includes('DELETE'))    return 'bg-red-500/10 text-red-600 dark:bg-[#3B1C1C] dark:text-red-400';
    if (action?.includes('FAILED') || action?.includes('LOCKED')) return 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400';
    if (action?.includes('DISPUTE'))   return 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400';
    return 'bg-slate-100 text-slate-600 dark:bg-gray-500/20 dark:text-gray-400';
  };

  const getModuleIcon = (module) => {
    const map = { auth: '🔐', community: '🏘️', violation: '⚠️', service_request: '🔧', amenity: '🏊', vendor: '🛠️', user: '👤', news: '📢', payment: '💰' };
    return map[module] || '📋';
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filteredLogs = logs.filter(log => {
    const q = search.toLowerCase();
    return !search ||
      log.action?.toLowerCase().includes(q) ||
      log.description?.toLowerCase().includes(q) ||
      log.user_name?.toLowerCase().includes(q) ||
      log.module?.toLowerCase().includes(q);
  });

  const modules = ['', 'auth', 'community', 'violation', 'service_request', 'amenity', 'vendor', 'user', 'news'];

  // Resident → sirf apna log
  if (!isAdmin) {
    return (
      <div className="text-slate-900 dark:text-white">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">My Activity</h1>
          <p className="text-slate-505 dark:text-gray-400 mt-1">Your recent actions</p>
        </div>
        <AuditTable logs={logs} loading={loading} search={search} setSearch={setSearch}
          filteredLogs={filteredLogs} getActionColor={getActionColor} getModuleIcon={getModuleIcon} formatDate={formatDate} isAdmin={false} />
      </div>
    );
  }

  return (
    <div className="text-slate-900 dark:text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Audit History</h1>
          <p className="text-slate-505 dark:text-gray-400 mt-1">{community?.name}</p>
        </div>
        <button 
          onClick={fetchLogs}
          disabled={loading}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-2xl text-sm font-semibold transition flex items-center gap-2 disabled:opacity-60"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'all', label: '📋 All Logs' },
          { id: 'my',  label: '👤 My Activity' },
        ].map(v => (
          <button key={v.id} onClick={() => setViewMode(v.id)}
            className={`px-5 py-2.5 rounded-2xl text-sm font-medium transition ${
              viewMode === v.id ? 'bg-teal-600 text-white' : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-gray-400 dark:hover:bg-white/20'
            }`}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400 dark:text-gray-400" />
          <input type="text" placeholder="Search action, user, description..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[#162535] border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-505 focus:outline-none focus:border-teal-500" />
        </div>
        <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}
          className="bg-slate-50 dark:bg-[#162535] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer">
          {modules.map(m => <option key={m} value={m} className="text-slate-900 dark:text-white">{m ? `${getModuleIcon(m)} ${m}` : 'All Modules'}</option>)}
        </select>
      </div>

      <AuditTable logs={logs} loading={loading} search={search} setSearch={setSearch}
        filteredLogs={filteredLogs} getActionColor={getActionColor} getModuleIcon={getModuleIcon} formatDate={formatDate} isAdmin={true} />
    </div>
  );
};

// ── Audit Table Component ─────────────────────
const AuditTable = ({ logs, loading, filteredLogs, getActionColor, getModuleIcon, formatDate, isAdmin }) => (
  <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden text-slate-900 dark:text-white">
    <div className="p-5 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
      <h2 className="font-semibold text-slate-900 dark:text-white">Activity Log</h2>
      <span className="text-xs text-slate-550 dark:text-gray-505">{filteredLogs.length} records</span>
    </div>

    {loading && logs.length === 0 ? (
      <div className="p-16 text-center text-slate-500 dark:text-gray-400">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        Loading audit logs...
      </div>
    ) : filteredLogs.length === 0 ? (
      <div className="p-16 text-center text-slate-500 dark:text-gray-400">
        <Shield size={32} className="mx-auto mb-3 opacity-50" />
        No audit logs found.
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 text-xs uppercase tracking-wider">
              <th className="text-left p-5">Action</th>
              <th className="text-left p-5">Module</th>
              <th className="text-left p-5">Description</th>
              {isAdmin && <th className="text-left p-5">User</th>}
              <th className="text-left p-5">IP</th>
              <th className="text-left p-5">Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <tr key={log.audit_id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition">
                <td className="p-5">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getActionColor(log.action)}`}>
                    {log.action}
                  </span>
                </td>
                <td className="p-5 text-slate-500 dark:text-gray-400 text-xs">
                  {getModuleIcon(log.module)} {log.module}
                </td>
                <td className="p-5 text-slate-700 dark:text-gray-300 text-xs max-w-xs truncate">
                  {log.description ? cleanDescription(log.description) : '—'}
                </td>
                {isAdmin && (
                  <td className="p-5 text-slate-500 dark:text-gray-400 text-xs whitespace-nowrap">
                    {log.user_name || `User #${log.user_id}` || '—'}
                  </td>
                )}
                <td className="p-5 text-slate-400 dark:text-gray-505 text-xs font-mono">
                  {log.ip_address || '—'}
                </td>
                <td className="p-5 text-slate-500 dark:text-gray-400 text-xs whitespace-nowrap">
                  {formatDate(log.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default AuditHistory;