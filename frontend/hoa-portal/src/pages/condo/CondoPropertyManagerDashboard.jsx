import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, FileText, CheckCircle2, XCircle, 
  Plus, RefreshCw, Eye, EyeOff, ShieldCheck, Mail, Phone, Home, File
} from 'lucide-react';
import API, { getBaseUrl } from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';

export default function CondoPropertyManagerDashboard({ user, setActivePage }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Invite Resident Modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteFirst, setInviteFirst] = useState('');
  const [inviteLast, setInviteLast] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteUnit, setInviteUnit] = useState('');
  const [inviting, setInviting] = useState(false);

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

  useEffect(() => {
    if (commId) {
      fetchRequests();
    }
  }, [commId]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get(`/condo/community/${commId}/join-requests/pending`);
      setRequests(res.data || []);
    } catch (err) {
      console.error("Failed to load building requests:", err);
      setError(err?.response?.data?.detail || "Failed to load pending resident requests.");
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

    try {
      setInviting(true);
      await API.post('/condo/community/invite', {
        first_name: inviteFirst,
        last_name: inviteLast,
        email_id: inviteEmail,
        mobile_number: invitePhone,
        unit_no: inviteUnit,
        community_id: commId
      });

      showAlert("Success", "Invitation sent successfully! Resident account created.", "success");
      setInviteFirst('');
      setInviteLast('');
      setInviteEmail('');
      setInvitePhone('');
      setInviteUnit('');
      setShowInviteModal(false);
    } catch (err) {
      console.error("Invite Error:", err);
      showAlert("Error", err.response?.data?.detail || "Failed to send invitation.", "danger");
    } finally {
      setInviting(false);
    }
  };

  const getDocUrl = (url) => {
    if (!url) return '#';
    if (url.startsWith('http')) return url;
    return getBaseUrl(url.startsWith('/') ? url : '/' + url);
  };

  return (
    <div className="p-3 sm:p-5 space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-white font-sans">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/90 to-sky-50/80 dark:from-[#162535] dark:via-[#1A2E44] dark:to-[#162535] text-slate-900 dark:text-white p-4 sm:p-5 border border-indigo-100 dark:border-white/10 shadow-sm">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-400/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-100 dark:bg-indigo-500/20 border border-blue-200 dark:border-indigo-400/30 text-blue-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-2 shadow-xs">
              <ShieldCheck size={13} className="text-blue-600 dark:text-indigo-400" /> Tower Administrator
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-1">
              {commName} Manager Portal
            </h1>
            <p className="text-slate-600 dark:text-slate-300/90 text-xs sm:text-sm max-w-2xl leading-normal">
              Review and approve building access requests, verify address proofs, and invite residents to register.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchRequests}
              disabled={loading}
              className="px-3.5 py-2 bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 text-slate-800 dark:text-white rounded-xl text-xs font-bold border border-slate-200 dark:border-white/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh Requests
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-md"
            >
              <Plus size={14} /> Invite Resident
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#162535] p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">My Condo Building</p>
            <h4 className="text-lg font-bold truncate max-w-xs">{commName}</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-[#162535] p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Awaiting Approvals</p>
            <h4 className="text-xl font-bold">{loading ? "..." : requests.length} Join Requests</h4>
          </div>
        </div>
      </div>

      {/* Pending Approvals Table */}
      <div className="bg-white dark:bg-[#162535] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-white/10">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="text-blue-500" size={18} /> Pending Resident Join Requests
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verify identity and address documents submitted by residents.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-white/10">
                <th className="py-3 px-5">Resident Name</th>
                <th className="py-3 px-5">Email ID</th>
                <th className="py-3 px-5">Unit / Apt</th>
                <th className="py-3 px-5">Documents</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-slate-450 font-mono">Loading pending requests...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-slate-450">No pending join requests found.</td>
                </tr>
              ) : (
                requests.map(r => (
                  <tr key={r.request_id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-5 font-bold">
                      {r.full_name}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 dark:text-gray-400">
                      {r.email_id}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-indigo-600 dark:text-indigo-400">
                      {r.unit_no || 'N/A'}
                    </td>
                    <td className="py-3.5 px-5 space-x-2">
                      {r.id_proof_url && (
                        <a 
                          href={getDocUrl(r.id_proof_url)} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 hover:underline font-bold text-[10px]"
                        >
                          ID Proof 📄
                        </a>
                      )}
                      {r.address_proof_url && (
                        <a 
                          href={getDocUrl(r.address_proof_url)} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 hover:underline font-bold text-[10px]"
                        >
                          Addr Proof 📄
                        </a>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right space-x-2">
                      <button
                        onClick={() => setSelectedReq(r)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-gray-200 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Request Modal Dialog */}
      {selectedReq && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#162535] border border-slate-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 relative shadow-2xl text-slate-900 dark:text-white">
            <h3 className="text-lg font-black mb-1 flex items-center gap-2">
              <Building2 className="text-blue-500" size={22} />
              Review Join Request
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-4">
              Reviewing submission from <span className="font-bold text-slate-950 dark:text-white">{selectedReq.full_name}</span> for unit <span className="font-bold">{selectedReq.unit_no}</span>.
            </p>

            <div className="space-y-3 mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Email Address</p>
                <p className="text-xs font-medium">{selectedReq.email_id}</p>
              </div>
              <div className="flex gap-4">
                <a href={getDocUrl(selectedReq.id_proof_url)} target="_blank" rel="noreferrer" className="flex-1 p-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-center hover:border-blue-500 transition font-bold text-xs text-blue-500">
                  Open ID Proof 📄
                </a>
                <a href={getDocUrl(selectedReq.address_proof_url)} target="_blank" rel="noreferrer" className="flex-1 p-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-center hover:border-emerald-500 transition font-bold text-xs text-emerald-500">
                  Open Address Proof 📄
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 tracking-wider mb-1 uppercase">Admin Review Notes (Optional)</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="e.g. Identity and address matched matching building record"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 h-20 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedReq(null)}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-gray-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAction(selectedReq.request_id, 'REJECT')}
                  disabled={processingId === selectedReq.request_id}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-250 transition cursor-pointer"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleAction(selectedReq.request_id, 'APPROVE')}
                  disabled={processingId === selectedReq.request_id}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 transition cursor-pointer"
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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#162535] border border-slate-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 relative shadow-2xl text-slate-900 dark:text-white">
            <button 
              onClick={() => setShowInviteModal(false)}
              className="absolute right-4 top-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-650 cursor-pointer"
            >
              <XCircle size={18} />
            </button>
            
            <h3 className="text-lg font-black mb-1 flex items-center gap-2">
              <Plus className="text-blue-500" size={22} />
              Invite Resident
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-6">
              Create a pre-verified resident account and mail their temporary password.
            </p>

            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 tracking-wider mb-1 uppercase">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="John"
                    value={inviteFirst}
                    onChange={(e) => setInviteFirst(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 tracking-wider mb-1 uppercase">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Doe"
                    value={inviteLast}
                    onChange={(e) => setInviteLast(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 tracking-wider mb-1 uppercase">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="john.doe@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 tracking-wider mb-1 uppercase">Unit / Apt No</label>
                  <input
                    type="text"
                    placeholder="e.g. 4B"
                    value={inviteUnit}
                    onChange={(e) => setInviteUnit(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 tracking-wider mb-1 uppercase">Phone Number</label>
                  <input
                    type="text"
                    placeholder="(123) 456-7890"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={inviting}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-lg disabled:opacity-50 cursor-pointer mt-4"
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
