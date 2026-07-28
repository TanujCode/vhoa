import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  RefreshCw, Search, Plus, Key, Calendar, 
  Copy, Check, Share2, Phone, Car, User
} from 'lucide-react';
import API from '../../services/api';

export default function CondoVisitors({ community, user }) {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedPassId, setCopiedPassId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const commId = community?.community_id;

  useEffect(() => {
    if (commId) {
      fetchPasses();
    }
  }, [commId]);

  const fetchPasses = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await API.get(`/condo/operations/visitors?community_id=${commId}`);
      setPasses(res.data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load visitor passes.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) return setErrorMsg('Guest name is required');
    if (guestName.trim().length < 3) return setErrorMsg('Guest name must be at least 3 characters long');
    if (guestPhone.trim() && guestPhone.trim().length < 8) {
      return setErrorMsg('Please enter a valid guest phone number');
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await API.post('/condo/operations/visitors', {
        community_id: commId,
        guest_name: guestName.trim(),
        guest_phone: guestPhone.trim() || null,
        vehicle_no: vehicleNo.trim() || null
      });

      setSuccessMsg(`Visitor Pass code successfully generated: ${res.data.otp_code}`);
      setGuestName('');
      setGuestPhone('');
      setVehicleNo('');
      setShowAddModal(false);
      fetchPasses();
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to generate visitor pass.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyPassInfo = (pass) => {
    const text = `Hello ${pass.guest_name},\n\nHere is your Visitor Access Pass for Unit ${user?.unit_no || 'N/A'} at ${community?.name || 'Condo'}:\n🔑 Access Code: ${pass.otp_code}\n🚗 Vehicle Plate: ${pass.vehicle_no || 'None'}\n\nShow this code at reception upon arrival.`;
    navigator.clipboard.writeText(text);
    setCopiedPassId(pass.pass_id);
    setTimeout(() => setCopiedPassId(''), 2000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const filteredPasses = passes.filter(p => 
    p.guest_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.otp_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {/* Search Filter bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-50/50 dark:bg-[#1E2E42]/20 p-4 rounded-2xl border border-slate-200/60 dark:border-white/5">
        <div className="relative w-full sm:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={16} />
          </span>
          <input 
            type="text" 
            placeholder="Search passes by guest name or access code..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-450 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25 transition-all shadow-xs"
          />
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-750 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/20 cursor-pointer whitespace-nowrap"
        >
          <Plus size={15} /> New Guest Pass
        </button>
      </div>

      {/* Grid ticket display */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw size={32} className="animate-spin text-teal-500 mb-3" />
          <span className="text-xs text-slate-450 font-mono">LOADING VISITOR JOURNAL...</span>
        </div>
      ) : filteredPasses.length === 0 ? (
        <div className="text-center py-20 bg-slate-50/50 dark:bg-[#162535] rounded-3xl border border-dashed border-slate-200 dark:border-white/10 text-slate-450 flex flex-col items-center justify-center p-6 animate-fade-in-scale">
          <Key size={40} className="stroke-[1.5] mb-3 text-slate-350 dark:text-slate-600" />
          <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No visitor passes generated.</p>
          <p className="text-xs mt-1">Submit guest names to generate unique entry tickets.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPasses.map((pass, idx) => (
            <div 
              key={pass.pass_id}
              className="bg-white dark:bg-[#1E2E42]/40 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[220px] animate-fade-in-scale"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              
              {/* Ticket header details */}
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 bg-teal-500/10 text-teal-600 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider">
                    <Key size={9} /> GUEST PASS
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase tracking-wider border border-emerald-500/20">
                    {pass.status}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <User size={16} className="text-slate-400" /> {pass.guest_name}
                  </h3>
                  
                  {pass.guest_phone && (
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <Phone size={12} className="text-slate-400" /> {pass.guest_phone}
                    </p>
                  )}
                  {pass.vehicle_no && (
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <Truck size={12} className="text-slate-400" /> Plate: {pass.vehicle_no}
                    </p>
                  )}
                </div>
              </div>

              {/* Boarding ticket dashed line */}
              <div className="relative">
                <div className="absolute -left-3 -top-2 w-4 h-4 rounded-full bg-slate-50 dark:bg-[#0D1B2A] border-r border-slate-200/50 dark:border-white/10" />
                <div className="absolute -right-3 -top-2 w-4 h-4 rounded-full bg-slate-50 dark:bg-[#0D1B2A] border-l border-slate-200/50 dark:border-white/10" />
                <div className="border-t border-dashed border-slate-250 dark:border-white/10 w-full" />
              </div>

              {/* Ticket Footer (Access Code Display) */}
              <div className="p-5 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Gate Entry Code</p>
                  
                  {/* Access code formatted in block squares */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {pass.otp_code?.split('').map((char, index) => (
                      <span 
                        key={index}
                        className="w-6 h-7 rounded-lg bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 flex items-center justify-center font-mono font-black text-xs text-teal-600 shadow-xs"
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => copyPassInfo(pass)}
                  className="p-2.5 bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 hover:border-teal-500 dark:hover:border-teal-500 hover:text-teal-600 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1"
                  title="Share Pass Details"
                >
                  {copiedPassId === pass.pass_id ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E2E42] rounded-3xl border border-slate-200 dark:border-white/10 w-full max-w-md overflow-hidden shadow-2xl">
            
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-[#162535]">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🔑</span> Generate Guest Entry Pass
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

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Guest Full Name <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Guest Phone Number (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. 555-019-2834"
                  value={guestPhone}
                  onChange={e => setGuestPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Vehicle License Plate (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. CA 7XYZ99"
                  value={vehicleNo}
                  onChange={e => setVehicleNo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
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
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-md shadow-teal-500/10"
                >
                  {submitting ? "Generating..." : "Generate Entry Pass"}
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
