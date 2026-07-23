import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../../components/layout/AuthLayout';
import API from '../../../services/api';
import { useGoogleLogin } from '@react-oauth/google';
import { validateEmail } from '../../../utils/emailValidation';
import ConfirmModal from '../../../components/ConfirmModal';

export default function CondoLoginPage() {
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get('email') || '';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched' });

  const [confirmConfig, setConfirmConfig] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    confirmText: 'OK', 
    cancelText: 'Cancel', 
    onConfirm: null, 
    onCancel: null, 
    type: 'info', 
    singleButton: false 
  });

  const showAlert = (title, message, type = 'info') => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      confirmText: 'OK',
      singleButton: true,
      type,
      onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');
  const [successMsg, setSuccessMsg]     = useState('');
  
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
    setValue('captchaAnswer', ''); // Reset form input

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
    if (emailFromUrl) {
      setValue('email', emailFromUrl);
    }
    // Ping backend in background on mount
    API.get('/auth/captcha', { timeout: 2000 }).catch(() => {});
  }, [emailFromUrl, setValue]);

  const onSubmit = async (data) => {
    try {
      setErrorMsg('');
      const response = await API.post('/condo/auth/login', {
        email_id: data.email,
        password: data.password,
        captcha_token: captcha.token,
        captcha_answer: data.captchaAnswer,
      });

      if (response.data && response.data.access_token) {
        const userData = response.data.user;
        localStorage.setItem('condo_token', response.data.access_token);
        if (response.data.session_token) {
          localStorage.setItem('condo_session_token', response.data.session_token);
        }
        localStorage.setItem('condo_user', JSON.stringify(userData));

        sessionStorage.removeItem('condo_token');
        sessionStorage.removeItem('condo_session_token');
        sessionStorage.removeItem('condo_user');

        const role = (userData?.role_name || userData?.role || '').toLowerCase();
        const communityId = userData?.community_id;

        setSuccessMsg(`Login successful!`);
        setTimeout(() => {
          if (role === 'resident' && (!communityId || communityId === 0 || communityId === null)) {
            if (userData?.account_status === 'PENDING_APPROVAL') {
              navigate('/condo/waiting-approval', { replace: true });
            } else {
              navigate('/condo/join-community', { replace: true });
            }
          } else {
            navigate('/condo/dashboard', { replace: true });
          }
        }, 1000);
      }
    } catch (err) {
      console.error("Condo Login Error Details:", err);
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
          await API.post('/condo/auth/otp/send', { email_id: data.email }); 
        } catch (otpErr) {
          console.error("OTP send failed:", otpErr);
        }
        setTimeout(() => navigate('/condo/verify-otp', { state: { email: data.email } }), 2000);
      } else {
        setErrorMsg(detail);
        showAlert("Login Error", detail, "danger");
        fetchCaptcha();
      }
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setErrorMsg('');
      setSuccessMsg('');
      try {
        const response = await API.post('/condo/auth/google', {
          access_token: tokenResponse.access_token,
          flow: 'login'
        });

        if (response.data && response.data.access_token) {
          const userData = response.data.user;
          localStorage.setItem('condo_token', response.data.access_token);
          if (response.data.session_token) {
            localStorage.setItem('condo_session_token', response.data.session_token);
          }
          localStorage.setItem('condo_user', JSON.stringify(userData));

          sessionStorage.removeItem('condo_token');
          sessionStorage.removeItem('condo_session_token');
          sessionStorage.removeItem('condo_user');

          const role = (userData?.role_name || userData?.role || '').toLowerCase();
          const communityId = userData?.community_id;

          setSuccessMsg('Google Login successful!');
          
          setTimeout(() => {
            if (role === 'resident' && (!communityId || communityId === 0 || communityId === null)) {
              if (userData?.account_status === 'PENDING_APPROVAL') {
                navigate('/condo/waiting-approval', { replace: true });
              } else {
                navigate('/condo/join-community', { replace: true });
              }
            } else {
              navigate('/condo/dashboard', { replace: true });
            }
          }, 1500);
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
      }
    },
    onError: (error) => {
      console.error('Google Login Failed:', error);
      setErrorMsg('Google Authentication failed. Please try again.');
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

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          Condo Login
        </h2>
        <p className="text-gray-650 mt-1 text-sm">
          Access your high-rise building and community management dashboard.
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
              placeholder="name@condo.com"
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
          <Link to="/condo/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Forgot password?
          </Link>
        </div>

        {/* Captcha Section */}
        <div className="p-4 bg-slate-50 border border-gray-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2">CAPTCHA *</label>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold bg-white border border-gray-300 px-4 py-2 rounded-xl text-yellow-600 font-mono tracking-widest select-none">
                {loadingCaptcha ? '...' : captcha.question}
              </span>
              <button
                type="button"
                onClick={fetchCaptcha}
                disabled={refreshing}
                className="p-2 bg-slate-100 hover:bg-blue-50 active:scale-95 rounded-xl transition-all duration-150 text-slate-400 hover:text-blue-500 border border-transparent hover:border-blue-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                title="Refresh Captcha"
              >
                <RefreshCw
                  size={16}
                  className={`transition-transform duration-500 ${refreshing ? 'animate-spin text-blue-500' : 'hover:rotate-180'}`}
                />
              </button>
            </div>
          </div>
          <div className="w-full sm:w-32">
            <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2">ANSWER *</label>
            <input
              type="text"
              {...register('captchaAnswer', { 
                required: 'Answer is required',
                pattern: {
                  value: /^[0-9]+$/,
                  message: 'Numbers only'
                }
              })}
              onKeyPress={(e) => {
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              placeholder="Result"
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-center font-bold text-lg"
            />
            {errors.captchaAnswer && (
              <p className="text-red-500 text-xs mt-1">{errors.captchaAnswer.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#0F2D59] hover:bg-[#0c2345] text-white py-2.5 px-4 rounded-lg font-medium transition duration-200 disabled:opacity-50 shadow-md cursor-pointer"
        >
          {isSubmitting ? 'Signing in...' : 'Sign In to Condo Portal'}
        </button>
      </form>

      {/* Google Button */}
      <div className="relative my-6">
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
        className="w-full flex items-center justify-center gap-3 border border-gray-300 bg-white py-2 px-4 rounded-lg hover:bg-gray-50 transition duration-200 text-sm text-gray-700 font-medium cursor-pointer"
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

      <div className="text-center mt-6 text-sm text-gray-650">
        Looking to list your tower?{' '}
        <Link to="/condo/register" className="font-medium text-[#0F2D59] hover:underline">
          Register Building
        </Link>
      </div>
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        type={confirmConfig.type}
        singleButton={confirmConfig.singleButton}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </AuthLayout>
  );
}
