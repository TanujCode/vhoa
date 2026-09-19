import React, { useState, useEffect } from 'react';
import { Building2, Plus, DoorOpen, BadgeAlert, PlusCircle, CheckCircle, Edit3, Trash2, Home, Building, ArrowLeft, ArrowRight, ChevronDown, Check, Sparkles, Key, Users, FileText } from 'lucide-react';
import API from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import CustomSelect from '../../components/CustomSelect';

export default function PropertiesHub({ 
  user, 
  selectedPropertyFilterId = 'all', 
  setSelectedPropertyFilterId, 
  properties: globalProperties,
  setActivePage,
  onPropertiesChange,
  leases = []
}) {
  const [properties, setProperties] = useState(globalProperties || []);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [createdPropertySuccess, setCreatedPropertySuccess] = useState(null);
  const [units, setUnits] = useState([]);
  const [loadingProps, setLoadingProps] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [showPropDropdown, setShowPropDropdown] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  function getPropertyType(property) {
    if (!property) return 'Single Family';
    if (property.property_type === 'condo') return 'Condo';
    if (property.property_type === 'single_family') return 'Single Family';

    const activeUnits = (property.units || []).filter(u => u.active_status !== false);
    if (activeUnits.length === 0) return 'Single Family';
    
    const hasCondo = activeUnits.some(u => u.unit_number === 'Condo Unit' || u.unit_number?.toLowerCase().includes('apt') || u.unit_number?.toLowerCase().includes('unit'));
    if (hasCondo) return 'Condo';
    
    return 'Single Family';
  }

  const formatAddressWithUnit = (property, unitNo = null) => {
    if (!property) return '';
    const type = getPropertyType(property);
    let displayUnit = '';
    if (type === 'Condo') {
      if (unitNo && unitNo !== 'Condo Unit') {
        displayUnit = `, ${unitNo}`;
      } else {
        const activeUnits = (property.units || []).filter(u => u.active_status !== false);
        if (activeUnits.length > 0 && activeUnits[0].unit_number !== 'Condo Unit') {
          displayUnit = `, ${activeUnits[0].unit_number}`;
        }
      }
    }
    return `${property.address}${displayUnit}, ${property.city}, ${property.state} ${property.zip_code}`;
  };

  const formatCardAddress = (p) => {
    if (!p) return '';
    const type = getPropertyType(p);
    let displayUnit = '';
    if (type === 'Condo') {
      const activeUnits = (p.units || []).filter(u => u.active_status !== false);
      if (activeUnits.length > 0 && activeUnits[0].unit_number !== 'Condo Unit') {
        displayUnit = `, ${activeUnits[0].unit_number}`;
      }
    }
    return `${p.address}${displayUnit}, ${p.city}`;
  };



  const getTotalActiveUnitsCount = () => {
    let count = 0;
    (properties || []).forEach(p => {
      const activeUnits = (p.units || []).filter(u => u.active_status !== false);
      count += activeUnits.length;
    });
    return count;
  };

  const getNextUnitNumber = () => {
    return String(getTotalActiveUnitsCount() + 1);
  };

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
  const [editRent, setEditRent] = useState('');

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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Property Creation Wizard states
  const [wizardStep, setWizardStep] = useState(1);
  const [propertyType, setPropertyType] = useState('single');
  const [wizardUnits, setWizardUnits] = useState([{ unit_number: 'Single Family', rent_amount: '' }]);
  const [condoUnitNo, setCondoUnitNo] = useState('');
  const [onboardDropdownOpen, setOnboardDropdownOpen] = useState(false);
  const [modalDropdownOpen, setModalDropdownOpen] = useState(false);


  const handleClosePropModal = () => {
    setShowPropModal(false);
    setErrorMsg('');
    setPropName('');
    setPropAddress('');
    setPropCity('');
    setPropState('');
    setPropZip('');
    setPropertyType('single');
    setWizardUnits([{ unit_number: 'Single Family', rent_amount: '' }]);
    if ((properties || []).length === 0 && setActivePage) {
      setActivePage('dashboard');
    }
  };

  const handleOpenAddProperty = (overridePropsList = null) => {
    const listToEvaluate = overridePropsList || properties || [];
    const activePropertiesCount = listToEvaluate.filter(p => p.active_status !== false).length;
    if (activePropertiesCount >= 2) {
      setShowUpgradeModal(true);
      return;
    }
    setErrorMsg('');
    setPropName('');
    setPropAddress('');
    setPropCity('');
    setPropState('');
    setPropZip('');
    setPropertyType('single');
    setWizardUnits([{ unit_number: 'Single Family', rent_amount: '' }]);
    setWizardStep(1);
    setShowPropModal(true);
  };

  useEffect(() => {
    const handleOutsideClick = () => {
      setOnboardDropdownOpen(false);
      setModalDropdownOpen(false);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

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

  const [addressSuggestions, setAddressSuggestions] = useState([]);

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

  const handleAddressChange = async (value) => {
    setPropAddress(value);
    
    if (!value.trim() || value.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&addressdetails=1&countrycodes=us&limit=5&email=contact@nestbloq.com`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map(item => {
          const addr = item.address || {};
          const street = `${addr.house_number || ''} ${addr.road || ''}`.trim();
          const city = addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || '';
          const state = addr.state || '';
          const zip = addr.postcode || '';
          return {
            display: item.display_name,
            street: street || item.display_name.split(',')[0],
            city: city,
            state: getAbbr(state),
            zip: zip
          };
        }).filter(item => item.city && item.state && item.zip);
        setAddressSuggestions(mapped);
      }
    } catch (err) {
      console.warn("Geocoding failed:", err);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setPropAddress(suggestion.street);
    setPropCity(suggestion.city);
    setPropState(suggestion.state);
    setPropZip(suggestion.zip);
    setAddressSuggestions([]);
  };

  const handleAddressBlur = async () => {
    if (propCity && propState && propZip) return;
    if (!propAddress.trim()) return;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(propAddress)}&format=json&addressdetails=1&countrycodes=us&limit=1&email=contact@nestbloq.com`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const item = data[0];
          const addr = item.address || {};
          const street = `${addr.house_number || ''} ${addr.road || ''}`.trim() || item.display_name.split(',')[0];
          const city = addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || '';
          const state = addr.state || '';
          const zip = addr.postcode || '';

          if (city && state && zip) {
            setPropAddress(street);
            setPropCity(city);
            setPropState(getAbbr(state));
            setPropZip(zip);
            setAddressSuggestions([]);
          }
        }
      }
    } catch (err) {
      console.warn("Geocoding blur lookup failed:", err);
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

  const STATE_CAPITALS = {
    "alabama": { city: "Montgomery", zip: "36104" },
    "alaska": { city: "Juneau", zip: "99801" },
    "arizona": { city: "Phoenix", zip: "85001" },
    "arkansas": { city: "Little Rock", zip: "72201" },
    "california": { city: "Sacramento", zip: "95814" },
    "colorado": { city: "Denver", zip: "80202" },
    "connecticut": { city: "Hartford", zip: "06103" },
    "delaware": { city: "Dover", zip: "19901" },
    "florida": { city: "Tallahassee", zip: "32301" },
    "georgia": { city: "Atlanta", zip: "30303" },
    "hawaii": { city: "Honolulu", zip: "96813" },
    "idaho": { city: "Boise", zip: "83702" },
    "illinois": { city: "Springfield", zip: "62701" },
    "indiana": { city: "Indianapolis", zip: "46204" },
    "iowa": { city: "Des Moines", zip: "50309" },
    "kansas": { city: "Topeka", zip: "66603" },
    "kentucky": { city: "Frankfort", zip: "40601" },
    "louisiana": { city: "Baton Rouge", zip: "70802" },
    "maine": { city: "Augusta", zip: "04330" },
    "maryland": { city: "Annapolis", zip: "21401" },
    "massachusetts": { city: "Boston", zip: "02108" },
    "michigan": { city: "Lansing", zip: "48933" },
    "minnesota": { city: "Saint Paul", zip: "55102" },
    "mississippi": { city: "Jackson", zip: "39201" },
    "missouri": { city: "Jefferson City", zip: "65101" },
    "montana": { city: "Helena", zip: "59601" },
    "nebraska": { city: "Lincoln", zip: "68502" },
    "nevada": { city: "Carson City", zip: "89701" },
    "new hampshire": { city: "Concord", zip: "03301" },
    "new jersey": { city: "Trenton", zip: "08608" },
    "new mexico": { city: "Santa Fe", zip: "87501" },
    "new york": { city: "Albany", zip: "12207" },
    "north carolina": { city: "Raleigh", zip: "27601" },
    "north dakota": { city: "Bismarck", zip: "58501" },
    "ohio": { city: "Columbus", zip: "43215" },
    "oklahoma": { city: "Oklahoma City", zip: "73102" },
    "oregon": { city: "Salem", zip: "97301" },
    "pennsylvania": { city: "Harrisburg", zip: "17101" },
    "rhode island": { city: "Providence", zip: "02903" },
    "south carolina": { city: "Columbia", zip: "29201" },
    "south dakota": { city: "Pierre", zip: "57501" },
    "tennessee": { city: "Nashville", zip: "37219" },
    "texas": { city: "Austin", zip: "78701" },
    "utah": { city: "Salt Lake City", zip: "84111" },
    "vermont": { city: "Montpelier", zip: "05602" },
    "virginia": { city: "Richmond", zip: "23219" },
    "washington": { city: "Olympia", zip: "98501" },
    "west virginia": { city: "Charleston", zip: "25301" },
    "wisconsin": { city: "Madison", zip: "53703" },
    "wyoming": { city: "Cheyenne", zip: "82001" },
    "al": { city: "Montgomery", zip: "36104" },
    "ak": { city: "Juneau", zip: "99801" },
    "az": { city: "Phoenix", zip: "85001" },
    "ar": { city: "Little Rock", zip: "72201" },
    "ca": { city: "Sacramento", zip: "95814" },
    "co": { city: "Denver", zip: "80202" },
    "ct": { city: "Hartford", zip: "06103" },
    "de": { city: "Dover", zip: "19901" },
    "fl": { city: "Tallahassee", zip: "32301" },
    "ga": { city: "Atlanta", zip: "30303" },
    "hi": { city: "Honolulu", zip: "96813" },
    "id": { city: "Boise", zip: "83702" },
    "il": { city: "Springfield", zip: "62701" },
    "in": { city: "Indianapolis", zip: "46204" },
    "ia": { city: "Des Moines", zip: "50309" },
    "ks": { city: "Topeka", zip: "66603" },
    "ky": { city: "Frankfort", zip: "40601" },
    "la": { city: "Baton Rouge", zip: "70802" },
    "me": { city: "Augusta", zip: "04330" },
    "md": { city: "Annapolis", zip: "21401" },
    "ma": { city: "Boston", zip: "02108" },
    "mi": { city: "Lansing", zip: "48933" },
    "mn": { city: "Saint Paul", zip: "55102" },
    "ms": { city: "Jackson", zip: "39201" },
    "mo": { city: "Jefferson City", zip: "65101" },
    "mt": { city: "Helena", zip: "59601" },
    "ne": { city: "Lincoln", zip: "68502" },
    "nv": { city: "Carson City", zip: "89701" },
    "nh": { city: "Concord", zip: "03301" },
    "nj": { city: "Trenton", zip: "08608" },
    "nm": { city: "Santa Fe", zip: "87501" },
    "ny": { city: "Albany", zip: "12207" },
    "nc": { city: "Raleigh", zip: "27601" },
    "nd": { city: "Bismarck", zip: "58501" },
    "oh": { city: "Columbus", zip: "43215" },
    "ok": { city: "Oklahoma City", zip: "73102" },
    "or": { city: "Salem", zip: "97301" },
    "pa": { city: "Harrisburg", zip: "17101" },
    "ri": { city: "Providence", zip: "02903" },
    "sc": { city: "Columbia", zip: "29201" },
    "sd": { city: "Pierre", zip: "57501" },
    "tn": { city: "Nashville", zip: "37219" },
    "tx": { city: "Austin", zip: "78701" },
    "ut": { city: "Salt Lake City", zip: "84111" },
    "vt": { city: "Montpelier", zip: "05602" },
    "va": { city: "Richmond", zip: "23219" },
    "wa": { city: "Olympia", zip: "98501" },
    "wv": { city: "Charleston", zip: "25301" },
    "wi": { city: "Madison", zip: "53703" },
    "wy": { city: "Cheyenne", zip: "82001" }
  };

  const handleCityLookup = async (cityVal) => {
    const cleanCity = cityVal.trim();
    if (cleanCity.length < 3) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cleanCity)}&countrycodes=us&format=json&addressdetails=1&limit=1`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const address = data[0].address;
          if (address) {
            const state = address.state || '';
            const zip = address.postcode || '';
            if (state) setPropState(state);
            if (zip) setPropZip(zip.split('-')[0]);
          }
        }
      }
    } catch (err) {
      console.warn("City lookup failed:", err);
    }
  };

  const handleStateLookup = (stateVal) => {
    const cleanState = stateVal.trim().toLowerCase();
    const capitalInfo = STATE_CAPITALS[cleanState];
    if (capitalInfo) {
      setPropCity(capitalInfo.city);
      setPropZip(capitalInfo.zip);
    }
  };

  const handleEditCityLookup = async (cityVal) => {
    const cleanCity = cityVal.trim();
    if (cleanCity.length < 3) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cleanCity)}&countrycodes=us&format=json&addressdetails=1&limit=1`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const address = data[0].address;
          if (address) {
            const state = address.state || '';
            const zip = address.postcode || '';
            if (state) setEditState(state);
            if (zip) setEditZip(zip.split('-')[0]);
          }
        }
      }
    } catch (err) {
      console.warn("Edit City lookup failed:", err);
    }
  };

  const handleEditStateLookup = (stateVal) => {
    const cleanState = stateVal.trim().toLowerCase();
    const capitalInfo = STATE_CAPITALS[cleanState];
    if (capitalInfo) {
      setEditCity(capitalInfo.city);
      setEditZip(capitalInfo.zip);
    }
  };

  useEffect(() => {
    fetchProperties().then((propsList) => {
      if (localStorage.getItem('open_add_property_modal') === 'true') {
        localStorage.removeItem('open_add_property_modal');
        const activeCount = (propsList || []).filter(p => p.active_status !== false).length;
        if (activeCount >= 2) {
          setShowUpgradeModal(true);
        } else {
          setErrorMsg('');
          setPropName('');
          setPropAddress('');
          setPropCity('');
          setPropState('');
          setPropZip('');
          setPropertyType('single');
          setWizardUnits([{ unit_number: 'Single Family', rent_amount: '' }]);
          setWizardStep(1);
          setShowPropModal(true);
        }
      }
    });

    const handleGlobalUpdate = () => {
      fetchProperties();
    };
    window.addEventListener('rental-data-changed', handleGlobalUpdate);
    return () => {
      window.removeEventListener('rental-data-changed', handleGlobalUpdate);
    };
  }, []);

  useEffect(() => {
    if (globalProperties && Array.isArray(globalProperties) && globalProperties.length > 0) {
      setProperties(globalProperties);
    }
  }, [globalProperties]);

  useEffect(() => {
    if (selectedPropertyFilterId && selectedPropertyFilterId !== 'all') {
      const match = properties.find(p => String(p.property_id) === String(selectedPropertyFilterId));
      if (match && (!selectedProperty || selectedProperty.property_id !== match.property_id)) {
        handleSelectProperty(match);
      }
    } else if (selectedPropertyFilterId === 'all') {
      setSelectedProperty(null);
    }
  }, [selectedPropertyFilterId, properties]);

  async function fetchProperties() {
    try {
      setLoadingProps(true);
      const res = await API.get('/rental/properties');
      setProperties(res.data);
      if (onPropertiesChange) onPropertiesChange(res.data);
      if (selectedPropertyFilterId && selectedPropertyFilterId !== 'all') {
        const match = res.data.find(p => String(p.property_id) === String(selectedPropertyFilterId));
        if (match) {
          handleSelectProperty(match);
        }
      } else {
        setSelectedProperty(null);
      }
      return res.data;
    } catch (err) {
      console.error(err);
      return [];
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
    
    const activeUnits = (units || []).filter(u => u.active_status !== false);
    if (activeUnits.length > 0) {
      setEditRent(activeUnits[0].rent_amount.toString());
    } else {
      setEditRent('');
    }

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

    if (!name) { alert("Property Name is required."); return; }
    if (!/^[a-zA-Z\s]+$/.test(name)) { alert("Property Name must contain only letters and spaces."); return; }
    if (!address) { alert("Street Address is required."); return; }
    if (!/[a-zA-Z]/.test(address)) { alert("Street Address must contain at least one letter."); return; }
    if (!city) { alert("City is required."); return; }
    if (!state) { alert("State is required."); return; }
    if (!zip) { alert("ZIP code is required."); return; }

    // US State validation
    const cleanState = state.trim().toLowerCase();
    const isUSState = STATE_NAME_TO_ABBR.hasOwnProperty(cleanState) || 
                      Object.values(STATE_NAME_TO_ABBR).map(abbr => abbr.toLowerCase()).includes(cleanState);
    if (!isUSState) {
      alert("Validation Error: Only US states are allowed.");
      return;
    }

    // US Zip validation
    if (!/^\d{5}(-\d{4})?$/.test(zip)) {
      alert("Validation Error: ZIP code must be a valid 5-digit US ZIP code.");
      return;
    }

    const formattedUnits = [];
    if (propertyType === 'condo') {
      const cleanUnitNo = condoUnitNo.trim();
      if (!cleanUnitNo) {
        alert("Unit / Apt Number is required for Condo properties.");
        return;
      }
      formattedUnits.push({
        unit_number: cleanUnitNo,
        rent_amount: 0.0
      });
    } else {
      formattedUnits.push({
        unit_number: 'Single Family',
        rent_amount: 0.0
      });
    }

    try {
      const res = await API.post('/rental/properties-with-units', {
        name,
        address,
        city,
        state,
        zip_code: zip,
        property_type: propertyType,
        units: formattedUnits
      });
      setProperties(prev => {
        const next = [...prev, res.data];
        if (onPropertiesChange) onPropertiesChange(next);
        return next;
      });
      handleSelectProperty(res.data);
      setShowPropModal(false);
      
      // Store newly created property to show custom success screen
      setCreatedPropertySuccess(res.data);
      
      // Reset forms & wizard
      setPropName('');
      setPropAddress('');
      setPropCity('');
      setPropState('');
      setPropZip('');
      setWizardStep(1);
      setPropertyType('single');
      setCondoUnitNo('');
      setWizardUnits([{ unit_number: 'Single Family', rent_amount: '' }]);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create property with units.");
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

    if (!name) { alert("Property Name is required."); return; }
    if (!/^[a-zA-Z\s]+$/.test(name)) { alert("Property Name must contain only letters and spaces."); return; }
    if (!address) { alert("Street Address is required."); return; }
    if (!/[a-zA-Z]/.test(address)) { alert("Street Address must contain at least one letter."); return; }
    if (!city) { alert("City is required."); return; }
    if (!state) { alert("State is required."); return; }
    if (!zip) { alert("ZIP code is required."); return; }

    // US State validation
    const cleanState = state.trim().toLowerCase();
    const isUSState = STATE_NAME_TO_ABBR.hasOwnProperty(cleanState) || 
                      Object.values(STATE_NAME_TO_ABBR).map(abbr => abbr.toLowerCase()).includes(cleanState);
    if (!isUSState) {
      alert("Validation Error: Only US states are allowed.");
      return;
    }

    // US Zip validation
    if (!/^\d{5}(-\d{4})?$/.test(zip)) {
      alert("Validation Error: ZIP code must be a valid 5-digit US ZIP code.");
      return;
    }

    try {
      const res = await API.put(`/rental/properties/${selectedProperty.property_id}`, {
        name,
        address,
        city,
        state,
        zip_code: zip
      });


      await fetchProperties();
      setShowEditPropModal(false);
      alert("Property details updated successfully!");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update property.");
    }
  }

  async function handleDeleteProperty(propertyId) {
    setConfirmConfig({
      isOpen: true,
      title: "Delete Property",
      message: "Are you sure you want to delete this property? This will also archive its units.",
      onConfirm: async () => {
        try {
          await API.delete(`/rental/properties/${propertyId}`);
          setProperties(prev => {
            const next = prev.filter(p => p.property_id !== propertyId);
            if (onPropertiesChange) onPropertiesChange(next);
            return next;
          });
          if (selectedProperty?.property_id === propertyId) {
            setSelectedProperty(null);
            setUnits([]);
          }
          alert("Property deleted successfully!");
        } catch (err) {
          alert(err.response?.data?.detail || "Failed to delete property.");
        }
      }
    });
  }

  async function handleAddUnit(e) {
    e.preventDefault();
    setErrorMsg('');

    const unit_number = unitNo.trim();
    const rent = unitRent.trim();

    if (!unit_number) { alert("Unit Number is required."); return; }
    if (!rent) { alert("Monthly Rent is required."); return; }
    if (isNaN(parseFloat(rent)) || parseFloat(rent) <= 0) { alert("Monthly Rent must be a positive number."); return; }

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
      alert("Unit added successfully!");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create unit.");
    }
  }

  async function handleEditUnit(e) {
    e.preventDefault();
    setErrorMsg('');

    const unit_number = editUnitNo.trim();
    const rent = editUnitRent.trim();

    if (!unit_number) { alert("Unit Number is required."); return; }
    if (!rent) { alert("Monthly Rent is required."); return; }
    if (isNaN(parseFloat(rent)) || parseFloat(rent) <= 0) { alert("Monthly Rent must be a positive number."); return; }

    try {
      const res = await API.put(`/rental/units/${selectedUnit.unit_id}`, {
        property_id: selectedProperty.property_id,
        unit_number,
        rent_amount: parseFloat(rent)
      });
      setUnits(prev => prev.map(u => u.unit_id === selectedUnit.unit_id ? res.data : u));
      setShowEditUnitModal(false);
      alert("Unit updated successfully!");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update unit.");
    }
  }

  async function handleDeleteUnit(unitId) {
    setConfirmConfig({
      isOpen: true,
      title: "Delete Unit",
      message: "Are you sure you want to delete this unit? This action cannot be undone.",
      onConfirm: async () => {
        try {
          await API.delete(`/rental/units/${unitId}`);
          setUnits(prev => prev.filter(u => u.unit_id !== unitId));
          alert("Unit deleted successfully!");
        } catch (err) {
          alert(err.response?.data?.detail || "Failed to delete unit.");
        }
      }
    });
  }

  const renderPropertyCard = (p) => {
    const activeUnits = (p.units || []).filter(u => u.active_status !== false);
    const occupiedCount = activeUnits.filter(u => u.status === 'OCCUPIED').length;
    const vacantCount = activeUnits.filter(u => u.status === 'VACANT').length;
    
    return (
      <div 
        key={p.property_id}
        onClick={() => handleSelectProperty(p)}
        className="group p-5 rounded-2xl bg-white dark:bg-[#1E2E42] border border-slate-250/60 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg dark:hover:shadow-blue-900/10 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[140px] text-left relative overflow-hidden"
      >
        <div className="space-y-1 relative z-10">
          <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-[#5BA4F5] transition duration-200 truncate">
            {p.name}
          </h4>
          <p className="text-xs text-slate-450 dark:text-slate-400 mt-1 font-medium truncate">
            {formatCardAddress(p)}
          </p>

        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-455 relative z-10">
          <div className="flex items-center gap-3">
            <span>
              Total: <strong className="text-slate-800 dark:text-slate-200">{activeUnits.length}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <strong className="text-emerald-600 dark:text-emerald-400">{occupiedCount}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              <strong className="text-orange-600 dark:text-orange-400">{vacantCount}</strong>
            </span>
          </div>
          <span className="text-[10px] text-blue-600 dark:text-[#5BA4F5] font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transform translate-x-1 group-hover:translate-x-0 transition-all duration-200">
            Manage <ArrowRight className="w-3 h-3" />
          </span>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/[0.01] to-blue-500/[0.03] opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none" />
      </div>
    );
  };

  const sfPropsCount = properties.filter(p => getPropertyType(p) === 'Single Family').length;
  const condoPropsCount = properties.filter(p => getPropertyType(p) === 'Condo').length;
  const multiPropsCount = properties.filter(p => getPropertyType(p) === 'Multi-Unit').length;

  const filteredProps = properties.filter(p => {
    const type = getPropertyType(p);
    if (activeCategoryFilter === 'single' && type !== 'Single Family') return false;
    if (activeCategoryFilter === 'condo' && type !== 'Condo') return false;
    if (activeCategoryFilter === 'multi' && type !== 'Multi-Unit') return false;
    
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.city && p.city.toLowerCase().includes(searchTerm.toLowerCase()));
      
    return matchesSearch;
  });

  const hasOccupiedUnit = properties.some(p => 
    (p.units || []).some(u => u.status === 'OCCUPIED' && u.active_status !== false)
  );

  if (loadingProps) {
    return (
      <div className="py-24 text-center text-slate-450 dark:text-slate-400 text-sm animate-pulse font-mono">
        Loading Properties Hub...
      </div>
    );
  }






  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {selectedProperty ? `${selectedProperty.name} Details` : 'Properties'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {selectedProperty 
              ? 'Manage individual units, edit property details, and check vacancy status.' 
              : properties.length === 0
                ? 'Register your first rental property to get started with your portfolio.'
                : 'Manage your rental portfolio, multi-unit buildings, and individual units.'}
          </p>
        </div>
        {properties.length > 0 && (
          <div className="flex items-center gap-3 w-full sm:w-auto self-stretch sm:self-auto justify-end">
            {selectedProperty && (
              <button 
                onClick={() => {
                  if (setSelectedPropertyFilterId) {
                    setSelectedPropertyFilterId('all');
                  }
                  setSelectedProperty(null);
                }}
                className="border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-white/5 px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer animate-fade-in"
              >
                <ArrowLeft className="w-4 h-4" /> All Properties
              </button>
            )}
            <button 
              onClick={() => handleOpenAddProperty()}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-md shadow-blue-500/20 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Property
            </button>
          </div>
        )}
      </div>

      {properties.length === 0 ? (
        <div className="py-12 animate-fade-in text-center">
          <div className="max-w-md mx-auto p-8 rounded-3xl bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2">
              <Building className="w-7 h-7 stroke-[1.75]" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">No Properties Added Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Register your first rental property to initialize your portfolio and start managing units.
            </p>
            <button
              onClick={() => handleOpenAddProperty()}
              className="mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition duration-200 inline-flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/15"
            >
              <Plus className="w-4 h-4" /> Add Property
            </button>
          </div>
        </div>
      ) : selectedProperty ? (
        /* Detailed Property/Unit View */
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{selectedProperty.name}</h2>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${
                  getPropertyType(selectedProperty) === 'Single Family'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20'
                    : getPropertyType(selectedProperty) === 'Condo'
                      ? 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-500/20'
                      : 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20'
                }`}>
                  {getPropertyType(selectedProperty)}
                </span>
              </div>
              <p className="text-xs text-slate-450 dark:text-slate-400 mt-1 font-medium">{formatAddressWithUnit(selectedProperty)}</p>

            </div>
            <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
              <button
                onClick={() => {
                  localStorage.setItem('open_create_lease_modal', 'true');
                  if (setActivePage) setActivePage('leases_hub');
                }}
                className="flex-1 sm:flex-none px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition duration-200 shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <FileText className="w-4 h-4" /> Create Lease
              </button>
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
              {getPropertyType(selectedProperty) !== 'Single Family' && getPropertyType(selectedProperty) !== 'Condo' && (
                <button
                  onClick={() => {
                    const activeUnitsInProperty = (units || []).filter(u => u.active_status !== false).length;
                    if (activeUnitsInProperty >= 5) {
                      setShowUpgradeModal(true);
                      return;
                    }
                    setErrorMsg('');
                    setUnitNo(getNextUnitNumber());
                    setShowUnitModal(true);
                  }}
                  className="flex-1 sm:flex-none px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition duration-200 shadow-md shadow-blue-500/10 cursor-pointer animate-fade-in"
                >
                  <PlusCircle className="w-4.5 h-4.5" /> Add Unit
                </button>
              )}
            </div>
          </div>

          <div className="p-5">
            {loadingUnits ? (
              <div className="py-24 text-center text-slate-400 text-sm animate-pulse">Loading details...</div>
            ) : units.length === 0 ? (
              <div className="py-24 text-center text-slate-400 text-sm">No details available.</div>
            ) : (() => {
              const u = units[0];
              const isSFOrCondo = getPropertyType(selectedProperty) === 'Single Family' || getPropertyType(selectedProperty) === 'Condo';
              if (isSFOrCondo && u) {
                return (
                  <div className="p-6 rounded-2xl border border-slate-250/60 dark:border-white/10 bg-white dark:bg-[#1E2E42] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-scale-up text-left">
                    <div className="flex items-center gap-5">
                      <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-500 flex-shrink-0">
                        <Home className="w-6 h-6" />
                      </div>
                      <div className="text-left space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                            Property Status
                          </h4>
                          <span className={`text-xs font-black px-3 py-1 rounded-xl border ${
                            u.status === 'OCCUPIED'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-450 border-emerald-500/20'
                              : u.status === 'VACANT'
                                ? 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border-orange-500/20'
                                : 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 border-red-500/20'
                          }`}>
                            {u.status}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                          {u.rent_amount > 0 && (
                            <>
                              Rent Amount: <strong className="text-slate-800 dark:text-slate-200">${u.rent_amount}/mo</strong>
                            </>
                          )}
                          {u.status === 'OCCUPIED' && u.tenant_name && (
                            <span className={`${u.rent_amount > 0 ? 'ml-4' : ''} px-2.5 py-1 bg-slate-100 dark:bg-white/5 rounded-lg text-xs text-slate-655 dark:text-slate-300 font-bold`}>
                              Tenant: {u.tenant_name}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {u.status === 'VACANT' && (
                      <div className="shrink-0">
                        <button
                          onClick={() => {
                            localStorage.setItem('open_create_lease_modal', 'true');
                            if (setActivePage) setActivePage('leases_hub');
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition duration-200 shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" /> Draft Lease Agreement
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div className="flex flex-col gap-3">
                  {units.map(unitItem => (
                    <div 
                      key={unitItem.unit_id}
                      className="p-4 rounded-xl border border-slate-100 dark:border-white/[0.03] bg-slate-50/30 dark:bg-black/20 hover:border-slate-200 dark:hover:border-white/[0.06] transition duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 flex-shrink-0">
                          <DoorOpen className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              Unit {unitItem.unit_number === 'Entire Property' || unitItem.unit_number === 'Single Family' || unitItem.unit_number === 'Condo Unit' || !/\d/.test(unitItem.unit_number) ? '1' : unitItem.unit_number}
                            </h4>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border flex-shrink-0 ${
                              unitItem.status === 'OCCUPIED'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-450 border-emerald-500/20'
                                : unitItem.status === 'VACANT'
                                  ? 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border-orange-500/20'
                                  : 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 border-red-500/20'
                            }`}>
                              {unitItem.status}
                            </span>
                          </div>
                          {(Number(unitItem.rent_amount) > 0 || (unitItem.status === 'OCCUPIED' && unitItem.tenant_name)) && (
                            <p className="text-xs text-slate-450 dark:text-slate-400 mt-1 font-semibold">
                              {Number(unitItem.rent_amount) > 0 && (
                                <>
                                  Rent: <strong className="text-slate-800 dark:text-slate-200">${unitItem.rent_amount}/mo</strong>
                                </>
                              )}
                              {unitItem.status === 'OCCUPIED' && unitItem.tenant_name && (
                                <span className={`${Number(unitItem.rent_amount) > 0 ? 'ml-3' : ''} px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded text-[10px] text-slate-650 dark:text-slate-300 font-bold`}>
                                  Tenant: {unitItem.tenant_name}
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      {(getPropertyType(selectedProperty) !== 'Single Family' && getPropertyType(selectedProperty) !== 'Condo' || units.filter(un => un.active_status !== false).length > 1) && (
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-white/5">
                          <button 
                            onClick={() => openEditUnitModal(unitItem)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-slate-400 hover:text-blue-500 transition duration-150 flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-transparent hover:border-blue-500/10"
                            title="Edit Unit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="sm:hidden lg:inline text-[10px]">Edit</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteUnit(unitItem.unit_id)}
                            className="p-2 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-555 dark:hover:text-red-450 transition duration-155 flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-transparent hover:border-red-500/10"
                            title="Delete Unit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="sm:hidden lg:inline text-[10px]">Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        /* Premium Dashboard Portfolio View */
        <div className="space-y-6">
          {/* Stats Summary Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1E2E42] border border-slate-200/80 dark:border-white/10 flex items-center gap-3 shadow-sm">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider truncate">Total Portfolio</p>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5 truncate">{properties.length} Properties</h3>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1E2E42] border border-slate-200/80 dark:border-white/10 flex items-center gap-3 shadow-sm">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                <Home className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider truncate">Single Family</p>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5 truncate">{sfPropsCount} Homes</h3>
              </div>
            </div>
          </div>


          {/* Interactive Filters & Search Row */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-slate-50 dark:bg-black/15 p-3 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-inner">
            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar shrink-0">
              {[
                { id: 'all', label: 'All Properties', count: properties.length },
                { id: 'single', label: 'Single Family', count: sfPropsCount }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategoryFilter(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                    activeCategoryFilter === tab.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                    activeCategoryFilter === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>


            {/* Live Search Input */}
            <div className="relative md:w-80">
              <span className="absolute left-3.5 top-3 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search property name or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 shadow-sm"
              />
            </div>
          </div>

          {/* Cards Grid */}
          {filteredProps.length === 0 ? (
            <div className="py-20 text-center text-slate-400 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-white/40 dark:bg-[#1a2736]/10">
              <p className="font-bold text-slate-600 dark:text-slate-300">No properties match your filter/search.</p>
              <p className="text-xs text-slate-450 mt-1">Try modifying your search term or tab category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProps.map(p => renderPropertyCard(p))}
            </div>
          )}
        </div>
      )}

      {/* Property Creation Modal (Single Step) */}
      {showPropModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1a2736] border border-slate-200 dark:border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-up text-slate-900 dark:text-white text-left flex flex-col max-h-[90vh]">
            
            {/* Modal Header - Premium Gradient */}
            <div className="relative px-6 py-5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 flex justify-between items-center overflow-hidden">
              {/* Background glow orbs */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-6 left-8 w-20 h-20 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/20">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white tracking-tight leading-none">Add Property</h3>
                    <p className="text-[10px] text-blue-100/80 font-medium mt-0.5">
                      Enter property details
                    </p>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleClosePropModal} 
                className="relative z-10 w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer border border-white/20 text-lg font-semibold"
              >
                ×
              </button>
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

            {/* Form Body content */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form onSubmit={handleWizardSubmit} className="space-y-5 animate-fade-in text-left">
                
                <div className="space-y-4 relative">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Property Type</label>
                    <div className="flex items-center justify-between w-full bg-slate-100 dark:bg-[#111c2a]/60 border border-slate-200 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 font-semibold cursor-default">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Single-Family Home</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                        Default
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Property Name / Portfolio *</label>
                    <input 
                      required 
                      type="text" 
                      value={propName} 
                      onChange={e => setPropName(e.target.value)} 
                      className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none" 
                      placeholder="e.g. Greenwood Villa or Oakwood Complex" 
                    />
                  </div>
                  
                  <div className="relative">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Street Address *</label>
                    <input 
                      required 
                      type="text" 
                      value={propAddress} 
                      onChange={e => handleAddressChange(e.target.value)} 
                      onBlur={handleAddressBlur}
                      className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none" 
                      placeholder="e.g. 1600 Amphitheatre Pkwy" 
                    />
                    
                    {addressSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#1D2B3A] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
                        {addressSuggestions.map((suggestion, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer text-left text-xs font-semibold border-b border-slate-100 dark:border-white/[0.03] last:border-none text-slate-700 dark:text-slate-350"
                          >
                            {suggestion.street}, {suggestion.city}, {suggestion.state} {suggestion.zip}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 font-sans">City</label>
                      <input 
                        required 
                        readOnly 
                        type="text" 
                        value={propCity} 
                        className="w-full bg-slate-100 dark:bg-[#111c2a]/40 border border-slate-200 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed" 
                        placeholder="City" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 font-sans">State</label>
                      <input 
                        required 
                        readOnly 
                        type="text" 
                        value={propState} 
                        className="w-full bg-slate-100 dark:bg-[#111c2a]/40 border border-slate-200 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed" 
                        placeholder="State" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 font-sans">Zip Code</label>
                      <input 
                        required 
                        readOnly 
                        type="text" 
                        value={propZip} 
                        className="w-full bg-slate-100 dark:bg-[#111c2a]/40 border border-slate-200 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed" 
                        placeholder="Zip" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 font-sans">Country</label>
                      <input 
                        readOnly 
                        type="text" 
                        value="USA" 
                        className="w-full bg-slate-100 dark:bg-[#111c2a]/40 border border-slate-200 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed font-medium" 
                      />
                    </div>
                  </div>

                  {propAddress.trim().length > 0 && (
                    <div className="text-[10px] font-semibold font-sans">
                      {propCity && propState && /^\d{5}(-\d{4})?$/.test(propZip) ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          Address verified (United States)
                        </span>
                      ) : (
                        <span className="text-red-500 dark:text-red-400 flex items-center gap-1">
                          Invalid US Address. Please select a valid US address from the suggestions or type a fully formatted address.
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end gap-3 border-t border-slate-200 dark:border-white/10">
                  <button 
                    type="button" 
                    onClick={handleClosePropModal} 
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition duration-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition duration-200 shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Property'}
                  </button>
                </div>

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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">City</label>
                  <input required type="text" value={editCity} onChange={e=>setEditCity(e.target.value)} onBlur={() => {
                    if (editCity && !editState) {
                      handleEditCityLookup(editCity);
                    } else if (editCity && editState) {
                      handleEditCityStateLookup(editCity, editState);
                    }
                  }} className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" placeholder="New York" />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">State</label>
                  <input required type="text" value={editState} onChange={e=>setEditState(e.target.value)} onBlur={() => {
                    if (editState && !editCity) {
                      handleEditStateLookup(editState);
                    } else if (editCity && editState) {
                      handleEditCityStateLookup(editCity, editState);
                    }
                  }} className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" placeholder="New York" />
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
      {showEditUnitModal && (() => {

        const isSingleFamily = selectedProperty && getPropertyType(selectedProperty) === 'Single Family';
        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#1e2a3b] border border-slate-200/10 w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl animate-scale-up text-slate-900 dark:text-white text-left">
              <div className="flex justify-between items-start mb-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-indigo-550" /> {isSingleFamily ? 'Edit Rent Details' : 'Edit Unit'}
                </h2>
                <button onClick={() => setShowEditUnitModal(false)} className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white text-lg cursor-pointer">×</button>
              </div>
              <p className="text-slate-500 dark:text-gray-400 text-xs mb-6">
                {isSingleFamily 
                  ? 'Modify the monthly rent amount for this property.' 
                  : `Modify details for Unit ${selectedUnit?.unit_number === 'Entire Property' || selectedUnit?.unit_number === 'Single Family' || selectedUnit?.unit_number === 'Condo Unit' || (selectedUnit?.unit_number && !/\d/.test(selectedUnit.unit_number)) ? '1' : selectedUnit?.unit_number}.`
                }
              </p>
              {errorMsg && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 dark:text-red-400 p-3 rounded-xl font-medium mb-4">{errorMsg}</p>}
              <form onSubmit={handleEditUnit} className="space-y-4">
                {!isSingleFamily && (
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Unit Number</label>
                    <input required type="text" value={editUnitNo} onChange={e=>setEditUnitNo(e.target.value)} className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" placeholder="e.g. Apt 101" />
                  </div>
                )}
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
        );
      })()}


      {/* Maximum Property Limit Confirmation Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-gradient-to-br dark:from-[#28384E] dark:to-[#222f42] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl text-slate-900 dark:text-white">
            <div className="w-14 h-14 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
              <Building2 size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Property Limit Reached</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-6 leading-relaxed">
              You can only add a maximum of 2 properties under your current plan. To add more properties, please upgrade your subscription or manage your existing properties.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-3 px-4 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-gray-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUpgradeModal(false);
                }}
                className="flex-1 py-3 px-4 rounded-2xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition cursor-pointer"
              >
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={() => {
          confirmConfig.onConfirm?.();
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
