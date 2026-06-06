import React, { useState, useEffect } from 'react';
import API from '../services/api';

const EditCommunityModal = ({ isOpen, onClose, community, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    community_size: 0,
    time_zone: "America/New_York",
    license_status: "ACTIVE",
    bank_name: "",
    bank_account_no: "",
    bank_routing_no: "",
    bank_account_name: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (community) {
      setFormData({
        name: community.name || "",
        contact_person: community.contact_person || "",
        community_size: community.community_size || 0,
        time_zone: community.time_zone || "America/New_York",
        license_status: community.license_status || "ACTIVE",
        bank_name: community.bank_name || "",
        bank_account_no: community.bank_account_no || "",
        bank_routing_no: community.bank_routing_no || "",
        bank_account_name: community.bank_account_name || "",
      });
    }
  }, [community, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = {
        name: formData.name.trim(),
        contact_person: formData.contact_person.trim() || null,
        community_size: Number(formData.community_size),
        time_zone: formData.time_zone,
        license_status: formData.license_status,
        bank_name: formData.bank_name.trim() || null,
        bank_account_no: formData.bank_account_no.trim() || null,
        bank_routing_no: formData.bank_routing_no.trim() || null,
        bank_account_name: formData.bank_account_name.trim() || null,
      };

      await API.put(`/community/${community.community_id}`, payload);
      setMessage("✅ Community Updated Successfully!");
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err.response?.data);
      setMessage(`❌ ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
      <div className="bg-white dark:bg-gradient-to-br dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-white/10">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Edit Community</h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Modify details for {community?.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div>
            <label className="block text-sm text-slate-500 dark:text-gray-400 mb-1">Community Name *</label>
            <input 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl p-3.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-teal-500 placeholder-slate-400 dark:placeholder-gray-500" 
              placeholder="Community Name" 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-500 dark:text-gray-400 mb-1">Total Units *</label>
              <input 
                type="number"
                name="community_size" 
                value={formData.community_size} 
                onChange={handleChange} 
                required
                className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl p-3.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-teal-500" 
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 dark:text-gray-400 mb-1">License Status</label>
              <select 
                name="license_status" 
                value={formData.license_status} 
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl p-3.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-teal-500"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-555 dark:text-gray-400 mb-1">Contact Person</label>
            <input 
              name="contact_person" 
              value={formData.contact_person} 
              onChange={handleChange} 
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl p-3.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-teal-500 placeholder-slate-400 dark:placeholder-gray-500" 
              placeholder="Rahul Sharma" 
            />
          </div>

          <div className="border-t border-slate-200 dark:border-white/10 pt-4">
            <h3 className="text-sm font-semibold mb-2 text-slate-700 dark:text-gray-300">Escrow Bank Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Bank Name</label>
                <input 
                  name="bank_name" 
                  value={formData.bank_name} 
                  onChange={handleChange} 
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl p-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-teal-500" 
                  placeholder="Chase Bank"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Routing Number</label>
                  <input 
                    name="bank_routing_no" 
                    value={formData.bank_routing_no} 
                    onChange={handleChange} 
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl p-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-teal-500" 
                    placeholder="123456789"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Account Number</label>
                  <input 
                    name="bank_account_no" 
                    value={formData.bank_account_no} 
                    onChange={handleChange} 
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl p-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-teal-500" 
                    placeholder="987654321"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Account Name</label>
                <input 
                  name="bank_account_name" 
                  value={formData.bank_account_name} 
                  onChange={handleChange} 
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl p-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-teal-500" 
                  placeholder="Green Valley HOA Escrow"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-500 py-3.5 rounded-2xl font-medium text-white disabled:opacity-50 transition mt-2 shadow-lg shadow-teal-500/20"
          >
            {loading ? "Saving Changes..." : "Save Changes"}
          </button>

          {message && (
            <div className={`text-center p-3 rounded-2xl text-sm ${
              message.includes('✅') ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'
            }`}>
              {message}
            </div>
          )}
        </form>

        <div className="p-5 border-t border-slate-200 dark:border-white/10">
          <button 
            type="button"
            onClick={onClose} 
            className="w-full py-3 text-slate-500 hover:bg-red-600 hover:text-white dark:text-gray-400 dark:hover:bg-red-600 dark:hover:text-white rounded-xl text-sm font-medium transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCommunityModal;
