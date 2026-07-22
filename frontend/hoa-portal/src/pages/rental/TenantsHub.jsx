import React, { useState, useEffect } from 'react';
import { 
  Users, User, Mail, Phone, Edit2, Trash2, 
  Search, Filter, ShieldCheck, ShieldAlert, 
  Sparkles, CheckCircle2, AlertCircle, X
} from 'lucide-react';
import API from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';

export default function TenantsHub({ selectedPropertyFilterId = 'all' }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, INACTIVE

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    fetchTenants();
  }, [selectedPropertyFilterId]);

  async function fetchTenants() {
    try {
      setLoading(true);
      const res = await API.get('/rental/tenants');
      setTenants(res.data);
    } catch (err) {
      console.error("Error fetching tenants:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(tenantId, currentStatus) {
    const nextStatus = !currentStatus;
    try {
      await API.put(`/rental/tenants/${tenantId}/status?active_status=${nextStatus}`);
      setTenants(prev => prev.map(t => t.user_id === tenantId ? { ...t, active_status: nextStatus } : t));
    } catch (err) {
      console.error("Error toggling tenant status:", err);
      alert("Failed to update status.");
    }
  }

  async function handleDeleteTenant(tenantId) {
    setConfirmConfig({
      isOpen: true,
      title: "Delete Tenant User",
      message: "Are you sure you want to delete this tenant user record? This action cannot be undone.",
      onConfirm: async () => {
        try {
          await API.delete(`/rental/tenants/${tenantId}`);
          setTenants(prev => prev.filter(t => t.user_id !== tenantId));
        } catch (err) {
          console.error("Error deleting tenant:", err);
          alert("Failed to delete tenant user.");
        }
      }
    });
  }

  function openEditModal(tenant) {
    setEditingTenant(tenant);
    setEditFirstName(tenant.first_name || '');
    setEditLastName(tenant.last_name || '');
    setEditEmail(tenant.email_id || '');
    setEditPhone(tenant.mobile_number || '');
    setEditUnit(tenant.unit_no || '');
    setModalError('');
    setModalSuccess('');
    setFormErrors({});
    setShowEditModal(true);
  }

  const validateEditForm = () => {
    const errs = {};
    if (!editFirstName.trim()) errs.firstName = 'First name is required.';
    if (!editLastName.trim()) errs.lastName = 'Last name is required.';
    if (!editEmail.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail.trim())) {
      errs.email = 'Invalid email format.';
    }
    if (editPhone.trim()) {
      const digits = editPhone.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) {
        errs.phone = 'Phone number must be between 7 and 15 digits.';
      }
    }
    if (!editUnit.trim()) {
      errs.unit = 'Assigned unit number is required.';
    } else if (!/^\d+$/.test(editUnit.trim())) {
      errs.unit = 'Unit number must contain only numbers.';
    }
    return errs;
  };

  async function handleUpdateTenant(e) {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');

    const validationErrors = validateEditForm();
    setFormErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      await API.put(`/rental/tenants/${editingTenant.user_id}`, {
        first_name: editFirstName,
        last_name: editLastName,
        email_id: editEmail,
        mobile_number: editPhone,
        unit_no: editUnit
      });
      
      setModalSuccess("Tenant details updated successfully!");
      setTimeout(() => {
        setShowEditModal(false);
        fetchTenants();
      }, 1000);
    } catch (err) {
      setModalError(err.response?.data?.detail || "Failed to update tenant details.");
    }
  }

  // Filter by property first (for counts and stats)
  const propertyFilteredTenants = tenants.filter(t => {
    if (selectedPropertyFilterId === 'all') return true;
    return String(t.property_id) === String(selectedPropertyFilterId);
  });

  // Filter & Search logic for table display
  const filteredTenants = propertyFilteredTenants.filter(t => {
    const matchesSearch = 
      t.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.user_id?.toString().includes(searchQuery) ||
      (t.user_code && t.user_code.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && t.active_status === true) ||
      (statusFilter === 'INACTIVE' && t.active_status === false);

    return matchesSearch && matchesStatus;
  });

  const totalCount = propertyFilteredTenants.length;
  const activeCount = propertyFilteredTenants.filter(t => t.active_status).length;
  const inactiveCount = totalCount - activeCount;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 bg-slate-50 dark:bg-[#0D1B2A] rounded-3xl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-semibold text-gray-550 dark:text-gray-400 font-mono tracking-wider">LOADING DIRECTORY...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left animate-fade-in font-sans">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Tenants Directory</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage profile information, community statuses, and activity registers of registered renters.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#1E2E42] border border-slate-200/80 dark:border-white/10 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 block uppercase font-bold tracking-wider">Total Tenants</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalCount}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E2E42] border border-slate-200/80 dark:border-white/10 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 block uppercase font-bold tracking-wider">Active Renters</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{activeCount}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E2E42] border border-slate-200/80 dark:border-white/10 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition">
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 block uppercase font-bold tracking-wider">Inactive / Locked</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{inactiveCount}</span>
          </div>
        </div>
      </div>

      {/* Main Directory Table nested inside a single gradient card */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
        
        {/* Header Section */}
        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-slate-800 dark:text-white font-medium text-sm flex items-center gap-2">
            <Users size={16} /> Tenants Registry
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by name, email or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-2xl pl-9 pr-9 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {/* Filter */}
            <div className="relative w-full sm:w-40">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 uppercase text-[10px] tracking-wider font-bold text-slate-500 dark:text-gray-400">
              <tr>
                <th className="px-4 py-4">User ID</th>
                <th className="px-4 py-4">Full Name</th>
                <th className="px-4 py-4">Email Address</th>
                <th className="px-4 py-4">Mobile Number</th>
                <th className="px-4 py-4">Assigned Unit</th>
                <th className="px-4 py-4 text-right">Active Status</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-gray-300">
              {filteredTenants.length > 0 ? (
                filteredTenants.map((t) => (
                  <tr key={t.user_id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-4 py-4 font-mono text-xs font-bold text-indigo-650 dark:text-[#5BA4F5]">{t.user_code}</td>
                    <td className="px-4 py-4">
                      <div className="text-slate-900 dark:text-white font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {t.full_name}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-gray-400">{t.email_id}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-gray-400">{t.mobile_number || 'N/A'}</td>
                    <td className="px-4 py-4">
                      {t.unit_no ? (
                        <span className="bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 px-2.5 py-0.5 rounded text-[10px] font-bold border border-blue-500/20">
                          Unit {t.unit_no}
                        </span>
                      ) : (
                        <span className="text-slate-450 text-xs italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(t.user_id, t.active_status)}
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold border transition ${
                          t.active_status 
                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20 hover:bg-emerald-500/25' 
                            : 'text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/20 hover:bg-rose-500/25'
                        }`}
                      >
                        {t.active_status ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => openEditModal(t)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-blue-500 transition cursor-pointer"
                        title="Edit Profile"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteTenant(t.user_id)}
                        className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition cursor-pointer"
                        title="Delete Tenant"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500 dark:text-gray-450 italic">
                    No tenants found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Tenant Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e2a3b] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-900 dark:text-white text-left">
            <div className="p-6">
              <div className="flex justify-between items-start mb-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" /> Edit Tenant: {editingTenant.user_code}
                </h2>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white"><X size={20} /></button>
              </div>
              <p className="text-slate-500 dark:text-gray-400 text-xs mb-6">Modify profile details and unit assignment for this tenant.</p>

              {modalError && <p className="text-xs text-red-500 bg-red-50 p-2.5 rounded-lg mb-4">{modalError}</p>}
              {modalSuccess && <p className="text-xs text-green-600 bg-green-50 p-2.5 rounded-lg mb-4">{modalSuccess}</p>}

              <form onSubmit={handleUpdateTenant} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">First Name *</label>
                    <input
                      required
                      type="text"
                      value={editFirstName}
                      onChange={e => setEditFirstName(e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${formErrors.firstName ? 'border-red-500' : 'border-slate-200 dark:border-white/10'} focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none`}
                    />
                    {formErrors.firstName && <p className="text-[10px] text-red-550 mt-0.5">{formErrors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Last Name *</label>
                    <input
                      required
                      type="text"
                      value={editLastName}
                      onChange={e => setEditLastName(e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${formErrors.lastName ? 'border-red-500' : 'border-slate-200 dark:border-white/10'} focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none`}
                    />
                    {formErrors.lastName && <p className="text-[10px] text-red-550 mt-0.5">{formErrors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Email Address *</label>
                  <input
                    required
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${formErrors.email ? 'border-red-500' : 'border-slate-200 dark:border-white/10'} focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none`}
                  />
                  {formErrors.email && <p className="text-[10px] text-red-550 mt-0.5">{formErrors.email}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Mobile Number</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '' || /^[+\d\s()-]*$/.test(val)) {
                          setEditPhone(val);
                        }
                      }}
                      className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${formErrors.phone ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-blue-500'} rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none`}
                      placeholder="e.g. +1 (555) 019-2834"
                    />
                    {formErrors.phone && <p className="text-[10px] text-red-550 mt-0.5">{formErrors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Assigned Unit No.</label>
                    <input
                      type="text"
                      value={editUnit}
                      onChange={e => setEditUnit(e.target.value.replace(/\D/g, ''))}
                      className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${formErrors.unit ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-blue-500'} rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none`}
                      placeholder="e.g. 102"
                    />
                    {formErrors.unit && <p className="text-[10px] text-red-550 mt-0.5">{formErrors.unit}</p>}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 transition-all shadow-md shadow-blue-500/25">
                    Save Profile
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={() => {
          confirmConfig.onConfirm?.();
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

// Inline ChevronDown Helper Component
function ChevronDown(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}
