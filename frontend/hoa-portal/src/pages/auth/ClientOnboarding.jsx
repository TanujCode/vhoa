import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Building, User, Shield, CreditCard, CheckCircle, 
  AlertCircle, ChevronRight, ChevronLeft, RefreshCw, KeyRound, Globe2, Landmark, Info,
  Eye, EyeOff
} from 'lucide-react';
import API from '../../services/api';
import { verifyContractCode, getCaptcha, onboardClient } from '../../services/contractService';
import { validateEmail } from '../../utils/emailValidation';
import { 
  validateName, 
  validateCity, 
  validateZipCode, 
  validateBusinessName, 
  onlyLettersKeyPress, 
  onlyZipKeyPress 
} from '../../utils/fieldValidators';

export default function ClientOnboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Step navigation: 1 = Contract, 2 = Account Setup, 3 = HOA Community, 4 = Billing & Captcha
  const [step, setStep] = useState(1);
  const [loadingCode, setLoadingCode] = useState(false);
  const [verifiedContract, setVerifiedContract] = useState(null);
  
  const generateLocalCaptcha = () => {
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1;
    return {
      question: `${num1} + ${num2} = ?`,
      token: `local_captcha_math:${num1}+${num2}`
    };
  };

  const [captcha, setCaptcha] = useState(() => generateLocalCaptcha());
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  
  const mapboxToken = (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '').replace(/['"]/g, "").trim();
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [addressSelected, setAddressSelected] = useState(false);
  const addressTimeoutRef = useRef(null);

  const [citySuggestions, setCitySuggestions] = useState([]);
  const [searchingCity, setSearchingCity] = useState(false);
  const cityTimeoutRef = useRef(null);

  const [stateCities, setStateCities] = useState([]);
  const [cityOriginalNames, setCityOriginalNames] = useState({});
  const [loadingCities, setLoadingCities] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [zipError, setZipError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [showCardCvv, setShowCardCvv] = useState(false);

  const getPhoneValidationRule = (code) => {
    switch (code) {
      case '+1':
      case '+91':
      case '+44':
        return { min: 10, max: 10, label: '10 digits' };
      case '+971':
      case '+966':
      case '+61':
        return { min: 9, max: 9, label: '9 digits' };
      default:
        return { min: 7, max: 15, label: '7 to 15 digits' };
    }
  };

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors, isValid } } = useForm({
    mode: 'onTouched',
    defaultValues: {
      contract_code: searchParams.get('code') || '',
      first_name: '',
      middle_name: '',
      last_name: '',
      email_id: '',
      mobile_number: '',
      mobile_number_only: '',
      country_code: '+1',
      password: '',
      confirm_password: '',
      role_selected: 'Admin',
      hoa_name: '',
      hoa_address: '',
      hoa_city: '',
      hoa_state_id: '',
      hoa_country_id: '',
      hoa_zip_code: '',
      hoa_contact_number: '',
      hoa_contact_country_code: '+1',
      hoa_contact_number_only: '',
      payment_method: 'bank_account',
      bank_name: '',
      routing_number: '',
      account_number: '',
      cardholder_name: '',
      card_number: '',
      card_expiry: '',
      card_cvv: '',
      captcha_answer: ''
    }
  });

  const contractCodeValue = watch('contract_code');
  const passwordValue = watch('password');
  const paymentMethod = watch('payment_method');
  const countryCode = watch('country_code') || '+1';
  const hoaContactCountryCode = watch('hoa_contact_country_code') || '+1';
  const ownerPhoneRule = getPhoneValidationRule(countryCode);
  const contactPhoneRule = getPhoneValidationRule(hoaContactCountryCode);
  const hoaAddressRegister = register('hoa_address', { required: 'Required' });

  const selectedStateId = watch('hoa_state_id');
  const selectedCountryId = watch('hoa_country_id');

  // Load countries and prefill code from URL on mount
  useEffect(() => {
    fetchCountries();
    // Ping backend in background on mount to wake it up from cold-start
    API.get('/auth/captcha', { timeout: 2000 }).catch(() => {});
    
    // Auto-verify if code is present in URL
    const urlCode = searchParams.get('code');
    if (urlCode) {
      handleVerifyCode(urlCode);
    }
  }, []);

  const fetchCountries = async () => {
    try {
      const res = await API.get('/location/countries');
      setCountries(res.data);
      if (res.data.length > 0) {
        // Default to first country (usually USA or India)
        const defaultCountryId = res.data[0].country_id;
        setValue('hoa_country_id', defaultCountryId);
        setSelectedCountry(defaultCountryId);
        fetchStates(defaultCountryId, res.data);
      }
    } catch (err) {
      console.error('Failed to load countries:', err);
    }
  };

  const fetchStates = async (countryId, currentCountriesList = countries) => {
    if (!countryId) return;
    try {
      const res = await API.get(`/location/states/${countryId}`);
      setStates(res.data);
      if (res.data.length > 0) {
        const defaultStateId = res.data[0].state_id;
        setValue('hoa_state_id', defaultStateId);
        fetchCitiesForState(defaultStateId, res.data, countryId, currentCountriesList);
      } else {
        setValue('hoa_state_id', '');
        setStateCities([]);
      }
    } catch (err) {
      console.error('Failed to load states:', err);
    }
  };

  const fetchCitiesForState = async (stateId, currentStatesList = states, currentCountryId = null, currentCountriesList = countries) => {
    setValue('hoa_city', '');
    setValue('hoa_zip_code', '');
    setStateCities([]);
    setCityOriginalNames({});
    
    if (!stateId) return;

    const stateObj = currentStatesList.find(s => String(s.state_id) === String(stateId));
    if (!stateObj) return;
    
    const actualCountryId = currentCountryId || watch('hoa_country_id') || selectedCountryId;
    const countryObj = currentCountriesList.find(c => String(c.country_id) === String(actualCountryId));
    const countryName = countryObj ? countryObj.country_name : '';
    const stateName = stateObj.state_name;

    if (!countryName || !stateName) return;

    // 1. Try clean, curated Indian districts dataset first to avoid typos
    if (countryName.toLowerCase() === 'india') {
      try {
        setLoadingCities(true);
        const response = await fetch('https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json');
        if (response.ok) {
          const result = await response.json();
          const stateData = result.states.find(s => s.state.toLowerCase() === stateName.toLowerCase());
          if (stateData && Array.isArray(stateData.districts) && stateData.districts.length > 0) {
            const mapping = {};
            const cleanedCities = [];
            stateData.districts.forEach(city => {
              const cleaned = city.replace(/[^A-Za-z]/g, '');
              if (cleaned.length > 0) {
                cleanedCities.push(cleaned);
                mapping[cleaned] = city;
              }
            });
            const uniqueCities = Array.from(new Set(cleanedCities)).sort();
            setStateCities(uniqueCities);
            setCityOriginalNames(mapping);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch clean Indian districts JSON, falling back to CountriesNow:', err);
      } finally {
        setLoadingCities(false);
      }
    }

    const cityCorrections = {
      "Betl": "Betul",
      "BetlBazr": "BetulBazar",
      "Barwni": "Barwani",
      "Bbai": "Babai",
      "Barght": "Barghat",
      "Bg": "Bagh"
    };

    try {
      setLoadingCities(true);
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: countryName,
          state: stateName
        })
      });

      if (!response.ok) throw new Error('API failed');
      const result = await response.json();
      
      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        const mapping = {};
        const cleanedCities = [];
        result.data.forEach(city => {
          const cleaned = city.replace(/[^A-Za-z]/g, '');
          const corrected = cityCorrections[cleaned] || cleaned;
          if (corrected.length > 0) {
            cleanedCities.push(corrected);
            mapping[corrected] = cityCorrections[cleaned] ? cityCorrections[cleaned] : city;
          }
        });
        const uniqueCities = Array.from(new Set(cleanedCities)).sort();
        setStateCities(uniqueCities);
        setCityOriginalNames(mapping);
      } else {
        throw new Error('No cities returned');
      }
    } catch (err) {
      console.warn('Failed to fetch cities from API, using fallback:', err);
      const normalizedState = stateName.toLowerCase();
      let fallback = [];
      let mapping = {};
      if (normalizedState.includes('madhya pradesh')) {
        fallback = [
          "Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa", 
          "Singrauli", "Katni", "Morena", "Chhindwara", "Bhind", "Shivpuri", "Guna", "Khandwa", "Burhanpur", 
          "Dhar", "Khargone", "Sehore", "Vidisha", "Betul", "Hoshangabad", "Itarsi"
        ];
        fallback.forEach(c => { mapping[c] = c; });
      } else if (normalizedState.includes('california')) {
        fallback = [
          "LosAngeles", "SanDiego", "SanJose", "SanFrancisco", "Fresno", "Sacramento", "LongBeach", 
          "Oakland", "Bakersfield", "Anaheim", "SantaAna", "Riverside", "Stockton", "ChulaVista", "Irvine", "Fremont"
        ];
        mapping = {
          "LosAngeles": "Los Angeles",
          "SanDiego": "San Diego",
          "SanJose": "San Jose",
          "SanFrancisco": "San Francisco",
          "Fresno": "Fresno",
          "Sacramento": "Sacramento",
          "LongBeach": "Long Beach",
          "Oakland": "Oakland",
          "Bakersfield": "Bakersfield",
          "Anaheim": "Anaheim",
          "SantaAna": "Santa Ana",
          "Riverside": "Riverside",
          "Stockton": "Stockton",
          "ChulaVista": "Chula Vista",
          "Irvine": "Irvine",
          "Fremont": "Fremont"
        };
      }
      
      if (fallback.length > 0) {
        setStateCities(fallback.sort());
        setCityOriginalNames(mapping);
      } else {
        setStateCities([]);
        setCityOriginalNames({});
      }
    } finally {
      setLoadingCities(false);
    }
  };

  const fetchZipForCity = async (cityName) => {
    if (!cityName) return;

    const countryObj = countries.find(c => String(c.country_id) === String(selectedCountryId));
    const countryName = countryObj ? countryObj.country_name : '';
    const countryCodeStr = countryObj?.country_code?.toLowerCase() || 'us';
    
    const stateObj = states.find(s => String(s.state_id) === String(watch('hoa_state_id')));
    const stateName = stateObj ? stateObj.state_name : '';

    const originalName = cityOriginalNames[cityName] || cityName;
    const searchQueryName = originalName;
    
    // 1. Try clean India Postal Pincode API first
    if (countryName.toLowerCase() === 'india') {
      try {
        const url = `https://api.postalpincode.in/postoffice/${encodeURIComponent(searchQueryName)}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data && data[0] && data[0].Status === 'Success' && Array.isArray(data[0].PostOffice)) {
            const matchedPO = data[0].PostOffice.find(po => 
              po.State?.toLowerCase() === stateName.toLowerCase()
            );
            const po = matchedPO || data[0].PostOffice[0];
            if (po && po.Pincode) {
              setValue('hoa_zip_code', po.Pincode, { shouldValidate: true });
              setZipError('');
              return;
            }
          }
        }
      } catch (err) {
        console.warn('India postal pincode API lookup failed, falling back:', err);
      }
    }

    // 2. Try Mapbox if token is configured and valid
    const hasMapbox = mapboxToken && !mapboxToken.startsWith('pk.placeholder');
    if (hasMapbox) {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQueryName)}.json?access_token=${mapboxToken}&country=${countryCodeStr}&types=place,locality,postcode&limit=5`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          let zipCode = '';
          if (data.features && data.features.length > 0) {
            for (const feature of data.features) {
              if (feature.id.startsWith('postcode')) {
                zipCode = feature.text;
                break;
              }
              if (feature.context) {
                const pc = feature.context.find(c => c.id.startsWith('postcode'));
                if (pc) {
                  zipCode = pc.text;
                  break;
                }
              }
            }
          }
          if (zipCode) {
            const cleanZip = zipCode.replace(/[^0-9]/g, '');
            setValue('hoa_zip_code', cleanZip, { shouldValidate: true });
            setZipError('');
            return;
          }
        }
      } catch (err) {
        console.warn('Mapbox zip lookup failed, falling back:', err);
      }
    }

    // 3. Fallback to OpenStreetMap Nominatim Geocoding (free, no key required)
    try {
      const query = `${searchQueryName}, ${stateName}, ${countryName}`;
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          for (const item of data) {
            if (item.address && item.address.postcode) {
              const cleanZip = item.address.postcode.replace(/[^0-9]/g, '');
              if (cleanZip) {
                setValue('hoa_zip_code', cleanZip, { shouldValidate: true });
                setZipError('');
                return;
              }
            }
          }
        }
      }

      // If we still don't have a postcode, try querying with "post office" fallback
      const fallbackQuery = `${searchQueryName} post office, ${stateName}, ${countryName}`;
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fallbackQuery)}&format=json&addressdetails=1&limit=3`;
      const fallbackResponse = await fetch(fallbackUrl);
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData && fallbackData.length > 0) {
          for (const item of fallbackData) {
            if (item.address && item.address.postcode) {
              const cleanZip = item.address.postcode.replace(/[^0-9]/g, '');
              if (cleanZip) {
                setValue('hoa_zip_code', cleanZip, { shouldValidate: true });
                setZipError('');
                return;
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Nominatim zip lookup fallback failed:', err);
    }
  };

  const verifyZipForCityAsync = async (zipCode) => {
    if (!zipCode) return '';
    if (zipCode.length < 5 || zipCode.length > 10) return '';

    const cityName = watch('hoa_city');
    if (!cityName) return '';

    const countryObj = countries.find(c => String(c.country_id) === String(selectedCountryId));
    const countryName = countryObj ? countryObj.country_name : '';
    const stateObj = states.find(s => String(s.state_id) === String(watch('hoa_state_id')));
    const stateName = stateObj ? stateObj.state_name : '';

    // 1. If country is India, use fast clean postal pincode API for verification
    if (countryName.toLowerCase() === 'india') {
      try {
        const url = `https://api.postalpincode.in/pincode/${encodeURIComponent(zipCode)}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data && data[0] && data[0].Status === 'Success' && Array.isArray(data[0].PostOffice)) {
            const cleanCityName = cityName.toLowerCase().replace(/[^a-z]/g, '');
            const matched = data[0].PostOffice.some(po => {
              const cleanName = po.Name?.toLowerCase().replace(/[^a-z]/g, '') || '';
              return cleanName === cleanCityName || cleanName.includes(cleanCityName);
            });
            if (!matched) {
              return `Zip code ${zipCode} does not belong to ${cityName}`;
            }
            return '';
          } else {
            return `Zip code ${zipCode} not found in India`;
          }
        }
      } catch (err) {
        console.warn('Postal pincode validation failed, falling back to Nominatim:', err);
      }
    }

    // 2. Fallback to Nominatim check for USA and other countries
    try {
      const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zipCode)}&country=${encodeURIComponent(countryName)}&format=json&addressdetails=1&limit=3`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          let matched = false;
          const normalizedCity = cityName.toLowerCase();
          
          for (const item of data) {
            const addr = item.address || {};
            const possibleNames = [
              addr.city,
              addr.town,
              addr.village,
              addr.suburb,
              addr.county,
              addr.state_district,
              addr.municipality,
              item.display_name
            ].filter(Boolean).map(n => n.toLowerCase().replace(/[^a-z]/g, ''));

            if (possibleNames.some(name => name.includes(normalizedCity) || normalizedCity.includes(name))) {
              matched = true;
              break;
            }
          }

          if (!matched) {
            return `Zip code ${zipCode} does not belong to ${cityName}`;
          }
          return '';
        } else {
          return `Zip code ${zipCode} not found in ${countryName}`;
        }
      }
    } catch (err) {
      console.warn('Zip validation failed:', err);
    }
    return '';
  };

  const verifyZipForCity = async (zipCode) => {
    setZipError('');
    const err = await verifyZipForCityAsync(zipCode);
    if (err) {
      setZipError(err);
    }
  };

  const handleZipChange = async (zipCode) => {
    setZipError('');
    if (!zipCode) return;

    const cleanZip = zipCode.replace(/[^0-9]/g, '');
    
    const countryObj = countries.find(c => String(c.country_id) === String(selectedCountryId));
    const countryName = countryObj ? countryObj.country_name : '';

    if (countryName.toLowerCase() === 'india' && cleanZip.length === 6) {
      try {
        const url = `https://api.postalpincode.in/pincode/${encodeURIComponent(cleanZip)}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data && data[0] && data[0].Status === 'Success' && Array.isArray(data[0].PostOffice)) {
            // Find Head Post Office or Sub Post Office first
            const mainPO = data[0].PostOffice.find(po => 
              po.BranchType === 'Head Post Office' || po.BranchType === 'Sub Post Office'
            );
            const po = mainPO || data[0].PostOffice[0];
            if (po && po.Name) {
              const cleanCity = po.Name.replace(/[^A-Za-z]/g, '');
              setValue('hoa_city', cleanCity, { shouldValidate: true });
              setZipError('');
            }
          }
        }
      } catch (err) {
        console.warn('Failed to auto-fill city from pin code:', err);
      }
    } else if (countryName.toLowerCase() !== 'india' && cleanZip.length === 5) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(cleanZip)}&country=${encodeURIComponent(countryName)}&format=json&addressdetails=1&limit=1`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data && data[0] && data[0].address) {
            const addr = data[0].address;
            const city = addr.city || addr.town || addr.village || addr.suburb;
            if (city) {
              const cleanCity = city.replace(/[^A-Za-z]/g, '');
              setValue('hoa_city', cleanCity, { shouldValidate: true });
              setZipError('');
            }
          }
        }
      } catch (err) {
        console.warn('Failed to auto-fill US city from zip code:', err);
      }
    }
  };

  const fetchCaptcha = async () => {
    // Instantly show a local math captcha — no delay!
    setCaptcha(generateLocalCaptcha());
    setValue('captcha_answer', '');

    try {
      setRefreshing(true);
      const data = await getCaptcha({ timeout: 2000 });
      const currentAnswer = watch('captcha_answer');
      if (!currentAnswer || currentAnswer.trim() === '') {
        setCaptcha({
          question: data.question,
          token: data.captcha_token
        });
      }
    } catch (err) {
      console.warn('Failed to fetch captcha from backend, keeping local:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleVerifyCode = async (codeOverride) => {
    const code = codeOverride || contractCodeValue;
    if (!code || code.trim() === '') {
      setErrorMsg('Please enter a contract code.');
      return;
    }

    try {
      setLoadingCode(true);
      setErrorMsg('');
      const data = await verifyContractCode(code.trim().toUpperCase());
      setVerifiedContract(data);
      
      // Prefill some fields from contract data
      if (data.client_name) {
        const parts = data.client_name.split(' ');
        if (parts.length >= 1) setValue('first_name', parts[0]);
        if (parts.length >= 2) setValue('last_name', parts[parts.length - 1]);
        if (parts.length === 3) setValue('middle_name', parts[1]);
      }
      
      // Since contract has client email address, let's use it
      if (data.client_email_address) {
        setValue('email_id', data.client_email_address);
      }
      
      // Set business name as HOA default
      if (data.business_name) {
        setValue('hoa_name', data.business_name);
      }

      setStep(2); // Go to next step
    } catch (err) {
      setVerifiedContract(null);
      setErrorMsg(err.response?.data?.detail || 'Invalid or inactive contract code.');
    } finally {
      setLoadingCode(false);
    }
  };

  useEffect(() => {
    return () => {
      if (addressTimeoutRef.current) {
        clearTimeout(addressTimeoutRef.current);
      }
      if (cityTimeoutRef.current) {
        clearTimeout(cityTimeoutRef.current);
      }
    };
  }, []);

  const handleAddressInputChange = (val) => {
    if (!mapboxToken || mapboxToken.startsWith('pk.placeholder_please_replace')) {
      return;
    }

    if (addressTimeoutRef.current) {
      clearTimeout(addressTimeoutRef.current);
    }

    if (!val || val.trim().length < 3) {
      setAddressSuggestions([]);
      return;
    }

    addressTimeoutRef.current = setTimeout(async () => {
      try {
        setSearchingAddress(true);
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val)}.json?access_token=${mapboxToken}&autocomplete=true&types=address&limit=5`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Mapbox API failed');
        const data = await response.json();
        setAddressSuggestions(data.features || []);
      } catch (err) {
        console.error('Error fetching address suggestions:', err);
        setAddressSuggestions([]);
      } finally {
        setSearchingAddress(false);
      }
    }, 600);
  };

  const handleSelectSuggestion = async (feature) => {
    setAddressSuggestions([]);
    
    const streetNumber = feature.address || '';
    const streetName = feature.text || '';
    const fullStreet = streetNumber ? `${streetNumber} ${streetName}`.trim() : streetName;
    
    let city = '';
    let zipCode = '';
    let stateName = '';
    let stateCode = '';
    let countryName = '';
    let countryCode = '';

    if (feature.context) {
      feature.context.forEach((item) => {
        if (item.id.startsWith('postcode')) {
          zipCode = item.text;
        } else if (item.id.startsWith('place') || item.id.startsWith('locality')) {
          city = item.text;
        } else if (item.id.startsWith('region')) {
          stateName = item.text;
          stateCode = item.short_code ? item.short_code.replace(/^[^-]+-/, '').toUpperCase() : '';
        } else if (item.id.startsWith('country')) {
          countryName = item.text;
          countryCode = item.short_code ? item.short_code.toUpperCase() : '';
        }
      });
    }

    setValue('hoa_address', fullStreet || feature.place_name);
    if (city) setValue('hoa_city', city);
    if (zipCode) setValue('hoa_zip_code', zipCode);

    let matchedCountry = null;
    if (countryCode || countryName) {
      matchedCountry = countries.find(c => 
        (countryCode && c.country_code?.toUpperCase() === countryCode) ||
        (countryName && c.country_name?.toLowerCase() === countryName.toLowerCase())
      );
    }

    if (matchedCountry) {
      const countryId = matchedCountry.country_id;
      setValue('hoa_country_id', countryId);
      setSelectedCountry(countryId);
      
      try {
        const res = await API.get(`/location/states/${countryId}`);
        setStates(res.data);
        
        let matchedState = null;
        if (stateCode || stateName) {
          matchedState = res.data.find(s => 
            (stateCode && s.state_code?.toUpperCase() === stateCode) ||
            (stateName && s.state_name?.toLowerCase() === stateName.toLowerCase())
          );
        }
        
        if (matchedState) {
          setValue('hoa_state_id', matchedState.state_id);
        } else if (res.data.length > 0) {
          setValue('hoa_state_id', res.data[0].state_id);
        }
      } catch (err) {
        console.error('Failed to load/resolve states:', err);
      }
    }

    setAddressSelected(true);
  };

  const handleResetAddress = () => {
    setAddressSelected(false);
    setValue('hoa_address', '');
    setValue('hoa_city', '');
    setValue('hoa_zip_code', '');
  };

  const handleCityInputChange = (val) => {
    // Clean input to letters-only (remove spaces, numbers, symbols)
    const cleanedVal = val.replace(/[^A-Za-z]/g, '');
    setValue('hoa_city', cleanedVal, { shouldValidate: true });
    
    // Clear zip code while typing
    setValue('hoa_zip_code', '');
    
    // Clear zip verification errors
    setZipError('');

    if (cityTimeoutRef.current) {
      clearTimeout(cityTimeoutRef.current);
    }

    if (!cleanedVal || cleanedVal.trim().length < 2) {
      setCitySuggestions([]);
      return;
    }

    const selectedCountryObj = countries.find(c => String(c.country_id) === String(selectedCountryId));
    const countryCodeStr = selectedCountryObj?.country_code?.toLowerCase() || 'us';

    cityTimeoutRef.current = setTimeout(async () => {
      // 1. Fetch zip code automatically for this city name
      await fetchZipForCity(cleanedVal);

      // 2. Fetch Mapbox suggestions if active and mapboxToken exists
      const hasMapbox = mapboxToken && !mapboxToken.startsWith('pk.placeholder');
      if (hasMapbox) {
        try {
          setSearchingCity(true);
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cleanedVal)}.json?access_token=${mapboxToken}&autocomplete=true&types=place,locality&country=${countryCodeStr}&limit=5`;
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            setCitySuggestions(data.features || []);
          }
        } catch (err) {
          console.error('Error fetching city suggestions:', err);
          setCitySuggestions([]);
        } finally {
          setSearchingCity(false);
        }
      }
    }, 800);
  };

  const handleSelectCitySuggestion = (feature) => {
    setCitySuggestions([]);
    
    const placeName = feature.text || '';
    const cleanCity = placeName.replace(/[^A-Za-z]/g, '');
    setValue('hoa_city', cleanCity, { shouldValidate: true });

    let zipCode = '';
    let stateName = '';
    let stateCode = '';

    if (feature.context) {
      feature.context.forEach((item) => {
        if (item.id.startsWith('postcode')) {
          zipCode = item.text;
        } else if (item.id.startsWith('region')) {
          stateName = item.text;
          stateCode = item.short_code ? item.short_code.replace(/^[^-]+-/, '').toUpperCase() : '';
        }
      });
    }

    if (zipCode) {
      const cleanZip = zipCode.replace(/[^0-9]/g, '');
      setValue('hoa_zip_code', cleanZip, { shouldValidate: true });
    }

    if (stateCode || stateName) {
      const matchedState = states.find(s => 
        (stateCode && s.state_code?.toUpperCase() === stateCode) ||
        (stateName && s.state_name?.toLowerCase() === stateName.toLowerCase())
      );
      if (matchedState) {
        setValue('hoa_state_id', matchedState.state_id, { shouldValidate: true });
      }
    }
  };

  const handleCountryChange = (e) => {
    const countryId = e.target.value;
    setSelectedCountry(countryId);
    fetchStates(countryId);
  };

  const handleNext = async () => {
    setErrorMsg('');
    
    let isValidStep = false;
    if (step === 1) {
      if (verifiedContract) {
        isValidStep = true;
      } else {
        const isCodeValid = await trigger('contract_code');
        if (isCodeValid) {
          await handleVerifyCode();
          return;
        }
      }
    } else if (step === 2) {
      isValidStep = await trigger([
        'first_name', 
        'middle_name', 
        'last_name', 
        'email_id', 
        'mobile_number_only', 
        'password', 
        'confirm_password'
      ]);
    } else if (step === 3) {
      const isFormValid = await trigger([
        'hoa_name',
        'hoa_country_id',
        'hoa_state_id',
        'hoa_city',
        'hoa_address',
        'hoa_zip_code',
        'hoa_contact_number_only'
      ]);
      
      if (!isFormValid) {
        isValidStep = false;
      } else {
        const enteredZip = watch('hoa_zip_code');
        const validationError = await verifyZipForCityAsync(enteredZip);
        if (validationError) {
          setZipError(validationError);
          isValidStep = false;
        } else {
          setZipError('');
          isValidStep = true;
        }
      }
    }

    if (isValidStep) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data) => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      setSubmitting(true);

      // Construct payment details representation
      let paymentDetails = '';
      if (data.payment_method === 'bank_account') {
        paymentDetails = `Bank: ${data.bank_name}, Routing: ${data.routing_number}, Account: ${data.account_number.slice(-4).padStart(data.account_number.length, '*')}`;
      } else {
        paymentDetails = `CC Holder: ${data.cardholder_name}, Card: ${data.card_number.slice(-4).padStart(data.card_number.length, '*')}`;
      }

      const payload = {
        first_name: data.first_name,
        middle_name: data.middle_name || null,
        last_name: data.last_name,
        email_id: data.email_id,
        mobile_number: data.mobile_number_only ? `${data.country_code}${data.mobile_number_only}` : '',
        password: data.password,
        role_selected: data.role_selected,
        hoa_name: data.hoa_name,
        hoa_address: data.hoa_address,
        hoa_city: data.hoa_city,
        hoa_state_id: data.hoa_state_id ? parseInt(data.hoa_state_id, 10) : null,
        hoa_country_id: data.hoa_country_id ? parseInt(data.hoa_country_id, 10) : null,
        hoa_zip_code: data.hoa_zip_code || null,
        hoa_contact_number: data.hoa_contact_number_only ? `${data.hoa_contact_country_code}${data.hoa_contact_number_only}` : null,
        contract_code: data.contract_code.trim().toUpperCase(),
        captcha_token: captcha.token,
        captcha_answer: data.captcha_answer,
        payment_method: data.payment_method,
        payment_details: paymentDetails
      };

      await onboardClient(payload);
      setSuccessMsg('Onboarding registration successful! Your HOA community has been created. Redirecting to login page...');
      setTimeout(() => {
        navigate('/login');
      }, 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Onboarding registration failed. Please review your captcha or contact details.');
      // Refresh captcha automatically on failure
      fetchCaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-4xl bg-[#162535] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row">
        
        {/* Left Side: Progress & Info */}
        <div className="w-full md:w-1/3 bg-[#111f2e] p-8 border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-[#1D9E75] rounded-xl flex items-center justify-center text-white font-bold text-xs">NB</div>
              <span className="text-xl font-bold tracking-tight text-white">Nest<span className="text-[#1D9E75]">Bloq</span></span>
            </div>
            
            <h2 className="text-2xl font-bold mb-2">HOA Client Onboarding</h2>
            <p className="text-xs text-gray-400 mb-6">Register your property management firm or board administration portal in minutes.</p>

            {/* Stepper */}
            <div className="space-y-6">
              {[
                { s: 1, title: 'Contract Code', desc: 'Verify contract validity', icon: Shield },
                { s: 2, title: 'User Account', desc: 'Login credentials & role', icon: User },
                { s: 3, title: 'HOA Community', desc: 'HOA details & address', icon: Building },
                { s: 4, title: 'Billing & Captcha', desc: 'Payment details & math captcha', icon: CreditCard }
              ].map((stepItem) => {
                const Icon = stepItem.icon;
                const isCurrent = step === stepItem.s;
                const isCompleted = step > stepItem.s;
                return (
                  <div key={stepItem.s} className="flex gap-4 items-start">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      isCurrent 
                        ? 'bg-[#1D9E75] text-white shadow-lg shadow-teal-500/20' 
                        : isCompleted 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-white/5 text-gray-500 border border-white/5'
                    }`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className={`text-xs font-semibold ${isCurrent ? 'text-white' : isCompleted ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {stepItem.title}
                      </div>
                      <div className="text-[10px] text-gray-500">{stepItem.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {verifiedContract && (
            <div className="mt-8 p-4 bg-[#1a2d41] rounded-2xl border border-white/5 text-xs space-y-2">
              <div className="font-bold text-gray-300 uppercase tracking-wider text-[10px] mb-1">Contract Parameters</div>
              <div>Plan: <span className="text-blue-400 font-semibold">{verifiedContract.plan_selected}</span></div>
              <div>Units Limit: <span className="text-white font-semibold font-mono">{verifiedContract.size_of_the_community}</span></div>
              <div>Annual Fee: <span className="text-[#25C490] font-semibold">${verifiedContract.annual_renewal_fee}</span></div>
              <div>Setup Fee: <span className="text-white font-semibold">${verifiedContract.one_time_set_up}</span></div>
            </div>
          )}
        </div>

        {/* Right Side: Form Wizard */}
        <div className="w-full md:w-2/3 p-8 flex flex-col justify-between">
          <div className="flex-1">
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-2xl flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 bg-teal-500/10 border border-teal-500/30 text-[#25C490] text-sm rounded-2xl flex items-center gap-2">
                <CheckCircle size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* STEP 1: CONTRACT VERIFICATION */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Enter Your Contract Code</h3>
                    <p className="text-xs text-gray-400 mb-4">Please input the unique contract code received from your NestBloq sales representative to begin setup.</p>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold tracking-wider text-gray-400 uppercase mb-2">Contract Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        {...register('contract_code', { required: true })}
                        placeholder="CON-XXXXXX"
                        className="flex-1 bg-[#1e2f41] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#1D9E75] font-mono text-lg uppercase tracking-widest placeholder:normal-case placeholder:font-sans"
                        disabled={loadingCode}
                      />
                      <button
                        type="button"
                        onClick={() => handleVerifyCode()}
                        disabled={loadingCode}
                        className="px-6 bg-[#1D9E75] hover:bg-[#15805d] disabled:bg-teal-800 text-white font-medium rounded-xl transition flex items-center gap-2 text-sm shadow-md"
                      >
                        {loadingCode ? <RefreshCw size={16} className="animate-spin" /> : 'Verify Code'}
                      </button>
                    </div>
                    {errors.contract_code && <p className="text-red-400 text-xs mt-1">Contract code is required.</p>}
                  </div>

                  <div className="bg-[#1c2e42] p-4 rounded-2xl border border-white/5 text-xs text-gray-400 leading-relaxed flex gap-3">
                    <Info size={24} className="text-blue-400 flex-shrink-0" />
                    <div>
                      <strong>Don't have a contract code?</strong> Let us help you set up! Please contact sales at <a href="mailto:sales@nestbloq.com" className="text-teal-400 underline font-semibold">sales@nestbloq.com</a> to draft your community services contract.
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: USER ACCOUNT SETUP */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Set Up Owner Account</h3>
                    <p className="text-xs text-gray-400">Create the primary administrative or board user credentials.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">First Name *</label>
                      <input
                        type="text"
                        {...register('first_name', { 
                          required: 'Required',
                          validate: validateName('First Name')
                        })}
                        onKeyPress={onlyLettersKeyPress}
                        className="w-full bg-[#1e2f41] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75]"
                      />
                      {errors.first_name && <span className="text-xs text-red-400">{errors.first_name.message}</span>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Middle Name</label>
                      <input
                        type="text"
                        {...register('middle_name', {
                          validate: validateName('Middle Name')
                        })}
                        onKeyPress={onlyLettersKeyPress}
                        className="w-full bg-[#1e2f41] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75]"
                      />
                      {errors.middle_name && <span className="text-xs text-red-400">{errors.middle_name.message}</span>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Last Name *</label>
                      <input
                        type="text"
                        {...register('last_name', { 
                          required: 'Required',
                          validate: validateName('Last Name')
                        })}
                        onKeyPress={onlyLettersKeyPress}
                        className="w-full bg-[#1e2f41] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75]"
                      />
                      {errors.last_name && <span className="text-xs text-red-400">{errors.last_name.message}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Email Address *</label>
                      <input
                        type="email"
                        {...register('email_id', { 
                          required: 'Required',
                          validate: validateEmail,
                        })}
                        className="w-full bg-[#1e2f41] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75]"
                      />
                      {errors.email_id && <span className="text-xs text-red-400">{errors.email_id.message}</span>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Mobile Phone *</label>
                      <div className="flex gap-2">
                        <select
                          {...register('country_code')}
                          className="px-3 py-2 bg-[#1e2f41] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#1D9E75] cursor-pointer"
                        >
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+91">🇮🇳 +91</option>
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+971">🇦🇪 +971</option>
                          <option value="+966">🇸🇦 +966</option>
                          <option value="+61">🇦🇺 +61</option>
                        </select>
                        <input
                          type="text"
                          maxLength={ownerPhoneRule.max}
                          {...register('mobile_number_only', { 
                            required: 'Mobile phone is required',
                            validate: (val) => {
                              if (!val) return 'Mobile phone is required';
                              if (val.length < ownerPhoneRule.min || val.length > ownerPhoneRule.max) {
                                return `Phone must be exactly ${ownerPhoneRule.label} for ${countryCode}`;
                              }
                              return true;
                            }
                          })}
                          onKeyPress={(e) => {
                            if (!/[0-9]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          placeholder={`${ownerPhoneRule.max}-digit number`}
                          className="flex-1 bg-[#1e2f41] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75]"
                        />
                      </div>
                      {errors.mobile_number_only && <span className="text-xs text-red-400">{errors.mobile_number_only.message}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Password *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          {...register('password', { 
                            required: 'Password is required',
                            minLength: { value: 8, message: 'Password must be at least 8 characters' },
                            validate: {
                              hasUppercase: (value) => /[A-Z]/.test(value) || 'Password must contain at least one uppercase letter',
                              hasNumber: (value) => /[0-9]/.test(value) || 'Password must contain at least one number',
                              hasSpecialChar: (value) => /[^A-Za-z0-9]/.test(value) || 'Password must contain at least one special character'
                            }
                          })}
                          className="w-full bg-[#1e2f41] border border-white/10 rounded-xl pl-3 pr-10 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {errors.password && <span className="text-xs text-red-400 mt-1 block">{errors.password.message}</span>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Confirm Password *</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          {...register('confirm_password', { 
                            required: 'Confirm password is required',
                            validate: (val) => val === passwordValue || 'Passwords do not match'
                          })}
                          className="w-full bg-[#1e2f41] border border-white/10 rounded-xl pl-3 pr-10 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {errors.confirm_password && <span className="text-xs text-red-400 mt-1 block">{errors.confirm_password.message}</span>}
                    </div>
                  </div>

                  {/* Role selected */}
                  <div className="p-4 bg-[#1f3246] rounded-2xl border border-white/5 space-y-3">
                    <label className="block text-xs font-semibold text-gray-400 uppercase">Your Role in the HOA *</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="radio"
                          value="Admin"
                          {...register('role_selected')}
                          className="accent-[#1D9E75]"
                        />
                        <div>
                          <span className="font-bold block">Admin (Property Manager)</span>
                          <span className="text-[10px] text-gray-400">Responsible for operations & vendor coordination</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="radio"
                          value="Board Member"
                          {...register('role_selected')}
                          className="accent-[#1D9E75]"
                        />
                        <div>
                          <span className="font-bold block">Board Member</span>
                          <span className="text-[10px] text-gray-400">Elected president, treasurer, or secretary governance representative</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: HOA COMMUNITY DETAILS */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">HOA Community details</h3>
                    <p className="text-xs text-gray-400">Define the community location and size parameters.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">HOA/Community Name *</label>
                    <input
                      type="text"
                      {...register('hoa_name', { 
                        required: 'Required',
                        validate: validateBusinessName
                      })}
                      placeholder="e.g. Whispering Pines HOA"
                      className="w-full bg-[#1e2f41] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75]"
                    />
                    {errors.hoa_name && <span className="text-xs text-red-400">{errors.hoa_name.message}</span>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Country *</label>
                      <select
                        {...register('hoa_country_id', { 
                          required: true,
                          onChange: handleCountryChange
                        })}
                        className={`w-full bg-[#1e2f41] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75] ${
                          addressSelected ? 'pointer-events-none opacity-60 bg-[#162535]' : ''
                        }`}
                      >
                        {countries.map((c) => (
                          <option key={c.country_id} value={c.country_id}>{c.country_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">State *</label>
                      <select
                        {...register('hoa_state_id', { 
                          required: true,
                          onChange: (e) => fetchCitiesForState(e.target.value)
                        })}
                        className={`w-full bg-[#1e2f41] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75] ${
                          addressSelected ? 'pointer-events-none opacity-60 bg-[#162535]' : ''
                        }`}
                      >
                        {states.map((s) => (
                          <option key={s.state_id} value={s.state_id}>{s.state_name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="relative">
                      <label className="block text-xs font-medium text-gray-400 mb-1">City/Town *</label>
                      
                      {addressSelected ? (
                        <input
                          type="text"
                          readOnly
                          {...register('hoa_city', { required: 'Required' })}
                          className="w-full bg-[#162535] border border-white/10 rounded-xl px-3 py-2 text-sm text-white opacity-65 cursor-not-allowed"
                        />
                      ) : loadingCities ? (
                        <div className="w-full bg-[#1e2f41] border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-400 flex items-center gap-2">
                          <RefreshCw size={14} className="animate-spin text-teal-400" />
                          <span>Loading districts/cities...</span>
                        </div>
                      ) : (
                        <>
                          <input
                            type="text"
                            list={stateCities.length > 0 ? "city-options" : undefined}
                            placeholder={stateCities.length > 0 ? "Select or Type City/Town" : "Type City/Town"}
                            {...register('hoa_city', { 
                              required: 'Required',
                              validate: (val) => /^[A-Za-z]+$/.test(val) || 'City should contain only letters (no spaces or numbers)',
                              onChange: (e) => {
                                handleCityInputChange(e.target.value);
                              }
                            })}
                            onKeyPress={(e) => {
                              if (!/[A-Za-z]/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            className="w-full bg-[#1e2f41] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75]"
                          />
                          {stateCities.length > 0 && (
                            <datalist id="city-options">
                              {stateCities.map((cityName) => (
                                <option key={cityName} value={cityName} />
                              ))}
                            </datalist>
                          )}
                        </>
                      )}

                      {!addressSelected && !loadingCities && stateCities.length === 0 && (
                        <>
                          {searchingCity && (
                            <div className="absolute z-50 w-full mt-1 bg-[#1e2f41] border border-white/10 rounded-xl p-3 text-xs text-gray-400 flex items-center gap-2">
                              <RefreshCw size={14} className="animate-spin text-teal-400" />
                              Searching city...
                            </div>
                          )}

                          {!searchingCity && citySuggestions.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-[#162535] border border-white/10 rounded-xl overflow-hidden shadow-2xl max-h-60 overflow-y-auto">
                              {citySuggestions.map((feature) => (
                                <button
                                  key={feature.id}
                                  type="button"
                                  onClick={() => handleSelectCitySuggestion(feature)}
                                  className="w-full text-left px-4 py-2.5 hover:bg-teal-500/10 hover:text-teal-400 text-xs text-gray-200 border-b border-white/5 last:border-0 transition-colors"
                                >
                                  {feature.place_name}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {errors.hoa_city && <span className="text-xs text-red-400 mt-1 block">{errors.hoa_city.message}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 relative">
                      <label className="block text-xs font-medium text-gray-400 mb-1">HOA Address (Street Name & No) *</label>
                      <input
                        type="text"
                        name={hoaAddressRegister.name}
                        ref={hoaAddressRegister.ref}
                        onBlur={hoaAddressRegister.onBlur}
                        onChange={(e) => {
                          hoaAddressRegister.onChange(e);
                          handleAddressInputChange(e.target.value);
                        }}
                        readOnly={addressSelected}
                        placeholder={mapboxToken ? "Start typing to search..." : "Street Name & No"}
                        className={`w-full bg-[#1e2f41] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75] ${
                          addressSelected ? 'opacity-65 bg-[#162535] cursor-not-allowed' : ''
                        }`}
                      />
                      {errors.hoa_address && <span className="text-xs text-red-400">{errors.hoa_address.message}</span>}

                      {/* Autocomplete suggestions dropdown */}
                      {searchingAddress && (
                        <div className="absolute z-50 w-full mt-1 bg-[#1e2f41] border border-white/10 rounded-xl p-3 text-xs text-gray-400 flex items-center gap-2">
                          <RefreshCw size={14} className="animate-spin text-teal-400" />
                          Searching address...
                        </div>
                      )}

                      {!searchingAddress && addressSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-[#162535] border border-white/10 rounded-xl overflow-hidden shadow-2xl max-h-60 overflow-y-auto">
                          {addressSuggestions.map((feature) => (
                            <button
                              key={feature.id}
                              type="button"
                              onClick={() => handleSelectSuggestion(feature)}
                              className="w-full text-left px-4 py-2.5 hover:bg-teal-500/10 hover:text-teal-400 text-xs text-gray-200 border-b border-white/5 last:border-0 transition-colors"
                            >
                              {feature.place_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Zip Code *</label>
                      <input
                        type="text"
                        {...register('hoa_zip_code', { 
                          required: 'Required',
                          validate: (val) => {
                            if (!val) return 'Required';
                            if (!/^\d+$/.test(val)) return 'Zip code must contain only numbers';
                            if (val.length < 5 || val.length > 10) return 'Zip code must be between 5 and 10 digits';
                            return true;
                          },
                          onChange: (e) => {
                            handleZipChange(e.target.value);
                          }
                        })}
                        onBlur={(e) => {
                          const formOnBlur = register('hoa_zip_code').onBlur;
                          if (formOnBlur) formOnBlur(e);
                          verifyZipForCity(e.target.value);
                        }}
                        onKeyPress={(e) => {
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        readOnly={addressSelected}
                        className={`w-full bg-[#1e2f41] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75] ${
                          addressSelected ? 'opacity-65 bg-[#162535] cursor-not-allowed' : ''
                        }`}
                      />
                      {errors.hoa_zip_code && <span className="text-xs text-red-400 mt-1 block">{errors.hoa_zip_code.message}</span>}
                      {zipError && <span className="text-xs text-red-400 mt-1 block font-medium">{zipError}</span>}
                    </div>
                  </div>

                  {addressSelected && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center justify-between text-xs text-[#25C490]">
                      <div className="flex items-center gap-1.5 font-medium">
                        <CheckCircle size={14} />
                        <span>Address auto-filled & verified via Mapbox.</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetAddress}
                        className="underline text-teal-400 hover:text-teal-300 font-semibold cursor-pointer"
                      >
                        Reset / Edit Address
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">HOA Contact Phone</label>
                    <div className="flex gap-2">
                      <select
                        {...register('hoa_contact_country_code')}
                        className="px-3 py-2 bg-[#1e2f41] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#1D9E75] cursor-pointer"
                      >
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+971">🇦🇪 +971</option>
                        <option value="+966">🇸🇦 +966</option>
                        <option value="+61">🇦🇺 +61</option>
                      </select>
                      <input
                        type="text"
                        maxLength={contactPhoneRule.max}
                        {...register('hoa_contact_number_only', {
                          validate: (val) => {
                            if (!val) return true; // Optional field
                            if (val.length < contactPhoneRule.min || val.length > contactPhoneRule.max) {
                              return `Phone must be exactly ${contactPhoneRule.label} for ${hoaContactCountryCode}`;
                            }
                            return true;
                          }
                        })}
                        onKeyPress={(e) => {
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        placeholder={`${contactPhoneRule.max}-digit number`}
                        className="flex-1 bg-[#1e2f41] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75]"
                      />
                    </div>
                    {errors.hoa_contact_number_only && <span className="text-xs text-red-400">{errors.hoa_contact_number_only.message}</span>}
                  </div>
                </div>
              )}

              {/* STEP 4: BILLING & CAPTCHA */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Billing Account & Security Captcha</h3>
                    <p className="text-xs text-gray-400">Input simulated payment details matching contract terms and pass the math check.</p>
                  </div>

                  {/* Payment selection */}
                  <div className="bg-[#1f3246] p-4 rounded-2xl border border-white/5 space-y-4">
                    <label className="block text-xs font-semibold text-gray-400 uppercase">Payment Method</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                        <input
                          type="radio"
                          value="bank_account"
                          {...register('payment_method')}
                          className="accent-[#1D9E75]"
                        />
                        <span className="flex items-center gap-1.5"><Landmark size={14} /> Bank Account (ACH)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                        <input
                          type="radio"
                          value="credit_card"
                          {...register('payment_method')}
                          className="accent-[#1D9E75]"
                        />
                        <span className="flex items-center gap-1.5"><CreditCard size={14} /> Credit/Debit Card</span>
                      </label>
                    </div>

                    {/* Conditional Payment fields */}
                    {paymentMethod === 'bank_account' ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Bank Name *</label>
                          <input
                            type="text"
                            {...register('bank_name', { 
                              required: paymentMethod === 'bank_account' ? 'Bank Name is required' : false,
                              validate: (val) => {
                                if (paymentMethod !== 'bank_account') return true;
                                if (!val || !val.trim()) return 'Bank Name is required';
                                if (!/^[A-Za-z\s\-\.]+$/.test(val)) return 'Bank Name should only contain letters, spaces, hyphens, or dots';
                                return true;
                              }
                            })}
                            onKeyPress={(e) => {
                              if (!/[A-Za-z\s\-\.]/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            className="w-full bg-[#162535] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1D9E75]"
                          />
                          {errors.bank_name && <span className="text-xs text-red-400 mt-1 block">{errors.bank_name.message}</span>}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Routing Number *</label>
                          <input
                            type="text"
                            maxLength={9}
                            {...register('routing_number', { 
                              required: paymentMethod === 'bank_account' ? 'Routing Number is required' : false,
                              validate: (val) => {
                                if (paymentMethod !== 'bank_account') return true;
                                if (!val) return 'Routing Number is required';
                                if (!/^\d{9}$/.test(val)) return 'Routing Number must be exactly 9 digits';
                                return true;
                              }
                            })}
                            onKeyPress={(e) => {
                              if (!/[0-9]/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            className="w-full bg-[#162535] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1D9E75] font-mono"
                          />
                          {errors.routing_number && <span className="text-xs text-red-400 mt-1 block">{errors.routing_number.message}</span>}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Account Number *</label>
                          <div className="relative">
                            <input
                              type={showAccountNumber ? 'text' : 'password'}
                              maxLength={17}
                              {...register('account_number', { 
                                required: paymentMethod === 'bank_account' ? 'Account Number is required' : false,
                                validate: (val) => {
                                  if (paymentMethod !== 'bank_account') return true;
                                  if (!val) return 'Account Number is required';
                                  if (!/^\d{8,17}$/.test(val)) return 'Account Number must be between 8 and 17 digits';
                                  return true;
                                }
                              })}
                              onKeyPress={(e) => {
                                if (!/[0-9]/.test(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              className="w-full bg-[#162535] border border-white/10 rounded-xl pl-3 pr-10 py-1.5 text-xs text-white focus:outline-none focus:border-[#1D9E75] font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setShowAccountNumber(!showAccountNumber)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                            >
                              {showAccountNumber ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                          {errors.account_number && <span className="text-xs text-red-400 mt-1 block">{errors.account_number.message}</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-400 mb-1">Cardholder Name *</label>
                          <input
                            type="text"
                            {...register('cardholder_name', { 
                              required: paymentMethod === 'credit_card' ? 'Cardholder Name is required' : false,
                              validate: (val) => {
                                if (paymentMethod !== 'credit_card') return true;
                                if (!val || !val.trim()) return 'Cardholder Name is required';
                                if (!/^[A-Za-z\s'\-]+$/.test(val)) return 'Cardholder Name should contain only letters, spaces, hyphens, or apostrophes';
                                return true;
                              }
                            })}
                            onKeyPress={(e) => {
                              if (!/[A-Za-z\s'\-]/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            className="w-full bg-[#162535] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1D9E75]"
                          />
                          {errors.cardholder_name && <span className="text-xs text-red-400 mt-1 block">{errors.cardholder_name.message}</span>}
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-400 mb-1">Card Number *</label>
                          <input
                            type="text"
                            maxLength={19}
                            {...register('card_number', { 
                              required: paymentMethod === 'credit_card' ? 'Card Number is required' : false,
                              validate: (val) => {
                                if (paymentMethod !== 'credit_card') return true;
                                if (!val) return 'Card Number is required';
                                const digitsOnly = val.replace(/\s/g, '');
                                if (!/^\d{13,19}$/.test(digitsOnly)) return 'Card Number must be between 13 and 19 digits';
                                return true;
                              }
                            })}
                            onKeyPress={(e) => {
                              if (!/[0-9]/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            className="w-full bg-[#162535] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1D9E75] font-mono"
                          />
                          {errors.card_number && <span className="text-xs text-red-400 mt-1 block">{errors.card_number.message}</span>}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Expiry Date *</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            maxLength={5}
                            {...register('card_expiry', { 
                              required: paymentMethod === 'credit_card' ? 'Expiry Date is required' : false,
                              validate: (val) => {
                                if (paymentMethod !== 'credit_card') return true;
                                if (!val) return 'Expiry Date is required';
                                if (!/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(val)) return 'Expiry Date must be in MM/YY format (e.g. 12/28)';
                                return true;
                              }
                            })}
                            onKeyPress={(e) => {
                              if (!/[0-9/]/.test(e.key)) {
                                  e.preventDefault();
                              }
                            }}
                            className="w-full bg-[#162535] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1D9E75] font-mono"
                          />
                          {errors.card_expiry && <span className="text-xs text-red-400 mt-1 block">{errors.card_expiry.message}</span>}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">CVV *</label>
                          <div className="relative">
                            <input
                              type={showCardCvv ? 'text' : 'password'}
                              maxLength={4}
                              {...register('card_cvv', { 
                                required: paymentMethod === 'credit_card' ? 'CVV is required' : false,
                                validate: (val) => {
                                  if (paymentMethod !== 'credit_card') return true;
                                  if (!val) return 'CVV is required';
                                  if (!/^\d{3,4}$/.test(val)) return 'CVV must be 3 or 4 digits';
                                  return true;
                                }
                              })}
                              onKeyPress={(e) => {
                                if (!/[0-9]/.test(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              className="w-full bg-[#162535] border border-white/10 rounded-xl pl-3 pr-10 py-1.5 text-xs text-white focus:outline-none focus:border-[#1D9E75] font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCardCvv(!showCardCvv)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                            >
                              {showCardCvv ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                          {errors.card_cvv && <span className="text-xs text-red-400 mt-1 block">{errors.card_cvv.message}</span>}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Captcha Section */}
                  <div className="p-4 bg-[#1f3246] rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Math Captcha Verification *</label>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold bg-[#162535] border border-white/10 px-4 py-2 rounded-xl text-yellow-400 font-mono tracking-widest">
                          {loadingCaptcha ? '...' : captcha.question}
                        </span>
                        <button
                          type="button"
                          onClick={fetchCaptcha}
                          disabled={refreshing}
                          className="p-2 hover:bg-white/10 active:scale-95 bg-white/5 rounded-xl transition-all duration-150 text-gray-400 hover:text-teal-400 border border-transparent hover:border-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Refresh Captcha"
                        >
                          <RefreshCw
                            size={16}
                            className={`transition-transform duration-500 ${refreshing ? 'animate-spin text-teal-400' : 'hover:rotate-180'}`}
                          />
                        </button>
                      </div>
                    </div>
                    <div className="w-full md:w-44">
                      <label className="block text-xs font-medium text-gray-400 mb-1">Your Answer *</label>
                      <input
                        type="text"
                        {...register('captcha_answer', { 
                          required: 'Captcha is required',
                          pattern: {
                            value: /^[0-9]+$/,
                            message: 'Numbers only'
                          }
                        })}
                        onKeyPress={(e) => {
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        placeholder="Result"
                        className="w-full bg-[#162535] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1D9E75] font-mono text-center font-bold text-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* NAVIGATION BUTTONS */}
              <div className="flex justify-between items-center border-t border-white/10 pt-6 mt-8">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition text-xs flex items-center gap-2"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                ) : (
                  <div></div>
                )}

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={step === 1 && !verifiedContract}
                    className="px-6 py-2.5 bg-[#1D9E75] hover:bg-[#15805d] disabled:bg-teal-800 disabled:opacity-50 text-white font-medium rounded-xl transition text-xs flex items-center gap-2"
                  >
                    Continue <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3 bg-[#1D9E75] hover:bg-[#15805d] disabled:bg-teal-800 text-white font-semibold rounded-xl transition text-sm flex items-center gap-2 shadow-lg shadow-teal-500/25"
                  >
                    {submitting ? <RefreshCw size={16} className="animate-spin" /> : 'Complete Registration'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
