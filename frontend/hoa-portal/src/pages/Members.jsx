import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, UserPlus, Mail, Phone, X, Edit2, Trash2 } from 'lucide-react';
import API, { getBaseUrl } from '../services/api';
import { checkEmail } from '../utils/emailValidation';
import { validateName, validateUnitNo, onlyLettersKeyPress } from '../utils/fieldValidators';
import { formatUsPhone, formatPhoneAsYouType } from '../utils/phoneFormatter';

const getPhoneValidationRule = (code) => {
  switch (code) {
    case '+1':
    case '+91':
    case '+44':
      return { min: 10, max: 10, label: '10 digits' };
    case '+971':
    case '+966':
    case '+61':
      return { min: 9, max: 9, label: '9 digits' };
    default:
      return { min: 7, max: 15, label: '7 to 15 digits' };
  }
};

const parsePhoneNumber = (fullNumber) => {
  const prefixes = ['+971', '+966', '+91', '+44', '+61', '+1'];
  for (const prefix of prefixes) {
    if (fullNumber?.startsWith(prefix)) {
      return {
        countryCode: prefix,
        numberOnly: fullNumber.slice(prefix.length)
      };
    }
  }
  return {
    countryCode: '+1',
    numberOnly: fullNumber || ''
  };
};

const Members = ({ community }) => {
  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [searchStatus, setSearchStatus] = useState('All Statuses');
  const [searched, setSearched] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    unit: '',
    role: 'Resident'
  });
  const [inviting, setInviting] = useState(false);
  const [inviteErrors, setInviteErrors] = useState({});
  const [invitePhoneCountryCode, setInvitePhoneCountryCode] = useState('+1');
  const [invitePhoneOnly, setInvitePhoneOnly] = useState('');

  // Edit Member State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    unit: '',
    role: 'Resident'
  });
  const [updating, setUpdating] = useState(false);
  const [editErrors, setEditErrors] = useState({});
  const [idFile, setIdFile] = useState(null);
  const [addrFile, setAddrFile] = useState(null);

  const [editPhoneCountryCode, setEditPhoneCountryCode] = useState('+1');
  const [editPhoneOnly, setEditPhoneOnly] = useState('');

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

  const validateEditField = (field, val) => {
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
    setEditErrors(prev => ({ ...prev, [field]: err }));
    return !err;
  };

  const handleInviteSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    // Validate all fields
    const isFirstValid = validateInviteField('firstName', inviteForm.firstName);
    const isLastValid = validateInviteField('lastName', inviteForm.lastName);
    const isEmailValid = validateInviteField('email', inviteForm.email);
    const isUnitValid = validateInviteField('unit', inviteForm.unit);

    if (!inviteForm.firstName.trim() || !inviteForm.lastName.trim() || !inviteForm.email.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    if (!isFirstValid || !isLastValid || !isEmailValid || !isUnitValid) {
      alert("Please correct validation errors first.");
      return;
    }

    if (invitePhoneOnly) {
      const digits = invitePhoneOnly.replace(/\D/g, '');
      if (digits.length !== 10) {
        alert("Mobile number must be exactly 10 digits.");
        return;
      }
    }

    let mappedRole = 'resident';
    if (inviteForm.role === 'Board Member') {
      mappedRole = 'board_member';
    } else if (inviteForm.role === 'Property Manager') {
      mappedRole = 'property_manager';
    } else if (inviteForm.role === 'HOA Member' || inviteForm.role === 'Resident') {
      mappedRole = 'resident';
    }

    try {
      setInviting(true);
      await API.post('/user/invite', {
        first_name: inviteForm.firstName.trim(),
        last_name: inviteForm.lastName.trim(),
        email_id: inviteForm.email.trim(),
        mobile_number: invitePhoneOnly ? `+1${invitePhoneOnly.replace(/\D/g, '')}` : null,
        unit_no: inviteForm.unit.trim() || null,
        role_name: mappedRole,
        community_id: community.community_id
      });

      alert("✅ Invitation Sent Successfully!");
      setShowInviteModal(false);
      setInviteForm({
        firstName: '',
        lastName: '',
        email: '',
        mobileNumber: '',
        unit: '',
        role: 'Resident'
      });
      setInvitePhoneCountryCode('+1');
      setInvitePhoneOnly('');
      fetchMembers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to send invitation. Please try again.");
    } finally {
      setInviting(false);
    }
  };

  useEffect(() => {
    if (community?.community_id) {
      fetchMembers();
    }
  }, [community]);

  // Local Search & Filter
  useEffect(() => {
    let filtered = members;
    
    // Filter by text search
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(m =>
        m.full_name?.toLowerCase().includes(q) ||
        m.email_id?.toLowerCase().includes(q) ||
        m.mobile_number?.includes(q)
      );
    }
    
    // Filter by status
    if (searchStatus !== 'All Statuses') {
      filtered = filtered.filter(m => {
         if (searchStatus === 'Active') return m.account_status === 'ACTIVE';
         if (searchStatus === 'Inactive') return m.account_status === 'INACTIVE' || m.account_status === 'LOCKED';
         if (searchStatus === 'Pending') return m.account_status === 'PENDING_VERIFICATION';
         return true;
      });
    }
    
    setSearched(filtered);
  }, [search, searchStatus, members]);

  const fetchMembers = async () => {
    if (!community?.community_id) return;
    
    try {
      setLoading(true);
      const res = await API.get(`/user/community/${community.community_id}?limit=100`);
      setMembers(res.data || []);
      setSearched(res.data || []);
    } catch (err) {
      console.error('Members fetch error:', err);
      setMembers([]);
      setSearched([]);
    } finally {
      setLoading(false);
    }
  };

  const getJoinReqBadge = (status) => {
    if (status === 'PENDING_VERIFICATION') {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-medium w-max">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>Pending
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium w-max">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>Approved
      </span>
    );
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

  const handleStatusUpdate = async (userId, newStatus) => {
    try {
      await API.put(`/user/${userId}/status`, {
        account_status: newStatus
      });
      alert(`✅ Account status successfully updated to ${newStatus === 'ACTIVE' ? 'Active' : 'Inactive'}!`);
      fetchMembers();
    } catch (err) {
      console.error('Status update error:', err);
      alert(err.response?.data?.detail || "Failed to update member status. Please try again.");
    }
  };

  const handleDeleteMember = async (userId, memberName) => {
    if (window.confirm(`Are you sure you want to permanently delete/remove ${memberName} from the community?`)) {
      try {
        await API.delete(`/user/${userId}`);
        alert("✅ Member successfully deleted.");
        fetchMembers();
      } catch (err) {
        console.error("Delete member error:", err);
        alert(err.response?.data?.detail || "Failed to delete member. Please try again.");
      }
    }
  };

  const handleOpenEditModal = (member) => {
    let mappedRole = 'Resident';
    if (member.role_name === 'board_member') {
      mappedRole = 'Board Member';
    } else if (member.role_name === 'property_manager') {
      mappedRole = 'Property Manager';
    } else if (member.role_name === 'resident') {
      mappedRole = 'Resident';
    }

    const parsed = parsePhoneNumber(member.mobile_number || '');
    setEditPhoneCountryCode('+1');
    setEditPhoneOnly(formatPhoneAsYouType(parsed.numberOnly));

    setIdFile(null);
    setAddrFile(null);
    setEditingMember(member);
    setEditForm({
      firstName: member.first_name || '',
      lastName: member.last_name || '',
      email: member.email_id || '',
      mobileNumber: member.mobile_number || '',
      unit: member.unit_no || '',
      role: mappedRole
    });
    setShowEditModal(true);
  };
  const handleEditSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // Validate all fields
    const isFirstValid = validateEditField('firstName', editForm.firstName);
    const isLastValid = validateEditField('lastName', editForm.lastName);
    const isEmailValid = validateEditField('email', editForm.email);
    const isUnitValid = validateEditField('unit', editForm.unit);

    if (!editForm.firstName.trim() || !editForm.lastName.trim() || !editForm.email.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    if (!isFirstValid || !isLastValid || !isEmailValid || !isUnitValid) {
      alert("Please correct validation errors first.");
      return;
    }
    // Phone validation (optional)
    if (editPhoneOnly) {
      const digits = editPhoneOnly.replace(/\D/g, '');
      if (digits.length !== 10) {
        alert("Mobile number must be exactly 10 digits.");
        return;
      }
    }

    let mappedRole = 'resident';
    if (editForm.role === 'Board Member') {
      mappedRole = 'board_member';
    } else if (editForm.role === 'Property Manager') {
      mappedRole = 'property_manager';
    } else if (editForm.role === 'HOA Member' || editForm.role === 'Resident') {
      mappedRole = 'resident';
    }

    try {
      setUpdating(true);

      // Upload ID proof if selected
      if (idFile) {
        const formData = new FormData();
        formData.append('file', idFile);
        await API.post(`/user/${editingMember.user_id}/id-proof`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // Upload Address proof if selected
      if (addrFile) {
        const formData = new FormData();
        formData.append('file', addrFile);
        await API.post(`/user/${editingMember.user_id}/address-proof`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      await API.put(`/user/${editingMember.user_id}`, {
        first_name: editForm.firstName.trim(),
        last_name: editForm.lastName.trim(),
        email_id: editForm.email.trim(),
        mobile_number: editPhoneOnly ? `+1${editPhoneOnly.replace(/\D/g, '')}` : null,
        unit_no: editForm.unit.trim() || null,
        role_name: mappedRole
      });

      alert("✅ Member details successfully updated!");
      setShowEditModal(false);
      setEditingMember(null);
      setIdFile(null);
      setAddrFile(null);
      setEditPhoneCountryCode('+1');
      setEditPhoneOnly('');
      fetchMembers();
    } catch (err) {
      console.error("Update member error:", err);
      alert(err.response?.data?.detail || "Failed to update member. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const getActionBtn = (member) => {
    const status = member.account_status;
    let toggleBtn = null;
    if (status === 'ACTIVE') {
      toggleBtn = (
        <button
          onClick={() => handleStatusUpdate(member.user_id, 'INACTIVE')}
          className="text-amber-600 hover:text-amber-500 dark:text-amber-500 dark:hover:text-amber-400 font-medium text-xs transition-colors hover:underline mr-4"
        >
          Deactivate
        </button>
      );
    } else if (status === 'PENDING_VERIFICATION') {
      toggleBtn = (
        <button
          onClick={() => handleStatusUpdate(member.user_id, 'ACTIVE')}
          className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-xs transition-colors hover:underline mr-4"
        >
          Approve
        </button>
      );
    } else {
      toggleBtn = (
        <button
          onClick={() => handleStatusUpdate(member.user_id, 'ACTIVE')}
          className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-xs transition-colors hover:underline mr-4"
        >
          Reactivate
        </button>
      );
    }

    return (
      <div className="flex items-center gap-3">
        {toggleBtn}
        <button
          onClick={() => handleOpenEditModal(member)}
          className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 text-blue-650 dark:text-blue-400 rounded-lg transition-all"
          title="Edit"
        >
          <Edit2 size={15} />
        </button>
        <button
          onClick={() => handleDeleteMember(member.user_id, member.full_name)}
          className="p-1 hover:bg-red-500/15 text-red-650 dark:text-red-400 rounded-lg transition-all"
          title="Delete"
        >
          <Trash2 size={15} />
        </button>
      </div>
    );
  };

  return (
    <div className="text-slate-900 dark:text-white">
      {/* Compact Page Header Row */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5 pb-3 border-b border-slate-200/60 dark:border-white/5">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Members
        </h1>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 text-white shadow-md shadow-blue-500/20 whitespace-nowrap"
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
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#1E3248] border border-slate-200 dark:border-transparent rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 transition-colors"
              />
            </div>
            
            {/* Status Dropdown */}
            <div className="relative w-full sm:w-auto">
              <select
                value={searchStatus}
                onChange={e => setSearchStatus(e.target.value)}
                className="appearance-none w-full bg-slate-50 dark:bg-[#1E3248] border border-slate-200 dark:border-transparent rounded-xl pl-4 pr-10 py-2 text-xs focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white cursor-pointer transition-colors"
              >
                <option value="All Statuses" className="bg-white dark:bg-[#1E3248] text-slate-900 dark:text-white">All Statuses</option>
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
          ) : searched.length === 0 ? (
            <div className="p-10 text-center text-slate-500 dark:text-gray-400">
              <UserPlus size={32} className="mx-auto mb-3 opacity-50 text-slate-400" />
              {search || searchStatus !== 'All Statuses' ? 'No members found matching your criteria.' : 'No members found in this community.'}
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
                {searched.map((m, index) => (
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
                        {m.unit_no || '—'}
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
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gradient-to-br dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-white">
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex-shrink-0">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Invite Member</h2>
                <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white"><X size={20} /></button>
              </div>
              <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Send invitation to join the community</p>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={inviteForm.firstName}
                    onChange={e => {
                      setInviteForm({...inviteForm, firstName: e.target.value});
                      validateInviteField('firstName', e.target.value);
                    }}
                    onBlur={e => validateInviteField('firstName', e.target.value)}
                    onKeyPress={onlyLettersKeyPress}
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-gray-500"
                    placeholder="James"
                  />
                  {inviteErrors.firstName && <p className="text-red-500 text-xs mt-1">{inviteErrors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={inviteForm.lastName}
                    onChange={e => {
                      setInviteForm({...inviteForm, lastName: e.target.value});
                      validateInviteField('lastName', e.target.value);
                    }}
                    onBlur={e => validateInviteField('lastName', e.target.value)}
                    onKeyPress={onlyLettersKeyPress}
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-gray-500"
                    placeholder="Holloway"
                  />
                  {inviteErrors.lastName && <p className="text-red-500 text-xs mt-1">{inviteErrors.lastName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={e => {
                    setInviteForm({...inviteForm, email: e.target.value});
                    validateInviteField('email', e.target.value);
                  }}
                  onBlur={e => validateInviteField('email', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-gray-500"
                  placeholder="member@email.com"
                />
                {inviteErrors.email && <p className="text-red-500 text-xs mt-1">{inviteErrors.email}</p>}
              </div>

              <div>
                <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Mobile Number (Optional)</label>
                <input
                  type="text"
                  value={invitePhoneOnly}
                  maxLength={14}
                  placeholder="(123) 456-7890"
                  onChange={e => {
                    const formatted = formatPhoneAsYouType(e.target.value);
                    setInvitePhoneOnly(formatted);
                  }}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-gray-500"
                />
              </div>

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
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200/10 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-gray-500"
                  placeholder="Unit 14A"
                />
                {inviteErrors.unit && <p className="text-red-500 text-xs mt-1">{inviteErrors.unit}</p>}
              </div>


              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Role</label>
                  <div className="relative">
                    <select
                      value={inviteForm.role}
                      onChange={e => setInviteForm({...inviteForm, role: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl p-2.5 pr-10 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 cursor-pointer appearance-none"
                    >
                      <option className="bg-white dark:bg-[#0D1B2A] text-slate-900 dark:text-white">Resident</option>
                      <option className="bg-white dark:bg-[#0D1B2A] text-slate-900 dark:text-white">Board Member</option>
                      <option className="bg-white dark:bg-[#0D1B2A] text-slate-900 dark:text-white">Property Manager</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Community</label>
                  <div className="relative">
                    <select className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl p-2.5 pr-10 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 cursor-default appearance-none" defaultValue={community?.name}>
                      <option className="bg-white dark:bg-[#0D1B2A] text-slate-900 dark:text-white">{community?.name}</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-white/10 flex gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteForm({
                    firstName: '',
                    lastName: '',
                    email: '',
                    mobileNumber: '',
                    unit: '',
                    role: 'Resident'
                  });
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium cancel-button-red-hover"
              >
                Cancel
              </button>
              <button
                onClick={handleInviteSubmit}
                disabled={inviting}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl font-medium text-white transition text-sm shadow-md shadow-blue-500/25"
              >
                {inviting ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Member Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gradient-to-br dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-white">
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex-shrink-0">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Update Member Details</h2>
                <button onClick={() => { setShowEditModal(false); setEditingMember(null); }} className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white"><X size={20} /></button>
              </div>
              <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Modify details for {editingMember?.full_name}</p>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={e => {
                      setEditForm({...editForm, firstName: e.target.value});
                      validateEditField('firstName', e.target.value);
                    }}
                    onBlur={e => validateEditField('firstName', e.target.value)}
                    onKeyPress={onlyLettersKeyPress}
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-gray-500"
                    placeholder="James"
                  />
                  {editErrors.firstName && <p className="text-red-500 text-xs mt-1">{editErrors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={e => {
                      setEditForm({...editForm, lastName: e.target.value});
                      validateEditField('lastName', e.target.value);
                    }}
                    onBlur={e => validateEditField('lastName', e.target.value)}
                    onKeyPress={onlyLettersKeyPress}
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-gray-500"
                    placeholder="Holloway"
                  />
                  {editErrors.lastName && <p className="text-red-500 text-xs mt-1">{editErrors.lastName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={e => {
                    setEditForm({...editForm, email: e.target.value});
                    validateEditField('email', e.target.value);
                  }}
                  onBlur={e => validateEditField('email', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-gray-500"
                  placeholder="member@email.com"
                />
                {editErrors.email && <p className="text-red-500 text-xs mt-1">{editErrors.email}</p>}
              </div>

              <div>
                <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Mobile Number (Optional)</label>
                <input
                  type="text"
                  value={editPhoneOnly}
                  maxLength={14}
                  placeholder="(123) 456-7890"
                  onChange={e => {
                    const formatted = formatPhoneAsYouType(e.target.value);
                    setEditPhoneOnly(formatted);
                  }}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Unit / Address</label>
                <input
                  type="text"
                  value={editForm.unit}
                  onChange={e => {
                    setEditForm({...editForm, unit: e.target.value});
                    validateEditField('unit', e.target.value);
                  }}
                  onBlur={e => validateEditField('unit', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-gray-500"
                  placeholder="Unit 14A"
                />
                {editErrors.unit && <p className="text-red-500 text-xs mt-1">{editErrors.unit}</p>}
              </div>


              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Role</label>
                  <div className="relative">
                    <select
                      value={editForm.role}
                      onChange={e => setEditForm({...editForm, role: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl p-2.5 pr-10 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 cursor-pointer appearance-none"
                    >
                      <option className="bg-white dark:bg-[#0D1B2A] text-slate-900 dark:text-white">Resident</option>
                      <option className="bg-white dark:bg-[#0D1B2A] text-slate-900 dark:text-white">Board Member</option>
                      <option className="bg-white dark:bg-[#0D1B2A] text-slate-900 dark:text-white">Property Manager</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Community</label>
                  <div className="relative">
                    <select className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl p-2.5 pr-10 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 cursor-default appearance-none" defaultValue={community?.name} disabled>
                      <option className="bg-white dark:bg-[#0D1B2A] text-slate-900 dark:text-white">{community?.name}</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-white/10 pt-4 space-y-3">
                <h4 className="font-semibold text-xs text-slate-800 dark:text-white uppercase tracking-wider">Verification Documents</h4>
                <div className="grid grid-cols-2 gap-3">
                  {/* ID Proof */}
                  <div className="bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl p-3 flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 block">IDENTITY PROOF</span>
                    {editingMember?.id_proof_url ? (
                      <a
                        href={getBaseUrl(editingMember.id_proof_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline font-semibold block truncate"
                      >
                        View ID Proof
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-gray-500">Not Uploaded</span>
                    )}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={e => setIdFile(e.target.files[0])}
                      className="text-[10px] text-slate-500 dark:text-gray-400 w-full"
                    />
                    {idFile && <span className="text-[10px] text-blue-600 font-semibold truncate">Ready: {idFile.name}</span>}
                  </div>

                  {/* Address Proof */}
                  <div className="bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl p-3 flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 block">ADDRESS PROOF</span>
                    {editingMember?.address_proof_url ? (
                      <a
                        href={getBaseUrl(editingMember.address_proof_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-600 hover:underline font-semibold block truncate"
                      >
                        View Address Proof
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-gray-500">Not Uploaded</span>
                    )}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={e => setAddrFile(e.target.files[0])}
                      className="text-[10px] text-slate-500 dark:text-gray-400 w-full"
                    />
                    {addrFile && <span className="text-[10px] text-purple-600 font-semibold truncate">Ready: {addrFile.name}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-white/10 flex gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingMember(null);
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium cancel-button-red-hover"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={updating}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl font-medium text-white transition text-sm shadow-md shadow-blue-500/25"
              >
                {updating ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;