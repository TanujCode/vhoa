import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Search, Shield, Layers, User, Globe,
  Lock, Building2, AlertTriangle, Wrench, Calendar,
  Briefcase, Megaphone, CreditCard, FileText, ChevronDown, Clock
} from 'lucide-react';
import API from '../services/api';

/* ── helpers ─────────────────────────────────────────────── */
const cleanDescription = (desc) => {
  if (!desc) return '';
  return desc
    .replace(/User:\s+([^(]+)\s+\(ID:[^)]+\)/gi, '$1')
    .replace(/User:\s+([^(]+)\s+\([^)]+\)/gi, '$1')
    .replace(/Service Request\s+(\d+)/gi, 'Service Request #$1')
    .replace(/\.?\s*Time\s*\(ET\):.*$/gi, '')
    .replace(/\s+->\s+/g, '  ')
    .trim();
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d} day${d === 1 ? '' : 's'} ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/* icon + color maps */
const MODULE_META = {
  auth:            { icon: Lock,          bg: 'bg-blue-100   dark:bg-blue-900/30',    text: 'text-blue-600   dark:text-blue-400' },
  community:       { icon: Building2,     bg: 'bg-sky-100    dark:bg-sky-900/30',     text: 'text-sky-600    dark:text-sky-400' },
  violation:       { icon: AlertTriangle, bg: 'bg-red-100    dark:bg-red-900/30',     text: 'text-red-600    dark:text-red-400' },
  service_request: { icon: Wrench,        bg: 'bg-amber-100  dark:bg-amber-900/30',   text: 'text-amber-600  dark:text-amber-400' },
  amenity:         { icon: Calendar,      bg: 'bg-indigo-100 dark:bg-indigo-900/30',  text: 'text-indigo-600 dark:text-indigo-400' },
  vendor:          { icon: Briefcase,     bg: 'bg-violet-100 dark:bg-violet-900/30',  text: 'text-violet-600 dark:text-violet-400' },
  user:            { icon: User,          bg: 'bg-cyan-100   dark:bg-cyan-900/30',    text: 'text-cyan-600   dark:text-cyan-400' },
  news:            { icon: Megaphone,     bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',text: 'text-fuchsia-600 dark:text-fuchsia-400' },
  payment:         { icon: CreditCard,    bg: 'bg-emerald-100 dark:bg-emerald-900/30',text: 'text-emerald-600 dark:text-emerald-400' },
};
const DEFAULT_META = { icon: FileText, bg: 'bg-slate-100 dark:bg-white/10', text: 'text-slate-500 dark:text-slate-400' };

const getModuleMeta = (module) => MODULE_META[module] || DEFAULT_META;

const getActionBadge = (action) => {
  if (!action) return 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400';
  if (action.includes('DELETE') || action.includes('FAILED') || action.includes('LOCKED'))
    return 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400';
  if (action.includes('UPDATE') || action.includes('STATUS'))
    return 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400';
  if (action.includes('PAYMENT') || action.includes('PAY'))
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400';
  if (action.includes('CREATE') || action.includes('LOGIN'))
    return 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400';
  return 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400';
};

const MODULES = ['', 'auth', 'community', 'violation', 'service_request', 'amenity', 'vendor', 'user', 'news', 'payment'];
const labelOf = (m) => m ? m.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') : 'All Modules';

/* ═══════════════════════════════════════════════════════════ */
const AuditHistory = ({ community, user }) => {
  const role    = user?.role_name || user?.role || '';
  const isAdmin = ['super_admin', 'property_manager', 'board_member'].includes(role);

  const [logs,         setLogs]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [memberFilter, setMemberFilter] = useState('');
  const [viewMode,     setViewMode]     = useState(isAdmin ? 'all' : 'my');
  const [moduleOpen,   setModuleOpen]   = useState(false);
  const [memberOpen,   setMemberOpen]   = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      let res;
      if (viewMode === 'my' || !isAdmin) {
        res = await API.get('/audit/my?limit=100');
      } else {
        const params = new URLSearchParams({ limit: 100 });
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
  }, [viewMode, community, moduleFilter, isAdmin]);

  useEffect(() => {
    if (community?.community_id || viewMode === 'my') fetchLogs();
  }, [fetchLogs]);

  /* close dropdowns on outside click */
  useEffect(() => {
    const handler = () => { setModuleOpen(false); setMemberOpen(false); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  /* unique member names for filter */
  const members = [...new Set(logs.map(l => l.user_name).filter(Boolean))];

  const filtered = logs.filter(log => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      log.action?.toLowerCase().includes(q) ||
      log.description?.toLowerCase().includes(q) ||
      log.user_name?.toLowerCase().includes(q) ||
      log.module?.toLowerCase().includes(q);
    const matchMember = !memberFilter || log.user_name === memberFilter;
    return matchSearch && matchMember;
  });

  return (
    <div className="text-slate-900 dark:text-white">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Audit History</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Track all activity and changes across your community</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 text-xs font-semibold">
              {[{ id: 'all', label: 'All Logs', icon: Layers }, { id: 'my', label: 'My Activity', icon: User }].map(v => (
                <button
                  key={v.id}
                  onClick={() => setViewMode(v.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 transition-colors cursor-pointer ${
                    viewMode === v.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10'
                  }`}
                >
                  <v.icon size={13} /> {v.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Search + Filters ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search activities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 bg-white dark:bg-[#162535] border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Module Filter */}
        <div className="relative" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => { setModuleOpen(o => !o); setMemberOpen(false); }}
            className="h-10 flex items-center gap-2 px-4 bg-white dark:bg-[#162535] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition cursor-pointer min-w-[150px] justify-between"
          >
            <span>{labelOf(moduleFilter)}</span>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${moduleOpen ? 'rotate-180' : ''}`} />
          </button>
          {moduleOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-[#1a2736] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-30 overflow-hidden py-1">
              {MODULES.map(m => (
                <button
                  key={m}
                  onClick={() => { setModuleFilter(m); setModuleOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm transition cursor-pointer ${
                    moduleFilter === m
                      ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  {labelOf(m)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Member Filter — admin only */}
        {isAdmin && (
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => { setMemberOpen(o => !o); setModuleOpen(false); }}
              className="h-10 flex items-center gap-2 px-4 bg-white dark:bg-[#162535] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition cursor-pointer min-w-[150px] justify-between"
            >
              <span>{memberFilter || 'All Members'}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${memberOpen ? 'rotate-180' : ''}`} />
            </button>
            {memberOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-[#1a2736] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-30 overflow-hidden py-1 max-h-60 overflow-y-auto">
                <button
                  onClick={() => { setMemberFilter(''); setMemberOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm transition cursor-pointer ${
                    !memberFilter
                      ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  All Members
                </button>
                {members.map(m => (
                  <button
                    key={m}
                    onClick={() => { setMemberFilter(m); setMemberOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm transition cursor-pointer ${
                      memberFilter === m
                        ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Log List ─────────────────────────────────────────── */}
      <AuditList
        logs={logs}
        filtered={filtered}
        loading={loading}
        isAdmin={isAdmin}
      />
    </div>
  );
};

/* ── Activity List ──────────────────────────────────────────── */
const AuditList = ({ logs, filtered, loading, isAdmin }) => {
  if (loading && logs.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1a2736] border border-slate-200 dark:border-white/10 rounded-2xl p-16 text-center">
        <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading activities...</p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1a2736] border border-slate-200 dark:border-white/10 rounded-2xl p-16 text-center">
        <Shield size={28} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No activities found</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1a2736] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
      {/* list header */}
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.05] flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Activity</span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 px-2.5 py-1 rounded-full font-medium">
          {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
        </span>
      </div>

      {/* rows */}
      <div className="divide-y divide-slate-50 dark:divide-white/[0.04]">
        {filtered.map((log, idx) => {
          const meta      = getModuleMeta(log.module);
          const IconComp  = meta.icon;
          const actionCls = getActionBadge(log.action);
          const actionLabel = log.action?.replace(/_/g, ' ') || 'ACTION';
          const title = log.action
            ? log.action.split('_').map(w => w[0] + w.slice(1).toLowerCase()).join(' ')
            : 'System Event';

          return (
            <div
              key={log.audit_id || idx}
              className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
            >
              {/* Icon Avatar */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${meta.bg}`}>
                <IconComp size={15} className={meta.text} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-white leading-snug">{title}</p>
                {log.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {cleanDescription(log.description)}
                  </p>
                )}
                {isAdmin && log.user_name && (
                  <div className="flex items-center gap-1 mt-1">
                    <User size={10} className="text-slate-400 dark:text-slate-500" />
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">{log.user_name}</span>
                    {log.ip_address && (
                      <>
                        <span className="text-slate-300 dark:text-slate-600 mx-1">·</span>
                        <Globe size={10} className="text-slate-400 dark:text-slate-500" />
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{log.ip_address}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Right: action tag + time */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-md ${actionCls}`}>
                  {actionLabel}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                  <Clock size={10} />
                  {timeAgo(log.created_at)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AuditHistory;