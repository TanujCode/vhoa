import React, { useState, useRef, useEffect } from 'react';
import {
  Camera, Mail, Phone, Shield, Clock,
  CheckCircle, XCircle, Save, Key, Eye, EyeOff, User, Bell, Trash2
} from 'lucide-react';
import API, { getBaseUrl } from '../services/api';

const Profile = ({ user, setUser, viewRole }) => {
  // ── Form State ────────────────────────────
  const [form, setForm] = useState({
    first_name:    user?.first_name    || '',
    middle_name:   user?.middle_name   || '',
    last_name:     user?.last_name     || '',
    mobile_number: user?.mobile_number || '',
    time_zone:     user?.time_zone     || 'America/New_York',
    unit_no_2:     user?.unit_no_2     || '',
  });

  const [secondaryUnits, setSecondaryUnits] = useState(
    user?.unit_no_2 ? user.unit_no_2.split(',').map(u => u.trim()).filter(Boolean) : []
  );

  useEffect(() => {
    setSecondaryUnits(
      user?.unit_no_2 ? user.unit_no_2.split(',').map(u => u.trim()).filter(Boolean) : []
    );
  }, [user?.unit_no_2]);

  const [unitInput, setUnitInput] = useState('');

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

  // ── Notification Toggles (New) ─────────────
  const [emailNotifications, setEmailNotifications] = useState({
    newViolation: true,
    paymentOverdue: true,
    newMember: true,
    serviceRequest: false,
    weeklyDigest: true,
  });

  const [pushNotifications, setPushNotifications] = useState({
    allInApp: true,
    soundAlerts: false,
    smsCritical: true,
  });

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

      let finalUnits = [...secondaryUnits];
      const trimmedInput = unitInput.trim();
      if (trimmedInput && !finalUnits.includes(trimmedInput)) {
        finalUnits.push(trimmedInput);
        setSecondaryUnits(finalUnits);
        setUnitInput('');
      }

      const payload = {
        ...form,
        unit_no_2: finalUnits.join(', ')
      };
      const res = await API.put('/user/profile', payload);
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
      const newUrl = res.data.user_profile_url;
      // Update React state
      setUser(prev => {
        const updated = { ...prev, user_profile_url: newUrl };
        // Persist to localStorage so re-login shows the new picture
        try {
          const stored = localStorage.getItem('user');
          if (stored) {
            const parsed = JSON.parse(stored);
            localStorage.setItem('user', JSON.stringify({ ...parsed, user_profile_url: newUrl }));
          }
        } catch (_) {}
        return updated;
      });
      showMsg('success', 'Profile picture updated!');
    } catch (err) {
      showMsg('error', 'Failed to upload picture.');
    } finally {
      setUploading(false);
    }
  };

  //  Remove Profile Picture Logic ────────────────
  const handleRemovePicture = async () => {
    if (!window.confirm("Are you sure you want to remove this photo?")) return;
    try {
      setUploading(true);
      await API.delete('/user/profile/picture'); 
      setUser(prev => {
        const updated = { ...prev, user_profile_url: null };
        // Persist removal to localStorage
        try {
          const stored = localStorage.getItem('user');
          if (stored) {
            const parsed = JSON.parse(stored);
            localStorage.setItem('user', JSON.stringify({ ...parsed, user_profile_url: null }));
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
      const res = await API.post('/user/profile/id-proof', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(prev => ({ ...prev, id_proof_url: res.data.id_proof_url }));
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
      const res = await API.post('/user/profile/address-proof', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(prev => ({ ...prev, address_proof_url: res.data.address_proof_url }));
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

  const isResident = (viewRole || user?.role_name || user?.role) === 'resident';
  const currentRole = (viewRole || user?.role_name || user?.role || '').toLowerCase();
  const isStaff = ['super_admin', 'sales_admin'].includes(currentRole);

  return (
    <div className="text-slate-900 dark:text-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Profile Settings</h1>
        <p className="text-slate-555 dark:text-gray-400 mt-1">Manage your account and preferences</p>
      </div>

      {/* Message */}
      {msg.text && (
        <div className={`mb-6 px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-2 ${
          msg.type === 'success'
            ? 'bg-teal-500/10 text-teal-700 border border-teal-500/20 dark:bg-teal-500/20 dark:text-teal-400 dark:border-teal-500/30'
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
            <div className="relative mb-4 group">
              {user?.user_profile_url ? (
                <img
                  src={getBaseUrl(user.user_profile_url)}
                  alt="Profile"
                  className="w-28 h-28 rounded-3xl object-cover"
                />
              ) : (
                <div className="w-28 h-28 bg-gradient-to-br from-teal-500 to-blue-600 rounded-3xl flex items-center justify-center text-4xl font-bold text-white">
                  {user?.initials || <User size={40} />}
                </div>
              )}
              
              {/* Camera Button */}
              <button
                onClick={() => fileRef.current.click()}
                disabled={uploading}
                className="absolute -bottom-2 -right-2 w-9 h-9 bg-teal-600 hover:bg-teal-500 text-white rounded-xl flex items-center justify-center transition shadow-lg z-10 border-2 border-white dark:border-[#162535]"
              >
                <Camera size={16} />
              </button>

              {/* Remove Button */}
              {user?.user_profile_url && (
                <button
                  onClick={handleRemovePicture}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-650 text-white rounded-lg flex items-center justify-center transition-all shadow-lg z-20 border-2 border-white dark:border-[#162535] opacity-0 group-hover:opacity-100"
                  title="Remove Photo"
                >
                  <Trash2 size={14} />
                </button>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePictureUpload}
              />
            </div>

            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{user?.name || user?.full_name}</h3>
            <p className="text-slate-550 dark:text-gray-400 text-sm capitalize mt-1">
              {(viewRole || user?.role)?.replace('_', ' ')}
            </p>

            {/* Verification Status */}
            <div className="w-full mt-5 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Mail size={13} /> Email
                </span>
                <span className={user?.email_id_is_verified ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}>
                  {user?.email_id_is_verified ? '✓ Verified' : '✗ Not verified'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Phone size={13} /> Phone
                </span>
                <span className={user?.mobile_is_verified ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}>
                  {user?.mobile_is_verified ? '✓ Verified' : '✗ Not verified'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Shield size={13} /> Account
                </span>
                <span className={
                  user?.account_status === 'ACTIVE' ? 'text-teal-600 dark:text-teal-400' :
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
                <span className="font-mono text-slate-800 dark:text-slate-200">#{user?.user_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-gray-400">Role</span>
                <span className="capitalize text-slate-800 dark:text-slate-200">{(viewRole || user?.role_name || user?.role)?.replace('_', ' ')}</span>
              </div>
              {!isStaff && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-gray-400">Unit / Address</span>
                    <span className="text-slate-800 dark:text-slate-200">{user?.unit_no || '—'}</span>
                  </div>
                  {user?.unit_no_2 && (
                    <div className="flex flex-col gap-1 py-1">
                      <span className="text-slate-500 dark:text-gray-400 text-xs">Other Units (P2)</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {user.unit_no_2.split(',').map(u => u.trim()).filter(Boolean).map((unit, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400 border border-teal-500/10 text-xs font-medium">
                            {unit}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
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
                    ? 'bg-teal-600 hover:bg-teal-700 text-white hover:text-white'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/10 text-slate-655 dark:text-gray-400 dark:hover:bg-white/20'
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
                  <input type="text" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} className="w-full bg-slate-50 dark:bg-[#1E3248] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Middle Name</label>
                  <input type="text" value={form.middle_name} onChange={e => setForm({...form, middle_name: e.target.value})} placeholder="Optional" className="w-full bg-slate-50 dark:bg-[#1E3248] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:border-teal-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Last Name</label>
                  <input type="text" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} className="w-full bg-slate-50 dark:bg-[#1E3248] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500" />
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
                  type="tel"
                  value={form.mobile_number}
                  onChange={e => setForm({...form, mobile_number: e.target.value})}
                  onKeyPress={(e) => {
                    if (!/[\d\s\-+]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  placeholder="+1 512-555-0198"
                  className="w-full bg-slate-50 dark:bg-[#1E3248] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Timezone</label>
                <select value={form.time_zone} onChange={e => setForm({...form, time_zone: e.target.value})} className="w-full bg-slate-50 dark:bg-[#1E3248] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer">
                  {timezones.map(tz => <option key={tz.value} value={tz.value} className="text-slate-900 dark:text-white">{tz.label}</option>)}
                </select>
              </div>

              {!isStaff && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Primary Unit / Address</label>
                      <input type="text" value={user?.unit_no || '—'} disabled className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-slate-400 dark:text-gray-500 cursor-not-allowed" />
                      <p className="text-xs text-slate-450 dark:text-gray-600 mt-1">Primary Unit cannot be changed</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Secondary Units / Addresses (P2)</label>
                      <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-[#1E3248] border border-slate-200 dark:border-white/10 rounded-xl min-h-[46px] items-center">
                        {secondaryUnits.map((unit, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-500/10 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400 border border-teal-500/20">
                            {unit}
                            {!isResident && (
                              <button type="button" onClick={() => setSecondaryUnits(secondaryUnits.filter((_, i) => i !== idx))} className="hover:text-red-500 transition-colors ml-1">
                                <XCircle size={12} />
                              </button>
                            )}
                          </span>
                        ))}
                        {!isResident ? (
                          <input
                            type="text"
                            value={unitInput}
                            onChange={(e) => setUnitInput(e.target.value)}
                            placeholder={secondaryUnits.length === 0 ? "e.g. Unit 2B, press Enter to add" : "Add unit..."}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const val = unitInput.trim();
                                  if (val && !secondaryUnits.includes(val)) {
                                    setSecondaryUnits([...secondaryUnits, val]);
                                    setUnitInput('');
                                  }
                              }
                            }}
                            className="flex-1 bg-transparent border-0 outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:ring-0 p-0 min-w-[120px]"
                          />
                        ) : (
                          secondaryUnits.length === 0 && <span className="text-xs text-slate-400 dark:text-gray-500">No secondary units assigned</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-450 dark:text-gray-600 mt-1">
                        {isResident 
                          ? "Residents cannot modify their own unit numbers. Please contact a Board Member or Property Manager to request changes." 
                          : "Press Enter to add multiple units. Click the 'X' to remove a unit."}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-white/10 pt-5 space-y-4">
                    <h4 className="font-semibold text-sm text-slate-800 dark:text-white">Verification Documents</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* ID Proof */}
                      <div className="bg-slate-550/5 border border-slate-200 dark:border-white/5 rounded-3xl p-5 flex flex-col justify-between gap-4 transition hover:shadow-md">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-400 dark:text-gray-455 tracking-wider uppercase">Identity Proof</span>
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
                                className="inline-flex items-center gap-1.5 text-xs text-teal-650 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300 font-medium transition bg-teal-500/5 hover:bg-teal-500/10 px-3 py-1.5 rounded-lg border border-teal-500/10"
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
                      <div className="bg-slate-555/5 border border-slate-200 dark:border-white/5 rounded-3xl p-5 flex flex-col justify-between gap-4 transition hover:shadow-md">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-400 dark:text-gray-455 tracking-wider uppercase">Address Proof</span>
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
                </>
              )}

              <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
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
                    { label: "New Violation Submitted", key: "newViolation" },
                    { label: "Payment Overdue Alert", key: "paymentOverdue" },
                    { label: "New Member Join Request", key: "newMember" },
                    { label: "Service Request Status Change", key: "serviceRequest" },
                    { label: "Weekly Digest Report", key: "weeklyDigest", sub: "Summary of all communities every Monday" },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-white/10 last:border-0">
                      <div>
                        <p className="text-slate-900 dark:text-white text-sm">{item.label}</p>
                        {item.sub && <p className="text-xs text-slate-450 dark:text-gray-500">{item.sub}</p>}
                      </div>
                      <button
                        onClick={() => setEmailNotifications(prev => ({...prev, [item.key]: !prev[item.key]}))}
                        className={`w-11 h-6 rounded-full relative transition-all ${emailNotifications[item.key] ? 'bg-teal-600' : 'bg-slate-200 dark:bg-gray-600'}`}
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
                    { label: "Sound Alerts", key: "soundAlerts" },
                    { label: "SMS Alerts (critical only)", key: "smsCritical", sub: "Sent to +1 512-555-0198" },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-white/10 last:border-0">
                      <div>
                        <p className="text-slate-900 dark:text-white text-sm">{item.label}</p>
                        {item.sub && <p className="text-xs text-slate-455 dark:text-gray-500">{item.sub}</p>}
                      </div>
                      <button
                        onClick={() => setPushNotifications(prev => ({...prev, [item.key]: !prev[item.key]}))}
                        className={`w-11 h-6 rounded-full relative transition-all ${pushNotifications[item.key] ? 'bg-teal-600' : 'bg-slate-200 dark:bg-gray-600'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${pushNotifications[item.key] ? 'right-0.5' : 'left-0.5'}`}></div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2">
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
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
                      className="w-full bg-slate-50 dark:bg-[#1E3248] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:border-teal-500 tracking-widest"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">New Password</label>
                    <div className="relative">
                      <input type={showPwd ? 'text' : 'password'} placeholder="Min 8 chars, 1 uppercase, 1 number" value={pwdForm.new_password} onChange={e => setPwdForm({...pwdForm, new_password: e.target.value})} className="w-full bg-slate-50 dark:bg-[#1E3248] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:border-teal-500" />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-3.5 text-slate-400 dark:text-gray-400">
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block">Confirm Password</label>
                    <input type="password" placeholder="Re-enter new password" value={pwdForm.confirm} onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})} className="w-full bg-slate-50 dark:bg-[#1E3248] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:border-teal-500" />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={handleSendOtp} disabled={sendingOtp} className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-2xl text-sm transition disabled:opacity-50">Resend OTP</button>
                    <button onClick={handlePasswordReset} disabled={saving} className="flex-1 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2">
                      <Key size={16} /> {saving ? 'Updating...' : 'Update Password'}
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