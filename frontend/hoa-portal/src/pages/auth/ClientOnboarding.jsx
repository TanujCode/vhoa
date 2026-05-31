import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Building, User, Shield, CreditCard, CheckCircle, 
  AlertCircle, ChevronRight, ChevronLeft, RefreshCw, KeyRound, Globe2, Landmark, Info
} from 'lucide-react';
import API from '../../services/api';
import { verifyContractCode, getCaptcha, onboardClient } from '../../services/contractService';

export default function ClientOnboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Step navigation: 1 = Contract, 2 = Account Setup, 3 = HOA Community, 4 = Billing & Captcha
  const [step, setStep] = useState(1);
  const [loadingCode, setLoadingCode] = useState(false);
  const [verifiedContract, setVerifiedContract] = useState(null);
  
  const generateLocalCaptcha = () => {
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1;
    return {
      question: `${num1} + ${num2} = ?`,
      token: `local_captcha_math:${num1}+${num2}`
    };
  };

  const [captcha, setCaptcha] = useState(() => generateLocalCaptcha());
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { register, handleSubmit, watch, setValue, formState: { errors, isValid } } = useForm({
    mode: 'onTouched',
    defaultValues: {
      contract_code: searchParams.get('code') || '',
      first_name: '',
      middle_name: '',
      last_name: '',
      email_id: '',
      mobile_number: '',
      password: '',
      confirm_password: '',
      role_selected: 'Admin',
      hoa_name: '',
      hoa_address: '',
      hoa_city: '',
      hoa_state_id: '',
      hoa_country_id: '',
      hoa_zip_code: '',
      hoa_contact_number: '',
      payment_method: 'bank_account',
      bank_name: '',
      routing_number: '',
      account_number: '',
      cardholder_name: '',
      card_number: '',
      card_expiry: '',
      card_cvv: '',
      captcha_answer: ''
    }
  });

  const contractCodeValue = watch('contract_code');
  const passwordValue = watch('password');
  const paymentMethod = watch('payment_method');

  // Load countries and prefill code from URL on mount
  useEffect(() => {
    fetchCountries();
    // Ping backend in background on mount to wake it up from cold-start
    API.get('/auth/captcha', { timeout: 2000 }).catch(() => {});
    
    // Auto-verify if code is present in URL
    const urlCode = searchParams.get('code');
    if (urlCode) {
      handleVerifyCode(urlCode);
    }
  }, []);

  const fetchCountries = async () => {
    try {
      const res = await API.get('/location/countries');
      setCountries(res.data);
      if (res.data.length > 0) {
        // Default to first country (usually USA or India)
        const defaultCountryId = res.data[0].country_id;
        setValue('hoa_country_id', defaultCountryId);
        setSelectedCountry(defaultCountryId);
        fetchStates(defaultCountryId);
      }
    } catch (err) {
      console.error('Failed to load countries:', err);
    }
  };

  const fetchStates = async (countryId) => {
    if (!countryId) return;
    try {
      const res = await API.get(`/location/states/${countryId}`);
      setStates(res.data);
      if (res.data.length > 0) {
        setValue('hoa_state_id', res.data[0].state_id);
      }
    } catch (err) {
      console.error('Failed to load states:', err);
    }
  };

  const fetchCaptcha = async () => {
    // Instantly show a local math captcha — no delay!
    setCaptcha(generateLocalCaptcha());
    setValue('captcha_answer', '');

    try {
      setRefreshing(true);
      const data = await getCaptcha({ timeout: 2000 });
      const currentAnswer = watch('captcha_answer');
      if (!currentAnswer || currentAnswer.trim() === '') {
        setCaptcha({
          question: data.question,
          token: data.captcha_token
        });
      }
    } catch (err) {
      console.warn('Failed to fetch captcha from backend, keeping local:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleVerifyCode = async (codeOverride) => {
    const code = codeOverride || contractCodeValue;
    if (!code || code.trim() === '') {
      setErrorMsg('Please enter a contract code.');
      return;
    }

    try {
      setLoadingCode(true);
      setErrorMsg('');
      const data = await verifyContractCode(code.trim().toUpperCase());
      setVerifiedContract(data);
      
      // Prefill some fields from contract data
      if (data.client_name) {
        const parts = data.client_name.split(' ');
        if (parts.length >= 1) setValue('first_name', parts[0]);
        if (parts.length >= 2) setValue('last_name', parts[parts.length - 1]);
        if (parts.length === 3) setValue('middle_name', parts[1]);
      }
      
      // Since contract has client email address, let's use it
      if (data.client_email_address) {
        setValue('email_id', data.client_email_address);
      }
      
      // Set business name as HOA default
      if (data.business_name) {
        setValue('hoa_name', data.business_name);
      }

      setStep(2); // Go to next step
    } catch (err) {
      setVerifiedContract(null);
      setErrorMsg(err.response?.data?.detail || 'Invalid or inactive contract code.');
    } finally {
      setLoadingCode(false);
    }
  };

  const handleCountryChange = (e) => {
    const countryId = e.target.value;
    setSelectedCountry(countryId);
    fetchStates(countryId);
  };

  const handleNext = () => {
    setErrorMsg('');
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data) => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      setSubmitting(true);

      // Construct payment details representation
      let paymentDetails = '';
      if (data.payment_method === 'bank_account') {
        paymentDetails = `Bank: ${data.bank_name}, Routing: ${data.routing_number}, Account: ${data.account_number.slice(-4).padStart(data.account_number.length, '*')}`;
      } else {
        paymentDetails = `CC Holder: ${data.cardholder_name}, Card: ${data.card_number.slice(-4).padStart(data.card_number.length, '*')}`;
      }

      const payload = {
        first_name: data.first_name,
        middle_name: data.middle_name || null,
        last_name: data.last_name,
        email_id: data.email_id,
        mobile_number: data.mobile_number,
        password: data.password,
        role_selected: data.role_selected,
        hoa_name: data.hoa_name,
        hoa_address: data.hoa_address,
        hoa_city: data.hoa_city,
        hoa_state_id: data.hoa_state_id ? parseInt(data.hoa_state_id, 10) : null,
        hoa_country_id: data.hoa_country_id ? parseInt(data.hoa_country_id, 10) : null,
        hoa_zip_code: data.hoa_zip_code || null,
        hoa_contact_number: data.hoa_contact_number || null,
        contract_code: data.contract_code.trim().toUpperCase(),
        captcha_token: captcha.token,
        captcha_answer: data.captcha_answer,
        payment_method: data.payment_method,
        payment_details: paymentDetails
      };

      await onboardClient(payload);
      setSuccessMsg('Onboarding registration successful! Your HOA community has been created. Redirecting to login page...');
      setTimeout(() => {
        navigate('/login');
      }, 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Onboarding registration failed. Please review your captcha or contact details.');
      // Refresh captcha automatically on failure
      fetchCaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-4xl bg-[#162535] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row">
        
        {/* Left Side: Progress & Info */}
        <div className="w-full md:w-1/3 bg-[#111f2e] p-8 border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-[#1D9E75] rounded-xl flex items-center justify-center text-white font-bold text-sm">VH</div>
              <span className="text-xl font-bold tracking-tight text-white">V<span className="text-[#1D9E75]">HOAS</span></span>
            </div>
            
            <h2 className="text-2xl font-bold mb-2">HOA Client Onboarding</h2>
            <p className="text-xs text-gray-400 mb-6">Register your property management firm or board administration portal in minutes.</p>

            {/* Stepper */}
            <div className="space-y-6">
              {[
                { s: 1, title: 'Contract Code', desc: 'Verify contract validity', icon: Shield },
                { s: 2, title: 'User Account', desc: 'Login credentials & role', icon: User },
                { s: 3, title: 'HOA Community', desc: 'HOA details & address', icon: Building },
                { s: 4, title: 'Billing & Captcha', desc: 'Payment details & math captcha', icon: CreditCard }
              ].map((stepItem) => {
                const Icon = stepItem.icon;
                const isCurrent = step === stepItem.s;
                const isCompleted = step > stepItem.s;
                return (
                  <div key={stepItem.s} className="flex gap-4 items-start">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      isCurrent 
                        ? 'bg-[#1D9E75] text-white shadow-lg shadow-teal-500/20' 
                        : isCompleted 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-white/5 text-gray-500 border border-white/5'
                    }`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className={`text-xs font-semibold ${isCurrent ? 'text-white' : isCompleted ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {stepItem.title}
                      </div>
                      <div className="text-[10px] text-gray-500">{stepItem.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {verifiedContract && (
            <div className="mt-8 p-4 bg-[#1a2d41] rounded-2xl border border-white/5 text-xs space-y-2">
              <div className="font-bold text-gray-300 uppercase tracking-wider text-[10px] mb-1">Contract Parameters</div>
              <div>Plan: <span className="text-blue-400 font-semibold">{verifiedContract.plan_selected}</span></div>
              <div>Units Limit: <span className="text-white font-semibold font-mono">{verifiedContract.size_of_the_community}</span></div>
              <div>Annual Fee: <span className="text-[#25C490] font-semibold">${verifiedContract.annual_renewal_fee}</span></div>
              <div>Setup Fee: <span className="text-white font-semibold">${verifiedContract.one_time_set_up}</span></div>
            </div>
          )}
        </div>

        {/* Right Side: Form Wizard */}
        <div className="w-full md:w-2/3 p-8 flex flex-col justify-between">
          <div className="flex-1">
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-2xl flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 bg-teal-500/10 border border-teal-500/30 text-[#25C490] text-sm rounded-2xl flex items-center gap-2">
                <CheckCircle size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* STEP 1: CONTRACT VERIFICATION */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Enter Your Contract Code</h3>
                    <p className="text-xs text-gray-400 mb-4">Please input the unique contract code received from your VHOAS sales representative to begin setup.</p>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold tracking-wider text-gray-400 uppercase mb-2">Contract Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        {...register('contract_code', { required: true })}
                        placeholder="CON-XXXXXX"
                        className="flex-1 bg-[#1e2f41] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#1D9E75] font-mono text-lg uppercase tracking-widest placeholder:normal-case placeholder:font-sans"
                        disabled={loadingCode}
                      />
                      <button
                        type="button"
                        onClick={() => handleVerifyCode()}
                        disabled={loadingCode}
                        className="px-6 bg-[#1D9E75] hover:bg-[#15805d] disabled:bg-teal-800 text-white font-medium rounded-xl transition flex items-center gap-2 text-sm shadow-md"
                      >
                        {loadingCode ? <RefreshCw size={16} className="animate-spin" /> : 'Verify Code'}
                      </button>
                    </div>
                    {errors.contract_code && <p className="text-red-400 text-xs mt-1">Contract code is required.</p>}
                  </div>

                  <div className="bg-[#1c2e42] p-4 rounded-2xl border border-white/5 text-xs text-gray-400 leading-relaxed flex gap-3">
                    <Info size={24} className="text-blue-400 flex-shrink-0" />
                    <div>
                      <strong>Don't have a contract code?</strong> Let us help you set up! Please contact sales at <a href="mailto:sales@vhoas.com" className="text-teal-400 underline font-semibold">sales@vhoas.com</a> to draft your community services contract.
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: USER ACCOUNT SETUP */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Set Up Owner Account</h3>
                    <p className="text-xs text-gray-400">Create the primary administrative or board user credentials.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">First Name *</label>
                      <input
                        type="text"
                        {...register('first_name', { required: 'Required' })}
                        className="w-full bg-[#1e2f41] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75]"
                      />
                      {errors.first_name && <span className="text-xs text-red-400">{errors.first_name.message}</span>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Middle Name</label>
                      <input
                        type="text"
                        {...register('middle_name')}
                        className="w-full bg-[#1e2f41] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Last Name *</label>
                      <input
                        type="text"
                        {...register('last_name', { required: 'Required' })}
                        className="w-full bg-[#1e2f41] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75]"
                      />
                      {errors.last_name && <span className="text-xs text-red-400">{errors.last_name.message}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Email Address *</label>
                      <input
                        type="email"
                        {...register('email_id', { 
                          required: 'Required',
                          pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                        })}
                        className="w-full bg-[#1e2f41] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75]"
                      />
                      {errors.email_id && <span className="text-xs text-red-400">{errors.email_id.message}</span>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Mobile Phone *</label>
                      <input
                        type="text"
                        {...register('mobile_number', { required: 'Required' })}
                        placeholder="+1 (555) 000-0000"
                        className="w-full bg-[#1e2f41] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75]"
                      />
                      {errors.mobile_number && <span className="text-xs text-red-400">{errors.mobile_number.message}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Password *</label>
                      <input
                        type="password"
                        {...register('password', { 
                          required: 'Required',
                          minLength: { value: 6, message: 'Password must be at least 6 characters' }
                        })}
                        className="w-full bg-[#1e2f41] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75]"
                      />
                      {errors.password && <span className="text-xs text-red-400">{errors.password.message}</span>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Confirm Password *</label>
                      <input
                        type="password"
                        {...register('confirm_password', { 
                          required: 'Required',
                          validate: (val) => val === passwordValue || 'Passwords do not match'
                        })}
                        className="w-full bg-[#1e2f41] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75]"
                      />
                      {errors.confirm_password && <span className="text-xs text-red-400">{errors.confirm_password.message}</span>}
                    </div>
                  </div>

                  {/* Role selected */}
                  <div className="p-4 bg-[#1f3246] rounded-2xl border border-white/5 space-y-3">
                    <label className="block text-xs font-semibold text-gray-400 uppercase">Your Role in the HOA *</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="radio"
                          value="Admin"
                          {...register('role_selected')}
                          className="accent-[#1D9E75]"
                        />
                        <div>
                          <span className="font-bold block">Admin (Property Manager)</span>
                          <span className="text-[10px] text-gray-400">Responsible for operations & vendor coordination</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="radio"
                          value="Board Member"
                          {...register('role_selected')}
                          className="accent-[#1D9E75]"
                        />
                        <div>
                          <span className="font-bold block">Board Member</span>
                          <span className="text-[10px] text-gray-400">Elected president, treasurer, or secretary governance representative</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: HOA COMMUNITY DETAILS */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">HOA Community details</h3>
                    <p className="text-xs text-gray-400">Define the community location and size parameters.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">HOA/Community Name *</label>
                    <input
                      type="text"
                      {...register('hoa_name', { required: 'Required' })}
                      placeholder="e.g. Whispering Pines HOA"
                      className="w-full bg-[#1e2f41] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75]"
                    />
                    {errors.hoa_name && <span className="text-xs text-red-400">{errors.hoa_name.message}</span>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Country *</label>
                      <select
                        {...register('hoa_country_id', { 
                          required: true,
                          onChange: handleCountryChange
                        })}
                        className="w-full bg-[#1e2f41] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75]"
                      >
                        {countries.map((c) => (
                          <option key={c.country_id} value={c.country_id}>{c.country_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">State *</label>
                      <select
                        {...register('hoa_state_id', { required: true })}
                        className="w-full bg-[#1e2f41] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75]"
                      >
                        {states.map((s) => (
                          <option key={s.state_id} value={s.state_id}>{s.state_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">City/Town *</label>
                      <input
                        type="text"
                        {...register('hoa_city', { required: 'Required' })}
                        className="w-full bg-[#1e2f41] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75]"
                      />
                      {errors.hoa_city && <span className="text-xs text-red-400">{errors.hoa_city.message}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-400 mb-1">HOA Address (Street Name & No) *</label>
                      <input
                        type="text"
                        {...register('hoa_address', { required: 'Required' })}
                        className="w-full bg-[#1e2f41] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75]"
                      />
                      {errors.hoa_address && <span className="text-xs text-red-400">{errors.hoa_address.message}</span>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Zip Code *</label>
                      <input
                        type="text"
                        {...register('hoa_zip_code', { required: 'Required' })}
                        className="w-full bg-[#1e2f41] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75]"
                      />
                      {errors.hoa_zip_code && <span className="text-xs text-red-400">{errors.hoa_zip_code.message}</span>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">HOA Contact Phone</label>
                    <input
                      type="text"
                      {...register('hoa_contact_number')}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-[#1e2f41] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75]"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: BILLING & CAPTCHA */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Billing Account & Security Captcha</h3>
                    <p className="text-xs text-gray-400">Input simulated payment details matching contract terms and pass the math check.</p>
                  </div>

                  {/* Payment selection */}
                  <div className="bg-[#1f3246] p-4 rounded-2xl border border-white/5 space-y-4">
                    <label className="block text-xs font-semibold text-gray-400 uppercase">Payment Method</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                        <input
                          type="radio"
                          value="bank_account"
                          {...register('payment_method')}
                          className="accent-[#1D9E75]"
                        />
                        <span className="flex items-center gap-1.5"><Landmark size={14} /> Bank Account (ACH)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                        <input
                          type="radio"
                          value="credit_card"
                          {...register('payment_method')}
                          className="accent-[#1D9E75]"
                        />
                        <span className="flex items-center gap-1.5"><CreditCard size={14} /> Credit/Debit Card</span>
                      </label>
                    </div>

                    {/* Conditional Payment fields */}
                    {paymentMethod === 'bank_account' ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Bank Name *</label>
                          <input
                            type="text"
                            {...register('bank_name', { required: paymentMethod === 'bank_account' })}
                            className="w-full bg-[#162535] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1D9E75]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Routing Number *</label>
                          <input
                            type="text"
                            {...register('routing_number', { required: paymentMethod === 'bank_account' })}
                            className="w-full bg-[#162535] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1D9E75] font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Account Number *</label>
                          <input
                            type="password"
                            {...register('account_number', { required: paymentMethod === 'bank_account' })}
                            className="w-full bg-[#162535] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1D9E75] font-mono"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-400 mb-1">Cardholder Name *</label>
                          <input
                            type="text"
                            {...register('cardholder_name', { required: paymentMethod === 'credit_card' })}
                            className="w-full bg-[#162535] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1D9E75]"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-400 mb-1">Card Number *</label>
                          <input
                            type="text"
                            {...register('card_number', { required: paymentMethod === 'credit_card' })}
                            className="w-full bg-[#162535] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1D9E75] font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Expiry Date *</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            {...register('card_expiry', { required: paymentMethod === 'credit_card' })}
                            className="w-full bg-[#162535] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1D9E75] font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">CVV *</label>
                          <input
                            type="password"
                            maxLength="4"
                            {...register('card_cvv', { required: paymentMethod === 'credit_card' })}
                            className="w-full bg-[#162535] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1D9E75] font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Captcha Section */}
                  <div className="p-4 bg-[#1f3246] rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Math Captcha Verification *</label>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold bg-[#162535] border border-white/10 px-4 py-2 rounded-xl text-yellow-400 font-mono tracking-widest select-none">
                          {loadingCaptcha ? '...' : captcha.question}
                        </span>
                        <button
                          type="button"
                          onClick={fetchCaptcha}
                          disabled={refreshing}
                          className="p-2 hover:bg-white/10 active:scale-95 bg-white/5 rounded-xl transition-all duration-150 text-gray-400 hover:text-teal-400 border border-transparent hover:border-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Refresh Captcha"
                        >
                          <RefreshCw
                            size={16}
                            className={`transition-transform duration-500 ${refreshing ? 'animate-spin text-teal-400' : 'hover:rotate-180'}`}
                          />
                        </button>
                      </div>
                    </div>
                    <div className="w-full md:w-44">
                      <label className="block text-xs font-medium text-gray-400 mb-1">Your Answer *</label>
                      <input
                        type="text"
                        {...register('captcha_answer', { required: 'Captcha is required' })}
                        placeholder="Result"
                        className="w-full bg-[#162535] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75] font-mono text-center font-bold text-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* NAVIGATION BUTTONS */}
              <div className="flex justify-between items-center border-t border-white/10 pt-6 mt-8">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition text-xs flex items-center gap-2"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                ) : (
                  <div></div>
                )}

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={step === 1 && !verifiedContract}
                    className="px-6 py-2.5 bg-[#1D9E75] hover:bg-[#15805d] disabled:bg-teal-800 disabled:opacity-50 text-white font-medium rounded-xl transition text-xs flex items-center gap-2"
                  >
                    Continue <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3 bg-[#1D9E75] hover:bg-[#15805d] disabled:bg-teal-800 text-white font-semibold rounded-xl transition text-sm flex items-center gap-2 shadow-lg shadow-teal-500/25"
                  >
                    {submitting ? <RefreshCw size={16} className="animate-spin" /> : 'Complete Registration'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
