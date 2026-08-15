import React, { useState, useEffect } from 'react';
import { Plus, X, Truck, Search, Trash2, Calendar } from 'lucide-react';
import API from "../../services/api";
import ConfirmModal from "../../components/ConfirmModal";
import { toast } from 'react-hot-toast';
import { formatUsPhone, formatPhoneAsYouType } from '../../utils/phoneFormatter';

const VENDOR_CATEGORIES = [
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'LANDSCAPING', label: 'Landscaping' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'OTHER', label: 'Other' }
];

export default function RentalVendors() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [phoneOnly, setPhoneOnly] = useState('');

  // Form State - Backend Schema matching
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    phone: '',
    category: 'PLUMBING', 
    license_number: '',
    license_expiry: '',
    insurance_number: '',
    insurance_expiry: '',
    email: ''
  });

  const [errors, setErrors] = useState({});
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    fetchVendors();

    const handleGlobalUpdate = () => {
      fetchVendors();
    };
    window.addEventListener('rental-data-changed', handleGlobalUpdate);
    return () => {
      window.removeEventListener('rental-data-changed', handleGlobalUpdate);
    };
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await API.get('/rental/vendors');
      setVendors(res.data);
    } catch (err) {
      console.error("Failed to fetch rental vendors:", err);
      toast.error("Failed to load vendors list.");
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardClick = () => {
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
      license_expiry: '',
      insurance_number: '',
      insurance_expiry: '',
      email: ''
    });
    setPhoneOnly('');
    setErrors({});
  };

  const validateField = (name, value) => {
    let tempErrors = { ...errors };
    if (name === 'company_name') {
      const trimmed = value.trim();
      if (!trimmed) {
        tempErrors.company_name = 'Company name is required';
      } else if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
        tempErrors.company_name = 'Company name must contain only letters and spaces';
      } else {
        tempErrors.company_name = '';
      }
    }
    if (name === 'contact_person') {
      if (!value.trim()) {
        tempErrors.contact_person = 'Contact person is required';
      } else if (/[^a-zA-Z\s.\-']/.test(value)) {
        tempErrors.contact_person = 'Contact person can only contain letters, spaces, dots, hyphens, and apostrophes';
      } else {
        tempErrors.contact_person = '';
      }
    }
    if (name === 'phoneOnly') {
      tempErrors.phoneOnly = value.length === 14 ? '' : 'Phone number must be 10 digits';
    }
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      tempErrors.email = emailRegex.test(value) ? '' : 'Invalid email format';
    }
    if (name === 'license_number') {
      const trimmed = value.trim();
      const hasMinDigits = (trimmed.replace(/\D/g, '').length >= 3);
      const hasRepeatingChars = /(.)\1{3,}/.test(trimmed);
      const hasConsecutiveLetters = /[a-zA-Z]{5,}/.test(trimmed);
      tempErrors.license_number = trimmed
        ? ((/^[a-zA-Z0-9-]{6,20}$/.test(trimmed) && hasMinDigits && !hasRepeatingChars && !hasConsecutiveLetters) ? '' : 'License number must be 6-20 alphanumeric characters/hyphens, containing at least 3 digits, without long repeating characters or 5+ consecutive letters')
        : 'License number is required';
    }
    if (name === 'license_expiry') {
      if (value) {
        const selDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        tempErrors.license_expiry = selDate > today ? '' : 'License expiry date must be in the future';
      } else {
        tempErrors.license_expiry = 'License expiry date is required';
      }
    }
    if (name === 'insurance_number') {
      const trimmed = value.trim();
      const hasMinDigits = (trimmed.replace(/\D/g, '').length >= 3);
      const hasRepeatingChars = /(.)\1{3,}/.test(trimmed);
      const hasConsecutiveLetters = /[a-zA-Z]{5,}/.test(trimmed);
      tempErrors.insurance_number = trimmed
        ? ((/^[a-zA-Z0-9-]{5,25}$/.test(trimmed) && hasMinDigits && !hasRepeatingChars && !hasConsecutiveLetters) ? '' : 'Insurance policy number must be 5-25 alphanumeric characters/hyphens, containing at least 3 digits, without long repeating characters or 5+ consecutive letters')
        : 'Insurance number is required';
    }
    if (name === 'insurance_expiry') {
      if (value) {
        const selDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        tempErrors.insurance_expiry = selDate > today ? '' : 'Insurance expiry date must be in the future';
      } else {
        tempErrors.insurance_expiry = 'Insurance expiry date is required';
      }
    }
    setErrors(tempErrors);
    return tempErrors;
  };

  const validateAllFields = () => {
    const lTrim = formData.license_number.trim();
    const lDigits = lTrim.replace(/\D/g, '').length >= 3;
    const lRep = /(.)\1{3,}/.test(lTrim);
    const lCons = /[a-zA-Z]{5,}/.test(lTrim);

    const iTrim = formData.insurance_number.trim();
    const iDigits = iTrim.replace(/\D/g, '').length >= 3;
    const iRep = /(.)\1{3,}/.test(iTrim);
    const iCons = /[a-zA-Z]{5,}/.test(iTrim);

    const tempErrors = {
      company_name: formData.company_name.trim() 
        ? (/^[a-zA-Z\s]+$/.test(formData.company_name.trim()) ? '' : 'Company name must contain only letters and spaces')
        : 'Company name is required',
      contact_person: formData.contact_person.trim()
        ? (/[^a-zA-Z\s.\-']/.test(formData.contact_person) ? 'Contact person can only contain letters, spaces, dots, hyphens, and apostrophes' : '')
        : 'Contact person is required',
      phoneOnly: phoneOnly.length === 14 ? '' : 'Phone number must be 10 digits',
      email: (/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(formData.email) ? '' : 'Invalid email format',
      license_number: lTrim
        ? ((/^[a-zA-Z0-9-]{6,20}$/.test(lTrim) && lDigits && !lRep && !lCons) ? '' : 'License number must be 6-20 alphanumeric characters/hyphens, containing at least 3 digits, without long repeating characters or 5+ consecutive letters')
        : 'License number is required',
      license_expiry: formData.license_expiry
        ? (new Date(formData.license_expiry) > new Date() ? '' : 'License expiry date must be in the future')
        : 'License expiry date is required',
      insurance_number: iTrim
        ? ((/^[a-zA-Z0-9-]{5,25}$/.test(iTrim) && iDigits && !iRep && !iCons) ? '' : 'Insurance policy number must be 5-25 alphanumeric characters/hyphens, containing at least 3 digits, without long repeating characters or 5+ consecutive letters')
        : 'Insurance number is required',
      insurance_expiry: formData.insurance_expiry
        ? (new Date(formData.insurance_expiry) > new Date() ? '' : 'Insurance expiry date must be in the future')
        : 'Insurance expiry date is required'
    };
    setErrors(tempErrors);
    return tempErrors;
  };

  const handleOnboard = async (e) => {
    e.preventDefault();
    
    const tempErrors = validateAllFields();
    const hasErrors = Object.values(tempErrors).some(err => err !== '');
    if (hasErrors) {
      setConfirmConfig({
        isOpen: true,
        title: "Validation Error",
        message: "Please resolve the validation errors before submitting.",
        type: "warning",
        singleButton: true,
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        company_name: formData.company_name,
        contact_person: formData.contact_person,
        phone: phoneOnly,
        category: formData.category,
        email: formData.email,
        license_number: formData.license_number,
        license_expiry: formData.license_expiry || null,
        insurance_number: formData.insurance_number,
        insurance_expiry: formData.insurance_expiry || null,
        zip_code: null
      };

      const res = await API.post('/rental/vendors', payload);
      setVendors(prev => [...prev, res.data]);
      closeModal();
      setConfirmConfig({
        isOpen: true,
        title: "Vendor Onboarded!",
        message: `${payload.company_name} has been successfully onboarded as a vendor.`,
        type: "success",
        singleButton: true,
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
    } catch (err) {
      console.error(err);
      setConfirmConfig({
        isOpen: true,
        title: "Onboarding Failed",
        message: err.response?.data?.detail || "Failed to onboard vendor. Please try again.",
        type: "warning",
        singleButton: true,
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
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
          await API.delete(`/rental/vendors/${vendorId}`);
          toast.success("Vendor deleted successfully!");
          fetchVendors();
        } catch (err) {
          console.error("Delete vendor error:", err);
          toast.error(err.response?.data?.detail || "Failed to delete vendor.");
        }
      }
    });
  };

  const filteredVendors = vendors.filter(v => 
    v.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-2 relative text-slate-900 dark:text-white text-left">
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
        
        {/* Header Section */}
        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="text-slate-800 dark:text-white font-medium text-sm flex items-center gap-2">
              <Truck size={16} /> Registered Vendors
            </div>
            <button 
              onClick={handleOnboardClick}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all shadow-md shadow-blue-500/20 whitespace-nowrap"
            >
              <Plus size={13} /> Onboard Vendor
            </button>
          </div>
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
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Table View */}
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
                    <td className="px-3 py-4">
                      <div className="text-slate-900 dark:text-white font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {v.company_name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-gray-400 whitespace-nowrap">
                        {v.contact_person} | {formatUsPhone(v.phone)}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className="bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-500/20">
                        {v.category}
                      </span>
                    </td>
                    <td className="px-3 py-4 font-mono text-xs text-slate-500 dark:text-gray-400 whitespace-nowrap">{v.license_number || 'N/A'}</td>
                    <td className="px-3 py-4 text-xs text-slate-600 dark:text-gray-300">{v.insurance_number || "N/A"}</td>
                    <td className="px-3 py-4 text-right whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold border ${v.active_status ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20' : 'text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
                        {v.active_status ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(v.vendor_id)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded transition-colors"
                        title="Delete Vendor"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-500 dark:text-gray-450 italic">
                    No vendors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL - Onboard Vendor */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1e2a3b] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-900 dark:text-white text-left">
            <div className="p-6">
              <div className="flex justify-between items-start mb-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Onboard Vendor</h2>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white"><X size={20} /></button>
              </div>
              <p className="text-slate-500 dark:text-gray-400 text-xs mb-6">Register a new vendor with license and insurance details.</p>
              
              <form onSubmit={handleOnboard} className="space-y-4">
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Company Name *</label>
                  <input 
                    required 
                    className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${errors.company_name ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-blue-500'} rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none`} 
                    value={formData.company_name} 
                    onChange={(e) => {
                      setFormData({...formData, company_name: e.target.value});
                      validateField('company_name', e.target.value);
                    }} 
                  />
                  {errors.company_name && (
                    <p className="text-red-500 text-xs mt-1">{errors.company_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Contact Person *</label>
                  <input 
                    required 
                    className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${errors.contact_person ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-blue-500'} rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none`} 
                    value={formData.contact_person} 
                    onChange={(e) => {
                      setFormData({...formData, contact_person: e.target.value});
                      validateField('contact_person', e.target.value);
                    }} 
                  />
                  {errors.contact_person && (
                    <p className="text-red-500 text-xs mt-1">{errors.contact_person}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Phone *</label>
                  <input
                    required
                    type="text"
                    maxLength={14}
                    placeholder="(123) 456-7890"
                    className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${errors.phoneOnly ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-blue-500'} rounded-lg px-3 py-2 text-sm font-sans text-slate-900 dark:text-white outline-none`}
                    value={phoneOnly}
                    onChange={(e) => {
                      const formatted = formatPhoneAsYouType(e.target.value);
                      setPhoneOnly(formatted);
                      validateField('phoneOnly', formatted);
                    }}
                  />
                  {errors.phoneOnly && (
                    <p className="text-red-500 text-xs mt-1">{errors.phoneOnly}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Service Type *</label>
                    <select className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                      {VENDOR_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value} className="bg-white dark:bg-[#111c2a] text-slate-900 dark:text-white">{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Email *</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="abc@gmail.com"
                      className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-blue-500'} rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none`} 
                      value={formData.email} 
                      onChange={(e) => {
                        setFormData({...formData, email: e.target.value});
                        validateField('email', e.target.value);
                      }} 
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">License Number *</label>
                    <input 
                      required 
                      maxLength={20}
                      className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${errors.license_number ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-blue-500'} rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none`} 
                      value={formData.license_number} 
                      onChange={(e) => {
                        setFormData({...formData, license_number: e.target.value});
                        validateField('license_number', e.target.value);
                      }} 
                    />
                    {errors.license_number && (
                      <p className="text-red-500 text-xs mt-1">{errors.license_number}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Expiry *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={16} />
                      <input 
                        type="date" 
                        required
                        min={new Date().toISOString().split('T')[0]}
                        autoComplete="off"
                        onKeyDown={e => e.preventDefault()}
                        className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${errors.license_expiry ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-blue-500'} rounded-lg pl-10 pr-3 py-2 text-sm text-slate-900 dark:text-white outline-none cursor-pointer`} 
                        value={formData.license_expiry} 
                        onChange={(e) => {
                          setFormData({...formData, license_expiry: e.target.value});
                          validateField('license_expiry', e.target.value);
                        }} 
                      />
                    </div>
                    {errors.license_expiry && (
                      <p className="text-red-500 text-xs mt-1">{errors.license_expiry}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Insurance Number *</label>
                    <input 
                      required
                      maxLength={25}
                      className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${errors.insurance_number ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-blue-500'} rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none`} 
                      value={formData.insurance_number} 
                      onChange={(e) => {
                        setFormData({...formData, insurance_number: e.target.value});
                        validateField('insurance_number', e.target.value);
                      }} 
                      placeholder="Enter insurance number"
                    />
                    {errors.insurance_number && (
                      <p className="text-red-500 text-xs mt-1">{errors.insurance_number}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Insurance Expiry *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={16} />
                      <input 
                        type="date" 
                        required
                        min={new Date().toISOString().split('T')[0]}
                        autoComplete="off"
                        onKeyDown={e => e.preventDefault()}
                        className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${errors.insurance_expiry ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-blue-500'} rounded-lg pl-10 pr-3 py-2 text-sm text-slate-900 dark:text-white outline-none cursor-pointer`} 
                        value={formData.insurance_expiry} 
                        onChange={(e) => {
                          setFormData({...formData, insurance_expiry: e.target.value});
                          validateField('insurance_expiry', e.target.value);
                        }} 
                      />
                    </div>
                    {errors.insurance_expiry && (
                      <p className="text-red-500 text-xs mt-1">{errors.insurance_expiry}</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
                  <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 transition-all disabled:opacity-50 shadow-md shadow-blue-500/25">
                    {loading ? "Processing..." : "Onboard"}
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
        type={confirmConfig.type || 'danger'}
        singleButton={confirmConfig.singleButton || false}
        onConfirm={() => {
          confirmConfig.onConfirm?.();
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => {
          confirmConfig.onCancel?.() || setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }}
      />
    </div>
  );
}
