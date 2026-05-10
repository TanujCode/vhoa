import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Lock, User, Eye, EyeOff, Phone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import API from '../../services/api';
import { useGoogleLogin } from '@react-oauth/google';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
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
        role: data.role, // Backend ke allowed values (resident, board_member, etc.)
        mobile_number: data.mobileNumber || '', // Naya optional field
        time_zone: 'America/New_York', // Default timezone
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
    }
  };

  // Google Sign-Up/Login Handler
  const handleGoogleRegister = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await API.post('/auth/google', {
          token: tokenResponse.access_token,
        });

        if (response.data.access_token) {
          localStorage.setItem('token', response.data.access_token);
          setSuccessMsg('Google sign-up successful! Redirecting...');
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        }
      } catch (err) {
        console.error('Google Auth Backend Error:', err);
        setErrorMsg('Failed to authenticate with Google.');
      }
    },
    onError: (error) => {
      console.error('Google Register Failed:', error);
      setErrorMsg('Google registration was interrupted.');
    },
  });

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
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none pl-10 text-sm ${
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
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none pl-10 text-sm ${
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
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none pl-10 pr-10 text-sm ${
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
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none pl-10 pr-10 text-sm ${
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
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none pl-10 text-sm ${
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

        {/* Role Selection */}
        <div>
          <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2">
            SIGN UP AS WHOM?
          </label>
          <div className="space-y-2 border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-36 overflow-y-auto">
            {[
              { id: 'resident', label: 'HOA Member', desc: 'Owns property in the community' },
              { id: 'board_member', label: 'HOA Board Member', desc: 'Governing member' },
              { id: 'property_manager', label: 'Property Manager', desc: 'Manages operations' },
              { id: 'super_admin', label: 'Super Admin', desc: 'Super administrator' },
            ].map((role) => (
              <label
                key={role.id}
                className="flex items-start space-x-3 p-2 hover:bg-white rounded border border-transparent hover:border-gray-200 cursor-pointer text-sm"
              >
                <input
                  type="radio"
                  value={role.id}
                  {...register('role', { required: 'Please select a role' })}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900 block">{role.label}</span>
                  <span className="text-gray-500 text-xs">{role.desc}</span>
                </div>
              </label>
            ))}
          </div>
          {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
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
        onClick={() => handleGoogleRegisterPage.handleGoogleRegister && handleGoogleRegister()}
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