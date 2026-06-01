import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Lock, User, Eye, EyeOff, Phone, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import API from '../../services/api';
import { useGoogleLogin } from '@react-oauth/google';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
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
    // Generate new local captcha instantly to avoid empty state or delays
    setCaptcha(generateLocalCaptcha());
    setValue('captchaAnswer', ''); // Reset form input

    try {
      setRefreshing(true);
      const res = await API.get('/auth/captcha', { timeout: 2000 });
      // If user hasn't started typing in the new captcha answer yet, we can safely sync with backend JWT captcha
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
    // Ping backend in background on mount to wake it up from cold-start sleep
    API.get('/auth/captcha', { timeout: 2000 }).catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
  });

  // Password value track karne ke liye for confirm password match
  const password = watch('password');

  const onSubmit = async (data) => {
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await API.post('/auth/register', {
        full_name: data.fullName,
        email_id: data.email, // Backend `email_id` expect kar raha hai
        password: data.password,
        confirm_password: data.confirmPassword, // Naya field
        role: 'resident', // Public signup is restricted to Resident accounts only
        mobile_number: data.mobileNumber || '', // Naya optional field
        time_zone: 'America/New_York', // Default timezone
        captcha_token: captcha.token,
        captcha_answer: data.captchaAnswer,
      });

      setSuccessMsg('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('API Error:', err);
      let errorMessage = 'Failed to register. Please check your inputs.';
      
      if (err.response?.data?.detail) {
        errorMessage = typeof err.response.data.detail === 'string' 
          ? err.response.data.detail 
          : JSON.stringify(err.response.data.detail);
      } else if (err.response?.data) {
        errorMessage = JSON.stringify(err.response.data);
      }
      
      setErrorMsg(errorMessage);
      fetchCaptcha();
    }
  };
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setErrorMsg('');
      setSuccessMsg('');
      try {
        const response = await API.post('/auth/google', {
          access_token: tokenResponse.access_token,
        });

        if (response.data && response.data.access_token) {
          const userData = response.data.user;
          localStorage.setItem('token', response.data.access_token);
          if (response.data.session_token) {
            localStorage.setItem('session_token', response.data.session_token);
          }
          localStorage.setItem('user', JSON.stringify(userData));

          sessionStorage.removeItem('token');
          sessionStorage.removeItem('session_token');
          sessionStorage.removeItem('user');

          const role = (userData?.role_name || userData?.role || response.data?.role || '').toLowerCase();
          const communityId = userData?.community_id;

          setSuccessMsg('Google registration successful!');
          
          setTimeout(() => {
            if (role === 'resident' && (!communityId || communityId === 0)) {
              navigate('/join-community');
            } else {
              navigate('/dashboard');
            }
          }, 1500);
        }
      } catch (err) {
        console.error('Google Auth Error:', err);
        let errorMessage = 'Google Authentication failed.';
        if (err.response?.data?.detail) {
          errorMessage = typeof err.response.data.detail === 'string'
            ? err.response.data.detail
            : JSON.stringify(err.response.data.detail);
        }
        setErrorMsg(errorMessage);
      }
    },
    onError: (error) => {
      console.error('Google Login Failed:', error);
      setErrorMsg('Google Authentication failed. Please try again.');
    }
  });

  const handleGoogleRegister = () => {
    const clientIdClean = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').replace(/['"]/g, "").trim();
    if (!clientIdClean || clientIdClean === 'PLACEHOLDER_CLIENT_ID') {
      setErrorMsg('Google Registration is not configured. Please add VITE_GOOGLE_CLIENT_ID in your frontend .env file.');
      return;
    }
    googleLogin();
  };

 

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Sign Up</h2>
        <p className="text-gray-600 mt-1">Create your account to get started</p>
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
        {/* Full Name Field */}
        <div>
          <label className="block text-xs font-bold text-gray-700 tracking-wider mb-1">
            FULL NAME
          </label>
          <div className="relative">
            <input
              type="text"
              {...register('fullName', { required: 'Full name is required' })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none pl-10 text-sm text-gray-900 bg-white dark:text-gray-900 dark:bg-white ${
                errors.fullName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="John Doe"
            />
            <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>
          {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-xs font-bold text-gray-700 tracking-wider mb-1">
            EMAIL ADDRESS
          </label>
          <div className="relative">
            <input
              type="text"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none pl-10 text-sm text-gray-900 bg-white dark:text-gray-900 dark:bg-white ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="name@company.com"
            />
            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-xs font-bold text-gray-700 tracking-wider mb-1">
            PASSWORD
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
                validate: (v) => {
                  if (!/[A-Z]/.test(v)) return 'Password must contain at least one uppercase letter';
                  if (!/\d/.test(v)) return 'Password must contain at least one number';
                  return true;
                }
              })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none pl-10 pr-10 text-sm text-gray-900 bg-white dark:text-gray-900 dark:bg-white ${
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
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        {/* Confirm Password Field */}
        <div>
          <label className="block text-xs font-bold text-gray-700 tracking-wider mb-1">
            CONFIRM PASSWORD
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) =>
                  value === password || 'Passwords do not match',
              })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none pl-10 pr-10 text-sm text-gray-900 bg-white dark:text-gray-900 dark:bg-white ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="••••••••"
            />
            <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Mobile Number Field (Optional) */}
        <div>
          <label className="block text-xs font-bold text-gray-700 tracking-wider mb-1">
            MOBILE NUMBER (Optional)
          </label>
          <div className="relative">
            <input
              type="text"
              {...register('mobileNumber', {
                pattern: {
                  value: /^\+?[\d\s\-]{7,15}$/,
                  message: 'Invalid mobile number format',
                },
              })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none pl-10 text-sm text-gray-900 bg-white dark:text-gray-900 dark:bg-white ${
                errors.mobileNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="+1234567890"
            />
            <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>
          {errors.mobileNumber && (
            <p className="text-red-500 text-xs mt-1">{errors.mobileNumber.message}</p>
          )}
        </div>



        {/* Captcha Section */}
        <div className="p-4 bg-slate-50 border border-gray-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2">CAPTCHA *</label>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold bg-white border border-gray-300 px-4 py-2 rounded-xl text-yellow-600 font-mono tracking-widest">
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
          <div className="w-full md:w-36">
            <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2">ANSWER *</label>
            <input
              type="text"
              {...register('captchaAnswer', { required: 'Answer is required' })}
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
          className="w-full bg-[#0F2D59] hover:bg-[#0c2345] text-white py-2 px-4 rounded-lg font-medium transition duration-200 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Sign Up'}
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
        onClick={handleGoogleRegister}
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
        Sign up with Google
      </button>

      <div className="text-center mt-6 text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-[#0F2D59] hover:underline">
          Log In
        </Link>
      </div>
    </AuthLayout>
  );
}