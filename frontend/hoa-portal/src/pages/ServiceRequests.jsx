import React, { useState, useEffect } from 'react';
import { Wrench, Plus, RefreshCw, X, ChevronDown, MessageSquare, UserCheck, Edit, Clock, Landmark, User, DollarSign } from 'lucide-react';
import API from '../services/api';
import { onlyDigitsKeyPress, onlyDecimalKeyPress } from '../utils/fieldValidators';

const StatusBadge = ({ status }) => {
  const map = {
    OPEN:            'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    APPROVED:        'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400',
    IN_PROGRESS:     'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300',
    VENDOR_ASSIGNED: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
    ON_HOLD:         'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
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
  const map = { 
    LOW: 'text-slate-500 dark:text-gray-400', 
    NORMAL: 'text-blue-600 dark:text-blue-400', 
    HIGH: 'text-orange-600 dark:text-orange-400', 
    URGENT: 'text-red-600 dark:text-red-400' 
  };
  return <span className={`text-xs font-medium ${map[priority] || 'text-slate-500 dark:text-gray-400'}`}>● {priority}</span>;
};


// ==================== SUBMIT MODAL ====================
const SubmitModal = ({ communityId, onClose, onSuccess }) => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ 
    type_id: '', 
    title: '', 
    description: '', 
    priority: 'NORMAL' 
  });

  useEffect(() => {
    API.get(`/service-request/type/${communityId}`)
      .then(r => setTypes(r.data || []))
      .catch(console.error);
  }, [communityId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.title.trim().length < 5) {
      alert('The title must be at least 5 characters long.');
      return;
    }
    setLoading(true);
    try {
      await API.post('/service-request', { 
        community_id: communityId, 
        type_id: parseInt(form.type_id), 
        title: form.title, 
        description: form.description, 
        priority: form.priority 
      });
      onSuccess(); 
      onClose();
    } catch (err) { 
      alert(err.response?.data?.detail || 'Error submitting request'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:from-[#1E2E42] dark:to-[#162535] dark:bg-gradient-to-br rounded-3xl p-6 w-full max-w-md border border-slate-200/80 dark:border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar text-slate-900 dark:text-white shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">New Service Request</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Request Type</label>
            <div className="relative">
              <select 
                required 
                value={form.type_id} 
                onChange={e => setForm({...form, type_id: e.target.value})}
                className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl pl-4 pr-10 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-teal-500 appearance-none cursor-pointer"
              >
                <option value="" className="text-slate-900 dark:text-white">Select type...</option>
                {types.map(t => (
                  <option key={t.type_id} value={t.type_id} className="text-slate-900 dark:text-white">
                    {t.type_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={18} />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Title</label>
            <input 
              required 
              type="text" 
              placeholder="Brief title of the issue..." 
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Detailed Description</label>
            <textarea 
              required 
              rows={4} 
              placeholder="Describe the problem in detail..." 
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-teal-500 resize-y"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Priority</label>
            <div className="relative">
              <select 
                value={form.priority} 
                onChange={e => setForm({...form, priority: e.target.value})}
                className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl pl-4 pr-10 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 appearance-none cursor-pointer"
              >
                <option value="NORMAL" className="text-slate-900 dark:text-white">Normal</option>
                <option value="HIGH" className="text-slate-900 dark:text-white">High</option>
                <option value="URGENT" className="text-slate-900 dark:text-white">Urgent</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={18} />
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
              className="flex-1 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-sm font-medium transition disabled:opacity-50"
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
const StatusModal = ({ request, statuses, onClose, onSuccess }) => {
  const [statusId, setStatusId] = useState('');
  const [note, setNote] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vendorsLoading, setVendorsLoading] = useState(false);

  // Filter statuses based on strict transition rules
  const current = request.status_name;
  const allowedStatuses = statuses.filter(s => {
    const target = s.status_name;
    if (target === current) return false;
    if (current === 'OPEN') {
      return ['APPROVED', 'IN_PROGRESS', 'CLOSED', 'ON_HOLD', 'CANCELLED'].includes(target);
    }
    if (current === 'APPROVED') {
      return ['IN_PROGRESS', 'CLOSED', 'ON_HOLD', 'CANCELLED'].includes(target);
    }
    if (current === 'IN_PROGRESS') {
      return ['VENDOR_ASSIGNED', 'CLOSED', 'ON_HOLD', 'CANCELLED'].includes(target);
    }
    if (current === 'VENDOR_ASSIGNED') {
      return ['IN_PROGRESS', 'CLOSED', 'ON_HOLD', 'CANCELLED'].includes(target);
    }
    return ['IN_PROGRESS', 'CLOSED', 'ON_HOLD', 'CANCELLED'].includes(target);
  });

  const selectedStatusName = statuses.find(s => String(s.status_id) === String(statusId))?.status_name;
  const isVendorAssigned = selectedStatusName === 'VENDOR_ASSIGNED';

  useEffect(() => {
    if (isVendorAssigned && request.community_id) {
      setVendorsLoading(true);
      API.get(`/vendor/${request.community_id}`)
        .then(res => {
          setVendors(res.data || []);
        })
        .catch(console.error)
        .finally(() => setVendorsLoading(false));
    }
  }, [isVendorAssigned, request.community_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        status_id: parseInt(statusId),
        note: note.trim() || null,
      };
      if (isVendorAssigned) {
        if (vendorId) payload.vendor_id = parseInt(vendorId);
        if (paymentId) payload.payment_id = parseInt(paymentId);
      }
      await API.put(`/service-request/${request.request_id}/status`, payload);
      onSuccess();
      onClose();
    } catch (err) { 
      alert(err.response?.data?.detail || 'Error updating status'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:from-[#1E2E42] dark:to-[#162535] dark:bg-gradient-to-br rounded-3xl p-6 w-full max-w-md border border-slate-200/80 dark:border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar text-slate-900 dark:text-white shadow-2xl">
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
                value={statusId} 
                onChange={e => setStatusId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl pl-4 pr-10 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 appearance-none cursor-pointer"
              >
                <option value="" className="text-slate-900 dark:text-white">Select status...</option>
                {allowedStatuses.map(s => (
                  <option key={s.status_id} value={s.status_id} className="text-slate-900 dark:text-white">{s.status_name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={18} />
            </div>
          </div>

          {isVendorAssigned && (
            <>
              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Assign Vendor</label>
                <div className="relative">
                  <select
                    required
                    value={vendorId}
                    onChange={e => setVendorId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl pl-4 pr-10 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 appearance-none cursor-pointer"
                  >
                    <option value="" className="text-slate-900 dark:text-white">
                      {vendorsLoading ? 'Loading vendors...' : 'Select vendor...'}
                    </option>
                    {vendors.map(v => (
                      <option key={v.vendor_id} value={v.vendor_id} className="text-slate-900 dark:text-white">{v.company_name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={18} />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Payment ID (optional)</label>
                <input
                  type="number"
                  placeholder="Associated Payment ID..."
                  value={paymentId}
                  onKeyPress={onlyDigitsKeyPress}
                  onChange={e => setPaymentId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-teal-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Note (optional)</label>
            <textarea 
              rows={2} 
              placeholder="Add a note..." 
              value={note} 
              onChange={e => setNote(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-teal-500 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl text-sm font-medium cancel-button-red-hover"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-sm font-medium disabled:opacity-50 transition">
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================== EDIT REQUEST DETAILS MODAL ====================
const EditModal = ({ request, communityId, isAdmin, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    title: request.title || '',
    description: request.description || '',
    priority: request.priority || 'NORMAL',
    type_id: request.type_id || '',
    vendor_id: request.vendor_id || '',
    payment_id: request.payment_id || '',
  });
  const [types, setTypes] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (communityId) {
      API.get(`/service-request/type/${communityId}`)
        .then(r => setTypes(r.data || []))
        .catch(console.error);
    }
    if (isAdmin && communityId) {
      API.get(`/vendor/${communityId}`)
        .then(res => setVendors(res.data || []))
        .catch(console.error);
    }
  }, [isAdmin, communityId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.title.trim().length < 5) {
      alert('The title must be at least 5 characters long.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        priority: form.priority,
        type_id: parseInt(form.type_id),
      };
      if (isAdmin) {
        payload.vendor_id = form.vendor_id ? parseInt(form.vendor_id) : 0;
        payload.payment_id = form.payment_id ? parseInt(form.payment_id) : 0;
      }
      await API.put(`/service-request/${request.request_id}`, payload);
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error updating request details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:from-[#1E2E42] dark:to-[#162535] dark:bg-gradient-to-br rounded-3xl p-6 w-full max-w-md border border-slate-200/80 dark:border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar text-slate-900 dark:text-white shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Service Request</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Request Type</label>
            <div className="relative">
              <select 
                required 
                value={form.type_id} 
                onChange={e => setForm({...form, type_id: e.target.value})}
                className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl pl-4 pr-10 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-teal-500 appearance-none cursor-pointer"
              >
                <option value="" className="text-slate-900 dark:text-white">Select type...</option>
                {types.map(t => (
                  <option key={t.type_id} value={t.type_id} className="text-slate-900 dark:text-white">
                    {t.type_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={18} />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Title</label>
            <input 
              required 
              type="text" 
              placeholder="Brief title of the issue..." 
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-550 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Detailed Description</label>
            <textarea 
              required 
              rows={4} 
              placeholder="Describe the problem in detail..." 
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-teal-500 resize-y"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Priority</label>
            <div className="relative">
              <select 
                value={form.priority} 
                onChange={e => setForm({...form, priority: e.target.value})}
                className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl pl-4 pr-10 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 appearance-none cursor-pointer"
              >
                <option value="LOW" className="text-slate-900 dark:text-white">Low</option>
                <option value="NORMAL" className="text-slate-900 dark:text-white">Normal</option>
                <option value="HIGH" className="text-slate-900 dark:text-white">High</option>
                <option value="URGENT" className="text-slate-900 dark:text-white">Urgent</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={18} />
            </div>
          </div>

          {isAdmin && (
            <>
              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Assign Vendor</label>
                <div className="relative">
                  <select 
                    value={form.vendor_id} 
                    onChange={e => setForm({...form, vendor_id: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl pl-4 pr-10 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 appearance-none cursor-pointer"
                  >
                    <option value="" className="text-slate-900 dark:text-white">None / Unassign</option>
                    {vendors.map(v => (
                      <option key={v.vendor_id} value={v.vendor_id} className="text-slate-900 dark:text-white">
                        {v.company_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={18} />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Payment ID</label>
                <input 
                  type="number" 
                  placeholder="Associated Payment ID..." 
                  value={form.payment_id}
                  onKeyPress={onlyDigitsKeyPress}
                  onChange={e => setForm({...form, payment_id: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-550 focus:outline-none focus:border-teal-500"
                />
              </div>
            </>
          )}

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
              className="flex-1 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-sm font-medium transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
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
  isLoading, 
  history, 
  historyLoading, 
  user, 
  isAdmin, 
  onClose, 
  onEdit, 
  onStatusUpdate, 
  onCancel,
  onRefresh, 
  formatDate,
  onAcceptAndPayQuote
}) => {
  const [newNote, setNewNote] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);
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

  const fetchVendorDetails = () => {
    if (request.vendor_id) {
      API.get(`/vendor/detail/${request.vendor_id}`)
        .then(res => setVendorDetails(res.data))
        .catch(err => {
          console.error("Error fetching vendor details:", err);
          setVendorDetails(null);
        });
    } else {
      setVendorDetails(null);
    }
  };

  const fetchAssignments = () => {
    if (request?.request_id && request?.community_id) {
      setAssignmentsLoading(true);
      API.get(`/vendor/assignment/${request.community_id}`, {
        params: { request_id: request.request_id }
      })
      .then(res => {
        setAssignments(res.data || []);
      })
      .catch(err => {
        console.error("Error fetching assignments:", err);
      })
      .finally(() => setAssignmentsLoading(false));
    } else {
      setAssignments([]);
    }
  };

  useEffect(() => {
    fetchVendorDetails();
  }, [request.vendor_id]);

  useEffect(() => {
    fetchAssignments();
  }, [request?.request_id, request?.community_id]);

  const handleGenerateAccessCode = async () => {
    setGeneratingVAC(true);
    try {
      await API.post(`/vendor/${request.vendor_id}/access-code`);
      fetchVendorDetails();
      alert("Vendor Access Code generated successfully!");
    } catch (e) {
      alert(e.response?.data?.detail || "Failed to generate Access Code");
    } finally {
      setGeneratingVAC(false);
    }
  };

  const handleGenerateContractCode = async () => {
    setGeneratingVCC(true);
    try {
      await API.post(`/vendor/${request.vendor_id}/contract-code`);
      fetchVendorDetails();
      alert("Vendor Contract Code generated successfully!");
    } catch (e) {
      alert(e.response?.data?.detail || "Failed to generate Contract Code");
    } finally {
      setGeneratingVCC(false);
    }
  };

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    if (!quoteAmount || isNaN(quoteAmount) || parseFloat(quoteAmount) <= 0) {
      alert("Please enter a valid quote amount.");
      return;
    }
    setQuoteSubmitting(true);
    try {
      let assignmentToUpdate = assignments[0];
      if (!assignmentToUpdate) {
        const createRes = await API.post('/vendor/assignment', {
          vendor_id: request.vendor_id,
          request_id: request.request_id,
          community_id: request.community_id,
          service_location: serviceLocation || null
        });
        assignmentToUpdate = createRes.data;
      }
      await API.put(`/vendor/assignment/${assignmentToUpdate.assignment_id}`, {
        quote_amount: parseFloat(quoteAmount),
        quote_date: quoteDate,
        vendor_receipt_no: receiptNo || null,
        service_location: serviceLocation || null,
        status: "QUOTE_GIVEN"
      });
      alert("Quote details submitted successfully!");
      setQuoteAmount('');
      setReceiptNo('');
      setServiceLocation('');
      onRefresh(); // refresh parent requests list
      fetchAssignments();
    } catch (err) {
      alert(err.response?.data?.detail || "Error submitting quote details");
    } finally {
      setQuoteSubmitting(false);
    }
  };

  const handleVerifyVCC = (e) => {
    e.preventDefault();
    if (!vccInput.trim()) {
      alert("Please enter the Contract Code (VCC).");
      return;
    }
    const targetCode = vendorDetails?.contract_code;
    if (!targetCode) {
      alert("Contract Code not found for this vendor.");
      return;
    }
    if (vccInput.trim().toUpperCase() === targetCode.toUpperCase()) {
      setVccVerified(true);
      alert("Contract Code verified successfully! You can now disburse the payment.");
    } else {
      setVccVerified(false);
      alert("Invalid Contract Code. Please check the code and try again.");
    }
  };

  const handleDisbursePayout = async () => {
    if (!vccVerified) {
      alert("Please verify the Contract Code (VCC) first.");
      return;
    }
    const activeAssignment = assignments[0];
    if (!activeAssignment) {
      alert("No active vendor assignment found.");
      return;
    }
    if (!window.confirm(`Disburse payout of $${activeAssignment.quote_amount.toFixed(2)} to ${vendorDetails?.company_name || 'Vendor'}?`)) {
      return;
    }
    setPayoutSubmitting(true);
    try {
      await API.post('/payment/pay', {
        amount: activeAssignment.quote_amount,
        reason: 'VENDOR_PAYMENT',
        reference_id: activeAssignment.assignment_id,
        payment_method: 'BANK_TRANSFER',
        escrow_flag: false
      });
      alert("Payout disbursed successfully! The service request is now CLOSED.");
      setVccInput('');
      setVccVerified(false);
      onRefresh(); // refresh parent requests list
      fetchAssignments();
    } catch (err) {
      alert(err.response?.data?.detail || "Error disbursing payout");
    } finally {
      setPayoutSubmitting(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (newNote.trim().length < 3) {
      alert('Note must be at least 3 characters long.');
      return;
    }
    setNoteSubmitting(true);
    try {
      await API.post(`/service-request/${request.request_id}/note`, {
        note: newNote.trim()
      });
      setNewNote('');
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error adding note');
    } finally {
      setNoteSubmitting(false);
    }
  };

  const isResident = ['resident'].includes(String(user?.role_name || user?.role || '').toLowerCase());
  const isOwner = Number(request.submitted_by_id) === Number(user?.user_id);
  const canEdit = isAdmin || (isOwner && request.status_name === 'OPEN');
  const activeAssignment = assignments[0];

  return (
    <div className="flex flex-col h-full text-slate-900 dark:text-white">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50/20 dark:from-[#1E2E42] dark:to-[#162535]">
        <div className="flex items-center gap-2">
          <Wrench className="text-teal-600 dark:text-teal-400" size={20} />
          <h3 className="text-lg font-semibold truncate max-w-[280px] text-slate-900 dark:text-white">Request #{request.request_id}</h3>
        </div>
        <div className="flex items-center gap-3">
          {canEdit && (
            <button 
              onClick={onEdit}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-xl transition text-slate-700 dark:text-gray-300 dark:hover:text-white flex items-center gap-1.5 text-xs font-medium"
            >
              <Edit size={14} /> Edit
            </button>
          )}
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-xl text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {/* Title & Status */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <StatusBadge status={request.status_name} />
            <PriorityBadge priority={request.priority} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">{request.title}</h2>
        </div>

        {/* Description */}
        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/5">
          <h4 className="text-xs text-slate-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-2">Description</h4>
          <p className="text-slate-700 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{request.description}</p>
        </div>

        {/* Helper message for residents if request is not OPEN */}
        {isResident && isOwner && request.status_name !== 'OPEN' && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs rounded-2xl font-medium leading-relaxed">
            ℹ️ Approved/Processed requests cannot be edited directly by residents. To request changes, please submit a note in the **Note History** below for the management team.
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
            <span className="text-xs text-slate-500 dark:text-gray-400">Request Type</span>
            <span className="text-sm font-semibold mt-1 text-slate-800 dark:text-white">{request.type_name || '—'}</span>
          </div>
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
            <span className="text-xs text-slate-500 dark:text-gray-400">Submitted By</span>
            <span className="text-sm font-semibold mt-1 text-slate-800 dark:text-white truncate">{request.submitted_by_name || '—'}</span>
          </div>
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
            <span className="text-xs text-slate-500 dark:text-gray-400">Created Date</span>
            <span className="text-xs font-mono font-semibold mt-1 text-slate-700 dark:text-gray-300">{formatDate(request.created_date)}</span>
          </div>
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
            <span className="text-xs text-slate-500 dark:text-gray-400">Last Modified</span>
            <span className="text-xs font-mono font-semibold mt-1 text-slate-700 dark:text-gray-300">{formatDate(request.modified_date)}</span>
          </div>
        </div>

        {/* Vendor and Payment Details */}
        {(request.vendor_id || request.payment_id || isAdmin) && (
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/5 space-y-3.5">
            <h4 className="text-xs text-slate-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Assignments & Links</h4>
            
            <div className="flex justify-between items-center text-sm border-b border-slate-200 dark:border-white/5 pb-2">
              <span className="text-slate-500 dark:text-gray-400 flex items-center gap-1.5"><User size={15} /> Vendor</span>
              <span className="font-medium text-slate-800 dark:text-white text-right">
                {request.vendor_id ? (
                  vendorDetails ? `${vendorDetails.company_name} (ID: ${request.vendor_id})` : `Vendor ID: ${request.vendor_id}`
                ) : 'Unassigned'}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 dark:text-gray-400 flex items-center gap-1.5"><Landmark size={15} /> Payment ID</span>
              <span className="font-medium text-slate-800 dark:text-white">
                {request.payment_id ? `ID: ${request.payment_id}` : 'No Payment Linked'}
              </span>
            </div>
          </div>
        )}

        {/* Vendor Access & Codes */}
        {request.vendor_id && (
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/5 space-y-3.5">
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
                    className="self-end mt-1 px-3 py-1 bg-teal-600 hover:bg-teal-500 text-[11px] font-semibold text-white rounded-lg transition disabled:opacity-50"
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
                    className="self-end mt-1 px-3 py-1 bg-teal-600 hover:bg-teal-500 text-[11px] font-semibold text-white rounded-lg transition disabled:opacity-50"
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
          <div className="flex justify-center py-4 bg-slate-50 dark:bg-white/5 rounded-2xl p-5 border border-slate-200 dark:border-white/5">
            <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Status ASSIGNED: Admin submits quote form, Resident sees instructions */}
            {((activeAssignment && activeAssignment.status === 'ASSIGNED') || (!activeAssignment && request.vendor_id)) && (
              <>
                {isAdmin ? (
                  <form onSubmit={handleQuoteSubmit} className="bg-slate-50 dark:bg-white/5 rounded-2xl p-5 border border-slate-200 dark:border-white/5 space-y-4 animate-fadeIn">
                    <h4 className="text-xs text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider">Submit Vendor Quote</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] text-slate-500 dark:text-gray-400 block mb-1">Quote Amount ($) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="0.00"
                          value={quoteAmount}
                          onKeyPress={onlyDecimalKeyPress}
                          onChange={(e) => setQuoteAmount(e.target.value)}
                          className="w-full bg-slate-100 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-500 dark:text-gray-400 block mb-1">Quote Date *</label>
                        <input
                          type="date"
                          required
                          value={quoteDate}
                          onChange={(e) => setQuoteDate(e.target.value)}
                          className="w-full bg-slate-100 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-500 dark:text-gray-400 block mb-1">Vendor Receipt Number</label>
                        <input
                          type="text"
                          placeholder="Receipt / Invoice Number..."
                          value={receiptNo}
                          onChange={(e) => setReceiptNo(e.target.value)}
                          className="w-full bg-slate-100 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-500 dark:text-gray-400 block mb-1">Service Location</label>
                        <input
                          type="text"
                          placeholder="e.g. Building A, Unit 102..."
                          value={serviceLocation}
                          onChange={(e) => setServiceLocation(e.target.value)}
                          className="w-full bg-slate-100 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={quoteSubmitting}
                      className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
                    >
                      {quoteSubmitting ? "Submitting..." : "Submit Quote Details"}
                    </button>
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
              <div className="bg-teal-500/5 rounded-2xl p-5 border border-teal-500/20 dark:border-teal-500/30 space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider">Vendor Quote Offered</h4>
                  <span className="text-[10px] bg-teal-500/20 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-full font-semibold">QUOTE GIVEN</span>
                </div>
                
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-gray-400">Vendor:</span>
                    <span className="font-medium text-slate-800 dark:text-white">{activeAssignment.company_name || vendorDetails?.company_name || 'Vendor'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-gray-400">Quote Amount:</span>
                    <span className="font-mono font-bold text-teal-600 dark:text-teal-400">${(activeAssignment.quote_amount || 0).toFixed(2)}</span>
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

                {isOwner && (
                  <button
                    onClick={() => onAcceptAndPayQuote && onAcceptAndPayQuote(activeAssignment)}
                    className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-teal-900/30"
                  >
                    <DollarSign size={16} /> Accept & Pay Quote
                  </button>
                )}
              </div>
            )}

            {/* Status APPROVED: Quote paid/funded. Admin verifies VCC and payouts. Resident sees completion instruction */}
            {activeAssignment && activeAssignment.status === 'APPROVED' && (
              <>
                {isAdmin ? (
                  <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-5 border border-slate-200 dark:border-white/5 space-y-4 animate-fadeIn">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider">Disburse Escrow Payout</h4>
                      <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 px-2 py-0.5 rounded-full font-semibold">ESCROW DEPOSITED</span>
                    </div>
                    
                    <p className="text-xs text-slate-500 dark:text-gray-400">
                      The resident has paid the quote of **${activeAssignment.quote_amount?.toFixed(2)}** into the HOA Escrow Account.
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
                            className="w-full bg-slate-100 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-teal-500 uppercase font-mono"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold transition"
                        >
                          Verify Contract Code
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-3 text-center text-teal-600 dark:text-teal-400 text-xs font-semibold">
                          Contract Code Verified Successfully!
                        </div>
                        <button
                          onClick={handleDisbursePayout}
                          disabled={payoutSubmitting}
                          className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
                        >
                          {payoutSubmitting ? "Disbursing..." : "Confirm & Disburse Payout"}
                        </button>
                        <button
                          onClick={() => { setVccVerified(false); setVccInput(''); }}
                          className="w-full py-1 text-center text-[11px] text-slate-400 hover:text-slate-200"
                        >
                          Reset Verification
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-teal-500/5 border border-teal-500/20 dark:border-teal-500/30 rounded-2xl p-4 text-sm text-teal-700 dark:text-teal-300">
                    <p className="font-medium">Status: Quote Approved & Funded</p>
                    <p className="text-xs mt-1 opacity-90 font-light">
                      You have deposited the quote of **${activeAssignment.quote_amount?.toFixed(2)}** to the HOA Escrow Account.
                      The vendor is currently performing the work. Once the work is successfully completed, share the **Contract Code (VCC)** shown above with the vendor so they can claim their payout.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Status COMPLETED: Payout disbursed */}
            {activeAssignment && activeAssignment.status === 'COMPLETED' && (
              <div className="bg-gray-500/5 border border-gray-500/20 dark:border-gray-500/30 rounded-2xl p-4 text-sm text-slate-700 dark:text-slate-300">
                <p className="font-medium">Status: Work Completed & Paid</p>
                <p className="text-xs mt-1 opacity-90 font-light">
                  The project is completed and the payout of **${activeAssignment.quote_amount?.toFixed(2)}** has been disbursed from Escrow to the Vendor.
                </p>
              </div>
            )}
          </>
        )}

        {/* Action Button for Status Update (Admin only) */}
        {isAdmin && !['CLOSED','CANCELLED'].includes(request.status_name) && (
          <button 
            onClick={onStatusUpdate}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 rounded-2xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-teal-900/30 text-white"
          >
            <UserCheck size={16} /> Update Status / Assignment
          </button>
        )}

        {/* Action Button for Cancel Request (Resident only, if OPEN) */}
        {!isAdmin && isOwner && request.status_name === 'OPEN' && (
          <button 
            onClick={onCancel}
            className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-2xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 text-white"
          >
            <X size={16} /> Cancel Request
          </button>
        )}

        {/* Notes Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
              <MessageSquare size={16} className="text-teal-600 dark:text-teal-400" /> Note History ({request.notes?.length || 0})
            </h4>
          </div>

          {/* Notes List */}
          <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
            {request.notes && request.notes.length > 0 ? (
              request.notes.map((note) => (
                <div key={note.note_id} className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-200 dark:border-white/5 text-sm">
                  <div className="flex justify-between items-start text-xs text-slate-500 dark:text-gray-400 mb-1.5">
                    <span className="font-semibold text-teal-600 dark:text-teal-400">{note.added_by_name || 'System'}</span>
                    <span className="font-mono">{formatDate(note.created_date)}</span>
                  </div>
                  <p className="text-slate-800 dark:text-gray-200 leading-relaxed">{note.note}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 dark:text-gray-500 italic text-center py-2">No notes added yet.</p>
            )}
          </div>

          {/* Note Input for Admins and Owner Residents */}
          {(isAdmin || (isResident && isOwner)) && (
            <form onSubmit={handleAddNote} className="space-y-2.5 pt-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder={isAdmin ? "Add notes for this service request..." : "Submit a note or change request to management..."}
                rows={2}
                className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-2xl p-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-teal-500 resize-none"
              />
              <button
                type="submit"
                disabled={noteSubmitting}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-xs font-semibold rounded-xl text-white transition disabled:opacity-50 float-right"
              >
                {noteSubmitting ? 'Adding...' : 'Add Note'}
              </button>
              <div className="clear-both"></div>
            </form>
          )}
        </div>

        {/* Audit History Timeline */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2 text-slate-900 dark:text-white">
            <Clock size={16} className="text-teal-600 dark:text-teal-400" /> Audit Trail History
          </h4>

          {historyLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : history && history.length > 0 ? (
            <div className="relative pl-4 border-l-2 border-slate-200 dark:border-white/10 ml-2 space-y-4">
              {history.map((log) => (
                <div key={log.audit_id} className="relative text-xs">
                  {/* Timeline dot */}
                  <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-teal-500 border border-white dark:border-[#162535]" />
                  <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-gray-400 font-mono mb-1">
                    <span className="font-semibold text-slate-700 dark:text-gray-300">{log.user_name || 'System'}</span>
                    <span>{formatDate(log.created_at)}</span>
                  </div>
                  <p className="text-slate-700 dark:text-gray-300 leading-relaxed">{log.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-gray-500 italic text-center py-2">No history recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const ServiceRequests = ({ community, user, setActivePage, setPaymentState }) => {
  const [requests, setRequests]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [statusModal, setStatusModal] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [allStatuses, setAllStatuses] = useState([]);
  const [stats, setStats] = useState({ open: 0, approved: 0, inProgress: 0, closed: 0 });

  // Selected details drawer states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const role     = user?.role_name || user?.role || '';
  const isAdmin  = ['super_admin', 'property_manager', 'board_member'].includes(role);
  const isResident = role === 'resident';

  useEffect(() => {
    if (community?.community_id) { 
      fetchRequests(); 
      fetchStatuses(); 
    }
  }, [community, statusFilter]);

  const fetchStatuses = async () => {
    try { 
      const res = await API.get('/service-request/status'); 
      setAllStatuses(res.data || []); 
    } catch (e) {}
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const url = statusFilter
        ? `/service-request/${community.community_id}?status=${statusFilter}&limit=50`
        : `/service-request/${community.community_id}?limit=50`;
      const res = await API.get(url);
      const all = res.data || [];
      // Resident mode is active -> only show requests submitted by this user (to mock/simulate a real resident view correctly)
      const filtered = isResident
        ? all.filter(r => r.submitted_by_id === user?.user_id)
        : all;
      
      setRequests(filtered);
      setStats({
        open:       filtered.filter(r => r.status_name === 'OPEN').length,
        approved:   filtered.filter(r => r.status_name === 'APPROVED').length,
        inProgress: filtered.filter(r => ['IN_PROGRESS','VENDOR_ASSIGNED'].includes(r.status_name)).length,
        closed:     filtered.filter(r => ['CLOSED','CANCELLED'].includes(r.status_name)).length,
      });
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  const fetchRequestDetails = async (id) => {
    try {
      setDetailsLoading(true);
      const res = await API.get(`/service-request/detail/${id}`);
      setSelectedDetails(res.data);
    } catch (e) {
      console.error("Error fetching request details:", e);
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchRequestHistory = async (id) => {
    try {
      setHistoryLoading(true);
      const res = await API.get(`/service-request/${id}/history`);
      setHistory(res.data || []);
    } catch (e) {
      console.error("Error fetching request history:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRequest?.request_id) {
      fetchRequestDetails(selectedRequest.request_id);
      fetchRequestHistory(selectedRequest.request_id);
    } else {
      setSelectedDetails(null);
      setHistory([]);
    }
  }, [selectedRequest]);

  const handleRefreshAll = () => {
    fetchRequests();
    if (selectedRequest?.request_id) {
      fetchRequestDetails(selectedRequest.request_id);
      fetchRequestHistory(selectedRequest.request_id);
    }
  };

  const handleCancel = async (req) => {
    const cancelStatus = allStatuses.find(s => s.status_name === 'CANCELLED');
    if (!cancelStatus || !window.confirm('Cancel this request?')) return;
    try {
      await API.put(`/service-request/${req.request_id}/status`, { 
        status_id: cancelStatus.status_id, 
        note: 'Cancelled by resident' 
      });
      handleRefreshAll();
    } catch (err) { 
      alert(err.response?.data?.detail || 'Error cancelling'); 
    }
  };

  const formatUserFriendlyDate = (dateString) => {
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

  const handleAcceptAndPayQuote = (asm) => {
    if (setPaymentState && setActivePage) {
      setPaymentState({
        dueItem: {
          amount: asm.quote_amount,
          reason: 'VENDOR_PAYMENT',
          reference_id: asm.assignment_id,
          title: `Vendor Quote: ${asm.vendor?.company_name || 'Vendor'} - SR '${selectedDetails?.title || selectedRequest?.title || 'Service Request'}'`,
          due_date: asm.quote_date || null
        }
      });
      setActivePage('payments');
    }
  };

  return (
    <div className="text-slate-900 dark:text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex justify-between items-center w-full md:w-auto">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">Service Requests</h1>
            <p className="text-slate-500 dark:text-gray-400 mt-1 flex items-center gap-2">
              {community?.name}
              {isResident && <span className="text-xs bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">My Requests</span>}
              {isAdmin && <span className="text-xs bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 px-2 py-0.5 rounded-full font-medium">All Requests</span>}
            </p>
          </div>
          {/* Mobile Refresh Button */}
          <button 
            onClick={handleRefreshAll} 
            disabled={loading}
            className="md:hidden p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-2xl text-slate-700 dark:text-white transition disabled:opacity-60"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {/* Desktop Refresh Button */}
          <button 
            onClick={handleRefreshAll} 
            disabled={loading}
            className="hidden md:flex px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-2xl text-sm font-semibold transition items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button onClick={() => setShowModal(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 rounded-2xl text-sm font-semibold transition">
            <Plus size={15} /> New Request
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Open',        value: stats.open,       color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Approved',    value: stats.approved,   color: 'text-teal-600 dark:text-teal-400' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Closed',      value: stats.closed,     color: 'text-slate-500 dark:text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 animate-fadeIn">
            <div className={`text-4xl font-mono font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-slate-500 dark:text-gray-400 mt-2">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-white">{isResident ? 'My Requests' : 'All Requests'}</h2>
          <div className="relative">
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-[#1E3248] border border-slate-200 dark:border-white/10 rounded-2xl pl-4 pr-10 py-2.5 text-sm text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="" className="text-slate-900 dark:text-white">All Status</option>
              <option value="OPEN" className="text-slate-900 dark:text-white">Open</option>
              <option value="APPROVED" className="text-slate-900 dark:text-white">Approved</option>
              <option value="IN_PROGRESS" className="text-slate-900 dark:text-white">In Progress</option>
              <option value="VENDOR_ASSIGNED" className="text-slate-900 dark:text-white">Vendor Assigned</option>
              <option value="CLOSED" className="text-slate-900 dark:text-white">Closed</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={16} />
          </div>
        </div>

        {loading && requests.length === 0 ? (
          <div className="p-16 text-center text-slate-500 dark:text-gray-400">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-16 text-center text-slate-500 dark:text-gray-400">
            <Wrench size={32} className="mx-auto mb-3 opacity-50" />
            {isResident ? 'You have no service requests.' : 'No service requests found.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {requests.map((req) => (
              <div 
                key={req.request_id} 
                onClick={() => setSelectedRequest(req)}
                className={`p-6 hover:bg-slate-50 dark:hover:bg-white/5 transition flex gap-4 cursor-pointer ${
                  selectedRequest?.request_id === req.request_id ? 'bg-slate-50 dark:bg-white/5 border-l-4 border-teal-500' : ''
                }`}
              >
                <div className="w-12 h-12 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Wrench size={22} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{req.title}</h3>
                      <p className="text-slate-500 dark:text-gray-400 text-sm mt-1 line-clamp-2">{req.description}</p>
                    </div>
                    <StatusBadge status={req.status_name} />
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500 dark:text-gray-400">
                    <span>Type: <span className="text-slate-800 dark:text-gray-300">{req.type_name || '—'}</span></span>
                    {isAdmin && <span>By: <span className="text-slate-800 dark:text-gray-300">{req.submitted_by_name || '—'}</span></span>}
                    <span>Date: <span className="text-slate-800 dark:text-gray-300">{formatUserFriendlyDate(req.created_date)}</span></span>
                    <PriorityBadge priority={req.priority} />
                  </div>
                  <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                    {isResident && req.status_name === 'OPEN' && (
                      <button 
                        onClick={() => handleCancel(req)}
                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-medium transition"
                      >
                        Cancel Request
                      </button>
                    )}
                    {isAdmin && !['CLOSED','CANCELLED'].includes(req.status_name) && (
                      <button 
                        onClick={() => setStatusModal(req)}
                        className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-xl text-xs font-medium transition flex items-center gap-1"
                      >
                        <UserCheck size={12} /> Update Status
                      </button>
                    )}
                    {(isAdmin || (isResident && req.submitted_by_id === user?.user_id && req.status_name === 'OPEN')) && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingRequest(req);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-red-600 hover:text-white dark:bg-white/10 dark:hover:bg-red-600 dark:hover:text-white text-slate-700 dark:text-gray-300 rounded-xl text-xs font-medium transition flex items-center gap-1"
                      >
                        <Edit size={12} /> Edit Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Backdrop */}
      {selectedRequest && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity animate-fadeIn"
          onClick={() => setSelectedRequest(null)}
        />
      )}
      
      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full sm:w-[550px] bg-gradient-to-b from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border-l border-slate-200 dark:border-white/10 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
        selectedRequest ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {selectedRequest && (
          <DetailDrawer
            request={selectedDetails || selectedRequest}
            isLoading={detailsLoading}
            history={history}
            historyLoading={historyLoading}
            user={user}
            isAdmin={isAdmin}
            onClose={() => setSelectedRequest(null)}
            onEdit={() => setEditingRequest(selectedDetails || selectedRequest)}
            onStatusUpdate={() => setStatusModal(selectedDetails || selectedRequest)}
            onCancel={() => handleCancel(selectedDetails || selectedRequest)}
            onRefresh={handleRefreshAll}
            formatDate={formatUserFriendlyDate}
            onAcceptAndPayQuote={handleAcceptAndPayQuote}
          />
        )}
      </div>

      {showModal && <SubmitModal communityId={community?.community_id} onClose={() => setShowModal(false)} onSuccess={handleRefreshAll} />}
      
      {statusModal && (
        <StatusModal
          request={statusModal}
          statuses={allStatuses.filter(s => s.status_name !== 'OPEN')}
          onClose={() => setStatusModal(null)}
          onSuccess={handleRefreshAll}
        />
      )}

      {editingRequest && (
        <EditModal
          request={editingRequest}
          communityId={community?.community_id}
          isAdmin={isAdmin}
          onClose={() => setEditingRequest(null)}
          onSuccess={handleRefreshAll}
        />
      )}
    </div>
  );
};

export default ServiceRequests;
