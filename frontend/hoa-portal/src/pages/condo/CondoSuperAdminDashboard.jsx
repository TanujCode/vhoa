import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, FileText, ShieldCheck, 
  Search, RefreshCw, AlertCircle, Plus, ChevronRight, Check, X, ShieldAlert
} from 'lucide-react';
import API from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';

export default function CondoSuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and filter states
  const [buildingSearch, setBuildingSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [togglingBuildingId, setTogglingBuildingId] = useState(null);
  const [togglingUserId, setTogglingUserId] = useState(null);

  const [confirmConfig, setConfirmConfig] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    confirmText: 'OK', 
    cancelText: 'Cancel', 
    onConfirm: null, 
    onCancel: null, 
    type: 'info', 
    singleButton: false 
  });

  const showAlert = (title, message, type = 'info') => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      confirmText: 'OK',
      singleButton: true,
      type,
      onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  // Add building modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBuildingName, setNewBuildingName] = useState('');
  const [newBuildingCode, setNewBuildingCode] = useState('');
  const [newBuildingZip, setNewBuildingZip] = useState('');
  const [newBuildingCity, setNewBuildingCity] = useState('');
  const [newBuildingAddress, setNewBuildingAddress] = useState('');
  const [submittingBuilding, setSubmittingBuilding] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, buildingsRes, usersRes] = await Promise.all([
        API.get('/condo/community/superadmin/stats'),
        API.get('/condo/community'),
        API.get('/condo/community/users/all')
      ]);

      setStats(statsRes.data);
      setBuildings(buildingsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.error("Failed to load Condo SuperAdmin data:", err);
      setError(err?.response?.data?.detail || "Failed to load system metrics.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBuilding = async (building) => {
    try {
      setTogglingBuildingId(building.community_id);
      const newStatus = !building.active_status;
      await API.put(`/condo/community/${building.community_id}/status`, { active_status: newStatus });
      setBuildings(prev => prev.map(b => b.community_id === building.community_id ? { ...b, active_status: newStatus } : b));
    } catch (err) {
      console.error("Failed to toggle building status:", err);
      showAlert("Status Toggle Error", err?.response?.data?.detail || "Failed to toggle building status.", "danger");
    } finally {
      setTogglingBuildingId(null);
    }
  };

  const handleToggleUser = async (u) => {
    try {
      setTogglingUserId(u.user_id);
      const newStatus = !u.active_status;
      await API.put(`/condo/community/users/${u.user_id}/status`, { active_status: newStatus });
      setUsers(prev => prev.map(usr => usr.user_id === u.user_id ? { ...usr, active_status: newStatus } : usr));
      showAlert("Success", `User status updated successfully!`, "success");
    } catch (err) {
      console.error("Failed to toggle user status:", err);
      showAlert("Status Toggle Error", err?.response?.data?.detail || "Failed to toggle user status.", "danger");
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleCreateBuilding = async (e) => {
    e.preventDefault();
    if (!newBuildingName.trim() || !newBuildingCode.trim()) {
      showAlert("Validation Error", "Building Name and Passcode are required.", "warning");
      return;
    }

    try {
      setSubmittingBuilding(true);
      const res = await API.post('/condo/community/create', {
        name: newBuildingName,
        community_code: newBuildingCode,
        zip_code: newBuildingZip,
        city: newBuildingCity,
        address: newBuildingAddress,
        description: `New building tower: ${newBuildingName}`
      });

      showAlert("Success", "Building registered successfully!", "success");
      setBuildings(prev => [...prev, res.data]);
      
      // Reset form
      setNewBuildingName('');
      setNewBuildingCode('');
      setNewBuildingZip('');
      setNewBuildingCity('');
      setNewBuildingAddress('');
      setShowAddModal(false);
      
      // Refresh stats
      const statsRes = await API.get('/condo/community/superadmin/stats');
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to register building:", err);
      showAlert("Registration Failed", err.response?.data?.detail || "Failed to register building. Name/Passcode might be taken.", "danger");
    } finally {
      setSubmittingBuilding(false);
    }
  };

  const filteredBuildings = buildings.filter(b => 
    b.name?.toLowerCase().includes(buildingSearch.toLowerCase()) ||
    b.community_code?.toLowerCase().includes(buildingSearch.toLowerCase()) ||
    b.city?.toLowerCase().includes(buildingSearch.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email_id?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role_name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="p-3 sm:p-5 space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-white font-sans">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/90 to-sky-50/80 dark:from-[#162535] dark:via-[#1A2E44] dark:to-[#162535] text-slate-900 dark:text-white p-4 sm:p-5 border border-indigo-100 dark:border-white/10 shadow-sm">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-400/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 top-0 w-56 h-56 bg-indigo-400/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-100 dark:bg-indigo-500/20 border border-blue-200 dark:border-indigo-400/30 text-blue-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-2 shadow-xs">
              <ShieldCheck size={13} className="text-blue-600 dark:text-indigo-400" /> Platform Owner Control
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-1">
              Condo System Super Admin Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-300/90 text-xs sm:text-sm max-w-2xl leading-normal">
              Overview of registered condo towers, community managers, board officers, residents, and pending registrations across the platform.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-3.5 py-2 bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 text-slate-800 dark:text-white rounded-xl text-xs font-bold border border-slate-200 dark:border-white/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh Data
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-md"
            >
              <Plus size={14} /> Register Building
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
          <button onClick={fetchData} className="font-bold underline text-xs">Retry</button>
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Buildings */}
        <div className="bg-white dark:bg-[#162535] p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
              Total Buildings
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <Building2 size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {loading ? "..." : (stats?.total_buildings || 0)}
            </h3>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">
              Tower complexes
            </span>
          </div>
        </div>

        {/* Card 2: Platform Residents */}
        <div className="bg-white dark:bg-[#162535] p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
              Platform Residents
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
              <Users size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {loading ? "..." : (stats?.total_residents || 0)}
            </h3>
            <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-2 py-0.5 rounded-md">
              Manual + Invites
            </span>
          </div>
        </div>

        {/* Card 3: Board & PMs */}
        <div className="bg-white dark:bg-[#162535] p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
              Managers & Board
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {loading ? "..." : (stats?.total_managers || 0)}
            </h3>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md">
              Staff Accounts
            </span>
          </div>
        </div>

        {/* Card 4: Pending Joins */}
        <div className="bg-white dark:bg-[#162535] p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
              Pending Approvals
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <FileText size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {loading ? "..." : (stats?.total_pending_requests || 0)}
            </h3>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-md">
              Awaiting Verification
            </span>
          </div>
        </div>
      </div>

      {/* Buildings Directory */}
      <div className="bg-white dark:bg-[#162535] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="text-blue-500" size={20} /> Registered Building Towers
            </h2>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
              Verify towers, view settings passcode, and manage active status.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search tower, passcode..."
              value={buildingSearch}
              onChange={(e) => setBuildingSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-white/10">
                <th className="py-3 px-5">Building Tower</th>
                <th className="py-3 px-5">Join Passcode</th>
                <th className="py-3 px-5">Location</th>
                <th className="py-3 px-5">Active Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-slate-450 font-mono">Loading buildings...</td>
                </tr>
              ) : filteredBuildings.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-slate-450">No buildings registered yet.</td>
                </tr>
              ) : (
                filteredBuildings.map(b => (
                  <tr key={b.community_id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Building2 size={16} className="text-blue-500" />
                      {b.name}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                      {b.community_code}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 dark:text-gray-400">
                      {b.city || 'N/A'}, Zip {b.zip_code || 'N/A'}
                    </td>
                    <td className="py-3.5 px-5">
                      {b.active_status ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-450 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-450 border border-rose-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => handleToggleBuilding(b)}
                        disabled={togglingBuildingId === b.community_id}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${
                          b.active_status
                            ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                            : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                        } cursor-pointer`}
                      >
                        {togglingBuildingId === b.community_id ? "..." : (b.active_status ? "Deactivate" : "Activate")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Management Directory */}
      <div className="bg-white dark:bg-[#162535] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="text-blue-500" size={20} /> Condo Users Management
            </h2>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
              Control portal access, review roles, and activate/deactivate user credentials.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search name, email, role..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-white/10">
                <th className="py-3 px-5">User</th>
                <th className="py-3 px-5">Contact Email</th>
                <th className="py-3 px-5">Building</th>
                <th className="py-3 px-5">Role</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-450 font-mono">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-450">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.user_id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white">
                      {u.full_name}
                      <p className="text-[9px] text-gray-400 font-mono mt-0.5">{u.user_code}</p>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 dark:text-gray-300">
                      {u.email_id}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 dark:text-gray-400 font-medium">
                      {u.community_name || <span className="italic text-slate-400 text-[10px]">Unassigned</span>}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                        u.role_name === 'super_admin' ? 'bg-indigo-500/10 text-indigo-500' :
                        u.role_name === 'property_manager' ? 'bg-blue-500/10 text-blue-500' :
                        u.role_name === 'board_member' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-gray-450'
                      }`}>
                        {u.role_name?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      {u.active_status ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 border border-rose-500/20">
                          Blocked
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {u.role_name !== 'super_admin' && (
                        <button
                          onClick={() => handleToggleUser(u)}
                          disabled={togglingUserId === u.user_id}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${
                            u.active_status
                              ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                              : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                          } cursor-pointer`}
                        >
                          {togglingUserId === u.user_id ? "..." : (u.active_status ? "Block" : "Unblock")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Condo Community Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#162535] border border-slate-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 relative shadow-2xl text-slate-900 dark:text-white">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-650 cursor-pointer"
            >
              <X size={18} />
            </button>
            
            <h3 className="text-lg font-black mb-1 flex items-center gap-2">
              <Building2 className="text-blue-500" size={22} />
              Register Condo Community
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-6">
              Create a new building tower in the system database.
            </p>

            <form onSubmit={handleCreateBuilding} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 tracking-wider mb-1 uppercase">Building Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Skyline Towers B"
                  value={newBuildingName}
                  onChange={(e) => setNewBuildingName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 tracking-wider mb-1 uppercase">Registration Passcode *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SKYLINE2026"
                  value={newBuildingCode}
                  onChange={(e) => setNewBuildingCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 tracking-wider mb-1 uppercase">City</label>
                  <input
                    type="text"
                    placeholder="New York"
                    value={newBuildingCity}
                    onChange={(e) => setNewBuildingCity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 tracking-wider mb-1 uppercase">Zip Code</label>
                  <input
                    type="text"
                    placeholder="10001"
                    value={newBuildingZip}
                    onChange={(e) => setNewBuildingZip(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 tracking-wider mb-1 uppercase">Address</label>
                <input
                  type="text"
                  placeholder="123 Park Ave"
                  value={newBuildingAddress}
                  onChange={(e) => setNewBuildingAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingBuilding}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-lg disabled:opacity-50 cursor-pointer mt-4"
              >
                {submittingBuilding ? "Creating..." : "Create Building"}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        type={confirmConfig.type}
        singleButton={confirmConfig.singleButton}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
