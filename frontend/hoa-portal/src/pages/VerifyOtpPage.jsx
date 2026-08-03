import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import API from "../services/api";

const VerifyOtpPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const emailFromState = location.state?.email || "";

  const [email, setEmail] = useState(emailFromState);
  const [otp, setOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!emailFromState) {
      navigate('/login');
    }
  }, [emailFromState, navigate]);

  // OTP Verify Karne ka Function
  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      const response = await API.post('/auth/otp/verify', {
        email_id: email,
        otp_code: otp,
        otp_type: 'email_verify' //  FIX: Match with backend template keys
      });

      setSuccessMsg("Email Successfully Verified!");
      setTimeout(() => navigate('/login'), 2500);

    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  // OTP Resend Karne ka Function
  const handleResendOtp = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await API.post('/auth/otp/send', { 
        email_id: email,
        otp_type: 'email_verify' 
      }); 
      setSuccessMsg("New OTP sent to your email!");
    } catch (err) {
      console.error("Resend error:", err);
      setErrorMsg("Send OTP failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Verify Your Email</h2>
          <p className="text-gray-500 mt-2">
            We've sent a code to <br/>
            <span className="font-medium text-gray-800">{email}</span>
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm flex items-center gap-2">
            <AlertTriangle size={16} /> {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-xl border border-green-100 text-sm flex items-center gap-2">
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
              Enter 6-Digit Code
            </label>
            <input
              type="text"
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              onKeyPress={(e) => {
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              placeholder="· · · · · ·"
              className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition text-center text-3xl font-bold tracking-[0.5em] placeholder-gray-300 text-gray-900 bg-gray-50 dark:text-gray-900 dark:bg-gray-50"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.98] ${
              loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200'
            }`}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Didn't receive the code? 
            <button 
              type="button"
              onClick={handleResendOtp}
              disabled={loading}
              className="ml-2 text-blue-600 hover:text-blue-800 font-bold transition-colors disabled:text-gray-400"
            >
              Resend OTP
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtpPage;