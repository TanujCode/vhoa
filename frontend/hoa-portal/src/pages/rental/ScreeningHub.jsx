import React, { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle2, ShieldAlert, Sparkles, User, Mail, DollarSign, Briefcase, Phone, ShieldCheck, Info, Trash2, Search, X, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import API, { getBaseUrl } from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import { formatUsPhone } from '../../utils/phoneFormatter';


export default function ScreeningHub({ user, setActivePage, selectedPropertyFilterId = 'all' }) {
  const isLandlord = user?.role === 'landlord' || user?.role_name === 'landlord' || user?.role_id === 1; // Super admin also landlord
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);

  // Invite states for landlord
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteUnitId, setInviteUnitId] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteErrors, setInviteErrors] = useState({});

  // Complete invited application states
  const [activeInviteAppId, setActiveInviteAppId] = useState(null);
  const [simulationMode, setSimulationMode] = useState('CLEAN');
  
  // Renter Application Form States
  const [units, setUnits] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [empStatus, setEmpStatus] = useState('Employed');
  const [income, setIncome] = useState('');
  const [pets, setPets] = useState('');
  const [vehicles, setVehicles] = useState('');
  const [references, setReferences] = useState('');
  const [incomeProofUrl, setIncomeProofUrl] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);

  const [showApplyForm, setShowApplyForm] = useState(!isLandlord);

  // Additional US Specific & Validation States
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [myApplications, setMyApplications] = useState([]);
  const [reapply, setReapply] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // Formatting helpers
  const formatPhoneNumber = (value) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  // Real-time validations
  const validateName = (val) => {
    const trimmed = val.trim();
    if (!trimmed) {
      return 'Full name is required.';
    }
    if (!/^[a-zA-Z\s]{2,50}$/.test(trimmed)) {
      return 'Name must contain only letters and spaces (2-50 characters).';
    }
    const parts = trimmed.split(/\s+/);
    if (parts.length < 2 || parts[1] === '') {
      return 'Please enter both first and last name.';
    }
    return '';
  };

  const validateEmail = (val) => {
    const trimmed = val.trim();
    if (!trimmed) {
      return 'Email address is required.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return 'Please enter a valid email address.';
    }
    return '';
  };

  const validatePhone = (val) => {
    const digits = val.replace(/[^\d]/g, '');
    if (!digits) {
      return 'Phone number is required.';
    }
    if (digits.length !== 10) {
      return 'Phone number must be exactly 10 digits.';
    }
    return '';
  };

  const validateIncome = (val) => {
    if (!val) {
      return 'Estimated monthly income is required.';
    }
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
      return 'Income must be a positive number greater than 0.';
    }
    if (num > 1000000) {
      return 'Please enter a realistic monthly income amount.';
    }
    return '';
  };

  const validateReferences = (val) => {
    const trimmed = val.trim();
    if (!trimmed) {
      return 'Please provide reference or previous landlord details.';
    }
    if (trimmed.length < 5) {
      return 'Reference details must be at least 5 characters.';
    }
    return '';
  };

  const validatePets = (val) => {
    const trimmed = val.trim();
    if (trimmed && trimmed.length < 2) {
      return 'Pet details must be at least 2 characters.';
    }
    return '';
  };

  const validateVehicles = (val) => {
    const trimmed = val.trim();
    if (trimmed && trimmed.length < 2) {
      return 'Vehicle details must be at least 2 characters.';
    }
    return '';
  };

  const handleInviteNameChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^[a-zA-Z\s]*$/.test(val)) {
      setInviteName(val);
      let error = '';
      if (!val.trim()) {
        error = 'Full name is required.';
      } else {
        const parts = val.trim().split(/\s+/);
        if (parts.length < 2 || parts[1] === '') {
          error = 'Please enter both first and last name.';
        }
      }
      setInviteErrors(prev => ({ ...prev, name: error }));
    }
  };

  const handleInviteEmailChange = (e) => {
    const val = e.target.value;
    setInviteEmail(val);
    let error = '';
    if (!val.trim()) {
      error = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) {
      error = 'Please enter a valid email address.';
    }
    setInviteErrors(prev => ({ ...prev, email: error }));
  };

  // Field change handlers
  const handleNameChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^[a-zA-Z\s]*$/.test(val)) {
      setFullName(val);
      if (touched.fullName) {
        setErrors(prev => ({ ...prev, fullName: validateName(val) }));
      }
    }
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setTenantEmail(val);
    if (touched.tenantEmail) {
      setErrors(prev => ({ ...prev, tenantEmail: validateEmail(val) }));
    }
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    const formatted = formatPhoneNumber(val);
    setPhone(formatted);
    if (touched.phone) {
      setErrors(prev => ({ ...prev, phone: validatePhone(formatted) }));
    }
  };

  const handleIncomeChange = (e) => {
    const val = e.target.value;
    const cleaned = val.replace(/[^\d]/g, '');
    setIncome(cleaned);
    if (touched.income) {
      setErrors(prev => ({ ...prev, income: validateIncome(cleaned) }));
    }
  };

  const handleReferencesChange = (e) => {
    const val = e.target.value;
    setReferences(val);
    if (touched.references) {
      setErrors(prev => ({ ...prev, references: validateReferences(val) }));
    }
  };

  const handlePetsChange = (e) => {
    const val = e.target.value;
    setPets(val);
    if (touched.pets) {
      setErrors(prev => ({ ...prev, pets: validatePets(val) }));
    }
  };

  const handleVehiclesChange = (e) => {
    const val = e.target.value;
    setVehicles(val);
    if (touched.vehicles) {
      setErrors(prev => ({ ...prev, vehicles: validateVehicles(val) }));
    }
  };

  const handleIncomeProofUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, incomeProof: 'File size must not exceed 10MB.' }));
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setUploadingProof(true);
      setErrors(prev => ({ ...prev, incomeProof: '' }));
      const res = await API.post('/rental/applications/upload-proof', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIncomeProofUrl(res.data.url);
    } catch (err) {
      console.error("Proof upload failed:", err);
      setErrors(prev => ({ ...prev, incomeProof: err.response?.data?.detail || 'Failed to upload proof of income.' }));
    } finally {
      setUploadingProof(false);
    }
  };

  const handleBlur = (field, value) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    let error = '';
    if (field === 'fullName') error = validateName(value);
    else if (field === 'tenantEmail') error = validateEmail(value);
    else if (field === 'phone') error = validatePhone(value);
    else if (field === 'income') error = validateIncome(value);
    else if (field === 'references') error = validateReferences(value);
    else if (field === 'pets') error = validatePets(value);
    else if (field === 'vehicles') error = validateVehicles(value);
    
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const filteredUnits = units.filter(u => 
    selectedPropertyFilterId === 'all' || 
    String(u.property_id) === String(selectedPropertyFilterId) ||
    String(u.unit_id) === String(inviteUnitId) ||
    String(u.unit_id) === String(selectedUnitId)
  );

  const selectedUnit = filteredUnits.find(u => String(u.unit_id) === String(selectedUnitId));
  const isAllOccupied = filteredUnits.length > 0 && filteredUnits.every(u => u.status === 'OCCUPIED');

  useEffect(() => {
    if (isLandlord) {
      fetchApplications();
    } else {
      fetchTenantScreeningData();
    }
  }, [isLandlord]);

  useEffect(() => {
    if (isLandlord && units.length > 0 && inviteModalOpen) {
      const propUnits = units.filter(u => 
        selectedPropertyFilterId === 'all' || String(u.property_id) === String(selectedPropertyFilterId)
      );
      if (propUnits.length > 0) {
        if (!inviteUnitId || !propUnits.some(u => String(u.unit_id) === String(inviteUnitId))) {
          setInviteUnitId(propUnits[0].unit_id.toString());
        }
      } else {
        setInviteUnitId('');
      }
    }
  }, [selectedPropertyFilterId, units, isLandlord, inviteModalOpen]);

  useEffect(() => {
    if (!isLandlord && user && !activeInviteAppId) {
      if (user.name) setFullName(user.name);
      if (user.email) setTenantEmail(user.email);
    }
  }, [user, isLandlord, activeInviteAppId]);

  useEffect(() => {
    if (selectedApp) {
      if (selectedApp.screening_status === 'APPROVED') {
        toast.success(`This application has been APPROVED. You can now create a lease agreement for ${selectedApp.full_name}.`, {
          id: 'screening-status-toast',
        });
      } else if (selectedApp.screening_status === 'REJECTED') {
        toast.error(`This application has been REJECTED.`, {
          id: 'screening-status-toast',
        });
      }
    }
  }, [selectedApp]);

  async function fetchApplications() {
    try {
      setLoading(true);
      const res = await API.get('/rental/applications');
      setApplications(res.data);
      
      // Fetch units for landlord to invite tenants (only vacant units)
      const propRes = await API.get('/rental/properties');
      const props = propRes.data;
      const allUnits = [];
      for (const p of props) {
        const unitRes = await API.get(`/rental/properties/${p.property_id}/units`);
        const vacant = unitRes.data.filter(u => u.status !== 'OCCUPIED' && !u.has_active_lease);
        allUnits.push(...vacant.map(u => ({ ...u, propertyName: p.name })));
      }
      setUnits(allUnits);
      if (allUnits.length > 0) {
        setInviteUnitId(allUnits[0].unit_id.toString());
      } else {
        setInviteUnitId('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendInvite(e) {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    
    let errorsExist = false;
    let newErrors = {};

    const nameVal = inviteName.trim();
    if (!nameVal) {
      newErrors.name = "Applicant Full Name is required.";
      errorsExist = true;
    } else if (!/^[a-zA-Z\s]{2,50}$/.test(nameVal)) {
      newErrors.name = "Applicant Name must contain only letters and spaces (2-50 characters).";
      errorsExist = true;
    } else {
      const nameParts = nameVal.split(/\s+/);
      if (nameParts.length < 2 || nameParts[1] === '') {
        newErrors.name = "Applicant Name must contain both first name and last name.";
        errorsExist = true;
      }
    }

    const emailVal = inviteEmail.trim();
    if (!emailVal) {
      newErrors.email = "Applicant Email is required.";
      errorsExist = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailVal)) {
        newErrors.email = "Please enter a valid applicant email address.";
        errorsExist = true;
      }
    }
    
    if (!inviteUnitId) {
      setInviteError("Please select a unit.");
      return;
    }

    if (errorsExist) {
      setInviteErrors(newErrors);
      setInviteError("Please resolve the validation errors before sending.");
      return;
    }

    try {
      await API.post('/rental/applications/invite', {
        unit_id: parseInt(inviteUnitId),
        tenant_email: inviteEmail.trim(),
        full_name: inviteName.trim()
      });
      setInviteSuccess("Screening invitation sent successfully!");
      setInviteName('');
      setInviteEmail('');
      // Refresh list
      const res = await API.get('/rental/applications');
      setApplications(res.data);
      setTimeout(() => {
        setInviteModalOpen(false);
        setInviteSuccess('');
      }, 1000);
    } catch (err) {
      setInviteError(err.response?.data?.detail || "Failed to send invitation.");
    }
  }

  async function fetchTenantScreeningData() {
    try {
      setLoading(true);
      // Fetch available units (only vacant units)
      const propRes = await API.get('/rental/properties');
      const props = propRes.data;
      const allUnits = [];
      for (const p of props) {
        const unitRes = await API.get(`/rental/properties/${p.property_id}/units`);
        const vacant = unitRes.data.filter(u => u.status !== 'OCCUPIED' && !u.has_active_lease);
        allUnits.push(...vacant.map(u => ({ ...u, propertyName: p.name })));
      }
      setUnits(allUnits);
      if (allUnits.length > 0) {
        setSelectedUnitId(allUnits[0].unit_id);
      } else {
        setSelectedUnitId('');
      }

      // Fetch my applications
      const appRes = await API.get('/rental/applications/my');
      setMyApplications(appRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMyApplications() {
    try {
      const res = await API.get('/rental/applications/my');
      setMyApplications(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleReviewApplication(appId, statusStr) {
    try {
      const res = await API.post(`/rental/applications/${appId}/review?status_str=${statusStr}`);
      setApplications(prev => prev.map(a => a.application_id === appId ? res.data : a));
      setSelectedApp(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteApplication(appId, e) {
    e.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      title: "Delete Screening Application",
      message: "Are you sure you want to delete this screening application? This action cannot be undone.",
      onConfirm: async () => {
        try {
          await API.delete(`/rental/applications/${appId}`);
          setApplications(prev => prev.filter(a => a.application_id !== appId));
          if (selectedApp?.application_id === appId) {
            setSelectedApp(null);
          }
        } catch (err) {
          console.error("Error deleting application:", err);
        }
      }
    });
  }

  async function handleApply(e) {
    e.preventDefault();

    // Mark all as touched
    const newTouched = {
      fullName: true,
      tenantEmail: true,
      phone: true,
      income: true,
      references: true,
      pets: true,
      vehicles: true
    };
    setTouched(newTouched);

    const nameErr = validateName(fullName);
    const emailErr = validateEmail(tenantEmail);
    const phoneErr = validatePhone(phone);
    const incomeErr = validateIncome(income);
    const refErr = validateReferences(references);
    const petsErr = validatePets(pets);
    const vehiclesErr = validateVehicles(vehicles);

    // Validate unit selection
    let unitErr = '';
    if (!selectedUnitId || isNaN(parseInt(selectedUnitId))) {
      unitErr = 'Please select a valid unit.';
    }

    const validationErrors = {
      fullName: nameErr,
      tenantEmail: emailErr,
      phone: phoneErr,
      income: incomeErr,
      references: refErr,
      pets: petsErr,
      vehicles: vehiclesErr,
      unitId: unitErr
    };

    if (!consent) {
      validationErrors.consent = 'You must authorize the credit and background screening report.';
    }

    setErrors(validationErrors);

    const hasErrors = Object.values(validationErrors).some(err => err !== '');
    if (hasErrors) {
      toast.error(unitErr || 'Please fix the validation errors in the form.');
      return;
    }

    setSubmitting(true);
    try {
      if (activeInviteAppId) {
        await API.put(`/rental/applications/${activeInviteAppId}/complete`, {
          phone: phone.replace(/[^\d]/g, ''),
          employment_status: empStatus,
          monthly_income: parseFloat(income),
          references_data: references.trim(),
          pet_details: pets.trim(),
          vehicle_details: vehicles.trim(),
          income_proof_url: incomeProofUrl,
          simulation_mode: simulationMode
        });
      } else {
        await API.post('/rental/applications', {
          unit_id: parseInt(selectedUnitId),
          tenant_email: tenantEmail,
          full_name: fullName.trim(),
          phone: phone.replace(/[^\d]/g, ''), // clean digits for API
          employment_status: empStatus,
          monthly_income: parseFloat(income),
          references_data: references.trim(),
          pet_details: pets.trim(),
          vehicle_details: vehicles.trim(),
          income_proof_url: incomeProofUrl
        });
      }
      toast.success('Application submitted successfully! Renter background check is pending review.');
      setTenantEmail('');
      setFullName('');
      setPhone('');
      setIncome('');
      setPets('');
      setVehicles('');
      setReferences('');
      setIncomeProofUrl('');
      setConsent(false);
      setErrors({});
      setTouched({});
      setReapply(false);
      setActiveInviteAppId(null);
      fetchMyApplications();
    } catch (err) {
      let msg = "Failed to submit application.";
      const detail = err.response?.data?.detail;
      if (detail) {
        if (Array.isArray(detail)) {
          msg = detail.map(d => `${d.loc?.[d.loc.length - 1] || 'field'}: ${d.msg}`).join(', ');
        } else if (typeof detail === 'string') {
          msg = detail;
        } else {
          msg = JSON.stringify(detail);
        }
      }
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-2 relative text-slate-900 dark:text-white text-left animate-fade-in">
      {isLandlord ? (
        <>
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
          
          {/* Header Section */}
          <div className="p-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-slate-800 dark:text-white font-medium text-sm flex items-center gap-2">
                <Users size={16} /> Tenant Screening Directory
              </div>
              <button 
                onClick={() => { setInviteError(''); setInviteSuccess(''); setInviteModalOpen(true); }}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all shadow-md shadow-blue-500/20 whitespace-nowrap cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" /> Invite Applicant
              </button>
            </div>
            
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search applications..."
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
          </div>

          {(() => {
            const filteredApps = applications.filter(a => {
              const matchesSearch = 
                a.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.tenant_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (a.unit?.unit_number && String(a.unit.unit_number).includes(searchQuery));
              const matchesProperty = selectedPropertyFilterId === 'all' || !a.unit?.property_id || String(a.unit?.property_id) === String(selectedPropertyFilterId);
              return matchesSearch && matchesProperty;
            });

            if (filteredApps.length === 0) {
              return <div className="py-12 text-center text-slate-400 text-sm">No applications found matching your search.</div>;
            }

            return (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 uppercase text-[10px] tracking-wider font-bold text-slate-500 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-4">Application ID</th>
                      <th className="px-4 py-4">Applicant Name</th>
                      <th className="px-4 py-4">Email Address</th>
                      <th className="px-4 py-4">Applied Unit</th>
                      <th className="px-4 py-4">FICO Score</th>
                      <th className="px-4 py-4 text-right">Status</th>
                      <th className="px-4 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-gray-300">
                    {filteredApps.map(a => (
                      <tr 
                        key={a.application_id} 
                        className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                      >
                        <td className="px-4 py-4 font-mono text-xs font-bold text-indigo-650 dark:text-[#5BA4F5]">#{a.application_id}</td>
                        <td className="px-4 py-4 font-semibold text-slate-900 dark:text-white">{a.full_name}</td>
                        <td className="px-4 py-4 text-slate-600 dark:text-gray-400">{a.tenant_email}</td>
                        <td className="px-4 py-4">
                          <span className="bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-500/20">
                            Unit {a.unit?.unit_number || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-mono font-bold text-slate-900 dark:text-white">
                          {a.screening_status === 'INVITED' ? (
                            <span className="text-slate-400 dark:text-slate-500 italic text-xs">Pending Invite</span>
                          ) : (
                            a.credit_score || 'N/A'
                          )}
                        </td>
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            a.screening_status === 'APPROVED'
                              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20'
                              : a.screening_status === 'REJECTED'
                                ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/20'
                                : a.screening_status === 'INVITED'
                                  ? 'text-indigo-650 dark:text-[#5BA4F5] bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-500/20'
                                  : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20'
                          }`}>
                            {a.screening_status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right whitespace-nowrap space-x-1">
                          <button
                            type="button"
                            disabled={a.screening_status === 'INVITED'}
                            onClick={() => setSelectedApp(a)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-blue-500 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title={a.screening_status === 'INVITED' ? "Waiting for tenant details" : "View Report"}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteApplication(a.application_id, e)}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition cursor-pointer"
                            title="Delete Application"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
        {selectedApp && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#1e2a3b] border border-slate-200 dark:border-white/10 w-full max-w-3xl rounded-2xl p-6 space-y-6 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto text-slate-900 dark:text-white text-left">
                <div className="flex justify-between items-center border-b dark:border-white/5 pb-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-500" /> Screening Report: {selectedApp.full_name}
                    </h2>
                    <p className="text-xs text-gray-450 dark:text-gray-400 mt-1">Applied for unit: {selectedApp.unit?.unit_number || 'N/A'}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedApp(null)} 
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>



                {/* Decision review buttons */}
                {selectedApp.screening_status === 'SUBMITTED' && (
                  <div className="p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01] flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-550 dark:text-gray-400">Decide on this application:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReviewApplication(selectedApp.application_id, 'REJECTED')}
                        className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-all"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleReviewApplication(selectedApp.application_id, 'APPROVED')}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                )}

                {/* Screening report cards */}
                {selectedApp.screening_status !== 'REJECTED' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-gray-200/80 dark:border-white/[0.04] bg-gray-50/50 dark:bg-white/[0.02] text-left">
                      <span className="text-[10px] font-bold text-gray-450 tracking-wider block uppercase">Credit Check</span>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className={`text-2xl font-black ${
                          selectedApp.credit_score > 700 ? 'text-emerald-500' : 'text-yellow-500'
                        }`}>{selectedApp.credit_score}</span>
                        <span className="text-xs text-gray-450">FICO</span>
                      </div>
                      <span className="text-[10px] mt-2 block font-bold text-emerald-500">EXCELLENT RANGE</span>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-200/80 dark:border-white/[0.04] bg-gray-50/50 dark:bg-white/[0.02] text-left">
                      <span className="text-[10px] font-bold text-gray-450 tracking-wider block uppercase">Eviction History</span>
                      {selectedApp.eviction_history && selectedApp.eviction_history.includes("EVICTION DETECTED") ? (
                        <>
                          <div className="mt-2 flex items-center gap-1.5 text-sm font-bold text-red-500">
                            <ShieldAlert className="w-4 h-4 text-red-500" /> Record Flagged
                          </div>
                          <span className="text-[10px] mt-2 block text-red-500/80 leading-relaxed font-semibold">
                            {selectedApp.eviction_history}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="mt-2 flex items-center gap-1.5 text-sm font-bold text-emerald-500">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Clear Record
                          </div>
                          <span className="text-[10px] mt-2 block text-gray-400">No eviction record matches found.</span>
                        </>
                      )}
                    </div>

                    <div className="p-4 rounded-xl border border-gray-200/80 dark:border-white/[0.04] bg-gray-50/50 dark:bg-white/[0.02] text-left">
                      <span className="text-[10px] font-bold text-gray-450 tracking-wider block uppercase">Criminal Check</span>
                      {selectedApp.criminal_history && selectedApp.criminal_history.includes("MATCH FOUND") ? (
                        <>
                          <div className="mt-2 flex items-center gap-1.5 text-sm font-bold text-red-500">
                            <ShieldAlert className="w-4 h-4 text-red-500" /> Record Flagged
                          </div>
                          <span className="text-[10px] mt-2 block text-red-500/80 leading-relaxed font-semibold">
                            {selectedApp.criminal_history}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="mt-2 flex items-center gap-1.5 text-sm font-bold text-emerald-500">
                            <CheckCircle2 className="w-4 h-4" /> Clean Record
                          </div>
                          <span className="text-[10px] mt-2 block text-gray-400">No criminal matches found.</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Application Details */}
                <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5 text-left">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-300 uppercase tracking-wider">Application Fields</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400 block text-xs">Email</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{selectedApp.tenant_email}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-xs">Phone</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{formatUsPhone(selectedApp.phone)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-xs">Employment Status</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{selectedApp.employment_status || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-xs">Monthly Income</span>
                      <span className="font-semibold text-gray-950 dark:text-white">${selectedApp.monthly_income?.toLocaleString()}/mo</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-gray-400 block text-xs">References</span>
                      <span className="font-semibold text-gray-900 dark:text-white block whitespace-pre-wrap">{selectedApp.references_data || 'None'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-xs">Pet Details</span>
                      <span className="font-semibold text-gray-900 dark:text-white block whitespace-pre-wrap">{selectedApp.pet_details || 'None'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-xs">Vehicle / Parking Details</span>
                      <span className="font-semibold text-gray-900 dark:text-white block whitespace-pre-wrap">{selectedApp.vehicle_details || 'None'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-xs">Income Proof Document</span>
                      {selectedApp.income_proof_url ? (
                        <a 
                          href={getBaseUrl(selectedApp.income_proof_url)} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs font-semibold text-blue-500 hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                        >
                          View / Download Uploaded Proof (PDF/Image)
                        </a>
                      ) : (
                        <span className="font-semibold text-gray-900 dark:text-white block text-xs">Not provided</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                  {selectedApp.screening_status === 'APPROVED' && (
                    <button
                      onClick={() => {
                        localStorage.setItem('prefill_lease_email', selectedApp.tenant_email);
                        localStorage.setItem('prefill_lease_unit_id', String(selectedApp.unit_id));
                        localStorage.setItem('prefill_lease_pets', selectedApp.pet_details || '');
                        localStorage.setItem('prefill_lease_vehicles', selectedApp.vehicle_details || '');
                        localStorage.setItem('prefill_lease_rent', String(selectedApp.unit?.rent_amount || ''));
                        localStorage.setItem('open_create_lease_modal', 'true');
                        setActivePage('leases_hub');
                        setSelectedApp(null);
                      }}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all cursor-pointer"
                    >
                      Draft Lease Agreement
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedApp(null)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-sm transition-all cursor-pointer"
                  >
                    Close Report
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : myApplications.length > 0 && !reapply ? (
        <div className="max-w-2xl mx-auto p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-xl shadow-sm space-y-6 text-left">
          <div className="flex items-center justify-between pb-4 border-b border-gray-150 dark:border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-550/10 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Screening Application Status</h2>
                <p className="text-xs text-gray-450 dark:text-gray-400 mt-0.5">Track your rental background check and FICO details</p>
              </div>
            </div>
          </div>

          {(() => {
            const latestApp = myApplications[myApplications.length - 1];
            const isApproved = latestApp.screening_status === 'APPROVED';
            const isRejected = latestApp.screening_status === 'REJECTED';
            const isSubmitted = latestApp.screening_status === 'SUBMITTED' || latestApp.screening_status === 'PENDING';
            const isInvited = latestApp.screening_status === 'INVITED';

            return (
              <div className="space-y-6">
                {isInvited && (
                  <div className="p-5 rounded-2xl bg-indigo-500/5 dark:bg-indigo-550/10 border border-indigo-500/20 space-y-3">
                    <div className="flex items-center gap-2.5 text-indigo-700 dark:text-indigo-400 font-bold text-base">
                      <Sparkles className="w-6 h-6 text-indigo-500" />
                      <span>Pending Background Check Invitation</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed">
                      You have been invited by the landlord to run a tenant screening background check for <strong>Unit {latestApp.unit?.unit_number}</strong> at {latestApp.unit?.propertyName || latestApp.unit?.property?.name || 'Assigned Property'}.
                      Please complete the form below to authorize the credit and criminal history check.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setActiveInviteAppId(latestApp.application_id);
                          setSelectedUnitId(latestApp.unit_id.toString());
                          setTenantEmail(latestApp.tenant_email);
                          setFullName(latestApp.full_name);
                          setShowApplyForm(true);
                          setReapply(true); // forces apply form view
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-md shadow-indigo-500/20"
                      >
                        Complete Application & Background Check
                      </button>
                    </div>
                  </div>
                )}

                {isApproved && (
                  <div className="p-5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-550/10 border border-emerald-500/20 space-y-3">
                    <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-450 font-bold text-base">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      <span>Application Approved!</span>
                    </div>
                    <p className="text-sm text-gray-650 dark:text-gray-300 leading-relaxed">
                      Congratulations! Your background check and tenant screening application have been approved. 
                      The landlord has been notified, and your official lease agreement contract is being generated. 
                      You will receive an email notification to view and digitally sign the lease shortly.
                    </p>
                  </div>
                )}

                {isSubmitted && (
                  <div className="p-5 rounded-2xl bg-blue-500/5 dark:bg-blue-550/10 border border-blue-500/20 space-y-3">
                    <div className="flex items-center gap-2.5 text-blue-700 dark:text-blue-450 font-bold text-base">
                      <Info className="w-6 h-6 text-blue-500 animate-pulse" />
                      <span>Pending Landlord Review</span>
                    </div>
                    <p className="text-sm text-gray-650 dark:text-gray-300 leading-relaxed">
                      Your screening reports have been generated and are now awaiting final review by the landlord. 
                      No further action is required from your end. We will notify you via email as soon as the review is complete.
                    </p>
                  </div>
                )}

                {isRejected && (
                  <div className="p-5 rounded-2xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 space-y-3">
                    <div className="flex items-center gap-2.5 text-red-750 dark:text-red-450 font-bold text-base">
                      <ShieldAlert className="w-6 h-6 text-red-550" />
                      <span>Application Not Approved</span>
                    </div>
                    <p className="text-sm text-gray-650 dark:text-gray-355 leading-relaxed">
                      Thank you for your interest. Unfortunately, your tenant screening application was not approved for this unit at this time. 
                      Please reach out to the landlord directly if you have any questions.
                    </p>
                  </div>
                )}

                {/* Report Details Cards (Standard US Screening Info) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-gray-150 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01]">
                    <span className="text-[10px] font-bold text-gray-450 dark:text-gray-400 tracking-wider block uppercase">Credit Report</span>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className={`text-2xl font-black ${
                        latestApp.credit_score > 700 ? 'text-emerald-500' : 'text-yellow-500'
                      }`}>{latestApp.credit_score}</span>
                      <span className="text-xs text-gray-450">FICO Score</span>
                    </div>
                    <span className={`text-[10px] mt-1.5 block font-bold uppercase ${
                      latestApp.credit_score > 700 ? 'text-emerald-500' : 'text-yellow-500'
                    }`}>
                      {latestApp.credit_score > 700 ? 'Excellent' : 'Good Standing'}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-150 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01]">
                    <span className="text-[10px] font-bold text-gray-450 dark:text-gray-400 tracking-wider block uppercase">Eviction History</span>
                    <div className="mt-2 flex items-center gap-1.5 text-sm font-bold text-emerald-500">
                      <CheckCircle2 className="w-4 h-4" /> Clear Record
                    </div>
                    <span className="text-[10px] mt-2.5 block text-gray-400">No evictions found.</span>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-150 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01]">
                    <span className="text-[10px] font-bold text-gray-450 dark:text-gray-400 tracking-wider block uppercase">Criminal Search</span>
                    <div className="mt-2 flex items-center gap-1.5 text-sm font-bold text-emerald-500">
                      <CheckCircle2 className="w-4 h-4" /> Clean Record
                    </div>
                    <span className="text-[10px] mt-2.5 block text-gray-400">No records found.</span>
                  </div>
                </div>

                {/* Submitted fields preview */}
                <div className="p-4 rounded-2xl border border-gray-100 dark:border-white/5 space-y-3.5 text-sm">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-455 uppercase tracking-wider">Submitted Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 block mb-0.5">Applied For Unit</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        Unit {latestApp.unit?.unit_number || 'N/A'} at {latestApp.unit?.propertyName || latestApp.unit?.property?.name || 'Assigned Property'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Applicant Email</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{latestApp.tenant_email}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Contact Phone</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {latestApp.phone ? `(${latestApp.phone.slice(0, 3)}) ${latestApp.phone.slice(3, 6)}-${latestApp.phone.slice(6)}` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Reported Monthly Income</span>
                      <span className="font-semibold text-gray-900 dark:text-white">${latestApp.monthly_income?.toLocaleString()}/mo</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Pet Details</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{latestApp.pet_details || 'None'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Vehicle / Parking Details</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{latestApp.vehicle_details || 'None'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Income Proof Document</span>
                      {latestApp.income_proof_url ? (
                        <a 
                          href={getBaseUrl(latestApp.income_proof_url)} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs font-semibold text-blue-500 hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                        >
                          View Uploaded Proof
                        </a>
                      ) : (
                        <span className="font-semibold text-gray-900 dark:text-white text-xs">Not provided</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                {isRejected && (
                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setReapply(true)}
                      className="flex-1 py-2.5 border border-gray-250 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl text-xs font-bold transition-all text-center text-gray-800 dark:text-gray-200"
                    >
                      Submit Another Application
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      ) : (
        /* Renter Form Submission Simulation */
        <div className="max-w-2xl mx-auto p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-xl shadow-sm space-y-6">
          <div className="flex items-center pb-4 border-b border-gray-150 dark:border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-550/10 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Submit Rental Application</h2>
                <p className="text-xs text-gray-450 dark:text-gray-400 mt-0.5">NestBloq Background Check & Credit Screening</p>
              </div>
            </div>
          </div>



          {isAllOccupied && (
            <div className="p-4 bg-blue-500/5 border border-blue-500/10 text-blue-700 dark:text-blue-450 rounded-xl text-xs font-semibold leading-relaxed flex gap-2">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <span>Note: All rental units are currently occupied. New applications will be held as pending waitlist requests until a unit becomes vacant.</span>
            </div>
          )}

          <form onSubmit={handleApply} className="space-y-6 text-left">
            {/* Section 1: Unit details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-widest">1. Property & Unit Selection</h3>
              <div className="p-4 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01] space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    {activeInviteAppId ? 'INVITED UNIT (LOCKED)' : 'SELECT AVAILABLE UNIT'}
                  </label>
                  {activeInviteAppId ? (
                    (() => {
                      const inviteApp = myApplications.find(a => a.application_id === activeInviteAppId);
                      return (
                        <div className="w-full text-sm px-4 py-3 border border-indigo-200 dark:border-indigo-500/30 rounded-xl bg-indigo-500/5 text-gray-905 dark:text-white font-medium flex items-center justify-between">
                          <div>
                            <span className="block text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-wider">Invited Unit</span>
                            <span className="text-sm font-semibold">
                              Unit {inviteApp?.unit?.unit_number || 'N/A'} at {inviteApp?.unit?.propertyName || inviteApp?.unit?.property?.name || 'Assigned Property'}
                            </span>
                          </div>
                          <span className="bg-indigo-650/10 text-indigo-600 dark:bg-indigo-550/20 dark:text-indigo-400 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-indigo-500/20">
                            Locked
                          </span>
                        </div>
                      );
                    })()
                  ) : units.length === 0 ? (
                    <div className="text-sm p-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-500/20 text-center font-medium">
                      No units are currently available for application.
                    </div>
                  ) : (
                    <>
                      <select 
                        required
                        value={selectedUnitId} 
                        onChange={e => setSelectedUnitId(e.target.value)} 
                        className="w-full text-sm px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-slate-950 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-150 focus:border-indigo-500 transition-all duration-200"
                      >
                        {units.map(u => (
                          <option key={u.unit_id} value={u.unit_id}>
                            Unit {u.unit_number} at {u.propertyName} (${u.rent_amount}/mo) - {u.status}
                          </option>
                        ))}
                      </select>

                      {selectedUnit && (
                        <div className={`mt-2.5 p-3 rounded-xl border text-xs font-semibold ${
                          selectedUnit.status === 'VACANT'
                            ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-650 dark:text-emerald-400'
                            : 'bg-amber-500/5 border-amber-500/15 text-amber-650 dark:text-amber-450'
                        }`}>
                          {selectedUnit.status === 'VACANT' ? (
                            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> This unit is vacant and available for immediate lease.</span>
                          ) : (
                            <span className="flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" /> This unit is currently occupied. Submitting this application will place you on the pending waitlist.</span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Contact Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-widest">2. Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-450" />
                    </div>
                    <input 
                      required 
                      disabled={!!activeInviteAppId}
                      type="text" 
                      value={fullName} 
                      onChange={handleNameChange}
                      onBlur={e => handleBlur('fullName', e.target.value)}
                      className={`pl-10 w-full text-sm px-4 py-2.5 border rounded-xl bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all duration-200 ${
                        !!activeInviteAppId 
                          ? 'bg-gray-100 dark:bg-slate-900 text-gray-450 dark:text-gray-500 cursor-not-allowed border-gray-200 dark:border-white/5' 
                          : errors.fullName 
                            ? 'border-red-500 focus:ring-red-100 dark:focus:ring-red-950' 
                            : touched.fullName
                              ? 'border-emerald-500 focus:ring-emerald-50/50 dark:focus:ring-emerald-950/20'
                              : 'border-gray-250 dark:border-white/10 focus:ring-indigo-150 focus:border-indigo-500'
                      }`} 
                      placeholder="e.g., Jane Smith" 
                    />
                  </div>
                  {errors.fullName && (
                    <p className="mt-1.5 text-xs text-red-550 dark:text-red-400 flex items-center gap-1 font-medium">
                      <Info size={12} /> {errors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-450" />
                    </div>
                    <input 
                      required 
                      disabled={!!activeInviteAppId}
                      type="email" 
                      value={tenantEmail} 
                      onChange={handleEmailChange}
                      onBlur={e => handleBlur('tenantEmail', e.target.value)}
                      className={`pl-10 w-full text-sm px-4 py-2.5 border rounded-xl bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all duration-200 ${
                        !!activeInviteAppId
                          ? 'bg-gray-100 dark:bg-slate-900 text-gray-450 dark:text-gray-500 cursor-not-allowed border-gray-200 dark:border-white/5'
                          : errors.tenantEmail 
                            ? 'border-red-500 focus:ring-red-100 dark:focus:ring-red-950' 
                            : touched.tenantEmail
                              ? 'border-emerald-500 focus:ring-emerald-50/50 dark:focus:ring-emerald-950/20'
                              : 'border-gray-250 dark:border-white/10 focus:ring-indigo-150 focus:border-indigo-500'
                      }`} 
                      placeholder="jane.smith@example.com" 
                    />
                  </div>
                  {errors.tenantEmail && (
                    <p className="mt-1.5 text-xs text-red-550 dark:text-red-400 flex items-center gap-1 font-medium">
                      <Info size={12} /> {errors.tenantEmail}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Financial & Employment */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-widest">3. Employment & Financials</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-gray-450" />
                    </div>
                    <input 
                      required 
                      type="text" 
                      value={phone} 
                      onChange={handlePhoneChange}
                      onBlur={e => handleBlur('phone', e.target.value)}
                      className={`pl-10 w-full text-sm px-4 py-2.5 border rounded-xl bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all duration-200 ${
                        errors.phone 
                          ? 'border-red-500 focus:ring-red-100 dark:focus:ring-red-950' 
                          : touched.phone
                            ? 'border-emerald-500 focus:ring-emerald-50/50 dark:focus:ring-emerald-950/20'
                            : 'border-gray-250 dark:border-white/10 focus:ring-indigo-150 focus:border-indigo-500'
                      }`} 
                      placeholder="(555) 555-5555" 
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1.5 text-xs text-red-550 dark:text-red-400 flex items-center gap-1 font-medium">
                      <Info size={12} /> {errors.phone}
                    </p>
                  )}
                </div>

                <div className="md:col-span-1">
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Employment Status</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Briefcase className="h-4 w-4 text-gray-450" />
                    </div>
                    <select 
                      value={empStatus} 
                      onChange={e => setEmpStatus(e.target.value)} 
                      className="pl-10 w-full text-sm px-4 py-2.5 border border-gray-250 dark:border-white/10 rounded-xl bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-indigo-500 transition-all duration-200"
                    >
                      <option value="Employed">Employed</option>
                      <option value="Self-Employed">Self-Employed</option>
                      <option value="Student">Student</option>
                      <option value="Unemployed">Unemployed</option>
                    </select>
                  </div>
                </div>

                <div className="md:col-span-1">
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Estimated Monthly Income ($)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <DollarSign className="h-4 w-4 text-gray-450" />
                    </div>
                    <input 
                      required 
                      type="text"
                      inputMode="numeric"
                      value={income} 
                      onChange={handleIncomeChange}
                      onBlur={e => handleBlur('income', e.target.value)}
                      className={`pl-10 w-full text-sm px-4 py-2.5 border rounded-xl bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all duration-200 ${
                        errors.income 
                          ? 'border-red-500 focus:ring-red-100 dark:focus:ring-red-950' 
                          : touched.income
                            ? 'border-emerald-500 focus:ring-emerald-50/50 dark:focus:ring-emerald-950/20'
                            : 'border-gray-250 dark:border-white/10 focus:ring-indigo-150 focus:border-indigo-500'
                      }`} 
                      placeholder="5000" 
                    />
                  </div>
                  {errors.income && (
                    <p className="mt-1.5 text-xs text-red-550 dark:text-red-400 flex items-center gap-1 font-medium">
                      <Info size={12} /> {errors.income}
                    </p>
                  )}
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">PROOF OF INCOME (Paystubs, Tax Returns, W-2, etc. PDF/PNG/JPG)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="file" 
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleIncomeProofUpload}
                      className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-[#1E3248] dark:file:text-[#5BA4F5] dark:hover:file:bg-white/10 file:transition-all file:cursor-pointer"
                    />
                    {uploadingProof && <span className="text-xs text-blue-500 animate-pulse font-medium">Uploading document...</span>}
                    {incomeProofUrl && <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">✓ Document uploaded successfully!</span>}
                  </div>
                  {errors.incomeProof && (
                    <p className="mt-1.5 text-xs text-red-550 dark:text-red-400 flex items-center gap-1 font-medium">
                      <Info size={12} /> {errors.incomeProof}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 4: History & Background */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-widest">4. Additional Background</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">PET DETAILS (IF ANY)</label>
                  <input 
                    type="text" 
                    value={pets} 
                    onChange={handlePetsChange}
                    onBlur={e => handleBlur('pets', e.target.value)}
                    className={`w-full text-sm px-4 py-2.5 border rounded-xl bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all duration-200 ${
                      errors.pets 
                        ? 'border-red-500 focus:ring-red-100 dark:focus:ring-red-950' 
                        : touched.pets && pets
                          ? 'border-emerald-500 focus:ring-emerald-50/50 dark:focus:ring-emerald-950/20'
                          : 'border-gray-250 dark:border-white/10 focus:ring-indigo-150 focus:border-indigo-500'
                    }`} 
                    placeholder="e.g., 1 cat (indoor, neutered) or None" 
                  />
                  {errors.pets && (
                    <p className="mt-1.5 text-xs text-red-550 dark:text-red-400 flex items-center gap-1 font-medium">
                      <Info size={12} /> {errors.pets}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">VEHICLE / PARKING DETAILS (IF ANY)</label>
                  <input 
                    type="text" 
                    value={vehicles} 
                    onChange={handleVehiclesChange}
                    onBlur={e => handleBlur('vehicles', e.target.value)}
                    className={`w-full text-sm px-4 py-2.5 border rounded-xl bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all duration-200 ${
                      errors.vehicles 
                        ? 'border-red-500 focus:ring-red-100 dark:focus:ring-red-950' 
                        : touched.vehicles && vehicles
                          ? 'border-emerald-500 focus:ring-emerald-50/50 dark:focus:ring-emerald-950/20'
                          : 'border-gray-250 dark:border-white/10 focus:ring-indigo-150 focus:border-indigo-500'
                    }`} 
                    placeholder="e.g., 1 Sedan (Toyota Camry, Black) or None" 
                  />
                  {errors.vehicles && (
                    <p className="mt-1.5 text-xs text-red-550 dark:text-red-400 flex items-center gap-1 font-medium">
                      <Info size={12} /> {errors.vehicles}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">REFERENCES / PREVIOUS LANDLORD</label>
                <textarea 
                  required
                  value={references} 
                  onChange={handleReferencesChange}
                  onBlur={e => handleBlur('references', e.target.value)}
                  className={`w-full text-sm px-4 py-2.5 border rounded-xl bg-white dark:bg-slate-950 text-gray-900 dark:text-white h-20 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.references 
                      ? 'border-red-500 focus:ring-red-100 dark:focus:ring-red-950' 
                      : touched.references
                        ? 'border-emerald-500 focus:ring-emerald-50/50 dark:focus:ring-emerald-950/20'
                        : 'border-gray-250 dark:border-white/10 focus:ring-indigo-150 focus:border-indigo-500'
                  }`} 
                  placeholder="Please enter Previous Landlord Name, Phone, and Email details..."
                ></textarea>
                {errors.references && (
                  <p className="mt-1.5 text-xs text-red-550 dark:text-red-400 flex items-center gap-1 font-medium">
                    <Info size={12} /> {errors.references}
                  </p>
                )}
              </div>
            </div>

            {/* Background Simulation Dropdown for Demo */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-amber-650 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Demo Background Simulation Mode
              </h3>
              <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-xs space-y-2">
                <p className="text-slate-650 dark:text-slate-300 font-medium">Select a background check result to simulate for this demo:</p>
                <select
                  value={simulationMode}
                  onChange={e => setSimulationMode(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-amber-500/30 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 cursor-pointer font-semibold"
                >
                  <option value="CLEAN">Clean Record (No records found, Good standing)</option>
                  <option value="CRIMINAL">Simulate Criminal Record Match (Flag Theft / Burglary)</option>
                  <option value="EVICTION">Simulate Eviction Registry Match (Flag Eviction Judgment)</option>
                </select>
              </div>
            </div>

            {/* Section 5: Authorization */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-widest">5. Disclosures & Consent</h3>
              <div className={`p-4 rounded-2xl border transition-all duration-200 ${
                errors.consent ? 'border-red-500/40 bg-red-500/5' : 'border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01]'
              }`}>
                <label className="flex items-start gap-3 cursor-pointer text-xs leading-relaxed text-gray-650 dark:text-gray-300">
                  <input 
                    type="checkbox" 
                    checked={consent}
                    onChange={e => {
                      setConsent(e.target.checked);
                      if (e.target.checked) {
                        setErrors(prev => {
                          const copy = { ...prev };
                          delete copy.consent;
                          return copy;
                        });
                      }
                    }}
                    className="mt-0.5 rounded border-gray-300 dark:border-white/10 text-indigo-600 focus:ring-indigo-500" 
                  />
                  <span>
                    I hereby authorize NestBloq to pull my credit, criminal background history, and eviction records. 
                    I certify that all details submitted above are true and complete. I understand that false or misleading info is grounds for rejection of this application.
                  </span>
                </label>
                {errors.consent && (
                  <p className="mt-2 text-xs text-red-550 dark:text-red-400 flex items-center gap-1 font-medium">
                    <Info size={12} /> {errors.consent}
                  </p>
                )}
              </div>
            </div>

            {/* Submission button */}
            <button 
              type="submit" 
              disabled={submitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Pulling Screening Report...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Submit Application & Pull Report</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
      {/* Landlord Invite to Screen Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl animate-scale-up text-slate-900 dark:text-white text-left">
            <div className="flex justify-between items-center border-b dark:border-white/5 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" /> Send Screening Invitation
              </h3>
              <button 
                onClick={() => setInviteModalOpen(false)} 
                className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white text-lg cursor-pointer"
              >
                ×
              </button>
            </div>
            
            {inviteError && (
              <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 dark:text-red-400 p-3 rounded-xl font-medium">
                {inviteError}
              </p>
            )}
            {inviteSuccess && (
              <p className="text-xs text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400 p-3 rounded-xl font-medium">
                {inviteSuccess}
              </p>
            )}
            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Applicant Full Name</label>
                <input 
                  required 
                  type="text" 
                  value={inviteName} 
                  onChange={handleInviteNameChange} 
                  className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${inviteErrors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-blue-500'} rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none`} 
                  placeholder="e.g. John Doe" 
                />
                {inviteErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{inviteErrors.name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Applicant Email Address</label>
                <input 
                  required 
                  type="email" 
                  value={inviteEmail} 
                  onChange={handleInviteEmailChange} 
                  className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${inviteErrors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-blue-500'} rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none`} 
                  placeholder="john.doe@example.com" 
                />
                {inviteErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{inviteErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Target Rental Unit</label>
                <select 
                  required 
                  value={inviteUnitId} 
                  onChange={e => setInviteUnitId(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  {filteredUnits.length === 0 ? (
                    <option value="">No vacant units available</option>
                  ) : (
                    filteredUnits.map(u => (
                      <option key={u.unit_id} value={u.unit_id}>
                        Unit {u.unit_number} at {u.propertyName} (${u.rent_amount}/mo)
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setInviteModalOpen(false)} 
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 transition-all shadow-md shadow-blue-500/25 cursor-pointer"
                >
                  Send Invite
                </button>
              </div>
            </form>
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
