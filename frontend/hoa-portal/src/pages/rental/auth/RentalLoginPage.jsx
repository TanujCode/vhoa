import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../../components/layout/AuthLayout';
import CaptchaBox from '../../../components/common/CaptchaBox';
import API from '../../../services/api';
import { useGoogleLogin } from '@react-oauth/google';
import { validateEmail } from '../../../utils/emailValidation';

export default function RentalLoginPage() {
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get('email') || '';
  const msgFromUrl = searchParams.get('msg') || '';
  const leaseIdFromUrl = searchParams.get('lease_id') || '';

  useEffect(() => {
    if (leaseIdFromUrl) {
      localStorage.setItem('pending_lease_id', leaseIdFromUrl);
    }
  }, [leaseIdFromUrl]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched' });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');
  const [successMsg, setSuccessMsg]     = useState('');
  const [infoMsg, setInfoMsg]           = useState('');
  const [show2FA, setShow2FA]           = useState(false);
  const [email2FA, setEmail2FA]         = useState('');
  const [otpFields, setOtpFields]       = useState(['', '', '', '', '', '']);
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [resending2FA, setResending2FA] = useState(false);
  
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
  const navigate = useNavigate();

  const fetchCaptcha = async () => {
    setCaptcha(generateLocalCaptcha());
    setValue('captchaAnswer', '');
    try {
      setRefreshing(true);
      const res = await API.get('/auth/captcha', { timeout: 2000 });
      const currentAnswer = watch('captchaAnswer');
      if (!currentAnswer || currentAnswer.trim() === '') {
        setCaptcha({
          question: res.data.question,
          token: res.data.captcha_token
        });
      }
    } catch (err) {
      console.warn('Failed to fetch captcha from server, keeping local captcha:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    API.get('/auth/captcha', { timeout: 2000 }).catch(() => {});
  }, []);

  useEffect(() => {
    if (emailFromUrl) {
      setValue('email', emailFromUrl);
    }
    if (msgFromUrl === 'already_registered') {
      setInfoMsg("You are already registered! Please log in to your account to view and complete your new application.");
    }
  }, [emailFromUrl, msgFromUrl, setValue]);

  const onSubmit = async (data) => {
    try {
      setErrorMsg('');
      const response = await API.post('/rental/auth/login', {
        email_id: data.email,
        password: data.password,
        captcha_token: captcha.token,
        captcha_answer: data.captchaAnswer,
      });

      if (response.data && response.data.requires_2fa) {
        setEmail2FA(data.email);
        setShow2FA(true);
        setSuccessMsg(response.data.message || 'OTP sent! Please check your email.');
        setErrorMsg('');
        return;
      }

      if (response.data && response.data.access_token) {
        localStorage.setItem('rental_token', response.data.access_token);
        if (response.data.session_token) {
          localStorage.setItem('rental_session_token', response.data.session_token);
        }
        localStorage.setItem('rental_user', JSON.stringify({
          user_id: response.data.user_id,
          role: response.data.role,
          role_name: response.data.role,
          full_name: response.data.full_name
        }));

        sessionStorage.removeItem('rental_token');
        sessionStorage.removeItem('rental_session_token');
        sessionStorage.removeItem('rental_user');
        
        const role = response.data.role || 'User';
        const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);
        setSuccessMsg(`${capitalizedRole} Login successful!`);
        setTimeout(() => navigate('/rental/dashboard', { replace: true }), 1000);
      }
    } catch (err) {
      console.error("Login Error Details:", err);
      const status = err.response?.status;
      let detail = err.response?.data?.detail || "Login failed";
      if (Array.isArray(detail)) {
        detail = detail.map(d => `${d.loc?.[d.loc.length - 1] || 'field'}: ${d.msg}`).join(', ');
      } else if (typeof detail === 'object') {
        detail = JSON.stringify(detail);
      }

      if (status === 403 && typeof detail === 'string' && detail.toLowerCase().includes("verify")) {
        setErrorMsg("Email not verified! Sending OTP...");
        try {
          await API.post('/rental/auth/otp/send', { 
            email_id: data.email,
            otp_type: 'email_verify' 
          }); 
        } catch (otpErr) {
          console.error("OTP send failed:", otpErr);
        }
        setTimeout(() => navigate('/rental/verify-otp', { state: { email: data.email, isRental: true } }), 2000);
      } else {
        setErrorMsg(detail);
        alert(detail);
      }
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setErrorMsg('');
      setSuccessMsg('');
      try {
        const response = await API.post('/rental/auth/google', {
          access_token: tokenResponse.access_token,
          flow: 'login',
        });

        if (response.data && response.data.access_token) {
          localStorage.setItem('rental_token', response.data.access_token);
          if (response.data.session_token) {
            localStorage.setItem('rental_session_token', response.data.session_token);
          }
          localStorage.setItem('rental_user', JSON.stringify({
            user_id: response.data.user_id,
            role: response.data.role,
            role_name: response.data.role,
            full_name: response.data.full_name
          }));
          sessionStorage.removeItem('rental_token');
          sessionStorage.removeItem('rental_session_token');
          sessionStorage.removeItem('rental_user');

          const role = response.data.role || 'User';
          const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);
          setSuccessMsg(`Google ${capitalizedRole} Login successful!`);
          setTimeout(() => navigate('/rental/dashboard', { replace: true }), 1000);
        }
      } catch (err) {
        console.error('Google Auth Error:', err);
        let errorMessage = 'Google Authentication failed.';
        if (err.response?.data?.detail) {
          const detail = err.response.data.detail;
          if (Array.isArray(detail)) {
            errorMessage = detail.map(d => `${d.loc?.[d.loc.length - 1] || 'field'}: ${d.msg}`).join(', ');
          } else {
            errorMessage = typeof detail === 'string' ? detail : JSON.stringify(detail);
          }
        }
        setErrorMsg(errorMessage);
        alert(errorMessage);
      }
    },
    onError: (error) => {
      console.error('Google Login Failed:', error);
      setErrorMsg('Google Authentication failed. Please try again.');
      alert('Google Authentication failed. Please try again.');
    }
  });

  const handleGoogleLogin = () => {
    const clientIdClean = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').replace(/['"]/g, "").trim();
    if (!clientIdClean || clientIdClean === 'PLACEHOLDER_CLIENT_ID') {
      setErrorMsg('Google Login is not configured. Please add VITE_GOOGLE_CLIENT_ID in your frontend .env file.');
      return;
    }
    googleLogin();
  };

  const handleOtpFieldChange = (index, value) => {
    const val = value.replace(/\D/g, '');
    if (!val) {
      const newFields = [...otpFields];
      newFields[index] = '';
      setOtpFields(newFields);
      return;
    }

    const digit = val.slice(-1);
    const newFields = [...otpFields];
    newFields[index] = digit;
    setOtpFields(newFields);

    if (index < 5 && digit) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }

    const completedOtp = newFields.join('');
    if (completedOtp.length === 6) {
      trigger2FAVerification(completedOtp);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      const currentVal = otpFields[index];
      if (!currentVal && index > 0) {
        const newFields = [...otpFields];
        newFields[index - 1] = '';
        setOtpFields(newFields);
        const prevInput = document.getElementById(`otp-input-${index - 1}`);
        prevInput?.focus();
      } else {
        const newFields = [...otpFields];
        newFields[index] = '';
        setOtpFields(newFields);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasteData.length === 6) {
      const newFields = pasteData.split('');
      setOtpFields(newFields);
      document.getElementById('otp-input-5')?.focus();
      trigger2FAVerification(pasteData);
    } else {
      const newFields = [...otpFields];
      for (let i = 0; i < pasteData.length; i++) {
        newFields[i] = pasteData[i];
      }
      setOtpFields(newFields);
      const nextFocusIndex = Math.min(pasteData.length, 5);
      document.getElementById(`otp-input-${nextFocusIndex}`)?.focus();
    }
  };

  const trigger2FAVerification = async (code) => {
    setVerifying2FA(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await API.post('/rental/auth/login/verify-2fa', {
        email_id: email2FA,
        otp_code: code,
      });

      if (res.data && res.data.access_token) {
        localStorage.setItem('rental_token', res.data.access_token);
        if (res.data.session_token) {
          localStorage.setItem('rental_session_token', res.data.session_token);
        }
        localStorage.setItem('rental_user', JSON.stringify({
          user_id: res.data.user_id,
          role: res.data.role,
          role_name: res.data.role,
          full_name: res.data.full_name
        }));

        sessionStorage.removeItem('rental_token');
        sessionStorage.removeItem('rental_session_token');
        sessionStorage.removeItem('rental_user');

        const role = res.data.role || 'User';
        const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);
        setSuccessMsg(`${capitalizedRole} Verification successful! Logging in...`);
        setTimeout(() => navigate('/rental/dashboard', { replace: true }), 1000);
      }
    } catch (err) {
      console.error("2FA Verification Error:", err);
      const detail = err.response?.data?.detail || "Verification failed";
      setErrorMsg(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setVerifying2FA(false);
    }
  };

  const handle2FASubmit = (e) => {
    e.preventDefault();
    const completedOtp = otpFields.join('');
    if (completedOtp.length === 6) {
      trigger2FAVerification(completedOtp);
    } else {
      setErrorMsg('Please enter all 6 digits.');
    }
  };

  const handleResend2FA = async () => {
    setResending2FA(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await API.post('/rental/auth/otp/send', {
        email_id: email2FA,
        otp_type: 'login_2fa'
      });
      setSuccessMsg('Code resent successfully! Please check your email.');
      setOtpFields(['', '', '', '', '', '']);
      setTimeout(() => document.getElementById('otp-input-0')?.focus(), 100);
    } catch (err) {
      console.error("2FA Resend Error:", err);
      const detail = err.response?.data?.detail || "Resend failed";
      setErrorMsg(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setResending2FA(false);
    }
  };

  if (show2FA) {
    return (
      <AuthLayout>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Security Verification
          </h2>
          <p className="text-gray-600 mt-2 text-sm">
            We have sent a 6-digit verification code to <span className="font-semibold text-gray-900">{email2FA}</span>. Please enter the code below to complete your login.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 text-sm rounded-lg">
            {successMsg}
          </div>
        )}

        <form onSubmit={handle2FASubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 tracking-wider mb-3 text-center">
              6-DIGIT VERIFICATION CODE
            </label>
            <div className="flex justify-between gap-2 max-w-xs mx-auto">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  id={`otp-input-${index}`}
                  type="text"
                  maxLength="1"
                  value={otpFields[index]}
                  onChange={(e) => handleOtpFieldChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-10 h-12 text-center font-mono font-bold text-xl border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none bg-white text-gray-900 shadow-sm transition-all duration-150"
                  required
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={verifying2FA}
            className="w-full bg-[#0F2D59] hover:bg-[#0c2345] text-white py-2.5 px-4 rounded-lg font-medium transition duration-200 disabled:opacity-50 shadow-md"
          >
            {verifying2FA ? 'Verifying...' : 'Verify & Login'}
          </button>

          <div className="flex flex-col items-center gap-3 text-sm">
            <button
              type="button"
              onClick={handleResend2FA}
              disabled={resending2FA}
              className="text-blue-600 hover:text-blue-500 font-medium disabled:opacity-50"
            >
              {resending2FA ? 'Resending...' : 'Resend Code'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShow2FA(false);
                setOtpFields(['', '', '', '', '', '']);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-gray-500 hover:text-gray-700 font-medium"
            >
              Back to Login
            </button>
          </div>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
          NestBloq Rental Management
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          Access your Landlord Portfolio or Tenant Portal
        </p>
      </div>

      {infoMsg && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{infoMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 text-sm rounded-lg">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-gray-700 tracking-wider mb-1">
            EMAIL ADDRESS
          </label>
          <div className="relative">
            <input
              type="email"
              {...register('email', {
                required: 'Email is required',
                validate: validateEmail,
              })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none pl-10 text-sm text-gray-900 bg-white dark:text-gray-900 dark:bg-white ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="name@company.com"
            />
            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-bold text-gray-700 tracking-wider mb-1">
            PASSWORD
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password', { required: 'Password is required' })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none pl-10 text-sm text-gray-900 bg-white dark:text-gray-900 dark:bg-white ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="••••••••"
            />
            <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-end text-sm">
          <Link to="/rental/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Forgot password?
          </Link>
        </div>

        {/* Anti-Bot Security Verification */}
        <CaptchaBox
          question={captcha.question}
          loading={loadingCaptcha}
          refreshing={refreshing}
          onRefresh={fetchCaptcha}
          register={register}
          error={errors.captchaAnswer}
          label="ENTER CAPTCHA"
          helperText="Solve the calculation in the box above."
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#0F2D59] hover:bg-[#0c2345] text-white py-2.5 px-4 rounded-lg font-medium transition duration-200 disabled:opacity-50 shadow-md"
        >
          {isSubmitting ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      {/* Google Button */}
      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 border border-gray-300 bg-white py-2 px-4 rounded-lg hover:bg-gray-50 transition duration-200 text-sm text-gray-700 font-medium"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.21-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.05-3.71 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Sign in with Google
      </button>

      <div className="text-center mt-3 text-sm text-gray-600">
        New user?{' '}
        <Link to="/rental/register" className="font-medium text-[#0F2D59] hover:underline">
          Sign Up
        </Link>
      </div>
    </AuthLayout>
  );
}
