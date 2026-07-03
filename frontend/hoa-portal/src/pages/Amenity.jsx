import React, { useState, useEffect } from 'react';
import { Calendar, Plus, RefreshCw, X, Clock, ChevronDown, Trash2 } from 'lucide-react';
import API from '../services/api';
import { onlyDigitsKeyPress, onlyDecimalKeyPress } from '../utils/fieldValidators';

const StatusBadge = ({ booking }) => {
  const status = booking?.status;
  const isUnpaid = booking?.fee_amount > 0 && !booking?.is_paid;
  
  let displayStatus = status;
  let badgeClass = 'bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400';
  
  if (status === 'APPROVED') {
    if (isUnpaid) {
      displayStatus = 'PAYMENT PENDING';
      badgeClass = 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300';
    } else {
      displayStatus = 'Amenity booked';
      badgeClass = 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400';
    }
  } else if (status === 'PENDING') {
    if (isUnpaid) {
      displayStatus = 'PAYMENT PENDING';
      badgeClass = 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300';
    } else {
      displayStatus = 'PENDING';
      badgeClass = 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300';
    }
  } else if (status === 'CANCELLED') {
    displayStatus = 'CANCELLED';
    badgeClass = 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400';
  } else if (status === 'COMPLETED') {
    displayStatus = 'COMPLETED';
    badgeClass = 'bg-slate-100 text-slate-600 dark:bg-gray-500/20 dark:text-gray-400';
  }
  
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>{displayStatus}</span>;
};

