import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  RefreshCw, Search, Plus, Key, Calendar, 
  Copy, Check, Share2, Phone, Car, User, ShieldCheck, LogOut, QrCode, Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import API from '../../services/api';
import { formatPhoneAsYouType } from '../../utils/phoneFormatter';
import ConfirmModal from '../../components/ConfirmModal';

export default function CondoVisitors({ community, user }) {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedPassId, setCopiedPassId] = useState('');

  // Ticket modal state
  const [selectedPassForTicket, setSelectedPassForTicket] = useState(null);

  // Verifier Panel state (Security/Manager only)
  const [verifyOtp, setVerifyOtp] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState('');
  const [verifiedPass, setVerifiedPass] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    onConfirm: null,
    type: 'danger',
    singleButton: false
  });

  const showAlert = (title, message, type = 'info') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText: 'OK',
      cancelText: 'Cancel',
      type,
      singleButton: true,
      onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  // Form state
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const commId = community?.community_id;
  const role = (user?.role_name || user?.role || '').toLowerCase();
  const isSecurityOrStaff = ['super_admin', 'property_manager', 'board_member', 'security_guard', 'front_desk_concierge'].includes(role);

  useEffect(() => {
    if (commId) {
      fetchPasses();
    }
  }, [commId]);

  const fetchPasses = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/condo/operations/visitors?community_id=${commId}`);
      setPasses(res.data || []);
    } catch (err) {
      console.error(err);
      showAlert("Error", "Failed to load visitor passes.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = guestName.trim();
    if (!cleanName) return showAlert("Validation Error", "Guest name is required", "warning");
    if (cleanName.length < 3) return showAlert("Validation Error", "Guest name must be at least 3 characters long", "warning");
    
    // Name validation: letters and spaces only
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(cleanName)) {
      return showAlert("Validation Error", "Guest name must only contain letters and spaces", "warning");
    }

    let finalPhone = null;
    if (guestPhone.trim()) {
      const cleanPhone = guestPhone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return showAlert("Validation Error", "USA phone number must be exactly 10 digits", "warning");
      }
      finalPhone = `+1${cleanPhone}`;
    }

    let finalVehicle = null;
    if (vehicleNo.trim()) {
      const cleanVehicle = vehicleNo.trim().toUpperCase();
      const vehicleRegex = /^[A-Z0-9\s\-]{2,8}$/;
      if (!vehicleRegex.test(cleanVehicle)) {
        return showAlert("Validation Error", "Vehicle license plate must be 2 to 8 alphanumeric characters (hyphens/spaces allowed)", "warning");
      }
      finalVehicle = cleanVehicle;
    }

    try {
      setSubmitting(true);
      const res = await API.post('/condo/operations/visitors', {
        community_id: commId,
        guest_name: cleanName,
        guest_phone: finalPhone,
        vehicle_no: finalVehicle
      });

      showAlert("Pass Generated", `Visitor Pass generated successfully! Access Code: ${res.data.otp_code}`, "success");
      setGuestName('');
      setGuestPhone('');
      setVehicleNo('');
      setShowAddModal(false);
      fetchPasses();
      // Auto-open ticket modal for the newly created pass
      setSelectedPassForTicket(res.data);
    } catch (err) {
      console.error(err);
      showAlert("Error", "Failed to generate visitor pass.", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyPass = async (e) => {
    e.preventDefault();
    if (!verifyOtp.trim() || verifyOtp.trim().length !== 6) {
      return setVerifyError("Please enter a valid 6-digit entry code");
    }

    try {
      setVerifyingCode(true);
      setVerifyError('');
      setVerifySuccess('');
      setVerifiedPass(null);

      const res = await API.put('/condo/operations/visitors/verify', {
        otp_code: verifyOtp.trim(),
        community_id: commId
      });

      setVerifySuccess(`ACCESS GRANTED: verified ${res.data.guest_name}!`);
      setVerifiedPass(res.data);
      setVerifyOtp('');
      fetchPasses();
    } catch (err) {
      console.error(err);
      setVerifyError(err.response?.data?.detail || "Invalid access code. Pass may be inactive or expired.");
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleCheckOut = (passId) => {
    setConfirmModal({
      isOpen: true,
      title: "Check Out Visitor",
      message: "Are you sure you want to check out this visitor and expire their pass?",
      confirmText: "Yes, Check Out",
      cancelText: "Cancel",
      type: "warning",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          setLoading(true);
          await API.put(`/condo/operations/visitors/${passId}/check-out`);
          showAlert("Checked Out", "Visitor successfully checked out.", "success");
          fetchPasses();
        } catch (err) {
          console.error(err);
          showAlert("Error", err.response?.data?.detail || "Failed to check out visitor.", "danger");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleDeletePass = (passId) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Visitor Pass",
      message: "Are you sure you want to permanently delete this visitor pass? This action cannot be undone.",
      confirmText: "Yes, Delete",
      cancelText: "Cancel",
      type: "danger",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          setLoading(true);
          await API.delete(`/condo/operations/visitors/${passId}`);
          showAlert("Deleted", "Visitor pass deleted successfully.", "success");
          fetchPasses();
        } catch (err) {
          console.error(err);
          showAlert("Error", err.response?.data?.detail || "Failed to delete visitor pass.", "danger");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const copyPassInfo = (pass) => {
    const text = `Hello ${pass.guest_name},\n\nHere is your Visitor Access Pass for Unit ${user?.unit_no || 'N/A'} at ${community?.name || 'Condo'}:\n Access Code: ${pass.otp_code}\n Vehicle Plate: ${pass.vehicle_no || 'None'}\n\nShow this code or scan the QR code at the gate/lobby security upon arrival.`;
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
      

      {/* Gate Entry Verifier Panel (Concierge / Security Guard View only) */}
      {isSecurityOrStaff && (
        <div className="bg-gradient-to-br from-teal-555/10 via-teal-500/5 to-transparent dark:from-[#112E36] dark:to-[#162535]/30 border border-teal-500/20 dark:border-teal-400/10 p-6 rounded-3xl space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
            <ShieldCheck size={20} className="animate-pulse" />
            <h2 className="text-xs font-black uppercase tracking-wider">Lobby Access Guard / Verifier</h2>
          </div>
          
          <form onSubmit={handleVerifyPass} className="flex flex-col sm:flex-row gap-3 max-w-xl">
            <div className="relative flex-1">
              <input 
                type="text" 
                maxLength="6"
                placeholder="Enter 6-Digit Gate Pass Code..." 
                value={verifyOtp}
                onChange={e => setVerifyOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-905 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-mono font-black tracking-widest focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all shadow-xs"
              />
            </div>
            <button
              type="submit"
              disabled={verifyingCode}
              className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 hover:-translate-y-0.5 active:translate-y-0 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/20 cursor-pointer disabled:opacity-50"
            >
              {verifyingCode ? "Verifying..." : "Verify & Grant Entry"}
            </button>
          </form>

          {verifyError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle size={14} />
              {verifyError}
            </div>
          )}

          {verifySuccess && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <Check size={14} className="text-emerald-500" />
                {verifySuccess}
              </div>
              {verifiedPass && (
                <div className="text-[10px] text-slate-500 pl-5">
                  Guest: <span className="font-semibold text-slate-800 dark:text-white">{verifiedPass.guest_name}</span> | 
                  Unit destination: <span className="font-semibold text-slate-800 dark:text-white">{verifiedPass.unit_no}</span> | 
                  Vehicle: <span className="font-semibold text-slate-800 dark:text-white">{verifiedPass.vehicle_no || 'None'}</span>
                </div>
              )}
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
            className="w-full bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-905 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25 transition-all shadow-xs"
          />
        </div>

        {/* Only residents and managers can create passes — guards only verify */}
        {!['security_guard', 'front_desk_concierge'].includes(role) && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/20 cursor-pointer whitespace-nowrap"
          >
            <Plus size={15} /> New Guest Pass
          </button>
        )}
      </div>

      {/* Grid ticket display */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw size={32} className="animate-spin text-teal-500 mb-3" />
          <span className="text-xs text-slate-455 font-mono">LOADING VISITOR JOURNAL...</span>
        </div>
      ) : filteredPasses.length === 0 ? (
        <div className="text-center py-20 bg-slate-50/50 dark:bg-[#162535] rounded-3xl border border-dashed border-slate-200 dark:border-white/10 text-slate-455 flex flex-col items-center justify-center p-6 animate-fade-in-scale">
          <Key size={40} className="stroke-[1.5] mb-3 text-slate-350 dark:text-slate-600" />
          <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No visitor passes generated.</p>
          <p className="text-xs mt-1">Submit guest names to generate unique entry tickets.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPasses.map((pass, idx) => (
            <div 
              key={pass.pass_id}
              className="bg-white dark:bg-[#1E2E42]/45 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[240px] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-indigo-500/5 group"
              style={{ 
                animationDelay: `${idx * 0.05}s`,
                borderLeftWidth: '6px',
                borderLeftColor: pass.status === 'ACTIVE' ? '#10B981' : pass.status === 'USED' ? '#3B82F6' : '#94A3B8'
              }}
            >
              {/* Top Accent Strip */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${
                pass.status === 'ACTIVE' ? 'from-emerald-400 to-teal-500' :
                pass.status === 'USED' ? 'from-blue-400 to-indigo-500' :
                'from-slate-400 to-slate-500'
              }`} />
              
              {/* Ticket header details */}
              <div className="p-5 space-y-4 flex-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider">
                    <Key size={10} className="text-teal-500" /> GUEST PASS
                  </div>
                  <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border ${
                    pass.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                    pass.status === 'USED' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                    'bg-slate-500/10 text-slate-550 border-slate-500/20'
                  }`}>
                    {pass.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    <User size={16} className="text-slate-450" /> {pass.guest_name}
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-1 text-xs text-slate-500 dark:text-slate-400">
                    {pass.guest_phone && (
                      <p className="flex items-center gap-2 font-medium">
                        <Phone size={12} className="text-slate-400" /> {pass.guest_phone}
                      </p>
                    )}
                    {pass.vehicle_no && (
                      <p className="flex items-center gap-2 font-medium">
                        <Car size={12} className="text-slate-400" /> Plate: <span className="font-mono text-slate-700 dark:text-slate-200 font-bold">{pass.vehicle_no}</span>
                      </p>
                    )}
                  </div>
                  
                  {/* Show check in timestamp */}
                  {(pass.check_in_time || pass.check_out_time) && (
                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-0.5">
                      {pass.check_in_time && (
                        <p className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">
                          In: {formatDate(pass.check_in_time)}
                        </p>
                      )}
                      {pass.check_out_time && (
                        <p className="text-[10px] text-slate-400 font-mono">
                          Out: {formatDate(pass.check_out_time)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Boarding ticket dashed line with correctly scaled circular cutouts */}
              <div className="relative">
                <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200/80 dark:border-white/10 shadow-inner z-10" />
                <div className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200/80 dark:border-white/10 shadow-inner z-10" />
                <div className="border-t border-dashed border-slate-200 dark:border-white/10 w-full" />
              </div>

              {/* Ticket Footer (Access Code Display & Actions) */}
              <div className="p-5 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-white/5">
                <div>
                  <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Access Code</p>
                  
                  <div className="flex items-center gap-1 mt-2">
                    {pass.otp_code?.split('').map((char, index) => (
                      <span 
                        key={index}
                        className="w-5.5 h-7 rounded-lg bg-white dark:bg-[#1E2E42] border border-slate-200/80 dark:border-white/15 flex items-center justify-center font-mono font-black text-xs text-teal-600 dark:text-teal-400 shadow-xs"
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* View Ticket QR Button */}
                  <button 
                    onClick={() => setSelectedPassForTicket(pass)}
                    className="p-2.5 bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 rounded-xl transition-all cursor-pointer shadow-xs flex items-center hover:scale-105 active:scale-95"
                    title="View Ticket / QR Code"
                  >
                    <QrCode size={14} />
                  </button>

                  <button 
                    onClick={() => copyPassInfo(pass)}
                    className="p-2.5 bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 rounded-xl transition-all cursor-pointer shadow-xs flex items-center hover:scale-105 active:scale-95"
                    title="Share Pass Details"
                  >
                    {copiedPassId === pass.pass_id ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
                  </button>

                  {/* Security check out option */}
                  {isSecurityOrStaff && pass.status === 'USED' && (
                    <button 
                      onClick={() => handleCheckOut(pass.pass_id)}
                      className="p-2.5 bg-rose-500/10 hover:bg-rose-600 border border-transparent hover:text-white rounded-xl text-rose-600 transition-all cursor-pointer shadow-xs flex items-center hover:scale-105 active:scale-95"
                      title="Check Out Guest"
                    >
                      <LogOut size={14} />
                    </button>
                  )}

                  {/* Delete pass option (only for managers or the resident who created it) */}
                  {!['security_guard', 'front_desk_concierge'].includes(role) && (
                    <button 
                      onClick={() => handleDeletePass(pass.pass_id)}
                      className="p-2.5 bg-rose-550/10 hover:bg-rose-600 border border-transparent hover:text-white rounded-xl text-rose-600 transition-all cursor-pointer shadow-xs flex items-center hover:scale-105 active:scale-95"
                      title="Delete Entry Pass"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E2E42] rounded-3xl border border-slate-200 dark:border-white/10 w-full max-w-md max-h-[95vh] overflow-y-auto custom-scrollbar shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-[#162535]">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span></span> Generate Guest Entry Pass
              </h3>
              <button 
                onClick={() => { setShowAddModal(false); }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-semibold text-sm cursor-pointer"
              >
                
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Guest Full Name <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-905 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Guest Phone Number (Optional)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-sm text-slate-400 font-mono">+1</span>
                  <input 
                    type="text"
                    maxLength={14}
                    placeholder="(555) 019-2834"
                    value={guestPhone}
                    onChange={e => setGuestPhone(formatPhoneAsYouType(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-905 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Vehicle License Plate (Optional)</label>
                <input 
                  type="text"
                  maxLength={10}
                  placeholder="e.g. CA 7XYZ99"
                  value={vehicleNo}
                  onChange={e => setVehicleNo(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-905 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-mono uppercase"
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

      {/* Access Pass Ticket QR Modal */}
      {selectedPassForTicket && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#162535] rounded-3xl border border-white/10 w-full max-w-sm max-h-[95vh] overflow-y-auto custom-scrollbar shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-white relative">
            
            {/* Header Ticket Pattern */}
            <div className="p-6 bg-gradient-to-br from-teal-600 to-emerald-600 flex justify-between items-center relative">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-white/70 font-black">Entry Permit</p>
                <h4 className="text-sm font-black truncate">{community?.name || 'Condo Building'}</h4>
              </div>
              <button 
                onClick={() => setSelectedPassForTicket(null)}
                className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                
              </button>
            </div>

            {/* Circular indents for ticket aesthetic */}
            <div className="relative h-1">
              <div className="absolute -left-3.5 -top-2 w-7 h-7 rounded-full bg-black/90" />
              <div className="absolute -right-3.5 -top-2 w-7 h-7 rounded-full bg-black/90" />
            </div>

            {/* Ticket body details */}
            <div className="p-6 space-y-6 flex flex-col items-center">
              
              {/* QR Code container */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-lg">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${selectedPassForTicket.otp_code}`} 
                  alt="Visitor QR Code" 
                  className="w-44 h-44 block"
                />
              </div>

              {/* Bold 6-digit text */}
              <div className="text-center space-y-1">
                <p className="text-[8px] uppercase tracking-widest text-slate-400 font-bold">Lobby Access Code</p>
                <div className="flex gap-1.5 justify-center mt-1">
                  {selectedPassForTicket.otp_code?.split('').map((char, index) => (
                    <span 
                      key={index}
                      className="w-7 h-8 rounded-lg bg-[#1E2E42] border border-white/10 flex items-center justify-center font-mono font-black text-sm text-teal-400 shadow-md"
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </div>

              {/* Guest metadata details */}
              <div className="w-full space-y-2 border-t border-dashed border-white/10 pt-4 text-xs font-sans text-slate-350">
                <div className="flex justify-between">
                  <span>Guest Name:</span>
                  <span className="font-bold text-white">{selectedPassForTicket.guest_name}</span>
                </div>
                {selectedPassForTicket.guest_phone && (
                  <div className="flex justify-between">
                    <span>Contact:</span>
                    <span className="font-bold text-white">{selectedPassForTicket.guest_phone}</span>
                  </div>
                )}
                {selectedPassForTicket.vehicle_no && (
                  <div className="flex justify-between">
                    <span>Vehicle Plate:</span>
                    <span className="font-bold text-white">{selectedPassForTicket.vehicle_no}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Destination:</span>
                  <span className="font-bold text-white">Unit {user?.unit_no || 'N/A'}</span>
                </div>
                
                {selectedPassForTicket.check_in_time && (
                  <div className="flex justify-between pt-1 border-t border-white/5 text-[10px] text-teal-400 font-mono">
                    <span>Checked In:</span>
                    <span>{formatDate(selectedPassForTicket.check_in_time)}</span>
                  </div>
                )}
              </div>

              <div className="w-full flex gap-3.5 mt-2">
                <button
                  onClick={() => copyPassInfo(selectedPassForTicket)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedPassId === selectedPassForTicket.pass_id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  Copy Invitation
                </button>
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Custom Centered Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
}
