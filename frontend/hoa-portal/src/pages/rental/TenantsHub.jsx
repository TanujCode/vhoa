import React, { useState, useEffect } from 'react';
import { 
  Users, User, Mail, Phone, Edit2, Trash2, 
  Search, Filter, ShieldCheck, ShieldAlert, 
  Sparkles, CheckCircle2, AlertCircle, X,
  Car, PawPrint, Clock, Check, AlertTriangle, ArrowRight, FileText,
  Eye
} from 'lucide-react';
import API from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import { formatPhoneAsYouType, formatUsPhone } from '../../utils/phoneFormatter';

export default function TenantsHub({ selectedPropertyFilterId = 'all' }) {
  const [tenants, setTenants] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, INACTIVE

  // Review / Reject Modal State
  const [reviewingRequest, setReviewingRequest] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [actionProcessing, setActionProcessing] = useState(false);

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

  const showConfirm = (title, message, onConfirm, type = 'danger', confirmText = 'Yes, Proceed') => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText: 'Cancel',
      singleButton: false,
      type,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  useEffect(() => {
    fetchTenants();

    const handleGlobalUpdate = () => {
      fetchTenants();
    };
    window.addEventListener('rental-data-changed', handleGlobalUpdate);
    return () => {
      window.removeEventListener('rental-data-changed', handleGlobalUpdate);
    };
  }, [selectedPropertyFilterId]);

  async function fetchTenants() {
    try {
      setLoading(true);
      const [tenantsRes, pendingRes] = await Promise.allSettled([
        API.get('/rental/tenants'),
        API.get('/rental/leases/pending-vehicle-pet-requests')
      ]);

      if (tenantsRes.status === 'fulfilled') {
        setTenants(tenantsRes.value.data);
      }
      if (pendingRes.status === 'fulfilled') {
        setPendingRequests(pendingRes.value.data);
      }
    } catch (err) {
      console.error("Error fetching tenants:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveRequest(leaseId) {
    try {
      setActionProcessing(true);
      await API.post(`/rental/leases/${leaseId}/approve-vehicle-pet-change`);
      showAlert("Success", "Vehicle & Pet changes approved! Active lease covenants and addendum have been updated.", "success");
      setReviewingRequest(null);
      fetchTenants();
      window.dispatchEvent(new CustomEvent('rental-data-changed'));
    } catch (err) {
      showAlert("Error", err.response?.data?.detail || "Failed to approve request.", "danger");
    } finally {
      setActionProcessing(false);
    }
  }

  async function handleRejectRequest(leaseId) {
    try {
      setActionProcessing(true);
      await API.post(`/rental/leases/${leaseId}/reject-vehicle-pet-change`, { notes: rejectNotes });
      showAlert("Notice", "Vehicle & Pet change request was declined. Tenant has been notified.", "info");
      setReviewingRequest(null);
      setRejectNotes('');
      fetchTenants();
      window.dispatchEvent(new CustomEvent('rental-data-changed'));
    } catch (err) {
      showAlert("Error", err.response?.data?.detail || "Failed to decline request.", "danger");
    } finally {
      setActionProcessing(false);
    }
  }

  async function handleToggleStatus(tenantId, currentStatus) {
    const nextStatus = !currentStatus;
    try {
      await API.put(`/rental/tenants/${tenantId}/status?active_status=${nextStatus}`);
      setTenants(prev => prev.map(t => t.user_id === tenantId ? { ...t, active_status: nextStatus } : t));
      showAlert("Success", "Tenant status updated successfully!", "success");
    } catch (err) {
      console.error("Error toggling tenant status:", err);
      showAlert("Error", "Failed to update status.", "danger");
    }
  }

  async function handleDeleteTenant(tenantId) {
    showConfirm(
      "Delete Tenant User",
      "Are you sure you want to delete this tenant user record? This action cannot be undone.",
      async () => {
        try {
          await API.delete(`/rental/tenants/${tenantId}`);
          setTenants(prev => prev.filter(t => t.user_id !== tenantId));
          showAlert("Success", "Tenant record deleted successfully.", "success");
        } catch (err) {
          console.error("Error deleting tenant:", err);
          showAlert("Error", "Failed to delete tenant user.", "danger");
        }
      },
      "danger",
      "Yes, Delete"
    );
  }

  function openEditModal(tenant) {
    setEditingTenant(tenant);
    setEditFirstName(tenant.first_name || '');
    setEditLastName(tenant.last_name || '');
    setEditEmail(tenant.email_id || '');
    setEditPhone(tenant.mobile_number || '');
    
    const cleanUnit = tenant.unit_no === 'Entire Property' || tenant.unit_no === 'Single Family' || tenant.unit_no === 'Condo Unit' || (tenant.unit_no && !/\d/.test(tenant.unit_no)) ? '1' : (tenant.unit_no || '');
    setEditUnit(cleanUnit);
    
    setModalError('');
    setModalSuccess('');
    setFormErrors({});
    setShowEditModal(true);
  }

  const validateEditForm = () => {
    const errs = {};
    
    // First Name
    if (!editFirstName.trim()) {
      errs.firstName = 'First name is required.';
    } else {
      const v = editFirstName.trim();
      if (v.length < 2) {
        errs.firstName = 'First name must be at least 2 characters.';
      } else if (v.length > 60) {
        errs.firstName = 'First name must be less than 60 characters.';
      } else if (!/^[A-Za-z\s'\-]+$/.test(v)) {
        errs.firstName = 'First name should contain only letters.';
      }
    }

    // Last Name
    if (!editLastName.trim()) {
      errs.lastName = 'Last name is required.';
    } else {
      const v = editLastName.trim();
      if (v.length < 2) {
        errs.lastName = 'Last name must be at least 2 characters.';
      } else if (v.length > 60) {
        errs.lastName = 'Last name must be less than 60 characters.';
      } else if (!/^[A-Za-z\s'\-]+$/.test(v)) {
        errs.lastName = 'Last name should contain only letters.';
      }
    }

    // Email
    if (!editEmail.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(editEmail.trim())) {
      errs.email = 'Invalid email address format (e.g. name@domain.com).';
    }

    if (editPhone.trim()) {
      const digits = editPhone.replace(/\D/g, '');
      if (digits.length !== 10) {
        errs.phone = 'US phone number must be exactly 10 digits.';
      }
    }

    if (!editUnit.trim()) {
      errs.unit = 'Assigned unit number is required.';
    } else if (!/^[A-Za-z0-9\s\-/#]+$/.test(editUnit.trim())) {
      errs.unit = 'Unit number should contain only letters, numbers, spaces, -, / or #.';
    }
    return errs;
  };

  async function handleUpdateTenant(e) {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');

    const validationErrors = validateEditForm();
    setFormErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      const firstErr = Object.values(validationErrors)[0];
      showAlert("Validation Error", firstErr, "warning");
      return;
    }

    try {
      await API.put(`/rental/tenants/${editingTenant.user_id}`, {
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        email_id: editEmail.trim(),
        mobile_number: editPhone.trim(),
        unit_no: editUnit.trim()
      });
      
      setShowEditModal(false);
      showAlert("Success", "Tenant details updated successfully!", "success");
      fetchTenants();
    } catch (err) {
      showAlert("Error", err.response?.data?.detail || "Failed to update tenant details.", "danger");
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

      {/* Pending Vehicle & Pet Change Requests Banner */}
      {pendingRequests.length > 0 && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-blue-500/10 border border-amber-500/30 dark:border-amber-500/20 shadow-lg space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  Vehicle & Pet Update Requests
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm shadow-amber-500/30">
                    {pendingRequests.length} Pending Approval
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tenants have requested vehicle or pet changes on their lease. Review and approve to automatically update lease covenants and addenda.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {pendingRequests.map(req => (
              <div key={req.lease_id} className="p-4 rounded-2xl bg-white dark:bg-[#162535] border border-amber-500/25 shadow-sm flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{req.tenant_name || req.tenant_email}</h4>
                      <span className="text-xs text-slate-400 block">{req.property_name || 'Property'} • Unit {req.unit?.unit_number || '1'}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-bold border border-amber-500/20">
                      Pending
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5 bg-slate-50 dark:bg-black/20 p-2.5 rounded-xl border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <Car size={13} className="text-blue-500 shrink-0" />
                      <span className="font-semibold truncate">
                        {req.pending_vehicle_details || 'No vehicles requested'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <PawPrint size={13} className="text-violet-500 shrink-0" />
                      <span className="font-semibold truncate">
                        {req.pending_pet_details || 'No pets requested'}
                      </span>
                    </div>
                  </div>

                  {req.vehicle_pet_request_notes && (
                    <p className="text-[11px] text-slate-500 italic bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                      Note: "{req.vehicle_pet_request_notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                  <button
                    onClick={() => setReviewingRequest(req)}
                    className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye size={13} /> Review Details
                  </button>
                  <button
                    disabled={actionProcessing}
                    onClick={() => handleApproveRequest(req.lease_id)}
                    className="px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition cursor-pointer"
                    title="Quick Approve"
                  >
                    <Check size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                filteredTenants.map((t) => {
                  const hasPendingReq = pendingRequests.find(
                    pr => (pr.tenant_email && pr.tenant_email.toLowerCase() === t.email_id?.toLowerCase()) || pr.tenant_id === t.user_id
                  );
                  return (
                    <tr key={t.user_id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                      <td className="px-4 py-4 font-mono text-xs font-bold text-indigo-650 dark:text-[#5BA4F5]">{t.user_code}</td>
                      <td className="px-4 py-4">
                        <div className="text-slate-900 dark:text-white font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                          {t.full_name}
                          {hasPendingReq && (
                            <button
                              onClick={() => setReviewingRequest(hasPendingReq)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition cursor-pointer"
                              title="Click to review vehicle/pet change request"
                            >
                              <Clock size={10} /> Update Requested
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600 dark:text-gray-400">{t.email_id}</td>
                      <td className="px-4 py-4 text-slate-600 dark:text-gray-400">{formatUsPhone(t.mobile_number)}</td>
                      <td className="px-4 py-4">
                        {t.unit_no ? (
                          t.unit_no === 'Single Family' ? (
                            <span className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-450 px-2.5 py-0.5 rounded text-[10px] font-bold border border-emerald-500/20 whitespace-nowrap inline-block animate-fade-in">
                              Single Family
                            </span>
                          ) : t.unit_no === 'Condo Unit' ? (
                            <span className="bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 px-2.5 py-0.5 rounded text-[10px] font-bold border border-indigo-500/20 whitespace-nowrap inline-block animate-fade-in">
                              Condo
                            </span>
                          ) : (
                            <span className="bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 px-2.5 py-0.5 rounded text-[10px] font-bold border border-blue-500/20 whitespace-nowrap inline-block animate-fade-in">
                              {String(t.unit_no).toLowerCase().startsWith('apt') || String(t.unit_no).toLowerCase().startsWith('unit')
                                ? t.unit_no
                                : `Unit ${t.unit_no === 'Entire Property' || !/\d/.test(t.unit_no) ? '1' : t.unit_no}`
                              }
                            </span>
                          )
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
                  );
                })
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

      {/* Review Vehicle & Pet Change Request Modal */}
      {reviewingRequest && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e2a3b] w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-900 dark:text-white text-left animate-scale-up">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                      Review Vehicle & Pet Change Request
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-gray-400">
                      Tenant: <strong className="text-slate-800 dark:text-slate-200">{reviewingRequest.tenant_name || reviewingRequest.tenant_email}</strong> • {reviewingRequest.property_name} (Unit {reviewingRequest.unit?.unit_number || '1'})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setReviewingRequest(null); setRejectNotes(''); }}
                  className="p-1 text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Current Approved */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Current Approved on Lease
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200 dark:bg-white/10 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">Vehicles:</span>
                      <p className="font-mono bg-white dark:bg-black/20 p-2 rounded-lg border border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-200">
                        {reviewingRequest.vehicle_details || 'No vehicles registered ($0/mo)'}
                      </p>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">Pets:</span>
                      <p className="bg-white dark:bg-black/20 p-2 rounded-lg border border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-200">
                        {reviewingRequest.pet_details || 'No pets registered ($0/mo)'}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between font-medium text-slate-600 dark:text-slate-400">
                      <span>Current Monthly Fees:</span>
                      <strong className="text-slate-900 dark:text-white">
                        ${((reviewingRequest.parking_fee || 0) + (reviewingRequest.pet_fee || 0)).toFixed(2)}/mo
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Requested Changes */}
                <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                      Requested Modifications
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-500/20 px-2 py-0.5 rounded-full">
                      Pending Landlord Action
                    </span>
                  </div>

                  {(() => {
                    // Compute vehicle diff
                    const currV = reviewingRequest.vehicle_details ? reviewingRequest.vehicle_details.split(';').map(s => s.trim()).filter(Boolean) : [];
                    const pendV = reviewingRequest.pending_vehicle_details ? reviewingRequest.pending_vehicle_details.split(';').map(s => s.trim()).filter(Boolean) : [];
                    
                    const addedV = pendV.filter(pv => !currV.includes(pv));
                    const removedV = currV.filter(cv => !pendV.includes(cv));

                    // Compute pet diff
                    const currP = reviewingRequest.pet_details ? reviewingRequest.pet_details.split(';').map(s => s.trim()).filter(Boolean) : [];
                    const pendP = reviewingRequest.pending_pet_details ? reviewingRequest.pending_pet_details.split(';').map(s => s.trim()).filter(Boolean) : [];

                    const addedP = [];
                    const removedP = [];
                    const currCounts = {};
                    currP.forEach(p => { currCounts[p] = (currCounts[p] || 0) + 1; });
                    const pendCounts = {};
                    pendP.forEach(p => { pendCounts[p] = (pendCounts[p] || 0) + 1; });

                    Object.keys(pendCounts).forEach(k => {
                      const diff = pendCounts[k] - (currCounts[k] || 0);
                      for (let i = 0; i < diff; i++) addedP.push(k);
                    });
                    Object.keys(currCounts).forEach(k => {
                      const diff = currCounts[k] - (pendCounts[k] || 0);
                      for (let i = 0; i < diff; i++) removedP.push(k);
                    });

                    const newVCount = pendV.length;
                    const newPCount = pendP.length;
                    const newTotal = (newVCount * 25) + (newPCount * 50);

                    return (
                      <div className="space-y-3 text-xs">
                        {/* Specific Mod Items */}
                        <div className="bg-white dark:bg-black/30 p-3 rounded-xl border border-amber-500/20 space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Itemized Changes:</span>
                          
                          <ul className="space-y-1.5">
                            {addedP.map((p, i) => (
                              <li key={`add-p-${i}`} className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                <span className="text-xs font-black">+ Added Pet:</span> {p.replace(/^Pet\s*\d+:\s*/i, '')} <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400">(+$50.00/mo)</span>
                              </li>
                            ))}
                            {removedP.map((p, i) => (
                              <li key={`rem-p-${i}`} className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                                <span className="text-xs font-black">- Removed Pet:</span> {p.replace(/^Pet\s*\d+:\s*/i, '')} <span className="text-[10px] font-normal text-rose-500">(-$50.00/mo)</span>
                              </li>
                            ))}

                            {addedV.map((v, i) => (
                              <li key={`add-v-${i}`} className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                <span className="text-xs font-black">+ Added Vehicle:</span> {v.replace(/^Car\s*\d+:\s*/i, '')} <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400">(+$25.00/mo)</span>
                              </li>
                            ))}
                            {removedV.map((v, i) => (
                              <li key={`rem-v-${i}`} className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                                <span className="text-xs font-black">- Removed Vehicle:</span> {v.replace(/^Car\s*\d+:\s*/i, '')} <span className="text-[10px] font-normal text-rose-500">(-$25.00/mo)</span>
                              </li>
                            ))}

                            {addedP.length === 0 && removedP.length === 0 && addedV.length === 0 && removedV.length === 0 && (
                              <li className="text-slate-400 italic">No net changes detected.</li>
                            )}
                          </ul>
                        </div>

                        {/* Calculated New Fee */}
                        <div className="pt-2 flex items-center justify-between font-medium text-amber-900 dark:text-amber-300 border-t border-amber-500/20">
                          <span>Updated Monthly Fees (Total):</span>
                          <strong className="text-base font-black text-amber-600 dark:text-amber-400">
                            ${newTotal.toFixed(2)}/mo
                          </strong>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Tenant notes */}
              {reviewingRequest.vehicle_pet_request_notes && (
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tenant Note:</span>
                  <p className="text-slate-600 dark:text-slate-300 italic">"{reviewingRequest.vehicle_pet_request_notes}"</p>
                </div>
              )}

              {/* Legal Note Box */}
              <div className="p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                <FileText size={18} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-900 dark:text-blue-200/90 leading-relaxed">
                  <strong>US Legal & Lease Compliance:</strong> Approving this change will automatically append an official <strong>Lease Addendum: Vehicle & Pet Authorization</strong> into the tenant's legal agreement on file, update their permit registry, and adjust monthly dues.
                </p>
              </div>

              {/* Rejection Note Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Decline Reason (Required only if rejecting):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Assigned parking lot is at full capacity / Breed restricted under society bylaws"
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  className="w-full border border-slate-300 dark:border-white/20 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-red-500 bg-white dark:bg-[#1E3248] text-slate-900 dark:text-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col-reverse sm:flex-row gap-3">
                <button
                  type="button"
                  disabled={actionProcessing}
                  onClick={() => { setReviewingRequest(null); setRejectNotes(''); }}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-2xl font-bold transition text-xs cursor-pointer text-center"
                >
                  Close
                </button>

                <button
                  type="button"
                  disabled={actionProcessing}
                  onClick={() => handleRejectRequest(reviewingRequest.lease_id)}
                  className="flex-1 py-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-2xl font-bold transition text-xs cursor-pointer text-center disabled:opacity-50"
                >
                  {actionProcessing ? 'Processing...' : 'Decline Request'}
                </button>

                <button
                  type="button"
                  disabled={actionProcessing}
                  onClick={() => handleApproveRequest(reviewingRequest.lease_id)}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-bold transition shadow-lg shadow-emerald-500/20 text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check size={16} /> {actionProcessing ? 'Approving...' : 'Approve & Update Lease'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                      onChange={e => setEditFirstName(e.target.value.replace(/[^A-Za-z\s'\-]/g, ''))}
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
                      onChange={e => setEditLastName(e.target.value.replace(/[^A-Za-z\s'\-]/g, ''))}
                      className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${formErrors.lastName ? 'border-red-500' : 'border-slate-200 dark:border-white/10'} focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none`}
                    />
                    {formErrors.lastName && <p className="text-[10px] text-red-550 mt-0.5">{formErrors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Email Address *</label>
                  <input
                    required
                    type="text"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value.replace(/[^\w.@+%-]/g, ''))}
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
                        setEditPhone(formatPhoneAsYouType(e.target.value));
                      }}
                      className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${formErrors.phone ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-blue-500'} rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none`}
                      placeholder="(555) 555-5555"
                    />
                    {formErrors.phone && <p className="text-[10px] text-red-550 mt-0.5">{formErrors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                      {editingTenant?.unit_no === 'Single Family' || editingTenant?.unit_no === 'Condo Unit' ? 'Property Type' : 'Assigned Unit No.'}
                    </label>
                    {editingTenant?.unit_no === 'Single Family' || editingTenant?.unit_no === 'Condo Unit' ? (
                      <input
                        type="text"
                        readOnly
                        value={editingTenant?.unit_no === 'Single Family' ? 'Single Family Home (Entire Property)' : 'Condominium (Entire Property)'}
                        className="w-full bg-slate-100 dark:bg-[#111c2a]/40 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-550 dark:text-slate-400 outline-none cursor-not-allowed font-bold"
                      />
                    ) : (
                      <>
                        <input
                          type="text"
                          value={editUnit}
                          onChange={e => setEditUnit(e.target.value)}
                          className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${formErrors.unit ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-blue-500'} rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none`}
                          placeholder="e.g. 102"
                        />
                        {formErrors.unit && <p className="text-[10px] text-red-550 mt-0.5">{formErrors.unit}</p>}
                      </>
                    )}
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
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        type={confirmConfig.type}
        singleButton={confirmConfig.singleButton}
        onConfirm={() => {
          confirmConfig.onConfirm?.();
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => {
          if (confirmConfig.onCancel) {
            confirmConfig.onCancel();
          }
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }}
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
