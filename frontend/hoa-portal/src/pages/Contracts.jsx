import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { 
  FileText, Plus, Search, CheckCircle, 
  Clock, AlertCircle, Copy, Check, X, Info, 
  MapPin, Phone, Mail, User, Building, Trash2, RefreshCw
} from 'lucide-react';
import { getContracts, createContract, updateContract, deleteContract } from '../services/contractService';
import { validateEmail } from '../utils/emailValidation';
import {
  validateName, validateCity, validateCountry, validateZipCode,
  validateBusinessName, validateAmount, validatePositiveInt,
  onlyLettersKeyPress, onlyZipKeyPress, onlyDigitsKeyPress, onlyDecimalKeyPress
} from '../utils/fieldValidators';

export default function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Address Autocomplete states
  const mapboxToken = (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '').replace(/['"]/g, "").trim();
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [addressSelected, setAddressSelected] = useState(false);
  const addressTimeoutRef = useRef(null);

  // Form setup
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

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    mode: 'onTouched',
    defaultValues: {
      status: 'ACTIVE',
      client_first_name: '',
      client_middle_name: '',
      client_last_name: '',
      client_address: '',
      client_city: '',
      client_zip_code: '',
      client_country: 'USA',
      client_phone_number: '',
      client_phone_country_code: '+1',
      client_phone_only: '',
      client_email_address: '',
      business_name: '',
      business_address: '',
      business_phone_number: '',
      business_phone_country_code: '+1',
      business_phone_only: '',
      client_preferred_communication_channel: 'email',
      plan_selected: 'Standard',
      annual_renewal_fee: '999',
      one_time_set_up: '199',
      size_of_the_community: '100',
      renewal_cycle: 'Annual'
    }
  });

  const clientAddressRegister = register('client_address');

  // Watch fields
  const selectedPlan = watch('plan_selected');
  const clientPhoneCountryCode = watch('client_phone_country_code') || '+1';
  const businessPhoneCountryCode = watch('business_phone_country_code') || '+1';
  const clientPhoneRule = getPhoneValidationRule(clientPhoneCountryCode);
  const businessPhoneRule = getPhoneValidationRule(businessPhoneCountryCode);

  useEffect(() => {
    // Load current user from storage to prepopulate sales agent details
    try {
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }
    } catch (e) {
      console.error(e);
    }
    fetchContracts();
  }, []);
  useEffect(() => {
    return () => {
      if (addressTimeoutRef.current) {
        clearTimeout(addressTimeoutRef.current);
      }
    };
  }, []);

  const handleAddressInputChange = (val) => {
    if (!mapboxToken || mapboxToken.startsWith('pk.placeholder_please_replace')) {
      return;
    }

    if (addressTimeoutRef.current) {
      clearTimeout(addressTimeoutRef.current);
    }

    if (!val || val.trim().length < 3) {
      setAddressSuggestions([]);
      return;
    }

    addressTimeoutRef.current = setTimeout(async () => {
      try {
        setSearchingAddress(true);
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val)}.json?access_token=${mapboxToken}&autocomplete=true&types=address&limit=5`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Mapbox API failed');
        const data = await response.json();
        setAddressSuggestions(data.features || []);
      } catch (err) {
        console.error('Error fetching address suggestions:', err);
        setAddressSuggestions([]);
      } finally {
        setSearchingAddress(false);
      }
    }, 600);
  };

  const handleSelectSuggestion = (feature) => {
    setAddressSuggestions([]);
    
    const streetNumber = feature.address || '';
    const streetName = feature.text || '';
    const fullStreet = streetNumber ? `${streetNumber} ${streetName}`.trim() : streetName;
    
    let city = '';
    let zipCode = '';
    let countryName = '';
    let countryCode = '';

    if (feature.context) {
      feature.context.forEach((item) => {
        if (item.id.startsWith('postcode')) {
          zipCode = item.text;
        } else if (item.id.startsWith('place') || item.id.startsWith('locality')) {
          city = item.text;
        } else if (item.id.startsWith('country')) {
          countryName = item.text;
          countryCode = item.short_code ? item.short_code.toUpperCase() : '';
        }
      });
    }

    setValue('client_address', fullStreet || feature.place_name);
    if (city) setValue('client_city', city);
    if (zipCode) setValue('client_zip_code', zipCode);
    if (countryName) setValue('client_country', countryName);

    setAddressSelected(true);
  };

  const handleResetAddress = () => {
    setAddressSelected(false);
    setValue('client_address', '');
    setValue('client_city', '');
    setValue('client_zip_code', '');
    setValue('client_country', 'USA');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
    setAddressSelected(false);
  };

  const fetchContracts = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await getContracts();
      setContracts(data);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to fetch contracts.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyLink = (code) => {
    const link = `${window.location.origin}/onboarding?code=${code}`;
    navigator.clipboard.writeText(link);
    setSuccessMsg('Public onboarding link copied to clipboard!');
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');
      
      // Clean numeric inputs
      const payload = {
        ...data,
        client_phone_number: data.client_phone_only ? `${data.client_phone_country_code}${data.client_phone_only}` : '',
        business_phone_number: data.business_phone_only ? `${data.business_phone_country_code}${data.business_phone_only}` : '',
        annual_renewal_fee: data.annual_renewal_fee ? parseFloat(data.annual_renewal_fee) : null,
        one_time_set_up: data.one_time_set_up ? parseFloat(data.one_time_set_up) : null,
        size_of_the_community: data.size_of_the_community ? parseInt(data.size_of_the_community, 10) : null,
      };

      await createContract(payload);
      setSuccessMsg('Contract created successfully!');
      handleCloseModal();
      fetchContracts();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to create contract.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (contractId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
      await updateContract(contractId, { status: newStatus });
      setSuccessMsg(`Contract status updated to ${newStatus}`);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchContracts();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to update contract status.');
    }
  };

  const handleDeleteContract = async (contractId) => {
    if (!window.confirm('Are you sure you want to delete this contract? This action cannot be undone.')) {
      return;
    }
    try {
      setErrorMsg('');
      setSuccessMsg('');
      await deleteContract(contractId);
      setSuccessMsg('Contract deleted successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchContracts();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to delete contract.');
    }
  };

  // Filter and search contracts
  const filteredContracts = contracts.filter((c) => {
    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    const clientName = `${c.client_first_name || ''} ${c.client_last_name || ''}`.toLowerCase();
    const matchesSearch = 
      clientName.includes(searchQuery.toLowerCase()) ||
      (c.contract_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.business_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.client_email_address || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Calculate stats
  const totalCount = contracts.length;
  const activeCount = contracts.filter(c => c.status === 'ACTIVE').length;
  const draftCount = contracts.filter(c => c.status === 'DRAFT').length;
  const onboardedCount = contracts.filter(c => c.status === 'ONBOARDED').length;

  return (
    <div className="relative text-slate-900 dark:text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Manage Contracts</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1">Generate and distribute unique contract codes for client onboarding</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-[#1D9E75] hover:bg-[#15805d] rounded-2xl text-sm font-semibold transition flex items-center gap-2 text-white shadow-lg shadow-teal-950/20 w-full md:w-auto justify-center"
        >
          <Plus size={15} />
          Create Contract
        </button>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-teal-500/10 border border-teal-500/30 text-[#25C490] text-sm rounded-2xl flex items-center gap-2">
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-2xl flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm dark:shadow-none">
          <div className="text-teal-600 dark:text-teal-400 text-5xl font-mono font-bold">{totalCount}</div>
          <div className="text-sm text-slate-500 dark:text-gray-400 mt-2">Total Contracts</div>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm dark:shadow-none">
          <div className="text-[#1D9E75] dark:text-[#25C490] text-5xl font-mono font-bold">{activeCount}</div>
          <div className="text-sm text-slate-500 dark:text-gray-400 mt-2">Active (Ready to Use)</div>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm dark:shadow-none">
          <div className="text-amber-600 dark:text-amber-400 text-5xl font-mono font-bold">{draftCount}</div>
          <div className="text-sm text-slate-500 dark:text-gray-400 mt-2">Drafts</div>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm dark:shadow-none">
          <div className="text-blue-600 dark:text-blue-400 text-5xl font-mono font-bold">{onboardedCount}</div>
          <div className="text-sm text-slate-500 dark:text-gray-400 mt-2">Onboarded Clients</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex bg-slate-50 dark:bg-[#1E2E42] border border-slate-200/80 dark:border-white/10 rounded-2xl p-1 overflow-x-auto">
          {['ALL', 'ACTIVE', 'DRAFT', 'ONBOARDED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                filterStatus === status
                  ? 'bg-[#1D9E75] text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by code, client, or business..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl text-sm focus:outline-none focus:border-[#1D9E75] text-slate-900 dark:text-white"
          />
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-500 dark:text-gray-400" />
        </div>
      </div>

      {/* Table Section */}
      {loading && contracts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Loading contracts...
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="text-center py-20 text-slate-500 dark:text-gray-400 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-sm dark:shadow-none">
          <FileText size={40} className="mx-auto mb-3 opacity-50 text-slate-400 dark:text-gray-500" />
          No contracts found matching your filters.
        </div>
      ) : (
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-x-auto shadow-sm dark:shadow-none">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider bg-slate-100/50 dark:bg-[#0D1622]/50">
                <th className="py-4 px-6">Contract Code</th>
                <th className="py-4 px-6">Client / Business</th>
                <th className="py-4 px-6">Plan Info</th>
                <th className="py-4 px-6">Pricing details</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Sales Agent</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-white/5 text-sm">
              {filteredContracts.map((contract) => (
                <tr key={contract.contract_id} className="hover:bg-slate-100/30 dark:hover:bg-white/5 transition duration-150">
                  {/* Code */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#1D9E75] dark:text-[#25C490] text-base bg-[#1D9E75]/10 dark:bg-[#25C490]/10 px-3 py-1 rounded-xl">
                        {contract.contract_code}
                      </span>
                      <button
                        onClick={() => handleCopyCode(contract.contract_code)}
                        className="text-slate-400 hover:text-slate-700 dark:text-gray-500 dark:hover:text-white transition"
                        title="Copy Code"
                      >
                        {copiedCode === contract.contract_code ? (
                          <Check size={16} className="text-green-500" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Client & Business */}
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {contract.client_first_name} {contract.client_last_name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-gray-400">{contract.client_email_address}</div>
                      {contract.business_name && (
                        <div className="text-xs font-semibold text-slate-700 dark:text-gray-300 mt-1 italic">
                          🏢 {contract.business_name}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Plan selected & community size */}
                  <td className="py-4 px-6">
                    <div>
                      <span className="text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-lg border border-blue-500/10">
                        {contract.plan_selected || 'Custom'}
                      </span>
                      <div className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                        Max Units: <span className="text-slate-800 dark:text-white font-mono font-semibold">{contract.size_of_the_community || 'Unlimited'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-gray-500 uppercase tracking-tighter">
                        Cycle: {contract.renewal_cycle}
                      </div>
                    </div>
                  </td>

                  {/* Pricing details */}
                  <td className="py-4 px-6">
                    <div>
                      <div className="text-xs text-slate-500 dark:text-gray-400">
                        Setup Fee: <span className="text-slate-800 dark:text-white font-bold">${contract.one_time_set_up || '0'}</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-gray-400">
                        Renewal Fee: <span className="text-[#1D9E75] dark:text-[#25C490] font-bold">${contract.annual_renewal_fee || '0'}</span>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium ${
                      contract.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : contract.status === 'ONBOARDED'
                        ? 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                        : 'bg-slate-200/60 dark:bg-gray-500/20 text-slate-600 dark:text-gray-400'
                    }`}>
                      {contract.status === 'ACTIVE' && <CheckCircle size={12} />}
                      {contract.status === 'ONBOARDED' && <CheckCircle size={12} />}
                      {contract.status === 'DRAFT' && <Clock size={12} />}
                      {contract.status}
                    </span>
                  </td>

                  {/* Sales agent */}
                  <td className="py-4 px-6">
                    <div className="text-xs text-slate-700 dark:text-gray-300">
                      <div>{contract.sales_agent_name || 'System Admin'}</div>
                      <div className="text-[10px] text-slate-400 dark:text-gray-500 font-mono">
                        {new Date(contract.created_date).toLocaleDateString()}
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {contract.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleCopyLink(contract.contract_code)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white rounded-lg text-xs font-medium transition"
                          title="Copy Onboarding link"
                        >
                          Copy Link
                        </button>
                      )}
                      {contract.status !== 'ONBOARDED' && (
                        <button
                          onClick={() => toggleStatus(contract.contract_id, contract.status)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                            contract.status === 'ACTIVE'
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {contract.status === 'ACTIVE' ? 'Set Draft' : 'Activate'}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteContract(contract.contract_id)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition"
                        title="Delete Contract"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal - Create Contract */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/65 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-gradient-to-br from-white to-slate-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl text-slate-900 dark:text-white">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-100/50 dark:bg-[#1b2d41]/50 rounded-t-3xl">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Create New Contract</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Provide client registration parameters and choose plans</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 hover:bg-slate-200/80 dark:hover:bg-white/10 rounded-xl transition text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* Sales agent preview */}
              <div className="p-4 bg-slate-50 dark:bg-[#1f3246]/45 border border-slate-200 dark:border-white/5 rounded-2xl flex items-center gap-3 text-xs text-slate-600 dark:text-gray-300">
                <User size={14} className="text-[#25C490]" />
                <span>
                  Preparing contract as Sales Agent: <strong className="text-slate-800 dark:text-white">{currentUser?.full_name || currentUser?.email_id || 'System Admin'}</strong>
                </span>
              </div>

              {/* Section 1: Client Information */}
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-gray-300 border-b border-slate-200 dark:border-white/5 pb-2 mb-4 flex items-center gap-2">
                  <User size={16} className="text-teal-600 dark:text-teal-400" />
                  1. Client Contact Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">First Name *</label>
                    <input
                      type="text"
                      {...register('client_first_name', {
                        required: 'First name is required',
                        validate: validateName('First Name')
                      })}
                      onKeyPress={onlyLettersKeyPress}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#1D9E75] placeholder-slate-400 dark:placeholder-gray-500"
                    />
                    {errors.client_first_name && <span className="text-xs text-red-400 mt-1">{errors.client_first_name.message}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Middle Name</label>
                    <input
                      type="text"
                      {...register('client_middle_name', { validate: validateName('Middle Name', false) })}
                      onKeyPress={onlyLettersKeyPress}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#1D9E75] placeholder-slate-400 dark:placeholder-gray-500"
                    />
                    {errors.client_middle_name && <span className="text-xs text-red-400 mt-1">{errors.client_middle_name.message}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Last Name *</label>
                    <input
                      type="text"
                      {...register('client_last_name', {
                        required: 'Last name is required',
                        validate: validateName('Last Name')
                      })}
                      onKeyPress={onlyLettersKeyPress}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#1D9E75] placeholder-slate-400 dark:placeholder-gray-500"
                    />
                    {errors.client_last_name && <span className="text-xs text-red-400 mt-1">{errors.client_last_name.message}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Client Email *</label>
                    <input
                      type="email"
                      {...register('client_email_address', { 
                        required: 'Email address is required',
                        validate: validateEmail,
                      })}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#1D9E75] placeholder-slate-400 dark:placeholder-gray-500"
                    />
                    {errors.client_email_address && <span className="text-xs text-red-400 mt-1">{errors.client_email_address.message}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Client Phone *</label>
                    <div className="flex gap-2">
                      <select
                        {...register('client_phone_country_code')}
                        className="px-3 py-2.5 bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#1D9E75] cursor-pointer"
                      >
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+971">🇦🇪 +971</option>
                        <option value="+966">🇸🇦 +966</option>
                        <option value="+61">🇦🇺 +61</option>
                      </select>
                      <input
                        type="text"
                        maxLength={clientPhoneRule.max}
                        {...register('client_phone_only', { 
                          required: 'Phone number is required',
                          validate: (val) => {
                            if (!val) return 'Phone number is required';
                            if (val.length < clientPhoneRule.min || val.length > clientPhoneRule.max) {
                              return `Phone must be exactly ${clientPhoneRule.label} for ${clientPhoneCountryCode}`;
                            }
                            return true;
                          }
                        })}
                        onKeyPress={(e) => {
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        placeholder={`${clientPhoneRule.max}-digit number`}
                        className="flex-1 bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#1D9E75] placeholder-slate-400 dark:placeholder-gray-500"
                      />
                    </div>
                    {errors.client_phone_only && <span className="text-xs text-red-400 mt-1">{errors.client_phone_only.message}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div className="md:col-span-2 relative">
                    <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Client Address</label>
                    <input
                      type="text"
                      name={clientAddressRegister.name}
                      ref={clientAddressRegister.ref}
                      onBlur={clientAddressRegister.onBlur}
                      onChange={(e) => {
                        clientAddressRegister.onChange(e);
                        handleAddressInputChange(e.target.value);
                      }}
                      readOnly={addressSelected}
                      placeholder={mapboxToken ? "Start typing to search..." : "Street Address"}
                      className={`w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#1D9E75] placeholder-slate-400 dark:placeholder-gray-500 ${
                        addressSelected ? 'opacity-65 bg-slate-100/50 dark:bg-[#0D1B2A]/50 cursor-not-allowed' : ''
                      }`}
                    />

                    {/* Autocomplete suggestions dropdown */}
                    {searchingAddress && (
                      <div className="absolute z-50 w-full mt-1 bg-slate-50 dark:bg-[#1e2f41] border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs text-gray-550 dark:text-gray-400 flex items-center gap-2">
                        <RefreshCw size={14} className="animate-spin text-teal-400" />
                        Searching address...
                      </div>
                    )}

                    {!searchingAddress && addressSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#162535] border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-2xl max-h-60 overflow-y-auto">
                        {addressSuggestions.map((feature) => (
                          <button
                            key={feature.id}
                            type="button"
                            onClick={() => handleSelectSuggestion(feature)}
                            className="w-full text-left px-4 py-2.5 hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-400 text-xs text-slate-800 dark:text-gray-200 border-b border-slate-200 dark:border-white/5 last:border-0 transition-colors"
                          >
                            {feature.place_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">City</label>
                    <input
                      type="text"
                      {...register('client_city', { validate: validateCity })}
                      onKeyPress={onlyLettersKeyPress}
                      readOnly={addressSelected}
                      className={`w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#1D9E75] placeholder-slate-400 dark:placeholder-gray-500 ${
                        addressSelected ? 'opacity-65 bg-slate-100/50 dark:bg-[#0D1B2A]/50 cursor-not-allowed' : ''
                      }`}
                    />
                    {errors.client_city && <span className="text-xs text-red-400 mt-1">{errors.client_city.message}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Zip Code</label>
                    <input
                      type="text"
                      {...register('client_zip_code', {
                        validate: (val) => {
                          if (!val) return true;
                          if (!/^\d+$/.test(val)) return 'Zip code must contain only numbers';
                          if (val.length < 5 || val.length > 10) return 'Zip code must be between 5 and 10 digits';
                          return true;
                        }
                      })}
                      onKeyPress={onlyDigitsKeyPress}
                      readOnly={addressSelected}
                      className={`w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#1D9E75] placeholder-slate-400 dark:placeholder-gray-500 ${
                        addressSelected ? 'opacity-65 bg-slate-100/50 dark:bg-[#0D1B2A]/50 cursor-not-allowed' : ''
                      }`}
                    />
                    {errors.client_zip_code && <span className="text-xs text-red-400 mt-1">{errors.client_zip_code.message}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Country</label>
                    <input
                      type="text"
                      {...register('client_country')}
                      readOnly={addressSelected}
                      className={`w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#1D9E75] placeholder-slate-400 dark:placeholder-gray-500 ${
                        addressSelected ? 'opacity-65 bg-slate-100/50 dark:bg-[#0D1B2A]/50 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Preferred Communication</label>
                    <select
                      {...register('client_preferred_communication_channel')}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#1D9E75] placeholder-slate-400 dark:placeholder-gray-500"
                    >
                      <option value="email" className="bg-white dark:bg-[#0D1B2A] text-slate-900 dark:text-white">Email</option>
                      <option value="phone" className="bg-white dark:bg-[#0D1B2A] text-slate-900 dark:text-white">Phone</option>
                      <option value="both" className="bg-white dark:bg-[#0D1B2A] text-slate-900 dark:text-white">Both</option>
                    </select>
                  </div>
                </div>

                {addressSelected && (
                  <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center justify-between text-xs text-[#25C490]">
                    <div className="flex items-center gap-1.5 font-medium">
                      <CheckCircle size={14} />
                      <span>Address verified & auto-filled via Mapbox.</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetAddress}
                      className="underline text-teal-600 dark:text-teal-400 hover:text-teal-500 dark:hover:text-teal-350 font-semibold cursor-pointer"
                    >
                      Reset / Edit Address
                    </button>
                  </div>
                )}
              </div>

              {/* Section 2: Business details */}
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-gray-300 border-b border-slate-200 dark:border-white/5 pb-2 mb-4 flex items-center gap-2">
                  <Building size={16} className="text-blue-600 dark:text-blue-400" />
                  2. Business Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Business/Management Name *</label>
                    <input
                      type="text"
                      {...register('business_name', {
                        required: 'Business name is required',
                        validate: validateBusinessName
                      })}
                      placeholder="e.g. Acme Property Management"
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#1D9E75] placeholder-slate-400 dark:placeholder-gray-500"
                    />
                    {errors.business_name && <span className="text-xs text-red-400 mt-1">{errors.business_name.message}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Business Phone</label>
                    <div className="flex gap-2">
                      <select
                        {...register('business_phone_country_code')}
                        className="px-3 py-2.5 bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#1D9E75] cursor-pointer"
                      >
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+971">🇦🇪 +971</option>
                        <option value="+966">🇸🇦 +966</option>
                        <option value="+61">🇦🇺 +61</option>
                      </select>
                      <input
                        type="text"
                        maxLength={businessPhoneRule.max}
                        {...register('business_phone_only', {
                          validate: (val) => {
                            if (!val) return true; // Optional field
                            if (val.length < businessPhoneRule.min || val.length > businessPhoneRule.max) {
                              return `Phone must be exactly ${businessPhoneRule.label} for ${businessPhoneCountryCode}`;
                            }
                            return true;
                          }
                        })}
                        onKeyPress={(e) => {
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        placeholder={`${businessPhoneRule.max}-digit number`}
                        className="flex-1 bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#1D9E75] placeholder-slate-400 dark:placeholder-gray-500"
                      />
                    </div>
                    {errors.business_phone_only && <span className="text-xs text-red-400 mt-1">{errors.business_phone_only.message}</span>}
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Business Address</label>
                  <input
                    type="text"
                    {...register('business_address')}
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#1D9E75] placeholder-slate-400 dark:placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Section 3: Plan and Fees */}
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-gray-300 border-b border-slate-200 dark:border-white/5 pb-2 mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-emerald-600 dark:text-emerald-400" />
                  3. Plan & Pricing parameters
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Plan selected *</label>
                    <select
                      {...register('plan_selected', {
                        required: true,
                        onChange: (e) => {
                          const val = e.target.value;
                          if (val === 'Standard') {
                            setValue('one_time_set_up', '199');
                            setValue('annual_renewal_fee', '999');
                            setValue('size_of_the_community', '100');
                          } else if (val === 'Premium') {
                            setValue('one_time_set_up', '399');
                            setValue('annual_renewal_fee', '1999');
                            setValue('size_of_the_community', '350');
                          } else if (val === 'Enterprise') {
                            setValue('one_time_set_up', '999');
                            setValue('annual_renewal_fee', '4999');
                            setValue('size_of_the_community', '1000');
                          }
                        }
                      })}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#1D9E75] placeholder-slate-400 dark:placeholder-gray-500"
                    >
                      <option value="Standard" className="bg-white dark:bg-[#0D1B2A] text-slate-900 dark:text-white">Standard ($999/yr, max 100 units)</option>
                      <option value="Premium" className="bg-white dark:bg-[#0D1B2A] text-slate-900 dark:text-white">Premium ($1999/yr, max 350 units)</option>
                      <option value="Enterprise" className="bg-white dark:bg-[#0D1B2A] text-slate-900 dark:text-white">Enterprise ($4999/yr, max 1000 units)</option>
                      <option value="Custom" className="bg-white dark:bg-[#0D1B2A] text-slate-900 dark:text-white">Custom Plan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Max Community Size (Units) *</label>
                    <input
                      type="number"
                      {...register('size_of_the_community', {
                        required: 'Size is required',
                        min: 1,
                        onChange: (e) => {
                          const val = e.target.value;
                          if (!val) return;
                          const size = parseInt(val, 10);
                          if (isNaN(size) || size <= 0) return;

                          if (selectedPlan !== 'Custom') {
                            if (size <= 100) {
                              setValue('plan_selected', 'Standard');
                              setValue('one_time_set_up', '199');
                              setValue('annual_renewal_fee', '999');
                            } else if (size <= 350) {
                              setValue('plan_selected', 'Premium');
                              setValue('one_time_set_up', '399');
                              setValue('annual_renewal_fee', '1999');
                            } else if (size <= 1000) {
                              setValue('plan_selected', 'Enterprise');
                              setValue('one_time_set_up', '999');
                              setValue('annual_renewal_fee', '4999');
                            } else {
                              setValue('plan_selected', 'Custom');
                            }
                          }
                        }
                      })}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#1D9E75] placeholder-slate-400 dark:placeholder-gray-500"
                    />
                    {errors.size_of_the_community && <span className="text-xs text-red-400 mt-1">{errors.size_of_the_community.message}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Renewal Cycle *</label>
                    <select
                      {...register('renewal_cycle', { required: true })}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#1D9E75] placeholder-slate-400 dark:placeholder-gray-500"
                    >
                      <option value="monthly" className="bg-white dark:bg-[#0D1B2A] text-slate-900 dark:text-white">Monthly</option>
                      <option value="Annual" className="bg-white dark:bg-[#0D1B2A] text-slate-900 dark:text-white">Annual</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">One-Time Set Up Fee ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('one_time_set_up', { required: 'Setup fee is required', min: 0 })}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#1D9E75] placeholder-slate-400 dark:placeholder-gray-500"
                    />
                    {errors.one_time_set_up && <span className="text-xs text-red-400 mt-1">{errors.one_time_set_up.message}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Annual/Renewal Fee ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('annual_renewal_fee', { required: 'Renewal fee is required', min: 0 })}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#1D9E75] placeholder-slate-400 dark:placeholder-gray-500"
                    />
                    {errors.annual_renewal_fee && <span className="text-xs text-red-400 mt-1">{errors.annual_renewal_fee.message}</span>}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-[#1f3246]/45 p-4 rounded-2xl border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-200">
                <span className="text-xs font-medium text-slate-500 dark:text-gray-400">Initial Contract Status:</span>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-800 dark:text-white">
                  <input
                    type="radio"
                    value="ACTIVE"
                    {...register('status')}
                    className="accent-[#1D9E75]"
                  />
                  <span>Active (Ready for Onboarding)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-800 dark:text-white">
                  <input
                    type="radio"
                    value="DRAFT"
                    {...register('status')}
                    className="accent-[#1D9E75]"
                  />
                  <span>Draft (Hidden)</span>
                </label>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-white/10 pt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-red-600 hover:text-white dark:bg-white/10 dark:hover:bg-red-600 dark:hover:text-white rounded-xl text-sm font-medium transition text-slate-700 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#1D9E75] hover:bg-[#15805d] rounded-xl text-sm font-medium transition text-white disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {submitting ? 'Saving...' : 'Save Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
