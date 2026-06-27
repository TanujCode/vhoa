import React, { useState, useEffect } from 'react';
import { HelpCircle, ArrowRight, CheckCircle, ShieldAlert, Building2 } from 'lucide-react';
import API from '../services/api';
import { toast } from 'react-hot-toast';

const RequestChangeModal = ({ isOpen, onClose, community, onSuccess }) => {
  const [formData, setFormData] = useState({
    requested_name: "",
    requested_units: "",
    reason: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (community && isOpen) {
      setFormData({
        requested_name: community.name || "",
        requested_units: community.community_size || "",
        reason: "",
      });
      setMessage("");
    }
  }, [community, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getPlanDetails = (units) => {
    const u = parseInt(units, 10);
    if (isNaN(u) || u <= 0) return { plan: "Unknown", price: 0 };
    if (u <= 100) return { plan: "Standard", price: 99, desc: "Standard Plan - Up to 100 units" };
    if (u <= 350) return { plan: "Premium", price: 199, desc: "Premium Plan - Up to 350 units" };
    if (u <= 1000) return { plan: "Enterprise", price: 499, desc: "Enterprise Plan - Up to 1000 units" };
    return { plan: "Custom", price: 0, isCustom: true, desc: "Custom Plan - Over 1000 units" };
  };

  const currentPlan = getPlanDetails(community?.community_size || 0);
  const requestedPlan = getPlanDetails(formData.requested_units || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      toast.error("Please provide a reason for the change request.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const payload = {
        requested_name: formData.requested_name.trim() !== community.name ? formData.requested_name.trim() : null,
        requested_units: Number(formData.requested_units) !== community.community_size ? Number(formData.requested_units) : null,
        reason: formData.reason.trim(),
      };

      if (!payload.requested_name && !payload.requested_units) {
        toast.error("No modifications requested. Please update the name or unit count.");
        setLoading(false);
        return;
      }

      await API.post(`/community/${community.community_id}/change-request`, payload);
      setMessage("✅ Change request submitted to Super Admin!");
      toast.success("Request submitted successfully!");
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err.response?.data);
      const errMsg = err.response?.data?.detail || err.message;
      setMessage(`❌ ${errMsg}`);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-gradient-to-br dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Building2 size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Request Community Changes</h2>
            <p className="text-slate-500 dark:text-gray-400 text-xs mt-0.5">Submit settings or plan size updates to Super Admin for approval</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Community Name</label>
            <input 
              name="requested_name" 
              value={formData.requested_name} 
              onChange={handleChange} 
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl p-3.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-teal-500 placeholder-slate-400" 
              placeholder="Enter new community name" 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Requested Units (Size)</label>
              <input 
                type="number"
                name="requested_units" 
                value={formData.requested_units} 
                onChange={handleChange} 
                className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl p-3.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-teal-500" 
              />
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 p-3 rounded-2xl flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Current Size</span>
              <span className="text-sm font-bold mt-0.5">{community?.community_size || 0} Units ({currentPlan.plan})</span>
            </div>
          </div>

          {/* Pricing Preview Panel */}
          {formData.requested_units && Number(formData.requested_units) !== community?.community_size && (
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-[#1E3248] dark:to-[#162535] border border-indigo-200 dark:border-indigo-500/20 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-350">New Subscription Plan</span>
                <span className="font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">{requestedPlan.plan}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-350">Estimated Billing Rate</span>
                {requestedPlan.isCustom ? (
                  <span className="font-bold text-indigo-650 dark:text-indigo-400">Contact Sales (Custom Quote)</span>
                ) : (
                  <span className="font-black text-indigo-650 dark:text-indigo-400">${requestedPlan.price} / month</span>
                )}
              </div>
              {currentPlan.plan !== requestedPlan.plan && (
                <div className="text-[10px] text-teal-650 dark:text-teal-400 flex items-center gap-1 mt-1 font-medium">
                  <CheckCircle size={12} className="shrink-0" />
                  <span>Tier upgrade: {currentPlan.plan} to {requestedPlan.plan}</span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Reason for Request *</label>
            <textarea 
              name="reason" 
              value={formData.reason} 
              onChange={handleChange} 
              required
              rows="3"
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl p-3.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-teal-500 placeholder-slate-400 dark:placeholder-gray-500 resize-none" 
              placeholder="Brief explanation for this plan/name change request..." 
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose} 
              className="flex-1 py-3.5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl text-slate-600 dark:text-gray-400 text-sm font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-teal-600 hover:bg-teal-500 py-3.5 rounded-2xl font-semibold text-white disabled:opacity-50 transition shadow-lg shadow-teal-500/25 flex items-center justify-center gap-1.5"
            >
              {loading ? "Submitting..." : "Submit Request"}
              <ArrowRight size={15} />
            </button>
          </div>

          {message && (
            <div className={`p-3 rounded-2xl text-center text-xs font-semibold mt-2 ${
              message.includes('✅') ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20'
            }`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default RequestChangeModal;
