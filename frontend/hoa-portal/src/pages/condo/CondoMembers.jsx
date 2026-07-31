import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  Search, ChevronDown, Plus, Mail, Phone, X, UserPlus, CheckCircle, 
  AlertCircle, RefreshCw, Edit2, Trash2
} from 'lucide-react';
import API, { getBaseUrl } from '../../services/api';
import { checkEmail } from '../../utils/emailValidation';
import { validateName, validateUnitNo, onlyLettersKeyPress } from '../../utils/fieldValidators';
import { formatPhoneAsYouType, formatUsPhone } from '../../utils/phoneFormatter';
import ConfirmModal from '../../components/ConfirmModal';

export default function CondoMembers({ community, user }) {
  const currentUserRole = (user?.role_name || user?.role || '').toLowerCase();
  const currentUserId = user?.user_id;
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, suspended
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Confirm Modal state
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

  // Invite form state
  const [inviteForm, setInviteForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    unit: '',
    role: 'Resident'
  });
  const [inviteErrors, setInviteErrors] = useState({});
  const [invitePhoneOnly, setInvitePhoneOnly] = useState('');
  const [inviting, setInviting] = useState(false);

  const validateInviteField = (field, val) => {
    let err = '';
    if (field === 'firstName') {
      const r = validateName('First Name')(val);
      if (r !== true) err = r;
    } else if (field === 'lastName') {
      const r = validateName('Last Name')(val);
      if (r !== true) err = r;
    } else if (field === 'email') {
      const r = checkEmail(val);
      if (!r.valid) err = r.message;
    } else if (field === 'unit') {
      const r = validateUnitNo(val);
      if (r !== true) err = r;
    }
    setInviteErrors(prev => ({ ...prev, [field]: err }));
    return !err;
  };


  // Edit form state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editRole, setEditRole] = useState('');
  const [saving, setSaving] = useState(false);

  const commId = community?.community_id;

  const fetchMembers = async () => {
    if (!commId) return;
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await API.get(`/condo/community/${commId}/members`);
      setMembers(res.data || []);
    } catch (err) {
      console.error("Failed to load community members:", err);
      setErrorMsg(err.response?.data?.detail || "Failed to load directory members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [commId]);

  const handleInvite = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validations
    const isFirstValid = validateInviteField('firstName', inviteForm.firstName);
    const isLastValid = validateInviteField('lastName', inviteForm.lastName);
    const isEmailValid = validateInviteField('email', inviteForm.email);
    const isUnitValid = validateInviteField('unit', inviteForm.unit);

    if (!inviteForm.firstName.trim() || !inviteForm.lastName.trim() || !inviteForm.email.trim()) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    if (!isFirstValid || !isLastValid || !isEmailValid || !isUnitValid) {
      setErrorMsg("Please correct validation errors first.");
      return;
    }

    if (invitePhoneOnly) {
      const digits = invitePhoneOnly.replace(/\D/g, '');
      if (digits.length !== 10) {
        setErrorMsg("Mobile number must be exactly 10 digits.");
        return;
      }
    }

    let mappedRole = 'resident';
    if (inviteForm.role === 'Board Member') {
      mappedRole = 'board_member';
    } else if (inviteForm.role === 'Property Manager') {
      mappedRole = 'property_manager';
    } else if (inviteForm.role === 'Resident') {
      mappedRole = 'resident';
    } else if (inviteForm.role === 'Security Guard') {
      mappedRole = 'security_guard';
    }

    try {
      setInviting(true);
      await API.post('/condo/community/invite', {
        first_name: inviteForm.firstName.trim(),
        last_name: inviteForm.lastName.trim(),
        email_id: inviteForm.email.trim().toLowerCase(),
        mobile_number: invitePhoneOnly ? `+1${invitePhoneOnly.replace(/\D/g, '')}` : null,
        unit_no: inviteForm.role === 'Security Guard' ? null : (inviteForm.unit.trim() || null),
        role_name: mappedRole,
        community_id: commId
      });

      showAlert("Success", "Invitation sent successfully!", "success");
      
      // Reset form
      setInviteForm({
        firstName: '',
        lastName: '',
        email: '',
        mobileNumber: '',
        unit: '',
        role: 'Resident'
      });
      setInvitePhoneOnly('');
      setInviteErrors({});
      setShowInviteModal(false);
      
      fetchMembers();
    } catch (err) {
      console.error("Invite Error:", err);
      setErrorMsg(err.response?.data?.detail || "Failed to send invitation.");
    } finally {
      setInviting(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      await API.put(`/condo/community/users/${userId}/status`, {
        active_status: !currentStatus
      });
      showAlert("Success", "Portal access status updated successfully!", "success");
      fetchMembers();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Failed to update member status.");
    }
  };

  const handleDeleteMember = (userId, userName) => {
    setConfirmConfig({
      isOpen: true,
      title: "Confirm Delete",
      message: `Are you sure you want to permanently delete/remove ${userName} from the community?`,
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
      singleButton: false,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          setErrorMsg('');
          setSuccessMsg('');
          await API.delete(`/condo/community/users/${userId}`);
          showAlert("Deleted", `Member ${userName} successfully removed.`, "success");
          fetchMembers();
        } catch (err) {
          console.error(err);
          showAlert("Error", err.response?.data?.detail || "Failed to remove member.", "danger");
        }
      }
    });
  };

  const handleOpenEdit = (m) => {
    setErrorMsg('');
    setEditingMember(m);
    const names = (m.full_name || '').split(' ');
    setEditFirst(names[0] || '');
    setEditLast(names.slice(1).join(' ') || '');
    setEditEmail(m.email_id || '');
    
    // Strip +1 prefix if present for USA phone formatting
    let rawPhone = m.mobile_number || '';
    if (rawPhone.startsWith('+1')) {
      rawPhone = rawPhone.substring(2);
    }
    setEditPhone(formatPhoneAsYouType(rawPhone));
    setEditUnit(m.unit_no || '');
    setEditRole(m.role_name || m.role || '');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validations
    if (!editFirst.trim() || !editLast.trim() || !editEmail.trim()) {
      setErrorMsg("First name, Last name, and Email are required.");
      return;
    }

    if (!validateName(editFirst.trim()) || !validateName(editLast.trim())) {
      setErrorMsg("Names must only contain alphabetic characters.");
      return;
    }

    const emailCheck = checkEmail(editEmail.trim());
    if (!emailCheck.valid) {
      setErrorMsg(emailCheck.message);
      return;
    }

    const cleanPhone = editPhone.replace(/\D/g, '');
    if (cleanPhone && cleanPhone.length !== 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        first_name: editFirst.trim(),
        last_name: editLast.trim(),
        email_id: editEmail.trim().toLowerCase(),
        mobile_number: cleanPhone ? `+1${cleanPhone}` : null,
        unit_no: editUnit.trim() || null
      };

      // Include role_name only if it changed and user has permission
      const originalRole = editingMember?.role_name || editingMember?.role || '';
      if (editRole && editRole !== originalRole && currentUserRole !== 'resident') {
        payload.role_name = editRole;
      }

      await API.put(`/condo/community/users/${editingMember.user_id}`, payload);

      showAlert("Success", "Member details updated successfully!", "success");
      setShowEditModal(false);
      fetchMembers();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Failed to update member details.");
    } finally {
      setSaving(false);
    }
  };

  const getNewStatusBadge = (status) => {
    if (status === 'ACTIVE') {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium w-max">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>Active
        </span>
      );
    }
    if (status === 'PENDING_VERIFICATION') {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-medium w-max">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>Pending
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-gray-400 text-[11px] font-medium w-max">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-gray-400"></div>Inactive
      </span>
    );
  };

  const getActionBtn = (member) => {
    const isCurrentlyActive = member.active_status;
    let toggleBtn = null;
    if (isCurrentlyActive) {
      toggleBtn = (
        <button
          onClick={() => handleToggleStatus(member.user_id, true)}
          className="text-amber-600 hover:text-amber-500 dark:text-amber-500 dark:hover:text-amber-400 font-medium text-xs transition-colors hover:underline mr-4"
        >
          Deactivate
        </button>
      );
    } else {
      toggleBtn = (
        <button
          onClick={() => handleToggleStatus(member.user_id, false)}
          className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-xs transition-colors hover:underline mr-4"
        >
          Activate
        </button>
      );
    }

    return (
      <div className="flex items-center gap-3">
        {toggleBtn}
        <button
          onClick={() => handleOpenEdit(member)}
          className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 text-blue-600 dark:text-blue-400 rounded-lg transition-all"
          title="Edit"
        >
          <Edit2 size={15} />
        </button>
        <button
          onClick={() => handleDeleteMember(member.user_id, member.full_name)}
          className="p-1 hover:bg-red-500/15 text-red-600 dark:text-red-400 rounded-lg transition-all"
          title="Delete"
        >
          <Trash2 size={15} />
        </button>
      </div>
    );
  };

  const filteredMembers = members.filter(m => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      (m.full_name || '').toLowerCase().includes(query) ||
      (m.email_id || '').toLowerCase().includes(query) ||
      (m.user_code || '').toLowerCase().includes(query) ||
      (m.unit_no || '').toLowerCase().includes(query)
    );
    if (!matchesSearch) return false;

    if (statusFilter === 'Active') return m.account_status === 'ACTIVE';
    if (statusFilter === 'Inactive') return m.account_status === 'INACTIVE' || m.account_status === 'LOCKED';
    if (statusFilter === 'Pending') return m.account_status === 'PENDING_VERIFICATION';
    return true;
  });

  return (
    <div className="text-slate-900 dark:text-white font-sans p-2 animate-in fade-in duration-200">
      {/* Compact Page Header Row */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5 pb-3 border-b border-slate-200/60 dark:border-white/5">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Members
        </h1>
        <button 
          onClick={() => {
            setErrorMsg('');
            setShowInviteModal(true);
          }}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 text-white shadow-md shadow-blue-500/20 whitespace-nowrap cursor-pointer"
        >
          + Invite Member
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
        
        {/* Table Top Bar */}
        <div className="p-5 border-b border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <h2 className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">All Members</h2>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#1E3248] border border-slate-200 dark:border-transparent rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 transition-colors"
              />
            </div>
            
            {/* Status Dropdown */}
            <div className="relative w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none w-full bg-slate-50 dark:bg-[#1E3248] border border-slate-200 dark:border-transparent rounded-xl pl-4 pr-10 py-2 text-xs focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white cursor-pointer transition-colors"
              >
                <option value="all" className="bg-white dark:bg-[#1E3248] text-slate-900 dark:text-white">All Statuses</option>
                <option value="Active" className="bg-white dark:bg-[#1E3248] text-slate-900 dark:text-white">Active</option>
                <option value="Pending" className="bg-white dark:bg-[#1E3248] text-slate-900 dark:text-white">Pending</option>
                <option value="Inactive" className="bg-white dark:bg-[#1E3248] text-slate-900 dark:text-white">Inactive</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          {loading && members.length === 0 ? (
            <div className="p-10 text-center text-slate-500 dark:text-gray-400">
              <div className="w-8 h-8 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Loading members...
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-10 text-center text-slate-500 dark:text-gray-400">
              <UserPlus size={32} className="mx-auto mb-3 opacity-50 text-slate-400" />
              {searchQuery || statusFilter !== 'all' ? 'No members found matching your criteria.' : 'No members found in this community.'}
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/5 text-[10px] uppercase tracking-wider text-slate-500 dark:text-gray-400 font-bold whitespace-nowrap">
                  <th className="px-3 py-4">MEMBER</th>
                  <th className="px-3 py-4">UNIT / ADDRESS</th>
                  <th className="px-3 py-4">EMAIL</th>
                  <th className="px-3 py-4">PHONE</th>
                  <th className="px-3 py-4">VERIFICATION</th>
                  <th className="px-3 py-4">STATUS</th>
                  <th className="px-3 py-4">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredMembers.map((m) => (
                  <tr key={m.user_id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-3 py-4">
                      <div className="flex flex-col gap-1">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{m.full_name}</p>
                        <span
                          className="text-[10px] font-mono text-slate-400 dark:text-gray-500"
                          title="Member ID"
                        >
                          {m.user_code || `#${m.user_id}`}
                        </span>
                        {m.role_name && (
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider w-max ${
                            m.role_name === 'super_admin' ? 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 border border-red-500/20' :
                            m.role_name === 'property_manager' ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20' :
                            m.role_name === 'board_member' ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20' :
                            'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border border-slate-200/10'
                          }`}>
                            {m.role_name === 'property_manager' ? 'Property Manager' : 
                             m.role_name === 'board_member' ? 'Board Member' : 
                             m.role_name === 'super_admin' ? 'Super Admin' : 
                             m.role_name === 'hoa_member' || m.role_name === 'resident' ? 'Resident' : m.role_name}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-4">
                      <p className="text-slate-500 dark:text-gray-400 text-xs">
                        {m.unit_no ? `Unit ${m.unit_no}` : '—'}
                      </p>
                    </td>

                    <td className="px-3 py-4">
                      <p className="text-slate-500 dark:text-gray-400 text-xs break-all">{m.email_id}</p>
                    </td>

                    <td className="px-3 py-4 whitespace-nowrap">
                      <p className="text-slate-500 dark:text-gray-400 text-xs">{formatUsPhone(m.mobile_number)}</p>
                    </td>

                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        {m.id_proof_url ? (
                          <a
                            href={getBaseUrl(m.id_proof_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 text-xs font-semibold bg-blue-500/10 hover:bg-blue-500 text-blue-600 hover:text-white rounded-xl border border-blue-500/20 transition-all"
                          >
                            ID Proof
                          </a>
                        ) : null}
                        {m.address_proof_url ? (
                          <a
                            href={getBaseUrl(m.address_proof_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 text-xs font-semibold bg-purple-500/10 hover:bg-purple-500 text-purple-600 hover:text-white rounded-xl border border-purple-500/20 transition-all"
                          >
                            Address Proof
                          </a>
                        ) : null}
                        {!m.id_proof_url && !m.address_proof_url && (
                          <span className="text-xs text-slate-400 dark:text-gray-500 font-mono">—</span>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-4 whitespace-nowrap">
                      {getNewStatusBadge(m.account_status)}
                    </td>

                    <td className="px-3 py-4 whitespace-nowrap">
                      {getActionBtn(m)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gradient-to-br dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-white">
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex-shrink-0 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Invite Member</h2>
                <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Send invitation to join the community</p>
              </div>
              <button 
                onClick={() => {
                  setShowInviteModal(false);
                  setErrorMsg('');
                  setInviteErrors({});
                }} 
                className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleInvite} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                {errorMsg && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-xl flex items-center gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={inviteForm.firstName}
                      onChange={e => {
                        setInviteForm({...inviteForm, firstName: e.target.value});
                        validateInviteField('firstName', e.target.value);
                      }}
                      onBlur={e => validateInviteField('firstName', e.target.value)}
                      onKeyPress={onlyLettersKeyPress}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-gray-500"
                      placeholder="James"
                    />
                    {inviteErrors.firstName && <p className="text-red-500 text-[10px] mt-1">{inviteErrors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={inviteForm.lastName}
                      onChange={e => {
                        setInviteForm({...inviteForm, lastName: e.target.value});
                        validateInviteField('lastName', e.target.value);
                      }}
                      onBlur={e => validateInviteField('lastName', e.target.value)}
                      onKeyPress={onlyLettersKeyPress}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-gray-500"
                      placeholder="Holloway"
                    />
                    {inviteErrors.lastName && <p className="text-red-500 text-[10px] mt-1">{inviteErrors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={e => {
                      setInviteForm({...inviteForm, email: e.target.value});
                      validateInviteField('email', e.target.value);
                    }}
                    onBlur={e => validateInviteField('email', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-gray-500"
                    placeholder="member@email.com"
                  />
                  {inviteErrors.email && <p className="text-red-500 text-[10px] mt-1">{inviteErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Mobile Number (Optional)</label>
                  <input
                    type="text"
                    value={invitePhoneOnly}
                    maxLength={14}
                    placeholder="(123) 456 7890"
                    onChange={e => {
                      const formatted = formatPhoneAsYouType(e.target.value);
                      setInvitePhoneOnly(formatted);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-gray-500"
                  />
                </div>

                {inviteForm.role !== 'Security Guard' && (
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Unit / Address</label>
                    <input
                      type="text"
                      value={inviteForm.unit}
                      onChange={e => {
                        setInviteForm({...inviteForm, unit: e.target.value});
                        validateInviteField('unit', e.target.value);
                      }}
                      onBlur={e => validateInviteField('unit', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-gray-500"
                      placeholder="Unit 14A"
                    />
                    {inviteErrors.unit && <p className="text-red-500 text-[10px] mt-1">{inviteErrors.unit}</p>}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Role</label>
                    <div className="relative">
                      <select
                        value={inviteForm.role}
                        onChange={e => setInviteForm({...inviteForm, role: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 pr-10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer appearance-none"
                      >
                        <option className="bg-white dark:bg-[#1E2E42] text-slate-900 dark:text-white">Resident</option>
                        <option className="bg-white dark:bg-[#1E2E42] text-slate-900 dark:text-white">Board Member</option>
                        <option className="bg-white dark:bg-[#1E2E42] text-slate-900 dark:text-white">Property Manager</option>
                        <option className="bg-white dark:bg-[#1E2E42] text-slate-900 dark:text-white">Security Guard</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Community</label>
                    <div className="relative">
                      <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 pr-10 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 cursor-default appearance-none" defaultValue={community?.name}>
                        <option className="bg-white dark:bg-[#1E2E42] text-slate-900 dark:text-white">{community?.name}</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-white/10 flex gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setErrorMsg('');
                    setInviteErrors({});
                    setInviteForm({
                      firstName: '',
                      lastName: '',
                      email: '',
                      mobileNumber: '',
                      unit: '',
                      role: 'Resident'
                    });
                    setInvitePhoneOnly('');
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md transition shadow-blue-500/25"
                >
                  {inviting ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Resident Modal */}
      {showEditModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4 z-[9999]">
          <div className="bg-white dark:bg-[#1E2E42] rounded-2xl w-full max-w-md border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-150 dark:border-white/5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
                <Edit2 className="w-4 h-4 text-indigo-655" />
                Edit Resident Details
              </h2>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setErrorMsg('');
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-xl flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 dark:text-gray-400 mb-2 uppercase">FIRST NAME *</label>
                  <input
                    type="text"
                    required
                    value={editFirst}
                    onChange={(e) => setEditFirst(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-550 text-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 dark:text-gray-400 mb-2 uppercase">LAST NAME *</label>
                  <input
                    type="text"
                    required
                    value={editLast}
                    onChange={(e) => setEditLast(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-550 text-slate-950 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-455 dark:text-gray-400 mb-2 uppercase">EMAIL ADDRESS *</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-550 text-slate-955 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {editRole !== 'security_guard' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 dark:text-gray-400 mb-2 uppercase">UNIT NO</label>
                    <input
                      type="text"
                      value={editUnit}
                      onChange={(e) => setEditUnit(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-550 text-slate-955 dark:text-white font-mono"
                    />
                  </div>
                )}
                <div className={editRole === 'security_guard' ? 'col-span-2' : ''}>
                  <label className="block text-[10px] font-bold text-slate-455 dark:text-gray-400 mb-2 uppercase">PHONE NUMBER</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">+1</span>
                    <input
                      type="text"
                      maxLength={14}
                      value={editPhone}
                      onChange={(e) => setEditPhone(formatPhoneAsYouType(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-xs outline-none focus:border-indigo-505 text-slate-950 dark:text-white font-mono"
                      placeholder="(123) 456-7890"
                    />
                  </div>
                </div>
              </div>

              {/* Role Dropdown — computed based on who is editing */}
              {(() => {
                const isSelf = editingMember?.user_id === currentUserId;
                const memberRole = editingMember?.role_name || editingMember?.role || '';

                // All role options
                const allRoles = [
                  { value: 'resident',        label: 'Resident' },
                  { value: 'board_member',     label: 'Board Member' },
                  { value: 'property_manager', label: 'Property Manager' },
                  { value: 'security_guard',   label: 'Security Guard' },
                ];

                let allowedRoles = [];
                let roleDisabledReason = null;

                if (currentUserRole === 'super_admin') {
                  allowedRoles = allRoles;
                } else if (currentUserRole === 'property_manager' || currentUserRole === 'board_member') {
                  if (isSelf) {
                    roleDisabledReason = 'You cannot change your own role.';
                  } else {
                    // PM/BM can only assign Resident or Security Guard
                    allowedRoles = allRoles.filter(r => ['resident', 'security_guard'].includes(r.value));
                  }
                } else {
                  // residents: no role editing
                  return null;
                }

                return (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 dark:text-gray-400 mb-2 uppercase flex items-center gap-1.5">
                      ROLE
                      {roleDisabledReason && (
                        <span className="text-[9px] font-normal text-amber-500 normal-case tracking-normal">
                          🔒 {roleDisabledReason}
                        </span>
                      )}
                    </label>
                    {roleDisabledReason ? (
                      <div className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-400 dark:text-slate-500 font-medium capitalize">
                        {memberRole.replace(/_/g, ' ')}
                      </div>
                    ) : (
                      <div className="relative">
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 text-slate-950 dark:text-white appearance-none cursor-pointer"
                        >
                          {allowedRoles.map(r => (
                            <option key={r.value} value={r.value} className="bg-white dark:bg-[#1E2E42] text-slate-900 dark:text-white">
                              {r.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex gap-4 justify-end pt-4 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setErrorMsg('');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm Popup Alert Dialog */}
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
