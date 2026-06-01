import React, { useState, useEffect } from 'react';
import { Calendar, Plus, RefreshCw, X, Clock, ChevronDown } from 'lucide-react';
import API from '../services/api';

const StatusBadge = ({ status }) => {
  const map = {
    PENDING:   'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300',
    APPROVED:  'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400',
    CANCELLED: 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400',
    COMPLETED: 'bg-slate-100 text-slate-600 dark:bg-gray-500/20 dark:text-gray-400',
  };
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400'}`}>{status}</span>;
};

const BookModal = ({ amenity, communityId, onClose, onSuccess }) => {
  const [loading, setLoading]         = useState(false);
  const [availability, setAvailability] = useState(null);
  const [form, setForm] = useState({
    booking_date: new Date().toISOString().split('T')[0],
    slot_number:  '',
  });

  useEffect(() => {
    if (form.booking_date && amenity) checkAvailability();
  }, [form.booking_date]);

  const checkAvailability = async () => {
    try {
      const res = await API.get(`/amenity/${amenity.amenity_id}/availability?booking_date=${form.booking_date}`);
      setAvailability(res.data);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/amenity/booking', {
        amenity_id:   amenity.amenity_id,
        community_id: communityId,
        booking_date: form.booking_date,
        slot_number:  parseInt(form.slot_number),
      });
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
            {amenity.fee_enabled && <p className="text-teal-600 dark:text-teal-400 text-sm mt-0.5 font-medium font-mono">Fee: ${amenity.booking_fee}</p>}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Booking Date</label>
            <input type="date" required value={form.booking_date}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setForm({...form, booking_date: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>

          {availability && (
            <div>
              <label className="text-xs text-slate-500 dark:text-gray-400 mb-2 block">Select Time Slot</label>
              <div className="space-y-2">
                <button type="button"
                  disabled={!availability.slot_1_available}
                  onClick={() => setForm({...form, slot_number: '1'})}
                  className={`w-full p-3 rounded-xl border text-sm text-left transition ${
                    form.slot_number === '1'
                      ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400'
                      : availability.slot_1_available
                      ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white'
                      : 'border-slate-100 bg-slate-100 text-slate-400 dark:border-white/5 dark:bg-white/5 dark:text-gray-600 cursor-not-allowed'
                  }`}>
                  <div className="flex items-center justify-between">
                    <span>🌅 Slot 1 — {amenity.slot1_start || '08:00'} to {amenity.slot1_end || '14:00'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${availability.slot_1_available ? 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400' : 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400'}`}>
                      {availability.slot_1_available ? 'Available' : 'Booked'}
                    </span>
                  </div>
                </button>
                <button type="button"
                  disabled={!availability.slot_2_available}
                  onClick={() => setForm({...form, slot_number: '2'})}
                  className={`w-full p-3 rounded-xl border text-sm text-left transition ${
                    form.slot_number === '2'
                      ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400'
                      : availability.slot_2_available
                      ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white'
                      : 'border-slate-100 bg-slate-100 text-slate-400 dark:border-white/5 dark:bg-white/5 dark:text-gray-600 cursor-not-allowed'
                  }`}>
                  <div className="flex items-center justify-between">
                    <span>🌆 Slot 2 — {amenity.slot2_start || '14:00'} to {amenity.slot2_end || '20:00'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${availability.slot_2_available ? 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400' : 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400'}`}>
                      {availability.slot_2_available ? 'Available' : 'Booked'}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-xl text-sm font-medium transition">Cancel</button>
            <button type="submit" disabled={loading || !form.slot_number}
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-medium transition disabled:opacity-50">
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CreateAmenityModal = ({ communityId, onClose, onSuccess }) => {
  const [types, setTypes] = useState([]);
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
    slot1_end: '14:00',
    slot2_start: '14:00',
    slot2_end: '20:00'
  });

  useEffect(() => {
    API.get('/amenity/type')
      .then(res => setTypes(res.data || []))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/amenity', {
        ...form,
        community_id: communityId,
        amenity_type_id: parseInt(form.amenity_type_id),
        capacity: form.capacity ? parseInt(form.capacity) : null,
        booking_fee: parseFloat(form.booking_fee) || 0.0
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
            <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Amenity Type</label>
            <select required value={form.amenity_type_id} onChange={e => setForm({...form, amenity_type_id: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500">
              <option value="">Select type...</option>
              {types.map(t => (
                <option key={t.amenity_type_id} value={t.amenity_type_id}>{t.type_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Location</label>
              <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Capacity</label>
              <input type="number" min="1" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})}
                className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-[#1e3248] p-3 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700 dark:text-gray-200 font-medium">Require Booking Fee</span>
              <input type="checkbox" checked={form.fee_enabled} onChange={e => setForm({...form, fee_enabled: e.target.checked})}
                className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
            </div>
            {form.fee_enabled && (
              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Booking Fee ($)</label>
                <input type="number" min="0" step="0.01" value={form.booking_fee} onChange={e => setForm({...form, booking_fee: e.target.value})}
                  className="w-full bg-white dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            )}
          </div>
          <div className="bg-slate-50 dark:bg-[#1e3248] p-3 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase">Custom Time Slots</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 dark:text-gray-400 mb-1 block">Slot 1 Start</label>
                <input type="text" placeholder="08:00" value={form.slot1_start} onChange={e => setForm({...form, slot1_start: e.target.value})}
                  className="w-full bg-white dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white text-center focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 dark:text-gray-400 mb-1 block">Slot 1 End</label>
                <input type="text" placeholder="14:00" value={form.slot1_end} onChange={e => setForm({...form, slot1_end: e.target.value})}
                  className="w-full bg-white dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white text-center focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 dark:text-gray-400 mb-1 block">Slot 2 Start</label>
                <input type="text" placeholder="14:00" value={form.slot2_start} onChange={e => setForm({...form, slot2_start: e.target.value})}
                  className="w-full bg-white dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white text-center focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 dark:text-gray-400 mb-1 block">Slot 2 End</label>
                <input type="text" placeholder="20:00" value={form.slot2_end} onChange={e => setForm({...form, slot2_end: e.target.value})}
                  className="w-full bg-white dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white text-center focus:outline-none" />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-white">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditAmenityModal = ({ amenity, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name:          amenity.name || '',
    description:   amenity.description || '',
    location:      amenity.location || '',
    capacity:      amenity.capacity || '',
    fee_enabled:   amenity.fee_enabled || false,
    booking_fee:   amenity.booking_fee || 0.0,
    active_status: amenity.active_status || false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.put(`/amenity/${amenity.amenity_id}`, {
        ...form,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        booking_fee: parseFloat(form.booking_fee) || 0.0
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
            <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Location</label>
              <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Capacity</label>
              <input type="number" min="1" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})}
                className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-[#1e3248] p-3 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700 dark:text-gray-200 font-medium">Require Booking Fee</span>
              <input type="checkbox" checked={form.fee_enabled} onChange={e => setForm({...form, fee_enabled: e.target.checked})}
                className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
            </div>
            {form.fee_enabled && (
              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Booking Fee ($)</label>
                <input type="number" min="0" step="0.01" value={form.booking_fee} onChange={e => setForm({...form, booking_fee: e.target.value})}
                  className="w-full bg-white dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between bg-slate-50 dark:bg-[#1e3248] p-4 rounded-2xl">
            <span className="text-sm text-slate-700 dark:text-gray-200 font-medium">Active Status</span>
            <input type="checkbox" checked={form.active_status} onChange={e => setForm({...form, active_status: e.target.checked})}
              className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-white">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Amenity = ({ community, user, setActivePage, setPaymentState }) => {
  const [amenities, setAmenities]   = useState([]);
  const [bookings, setBookings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('amenities');
  const [bookModal, setBookModal]   = useState(null);
  const [editModal, setEditModal]   = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const role     = user?.role_name || user?.role || '';
  const isAdmin  = ['super_admin', 'property_manager', 'board_member'].includes(role);

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

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <div className="text-slate-900 dark:text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Amenity Booking</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1">{community?.name}</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            onClick={() => activeTab === 'amenities' ? fetchAmenities() : fetchBookings()}
            disabled={loading}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-2xl text-sm font-semibold transition flex items-center gap-2 text-slate-700 dark:text-white disabled:opacity-60"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          {isAdmin && (
            <button onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-teal-500/25">
              <Plus size={15} /> Create Amenity
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {['amenities', 'bookings'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-2xl text-sm font-medium transition capitalize ${
              activeTab === tab ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-gray-400 dark:hover:bg-white/20'
            }`}>
            {tab === 'amenities' ? '🏊 Amenities' : '📅 Bookings'}
          </button>
        ))}
      </div>

      {activeTab === 'amenities' && (
        <div>
          {loading && amenities.length === 0 ? (
            <div className="text-center py-20 text-slate-500 dark:text-gray-400">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            </div>
          ) : amenities.length === 0 ? (
            <div className="text-center py-20 text-slate-500 dark:text-gray-400">
              <Calendar size={40} className="mx-auto mb-3 opacity-50" />
              No amenities available.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {amenities.map(a => (
                <div key={a.amenity_id} className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 hover:border-teal-500/40 transition shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{a.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{a.amenity_type_name}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${a.active_status ? 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400' : 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400'}`}>
                      {a.active_status ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {a.description && <p className="text-slate-500 dark:text-gray-400 text-sm mb-4">{a.description}</p>}

                  <div className="space-y-2 mb-4 text-sm">
                    {a.location && <div className="flex justify-between text-slate-800 dark:text-slate-200"><span className="text-slate-500 dark:text-gray-400">Location</span><span>{a.location}</span></div>}
                    {a.capacity && <div className="flex justify-between text-slate-800 dark:text-slate-200"><span className="text-slate-500 dark:text-gray-400">Capacity</span><span>{a.capacity} people</span></div>}
                    <div className="flex justify-between text-slate-800 dark:text-slate-200">
                      <span className="text-slate-500 dark:text-gray-400">Booking Fee</span>
                      <span className={a.fee_enabled ? 'text-teal-600 dark:text-teal-400 font-medium' : 'text-slate-400 dark:text-gray-500'}>
                        {a.fee_enabled ? `$${a.booking_fee}` : 'Free'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-0 rounded-2xl p-3 mb-4 text-xs space-y-1">
                    <div className="flex justify-between text-slate-500 dark:text-gray-400">
                      <span>🌅 Slot 1</span><span className="text-slate-800 dark:text-slate-200">{a.slot1_start} - {a.slot1_end}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-gray-400">
                      <span>🌆 Slot 2</span><span className="text-slate-800 dark:text-slate-200">{a.slot2_start} - {a.slot2_end}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {isAdmin && (
                      <button
                        onClick={() => setEditModal(a)}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-2xl text-sm font-medium transition border border-slate-200 dark:border-white/10"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => setBookModal(a)}
                      disabled={!a.active_status}
                      className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      Book Now
                    </button>
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
                className="bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl pl-3 pr-8 py-2 text-sm text-slate-900 dark:text-white focus:outline-none appearance-none cursor-pointer">
                {['', 'PENDING', 'APPROVED', 'CANCELLED', 'COMPLETED'].map(s => (
                  <option key={s} value={s} className="text-slate-900 dark:text-white">{s || 'All Status'}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={16} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
            {loading && bookings.length === 0 ? (
              <div className="p-16 text-center text-slate-500 dark:text-gray-400">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-16 text-center text-slate-500 dark:text-gray-400">
                <Calendar size={32} className="mx-auto mb-3 opacity-50" />
                No bookings found.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {bookings.map(b => (
                  <div key={b.booking_id} className="p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-500/10 dark:bg-teal-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Calendar size={22} className="text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{b.amenity_name}</h3>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-500 dark:text-gray-400">
                        <span>📅 {formatDate(b.booking_date)}</span>
                        <span>🕐 {b.slot_start} - {b.slot_end}</span>
                        {isAdmin && <span>👤 {b.booked_by_name}</span>}
                        {b.fee_amount > 0 && <span className={b.is_paid ? 'text-teal-600 dark:text-teal-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}>
                          ${b.fee_amount} {b.is_paid ? '✓ Paid' : '⚠ Unpaid'}
                        </span>}
                      </div>
                      {b.is_refunded && (
                        <div className="mt-2 text-xs text-teal-600 dark:text-teal-400 bg-teal-500/10 dark:bg-teal-500/20 border border-teal-500/20 dark:border-teal-500/30 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 w-fit">
                          <span>💵 Refunded: ${b.refund_amount} on {formatDate(b.refund_date)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <StatusBadge status={b.status} />
                      {!b.is_paid && b.fee_amount > 0 && ['PENDING', 'APPROVED'].includes(b.status) && (
                        <button onClick={() => handlePay(b)}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-medium transition shadow-sm">
                          Pay Fee
                        </button>
                      )}
                      {isAdmin && b.status === 'PENDING' && (
                        <button onClick={() => handleApprove(b.booking_id)}
                          className="px-3 py-1.5 bg-teal-500/10 dark:bg-teal-500/20 hover:bg-teal-500/20 dark:hover:bg-teal-500/30 text-teal-600 dark:text-teal-400 rounded-xl text-xs font-medium transition">
                          Approve
                        </button>
                      )}
                      {['PENDING', 'APPROVED'].includes(b.status) && (
                        <button onClick={() => handleCancel(b.booking_id)}
                          className="px-3 py-1.5 bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-medium transition">
                          Cancel
                        </button>
                      )}
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
        <EditAmenityModal amenity={editModal}
          onClose={() => setEditModal(null)} onSuccess={() => { fetchAmenities(); }} />
      )}

      {showCreateModal && (
        <CreateAmenityModal communityId={community?.community_id}
          onClose={() => setShowCreateModal(false)} onSuccess={() => { fetchAmenities(); }} />
      )}
    </div>
  );
};

export default Amenity;