import React, { useState, useEffect } from 'react';
import { Plus, X, Lock, Truck, Search, Copy, Check, Trash2 } from 'lucide-react';
import API from "../services/api";
import { toast } from 'react-hot-toast';
import { formatUsPhone, formatPhoneAsYouType } from '../utils/phoneFormatter';
import { checkEmail } from '../utils/emailValidation';

const getPhoneValidationRule = (code) => {
  switch (code) {
    case '+1':
    case '+91':
    case '+44':
      return { min: 10, max: 10, label: '10 digits' };
    case '+971':
    case '+966':
    case '+61':
      return { min: 9, max: 9, label: '9-digit number' };
    default:
      return { min: 7, max: 15, label: '7 to 15 digits' };
  }
};

const Vendors = ({ communityId, userRole }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  const [phoneCountryCode, setPhoneCountryCode] = useState('+1');
  const [phoneOnly, setPhoneOnly] = useState('');

  // Form State - Backend Schema ke hisaab se updated
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    phone: '',
    service_type: 'PLUMBING', 
    license_number: '',
    expiry: '',
    insurance: '',
    email: ''
  });

  const [errors, setErrors] = useState({});

  const isAdmin = userRole === 'super_admin' || userRole === 'property_manager';
  const isBoardMember = userRole === 'board_member' || userRole === 'president' || userRole === 'director';

  useEffect(() => {
    if (communityId) {
      setIsUnlocked(sessionStorage.getItem(`vendors_unlocked_${communityId}`) === 'true');
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
      const res = await API.get(`/vendor/${communityId}`);
      setVendors(res.data);
    } catch (err) {
      console.error("Vendor fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!accessCode) return alert("Please enter a code");

    try {
      setLoading(true);
      const res = await API.post('/vendor/verify-access-code', null, {
        params: {
          access_code: accessCode.trim(),
          community_id: Number(communityId)
        }
      });

      if (res.status === 200 || res.status === 201) {
        sessionStorage.setItem(`vendors_unlocked_${communityId}`, 'true');
        setIsUnlocked(true);
        await fetchVendors();
      }
    } catch (err) {
      console.error("422 Details:", err.response?.data);
      alert(err.response?.data?.detail?.[0]?.msg || "Invalid Access Code!");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vendorId) => {
    if (!window.confirm("Are you sure you want to delete this vendor?")) return;
    try {
      setLoading(true);
      await API.delete(`/vendor/${vendorId}`);
      toast.success("Vendor deleted successfully!");
      fetchVendors();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.response?.data?.detail || "Failed to delete vendor");
    } finally {
      setLoading(false);
    }
  };

  const validateField = (name, value) => {
    let errorMsg = '';
    if (name === 'company_name') {
      if (!value.trim()) {
        errorMsg = 'Company name is required';
      } else if (/\d/.test(value)) {
        errorMsg = 'Company name cannot contain numbers';
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
    }
    setErrors(prev => ({ ...prev, [name]: errorMsg }));
    return errorMsg;
  };

  useEffect(() => {
    if (phoneOnly) {
      validateField('phoneOnly', phoneOnly);
    } else {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.phoneOnly;
        return copy;
      });
    }
  }, [phoneCountryCode, phoneOnly]);

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      company_name: '',
      contact_person: '',
      phone: '',
      service_type: 'PLUMBING',
      license_number: '',
      expiry: '',
      insurance: '',
      email: ''
    });
    setPhoneCountryCode('+1');
    setPhoneOnly('');
    setErrors({});
  };

  const handleOnboard = async (e) => {
    e.preventDefault();

    const companyErr = validateField('company_name', formData.company_name);
    const contactErr = validateField('contact_person', formData.contact_person);
    const emailErr = validateField('email', formData.email);
    const phoneErr = validateField('phoneOnly', phoneOnly);

    if (companyErr || contactErr || emailErr || phoneErr) {
      toast.error("Please resolve the validation errors before submitting.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        community_id: Number(communityId),
        company_name: formData.company_name,
        contact_person: formData.contact_person,
        email: formData.email,
        phone: `+1${phoneOnly.replace(/\D/g, '')}`,
        category: formData.service_type, 
        license_number: formData.license_number || null,
        license_expiry: formData.expiry || null,
        insurance_number: formData.insurance || null,
      };

      await API.post('/vendor', payload);
      closeModal();
      toast.success("Vendor onboarded successfully!");
      fetchVendors();
    } catch (err) {
      console.error("422 Error details:", err.response?.data);
      toast.error("The vendor could not be onboarded! Please check all fields.");
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(v => 
    v.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- VIEW 1: RESIDENT LOCK SCREEN ---
  if (!isAdmin && !isBoardMember && !isUnlocked) {
    return (
      <div className="p-6 text-slate-900 dark:text-white">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Vendors</h1>
        <p className="text-slate-500 dark:text-gray-400 text-sm mb-8">View authorized vendors using your vendor access code.</p>
        
        <div className="bg-amber-50 dark:bg-[#2a1f0a] border border-amber-200 dark:border-yellow-700/30 p-4 rounded-lg flex items-center gap-3 mb-6 max-w-3xl">
          <Lock className="text-amber-600 dark:text-yellow-500" size={18} />
          <p className="text-amber-700 dark:text-yellow-500/90 text-sm">
            Enter your <span className="font-bold">vendor access code</span> to view authorized vendors.
          </p>
        </div>

        <div className="flex gap-3 max-w-md">
          <input 
            type="text"
            placeholder="Enter vendor access code"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            className="flex-1 bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 outline-none transition-all"
          />
          <button 
            onClick={handleUnlock}
            disabled={loading}
            className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-teal-500/25"
          >
            {loading ? "Verifying..." : "Unlock"}
          </button>
        </div>
      </div>
    );
  }

  // ==================== BOARD MEMBER SPECIAL VIEW ====================
  if (isBoardMember) {
    return (
      <div className="space-y-6 p-2 text-slate-900 dark:text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Vendor Management</h1>
            <p className="text-slate-500 dark:text-gray-400 mt-1">Onboard vendors, manage licenses, and generate access codes</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-teal-600 hover:bg-teal-500 px-5 py-2.5 rounded-2xl text-white flex items-center gap-2 text-sm font-semibold transition shadow-lg shadow-teal-500/25"
          >
            <Plus size={15} /> Onboard Vendor
          </button>
        </div>

        {/* Registered Vendors */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">Registered Vendors</h3>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-2xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white focus:border-teal-500 outline-none"
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
                  <tr><td colSpan="6" className="px-3 py-12 text-center text-slate-500 dark:text-gray-400">Loading...</td></tr>
                ) : filteredVendors.length > 0 ? (
                  filteredVendors.map((v) => (
                    <tr key={v.vendor_id || v.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                      <td className="px-3 py-4">
                        <div className="text-slate-900 dark:text-white font-medium group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          {v.company_name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-gray-400 whitespace-nowrap">
                          {v.contact_person} | {formatUsPhone(v.phone)}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className="bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 px-2 py-0.5 rounded text-[10px] font-bold border border-teal-500/20">
                          {v.category}
                        </span>
                      </td>
                      <td className="px-3 py-4 font-mono text-xs text-slate-500 dark:text-gray-400 whitespace-nowrap">{v.license_number || 'N/A'}</td>
                      <td className="px-3 py-4 text-xs text-slate-600 dark:text-gray-300">{v.insurance_number || "N/A"}</td>
                      <td className="px-3 py-4 text-right whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold border ${v.active_status ? 'text-teal-600 dark:text-teal-400 bg-teal-500/10 dark:bg-teal-500/20 border-teal-500/20' : 'text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
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
                  <tr><td colSpan="6" className="px-6 py-10 text-center text-slate-500 dark:text-gray-400 italic">No vendors found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL - Onboard Vendor for Board Member */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#1e2a3b] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-900 dark:text-white">
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
                      className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${errors.company_name ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-teal-500'} rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none`} 
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
                      className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${errors.contact_person ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-teal-500'} rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none`} 
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
                      className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${errors.phoneOnly ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-teal-500'} rounded-lg px-3 py-2 text-sm font-sans text-slate-900 dark:text-white outline-none`}
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
                      <select className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 outline-none" value={formData.service_type} onChange={(e) => setFormData({...formData, service_type: e.target.value})}>
                        <option value="PLUMBING" className="bg-white dark:bg-[#111c2a] text-slate-900 dark:text-white">Plumbing</option>
                        <option value="ELECTRICAL" className="bg-white dark:bg-[#111c2a] text-slate-900 dark:text-white">Electrical</option>
                        <option value="LANDSCAPING" className="bg-white dark:bg-[#111c2a] text-slate-900 dark:text-white">Landscaping</option>
                        <option value="SECURITY" className="bg-white dark:bg-[#111c2a] text-slate-900 dark:text-white">Security</option>
                        <option value="CLEANING" className="bg-white dark:bg-[#111c2a] text-slate-900 dark:text-white">Cleaning</option>
                        <option value="OTHER" className="bg-white dark:bg-[#111c2a] text-slate-900 dark:text-white">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Email *</label>
                      <input 
                        type="email" 
                        required 
                        placeholder="abc@gmail.com"
                        className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-teal-500'} rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none`} 
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
                      <input required className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 outline-none" value={formData.license_number} onChange={(e) => setFormData({...formData, license_number: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Expiry</label>
                      <input type="date" className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 outline-none" value={formData.expiry} onChange={(e) => setFormData({...formData, expiry: e.target.value})} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Insurance Number *</label>
                    <input 
                      required
                      className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 outline-none" 
                      value={formData.insurance} 
                      onChange={(e) => setFormData({...formData, insurance: e.target.value})} 
                      placeholder="Enter insurance number or N/A"
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-xl text-sm font-semibold cancel-button-red-hover transition-colors">Cancel</button>
                    <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-500 transition-all disabled:opacity-50 shadow-md shadow-teal-500/25">
                      {loading ? "Processing..." : "Onboard"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- VIEW 2: SUPER ADMIN / PROPERTY MANAGER (Tera Original Code) ---
  return (
    <div className="p-2 relative text-slate-900 dark:text-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Vendor Management</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm">Oakwood Estates</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 text-sm font-semibold transition-all shadow-lg shadow-teal-500/25"
          >
            <Plus size={15} /> Onboard Vendor
          </button>
        )}
      </div>

      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-slate-800 dark:text-white font-medium text-sm flex items-center gap-2">
            <Truck size={16} /> Registered Vendors
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-2xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white focus:border-teal-500 outline-none"
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
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-600 dark:border-teal-400 border-t-transparent"></div>
                  </td>
                </tr>
              ) : filteredVendors.length > 0 ? (
                filteredVendors.map((v) => (
                  <tr key={v.vendor_id || v.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-3 py-4">
                      <div className="text-slate-900 dark:text-white font-medium group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {v.company_name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-gray-400 whitespace-nowrap">
                        {v.contact_person} | {formatUsPhone(v.phone)}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className="bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 px-2 py-0.5 rounded text-[10px] font-bold border border-teal-500/20">
                        {v.category}
                      </span>
                    </td>
                    <td className="px-3 py-4 font-mono text-xs text-slate-500 dark:text-gray-400 whitespace-nowrap">{v.license_number || 'N/A'}</td>
                    <td className="px-3 py-4 text-xs text-slate-600 dark:text-gray-300">{v.insurance_number || "N/A"}</td>
                    <td className="px-3 py-4 text-right whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold border ${v.active_status ? 'text-teal-600 dark:text-teal-400 bg-teal-500/10 dark:bg-teal-500/20 border-teal-500/20' : 'text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
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
                <tr><td colSpan="6" className="px-6 py-10 text-center text-slate-500 dark:text-gray-400 italic">No vendors found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL - Onboard Vendor */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1e2a3b] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-900 dark:text-white">
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
                    className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${errors.company_name ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-teal-500'} rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none`} 
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
                    className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${errors.contact_person ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-teal-500'} rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none`} 
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
                    className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${errors.phoneOnly ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-teal-500'} rounded-lg px-3 py-2 text-sm font-sans text-slate-900 dark:text-white outline-none`}
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
                    <select className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 outline-none" value={formData.service_type} onChange={(e) => setFormData({...formData, service_type: e.target.value})}>
                      <option value="PLUMBING" className="bg-white dark:bg-[#111c2a] text-slate-900 dark:text-white">Plumbing</option>
                      <option value="ELECTRICAL" className="bg-white dark:bg-[#111c2a] text-slate-900 dark:text-white">Electrical</option>
                      <option value="LANDSCAPING" className="bg-white dark:bg-[#111c2a] text-slate-900 dark:text-white">Landscaping</option>
                      <option value="SECURITY" className="bg-white dark:bg-[#111c2a] text-slate-900 dark:text-white">Security</option>
                      <option value="CLEANING" className="bg-white dark:bg-[#111c2a] text-slate-900 dark:text-white">Cleaning</option>
                      <option value="OTHER" className="bg-white dark:bg-[#111c2a] text-slate-900 dark:text-white">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Email *</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="abc@gmail.com"
                      className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-teal-500'} rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none`} 
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
                    <input required className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 outline-none" value={formData.license_number} onChange={(e) => setFormData({...formData, license_number: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Expiry</label>
                    <input type="date" className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 outline-none" value={formData.expiry} onChange={(e) => setFormData({...formData, expiry: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Insurance Number *</label>
                  <input 
                    required
                    className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-teal-500 outline-none" 
                    value={formData.insurance} 
                    onChange={(e) => setFormData({...formData, insurance: e.target.value})} 
                    placeholder="Enter insurance number or N/A"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-xl text-sm font-semibold cancel-button-red-hover transition-colors">Cancel</button>
                  <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-500 transition-all disabled:opacity-50 shadow-md shadow-teal-500/25">
                    {loading ? "Processing..." : "Onboard"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendors;