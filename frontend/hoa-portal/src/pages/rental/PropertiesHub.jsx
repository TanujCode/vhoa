import React, { useState, useEffect } from 'react';
import { Building2, Plus, DoorOpen, BadgeAlert, PlusCircle, CheckCircle, Edit3, Trash2, Home, Building, ArrowLeft, ArrowRight, ChevronDown, Check } from 'lucide-react';
import API from '../../services/api';

export default function PropertiesHub({ 
  user, 
  selectedPropertyFilterId = 'all', 
  setSelectedPropertyFilterId, 
  properties: globalProperties 
}) {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [showPropDropdown, setShowPropDropdown] = useState(false);

  // Helper to determine property type
  function getPropertyType(property) {
    if (!property) return 'Multi-Unit';
    const activeUnits = (property.units || []).filter(u => u.active_status !== false);
    if (activeUnits.length === 0) return 'Multi-Unit';
    const firstUnit = activeUnits[0].unit_number;
    if (activeUnits.length === 1) {
      if (firstUnit === 'Single Family') return 'Single Family';
      if (firstUnit === 'Condo Unit') return 'Condo';
    }
    return 'Multi-Unit';
  }

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

  // Property Creation Wizard states
  const [wizardStep, setWizardStep] = useState(1);
  const [propertyType, setPropertyType] = useState('single');
  const [wizardUnits, setWizardUnits] = useState([{ unit_number: 'Single Family', rent_amount: '' }]);

  const addWizardUnitRow = () => {
    setWizardUnits(prev => [...prev, { unit_number: `Apt ${prev.length + 1}`, rent_amount: '' }]);
  };

  const removeWizardUnitRow = (index) => {
    if (wizardUnits.length === 1) return;
    setWizardUnits(prev => prev.filter((_, i) => i !== index));
  };

  const updateWizardUnit = (index, field, value) => {
    setWizardUnits(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  // Auto-fill logic for Add form
  const STATE_NAME_TO_ABBR = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR", "california": "CA", "colorado": "CO", "connecticut": "CT", "delaware": "DE", "florida": "FL", "georgia": "GA", "hawaii": "HI", "idaho": "ID", "illinois": "IL", "indiana": "IN", "iowa": "IA", "kansas": "KS", "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD", "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS", "missouri": "MO", "montana": "MT", "nebraska": "NE", "nevada": "NV", "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND", "ohio": "OH", "oklahoma": "OK", "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC", "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT", "vermont": "VT", "virginia": "VA", "washington": "WA", "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY"
  };

  const getAbbr = (stateStr) => {
    const clean = stateStr.trim().toLowerCase();
    if (clean.length === 2) return clean.toUpperCase();
    return STATE_NAME_TO_ABBR[clean] || stateStr;
  };

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
            setPropState(place['state']);
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
    if (cleanCity.length < 2 || cleanState.length < 2) return;
    const stateAbbr = getAbbr(cleanState);
    try {
      const response = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(stateAbbr)}/${encodeURIComponent(cleanCity)}`);
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
            setEditState(place['state']);
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
    if (cleanCity.length < 2 || cleanState.length < 2) return;
    const stateAbbr = getAbbr(cleanState);
    try {
      const response = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(stateAbbr)}/${encodeURIComponent(cleanCity)}`);
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

  useEffect(() => {
    if (selectedPropertyFilterId && selectedPropertyFilterId !== 'all') {
      const match = properties.find(p => String(p.property_id) === String(selectedPropertyFilterId));
      if (match && (!selectedProperty || selectedProperty.property_id !== match.property_id)) {
        handleSelectProperty(match);
      }
    }
  }, [selectedPropertyFilterId, properties]);

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
    if (setSelectedPropertyFilterId && String(selectedPropertyFilterId) !== String(prop.property_id)) {
      setSelectedPropertyFilterId(String(prop.property_id));
    }
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

  async function handleWizardSubmit(e) {
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
    if (state.length < 2) return setErrorMsg("State name must be at least 2 characters.");
    if (!/^\d{5}(-\d{4})?$/.test(zip)) return setErrorMsg("ZIP code must be a valid 5-digit number.");

    // Validate and format units based on property type
    const formattedUnits = [];
    if (propertyType === 'single' || propertyType === 'condo') {
      const rentVal = parseFloat(wizardUnits[0]?.rent_amount);
      if (isNaN(rentVal) || rentVal <= 0) {
        return setErrorMsg("Monthly rent must be a positive number.");
      }
      formattedUnits.push({
        unit_number: propertyType === 'single' ? 'Single Family' : 'Condo Unit',
        rent_amount: rentVal
      });
    } else {
      // Multi-unit validation
      if (wizardUnits.length === 0) {
        return setErrorMsg("Please add at least one unit row.");
      }
      for (let i = 0; i < wizardUnits.length; i++) {
        const u = wizardUnits[i];
        const num = u.unit_number.trim();
        const rentVal = parseFloat(u.rent_amount);
        if (!num) {
          return setErrorMsg(`Unit row ${i + 1} is missing a Unit Number.`);
        }
        if (isNaN(rentVal) || rentVal <= 0) {
          return setErrorMsg(`Unit "${num}" has an invalid rent amount.`);
        }
        formattedUnits.push({
          unit_number: num,
          rent_amount: rentVal
        });
      }
    }

    try {
      const res = await API.post('/rental/properties-with-units', {
        name,
        address,
        city,
        state,
        zip_code: zip,
        units: formattedUnits
      });
      setProperties(prev => [...prev, res.data]);
      handleSelectProperty(res.data);
      setShowPropModal(false);
      
      // Reset forms & wizard
      setPropName('');
      setPropAddress('');
      setPropCity('');
      setPropState('');
      setPropZip('');
      setWizardStep(1);
      setPropertyType('single');
      setWizardUnits([{ unit_number: 'Single Family', rent_amount: '' }]);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to create property with units.");
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
    if (state.length < 2) return setErrorMsg("State name must be at least 2 characters.");
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
        <div className="flex items-center gap-3 w-full sm:w-auto self-stretch sm:self-auto justify-end">


          <button 
            onClick={() => { setErrorMsg(''); setShowPropModal(true); }}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-md shadow-blue-500/20 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Property
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
        {properties.length === 0 ? (
          <div className="py-32 text-center text-slate-450 dark:text-slate-400 text-sm">
            <Building2 className="w-12 h-12 mx-auto text-slate-350 dark:text-slate-650 mb-3 animate-pulse" />
            <p className="font-bold text-slate-700 dark:text-slate-300">No properties added yet.</p>
            <p className="text-xs text-slate-550 mt-1">Click the "Add Property" button above to register your first property.</p>
          </div>
        ) : selectedProperty ? (
          <>
            <div className="p-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{selectedProperty.name}</h2>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${
                    getPropertyType(selectedProperty) === 'Single Family'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-450 border border-emerald-500/20'
                      : getPropertyType(selectedProperty) === 'Condo'
                        ? 'bg-indigo-500/10 text-indigo-650 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-500/20'
                        : 'bg-blue-500/10 text-blue-655 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20'
                  }`}>
                    {getPropertyType(selectedProperty)}
                  </span>
                </div>
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
                {!units.some(u => u.unit_number === 'Single Family' || u.unit_number === 'Condo Unit') && (
                  <button
                    onClick={() => { setErrorMsg(''); setShowUnitModal(true); }}
                    className="flex-1 sm:flex-none px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition duration-200 shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    <PlusCircle className="w-4.5 h-4.5" /> Add Unit
                  </button>
                )}
              </div>
            </div>

            <div className="p-5">
              {loadingUnits ? (
                <div className="py-24 text-center text-slate-400 text-sm animate-pulse">Loading units...</div>
              ) : units.length === 0 ? (
                <div className="py-24 text-center text-slate-400 text-sm">No units added in this property yet. Click "Add Unit" to get started.</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {units.map(u => (
                    <div 
                      key={u.unit_id}
                      className="p-4 rounded-xl border border-slate-100 dark:border-white/[0.03] bg-slate-50/30 dark:bg-black/20 hover:border-slate-200 dark:hover:border-white/[0.06] transition duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 flex-shrink-0">
                          <DoorOpen className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">Unit {u.unit_number}</h4>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border flex-shrink-0 ${
                              u.status === 'OCCUPIED'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20'
                                : u.status === 'VACANT'
                                  ? 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border-orange-500/20'
                                  : 'bg-red-500/10 text-red-650 dark:bg-red-500/20 dark:text-red-400 border-red-500/20'
                            }`}>
                              {u.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-450 dark:text-slate-400 mt-1 font-semibold">
                            Rent: <strong className="text-slate-800 dark:text-slate-200">${u.rent_amount}/mo</strong>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-white/5">
                        <button 
                          onClick={() => openEditUnitModal(u)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-slate-400 hover:text-blue-500 transition duration-150 flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-transparent hover:border-blue-500/10"
                          title="Edit Unit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="sm:hidden lg:inline text-[10px]">Edit</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteUnit(u.unit_id)}
                          className="p-2 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-550 dark:hover:text-red-450 transition duration-150 flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-transparent hover:border-red-500/10"
                          title="Delete Unit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="sm:hidden lg:inline text-[10px]">Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="py-32 text-center text-slate-400 text-sm">Please select or add a property from the dropdown above to manage units.</div>
        )}
      </div>

      {/* Property Creation Modal (Stepper Wizard) */}
      {showPropModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1a2736] border border-slate-200 dark:border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-up text-slate-900 dark:text-white text-left flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-black/15 border-b border-slate-200 dark:border-white/5 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-500" /> Add Property Wizard
              </h3>
              <button 
                onClick={() => { 
                  setShowPropModal(false); 
                  setWizardStep(1); 
                  setPropName('');
                  setPropAddress('');
                  setPropCity('');
                  setPropState('');
                  setPropZip('');
                  setWizardUnits([{ unit_number: 'Single Family', rent_amount: '' }]);
                }} 
                className="text-slate-400 hover:text-slate-950 dark:text-gray-500 dark:hover:text-white text-2xl font-semibold cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Stepper Progress bar */}
            <div className="px-6 pt-5 pb-3 bg-white dark:bg-[#1a2736] border-b border-slate-100 dark:border-white/[0.02]">
              <div className="flex items-center justify-between">
                {[
                  { step: 1, label: 'Property Type' },
                  { step: 2, label: 'Address & Name' },
                  { step: 3, label: 'Configure Units' }
                ].map((item, idx) => (
                  <React.Fragment key={item.step}>
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        wizardStep >= item.step 
                          ? 'bg-blue-600 text-white ring-4 ring-blue-500/20' 
                          : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500'
                      }`}>
                        {item.step}
                      </div>
                      <span className={`text-xs font-semibold hidden sm:inline ${
                        wizardStep >= item.step ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {item.label}
                      </span>
                    </div>
                    {idx < 2 && (
                      <div className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${
                        wizardStep > item.step ? 'bg-blue-600' : 'bg-slate-150 dark:bg-white/5'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Error Indicator */}
            {errorMsg && (
              <div className="px-6 pt-4">
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 dark:text-red-400 p-3 rounded-xl font-medium flex items-center gap-1.5">
                  <BadgeAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
                  {errorMsg}
                </p>
              </div>
            )}

            {/* Wizard Body content */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form onSubmit={handleWizardSubmit} className="space-y-5">
                
                {/* STEP 1: Property Type Selection */}
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wide">Select your building layout:</h4>
                    <div className="grid grid-cols-1 gap-3.5">
                      {[
                        { 
                          type: 'single', 
                          title: 'Single-Family Home', 
                          desc: 'A detached home, townhouse, or condo with one address and one renter unit.',
                          icon: <Home className="w-6 h-6 text-emerald-500" />
                        },
                        { 
                          type: 'condo', 
                          title: 'Condo / Townhouse / Room', 
                          desc: 'A single designated unit within a larger HOA association community.',
                          icon: <Building className="w-6 h-6 text-indigo-500" />
                        },
                        { 
                          type: 'multi', 
                          title: 'Multi-Unit Building (Apartment / Duplex)', 
                          desc: 'A building containing multiple distinct rooms or apartments (e.g. Apt 1, Apt 2).',
                          icon: <Building2 className="w-6 h-6 text-blue-500" />
                        }
                      ].map(item => (
                        <div
                          key={item.type}
                          onClick={() => {
                            setPropertyType(item.type);
                            if (item.type === 'single') {
                              setWizardUnits([{ unit_number: 'Single Family', rent_amount: '' }]);
                            } else if (item.type === 'condo') {
                              setWizardUnits([{ unit_number: 'Condo Unit', rent_amount: '' }]);
                            } else {
                              setWizardUnits([{ unit_number: 'Apt 101', rent_amount: '' }]);
                            }
                            setWizardStep(2);
                          }}
                          className={`p-4 rounded-xl border cursor-pointer text-left flex items-start gap-4 transition-all hover:bg-slate-50 dark:hover:bg-white/5 ${
                            propertyType === item.type 
                              ? 'border-blue-500 bg-blue-600/5 dark:bg-blue-500/10' 
                              : 'border-slate-200 dark:border-white/10 bg-slate-50/20 dark:bg-black/15'
                          }`}
                        >
                          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-white/5">
                            {item.icon}
                          </div>
                          <div>
                            <h5 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h5>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 2: Address and Property Name */}
                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wide">Enter address details:</h4>
                    
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Property Name / Portfolio</label>
                        <input 
                          required 
                          type="text" 
                          value={propName} 
                          onChange={e => setPropName(e.target.value)} 
                          className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" 
                          placeholder="e.g. Greenwood Villa or Oakwood Complex" 
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Street Address</label>
                        <input 
                          required 
                          type="text" 
                          value={propAddress} 
                          onChange={e => setPropAddress(e.target.value)} 
                          className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" 
                          placeholder="e.g. 100 Main St" 
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">City</label>
                          <input required type="text" value={propCity} onChange={e=>setPropCity(e.target.value)} onBlur={() => handleCityStateLookup(propCity, propState)} className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none" placeholder="New York" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">State</label>
                          <input required type="text" value={propState} onChange={e=>setPropState(e.target.value)} onBlur={() => handleCityStateLookup(propCity, propState)} className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none" placeholder="New York" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Zip</label>
                          <input required type="text" value={propZip} onChange={e=>handleZipLookup(e.target.value)} className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none" placeholder="10001" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex gap-3 border-t dark:border-white/5">
                      <button 
                        type="button" 
                        onClick={() => setWizardStep(1)} 
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-250 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-350 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          if (!propName || !propAddress || !propCity || !propState || !propZip) {
                            setErrorMsg("All address details are required.");
                            return;
                          }
                          setErrorMsg('');
                          setWizardStep(3);
                        }} 
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                      >
                        Next <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Configure Units */}
                {wizardStep === 3 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wide">
                        {propertyType === 'multi' ? 'Configure Apartment Units:' : 'Set Rent Amount:'}
                      </h4>
                      {propertyType === 'multi' && (
                        <button
                          type="button"
                          onClick={addWizardUnitRow}
                          className="text-xs bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Row
                        </button>
                      )}
                    </div>

                    {/* Single Unit / Condo Configuration */}
                    {(propertyType === 'single' || propertyType === 'condo') && (
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/30 dark:bg-black/10">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">MONTHLY RENT ($)</label>
                        <input 
                          required
                          type="number" 
                          value={wizardUnits[0]?.rent_amount || ''} 
                          onChange={e => updateWizardUnit(0, 'rent_amount', e.target.value)} 
                          className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none" 
                          placeholder="e.g. 1500" 
                        />
                      </div>
                    )}

                    {/* Multi-unit Configuration list */}
                    {propertyType === 'multi' && (
                      <div className="space-y-3.5 max-h-[35vh] overflow-y-auto pr-1">
                        {wizardUnits.map((unit, index) => (
                          <div 
                            key={index} 
                            className="p-3.5 rounded-xl border border-slate-200/85 dark:border-white/5 bg-slate-50/20 dark:bg-black/10 flex items-end gap-3"
                          >
                            <div className="flex-1">
                              <label className="block text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1">Unit Number</label>
                              <input 
                                required
                                type="text" 
                                value={unit.unit_number} 
                                onChange={e => updateWizardUnit(index, 'unit_number', e.target.value)} 
                                className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-250 dark:border-white/10 focus:border-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none" 
                                placeholder="e.g. Apt 101" 
                              />
                            </div>
                            <div className="w-32">
                              <label className="block text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1">Monthly Rent ($)</label>
                              <input 
                                required
                                type="number" 
                                value={unit.rent_amount} 
                                onChange={e => updateWizardUnit(index, 'rent_amount', e.target.value)} 
                                className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-250 dark:border-white/10 focus:border-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none" 
                                placeholder="1200" 
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeWizardUnitRow(index)}
                              disabled={wizardUnits.length === 1}
                              className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-550 dark:hover:text-red-450 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              title="Delete Row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-4 flex gap-3 border-t dark:border-white/5">
                      <button 
                        type="button" 
                        onClick={() => setWizardStep(2)} 
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-250 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-350 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back
                      </button>
                      <button 
                        type="submit" 
                        className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/25 cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" /> Finish & Create
                      </button>
                    </div>
                  </div>
                )}

              </form>
            </div>

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
                  <input required type="text" value={editState} onChange={e=>setEditState(e.target.value)} onBlur={() => handleEditCityStateLookup(editCity, editState)} className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" placeholder="New York" />
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
