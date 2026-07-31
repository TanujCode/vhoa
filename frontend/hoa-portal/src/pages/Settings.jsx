import React, { useState, useEffect } from 'react';
import { Clock, Save, DollarSign, Eye, RefreshCw, ChevronDown, Globe, Settings2, Building2, ClipboardList } from 'lucide-react';
import API from '../services/api';
import { toast } from 'react-hot-toast';
import RequestChangeModal from '../components/RequestChangeModal';


const Toggle = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    className={`w-11 h-6 rounded-full relative transition-all duration-200 ${value ? 'bg-blue-600' : 'bg-gray-600'}`}
  >
    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all duration-200 ${value ? 'right-0.5' : 'left-0.5'}`} />
  </button>
);

const Settings = ({ community, onCommunityUpdate }) => {
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);

  const [form, setForm] = useState({

    time_zone:              community?.time_zone || 'America/New_York',
    amenity_fee_enabled:    false,
    violation_fee_enabled:  false,
    late_fee_enabled:       false,
    late_fee_days:          7,
    late_fee_amount:        25,
    bank_name:              '',
    bank_account_no:        '',
    bank_routing_no:        '',
    bank_account_name:      '',
  });

  // Visible tabs for members
  const [tabs, setTabs] = useState({
    payments:        true,
    violations:      true,
    service_requests: true,
    amenity_booking: true,
    faqs:            true,
    documents:       true,
    news:            true,
    ai_assistant:    true,
  });

  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    let errorMsg = '';
    const trimmed = (value || '').toString().trim();

    if (name === 'bank_name' && trimmed) {
      if (/[^a-zA-Z\s.\-']/.test(trimmed)) {
        errorMsg = 'Bank name can only contain letters, spaces, dots, hyphens, and apostrophes';
      }
    } else if (name === 'bank_account_name' && trimmed) {
      if (/[^a-zA-Z\s.\-']/.test(trimmed)) {
        errorMsg = 'Account holder name can only contain letters, spaces, dots, hyphens, and apostrophes';
      }
    } else if (name === 'bank_account_no' && trimmed) {
      if (!/^\d+$/.test(trimmed)) {
        errorMsg = 'Account number must contain digits only';
      } else if (trimmed.length < 8 || trimmed.length > 17) {
        errorMsg = 'Account number must be between 8 and 17 digits';
      }
    } else if (name === 'bank_routing_no' && trimmed) {
      if (!/^\d+$/.test(trimmed)) {
        errorMsg = 'Routing number must contain digits only';
      } else if (trimmed.length !== 9) {
        errorMsg = 'Routing number must be exactly 9 digits';
      }
    } else if (name === 'late_fee_days') {
      const num = parseInt(value, 10);
      if (isNaN(num) || num < 1) {
        errorMsg = 'Late fee days must be at least 1 day';
      }
    } else if (name === 'late_fee_amount') {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        errorMsg = 'Late fee amount cannot be negative';
      }
    }

    setErrors(prev => ({ ...prev, [name]: errorMsg }));
    return errorMsg;
  };

  useEffect(() => {
    if (community?.community_id) fetchSettings();
  }, [community]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setErrors({});
      // Community ki existing settings load karo
      const res = await API.get(`/community/${community.community_id}`);
      const data = res.data;
      setForm(prev => ({
        ...prev,
        time_zone:             data.time_zone || 'America/New_York',
        amenity_fee_enabled:   data.amenity_fee_enabled || false,
        violation_fee_enabled: data.violation_fee_enabled || false,
        late_fee_enabled:      data.late_fee_enabled || false,
        late_fee_days:         data.late_fee_days || 7,
        late_fee_amount:       data.late_fee_amount || 25,
        bank_name:             data.bank_name || '',
        bank_account_no:       data.bank_account_no || '',
        bank_routing_no:       data.bank_routing_no || '',
        bank_account_name:     data.bank_account_name || '',
      }));
      if (data.visible_tabs) {
        setTabs(prev => ({
          ...prev,
          ...data.visible_tabs
        }));
      }
    } catch (err) {
      console.error('Settings fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate all fields
    const bankNameErr = validateField('bank_name', form.bank_name);
    const bankAccountNameErr = validateField('bank_account_name', form.bank_account_name);
    const bankAccountNoErr = validateField('bank_account_no', form.bank_account_no);
    const bankRoutingNoErr = validateField('bank_routing_no', form.bank_routing_no);
    
    let lateFeeDaysErr = '';
    let lateFeeAmountErr = '';
    if (form.late_fee_enabled) {
      lateFeeDaysErr = validateField('late_fee_days', form.late_fee_days);
      lateFeeAmountErr = validateField('late_fee_amount', form.late_fee_amount);
    }

    if (bankNameErr || bankAccountNameErr || bankAccountNoErr || bankRoutingNoErr || lateFeeDaysErr || lateFeeAmountErr) {
      toast.error('Please resolve the validation errors before saving.');
      return;
    }

    try {
      setSaving(true);
      const res = await API.put(`/community/${community.community_id}`, {
        time_zone: form.time_zone,
        amenity_fee_enabled: form.amenity_fee_enabled,
        violation_fee_enabled: form.violation_fee_enabled,
        late_fee_enabled: form.late_fee_enabled,
        late_fee_days: form.late_fee_days,
        late_fee_amount: form.late_fee_amount,
        bank_name: form.bank_name,
        bank_account_no: form.bank_account_no,
        bank_routing_no: form.bank_routing_no,
        bank_account_name: form.bank_account_name,
        visible_tabs: tabs,
      });
      setSaved(true);
      if (onCommunityUpdate) {
        onCommunityUpdate(res.data);
      }
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const timezones = [
    { value: 'America/New_York',    label: 'EST — Eastern Standard Time (UTC-5)' },
    { value: 'America/Chicago',     label: 'CST — Central Standard Time (UTC-6)' },
    { value: 'America/Denver',      label: 'MST — Mountain Standard Time (UTC-7)' },
    { value: 'America/Los_Angeles', label: 'PST — Pacific Standard Time (UTC-8)' },
    { value: 'Asia/Kolkata',        label: 'IST — India Standard Time (UTC+5:30)' },
    { value: 'UTC',                 label: 'UTC' },
  ];

  return (
    <div className="text-slate-900 dark:text-white">
      <div className="flex justify-between items-center mb-6">
        <div className="text-slate-500 dark:text-gray-400 text-sm font-semibold">
          {community?.name} Settings
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-pulse">
              ✓ Settings saved!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-70 transition shadow-md shadow-blue-500/25"
          >
            <Save size={13} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Timezone */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200 dark:border-white/10 rounded-3xl p-8 mb-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-3 text-slate-900 dark:text-white">
          <Globe size={16} className="inline mr-1" /> Platform Timezone
        </h2>

        <div className="bg-slate-50 dark:bg-[#1E3248] border border-slate-200 dark:border-0 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
              <Clock size={28} />
            </div>
            <div>
              <div className="text-xl font-mono font-bold text-slate-900 dark:text-white">
                {timezones.find(t => t.value === form.time_zone)?.label || form.time_zone}
              </div>
              <div className="text-slate-500 dark:text-gray-400 text-sm">Currently selected timezone</div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-500 dark:text-gray-400 mb-2">Select Timezone</label>
            <div className="relative">
              <select
                value={form.time_zone}
                onChange={e => setForm({...form, time_zone: e.target.value})}
                className="w-full bg-white dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl pl-4 pr-10 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer text-sm"
              >
                {timezones.map(tz => (
                  <option key={tz.value} value={tz.value} className="text-slate-900 dark:text-white">{tz.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={18} />
            </div>
          </div>

          <div className="mt-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-500/30 rounded-2xl p-4 text-sm text-blue-600 dark:text-blue-400">
            ✓ Applies to: Dashboard, Audit History, Payment dates, Violation dates, Email notifications
          </div>
        </div>
      </div>

      {/* Community Configuration */}
      <h2 className="text-xl font-semibold mb-5 text-slate-900 dark:text-white flex items-center gap-2"><Settings2 size={20} /> Community Configuration</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Payment Config */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <DollarSign className="text-blue-600 dark:text-blue-400" size={24} />
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Payment Configuration</h3>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700 dark:text-gray-200">Charge for Amenity Booking</span>
              <Toggle
                value={form.amenity_fee_enabled}
                onChange={v => setForm({...form, amenity_fee_enabled: v})}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700 dark:text-gray-200">Charge for Violations</span>
              <Toggle
                value={form.violation_fee_enabled}
                onChange={v => setForm({...form, violation_fee_enabled: v})}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700 dark:text-gray-200">Enable Late Fees</span>
              <Toggle
                value={form.late_fee_enabled}
                onChange={v => setForm({...form, late_fee_enabled: v})}
              />
            </div>

            {form.late_fee_enabled && (
              <div className="bg-slate-50 dark:bg-[#1E3248] border border-slate-200 dark:border-0 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-gray-400">Late after (days)</span>
                    <input
                      type="number"
                      min="1"
                      value={form.late_fee_days}
                      onChange={e => {
                        const val = e.target.value ? parseInt(e.target.value, 10) : '';
                        setForm({...form, late_fee_days: val});
                        validateField('late_fee_days', val);
                      }}
                      className={`w-20 bg-white dark:bg-[#0D1B2A] border ${errors.late_fee_days ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/20 focus:border-blue-500'} rounded-xl px-3 py-1.5 text-sm text-slate-900 dark:text-white text-center focus:outline-none`}
                    />
                  </div>
                  {errors.late_fee_days && (
                    <p className="text-red-500 text-[10px] mt-1 text-right">{errors.late_fee_days}</p>
                  )}
                </div>
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-gray-400">Late fee amount ($)</span>
                    <input
                      type="number"
                      min="0"
                      value={form.late_fee_amount}
                      onChange={e => {
                        const val = e.target.value ? parseFloat(e.target.value) : '';
                        setForm({...form, late_fee_amount: val});
                        validateField('late_fee_amount', val);
                      }}
                      className={`w-20 bg-white dark:bg-[#0D1B2A] border ${errors.late_fee_amount ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/20 focus:border-blue-500'} rounded-xl px-3 py-1.5 text-sm text-slate-900 dark:text-white text-center focus:outline-none`}
                    />
                  </div>
                  {errors.late_fee_amount && (
                    <p className="text-red-500 text-[10px] mt-1 text-right">{errors.late_fee_amount}</p>
                  )}
                </div>
              </div>
            )}

            {/* HOA Escrow Bank Details */}
            <div className="bg-slate-50 dark:bg-[#1E3248] border border-slate-200 dark:border-0 rounded-2xl p-4 mt-4 space-y-3">
              <h4 className="font-medium text-sm text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-white/10 pb-2 flex items-center gap-2"><Building2 size={14} /> HOA Escrow Bank Details</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Chase Bank"
                    value={form.bank_name}
                    onChange={e => {
                      setForm({...form, bank_name: e.target.value});
                      validateField('bank_name', e.target.value);
                    }}
                    className={`w-full bg-white dark:bg-[#0D1B2A] border ${errors.bank_name ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/20 focus:border-blue-500'} rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none`}
                  />
                  {errors.bank_name && (
                    <p className="text-red-500 text-xs mt-1">{errors.bank_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sunset HOA Escrow Account"
                    value={form.bank_account_name}
                    onChange={e => {
                      setForm({...form, bank_account_name: e.target.value});
                      validateField('bank_account_name', e.target.value);
                    }}
                    className={`w-full bg-white dark:bg-[#0D1B2A] border ${errors.bank_account_name ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/20 focus:border-blue-500'} rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none`}
                  />
                  {errors.bank_account_name && (
                    <p className="text-red-500 text-xs mt-1">{errors.bank_account_name}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Account Number</label>
                    <input
                      type="text"
                      placeholder="Account No"
                      value={form.bank_account_no}
                      onChange={e => {
                        setForm({...form, bank_account_no: e.target.value});
                        validateField('bank_account_no', e.target.value);
                      }}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className={`w-full bg-white dark:bg-[#0D1B2A] border ${errors.bank_account_no ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/20 focus:border-blue-500'} rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none`}
                    />
                    {errors.bank_account_no && (
                      <p className="text-red-500 text-xs mt-1">{errors.bank_account_no}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Routing Number</label>
                    <input
                      type="text"
                      placeholder="Routing No"
                      value={form.bank_routing_no}
                      onChange={e => {
                        setForm({...form, bank_routing_no: e.target.value});
                        validateField('bank_routing_no', e.target.value);
                      }}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className={`w-full bg-white dark:bg-[#0D1B2A] border ${errors.bank_routing_no ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/20 focus:border-blue-500'} rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none`}
                    />
                    {errors.bank_routing_no && (
                      <p className="text-red-500 text-xs mt-1">{errors.bank_routing_no}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visible Tabs */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <Eye className="text-blue-600 dark:text-blue-400" size={24} />
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Visible Tabs for Members</h3>
          </div>

          <div className="space-y-4">
            {Object.entries(tabs).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm capitalize text-slate-700 dark:text-gray-200">
                  {key === 'ai_assistant' ? 'AI Copilot Assistant (Dashboard)' : key.replace('_', ' ') + ' Tab'}
                </span>
                <Toggle
                  value={value}
                  onChange={v => setTabs(prev => ({...prev, [key]: v}))}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Community Info */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200 dark:border-white/10 rounded-3xl p-6 mt-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2"><ClipboardList size={18} /> Community Info</h3>
          <button
            onClick={() => setIsChangeModalOpen(true)}
            className="text-xs bg-blue-500/10 dark:bg-blue-500/25 border-2 border-blue-500/30 hover:border-blue-500 hover:bg-blue-500 hover:text-white text-blue-700 dark:text-blue-400 dark:hover:text-white dark:hover:bg-blue-500 px-3.5 py-2 rounded-xl font-bold transition-all duration-200 active:scale-95 flex items-center gap-1.5 shadow-sm"
          >
            Request Changes
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-500 dark:text-gray-400">Community Code</p>
            <p className="font-mono font-bold text-blue-600 dark:text-blue-400 mt-1">{community?.community_code || '—'}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-gray-400">License Status</p>
            <p className="font-medium mt-1 text-slate-800 dark:text-slate-200">{community?.license_status || '—'}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-gray-400">Total Units</p>
            <p className="font-medium mt-1 text-slate-800 dark:text-slate-200">{community?.community_size || '—'}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-gray-400">Plan Expires</p>
            <p className="font-medium mt-1 text-slate-800 dark:text-slate-200">{community?.plan_expire_date || '—'}</p>
          </div>
        </div>
      </div>

      <RequestChangeModal
        isOpen={isChangeModalOpen}
        onClose={() => setIsChangeModalOpen(false)}
        community={community}
        onSuccess={fetchSettings}
      />
    </div>
  );
};

export default Settings;