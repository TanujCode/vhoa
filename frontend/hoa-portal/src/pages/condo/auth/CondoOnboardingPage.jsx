import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Building, CheckCircle, AlertCircle, Eye, EyeOff, 
  Lock, Mail, Phone, User, Key, MapPin, Shield, RefreshCw
} from 'lucide-react';
import AuthLayout from '../../../components/layout/AuthLayout';
import API from '../../../services/api';
import { verifyCondoContractCode, onboardCondoClient } from '../../../services/condoContractService';
import { validateEmail } from '../../../utils/emailValidation';
import {
  validateName, validateCity, validateZipCode,
  onlyLettersKeyPress, onlyZipKeyPress, onlyDigitsKeyPress
} from '../../../utils/fieldValidators';
import { formatPhoneAsYouType } from '../../../utils/phoneFormatter';

export default function CondoOnboardingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [contractVerified, setContractVerified] = useState(false);
  const [contractData, setContractData] = useState(null);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Captcha states
  const [captcha, setCaptcha] = useState({ question: '', token: '' });
  const [refreshingCaptcha, setRefreshingCaptcha] = useState(false);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    mode: 'onTouched',
    defaultValues: {
      contract_code: searchParams.get('code') || '',
      first_name: '',
      middle_name: '',
      last_name: '',
      email_id: '',
      mobile_number_only: '',
      password: '',
      confirm_password: '',
      condo_name: '',
      condo_address: '',
      condo_city: '',
      condo_state: '',
      condo_zip_code: '',
      captcha_answer: ''
    }
  });

  const contractCode = watch('contract_code');
  const password = watch('password');

  // Captcha helpers
  const generateLocalCaptcha = () => {
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1;
    return {
      question: `${num1} + ${num2} = ?`,
      token: `local_captcha_math:${num1}+${num2}`
    };
  };

  const fetchCaptcha = async () => {
    setCaptcha(generateLocalCaptcha());
    setValue('captcha_answer', '');
    try {
      setRefreshingCaptcha(true);
      const res = await API.get('/auth/captcha', { timeout: 2000 });
      setCaptcha({
        question: res.data.question,
        token: res.data.captcha_token
      });
    } catch (err) {
      console.warn('Failed to fetch captcha from server, keeping local captcha:', err);
    } finally {
      setRefreshingCaptcha(false);
    }
  };

  // Verify Contract Code
  const handleVerifyContract = async () => {
    if (!contractCode?.trim()) {
      setErrorMsg('Please enter a contract code.');
      return;
    }
    try {
      setVerifyingCode(true);
      setErrorMsg('');
      const data = await verifyCondoContractCode(contractCode.trim().toUpperCase());
      setContractData(data);
      setContractVerified(true);
      
      // Auto fill some fields if available in contract
      if (data.business_name) setValue('condo_name', data.business_name);
      if (data.client_name) {
        const parts = data.client_name.split(' ');
        if (parts.length >= 1) setValue('first_name', parts[0]);
        if (parts.length >= 2) setValue('last_name', parts[parts.length - 1]);
      }
      
      fetchCaptcha();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Invalid or inactive contract code.');
      setContractVerified(false);
      setContractData(null);
    } finally {
      setVerifyingCode(false);
    }
  };

  // Trigger verify on mount if code query parameter exists
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      handleVerifyContract();
    }
  }, []);

  // ZIP Code auto fill (US standard)
  const handleZipLookup = async (zipCode) => {
    const cleanZip = zipCode.replace(/[^0-9]/g, '');
    if (cleanZip.length === 5) {
      try {
        const response = await fetch(`https://api.zippopotam.us/us/${cleanZip}`);
        if (response.ok) {
          const data = await response.json();
          if (data.places && data.places.length > 0) {
            const place = data.places[0];
            setValue('condo_city', place['place name'].replace(/[^A-Za-z\s\-']/g, ''), { shouldValidate: true });
            setValue('condo_state', place['state abbreviation'].toUpperCase(), { shouldValidate: true });
          }
        }
      } catch (err) {
        console.warn("ZIP lookup failed:", err);
      }
    }
  };

  const onSubmit = async (data) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = {
        contract_code: data.contract_code.trim().toUpperCase(),
        first_name: data.first_name.strip ? data.first_name.strip() : data.first_name,
        middle_name: data.middle_name ? data.middle_name.trim() : null,
        last_name: data.last_name,
        email_id: data.email_id.toLowerCase().trim(),
        mobile_number: data.mobile_number_only ? `+1${data.mobile_number_only.replace(/\D/g, '')}` : null,
        password: data.password,
        confirm_password: data.confirm_password,
        condo_name: data.condo_name.trim(),
        condo_address: data.condo_address.trim(),
        condo_city: data.condo_city.trim(),
        condo_state: data.condo_state.trim(),
        condo_zip_code: data.condo_zip_code.trim(),
        captcha_token: captcha.token,
        captcha_answer: data.captcha_answer.trim()
      };

      await onboardCondoClient(payload);
      setSuccessMsg('Onboarding successful! Redirecting to email verification page...');
      
      // Auto trigger sending OTP in background
      try {
        await API.post('/condo/auth/otp/send', { email_id: payload.email_id });
      } catch (e) {
        console.error("Auto OTP send error:", e);
      }

      setTimeout(() => {
        navigate('/condo/verify-otp', { state: { email: payload.email_id } });
      }, 2500);

    } catch (err) {
      console.error('Onboarding API Error:', err);
      let errorMessage = 'Onboarding failed. Please review your entries.';
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          errorMessage = detail.map(d => `${d.loc?.[d.loc.length - 1] || 'field'}: ${d.msg}`).join(', ');
        } else {
          errorMessage = typeof detail === 'string' ? detail : JSON.stringify(detail);
        }
      } else if (err.response?.data) {
        errorMessage = JSON.stringify(err.response.data);
      }
      setErrorMsg(errorMessage);
      fetchCaptcha();
    }
  };

  return (
    <AuthLayout>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Building className="w-8 h-8 text-indigo-600" />
          Condo Onboarding
        </h2>
        <p className="text-gray-550 mt-1 text-sm">
          {!contractVerified 
            ? "Enter your client contract code to start onboarding." 
            : "Complete your High-Rise building and Manager account details."
          }
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {!contractVerified ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 tracking-wider mb-1">
              CONTRACT CODE *
            </label>
            <div className="relative">
              <input
                type="text"
                {...register('contract_code')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none pl-10 text-sm text-gray-900 bg-white font-mono uppercase"
                placeholder="CND-CON-XXXXXX"
              />
              <Key className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>
          <button
            onClick={handleVerifyContract}
            disabled={verifyingCode}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 cursor-pointer"
          >
            {verifyingCode ? 'Verifying Code...' : 'Verify Contract Code'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Contract Summary Box */}
          <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 text-xs text-indigo-900 space-y-1">
            <h4 className="font-bold flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Contract Verified:</h4>
            <p><strong>Client:</strong> {contractData?.client_name}</p>
            <p><strong>Building Name:</strong> {contractData?.business_name}</p>
            <p><strong>Building Size:</strong> {contractData?.size_of_the_building} Units</p>
            <p><strong>Subscription:</strong> {contractData?.plan_selected} ({contractData?.renewal_cycle} billing)</p>
          </div>

          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-4">1. Manager Account details</h3>
          
          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">FIRST NAME *</label>
              <input
                type="text"
                {...register('first_name', { required: 'Required', validate: validateName('First Name') })}
                onKeyPress={onlyLettersKeyPress}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm text-gray-900 bg-white ${
                  errors.first_name ? 'border-rose-500' : 'border-gray-300'
                }`}
                placeholder="e.g. David"
              />
              {errors.first_name && <p className="text-rose-500 text-[10px] mt-1">{errors.first_name.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">LAST NAME *</label>
              <input
                type="text"
                {...register('last_name', { required: 'Required', validate: validateName('Last Name') })}
                onKeyPress={onlyLettersKeyPress}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm text-gray-900 bg-white ${
                  errors.last_name ? 'border-rose-500' : 'border-gray-300'
                }`}
                placeholder="e.g. Miller"
              />
              {errors.last_name && <p className="text-rose-500 text-[10px] mt-1">{errors.last_name.message}</p>}
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">EMAIL ADDRESS *</label>
              <input
                type="email"
                {...register('email_id', { required: 'Required', validate: validateEmail })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm text-gray-900 bg-white ${
                  errors.email_id ? 'border-rose-500' : 'border-gray-300'
                }`}
                placeholder="pm@building.com"
              />
              {errors.email_id && <p className="text-rose-500 text-[10px] mt-1">{errors.email_id.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">MOBILE NUMBER (US Only)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm text-slate-400 font-mono">+1</span>
                <input
                  type="text"
                  maxLength={14}
                  {...register('mobile_number_only', {
                    validate: (val) => {
                      if (!val) return true; // Optional during signup
                      const digits = val.replace(/\D/g, '');
                      if (digits.length !== 10) return 'US number must be 10 digits';
                      return true;
                    }
                  })}
                  onChange={(e) => {
                    const formatted = formatPhoneAsYouType(e.target.value);
                    setValue('mobile_number_only', formatted, { shouldValidate: true });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none pl-9 text-sm text-gray-900 bg-white font-mono ${
                    errors.mobile_number_only ? 'border-rose-500' : 'border-gray-300'
                  }`}
                  placeholder="(123) 456-7890"
                />
              </div>
              {errors.mobile_number_only && <p className="text-rose-500 text-[10px] mt-1">{errors.mobile_number_only.message}</p>}
            </div>
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 font-sans">PASSWORD *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Required',
                    validate: {
                      len: v => v.length >= 8 || 'Min 8 characters',
                      upper: v => /[A-Z]/.test(v) || 'Needs one uppercase letter',
                      digit: v => /\d/.test(v) || 'Needs one number'
                    }
                  })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm text-gray-900 bg-white pl-9 ${
                    errors.password ? 'border-rose-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-rose-500 text-[10px] mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 font-sans">CONFIRM PASSWORD *</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirm_password', {
                    required: 'Required',
                    validate: v => v === password || 'Passwords do not match'
                  })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm text-gray-900 bg-white pl-9 ${
                    errors.confirm_password ? 'border-rose-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirm_password && <p className="text-rose-500 text-[10px] mt-1">{errors.confirm_password.message}</p>}
            </div>
          </div>

          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-4">2. Condo Building Details</h3>

          {/* Building Name and Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">BUILDING NAME *</label>
              <input
                type="text"
                {...register('condo_name', { required: 'Required' })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm text-gray-900 bg-white ${
                  errors.condo_name ? 'border-rose-500' : 'border-gray-300'
                }`}
                placeholder="e.g. Grand Towers"
              />
              {errors.condo_name && <p className="text-rose-500 text-[10px] mt-1">{errors.condo_name.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">STREET ADDRESS *</label>
              <input
                type="text"
                {...register('condo_address', { required: 'Required' })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm text-gray-900 bg-white ${
                  errors.condo_address ? 'border-rose-500' : 'border-gray-300'
                }`}
                placeholder="e.g. 500 Park Ave"
              />
              {errors.condo_address && <p className="text-rose-500 text-[10px] mt-1">{errors.condo_address.message}</p>}
            </div>
          </div>

          {/* ZIP, City, State */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">ZIP CODE *</label>
              <input
                type="text"
                maxLength={5}
                {...register('condo_zip_code', { required: 'Required', validate: validateZipCode })}
                onKeyPress={onlyZipKeyPress}
                onChange={(e) => handleZipLookup(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm text-gray-900 bg-white font-mono ${
                  errors.condo_zip_code ? 'border-rose-500' : 'border-gray-300'
                }`}
                placeholder="Zip"
              />
              {errors.condo_zip_code && <p className="text-rose-500 text-[10px] mt-1">{errors.condo_zip_code.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">CITY *</label>
              <input
                type="text"
                {...register('condo_city', { required: 'Required', validate: validateCity })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm text-gray-900 bg-white ${
                  errors.condo_city ? 'border-rose-500' : 'border-gray-300'
                }`}
                placeholder="City"
              />
              {errors.condo_city && <p className="text-rose-500 text-[10px] mt-1">{errors.condo_city.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">STATE *</label>
              <input
                type="text"
                maxLength={2}
                {...register('condo_state', { required: 'Required' })}
                onKeyPress={onlyLettersKeyPress}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm text-gray-900 bg-white uppercase font-mono ${
                  errors.condo_state ? 'border-rose-500' : 'border-gray-300'
                }`}
                placeholder="State"
              />
              {errors.condo_state && <p className="text-rose-500 text-[10px] mt-1">{errors.condo_state.message}</p>}
            </div>
          </div>

          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-4">3. Security Captcha</h3>

          {/* Captcha */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <div className="flex items-center gap-2 select-none font-bold text-gray-800 font-mono text-base border-r border-slate-200 pr-4 shrink-0">
              {captcha.question || "loading..."}
              <button
                type="button"
                onClick={fetchCaptcha}
                disabled={refreshingCaptcha}
                className="p-1 hover:bg-slate-200 text-gray-500 rounded-md transition cursor-pointer"
                title="Refresh Captcha"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshingCaptcha ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="relative w-full">
              <input
                type="text"
                {...register('captcha_answer', { required: 'Captcha is required' })}
                onKeyPress={onlyDigitsKeyPress}
                className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm text-gray-900 bg-white ${
                  errors.captcha_answer ? 'border-rose-500' : 'border-gray-300'
                }`}
                placeholder="Enter result"
              />
              {errors.captcha_answer && <p className="text-rose-500 text-[10px] mt-1">{errors.captcha_answer.message}</p>}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 shadow-lg shadow-indigo-600/10 cursor-pointer"
          >
            {isSubmitting ? 'Onboarding Building...' : 'Complete Onboarding'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
