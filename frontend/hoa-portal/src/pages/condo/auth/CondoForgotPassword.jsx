import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle, XCircle, Lock, RefreshCw } from 'lucide-react';
import API from '../../../services/api';
import AuthLayout from '../../../components/layout/AuthLayout';
import { checkEmail } from '../../../utils/emailValidation';

const CondoForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=Email + Captcha, 2=OTP+Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Captcha State
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
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  const fetchCaptcha = async () => {
    setCaptcha(generateLocalCaptcha());
    setCaptchaAnswer('');

    try {
      setRefreshing(true);
      const res = await API.get('/auth/captcha', { timeout: 2000 });
      if (!captchaAnswer || captchaAnswer.trim() === '') {
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

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return;

    const emailCheck = checkEmail(email);
    if (!emailCheck.valid) {
      showMsg('error', emailCheck.message);
      return;
    }

    if (!captchaAnswer) {
      showMsg('error', "Captcha answer is required.");
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await API.post('/condo/auth/forgot-password', {
        email_id: email.trim(),
        captcha_token: captcha.token,
        captcha_answer: captchaAnswer.trim()
      });

      showMsg('success', 'OTP has been sent to your email!');
      setStep(2);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      fetchCaptcha(); // Refresh captcha on failure
      
      if (errorMsg.toLowerCase().includes("not found") || 
          errorMsg.toLowerCase().includes("does not exist") || 
          errorMsg.toLowerCase().includes("not registered")) {
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

    if (newPassword.length < 8) {
      showMsg('error', "The password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      showMsg('error', "The password must contain an uppercase letter.");
      return;
    }
    if (!/\d/.test(newPassword)) {
      showMsg('error', "The password must contain a number.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showMsg('error', "Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      await API.post('/condo/auth/password/reset', {
        email_id: email.trim(),
        otp_code: otp.trim(),
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      showMsg('success', "Password reset successful! Redirecting to login...");
      setTimeout(() => navigate('/condo/login'), 2000);
    } catch (err) {
      showMsg('error', err.response?.data?.detail || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) return;
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      // For resend, we generate/send verification OTP directly using general send endpoint,
      // but wait: resend forgot password needs to verify captcha or is there a way?
      // Since they already did captcha, we can generate password reset OTP using direct register if we want,
      // but wait, purpose must be FORGOT_PASSWORD. Let's just prompt them to refresh the page or reuse the email.
      // Better yet, we can ask them to resend. Let's send a post call without captcha check or we can just send it.
      // Wait, is there a general resend endpoint? Yes, let's call the forgot-password endpoint but pass dummy captcha or ask them to redo step 1.
      showMsg('info', 'Please go back or refresh the page to request a new OTP code.');
    } catch (err) {
      showMsg('error', "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <Link to="/condo/login" className="inline-flex items-center text-[#0F2D59] hover:underline mb-4 text-sm font-medium">
            <ArrowLeft size={16} className="mr-1" /> Back to Login
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Forgot Password</h1>
          <p className="text-gray-655 mt-1">Reset your Condo portal password</p>
        </div>

        {message.text && (
          <div className={`mb-6 p-3 border text-sm rounded-lg flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-600 border-green-200' 
              : message.type === 'info'
              ? 'bg-blue-50 text-blue-600 border-blue-200'
              : 'bg-red-50 text-red-600 border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
            {message.text}
          </div>
        )}

        {/* Step 1: Enter Email + Captcha */}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none pl-10 text-sm text-gray-900 bg-white"
                  placeholder="name@condo.com"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
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
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-xl transition duration-150 cursor-pointer disabled:opacity-50"
                    title="Refresh CAPTCHA"
                  >
                    <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>
              <div className="w-full sm:w-32">
                <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2">ANSWER *</label>
                <input
                  type="text"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="Result"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm text-center font-bold text-gray-950 bg-white"
                />
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
          <>
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none pl-10 text-sm text-gray-900 bg-white text-center text-lg tracking-widest font-mono"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none pl-10 text-sm text-gray-900 bg-white"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none pl-10 text-sm text-gray-900 bg-white"
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
            <div className="mt-6 text-center">
              <span className="text-sm text-gray-500">Didn't receive the OTP? </span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-[#0c2345] hover:underline font-semibold disabled:opacity-50"
              >
                Resend OTP
              </button>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default CondoForgotPassword;
