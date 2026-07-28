import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  RefreshCw, Search, Plus, Check, X, 
  Zap, Box, User, Home, ArrowRight
} from 'lucide-react';
import API from '../../services/api';

export default function CondoParking({ community, user }) {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL', 'EV', 'LOCKER'
  const [showAddModal, setShowAddModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
    }
  }, [commId]);

  const fetchAllocations = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await API.get(`/condo/operations/parking?community_id=${commId}`);
      setAllocations(res.data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load parking registry.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!unitNo.trim()) return setErrorMsg('Unit number is required');

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      await API.post('/condo/operations/parking', {
        community_id: commId,
        unit_no: unitNo.trim(),
        parking_spot_no: spotNo.trim() || null,
        locker_no: lockerNo.trim() || null,
        has_ev_charger: hasEv,
        assigned_user_email: userEmail.trim() || null
      });

      setSuccessMsg("Parking/Locker allocation updated successfully!");
      setUnitNo('');
      setSpotNo('');
      setLockerNo('');
      setHasEv(false);
      setUserEmail('');
      setShowAddModal(false);
      fetchAllocations();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Failed to update allocation.");
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-white font-sans p-2 animate-fade-in-up">
      


      {/* Alerts */}
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

      {/* Registry Stats */}
      <div className="grid grid-cols-3 gap-5">
        <div className="bg-slate-50/50 dark:bg-[#1E2E42]/30 border border-slate-200/60 dark:border-white/5 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-550 dark:text-slate-400">
            🅿️
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active Slots</p>
            <h4 className="text-base font-black">{totalBays} Bays</h4>
          </div>
        </div>

        <div className="bg-emerald-500/5 dark:bg-emerald-500/[0.02] border border-emerald-500/10 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-550">
            <Zap size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-emerald-550/60 uppercase tracking-widest">EV Chargers</p>
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
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="Search bay number, unit, or occupant..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-450 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 transition-all shadow-xs"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#1E2E42]/30 p-1 rounded-xl border border-slate-200/60 dark:border-white/5 overflow-x-auto scrollbar-none">
            {['ALL', 'EV', 'LOCKER'].map((filter) => {
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
                  {filter === 'ALL' ? 'All Spaces' : filter === 'EV' ? 'EV Bays Only' : 'Lockers Assigned'}
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

      {/* Grid Garage display */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw size={32} className="animate-spin text-emerald-500 mb-3" />
          <span className="text-xs text-slate-450 font-mono">LOADING GARAGE LAYOUT...</span>
        </div>
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
              className="premium-card p-5 rounded-3xl flex flex-col justify-between border border-slate-200/80 dark:border-white/10 relative overflow-hidden animate-fade-in-scale"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              
              {/* Slot ID and EV tag */}
              <div className="flex justify-between items-center">
                <span className="text-xs font-black tracking-widest font-mono bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-white/5">
                  🚙 {alloc.parking_spot_no || 'NO BAY'}
                </span>
                {alloc.has_ev_charger ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-[#34D399] font-extrabold text-[9px] uppercase tracking-wider border border-emerald-500/20 animate-pulse-glow">
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
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-455 rounded-xl transition cursor-pointer"
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

      {/* Add Modal */}
      {showAddModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E2E42] rounded-3xl border border-slate-200 dark:border-white/10 w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-[#162535]">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🅿️</span> Allocate Parking & Locker Space
              </h3>
              <button 
                onClick={() => { setShowAddModal(false); setErrorMsg(''); }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-semibold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl">
                  {errorMsg}
                </div>
              )}

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
                  onClick={() => { setShowAddModal(false); setErrorMsg(''); }}
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
    </div>
  );
}
