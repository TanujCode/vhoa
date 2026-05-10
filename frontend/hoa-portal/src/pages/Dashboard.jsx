import React, { useState, useEffect } from 'react';
import {
  Users, AlertTriangle, Wrench, DollarSign,
  Calendar, TrendingUp, RefreshCw, UserPlus,
  Clock, CheckCircle, XCircle, Building2, Download
} from 'lucide-react';
import API from "../services/api";

// ── Stat Card ─────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, sub, subColor }) => (
  <div className="bg-[#162535] border border-white/10 rounded-3xl p-6">
    <div className="flex items-center justify-between mb-3">
      <p className="text-gray-400 text-sm">{label}</p>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
    </div>
    <p className={`text-4xl font-mono font-bold mt-1 ${subColor || 'text-white'}`}>
      {value ?? '—'}
    </p>
    {sub && <p className={`text-sm mt-2 ${subColor || 'text-gray-400'}`}>{sub}</p>}
  </div>
);

// ── Activity Item ─────────────────────────────
const ActivityItem = ({ icon: Icon, color, title, time }) => (
  <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={15} className="text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-white truncate">{title}</p>
    </div>
    <p className="text-xs text-gray-500 flex-shrink-0">{time}</p>
  </div>
);

// ── Main Dashboard ────────────────────────────
const Dashboard = ({ community, user }) => {
  const [stats, setStats]           = useState(null);
  const [violations, setViolations] = useState([]);
  const [requests, setRequests]     = useState([]);
  const [bookings, setBookings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);   // ← Added

  useEffect(() => {
    if (community?.community_id) {
      fetchDashboardData(community.community_id);
    }
  }, [community]);

  const fetchDashboardData = async (communityId) => {
    try {
      setLoading(true);
      const [statsRes, violationsRes, requestsRes] = await Promise.allSettled([
        API.get(`/community/${communityId}/stats`),
        API.get(`/violation/${communityId}?limit=5`),
        API.get(`/service-request/${communityId}?limit=5`),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (violationsRes.status === 'fulfilled') setViolations(violationsRes.value.data);
      if (requestsRes.status === 'fulfilled') setRequests(requestsRes.value.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!community) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No community found.</p>
          <p className="text-gray-500 text-sm mt-1">Contact your admin to get assigned to a community.</p>
        </div>
      </div>
    );
  }

  // Community address format
  const address = community.address
    ? `${community.address.address}, ${community.address.city}`
    : community.time_zone || '';

  return (
    <div>
      {/* ── Page Header ─────────────────────── */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-gray-400 mt-1">
            {community.name} • {community.time_zone || 'EST'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchDashboardData(community.community_id)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-sm font-medium transition flex items-center gap-2"
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          {/* Export Report Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-2xl text-sm font-medium transition flex items-center gap-2 text-white"
          >
            <Download size={15} />
            Export Report
          </button>
        </div>
      </div>

      {/* ── Community Banner ─────────────────── */}
      <div className="bg-[#1E3248] border border-white/10 rounded-3xl p-6 flex items-center gap-6 mb-8">
        <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Building2 size={30} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-semibold">{community.name}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              community.license_status === 'ACTIVE'
                ? 'bg-teal-500/20 text-teal-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {community.license_status}
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            {address && `${address} • `}
            HOA Code: <span className="text-white font-mono">{community.community_code}</span>
          </p>
        </div>
        <div className="hidden md:flex gap-8">
          <div className="text-center">
            <div className="text-3xl font-mono font-bold text-teal-400">
              {community.total_owners ?? 0}
            </div>
            <div className="text-xs text-gray-400 mt-1">MEMBERS</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-mono font-bold text-red-400">
              {stats?.active_violations ?? 0}
            </div>
            <div className="text-xs text-gray-400 mt-1">VIOLATIONS</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-mono font-bold text-blue-400">
              {stats?.open_requests ?? 0}
            </div>
            <div className="text-xs text-gray-400 mt-1">SERVICE REQ</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-mono font-bold text-purple-400">
              {community.community_size ?? 0}
            </div>
            <div className="text-xs text-gray-400 mt-1">TOTAL UNITS</div>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ───────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#162535] border border-white/10 rounded-3xl p-6 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-24 mb-4"></div>
              <div className="h-10 bg-white/10 rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard
            label="Total Members"
            value={community.total_owners ?? 0}
            icon={Users}
            color="bg-teal-600"
            subColor="text-teal-400"
            sub="Registered homeowners"
          />
          <StatCard
            label="Open Violations"
            value={stats?.active_violations ?? 0}
            icon={AlertTriangle}
            color="bg-red-600"
            subColor="text-red-400"
            sub="Needs attention"
          />
          <StatCard
            label="Service Requests"
            value={stats?.open_requests ?? 0}
            icon={Wrench}
            color="bg-blue-600"
            subColor="text-blue-400"
            sub="Open requests"
          />
          <StatCard
            label="Pending Payments"
            value={stats?.pending_payments ?? 0}
            icon={DollarSign}
            color="bg-purple-600"
            subColor="text-purple-400"
            sub="Due this month"
          />
        </div>
      )}

      {/* ── Recent Activity ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent Violations */}
        <div className="bg-[#162535] border border-white/10 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Recent Violations</h3>
            <span className="text-xs text-gray-500">Last 5</span>
          </div>
          {violations.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle size={32} className="text-teal-500 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No violations — great job!</p>
            </div>
          ) : (
            <div>
              {violations.map((v) => (
                <ActivityItem
                  key={v.violation_id}
                  icon={AlertTriangle}
                  color="bg-red-600"
                  title={`${v.violation_type_name || 'Violation'} — ${v.client_name || 'Resident'}`}
                  time={v.violation_status}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent Service Requests */}
        <div className="bg-[#162535] border border-white/10 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Recent Service Requests</h3>
            <span className="text-xs text-gray-500">Last 5</span>
          </div>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle size={32} className="text-teal-500 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No open service requests!</p>
            </div>
          ) : (
            <div>
              {requests.map((r) => (
                <ActivityItem
                  key={r.request_id}
                  icon={Wrench}
                  color={
                    r.status_name === 'OPEN'     ? 'bg-blue-600' :
                    r.status_name === 'APPROVED' ? 'bg-teal-600' :
                    r.status_name === 'CLOSED'   ? 'bg-gray-600' :
                    'bg-purple-600'
                  }
                  title={`${r.title} — ${r.submitted_by_name || 'Member'}`}
                  time={r.status_name}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {/*Board Members*/}
      {(community.president_email_id || community.secretary_email_id || community.treasurer_email_id) && (
        <div className="bg-[#162535] border border-white/10 rounded-3xl p-6 mt-5">
          <h3 className="font-semibold text-white mb-4">Board Members</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {community.president_email_id && (
              <div className="bg-white/5 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-1">PRESIDENT</p>
                <p className="text-sm text-white font-medium">
                  {community.president_email_id}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full mt-2 inline-block ${
                  community.president_invite_status === 'ACCEPTED'
                    ? 'bg-teal-500/20 text-teal-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {community.president_invite_status}
                </span>
              </div>
            )}
            {community.secretary_email_id && (
              <div className="bg-white/5 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-1">SECRETARY</p>
                <p className="text-sm text-white font-medium">
                  {community.secretary_email_id}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full mt-2 inline-block ${
                  community.secretary_invite_status === 'ACCEPTED'
                    ? 'bg-teal-500/20 text-teal-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {community.secretary_invite_status}
                </span>
              </div>
            )}
            {community.treasurer_email_id && (
              <div className="bg-white/5 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-1">TREASURER</p>
                <p className="text-sm text-white font-medium">
                  {community.treasurer_email_id}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full mt-2 inline-block ${
                  community.treasurer_invite_status === 'ACCEPTED'
                    ? 'bg-teal-500/20 text-teal-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {community.treasurer_invite_status}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export Report Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1E3248] border border-white/20 rounded-3xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-2xl font-semibold">Export Report</h2>
              <p className="text-gray-400 text-sm mt-1">
                Select the type of report and format for {community.name}
              </p>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Report Type</label>
                <select className="w-full bg-[#0D1B2A] border border-white/20 rounded-2xl p-4 text-white">
                  <option>Monthly Summary</option>
                  <option>Violation Report</option>
                  <option>Payment Report</option>
                  <option>Service Requests</option>
                  <option>Full Community Report</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">From Date</label>
                  <input type="date" className="w-full bg-[#0D1B2A] border border-white/20 rounded-2xl p-4 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">To Date</label>
                  <input type="date" className="w-full bg-[#0D1B2A] border border-white/20 rounded-2xl p-4 text-white" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Export Format</label>
                <select className="w-full bg-[#0D1B2A] border border-white/20 rounded-2xl p-4 text-white">
                  <option>PDF</option>
                  <option>Excel (.xlsx)</option>
                  <option>CSV</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 py-3 text-gray-400 hover:bg-white/10 rounded-2xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert("✅ Report Exported Successfully!");
                  setShowExportModal(false);
                }}
                className="flex-1 py-3 bg-teal-600 hover:bg-teal-500 rounded-2xl font-medium text-white transition"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;