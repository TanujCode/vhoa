import React, { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle2, ShieldAlert, Sparkles, User, Mail, DollarSign, Briefcase, Phone, ShieldCheck, Info, Trash2, Search, X, Eye } from 'lucide-react';
import API from '../../services/api';

export default function ScreeningHub({ user }) {
  const isLandlord = user?.role === 'landlord' || user?.role_name === 'landlord' || user?.role_id === 1; // Super admin also landlord
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  
  // Renter Application Form States
  const [units, setUnits] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [empStatus, setEmpStatus] = useState('Employed');
  const [income, setIncome] = useState('');
  const [pets, setPets] = useState('');
  const [references, setReferences] = useState('');

  const [showApplyForm, setShowApplyForm] = useState(!isLandlord);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Additional US Specific & Validation States
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [myApplications, setMyApplications] = useState([]);
  const [reapply, setReapply] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleBlur = (field, value) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    let error = '';
    if (field === 'fullName') error = validateName(value);
    else if (field === 'tenantEmail') error = validateEmail(value);
    else if (field === 'phone') error = validatePhone(value);
    else if (field === 'income') error = validateIncome(value);
    else if (field === 'references') error = validateReferences(value);
    else if (field === 'pets') error = validatePets(value);
    
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const selectedUnit = units.find(u => String(u.unit_id) === String(selectedUnitId));
  const isAllOccupied = units.length > 0 && units.every(u => u.status === 'OCCUPIED');

  useEffect(() => {
    if (isLandlord) {
      fetchApplications();
    } else {
      fetchTenantScreeningData();
    }
  }, [isLandlord]);

  async function fetchApplications() {
    try {
      setLoading(true);
      const res = await API.get('/rental/applications');
      setApplications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTenantScreeningData() {
    try {
      setLoading(true);
      // Fetch available units
      const propRes = await API.get('/rental/properties');
      const props = propRes.data;
      const allUnits = [];
      for (const p of props) {
        const unitRes = await API.get(`/rental/properties/${p.property_id}/units`);
        allUnits.push(...unitRes.data.map(u => ({ ...u, propertyName: p.name })));
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
    if (!window.confirm("Are you sure you want to delete this screening application?")) return;
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

  async function handleApply(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Mark all as touched
    const newTouched = {
      fullName: true,
      tenantEmail: true,
      phone: true,
      income: true,
      references: true,
      pets: true
    };
    setTouched(newTouched);

    const nameErr = validateName(fullName);
    const emailErr = validateEmail(tenantEmail);
    const phoneErr = validatePhone(phone);
    const incomeErr = validateIncome(income);
    const refErr = validateReferences(references);
    const petsErr = validatePets(pets);

    const validationErrors = {
      fullName: nameErr,
      tenantEmail: emailErr,
      phone: phoneErr,
      income: incomeErr,
      references: refErr,
      pets: petsErr
    };

    if (!consent) {
      validationErrors.consent = 'You must authorize the credit and background screening report.';
    }

    setErrors(validationErrors);

    const hasErrors = Object.values(validationErrors).some(err => err !== '');
    if (hasErrors) {
      setErrorMsg('Please fix the validation errors in the form.');
      return;
    }

    setSubmitting(true);
    try {
      await API.post('/rental/applications', {
        unit_id: parseInt(selectedUnitId),
        tenant_email: tenantEmail,
        full_name: fullName.trim(),
        phone: phone.replace(/[^\d]/g, ''), // clean digits for API
        employment_status: empStatus,
        monthly_income: parseFloat(income),
        references_data: references.trim(),
        pet_details: pets.trim()
      });
      setSuccessMsg('Application submitted successfully! Renter background check is pending review.');
      setTenantEmail('');
      setFullName('');
      setPhone('');
      setIncome('');
      setPets('');
      setReferences('');
      setConsent(false);
      setErrors({});
      setTouched({});
      setReapply(false);
      fetchMyApplications();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to submit application.");
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
            <div className="text-slate-800 dark:text-white font-medium text-sm flex items-center gap-2">
              <Users size={16} /> Tenant Screening Directory
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
            const filteredApps = applications.filter(a => 
              a.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              a.tenant_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (a.unit?.unit_number && String(a.unit.unit_number).includes(searchQuery))
            );

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
                          {a.credit_score || 'N/A'}
                        </td>
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            a.screening_status === 'APPROVED'
                              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20'
                              : a.screening_status === 'REJECTED'
                                ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/20'
                                : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20'
                          }`}>
                            {a.screening_status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right whitespace-nowrap space-x-1">
                          <button
                            type="button"
                            onClick={() => setSelectedApp(a)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-blue-500 transition cursor-pointer"
                            title="View Report"
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

                {/* Status Banners */}
                {selectedApp.screening_status === 'APPROVED' && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-450 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 size={16} /> This application has been APPROVED. You can now create a lease agreement for this tenant.
                  </div>
                )}
                {selectedApp.screening_status === 'REJECTED' && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <ShieldAlert size={16} /> This application has been REJECTED.
                  </div>
                )}

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
                      <div className="mt-2 flex items-center gap-1.5 text-sm font-bold text-emerald-500">
                        <CheckCircle2 className="w-4 h-4" /> Clear Record
                      </div>
                      <span className="text-[10px] mt-2 block text-gray-400">No eviction records.</span>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-200/80 dark:border-white/[0.04] bg-gray-50/50 dark:bg-white/[0.02] text-left">
                      <span className="text-[10px] font-bold text-gray-450 tracking-wider block uppercase">Criminal Check</span>
                      <div className="mt-2 flex items-center gap-1.5 text-sm font-bold text-emerald-500">
                        <CheckCircle2 className="w-4 h-4" /> Clean Record
                      </div>
                      <span className="text-[10px] mt-2 block text-gray-400">No matches found.</span>
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
                      <span className="font-semibold text-gray-900 dark:text-white">{selectedApp.phone || 'N/A'}</span>
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
                    <div className="md:col-span-2">
                      <span className="text-gray-400 block text-xs">Pet Details</span>
                      <span className="font-semibold text-gray-900 dark:text-white block whitespace-pre-wrap">{selectedApp.pet_details || 'None'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-white/5">
                  <button
                    onClick={() => setSelectedApp(null)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-sm transition-all"
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

            return (
              <div className="space-y-6">
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
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setReapply(true)}
                    className="flex-1 py-2.5 border border-gray-250 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl text-xs font-bold transition-all text-center text-gray-800 dark:text-gray-200"
                  >
                    Submit Another Application
                  </button>
                </div>
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

          {successMsg && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-semibold flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          
          {errorMsg && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 rounded-xl text-sm font-semibold flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-red-550 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

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
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">SELECT AVAILABLE UNIT</label>
                  {units.length === 0 ? (
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
                            <span className="flex items-center gap-1.5">✓ This unit is vacant and available for immediate lease.</span>
                          ) : (
                            <span className="flex items-center gap-1.5">⚠️ This unit is currently occupied. Submitting this application will place you on the pending waitlist.</span>
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
                      type="text" 
                      value={fullName} 
                      onChange={handleNameChange}
                      onBlur={e => handleBlur('fullName', e.target.value)}
                      className={`pl-10 w-full text-sm px-4 py-2.5 border rounded-xl bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all duration-200 ${
                        errors.fullName 
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
                      type="email" 
                      value={tenantEmail} 
                      onChange={handleEmailChange}
                      onBlur={e => handleBlur('tenantEmail', e.target.value)}
                      className={`pl-10 w-full text-sm px-4 py-2.5 border rounded-xl bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all duration-200 ${
                        errors.tenantEmail 
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
              </div>
            </div>

            {/* Section 4: History & Background */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-widest">4. Additional Background</h3>
              
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
    </div>
  );
}
