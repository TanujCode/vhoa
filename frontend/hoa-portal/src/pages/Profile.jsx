import React, { useState, useRef } from 'react';
import {
  Camera, Mail, Phone, Shield, Clock,
  CheckCircle, XCircle, Save, Key, Eye, EyeOff, User
} from 'lucide-react';
import API from '../services/api';

const Profile = ({ user, setUser }) => {
  // ── Form State ────────────────────────────
  const [form, setForm] = useState({
    first_name:    user?.first_name    || '',
    middle_name:   user?.middle_name   || '',
    last_name:     user?.last_name     || '',
    mobile_number: user?.mobile_number || '',
    time_zone:     user?.time_zone     || 'America/New_York',
  });

  // ── Password State ────────────────────────
  const [pwdForm, setPwdForm] = useState({
    otp_code:     '',
    new_password: '',
    confirm:      '',
  });
  const [showPwd, setShowPwd]       = useState(false);
  const [otpSent, setOtpSent]       = useState(false);
  const [otpCode, setOtpCode]       = useState('');

  // ── UI State ──────────────────────────────
  const [saving, setSaving]         = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [activeTab, setActiveTab]   = useState('profile');
  const [msg, setMsg]               = useState({ type: '', text: '' });

  const fileRef = useRef();

  const timezones = [
    { value: 'America/New_York',    label: 'Eastern (EST)' },
    { value: 'America/Chicago',     label: 'Central (CST)' },
    { value: 'America/Denver',      label: 'Mountain (MST)' },
    { value: 'America/Los_Angeles', label: 'Pacific (PST)' },
    { value: 'Asia/Kolkata',        label: 'India (IST)' },
    { value: 'UTC',                 label: 'UTC' },
  ];

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  // ── Profile Update ────────────────────────
  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await API.put('/user/profile', form);
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
    } catch (err) {
      showMsg('error', err.response?.data?.detail || 'Failed to update profile.');
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
      const res = await API.post('/user/profile/picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(prev => ({ ...prev, user_profile_url: res.data.user_profile_url }));
      showMsg('success', 'Profile picture updated!');
    } catch (err) {
      showMsg('error', 'Failed to upload picture.');
    } finally {
      setUploading(false);
    }
  };

  // ── Send OTP for password reset ───────────
  const handleSendOtp = async () => {
    try {
      setSendingOtp(true);
      await API.post('/auth/otp/send', {
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

  // ── Password Reset ────────────────────────
  const handlePasswordReset = async () => {
    if (pwdForm.new_password !== pwdForm.confirm) {
      showMsg('error', 'Passwords do not match!');
      return;
    }
    try {
      setSaving(true);
      await API.post('/auth/password/reset', {
        email_id:     user?.email_id || user?.email,
        otp_code:     pwdForm.otp_code,
        new_password: pwdForm.new_password,
      });
      showMsg('success', 'Password changed! Please login again.');
      setPwdForm({ otp_code: '', new_password: '', confirm: '' });
      setOtpSent(false);
    } catch (err) {
      showMsg('error', err.response?.data?.detail || 'Failed to reset password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Profile Settings</h1>
        <p className="text-gray-400 mt-1">Manage your account and preferences</p>
      </div>

      {/* Message */}
      {msg.text && (
        <div className={`mb-6 px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-2 ${
          msg.type === 'success'
            ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {msg.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left Column — Avatar + Info ── */}
        <div className="space-y-5">

          {/* Avatar Card */}
          <div className="bg-[#162535] border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
              {user?.user_profile_url ? (
                <img
                  src={`http://localhost:9999${user.user_profile_url}`}
                  alt="Profile"
                  className="w-28 h-28 rounded-3xl object-cover"
                />
              ) : (
                <div className="w-28 h-28 bg-gradient-to-br from-teal-500 to-blue-600 rounded-3xl flex items-center justify-center text-4xl font-bold">
                  {user?.initials || <User size={40} />}
                </div>
              )}
              <button
                onClick={() => fileRef.current.click()}
                disabled={uploading}
                className="absolute -bottom-2 -right-2 w-9 h-9 bg-teal-600 hover:bg-teal-500 rounded-xl flex items-center justify-center transition"
              >
                <Camera size={16} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePictureUpload}
              />
            </div>

            <h3 className="text-xl font-semibold">{user?.name || user?.full_name}</h3>
            <p className="text-gray-400 text-sm capitalize mt-1">
              {user?.role?.replace('_', ' ')}
            </p>

            {/* Verification Status */}
            <div className="w-full mt-5 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Mail size={13} /> Email
                </span>
                <span className={user?.email_id_is_verified ? 'text-teal-400' : 'text-red-400'}>
                  {user?.email_id_is_verified ? '✓ Verified' : '✗ Not verified'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Phone size={13} /> Phone
                </span>
                <span className={user?.mobile_is_verified ? 'text-teal-400' : 'text-red-400'}>
                  {user?.mobile_is_verified ? '✓ Verified' : '✗ Not verified'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Shield size={13} /> Account
                </span>
                <span className={
                  user?.account_status === 'ACTIVE' ? 'text-teal-400' :
                  user?.account_status === 'LOCKED' ? 'text-red-400' : 'text-amber-400'
                }>
                  {user?.account_status || 'PENDING'}
                </span>
              </div>
            </div>
          </div>

          {/* Account Info Card */}
          <div className="bg-[#162535] border border-white/10 rounded-3xl p-6 space-y-3">
            <h4 className="font-medium text-sm text-gray-400 uppercase tracking-wider">Account Info</h4>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">User ID</span>
                <span className="font-mono">#{user?.user_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Role</span>
                <span className="capitalize">{user?.role_name?.replace('_', ' ') || user?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Timezone</span>
                <span>{user?.time_zone || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Last Login</span>
                <span>{user?.last_login ? new Date(user.last_login).toLocaleDateString() : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column — Tabs ── */}
        <div className="lg:col-span-2">

          {/* Tabs */}
          <div className="flex gap-2 mb-5">
            {[
              { id: 'profile',  label: 'Edit Profile' },
              { id: 'password', label: 'Change Password' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-2xl text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-teal-600 text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Profile Tab ── */}
          {activeTab === 'profile' && (
            <div className="bg-[#162535] border border-white/10 rounded-3xl p-6 space-y-5">

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">First Name</label>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={e => setForm({...form, first_name: e.target.value})}
                    className="w-full bg-[#1E3248] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Middle Name</label>
                  <input
                    type="text"
                    value={form.middle_name}
                    onChange={e => setForm({...form, middle_name: e.target.value})}
                    placeholder="Optional"
                    className="w-full bg-[#1E3248] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Last Name</label>
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={e => setForm({...form, last_name: e.target.value})}
                    className="w-full bg-[#1E3248] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Email Address</label>
                <input
                  type="email"
                  value={user?.email_id || user?.email}
                  disabled
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-600 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Mobile Number</label>
                <input
                  type="tel"
                  value={form.mobile_number}
                  onChange={e => setForm({...form, mobile_number: e.target.value})}
                  placeholder="+1 512-555-0198"
                  className="w-full bg-[#1E3248] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Timezone</label>
                <select
                  value={form.time_zone}
                  onChange={e => setForm({...form, time_zone: e.target.value})}
                  className="w-full bg-[#1E3248] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500"
                >
                  {timezones.map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 rounded-2xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* ── Password Tab ── */}
          {activeTab === 'password' && (
            <div className="bg-[#162535] border border-white/10 rounded-3xl p-6 space-y-5">
              <p className="text-gray-400 text-sm">
                An OTP will be sent to <span className="text-white">{user?.email_id || user?.email}</span>
              </p>

              {/* Step 1 — Send OTP */}
              {!otpSent ? (
                <button
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-2xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Mail size={16} />
                  {sendingOtp ? 'Sending OTP...' : 'Send OTP to Email'}
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">OTP Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="6 digit OTP"
                      value={pwdForm.otp_code}
                      onChange={e => setPwdForm({...pwdForm, otp_code: e.target.value})}
                      className="w-full bg-[#1E3248] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500 tracking-widest"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">New Password</label>
                    <div className="relative">
                      <input
                        type={showPwd ? 'text' : 'password'}
                        placeholder="Min 8 chars, 1 uppercase, 1 number"
                        value={pwdForm.new_password}
                        onChange={e => setPwdForm({...pwdForm, new_password: e.target.value})}
                        className="w-full bg-[#1E3248] border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3 top-3.5 text-gray-400"
                      >
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Confirm Password</label>
                    <input
                      type="password"
                      placeholder="Re-enter new password"
                      value={pwdForm.confirm}
                      onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})}
                      className="w-full bg-[#1E3248] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSendOtp}
                      disabled={sendingOtp}
                      className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-sm transition disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                    <button
                      onClick={handlePasswordReset}
                      disabled={saving}
                      className="flex-1 py-3 bg-teal-600 hover:bg-teal-500 rounded-2xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Key size={16} />
                      {saving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;