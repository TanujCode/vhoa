import React, { useState, useEffect } from 'react';
import {
  Users, AlertTriangle, Wrench, DollarSign,
  Calendar, TrendingUp, RefreshCw, UserPlus,
  Clock, CheckCircle, XCircle, Building2, Download,
  ShieldAlert, Settings2, Wallet, Truck, Megaphone, Plus, Trash2,
  Check, X
} from 'lucide-react';
import API, { getBaseUrl } from "../services/api";

// ── Stat Card (Premium) ─────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, sub, subColor, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 transition-all duration-300 hover:border-slate-200 dark:hover:border-white/20 hover:-translate-y-1 shadow-sm dark:shadow-none ${onClick ? 'cursor-pointer hover:border-teal-500/40 dark:hover:border-teal-400/40' : ''}`}
  >
    <div className="flex items-center justify-between mb-3">
      <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">{label}</p>
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${color} shadow-inner`}>
        <Icon size={18} className="text-white" />
      </div>
    </div>
    <p className={`text-4xl font-mono font-bold mt-1 ${subColor || 'text-slate-900 dark:text-white'}`}>
      {value ?? '—'}
    </p>
    {sub && <p className="text-xs text-slate-400 dark:text-gray-500 mt-2 font-sans">{sub}</p>}
  </div>
);

// ── Activity Item ─────────────────────────────
const ActivityItem = ({ icon: Icon, color, title, time, status }) => (
  <div className="flex items-center gap-3 py-3.5 border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/[0.01] px-2 rounded-xl transition duration-150">
    <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={16} className="text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{title}</p>
      <span className="text-[10px] text-slate-400 dark:text-gray-500 uppercase tracking-wider">{time}</span>
    </div>
    {status && (
      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
        status === 'OPEN' || status === 'PENDING' ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300' :
        status === 'RESOLVED' || status === 'APPROVED' || status === 'CLOSED' ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300' :
        'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300'
      }`}>
        {status}
      </span>
    )}
  </div>
);

