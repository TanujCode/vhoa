import React, { useState, useEffect } from 'react';
import API from '../services/api';

const AddCommunityModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    community_code: "",
    contract_code: "",
    address: {
      address: "",
      city: "",
      state_id: "",
      country_id: "",
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
    time_zone: "America/New_York"
  });

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [loadingCode, setLoadingCode] = useState(false);
  const [contractVerified, setContractVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchCountries();
      setContractVerified(false);
      setMessage("");
    }
  }, [isOpen]);

  const fetchCountries = async () => {
    try {
      const res = await API.get('/location/countries');
      setCountries(res.data);
      if (res.data.length > 0) {
        const firstCountryId = res.data[0].country_id;
        setFormData(prev => ({
          ...prev,
          address: { ...prev.address, country_id: firstCountryId }
        }));
        fetchStates(firstCountryId);
      }
    } catch (err) {
      console.error('Failed to load countries:', err);
    }
  };

  const fetchStates = async (countryId) => {
    if (!countryId) return;
    try {
      const res = await API.get(`/location/states/${countryId}`);
      setStates(res.data);
      if (res.data.length > 0) {
        setFormData(prev => ({
          ...prev,
          address: { ...prev.address, state_id: res.data[0].state_id }
        }));
      }
    } catch (err) {
      console.error('Failed to load states:', err);
    }
  };

  const handleCountryChange = (e) => {
    const countryId = e.target.value;
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, country_id: countryId, state_id: "" }
    }));
    fetchStates(countryId);
  };

  const handleVerifyContractCode = async () => {
    const code = formData.contract_code;
    if (!code || !code.trim()) {
      setMessage("❌ Please enter a contract code.");
      return;
    }

    try {
      setLoadingCode(true);
      setMessage("");
      const res = await API.get(`/contracts/code/${code.trim().toUpperCase()}`);
      const data = res.data;
      
      setFormData(prev => ({
        ...prev,
        name: data.business_name || prev.name,
        community_size: data.size_of_the_community || prev.community_size,
        contact_person: data.client_name || prev.contact_person,
        plan_id: data.plan_selected === "Standard" ? 1 : data.plan_selected === "Premium" ? 2 : 3
      }));
      setContractVerified(true);
      setMessage("✅ Contract verified successfully!");
    } catch (err) {
      setContractVerified(false);
      setMessage(`❌ ${err.response?.data?.detail || "Invalid or inactive contract code."}`);
    } finally {
      setLoadingCode(false);
    }
  };

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
    if (!contractVerified) {
      setMessage("❌ Please verify the contract code first.");
      return;
    }
    setLoading(true);
    setMessage("");

    try {
      const payload = {
        ...formData,
        contract_code: formData.contract_code.trim().toUpperCase(),
        president_email_id: formData.president_email_id || null,
        secretary_email_id: formData.secretary_email_id || null,
        treasurer_email_id: formData.treasurer_email_id || null,
        admin_email_id: formData.admin_email_id || null,
      };

      console.log("Sending:", payload);

      await API.post('/community', payload);

      setMessage("✅ Community Created Successfully!");

      setTimeout(() => {
        onSuccess?.();
        onClose();
        // Reset form
        setFormData({
          name: "",
          community_code: "",
          contract_code: "",
          address: {
            address: "",
            city: "",
            state_id: "",
            country_id: "",
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
          time_zone: "America/New_York"
        });
      }, 1500);

    } catch (err) {
      console.error(err.response?.data);
      setMessage(
        `❌ ${err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-gradient-to-br dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto text-slate-900 dark:text-white custom-scrollbar">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-white/10">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Add New Community</h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Create a new HOA community linked to a contract</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Contract Code Field */}
          <div>
            <label className="block text-sm text-slate-500 dark:text-gray-400 mb-1">Contract Code *</label>
            <div className="flex gap-2">
              <input 
                name="contract_code" 
                value={formData.contract_code} 
                onChange={handleChange} 
                required 
                className="flex-1 bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl p-3.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#1D9E75] placeholder-slate-400 dark:placeholder-gray-500 font-mono uppercase tracking-wider" 
                placeholder="CON-XXXXXX" 
                disabled={loadingCode || contractVerified}
              />
              <button 
                type="button"
                onClick={handleVerifyContractCode}
                disabled={loadingCode || contractVerified}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 text-white rounded-2xl text-xs font-semibold transition shadow-md shadow-teal-500/25"
              >
                {loadingCode ? "Checking..." : contractVerified ? "Verified ✅" : "Verify Code"}
              </button>
            </div>
          </div>

          {message && (
            <div className={`text-center p-3 rounded-2xl text-xs ${
              message.includes('✅') ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'
            }`}>
              {message}
            </div>
          )}

          {contractVerified && (
            <>
              <div>
                <label className="block text-sm text-slate-500 dark:text-gray-400 mb-1">Community Name *</label>
                <input 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl p-3.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-teal-500 placeholder-slate-400 dark:placeholder-gray-500" 
                  placeholder="Green Valley Society" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-500 dark:text-gray-400 mb-1">Community Code *</label>
                  <input 
                    name="community_code" 
                    value={formData.community_code} 
                    onChange={handleChange} 
                    required 
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl p-3.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-teal-500 placeholder-slate-400 dark:placeholder-gray-500" 
                    placeholder="GVS2026" 
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-500 dark:text-gray-400 mb-1">Max Units (Size)</label>
                  <input 
                    type="number" 
                    name="community_size" 
                    value={formData.community_size} 
                    onChange={handleChange} 
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl p-3.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-teal-500" 
                  />
                </div>
              </div>

              {/* Dynamic Location Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Country *</label>
                  <select 
                    name="address.country_id"
                    value={formData.address.country_id}
                    onChange={handleCountryChange}
                    required
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl p-3.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-teal-500"
                  >
                    <option value="">Select Country</option>
                    {countries.map((c) => (
                      <option key={c.country_id} value={c.country_id}>{c.country_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">State *</label>
                  <select 
                    name="address.state_id"
                    value={formData.address.state_id}
                    onChange={handleChange}
                    required
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl p-3.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-teal-500"
                  >
                    <option value="">Select State</option>
                    {states.map((s) => (
                      <option key={s.state_id} value={s.state_id}>{s.state_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-500 dark:text-gray-400 mb-1">Address Line *</label>
                <input 
                  name="address.address" 
                  value={formData.address.address} 
                  onChange={handleChange} 
                  required 
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl p-3.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-teal-500 placeholder-slate-400 dark:placeholder-gray-500" 
                  placeholder="123 MG Road" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-500 dark:text-gray-400 mb-1">City *</label>
                  <input 
                    name="address.city" 
                    value={formData.address.city} 
                    onChange={handleChange} 
                    required 
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl p-3.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-teal-500 placeholder-slate-400 dark:placeholder-gray-500" 
                    placeholder="Raipur" 
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-500 dark:text-gray-400 mb-1">Zip Code *</label>
                  <input 
                    name="address.zip_code" 
                    value={formData.address.zip_code} 
                    onChange={handleChange} 
                    required 
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl p-3.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-teal-500 placeholder-slate-400 dark:placeholder-gray-500" 
                    placeholder="492001" 
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-500 py-3.5 rounded-2xl font-medium text-white disabled:opacity-50 transition mt-2 shadow-lg shadow-teal-500/25"
              >
                {loading ? "Creating Community..." : "Create Community"}
              </button>
            </>
          )}
        </form>

        <div className="p-5 border-t border-slate-200 dark:border-white/10">
          <button 
            onClick={onClose} 
            className="w-full py-3 text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white text-sm font-medium transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCommunityModal;