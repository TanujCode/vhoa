import React, { useState, useEffect } from 'react';
import { Building2, AlertTriangle, Wrench, Users, Plus, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import API from '../services/api';
import AddCommunityModal from '../components/AddCommunityModal';
import EditCommunityModal from '../components/EditCommunityModal';

const Overview = ({ communities = [], setActiveCommunity, setActivePage, user }) => {
  const [stats, setStats]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState(null);

  useEffect(() => {
    if (communities.length > 0) fetchAllStats();
    else setLoading(false);
  }, [communities]);

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      // Har community ke stats fetch karo
      const results = await Promise.allSettled(
        communities.map(c =>
          API.get(`/community/${c.community_id}/stats`)
            .then(r => ({ ...c, ...r.data }))
            .catch(() => ({ ...c, active_violations: 0, open_requests: 0 }))
        )
      );
      setStats(results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean));
    } catch (err) {
      console.error('Stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Aggregate totals
  const totalMembers    = stats.reduce((a, c) => a + (c.total_residents || 0), 0);
  const totalViolations = stats.reduce((a, c) => a + (c.active_violations || 0), 0);
  const totalRequests   = stats.reduce((a, c) => a + (c.open_requests || 0), 0);
  const totalCommunities = communities.length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">All Communities</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1">Live updates across all your HOA communities</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchAllStats}
            disabled={loading}
            className="px-5 py-2.5 bg-slate-200/60 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-2xl text-sm font-semibold transition flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          {['super_admin', 'sales_admin'].includes(user?.role) && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-2xl text-sm font-semibold transition flex items-center gap-2 text-white"
            >
              <Plus size={15} />
              Add Community
            </button>
          )}
        </div>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none rounded-3xl p-6">
          <div className="text-teal-600 dark:text-teal-400 text-5xl font-mono font-bold">{totalCommunities}</div>
          <div className="text-sm text-slate-500 dark:text-gray-400 mt-2">Total Communities</div>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none rounded-3xl p-6">
          <div className="text-blue-600 dark:text-blue-400 text-5xl font-mono font-bold">{totalMembers}</div>
          <div className="text-sm text-slate-500 dark:text-gray-400 mt-2">Total Members</div>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-[#1E2E42] dark:to-[#162535] border border-red-200/80 dark:border-red-500/20 shadow-sm dark:shadow-none rounded-3xl p-6">
          <div className="text-red-600 dark:text-red-400 text-5xl font-mono font-bold">{totalViolations}</div>
          <div className="text-sm text-slate-500 dark:text-gray-400 mt-2">Open Violations</div>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none rounded-3xl p-6">
          <div className="text-amber-600 dark:text-yellow-400 text-5xl font-mono font-bold">{totalRequests}</div>
          <div className="text-sm text-slate-500 dark:text-gray-400 mt-2">Open Service Requests</div>
        </div>
      </div>

      {/* Communities Grid */}
      <h2 className="text-lg font-semibold mb-5 text-slate-700 dark:text-gray-300">Communities at a Glance</h2>

      {loading ? (
        <div className="text-center py-20 text-gray-400">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Loading communities...
        </div>
      ) : communities.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Building2 size={40} className="mx-auto mb-3 opacity-50" />
          No communities found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((comm) => (
            <div
              key={comm.community_id}
              onClick={() => {
                if (setActiveCommunity && setActivePage) {
                  const baseComm = communities.find(c => c.community_id === comm.community_id);
                  if (baseComm) {
                    setActiveCommunity(baseComm);
                    setActivePage('dashboard');
                  }
                }
              }}
              className="bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden hover:border-teal-500/50 transition-all hover:-translate-y-1 cursor-pointer shadow-sm dark:shadow-none"
            >
              {/* Card Header */}
              <div className="p-6 border-b border-slate-200/80 dark:border-white/10 flex items-center gap-4">
                <div className="w-14 h-14 bg-teal-50 dark:bg-teal-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Building2 size={28} className="text-teal-600 dark:text-teal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-lg truncate" title={comm.name}>{comm.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400 truncate">
                    {comm.address?.city ? `${comm.address.city} • ` : ''}
                    Code: <span className="font-mono">{comm.community_code}</span>
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium flex-shrink-0 ${
                  comm.license_status === 'ACTIVE'
                    ? 'bg-teal-50 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400'
                    : 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                }`}>
                  {comm.license_status}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 border-b border-slate-200/80 dark:border-white/10">
                <div className="text-center py-5 border-r border-slate-200/80 dark:border-white/10">
                  <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{comm.total_residents || 0}</div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-gray-400 mt-1">Members</div>
                </div>
                <div className="text-center py-5 border-r border-slate-200/80 dark:border-white/10">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{comm.active_violations || 0}</div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-gray-400 mt-1">Violations</div>
                </div>
                <div className="text-center py-5">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{comm.open_requests || 0}</div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-gray-400 mt-1">Requests</div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 flex justify-between items-center bg-slate-100/30 dark:bg-white/[0.01]">
                <div className="flex gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-gray-400">Units</div>
                    <div className="text-slate-900 dark:text-white font-mono font-bold text-sm">{comm.community_size || 0}</div>
                  </div>
                  <div className="max-w-[90px] min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-gray-400">Contact</div>
                    <div className="text-slate-900 dark:text-white text-xs font-semibold truncate" title={comm.contact_person || '—'}>
                      {comm.contact_person || '—'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      setEditingCommunity(comm);
                      setIsEditModalOpen(true);
                    }}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 transition"
                    title="Edit Community"
                  >
                    <Pencil size={14} />
                  </button>
                  {user?.role === 'super_admin' && (
                    <button
                      onClick={async () => {
                        if (window.confirm(`Are you sure you want to deactivate ${comm.name}?`)) {
                          try {
                            await API.delete(`/community/${comm.community_id}`);
                            alert("✅ Community deactivated successfully!");
                            fetchAllStats();
                          } catch (err) {
                            alert(`Error: ${err.response?.data?.detail || err.message}`);
                          }
                        }
                      }}
                      className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition"
                      title="Deactivate Community"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddCommunityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      <EditCommunityModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCommunity(null);
        }}
        community={editingCommunity}
        onSuccess={fetchAllStats}
      />
    </div>
  );
};

export default Overview;