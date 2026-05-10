import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle, XCircle } from 'lucide-react';
import API from '../../services/api';
import AuthLayout from '../../components/layout/AuthLayout';

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

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await API.post('/auth/otp/send', {
        email_id: email,
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
        email_id: email,
        otp_code: otp,
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
          <Link to="/login" className="inline-flex items-center text-teal-400 hover:text-teal-300 mb-4">
            <ArrowLeft size={18} className="mr-1" /> Back to Login
          </Link>
          <h1 className="text-3xl font-semibold text-white">Forgot Password</h1>
          <p className="text-gray-400 mt-2">Reset your password using OTP</p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-2xl text-sm flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
            {message.text}
          </div>
        )}

        {/* Step 1: Enter Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="mb-6">
              <label className="block text-gray-400 mb-2">Registered Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#1E3248] border border-white/20 rounded-2xl px-5 py-4 text-white focus:border-teal-500 outline-none"
                placeholder="your@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-500 py-4 rounded-2xl font-medium disabled:opacity-50 transition"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* Step 2: OTP + New Password */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-gray-400 mb-2">Enter OTP</label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="w-full bg-[#1E3248] border border-white/20 rounded-xl px-2 py-2 text-white text-center text-xl tracking-widest focus:border-teal-500 outline-none"
                placeholder="123456"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full bg-[#1E3248] border border-white/20 rounded-xl px-2 py-2 text-white focus:border-teal-500 outline-none"
                placeholder="New password"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-[#1E3248] border border-white/20 rounded-xl px-2 py-2 text-white focus:border-teal-500 outline-none"
                placeholder="Confirm password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-500 py-3 rounded-xl font-medium disabled:opacity-50 transition mt-6"
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