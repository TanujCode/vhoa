import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle, XCircle, Lock } from 'lucide-react';
import API from '../../services/api';
import AuthLayout from '../../components/layout/AuthLayout';
import { checkEmail } from '../../utils/emailValidation';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=Email, 2=OTP+Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return;

    // Strict email validation with typo detection
    const emailCheck = checkEmail(email);
    if (!emailCheck.valid) {
      showMsg('error', emailCheck.message);
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await API.post('/auth/otp/send', {
        email_id: email.trim(),
        otp_type: "password_reset"
      });

      showMsg('success', 'OTP has been sent to your email!');
      setStep(2);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      
      if (errorMsg.toLowerCase().includes("not found") || 
          errorMsg.toLowerCase().includes("does not exist")) {
        showMsg('error', "This email is not registered with us.");
      } else {
        showMsg('error', errorMsg || "Failed to send OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showMsg('error', "Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      await API.post('/auth/password/reset', {
        email_id: email.trim(),
        otp_code: otp.trim(),
        new_password: newPassword
      });

      showMsg('success', "Password reset successful! Redirecting to login...");
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      showMsg('error', err.response?.data?.detail || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <Link to="/login" className="inline-flex items-center text-[#0F2D59] hover:underline mb-4 text-sm font-medium">
            <ArrowLeft size={16} className="mr-1" /> Back to Login
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Forgot Password</h1>
          <p className="text-gray-600 mt-1">Reset your password using OTP</p>
        </div>

        {message.text && (
          <div className={`mb-6 p-3 border text-sm rounded-lg flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-600 border-green-200' 
              : 'bg-red-50 text-red-600 border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
            {message.text}
          </div>
        )}

        {/* Step 1: Enter Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wider mb-1">
                REGISTERED EMAIL ADDRESS
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none pl-10 text-sm text-gray-900 bg-white dark:text-gray-900 dark:bg-white"
                  placeholder="name@company.com"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0F2D59] hover:bg-[#0c2345] text-white py-2 px-4 rounded-lg font-medium transition duration-200 disabled:opacity-50"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* Step 2: OTP + New Password */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wider mb-1">
                ENTER OTP
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none pl-10 text-sm text-gray-900 bg-white dark:text-gray-900 dark:bg-white text-center text-lg tracking-widest font-mono"
                  placeholder="123456"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wider mb-1">
                NEW PASSWORD
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none pl-10 text-sm text-gray-900 bg-white dark:text-gray-900 dark:bg-white"
                  placeholder="••••••••"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wider mb-1">
                CONFIRM NEW PASSWORD
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none pl-10 text-sm text-gray-900 bg-white dark:text-gray-900 dark:bg-white"
                  placeholder="••••••••"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0F2D59] hover:bg-[#0c2345] text-white py-2 px-4 rounded-lg font-medium transition duration-200 disabled:opacity-50 mt-2"
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;