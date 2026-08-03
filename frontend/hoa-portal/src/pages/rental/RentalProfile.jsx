import React, { useState, useRef, useEffect } from 'react';
import {
  Camera, Mail, Phone, Shield, Clock,
  CheckCircle, XCircle, Save, Key, Eye, EyeOff, User, Bell, Trash2, ChevronDown, Edit
} from 'lucide-react';
import API, { getBaseUrl } from '../../services/api';
import { formatUsPhone, formatPhoneAsYouType } from '../../utils/phoneFormatter';

const getPhoneValidationRule = (code) => {
  switch (code) {
    case '+1':
    case '+91':
    case '+44':
      return { min: 10, max: 10, label: '10 digits' };
    case '+971':
    case '+966':
    case '+61':
      return { min: 9, max: 9, label: '9 digits' };
    default:
      return { min: 7, max: 15, label: '7 to 15 digits' };
  }
};

const parsePhoneNumber = (fullNumber) => {
  const prefixes = ['+971', '+966', '+91', '+44', '+61', '+1'];
  for (const prefix of prefixes) {
    if (fullNumber?.startsWith(prefix)) {
      return {
        countryCode: prefix,
        numberOnly: fullNumber.slice(prefix.length)
      };
    }
  }
  return {
    countryCode: '+1',
    numberOnly: fullNumber || ''
  };
};

