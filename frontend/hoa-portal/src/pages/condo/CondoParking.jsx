import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  RefreshCw, Search, Plus, Check, X, 
  Zap, Box, User, Home, ArrowRight,
  Trash2, MessageSquare, AlertCircle, Calendar, ShieldAlert
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import API from '../../services/api';

export default function CondoParking({ community, user }) {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL', 'EV', 'LOCKER', 'REQUESTS'
  const [showAddModal, setShowAddModal] = useState(false);

  // Members list for auto-fill dropdown
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');

  // Change requests states
  const [changeRequests, setChangeRequests] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqSpotNo, setReqSpotNo] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);

  // Review requests states
  const [selectedReq, setSelectedReq] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approveSpot, setApproveSpot] = useState('');
  const [approveLocker, setApproveLocker] = useState('');
  const [approveEv, setApproveEv] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // Allocation Form state
  const [unitNo, setUnitNo] = useState('');
  const [spotNo, setSpotNo] = useState('');
  const [lockerNo, setLockerNo] = useState('');
  const [hasEv, setHasEv] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const role = (user?.role_name || user?.role || '').toLowerCase();
  const canManage = ['super_admin', 'property_manager', 'board_member'].includes(role);
  const commId = community?.community_id;

  useEffect(() => {
    if (commId) {
      fetchAllocations();
      fetchChangeRequests();
      if (canManage) {
        fetchMembers();
      }
    }
  }, [commId, canManage]);

  const fetchAllocations = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/condo/operations/parking?community_id=${commId}`);
      setAllocations(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load parking registry.");
    } finally {
      setLoading(false);
    }
  };

  const fetchChangeRequests = async () => {
    try {
      const res = await API.get(`/condo/operations/parking/change-requests?community_id=${commId}`);
      setChangeRequests(res.data || []);
    } catch (err) {
      console.error("Failed to load change requests", err);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await API.get(`/condo/community/${commId}/members`);
      setMembers(res.data || []);
    } catch (err) {
      console.error("Failed to load members", err);
    }
  };

  const getNextAvailableSpot = () => {
    const spots = allocations.map(a => a.parking_spot_no).filter(Boolean);
    let i = 1;
    while (true) {
      const candidate = `P-${String(i).padStart(3, '0')}`;
      if (!spots.includes(candidate)) {
        return candidate;
      }
      i++;
    }
  };

  const getNextAvailableLocker = () => {
    const lockers = allocations.map(a => a.locker_no).filter(Boolean);
    let i = 1;
    while (true) {
      const candidate = `L-${String(i).padStart(3, '0')}`;
      if (!lockers.includes(candidate)) {
        return candidate;
      }
      i++;
    }
  };

  useEffect(() => {
    if (showAddModal && !unitNo.trim()) {
      setSpotNo(getNextAvailableSpot());
      setLockerNo(getNextAvailableLocker());
    }
  }, [showAddModal]);

  useEffect(() => {
    if (unitNo.trim() && showAddModal) {
      const existingAlloc = allocations.find(
        a => a.unit_no.toLowerCase().trim() === unitNo.toLowerCase().trim()
      );
      if (existingAlloc) {
        setSpotNo(existingAlloc.parking_spot_no || '');
        setLockerNo(existingAlloc.locker_no || '');
        setHasEv(existingAlloc.has_ev_charger || false);
      } else {
        setSpotNo(getNextAvailableSpot());
        setLockerNo(getNextAvailableLocker());
        setHasEv(false);
      }
    }
  }, [unitNo, showAddModal, allocations]);

  const handleMemberChange = (memberId) => {
    setSelectedMemberId(memberId);
    if (memberId) {
      const selected = members.find(m => m.user_id === parseInt(memberId));
      if (selected) {
        setUnitNo(selected.unit_no || '');
        setUserEmail(selected.email_id || '');
      }
    } else {
      setUnitNo('');
      setUserEmail('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!unitNo.trim()) return toast.error('Unit number is required');

    try {
      setSubmitting(true);
      await API.post('/condo/operations/parking', {
        community_id: commId,
        unit_no: unitNo.trim(),
        parking_spot_no: spotNo.trim() || null,
        locker_no: lockerNo.trim() || null,
        has_ev_charger: hasEv,
        assigned_user_email: userEmail.trim() || null
      });

      toast.success("Parking/Locker allocation updated successfully!");
      setUnitNo('');
      setSpotNo('');
      setLockerNo('');
      setHasEv(false);
      setUserEmail('');
      setSelectedMemberId('');
      setShowAddModal(false);
      fetchAllocations();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to update allocation.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (allocationId) => {
    if (!window.confirm("Are you sure you want to release this parking/locker allocation?")) return;
    try {
      await API.delete(`/condo/operations/parking/${allocationId}`);
      toast.success("Parking/Locker allocation released successfully.");
      fetchAllocations();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to release allocation.");
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!reqReason.trim()) return toast.error('Reason is required');

    try {
      setSubmittingReq(true);
      await API.post('/condo/operations/parking/change-requests', {
        community_id: commId,
        requested_spot_no: reqSpotNo.trim() || null,
        reason: reqReason.trim()
      });

      toast.success("Parking spot change request submitted successfully!");
      setReqSpotNo('');
      setReqReason('');
      setShowRequestModal(false);
      fetchChangeRequests();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to submit request.");
    } finally {
      setSubmittingReq(false);
    }
  };

  const handleReviewApprove = async (e) => {
    e.preventDefault();
    try {
      setReviewing(true);
      await API.put(`/condo/operations/parking/change-requests/${selectedReq.request_id}/review`, {
        action: 'APPROVE',
        new_parking_spot_no: approveSpot.trim() || null,
        new_locker_no: approveLocker.trim() || null,
        new_has_ev_charger: approveEv
      });

      toast.success("Change request approved and allocation updated!");
      setShowApproveModal(false);
      setSelectedReq(null);
      setApproveSpot('');
      setApproveLocker('');
      setApproveEv(false);
      fetchChangeRequests();
      fetchAllocations();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to approve request.");
    } finally {
      setReviewing(false);
    }
  };

  const handleReviewReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) return toast.error('Rejection reason is required');

    try {
      setReviewing(true);
      await API.put(`/condo/operations/parking/change-requests/${selectedReq.request_id}/review`, {
        action: 'REJECT',
        rejection_reason: rejectReason.trim()
      });

      toast.success("Change request rejected.");
      setShowRejectModal(false);
      setSelectedReq(null);
      setRejectReason('');
      fetchChangeRequests();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to reject request.");
    } finally {
      setReviewing(false);
    }
  };

  // Find resident's own allocation
  const myAllocation = allocations.find(a => 
    a.assigned_user?.email_id?.toLowerCase() === user?.email?.toLowerCase() ||
    a.unit_no === user?.unit_no
  );

  // Stats calculation
  const totalBays = allocations.filter(a => a.parking_spot_no).length;
  const evBays = allocations.filter(a => a.has_ev_charger).length;
  const totalLockers = allocations.filter(a => a.locker_no).length;

  const filteredAllocations = allocations.filter(a => {
    const matchesSearch = 
      a.unit_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.parking_spot_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.locker_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.assigned_user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'EV') return matchesSearch && a.has_ev_charger;
    if (activeFilter === 'LOCKER') return matchesSearch && a.locker_no;
    return matchesSearch;
  });

  const currentAllocForUnit = allocations.find(a => a.unit_no === unitNo);
  const currentAssignedUserId = currentAllocForUnit?.assigned_user_id;
  const allocatedUserIds = allocations.map(a => a.assigned_user_id).filter(Boolean);
  const unallocatedMembers = members.filter(m => 
    !allocatedUserIds.includes(m.user_id) || m.user_id === currentAssignedUserId
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-white font-sans p-2 animate-fade-in-up">
      
      {/* Resident My Assets view */}
      {!canManage && (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] p-6 rounded-3xl border border-indigo-100 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-350 text-[10px] font-black uppercase tracking-wider">
              🏠 My Suite Assets (Unit {user?.unit_no || 'N/A'})
            </span>
            <h2 className="text-xl font-black">My Parking & Storage</h2>
            <div className="flex flex-wrap gap-4 mt-3">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-white/5 px-4 py-2.5 rounded-2xl">
                <span className="text-base">🚙</span>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest leading-none font-bold">Parking Spot</p>
                  <p className="text-xs font-black mt-1 text-slate-800 dark:text-slate-200">
                    {myAllocation?.parking_spot_no || "Unassigned"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-white/5 px-4 py-2.5 rounded-2xl">
                <Zap size={15} className={myAllocation?.has_ev_charger ? "text-emerald-500 fill-emerald-500" : "text-slate-400"} />
                <div>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest leading-none font-bold">EV Charger</p>
                  <p className="text-xs font-black mt-1 text-slate-800 dark:text-slate-200">
                    {myAllocation?.has_ev_charger ? "Active Charging" : "No EV Connection"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-white/5 px-4 py-2.5 rounded-2xl">
                <Box size={15} className="text-indigo-500" />
                <div>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest leading-none font-bold">Storage Locker</p>
                  <p className="text-xs font-black mt-1 text-slate-800 dark:text-slate-200">
                    {myAllocation?.locker_no ? `Box ${myAllocation.locker_no}` : "No Locker Assigned"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowRequestModal(true)}
            className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/10 cursor-pointer w-full md:w-auto"
          >
            <RefreshCw size={14} /> Request Spot Change
          </button>
        </div>
      )}

      {/* Registry Stats */}
      <div className="grid grid-cols-3 gap-5">
        <div className="bg-slate-50/50 dark:bg-[#1E2E42]/30 border border-slate-200/60 dark:border-white/5 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400">
            🅿️
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active Slots</p>
            <h4 className="text-base font-black">{totalBays} Bays</h4>
          </div>
        </div>

        <div className="bg-emerald-500/5 dark:bg-emerald-500/[0.02] border border-emerald-500/10 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
            <Zap size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest">EV Chargers</p>
            <h4 className="text-base font-black text-emerald-600 dark:text-[#34D399]">{evBays} Active</h4>
          </div>
        </div>

        <div className="bg-indigo-500/5 dark:bg-indigo-500/[0.02] border border-indigo-500/10 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
            <Box size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-indigo-500/60 uppercase tracking-widest">Lockers</p>
            <h4 className="text-base font-black text-indigo-600 dark:text-[#818CF8]">{totalLockers} Storage</h4>
          </div>
        </div>
      </div>

      {/* Search Header and Tab Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-50/50 dark:bg-[#1E2E42]/20 p-4 rounded-2xl border border-slate-200/60 dark:border-white/5">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search (Hide if Requests tab active) */}
          {activeFilter !== 'REQUESTS' && (
            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={16} />
              </span>
              <input 
                type="text" 
                placeholder="Search bay number, unit, or occupant..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-905 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 transition-all shadow-xs"
              />
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#1E2E42]/30 p-1 rounded-xl border border-slate-200/60 dark:border-white/5 overflow-x-auto scrollbar-none">
            {['ALL', 'EV', 'LOCKER', 'REQUESTS'].map((filter) => {
              // Hide Change Requests tab from residents (since they see their list inside modal/custom box)
              if (filter === 'REQUESTS' && !canManage) return null;
              
              const isActive = activeFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all whitespace-nowrap uppercase cursor-pointer ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-55 dark:hover:bg-[#1E2E42]/60'
                  }`}
                >
                  {filter === 'ALL' ? 'All Spaces' : filter === 'EV' ? 'EV Bays' : filter === 'LOCKER' ? 'Lockers' : 'Change Requests'}
                </button>
              );
            })}
          </div>
        </div>

        {canManage && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer whitespace-nowrap"
          >
            <Plus size={15} /> Update Allocations
          </button>
        )}
      </div>

      {/* Grid Garage display or Change Requests list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw size={32} className="animate-spin text-emerald-500 mb-3" />
          <span className="text-xs text-slate-455 font-mono">LOADING REGISTRY...</span>
        </div>
      ) : activeFilter === 'REQUESTS' ? (
        /* Change Requests Queue View for Managers */
        changeRequests.length === 0 ? (
          <div className="text-center py-20 bg-slate-50/50 dark:bg-[#162535] rounded-3xl border border-dashed border-slate-200 dark:border-white/10 text-slate-450 flex flex-col items-center justify-center p-6">
            <MessageSquare size={40} className="stroke-[1.5] mb-3 text-slate-350 dark:text-slate-650" />
            <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No change requests in queue.</p>
            <p className="text-xs mt-1">Pending resident change requests will populate here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {changeRequests.map((req) => (
              <div 
                key={req.request_id}
                className="bg-white dark:bg-[#1E2E42]/40 rounded-3xl border border-slate-200 dark:border-white/10 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-300 dark:hover:border-white/20 transition-all"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-xs">
                      {req.user?.full_name ? req.user.full_name[0] : '?'}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-none">{req.user?.full_name || 'Resident'}</h4>
                      <p className="text-[10px] text-slate-450 mt-1">Unit {req.user?.unit_no} • {req.user?.email_id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1 max-w-md">
                    <div>
                      <p className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Current Spot</p>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{req.current_spot_no || 'None'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Requested Spot</p>
                      <p className="text-xs font-bold text-indigo-600 dark:text-[#818CF8]">{req.requested_spot_no || 'Any Available'}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-200/50 dark:border-white/5 flex items-start gap-2">
                    <MessageSquare size={13} className="text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-650 dark:text-slate-300 leading-normal">
                      <span className="font-semibold text-slate-800 dark:text-white">Reason:</span> {req.reason}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <Calendar size={11} />
                    {new Date(req.created_date).toLocaleDateString()}
                    {req.status !== 'PENDING' && (
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ml-2 ${
                        req.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      }`}>
                        {req.status}
                      </span>
                    )}
                  </div>

                  {req.status === 'REJECTED' && req.rejection_reason && (
                    <p className="text-[10px] text-rose-500 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10 mt-1 max-w-md">
                      <span className="font-bold">Rejection Reason:</span> {req.rejection_reason}
                    </p>
                  )}
                </div>

                {req.status === 'PENDING' && (
                  <div className="flex gap-2 w-full md:w-auto">
                    <button
                      onClick={() => {
                        setSelectedReq(req);
                        setApproveSpot(req.requested_spot_no || '');
                        setApproveLocker('');
                        setApproveEv(false);
                        setShowApproveModal(true);
                      }}
                      className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/10 cursor-pointer"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedReq(req);
                        setRejectReason('');
                        setShowRejectModal(true);
                      }}
                      className="flex-1 md:flex-none px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-rose-500/20 cursor-pointer"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : filteredAllocations.length === 0 ? (
        <div className="text-center py-20 bg-slate-50/50 dark:bg-[#162535] rounded-3xl border border-dashed border-slate-200 dark:border-white/10 text-slate-450 flex flex-col items-center justify-center p-6 animate-fade-in-scale">
          <Box size={40} className="stroke-[1.5] mb-3 text-slate-350 dark:text-slate-600" />
          <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No slots or lockers matching criteria.</p>
          <p className="text-xs mt-1">Registry slots can be updated or reassigned by managers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAllocations.map((alloc, idx) => (
            <div 
              key={alloc.allocation_id}
              className="premium-card p-5 rounded-3xl bg-white dark:bg-[#1E2E42]/40 flex flex-col justify-between border border-slate-200/80 dark:border-white/10 relative overflow-hidden animate-fade-in-scale"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              
              {/* Slot ID and EV tag */}
              <div className="flex justify-between items-center">
                <span className="text-xs font-black tracking-widest font-mono bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-white/5">
                  🚙 {alloc.parking_spot_no || 'NO BAY'}
                </span>
                {alloc.has_ev_charger ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-[#34D399] font-extrabold text-[9px] uppercase tracking-wider border border-emerald-500/20 animate-pulse">
                    <Zap size={10} className="fill-emerald-500" /> EV ACTIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                    NO EV
                  </span>
                )}
              </div>

              {/* Locker / Storage Details */}
              <div className="my-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                    <Box size={14} />
                  </span>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-slate-400">Locker Assigned</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {alloc.locker_no ? `Box ${alloc.locker_no}` : 'No Locker Storage'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Resident profile assignment card */}
              <div className="pt-3.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-250/50 dark:border-white/10 flex items-center justify-center text-xs font-black uppercase text-indigo-500">
                    {alloc.assigned_user?.full_name ? alloc.assigned_user.full_name[0] : '?'}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-900 dark:text-white leading-tight">
                      {alloc.assigned_user?.full_name || 'Unassigned / Available'}
                    </p>
                    <p className="text-[9px] text-slate-450 mt-0.5 flex items-center gap-1">
                      <span>🏠</span> Unit {alloc.unit_no}
                    </p>
                  </div>
                </div>
                {canManage && (
                  <button 
                    onClick={() => handleDelete(alloc.allocation_id)}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-455 rounded-xl transition cursor-pointer border border-transparent hover:border-rose-500/20"
                    title="Release Parking Bay"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resident Past Requests Box (Only shown to Residents) */}
      {!canManage && changeRequests.length > 0 && (
        <div className="bg-white dark:bg-[#1E2E42]/20 border border-slate-200 dark:border-white/5 rounded-3xl p-5 space-y-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <MessageSquare size={13} /> Past Change Requests
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {changeRequests.map((req) => (
              <div key={req.request_id} className="py-3 flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Requested Spot: <span className="font-bold text-slate-905 dark:text-white">{req.requested_spot_no || 'Any Available'}</span>
                  </p>
                  <p className="text-[10px] text-slate-500">Reason: {req.reason}</p>
                  {req.rejection_reason && (
                    <p className="text-[9px] text-rose-500 bg-rose-500/5 p-1 px-2 rounded-md border border-rose-500/10 mt-1">
                      Reason: {req.rejection_reason}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                  req.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse' :
                  req.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                  'bg-rose-500/10 text-rose-500 border-rose-500/20'
                }`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Allocate Modal (Manager only) */}
      {showAddModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E2E42] rounded-3xl border border-slate-200 dark:border-white/10 w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-[#162535]">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🅿️</span> Allocate Parking & Locker Space
              </h3>
              <button 
                onClick={() => { setShowAddModal(false); setSelectedMemberId(''); }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-semibold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Resident selector for auto-fill */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Select Registered Resident (Optional)</label>
                <select
                  value={selectedMemberId}
                  onChange={e => handleMemberChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-905 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                >
                  <option value="">-- Choose Resident (Auto-fills Unit & Email) --</option>
                  {unallocatedMembers.map(m => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.full_name} (Unit {m.unit_no || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Unit number <span className="text-red-500">*</span></label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. 302"
                    value={unitNo}
                    onChange={e => setUnitNo(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-905 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Spot Number</label>
                  <input 
                    type="text"
                    placeholder="e.g. P-124"
                    value={spotNo}
                    onChange={e => setSpotNo(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-905 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Locker Storage Number</label>
                  <input 
                    type="text"
                    placeholder="e.g. L-302"
                    value={lockerNo}
                    onChange={e => setLockerNo(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-905 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="flex flex-col justify-end pb-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-gray-300 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={hasEv}
                      onChange={e => setHasEv(e.target.checked)}
                      className="w-4.5 h-4.5 text-emerald-600 bg-slate-50 border-slate-350 rounded-lg cursor-pointer"
                    />
                    Active EV Charger
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Resident Email ID</label>
                <input 
                  type="email"
                  placeholder="e.g. resident@example.com"
                  value={userEmail}
                  onChange={e => setUserEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-905 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-200 dark:border-white/10 mt-6">
                <button 
                  type="button" 
                  onClick={() => { setShowAddModal(false); setErrorMsg(''); setSelectedMemberId(''); }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-md shadow-emerald-500/10"
                >
                  {submitting ? "Allocating..." : "Allocate Spaces"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Resident Request Change Modal */}
      {showRequestModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E2E42] rounded-3xl border border-slate-200 dark:border-white/10 w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-[#162535]">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🔄</span> Request Parking Change
              </h3>
              <button 
                onClick={() => { setShowRequestModal(false); }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-semibold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Preferred Spot Number (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. P-102 (Leave blank for any)"
                  value={reqSpotNo}
                  onChange={e => setReqSpotNo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-905 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Reason for Change Request <span className="text-red-500">*</span></label>
                <textarea 
                  required
                  rows="4"
                  placeholder="e.g. I have purchased an electric vehicle and require a slot equipped with active EV charging."
                  value={reqReason}
                  onChange={e => setReqReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-905 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-200 dark:border-white/10 mt-6">
                <button 
                  type="button" 
                  onClick={() => { setShowRequestModal(false); setErrorMsg(''); }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submittingReq}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-md shadow-indigo-500/10"
                >
                  {submittingReq ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Admin Approve Change Request Modal */}
      {showApproveModal && selectedReq && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E2E42] rounded-3xl border border-slate-200 dark:border-white/10 w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-[#162535]">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🟢</span> Approve Change Request
              </h3>
              <button 
                onClick={() => { setShowApproveModal(false); setSelectedReq(null); }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-semibold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReviewApprove} className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-white/5 space-y-1 text-xs">
                <p><span className="text-slate-400 font-bold">Resident:</span> {selectedReq.user?.full_name}</p>
                <p><span className="text-slate-400 font-bold">Unit No:</span> {selectedReq.user?.unit_no}</p>
                <p><span className="text-slate-400 font-bold">Current Spot:</span> {selectedReq.current_spot_no || 'None'}</p>
                <p><span className="text-slate-400 font-bold">Requested Spot:</span> {selectedReq.requested_spot_no || 'Any Available'}</p>
                <p className="pt-2 italic text-slate-500">" {selectedReq.reason} "</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Assign Spot *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. P-102"
                    value={approveSpot}
                    onChange={e => setApproveSpot(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-905 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Assign Locker</label>
                  <input 
                    type="text"
                    placeholder="e.g. L-302"
                    value={approveLocker}
                    onChange={e => setApproveLocker(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-905 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-gray-300 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={approveEv}
                    onChange={e => setApproveEv(e.target.checked)}
                    className="w-4.5 h-4.5 text-emerald-600 bg-slate-50 border-slate-350 rounded-lg cursor-pointer"
                  />
                  Enable EV Charger for this spot
                </label>
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-200 dark:border-white/10 mt-6">
                <button 
                  type="button" 
                  onClick={() => { setShowApproveModal(false); setSelectedReq(null); setErrorMsg(''); }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={reviewing}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-md shadow-emerald-500/10"
                >
                  {reviewing ? "Allocating..." : "Confirm & Approve"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Admin Reject Change Request Modal */}
      {showRejectModal && selectedReq && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E2E42] rounded-3xl border border-slate-200 dark:border-white/10 w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-[#162535]">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🔴</span> Reject Change Request
              </h3>
              <button 
                onClick={() => { setShowRejectModal(false); setSelectedReq(null); }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-semibold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReviewReject} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Rejection Reason <span className="text-red-500">*</span></label>
                <textarea 
                  required
                  rows="4"
                  placeholder="Explain why this request is being rejected (e.g., requested spot P-102 is already occupied, EV capacity full)."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-905 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-200 dark:border-white/10 mt-6">
                <button 
                  type="button" 
                  onClick={() => { setShowRejectModal(false); setSelectedReq(null); setErrorMsg(''); }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={reviewing}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-md shadow-rose-500/10"
                >
                  {reviewing ? "Rejecting..." : "Confirm & Reject"}
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
