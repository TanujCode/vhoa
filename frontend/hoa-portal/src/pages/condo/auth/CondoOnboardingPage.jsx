import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building, CheckCircle, AlertCircle, Eye, EyeOff,
  Lock, Mail, Key, MapPin, Shield, RefreshCw,
  ChevronRight, ChevronLeft, User, Loader2
} from 'lucide-react';
import Logo from '../../../components/marketing/Logo';
import API from '../../../services/api';
import { verifyCondoContractCode, onboardCondoClient } from '../../../services/condoContractService';
import { validateEmail } from '../../../utils/emailValidation';
import {
  validateName, validateCity, validateZipCode,
  validateBusinessName, validateAddress,
  onlyLettersKeyPress, onlyZipKeyPress, onlyDigitsKeyPress
} from '../../../utils/fieldValidators';
import { formatPhoneAsYouType } from '../../../utils/phoneFormatter';

const STEPS = [
  { id: 1, label: 'Verify', icon: Key },
  { id: 2, label: 'Account', icon: User },
  { id: 3, label: 'Building', icon: Building },
  { id: 4, label: 'Security', icon: Shield }
];

export default function CondoOnboardingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [contractVerified, setContractVerified] = useState(false);
  const [contractData, setContractData] = useState(null);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [zipLoading, setZipLoading] = useState(false);
  const [captcha, setCaptcha] = useState({ question: '', token: '' });
  const [refreshingCaptcha, setRefreshingCaptcha] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, setValue, watch, trigger, formState: { errors, isSubmitting } } = useForm({
    mode: 'onTouched',
    defaultValues: {
      contract_code: searchParams.get('code') || '',
      first_name: '', middle_name: '', last_name: '',
      email_id: '', mobile_number_only: '',
      password: '', confirm_password: '',
      condo_name: '', condo_address: '',
      condo_city: '', condo_state: '', condo_zip_code: '',
      captcha_answer: ''
    }
  });

  const contractCode = watch('contract_code');
  const password = watch('password');

  const generateLocalCaptcha = () => {
    const n1 = Math.floor(Math.random() * 9) + 1;
    const n2 = Math.floor(Math.random() * 9) + 1;
    return { question: `${n1} + ${n2} = ?`, token: `local_captcha_math:${n1}+${n2}` };
  };

  const fetchCaptcha = async () => {
    setCaptcha(generateLocalCaptcha());
    setValue('captcha_answer', '');
    try {
      setRefreshingCaptcha(true);
      const res = await API.get('/auth/captcha', { timeout: 2000 });
      setCaptcha({ question: res.data.question, token: res.data.captcha_token });
    } catch { /* keep local */ } finally { setRefreshingCaptcha(false); }
  };

  const handleVerifyContract = async () => {
    if (!contractCode?.trim()) { setErrorMsg('Please enter a contract code.'); return; }
    try {
      setVerifyingCode(true); setErrorMsg('');
      const data = await verifyCondoContractCode(contractCode.trim().toUpperCase());
      setContractData(data); setContractVerified(true);
      if (data.business_name) setValue('condo_name', data.business_name);
      if (data.client_name) {
        const parts = data.client_name.split(' ');
        if (parts.length >= 1) setValue('first_name', parts[0]);
        if (parts.length >= 2) setValue('last_name', parts[parts.length - 1]);
      }
      fetchCaptcha(); setStep(2);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Invalid or inactive contract code.');
    } finally { setVerifyingCode(false); }
  };

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) handleVerifyContract();
  }, []);

  const handleZipLookup = async (zip) => {
    const clean = zip.replace(/[^0-9]/g, '');
    if (clean.length === 5) {
      try {
        setZipLoading(true);
        const r = await fetch(`https://api.zippopotam.us/us/${clean}`);
        if (r.ok) {
          const d = await r.json();
          if (d.places?.length > 0) {
            setValue('condo_city', d.places[0]['place name'].replace(/[^A-Za-z\s\-']/g, ''), { shouldValidate: true });
            setValue('condo_state', d.places[0]['state abbreviation'].toUpperCase(), { shouldValidate: true });
          }
        }
      } catch { /* silent */ } finally { setZipLoading(false); }
    }
  };

  const handleNext = async () => {
    setErrorMsg('');
    const fieldsMap = {
      2: ['first_name', 'last_name', 'email_id', 'password', 'confirm_password'],
      3: ['condo_name', 'condo_address', 'condo_zip_code', 'condo_city', 'condo_state']
    };
    const valid = !fieldsMap[step] || await trigger(fieldsMap[step]);
    if (valid) setStep(s => s + 1);
  };

  const onSubmit = async (data) => {
    setErrorMsg(''); setSuccessMsg('');
    try {
      const payload = {
        contract_code: data.contract_code.trim().toUpperCase(),
        first_name: data.first_name.trim(), middle_name: data.middle_name?.trim() || null,
        last_name: data.last_name.trim(), email_id: data.email_id.toLowerCase().trim(),
        mobile_number: data.mobile_number_only ? `+1${data.mobile_number_only.replace(/\D/g, '')}` : null,
        password: data.password, confirm_password: data.confirm_password,
        condo_name: data.condo_name.trim(), condo_address: data.condo_address.trim(),
        condo_city: data.condo_city.trim(), condo_state: data.condo_state.trim(),
        condo_zip_code: data.condo_zip_code.trim(),
        captcha_token: captcha.token, captcha_answer: data.captcha_answer.trim()
      };
      await onboardCondoClient(payload);
      setSuccessMsg('Onboarding successful! Redirecting to email verification...');
      try { await API.post('/condo/auth/otp/send', { email_id: payload.email_id }); } catch { /**/ }
      setTimeout(() => navigate('/condo/verify-otp', { state: { email: payload.email_id } }), 2500);
    } catch (err) {
      let msg = 'Onboarding failed. Please review your entries.';
      const detail = err.response?.data?.detail;
      if (detail) msg = Array.isArray(detail) ? detail.map(d => `${d.loc?.[d.loc.length - 1]}: ${d.msg}`).join(', ') : String(detail);
      setErrorMsg(msg); fetchCaptcha();
    }
  };

  const inp = (err) => `w-full px-3 py-2 border rounded-xl text-sm outline-none transition bg-white dark:bg-slate-900/60 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 ${err ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20' : 'border-slate-200 dark:border-white/10'}`;
  const lbl = 'block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1';
  const err_cls = 'text-rose-500 text-[10px] mt-0.5 font-medium';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/60 to-slate-200 dark:from-[#080F1E] dark:via-[#0D1830] dark:to-[#080F1E] flex items-center justify-center p-3">
      <div className="w-full max-w-lg">

        {/* Logo + Title */}
        <div className="text-center mb-5">
          <div className="flex justify-center mb-2">
            <Logo className="h-8" variant="currentColor" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Condo Building Onboarding</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {!contractVerified ? 'Enter your contract code to begin.' : 'Complete building and manager account setup.'}
          </p>
        </div>

        {/* Step Progress — shown after verification */}
        {contractVerified && (
          <div className="flex items-center justify-center mb-4">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const done = step > s.id, cur = step === s.id;
              return (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col items-center gap-0.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${done ? 'bg-emerald-500 border-emerald-500' : cur ? 'bg-indigo-600 border-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10'}`}>
                      {done ? <CheckCircle className="w-4 h-4 text-white" /> : <Icon className={`w-3.5 h-3.5 ${cur ? 'text-white' : 'text-slate-400'}`} />}
                    </div>
                    <span className={`text-[9px] font-bold hidden sm:block ${cur ? 'text-indigo-600 dark:text-indigo-400' : done ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>{s.label}</span>
                  </div>
                  {idx < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1.5 rounded-full transition-all ${step > s.id ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-white/10'}`} />}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Card */}
        <div className="bg-white dark:bg-[#1A2A3E] rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
          {/* Header bar */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              {React.createElement(STEPS[step - 1].icon, { className: 'w-4 h-4 text-white' })}
            </div>
            <div>
              <p className="text-indigo-200 text-[10px] font-semibold uppercase tracking-wider">Step {step} of {STEPS.length}</p>
              <h2 className="text-white font-bold text-sm">{STEPS[step - 1].label}</h2>
            </div>
          </div>

          <div className="p-5">
            {/* Alerts */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>{successMsg}</span>
              </div>
            )}

            {/* ── STEP 1: Verify Contract ── */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-slate-500 dark:text-slate-400 text-xs">Your sales agent should have provided a contract code. Enter it below to begin.</p>
                <div>
                  <label className={lbl}>Contract Code *</label>
                  <div className="relative">
                    <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input type="text" {...register('contract_code')} className={`${inp(false)} pl-9 font-mono uppercase`} placeholder="CND-CON-XXXXXX" />
                  </div>
                </div>
                <button type="button" onClick={handleVerifyContract} disabled={verifyingCode}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-indigo-500/20 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer">
                  {verifyingCode ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...</> : <><Key className="w-3.5 h-3.5" /> Verify Contract Code</>}
                </button>
                <p className="text-center text-xs text-slate-400">Already have an account?{' '}
                  <button type="button" onClick={() => navigate('/condo/login')} className="text-indigo-600 hover:underline font-semibold cursor-pointer">Sign in</button>
                </p>
              </div>
            )}

            {/* Contract summary card (steps 2–4) */}
            {contractVerified && step > 1 && contractData && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Contract Verified</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                  <span><span className="text-slate-400">Client:</span> {contractData.client_name}</span>
                  <span><span className="text-slate-400">Building:</span> {contractData.business_name}</span>
                  <span><span className="text-slate-400">Plan:</span> {contractData.plan_selected}</span>
                  <span><span className="text-slate-400">Units:</span> {contractData.size_of_the_building}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* ── STEP 2: Manager Account ── */}
              {step === 2 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className={lbl}>First Name *</label>
                      <input type="text" {...register('first_name', { required: 'Required', validate: validateName('First Name') })} onKeyPress={onlyLettersKeyPress} className={inp(!!errors.first_name)} placeholder="David" />
                      {errors.first_name && <p className={err_cls}>{errors.first_name.message}</p>}
                    </div>
                    <div>
                      <label className={lbl}>Middle</label>
                      <input type="text" {...register('middle_name')} onKeyPress={onlyLettersKeyPress} className={inp(false)} placeholder="Optional" />
                    </div>
                    <div>
                      <label className={lbl}>Last Name *</label>
                      <input type="text" {...register('last_name', { required: 'Required', validate: validateName('Last Name') })} onKeyPress={onlyLettersKeyPress} className={inp(!!errors.last_name)} placeholder="Miller" />
                      {errors.last_name && <p className={err_cls}>{errors.last_name.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className={lbl}>Email Address *</label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input type="email" {...register('email_id', { required: 'Required', validate: validateEmail })} className={`${inp(!!errors.email_id)} pl-9`} placeholder="pm@building.com" />
                      </div>
                      {errors.email_id && <p className={err_cls}>{errors.email_id.message}</p>}
                    </div>
                    <div>
                      <label className={lbl}>Mobile (US)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">+1</span>
                        <input type="text" maxLength={14} {...register('mobile_number_only', { validate: v => !v || v.replace(/\D/g,'').length === 10 || '10 digits required' })}
                          onChange={e => setValue('mobile_number_only', formatPhoneAsYouType(e.target.value), { shouldValidate: true })}
                          className={`${inp(!!errors.mobile_number_only)} pl-8 font-mono`} placeholder="(123) 456-7890" />
                      </div>
                      {errors.mobile_number_only && <p className={err_cls}>{errors.mobile_number_only.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className={lbl}>Password *</label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input type={showPassword ? 'text' : 'password'} {...register('password', { required: 'Required', validate: { len: v => v.length >= 8 || 'Min 8 chars', upper: v => /[A-Z]/.test(v) || 'Needs uppercase', digit: v => /\d/.test(v) || 'Needs a number' } })} className={`${inp(!!errors.password)} pl-9 pr-9`} placeholder="••••••••" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer">{showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
                      </div>
                      {errors.password && <p className={err_cls}>{errors.password.message}</p>}
                    </div>
                    <div>
                      <label className={lbl}>Confirm Password *</label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input type={showConfirmPassword ? 'text' : 'password'} {...register('confirm_password', { required: 'Required', validate: v => v === password || 'Passwords do not match' })} className={`${inp(!!errors.confirm_password)} pl-9 pr-9`} placeholder="••••••••" />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer">{showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
                      </div>
                      {errors.confirm_password && <p className={err_cls}>{errors.confirm_password.message}</p>}
                    </div>
                  </div>

                  {/* Compact password hints */}
                  <div className="flex gap-3 text-[10px]">
                    {[{ label: '8+ chars', ok: (password||'').length >= 8 }, { label: 'Uppercase', ok: /[A-Z]/.test(password||'') }, { label: 'Number', ok: /\d/.test(password||'') }].map((r, i) => (
                      <span key={i} className={`flex items-center gap-1 ${r.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${r.ok ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} /> {r.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── STEP 3: Building Details ── */}
              {step === 3 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className={lbl}>Building Name *</label>
                      <div className="relative">
                        <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input type="text" {...register('condo_name', { required: 'Required', validate: validateBusinessName })} className={`${inp(!!errors.condo_name)} pl-9`} placeholder="e.g. Grand Towers" />
                      </div>
                      {errors.condo_name && <p className={err_cls}>{errors.condo_name.message}</p>}
                    </div>
                    <div>
                      <label className={lbl}>Street Address *</label>
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input type="text" {...register('condo_address', { required: 'Required', validate: validateAddress })} className={`${inp(!!errors.condo_address)} pl-9`} placeholder="e.g. 500 Park Ave" />
                      </div>
                      {errors.condo_address && <p className={err_cls}>{errors.condo_address.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className={lbl}>Zip Code *</label>
                      <div className="relative">
                        <input type="text" maxLength={5} {...register('condo_zip_code', { required: 'Required', validate: validateZipCode })} onKeyPress={onlyZipKeyPress}
                          onChange={e => { setValue('condo_zip_code', e.target.value, { shouldValidate: true }); handleZipLookup(e.target.value); }}
                          className={`${inp(!!errors.condo_zip_code)} font-mono`} placeholder="Zip" />
                        {zipLoading && <Loader2 className="w-3 h-3 text-indigo-500 animate-spin absolute right-2.5 top-2.5" />}
                      </div>
                      {errors.condo_zip_code && <p className={err_cls}>{errors.condo_zip_code.message}</p>}
                      {!errors.condo_zip_code && <p className="text-[9px] text-slate-400 mt-0.5">Auto-fills below</p>}
                    </div>
                    <div>
                      <label className={lbl}>City *</label>
                      <input type="text" {...register('condo_city', { required: 'Required', validate: validateCity })} className={inp(!!errors.condo_city)} placeholder="City" />
                      {errors.condo_city && <p className={err_cls}>{errors.condo_city.message}</p>}
                    </div>
                    <div>
                      <label className={lbl}>State *</label>
                      <input type="text" maxLength={2} {...register('condo_state', { required: 'Required' })} onKeyPress={onlyLettersKeyPress} className={`${inp(!!errors.condo_state)} uppercase font-mono`} placeholder="CA" />
                      {errors.condo_state && <p className={err_cls}>{errors.condo_state.message}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 4: Security / Captcha ── */}
              {step === 4 && (
                <div className="space-y-3">
                  {/* Quick review */}
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800/40 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 grid grid-cols-2 gap-x-4 gap-y-1">
                    <span><span className="text-slate-400">Manager:</span> {watch('first_name')} {watch('last_name')}</span>
                    <span><span className="text-slate-400">Email:</span> {watch('email_id')}</span>
                    <span><span className="text-slate-400">Building:</span> {watch('condo_name')}</span>
                    <span><span className="text-slate-400">Location:</span> {watch('condo_city')}, {watch('condo_state')} {watch('condo_zip_code')}</span>
                  </div>

                  {/* Captcha */}
                  <div>
                    <label className={lbl}>Security Challenge *</label>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/10 rounded-xl">
                      <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 font-mono text-base border-r border-slate-200 dark:border-white/10 pr-3 shrink-0">
                        {captcha.question || '...'}
                        <button type="button" onClick={fetchCaptcha} disabled={refreshingCaptcha} className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 rounded-md cursor-pointer transition">
                          <RefreshCw className={`w-3 h-3 ${refreshingCaptcha ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                      <input type="text" {...register('captcha_answer', { required: 'Required' })} onKeyPress={onlyDigitsKeyPress} className={`${inp(!!errors.captcha_answer)} flex-1`} placeholder="Answer" />
                    </div>
                    {errors.captcha_answer && <p className={err_cls}>{errors.captcha_answer.message}</p>}
                  </div>

                  <button type="submit" disabled={isSubmitting}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-indigo-500/20 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer">
                    {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting Up...</> : <><CheckCircle className="w-4 h-4" /> Complete Onboarding</>}
                  </button>
                </div>
              )}

              {/* Navigation (steps 2-3) */}
              {step >= 2 && step < 4 && (
                <div className="flex gap-2.5 mt-4 pt-4 border-t border-slate-100 dark:border-white/10">
                  <button type="button" onClick={() => { setErrorMsg(''); setStep(s => s - 1); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition cursor-pointer">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button type="button" onClick={handleNext}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition shadow-md shadow-indigo-500/20 cursor-pointer">
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
              {step === 4 && (
                <button type="button" onClick={() => { setErrorMsg(''); setStep(3); }}
                  className="flex items-center gap-1 mt-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition">
                  <ChevronLeft className="w-3.5 h-3.5" /> Back to Building Details
                </button>
              )}
            </form>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-4">
          © {new Date().getFullYear()} NestBloq · Condo Management Platform
        </p>
      </div>
    </div>
  );
}
