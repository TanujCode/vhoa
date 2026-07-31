import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  Wrench, Plus, RefreshCw, X, ChevronDown, UserCheck, 
  Clock, User, Filter, Zap, Shield, Sparkles, Wind, Droplets, 
  Search, ChevronUp, AlertCircle, Edit, Hammer, DollarSign, Landmark, Copy, Check
} from 'lucide-react';
import API from '../../services/api';
import { validateTicketTitle, validateTicketDescription } from '../../utils/fieldValidators';
import ConfirmModal from '../../components/ConfirmModal';

const StatusBadge = ({ status }) => {
  const map = {
    OPEN:            'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    IN_PROGRESS:     'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300',
    VENDOR_ASSIGNED: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
    RESOLVED:        'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-455',
    CLOSED:          'bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400',
    CANCELLED:       'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const config = {
    LOW: { label: 'Low', color: 'bg-green-500 text-green-600 dark:text-green-400' },
    MEDIUM: { label: 'Medium', color: 'bg-yellow-500 text-yellow-600 dark:text-yellow-400 font-medium' },
    HIGH: { label: 'High', color: 'bg-red-500 text-red-600 dark:text-red-400' },
    URGENT: { label: 'Urgent', color: 'bg-red-500 text-red-600 dark:text-red-400' }
  };
  const item = config[priority] || { label: priority, color: 'bg-gray-400 text-gray-500 dark:text-gray-400' };
  const parts = item.color.split(' ');
  const circleColor = parts[0];
  const textColor = parts.slice(1).join(' ');
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${textColor}`}>
      {item.label} <span className={`w-2 h-2 rounded-full ${circleColor}`}></span>
    </span>
  );
};

const getCategoryIconDetails = (catName) => {
  const name = (catName || '').toLowerCase();
  if (name.includes('elevator') || name.includes('lift')) {
    return { Icon: Wind, bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400' };
  }
  if (name.includes('plumb') || name.includes('leak') || name.includes('water') || name.includes('pipe') || name.includes('drain')) {
    return { Icon: Droplets, bg: 'bg-sky-500/10 dark:bg-sky-500/20', text: 'text-sky-600 dark:text-sky-400' };
  }
  if (name.includes('elect') || name.includes('light') || name.includes('power') || name.includes('wire') || name.includes('bulb')) {
    return { Icon: Zap, bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400' };
  }
  if (name.includes('lobby') || name.includes('hall')) {
    return { Icon: Sparkles, bg: 'bg-rose-500/10 dark:bg-rose-500/20', text: 'text-rose-600 dark:text-rose-455' };
  }
  if (name.includes('roof') || name.includes('ceiling')) {
    return { Icon: Hammer, bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' };
  }
  if (name.includes('parking') || name.includes('garage') || name.includes('driveway')) {
    return { Icon: Shield, bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400' };
  }
  return { Icon: Wrench, bg: 'bg-slate-500/10 dark:bg-slate-500/20', text: 'text-slate-600 dark:text-slate-400' };
};

// ==================== SUBMIT MODAL ====================
const SubmitModal = ({ communityId, onClose, onSuccess, showAlert }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    category: 'OTHER',
    priority: 'MEDIUM' 
  });

  const categories = ["ELEVATOR", "PLUMBING", "ELECTRICAL", "LOBBY", "ROOFING", "PARKING", "OTHER"];
  const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

  const handleSubmit = async (e) => {
    e.preventDefault();

    const titleErr = validateTicketTitle(form.title);
    if (titleErr !== true) {
      showAlert("Validation Error", titleErr, "warning");
      return;
    }

    const descErr = validateTicketDescription(form.description);
    if (descErr !== true) {
      showAlert("Validation Error", descErr, "warning");
      return;
    }

    setLoading(true);
    try {
      await API.post('/condo/operations/maintenance', { 
        community_id: communityId, 
        title: form.title, 
        description: form.description, 
        category: form.category,
        priority: form.priority 
      });
      onSuccess(); 
      onClose();
    } catch (err) { 
      showAlert("Error", err.response?.data?.detail || 'Error submitting request', "danger"); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:from-[#1E2E42] dark:to-[#162535] dark:bg-gradient-to-br rounded-3xl p-6 w-full max-w-md border border-slate-200/80 dark:border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar text-slate-900 dark:text-white shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">New Maintenance Request</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Title <span className="text-red-500">*</span></label>
            <input 
              required 
              type="text" 
              placeholder="e.g. Lobby light flickering..." 
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Detailed Description <span className="text-red-500">*</span></label>
            <textarea 
              required 
              rows={4} 
              placeholder="Please provide details about the location, issue, timings..." 
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Category</label>
              <div className="relative">
                <select
                  value={form.category}
                  onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl pl-4 pr-10 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Priority</label>
              <div className="relative">
                <select
                  value={form.priority}
                  onChange={e => setForm({...form, priority: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl pl-4 pr-10 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                >
                  {priorities.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-sm font-medium cancel-button-red-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-medium transition disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================== STATUS UPDATE MODAL ====================
const StatusModal = ({ request, onClose, onSuccess, showAlert }) => {
  const [status, setStatus] = useState(request.status || 'OPEN');
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [vendorId, setVendorId] = useState('');
  const [vendorsLoading, setVendorsLoading] = useState(false);

  const statuses = ['OPEN', 'IN_PROGRESS', 'VENDOR_ASSIGNED', 'RESOLVED', 'CLOSED', 'CANCELLED'];

  useEffect(() => {
    if (status === 'VENDOR_ASSIGNED' && request.community_id && vendors.length === 0) {
      setVendorsLoading(true);
      API.get(`/condo/vendor/${request.community_id}`)
        .then(res => setVendors(res.data || []))
        .catch(err => console.error("Error loading condo vendors:", err))
        .finally(() => setVendorsLoading(false));
    }
  }, [status, request.community_id, vendors.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'VENDOR_ASSIGNED' && !vendorId) {
      showAlert("Error", "Please select a vendor to assign.", "warning");
      return;
    }

    setLoading(true);
    try {
      const payload = { status };
      if (status === 'VENDOR_ASSIGNED' && vendorId) {
        payload.assigned_vendor_id = parseInt(vendorId);
      }
      await API.put(`/condo/operations/maintenance/${request.request_id}/status`, payload);
      onSuccess();
      onClose();
    } catch (err) { 
      showAlert("Error", err.response?.data?.detail || 'Error updating status', "danger"); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 animate-fadeIn">
      <div className="bg-white dark:from-[#1E2E42] dark:to-[#162535] dark:bg-gradient-to-br rounded-3xl p-6 w-full max-w-sm border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Update Status</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"><X size={20} /></button>
        </div>
        <p className="text-slate-500 dark:text-gray-400 text-sm mb-4 truncate">{request.title}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">New Status</label>
            <div className="relative">
              <select 
                required 
                value={status} 
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl pl-4 pr-10 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
              >
                {statuses.map(s => (
                  <option key={s} value={s} className="text-slate-900 dark:text-white">{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={18} />
            </div>
          </div>

          {status === 'VENDOR_ASSIGNED' && (
            <div>
              <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block font-bold">Assign Vendor</label>
              <div className="relative">
                <select
                  required
                  value={vendorId}
                  onChange={e => setVendorId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl pl-4 pr-10 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                >
                  <option value="">{vendorsLoading ? 'Loading vendors...' : 'Select vendor...'}</option>
                  {vendors.map(v => (
                    <option key={v.vendor_id} value={v.vendor_id} className="text-slate-900 dark:text-white">
                      {v.company_name} ({v.category})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={18} />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl text-sm font-medium cancel-button-red-hover"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-505 text-white rounded-2xl text-sm font-medium disabled:opacity-50 transition animate-glow">
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================== DETAIL DRILL-DOWN DRAWER ====================
const DetailDrawer = ({ 
  request, 
  user, 
  canManage, 
  onClose, 
  onStatusUpdate, 
  formatDate,
  onRefresh,
  showAlert,
  setConfirmConfig
}) => {
  const [vendorDetails, setVendorDetails] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // Quote & Payout States
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptNo, setReceiptNo] = useState('');
  const [serviceLocation, setServiceLocation] = useState('');
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);

  const [vccInput, setVccInput] = useState('');
  const [vccVerified, setVccVerified] = useState(false);
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);

  const [generatingVAC, setGeneratingVAC] = useState(false);
  const [generatingVCC, setGeneratingVCC] = useState(false);

  const isAdmin = ['super_admin', 'property_manager'].includes((user?.role_name || user?.role || '').toLowerCase());
  const isOwner = request.created_by_id === user?.user_id;

  const fetchVendorDetails = () => {
    if (request.assigned_vendor_id) {
      API.get(`/condo/vendor/detail/${request.assigned_vendor_id}`)
        .then(res => setVendorDetails(res.data))
        .catch(err => {
          console.error("Error fetching condo vendor details:", err);
          setVendorDetails(null);
        });
    } else {
      setVendorDetails(null);
    }
  };

  const fetchAssignments = () => {
    if (request?.request_id && request?.community_id) {
      setAssignmentsLoading(true);
      API.get(`/condo/vendor/assignment/${request.community_id}`, {
        params: { request_id: request.request_id }
      })
      .then(res => {
        setAssignments(res.data || []);
      })
      .catch(err => {
        console.error("Error fetching condo assignments:", err);
      })
      .finally(() => setAssignmentsLoading(false));
    } else {
      setAssignments([]);
    }
  };

  useEffect(() => {
    fetchVendorDetails();
  }, [request.assigned_vendor_id]);

  useEffect(() => {
    fetchAssignments();
  }, [request?.request_id, request?.community_id]);

  const handleGenerateAccessCode = async () => {
    setGeneratingVAC(true);
    try {
      await API.post(`/condo/vendor/${request.assigned_vendor_id}/access-code`);
      fetchVendorDetails();
      showAlert("Success", "Vendor Access Code generated successfully!", "success");
    } catch (e) {
      showAlert("Error", e.response?.data?.detail || "Failed to generate Access Code", "danger");
    } finally {
      setGeneratingVAC(false);
    }
  };

  const handleGenerateContractCode = async () => {
    setGeneratingVCC(true);
    try {
      await API.post(`/condo/vendor/${request.assigned_vendor_id}/contract-code`);
      fetchVendorDetails();
      showAlert("Success", "Vendor Contract Code generated successfully!", "success");
    } catch (e) {
      showAlert("Error", e.response?.data?.detail || "Failed to generate Contract Code", "danger");
    } finally {
      setGeneratingVCC(false);
    }
  };

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    if (!quoteAmount || isNaN(quoteAmount) || parseFloat(quoteAmount) <= 0) {
      showAlert("Validation Error", "Please enter a valid quote amount.", "warning");
      return;
    }
    setQuoteSubmitting(true);
    try {
      let assignmentToUpdate = assignments[0];
      if (!assignmentToUpdate) {
        // Automatically create a CondoVendorAssignment record on the fly
        const createRes = await API.post('/condo/vendor/assignment', {
          vendor_id: request.assigned_vendor_id,
          request_id: request.request_id,
          community_id: request.community_id,
          service_location: serviceLocation || null
        });
        assignmentToUpdate = createRes.data;
      }
      await API.put(`/condo/vendor/assignment/${assignmentToUpdate.assignment_id}`, {
        quote_amount: parseFloat(quoteAmount),
        quote_date: quoteDate,
        vendor_receipt_no: receiptNo || null,
        service_location: serviceLocation || null,
        status: "QUOTE_GIVEN"
      });
      showAlert("Success", "Quote details submitted successfully!", "success");
      setQuoteAmount('');
      setReceiptNo('');
      setServiceLocation('');
      onRefresh(); // refresh parent requests list
      fetchAssignments();
    } catch (err) {
      showAlert("Error", err.response?.data?.detail || "Error submitting quote details", "danger");
    } finally {
      setQuoteSubmitting(false);
    }
  };

  const handleVerifyVCC = (e) => {
    e.preventDefault();
    if (!vccInput.trim()) {
      showAlert("Validation Error", "Please enter the Contract Code (VCC).", "warning");
      return;
    }
    const targetCode = vendorDetails?.contract_code;
    if (!targetCode) {
      showAlert("Error", "Contract Code not found for this vendor.", "danger");
      return;
    }
    if (vccInput.trim().toUpperCase() === targetCode.toUpperCase()) {
      setVccVerified(true);
      showAlert("Success", "Contract Code verified successfully! You can now disburse the payment.", "success");
    } else {
      setVccVerified(false);
      showAlert("Error", "Invalid Contract Code. Please check the code and try again.", "danger");
    }
  };

  const handleDisbursePayout = async () => {
    if (!vccVerified) {
      showAlert("Verification Needed", "Please verify the Contract Code (VCC) first.", "warning");
      return;
    }
    const activeAssignment = assignments[0];
    if (!activeAssignment) {
      showAlert("Error", "No active vendor assignment found.", "danger");
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: "Confirm Payout",
      message: `Disburse payout of $${activeAssignment.quote_amount.toFixed(2)} to ${vendorDetails?.company_name || 'Vendor'}?`,
      confirmText: "Yes, Disburse",
      cancelText: "Cancel",
      type: "info",
      singleButton: false,
      onConfirm: async () => {
        setPayoutSubmitting(true);
        try {
          // Log payment inside Condo Operations payments
          await API.post('/condo/operations/payments', {
            community_id: activeAssignment.community_id,
            amount: activeAssignment.quote_amount,
            payment_type: 'VENDOR_ASSIGNMENT',
            payment_method: 'BANK_TRANSFER',
            notes: `Payout disbursed to ${vendorDetails?.company_name || 'Vendor'} for Request #${request.request_id}`
          });
          // Update assignment status
          await API.put(`/condo/vendor/assignment/${activeAssignment.assignment_id}`, {
            status: "COMPLETED"
          });
          // Update request status
          await API.put(`/condo/operations/maintenance/${request.request_id}/status`, {
            status: "CLOSED"
          });

          showAlert("Success", "Payout disbursed successfully! The maintenance request is now CLOSED.", "success");
          setVccInput('');
          setVccVerified(false);
          onRefresh(); // refresh parent requests list
          fetchAssignments();
        } catch (err) {
          showAlert("Error", err.response?.data?.detail || "Error disbursing payout", "danger");
        } finally {
          setPayoutSubmitting(false);
        }
      }
    });
  };

  const handleAcceptAndPayQuote = async (assignment) => {
    setConfirmConfig({
      isOpen: true,
      title: "Accept & Pay Quote",
      message: `Accept quote of $${assignment.quote_amount.toFixed(2)} and deposit funds into escrow?`,
      confirmText: "Accept & Pay",
      cancelText: "Cancel",
      type: "info",
      singleButton: false,
      onConfirm: async () => {
        try {
          // Create escrow payment log
          await API.post('/condo/operations/payments', {
            community_id: assignment.community_id,
            amount: assignment.quote_amount,
            payment_type: 'ESCROW_DEPOSIT',
            payment_method: 'ACH',
            notes: `Escrow payment for Request #${request.request_id}`
          });
          // Update assignment status
          await API.put(`/condo/vendor/assignment/${assignment.assignment_id}`, {
            status: "APPROVED"
          });
          showAlert("Success", "Escrow deposit successful! Vendor will start the work shortly.", "success");
          onRefresh();
          fetchAssignments();
        } catch (err) {
          showAlert("Error", err.response?.data?.detail || "Error depositing payment", "danger");
        }
      }
    });
  };

  const activeAssignment = assignments[0];

  return (
    <div className="flex flex-col h-full text-slate-900 dark:text-white">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50/20 dark:from-[#1E2E42] dark:to-[#162535]">
        <div className="flex items-center gap-2">
          {(() => {
            const details = getCategoryIconDetails(request.category);
            const RequestIcon = details.Icon;
            return <RequestIcon className="text-blue-600 dark:text-blue-400" size={20} />;
          })()}
          <h3 className="text-lg font-semibold truncate max-w-[280px] text-slate-900 dark:text-white">Request #{request.request_id}</h3>
        </div>
        <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-xl text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition cursor-pointer">
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {/* Title & Status */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">{request.title}</h2>
        </div>

        {/* Description */}
        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/5">
          <h4 className="text-xs text-slate-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-2">Description</h4>
          <p className="text-slate-700 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{request.description}</p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
            <span className="text-xs text-slate-500 dark:text-gray-400">Category</span>
            <span className="text-sm font-semibold mt-1 text-slate-800 dark:text-white">{request.category || 'OTHER'}</span>
          </div>
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
            <span className="text-xs text-slate-500 dark:text-gray-400">Unit Number</span>
            <span className="text-sm font-semibold mt-1 text-slate-800 dark:text-white truncate">{request.unit_no || 'Common Area'}</span>
          </div>
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
            <span className="text-xs text-slate-500 dark:text-gray-400">Submitted By</span>
            <span className="text-sm font-semibold mt-1 text-slate-800 dark:text-white truncate">{request.created_by_name || 'System'}</span>
          </div>
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
            <span className="text-xs text-slate-500 dark:text-gray-400">Created Date</span>
            <span className="text-xs font-mono font-semibold mt-1 text-slate-700 dark:text-gray-300">{formatDate(request.created_date)}</span>
          </div>
        </div>

        {/* Vendor and Payment Details */}
        {(request.assigned_vendor_id || isAdmin) && (
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/5 space-y-3.5 animate-fadeIn">
            <h4 className="text-xs text-slate-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Assignments & Links</h4>
            
            <div className="flex justify-between items-center text-sm border-b border-slate-200 dark:border-white/5 pb-2">
              <span className="text-slate-500 dark:text-gray-400 flex items-center gap-1.5"><User size={15} /> Vendor</span>
              <span className="font-medium text-slate-800 dark:text-white text-right">
                {request.assigned_vendor_id ? (
                  vendorDetails ? `${vendorDetails.company_name} (ID: ${request.assigned_vendor_id})` : `Vendor ID: ${request.assigned_vendor_id}`
                ) : 'Unassigned'}
              </span>
            </div>
          </div>
        )}

        {/* Vendor Access & Codes */}
        {request.assigned_vendor_id && (
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/5 space-y-3.5 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-2">
              <h4 className="text-xs text-slate-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Vendor Codes</h4>
              <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-0.5 rounded-full font-semibold">SECURITY</span>
            </div>
            
            <div className="space-y-3">
              {/* VAC Code */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-gray-400">Vendor Access Code (VAC):</span>
                  {vendorDetails?.vendor_access_code ? (
                    <span className="font-mono font-bold px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded">
                      {vendorDetails.vendor_access_code} {vendorDetails.access_code_used ? "(Used)" : ""}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-gray-500 italic">Not Generated</span>
                  )}
                </div>
                {isAdmin && (!vendorDetails?.vendor_access_code || vendorDetails?.access_code_used || (vendorDetails?.access_code_expiry && new Date(vendorDetails.access_code_expiry) < new Date())) && (
                  <button
                    onClick={handleGenerateAccessCode}
                    disabled={generatingVAC}
                    className="self-end mt-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-[11px] font-semibold text-white rounded-lg transition disabled:opacity-50 cursor-pointer"
                  >
                    {generatingVAC ? "Generating..." : "Generate VAC"}
                  </button>
                )}
              </div>

              {/* VCC Code */}
              <div className="flex flex-col gap-1 border-t border-slate-100 dark:border-white/5 pt-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-gray-400">Vendor Contract Code (VCC):</span>
                  {vendorDetails?.contract_code ? (
                    <span className="font-mono font-bold px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded">
                      {vendorDetails.contract_code}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-gray-500 italic">Not Generated</span>
                  )}
                </div>
                {isAdmin && !vendorDetails?.contract_code && (
                  <button
                    onClick={handleGenerateContractCode}
                    disabled={generatingVCC}
                    className="self-end mt-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-[11px] font-semibold text-white rounded-lg transition disabled:opacity-50 cursor-pointer"
                  >
                    {generatingVCC ? "Generating..." : "Generate VCC"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Action / Quote details Section */}
        {assignmentsLoading ? (
          <div className="flex justify-center py-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Status ASSIGNED: Admin submits quote form, Resident sees instructions */}
            {((activeAssignment && activeAssignment.status === 'ASSIGNED') || (!activeAssignment && request.assigned_vendor_id)) && (
              <>
                {isAdmin ? (
                  <form onSubmit={handleQuoteSubmit} className="bg-slate-50 dark:bg-white/5 rounded-2xl p-5 border border-slate-200 dark:border-white/5 space-y-4 animate-fadeIn">
                    <h4 className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Submit Vendor Quote</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] text-slate-500 dark:text-gray-400 block mb-1">Quote Amount ($) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="0.00"
                          value={quoteAmount}
                          onChange={(e) => setQuoteAmount(e.target.value)}
                          className="w-full bg-slate-100 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-500 dark:text-gray-400 block mb-1">Quote Date *</label>
                        <input
                          type="date"
                          required
                          value={quoteDate}
                          onChange={(e) => setQuoteDate(e.target.value)}
                          className="w-full bg-slate-100 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-500 dark:text-gray-400 block mb-1">Vendor Receipt Number</label>
                        <input
                          type="text"
                          placeholder="Receipt / Invoice Number..."
                          value={receiptNo}
                          onChange={(e) => setReceiptNo(e.target.value)}
                          className="w-full bg-slate-100 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-500 dark:text-gray-400 block mb-1">Service Location</label>
                        <input
                          type="text"
                          placeholder="e.g. Building A, Unit 102..."
                          value={serviceLocation}
                          onChange={(e) => setServiceLocation(e.target.value)}
                          className="w-full bg-slate-100 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={quoteSubmitting}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 cursor-pointer"
                      >
                        {quoteSubmitting ? "Submitting..." : "Submit Quote Details"}
                      </button>
                      <button
                        type="button"
                        onClick={onStatusUpdate}
                        className="flex-1 py-2.5 border border-blue-600 text-blue-600 bg-transparent hover:bg-blue-50 dark:border-blue-500 dark:text-blue-500 dark:hover:bg-blue-950/20 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <UserCheck size={14} /> Update Status
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-blue-500/5 border border-blue-500/20 dark:border-blue-500/30 rounded-2xl p-4 text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium">Status: Awaiting Vendor Inspection</p>
                    <p className="text-xs mt-1 opacity-90">Please share the **Vendor Access Code (VAC)** shown above with the vendor so they can inspect the premises and provide an official quote.</p>
                  </div>
                )}
              </>
            )}

            {/* Status QUOTE_GIVEN: Render quote details, accept/pay option */}
            {activeAssignment && activeAssignment.status === 'QUOTE_GIVEN' && (
              <>
                <div className="bg-blue-500/5 rounded-2xl p-5 border border-blue-500/20 dark:border-blue-500/30 space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Vendor Quote Offered</h4>
                    <span className="text-[10px] bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-semibold">QUOTE GIVEN</span>
                  </div>
                  
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-gray-400">Vendor:</span>
                      <span className="font-medium text-slate-800 dark:text-white">{activeAssignment.company_name || vendorDetails?.company_name || 'Vendor'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-gray-400">Quote Amount:</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">${(activeAssignment.quote_amount || 0).toFixed(2)}</span>
                    </div>
                    {activeAssignment.vendor_receipt_no && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-gray-400">Receipt No:</span>
                        <span className="font-medium text-slate-800 dark:text-white">{activeAssignment.vendor_receipt_no}</span>
                      </div>
                    )}
                    {activeAssignment.quote_date && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-gray-400">Quote Date:</span>
                        <span className="font-medium text-slate-800 dark:text-white">{activeAssignment.quote_date}</span>
                      </div>
                    )}
                    {activeAssignment.service_location && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-gray-400">Service Location:</span>
                        <span className="font-medium text-slate-800 dark:text-white">{activeAssignment.service_location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {isOwner && (
                  <button
                    onClick={() => handleAcceptAndPayQuote(activeAssignment)}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 cursor-pointer"
                  >
                    <DollarSign size={16} /> Accept & Pay Quote
                  </button>
                )}
              </>
            )}

            {/* Status APPROVED: Quote paid/funded. Admin verifies VCC and payouts. Resident sees completion instruction */}
            {activeAssignment && activeAssignment.status === 'APPROVED' && (
              <>
                {isAdmin ? (
                  <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-5 border border-slate-200 dark:border-white/5 space-y-4 animate-fadeIn">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Disburse Escrow Payout</h4>
                      <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 px-2 py-0.5 rounded-full font-semibold">ESCROW DEPOSITED</span>
                    </div>
                    
                    <p className="text-xs text-slate-500 dark:text-gray-400 font-light">
                      The resident has paid the quote of **${activeAssignment.quote_amount?.toFixed(2)}** into the Escrow Account.
                      To release these funds to the vendor, verify the **Vendor Contract Code (VCC)** provided by the vendor.
                    </p>

                    {!vccVerified ? (
                      <form onSubmit={handleVerifyVCC} className="space-y-3">
                        <div>
                          <label className="text-[11px] text-slate-500 dark:text-gray-400 block mb-1">Enter Vendor Contract Code (VCC) *</label>
                          <input
                            type="text"
                            required
                            placeholder="Enter VCC..."
                            value={vccInput}
                            onChange={(e) => setVccInput(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 uppercase font-mono"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                        >
                          Verify Contract Code
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center text-blue-600 dark:text-blue-400 text-xs font-semibold">
                          Contract Code Verified Successfully!
                        </div>
                        <button
                          onClick={handleDisbursePayout}
                          disabled={payoutSubmitting}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                        >
                          {payoutSubmitting ? "Disbursing..." : "Confirm & Disburse Payout"}
                        </button>
                        <button
                          onClick={() => { setVccVerified(false); setVccInput(''); }}
                          className="w-full py-1 text-center text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          Reset Verification
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-blue-500/5 border border-blue-500/20 dark:border-blue-500/30 rounded-2xl p-4 text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium">Status: Quote Approved & Funded</p>
                    <p className="text-xs mt-1 opacity-90 font-light">
                      You have deposited the quote of **${activeAssignment.quote_amount?.toFixed(2)}** to the Escrow Account.
                      The vendor is currently performing the work. Once the work is successfully completed, share the **Contract Code (VCC)** shown above with the vendor so they can claim their payout.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Status COMPLETED: Payout disbursed */}
            {activeAssignment && activeAssignment.status === 'COMPLETED' && (
              <div className="bg-gray-500/5 border border-gray-500/20 dark:border-gray-500/30 rounded-2xl p-4 text-sm text-slate-700 dark:text-slate-300 animate-fadeIn">
                <p className="font-medium">Status: Work Completed & Paid</p>
                <p className="text-xs mt-1 opacity-90 font-light">
                  The project is completed and the payout of **${activeAssignment.quote_amount?.toFixed(2)}** has been disbursed from Escrow to the Vendor.
                </p>
              </div>
            )}
          </>
        )}

        {/* Timeline tracker */}
        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/5 space-y-4">
          <h4 className="text-xs text-slate-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Lifecycle Tracker</h4>
          
          <div className="relative border-l-2 border-slate-200 dark:border-white/10 pl-6 ml-2 space-y-6">
            {/* Step 1: Open */}
            <div className="relative">
              <span className="absolute -left-[31px] top-0 w-4.5 h-4.5 rounded-full bg-blue-500 border-4 border-white dark:border-[#1E2E42] flex items-center justify-center text-white" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Ticket Created</p>
                <p className="text-[10px] text-slate-450 mt-0.5">Logged in community queue</p>
              </div>
            </div>

            {/* Step 2: In progress */}
            <div className="relative">
              <span className={`absolute -left-[31px] top-0 w-4.5 h-4.5 rounded-full border-4 border-white dark:border-[#1E2E42] ${
                ['IN_PROGRESS', 'VENDOR_ASSIGNED', 'RESOLVED', 'CLOSED'].includes(request.status) 
                  ? 'bg-amber-500' 
                  : 'bg-slate-200 dark:bg-[#1E3248]'
              }`} />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">In Progress</p>
                <p className="text-[10px] text-slate-450 mt-0.5">Work is currently active</p>
              </div>
            </div>

            {/* Step 3: Resolved */}
            <div className="relative">
              <span className={`absolute -left-[31px] top-0 w-4.5 h-4.5 rounded-full border-4 border-white dark:border-[#1E2E42] ${
                ['RESOLVED', 'CLOSED'].includes(request.status) 
                  ? 'bg-emerald-500' 
                  : 'bg-slate-200 dark:bg-[#1E3248]'
              }`} />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Resolved</p>
                <p className="text-[10px] text-slate-450 mt-0.5">Issue closed and resolved</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA for Managers */}
      {canManage && !['RESOLVED', 'CLOSED', 'CANCELLED'].includes(request.status) && !activeAssignment && (
        <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#1E2E42]/20 flex gap-3">
          <button 
            onClick={onStatusUpdate}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/25 cursor-pointer"
          >
            <UserCheck size={14} /> Update Ticket Status / Assign Vendor
          </button>
        </div>
      )}
    </div>
  );
};

export default function CondoMaintenance({ community, user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusModalRequest, setStatusModalRequest] = useState(null);

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    type: 'info',
    singleButton: false,
    onConfirm: null,
    onCancel: null
  });

  const role = (user?.role_name || user?.role || '').toLowerCase();
  const canManage = ['super_admin', 'property_manager', 'board_member'].includes(role);
  const isResident = role === 'resident';
  const commId = community?.community_id;

  useEffect(() => {
    if (commId) {
      fetchRequests();
    }
  }, [commId]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/condo/operations/maintenance?community_id=${commId}`);
      setRequests(res.data || []);
    } catch (err) {
      console.error(err);
      showAlert("Error", "Failed to load maintenance requests.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshAll = () => {
    fetchRequests();
    if (selectedRequest) {
      API.get(`/condo/operations/maintenance?community_id=${commId}`).then(res => {
        const found = (res.data || []).find(r => r.request_id === selectedRequest.request_id);
        if (found) setSelectedRequest(found);
      }).catch(console.error);
    }
  };

  const showAlert = (title, message, type = 'info') => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      confirmText: 'OK',
      cancelText: 'Cancel',
      type,
      singleButton: true,
      onConfirm: () => {},
      onCancel: () => {}
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: user?.time_zone || 'America/New_York',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(new Date(dateString));
    } catch (e) {
      return new Date(dateString).toLocaleString();
    }
  };

  // Helper counts for stats
  const stats = {
    open: requests.filter(r => r.status === 'OPEN').length,
    inProgress: requests.filter(r => r.status === 'IN_PROGRESS').length,
    resolved: requests.filter(r => r.status === 'RESOLVED').length,
    closed: requests.filter(r => r.status === 'CLOSED').length,
  };

  // Filter & Sorting
  const filteredRequests = requests.filter(req => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      (req.title || '').toLowerCase().includes(query) ||
      (req.description || '').toLowerCase().includes(query) ||
      (req.created_by_name || '').toLowerCase().includes(query) ||
      (req.category || '').toLowerCase().includes(query) ||
      (String(req.request_id) === query);

    const matchesStatus = !statusFilter || req.status === statusFilter;
    const matchesPriority = !priorityFilter || req.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_date) - new Date(a.created_date);
    if (sortBy === 'oldest') return new Date(a.created_date) - new Date(b.created_date);
    if (sortBy === 'priority') {
      const priorityMap = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const aVal = priorityMap[a.priority] || 0;
      const bVal = priorityMap[b.priority] || 0;
      if (bVal !== aVal) return bVal - aVal;
      return new Date(b.created_date) - new Date(a.created_date);
    }
    return 0;
  });

  const totalItems = sortedRequests.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = sortedRequests.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="text-slate-900 dark:text-white font-sans max-w-7xl mx-auto p-2">
      {/* Compact Page Header Row */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5 pb-3 border-b border-slate-200/60 dark:border-white/5">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Condo Maintenance Desk
        </h1>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shadow-md shadow-blue-500/10"
        >
          <Plus size={14} /> Log New Request
        </button>
      </div>

      {/* Stats Deck */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8 animate-fadeIn">
        {[
          { label: 'Open / Pending', value: stats.open,       color: 'text-blue-600 dark:text-blue-400' },
          { label: 'In Progress',    value: stats.inProgress, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Resolved Tickets', value: stats.resolved,   color: 'text-emerald-600 dark:text-emerald-450' },
          { label: 'Closed Archive', value: stats.closed,     color: 'text-slate-500 dark:text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-5 shadow-xs transition duration-250">
            <div className={`text-3xl sm:text-4xl font-mono font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 dark:text-gray-400 mt-2 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table & Filtering */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-lg animate-fadeIn">
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
          <h2 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg flex-shrink-0">
            {isResident ? 'My Logged Issues' : 'All Maintenance Tickets'}
          </h2>
          
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full lg:w-auto lg:justify-end">
            {/* Search Bar */}
            <div className="relative w-full sm:w-60">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100/60 dark:bg-[#1E3248] border border-slate-200/80 dark:border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-all shadow-inner"
              />
            </div>

            {/* Status Filter */}
            <div className="relative w-full sm:w-auto">
              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto bg-slate-100/60 dark:bg-[#1E3248] border border-slate-200/80 dark:border-white/10 rounded-2xl pl-4 pr-10 py-2.5 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none appearance-none cursor-pointer transition-colors"
              >
                <option value="" className="text-slate-900 dark:text-white">Status (All)</option>
                <option value="OPEN" className="text-slate-900 dark:text-white">Open</option>
                <option value="IN_PROGRESS" className="text-slate-900 dark:text-white">In Progress</option>
                <option value="RESOLVED" className="text-slate-900 dark:text-white">Resolved</option>
                <option value="CLOSED" className="text-slate-900 dark:text-white">Closed</option>
              </select>
              <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={13} />
            </div>

            {/* Priority Filter */}
            <div className="relative w-full sm:w-auto">
              <select 
                value={priorityFilter} 
                onChange={e => setPriorityFilter(e.target.value)}
                className="w-full sm:w-auto bg-slate-100/60 dark:bg-[#1E3248] border border-slate-200/80 dark:border-white/10 rounded-2xl pl-4 pr-10 py-2.5 text-xs text-slate-900 dark:text-white focus:border-blue-505 focus:outline-none appearance-none cursor-pointer transition-colors"
              >
                <option value="" className="text-slate-900 dark:text-white">Priority (All)</option>
                <option value="LOW" className="text-slate-900 dark:text-white">Low</option>
                <option value="MEDIUM" className="text-slate-900 dark:text-white">Medium</option>
                <option value="HIGH" className="text-slate-900 dark:text-white">High</option>
                <option value="URGENT" className="text-slate-900 dark:text-white">Urgent</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={13} />
            </div>

            {/* Sort By */}
            <div className="relative w-full sm:w-auto">
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                className="w-full sm:w-auto bg-slate-100/60 dark:bg-[#1E3248] border border-slate-200/80 dark:border-white/10 rounded-2xl pl-4 pr-10 py-2.5 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none appearance-none cursor-pointer transition-colors"
              >
                <option value="newest" className="text-slate-900 dark:text-white">Newest First</option>
                <option value="oldest" className="text-slate-900 dark:text-white">Oldest First</option>
                <option value="priority" className="text-slate-900 dark:text-white">Highest Priority</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={13} />
            </div>
          </div>
        </div>

        {loading && requests.length === 0 ? (
          <div className="p-16 text-center text-slate-500 dark:text-gray-400 bg-white/40 dark:bg-transparent">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading...
          </div>
        ) : paginatedRequests.length === 0 ? (
          <div className="p-16 text-center text-slate-500 dark:text-gray-400 bg-white/40 dark:bg-transparent">
            <Wrench size={32} className="mx-auto mb-3 opacity-50" />
            {searchQuery || priorityFilter || statusFilter ? 'No matching tickets found.' : 'No maintenance tickets logged yet.'}
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100 dark:divide-white/5 bg-white/40 dark:bg-transparent">
              {paginatedRequests.map((req) => (
                <div 
                  key={req.request_id} 
                  onClick={() => setSelectedRequest(req)}
                  className={`p-4 sm:p-5.5 hover:bg-slate-50 dark:hover:bg-white/5 transition flex gap-3.5 cursor-pointer ${
                    selectedRequest?.request_id === req.request_id ? 'bg-slate-50 dark:bg-white/5 border-l-4 border-blue-500' : ''
                  }`}
                >
                  {/* Category icon */}
                  {(() => {
                    const details = getCategoryIconDetails(req.category);
                    const RequestIcon = details.Icon;
                    return (
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${details.bg} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <RequestIcon size={20} className={details.text} />
                      </div>
                    );
                  })()}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base leading-tight hover:text-blue-600 dark:hover:text-blue-400 transition-colors break-words">
                          {req.title}
                        </h3>
                        <p className="text-slate-500 dark:text-gray-400 text-xs sm:text-sm mt-1 line-clamp-2 leading-relaxed">
                          {req.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <StatusBadge status={req.status} />
                      </div>
                    </div>

                    {/* Meta information footer */}
                    <div className="flex flex-wrap gap-x-3.5 gap-y-1 mt-2.5 text-xs text-slate-500 dark:text-gray-400">
                      <span>Category: <span className="text-slate-800 dark:text-gray-300 font-medium">{req.category || 'OTHER'}</span></span>
                      <span>By: <span className="text-slate-800 dark:text-gray-300 font-medium">{req.created_by_name || 'System'}</span></span>
                      <span>Unit: <span className="text-slate-800 dark:text-gray-300 font-medium">{req.unit_no || 'Common Area'}</span></span>
                      <span className="hidden sm:inline">Date: <span className="text-slate-800 dark:text-gray-300 font-medium">{formatDate(req.created_date)}</span></span>
                      <PriorityBadge priority={req.priority} />
                    </div>

                    {/* Quick status update button for managers */}
                    {canManage && !['RESOLVED', 'CLOSED', 'CANCELLED'].includes(req.status) && (
                      <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => setStatusModalRequest(req)}
                          className="px-3.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-semibold transition flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                        >
                          <UserCheck size={12} /> Update Status
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="p-6 border-t border-slate-200 dark:border-white/10 flex items-center justify-between flex-wrap gap-4 bg-slate-50/50 dark:bg-[#162535]">
                <span className="text-sm text-slate-500 dark:text-gray-400 font-medium">
                  Showing <span className="font-bold text-slate-900 dark:text-white">{startIndex + 1}</span> to{' '}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {Math.min(startIndex + itemsPerPage, totalItems)}
                  </span>{' '}
                  of <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span> tickets
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1E3248] dark:hover:bg-white/10 text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold transition disabled:opacity-50 active:scale-95 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1E3248] dark:hover:bg-white/10 text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold transition disabled:opacity-50 active:scale-95 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sliding Drawer overlay */}
      {selectedRequest && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity animate-fadeIn"
          onClick={() => setSelectedRequest(null)}
        />
      )}
      
      {/* Slide-in Details Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full sm:w-[500px] bg-gradient-to-b from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border-l border-slate-200 dark:border-white/10 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
        selectedRequest ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {selectedRequest && (
          <DetailDrawer
            request={selectedRequest}
            user={user}
            canManage={canManage}
            onClose={() => setSelectedRequest(null)}
            onStatusUpdate={() => setStatusModalRequest(selectedRequest)}
            formatDate={formatDate}
            onRefresh={handleRefreshAll}
            showAlert={showAlert}
            setConfirmConfig={setConfirmConfig}
          />
        )}
      </div>

      {/* Modals rendering */}
      {showAddModal && (
        <SubmitModal
          communityId={commId}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleRefreshAll}
          showAlert={showAlert}
        />
      )}

      {statusModalRequest && (
        <StatusModal
          request={statusModalRequest}
          onClose={() => setStatusModalRequest(null)}
          onSuccess={handleRefreshAll}
          showAlert={showAlert}
        />
      )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        type={confirmConfig.type}
        singleButton={confirmConfig.singleButton}
        onConfirm={() => {
          confirmConfig.onConfirm?.();
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => {
          if (confirmConfig.onCancel) {
            confirmConfig.onCancel();
          }
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }}
      />
    </div>
  );
}
