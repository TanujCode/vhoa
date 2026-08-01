import React, { useState, useEffect } from 'react';
import { Plus, X, Lock, Truck, Search, Copy, Check, Trash2, Calendar } from 'lucide-react';
import API from "../../services/api";
import ConfirmModal from "../../components/ConfirmModal";
import { toast } from 'react-hot-toast';
import { formatUsPhone, formatPhoneAsYouType } from '../../utils/phoneFormatter';
import { checkEmail } from '../../utils/emailValidation';
import {
  getCondoVendors,
  onboardCondoVendor,
  deleteCondoVendor,
  verifyCondoVendorAccessCode,
  generateCondoVendorAccessCode,
  generateCondoVendorContractCode
} from '../../services/condoVendorService';

export default function CondoVendors({ communityId, userRole, user }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [phoneOnly, setPhoneOnly] = useState('');

  // Form State - Matches HOA Vendors schema
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    phone: '',
    category: 'PLUMBING', 
    license_number: '',
    expiry: '',
    insurance: '',
    email: ''
  });

  const [errors, setErrors] = useState({});

  const handleOnboardClick = () => {
    if (userRole === 'super_admin') {
      if (Number(user?.community_id) !== Number(communityId)) {
        alert("Platform administrators cannot onboard vendors unless they are registered as community members of this community.");
        return;
      }
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      company_name: '',
      contact_person: '',
      phone: '',
      category: 'PLUMBING',
      license_number: '',
      expiry: '',
      insurance: '',
      email: ''
    });
    setPhoneOnly('');
    setErrors({});
  };

  const isAdmin = userRole === 'super_admin' || userRole === 'property_manager';
  const isBoardMember = userRole === 'board_member';

  useEffect(() => {
    if (communityId) {
      setIsUnlocked(sessionStorage.getItem(`condo_vendors_unlocked_${communityId}`) === 'true');
    }
  }, [communityId]);

  useEffect(() => {
    if ((isAdmin || isBoardMember || isUnlocked) && communityId) {
      fetchVendors();
    }
  }, [communityId, userRole, isAdmin, isBoardMember, isUnlocked]);

  const fetchVendors = async () => {
    if (!communityId) return;
    try {
      setLoading(true);
      const data = await getCondoVendors(communityId);
      setVendors(data || []);
    } catch (err) {
      console.error("Condo Vendor fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!accessCode) return alert("Please enter a code");

    try {
      setLoading(true);
      const data = await verifyCondoVendorAccessCode(accessCode.trim(), Number(communityId));
      sessionStorage.setItem(`condo_vendors_unlocked_${communityId}`, 'true');
      setIsUnlocked(true);
      setVendors(data || []);
      toast.success("Vendors directory unlocked!");
    } catch (err) {
      console.error("Verify access code error:", err.response?.data);
      alert(err.response?.data?.detail || "Invalid Access Code!");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vendorId) => {
    setConfirmConfig({
      isOpen: true,
      title: "Delete Vendor",
      message: "Are you sure you want to delete this vendor? This action cannot be undone.",
      onConfirm: async () => {
        try {
          setLoading(true);
          await deleteCondoVendor(vendorId);
          toast.success("Vendor deleted successfully!");
          fetchVendors();
        } catch (err) {
          console.error("Delete error:", err);
          toast.error(err.response?.data?.detail || "Failed to delete vendor");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const validateField = (name, value) => {
    let errorMsg = '';
    if (name === 'company_name') {
      const trimmed = value.trim();
      if (!trimmed) {
        errorMsg = 'Company name is required';
      } else if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
        errorMsg = 'Company name must contain only letters and spaces';
      }
    } else if (name === 'contact_person') {
      if (!value.trim()) {
        errorMsg = 'Contact person is required';
      } else if (/[^a-zA-Z\s.\-']/.test(value)) {
        errorMsg = 'Contact person can only contain letters, spaces, dots, hyphens, and apostrophes';
      }
    } else if (name === 'email') {
      if (!value.trim()) {
        errorMsg = 'Email is required';
      } else {
        const res = checkEmail(value);
        if (!res.valid) {
          errorMsg = res.message;
        }
      }
    } else if (name === 'phoneOnly') {
      const digits = value.replace(/\D/g, '');
      if (!value) {
        errorMsg = 'Phone number is required';
      } else if (digits.length !== 10) {
        errorMsg = 'Phone number must be exactly 10 digits';
      }
    } else if (name === 'license_number') {
      const trimmed = value.trim();
      const hasMinDigits = (trimmed.replace(/\D/g, '').length >= 3);
      const hasRepeatingChars = /(.)\1{3,}/.test(trimmed);
      const hasConsecutiveLetters = /[a-zA-Z]{5,}/.test(trimmed);
      if (!trimmed) {
        errorMsg = 'License number is required';
      } else if (!/^[a-zA-Z0-9-]{6,20}$/.test(trimmed) || !hasMinDigits || hasRepeatingChars || hasConsecutiveLetters) {
        errorMsg = 'License number must be 6-20 alphanumeric characters/hyphens, containing at least 3 digits, without long repeating characters or 5+ consecutive letters';
      }
    } else if (name === 'insurance') {
      const trimmed = value.trim();
      const hasMinDigits = (trimmed.replace(/\D/g, '').length >= 3);
      const hasRepeatingChars = /(.)\1{3,}/.test(trimmed);
      const hasConsecutiveLetters = /[a-zA-Z]{5,}/.test(trimmed);
      if (!trimmed) {
        errorMsg = 'Insurance policy number is required';
      } else if (!/^[a-zA-Z0-9-]{5,25}$/.test(trimmed) || !hasMinDigits || hasRepeatingChars || hasConsecutiveLetters) {
        errorMsg = 'Insurance policy number must be 5-25 alphanumeric characters/hyphens, containing at least 3 digits, without long repeating characters or 5+ consecutive letters';
      }
    } else if (name === 'expiry') {
      if (value) {
        const selDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selDate <= today) {
          errorMsg = 'License expiry date must be in the future';
        }
      }
    }
    setErrors(prev => ({ ...prev, [name]: errorMsg }));
    return errorMsg;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phoneOnly') {
      const formatted = formatPhoneAsYouType(value);
      setPhoneOnly(formatted);
      validateField('phoneOnly', formatted);
      setFormData(prev => ({
        ...prev,
        phone: `+1${formatted.replace(/\D/g, '')}`
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      validateField(name, value);
    }
  };

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();

    const companyErr = validateField('company_name', formData.company_name);
    const contactErr = validateField('contact_person', formData.contact_person);
    const emailErr = validateField('email', formData.email);
    const phoneErr = validateField('phoneOnly', phoneOnly);
    const licenseErr = validateField('license_number', formData.license_number);
    const insuranceErr = validateField('insurance', formData.insurance);
    const expiryErr = validateField('expiry', formData.expiry);

    if (companyErr || contactErr || emailErr || phoneErr || licenseErr || insuranceErr || expiryErr) {
      toast.error("Please resolve the validation errors before submitting.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        community_id: Number(communityId),
        company_name: formData.company_name.trim(),
        contact_person: formData.contact_person.trim(),
        email: formData.email.trim(),
        phone: `+1${phoneOnly.replace(/\D/g, '')}`,
        category: formData.category,
        license_number: formData.license_number.trim(),
        license_expiry: formData.expiry || null,
        insurance_number: formData.insurance.trim(),
        insurance_expiry: formData.expiry || null,
      };

      await onboardCondoVendor(payload);
      toast.success("Vendor onboarded successfully!");
      closeModal();
      fetchVendors();
    } catch (err) {
      console.error("Onboard error:", err);
      toast.error(err.response?.data?.detail || "Failed to onboard vendor");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Code copied to clipboard!");
  };

  const handleGenAccessCode = async (vendorId) => {
    try {
      setLoading(true);
      await generateCondoVendorAccessCode(vendorId);
      toast.success("Access Code generated successfully!");
      fetchVendors();
    } catch (err) {
      toast.error("Failed to generate Access Code");
    } finally {
      setLoading(false);
    }
  };

  const handleGenContractCode = async (vendorId) => {
    try {
      setLoading(true);
      await generateCondoVendorContractCode(vendorId);
      toast.success("Contract Code generated successfully!");
      fetchVendors();
    } catch (err) {
      toast.error("Failed to generate Contract Code");
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(v =>
    v.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- VIEW 1: RESIDENT LOCK SCREEN ---
  if (!isAdmin && !isBoardMember && !isUnlocked) {
    return (
      <div className="p-6 text-slate-900 dark:text-white">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Approved Vendors</h1>
        <p className="text-slate-500 dark:text-gray-400 text-sm mb-8">View authorized vendors using your vendor access code.</p>
        
        <div className="bg-amber-50 dark:bg-[#2a1f0a] border border-amber-200 dark:border-yellow-700/30 p-4 rounded-lg flex items-center gap-3 mb-6 max-w-3xl animate-fadeIn">
          <Lock className="text-amber-600 dark:text-yellow-500" size={18} />
          <p className="text-amber-700 dark:text-yellow-500/90 text-sm">
            Enter your <span className="font-bold">vendor access code</span> to view authorized vendors.
          </p>
        </div>

        <div className="flex gap-3 max-w-md animate-fadeIn">
          <input 
            type="text"
            placeholder="Enter vendor access code"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            className="flex-1 bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all font-mono uppercase tracking-wider"
          />
          <button 
            onClick={handleUnlock}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-blue-500/25 cursor-pointer"
          >
            {loading ? "Verifying..." : "Unlock"}
          </button>
        </div>
      </div>
    );
  }

  // --- VIEW 2: FULL DIRECTORY TABLE VIEW (HOA-styled) ---
  return (
    <div className="p-2 relative text-slate-900 dark:text-white animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
        
        {/* Header Panel */}
        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="text-slate-800 dark:text-white font-medium text-sm flex items-center gap-2">
              <Truck size={16} /> Registered Vendors
            </div>
            {(isAdmin || isBoardMember) && (
              <button 
                onClick={handleOnboardClick}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all shadow-md shadow-blue-500/20 whitespace-nowrap cursor-pointer"
              >
                <Plus size={13} /> Onboard Vendor
              </button>
            )}
          </div>
          
          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-2xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 uppercase text-[10px] tracking-wider font-bold text-slate-500 dark:text-gray-400">
              <tr>
                <th className="px-3 py-4">Vendor</th>
                <th className="px-3 py-4 whitespace-nowrap">Service Type</th>
                <th className="px-3 py-4 whitespace-nowrap">License #</th>
                <th className="px-3 py-4">Insurance</th>
                <th className="px-3 py-4 text-right whitespace-nowrap">Status</th>
                <th className="px-3 py-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-3 py-12 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 dark:border-blue-400 border-t-transparent"></div>
                  </td>
                </tr>
              ) : filteredVendors.length > 0 ? (
                filteredVendors.map((v) => (
                  <tr key={v.vendor_id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                    
                    {/* VENDOR DETAILS */}
                    <td className="px-3 py-4">
                      <div className="text-slate-900 dark:text-white font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {v.company_name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-gray-400 whitespace-nowrap">
                        {v.contact_person} | {formatUsPhone(v.phone)}
                      </div>
                      
                      {/* Access and Contract codes inline inside Vendor column for easy copying */}
                      {(isAdmin || isBoardMember) && (
                        <div className="mt-1 space-y-0.5">
                          {v.vendor_access_code && (
                            <div className="text-[9px] text-blue-500 dark:text-blue-400 flex items-center gap-1">
                              <span>VAC: <strong>{v.vendor_access_code}</strong> {v.access_code_used ? '(Used)' : ''}</span>
                              <button onClick={() => copyToClipboard(v.vendor_access_code)} className="hover:underline text-[8px] uppercase tracking-wider font-semibold cursor-pointer">[Copy]</button>
                            </div>
                          )}
                          {v.contract_code && (
                            <div className="text-[9px] text-emerald-500 dark:text-emerald-450 flex items-center gap-1">
                              <span>VCC: <strong>{v.contract_code}</strong></span>
                              <button onClick={() => copyToClipboard(v.contract_code)} className="hover:underline text-[8px] uppercase tracking-wider font-semibold cursor-pointer">[Copy]</button>
                            </div>
                          )}
                          {(!v.vendor_access_code || !v.contract_code) && (
                            <div className="flex gap-2 mt-1">
                              {!v.vendor_access_code && (
                                <button
                                  onClick={() => handleGenAccessCode(v.vendor_id)}
                                  className="text-[8px] bg-blue-500/10 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/10 cursor-pointer"
                                >
                                  Gen VAC
                                </button>
                              )}
                              {!v.contract_code && (
                                <button
                                  onClick={() => handleGenContractCode(v.vendor_id)}
                                  className="text-[8px] bg-emerald-500/10 hover:bg-emerald-600 hover:text-white text-emerald-600 dark:text-emerald-455 px-1.5 py-0.5 rounded border border-emerald-500/10 cursor-pointer"
                                >
                                  Gen VCC
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* SERVICE TYPE */}
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className="bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-500/20">
                        {v.category}
                      </span>
                    </td>

                    {/* LICENSE NUMBER */}
                    <td className="px-3 py-4 font-mono text-xs text-slate-500 dark:text-gray-400 whitespace-nowrap">
                      {v.license_number || 'N/A'}
                    </td>

                    {/* INSURANCE */}
                    <td className="px-3 py-4 text-xs text-slate-600 dark:text-gray-300">
                      {v.insurance_number || "N/A"}
                    </td>

                    {/* STATUS */}
                    <td className="px-3 py-4 text-right whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold border ${v.active_status ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20' : 'text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
                        {v.active_status ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-3 py-4 text-right whitespace-nowrap">
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(v.vendor_id)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded transition-colors cursor-pointer"
                          title="Delete Vendor"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-500 dark:text-gray-400 italic">
                    No vendors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard Vendor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e2a3b] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-900 dark:text-white">
            <div className="p-6">
              <div className="flex justify-between items-start mb-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Onboard Vendor</h2>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white"><X size={20} /></button>
              </div>
              <p className="text-slate-500 dark:text-gray-400 text-xs mb-6">Register a new vendor with license and insurance details.</p>
              
              <form onSubmit={handleOnboardSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Company Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    name="company_name"
                    maxLength={100}
                    value={formData.company_name}
                    onChange={handleInputChange}
                    className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${errors.company_name ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-blue-500'} rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none`}
                    placeholder="e.g. Skyline Plumbing Ltd"
                  />
                  {errors.company_name && <p className="text-red-500 text-xs mt-1">{errors.company_name}</p>}
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Contact Person <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    name="contact_person"
                    maxLength={50}
                    value={formData.contact_person}
                    onChange={handleInputChange}
                    className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${errors.contact_person ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-blue-500'} rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none`}
                    placeholder="e.g. John Doe"
                  />
                  {errors.contact_person && <p className="text-red-500 text-xs mt-1">{errors.contact_person}</p>}
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Phone <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    name="phoneOnly"
                    value={phoneOnly}
                    onChange={handleInputChange}
                    className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${errors.phoneOnly ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-blue-500'} rounded-lg px-3 py-2 text-sm font-sans text-slate-900 dark:text-white outline-none`}
                    placeholder="(123) 456-7890"
                  />
                  {errors.phoneOnly && <p className="text-red-500 text-xs mt-1">{errors.phoneOnly}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Service Type <span className="text-red-500">*</span></label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                    >
                      <option value="PLUMBING">Plumbing</option>
                      <option value="ELECTRICAL">Electrical</option>
                      <option value="LANDSCAPING">Landscaping</option>
                      <option value="SECURITY">Security</option>
                      <option value="CLEANING">Cleaning</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Email <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      required
                      name="email"
                      maxLength={100}
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-blue-500'} rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none`}
                      placeholder="abc@gmail.com"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">License Number <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      name="license_number"
                      maxLength={20}
                      value={formData.license_number}
                      onChange={handleInputChange}
                      className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${errors.license_number ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-blue-500'} rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none`}
                      placeholder="Enter license number"
                    />
                    {errors.license_number && <p className="text-red-500 text-xs mt-1">{errors.license_number}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Expiry</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={16} />
                      <input
                        type="date"
                        name="expiry"
                        min={new Date().toISOString().split('T')[0]}
                        autoComplete="off"
                        onKeyDown={e => e.preventDefault()}
                        value={formData.expiry}
                        onChange={handleInputChange}
                        className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${errors.expiry ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-blue-500'} rounded-lg pl-10 pr-3 py-2 text-sm text-slate-900 dark:text-white outline-none cursor-pointer`}
                      />
                    </div>
                    {errors.expiry && <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Insurance Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    name="insurance"
                    maxLength={25}
                    value={formData.insurance}
                    onChange={handleInputChange}
                    className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${errors.insurance ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-blue-500'} rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none`}
                    placeholder="Enter insurance number"
                  />
                  {errors.insurance && <p className="text-red-500 text-xs mt-1">{errors.insurance}</p>}
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-xl text-sm font-semibold cancel-button-red-hover transition-colors">Cancel</button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 transition-all disabled:opacity-50 shadow-md shadow-blue-500/25 cursor-pointer"
                  >
                    {loading ? "Processing..." : "Onboard"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={() => {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          if (confirmConfig.onConfirm) confirmConfig.onConfirm();
        }}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
