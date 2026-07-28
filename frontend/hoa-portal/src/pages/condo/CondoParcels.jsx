import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  RefreshCw, Search, Plus, Package, Check, ChevronDown,
  Clock, User, CheckCircle, HelpCircle, Archive, Clipboard
} from 'lucide-react';
import API from '../../services/api';

export default function CondoParcels({ community, user }) {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('AWAITING'); // 'AWAITING', 'COLLECTED', 'ALL'
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedTrackId, setCopiedTrackId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [recipientEmail, setRecipientEmail] = useState('');
  const [carrier, setCarrier] = useState('Amazon');
  const [trackingNo, setTrackingNo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const role = (user?.role_name || user?.role || '').toLowerCase();
  const canManage = ['super_admin', 'property_manager', 'board_member'].includes(role);
  const commId = community?.community_id;

  const carriers = ["Amazon", "FedEx", "UPS", "DHL", "USPS", "Other Courier"];

  useEffect(() => {
    if (commId) {
      fetchParcels();
    }
  }, [commId]);

  const fetchParcels = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await API.get(`/condo/operations/parcels?community_id=${commId}`);
      setParcels(res.data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load parcel logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recipientEmail.trim() || !trackingNo.trim()) return setErrorMsg('Recipient Email and Tracking number are required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim())) {
      return setErrorMsg('Please enter a valid recipient email address');
    }
    if (trackingNo.trim().length < 4) return setErrorMsg('Tracking number must be at least 4 characters long');

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      await API.post('/condo/operations/parcels', {
        community_id: commId,
        recipient_email: recipientEmail.trim().toLowerCase(),
        carrier,
        tracking_no: trackingNo.trim()
      });

      setSuccessMsg("Parcel successfully logged and recipient notified!");
      setRecipientEmail('');
      setTrackingNo('');
      setShowAddModal(false);
      fetchParcels();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Failed to log parcel.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCollect = async (parcelId) => {
    try {
      await API.put(`/condo/operations/parcels/${parcelId}/collect`);
      setSuccessMsg("Parcel marked as collected!");
      fetchParcels();
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to update parcel status.");
    }
  };

  const copyToClipboard = (txt) => {
    navigator.clipboard.writeText(txt);
    setCopiedTrackId(txt);
    setTimeout(() => setCopiedTrackId(''), 2000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getCarrierBadge = (c) => {
    switch (c?.toLowerCase()) {
      case 'amazon': return '📦 Amazon';
      case 'fedex': return '🟣 FedEx';
      case 'ups': return '🟤 UPS';
      case 'dhl': return '🟡 DHL';
      case 'usps': return '🔵 USPS';
      default: return '✉️ Courier';
    }
  };

  const pendingCount = parcels.filter(p => p.status === 'RECEIVED').length;
  const collectedTodayCount = parcels.filter(p => {
    if (p.status !== 'COLLECTED' || !p.collected_at) return false;
    const collectedDate = new Date(p.collected_at).toDateString();
    const today = new Date().toDateString();
    return collectedDate === today;
  }).length;

  const filteredParcels = parcels.filter(p => {
    const matchesSearch = 
      p.recipient?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tracking_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.carrier?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'AWAITING') return matchesSearch && p.status === 'RECEIVED';
    if (activeTab === 'COLLECTED') return matchesSearch && p.status === 'COLLECTED';
    return matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-white font-sans p-2 animate-fade-in-up">
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

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-amber-500/5 dark:bg-amber-500/[0.02] border border-amber-500/10 p-5 rounded-3xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-550 rounded-2xl border border-amber-500/20">
            <Package size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-amber-550/70 uppercase tracking-widest">Awaiting Collection</p>
            <h4 className="text-xl font-black text-amber-600 dark:text-amber-400">{pendingCount} Packages</h4>
          </div>
        </div>

        <div className="bg-emerald-500/5 dark:bg-emerald-500/[0.02] border border-emerald-500/10 p-5 rounded-3xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-550 rounded-2xl border border-emerald-500/20">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest">Picked Up Today</p>
            <h4 className="text-xl font-black text-emerald-650 dark:text-emerald-400">{collectedTodayCount} Logs</h4>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-50/50 dark:bg-[#1E2E42]/20 p-4 rounded-2xl border border-slate-200/60 dark:border-white/5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="Search tracking, recipient or carrier..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-450 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 transition-all shadow-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white dark:bg-[#1E2E42]/30 p-1 rounded-xl border border-slate-200/60 dark:border-white/5 overflow-x-auto scrollbar-none">
            {['AWAITING', 'COLLECTED', 'ALL'].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all whitespace-nowrap uppercase cursor-pointer ${
                    isActive 
                      ? 'bg-amber-500 text-slate-950 dark:text-slate-900 font-extrabold shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-55 dark:hover:bg-[#1E2E42]/60'
                  }`}
                >
                  {tab === 'AWAITING' ? 'Awaiting Pick-up' : tab === 'COLLECTED' ? 'Archive Logs' : 'All Deliveries'}
                </button>
              );
            })}
          </div>
        </div>

        {canManage && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 dark:text-slate-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer whitespace-nowrap"
          >
            <Plus size={15} /> Log New Package
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw size={32} className="animate-spin text-amber-500 mb-3" />
          <span className="text-xs text-slate-450 font-mono">LOADING PARCEL LOGS...</span>
        </div>
      ) : filteredParcels.length === 0 ? (
        <div className="text-center py-20 bg-slate-50/50 dark:bg-[#162535] rounded-3xl border border-dashed border-slate-200 dark:border-white/10 text-slate-450 flex flex-col items-center justify-center p-6 animate-fade-in-scale">
          <Package size={40} className="stroke-[1.5] mb-3 text-slate-350 dark:text-slate-600" />
          <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No parcel delivery logs found.</p>
          <p className="text-xs mt-1">Newly arrived packages will display here upon reception check-in.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredParcels.map((parcel, idx) => (
            <div 
              key={parcel.parcel_id}
              className="premium-card p-5 rounded-3xl flex flex-col justify-between min-h-[190px] border border-slate-200/80 dark:border-white/10 relative overflow-hidden animate-fade-in-scale"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-black tracking-wider bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-xl border border-slate-250/50 dark:border-white/5 text-slate-850 dark:text-slate-200">
                  {getCarrierBadge(parcel.carrier)}
                </span>
                
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                  parcel.status === 'COLLECTED' 
                    ? 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400' 
                    : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-500/20 animate-pulse-glow'
                }`}>
                  {parcel.status}
                </span>
              </div>

              <div className="my-4.5 space-y-1">
                <p className="text-[9px] uppercase tracking-widest text-slate-400">Recipient Resident</p>
                <h4 className="font-black text-slate-900 dark:text-white text-base leading-tight">
                  {parcel.recipient?.full_name}
                </h4>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  Unit {parcel.recipient?.unit_no || 'N/A'} • {parcel.recipient?.email_id}
                </p>
              </div>

              <div className="pt-3.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[8px] uppercase tracking-widest text-slate-400 leading-none">Tracking code</p>
                  
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200/50 dark:border-white/5">
                    <span>{parcel.tracking_no || 'N/A'}</span>
                    <button 
                      onClick={() => copyToClipboard(parcel.tracking_no)}
                      className="text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      {copiedTrackId === parcel.tracking_no ? <Check size={11} className="text-emerald-500" /> : <Clipboard size={11} />}
                    </button>
                  </div>
                </div>

                {canManage && parcel.status === 'RECEIVED' ? (
                  <button 
                    onClick={() => handleCollect(parcel.parcel_id)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black cursor-pointer transition flex items-center gap-1 shadow-md shadow-emerald-500/10"
                  >
                    <Check size={12} className="stroke-[3]" /> Collect
                  </button>
                ) : (
                  <div className="text-right text-[10px] text-slate-450 font-medium">
                    <p className="flex items-center gap-1 text-[9px] text-slate-400"><Clock size={10} /> Recv: {formatDate(parcel.received_at).split(',')[0]}</p>
                    {parcel.collected_at && <p className="flex items-center gap-1 text-[9px] text-emerald-600 mt-0.5"><CheckCircle size={10} /> Coll: {formatDate(parcel.collected_at).split(',')[0]}</p>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#162535] rounded-3xl border border-slate-200 dark:border-white/10 w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-900/30">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>📦</span> Log Arrived Reception Package
              </h3>
              <button 
                onClick={() => { setShowAddModal(false); setErrorMsg(''); }} 
                className="text-slate-450 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:scale-105 transition-all w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-[10px] rounded-xl">
                  {errorMsg}
                </div>
              )}
              <div>
                <label className="block text-[9px] font-black text-slate-450 dark:text-gray-400 uppercase tracking-widest mb-1.5">Recipient Resident Email</label>
                <input 
                  type="email"
                  required
                  placeholder="e.g. resident@domain.com"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-905 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-450 dark:text-gray-400 uppercase tracking-widest mb-1.5">Carrier Service</label>
                <div className="relative">
                  <select 
                    value={carrier}
                    onChange={e => setCarrier(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-950 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer appearance-none"
                  >
                    {carriers.map(c => (
                      <option key={c} value={c} className="dark:bg-slate-900">{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={14} />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-450 dark:text-gray-400 uppercase tracking-widest mb-1.5">Tracking Number / Barcode</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. 1Z999AA10123456784"
                  value={trackingNo}
                  onChange={e => setTrackingNo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-905 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div className="pt-3 flex gap-2 justify-end">
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
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 dark:text-slate-900 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-md shadow-amber-500/10"
                >
                  {submitting ? "Logging..." : "Log Package"}
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
