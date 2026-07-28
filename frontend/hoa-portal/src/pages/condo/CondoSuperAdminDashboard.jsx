import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { 
  Building2, Users, FileText, ShieldCheck, 
  Search, RefreshCw, ChevronRight, Check, ShieldAlert,
  User, Trash2, Plus, Sparkles, ClipboardCheck, ArrowUpRight,
  TrendingUp, Activity, CheckCircle2, AlertTriangle, Globe, Clock,
  BarChart3, Zap, UserCheck, UserX, MapPin, X
} from 'lucide-react';
import API from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';

export default function CondoSuperAdminDashboard({ defaultSection, selectedCommunityId, onEnterCommunity }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stats, setStats] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Directory Active Tab (for the unified tab view)
  const [activeTab, setActiveTab] = useState('buildings');

  // Search and filter states
  const [buildingSearch, setBuildingSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [togglingBuildingId, setTogglingBuildingId] = useState(null);
  const [togglingUserId, setTogglingUserId] = useState(null);

  // Create building states
  const [showCreateBuildingModal, setShowCreateBuildingModal] = useState(false);
  const [creatingBuilding, setCreatingBuilding] = useState(false);
  const [buildingErrors, setBuildingErrors] = useState({});
  const [contractCodeInput, setContractCodeInput] = useState('');
  const [verifyingContractCode, setVerifyingContractCode] = useState(false);
  const [contractVerified, setContractVerified] = useState(false);
  const [contractMsg, setContractMsg] = useState('');
  const [newBuilding, setNewBuilding] = useState({
    contract_code: '',
    name: '',
    community_code: '',
    address: '',
    state: '',
    city: '',
    zip_code: '',
    description: ''
  });

  // Edit building states
  const [showEditBuildingModal, setShowEditBuildingModal] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [updatingBuilding, setUpdatingBuilding] = useState(false);

  // Quick Todo task list states
  const [quickTasks, setQuickTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');

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

  useEffect(() => {
    // Fetch cached user details for personalized greeting
    const cached = localStorage.getItem('condo_user');
    if (cached) {
      try {
        setCurrentUser(JSON.parse(cached));
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedCommunityId]);

  // Initialize and persist Todo Task list
  useEffect(() => {
    if (currentUser?.user_id) {
      const saved = localStorage.getItem(`condo_superadmin_tasks_${currentUser.user_id}`);
      if (saved) {
        setQuickTasks(JSON.parse(saved));
      } else {
        const defaultTasks = [
          { id: 1, text: "Verify contract setup for Skyline Tower A", completed: false },
          { id: 2, text: "Review pending platform manager approvals", completed: false },
          { id: 3, text: "Conduct weekly database backup", completed: true }
        ];
        setQuickTasks(defaultTasks);
        localStorage.setItem(`condo_superadmin_tasks_${currentUser.user_id}`, JSON.stringify(defaultTasks));
      }
    }
  }, [currentUser]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const statsUrl = selectedCommunityId && selectedCommunityId !== 'all'
        ? `/condo/community/superadmin/stats?community_id=${selectedCommunityId}`
        : `/condo/community/superadmin/stats`;

      const [statsRes, buildingsRes, usersRes] = await Promise.all([
        API.get(statsUrl),
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
      showAlert("Success", `Building status updated successfully!`, "success");
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

  const handleDeleteUser = async (userId) => {
    try {
      setLoading(true);
      await API.delete(`/condo/community/users/${userId}`);
      showAlert("Success", "User account deleted successfully!", "success");
      fetchData(); // Reload metrics & records
    } catch (err) {
      console.error("Failed to delete user:", err);
      showAlert("Delete Error", err?.response?.data?.detail || "Failed to delete user account.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyContractCode = async () => {
    if (!contractCodeInput || !contractCodeInput.trim()) {
      setContractMsg("❌ Please enter a contract code.");
      return;
    }

    try {
      setVerifyingContractCode(true);
      setContractMsg("");
      const res = await API.get(`/condo/contracts/code/${contractCodeInput.trim().toUpperCase()}`);
      const data = res.data;

      const baseCode = (data.business_name || 'CND')
        .replace(/[^A-Za-z0-9]/g, '')
        .substring(0, 6)
        .toUpperCase();
      const generatedPasscode = `${baseCode}100`;

      setNewBuilding(prev => ({
        ...prev,
        contract_code: data.contract_code,
        name: data.business_name || prev.name,
        community_code: generatedPasscode,
        address: data.client_address || prev.address,
        city: data.client_city || prev.city,
        zip_code: data.client_zip_code || prev.zip_code
      }));

      setContractVerified(true);
      setContractMsg("✅ Contract code verified successfully!");
    } catch (err) {
      setContractVerified(false);
      setContractMsg(`❌ ${err.response?.data?.detail || "Invalid or inactive contract code."}`);
    } finally {
      setVerifyingContractCode(false);
    }
  };

  const handleCreateBuilding = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setBuildingErrors({});

    if (!contractVerified) {
      setContractMsg("❌ Please verify contract code first.");
      return;
    }
    
    if (!newBuilding.name.trim() || !newBuilding.community_code.trim()) {
      showAlert("Validation Error", "Building Name and Passcode are required.", "warning");
      return;
    }

    if (newBuilding.community_code.trim().length < 4 || !/^[A-Z0-9]+$/i.test(newBuilding.community_code.trim())) {
      setBuildingErrors({ community_code: 'Passcode must be at least 4 characters and alphanumeric' });
      return;
    }

    if (newBuilding.state.trim() && newBuilding.state.trim().length !== 2) {
      setBuildingErrors({ state: 'State code must be exactly 2 characters (e.g. FL)' });
      return;
    }

    if (newBuilding.zip_code.trim() && !/^\d{5}$/.test(newBuilding.zip_code.trim())) {
      setBuildingErrors({ zip_code: 'Zip code must be exactly 5 digits' });
      return;
    }

    try {
      setCreatingBuilding(true);
      await API.post('/condo/community/create', {
        contract_code: newBuilding.contract_code || contractCodeInput.trim().toUpperCase(),
        name: newBuilding.name.trim(),
        community_code: newBuilding.community_code.trim().toUpperCase(),
        address: newBuilding.address ? newBuilding.address.trim() : null,
        state: newBuilding.state ? newBuilding.state.trim() : null,
        city: newBuilding.city ? newBuilding.city.trim() : null,
        zip_code: newBuilding.zip_code ? newBuilding.zip_code.trim() : null,
        description: newBuilding.description ? newBuilding.description.trim() : null
      });

      showAlert("Success", "Condo building registered successfully!", "success");
      setShowCreateBuildingModal(false);
      fetchData(); // Reload buildings directory
    } catch (err) {
      console.error("Create Building Error:", err);
      const detail = err.response?.data?.detail || "Failed to create building.";
      if (detail.toLowerCase().includes("passcode") || detail.toLowerCase().includes("exists")) {
        setBuildingErrors({ community_code: detail });
      } else {
        showAlert("Error", detail, "danger");
      }
    } finally {
      setCreatingBuilding(false);
    }
  };

  const handleUpdateBuilding = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setBuildingErrors({});

    if (!editingBuilding.name.trim() || !editingBuilding.community_code.trim()) {
      showAlert("Validation Error", "Building Name and Passcode are required.", "warning");
      return;
    }

    if (editingBuilding.community_code.trim().length < 4 || !/^[A-Z0-9]+$/i.test(editingBuilding.community_code.trim())) {
      setBuildingErrors({ community_code: 'Passcode must be at least 4 characters and alphanumeric' });
      return;
    }

    if (editingBuilding.state && editingBuilding.state.trim() && editingBuilding.state.trim().length !== 2) {
      setBuildingErrors({ state: 'State code must be exactly 2 characters (e.g. FL)' });
      return;
    }

    if (editingBuilding.zip_code && editingBuilding.zip_code.trim() && !/^\d{5}$/.test(editingBuilding.zip_code.trim())) {
      setBuildingErrors({ zip_code: 'Zip code must be exactly 5 digits' });
      return;
    }

    try {
      setUpdatingBuilding(true);
      await API.put(`/condo/community/${editingBuilding.community_id}`, {
        name: editingBuilding.name.trim(),
        community_code: editingBuilding.community_code.trim().toUpperCase(),
        address: editingBuilding.address ? editingBuilding.address.trim() : null,
        state: editingBuilding.state ? editingBuilding.state.trim() : null,
        city: editingBuilding.city ? editingBuilding.city.trim() : null,
        zip_code: editingBuilding.zip_code ? editingBuilding.zip_code.trim() : null,
        description: editingBuilding.description ? editingBuilding.description.trim() : null
      });

      showAlert("Success", "Condo building updated successfully!", "success");
      setShowEditBuildingModal(false);
      fetchData(); // Reload buildings directory
    } catch (err) {
      console.error("Update Building Error:", err);
      const detail = err.response?.data?.detail || "Failed to update building.";
      if (detail.toLowerCase().includes("passcode") || detail.toLowerCase().includes("exists")) {
        setBuildingErrors({ community_code: detail });
      } else {
        showAlert("Error", detail, "danger");
      }
    } finally {
      setUpdatingBuilding(false);
    }
  };

  const handleDeleteBuilding = async (buildingId) => {
    try {
      setLoading(true);
      await API.delete(`/condo/community/${buildingId}`);
      showAlert("Success", "Condo building deleted successfully!", "success");
      fetchData(); // Reload stats and buildings
    } catch (err) {
      console.error("Failed to delete building:", err);
      showAlert("Delete Error", err?.response?.data?.detail || "Failed to delete condo building.", "danger");
    } finally {
      setLoading(false);
    }
  };

  // Todo Actions
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask = {
      id: Date.now(),
      text: newTaskText.trim(),
      completed: false
    };
    const updated = [...quickTasks, newTask];
    setQuickTasks(updated);
    if (currentUser?.user_id) {
      localStorage.setItem(`condo_superadmin_tasks_${currentUser.user_id}`, JSON.stringify(updated));
    }
    setNewTaskText('');
  };

  const handleToggleTask = (taskId) => {
    const updated = quickTasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    setQuickTasks(updated);
    if (currentUser?.user_id) {
      localStorage.setItem(`condo_superadmin_tasks_${currentUser.user_id}`, JSON.stringify(updated));
    }
  };

  const handleDeleteTask = (taskId) => {
    const updated = quickTasks.filter(t => t.id !== taskId);
    setQuickTasks(updated);
    if (currentUser?.user_id) {
      localStorage.setItem(`condo_superadmin_tasks_${currentUser.user_id}`, JSON.stringify(updated));
    }
  };

  const displayBuildings = selectedCommunityId && selectedCommunityId !== 'all'
    ? buildings.filter(b => String(b.community_id) === String(selectedCommunityId))
    : buildings;

  const displayUsers = selectedCommunityId && selectedCommunityId !== 'all'
    ? users.filter(u => String(u.community_id) === String(selectedCommunityId))
    : users;

  const filteredBuildings = displayBuildings.filter(b => 
    b.name?.toLowerCase().includes(buildingSearch.toLowerCase()) ||
    b.community_code?.toLowerCase().includes(buildingSearch.toLowerCase()) ||
    b.city?.toLowerCase().includes(buildingSearch.toLowerCase())
  );

  const filteredUsers = displayUsers.filter(u => 
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email_id?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role_name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const showAll = !defaultSection;
  const showBuildings = defaultSection === 'buildings';
  const showUsers = defaultSection === 'users';

  // Quick Action Config
  const quickActions = [
    { label: "Buildings Directory", action: () => setSearchParams({ tab: 'buildings' }), icon: <Building2 size={18} className="text-blue-500" />, desc: "Manage condo towers" },
    { label: "User Registries", action: () => setSearchParams({ tab: 'users' }), icon: <Users size={18} className="text-purple-500" />, desc: "Control portal access" },
    { label: "Manage Contracts", action: () => setSearchParams({ tab: 'condo-contracts' }), icon: <FileText size={18} className="text-emerald-500" />, desc: "System agreements" },
    { label: "My Admin Profile", action: () => setSearchParams({ tab: 'profile' }), icon: <User size={18} className="text-indigo-500" />, desc: "Account security details" }
  ];

  // Calculate domain-specific platform metrics for Super Admin dashboard
  const activeBuildings = displayBuildings.filter(b => b.active_status).length;
  const inactiveBuildings = displayBuildings.filter(b => !b.active_status).length;
  const buildingRate = displayBuildings.length ? Math.round((activeBuildings / displayBuildings.length) * 100) : 0;

  const activeUsers = displayUsers.filter(u => u.active_status).length;
  const inactiveUsers = displayUsers.filter(u => !u.active_status).length;
  const userRate = displayUsers.length ? Math.round((activeUsers / displayUsers.length) * 100) : 0;

  const residentCount = displayUsers.filter(u => u.role_name === 'resident').length;
  const staffCount = displayUsers.filter(u => u.role_name === 'property_manager' || u.role_name === 'board_member').length;

  const pendingRequests = stats?.total_pending_requests ?? 0;

  return (
    <div className="p-0 space-y-4 max-w-[1600px] mx-auto text-slate-900 dark:text-white font-sans animate-in fade-in duration-200">



      {showBuildings && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* HOA Style Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
            {[
              { label: 'Total Buildings', value: stats?.total_buildings ?? 0, color: 'text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-white/10' },
              { label: 'Total Residents', value: stats?.total_residents ?? 0, color: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-100 dark:border-white/10' },
              { label: 'Total Staff', value: stats?.total_managers ?? 0, color: 'text-rose-600 dark:text-rose-400', border: 'border-rose-100 dark:border-white/10' },
              { label: 'Pending Requests', value: stats?.total_pending_requests ?? 0, color: 'text-amber-600 dark:text-amber-500', border: 'border-amber-100 dark:border-white/10' }
            ].map((m, idx) => (
              <div key={idx} className={`bg-white dark:bg-[#1E2E42] border ${m.border} p-6 rounded-3xl text-center shadow-xs flex flex-col items-center justify-center`}>
                <span className={`text-4xl font-extrabold ${m.color} tracking-tight font-mono`}>{loading ? '—' : m.value}</span>
                <span className="text-slate-500 dark:text-gray-400 text-xs font-semibold mt-1.5">{m.label}</span>
              </div>
            ))}
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs w-full">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search buildings by name, code, city..."
                value={buildingSearch}
                onChange={e => setBuildingSearch(e.target.value)}
                className="w-full bg-white dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 transition-colors"
              />
            </div>
            
            <button
              onClick={() => {
                setNewBuilding({
                  name: '',
                  community_code: '',
                  address: '',
                  state: '',
                  city: '',
                  zip_code: '',
                  description: ''
                });
                setBuildingErrors({});
                setShowCreateBuildingModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-stretch sm:self-auto justify-center cursor-pointer shadow-md shadow-blue-500/10"
            >
              <Plus size={14} /> Add Condo Building
            </button>
          </div>

          {/* Buildings Table */}
          <div className="bg-white dark:bg-[#1E2E42] border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto custom-scrollbar">
              {loading && buildings.length === 0 ? (
                <div className="p-10 text-center text-slate-500">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  Loading buildings directory...
                </div>
              ) : filteredBuildings.length === 0 ? (
                <div className="p-10 text-center text-slate-500 dark:text-gray-400">
                  <Building2 size={32} className="mx-auto mb-3 opacity-40" />
                  No buildings found in directory.
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] uppercase tracking-wider text-slate-550 dark:text-gray-400 font-bold whitespace-nowrap">
                      <th className="px-5 py-4">CONDO BUILDING</th>
                      <th className="px-5 py-4">LICENSE</th>
                      <th className="px-5 py-4 text-center">RESIDENTS</th>
                      <th className="px-5 py-4 text-center">STAFF</th>
                      <th className="px-5 py-4 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredBuildings.map((b) => {
                      const resCount = users.filter(u => u.community_id === b.community_id && u.role_name === 'resident').length;
                      const pmCount = users.filter(u => u.community_id === b.community_id && (u.role_name === 'property_manager' || u.role_name === 'board_member')).length;
                      
                      return (
                        <tr key={b.community_id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                                <Building2 size={18} />
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-900 dark:text-white text-sm">{b.name}</p>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 dark:text-gray-500">
                                  <span>{b.city || 'Miami'}, {b.state || 'FL'}</span>
                                  <span>·</span>
                                  <span className="font-mono bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-[9px] font-bold">Code: {b.community_code}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {b.active_status ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                                ACTIVE
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold border border-red-500/20">
                                SUSPENDED
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-center font-mono font-bold text-xs text-slate-800 dark:text-gray-300">
                            {loading ? '…' : resCount}
                          </td>
                          <td className="px-5 py-4 text-center font-mono font-bold text-xs text-slate-800 dark:text-gray-300">
                            {loading ? '…' : pmCount}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => handleToggleBuilding(b)}
                                disabled={togglingBuildingId === b.community_id}
                                className={`text-[10px] font-extrabold transition cursor-pointer hover:underline outline-none ${
                                  b.active_status
                                    ? 'text-amber-600 dark:text-amber-500 hover:text-amber-700'
                                    : 'text-emerald-600 dark:text-emerald-500 hover:text-emerald-700'
                                }`}
                              >
                                {togglingBuildingId === b.community_id ? '...' : (b.active_status ? 'Deactivate' : 'Activate')}
                              </button>

                              <button
                                onClick={() => {
                                  setEditingBuilding(b);
                                  setShowEditBuildingModal(true);
                                }}
                                className="text-slate-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400 transition cursor-pointer outline-none"
                                title="Edit building"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                              </button>

                              <button
                                onClick={() => {
                                  setConfirmConfig({
                                    isOpen: true,
                                    title: 'Delete Condo Building',
                                    message: `Are you sure you want to permanently delete ${b.name}? This will remove all associated statistics and database linkages.`,
                                    confirmText: 'Delete',
                                    cancelText: 'Cancel',
                                    type: 'danger',
                                    singleButton: false,
                                    onConfirm: () => {
                                      setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                                      handleDeleteBuilding(b.community_id);
                                    }
                                  });
                                }}
                                className="text-slate-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition cursor-pointer outline-none"
                                title="Delete building"
                              >
                                <Trash2 size={13} />
                              </button>

                              <button
                                onClick={() => onEnterCommunity(b.community_id)}
                                className="text-white bg-blue-600 hover:bg-blue-500 px-2.5 py-1 rounded-lg text-[9px] font-black tracking-wider uppercase transition cursor-pointer outline-none shadow-xs"
                              >
                                Enter
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {showUsers && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs w-full">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search users by name, email, role..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full bg-white dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 transition-colors"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-[#1E2E42] border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto custom-scrollbar">
              {loading && users.length === 0 ? (
                <div className="p-10 text-center text-slate-500">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  Loading user directory...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-10 text-center text-slate-500 dark:text-gray-400">
                  <Users size={32} className="mx-auto mb-3 opacity-40" />
                  No platform users found.
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] uppercase tracking-wider text-slate-550 dark:text-gray-400 font-bold whitespace-nowrap">
                      <th className="px-5 py-4">USER / MEMBER</th>
                      <th className="px-5 py-4">EMAIL ADDRESS</th>
                      <th className="px-5 py-4">SYSTEM ROLE</th>
                      <th className="px-5 py-4">BUILDING CONTEXT</th>
                      <th className="px-5 py-4">STATUS</th>
                      <th className="px-5 py-4 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredUsers.map((u) => (
                      <tr key={u.user_id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
                              {u.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U'}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 dark:text-white text-sm">{u.full_name}</p>
                              {u.user_code && <p className="text-[9px] text-slate-400 dark:text-gray-500 mt-0.5 font-mono">{u.user_code}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-700 dark:text-gray-350 text-xs font-semibold select-all break-all">
                          {u.email_id}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${
                            u.role_name === 'super_admin' ? 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 border-red-500/20' :
                            u.role_name === 'property_manager' ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/20' :
                            u.role_name === 'board_member' ? 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border-purple-500/20' :
                            'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border-slate-200/10'
                          }`}>
                            {u.role_name === 'property_manager' ? 'Property Manager' : 
                             u.role_name === 'board_member' ? 'Board Director' : 
                             u.role_name === 'super_admin' ? 'Super Admin' : 'Resident'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-700 dark:text-gray-300 text-xs font-bold">
                          {u.community_name || (
                            <span className="text-slate-400 dark:text-gray-500 font-normal italic">No Building</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {u.active_status ? (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold w-max">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold w-max">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-3.5">
                            <button
                              onClick={() => handleToggleUser(u)}
                              disabled={togglingUserId === u.user_id}
                              className={`text-[10px] font-extrabold transition cursor-pointer hover:underline outline-none ${
                                u.active_status
                                  ? 'text-amber-600 dark:text-amber-500 hover:text-amber-700'
                                  : 'text-emerald-600 dark:text-emerald-500 hover:text-emerald-700'
                              }`}
                            >
                              {togglingUserId === u.user_id ? '...' : (u.active_status ? 'Deactivate' : 'Activate')}
                            </button>
                            
                            <button
                              onClick={() => {
                                setConfirmConfig({
                                  isOpen: true,
                                  title: 'Delete User Account',
                                  message: `Are you sure you want to permanently delete ${u.full_name}? This action cannot be undone.`,
                                  confirmText: 'Delete',
                                  cancelText: 'Cancel',
                                  type: 'danger',
                                  singleButton: false,
                                  onConfirm: () => {
                                    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                                    handleDeleteUser(u.user_id);
                                  }
                                });
                              }}
                              className="text-slate-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition cursor-pointer outline-none"
                              title="Delete user profile"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-455 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <ShieldAlert size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchData} className="font-bold underline text-xs cursor-pointer hover:text-rose-500 transition">Retry Loading</button>
        </div>
      )}

      {/* ── Main Dashboard ── */}
      {showAll ? (
        <div className="space-y-3">

          {/* ─── Welcome Banner (HOA Style) ─── */}
          <div className="bg-white dark:bg-[#1E2E42] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 sm:p-8 text-slate-800 dark:text-white shadow-sm dark:shadow-none relative overflow-hidden flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 group">
            {/* Subtle premium light blue glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/[0.03] dark:bg-blue-500/[0.02] rounded-full blur-3xl pointer-events-none" />

            {/* Left: Premium Welcome & Metadata */}
            <div className="flex-1 min-w-0 relative z-10 space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  Welcome back, {currentUser?.first_name || 'Admin'}! 👋
                </h1>
                <p className="text-slate-500 dark:text-gray-450 text-xs mt-1 font-medium">
                  System Console • Real-Time Workspace Summary
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center text-[10px] font-bold text-slate-600 dark:text-slate-355 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-xl border border-slate-200/50 dark:border-white/10 font-mono">
                  Code: {displayBuildings[0]?.community_code || 'CONDO'}
                </span>
                <span className="inline-flex items-center text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                  ACTIVE
                </span>
                {displayBuildings[0] && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 dark:text-gray-300 bg-slate-50 dark:bg-white/[0.02] px-2.5 py-1 rounded-xl border border-slate-200/40 dark:border-white/5">
                    <MapPin size={11} className="text-slate-400 dark:text-slate-400 flex-shrink-0" />
                    {displayBuildings[0].name} · {displayBuildings[0].city || 'Coosawatchie'}{displayBuildings[0].zip_code ? `, ${displayBuildings[0].zip_code}` : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Right: KPI Numbers */}
            <div className="relative z-10 w-full lg:w-auto mt-5 lg:mt-0 pt-5 lg:pt-0 border-t border-slate-200/60 dark:border-white/5 lg:border-t-0 shrink-0">
              <div className="grid grid-cols-2 sm:flex sm:flex-row sm:items-center sm:justify-around lg:justify-end gap-5 sm:gap-8 lg:gap-11 w-full">
                <div className="text-center flex flex-col items-center min-w-[70px]">
                  <p className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">{loading ? '—' : (stats?.total_buildings ?? 0)}</p>
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-505 dark:text-gray-455 uppercase tracking-widest mt-1">Buildings</p>
                </div>
                <div className="text-center flex flex-col items-center min-w-[70px]">
                  <p className="text-3xl sm:text-4xl font-black text-violet-600 dark:text-violet-400 font-mono tracking-tight">{loading ? '—' : (stats?.total_residents ?? 0)}</p>
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-505 dark:text-gray-455 uppercase tracking-widest mt-1">Residents</p>
                </div>
                <div className="text-center flex flex-col items-center min-w-[70px]">
                  <p className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-455 font-mono tracking-tight">{loading ? '—' : (stats?.total_managers ?? 0)}</p>
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-505 dark:text-gray-455 uppercase tracking-widest mt-1">Staff</p>
                </div>
                <div className="text-center flex flex-col items-center min-w-[70px]">
                  <p className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-500 font-mono tracking-tight">{loading ? '—' : (stats?.total_pending_requests ?? 0)}</p>
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-550 dark:text-gray-455 uppercase tracking-widest mt-1">Pending</p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Main Two-Column Grid ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">

            {/* ── LEFT: Quick Links (7 cols) ── */}
            <div className="lg:col-span-7 bg-white dark:bg-[#1E2E42] border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/[0.05]">
                <h3 className="font-extrabold text-[11px] text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Zap size={12} className="text-yellow-500" /> Quick Links
                </h3>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { label: 'Buildings Directory', desc: 'Manage condo towers', icon: <Building2 size={20} />, color: 'text-blue-500', bg: 'bg-blue-500/10 dark:bg-blue-500/15', action: () => setSearchParams({ tab: 'buildings' }) },
                    { label: 'Platform Users', desc: 'Manage user access', icon: <Users size={20} />, color: 'text-purple-500', bg: 'bg-purple-500/10 dark:bg-purple-500/15', action: () => setSearchParams({ tab: 'users' }) },
                    { label: 'Manage Contracts', desc: 'System agreements', icon: <FileText size={20} />, color: 'text-emerald-500', bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', action: () => setSearchParams({ tab: 'condo-contracts' }) },
                    { label: 'My Admin Profile', desc: 'Account & security', icon: <User size={20} />, color: 'text-indigo-500', bg: 'bg-indigo-500/10 dark:bg-indigo-500/15', action: () => setSearchParams({ tab: 'profile' }) },
                    { label: 'Pending Approvals', desc: 'Review join requests', icon: <ClipboardCheck size={20} />, color: 'text-amber-500', bg: 'bg-amber-500/10 dark:bg-amber-500/15', badge: stats?.total_pending_requests > 0 ? stats.total_pending_requests : null, action: () => setSearchParams({ tab: 'users' }) },
                    { label: 'Platform Analytics', desc: 'System-wide reports', icon: <BarChart3 size={20} />, color: 'text-rose-500', bg: 'bg-rose-500/10 dark:bg-rose-500/15', action: () => setSearchParams({ tab: 'buildings' }) },
                  ].map((link, idx) => (
                    <button
                      key={idx}
                      onClick={link.action}
                      className="group relative p-3.5 rounded-xl border border-slate-200/60 dark:border-white/[0.05] bg-slate-50/60 dark:bg-white/[0.02] hover:border-blue-400/40 dark:hover:border-blue-500/25 hover:shadow-sm text-left transition-all duration-200 hover:scale-[1.02] flex flex-col justify-between h-24 cursor-pointer overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] to-indigo-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                      <div className="relative flex items-start justify-between">
                        <div className={`p-2 rounded-lg ${link.bg} ${link.color} transition-transform duration-200 group-hover:scale-110`}>
                          {link.icon}
                        </div>
                        {link.badge ? (
                          <span className="bg-red-500 text-white text-[9px] font-black min-w-[1rem] min-h-[1rem] rounded-full flex items-center justify-center leading-none px-1">{link.badge}</span>
                        ) : (
                          <ArrowUpRight size={13} className="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 group-hover:text-blue-500 transition-all" />
                        )}
                      </div>
                      <div className="relative">
                        <p className="text-[11px] font-extrabold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">{link.label}</p>
                        <p className="text-[9px] text-slate-400 dark:text-gray-500 mt-0.5">{link.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── RIGHT: System Metrics + Task Planner (5 cols) ── */}
            <div className="lg:col-span-5 flex flex-col gap-3">

              {/* System Metrics Domain Visualizations */}
              <div className="bg-gradient-to-br from-white to-slate-50/40 dark:from-[#1E2E42] dark:to-[#162535]/80 border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-xs relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-500/[0.05] rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-extrabold text-[11px] text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={11} className="text-yellow-500 animate-pulse" /> System Metrics
                  </h3>
                  <span className="text-[9px] font-mono text-emerald-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" /> Live
                  </span>
                </div>
                
                <div className="space-y-4">
                  {/* 1. Building Registry Status */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Building Activity</span>
                      <span className="font-bold text-slate-900 dark:text-white">{loading ? '…' : `${activeBuildings} / ${buildings.length} Active`}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-white/[0.05] h-2 rounded-full overflow-hidden border border-slate-200/20 dark:border-white/5">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${buildingRate}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 dark:text-gray-500">
                      <span>Suspended: {loading ? '…' : inactiveBuildings}</span>
                      <span>Active Rate: {loading ? '…' : `${buildingRate}%`}</span>
                    </div>
                  </div>

                  {/* 2. User Account Health */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">User Account Status</span>
                      <span className="font-bold text-slate-900 dark:text-white">{loading ? '…' : `${activeUsers} / ${users.length} Active`}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-white/[0.05] h-2 rounded-full overflow-hidden border border-slate-200/20 dark:border-white/5">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${userRate}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 dark:text-gray-500">
                      <span>Blocked / Inactive: {loading ? '…' : inactiveUsers}</span>
                      <span>Operational Rate: {loading ? '…' : `${userRate}%`}</span>
                    </div>
                  </div>

                  {/* 3. Detailed Split & Queue Info in a 2x2 Grid */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="p-2.5 bg-white/70 dark:bg-white/[0.01] border border-slate-200/40 dark:border-white/[0.03] rounded-xl flex flex-col justify-between">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">User Roles</span>
                      <div className="mt-1.5 space-y-0.5">
                        <div className="flex justify-between text-[10px] text-slate-700 dark:text-gray-300">
                          <span>Residents</span>
                          <span className="font-mono font-bold">{loading ? '…' : residentCount}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-700 dark:text-gray-300">
                          <span>Staff / PM</span>
                          <span className="font-mono font-bold">{loading ? '…' : staffCount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white/70 dark:bg-white/[0.01] border border-slate-200/40 dark:border-white/[0.03] rounded-xl flex flex-col justify-between">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Join Requests</span>
                      <div className="mt-1 flex flex-col">
                        <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{loading ? '…' : `${pendingRequests} Pending`}</span>
                        <span className={`text-[9px] mt-0.5 font-semibold ${pendingRequests > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {loading ? '…' : (pendingRequests > 0 ? '⚠️ Action Required' : '✓ Queue Clear')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Planner */}
              <div className="bg-white dark:bg-[#1E2E42] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-xs flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-extrabold text-[11px] text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ClipboardCheck size={11} className="text-blue-500" /> Task Planner
                  </h3>
                </div>
                <form onSubmit={handleAddTask} className="flex gap-1.5 mb-2.5">
                  <input
                    type="text"
                    placeholder="Add a task or reminder..."
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 transition"
                  />
                  <button type="submit" className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition flex items-center justify-center shrink-0 cursor-pointer">
                    <Plus size={13} />
                  </button>
                </form>
                <div className="space-y-1.5 max-h-44 overflow-y-auto">
                  {quickTasks.length === 0 ? (
                    <p className="text-[10px] text-slate-400 dark:text-gray-500 italic py-3 text-center border border-dashed border-slate-200/50 dark:border-white/5 rounded-xl">No tasks yet. Add one above!</p>
                  ) : (
                    quickTasks.map(task => (
                      <div key={task.id} className="flex gap-2 items-center p-2 bg-slate-50/60 dark:bg-white/[0.01] border border-slate-200/60 dark:border-white/[0.03] rounded-lg hover:border-slate-300 dark:hover:border-white/10 transition group">
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task.id)}
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center cursor-pointer transition shrink-0 ${task.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-white/20 hover:border-blue-500'}`}
                        >
                          {task.completed && <Check size={9} className="stroke-[3]" />}
                        </button>
                        <span className={`text-[10px] flex-1 leading-snug break-all ${task.completed ? 'line-through text-slate-400 dark:text-gray-500' : 'text-slate-700 dark:text-gray-300 font-medium'}`}>
                          {task.text}
                        </span>
                        <button type="button" onClick={() => handleDeleteTask(task.id)} className="p-0.5 text-slate-400 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition cursor-pointer shrink-0">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      ) : null}

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

      {/* Create Condo Building Modal */}
      {showCreateBuildingModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-white font-sans">
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex-shrink-0 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Condo Building</h2>
                <p className="text-slate-500 dark:text-gray-400 text-xs mt-1 font-medium">Link an active contract to register a new condo building.</p>
              </div>
              <button 
                onClick={() => {
                  setShowCreateBuildingModal(false);
                  setBuildingErrors({});
                  setContractVerified(false);
                  setContractCodeInput('');
                  setContractMsg('');
                }} 
                className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateBuilding} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">

                {/* Contract Code Field (HOA Style) */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 mb-2 uppercase">Contract Code <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={contractCodeInput}
                      onChange={e => setContractCodeInput(e.target.value.toUpperCase())}
                      disabled={verifyingContractCode || contractVerified}
                      className="flex-1 bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono uppercase tracking-wider disabled:opacity-60"
                      placeholder="e.g. CND-CON-F3A8D2"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyContractCode}
                      disabled={verifyingContractCode || contractVerified}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md shadow-blue-500/25 whitespace-nowrap"
                    >
                      {verifyingContractCode ? "Checking..." : contractVerified ? "Verified ✅" : "Verify Code"}
                    </button>
                  </div>
                </div>

                {contractMsg && (
                  <div className={`p-3 rounded-xl text-xs font-medium ${
                    contractMsg.includes('✅') 
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
                  }`}>
                    {contractMsg}
                  </div>
                )}

                {/* Verified Building Form Fields */}
                {contractVerified && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 mb-2 uppercase">Building Name *</label>
                      <input
                        type="text"
                        required
                        value={newBuilding.name}
                        onChange={e => setNewBuilding({...newBuilding, name: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400 dark:placeholder-gray-500"
                        placeholder="e.g. Skyline Heights Tower A"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 mb-2 uppercase">Passcode (Community Code) *</label>
                      <input
                        type="text"
                        required
                        value={newBuilding.community_code}
                        onChange={e => setNewBuilding({...newBuilding, community_code: e.target.value.toUpperCase()})}
                        className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400 dark:placeholder-gray-500 font-mono"
                        placeholder="e.g. SKYLINE100"
                      />
                      {buildingErrors.community_code && <p className="text-red-500 text-[10px] mt-1 font-bold">{buildingErrors.community_code}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 mb-2 uppercase">Street Address</label>
                      <input
                        type="text"
                        value={newBuilding.address}
                        onChange={e => setNewBuilding({...newBuilding, address: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400 dark:placeholder-gray-500"
                        placeholder="123 Ocean Blvd"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3.5">
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 mb-2 uppercase">City</label>
                        <input
                          type="text"
                          value={newBuilding.city}
                          onChange={e => setNewBuilding({...newBuilding, city: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400 dark:placeholder-gray-500"
                          placeholder="Miami"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 mb-2 uppercase">State</label>
                        <input
                          type="text"
                          value={newBuilding.state}
                          onChange={e => setNewBuilding({...newBuilding, state: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400 dark:placeholder-gray-500"
                          placeholder="FL"
                        />
                        {buildingErrors.state && <p className="text-red-500 text-[10px] mt-1 font-bold">{buildingErrors.state}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 mb-2 uppercase">Zip Code</label>
                      <input
                        type="text"
                        value={newBuilding.zip_code}
                        onChange={e => setNewBuilding({...newBuilding, zip_code: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400 dark:placeholder-gray-500 font-mono"
                        placeholder="33101"
                      />
                      {buildingErrors.zip_code && <p className="text-red-500 text-[10px] mt-1 font-bold">{buildingErrors.zip_code}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 mb-2 uppercase">Description</label>
                      <textarea
                        value={newBuilding.description}
                        onChange={e => setNewBuilding({...newBuilding, description: e.target.value})}
                        rows={2}
                        className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400 dark:placeholder-gray-500 resize-none"
                        placeholder="Luxury condominium tower overlooking the bay..."
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-white/10 flex gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateBuildingModal(false);
                    setBuildingErrors({});
                    setContractVerified(false);
                    setContractCodeInput('');
                    setContractMsg('');
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                {contractVerified && (
                  <button
                    type="submit"
                    disabled={creatingBuilding}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md transition shadow-blue-500/25"
                  >
                    {creatingBuilding ? "Registering..." : "Create Building"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Condo Building Modal */}
      {showEditBuildingModal && editingBuilding && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-white font-sans">
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex-shrink-0 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Condo Building</h2>
                <p className="text-slate-500 dark:text-gray-400 text-xs mt-1 font-medium">Update condominium tower properties.</p>
              </div>
              <button 
                onClick={() => {
                  setShowEditBuildingModal(false);
                  setEditingBuilding(null);
                  setBuildingErrors({});
                }} 
                className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateBuilding} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 mb-2 uppercase">Building Name *</label>
                  <input
                    type="text"
                    required
                    value={editingBuilding.name}
                    onChange={e => setEditingBuilding({...editingBuilding, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400 dark:placeholder-gray-500"
                    placeholder="e.g. Skyline Heights Tower A"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 mb-2 uppercase">Passcode (Community Code) *</label>
                  <input
                    type="text"
                    required
                    value={editingBuilding.community_code}
                    onChange={e => setEditingBuilding({...editingBuilding, community_code: e.target.value.toUpperCase()})}
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-450 dark:placeholder-gray-500 font-mono"
                    placeholder="e.g. SKYLINE100"
                  />
                  {buildingErrors.community_code && <p className="text-red-500 text-[10px] mt-1 font-bold">{buildingErrors.community_code}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 mb-2 uppercase">Street Address</label>
                  <input
                    type="text"
                    value={editingBuilding.address || ''}
                    onChange={e => setEditingBuilding({...editingBuilding, address: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-450 dark:placeholder-gray-500"
                    placeholder="123 Ocean Blvd"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3.5">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 mb-2 uppercase">City</label>
                    <input
                      type="text"
                      value={editingBuilding.city || ''}
                      onChange={e => setEditingBuilding({...editingBuilding, city: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-450 dark:placeholder-gray-500"
                      placeholder="Miami"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 mb-2 uppercase">State</label>
                    <input
                      type="text"
                      value={editingBuilding.state || ''}
                      onChange={e => setEditingBuilding({...editingBuilding, state: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-450 dark:placeholder-gray-500"
                      placeholder="FL"
                    />
                    {buildingErrors.state && <p className="text-red-500 text-[10px] mt-1 font-bold">{buildingErrors.state}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 mb-2 uppercase">Zip Code</label>
                  <input
                    type="text"
                    value={editingBuilding.zip_code || ''}
                    onChange={e => setEditingBuilding({...editingBuilding, zip_code: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-450 dark:placeholder-gray-500 font-mono"
                    placeholder="33101"
                  />
                  {buildingErrors.zip_code && <p className="text-red-500 text-[10px] mt-1 font-bold">{buildingErrors.zip_code}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 mb-2 uppercase">Description</label>
                  <textarea
                    value={editingBuilding.description || ''}
                    onChange={e => setEditingBuilding({...editingBuilding, description: e.target.value})}
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-450 dark:placeholder-gray-500 resize-none"
                    placeholder="Luxury condominium tower overlooking the bay..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-white/10 flex gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditBuildingModal(false);
                    setEditingBuilding(null);
                    setBuildingErrors({});
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingBuilding}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md transition shadow-blue-500/25"
                >
                  {updatingBuilding ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}


