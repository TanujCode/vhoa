import React, { useState, useEffect } from 'react';
import { Building2, AlertTriangle, Wrench, Users, Plus, RefreshCw, Pencil, Trash2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import API from '../services/api';
import AddCommunityModal from '../components/AddCommunityModal';
import EditCommunityModal from '../components/EditCommunityModal';
import RequestChangeModal from '../components/RequestChangeModal';


const Overview = ({ communities = [], setActiveCommunity, setActivePage, user, refreshCommunities }) => {
  const [stats, setStats]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRequestChangeOpen, setIsRequestChangeOpen] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStats = stats.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.community_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle safe index bounds if filtered list changes
  useEffect(() => {
    if (currentIndex >= filteredStats.length) {
      setCurrentIndex(Math.max(0, filteredStats.length - 1));
    }
  }, [filteredStats, currentIndex]);

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? filteredStats.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev === filteredStats.length - 1 ? 0 : prev + 1));
  };

  // Only property_manager can submit change requests (board_member gets no edit option)
  const canRequestChange = user?.role === 'property_manager';
  const isBoardMember = user?.role === 'board_member';

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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">All Communities</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1">Live updates across all your HOA communities</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {['super_admin', 'sales_admin'].includes(user?.role) && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-2xl text-sm font-semibold transition flex items-center gap-2 text-white"
            >
              <Plus size={15} />
              Add Community
            </button>
          )}
        </div>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none rounded-3xl p-6">
          <div className="text-blue-600 dark:text-blue-400 text-5xl font-mono font-bold">{totalCommunities}</div>
          <div className="text-sm text-slate-500 dark:text-gray-400 mt-2">Total Communities</div>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none rounded-3xl p-6">
          <div className="text-blue-600 dark:text-blue-400 text-5xl font-mono font-bold">{totalMembers}</div>
          <div className="text-sm text-slate-500 dark:text-gray-400 mt-2">Total Members</div>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-red-200/80 dark:border-red-500/20 shadow-sm dark:shadow-none rounded-3xl p-6">
          <div className="text-red-600 dark:text-red-400 text-5xl font-mono font-bold">{totalViolations}</div>
          <div className="text-sm text-slate-500 dark:text-gray-400 mt-2">Open Violations</div>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none rounded-3xl p-6">
          <div className="text-amber-600 dark:text-yellow-400 text-5xl font-mono font-bold">{totalRequests}</div>
          <div className="text-sm text-slate-500 dark:text-gray-400 mt-2">Open Service Requests</div>
        </div>
      </div>

      {/* Search and Header Control */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <h2 className="text-lg font-extrabold text-slate-700 dark:text-gray-300 uppercase tracking-wider">
          HOA Communities
        </h2>
        {/* Simple search bar to filter communities */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentIndex(0);
            }}
            placeholder="Search by name or code..."
            className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 dark:text-gray-500" />
        </div>
      </div>

      {loading && stats.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Loading communities...
        </div>
      ) : communities.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Building2 size={40} className="mx-auto mb-3 opacity-50" />
          No communities found.
        </div>
      ) : filteredStats.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>No matching communities found.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1E2E42] border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm dark:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Community</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">License</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 dark:text-gray-400 text-center uppercase tracking-wider">Members</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 dark:text-gray-400 text-center uppercase tracking-wider">Violations</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 dark:text-gray-400 text-center uppercase tracking-wider">Requests</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 dark:text-gray-400 text-center uppercase tracking-wider">Units</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredStats.map((comm) => (
                  <tr 
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
                    className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors group animate-in fade-in duration-200 cursor-pointer"
                  >
                    {/* Community Info */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                          <Building2 size={18} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">
                            {comm.name}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-gray-400 font-mono mt-0.5">
                            {comm.address?.city ? `${comm.address.city} • ` : ''}Code: {comm.community_code}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* License Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        comm.license_status === 'ACTIVE'
                          ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/10'
                          : 'bg-red-50 dark:bg-red-50/20 text-red-600 dark:text-red-400 border border-red-500/10'
                      }`}>
                        {comm.license_status}
                      </span>
                    </td>

                    {/* Members Count */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-center font-mono font-bold text-slate-700 dark:text-slate-200">
                      {comm.total_residents || 0}
                    </td>

                    {/* Violations Count */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-center font-mono font-bold text-red-600 dark:text-red-400">
                      {comm.active_violations || 0}
                    </td>

                    {/* Requests Count */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-center font-mono font-bold text-slate-700 dark:text-slate-200">
                      {comm.open_requests || 0}
                    </td>

                    {/* Total Units */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-center font-mono text-xs text-slate-500 dark:text-gray-400">
                      {comm.community_size || 0}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isBoardMember && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCommunity(comm);
                              if (canRequestChange) {
                                setIsRequestChangeOpen(true);
                              } else {
                                setIsEditModalOpen(true);
                              }
                            }}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 border border-slate-200/50 dark:border-white/5 transition"
                            title={canRequestChange ? 'Request Community Change' : 'Edit Community'}
                          >
                            <Pencil size={13} />
                          </button>
                        )}
                        {user?.role === 'super_admin' && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (await window.customConfirm(`Are you sure you want to deactivate ${comm.name}?`)) {
                                try {
                                  await API.delete(`/community/${comm.community_id}`);
                                  alert(" Community deactivated successfully!");
                                  if (refreshCommunities) {
                                    await refreshCommunities();
                                  } else {
                                    fetchAllStats();
                                  }
                                } catch (err) {
                                  alert(`Error: ${err.response?.data?.detail || err.message}`);
                                }
                              }
                            }}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 border border-slate-200/50 dark:border-white/5 transition"
                            title="Deactivate Community"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (setActiveCommunity && setActivePage) {
                              const baseComm = communities.find(c => c.community_id === comm.community_id);
                              if (baseComm) {
                                setActiveCommunity(baseComm);
                                setActivePage('dashboard');
                              }
                            }
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-sm active:scale-95 text-center whitespace-nowrap"
                        >
                          Enter
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      <RequestChangeModal
        isOpen={isRequestChangeOpen}
        onClose={() => {
          setIsRequestChangeOpen(false);
          setEditingCommunity(null);
        }}
        community={editingCommunity}
        onSuccess={() => {
          setIsRequestChangeOpen(false);
          setEditingCommunity(null);
        }}
      />
    </div>
  );
};

export default Overview;