import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, RefreshCw, ChevronDown, X, Search, ArrowUpRight, Download, Filter } from 'lucide-react';
import API, { getBaseUrl } from '../services/api';
import { onlyDecimalKeyPress, onlyDigitsKeyPress } from '../utils/fieldValidators';

// ── Status Badge ──────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    OPEN:        'bg-red-500/20 text-red-400',
    IN_PROGRESS: 'bg-blue-500/20 text-blue-400',
    APPEALED:    'bg-amber-500/20 text-amber-400',
    PAID:        'bg-blue-500/20 text-blue-400',
    RESOLVED:    'bg-green-500/20 text-green-400',
    CLOSED:      'bg-gray-500/20 text-gray-400',
    CANCELLED:   'bg-gray-500/20 text-gray-400',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${map[status] || 'bg-gray-500/20 text-gray-400'}`}>
      {status}
    </span>
  );
};

// ── Submit Violation Modal ────────────────────
const SubmitModal = ({ communityId, onClose, onSuccess }) => {
  const [types, setTypes]     = useState([]);
  const [residents, setResidents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile]       = useState(null);
  const [form, setForm]       = useState({
    violation_type_id: '',
    client_id:         '',
    violation_date:    new Date().toISOString().split('T')[0],
    amount:            0,
    remarks:           '',
  });
  const [errors, setErrors]   = useState({});

  const selectRef = React.useRef(null);

  useEffect(() => {
    API.get(`/violation/type/${communityId}`)
      .then(r => setTypes(r.data))
      .catch(console.error);

    API.get(`/user/community/${communityId}?limit=1000`)
      .then(r => {
        setResidents(r.data || []);
      })
      .catch(console.error);
  }, [communityId]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (selectRef.current && !selectRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client_id) {
      alert('Please select a resident from the list.');
      return;
    }
    if (errors.amount) {
      alert('Please correct the validation errors first.');
      return;
    }
    setLoading(true);
    try {
      const res = await API.post('/violation', {
        ...form,
        community_id:      communityId,
        violation_type_id: parseInt(form.violation_type_id),
        client_id:         parseInt(form.client_id),
        amount:            parseFloat(form.amount),
      });

      const violationId = res.data.violation_id;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('community_id', communityId);
        formData.append('doc_type', 'VIOLATION');
        formData.append('description', 'Initial violation attachment');

        await API.post(`/violation/${violationId}/document`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error submitting violation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:from-[#1E2E42] dark:to-[#162535] dark:bg-gradient-to-br rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Submit Violation</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Violation Type <span className="text-red-500">*</span></label>
            <select
              required
              value={form.violation_type_id}
              onChange={e => setForm({...form, violation_type_id: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="" className="text-slate-900 dark:text-white">Select type...</option>
              {types.map(t => (
                <option key={t.violation_type_id} value={t.violation_type_id} className="text-slate-900 dark:text-white">
                  {t.name} — ${t.amount}
                </option>
              ))}
            </select>
          </div>

          <div ref={selectRef} className="relative">
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Select Resident *</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Type name, email or ID to search..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setIsOpen(true);
                  if (form.client_id) {
                    setForm({ ...form, client_id: '' });
                  }
                }}
                onFocus={() => setIsOpen(true)}
                className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              {form.client_id && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setForm({ ...form, client_id: '' });
                  }}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {isOpen && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
                {residents
                  .filter(r => 
                    r.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    r.email_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    String(r.user_id).includes(searchTerm)
                  )
                  .map(r => (
                    <div
                      key={r.user_id}
                      onClick={() => {
                        setForm({ ...form, client_id: String(r.user_id) });
                        setSearchTerm(`${r.full_name} (#${r.user_id})`);
                        setIsOpen(false);
                      }}
                      className="px-4 py-2 hover:bg-blue-500/10 cursor-pointer text-sm text-slate-900 dark:text-white flex justify-between items-center transition-colors border-b border-slate-100 dark:border-white/5 last:border-0"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">{r.full_name}</span>
                        <span className="text-[10px] text-slate-500 dark:text-gray-400 font-mono">{r.email_id} • Unit: {r.unit_no || 'N/A'}</span>
                      </div>
                      <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">ID: #{r.user_id}</span>
                    </div>
                  ))}
                {residents.filter(r => 
                  r.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  r.email_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  String(r.user_id).includes(searchTerm)
                ).length === 0 && (
                  <div className="p-3 text-center text-xs text-slate-500 dark:text-gray-400">
                    No matching residents found
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Violation Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              required
              value={form.violation_date}
              onChange={e => setForm({...form, violation_date: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Fine Amount ($) <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onKeyPress={onlyDecimalKeyPress}
              onChange={e => {
                const val = e.target.value;
                setForm({...form, amount: val});
                if (val === '' || isNaN(parseFloat(val))) {
                  setErrors(prev => ({...prev, amount: 'Amount is required'}));
                } else if (parseFloat(val) < 0) {
                  setErrors(prev => ({...prev, amount: 'Amount cannot be negative'}));
                } else {
                  setErrors(prev => {
                    const next = {...prev};
                    delete next.amount;
                    return next;
                  });
                }
              }}
              className={`w-full bg-slate-50 dark:bg-[#0D1B2A] border rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.amount ? 'border-red-500' : 'border-slate-200 dark:border-white/20'}`}
            />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>

          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Attachment (Optional)</label>
            <input
              type="file"
              onChange={e => setFile(e.target.files[0])}
              className="w-full text-sm text-slate-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600/10 file:text-blue-600 dark:file:text-blue-400 hover:file:bg-blue-600/20"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Remarks</label>
            <textarea
              rows={3}
              placeholder="Describe the violation..."
              value={form.remarks}
              onChange={e => setForm({...form, remarks: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-blue-600 text-blue-600 bg-transparent hover:bg-red-600 hover:text-white hover:border-red-600 dark:border-blue-500 dark:text-blue-500 dark:hover:bg-red-600 dark:hover:text-white dark:hover:border-red-600 rounded-xl text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium transition disabled:opacity-50 text-white"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Create Violation Type Modal ───────────────
const CreateTypeModal = ({ communityId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ name: '', description: '', amount: 0, late_charge: 0, due_days: 30 });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Name is required.");
      return;
    }
    if (Object.keys(errors).length > 0) {
      alert("Please fix the validation errors before saving.");
      return;
    }
    setLoading(true);
    try {
      await API.post('/violation/type', { 
        ...formData, 
        community_id: communityId,
        amount: parseFloat(formData.amount) || 0,
        late_charge: parseFloat(formData.late_charge) || 0,
        due_days: parseInt(formData.due_days) || 30
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || "Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:from-[#1E2E42] dark:to-[#162535] dark:bg-gradient-to-br p-6 rounded-3xl w-96 max-h-[90vh] overflow-y-auto custom-scrollbar border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white shadow-2xl">
        <h2 className="text-slate-900 dark:text-white text-lg mb-4 font-semibold">Create Violation Type</h2>
        
        <div className="mb-3">
          <input 
            className="w-full p-2 bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500" 
            placeholder="Name" 
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})} 
          />
        </div>
        
        <div className="mb-3">
          <textarea 
            className="w-full p-2 bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 resize-none" 
            placeholder="Description" 
            rows={3}
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})} 
          />
        </div>
        
        <div className="mb-3">
          <label className="text-[10px] text-slate-500 block mb-0.5">Amount ($)</label>
          <input 
            className={`w-full p-2 bg-slate-50 dark:bg-[#0D1B2A] border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 ${errors.amount ? 'border-red-500' : 'border-slate-200 dark:border-white/20'}`} 
            placeholder="Amount" 
            type="number" 
            value={formData.amount}
            onKeyPress={onlyDecimalKeyPress}
            onChange={e => {
              const val = e.target.value;
              setFormData({...formData, amount: val});
              if (val === '' || isNaN(parseFloat(val))) {
                setErrors(prev => ({...prev, amount: 'Amount is required'}));
              } else if (parseFloat(val) < 0) {
                setErrors(prev => ({...prev, amount: 'Amount cannot be negative'}));
              } else {
                setErrors(prev => {
                  const next = {...prev};
                  delete next.amount;
                  return next;
                });
              }
            }} 
          />
          {errors.amount && <p className="text-xs mt-1 text-red-500">{errors.amount}</p>}
        </div>
        
        <div className="mb-3">
          <label className="text-[10px] text-slate-500 block mb-0.5">Late Charge ($)</label>
          <input 
            className={`w-full p-2 bg-slate-50 dark:bg-[#0D1B2A] border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 ${errors.late_charge ? 'border-red-500' : 'border-slate-200 dark:border-white/20'}`} 
            placeholder="Late Charge" 
            type="number" 
            value={formData.late_charge}
            onKeyPress={onlyDecimalKeyPress}
            onChange={e => {
              const val = e.target.value;
              setFormData({...formData, late_charge: val});
              if (val === '' || isNaN(parseFloat(val))) {
                setErrors(prev => ({...prev, late_charge: 'Late charge is required'}));
              } else if (parseFloat(val) < 0) {
                setErrors(prev => ({...prev, late_charge: 'Late charge cannot be negative'}));
              } else {
                setErrors(prev => {
                  const next = {...prev};
                  delete next.late_charge;
                  return next;
                });
              }
            }} 
          />
          {errors.late_charge && <p className="text-xs mt-1 text-red-500">{errors.late_charge}</p>}
        </div>
        
        <div className="mb-3">
          <label className="text-[10px] text-slate-500 block mb-0.5">Due Days</label>
          <input 
            className={`w-full p-2 bg-slate-50 dark:bg-[#0D1B2A] border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 ${errors.due_days ? 'border-red-500' : 'border-slate-200 dark:border-white/20'}`} 
            placeholder="Due Days" 
            type="number" 
            value={formData.due_days}
            onKeyPress={onlyDigitsKeyPress}
            onChange={e => {
              const val = e.target.value;
              setFormData({...formData, due_days: val});
              if (val === '' || isNaN(parseInt(val, 10))) {
                setErrors(prev => ({...prev, due_days: 'Due days is required'}));
              } else if (parseInt(val, 10) < 1) {
                setErrors(prev => ({...prev, due_days: 'Due days must be at least 1'}));
              } else {
                setErrors(prev => {
                  const next = {...prev};
                  delete next.due_days;
                  return next;
                });
              }
            }} 
          />
          {errors.due_days && <p className="text-xs mt-1 text-red-500">{errors.due_days}</p>}
        </div>

        <div className="flex gap-2 mt-4">
          <button type="button" disabled={loading} onClick={onClose} className="px-4 py-2 border border-blue-600 text-blue-600 bg-transparent hover:bg-red-600 hover:text-white hover:border-red-600 dark:border-blue-500 dark:text-blue-500 dark:hover:bg-red-600 dark:hover:text-white dark:hover:border-red-600 rounded-xl flex-1 disabled:opacity-50 transition-colors font-medium">Cancel</button>
          <button type="button" disabled={loading} onClick={handleSubmit} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl flex-1 text-white font-medium disabled:opacity-50">
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Dispute Submission Modal ──────────────────
const DisputeModal = ({ communityId, violationId, onClose, onSuccess }) => {
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      alert("Dispute description must be at least 10 characters long.");
      return;
    }
    setLoading(true);
    try {
      await API.post(`/violation/${violationId}/dispute`, { dispute_description: description });

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('community_id', communityId);
        formData.append('doc_type', 'DISPUTE');
        formData.append('description', 'Resident Dispute Attachment');
        
        await API.post(`/violation/${violationId}/document`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to file dispute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:from-[#1E2E42] dark:to-[#162535] dark:bg-gradient-to-br rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Dispute Violation</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Why do you dispute this violation? (Min 10 characters)</label>
            <textarea
              required
              rows={4}
              placeholder="Please explain the details of your appeal..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Attachment Proof (Optional)</label>
            <input
              type="file"
              onChange={e => setFile(e.target.files[0])}
              className="w-full text-sm text-slate-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600/10 file:text-blue-600 dark:file:text-blue-400 hover:file:bg-blue-600/20"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-blue-600 text-blue-600 bg-transparent hover:bg-red-600 hover:text-white hover:border-red-600 dark:border-blue-500 dark:text-blue-500 dark:hover:bg-red-600 dark:hover:text-white dark:hover:border-red-600 rounded-xl text-sm font-medium transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium text-white disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit Appeal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Dispute Resolution Modal ──────────────────
const ResolveDisputeModal = ({ violationId, statuses, onClose, onSuccess }) => {
  const [resolution, setResolution] = useState('');
  const [statusId, setStatusId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (resolution.trim().length < 10) {
      alert("Resolution must be at least 10 characters long.");
      return;
    }
    setLoading(true);
    try {
      await API.post(`/violation/${violationId}/dispute/resolve`, {
        dispute_resolution: resolution,
        new_status_id: statusId ? parseInt(statusId) : null
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to resolve dispute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:from-[#1E2E42] dark:to-[#162535] dark:bg-gradient-to-br rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Address Dispute</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Resolution Action Taken (Min 10 characters)</label>
            <textarea
              required
              rows={4}
              placeholder="Provide comments on board decision..."
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">New Status (Optional)</label>
            <select
              value={statusId}
              onChange={e => setStatusId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Keep appealed status</option>
              {statuses.filter(s => s.violation_status !== 'APPEALED').map(s => (
                <option key={s.violation_status_id} value={s.violation_status_id}>
                  {s.violation_status}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-blue-600 text-blue-600 bg-transparent hover:bg-red-600 hover:text-white hover:border-red-600 dark:border-blue-500 dark:text-blue-500 dark:hover:bg-red-600 dark:hover:text-white dark:hover:border-red-600 rounded-xl text-sm font-medium transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium text-white disabled:opacity-50">
              {loading ? 'Resolving...' : 'Resolve Dispute'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Violation Detail Modal ────────────────────
const ViolationDetailModal = ({ violation, isResident, statuses, onClose, onDispute, onResolve, onStatusChange, onPay }) => {
  const [selectedStatusId, setSelectedStatusId] = useState(violation.violation_status_id || '');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const getFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return getBaseUrl(url.startsWith('/') ? url : '/' + url);
  };

  const handleStatusChangeSubmit = async () => {
    setUpdatingStatus(true);
    try {
      await onStatusChange(violation.violation_id, selectedStatusId);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const isUnpaid = !['PAID', 'CLOSED', 'CANCELLED'].includes(violation.violation_status);
  const canDispute = isResident && !violation.is_disputed && isUnpaid && violation.dispute_deadline && new Date() <= new Date(violation.dispute_deadline);
  const canResolve = !isResident && violation.is_disputed && !violation.dispute_resolved;

  const violationDocs = violation.documents?.filter(d => d.doc_type === 'VIOLATION') || [];
  const disputeDocs = violation.documents?.filter(d => d.doc_type === 'DISPUTE') || [];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:from-[#1E2E42] dark:to-[#162535] dark:bg-gradient-to-br rounded-3xl p-6 w-full max-w-2xl border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-white/10">
          <div>
            <h3 className="text-xl font-bold">{violation.violation_type_name}</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">ID: #{violation.violation_id} • Status: {violation.violation_status}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <span className="text-xs text-slate-400 dark:text-gray-500 block uppercase tracking-wider font-mono">Resident</span>
              <p className="font-semibold">{violation.client_name || `User #${violation.client_id}`}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400 dark:text-gray-500 block uppercase tracking-wider font-mono">Fine Amount</span>
              <p className="font-mono text-lg font-bold">
                ${violation.amount} 
                {violation.late_charge_applied > 0 && (
                  <span className="text-red-500 text-sm font-normal block md:inline md:ml-2">
                    (+${violation.late_charge_applied} Late Charge)
                  </span>
                )}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-400 dark:text-gray-500 block uppercase tracking-wider font-mono">Violation Date</span>
              <p className="text-sm">{new Date(violation.violation_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400 dark:text-gray-500 block uppercase tracking-wider font-mono">Due Date</span>
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                {violation.violation_due_date ? new Date(violation.violation_due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs text-slate-400 dark:text-gray-500 block uppercase tracking-wider font-mono">Remarks / Description</span>
              <p className="text-sm text-slate-700 dark:text-gray-300 bg-slate-100 dark:bg-white/5 p-3 rounded-xl min-h-[80px] whitespace-pre-wrap leading-relaxed">
                {violation.remarks || "No remarks provided."}
              </p>
            </div>

            {/* Attachments Section */}
            <div>
              <span className="text-xs text-slate-400 dark:text-gray-500 block uppercase tracking-wider font-mono mb-2">Attachments</span>
              {violationDocs.length === 0 ? (
                <p className="text-xs text-slate-500">No attachments provided.</p>
              ) : (
                <div className="space-y-1.5">
                  {violationDocs.map((doc, idx) => (
                    <a
                      key={doc.violation_document_id}
                      href={getFileUrl(doc.doc_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                    >
                      📄 Violation Document #{idx + 1}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dispute details if any */}
        {violation.is_disputed && (
          <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 mb-6 space-y-3">
            <h4 className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide font-mono">Dispute History</h4>
            
            <div>
              <span className="text-xs text-slate-400 dark:text-gray-500">Filed Date:</span>
              <p className="text-xs">{violation.dispute_date ? new Date(violation.dispute_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</p>
            </div>

            <div>
              <span className="text-xs text-slate-400 dark:text-gray-500">Resident Description:</span>
              <p className="text-sm bg-white dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/5 p-3 rounded-xl leading-relaxed">{violation.dispute_description}</p>
            </div>

            {disputeDocs.length > 0 && (
              <div>
                <span className="text-xs text-slate-400 dark:text-gray-500 block mb-1">Appeal Attachments:</span>
                <div className="space-y-1">
                  {disputeDocs.map((doc, idx) => (
                    <a
                      key={doc.violation_document_id}
                      href={getFileUrl(doc.doc_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                    >
                      📄 Appeal Proof #{idx + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-slate-200 dark:border-white/10 pt-3">
              <span className="text-xs text-slate-400 dark:text-gray-500">Resolution Status:</span>
              <p className="text-sm font-medium">{violation.dispute_resolved ? "✓ Resolved By Board" : "⏳ Pending Board Action"}</p>
            </div>

            {violation.dispute_resolved && (
              <div>
                <span className="text-xs text-slate-400 dark:text-gray-500">Board Resolution:</span>
                <p className="text-sm bg-blue-500/10 text-blue-800 dark:text-blue-400 p-3 rounded-xl border border-blue-500/20 leading-relaxed font-sans">{violation.dispute_resolution}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions bar */}
        <div className="border-t border-slate-200 dark:border-white/10 pt-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          {/* Admin Actions */}
          {!isResident && !['CLOSED', 'RESOLVED', 'CANCELLED'].includes(violation.violation_status) && (
            <div className="flex flex-1 items-center gap-3 justify-between md:justify-start">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={selectedStatusId}
                    onChange={e => setSelectedStatusId(e.target.value)}
                    className="bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200/10 dark:border-white/10 rounded-xl pl-4 pr-10 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none appearance-none cursor-pointer"
                  >
                    {statuses.map(s => (
                      <option key={s.violation_status_id} value={s.violation_status_id} className="text-slate-900 dark:text-white">
                        {s.violation_status}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={16} />
                </div>
                <button
                  onClick={handleStatusChangeSubmit}
                  disabled={updatingStatus}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition disabled:opacity-50"
                >
                  {updatingStatus ? "Updating..." : "Update Status"}
                </button>
              </div>
              {canResolve && (
                <button
                  onClick={() => onResolve(violation.violation_id)}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-medium transition"
                >
                  Address Dispute
                </button>
              )}
            </div>
          )}

          {/* Resident Actions */}
          {isResident && (
            <div className="flex flex-1 justify-end gap-3">
              {canDispute && (
                <button
                  onClick={() => onDispute(violation.violation_id)}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-medium transition"
                >
                  Dispute Violation
                </button>
              )}
              {isUnpaid && (
                <button
                  onClick={() => onPay(violation)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition"
                >
                  Pay Fine
                </button>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="py-2.5 px-6 bg-slate-100 hover:bg-red-600 hover:text-white dark:bg-white/10 dark:hover:bg-red-600 dark:hover:text-white rounded-xl text-sm font-medium text-slate-700 dark:text-white text-center transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Violations Page ──────────────────────
const Violations = ({ community, user, setActivePage, setPaymentState }) => {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');


  // Modal control states
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [showDisputeModal, setShowDisputeModal]   = useState(false);
  const [showResolveModal, setShowResolveModal]   = useState(false);
  const [disputeViolationId, setDisputeViolationId] = useState(null);
  const [resolveViolationId, setResolveViolationId] = useState(null);
  const [allStatuses, setAllStatuses] = useState([]);

  // Role Check
  const role = user?.role_name || user?.role?.role_name || user?.role || '';
  const isResident = role.toLowerCase() === 'resident';

  const handleCreateTypeClick = () => {
    if (role === 'super_admin') {
      const isMember = user?.associated_community_ids?.includes(community?.community_id);
      if (!isMember) {
        alert("Platform administrators cannot create violation types unless they are registered as community members of this community.");
        return;
      }
    }
    setShowCreateModal(true);
  };

  const handleSubmitViolationClick = () => {
    if (role === 'super_admin') {
      const isMember = user?.associated_community_ids?.includes(community?.community_id);
      if (!isMember) {
        alert("Platform administrators cannot create violations unless they are registered as community members of this community.");
        return;
      }
    }
    setShowModal(true);
  };

  useEffect(() => {
    if (community?.community_id) {
      fetchViolations();
    }
  }, [community, statusFilter]);

  useEffect(() => {
    API.get('/violation/status')
      .then(r => setAllStatuses(r.data))
      .catch(console.error);
  }, []);

  const fetchViolations = async () => {
    try {
      setLoading(true);
      const url = statusFilter
        ? `/violation/${community.community_id}?status=${statusFilter}&limit=50`
        : `/violation/${community.community_id}?limit=50`;
      const res = await API.get(url);
      setViolations(res.data);



      // Update selected violation to get fresh changes inside the open detail view
      if (selectedViolation) {
        const fresh = all.find(item => item.violation_id === selectedViolation.violation_id);
        if (fresh) {
          setSelectedViolation(fresh);
        }
      }
    } catch (err) {
      console.error('Violations fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (violationId, statusId) => {
    try {
      await API.put(`/violation/${violationId}/status`, {
        violation_status_id: parseInt(statusId),
        remarks: 'Status updated by Board Member'
      });
      alert("Violation status updated successfully!");
      fetchViolations();
      const updatedRes = await API.get(`/violation/detail/${violationId}`);
      setSelectedViolation(updatedRes.data);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update status");
    }
  };

  const handleDisputeSuccess = async () => {
    alert("Appeal filed successfully!");
    fetchViolations();
    if (selectedViolation) {
      const updatedRes = await API.get(`/violation/detail/${selectedViolation.violation_id}`);
      setSelectedViolation(updatedRes.data);
    }
  };

  const handleResolveSuccess = async () => {
    alert("Dispute resolved successfully!");
    fetchViolations();
    if (selectedViolation) {
      const updatedRes = await API.get(`/violation/detail/${selectedViolation.violation_id}`);
      setSelectedViolation(updatedRes.data);
    }
  };

  const handlePayViolation = (v) => {
    setPaymentState({
      amount: v.amount + (v.late_charge_applied || 0),
      reason: 'VIOLATION',
      reference_id: v.violation_id,
      title: `Violation Fine: ${v.violation_type_name}`
    });
    setActivePage('payments');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const statuses = ['', 'OPEN', 'IN_PROGRESS', 'APPEALED', 'PAID', 'RESOLVED', 'CLOSED', 'CANCELLED'];

  // Derive stats dynamically based on current view (Resident/Admin)
  const residentOrAllViolations = isResident 
    ? violations.filter(v => v.client_id === user?.user_id)
    : violations;

  const stats = {
    open:     residentOrAllViolations.filter(v => v.violation_status === 'OPEN').length,
    paid:     residentOrAllViolations.filter(v => v.violation_status === 'PAID').length,
    disputed: residentOrAllViolations.filter(v => v.violation_status === 'APPEALED').length,
    closed:   residentOrAllViolations.filter(v => ['CLOSED', 'RESOLVED'].includes(v.violation_status)).length,
  };

  const filteredViolations = violations.filter(v => {
    // If viewing as resident, only show violations belonging to the current user
    if (isResident && v.client_id !== user?.user_id) {
      return false;
    }
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const name = (v.client_name || `User #${v.client_id}`).toLowerCase();
    const type = (v.violation_type_name || '').toLowerCase();
    const remarks = (v.remarks || '').toLowerCase();
    return name.includes(term) || type.includes(term) || remarks.includes(term);
  });

  return (
    <div className="text-slate-900 dark:text-white">
      {/* Compact Page Header Row */}
      <div className="flex flex-row justify-between items-center mb-5 pb-3 border-b border-slate-200/60 dark:border-white/5">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Violations
        </h1>
        {!isResident && (
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={handleCreateTypeClick}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 text-white whitespace-nowrap"
            >
              <Plus size={13} /> Create Type
            </button>
            <button
              onClick={handleSubmitViolationClick}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 text-white whitespace-nowrap"
            >
              <Plus size={13} /> Submit Violation
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 mb-8">
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-4 sm:p-6 shadow-sm">
          <p className="text-slate-500 dark:text-gray-400 text-sm">Total Open</p>
          <p className="text-3xl sm:text-5xl font-mono font-bold text-red-600 dark:text-red-400 mt-2">{stats.open}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-4 sm:p-6 shadow-sm">
          <p className="text-slate-500 dark:text-gray-400 text-sm">Paid</p>
          <p className="text-3xl sm:text-5xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-2">{stats.paid}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-4 sm:p-6 shadow-sm">
          <p className="text-slate-500 dark:text-gray-400 text-sm">Disputed</p>
          <p className="text-3xl sm:text-5xl font-mono font-bold text-amber-600 dark:text-amber-500 mt-2">{stats.disputed}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-4 sm:p-6 shadow-sm">
          <p className="text-slate-500 dark:text-gray-400 text-sm">Pending Board Review</p>
          <p className="text-3xl sm:text-5xl font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-2">{stats.pending}</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
        
        {/* Table Top Bar */}
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">All Violations</h2>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-550" size={18} />
              <input
                type="text"
                placeholder="Search violations..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#1e3248] border border-slate-200 dark:border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none placeholder-slate-400 dark:placeholder-gray-500"
              />
            </div>

            <div className="relative w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#1e3248] border border-slate-200 dark:border-white/10 rounded-2xl pl-4 pr-10 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none appearance-none cursor-pointer"
              >
                {statuses.map(s => (
                  <option key={s} value={s} className="text-slate-900 dark:text-white">{s || 'Filter'}</option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={15} />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading && violations.length === 0 ? (
            <div className="p-10 text-center text-slate-500 dark:text-gray-400">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Loading violations...
            </div>
          ) : filteredViolations.length === 0 ? (
            <div className="p-10 text-center text-slate-500 dark:text-gray-400">
              <AlertTriangle size={32} className="mx-auto mb-3 opacity-50" />
              No violations found.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 text-sm">
                  <th className="text-left px-3 py-4">Member</th>
                  <th className="text-left px-3 py-4">Type</th>
                  <th className="text-left px-3 py-4 whitespace-nowrap">Fine</th>
                  <th className="text-left px-3 py-4 whitespace-nowrap">Date</th>
                  <th className="text-left px-3 py-4 whitespace-nowrap">Due Date</th>
                  <th className="text-left px-3 py-4 whitespace-nowrap">Status</th>
                  <th className="text-left px-3 py-4 whitespace-nowrap">Disputed</th>
                </tr>
              </thead>
              <tbody>
                {filteredViolations.map((v) => (
                  <tr
                    key={v.violation_id}
                    onClick={() => setSelectedViolation(v)}
                    className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <td className="px-3 py-4 font-medium text-slate-900 dark:text-white">
                      {v.client_name || `User #${v.client_id}`}
                    </td>
                    <td className="px-3 py-4 text-slate-500 dark:text-gray-400">
                      {v.violation_type_name || '—'}
                    </td>
                    <td className="px-3 py-4 font-mono text-slate-900 dark:text-white whitespace-nowrap">
                      ${v.amount}
                      {v.late_charge_applied > 0 && (
                        <span className="text-red-600 dark:text-red-400 text-xs ml-1">
                          +${v.late_charge_applied} late
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-slate-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(v.violation_date)}
                    </td>
                    <td className="px-3 py-4 text-slate-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(v.violation_due_date)}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <StatusBadge status={v.violation_status} />
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      {v.is_disputed ? (
                        <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">
                          {v.dispute_resolved ? '✓ Resolved' : '⏳ Pending'}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-gray-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Creation and detail modals */}
      {showModal && (
        <SubmitModal
          communityId={community?.community_id}
          onClose={() => setShowModal(false)}
          onSuccess={fetchViolations}
        />
      )}
      {showCreateModal && (
        <CreateTypeModal 
          communityId={community?.community_id} 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => { setShowCreateModal(false); fetchViolations(); }} 
        />
      )}

      {selectedViolation && (
        <ViolationDetailModal
          violation={selectedViolation}
          isResident={isResident}
          statuses={allStatuses}
          onClose={() => setSelectedViolation(null)}
          onDispute={(id) => {
            setDisputeViolationId(id);
            setShowDisputeModal(true);
          }}
          onResolve={(id) => {
            setResolveViolationId(id);
            setShowResolveModal(true);
          }}
          onStatusChange={handleStatusChange}
          onPay={handlePayViolation}
        />
      )}

      {showDisputeModal && (
        <DisputeModal
          communityId={community?.community_id}
          violationId={disputeViolationId}
          onClose={() => {
            setShowDisputeModal(false);
            setDisputeViolationId(null);
          }}
          onSuccess={handleDisputeSuccess}
        />
      )}

      {showResolveModal && (
        <ResolveDisputeModal
          violationId={resolveViolationId}
          statuses={allStatuses}
          onClose={() => {
            setShowResolveModal(false);
            setResolveViolationId(null);
          }}
          onSuccess={handleResolveSuccess}
        />
      )}
    </div>
  );
};

export default Violations;