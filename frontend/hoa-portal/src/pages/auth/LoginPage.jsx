import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import API from '../../services/api';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');
  const [successMsg, setSuccessMsg]     = useState('');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched' });

  const onSubmit = async (data) => {
  try {
    const response = await API.post('/auth/login', {
      email_id: data.email,
      password: data.password,
    });

    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);        // ← Yeh line important
      localStorage.setItem('access_token', response.data.access_token); // backup ke liye

      // Redirect to dashboard
      window.location.href = '/dashboard';   // ya useNavigate use kar sakte ho
      // navigate('/dashboard');   // agar useNavigate import kiya hai toh
    }
  } catch (err) {
    setErrorMsg(err.response?.data?.detail || "Login failed");
  }
};

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Login</h2>
        <p className="text-gray-600 mt-1">Login to get started</p>
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
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Min 6 characters' },
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
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center text-gray-600">
            <input
              type="checkbox"
              {...register('rememberMe')}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded mr-2"
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#0F2D59] hover:bg-[#0c2345] text-white py-2 px-4 rounded-lg font-medium transition duration-200 disabled:opacity-50"
        >
          {isSubmitting ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <div className="text-center mt-6 text-sm text-gray-600">
        New user?{' '}
        <Link to="/register" className="font-medium text-[#0F2D59] hover:underline">
          Sign Up
        </Link>
      </div>
    </AuthLayout>
  );
}