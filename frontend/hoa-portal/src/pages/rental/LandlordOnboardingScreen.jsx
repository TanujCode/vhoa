import React, { useState } from 'react';
import { Home, Plus, BadgeAlert, Check, Sun, Moon, LogOut, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../../components/marketing/Logo';
import API from '../../services/api';

export default function LandlordOnboardingScreen({ user, onPropertyCreated }) {
  const { theme, toggleTheme } = useTheme();
  const [propName, setPropName] = useState('');
  const [propAddress, setPropAddress] = useState('');
  const [propCity, setPropCity] = useState('');
  const [propState, setPropState] = useState('');
  const [propZip, setPropZip] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const STATE_NAME_TO_ABBR = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR", "california": "CA", "colorado": "CO", "connecticut": "CT", "delaware": "DE", "florida": "FL", "georgia": "GA", "hawaii": "HI", "idaho": "ID", "illinois": "IL", "indiana": "IN", "iowa": "IA", "kansas": "KS", "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD", "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS", "missouri": "MO", "montana": "MT", "nebraska": "NE", "nevada": "NV", "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND", "ohio": "OH", "oklahoma": "OK", "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC", "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT", "vermont": "VT", "virginia": "VA", "washington": "WA", "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY"
  };

  const getAbbr = (stateStr) => {
    const clean = stateStr.trim().toLowerCase();
    if (clean.length === 2) return clean.toUpperCase();
    return STATE_NAME_TO_ABBR[clean] || stateStr;
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
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const addr = data[0].address || {};
          const city = addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || '';
          const state = addr.state || '';
          const zip = addr.postcode || '';
          if (city) setPropCity(city);
          if (state) setPropState(getAbbr(state));
          if (zip) setPropZip(zip);
        }
      }
    } catch (err) {
      console.warn("Auto-fill blur lookup failed:", err);
    }
  };

  const handleLogout = () => {
    const keys = ['rental_token', 'rental_session_token', 'rental_user'];
    keys.forEach(k => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
    window.location.href = '/rental/login';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const name = propName.trim();
    const address = propAddress.trim();
    const city = propCity.trim();
    const state = propState.trim();
    const zip = propZip.trim();

    if (!name) { setErrorMsg("Property name is required."); return; }
    if (!address) { setErrorMsg("Address is required."); return; }
    if (!city) { setErrorMsg("City is required."); return; }
    if (!state) { setErrorMsg("State is required."); return; }
    if (!zip) { setErrorMsg("ZIP code is required."); return; }

    const cleanState = state.toLowerCase();
    const isUSState = STATE_NAME_TO_ABBR.hasOwnProperty(cleanState) || 
                      Object.values(STATE_NAME_TO_ABBR).map(abbr => abbr.toLowerCase()).includes(cleanState);
    if (!isUSState) {
      setErrorMsg("Validation Error: Only US states are allowed.");
      return;
    }

    if (!/^\d{5}(-\d{4})?$/.test(zip)) {
      setErrorMsg("Validation Error: ZIP code must be a valid 5-digit US ZIP code.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await API.post('/rental/properties-with-units', {
        name,
        address,
        city,
        state: getAbbr(state),
        zip_code: zip,
        property_type: 'single',
        units: [{ unit_number: 'Single Family', rent_amount: 0.0 }]
      });

      if (onPropertyCreated) {
        onPropertyCreated(res.data);
      }
    } catch (err) {
      console.error("Create property error:", err);
      setErrorMsg(err.response?.data?.detail || "Failed to create property. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const isFormValid = Boolean(propName.trim() && propCity && propState && /^\d{5}(-\d{4})?$/.test(propZip));

  return (
    <div className="min-h-screen bg-slate-900/60 backdrop-blur-md dark:bg-[#0b1420] text-slate-900 dark:text-white flex flex-col font-sans relative overflow-x-hidden">
      
      {/* Background Ambience / Glow */}
      <div className="fixed inset-0 bg-radial from-blue-600/10 via-transparent to-transparent pointer-events-none" />
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Clean Minimal Header */}
      <header className="h-16 border-b border-white/10 dark:border-white/10 px-4 sm:px-8 flex items-center justify-between relative z-20 backdrop-blur-xl bg-white/70 dark:bg-[#0D1B2A]/80">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="hidden sm:inline-flex items-center text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-xl border border-blue-500/20 tracking-wider uppercase font-mono">
            Landlord Onboarding
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-white/10">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-blue-500/20">
              {getInitials(user?.name || user?.full_name)}
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 hidden md:inline-block">
              {user?.name || user?.full_name || 'Landlord'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Log Out"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Centered Add Property Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="bg-white dark:bg-[#1a2736] border border-slate-200 dark:border-white/10 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-scale-up text-slate-900 dark:text-white text-left">
          
          {/* Card Header - Gradient Ribbon */}
          <div className="relative px-6 py-5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 flex justify-between items-center overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-6 left-8 w-20 h-20 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-sm">
                <Plus className="w-5 h-5 text-white stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-tight leading-none">Add Property</h3>
                <p className="text-[11px] text-blue-100/90 font-medium mt-1">
                  Enter property details
                </p>
              </div>
            </div>
          </div>

          {/* Error Indicator */}
          {errorMsg && (
            <div className="px-6 pt-4">
              <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 dark:text-red-400 p-3 rounded-xl font-medium flex items-center gap-2">
                <BadgeAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
                {errorMsg}
              </p>
            </div>
          )}

          {/* Form Body */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              
              <div className="space-y-4 relative">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 font-sans">
                    PROPERTY TYPE
                  </label>
                  <div className="flex items-center justify-between w-full bg-slate-100 dark:bg-[#111c2a]/60 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 font-semibold cursor-default">
                    <div className="flex items-center gap-2.5">
                      <Home className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-bold">Single-Family Home</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 font-mono">
                      DEFAULT
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 font-sans">
                    PROPERTY NAME / PORTFOLIO *
                  </label>
                  <input 
                    required 
                    type="text" 
                    value={propName} 
                    onChange={e => setPropName(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none transition" 
                    placeholder="e.g. Greenwood Villa or Oakwood Complex" 
                  />
                </div>
                
                <div className="relative">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 font-sans">
                    STREET ADDRESS *
                  </label>
                  <input 
                    required 
                    type="text" 
                    value={propAddress} 
                    onChange={e => handleAddressChange(e.target.value)} 
                    onBlur={handleAddressBlur}
                    className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none transition" 
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

                <div className="grid grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 font-sans">CITY</label>
                    <input 
                      required 
                      readOnly 
                      type="text" 
                      value={propCity} 
                      className="w-full bg-slate-100 dark:bg-[#111c2a]/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed" 
                      placeholder="City" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 font-sans">STATE</label>
                    <input 
                      required 
                      readOnly 
                      type="text" 
                      value={propState} 
                      className="w-full bg-slate-100 dark:bg-[#111c2a]/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed" 
                      placeholder="State" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 font-sans">ZIP CODE</label>
                    <input 
                      required 
                      readOnly 
                      type="text" 
                      value={propZip} 
                      className="w-full bg-slate-100 dark:bg-[#111c2a]/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed" 
                      placeholder="Zip" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 font-sans">COUNTRY</label>
                    <input 
                      readOnly 
                      type="text" 
                      value="USA" 
                      className="w-full bg-slate-100 dark:bg-[#111c2a]/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed font-bold" 
                      placeholder="Country" 
                    />
                  </div>
                </div>

                {propAddress.trim().length > 0 && (
                  <div className="text-[10px] font-semibold font-sans pt-0.5">
                    {propCity && propState && /^\d{5}(-\d{4})?$/.test(propZip) ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        ✓ Address verified (United States)
                      </span>
                    ) : (
                      <span className="text-red-500 dark:text-red-400 flex items-center gap-1">
                        ⚠️ Invalid US Address. Please select from autocomplete suggestions.
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/5">
                <button 
                  type="submit"
                  disabled={!isFormValid || submitting}
                  className={`w-full font-bold py-3.5 rounded-xl text-xs transition duration-200 flex items-center justify-center gap-1.5 font-sans ${
                    isFormValid && !submitting
                      ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-lg shadow-blue-500/15'
                      : 'bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {submitting ? 'Creating Property...' : (
                    <>Create Property <Check className="w-4 h-4" /></>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>

    </div>
  );
}