const BookModal = ({ amenity, communityId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [confirmTick, setConfirmTick] = useState(false);
  
  // Local today string (YYYY-MM-DD)
  const localToday = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  const [form, setForm] = useState({
    booking_date: localToday,
    slot_number: '',
  });

  useEffect(() => {
    if (form.booking_date && amenity) checkAvailability();
  }, [form.booking_date]);

  const checkAvailability = async () => {
    try {
      const res = await API.get(`/amenity/${amenity.amenity_id}/availability?booking_date=${form.booking_date}`);
      setAvailability(res.data);
    } catch { }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/amenity/booking', {
        amenity_id: amenity.amenity_id,
        community_id: communityId,
        booking_date: form.booking_date,
        slot_number: parseInt(form.slot_number),
      });
      if (amenity.fee_enabled && amenity.booking_fee > 0) {
        alert("The Amenity will be booked only if the Payment is made");
      } else {
        alert("Amenity booked successfully!");
      }
      onSuccess(); onClose();
    } catch (err) {
      alert(err.response?.data?.detail || 'Booking failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:from-[#1E2E42] dark:to-[#162535] dark:bg-gradient-to-br rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Book {amenity.name}</h3>
            {amenity.fee_enabled && <p className="text-blue-600 dark:text-blue-400 text-sm mt-0.5 font-medium font-mono">Fee: ${amenity.booking_fee}</p>}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Booking Date</label>
            <input
              type="date"
              required
              value={form.booking_date}
              min={localToday}
              onChange={e => setForm({ ...form, booking_date: e.target.value })}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 
               rounded-xl px-4 py-3 text-sm 
               text-slate-900 dark:text-white 
               focus:outline-none focus:ring-2 focus:ring-teal-500
               dark:[color-scheme:dark]"
            />
          </div>

          {availability && (
            <div>
              <label className="text-xs text-slate-500 dark:text-gray-400 mb-2 block">Select Time Slot</label>
              <div className="space-y-2">
                <button type="button"
                  disabled={!availability.slot_1_available}
                  onClick={() => setForm({ ...form, slot_number: '1' })}
                  className={`w-full p-3 rounded-xl border text-sm text-left transition ${form.slot_number === '1'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : availability.slot_1_available
                      ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white'
                      : 'border-slate-100 bg-slate-100 text-slate-400 dark:border-white/5 dark:bg-white/5 dark:text-gray-600 cursor-not-allowed'
                    }`}>
                  <div className="flex items-center justify-between">
                    <span>🌅 Slot 1 — {availability.slot_1_time}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${availability.slot_1_available ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400'}`}>
                      {availability.slot_1_available ? 'Available' : 'Booked'}
                    </span>
                  </div>
                </button>
                <button type="button"
                  disabled={!availability.slot_2_available}
                  onClick={() => setForm({ ...form, slot_number: '2' })}
                  className={`w-full p-3 rounded-xl border text-sm text-left transition ${form.slot_number === '2'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : availability.slot_2_available
                      ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white'
                      : 'border-slate-100 bg-slate-100 text-slate-400 dark:border-white/5 dark:bg-white/5 dark:text-gray-600 cursor-not-allowed'
                    }`}>
                  <div className="flex items-center justify-between">
                    <span>🌆 Slot 2 — {availability.slot_2_time}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${availability.slot_2_available ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400'}`}>
                      {availability.slot_2_available ? 'Available' : 'Booked'}
                    </span>
                  </div>
                </button>
              </div>

              {/* Confirm Booking checkbox field */}
              <div className="flex items-center gap-2 mt-4 bg-slate-50 dark:bg-[#0D1B2A]/30 p-3 rounded-xl border border-slate-200 dark:border-white/10">
                <input
                  type="checkbox"
                  id="confirm-booking-tick"
                  checked={confirmTick}
                  onChange={(e) => setConfirmTick(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-teal-500 cursor-pointer animate-pulse"
                />
                <label htmlFor="confirm-booking-tick" className="text-sm text-slate-700 dark:text-gray-300 font-medium cursor-pointer select-none">
                  Confirm Booking
                </label>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white rounded-xl text-sm font-medium transition cancel-button-red-hover">Cancel</button>
            <button type="submit" disabled={loading || !form.slot_number || !confirmTick}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition disabled:opacity-50">
              {loading ? 'Booking...' : (amenity.fee_enabled && amenity.booking_fee > 0 ? 'Proceed to Pay' : 'Confirm Booking')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CreateAmenityModal = ({ communityId, communityName, onClose, onSuccess }) => {
  const [types, setTypes] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amenity_type_id: '',
    name: '',
    description: '',
    location: '',
    capacity: '',
    fee_enabled: false,
    booking_fee: 0,
    slot1_start: '08:00',
    slot1_end: '20:00',
    pool_open: true,
    tentative_open_date: '',
    is_pool_reserved: false
  });

  useEffect(() => {
    API.get('/amenity/type')
      .then(res => setTypes(res.data || []))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(errors).length > 0) {
      alert("Please fix the validation errors before saving.");
      return;
    }
    setLoading(true);
    try {
      await API.post('/amenity', {
        ...form,
        community_id: communityId,
        amenity_type_id: parseInt(form.amenity_type_id),
        capacity: form.capacity ? parseInt(form.capacity) : null,
        booking_fee: parseFloat(form.booking_fee) || 0.0,
        tentative_open_date: form.tentative_open_date || null
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create amenity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:from-[#1E2E42] dark:to-[#162535] dark:bg-gradient-to-br rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Create Amenity</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Name</label>
            <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Amenity Type</label>
            <select required value={form.amenity_type_id} onChange={e => setForm({ ...form, amenity_type_id: e.target.value })}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500">
              <option value="">Select type...</option>
              {types.map(t => (
                <option key={t.amenity_type_id} value={t.amenity_type_id}>{t.type_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Community</label>
            <input type="text" disabled value={communityName || 'Current Community'}
              className="w-full bg-slate-100 dark:bg-[#0D1B2A]/50 border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-sm text-slate-500 dark:text-gray-400 cursor-not-allowed" />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Location</label>
              <input type="text" required value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Capacity</label>
              <input type="number" min="1" required value={form.capacity}
                onKeyPress={onlyDigitsKeyPress}
                onChange={e => {
                  const val = e.target.value;
                  setForm({ ...form, capacity: val });
                  if (val && (isNaN(parseInt(val, 10)) || parseInt(val, 10) < 1)) {
                    setErrors(prev => ({ ...prev, capacity: 'Capacity must be at least 1' }));
                  } else {
                    setErrors(prev => {
                      const next = { ...prev };
                      delete next.capacity;
                      return next;
                    });
                  }
                }}
                className={`w-full bg-slate-50 dark:bg-[#0D1B2A] border rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.capacity ? 'border-red-500' : 'border-slate-200 dark:border-white/20'}`} />
              {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-[#1e3248] p-3 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700 dark:text-gray-200 font-medium">Require Booking Fee</span>
              <input type="checkbox" checked={form.fee_enabled} onChange={e => setForm({ ...form, fee_enabled: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-teal-500" />
            </div>
            {form.fee_enabled && (
              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Booking Fee ($)</label>
                <input type="number" min="0" step="0.01" value={form.booking_fee}
                  onKeyPress={onlyDecimalKeyPress}
                  onChange={e => {
                    const val = e.target.value;
                    setForm({ ...form, booking_fee: val });
                    if (val === '' || isNaN(parseFloat(val))) {
                      setErrors(prev => ({ ...prev, booking_fee: 'Booking fee is required' }));
                    } else if (parseFloat(val) < 0) {
                      setErrors(prev => ({ ...prev, booking_fee: 'Booking fee cannot be negative' }));
                    } else {
                      setErrors(prev => {
                        const next = { ...prev };
                        delete next.booking_fee;
                        return next;
                      });
                    }
                  }}
                  className={`w-full bg-white dark:bg-[#0D1B2A] border rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.booking_fee ? 'border-red-500' : 'border-slate-200 dark:border-white/20'}`} />
                {errors.booking_fee && <p className="text-red-500 text-xs mt-1">{errors.booking_fee}</p>}
              </div>
            )}
          </div>
          <div className="bg-slate-50 dark:bg-[#1e3248] p-3 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Custom Time Slot</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 dark:text-gray-400 mb-1 block">Slot Start Time</label>
                <input type="text" placeholder="08:00" value={form.slot1_start} onChange={e => setForm({ ...form, slot1_start: e.target.value })}
                  className="w-full bg-white dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white text-center focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 dark:text-gray-400 mb-1 block">Slot End Time</label>
                <input type="text" placeholder="20:00" value={form.slot1_end} onChange={e => setForm({ ...form, slot1_end: e.target.value })}
                  className="w-full bg-white dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white text-center focus:outline-none" />
              </div>
            </div>
            
            <div className="border-t border-slate-200 dark:border-white/10 my-2 pt-2"></div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700 dark:text-gray-200 font-medium">Pool/Amenity Status</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, pool_open: true, tentative_open_date: '' })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${form.pool_open ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white'}`}
                >
                  Pool Open
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, pool_open: false })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${!form.pool_open ? 'bg-red-600 text-white shadow-sm' : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white'}`}
                >
                  Pool Close
                </button>
              </div>
            </div>

            {!form.pool_open && (
              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Tentative Open Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.tentative_open_date}
                  onChange={e => setForm({ ...form, tentative_open_date: e.target.value })}
                  className="w-full bg-white dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 dark:[color-scheme:dark]"
                />
              </div>
            )}

            <div className="border-t border-slate-200 dark:border-white/10 my-2 pt-2"></div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700 dark:text-gray-200 font-medium">Reserve Pool (Event/Party)</span>
                <input
                  type="checkbox"
                  checked={form.is_pool_reserved}
                  onChange={e => setForm({ ...form, is_pool_reserved: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-teal-500"
                />
              </div>
              <p className="text-[9px] text-slate-400 dark:text-gray-500">
                If reserved, the pool is closed for generic homeowner bookings.
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 dark:bg-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-white transition-colors cancel-button-red-hover">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditAmenityModal = ({ amenity, communityName, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const toLocalISOString = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const offset = d.getTimezoneOffset();
    const localTime = new Date(d.getTime() - (offset * 60 * 1000));
    return localTime.toISOString().slice(0, 16);
  };

  const [form, setForm] = useState({
    name: amenity.name || '',
    description: amenity.description || '',
    location: amenity.location || '',
    capacity: amenity.capacity || '',
    fee_enabled: amenity.fee_enabled || false,
    booking_fee: amenity.booking_fee || 0.0,
    active_status: amenity.active_status || false,
    slot1_start: amenity.slot1_start || '08:00',
    slot1_end: amenity.slot2_end || amenity.slot1_end || '20:00',
    pool_open: amenity.pool_open !== undefined ? amenity.pool_open : true,
    tentative_open_date: toLocalISOString(amenity.tentative_open_date),
    is_pool_reserved: amenity.is_pool_reserved || false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(errors).length > 0) {
      alert("Please fix the validation errors before saving.");
      return;
    }
    setLoading(true);
    try {
      await API.put(`/amenity/${amenity.amenity_id}`, {
        ...form,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        booking_fee: parseFloat(form.booking_fee) || 0.0,
        tentative_open_date: form.tentative_open_date || null
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update amenity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:from-[#1E2E42] dark:to-[#162535] dark:bg-gradient-to-br rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit {amenity.name}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Name</label>
            <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Community</label>
            <input type="text" disabled value={communityName || amenity.community_name || 'Current Community'}
              className="w-full bg-slate-100 dark:bg-[#0D1B2A]/50 border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-sm text-slate-500 dark:text-gray-400 cursor-not-allowed" />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Location</label>
              <input type="text" required value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Capacity</label>
              <input type="number" min="1" required value={form.capacity}
                onKeyPress={onlyDigitsKeyPress}
                onChange={e => {
                  const val = e.target.value;
                  setForm({ ...form, capacity: val });
                  if (val && (isNaN(parseInt(val, 10)) || parseInt(val, 10) < 1)) {
                    setErrors(prev => ({ ...prev, capacity: 'Capacity must be at least 1' }));
                  } else {
                    setErrors(prev => {
                      const next = { ...prev };
                      delete next.capacity;
                      return next;
                    });
                  }
                }}
                className={`w-full bg-slate-50 dark:bg-[#0D1B2A] border rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.capacity ? 'border-red-500' : 'border-slate-200 dark:border-white/20'}`} />
              {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-[#1e3248] p-3 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700 dark:text-gray-200 font-medium">Require Booking Fee</span>
              <input type="checkbox" checked={form.fee_enabled} onChange={e => setForm({ ...form, fee_enabled: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-teal-500" />
            </div>
            {form.fee_enabled && (
              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Booking Fee ($)</label>
                <input type="number" min="0" step="0.01" value={form.booking_fee}
                  onKeyPress={onlyDecimalKeyPress}
                  onChange={e => {
                    const val = e.target.value;
                    setForm({ ...form, booking_fee: val });
                    if (val === '' || isNaN(parseFloat(val))) {
                      setErrors(prev => ({ ...prev, booking_fee: 'Booking fee is required' }));
                    } else if (parseFloat(val) < 0) {
                      setErrors(prev => ({ ...prev, booking_fee: 'Booking fee cannot be negative' }));
                    } else {
                      setErrors(prev => {
                        const next = { ...prev };
                        delete next.booking_fee;
                        return next;
                      });
                    }
                  }}
                  className={`w-full bg-white dark:bg-[#0D1B2A] border rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.booking_fee ? 'border-red-500' : 'border-slate-200 dark:border-white/20'}`} />
                {errors.booking_fee && <p className="text-red-500 text-xs mt-1">{errors.booking_fee}</p>}
              </div>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-[#1e3248] p-3 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Custom Time Slot</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 dark:text-gray-400 mb-1 block">Slot Start Time</label>
                <input type="text" placeholder="08:00" value={form.slot1_start} onChange={e => setForm({ ...form, slot1_start: e.target.value })}
                  className="w-full bg-white dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white text-center focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 dark:text-gray-400 mb-1 block">Slot End Time</label>
                <input type="text" placeholder="20:00" value={form.slot1_end} onChange={e => setForm({ ...form, slot1_end: e.target.value })}
                  className="w-full bg-white dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white text-center focus:outline-none" />
              </div>
            </div>
            
            <div className="border-t border-slate-200 dark:border-white/10 my-2 pt-2"></div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700 dark:text-gray-200 font-medium">Pool/Amenity Status</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, pool_open: true, tentative_open_date: '' })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${form.pool_open ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white'}`}
                >
                  Pool Open
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, pool_open: false })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${!form.pool_open ? 'bg-red-600 text-white shadow-sm' : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white'}`}
                >
                  Pool Close
                </button>
              </div>
            </div>

            {!form.pool_open && (
              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Tentative Open Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.tentative_open_date}
                  onChange={e => setForm({ ...form, tentative_open_date: e.target.value })}
                  className="w-full bg-white dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 dark:[color-scheme:dark]"
                />
              </div>
            )}

            <div className="border-t border-slate-200 dark:border-white/10 my-2 pt-2"></div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700 dark:text-gray-200 font-medium">Reserve Pool (Event/Party)</span>
                <input
                  type="checkbox"
                  checked={form.is_pool_reserved}
                  onChange={e => setForm({ ...form, is_pool_reserved: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-teal-500"
                />
              </div>
              <p className="text-[9px] text-slate-400 dark:text-gray-500">
                If reserved, the pool is closed for generic homeowner bookings.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-50 dark:bg-[#1e3248] p-4 rounded-2xl">
            <span className="text-sm text-slate-700 dark:text-gray-200 font-medium">Active Status</span>
            <input type="checkbox" checked={form.active_status} onChange={e => setForm({ ...form, active_status: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-teal-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 dark:bg-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-white transition-colors cancel-button-red-hover">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Amenity = ({ community, user, setActivePage, setPaymentState }) => {
  const [amenities, setAmenities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('amenities');
  const [bookModal, setBookModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const role = user?.role_name || user?.role || '';
  const isAdmin = ['super_admin', 'property_manager', 'board_member'].includes(role);

  const handleCreateAmenityClick = () => {
    if (role === 'super_admin') {
      const isMember = user?.associated_community_ids?.includes(community?.community_id);
      if (!isMember) {
        alert("Platform administrators cannot create amenities unless they are registered as community members of this community.");
        return;
      }
    }
    setShowCreateModal(true);
  };

  const handleBookAmenityClick = (a) => {
    if (role === 'super_admin') {
      const isMember = user?.associated_community_ids?.includes(community?.community_id);
      if (!isMember) {
        alert("Platform administrators cannot book amenities unless they are registered as community members of this community.");
        return;
      }
    }
    setBookModal(a);
  };

  useEffect(() => {
    if (community?.community_id) {
      activeTab === 'amenities' ? fetchAmenities() : fetchBookings();
    }
  }, [community, activeTab, statusFilter]);

  const fetchAmenities = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/amenity/${community.community_id}`);
      setAmenities(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const url = statusFilter
        ? `/amenity/booking/${community.community_id}?status=${statusFilter}&limit=50`
        : `/amenity/booking/${community.community_id}?limit=50`;
      const res = await API.get(url);
      setBookings(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleApprove = async (bookingId) => {
    try {
      await API.put(`/amenity/booking/${bookingId}/approve`);
      fetchBookings();
    } catch (err) { alert(err.response?.data?.detail || 'Error approving'); }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await API.put(`/amenity/booking/${bookingId}/cancel`, { cancel_reason: 'Cancelled by user' });
      fetchBookings();
    } catch (err) { alert(err.response?.data?.detail || 'Error cancelling'); }
  };

  const handleDelete = async (amenityId, amenityName) => {
    if (!window.confirm(`Are you sure you want to delete the amenity "${amenityName}"?`)) return;
    try {
      setLoading(true);
      await API.put(`/amenity/${amenityId}`, { active_status: false });
      alert("✅ Amenity Deleted Successfully!");
      fetchAmenities();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error deleting amenity');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = (booking) => {
    setPaymentState({
      dueItem: {
        amount: booking.fee_amount,
        reason: 'AMENITY_BOOKING',
        reference_id: booking.booking_id,
        title: `Amenity Booking: ${booking.amenity_name} (${formatDate(booking.booking_date)})`,
        id: booking.booking_id
      }
    });
    setActivePage('payments');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const dateOnly = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = dateOnly.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="text-slate-900 dark:text-white">
      {/* Compact Page Header Row */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5 pb-3 border-b border-slate-200/60 dark:border-white/5">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Amenity Booking
        </h1>
        {isAdmin && (
          <button onClick={handleCreateAmenityClick}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/25 whitespace-nowrap">
            <Plus size={13} /> Create Amenity
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['amenities', 'bookings'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-2xl text-sm font-medium transition capitalize ${activeTab === tab ? 'bg-blue-600 hover:bg-blue-700 text-white hover:text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-gray-400 dark:hover:bg-white/20'
              }`}>
            {tab === 'amenities' ? '🏊 Amenities' : '📅 Bookings'}
          </button>
        ))}
      </div>

      {activeTab === 'amenities' && (
        <div>
          {loading && amenities.length === 0 ? (
            <div className="text-center py-20 text-slate-500 dark:text-gray-400">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            </div>
          ) : amenities.length === 0 ? (
            <div className="text-center py-20 text-slate-500 dark:text-gray-400">
              <Calendar size={40} className="mx-auto mb-3 opacity-50" />
              No amenities available.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {amenities.map(a => (
                <div key={a.amenity_id} className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 hover:border-blue-500/40 transition shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{a.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{a.amenity_type_name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${a.active_status ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400'}`}>
                        {a.active_status ? 'Active' : 'Inactive'}
                      </span>
                      {!a.pool_open ? (
                        <span className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 rounded-full font-semibold">
                          Closed
                        </span>
                      ) : a.is_pool_reserved ? (
                        <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 rounded-full font-semibold">
                          Reserved
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-full font-semibold">
                          Open
                        </span>
                      )}
                    </div>
                  </div>

                  {a.description && <p className="text-slate-500 dark:text-gray-400 text-sm mb-4">{a.description}</p>}

                  <div className="space-y-2 mb-4 text-sm">
                    {a.location && <div className="flex justify-between text-slate-800 dark:text-slate-200"><span className="text-slate-500 dark:text-gray-400">Location</span><span>{a.location}</span></div>}
                    {a.capacity && <div className="flex justify-between text-slate-800 dark:text-slate-200"><span className="text-slate-500 dark:text-gray-400">Capacity</span><span>{a.capacity} people</span></div>}
                    <div className="flex justify-between text-slate-800 dark:text-slate-200">
                      <span className="text-slate-500 dark:text-gray-400">Booking Fee</span>
                      <span className={a.fee_enabled ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-400 dark:text-gray-500'}>
                        {a.fee_enabled ? `$${a.booking_fee}` : 'Free'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-0 rounded-2xl p-3 mb-4 text-xs space-y-1">
                    <div className="flex justify-between text-slate-500 dark:text-gray-400">
                      <span>🕐 Time Slot</span><span className="text-slate-800 dark:text-slate-200">{a.slot1_start} - {a.slot2_end || a.slot1_end}</span>
                    </div>
                    {!a.pool_open && a.tentative_open_date && (
                      <div className="text-[10px] text-red-500 dark:text-red-400 font-medium pt-1 mt-1 border-t border-slate-200/50 dark:border-white/5">
                        Tentative Open: {new Date(a.tentative_open_date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {isAdmin ? (
                      <>
                        <button
                          onClick={() => setEditModal(a)}
                          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-2xl text-sm font-medium transition border border-slate-200 dark:border-white/10 font-sans"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(a.amenity_id, a.name)}
                          className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-600 text-red-600 hover:text-white dark:bg-red-500/20 dark:hover:bg-red-600 rounded-2xl transition border border-red-500/20 dark:border-red-500/30 text-sm font-medium flex items-center justify-center gap-1.5"
                          title="Delete Amenity"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleBookAmenityClick(a)}
                        disabled={!a.active_status || !a.pool_open || a.is_pool_reserved}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        {!a.pool_open ? 'Closed' : a.is_pool_reserved ? 'Reserved' : 'Book Now'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'bookings' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 dark:text-white">{isAdmin ? 'All Bookings' : 'My Bookings'}</h2>
            <div className="relative">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-[#1E3248] border border-slate-200 dark:border-white/10 rounded-2xl pl-4 pr-10 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none appearance-none cursor-pointer">
                {['', 'PENDING', 'APPROVED', 'CANCELLED', 'COMPLETED'].map(s => (
                  <option key={s} value={s} className="text-slate-900 dark:text-white">{s || 'All Status'}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={16} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
            {loading && bookings.length === 0 ? (
              <div className="p-16 text-center text-slate-500 dark:text-gray-400">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-16 text-center text-slate-500 dark:text-gray-400">
                <Calendar size={32} className="mx-auto mb-3 opacity-50" />
                No bookings found.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {bookings.map(b => (
                  <div key={b.booking_id} className="p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition">
                    {/* Top row: icon + name + status badge */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Calendar size={20} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Name + status - stacked on mobile */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base truncate">{b.amenity_name}</h3>
                          <div className="flex-shrink-0"><StatusBadge booking={b} /></div>
                        </div>

                        {/* Meta info */}
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-500 dark:text-gray-400">
                          <span>📅 {formatDate(b.booking_date)}</span>
                          <span>🕐 {b.slot_start} - {b.slot_end}</span>
                          {isAdmin && <span>👤 {b.booked_by_name}</span>}
                          {b.fee_amount > 0 && (
                            <span className={b.is_paid ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}>
                              ${b.fee_amount} {b.is_paid ? '✓ Paid' : '⚠ Unpaid'}
                            </span>
                          )}
                        </div>

                        {/* Warning banner */}
                        {b.fee_amount > 0 && !b.is_paid && ['PENDING', 'APPROVED'].includes(b.status) && (
                          <div className="mt-2 text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 dark:border-amber-500/30 px-2.5 py-1 rounded-xl inline-flex items-center gap-1.5 w-fit font-medium">
                            <span>⚠ Payment required to confirm booking</span>
                          </div>
                        )}
                        {b.is_refunded && (
                          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 dark:border-blue-500/30 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 w-fit">
                            <span>💵 Refunded: ${b.refund_amount} on {formatDate(b.refund_date)}</span>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {/* Pay Fee — show for all communities when fee > 0 and unpaid */}
                          {!b.is_paid && b.fee_amount > 0 && ['PENDING', 'APPROVED'].includes(b.status) && (
                            <button onClick={() => handlePay(b)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shadow-sm flex items-center gap-1">
                              💳 Pay Fee
                            </button>
                          )}
                          {isAdmin && b.status === 'PENDING' && (
                            <button onClick={() => handleApprove(b.booking_id)}
                              className="px-3 py-1.5 bg-blue-500/10 dark:bg-blue-500/20 hover:bg-blue-500/20 dark:hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-medium transition">
                              ✓ Approve
                            </button>
                          )}
                          {b.status === 'PENDING' && (
                            <button onClick={() => handleCancel(b.booking_id)}
                              className="px-3 py-1.5 bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-medium transition">
                              ✕ Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {bookModal && (
        <BookModal amenity={bookModal} communityId={community?.community_id}
          onClose={() => setBookModal(null)} onSuccess={() => { fetchBookings(); setActiveTab('bookings'); }} />
      )}

      {editModal && (
        <EditAmenityModal amenity={editModal} communityName={community?.name}
          onClose={() => setEditModal(null)} onSuccess={() => { fetchAmenities(); }} />
      )}

      {showCreateModal && (
        <CreateAmenityModal communityId={community?.community_id} communityName={community?.name}
          onClose={() => setShowCreateModal(false)} onSuccess={() => { fetchAmenities(); }} />
      )}
    </div>
  );
};

export default Amenity;