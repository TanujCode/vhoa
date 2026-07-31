import React, { useState, useEffect } from 'react';
import { Check, X, ClipboardList, ShieldAlert, Calendar, User, ArrowRight, CornerDownRight, MessageSquare, AlertCircle } from 'lucide-react';
import API from '../services/api';
import { toast } from 'react-hot-toast';

const ChangeRequests = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await API.get('/community/change-requests/all');
      setRequests(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load change requests.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reqId) => {
    if (!await window.customConfirm("Are you sure you want to approve this request? It will automatically apply name/size updates and recalculate pricing tiers.")) return;
    
    try {
      setActionLoading(true);
      await API.put(`/community/change-requests/${reqId}/review`, {
        action: 'APPROVE'
      });
      toast.success("Request approved and community updated!");
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Approval failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = (req) => {
    setSelectedRequest(req);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }

    try {
      setActionLoading(true);
      await API.put(`/community/change-requests/${selectedRequest.id}/review`, {
        action: 'REJECT',
        rejection_reason: rejectionReason.trim()
      });
      toast.success("Request rejected.");
      setShowRejectModal(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Rejection failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (activeTab === 'ALL') return true;
    return r.status === activeTab;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/25';
      case 'APPROVED':
        return 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/25';
      case 'REJECTED':
        return 'bg-red-500/10 text-red-500 dark:bg-red-500/20 dark:text-red-300 border border-red-500/25';
      default:
        return 'bg-slate-500/10 text-slate-550 border border-slate-500/25';
    }
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-white">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
          <ClipboardList className="text-blue-600 dark:text-blue-400" />
          Community Change Requests
        </h1>
        <p className="text-slate-500 dark:text-gray-400 mt-1">Review requests from Property Managers to update community names or sizes.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-white/10 pb-px">
        {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((tab) => {
          const count = tab === 'ALL' ? requests.length : requests.filter(r => r.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 text-sm font-semibold tracking-wide transition-all border-b-2 relative ${
                activeTab === tab 
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                  : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-white/5 font-mono text-slate-650 dark:text-slate-400">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-20 text-gray-400 font-mono text-sm">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          FETCHING COMMUNITY REQUEST QUEUE...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-20 bg-slate-50/50 dark:bg-[#1E2E42]/20 border border-slate-200 dark:border-white/5 rounded-3xl text-gray-500 dark:text-gray-400">
          <AlertCircle size={40} className="mx-auto mb-3 opacity-40 text-blue-600 dark:text-blue-400" />
          <p className="text-sm">No change requests found in this pool.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm dark:shadow-none hover:border-slate-300 dark:hover:border-white/20 transition-all flex flex-col md:flex-row md:items-start justify-between gap-6"
            >
              <div className="flex-1 space-y-4">
                
                {/* Community and Status */}
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{req.community_name}</h3>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${getStatusBadge(req.status)}`}>
                    {req.status}
                  </span>
                </div>

                {/* Old vs. Requested Values */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {req.requested_name && (
                    <div className="bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/5 p-3 rounded-2xl">
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Requested Name Change</div>
                      <div className="flex items-center gap-2 mt-1.5 text-sm font-medium">
                        <span className="text-slate-500 line-through truncate max-w-[150px]">{req.community_name}</span>
                        <ArrowRight size={14} className="text-slate-400 shrink-0" />
                        <span className="text-blue-600 dark:text-blue-400 font-bold truncate">{req.requested_name}</span>
                      </div>
                    </div>
                  )}
                  {req.requested_units !== null && (
                    <div className="bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/5 p-3 rounded-2xl">
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Requested Units/Plan Upgrade</div>
                      <div className="flex flex-col gap-1 mt-1 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 line-through">Old Size</span>
                          <ArrowRight size={14} className="text-slate-400 shrink-0" />
                          <span className="text-blue-600 dark:text-blue-400 font-bold">{req.requested_units} Units</span>
                        </div>
                        <div className="text-[10px] text-indigo-650 dark:text-indigo-400 flex items-center gap-1 font-bold uppercase tracking-wide mt-1">
                          <CornerDownRight size={10} />
                          Calculated Tier: {req.new_plan} (${req.new_monthly_price}/mo)
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reason */}
                <div className="bg-slate-100/50 dark:bg-[#0D1B2A]/40 p-4 rounded-2xl border border-slate-200/40 dark:border-white/5 flex items-start gap-2.5">
                  <MessageSquare size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-655 dark:text-slate-300 leading-relaxed"><span className="font-semibold text-slate-800 dark:text-white">Reason:</span> {req.reason || 'No description provided.'}</p>
                </div>

                {/* Rejection Reason (If rejected) */}
                {req.status === 'REJECTED' && req.rejection_reason && (
                  <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-2xl flex items-start gap-2.5 text-red-650 dark:text-red-400">
                    <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed"><span className="font-bold">Rejection Reason:</span> {req.rejection_reason}</p>
                  </div>
                )}

                {/* User Info & Date metadata */}
                <div className="flex items-center gap-6 text-xs text-slate-400 dark:text-gray-500 font-sans">
                  <span className="flex items-center gap-1.5">
                    <User size={13} />
                    PM: {req.requested_by_name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    Submitted: {new Date(req.created_at).toLocaleDateString()}
                  </span>
                  {req.reviewed_by_name && (
                    <span className="flex items-center gap-1.5">
                      <Check size={13} className="text-emerald-500" />
                      Reviewed: {req.reviewed_by_name}
                    </span>
                  )}
                </div>

              </div>

              {/* Actions for Pending Requests */}
              {req.status === 'PENDING' && (
                <div className="flex sm:flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleApprove(req.id)}
                    className="flex-1 py-3 px-5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-2xl text-xs uppercase tracking-wider transition duration-200 active:scale-95 shadow-md shadow-blue-600/10 flex items-center justify-center gap-1.5 disabled:opacity-55"
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleRejectClick(req)}
                    className="flex-1 py-3 px-5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-semibold rounded-2xl text-xs uppercase tracking-wider transition duration-200 active:scale-95 border border-red-500/20 flex items-center justify-center gap-1.5 disabled:opacity-55"
                  >
                    <X size={14} /> Reject
                  </button>
                </div>
              )}

            </div>
          ))}
        </div>
      )}

      {/* Reject Modal dialog overlay */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[110] p-4">
          <form onSubmit={handleRejectSubmit} className="bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-white/10">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Reject Change Request</h3>
              <p className="text-xs text-slate-500 mt-1">Explain why you are rejecting the changes requested for {selectedRequest?.community_name}.</p>
            </div>
            
            <div className="p-6">
              <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Rejection Reason *</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
                rows="4"
                className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl p-3.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 resize-none placeholder-slate-400"
                placeholder="Provide feedback on why the request was rejected (e.g. units mismatch, plan verification required)..."
              />
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-white/10 flex gap-3">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-3.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl text-slate-500 dark:text-gray-400 text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 py-3.5 bg-red-500 text-white hover:bg-red-650 rounded-2xl text-sm font-semibold transition active:scale-95 shadow-md shadow-red-500/20 disabled:opacity-50"
              >
                Reject Request
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default ChangeRequests;
