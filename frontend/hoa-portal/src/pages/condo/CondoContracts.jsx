import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useForm } from 'react-hook-form';
import { 
  FileText, Plus, Search, CheckCircle, 
  Clock, AlertCircle, Copy, Check, X, Info, 
  MapPin, Phone, Mail, User, Building, Trash2, RefreshCw
} from 'lucide-react';
import { 
  getCondoContracts, createCondoContract, 
  updateCondoContract, deleteCondoContract 
} from '../../services/condoContractService';
import { validateEmail } from '../../utils/emailValidation';
import {
  validateName, validateCity, validateCountry, validateZipCode,
  validateBusinessName, validateAmount, validatePositiveInt,
  onlyLettersKeyPress, onlyZipKeyPress, onlyDigitsKeyPress, onlyDecimalKeyPress
} from '../../utils/fieldValidators';
import { formatPhoneAsYouType } from '../../utils/phoneFormatter';
import ConfirmModal from '../../components/ConfirmModal';

export default function CondoContracts() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    mode: 'onTouched',
    defaultValues: {
      status: 'ACTIVE',
      client_first_name: '',
      client_middle_name: '',
      client_last_name: '',
      client_address: '',
      client_city: '',
      client_state: '',
      client_zip_code: '',
      client_country: 'USA',
      client_phone_number: '',
      client_phone_only: '',
      client_email_address: '',
      business_name: '',
      business_address: '',
      business_phone_only: '',
      client_preferred_communication_channel: 'Email',
      plan_selected: 'Standard Tower',
      annual_renewal_fee: '',
      one_time_set_up: '',
      size_of_the_building: '',
      renewal_cycle: 'Annual'
    }
  });

  const selectedPlan = watch('plan_selected');

  useEffect(() => {
    if (!selectedPlan) return;
    const planDefaults = {
      'Standard Tower': {
        size: 100,
        setup: 1000,
        renewal: 3500,
        cycle: 'Annual'
      },
      'Luxury High-Rise': {
        size: 250,
        setup: 2500,
        renewal: 7500,
        cycle: 'Annual'
      },
      'Premium Multi-Tower': {
        size: 500,
        setup: 5000,
        renewal: 12000,
        cycle: 'Annual'
      }
    };
    const defaults = planDefaults[selectedPlan];
    if (defaults) {
      setValue('size_of_the_building', defaults.size, { shouldValidate: true });
      setValue('one_time_set_up', defaults.setup, { shouldValidate: true });
      setValue('annual_renewal_fee', defaults.renewal, { shouldValidate: true });
      setValue('renewal_cycle', defaults.cycle, { shouldValidate: true });
    }
  }, [selectedPlan, setValue]);

  const handleZipLookup = async (zipCode) => {
    const cleanZip = zipCode.replace(/[^0-9]/g, '');
    if (cleanZip.length === 5) {
      try {
        const response = await fetch(`https://api.zippopotam.us/us/${cleanZip}`);
        if (response.ok) {
          const data = await response.json();
          if (data.places && data.places.length > 0) {
            const place = data.places[0];
            setValue('client_city', place['place name'].replace(/[^A-Za-z\s\-']/g, ''), { shouldValidate: true });
            setValue('client_state', place['state abbreviation'].toUpperCase(), { shouldValidate: true });
          }
        }
      } catch (err) {
        console.warn("Zip code lookup failed:", err);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
  };

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const data = await getCondoContracts();
      setContracts(data);
    } catch (err) {
      setConfirmConfig({
        isOpen: true,
        title: 'Load Failed',
        message: err.response?.data?.detail || 'Failed to fetch condo contracts.',
        type: 'warning',
        singleButton: true,
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyLink = (code) => {
    const link = `${window.location.origin}/condo/onboard?code=${code}`;
    navigator.clipboard.writeText(link);
    setConfirmConfig({
      isOpen: true,
      title: 'Link Copied!',
      message: 'Condo onboarding link has been copied to your clipboard.',
      type: 'success',
      singleButton: true,
      onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      
      const payload = {
        status: data.status,
        client_first_name: data.client_first_name,
        client_middle_name: data.client_middle_name || null,
        client_last_name: data.client_last_name,
        client_address: data.client_address || null,
        client_city: data.client_city || null,
        client_state: data.client_state || null,
        client_zip_code: data.client_zip_code || null,
        client_country: data.client_country || 'USA',
        client_phone_number: data.client_phone_only ? `+1${data.client_phone_only.replace(/\D/g, '')}` : null,
        client_email_address: data.client_email_address || null,
        business_name: data.business_name || null,
        business_address: data.business_address || null,
        business_phone_number: data.business_phone_only ? `+1${data.business_phone_only.replace(/\D/g, '')}` : null,
        client_preferred_communication_channel: data.client_preferred_communication_channel || 'Email',
        plan_selected: data.plan_selected || null,
        annual_renewal_fee: data.annual_renewal_fee ? parseFloat(data.annual_renewal_fee) : null,
        one_time_set_up: data.one_time_set_up ? parseFloat(data.one_time_set_up) : null,
        size_of_the_building: data.size_of_the_building ? parseInt(data.size_of_the_building, 10) : null,
        renewal_cycle: data.renewal_cycle || 'Annual'
      };

      await createCondoContract(payload);
      handleCloseModal();
      fetchContracts();
      setConfirmConfig({
        isOpen: true,
        title: 'Contract Created!',
        message: `Contract for ${payload.client_first_name} ${payload.client_last_name} has been created successfully.`,
        type: 'success',
        singleButton: true,
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
    } catch (err) {
      setConfirmConfig({
        isOpen: true,
        title: 'Creation Failed',
        message: err.response?.data?.detail || 'Failed to create condo contract.',
        type: 'warning',
        singleButton: true,
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (contractId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
      await updateCondoContract(contractId, { status: newStatus });
      fetchContracts();
      setConfirmConfig({
        isOpen: true,
        title: 'Status Updated',
        message: `Contract status has been updated to ${newStatus}.`,
        type: 'success',
        singleButton: true,
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
    } catch (err) {
      setConfirmConfig({
        isOpen: true,
        title: 'Update Failed',
        message: err.response?.data?.detail || 'Failed to update contract status.',
        type: 'warning',
        singleButton: true,
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const handleDeleteContract = async (contractId) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Contract',
      message: 'Are you sure you want to delete this condo contract? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteCondoContract(contractId);
          fetchContracts();
          setConfirmConfig({
            isOpen: true,
            title: 'Contract Deleted',
            message: 'The contract has been permanently deleted.',
            type: 'success',
            singleButton: true,
            onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
          });
        } catch (err) {
          setConfirmConfig({
            isOpen: true,
            title: 'Delete Failed',
            message: err.response?.data?.detail || 'Failed to delete contract.',
            type: 'warning',
            singleButton: true,
            onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
          });
        }
      },
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const filteredContracts = contracts.filter(c => {
    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    const clientName = `${c.client_first_name || ''} ${c.client_last_name || ''}`.toLowerCase();
    const bizName = (c.business_name || '').toLowerCase();
    const code = (c.contract_code || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = clientName.includes(query) || bizName.includes(query) || code.includes(query);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Contracts', value: contracts.length, color: 'text-blue-600 dark:text-blue-400', border: 'border-slate-100 dark:border-white/5' },
          { label: 'Active (Ready to Use)', value: contracts.filter(c => c.status === 'ACTIVE').length, color: 'text-emerald-600 dark:text-emerald-450', border: 'border-slate-100 dark:border-white/5' },
          { label: 'Drafts', value: contracts.filter(c => c.status === 'DRAFT').length, color: 'text-amber-600 dark:text-amber-500', border: 'border-slate-100 dark:border-white/5' },
          { label: 'Onboarded Clients', value: contracts.filter(c => c.status === 'ONBOARDED').length, color: 'text-indigo-600 dark:text-indigo-400', border: 'border-slate-100 dark:border-white/5' }
        ].map((m, idx) => (
          <div key={idx} className={`bg-white dark:bg-slate-900 border ${m.border} p-6 rounded-3xl text-center shadow-xs flex flex-col items-center justify-center`}>
            <span className={`text-4xl font-extrabold ${m.color} tracking-tight font-mono`}>{loading ? '—' : m.value}</span>
            <span className="text-slate-500 dark:text-gray-400 text-xs font-semibold mt-1.5">{m.label}</span>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
        
        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl gap-1 overflow-x-auto w-full lg:w-auto">
          {['ALL', 'ACTIVE', 'ONBOARDED', 'DRAFT'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`flex-1 lg:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === status
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-850 dark:hover:text-white'
              } cursor-pointer`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search by code, client, or business..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-indigo-600/10 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New Condo Contract
          </button>
        </div>
      </div>

      {/* Contracts Card Grid */}
      {loading && contracts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Loading contracts...
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="text-center py-20 text-slate-500 dark:text-gray-400 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-sm dark:shadow-none">
          <FileText size={40} className="mx-auto mb-3 opacity-50 text-slate-400 dark:text-gray-500" />
          No contracts found matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredContracts.map((c) => {
            const clientName = `${c.client_first_name || ''} ${c.client_last_name || ''}`.trim() || 'N/A';
            return (
              <div
                key={c.contract_id}
                className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-5 shadow-sm dark:shadow-none hover:shadow-md dark:hover:border-white/20 transition-all duration-200 flex flex-col gap-4"
              >
                {/* Top Row: Code + Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-indigo-600 dark:text-[#5BA4F5] bg-indigo-600/10 dark:bg-[#5BA4F5]/10 px-3 py-1 rounded-xl text-sm">
                      {c.contract_code}
                    </span>
                    <button
                      onClick={() => handleCopyCode(c.contract_code)}
                      className="text-slate-400 hover:text-slate-700 dark:text-gray-500 dark:hover:text-white transition"
                      title="Copy Code"
                    >
                      {copiedCode === c.contract_code ? (
                        <Check size={15} className="text-emerald-500" />
                      ) : (
                        <Copy size={15} />
                      )}
                    </button>
                  </div>

                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap flex-shrink-0 ${
                    c.status === 'ACTIVE'
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                      : c.status === 'ONBOARDED'
                      ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-200/60 dark:bg-gray-500/20 text-slate-600 dark:text-gray-400'
                  }`}>
                    {c.status === 'ACTIVE' && <CheckCircle size={11} />}
                    {c.status === 'ONBOARDED' && <CheckCircle size={11} />}
                    {c.status === 'DRAFT' && <Clock size={11} />}
                    {c.status}
                  </span>
                </div>

                {/* Client / Business */}
                <div className="border-t border-slate-200/60 dark:border-white/5 pt-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {(c.client_first_name?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                        {clientName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-gray-400 truncate">{c.client_email_address || 'N/A'}</div>
                      {c.business_name && (
                        <div className="text-xs font-medium text-slate-700 dark:text-gray-300 mt-0.5 flex items-center gap-1">
                          <Building size={11} className="text-slate-400 flex-shrink-0" />
                          <span className="truncate">{c.business_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Plan + Pricing row */}
                <div className="grid grid-cols-2 gap-3 border-t border-slate-200/60 dark:border-white/5 pt-3">
                  <div>
                    <div className="text-[10px] text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5 font-semibold">Plan Info</div>
                    <span className="text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-lg border border-indigo-500/10">
                      {c.plan_selected || 'Custom'}
                    </span>
                    <div className="text-xs text-slate-500 dark:text-gray-400 mt-1.5">
                      Max Units: <span className="font-mono font-semibold text-slate-800 dark:text-white">{c.size_of_the_building || '0'}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-gray-500 uppercase tracking-tighter mt-0.5">
                      Cycle: {c.renewal_cycle}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1.5 font-semibold">Pricing</div>
                    <div className="text-xs text-slate-500 dark:text-gray-400">
                      Setup: <span className="font-bold text-slate-800 dark:text-white">${c.one_time_set_up || '0'}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                      Renewal: <span className="font-bold text-indigo-600 dark:text-[#5BA4F5]">${c.annual_renewal_fee || '0'}</span>
                    </div>
                  </div>
                </div>

                {/* Sales Agent + Date */}
                <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-white/5 pt-3">
                  <div className="text-xs">
                    <div className="text-slate-700 dark:text-gray-300 font-medium">{c.sales_agent_name || 'System Admin'}</div>
                    <div className="text-[10px] text-slate-400 dark:text-gray-500 font-mono mt-0.5">
                      {c.created_date ? new Date(c.created_date).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {c.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleCopyLink(c.contract_code)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white rounded-lg text-xs font-medium transition cursor-pointer"
                        title="Copy Onboarding link"
                      >
                        Copy Link
                      </button>
                    )}
                    {c.status !== 'ONBOARDED' && (
                      <button
                        onClick={() => toggleStatus(c.contract_id, c.status)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                          c.status === 'ACTIVE'
                            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {c.status === 'ACTIVE' ? 'Set Draft' : 'Activate'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteContract(c.contract_id)}
                      className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition cursor-pointer"
                      title="Delete Contract"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Creation Modal */}
      {isModalOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 z-[9999] overflow-y-auto">
          <div className="bg-white dark:bg-[#1E2E42] rounded-3xl w-full max-w-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#162535]">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                Create New Condo Contract
              </h2>
              <button onClick={handleCloseModal} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Client Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wider pb-1 border-b border-indigo-500/20">Client / Buyer Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">First Name *</label>
                    <input
                      type="text"
                      {...register('client_first_name', { required: 'Required', validate: validateName('First Name') })}
                      onKeyPress={onlyLettersKeyPress}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white transition-all"
                      placeholder="e.g. Robert"
                    />
                    {errors.client_first_name && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.client_first_name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Middle Name</label>
                    <input
                      type="text"
                      {...register('client_middle_name')}
                      onKeyPress={onlyLettersKeyPress}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white transition-all"
                      placeholder="e.g. J."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Last Name *</label>
                    <input
                      type="text"
                      {...register('client_last_name', { required: 'Required', validate: validateName('Last Name') })}
                      onKeyPress={onlyLettersKeyPress}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white transition-all"
                      placeholder="e.g. Smith"
                    />
                    {errors.client_last_name && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.client_last_name.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Email Address *</label>
                    <input
                      type="email"
                      {...register('client_email_address', { required: 'Required', validate: validateEmail })}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white transition-all"
                      placeholder="client@domain.com"
                    />
                    {errors.client_email_address && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.client_email_address.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Phone Number (US Only) *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-sm text-slate-400 font-mono">+1</span>
                      <input
                        type="text"
                        maxLength={14}
                        {...register('client_phone_only', {
                          required: 'Required',
                          validate: (val) => {
                            const digits = (val || '').replace(/\D/g, '');
                            if (digits.length !== 10) return 'US number must be 10 digits';
                            return true;
                          }
                        })}
                        onChange={(e) => {
                          const formatted = formatPhoneAsYouType(e.target.value);
                          setValue('client_phone_only', formatted, { shouldValidate: true });
                        }}
                        className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white transition-all font-mono"
                        placeholder="(123) 456-7890"
                      />
                    </div>
                    {errors.client_phone_only && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.client_phone_only.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Client Address *</label>
                    <input
                      type="text"
                      {...register('client_address', { required: 'Required' })}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white transition-all"
                      placeholder="e.g. 100 Main St"
                    />
                    {errors.client_address && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.client_address.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Zip Code *</label>
                    <input
                      type="text"
                      maxLength={5}
                      {...register('client_zip_code', { required: 'Required', validate: validateZipCode })}
                      onKeyPress={onlyZipKeyPress}
                      onChange={(e) => handleZipLookup(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white transition-all font-mono"
                      placeholder="Zip"
                    />
                    {errors.client_zip_code && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.client_zip_code.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">City *</label>
                    <input
                      type="text"
                      {...register('client_city', { required: 'Required', validate: validateCity })}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white transition-all"
                      placeholder="City"
                    />
                    {errors.client_city && <p className="text-rose-500 text-[10px] mt-1">{errors.client_city.message}</p>}
                  </div>
                </div>
              </div>

              {/* Association / Building Info */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/10">
                <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wider pb-1 border-b border-indigo-500/20">Association / Building Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Association / Condo Name *</label>
                    <input
                      type="text"
                      {...register('business_name', { required: 'Required', validate: validateBusinessName })}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white transition-all"
                      placeholder="e.g. Pinecrest Condominiums"
                    />
                    {errors.business_name && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.business_name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Building Address *</label>
                    <input
                      type="text"
                      {...register('business_address', { required: 'Required' })}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white transition-all"
                      placeholder="Condo Building address"
                    />
                    {errors.business_address && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.business_address.message}</p>}
                  </div>
                </div>
              </div>

              {/* Plans & pricing */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/10">
                <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wider pb-1 border-b border-indigo-500/20">Subscription & Pricing Parameters</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Plan Selected *</label>
                    <select
                      {...register('plan_selected', { required: 'Required' })}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white transition-all"
                    >
                      <option value="Standard Tower">Standard Tower</option>
                      <option value="Luxury High-Rise">Luxury High-Rise</option>
                      <option value="Premium Multi-Tower">Premium Multi-Tower</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Renewal Cycle *</label>
                    <select
                      {...register('renewal_cycle', { required: 'Required' })}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white transition-all"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="Annual">Annual</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Building Size (No. of Units) *</label>
                    <input
                      type="text"
                      {...register('size_of_the_building', { required: 'Required', validate: validatePositiveInt })}
                      onKeyPress={onlyDigitsKeyPress}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white transition-all font-mono"
                      placeholder="e.g. 150"
                    />
                    {errors.size_of_the_building && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.size_of_the_building.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">One Time Setup Fee ($) *</label>
                    <input
                      type="text"
                      {...register('one_time_set_up', { required: 'Required', validate: validateAmount })}
                      onKeyPress={onlyDecimalKeyPress}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white transition-all font-mono"
                      placeholder="e.g. 1500.00"
                    />
                    {errors.one_time_set_up && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.one_time_set_up.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Annual Renewal Fee ($) *</label>
                    <input
                      type="text"
                      {...register('annual_renewal_fee', { required: 'Required', validate: validateAmount })}
                      onKeyPress={onlyDecimalKeyPress}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white transition-all font-mono"
                      placeholder="e.g. 5000.00"
                    />
                    {errors.annual_renewal_fee && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.annual_renewal_fee.message}</p>}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 justify-end pt-4 border-t border-slate-200 dark:border-white/10 mt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-xl text-sm font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition shadow-lg shadow-indigo-500/20 cursor-pointer"
                >
                  {submitting ? 'Creating...' : 'Create Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type || 'danger'}
        singleButton={confirmConfig.singleButton || false}
        confirmText={confirmConfig.confirmText || 'OK'}
        cancelText={confirmConfig.cancelText || 'Cancel'}
        onConfirm={() => {
          confirmConfig.onConfirm?.();
        }}
        onCancel={() => {
          confirmConfig.onCancel?.() || setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }}
      />
    </div>
  );
}
