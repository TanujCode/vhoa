import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, RefreshCw, Filter, ChevronDown, X } from 'lucide-react';
import API from '../services/api';

// ── Status Badge ──────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    OPEN:        'bg-red-500/20 text-red-400',
    IN_PROGRESS: 'bg-blue-500/20 text-blue-400',
    APPEALED:    'bg-amber-500/20 text-amber-400',
    PAID:        'bg-teal-500/20 text-teal-400',
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
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState({
    violation_type_id: '',
    client_id:         '',
    violation_date:    new Date().toISOString().split('T')[0],
    amount:            0,
    remarks:           '',
  });

  useEffect(() => {
    API.get(`/violation/type/${communityId}`)
      .then(r => setTypes(r.data))
      .catch(console.error);
  }, [communityId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/violation', {
        ...form,
        community_id:      communityId,
        violation_type_id: parseInt(form.violation_type_id),
        client_id:         parseInt(form.client_id),
        amount:            parseFloat(form.amount),
      });
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
      <div className="bg-[#1E3248] rounded-3xl p-6 w-full max-w-md border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Submit Violation</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Violation Type</label>
            <select
              required
              value={form.violation_type_id}
              onChange={e => setForm({...form, violation_type_id: e.target.value})}
              className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select type...</option>
              {types.map(t => (
                <option key={t.violation_type_id} value={t.violation_type_id}>
                  {t.name} — ${t.amount}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Resident User ID</label>
            <input
              type="number"
              required
              placeholder="Enter resident's user ID"
              value={form.client_id}
              onChange={e => setForm({...form, client_id: e.target.value})}
              className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Violation Date</label>
            <input
              type="date"
              required
              value={form.violation_date}
              onChange={e => setForm({...form, violation_date: e.target.value})}
              className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Fine Amount ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={e => setForm({...form, amount: e.target.value})}
              className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Remarks</label>
            <textarea
              rows={3}
              placeholder="Describe the violation..."
              value={form.remarks}
              onChange={e => setForm({...form, remarks: e.target.value})}
              className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-xl text-sm font-medium transition disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// ── Main Violations Page ──────────────────────
const Violations = ({ community }) => {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState({
    open: 0, paid: 0, disputed: 0, closed: 0
  });

  useEffect(() => {
    if (community?.community_id) {
      fetchViolations();
    }
  }, [community, statusFilter]);

  const fetchViolations = async () => {
    try {
      setLoading(true);
      const url = statusFilter
        ? `/violation/${community.community_id}?status=${statusFilter}&limit=50`
        : `/violation/${community.community_id}?limit=50`;
      const res = await API.get(url);
      setViolations(res.data);

      // ✅ Same data se stats calculate karo — alag call nahi
      const all = res.data;
      setStats({
        open:     all.filter(v => v.violation_status === 'OPEN').length,
        paid:     all.filter(v => v.violation_status === 'PAID').length,
        disputed: all.filter(v => v.violation_status === 'APPEALED').length,
        closed:   all.filter(v => ['CLOSED', 'RESOLVED'].includes(v.violation_status)).length,
      });

    } catch (err) {
      console.error('Violations fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const statuses = ['', 'OPEN', 'IN_PROGRESS', 'APPEALED', 'PAID', 'RESOLVED', 'CLOSED', 'CANCELLED'];

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold">Violations</h1>
          <p className="text-gray-400 mt-1">{community?.name}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchViolations}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-sm font-medium transition flex items-center gap-2"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-2xl text-sm font-medium transition flex items-center gap-2"
          >
            <Plus size={15} />
            Submit Violation
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Open',     value: stats.open,     color: 'text-red-400' },
          { label: 'Paid',     value: stats.paid,     color: 'text-teal-400' },
          { label: 'Disputed', value: stats.disputed, color: 'text-amber-400' },
          { label: 'Closed',   value: stats.closed,   color: 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#162535] border border-white/10 rounded-3xl p-6">
            <div className={`text-4xl font-mono font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-400 mt-2">{s.label} Violations</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#162535] border border-white/10 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-semibold">All Violations</h2>

          {/* Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none pr-8 appearance-none cursor-pointer"
            >
              {statuses.map(s => (
                <option key={s} value={s}>{s || 'All Status'}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-3 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-gray-400">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Loading violations...
            </div>
          ) : violations.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <AlertTriangle size={32} className="mx-auto mb-3 opacity-50" />
              No violations found.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-sm">
                  <th className="text-left p-5">Member</th>
                  <th className="text-left p-5">Type</th>
                  <th className="text-left p-5">Fine</th>
                  <th className="text-left p-5">Date</th>
                  <th className="text-left p-5">Due Date</th>
                  <th className="text-left p-5">Status</th>
                  <th className="text-left p-5">Disputed</th>
                </tr>
              </thead>
              <tbody>
                {violations.map((v) => (
                  <tr
                    key={v.violation_id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-5 font-medium">
                      {v.client_name || `User #${v.client_id}`}
                    </td>
                    <td className="p-5 text-gray-400">
                      {v.violation_type_name || '—'}
                    </td>
                    <td className="p-5 font-mono text-white">
                      ${v.amount}
                      {v.late_charge_applied > 0 && (
                        <span className="text-red-400 text-xs ml-1">
                          +${v.late_charge_applied} late
                        </span>
                      )}
                    </td>
                    <td className="p-5 text-gray-400">
                      {formatDate(v.violation_date)}
                    </td>
                    <td className="p-5 text-gray-400">
                      {formatDate(v.violation_due_date)}
                    </td>
                    <td className="p-5">
                      <StatusBadge status={v.violation_status} />
                    </td>
                    <td className="p-5">
                      {v.is_disputed ? (
                        <span className="text-amber-400 text-xs font-medium">
                          {v.dispute_resolved ? '✓ Resolved' : '⏳ Pending'}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <SubmitModal
          communityId={community?.community_id}
          onClose={() => setShowModal(false)}
          onSuccess={fetchViolations}
        />
      )}
    </div>
  );
};

export default Violations;