const RentalProfile = ({ user, setUser, viewRole }) => {
  // ── Form State ────────────────────────────
  const [form, setForm] = useState({
    first_name:    user?.first_name    || '',
    middle_name:   user?.middle_name   || '',
    last_name:     user?.last_name     || '',
    mobile_number: user?.mobile_number || '',
    time_zone:     user?.time_zone     || 'America/New_York',
  });

  const initialPhone = parsePhoneNumber(user?.mobile_number || '');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+1');
  const [phoneNumberOnly, setPhoneNumberOnly] = useState(formatPhoneAsYouType(initialPhone.numberOnly));

  useEffect(() => {
    const parsed = parsePhoneNumber(user?.mobile_number || '');
    setPhoneCountryCode('+1');
    setPhoneNumberOnly(formatPhoneAsYouType(parsed.numberOnly));
  }, [user?.mobile_number]);

  const [isEditing, setIsEditing] = useState(false);

  // Sync user prop updates
  useEffect(() => {
    if (user) {
      setForm({
        first_name:    user.first_name    || '',
        middle_name:   user.middle_name   || '',
        last_name:     user.last_name     || '',
        mobile_number: user.mobile_number || '',
        time_zone:     user.time_zone     || 'America/New_York',
      });
    }
  }, [user]);

  const resetForm = () => {
    if (user) {
      setForm({
        first_name:    user.first_name    || '',
        middle_name:   user.middle_name   || '',
        last_name:     user.last_name     || '',
        mobile_number: user.mobile_number || '',
        time_zone:     user.time_zone     || 'America/New_York',
      });
      const parsed = parsePhoneNumber(user.mobile_number || '');
      setPhoneCountryCode('+1');
      setPhoneNumberOnly(formatPhoneAsYouType(parsed.numberOnly));
    }
  };

  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [pwdForm, setPwdForm] = useState({ otp_code: '', new_password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);

  // Phone verification modal
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [showPhoneVerifyModal, setShowPhoneVerifyModal] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [autoPhoneOtp, setAutoPhoneOtp] = useState('');
  const [verifyingPhone, setVerifyingPhone] = useState(false);

  // Notification Preferences
  const [emailNotifications, setEmailNotifications] = useState({
    newViolation: true,
    paymentOverdue: true,
    newMember: false,
    serviceRequest: true,
    weeklyDigest: false,
  });
  const [pushNotifications, setPushNotifications] = useState({
    allInApp: true,
    smsCritical: false,
  });

  const handleEmailToggle = (key) => {
    setEmailNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePushToggle = (key) => {
    setPushNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveNotifications = async () => {
    showMsg('success', 'Notification preferences saved!');
  };

  // Status message state
  const [msg, setMessage] = useState({ type: '', text: '' });
  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // ── Save Profile Details ───────────────────
  const handleSave = async () => {
    try {
      setSaving(true);

      // Check phone validation
      if (phoneNumberOnly) {
        const digits = phoneNumberOnly.replace(/\D/g, '');
        if (digits.length !== 10) {
          showMsg('error', 'Mobile number must be exactly 10 digits.');
          setSaving(false);
          return false;
        }
      }

      const payload = {
        ...form,
        mobile_number: phoneNumberOnly ? `+1${phoneNumberOnly.replace(/\D/g, '')}` : '',
      };
      const res = await API.put('/rental/user/profile', payload);
      const updated = res.data;

      setUser(prev => ({
        ...prev,
        ...updated,
        initials: `${updated.first_name?.[0] || ''}${updated.last_name?.[0] || ''}`.toUpperCase(),
        name:     updated.full_name,
        email:    updated.email_id,
        role:     updated.role_name,
      }));

      showMsg('success', 'Profile updated successfully!');
      return true;
    } catch (err) {
      const detail = err.response?.data?.detail;
      const errorMsgText = typeof detail === 'string'
        ? detail
        : (Array.isArray(detail) && detail[0]?.msg)
          ? detail[0].msg
          : 'Failed to update profile.';
      showMsg('error', errorMsgText);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // ── Profile Picture Upload ────────────────
  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const res = await API.post('/rental/user/profile/picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newUrl = res.data.user_profile_url;
      
      setUser(prev => {
        const updated = { ...prev, user_profile_url: newUrl };
        try {
          const stored = localStorage.getItem('rental_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            localStorage.setItem('rental_user', JSON.stringify({ ...parsed, user_profile_url: newUrl }));
          }
        } catch (_) {}
        return updated;
      });
      showMsg('success', 'Profile picture updated!');
    } catch (err) {
      const detail = err.response?.data?.detail;
      showMsg('error', typeof detail === 'string' ? detail : 'Failed to upload picture.');
    } finally {
      setUploading(false);
    }
  };

  //  Remove Profile Picture Logic ────────────────
  const handleRemovePicture = async () => {
    if (!await window.customConfirm("Are you sure you want to remove this photo?")) return;
    try {
      setUploading(true);
      await API.delete('/rental/user/profile/picture'); 
      setUser(prev => {
        const updated = { ...prev, user_profile_url: null };
        try {
          const stored = localStorage.getItem('rental_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            localStorage.setItem('rental_user', JSON.stringify({ ...parsed, user_profile_url: null }));
          }
        } catch (_) {}
        return updated;
      });
      showMsg('success', 'Profile picture removed!');
    } catch (err) {
      showMsg('error', 'Failed to remove picture.');
    } finally {
      setUploading(false);
    }
  };

  const [uploadingId, setUploadingId] = useState(false);
  const [uploadingAddr, setUploadingAddr] = useState(false);

  const handleIdProofUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingId(true);
      const res = await API.post('/rental/user/profile/id-proof', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(prev => {
        const updated = { ...prev, id_proof_url: res.data.id_proof_url };
        try {
          const stored = localStorage.getItem('rental_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            localStorage.setItem('rental_user', JSON.stringify({ ...parsed, id_proof_url: res.data.id_proof_url }));
          }
        } catch (_) {}
        return updated;
      });
      showMsg('success', 'ID Proof uploaded successfully!');
    } catch (err) {
      showMsg('error', 'Failed to upload ID proof.');
    } finally {
      setUploadingId(false);
    }
  };

  const handleAddressProofUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingAddr(true);
      const res = await API.post('/rental/user/profile/address-proof', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(prev => {
        const updated = { ...prev, address_proof_url: res.data.address_proof_url };
        try {
          const stored = localStorage.getItem('rental_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            localStorage.setItem('rental_user', JSON.stringify({ ...parsed, address_proof_url: res.data.address_proof_url }));
          }
        } catch (_) {}
        return updated;
      });
      showMsg('success', 'Address Proof uploaded successfully!');
    } catch (err) {
      showMsg('error', 'Failed to upload Address proof.');
    } finally {
      setUploadingAddr(false);
    }
  };

  // ── Send OTP for password reset ───────────
  const handleSendOtp = async () => {
    try {
      setSendingOtp(true);
      await API.post('/rental/auth/otp/send', {
        email_id: user?.email_id || user?.email,
        otp_type: 'password_reset',
      });
      setOtpSent(true);
      showMsg('success', 'OTP sent to your email!');
    } catch (err) {
      showMsg('error', 'Failed to send OTP.');
    } finally {
      setSendingOtp(false);
    }
  };

  // ── Send OTP for phone verification ───────
  const handleSendPhoneOtp = async () => {
    try {
      setSendingPhoneOtp(true);
      const res = await API.post('/rental/auth/otp/send', {
        email_id: user?.email_id || user?.email,
        otp_type: 'mobile_verify',
      });
      const receivedOtp = res.data?.otp_code || '';
      setAutoPhoneOtp(receivedOtp);
      setPhoneOtpCode('');
      setShowPhoneVerifyModal(true);
      showMsg('success', res.data?.message || 'Verification code sent!');
    } catch (err) {
      showMsg('error', err.response?.data?.detail || 'Failed to send OTP for mobile verification.');
    } finally {
      setSendingPhoneOtp(false);
    }
  };

  // ── Verify OTP for phone verification ────
  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtpCode.trim()) {
      showMsg('error', 'Please enter the verification code.');
      return;
    }
    try {
      setVerifyingPhone(true);
      await API.post('/rental/auth/otp/verify', {
        email_id: user?.email_id || user?.email,
        otp_code: phoneOtpCode,
        otp_type: 'mobile_verify',
      });
      
      setUser(prev => {
        const u = {
          ...prev,
          mobile_is_verified: true,
        };
        try {
          const stored = localStorage.getItem('rental_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            localStorage.setItem('rental_user', JSON.stringify({ ...parsed, mobile_is_verified: true }));
          }
        } catch (_) {}
        return u;
      });

      setShowPhoneVerifyModal(false);
      showMsg('success', 'Mobile number verified successfully!');
    } catch (err) {
      showMsg('error', err.response?.data?.detail || 'Invalid or expired OTP.');
    } finally {
      setVerifyingPhone(false);
    }
  };

  // ── Password Reset ────────────────────────
  const handlePasswordReset = async () => {
    if (pwdForm.new_password !== pwdForm.confirm) {
      showMsg('error', 'Passwords do not match!');
      return;
    }
    try {
      setSaving(true);
      await API.post('/rental/auth/password/reset', {
        email_id:     user?.email_id || user?.email,
        otp_code:     pwdForm.otp_code,
        new_password: pwdForm.new_password,
      });
      showMsg('success', 'Password changed! Please login again.');
      setPwdForm({ otp_code: '', new_password: '', confirm: '' });
      setOtpSent(false);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const errorMsgText = typeof detail === 'string'
        ? detail
        : (Array.isArray(detail) && detail[0]?.msg)
          ? detail[0].msg
          : 'Failed to reset password.';
      showMsg('error', errorMsgText);
    } finally {
      setSaving(false);
    }
  };

  const getProfileImage = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return getBaseUrl(url.startsWith('/') ? url : '/' + url);
  };

  const currentRole = (viewRole || user?.role_name || user?.role || '').toUpperCase();

  return (
    <div className="text-slate-900 dark:text-white">
      {/* Message */}
      {msg.text && (
        <div className={`mb-6 px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-2 ${
          msg.type === 'success'
            ? 'bg-blue-500/10 text-blue-700 border border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30'
            : 'bg-red-500/10 text-red-700 border border-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30'
        }`}>
          {msg.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column — Avatar + Info ── */}
        <div className="space-y-5">
          {/* Avatar Card */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 flex flex-col items-center text-center text-slate-900 dark:text-white">
            <div className="relative mb-4 group w-28 h-28">
              <div className="w-full h-full rounded-3xl overflow-hidden relative">
                {user?.user_profile_url ? (
                  <>
                    <img
                      src={getProfileImage(user.user_profile_url)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                    {/* Black overlay with center Delete button on hover */}
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={handleRemovePicture}
                        className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all transform hover:scale-110 shadow-lg"
                        title="Remove Photo"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-4xl font-bold text-white">
                    {user?.initials || <User size={40} />}
                  </div>
                )}
              </div>
              
              {/* Camera Button */}
              <button
                onClick={() => fileInputRef.current.click()}
                disabled={uploading}
                className="absolute -bottom-2 -right-2 w-9 h-9 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center transition shadow-lg z-10 border-2 border-white dark:border-[#162535]"
              >
                <Camera size={16} />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePictureUpload}
              />
            </div>

            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{user?.name || user?.full_name}</h3>
            <p className="text-slate-500 dark:text-gray-400 text-sm capitalize mt-1">
              {(viewRole || user?.role)?.replace('_', ' ')}
            </p>

            {/* Verification Status */}
            <div className="w-full mt-5 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Mail size={13} /> Email
                </span>
                <span className={user?.email_id_is_verified ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}>
                  {user?.email_id_is_verified ? ' Verified' : ' Not verified'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Phone size={13} /> Phone
                </span>
                <div className="flex items-center gap-2">
                  <span className={user?.mobile_is_verified ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}>
                    {user?.mobile_is_verified ? ' Verified' : ' Not verified'}
                  </span>
                  {!user?.mobile_is_verified && (
                    user?.mobile_number ? (
                      <button
                        onClick={handleSendPhoneOtp}
                        disabled={sendingPhoneOtp}
                        className="px-2 py-0.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                      >
                        {sendingPhoneOtp ? '...' : 'Verify'}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-gray-500">(Set number first)</span>
                    )
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Shield size={13} /> Account
                </span>
                <span className={
                  (user?.account_status === 'ACTIVE' || user?.account_status === 'APPROVED') ? 'text-blue-600 dark:text-blue-400' :
                  user?.account_status === 'LOCKED' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                }>
                  {user?.account_status || 'PENDING'}
                </span>
              </div>
            </div>
          </div>

          {/* Account Info Card */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 space-y-3 text-slate-900 dark:text-white">
            <h4 className="font-medium text-sm text-slate-500 dark:text-gray-400 uppercase tracking-wider">Account Info</h4>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-gray-400">User ID</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{user?.user_code || `#${user?.user_id}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-gray-400">Role</span>
                <span className="capitalize text-slate-800 dark:text-slate-200">{(viewRole || user?.role_name || user?.role)?.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-gray-400">Timezone</span>
                <span className="text-slate-800 dark:text-slate-200">{user?.time_zone || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-gray-400">Last Login</span>
                <span className="text-slate-800 dark:text-slate-200">{user?.last_login ? new Date(user.last_login).toLocaleDateString() : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column — Tabs ── */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {[
              { id: 'profile',      label: 'Edit Profile' },
              { id: 'notifications', label: 'Notifications' },
              { id: 'password',     label: 'Change Password' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-2xl text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-blue-600 hover:bg-blue-700 text-white hover:text-white'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-gray-400 dark:hover:bg-white/20'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Profile Tab ── */}
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-[#162535] border border-slate-200 dark:border-white/10 rounded-3xl p-6 space-y-5 text-slate-900 dark:text-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">First Name</label>
                  <input type="text" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} disabled={!isEditing} className={`w-full border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors ${!isEditing ? 'bg-slate-100/50 dark:bg-white/5 cursor-not-allowed text-slate-500 dark:text-gray-400' : 'bg-slate-50 dark:bg-[#1E3248] text-slate-900 dark:text-white'}`} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Middle Name</label>
                  <input type="text" value={form.middle_name} onChange={e => setForm({...form, middle_name: e.target.value})} disabled={!isEditing} placeholder={isEditing ? "Optional" : ""} className={`w-full border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors ${!isEditing ? 'bg-slate-100/50 dark:bg-white/5 cursor-not-allowed text-slate-500 dark:text-gray-400' : 'bg-slate-50 dark:bg-[#1E3248] text-slate-900 dark:text-white'}`} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Last Name</label>
                  <input type="text" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} disabled={!isEditing} className={`w-full border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors ${!isEditing ? 'bg-slate-100/50 dark:bg-white/5 cursor-not-allowed text-slate-500 dark:text-gray-400' : 'bg-slate-50 dark:bg-[#1E3248] text-slate-900 dark:text-white'}`} />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Email Address</label>
                <input type="email" value={user?.email_id || user?.email} disabled className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-slate-400 dark:text-gray-500 cursor-not-allowed" />
                <p className="text-xs text-slate-400 dark:text-gray-600 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Mobile Number</label>
                <input
                  type="text"
                  value={phoneNumberOnly}
                  onChange={e => setPhoneNumberOnly(formatPhoneAsYouType(e.target.value))}
                  disabled={!isEditing}
                  placeholder={isEditing ? "(123) 456-7890" : "Not set"}
                  className={`w-full border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors ${!isEditing ? 'bg-slate-100/50 dark:bg-white/5 cursor-not-allowed text-slate-500 dark:text-gray-400' : 'bg-slate-50 dark:bg-[#1E3248] text-slate-900 dark:text-white'}`}
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Timezone</label>
                <div className="relative">
                  <select
                    value={form.time_zone}
                    onChange={e => setForm({ ...form, time_zone: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 appearance-none transition-colors ${
                      !isEditing
                        ? 'bg-slate-100/50 dark:bg-white/5 cursor-not-allowed text-slate-500 dark:text-gray-400'
                        : 'bg-slate-50 dark:bg-[#1E3248] text-slate-900 dark:text-white'
                    }`}
                  >
                    <option value="America/New_York">Eastern Time (EST/EDT)</option>
                    <option value="America/Chicago">Central Time (CST/CDT)</option>
                    <option value="America/Denver">Mountain Time (MST/MDT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PST/PDT)</option>
                    <option value="Asia/Kolkata">India Standard Time (IST)</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {currentRole === 'TENANT' && (
                <div>
                  <span className="text-xs text-slate-500 dark:text-gray-400 mb-2 block font-medium">Verify Identity & Verification Documents</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ID Proof */}
                    <div className="bg-slate-500/5 border border-slate-200 dark:border-white/5 rounded-3xl p-5 flex flex-col justify-between gap-4 transition hover:shadow-md">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-slate-400 dark:text-gray-400 tracking-wider uppercase">Identity Verification (ID)</span>
                          {user?.id_proof_url ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle size={12} /> Uploaded
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20">
                              <XCircle size={12} /> Pending
                            </span>
                          )}
                        </div>

                        {user?.id_proof_url ? (
                          <div className="flex items-center gap-2 mt-2">
                            <a
                              href={getBaseUrl(user.id_proof_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition bg-blue-500/5 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/10"
                            >
                              <Eye size={14} /> View Document
                            </a>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">No identity verification document uploaded yet.</p>
                        )}
                      </div>

                      <div className="border-t border-slate-100 dark:border-white/5 pt-3 mt-1">
                        <label className="w-full inline-flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-[#1E3248] dark:hover:bg-[#253d58] border border-slate-200 dark:border-white/10 text-center rounded-xl text-xs font-semibold text-slate-700 dark:text-white cursor-pointer transition">
                          {uploadingId ? 'Uploading...' : user?.id_proof_url ? 'Replace Document' : 'Upload ID Proof'}
                          <input type="file" accept="image/*,application/pdf" onChange={handleIdProofUpload} disabled={uploadingId} className="hidden" />
                        </label>
                      </div>
                    </div>

                    {/* Address Proof */}
                    <div className="bg-slate-500/5 border border-slate-200 dark:border-white/5 rounded-3xl p-5 flex flex-col justify-between gap-4 transition hover:shadow-md">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-slate-400 dark:text-gray-400 tracking-wider uppercase">Address Proof</span>
                          {user?.address_proof_url ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle size={12} /> Uploaded
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20">
                              <XCircle size={12} /> Pending
                            </span>
                          )}
                        </div>

                        {user?.address_proof_url ? (
                          <div className="flex items-center gap-2 mt-2">
                            <a
                              href={getBaseUrl(user.address_proof_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 font-medium transition bg-purple-500/5 hover:bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/10"
                            >
                              <Eye size={14} /> View Document
                            </a>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">No address verification document uploaded yet.</p>
                        )}
                      </div>

                      <div className="border-t border-slate-100 dark:border-white/5 pt-3 mt-1">
                        <label className="w-full inline-flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-[#1E3248] dark:hover:bg-[#253d58] border border-slate-200 dark:border-white/10 text-center rounded-xl text-xs font-semibold text-slate-700 dark:text-white cursor-pointer transition">
                          {uploadingAddr ? 'Uploading...' : user?.address_proof_url ? 'Replace Document' : 'Upload Address Proof'}
                          <input type="file" accept="image/*,application/pdf" onChange={handleAddressProofUpload} disabled={uploadingAddr} className="hidden" />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-medium transition flex items-center justify-center gap-2"
                >
                  <Edit size={16} /> Edit Profile
                </button>
              ) : (
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      resetForm();
                    }} 
                    className="w-full sm:flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-2xl font-medium transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={async () => {
                      const success = await handleSave();
                      if (success) {
                        setIsEditing(false);
                      }
                    }} 
                    className="w-full sm:flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-medium transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/10"
                  >
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── New Notifications Tab ── */}
          {activeTab === 'notifications' && (
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-8 space-y-8 text-slate-900 dark:text-white">
              {/* Email Notifications */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Email Notifications</h3>
                <p className="text-slate-500 dark:text-gray-400 text-sm mb-5">Choose what you receive in your inbox</p>
                
                <div className="space-y-4">
                  {[
                    { label: "New Lease Activity / Invoices", key: "newViolation" },
                    { label: "Payment Overdue Alert", key: "paymentOverdue" },
                    { label: "Maintenance Ticket Status Change", key: "serviceRequest" },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-white/10 last:border-0">
                      <div>
                        <p className="text-slate-900 dark:text-white text-sm">{item.label}</p>
                      </div>
                      <button
                        onClick={() => handleEmailToggle(item.key)}
                        className={`w-11 h-6 rounded-full relative transition-all ${emailNotifications[item.key] ? 'bg-blue-600' : 'bg-slate-200 dark:bg-gray-600'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${emailNotifications[item.key] ? 'right-0.5' : 'left-0.5'}`}></div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Push / In-App Notifications */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Push / In-App Notifications</h3>
                <div className="space-y-4">
                  {[
                    { label: "All In-App Notifications", key: "allInApp" },
                    { label: "SMS Alerts (critical only)", key: "smsCritical", sub: user?.mobile_number ? `Sent to ${formatUsPhone(user.mobile_number)}` : "No mobile number on file" },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-white/10 last:border-0">
                      <div>
                        <p className="text-slate-900 dark:text-white text-sm">{item.label}</p>
                        {item.sub && <p className="text-xs text-slate-400 dark:text-gray-500">{item.sub}</p>}
                      </div>
                      <button
                        onClick={() => handlePushToggle(item.key)}
                        className={`w-11 h-6 rounded-full relative transition-all ${pushNotifications[item.key] ? 'bg-blue-600' : 'bg-slate-200 dark:bg-gray-600'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${pushNotifications[item.key] ? 'right-0.5' : 'left-0.5'}`}></div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={handleSaveNotifications} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-medium transition flex items-center justify-center gap-2">
                <Save size={16} />
                Save Preferences
              </button>
            </div>
          )}

          {/* ── Password Tab ── */}
          {activeTab === 'password' && (
            <div className="bg-white dark:bg-[#162535] border border-slate-200 dark:border-white/10 rounded-3xl p-6 space-y-5 text-slate-900 dark:text-white">
              <p className="text-slate-500 dark:text-gray-400 text-sm">
                An OTP will be sent to <span className="text-slate-800 dark:text-white font-medium">{user?.email_id || user?.email}</span>
              </p>

              {!otpSent ? (
                <button onClick={handleSendOtp} disabled={sendingOtp} className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-2xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2">
                  <Mail size={16} />
                  {sendingOtp ? 'Sending OTP...' : 'Send OTP to Email'}
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">OTP Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="6 digit OTP"
                      value={pwdForm.otp_code}
                      onChange={e => setPwdForm({...pwdForm, otp_code: e.target.value})}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-[#1E3248] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-500 tracking-widest"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">New Password</label>
                    <div className="relative">
                      <input type={showPwd ? 'text' : 'password'} placeholder="Min 8 chars, 1 uppercase, 1 number" value={pwdForm.new_password} onChange={e => setPwdForm({...pwdForm, new_password: e.target.value})} className="w-full bg-slate-50 dark:bg-[#1E3248] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-3.5 text-slate-400 dark:text-gray-400">
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Confirm Password</label>
                    <input type="password" placeholder="Re-enter new password" value={pwdForm.confirm} onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})} className="w-full bg-slate-50 dark:bg-[#1E3248] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                    <button 
                      onClick={handleSendOtp} 
                      disabled={sendingOtp} 
                      className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-2xl text-sm font-medium transition disabled:opacity-50 cursor-pointer text-center"
                    >
                      Resend OTP
                    </button>
                    <button 
                      onClick={handlePasswordReset} 
                      disabled={saving} 
                      className="w-full sm:flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/10"
                    >
                      <Key size={16} className="flex-shrink-0" />
                      <span>{saving ? 'Updating...' : 'Update Password'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Phone Verification Modal */}
      {showPhoneVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white dark:bg-[#162535] border border-slate-200 dark:border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-in fade-in duration-200">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Verify Mobile Number</h3>
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">
              A 6-digit OTP code has been generated. Please enter it below to verify your phone number <span className="font-semibold">{user?.mobile_number}</span>.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">OTP Code</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="· · · · · ·"
                  value={phoneOtpCode}
                  onChange={e => setPhoneOtpCode(e.target.value)}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-[#1E3248] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-widest text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-gray-700 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setShowPhoneVerifyModal(false)}
                className="w-full sm:flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-2xl font-medium transition cursor-pointer text-center text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyPhoneOtp}
                disabled={verifyingPhone}
                className="w-full sm:flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/10 text-sm"
              >
                <span>{verifyingPhone ? 'Verifying...' : 'Verify Code'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentalProfile;
