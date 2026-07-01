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

      {/* Search and Slider Control */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <h2 className="text-lg font-extrabold text-slate-700 dark:text-gray-300 uppercase tracking-wider">
          Communities Slider
        </h2>
        {/* Simple search bar to filter slider */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentIndex(0); // reset page to first item
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
        <div className="max-w-2xl mx-auto">
          {/* Main Slider Display Area */}
          <div className="relative flex items-center justify-between gap-4">
            
            {/* Left Control Arrow */}
            {filteredStats.length > 1 && (
              <button
                onClick={handlePrev}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-gray-300 border border-slate-250/50 dark:border-white/10 transition shrink-0 shadow-sm active:scale-95"
              >
                <ChevronLeft size={18} />
              </button>
            )}

            {/* Carousel Active Community Card */}
            {(() => {
              const comm = filteredStats[currentIndex];
              return (
                <div
                  key={comm.community_id}
                  className="flex-1 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  {/* Card Header */}
                  <div className="p-6 sm:p-8 border-b border-slate-200/80 dark:border-white/10 flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Building2 size={28} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white text-xl truncate" title={comm.name}>
                        {comm.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-gray-400 truncate">
                        {comm.address?.city ? `${comm.address.city} • ` : ''}
                        Code: <span className="font-mono">{comm.community_code}</span>
                      </p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium flex-shrink-0 ${
                      comm.license_status === 'ACTIVE'
                        ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                        : 'bg-red-50 dark:bg-red-50/20 text-red-600 dark:text-red-400'
                    }`}>
                      {comm.license_status}
                    </span>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 border-b border-slate-200/80 dark:border-white/10">
                    <div className="text-center py-6 border-r border-slate-200/80 dark:border-white/10">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{comm.total_residents || 0}</div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-gray-400 mt-1">Members</div>
                    </div>
                    <div className="text-center py-6 border-r border-slate-200/80 dark:border-white/10">
                      <div className="text-3xl font-bold text-red-600 dark:text-red-400">{comm.active_violations || 0}</div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-gray-400 mt-1">Violations</div>
                    </div>
                    <div className="text-center py-6">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{comm.open_requests || 0}</div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-gray-400 mt-1">Requests</div>
                    </div>
                  </div>

                  {/* Info and Actions */}
                  <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 justify-between items-center bg-slate-100/30 dark:bg-white/[0.01]">
                    <div className="flex gap-8">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-gray-400">Total Units</div>
                        <div className="text-slate-900 dark:text-white font-mono font-bold text-base mt-0.5">{comm.community_size || 0}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-gray-400">Contact</div>
                        <div className="text-slate-900 dark:text-white text-sm font-semibold truncate max-w-[150px] mt-0.5" title={comm.contact_person || '—'}>
                          {comm.contact_person || '—'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      {/* Navigation to Dashboard Button */}
                      <button
                        onClick={() => {
                          if (setActiveCommunity && setActivePage) {
                            const baseComm = communities.find(c => c.community_id === comm.community_id);
                            if (baseComm) {
                              setActiveCommunity(baseComm);
                              setActivePage('dashboard');
                            }
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95 flex-1 sm:flex-initial text-center animate-pulse"
                      >
                        Enter Dashboard
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isBoardMember && (
                          <button
                            onClick={() => {
                              setEditingCommunity(comm);
                              if (canRequestChange) {
                                setIsRequestChangeOpen(true);
                              } else {
                                setIsEditModalOpen(true);
                              }
                            }}
                            className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition"
                            title={canRequestChange ? 'Request Community Change' : 'Edit Community'}
                          >
                            <Pencil size={15} />
                          </button>
                        )}
                        {user?.role === 'super_admin' && (
                          <button
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to deactivate ${comm.name}?`)) {
                                try {
                                  await API.delete(`/community/${comm.community_id}`);
                                  alert("✅ Community deactivated successfully!");
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
                            className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition"
                            title="Deactivate Community"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Right Control Arrow */}
            {filteredStats.length > 1 && (
              <button
                onClick={handleNext}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-gray-300 border border-slate-250/50 dark:border-white/10 transition shrink-0 shadow-sm active:scale-95"
              >
                <ChevronRight size={18} />
              </button>
            )}

          </div>

          {/* Dots Indicator under the slider */}
          {filteredStats.length > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-6 flex-wrap">
              {filteredStats.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    currentIndex === i
                      ? 'bg-blue-500 w-5'
                      : 'bg-slate-300 dark:bg-white/10 hover:bg-slate-400 dark:hover:bg-white/20'
                  }`}
                />
              ))}
            </div>
          )}
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