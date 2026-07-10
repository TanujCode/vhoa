import React, { useState, useEffect } from 'react';
import { Building2, Plus, DoorOpen, BadgeAlert, PlusCircle, CheckCircle, Edit3, Trash2 } from 'lucide-react';
import API from '../../services/api';

export default function PropertiesHub() {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);

  // Add Property states
  const [propName, setPropName] = useState('');
  const [propAddress, setPropAddress] = useState('');
  const [propCity, setPropCity] = useState('');
  const [propState, setPropState] = useState('');
  const [propZip, setPropZip] = useState('');
  
  // Edit Property states
  const [showEditPropModal, setShowEditPropModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editZip, setEditZip] = useState('');

  // Add Unit states
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [unitNo, setUnitNo] = useState('');
  const [unitRent, setUnitRent] = useState('');

  // Edit Unit states
  const [showEditUnitModal, setShowEditUnitModal] = useState(false);
  const [editUnitNo, setEditUnitNo] = useState('');
  const [editUnitRent, setEditUnitRent] = useState('');
  const [selectedUnit, setSelectedUnit] = useState(null);

  const [showPropModal, setShowPropModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-fill logic for Add form
  const handleZipLookup = async (zipCode) => {
    const cleanZip = zipCode.replace(/[^0-9]/g, '');
    setPropZip(cleanZip);
    if (cleanZip.length === 5) {
      try {
        const response = await fetch(`https://api.zippopotam.us/us/${cleanZip}`);
        if (response.ok) {
          const data = await response.json();
          if (data.places && data.places.length > 0) {
            const place = data.places[0];
            setPropCity(place['place name']);
            setPropState(place['state abbreviation']);
          }
        }
      } catch (err) {
        console.warn("Zip lookup failed:", err);
      }
    }
  };

  const handleCityStateLookup = async (city, state) => {
    if (!city || !state) return;
    const cleanCity = city.trim();
    const cleanState = state.trim();
    if (cleanCity.length < 2 || cleanState.length !== 2) return;
    try {
      const response = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(cleanState)}/${encodeURIComponent(cleanCity)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.places && data.places.length > 0) {
          const zip = data.places[0]['post code'];
          setPropZip(zip);
        }
      }
    } catch (err) {
      console.warn("City/State zip lookup failed:", err);
    }
  };

  // Auto-fill logic for Edit form
  const handleEditZipLookup = async (zipCode) => {
    const cleanZip = zipCode.replace(/[^0-9]/g, '');
    setEditZip(cleanZip);
    if (cleanZip.length === 5) {
      try {
        const response = await fetch(`https://api.zippopotam.us/us/${cleanZip}`);
        if (response.ok) {
          const data = await response.json();
          if (data.places && data.places.length > 0) {
            const place = data.places[0];
            setEditCity(place['place name']);
            setEditState(place['state abbreviation']);
          }
        }
      } catch (err) {
        console.warn("Zip lookup failed:", err);
      }
    }
  };

  const handleEditCityStateLookup = async (city, state) => {
    if (!city || !state) return;
    const cleanCity = city.trim();
    const cleanState = state.trim();
    if (cleanCity.length < 2 || cleanState.length !== 2) return;
    try {
      const response = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(cleanState)}/${encodeURIComponent(cleanCity)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.places && data.places.length > 0) {
          const zip = data.places[0]['post code'];
          setEditZip(zip);
        }
      }
    } catch (err) {
      console.warn("City/State zip lookup failed:", err);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    try {
      setLoadingProps(true);
      const res = await API.get('/rental/properties');
      setProperties(res.data);
      if (res.data.length > 0 && !selectedProperty) {
        handleSelectProperty(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProps(false);
    }
  }

  async function handleSelectProperty(prop) {
    setSelectedProperty(prop);
    setLoadingUnits(true);
    try {
      const res = await API.get(`/rental/properties/${prop.property_id}/units`);
      setUnits(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUnits(false);
    }
  }

  function openEditModal(prop) {
    setEditName(prop.name);
    setEditAddress(prop.address);
    setEditCity(prop.city || '');
    setEditState(prop.state || '');
    setEditZip(prop.zip_code || '');
    setErrorMsg('');
    setShowEditPropModal(true);
  }

  function openEditUnitModal(unit) {
    setSelectedUnit(unit);
    setEditUnitNo(unit.unit_number);
    setEditUnitRent(unit.rent_amount.toString());
    setErrorMsg('');
    setShowEditUnitModal(true);
  }

  async function handleAddProperty(e) {
    e.preventDefault();
    setErrorMsg('');

    const name = propName.trim();
    const address = propAddress.trim();
    const city = propCity.trim();
    const state = propState.trim();
    const zip = propZip.trim();

    if (!name) return setErrorMsg("Property Name is required.");
    if (!address) return setErrorMsg("Street Address is required.");
    if (!city) return setErrorMsg("City is required.");
    if (!state) return setErrorMsg("State is required.");
    if (!zip) return setErrorMsg("ZIP code is required.");
    if (state.length !== 2) return setErrorMsg("State must be a 2-letter abbreviation (e.g. NY).");
    if (!/^\d{5}(-\d{4})?$/.test(zip)) return setErrorMsg("ZIP code must be a valid 5-digit number.");

    try {
      const res = await API.post('/rental/properties', {
        name,
        address,
        city,
        state,
        zip_code: zip
      });
      setProperties(prev => [...prev, res.data]);
      handleSelectProperty(res.data);
      setShowPropModal(false);
      setPropName('');
      setPropAddress('');
      setPropCity('');
      setPropState('');
      setPropZip('');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to create property.");
    }
  }

  async function handleEditProperty(e) {
    e.preventDefault();
    setErrorMsg('');

    const name = editName.trim();
    const address = editAddress.trim();
    const city = editCity.trim();
    const state = editState.trim();
    const zip = editZip.trim();

    if (!name) return setErrorMsg("Property Name is required.");
    if (!address) return setErrorMsg("Street Address is required.");
    if (!city) return setErrorMsg("City is required.");
    if (!state) return setErrorMsg("State is required.");
    if (!zip) return setErrorMsg("ZIP code is required.");
    if (state.length !== 2) return setErrorMsg("State must be a 2-letter abbreviation (e.g. NY).");
    if (!/^\d{5}(-\d{4})?$/.test(zip)) return setErrorMsg("ZIP code must be a valid 5-digit number.");

    try {
      const res = await API.put(`/rental/properties/${selectedProperty.property_id}`, {
        name,
        address,
        city,
        state,
        zip_code: zip
      });
      setProperties(prev => prev.map(p => p.property_id === selectedProperty.property_id ? res.data : p));
      setSelectedProperty(res.data);
      setShowEditPropModal(false);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to update property.");
    }
  }

  async function handleDeleteProperty(propertyId) {
    if (!window.confirm("Are you sure you want to delete this property? This will also archive its units.")) return;
    try {
      await API.delete(`/rental/properties/${propertyId}`);
      setProperties(prev => prev.filter(p => p.property_id !== propertyId));
      if (selectedProperty?.property_id === propertyId) {
        setSelectedProperty(null);
        setUnits([]);
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete property.");
    }
  }

  async function handleAddUnit(e) {
    e.preventDefault();
    setErrorMsg('');

    const unit_number = unitNo.trim();
    const rent = unitRent.trim();

    if (!unit_number) return setErrorMsg("Unit Number is required.");
    if (!rent) return setErrorMsg("Monthly Rent is required.");
    if (isNaN(parseFloat(rent)) || parseFloat(rent) <= 0) return setErrorMsg("Monthly Rent must be a positive number.");

    try {
      const res = await API.post('/rental/units', {
        property_id: selectedProperty.property_id,
        unit_number,
        rent_amount: parseFloat(rent)
      });
      setUnits(prev => [...prev, res.data]);
      setShowUnitModal(false);
      setUnitNo('');
      setUnitRent('');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to create unit.");
    }
  }

  async function handleEditUnit(e) {
    e.preventDefault();
    setErrorMsg('');

    const unit_number = editUnitNo.trim();
    const rent = editUnitRent.trim();

    if (!unit_number) return setErrorMsg("Unit Number is required.");
    if (!rent) return setErrorMsg("Monthly Rent is required.");
    if (isNaN(parseFloat(rent)) || parseFloat(rent) <= 0) return setErrorMsg("Monthly Rent must be a positive number.");

    try {
      const res = await API.put(`/rental/units/${selectedUnit.unit_id}`, {
        property_id: selectedProperty.property_id,
        unit_number,
        rent_amount: parseFloat(rent)
      });
      setUnits(prev => prev.map(u => u.unit_id === selectedUnit.unit_id ? res.data : u));
      setShowEditUnitModal(false);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to update unit.");
    }
  }

  async function handleDeleteUnit(unitId) {
    if (!window.confirm("Are you sure you want to delete this unit?")) return;
    try {
      await API.delete(`/rental/units/${unitId}`);
      setUnits(prev => prev.filter(u => u.unit_id !== unitId));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete unit.");
    }
  }

  return (
    <div className="space-y-6 text-left animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Properties & Units Hub</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add rental portfolios and register distinct rooms/apartments.</p>
        </div>
        <button 
          onClick={() => { setErrorMsg(''); setShowPropModal(true); }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-md shadow-blue-500/20 whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Property
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Properties Side Column */}
        <div className="lg:col-span-4 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-white/10 text-slate-800 dark:text-white font-medium text-xs flex items-center gap-2">
            <Building2 size={14} /> Property Directory
          </div>
          <div className="p-4">
            {loadingProps ? (
              <div className="py-8 text-center text-slate-400 text-sm animate-pulse">Loading properties...</div>
            ) : properties.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">No properties added yet. Click "Add Property" above.</div>
            ) : (
              <div className="space-y-2.5">
                {properties.map(p => (
                  <div
                    key={p.property_id}
                    onClick={() => handleSelectProperty(p)}
                    className={`p-4 rounded-xl cursor-pointer transition-all border text-left flex items-center justify-between group ${
                      selectedProperty?.property_id === p.property_id
                        ? 'bg-blue-600/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-md shadow-blue-500/5'
                        : 'border-slate-100 dark:border-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/5 hover:border-slate-200 dark:hover:border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className={`w-5 h-5 ${selectedProperty?.property_id === p.property_id ? 'text-blue-500' : 'text-slate-400'}`} />
                      <div>
                        <h4 className="text-sm font-bold dark:text-white text-slate-900">{p.name}</h4>
                        <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5 truncate max-w-[160px]">{p.address}</p>
                      </div>
                    </div>
                    
                    {/* Actions Column (visible on hover) */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openEditModal(p); }} 
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-blue-500 transition"
                        title="Edit Property"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteProperty(p.property_id); }} 
                        className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition"
                        title="Delete Property"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Units Main List Column */}
        <div className="lg:col-span-8 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
          {selectedProperty ? (
            <>
              <div className="p-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{selectedProperty.name}</h2>
                  <p className="text-xs text-slate-450 dark:text-slate-400 mt-1 font-medium">{selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip_code}</p>
                </div>
                <div className="flex items-center gap-2 self-stretch sm:self-auto">
                  <button
                    onClick={() => openEditModal(selectedProperty)}
                    className="flex-1 sm:flex-none px-3.5 py-1.5 border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-350 transition duration-200 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-slate-400" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProperty(selectedProperty.property_id)}
                    className="flex-1 sm:flex-none px-3.5 py-1.5 border border-red-100 hover:border-red-200 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold text-red-655 dark:text-red-400 transition duration-200 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                  <button
                    onClick={() => { setErrorMsg(''); setShowUnitModal(true); }}
                    className="flex-1 sm:flex-none px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition duration-200 shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    <PlusCircle className="w-4.5 h-4.5" /> Add Unit
                  </button>
                </div>
              </div>

              <div className="p-5">
                {loadingUnits ? (
                  <div className="py-24 text-center text-slate-400 text-sm animate-pulse">Loading units...</div>
                ) : units.length === 0 ? (
                  <div className="py-24 text-center text-slate-400 text-sm">No units added in this property yet. Click "Add Unit" to get started.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {units.map(u => (
                      <div 
                        key={u.unit_id}
                        className="p-5 rounded-2xl border border-slate-100 dark:border-white/[0.03] bg-slate-50/50 dark:bg-black/20 hover:border-slate-200 dark:hover:border-white/[0.06] transition duration-250 flex justify-between items-center"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                            <DoorOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Unit {u.unit_number}</h4>
                            <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5 font-medium">Rent: ${u.rent_amount}/mo</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${
                            u.status === 'OCCUPIED'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20'
                              : u.status === 'VACANT'
                                ? 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border-orange-500/20'
                                : 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 border-red-500/20'
                          }`}>
                            {u.status}
                          </span>
                          
                          <button 
                            onClick={() => openEditUnitModal(u)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-blue-500 transition cursor-pointer"
                            title="Edit Unit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUnit(u.unit_id)}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-550 dark:hover:text-red-450 transition cursor-pointer"
                            title="Delete Unit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-32 text-center text-slate-400 text-sm">Please select or add a property from the left list to manage units.</div>
          )}
        </div>
      </div>

      {/* Property Creation Modal */}
      {showPropModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e2a3b] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl animate-scale-up text-slate-900 dark:text-white text-left">
            <div className="flex justify-between items-center border-b dark:border-white/5 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-500" /> Add New Property
              </h3>
              <button onClick={() => setShowPropModal(false)} className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white text-lg cursor-pointer">×</button>
            </div>
            {errorMsg && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 dark:text-red-400 p-3 rounded-xl font-medium">{errorMsg}</p>}
            <form onSubmit={handleAddProperty} className="space-y-4">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Property Name</label>
                <input required type="text" value={propName} onChange={e=>setPropName(e.target.value)} className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" placeholder="e.g. Sunset Heights" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Street Address</label>
                <input required type="text" value={propAddress} onChange={e=>setPropAddress(e.target.value)} className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" placeholder="e.g. 100 Main St" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">City</label>
                  <input required type="text" value={propCity} onChange={e=>setPropCity(e.target.value)} onBlur={() => handleCityStateLookup(propCity, propState)} className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" placeholder="New York" />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">State</label>
                  <input required type="text" value={propState} onChange={e=>setPropState(e.target.value)} onBlur={() => handleCityStateLookup(propCity, propState)} className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" placeholder="NY" />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Zip</label>
                  <input required type="text" value={propZip} onChange={e=>handleZipLookup(e.target.value)} className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" placeholder="10001" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowPropModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 transition-all shadow-md shadow-blue-500/25">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Property Edit Modal */}
      {showEditPropModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e2a3b] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl animate-scale-up text-slate-900 dark:text-white text-left">
            <div className="flex justify-between items-center border-b dark:border-white/5 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-500" /> Edit Property Details
              </h3>
              <button onClick={() => setShowEditPropModal(false)} className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white text-lg cursor-pointer">×</button>
            </div>
            {errorMsg && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 dark:text-red-400 p-3 rounded-xl font-medium">{errorMsg}</p>}
            <form onSubmit={handleEditProperty} className="space-y-4">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Property Name</label>
                <input required type="text" value={editName} onChange={e=>setEditName(e.target.value)} className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" placeholder="e.g. Sunset Heights" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Street Address</label>
                <input required type="text" value={editAddress} onChange={e=>setEditAddress(e.target.value)} className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" placeholder="e.g. 100 Main St" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">City</label>
                  <input required type="text" value={editCity} onChange={e=>setEditCity(e.target.value)} onBlur={() => handleEditCityStateLookup(editCity, editState)} className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" placeholder="New York" />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">State</label>
                  <input required type="text" value={editState} onChange={e=>setEditState(e.target.value)} onBlur={() => handleEditCityStateLookup(editCity, editState)} className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" placeholder="NY" />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Zip</label>
                  <input required type="text" value={editZip} onChange={e=>handleEditZipLookup(e.target.value)} className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" placeholder="10001" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowEditPropModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 transition-all shadow-md shadow-blue-500/25">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unit Creation Modal */}
      {showUnitModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e2a3b] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl animate-scale-up text-slate-900 dark:text-white text-left">
            <div className="flex justify-between items-center border-b dark:border-white/5 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-550" /> Add New Unit
              </h3>
              <button onClick={() => setShowUnitModal(false)} className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white text-lg cursor-pointer">×</button>
            </div>
            {errorMsg && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 dark:text-red-400 p-3 rounded-xl font-medium">{errorMsg}</p>}
            <form onSubmit={handleAddUnit} className="space-y-4">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Unit Number</label>
                <input required type="text" value={unitNo} onChange={e=>setUnitNo(e.target.value)} className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" placeholder="e.g. Apt 101" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Monthly Rent ($)</label>
                <input required type="number" value={unitRent} onChange={e=>setUnitRent(e.target.value)} className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" placeholder="e.g. 1500" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowUnitModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 transition-all shadow-md shadow-blue-500/25">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unit Edit Modal */}
      {showEditUnitModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e2a3b] border border-slate-200/10 w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl animate-scale-up text-slate-900 dark:text-white text-left">
            <div className="flex justify-between items-start mb-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-500" /> Edit Unit
              </h2>
              <button onClick={() => setShowEditUnitModal(false)} className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white text-lg cursor-pointer">×</button>
            </div>
            <p className="text-slate-500 dark:text-gray-400 text-xs mb-6">Modify details for Unit {selectedUnit?.unit_number}.</p>
            {errorMsg && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 dark:text-red-400 p-3 rounded-xl font-medium mb-4">{errorMsg}</p>}
            <form onSubmit={handleEditUnit} className="space-y-4">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Unit Number</label>
                <input required type="text" value={editUnitNo} onChange={e=>setEditUnitNo(e.target.value)} className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" placeholder="e.g. Apt 101" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Monthly Rent ($)</label>
                <input required type="number" value={editUnitRent} onChange={e=>setEditUnitRent(e.target.value)} className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" placeholder="e.g. 1500" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowEditUnitModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 transition-all shadow-md shadow-blue-500/25">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
