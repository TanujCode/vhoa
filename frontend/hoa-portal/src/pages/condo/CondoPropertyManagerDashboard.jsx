import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, FileText, CheckCircle2, XCircle, 
  Plus, RefreshCw, Eye, EyeOff, ShieldCheck, Mail, Phone, Home, File,
  Zap, ArrowUpRight, Sparkles, ClipboardCheck, Trash2, Check, MapPin, AlertTriangle, Wrench
} from 'lucide-react';
import API, { getBaseUrl } from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';

export default function CondoPropertyManagerDashboard({ user, setActivePage }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Computed counts from operations lists
  const [membersCount, setMembersCount] = useState(0);
  const [openMaintenance, setOpenMaintenance] = useState(0);
  const [uncollectedParcels, setUncollectedParcels] = useState(0);
  const [activeVisitors, setActiveVisitors] = useState(0);

  // Operational ratios
  const [maintRate, setMaintRate] = useState(100);
  const [parcelRate, setParcelRate] = useState(100);

  // Invite Resident Modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteFirst, setInviteFirst] = useState('');
  const [inviteLast, setInviteLast] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteUnit, setInviteUnit] = useState('');
  const [inviting, setInviting] = useState(false);

  // Todo checklist state
  const [quickTasks, setQuickTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');

  const [confirmConfig, setConfirmConfig] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    confirmText: 'OK', 
    cancelText: 'Cancel', 
    onConfirm: null, 
    onCancel: null, 
    type: 'info', 
    singleButton: false 
  });

  const showAlert = (title, message, type = 'info') => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      confirmText: 'OK',
      singleButton: true,
      type,
      onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  // Review request modal
  const [selectedReq, setSelectedReq] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const commId = user?.community_id;
  const commName = user?.community_name || 'My Building';

  // Initialize and persist Todo Task list for Property Manager
  useEffect(() => {
    if (user?.user_id) {
      const saved = localStorage.getItem(`condo_pm_tasks_${user.user_id}`);
      if (saved) {
        setQuickTasks(JSON.parse(saved));
      } else {
        const defaultTasks = [
          { id: 1, text: "Verify visitor logs for high-rise lobby entry", completed: false },
          { id: 2, text: "Follow up on elevator maintenance ticket", completed: false },
          { id: 3, text: "Post latest meeting minutes in Documents Center", completed: true }
        ];
        setQuickTasks(defaultTasks);
        localStorage.setItem(`condo_pm_tasks_${user.user_id}`, JSON.stringify(defaultTasks));
      }
    }
  }, [user]);

  useEffect(() => {
    if (commId) {
      fetchData();
    } else {
      setLoading(false);
      setError("No building assigned to this manager account. Please onboard a new building or contact Super Admin.");
    }
  }, [commId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch pending requests, members, maintenance, parcels and visitors
      const [requestsRes, membersRes, maintenanceRes, parcelsRes, visitorsRes] = await Promise.all([
        API.get(`/condo/community/${commId}/join-requests/pending`),
        API.get(`/condo/community/${commId}/members`),
        API.get(`/condo/operations/service-request/${commId}?limit=5000`),
        API.get(`/condo/operations/parcels?community_id=${commId}`),
        API.get(`/condo/operations/visitors?community_id=${commId}`)
      ]);

      // Set state values
      const reqList = requestsRes.data || [];
      setRequests(reqList);

      const memList = membersRes.data || [];
      setMembersCount(memList.length);

      const maintList = maintenanceRes.data || [];
      const openM = maintList.filter(m => m.status_name === 'OPEN' || m.status_name === 'APPROVED' || m.status_name === 'IN_PROGRESS' || m.status_name === 'VENDOR_ASSIGNED').length;
      setOpenMaintenance(openM);

      const resolvedM = maintList.filter(m => m.status_name === 'CLOSED' || m.status_name === 'CANCELLED').length;
      const maintPercentage = maintList.length ? Math.round((resolvedM / maintList.length) * 100) : 100;
      setMaintRate(maintPercentage);

      const parcelList = parcelsRes.data || [];
      const uncollectedP = parcelList.filter(p => p.status === 'RECEIVED').length;
      setUncollectedParcels(uncollectedP);

      const collectedP = parcelList.filter(p => p.status === 'COLLECTED').length;
      const parcelPercentage = parcelList.length ? Math.round((collectedP / parcelList.length) * 100) : 100;
      setParcelRate(parcelPercentage);

      const visitorList = visitorsRes.data || [];
      const activeV = visitorList.filter(v => v.status === 'ACTIVE').length;
      setActiveVisitors(activeV);

    } catch (err) {
      console.error("Failed to load Condo PM data:", err);
      setError(err?.response?.data?.detail || "Failed to load community statistics.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (reqId, action) => {
    try {
      setProcessingId(reqId);
      await API.post(`/condo/community/${commId}/join-requests/${reqId}/action`, {
        action: action,
        admin_note: adminNote
      });

      showAlert("Success", `Request successfully ${action === 'APPROVE' ? 'approved' : 'rejected'}!`, "success");
      setRequests(prev => prev.filter(r => r.request_id !== reqId));
      setSelectedReq(null);
      setAdminNote('');
      fetchData(); // reload stats counts
    } catch (err) {
      console.error("Failed to process request:", err);
      showAlert("Error", err.response?.data?.detail || "Failed to process request.", "danger");
    } finally {
      setProcessingId(null);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteFirst.trim() || !inviteLast.trim() || !inviteEmail.trim()) {
      showAlert("Validation Error", "First name, Last name, and Email are required.", "warning");
      return;
    }

    if (inviteFirst.trim().length < 2 || inviteLast.trim().length < 2) {
      showAlert("Validation Error", "Names must be at least 2 characters.", "warning");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim())) {
      showAlert("Validation Error", "Please enter a valid email address.", "warning");
      return;
    }

    if (invitePhone.trim() && invitePhone.trim().length < 8) {
      showAlert("Validation Error", "Please enter a valid phone number.", "warning");
      return;
    }

    try {
      setInviting(true);
      await API.post('/condo/community/invite', {
        first_name: inviteFirst.trim(),
        last_name: inviteLast.trim(),
        email_id: inviteEmail.trim().toLowerCase(),
        mobile_number: invitePhone.trim() || null,
        unit_no: inviteUnit.trim() || null,
        community_id: commId
      });

      showAlert("Success", "Invitation sent successfully! Resident account created.", "success");
      setInviteFirst('');
      setInviteLast('');
      setInviteEmail('');
      setInvitePhone('');
      setInviteUnit('');
      setShowInviteModal(false);
      fetchData(); // Refresh metrics
    } catch (err) {
      console.error("Invite Error:", err);
      showAlert("Error", err.response?.data?.detail || "Failed to send invitation.", "danger");
    } finally {
      setInviting(false);
    }
  };

  // Todo Actions
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask = {
      id: Date.now(),
      text: newTaskText.trim(),
      completed: false
    };
    const updated = [...quickTasks, newTask];
    setQuickTasks(updated);
    if (user?.user_id) {
      localStorage.setItem(`condo_pm_tasks_${user.user_id}`, JSON.stringify(updated));
    }
    setNewTaskText('');
  };

  const handleToggleTask = (taskId) => {
    const updated = quickTasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    setQuickTasks(updated);
    if (user?.user_id) {
      localStorage.setItem(`condo_pm_tasks_${user.user_id}`, JSON.stringify(updated));
    }
  };

  const handleDeleteTask = (taskId) => {
    const updated = quickTasks.filter(t => t.id !== taskId);
    setQuickTasks(updated);
    if (user?.user_id) {
      localStorage.setItem(`condo_pm_tasks_${user.user_id}`, JSON.stringify(updated));
    }
  };

  const getDocUrl = (url) => {
    if (!url) return '#';
    if (url.startsWith('http')) return url;
    return getBaseUrl(url.startsWith('/') ? url : '/' + url);
  };

  return (
    <div className="p-0 space-y-4 max-w-[1600px] mx-auto text-slate-900 dark:text-white font-sans animate-in fade-in duration-200">
      
      {/* ─── Personalized Welcome Banner ─── */}
      <div className="bg-white dark:bg-[#1E2E42] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 sm:p-8 text-slate-800 dark:text-white shadow-sm dark:shadow-none relative overflow-hidden flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.02] rounded-full blur-3xl pointer-events-none" />
        
        {/* Left Welcome details */}
        <div className="flex-1 min-w-0 relative z-10 space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Welcome back, {user?.first_name || 'Manager'}! 
            </h1>
            <p className="text-slate-500 dark:text-gray-455 text-xs mt-1 font-medium flex items-center gap-1">
              <ShieldCheck size={13} className="text-blue-500" /> Building Command Center · Operations Dashboard
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="inline-flex items-center text-[10px] font-bold text-slate-600 dark:text-slate-355 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-xl border border-slate-200/50 dark:border-white/10 font-mono">
              Role: Property Manager
            </span>
            <span className="inline-flex items-center text-[10px] font-black text-indigo-755 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-xl border border-indigo-500/20">
              {commName.toUpperCase()}
            </span>
            {user?.mobile_number && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 dark:text-gray-300 bg-slate-50 dark:bg-white/[0.02] px-2.5 py-1 rounded-xl border border-slate-200/40 dark:border-white/5">
                <Phone size={11} className="text-slate-400" />
                {user.mobile_number}
              </span>
            )}
          </div>
        </div>

        {/* Right stats row */}
        <div className="relative z-10 w-full lg:w-auto mt-5 lg:mt-0 pt-5 lg:pt-0 border-t border-slate-200/60 dark:border-white/5 lg:border-t-0 shrink-0">
          <div className="grid grid-cols-2 sm:flex sm:flex-row sm:items-center sm:justify-around lg:justify-end gap-5 sm:gap-8 lg:gap-11 w-full">
            <div className="text-center flex flex-col items-center min-w-[70px]">
              <p className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">{loading ? '—' : membersCount}</p>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-gray-450 uppercase tracking-widest mt-1">Residents</p>
            </div>
            <div className="text-center flex flex-col items-center min-w-[70px]">
              <p className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-500 font-mono tracking-tight">{loading ? '—' : requests.length}</p>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-gray-455 uppercase tracking-widest mt-1">Pending</p>
            </div>
            <div className="text-center flex flex-col items-center min-w-[70px]">
              <p className="text-3xl sm:text-4xl font-black text-violet-600 dark:text-violet-400 font-mono tracking-tight">{loading ? '—' : openMaintenance}</p>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-gray-455 uppercase tracking-widest mt-1">Repairs</p>
            </div>
            <div className="text-center flex flex-col items-center min-w-[70px]">
              <p className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-450 font-mono tracking-tight">{loading ? '—' : uncollectedParcels}</p>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-gray-455 uppercase tracking-widest mt-1">Parcels</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-455 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchData} className="font-bold underline text-xs cursor-pointer hover:text-rose-550 transition">Retry Loading</button>
        </div>
      )}

      {/* ─── ROW 1: Quick Actions & Operations Monitor ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        
        {/* Left: Quick Actions (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1E2E42] border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/[0.05]">
            <h3 className="font-extrabold text-[11px] text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Zap size={12} className="text-yellow-500" /> Quick Actions
            </h3>
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
            >
              + Invite Resident
            </button>
          </div>
          <div className="p-3 flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { label: 'Residents Directory', desc: 'Active members list', icon: <Users size={20} />, color: 'text-blue-500', bg: 'bg-blue-500/10 dark:bg-blue-500/15', action: () => setActivePage('members') },
                { label: 'Documents Center', desc: 'Bylaws & record logs', icon: <FileText size={20} />, color: 'text-purple-500', bg: 'bg-purple-500/10 dark:bg-purple-500/15', action: () => setActivePage('documents') },
                { label: 'Service Requests', desc: 'Plumbing & repair logs', icon: <Wrench size={20} />, color: 'text-amber-500', bg: 'bg-amber-500/10 dark:bg-amber-500/15', badge: openMaintenance > 0 ? openMaintenance : null, action: () => setActivePage('maintenance') },
                { label: 'Payments Ledger', desc: 'Verify HOA billing', icon: <FileText size={20} />, color: 'text-indigo-500', bg: 'bg-indigo-500/10 dark:bg-indigo-500/15', action: () => setActivePage('payments') },
                { label: 'Parking Allocations', desc: 'Assigned slots & EV', icon: <Home size={20} />, color: 'text-emerald-500', bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', action: () => setActivePage('parking') },
                { label: 'Visitor Passes', desc: 'Guest security codes', icon: <Zap size={20} />, color: 'text-rose-500', bg: 'bg-rose-500/10 dark:bg-rose-500/15', badge: activeVisitors > 0 ? activeVisitors : null, action: () => setActivePage('visitors') },
              ].map((link, idx) => (
                <button
                  key={idx}
                  onClick={link.action}
                  className="group relative p-3.5 rounded-xl border border-slate-200/60 dark:border-white/[0.05] bg-slate-50/60 dark:bg-white/[0.02] hover:border-blue-400/40 dark:hover:border-blue-500/25 hover:shadow-sm text-left transition-all duration-200 hover:scale-[1.02] flex flex-col justify-between h-24 cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] to-indigo-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                  <div className="relative flex items-start justify-between">
                    <div className={`p-2 rounded-lg ${link.bg} ${link.color} transition-transform duration-200 group-hover:scale-110`}>
                      {link.icon}
                    </div>
                    {link.badge ? (
                      <span className="bg-red-505 text-white text-[9px] font-black min-w-[1rem] min-h-[1rem] rounded-full flex items-center justify-center leading-none px-1 shadow-sm">{link.badge}</span>
                    ) : (
                      <ArrowUpRight size={13} className="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 group-hover:text-blue-500 transition-all" />
                    )}
                  </div>
                  <div className="relative">
                    <p className="text-[11px] font-extrabold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">{link.label}</p>
                    <p className="text-[9px] text-slate-400 dark:text-gray-500 mt-0.5">{link.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Operations Monitor (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-white to-slate-50/40 dark:from-[#1E2E42] dark:to-[#162535]/80 border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-500/[0.05] rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-[11px] text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={11} className="text-yellow-500 animate-pulse" /> Operations Monitor
            </h3>
            <span className="text-[9px] font-mono text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" /> Live
            </span>
          </div>

          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {/* 1. Maintenance Requests Resolution Rate */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Service Clear Rate</span>
                <span className="font-bold text-slate-900 dark:text-white">{loading ? '…' : `${maintRate}% Resolved`}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/[0.05] h-2 rounded-full overflow-hidden border border-slate-200/20 dark:border-white/5">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${maintRate}%` }} />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 dark:text-gray-500">
                <span>Open: {loading ? '…' : openMaintenance}</span>
                <span>Target: 95%</span>
              </div>
            </div>

            {/* 2. Parcel Collection Rate */}
            <div className="space-y-1.5 mt-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Mail Pickup Rate</span>
                <span className="font-bold text-slate-900 dark:text-white">{loading ? '…' : `${parcelRate}% Collected`}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/[0.05] h-2 rounded-full overflow-hidden border border-slate-200/20 dark:border-white/5">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${parcelRate}%` }} />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 dark:text-gray-500">
                <span>Unclaimed: {loading ? '…' : uncollectedParcels}</span>
                <span>Collection Cycle: 24h</span>
              </div>
            </div>

            {/* 3. Join Request Queue info */}
            <div className="p-2.5 bg-white/70 dark:bg-white/[0.01] border border-slate-200/40 dark:border-white/[0.03] rounded-xl flex items-center justify-between mt-3">
              <div>
                <span className="text-[9px] font-bold text-slate-450 dark:text-gray-450 tracking-wider mb-1.5 uppercase block">Join requests queue</span>
                <span className="text-xs font-extrabold text-slate-800 dark:text-white">{requests.length} resident requests awaiting review</span>
              </div>
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${requests.length > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-500'}`}>
                {requests.length > 0 ? '️ Review Needed' : ' Clear'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ─── ROW 2: Pending Approvals & Task Planner ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        
        {/* Left: Pending Approvals (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1E2E42] border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="p-4 sm:p-5 border-b border-slate-150 dark:border-white/[0.05] flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Users className="text-blue-500" size={16} /> Pending Resident Join Requests
              </h2>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                Verify identity and address documents submitted by residents.
              </p>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-lg transition"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center min-h-[220px]">
            {loading ? (
              <div className="py-12 text-center text-slate-400 dark:text-gray-500 font-mono text-xs flex flex-col items-center justify-center gap-2 flex-1">
                <RefreshCw size={18} className="animate-spin text-blue-500" />
                <span>Loading requests...</span>
              </div>
            ) : requests.length === 0 ? (
              <div className="py-10 px-6 text-center max-w-sm mx-auto flex flex-col items-center justify-center flex-1">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-3 border border-emerald-500/20">
                  <CheckCircle2 size={24} className="stroke-[2.5]" />
                </div>
                <h4 className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-wider">Queue Clear</h4>
                <p className="text-[10px] text-slate-400 dark:text-gray-400 mt-1 leading-relaxed">
                  All resident join requests for <strong>{commName}</strong> have been reviewed. You're completely caught up!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-250/50 dark:border-white/5">
                      <th className="py-3 px-6">Resident Name</th>
                      <th className="py-3 px-6">Email ID</th>
                      <th className="py-3 px-6">Unit / Apt</th>
                      <th className="py-3 px-6">Documents</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                    {requests.map(r => (
                      <tr key={r.request_id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                        <td className="py-3.5 px-6 font-bold text-slate-950 dark:text-white">
                          {r.full_name}
                        </td>
                        <td className="py-3.5 px-6 text-slate-500 dark:text-gray-405">
                          {r.email_id}
                        </td>
                        <td className="py-3.5 px-6 font-bold text-indigo-600 dark:text-[#5BA4F5]">
                          {r.unit_no || 'N/A'}
                        </td>
                        <td className="py-3.5 px-6 space-x-2">
                          {r.id_proof_url && (
                            <a 
                              href={getDocUrl(r.id_proof_url)} 
                              target="_blank" 
                              rel="noreferrer"
                              className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-455 hover:underline font-bold text-[10px]"
                            >
                              ID Proof 
                            </a>
                          )}
                          {r.address_proof_url && (
                            <a 
                              href={getDocUrl(r.address_proof_url)} 
                              target="_blank" 
                              rel="noreferrer"
                              className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-455 hover:underline font-bold text-[10px]"
                            >
                              Addr Proof 
                            </a>
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            onClick={() => { setSelectedReq(r); setAdminNote(''); }}
                            className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-white/5 dark:hover:bg-white/10 text-indigo-600 dark:text-[#5BA4F5] rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Task Planner (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1E2E42] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="shrink-0">
            <h3 className="font-extrabold text-[11px] text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <ClipboardCheck size={11} className="text-blue-500" /> Manager Task Planner
            </h3>
            <form onSubmit={handleAddTask} className="flex gap-1.5 mb-2.5">
              <input
                type="text"
                placeholder="Add a task or reminder..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 transition"
              />
              <button type="submit" className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition flex items-center justify-center shrink-0 cursor-pointer">
                <Plus size={13} />
              </button>
            </form>
          </div>

          <div className="space-y-1.5 overflow-y-auto flex-1 max-h-[190px] min-h-[140px] pr-0.5">
            {quickTasks.length === 0 ? (
              <p className="text-[10px] text-slate-400 dark:text-gray-500 italic py-3 text-center border border-dashed border-slate-200/50 dark:border-white/5 rounded-xl">No tasks logged yet.</p>
            ) : (
              quickTasks.map(task => (
                <div key={task.id} className="flex gap-2 items-center p-2 bg-slate-50/60 dark:bg-white/[0.01] border border-slate-200/60 dark:border-white/[0.03] rounded-lg hover:border-slate-300 dark:hover:border-white/10 transition group">
                  <button
                    type="button"
                    onClick={() => handleToggleTask(task.id)}
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center cursor-pointer transition shrink-0 ${task.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-white/20 hover:border-blue-500'}`}
                  >
                    {task.completed && <Check size={9} className="stroke-[3]" />}
                  </button>
                  <span className={`text-[10px] flex-1 leading-snug break-all ${task.completed ? 'line-through text-slate-400 dark:text-gray-500' : 'text-slate-700 dark:text-gray-300 font-medium'}`}>
                    {task.text}
                  </span>
                  <button type="button" onClick={() => handleDeleteTask(task.id)} className="p-0.5 text-slate-400 hover:text-rose-500 rounded opacity-0 group-hover:opacity-100 transition cursor-pointer shrink-0">
                    <Trash2 size={11} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Review Request Modal Dialog */}
      {selectedReq && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 relative shadow-2xl text-slate-900 dark:text-white">
            <h3 className="text-base font-bold mb-1 flex items-center gap-2 uppercase tracking-wide">
              <Building2 className="text-blue-500" size={20} />
              Review Join Request
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-4">
              Reviewing submission from <span className="font-bold text-slate-900 dark:text-white">{selectedReq.full_name}</span> for unit <span className="font-bold">{selectedReq.unit_no}</span>.
            </p>

            <div className="space-y-3 mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/20 dark:border-white/5">
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Email Address</p>
                <p className="text-xs font-semibold">{selectedReq.email_id}</p>
              </div>
              <div className="flex gap-4">
                <a href={getDocUrl(selectedReq.id_proof_url)} target="_blank" rel="noreferrer" className="flex-1 p-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-center hover:border-blue-500 transition font-bold text-xs text-blue-650 dark:text-blue-450 shadow-xs">
                  Open ID Proof 
                </a>
                <a href={getDocUrl(selectedReq.address_proof_url)} target="_blank" rel="noreferrer" className="flex-1 p-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-center hover:border-emerald-500 transition font-bold text-xs text-emerald-605 dark:text-emerald-450 shadow-xs">
                  Open Address Proof 
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-450 dark:text-gray-400 tracking-wider mb-1.5 uppercase">Admin Review Notes (Optional)</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="e.g. Verified matched details"
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-950 dark:text-white outline-none focus:border-blue-500 h-20 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedReq(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAction(selectedReq.request_id, 'REJECT')}
                  disabled={processingId === selectedReq.request_id}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition cursor-pointer"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleAction(selectedReq.request_id, 'APPROVE')}
                  disabled={processingId === selectedReq.request_id}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10 transition cursor-pointer"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Resident Modal Dialog */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/20 rounded-3xl max-w-md w-full p-6 relative shadow-2xl text-slate-900 dark:text-white font-sans">
            <button 
              onClick={() => setShowInviteModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              
            </button>
            
            <h3 className="text-lg font-bold mb-1 flex items-center gap-2 uppercase tracking-wide">
              <span></span> Invite Resident
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-5">
              Create a pre-verified resident account and mail their temporary password.
            </p>

            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 mb-2 uppercase">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="John"
                    value={inviteFirst}
                    onChange={(e) => setInviteFirst(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 mb-2 uppercase">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Doe"
                    value={inviteLast}
                    onChange={(e) => setInviteLast(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 mb-2 uppercase">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="john.doe@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 mb-2 uppercase">Unit / Apt No</label>
                  <input
                    type="text"
                    placeholder="e.g. 4B"
                    value={inviteUnit}
                    onChange={(e) => setInviteUnit(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 mb-2 uppercase">Phone Number</label>
                  <input
                    type="text"
                    placeholder="(123) 456-7890"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={inviting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-md disabled:opacity-50 cursor-pointer mt-4"
              >
                {inviting ? "Sending invite..." : "Send Invitation"}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        type={confirmConfig.type}
        singleButton={confirmConfig.singleButton}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
