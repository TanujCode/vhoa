import React, { useState } from 'react';
import API from '../services/api';

const AddCommunityModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    community_code: "",
    address: {
      address: "",
      city: "",
      state_id: 63,
      country_id: 2,
      zip_code: ""
    },
    president_email_id: "",
    secretary_email_id: "",
    treasurer_email_id: "",
    admin_email_id: "",
    plan_id: 1,
    plan_expire_date: "2026-12-31",
    license_status: "ACTIVE",
    community_size: 100,
    total_owners: 50,
    contact_person: "",
    time_zone: "Asia/Kolkata"
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMessage("");

  try {

    const payload = {
      ...formData,
      president_email_id: formData.president_email_id || null,
      secretary_email_id: formData.secretary_email_id || null,
      treasurer_email_id: formData.treasurer_email_id || null,
      admin_email_id: formData.admin_email_id || null,
    };

    console.log("Sending:", payload);

    const response = await API.post('/community', payload);

    setMessage("✅ Community Created Successfully!");

    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 1500);

  } catch (err) {
    console.error(err.response?.data);

    setMessage(
      `❌ ${
        err.response?.data?.detail ||
        JSON.stringify(err.response?.data) ||
        err.message
      }`
    );
  } finally {
    setLoading(false);
  }
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
      <div className="bg-[#1E3248] border border-white/20 rounded-3xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-semibold">Add New Community</h2>
          <p className="text-gray-400 text-sm">Create a new HOA community</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Community Name *</label>
            <input name="name" value={formData.name} onChange={handleChange} required className="w-full bg-[#0D1B2A] border border-white/20 rounded-2xl p-4 text-white" placeholder="Green Valley Society" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Community Code *</label>
              <input name="community_code" value={formData.community_code} onChange={handleChange} required className="w-full bg-[#0D1B2A] border border-white/20 rounded-2xl p-4 text-white" placeholder="GVS2026" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Plan ID</label>
              <input type="number" name="plan_id" value={formData.plan_id} onChange={handleChange} className="w-full bg-[#0D1B2A] border border-white/20 rounded-2xl p-4 text-white" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Address Line *</label>
            <input name="address.address" value={formData.address.address} onChange={handleChange} required className="w-full bg-[#0D1B2A] border border-white/20 rounded-2xl p-4 text-white" placeholder="123 MG Road" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">City *</label>
              <input name="address.city" value={formData.address.city} onChange={handleChange} required className="w-full bg-[#0D1B2A] border border-white/20 rounded-2xl p-4 text-white" placeholder="Raipur" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Zip Code *</label>
              <input name="address.zip_code" value={formData.address.zip_code} onChange={handleChange} required className="w-full bg-[#0D1B2A] border border-white/20 rounded-2xl p-4 text-white" placeholder="492001" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal hover:bg-teal-light py-3.5 rounded-2xl font-medium disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Community"}
          </button>

          {message && <div className="text-center p-4 rounded-2xl bg-gray-800 text-sm">{message}</div>}
        </form>

        <div className="p-6 border-t border-white/10">
          <button onClick={onClose} className="w-full py-3 text-gray-400 hover:text-white">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default AddCommunityModal;