// ── Property Manager Dashboard ────────────────────────────
const PropertyManagerDashboard = ({ community, user, setActivePage }) => {
  const [stats, setStats]           = useState(null);
  const [violations, setViolations] = useState([]);
  const [requests, setRequests]     = useState([]);
  const [vendors, setVendors]       = useState([]);
  const [loading, setLoading]       = useState(true);

  // Resident Join Requests State
  const [joinRequests, setJoinRequests] = useState([]);
  const [loadingJoinRequests, setLoadingJoinRequests] = useState(true);
  const [actionId, setActionId] = useState(null);

  // PM Checklist State
  const [newTaskText, setNewTaskText] = useState("");
  const [tasks, setTasks] = useState(() => {
    if (community?.community_id) {
      const saved = localStorage.getItem(`tasks_pm_${community.community_id}`);
      return saved ? JSON.parse(saved) : [
        { id: 1, text: "Review pending member registrations", completed: false },
        { id: 2, text: "Check open violations for units", completed: false },
        { id: 3, text: "Audit service request log", completed: true }
      ];
    }
    return [];
  });

  useEffect(() => {
    if (community?.community_id) {
      fetchDashboardData(community.community_id);
      const saved = localStorage.getItem(`tasks_pm_${community.community_id}`);
      if (saved) {
        setTasks(JSON.parse(saved));
      } else {
        setTasks([
          { id: 1, text: "Review pending member registrations", completed: false },
          { id: 2, text: "Check open violations for units", completed: false },
          { id: 3, text: "Audit service request log", completed: true }
        ]);
      }
    }
  }, [community]);

  useEffect(() => {
    if (community?.community_id) {
      localStorage.setItem(`tasks_pm_${community.community_id}`, JSON.stringify(tasks));
    }
  }, [tasks, community]);

  const fetchDashboardData = async (communityId) => {
    try {
      setLoading(true);
      setLoadingJoinRequests(true);
      const [statsRes, violationsRes, requestsRes, vendorsRes, joinReqsRes] = await Promise.allSettled([
        API.get(`/community/${communityId}/stats`),
        API.get(`/violation/${communityId}?limit=5`),
        API.get(`/service-request/${communityId}?limit=5`),
        API.get(`/vendor/${communityId}?limit=5`),
        API.get(`/community/${communityId}/join-requests/pending`),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (violationsRes.status === 'fulfilled') setViolations(violationsRes.value.data);
      if (requestsRes.status === 'fulfilled') setRequests(requestsRes.value.data);
      if (vendorsRes.status === 'fulfilled') setVendors(vendorsRes.value.data);
      if (joinReqsRes.status === 'fulfilled') setJoinRequests(joinReqsRes.value.data || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setLoadingJoinRequests(false);
    }
  };

  const handleRequestAction = async (requestId, actionType) => {
    try {
      setActionId(requestId);
      const commId = community?.community_id || community?.id;
      await API.post(`/community/${commId}/join-requests/${requestId}/action`, {
        action: actionType
      });
      const updated = joinRequests.filter(r => r.request_id !== requestId);
      setJoinRequests(updated);
      fetchDashboardData(commId);
    } catch (err) {
      alert(`Failed to execute ${actionType.toLowerCase()} action. Please retry.`);
    } finally {
      setActionId(null);
    }
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask = {
      id: Date.now(),
      text: newTaskText.trim(),
      completed: false
    };
    setTasks([...tasks, newTask]);
    setNewTaskText("");
  };

  const toggleTask = (taskId) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  if (!community) {
    return <div className="text-center py-20 text-gray-400">No community assigned.</div>;
  }

  // Occupancy metrics calculations
  const occupiedUnits = stats?.occupied_units ?? stats?.total_residents ?? community.total_owners ?? 0;
  const totalOwners = stats?.total_residents ?? community.total_owners ?? 0;
  const communitySize = community.community_size ?? 1; // avoid division by 0
  const occupancyPercent = Math.min(100, Math.round((occupiedUnits / communitySize) * 100));

  // Determine progress color
  const getProgressColor = (pct) => {
    if (pct < 70) return "bg-emerald-500";
    if (pct < 90) return "bg-amber-500";
    return "bg-red-500";
  };

  const quickActions = [
    { label: "Log Violation", icon: ShieldAlert, page: "violations", color: "bg-red-500/5 dark:bg-red-500/10 hover:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/10 dark:border-red-500/20" },
    { label: "Post Announcement", icon: Megaphone, page: "news", color: "bg-teal-500/5 dark:bg-teal-500/10 hover:bg-teal-500/10 dark:hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/10 dark:border-teal-500/20" },
    { label: "New Request", icon: Wrench, page: "servicereq", color: "bg-blue-500/5 dark:bg-blue-500/10 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/10 dark:border-blue-500/20" },
    { label: "Manage Members", icon: Users, page: "members", color: "bg-purple-500/5 dark:bg-purple-500/10 hover:bg-purple-500/10 dark:hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/10 dark:border-purple-500/20" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Property Manager Portal</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1">{community.name} • Overview of your managed community</p>
        </div>
        <button
          onClick={() => fetchDashboardData(community.community_id)}
          disabled={loading}
          className="px-5 py-2.5 bg-slate-200/60 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-2xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 border border-slate-300 dark:border-white/5 active:scale-95 disabled:opacity-60"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh Data
        </button>
      </div>

      {/* Community Banner & Occupancy Cap Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6 shadow-sm dark:shadow-none">
          <div className="w-16 h-16 bg-[#1D9E75]/20 text-[#25C490] rounded-2xl flex items-center justify-center flex-shrink-0 border border-[#1D9E75]/30">
            <Building2 size={32} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-[#25C490] uppercase tracking-widest bg-emerald-500/10 dark:bg-[#25C490]/10 px-3 py-1 rounded-full border border-emerald-500/20 dark:border-[#25C490]/20">Active HOA License</span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-3">{community.name}</h2>
            <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">
              {community.address?.address}, {community.address?.city}
            </p>
            <div className="mt-3 text-xs text-slate-500 dark:text-gray-500 font-mono">
              HOA CODE: <span className="text-slate-900 dark:text-white bg-slate-200 dark:bg-white/5 px-2 py-0.5 rounded font-bold">{community.community_code}</span>
            </div>
          </div>
        </div>

        {/* Occupancy Card */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 flex flex-col justify-between shadow-sm dark:shadow-none">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-500 dark:text-gray-400">Community Occupancy</span>
              <span className="text-xs text-slate-400 dark:text-gray-500 font-mono">{occupiedUnits} / {communitySize} Units</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-3 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${getProgressColor(occupancyPercent)}`} style={{ width: `${occupancyPercent}%` }}></div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{occupancyPercent}%</span>
            <span className="text-xs text-slate-500 dark:text-gray-400 font-sans">
              {communitySize - occupiedUnits} Free slots remaining
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Registered Members" value={totalOwners} icon={Users} color="bg-teal-600" subColor="text-teal-600 dark:text-teal-400" sub="Active Homeowners" onClick={() => setActivePage?.('members')} />
        <StatCard label="Open Violations" value={stats?.active_violations ?? 0} icon={ShieldAlert} color="bg-red-600" subColor="text-red-600 dark:text-red-400" sub="Require compliance tracking" onClick={() => setActivePage?.('violations')} />
        <StatCard label="Service Requests" value={stats?.open_requests ?? 0} icon={Wrench} color="bg-blue-600" subColor="text-blue-600 dark:text-blue-400" sub="Awaiting technician routing" onClick={() => setActivePage?.('servicereq')} />
        <StatCard label="Active Vendors" value={vendors.length} icon={Truck} color="bg-purple-600" subColor="text-purple-600 dark:text-purple-400" sub="Contractors on file" onClick={() => setActivePage?.('vendors')} />
      </div>

      {/* Quick Action & PM Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Actions Panel */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 flex flex-col shadow-sm dark:shadow-none">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Shortcuts</h3>
          <div className="grid grid-cols-1 gap-3 flex-1">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <button
                  key={idx}
                  onClick={() => setActivePage(action.page)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition duration-200 ${action.color} font-medium text-sm text-left active:scale-98`}
                >
                  <Icon size={18} />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* To-Do Checklist Widget */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm dark:shadow-none flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Daily PM Checklist</h3>
            <span className="text-xs text-slate-400 dark:text-gray-500 font-mono">{tasks.filter(t => t.completed).length}/{tasks.length} Completed</span>
          </div>

          {/* Add Task Form */}
          <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Add temporary operational task..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#1D9E75] placeholder-slate-400 dark:placeholder-gray-500"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-[#1D9E75] hover:bg-[#15805d] rounded-xl text-white text-sm font-semibold transition"
            >
              <Plus size={18} />
            </button>
          </form>

          {/* Task List */}
          <div className="space-y-2 flex-1 max-h-[220px] overflow-y-auto custom-scrollbar">
            {tasks.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-gray-500 py-6 text-center italic">No tasks listed for today.</p>
            ) : (
              tasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 p-3 rounded-xl hover:bg-slate-100/50 dark:hover:bg-white/[0.04] transition group"
                >
                  <label className="flex items-center gap-3 cursor-pointer flex-1 select-none">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      className="rounded border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#162535] text-[#1D9E75] focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <span className={`text-sm text-slate-700 dark:text-gray-300 font-sans transition-all duration-150 ${task.completed ? 'line-through text-slate-400 dark:text-gray-500' : ''}`}>
                      {task.text}
                    </span>
                  </label>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Violations */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-white/5 pb-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Compliance Issues</h3>
            <button onClick={() => setActivePage('violations')} className="text-xs text-teal-600 dark:text-[#25C490] hover:underline">View All</button>
          </div>
          {violations.length === 0 ? (
            <p className="text-slate-500 dark:text-gray-400 py-10 text-center text-sm">No recent violations recorded</p>
          ) : (
            <div className="space-y-1">
              {violations.slice(0, 4).map(v => (
                <ActivityItem
                  key={v.violation_id}
                  icon={ShieldAlert}
                  color="bg-red-500"
                  title={`${v.violation_type_name} - Unit ${v.unit_no || 'N/A'}`}
                  time={new Date(v.created_date || Date.now()).toLocaleDateString()}
                  status={v.violation_status}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent Service Requests */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-white/5 pb-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Service Requests</h3>
            <button onClick={() => setActivePage('servicereq')} className="text-xs text-teal-600 dark:text-[#25C490] hover:underline">View All</button>
          </div>
          {requests.length === 0 ? (
            <p className="text-slate-500 dark:text-gray-400 py-10 text-center text-sm">No pending requests logged</p>
          ) : (
            <div className="space-y-1">
              {requests.slice(0, 4).map(r => (
                <ActivityItem
                  key={r.request_id}
                  icon={Wrench}
                  color="bg-blue-500"
                  title={r.title}
                  time={new Date(r.created_date || Date.now()).toLocaleDateString()}
                  status={r.status_name}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resident Join Requests */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-teal-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Resident Join Requests</h2>
          </div>
          <span className="px-2.5 py-1 text-xs font-mono font-bold bg-amber-500/10 text-amber-500 rounded-full">
            {joinRequests.length} Pending
          </span>
        </div>

        {loadingJoinRequests ? (
          <div className="p-10 text-center text-gray-500 dark:text-gray-400 font-mono text-xs">
            Fetching active approval pool records...
          </div>
        ) : joinRequests.length === 0 ? (
          <div className="p-10 text-center text-gray-500 dark:text-gray-400">
            <p className="text-sm">No pending resident requests found for this community.</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Everything is cleared up! 👍</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0d1622] text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/10">
                  <th className="p-4">Resident Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Unit / Block</th>
                  <th className="p-4">Requested Date</th>
                  <th className="p-4">Verification Docs</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/10 text-sm">
                {joinRequests.map((req) => (
                  <tr key={req.request_id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium text-gray-950 dark:text-white">{req.full_name}</td>
                    <td className="p-4 text-gray-500 dark:text-gray-400">{req.email_id || req.email}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">
                        Unit {req.unit_no || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-gray-400 font-mono">
                      {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {req.id_proof_url ? (
                          <a
                            href={getBaseUrl(req.id_proof_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 text-xs font-semibold bg-blue-500/10 hover:bg-blue-500 text-blue-600 hover:text-white rounded-xl border border-blue-500/20 transition-all"
                          >
                            ID Proof
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400 font-mono">No ID</span>
                        )}
                        {req.address_proof_url ? (
                          <a
                            href={getBaseUrl(req.address_proof_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 text-xs font-semibold bg-purple-500/10 hover:bg-purple-500 text-purple-600 hover:text-white rounded-xl border border-purple-500/20 transition-all"
                          >
                            Address Proof
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400 font-mono">No Address</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          disabled={actionId !== null}
                          onClick={() => handleRequestAction(req.request_id, 'APPROVE')}
                          className="flex items-center justify-center p-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-lg transition-all disabled:opacity-50"
                          title="Approve Resident"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          disabled={actionId !== null}
                          onClick={() => handleRequestAction(req.request_id, 'REJECT')}
                          className="flex items-center justify-center p-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all disabled:opacity-50"
                          title="Reject Request"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyManagerDashboard;