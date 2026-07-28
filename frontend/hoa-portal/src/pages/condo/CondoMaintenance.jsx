import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  RefreshCw, Search, Plus, Wrench, ChevronDown, Check, X,
  Clock, AlertTriangle, CheckCircle, ChevronUp, Tag, ShieldAlert, AlertCircle
} from 'lucide-react';
import API from '../../services/api';

export default function CondoMaintenance({ community, user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'
  const [expandedRequestId, setExpandedRequestId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('OTHER');
  const [priority, setPriority] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);

  const role = (user?.role_name || user?.role || '').toLowerCase();
  const canManage = ['super_admin', 'property_manager', 'board_member'].includes(role);
  const commId = community?.community_id;

  const categories = ["ELEVATOR", "PLUMBING", "ELECTRICAL", "LOBBY", "ROOFING", "PARKING", "OTHER"];
  const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

  useEffect(() => {
    if (commId) {
      fetchRequests();
    }
  }, [commId]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await API.get(`/condo/operations/maintenance?community_id=${commId}`);
      setRequests(res.data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load maintenance requests.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !desc.trim()) return setErrorMsg('Title and Description are required');

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      await API.post('/condo/operations/maintenance', {
        community_id: commId,
        title: title.trim(),
        description: desc.trim(),
        category,
        priority
      });

      setSuccessMsg("Maintenance request created successfully!");
      setTitle('');
      setDesc('');
      setShowAddModal(false);
      fetchRequests();
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to create maintenance request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (reqId, nextStatus) => {
    try {
      await API.put(`/condo/operations/maintenance/${reqId}/status`, { status: nextStatus });
      setSuccessMsg(`Request status updated to ${nextStatus.replace('_', ' ')}!`);
      fetchRequests();
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to update status.");
    }
  };

  const toggleExpand = (id) => {
    setExpandedRequestId(expandedRequestId === id ? null : id);
  };

  // Helper counts for stats
  const totalCount = requests.length;
  const openCount = requests.filter(r => r.status === 'OPEN').length;
  const progressCount = requests.filter(r => r.status === 'IN_PROGRESS').length;
  const resolvedCount = requests.filter(r => r.status === 'RESOLVED' || r.status === 'CLOSED').length;

  const getPriorityBadgeClass = (p) => {
    switch (p) {
      case 'URGENT': 
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
      case 'HIGH': 
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'MEDIUM': 
        return 'bg-blue-500/10 text-blue-600 dark:text-[#818CF8] border border-blue-500/20';
      default: 
        return 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5';
    }
  };

  const getStatusDetails = (s) => {
    switch (s) {
      case 'RESOLVED':
      case 'CLOSED':
        return {
          label: 'RESOLVED',
          bg: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-500/20',
          dot: 'bg-emerald-500'
        };
      case 'IN_PROGRESS':
        return {
          label: 'IN PROGRESS',
          bg: 'bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/15 dark:text-[#818CF8] border border-indigo-500/20',
          dot: 'bg-indigo-500'
        };
      default:
        return {
          label: 'OPEN',
          bg: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-550/20',
          dot: 'bg-amber-500'
        };
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat?.toUpperCase()) {
      case 'ELEVATOR': return '🛗';
      case 'PLUMBING': return '🚰';
      case 'ELECTRICAL': return '⚡';
      case 'LOBBY': return '🛋️';
      case 'ROOFING': return '🏠';
      case 'PARKING': return '🅿️';
      default: return '🔧';
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesSearch = 
      r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'ALL') return matchesSearch;
    if (activeTab === 'RESOLVED') return matchesSearch && (r.status === 'RESOLVED' || r.status === 'CLOSED');
    return matchesSearch && r.status === activeTab;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-white font-sans p-2 animate-fade-in-up">
      


      {/* Alert Banner */}
      {(errorMsg || successMsg) && (
        <div className="space-y-2 animate-fade-in-scale">
          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-455 text-xs rounded-xl flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-455 text-xs rounded-xl flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {successMsg}
            </div>
          )}
        </div>
      )}

      {/* Modern Stats Deck */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-slate-50/60 dark:bg-[#1E2E42]/30 border border-slate-200/60 dark:border-white/5 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-550 dark:text-slate-400">
            <Wrench size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Logged</p>
            <h4 className="text-base font-black">{totalCount}</h4>
          </div>
        </div>
        {/* Open */}
        <div className="bg-amber-500/5 dark:bg-amber-500/[0.02] border border-amber-500/10 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest">Open</p>
            <h4 className="text-base font-black text-amber-600 dark:text-amber-400">{openCount}</h4>
          </div>
        </div>
        {/* In Progress */}
        <div className="bg-indigo-500/5 dark:bg-indigo-500/[0.02] border border-indigo-500/10 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-indigo-500/60 uppercase tracking-widest">In Progress</p>
            <h4 className="text-base font-black text-indigo-600 dark:text-[#818CF8]">{progressCount}</h4>
          </div>
        </div>
        {/* Resolved */}
        <div className="bg-emerald-500/5 dark:bg-emerald-500/[0.02] border border-emerald-500/10 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest">Resolved</p>
            <h4 className="text-base font-black text-emerald-600 dark:text-emerald-400">{resolvedCount}</h4>
          </div>
        </div>
      </div>

      {/* Filters & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-50/50 dark:bg-[#1E2E42]/20 p-4 rounded-2xl border border-slate-200/60 dark:border-white/5">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="Search request issues..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-450 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 transition-all shadow-xs"
            />
          </div>

          {/* Tab Filters */}
          <div className="flex items-center gap-1 bg-white dark:bg-[#1E2E42]/30 p-1 rounded-xl border border-slate-200/60 dark:border-white/5 overflow-x-auto scrollbar-none">
            {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all whitespace-nowrap uppercase cursor-pointer ${
                    isActive 
                      ? 'bg-blue-600 dark:bg-blue-600 text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1E2E42]/60'
                  }`}
                >
                  {tab.replace('_', ' ')}
                </button>
              );
            })}
          </div>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer whitespace-nowrap"
        >
          <Plus size={15} /> Log New Request
        </button>
      </div>

      {/* Request Stack List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw size={32} className="animate-spin text-blue-500 mb-3" />
          <span className="text-xs text-slate-450 font-mono">LOADING MAINTENANCE JOURNAL...</span>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-20 bg-slate-50/50 dark:bg-[#162535] rounded-3xl border border-dashed border-slate-200 dark:border-white/10 text-slate-450 flex flex-col items-center justify-center p-6">
          <Wrench size={40} className="stroke-[1.5] mb-3 text-slate-350 dark:text-slate-600" />
          <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No maintenance requests found.</p>
          <p className="text-xs mt-1">If there is an active problem, log it using the "Log New Request" CTA.</p>
        </div>
      ) : (
        <div className="space-y-4.5">
          {filteredRequests.map((req, idx) => {
            const isExpanded = expandedRequestId === req.request_id;
            const status = getStatusDetails(req.status);
            
            return (
              <div 
                key={req.request_id}
                className="premium-card p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between transition-all duration-300 relative overflow-hidden"
              >
                
                {/* Header row */}
                <div 
                  onClick={() => toggleExpand(req.request_id)}
                  className="flex items-start justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-2xl p-2 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5">
                      {getCategoryIcon(req.category)}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-950 dark:text-white hover:text-blue-500 dark:hover:text-[#818CF8] text-sm sm:text-base leading-snug transition-colors">
                        {req.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[9px] uppercase tracking-wider font-extrabold text-slate-450">
                        <span>{req.category}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-350" />
                        <span>Unit #{user?.unit_no || 'Common Area'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${getPriorityBadgeClass(req.priority)}`}>
                      {req.priority}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 ${status.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse-glow`} />
                      {status.label}
                    </span>
                    <button className="text-slate-400 p-1 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Details */}
                {isExpanded && (
                  <div className="mt-5 pt-5 border-t border-slate-100 dark:border-white/5 space-y-5 animate-fade-in-scale">
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      
                      {/* Description column */}
                      <div className="md:col-span-2 space-y-2">
                        <h4 className="text-[10px] font-black uppercase text-slate-450 dark:text-gray-400 tracking-widest">Problem Description</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-white/5">
                          {req.description}
                        </p>
                      </div>

                      {/* Timeline status tracker */}
                      <div className="space-y-3.5 bg-slate-50 dark:bg-slate-900/25 p-4 rounded-2xl border border-slate-200/50 dark:border-white/5">
                        <h4 className="text-[10px] font-black uppercase text-slate-450 dark:text-gray-400 tracking-widest">Lifecycle Tracker</h4>
                        
                        <div className="space-y-4 text-xs font-bold">
                          {/* Step 1: Open */}
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] bg-amber-500 text-white">✓</span>
                            <div>
                              <p className="text-[10px] text-slate-800 dark:text-slate-300">Ticket Created</p>
                              <p className="text-[9px] text-slate-400">Logged in community queue</p>
                            </div>
                          </div>

                          {/* Step 2: In progress */}
                          <div className="flex items-center gap-2.5">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] ${
                              req.status === 'IN_PROGRESS' || req.status === 'RESOLVED' 
                                ? 'bg-indigo-500 text-white' 
                                : 'bg-slate-200 dark:bg-white/10 text-slate-450'
                            }`}>
                              {req.status === 'IN_PROGRESS' || req.status === 'RESOLVED' ? '✓' : '2'}
                            </span>
                            <div>
                              <p className="text-[10px] text-slate-800 dark:text-slate-300">In Progress</p>
                              <p className="text-[9px] text-slate-400">Contractor assigned to bay</p>
                            </div>
                          </div>

                          {/* Step 3: Resolved */}
                          <div className="flex items-center gap-2.5">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] ${
                              req.status === 'RESOLVED' 
                                ? 'bg-emerald-500 text-white' 
                                : 'bg-slate-200 dark:bg-white/10 text-slate-450'
                            }`}>
                              {req.status === 'RESOLVED' ? '✓' : '3'}
                            </span>
                            <div>
                              <p className="text-[10px] text-slate-800 dark:text-slate-300">Resolved</p>
                              <p className="text-[9px] text-slate-400">Closed by property staff</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  {/* Manager Operations CTA */}
                  {canManage && req.status !== 'RESOLVED' && req.status !== 'CLOSED' && (
                    <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/20 dark:bg-slate-900/10 px-5 pb-5">
                      {req.status === 'OPEN' && (
                        <button 
                          onClick={() => handleStatusChange(req.request_id, 'IN_PROGRESS')}
                          className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-white/5 dark:hover:bg-white/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold cursor-pointer transition border border-indigo-200/50 dark:border-indigo-900/50"
                        >
                          Mark as In Progress
                        </button>
                      )}
                      {req.status === 'IN_PROGRESS' && (
                        <button 
                          onClick={() => handleStatusChange(req.request_id, 'RESOLVED')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1 shadow-md shadow-emerald-500/10"
                        >
                          Mark as Resolved
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {/* Add Modal - rendered via portal to cover full screen including sidebar & topbar */}
      {showAddModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E2E42] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create Maintenance Request</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Submit a new issue for the property team</p>
              </div>
              <button
                onClick={() => { setShowAddModal(false); setErrorMsg(''); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer ml-4 mt-0.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Problem / Subject <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Bedroom bathroom leakage"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full border border-slate-200 dark:border-white/15 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white bg-white dark:bg-[#0D1B2A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Detailed Description <span className="text-red-500">*</span></label>
                <textarea
                  required
                  rows={3}
                  placeholder="Please state details, leak locations, timings, or appliance models..."
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  className="w-full border border-slate-200 dark:border-white/15 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white bg-white dark:bg-[#0D1B2A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full border border-slate-200 dark:border-white/15 rounded-xl pl-4 pr-10 py-3 text-sm text-slate-900 dark:text-white bg-white dark:bg-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer appearance-none transition-all"
                    >
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Priority <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      value={priority}
                      onChange={e => setPriority(e.target.value)}
                      className="w-full border border-slate-200 dark:border-white/15 rounded-xl pl-4 pr-10 py-3 text-sm text-slate-900 dark:text-white bg-white dark:bg-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer appearance-none transition-all"
                    >
                      {priorities.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setErrorMsg(''); }}
                  className="flex-1 py-3 border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-500/20"
                >
                  {submitting ? "Submitting..." : "Log Maintenance Request"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
