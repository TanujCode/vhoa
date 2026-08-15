import React, { useState, useEffect } from 'react';
import { 
  Wrench, Plus, RefreshCw, X, ChevronDown, MessageSquare, UserCheck, 
  Clock, User, Filter, Zap, Shield, Sparkles, Wind, Droplets, 
  Search, ChevronUp, AlertCircle, Edit, Hammer, DollarSign, Landmark, Copy, Check, Calendar
} from 'lucide-react';
import API from '../../services/api';
import { onlyDigitsKeyPress, validateTicketTitle, validateTicketDescription } from '../../utils/fieldValidators';
import ConfirmModal from '../../components/ConfirmModal';

const StatusBadge = ({ status }) => {
  const map = {
    OPEN:            'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    APPROVED:        'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
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
  const config = {
    LOW: { label: 'Low', color: 'bg-green-500 text-green-600 dark:text-green-400' },
    NORMAL: { label: 'Medium', color: 'bg-yellow-500 text-yellow-600 dark:text-yellow-400 font-medium' },
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

const getRequestIconDetails = (typeName) => {
  const name = (typeName || '').toLowerCase();
  if (name.includes('plumb') || name.includes('leak') || name.includes('water') || name.includes('pipe') || name.includes('drain')) {
    return { Icon: Droplets, bg: 'bg-sky-500/10 dark:bg-sky-500/20', text: 'text-sky-600 dark:text-sky-400' };
  }
  if (name.includes('elect') || name.includes('light') || name.includes('power') || name.includes('wire') || name.includes('bulb')) {
    return { Icon: Zap, bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400' };
  }
  if (name.includes('clean') || name.includes('swee') || name.includes('housekeep') || name.includes('trash') || name.includes('wash') || name.includes('garbage')) {
    return { Icon: Sparkles, bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400' };
  }
  if (name.includes('security') || name.includes('guard') || name.includes('lock') || name.includes('key')) {
    return { Icon: Shield, bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400' };
  }
  if (name.includes('carpenter') || name.includes('wood') || name.includes('door') || name.includes('furniture') || name.includes('repair') || name.includes('carpentry')) {
    return { Icon: Hammer, bg: 'bg-amber-700/10 dark:bg-amber-700/20', text: 'text-amber-700 dark:text-amber-500' };
  }
  if (name.includes('ac') || name.includes('hvac') || name.includes('heat') || name.includes('cool') || name.includes('air') || name.includes('elevator') || name.includes('lift')) {
    return { Icon: Wind, bg: 'bg-cyan-500/10 dark:bg-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-400' };
  }
  return { Icon: Wrench, bg: 'bg-slate-500/10 dark:bg-slate-500/20', text: 'text-slate-600 dark:text-slate-400' };
};


// ==================== SUBMIT MODAL ====================
const SubmitModal = ({ communityId, onClose, onSuccess, showAlert }) => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ title: '', description: '' });
  const [form, setForm] = useState({ 
    type_id: '', 
    title: '', 
    description: '', 
    priority: 'NORMAL' 
  });

  const handleTitleChange = (val) => {
    const cleaned = val.replace(/[^A-Za-z\s]/g, '');
    setForm(prev => ({ ...prev, title: cleaned }));
    if (cleaned.trim() === '') {
      setErrors(prev => ({ ...prev, title: '' }));
      return;
    }
    const err = validateTicketTitle(cleaned);
    setErrors(prev => ({ ...prev, title: err === true ? '' : err }));
  };

  const handleDescChange = (val) => {
    setForm(prev => ({ ...prev, description: val }));
    if (val.trim() === '') {
      setErrors(prev => ({ ...prev, description: '' }));
      return;
    }
    const err = validateTicketDescription(val);
    setErrors(prev => ({ ...prev, description: err === true ? '' : err }));
  };

  useEffect(() => {
    API.get(`/condo/operations/service-request/type/${communityId}`)
      .then(r => setTypes(r.data || []))
      .catch(console.error);
  }, [communityId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const titleErr = validateTicketTitle(form.title);
    if (titleErr !== true) {
      setErrors(prev => ({ ...prev, title: titleErr }));
      showAlert("Validation Error", titleErr, "warning");
      return;
    }

    const descErr = validateTicketDescription(form.description);
    if (descErr !== true) {
      setErrors(prev => ({ ...prev, description: descErr }));
      showAlert("Validation Error", descErr, "warning");
      return;
    }

    setLoading(true);
    try {
      await API.post('/condo/operations/service-request', { 
        community_id: communityId, 
        type_id: parseInt(form.type_id), 
        title: form.title, 
        description: form.description, 
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
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">New Service Request</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Request Type <span className="text-red-500">*</span></label>
            <div className="relative">
              <select 
                required 
                value={form.type_id} 
                onChange={e => setForm({...form, type_id: e.target.value})}
                className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl pl-4 pr-10 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
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
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs text-slate-500 dark:text-gray-400 font-medium">Title <span className="text-red-500">*</span></label>
              <span className="text-[10px] text-slate-400 dark:text-gray-500 font-mono">{form.title.length}/100</span>
            </div>
            <input 
              required 
              type="text" 
              maxLength={100}
              placeholder="Brief title of the issue..." 
              value={form.title}
              onChange={e => handleTitleChange(e.target.value)}
              className={`w-full bg-slate-50 dark:bg-[#0D1B2A] border ${errors.title ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/20'} rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500`}
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1.5 font-semibold flex items-center gap-1">
                <AlertCircle size={12} /> {errors.title}
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs text-slate-500 dark:text-gray-400 font-medium">Detailed Description <span className="text-red-500">*</span></label>
              <span className="text-[10px] text-slate-400 dark:text-gray-500 font-mono">{form.description.length}/1000</span>
            </div>
            <textarea 
              required 
              rows={4} 
              maxLength={1000}
              placeholder="Describe the problem in detail..." 
              value={form.description}
              onChange={e => handleDescChange(e.target.value)}
              className={`w-full bg-slate-50 dark:bg-[#0D1B2A] border ${errors.description ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/20'} rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-y`}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1.5 font-semibold flex items-center gap-1">
                <AlertCircle size={12} /> {errors.description}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-2 block">Priority</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { value: 'LOW', label: 'Low', color: 'bg-green-500', activeClass: 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400' },
                { value: 'NORMAL', label: 'Medium', color: 'bg-yellow-500', activeClass: 'border-yellow-500 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' },
                { value: 'HIGH', label: 'High', color: 'bg-red-500', activeClass: 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400' },
              ].map((opt) => {
                const isActive = form.priority === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, priority: opt.value })}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-2xl border text-sm font-semibold transition ${
                      isActive
                        ? `${opt.activeClass} border-2`
                        : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/5 bg-transparent'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${opt.color} flex-shrink-0 ml-1.5`}></span>
                  </button>
                );
              })}
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
const StatusModal = ({ request, statuses, userRole, onClose, onSuccess, showAlert }) => {
  const [statusId, setStatusId] = useState('');
  const [note, setNote] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vendorsLoading, setVendorsLoading] = useState(false);

  // Transition validation
  const current = request.status_name;
  let allowedStatuses = statuses.filter(s => {
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

  if (userRole === 'super_admin') {
    allowedStatuses = allowedStatuses.filter(s => s.status_name !== 'VENDOR_ASSIGNED');
  }

  const selectedStatusName = statuses.find(s => String(s.status_id) === String(statusId))?.status_name;
  const isVendorAssigned = selectedStatusName === 'VENDOR_ASSIGNED';

  useEffect(() => {
    if (isVendorAssigned && request.community_id) {
      setVendorsLoading(true);
      API.get(`/condo/vendor/${request.community_id}`)
        .then(res => setVendors(res.data || []))
        .catch(console.error)
        .finally(() => setVendorsLoading(false));
    }
  }, [isVendorAssigned, request.community_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isVendorAssigned && !vendorId) {
      showAlert("Error", "Please select a vendor to assign.", "warning");
      return;
    }
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
      await API.put(`/condo/operations/service-request/${request.request_id}/status`, payload);
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
                value={statusId} 
                onChange={e => setStatusId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl pl-4 pr-10 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
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

              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Payment ID (optional)</label>
                <input
                  type="number"
                  placeholder="Associated Payment ID..."
                  value={paymentId}
                  onKeyPress={onlyDigitsKeyPress}
                  onChange={e => setPaymentId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500"
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
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
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
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-medium disabled:opacity-50 transition">
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================== EDIT REQUEST DETAILS MODAL ====================
const EditModal = ({ request, communityId, isAdmin, userRole, onClose, onSuccess, showAlert }) => {
  const [types, setTypes] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ title: '', description: '' });
  const [form, setForm] = useState({
    title: request.title || '',
    description: request.description || '',
    priority: request.priority || 'NORMAL',
    type_id: request.type_id || '',
    vendor_id: request.vendor_id || '',
    payment_id: request.payment_id || '',
  });

  const handleTitleChange = (val) => {
    setForm(prev => ({ ...prev, title: val }));
    if (val.trim() === '') {
      setErrors(prev => ({ ...prev, title: '' }));
      return;
    }
    const err = validateTicketTitle(val);
    setErrors(prev => ({ ...prev, title: err === true ? '' : err }));
  };

  const handleDescChange = (val) => {
    setForm(prev => ({ ...prev, description: val }));
    if (val.trim() === '') {
      setErrors(prev => ({ ...prev, description: '' }));
      return;
    }
    const err = validateTicketDescription(val);
    setErrors(prev => ({ ...prev, description: err === true ? '' : err }));
  };

  useEffect(() => {
    if (communityId) {
      API.get(`/condo/operations/service-request/type/${communityId}`)
        .then(r => setTypes(r.data || []))
        .catch(console.error);
    }
    if (isAdmin && communityId) {
      API.get(`/condo/vendor/${communityId}`)
        .then(res => setVendors(res.data || []))
        .catch(console.error);
    }
  }, [isAdmin, communityId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const titleErr = validateTicketTitle(form.title);
    if (titleErr !== true) {
      setErrors(prev => ({ ...prev, title: titleErr }));
      showAlert("Validation Error", titleErr, "warning");
      return;
    }

    const descErr = validateTicketDescription(form.description);
    if (descErr !== true) {
      setErrors(prev => ({ ...prev, description: descErr }));
      showAlert("Validation Error", descErr, "warning");
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
      await API.put(`/condo/operations/service-request/${request.request_id}`, payload);
      onSuccess();
      onClose();
    } catch (err) {
      showAlert("Error", err.response?.data?.detail || 'Error updating request details', "danger");
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
                className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl pl-4 pr-10 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
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
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs text-slate-500 dark:text-gray-400 font-medium">Title</label>
              <span className="text-[10px] text-slate-400 dark:text-gray-500 font-mono">{form.title.length}/100</span>
            </div>
            <input 
              required 
              type="text" 
              maxLength={100}
              placeholder="Brief title of the issue..." 
              value={form.title}
              onChange={e => handleTitleChange(e.target.value)}
              className={`w-full bg-slate-50 dark:bg-[#0D1B2A] border ${errors.title ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/20'} rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500`}
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1.5 font-semibold flex items-center gap-1">
                <AlertCircle size={12} /> {errors.title}
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs text-slate-500 dark:text-gray-400 font-medium">Detailed Description</label>
              <span className="text-[10px] text-slate-400 dark:text-gray-500 font-mono">{form.description.length}/1000</span>
            </div>
            <textarea 
              required 
              rows={4} 
              maxLength={1000}
              placeholder="Describe the problem in detail..." 
              value={form.description}
              onChange={e => handleDescChange(e.target.value)}
              className={`w-full bg-slate-50 dark:bg-[#0D1B2A] border ${errors.description ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/20'} rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-y`}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1.5 font-semibold flex items-center gap-1">
                <AlertCircle size={12} /> {errors.description}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-2 block">Priority</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { value: 'LOW', label: 'Low', color: 'bg-green-500', activeClass: 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400' },
                { value: 'NORMAL', label: 'Medium', color: 'bg-yellow-500', activeClass: 'border-yellow-500 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' },
                { value: 'HIGH', label: 'High', color: 'bg-red-500', activeClass: 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400' },
              ].map((opt) => {
                const isActive = (form.priority === opt.value) || (opt.value === 'HIGH' && form.priority === 'URGENT');
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, priority: opt.value })}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-2xl border text-sm font-semibold transition ${
                      isActive
                        ? `${opt.activeClass} border-2`
                        : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/5 bg-transparent'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${opt.color} flex-shrink-0 ml-1.5`}></span>
                  </button>
                );
              })}
            </div>
          </div>

          {isAdmin && userRole !== 'super_admin' && (
            <>
              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Assign Vendor</label>
                <div className="relative">
                  <select 
                    value={form.vendor_id} 
                    onChange={e => setForm({...form, vendor_id: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl pl-4 pr-10 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
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
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500"
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
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-medium transition disabled:opacity-50"
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
  user, 
  isAdmin, 
  isResident,
  userRole,
  onClose, 
  onEdit,
  onStatusUpdate, 
  onCancel,
  onRefresh, 
  formatDate,
  showAlert,
  showConfirm,
  setConfirmConfig
}) => {
  const [newNote, setNewNote] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [vendorDetails, setVendorDetails] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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

  const isOwner = request.submitted_by_id === user?.user_id;

  const fetchVendorDetails = () => {
    if (request.vendor_id) {
      API.get(`/condo/vendor/detail/${request.vendor_id}`)
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
      .then(res => setAssignments(res.data || []))
      .catch(err => console.error("Error fetching condo assignments:", err))
      .finally(() => setAssignmentsLoading(false));
    } else {
      setAssignments([]);
    }
  };

  const fetchHistory = () => {
    if (request?.request_id) {
      setHistoryLoading(true);
      API.get(`/condo/operations/service-request/${request.request_id}/history`)
        .then(res => setHistory(res.data || []))
        .catch(err => console.error("Error loading condo request history:", err))
        .finally(() => setHistoryLoading(false));
    }
  };

  useEffect(() => {
    fetchVendorDetails();
    fetchAssignments();
    fetchHistory();
  }, [request.vendor_id, request.request_id]);

  const handleGenerateAccessCode = async () => {
    setGeneratingVAC(true);
    try {
      await API.post(`/condo/vendor/${request.vendor_id}/access-code`);
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
      await API.post(`/condo/vendor/${request.vendor_id}/contract-code`);
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
        const createRes = await API.post('/condo/vendor/assignment', {
          vendor_id: request.vendor_id,
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
      onRefresh(); 
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
          await API.post('/condo/operations/payments', {
            community_id: activeAssignment.community_id,
            amount: activeAssignment.quote_amount,
            payment_type: 'VENDOR_ASSIGNMENT',
            payment_method: 'BANK_TRANSFER',
            notes: `Payout disbursed to ${vendorDetails?.company_name || 'Vendor'} for Request #${request.request_id}`
          });
          await API.put(`/condo/vendor/assignment/${activeAssignment.assignment_id}`, {
            status: "COMPLETED"
          });
          const closedStatus = request.status_id; // Will update parent
          onRefresh();
          fetchAssignments();
          fetchHistory();
          showAlert("Success", "Payout disbursed successfully! The service request is now CLOSED.", "success");
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
          await API.post('/condo/operations/payments', {
            community_id: assignment.community_id,
            amount: assignment.quote_amount,
            payment_type: 'ESCROW_DEPOSIT',
            payment_method: 'ACH',
            notes: `Escrow payment for Request #${request.request_id}`
          });
          await API.put(`/condo/vendor/assignment/${assignment.assignment_id}`, {
            status: "APPROVED"
          });
          showAlert("Success", "Escrow deposit successful! Vendor will start the work shortly.", "success");
          onRefresh();
          fetchAssignments();
          fetchHistory();
        } catch (err) {
          showAlert("Error", err.response?.data?.detail || "Error depositing payment", "danger");
        }
      }
    });
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (newNote.trim().length < 3) {
      showAlert("Validation Error", 'Note must be at least 3 characters long.', "warning");
      return;
    }
    setNoteSubmitting(true);
    try {
      await API.post(`/condo/operations/service-request/${request.request_id}/note`, {
        note: newNote.trim()
      });
      setNewNote('');
      onRefresh();
      fetchHistory();
    } catch (err) {
      showAlert("Error", err.response?.data?.detail || 'Error adding note', "danger");
    } finally {
      setNoteSubmitting(false);
    }
  };

  const activeAssignment = assignments[0];
  const canEdit = (isAdmin || (isOwner && request.status_name === 'OPEN')) && !['CLOSED', 'CANCELLED'].includes(request.status_name);

  return (
    <div className="flex flex-col h-full text-slate-900 dark:text-white">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50/20 dark:from-[#1E2E42] dark:to-[#162535]">
        <div className="flex items-center gap-2">
          {(() => {
            const details = getRequestIconDetails(request.type_name);
            const RequestIcon = details.Icon;
            return <RequestIcon className="text-blue-600 dark:text-blue-400" size={20} />;
          })()}
          <h3 className="text-lg font-semibold truncate max-w-[280px] text-slate-900 dark:text-white flex items-center gap-1.5">
            Request #{request.request_id}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          {canEdit && (
            <button 
              onClick={onEdit}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-xl transition text-slate-700 dark:text-gray-300 dark:hover:text-white flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            >
              <Edit size={14} /> Edit
            </button>
          )}
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-xl text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition cursor-pointer">
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
            <span className="text-sm font-semibold mt-1 text-slate-800 dark:text-white truncate">{request.type_name || 'OTHER'}</span>
          </div>
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
            <span className="text-xs text-slate-500 dark:text-gray-400">Submitted By</span>
            <span className="text-sm font-semibold mt-1 text-slate-800 dark:text-white truncate">{request.submitted_by_name || 'System'}</span>
          </div>
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
            <span className="text-xs text-slate-500 dark:text-gray-400">Created Date</span>
            <span className="text-xs font-mono font-semibold mt-1 text-slate-700 dark:text-gray-300">{formatDate(request.created_date)}</span>
          </div>
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
            <span className="text-xs text-slate-500 dark:text-gray-400">Last Updated</span>
            <span className="text-xs font-mono font-semibold mt-1 text-slate-700 dark:text-gray-300">{formatDate(request.modified_date || request.created_date)}</span>
          </div>
        </div>

        {/* Vendor and Payment Details */}
        {(request.vendor_id || isAdmin) && (
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
            {request.payment_id && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-gray-400 flex items-center gap-1.5"><Landmark size={15} /> Payment ID</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-white">{request.payment_id}</span>
              </div>
            )}
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

        {/* Escrow workflow */}
        {assignmentsLoading ? (
          <div className="flex justify-center py-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {((activeAssignment && activeAssignment.status === 'ASSIGNED') || (!activeAssignment && request.vendor_id)) && (
              <>
                {isAdmin ? (
                  <form onSubmit={handleQuoteSubmit} className="bg-slate-50 dark:bg-white/5 rounded-2xl p-5 border border-slate-200 dark:border-white/5 space-y-4">
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
                        <div className="relative">
                          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={16} />
                          <input
                            type="date"
                            required
                            min={new Date().toISOString().split('T')[0]}
                            autoComplete="off"
                            onKeyDown={e => e.preventDefault()}
                            value={quoteDate}
                            onChange={(e) => setQuoteDate(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 cursor-pointer"
                          />
                        </div>
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
                      <button type="submit" disabled={quoteSubmitting} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 cursor-pointer">
                        {quoteSubmitting ? "Submitting..." : "Submit Quote Details"}
                      </button>
                      <button type="button" onClick={onStatusUpdate} className="flex-1 py-2.5 border border-blue-600 text-blue-600 bg-transparent hover:bg-blue-50 dark:border-blue-500 dark:text-blue-500 dark:hover:bg-blue-950/20 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer">
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

            {activeAssignment && activeAssignment.status === 'QUOTE_GIVEN' && (
              <>
                <div className="bg-blue-500/5 rounded-2xl p-5 border border-blue-500/20 dark:border-blue-500/30 space-y-4">
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
                  <button onClick={() => handleAcceptAndPayQuote(activeAssignment)} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 cursor-pointer">
                    <DollarSign size={16} /> Accept & Pay Quote
                  </button>
                )}
              </>
            )}

            {activeAssignment && activeAssignment.status === 'APPROVED' && (
              <>
                {isAdmin ? (
                  <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-5 border border-slate-200 dark:border-white/5 space-y-4">
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
                        <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer">
                          Verify Contract Code
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center text-blue-600 dark:text-blue-400 text-xs font-semibold">
                          Contract Code Verified Successfully!
                        </div>
                        <button onClick={handleDisbursePayout} disabled={payoutSubmitting} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 cursor-pointer">
                          {payoutSubmitting ? "Disbursing..." : "Confirm & Disburse Payout"}
                        </button>
                        <button onClick={() => { setVccVerified(false); setVccInput(''); }} className="w-full py-1 text-center text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer">
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
        {isAdmin && !['CLOSED','CANCELLED'].includes(request.status_name) && !activeAssignment && (
          <button 
            onClick={onStatusUpdate}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 text-white cursor-pointer"
          >
            <UserCheck size={16} /> {userRole === 'super_admin' ? 'Update Status' : 'Update Status / Assignment'}
          </button>
        )}

        {/* Action Button for Cancel Request (Resident only, if OPEN) */}
        {!isAdmin && isOwner && request.status_name === 'OPEN' && (
          <button 
            onClick={onCancel}
            className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-2xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 text-white cursor-pointer"
          >
            <X size={16} /> Cancel Request
          </button>
        )}

        {/* Notes Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
              <MessageSquare size={16} className="text-blue-600 dark:text-blue-400" /> Note History ({request.notes?.length || 0})
            </h4>
          </div>
          <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
            {request.notes && request.notes.length > 0 ? (
              request.notes.map((note) => (
                <div key={note.note_id} className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-200 dark:border-white/5 text-sm">
                  <div className="flex justify-between items-start text-xs text-slate-500 dark:text-gray-400 mb-1.5">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{note.added_by_name || 'System'}</span>
                    <span className="font-mono">{formatDate(note.created_date)}</span>
                  </div>
                  <p className="text-slate-800 dark:text-gray-200 leading-relaxed">{note.note}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 dark:text-gray-500 italic text-center py-2">No notes added yet.</p>
            )}
          </div>
          {(isAdmin || isOwner) && (
            <form onSubmit={handleAddNote} className="space-y-2.5 pt-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder={isAdmin ? "Add notes for this service request..." : "Submit a note or change request to management..."}
                rows={2}
                className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-2xl p-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none font-sans"
              />
              <button type="submit" disabled={noteSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-semibold rounded-xl text-white transition disabled:opacity-50 float-right cursor-pointer">
                {noteSubmitting ? 'Adding...' : 'Add Note'}
              </button>
              <div className="clear-both"></div>
            </form>
          )}
        </div>

        {/* Audit History Timeline */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2 text-slate-900 dark:text-white">
            <Clock size={16} className="text-blue-600 dark:text-blue-400" /> Audit Trail History
          </h4>
          {historyLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : history && history.length > 0 ? (
            <div className="relative pl-4 border-l-2 border-slate-200 dark:border-white/10 ml-2 space-y-4">
              {history.map((log) => (
                <div key={log.audit_id} className="relative text-xs">
                  <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-blue-500 border border-white dark:border-[#162535]" />
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
export default function CondoServiceRequests({ community, user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusModalRequest, setStatusModalRequest] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  const [allStatuses, setAllStatuses] = useState([]);

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
  const isAdmin = ['super_admin', 'property_manager', 'board_member'].includes(role);
  const isResident = role === 'resident';
  const commId = community?.community_id;

  useEffect(() => {
    if (commId) {
      fetchRequests();
      fetchStatuses();
    }
  }, [commId, statusFilter]);

  const fetchStatuses = async () => {
    try {
      const res = await API.get('/condo/operations/service-request/status');
      setAllStatuses(res.data || []);
    } catch (e) {
      console.error("Error fetching statuses:", e);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const url = statusFilter
        ? `/condo/operations/service-request/${commId}?status=${statusFilter}&limit=1000`
        : `/condo/operations/service-request/${commId}?limit=1000`;
      const res = await API.get(url);
      const all = res.data || [];
      const filtered = isResident ? all.filter(r => r.submitted_by_id === user?.user_id) : all;
      setRequests(filtered);
    } catch (err) {
      console.error(err);
      showAlert("Error", "Failed to load service requests.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshAll = () => {
    fetchRequests();
    if (selectedRequest) {
      API.get(`/condo/operations/service-request/detail/${selectedRequest.request_id}`).then(res => {
        if (res.data) setSelectedRequest(res.data);
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
      onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false })),
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const showConfirm = (title, message, onConfirm, type = 'danger', confirmText = 'Yes, Proceed') => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText: 'Cancel',
      singleButton: false,
      type,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const handleCancelRequest = (req) => {
    showConfirm(
      "Cancel Request",
      "Are you sure you want to cancel this service request? This action cannot be undone.",
      async () => {
        try {
          const cancelledStatus = allStatuses.find(s => s.status_name === 'CANCELLED');
          if (!cancelledStatus) {
            showAlert("Error", "Cancelled status not found in system.", "danger");
            return;
          }
          await API.put(`/condo/operations/service-request/${req.request_id}/status`, {
            status_id: cancelledStatus.status_id,
            note: "Cancelled by resident"
          });
          showAlert("Success", "Service request cancelled successfully.", "success");
          handleRefreshAll();
        } catch (err) {
          showAlert("Error", err.response?.data?.detail || "Failed to cancel service request", "danger");
        }
      }
    );
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
    open:       requests.filter(r => r.status_name === 'OPEN').length,
    approved:   requests.filter(r => r.status_name === 'APPROVED').length,
    inProgress: requests.filter(r => ['IN_PROGRESS', 'VENDOR_ASSIGNED'].includes(r.status_name)).length,
    closed:     requests.filter(r => ['CLOSED', 'CANCELLED'].includes(r.status_name)).length,
  };

  // Filter & Sorting
  const filteredRequests = requests.filter(req => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      (req.title || '').toLowerCase().includes(query) ||
      (req.description || '').toLowerCase().includes(query) ||
      (req.submitted_by_name || '').toLowerCase().includes(query) ||
      (req.type_name || '').toLowerCase().includes(query) ||
      (String(req.request_id) === query);

    const matchesStatus = !statusFilter || req.status_name === statusFilter;
    const matchesPriority = !priorityFilter || req.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_date) - new Date(a.created_date);
    if (sortBy === 'oldest') return new Date(a.created_date) - new Date(b.created_date);
    if (sortBy === 'priority') {
      const priorityMap = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
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

  const handleRowClick = (req) => {
    setSelectedRequest(req);
  };

  return (
    <div className="text-slate-900 dark:text-white font-sans max-w-7xl mx-auto p-2">
      {/* Compact Page Header Row */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5 pb-3 border-b border-slate-200/60 dark:border-white/5">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Service Requests
          </h1>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 uppercase font-semibold">
            MY COMMUNITY: <span className="text-slate-700 dark:text-gray-200 font-bold">{community?.name || 'My Residence'}</span>
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shadow-md shadow-blue-500/10"
        >
          <Plus size={14} /> New Request
        </button>
      </div>

      {/* Stats Deck */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8 animate-fadeIn">
        {[
          { label: 'Open',        value: stats.open,       color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Approved',    value: stats.approved,   color: 'text-blue-600 dark:text-blue-400' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Closed',      value: stats.closed,     color: 'text-slate-500 dark:text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className={`text-4xl font-mono font-bold ${s.color}`}>{s.value}</div>
              <div className="text-sm text-slate-500 dark:text-gray-400 mt-2 font-medium">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table & Filtering */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-lg animate-fadeIn">
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
          <h2 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg flex-shrink-0">
            {isResident ? 'My Requests' : 'All Service Requests'}
          </h2>
          
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full lg:w-auto lg:justify-end">
            {/* Search Bar */}
            <div className="relative w-full sm:w-60">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search requests..."
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
                {allStatuses.map(s => (
                  <option key={s.status_id} value={s.status_name} className="text-slate-900 dark:text-white">{s.status_name}</option>
                ))}
              </select>
              <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={13} />
            </div>

            {/* Priority Filter */}
            <div className="relative w-full sm:w-auto">
              <select 
                value={priorityFilter} 
                onChange={e => setPriorityFilter(e.target.value)}
                className="w-full sm:w-auto bg-slate-100/60 dark:bg-[#1E3248] border border-slate-200/80 dark:border-white/10 rounded-2xl pl-4 pr-10 py-2.5 text-xs text-slate-900 dark:text-white focus:border-blue-550 focus:outline-none appearance-none cursor-pointer transition-colors"
              >
                <option value="" className="text-slate-900 dark:text-white">Priority (All)</option>
                <option value="LOW" className="text-slate-900 dark:text-white">Low</option>
                <option value="NORMAL" className="text-slate-900 dark:text-white">Medium</option>
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
          <div className="p-16 text-center text-slate-550 dark:text-gray-450 italic bg-white/45 dark:bg-transparent">
            No service requests found matching filters.
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-150 dark:divide-white/5 bg-white/40 dark:bg-transparent">
              {paginatedRequests.map((req) => (
                <div 
                  key={req.request_id} 
                  onClick={() => handleRowClick(req)}
                  className={`p-4 sm:p-6 hover:bg-slate-100/30 dark:hover:bg-white/5 transition flex gap-3 cursor-pointer ${
                    selectedRequest?.request_id === req.request_id ? 'bg-slate-100/30 dark:bg-white/5 border-l-4 border-blue-500' : ''
                  }`}
                >
                  {/* Icon */}
                  {(() => {
                    const details = getRequestIconDetails(req.type_name);
                    const RequestIcon = details.Icon;
                    return (
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${details.bg} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-transparent dark:border-white/5`}>
                        <RequestIcon size={20} className={details.text} />
                      </div>
                    );
                  })()}

                  <div className="flex-1 min-w-0">
                    {/* Title + Status */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base leading-tight hover:text-blue-600 dark:hover:text-blue-400 transition-colors break-words">{req.title}</h3>
                        <p className="text-slate-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5 line-clamp-2 leading-relaxed font-light">{req.description}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <StatusBadge status={req.status_name} />
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-slate-500 dark:text-gray-400">
                      <span>Type: <span className="text-slate-800 dark:text-slate-200 font-semibold">{req.type_name || 'OTHER'}</span></span>
                      {isAdmin && <span>By: <span className="text-slate-800 dark:text-slate-200 font-semibold">{req.submitted_by_name || 'System'}</span></span>}
                      <span>Date: <span className="text-slate-800 dark:text-slate-200 font-mono font-semibold">{formatDate(req.created_date).split(',')[0]}</span></span>
                      <PriorityBadge priority={req.priority} />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 mt-2.5" onClick={e => e.stopPropagation()}>
                      {isResident && req.status_name === 'OPEN' && (
                        <button 
                          onClick={() => handleCancelRequest(req)}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold transition cursor-pointer"
                        >
                          Cancel Request
                        </button>
                      )}
                      {isAdmin && !['CLOSED','CANCELLED'].includes(req.status_name) && (
                        <button 
                          onClick={() => setStatusModalRequest(req)}
                          className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-semibold transition flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                        >
                          <UserCheck size={12} /> Update Status
                        </button>
                      )}
                      {(!['CLOSED', 'CANCELLED'].includes(req.status_name) && (isAdmin || (isResident && req.submitted_by_id === user?.user_id && req.status_name === 'OPEN'))) && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingRequest(req);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-red-650 hover:text-white dark:bg-white/10 dark:hover:bg-red-650 dark:hover:text-white text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold transition flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                        >
                          <Edit size={12} /> Edit Details
                        </button>
                      )}
                    </div>
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
                  of <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span> requests
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-slate-200 dark:border-white/10 bg-white hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1 cursor-pointer text-slate-700 dark:text-slate-250"
                  >
                    Prev
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-slate-200 dark:border-white/10 bg-white hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1 cursor-pointer text-slate-700 dark:text-slate-250"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Selected details drawer */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 z-40 flex justify-end">
          <div className="absolute inset-0" onClick={() => setSelectedRequest(null)} />
          <div className="relative w-full max-w-md bg-white dark:from-[#1E2E42] dark:to-[#162535] dark:bg-gradient-to-br h-full shadow-2xl flex flex-col animate-slideLeft z-50 border-l border-slate-200 dark:border-white/10">
            <DetailDrawer 
              request={selectedRequest}
              user={user}
              isAdmin={isAdmin}
              isResident={isResident}
              userRole={role}
              onClose={() => setSelectedRequest(null)}
              onEdit={() => { setEditingRequest(selectedRequest); setSelectedRequest(null); }}
              onStatusUpdate={() => { setStatusModalRequest(selectedRequest); setSelectedRequest(null); }}
              onCancel={() => { handleCancelRequest(selectedRequest); setSelectedRequest(null); }}
              onRefresh={handleRefreshAll}
              formatDate={formatDate}
              showAlert={showAlert}
              showConfirm={showConfirm}
              setConfirmConfig={setConfirmConfig}
            />
          </div>
        </div>
      )}

      {/* Add Request Modal */}
      {showAddModal && (
        <SubmitModal 
          communityId={commId}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleRefreshAll}
          showAlert={showAlert}
        />
      )}

      {/* Status Modal */}
      {statusModalRequest && (
        <StatusModal 
          request={statusModalRequest}
          statuses={allStatuses}
          userRole={role}
          onClose={() => setStatusModalRequest(null)}
          onSuccess={handleRefreshAll}
          showAlert={showAlert}
        />
      )}

      {/* Edit Modal */}
      {editingRequest && (
        <EditModal 
          request={editingRequest}
          communityId={commId}
          isAdmin={isAdmin}
          userRole={role}
          onClose={() => setEditingRequest(null)}
          onSuccess={handleRefreshAll}
          showAlert={showAlert}
        />
      )}

      {/* Global Confirmation Modal */}
      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        type={confirmConfig.type}
        singleButton={confirmConfig.singleButton}
        onConfirm={confirmConfig.onConfirm}
        onCancel={confirmConfig.onCancel}
      />
    </div>
  );
}
