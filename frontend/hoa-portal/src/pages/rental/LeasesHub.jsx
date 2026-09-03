import React, { useState, useEffect, useRef } from 'react';
import { FileText, Plus, CheckCircle, Clock, Send, Lock, PenTool, Sparkles, Trash2, ShieldAlert, Search, X, Eye, Calendar, DollarSign, Settings, Paperclip, User, CheckSquare, ArrowLeft, ArrowRight, AlertCircle, Info, Home, Mail, Phone, Edit3, ArrowUp, ArrowDown, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import API from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import { formatPhoneAsYouType, formatUsPhone } from '../../utils/phoneFormatter';

const LEASE_TEMPLATES = {
  standard: `STANDARD RESIDENTIAL LEASE AGREEMENT

This lease agreement is made and entered on {{START_DATE}} by and between the Landlord and Tenant:
1. PROPERTY: Landlord rents to Tenant the property located at Unit {{UNIT_NUMBER}}.
2. TERM: The term of this lease shall begin on {{START_DATE}} and terminate on {{END_DATE}}.
3. RENT: Tenant agrees to pay a monthly rent of \${{RENT_AMOUNT}} due on the 1st of each month. A grace period of {{GRACE_PERIOD}} days is allowed, after which a late fee of \${{LATE_FEE}} will be applied.
4. SECURITY DEPOSIT: Tenant shall deposit \${{DEPOSIT_AMOUNT}} as security for any damage caused to the premises.`,

  condo: `CONDOMINIUM LEASE AGREEMENT

This condo rental agreement is drafted on {{START_DATE}} for:
Unit {{UNIT_NUMBER}} subject to the rules and regulations of the Condominium Association.
- Monthly Rent: \${{RENT_AMOUNT}}
- Security Deposit: \${{DEPOSIT_AMOUNT}}
- Lease Term: {{START_DATE}} to {{END_DATE}}
- Association Dues: Paid by Landlord. Tenant agrees to comply with all HOA Bylaws, community declarations, and trash schedules. Late payment past {{GRACE_PERIOD}} days will incur late fee charges of \${{LATE_FEE}}.`,

  guaranty: `CO-SIGNER GUARANTY ANNEX

This document serves as an addendum to the lease for Unit {{UNIT_NUMBER}} starting on {{START_DATE}}.
The Co-Signer guarantees the payment of monthly rent of \${{RENT_AMOUNT}} and any late penalties of \${{LATE_FEE}} if the primary Tenant defaults on their obligation.
- Co-Signer Email: {{TENANT_EMAIL}}`
};

const INITIAL_RULES = [
  "No additional locks or other similar devices shall be attached to any door without Landlord's written consent.",
  "Hallways, stairways and elevators shall not be obstructed or used for any purpose other than ingress and egress from the building. Children are not permitted to play in the common areas. Tenant may not store any items in the hallways or common areas of the building.",
  "Operation of electrical appliances or other devices which interfere with radio or television reception is not permitted.",
  "Deliveries and moving of furniture must be conducted at times permitted by Landlord.",
  "$50 per key will be charged to provide additional or replacement keys to the property.",
  "The dwelling to be occupied by Tenant and members of Tenant's household is a smoke-free living environment. Tenant and members of Tenant's household shall not smoke, tobacco or marijuana, anywhere in the dwelling, or in the building in which the dwelling is a part, or in any of the common areas or adjoining grounds of such building. Further, Tenant shall not permit any guests or visitors under the control of Tenant to do so."
];

const INITIAL_ATTACHMENTS = [];

export default function LeasesHub({ user, selectedPropertyFilterId = 'all', initialShowCreate = false, onLeaseCreated }) {
  const isLandlord = user?.role === 'landlord' || user?.role_name === 'landlord' || user?.role_id === 1;

  const [leases, setLeases] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLease, setSelectedLease] = useState(null);
  const [applications, setApplications] = useState([]);

  // Tenant Form States for Lease Onboarding
  const [tenantDob, setTenantDob] = useState('');
  const [tenantCurrentAddress, setTenantCurrentAddress] = useState('');
  const [tenantAddressSuggestions, setTenantAddressSuggestions] = useState([]);
  const [isTenantAddressSelected, setIsTenantAddressSelected] = useState(false);
  const [tenantEmergencyContact, setTenantEmergencyContact] = useState('');
  const [tenantEmergencyPhone, setTenantEmergencyPhone] = useState('');
  const [tenantSignatureText, setTenantSignatureText] = useState('');
  const [tenantAgreeTerms, setTenantAgreeTerms] = useState(false);
  const [tenantOnboardingStep, setTenantOnboardingStep] = useState(1);
  const [uploadedDocs, setUploadedDocs] = useState([]); // Array of { document_id, doc_type, original_name }
  const [uploadingDoc, setUploadingDoc] = useState(null); // 'PAY_SLIP' | 'DRIVING_LICENSE' etc.
  const [docUploadError, setDocUploadError] = useState(''); // Inline upload error (non-blocking)
  const [formError, setFormError] = useState(''); // Inline submit validation error (non-blocking)
  const [tenantHasParking, setTenantHasParking] = useState(false);
  const [tenantParkingCarsCount, setTenantParkingCarsCount] = useState(1);
  const [tenantVehicles, setTenantVehicles] = useState([{ plate: '', state: 'AL' }]);
  const [tenantHasPets, setTenantHasPets] = useState(false);
  const [tenantPetsCount, setTenantPetsCount] = useState(1);
  const [tenantPetDetails, setTenantPetDetails] = useState('Dog');
  const [tenantPets, setTenantPets] = useState([{ type: 'Dog' }]);
  const [numOccupants, setNumOccupants] = useState(1);
  const [numMinors, setNumMinors] = useState(0);


  const getLeaseSeqNum = (lease) => {
    if (!lease) return '';
    const sorted = [...leases].sort((a, b) => a.lease_id - b.lease_id);
    const idx = sorted.findIndex(item => item.lease_id === lease.lease_id);
    return idx !== -1 ? idx + 1 : lease.lease_id;
  };
  const [prefilledFromApp, setPrefilledFromApp] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // Create Lease Form States & Wizard Refactoring
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState('standard');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [customUnitNo, setCustomUnitNo] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [deposit, setDeposit] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState('12');
  const [customDuration, setCustomDuration] = useState('');
  const [rentDueDate, setRentDueDate] = useState('1');
  const [moveInFee, setMoveInFee] = useState('0');
  const [moveOutFee, setMoveOutFee] = useState('0');
  const [gracePeriod, setGracePeriod] = useState('5');
  const [feeType, setFeeType] = useState('FLAT');
  const [feeAmount, setFeeAmount] = useState('50');
  const [leaseText, setLeaseText] = useState('');
  const [utilFee, setUtilFee] = useState('0');
  const [parkingFee, setParkingFee] = useState('0');
  const [petFee, setPetFee] = useState('0');
  const [editingLeaseId, setEditingLeaseId] = useState(null);

  
  // Custom Fee options
  const [electricityPayee, setElectricityPayee] = useState('tenant');
  const [waterPayee, setWaterPayee] = useState('tenant');
  const [gasPayee, setGasPayee] = useState('tenant');
  const [internetPayee, setInternetPayee] = useState('tenant');
  const [trashPayee, setTrashPayee] = useState('tenant');
  const [hasUtilFee, setHasUtilFee] = useState(false);
  const [hasParkingFee, setHasParkingFee] = useState(false);
  const [parkingFeePerCar, setParkingFeePerCar] = useState('0');
  const [parkingCarsCount, setParkingCarsCount] = useState('1');
  const [hasPetFee, setHasPetFee] = useState(false);
  const [petFeePerPet, setPetFeePerPet] = useState('0');
  const [petsCount, setPetsCount] = useState('1');
  const [keyExchangeNotes, setKeyExchangeNotes] = useState('');

  // Clauses
  const [clauseOnlineRent, setClauseOnlineRent] = useState(true);
  const [clauseQuietHours, setClauseQuietHours] = useState(true);
  const [clauseMaintenance, setClauseMaintenance] = useState(true);
  const [clauseCustomText, setClauseCustomText] = useState('');

  // Rules Refactoring
  const [rules, setRules] = useState(INITIAL_RULES);
  const [editingRuleIndex, setEditingRuleIndex] = useState(null);
  const [editingRuleText, setEditingRuleText] = useState('');
  
  // Attachments Refactoring
  const [attachments, setAttachments] = useState(INITIAL_ATTACHMENTS);
  const [editingAttachmentId, setEditingAttachmentId] = useState(null);
  const [editingAttachmentName, setEditingAttachmentName] = useState('');
  const fileInputRef = useRef(null);
  const addressTimeoutRef = useRef(null);

  // Disclosures
  const [disclosureLeadPaint, setDisclosureLeadPaint] = useState(false);
  const [disclosureMold, setDisclosureMold] = useState(false);
  const [disclosureBedBugs, setDisclosureBedBugs] = useState(false);

  // Reject / Cancel Lease Reason State
  const [showCancelReasonModal, setShowCancelReasonModal] = useState(false);
  const [cancelReasonText, setCancelReasonText] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newAttachments = files.map((file, idx) => ({
        id: Date.now() + idx,
        name: file.name,
        source: 'Uploaded by User',
        file: file
      }));
      setAttachments([...attachments, ...newAttachments]);
      toast.success(`Successfully attached ${files.length} document(s)`);
    }
  };

  const handleDownloadAttachment = (att) => {
    if (att.file) {
      const url = URL.createObjectURL(att.file);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', att.name);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Downloading ${att.name}`);
    } else {
      toast.success(`Downloading ${att.name}...`);
    }
  };

  // Lessor Info
  const [lessorFullName, setLessorFullName] = useState('');
  const [lessorAddress, setLessorAddress] = useState('');
  const [lessorAddressSuggestions, setLessorAddressSuggestions] = useState([]);
  const [isLessorAddressSelected, setIsLessorAddressSelected] = useState(false);

  const STATE_NAME_TO_ABBR = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR", "california": "CA", "colorado": "CO", "connecticut": "CT", "delaware": "DE", "florida": "FL", "georgia": "GA", "hawaii": "HI", "idaho": "ID", "illinois": "IL", "indiana": "IN", "iowa": "IA", "kansas": "KS", "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD", "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS", "missouri": "MO", "montana": "MT", "nebraska": "NE", "nevada": "NV", "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND", "ohio": "OH", "oklahoma": "OK", "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC", "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT", "vermont": "VT", "virginia": "VA", "washington": "WA", "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY"
  };

  const getAbbr = (stateStr) => {
    if (!stateStr) return '';
    const clean = stateStr.trim().toLowerCase();
    if (clean.length === 2) return clean.toUpperCase();
    return STATE_NAME_TO_ABBR[clean] || stateStr;
  };

  const handleLessorAddressChange = (value) => {
    setLessorAddress(value);
    setIsLessorAddressSelected(false);
    
    if (!value.trim()) {
      setLessorAddressSuggestions([]);
      return;
    }

    if (addressTimeoutRef.current) {
      clearTimeout(addressTimeoutRef.current);
    }

    addressTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&addressdetails=1&countrycodes=us&limit=5&email=contact@nestbloq.com`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'NestBloq-RentalPortal/1.0'
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
            
            const parts = [];
            if (street) parts.push(street);
            else parts.push(item.display_name.split(',')[0]);
            
            if (city) parts.push(city);
            
            const stateAbbr = getAbbr(state);
            if (stateAbbr) parts.push(stateAbbr);
            
            if (zip) parts.push(zip);

            return {
              display: item.display_name,
              formatted: parts.join(', ')
            };
          });
          setLessorAddressSuggestions(mapped);
        }
      } catch (err) {
        console.warn("Geocoding failed:", err);
      }
    }, 400);
  };

  const handleSelectLessorSuggestion = (suggestion) => {
    setLessorAddress(suggestion.formatted);
    setLessorAddressSuggestions([]);
    setIsLessorAddressSelected(true);
  };

  const handleTenantAddressChange = (value) => {
    setTenantCurrentAddress(value);
    setIsTenantAddressSelected(false);
    
    if (!value.trim()) {
      setTenantAddressSuggestions([]);
      return;
    }

    if (addressTimeoutRef.current) {
      clearTimeout(addressTimeoutRef.current);
    }

    addressTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&addressdetails=1&countrycodes=us&limit=5&email=contact@nestbloq.com`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'NestBloq-RentalPortal/1.0'
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
            
            const parts = [];
            if (street) parts.push(street);
            else parts.push(item.display_name.split(',')[0]);
            
            if (city) parts.push(city);
            
            const stateAbbr = getAbbr(state);
            if (stateAbbr) parts.push(stateAbbr);
            
            if (zip) parts.push(zip);

            return {
              display: item.display_name,
              formatted: parts.join(', ')
            };
          });
          setTenantAddressSuggestions(mapped);
        }
      } catch (err) {
        console.warn("Geocoding failed:", err);
      }
    }, 400);
  };

  const handleSelectTenantSuggestion = (suggestion) => {
    setTenantCurrentAddress(suggestion.formatted);
    setTenantAddressSuggestions([]);
    setIsTenantAddressSelected(true);
  };

  const [lessorPhone, setLessorPhone] = useState('');
  const [lessorEmail, setLessorEmail] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);

  // Co-Landlord states
  const [coLandlordName, setCoLandlordName] = useState('');
  const [signingAsRole, setSigningAsRole] = useState('landlord');

  // Signature state
  const [signature, setSignature] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(initialShowCreate);
  const [showTenantChangeUnitModal, setShowTenantChangeUnitModal] = useState(false);
  const [tenantChangeUnitNotes, setTenantChangeUnitNotes] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUnits = units.filter(u => {
    const isThisProperty = selectedPropertyFilterId === 'all' || String(u.property_id) === String(selectedPropertyFilterId);
    if (!isThisProperty) return false;
    
    const isVacant = u.status === 'VACANT';
    const isSelected = String(u.unit_id) === String(selectedUnitId);
    return isVacant || isSelected;
  });

  const getUnitDisplayLabel = (u) => {
    if (u.unit_number === 'Single Family') {
      return `${u.property_name} (Single Family)`;
    }
    if (u.unit_number === 'Condo Unit') {
      return `${u.property_name} (Condo)`;
    }
    const isEntireProperty = u.unit_number === 'Entire Property' || !/\d/.test(u.unit_number);
    if (isEntireProperty) {
      return `${u.property_name}`;
    }
    const cleanNum = u.unit_number.trim();
    if (cleanNum.toLowerCase().startsWith('apt') || cleanNum.toLowerCase().startsWith('unit')) {
      return `${cleanNum} (${u.property_name})`;
    }
    return `Apt ${cleanNum} (${u.property_name})`;
  };


  const getCleanUnitNumber = (unitNum) => {
    if (!unitNum) return 'N/A';
    let clean = unitNum.replace(/^(apt|apartment|unit|room|suite)\.?\s*/i, '').trim();
    const isEntireProperty = unitNum === 'Single Family' || unitNum === 'Entire Property' || unitNum === 'Condo Unit' || !/\d/.test(clean);
    return isEntireProperty ? '1' : clean;
  };

  const hasVacantUnits = filteredUnits.length === 0 || filteredUnits.some(u => u.status === 'VACANT');
  const canSignAsPrimary = selectedLease && isLandlord && !selectedLease.landlord_signature && selectedLease.status === 'PENDING_LANDLORD_APPROVAL';
  const isUserPrimaryLandlord = selectedLease && selectedLease.landlord_signature && 
    (user?.name && (
      selectedLease.landlord_signature.toLowerCase().trim().includes(user.name.toLowerCase().trim()) ||
      user.name.toLowerCase().trim().includes(selectedLease.landlord_signature.toLowerCase().trim())
    ));
  const canSignAsCo = selectedLease && isLandlord && selectedLease.co_landlord_name && !selectedLease.co_landlord_signature && !isUserPrimaryLandlord && selectedLease.status === 'PENDING_LANDLORD_APPROVAL';
  const canSignAsTenant = selectedLease && !isLandlord && !selectedLease.tenant_signature && selectedLease.tenant_id === user?.user_id;

  const showSignPad = selectedLease && (canSignAsPrimary || canSignAsCo || canSignAsTenant);

  const resetWizardForm = () => {
    setCurrentStep(1);
    setSelectedTemplate('standard');
    setSelectedUnitId('');
    setTenantEmail('');
    setTenantName('');
    setTenantPhone('');
    setRentAmount('');
    setDeposit('');
    setStartDate('');
    setEndDate('');
    setDuration('12');
    setCustomDuration('');
    setRentDueDate('1');
    setMoveInFee('0');
    setMoveOutFee('0');
    setGracePeriod('5');
    setFeeType('FLAT');
    setFeeAmount('50');
    setLeaseText('');
    setUtilFee('0');
    setParkingFee('0');
    setPetFee('0');
    setElectricityPayee('tenant');
    setWaterPayee('tenant');
    setGasPayee('tenant');
    setInternetPayee('tenant');
    setTrashPayee('tenant');
    setHasUtilFee(false);
    setHasParkingFee(false);
    setParkingFeePerCar('0');
    setParkingCarsCount('1');
    setHasPetFee(false);
    setPetFeePerPet('0');
    setPetsCount('1');
    setKeyExchangeNotes('');
    setClauseOnlineRent(true);
    setClauseQuietHours(true);
    setClauseMaintenance(true);
    setClauseCustomText('');
    setRules(INITIAL_RULES);
    setEditingRuleIndex(null);
    setAttachments(INITIAL_ATTACHMENTS);
    setEditingAttachmentId(null);
    setDisclosureLeadPaint(false);
    setDisclosureMold(false);
    setDisclosureBedBugs(false);
    setLessorFullName(user?.name || user?.full_name || '');
    setLessorAddress('');
    setLessorAddressSuggestions([]);
    setIsLessorAddressSelected(false);
    setLessorPhone(user?.mobile_number || '');
    setLessorEmail(user?.email || '');
    setCoLandlordName('');
    setTermsAgreed(false);
    setFormErrors({});
    setErrorMsg('');
    setEditingLeaseId(null);
  };

  const handleEditLeaseClick = (lease, e) => {
    if (e) e.stopPropagation();
    
    if (lease.unit) {
      const unitExists = units.some(u => String(u.unit_id) === String(lease.unit_id));
      if (!unitExists) {
        const mappedUnit = {
          ...lease.unit,
          property_name: lease.unit.property_name || 'Assigned Property',
          property_address: lease.unit.property_address || '',
          property_city: lease.unit.property_city || '',
          property_state: lease.unit.property_state || '',
          property_zip: lease.unit.property_zip || ''
        };
        setUnits(prev => [...prev, mappedUnit]);
      }
    }

    setEditingLeaseId(lease.lease_id);
    setSelectedUnitId(lease.unit_id.toString());

    setTenantEmail(lease.tenant_email || '');
    setTenantName(lease.tenant_name || '');
    setTenantPhone(formatPhoneAsYouType(lease.tenant_phone || ''));
    setStartDate(lease.start_date || '');

    setEndDate(lease.end_date || '');
    
    if (lease.start_date && lease.end_date) {
      const start = new Date(lease.start_date);
      const end = new Date(lease.end_date);
      const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      if (diffMonths === 12 || diffMonths === 6 || diffMonths === 1 || diffMonths === 24) {
        setDuration(diffMonths.toString());
        setCustomDuration('');
      } else {
        setDuration('custom');
        setCustomDuration(diffMonths.toString());
      }
    } else {
      setDuration('12');
      setCustomDuration('');
    }

    setRentAmount(lease.rent_amount?.toString() || '');
    setDeposit(lease.security_deposit?.toString() || '0');
    setGracePeriod(lease.grace_period_days?.toString() || '5');
    setFeeType(lease.late_fee_type || 'FLAT');
    setFeeAmount(lease.late_fee_amount?.toString() || '50');
    setLeaseText(lease.lease_agreement_text || '');
    
    const utilVal = parseFloat(lease.utilities_fee || 0);
    setHasUtilFee(utilVal > 0);
    setUtilFee(utilVal.toString());

    const parkVal = parseFloat(lease.parking_fee || 0);
    setHasParkingFee(parkVal > 0);
    setParkingFeePerCar(parkVal.toString());
    setParkingCarsCount('1');

    const petVal = parseFloat(lease.pet_fee || 0);
    setHasPetFee(petVal > 0);
    setPetFeePerPet(petVal.toString());
    setPetsCount('1');

    setCoLandlordName(lease.co_landlord_name || '');
    
    setShowCreateModal(true);
    setCurrentStep(1);
  };


  const validateStep = (step) => {
    const errors = {};
    if (step === 1) {
      if (!selectedUnitId) {
        errors.selectedUnitId = 'Please select a unit.';
      } else {
        const selectedUnitObj = units.find(u => u.unit_id === parseInt(selectedUnitId));
        if (selectedUnitObj && selectedUnitObj.status === 'OCCUPIED' && !prefilledFromApp) {
          const editingLease = leases.find(l => l.lease_id === editingLeaseId);
          if (!editingLease || editingLease.unit_id !== selectedUnitObj.unit_id) {
            errors.selectedUnitId = 'This unit is currently occupied.';
          }
        }

      }
      if (!tenantEmail) {
        errors.tenantEmail = 'Tenant email is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tenantEmail.trim())) {
        errors.tenantEmail = 'Please enter a valid email address.';
      }
      if (!tenantName.trim()) {
        errors.tenantName = 'Tenant name is required.';
      } else if (!/^[a-zA-Z\s.-]{2,50}$/.test(tenantName.trim())) {
        errors.tenantName = 'Name must only contain letters, spaces, dots, and hyphens (2-50 chars).';
      }
      if (!tenantPhone.trim()) {
        errors.tenantPhone = 'Phone number is required.';
      } else if (!/^\+?[0-9\s\-()]{7,15}$/.test(tenantPhone.trim())) {
        errors.tenantPhone = 'Please enter a valid phone number (7-15 digits).';
      }
    }
    
    if (step === 2) {
      if (!startDate) {
        errors.startDate = 'Start date is required.';
      }
      const todayStr = new Date().toISOString().split('T')[0];
      if (startDate && startDate < todayStr && !editingLeaseId) {
        errors.startDate = 'Start date cannot be in the past.';
      }

      const numMonths = duration === 'custom' ? parseInt(customDuration) : parseInt(duration);
      if (isNaN(numMonths) || numMonths < 1) {
        errors.duration = 'Please provide a valid duration of at least 1 month.';
      }
      const rent = parseFloat(rentAmount);
      if (!rentAmount || isNaN(rent) || rent <= 0) {
        errors.rentAmount = 'Monthly rent must be a positive number greater than 0.';
      }
      const dep = parseFloat(deposit);
      if (!deposit || isNaN(dep) || dep < 0) {
        errors.deposit = 'Security deposit must be 0 or positive.';
      }
      const gp = parseInt(gracePeriod);
      if (!gracePeriod || isNaN(gp) || gp < 0) {
        errors.gracePeriod = 'Grace days must be a positive number (min 0).';
      }
      const fee = parseFloat(feeAmount);
      if (!feeAmount || isNaN(fee) || fee < 0) {
        errors.feeAmount = 'Fee amount must be 0 or positive.';
      }
      const mIn = parseFloat(moveInFee);
      if (moveInFee && (isNaN(mIn) || mIn < 0)) {
        errors.moveInFee = 'Move-in fee must be 0 or positive.';
      }
      const mOut = parseFloat(moveOutFee);
      if (moveOutFee && (isNaN(mOut) || mOut < 0)) {
        errors.moveOutFee = 'Move-out fee must be 0 or positive.';
      }
    }
    
    if (step === 3) {
      if (hasUtilFee) {
        const util = parseFloat(utilFee);
        if (!utilFee || isNaN(util) || util < 0) {
          errors.utilFee = 'Utility fee must be 0 or positive.';
        }
      }
    }
    
    if (step === 4) {
      if (!lessorFullName.trim()) {
        errors.lessorFullName = 'Primary Landlord name is required.';
      } else if (!/^[a-zA-Z\s.-]{2,50}$/.test(lessorFullName.trim())) {
        errors.lessorFullName = 'Name must only contain letters, spaces, dots, and hyphens (2-50 chars).';
      }
      if (coLandlordName.trim() && !/^[a-zA-Z\s.-]{2,50}$/.test(coLandlordName.trim())) {
        errors.coLandlordName = 'Co-Landlord name must only contain letters, spaces, dots, and hyphens (2-50 chars).';
      }
      if (lessorAddress.trim() && !isLessorAddressSelected) {
        errors.lessorAddress = 'Please select a valid address from the suggestions dropdown.';
      }
      if (!lessorPhone.trim()) {
        errors.lessorPhone = 'Phone number is required.';
      } else if (!/^\+?[0-9\s\-()]{7,15}$/.test(lessorPhone.trim())) {
        errors.lessorPhone = 'Please enter a valid phone number.';
      }
      if (!lessorEmail.trim()) {
        errors.lessorEmail = 'Email is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lessorEmail.trim())) {
        errors.lessorEmail = 'Please enter a valid email address.';
      }
    }
    
    if (step === 5) {
      if (!termsAgreed) {
        errors.termsAgreed = 'You must agree to the terms before submitting.';
      }
      if (!leaseText.trim()) {
        errors.leaseText = 'Lease agreement text draft cannot be empty.';
      }
    }
    
    return errors;
  };

  const handleNext = async () => {
    const errors = validateStep(currentStep);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      if (errors.tenantEmail && errors.tenantEmail.includes("APPROVED")) {
        toast.error(errors.tenantEmail);
      } else {
        toast.error('Please complete all required fields on this page first.');
      }
      return;
    }

    if (currentStep === 1) {
      try {
        const res = await API.get(`/rental/leases/check-active?email=${encodeURIComponent(tenantEmail)}` + (editingLeaseId ? `&exclude_lease_id=${editingLeaseId}` : ''));
        if (res.data.has_active_lease) {
          const detailMsg = res.data.detail || "This tenant email is already registered/invited to an active or pending lease.";
          setFormErrors({ tenantEmail: detailMsg });
          toast.error(detailMsg);
          return;
        }
      } catch (err) {
        console.error("Failed to check active lease:", err);
      }
    }

    setFormErrors({});
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setFormErrors({});
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleStepClick = async (targetStep) => {
    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
      setFormErrors({});
    } else if (targetStep > currentStep) {
      const errors = validateStep(currentStep);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        if (errors.tenantEmail && errors.tenantEmail.includes("APPROVED")) {
          toast.error(errors.tenantEmail);
        } else {
          toast.error('Please complete the required details before moving forward.');
        }
        return;
      }

      if (currentStep === 1) {
        try {
          const res = await API.get(`/rental/leases/check-active?email=${encodeURIComponent(tenantEmail)}` + (editingLeaseId ? `&exclude_lease_id=${editingLeaseId}` : ''));
          if (res.data.has_active_lease) {
            const detailMsg = res.data.detail || "This tenant email is already registered/invited to an active or pending lease.";
            setFormErrors({ tenantEmail: detailMsg });
            toast.error(detailMsg);
            return;
          }
        } catch (err) {
          console.error("Failed to check active lease:", err);
        }
      }

      for (let s = currentStep; s < targetStep; s++) {
        const stepErrs = validateStep(s);
        if (Object.keys(stepErrs).length > 0) {
          setFormErrors(stepErrs);
          setCurrentStep(s);
          if (stepErrs.tenantEmail && stepErrs.tenantEmail.includes("APPROVED")) {
            toast.error(stepErrs.tenantEmail);
          } else {
            toast.error(`Please complete Step ${s} first.`);
          }
          return;
        }
      }
      setCurrentStep(targetStep);
      setFormErrors({});
    }
  };

  const compileLeaseText = () => {
    const unitObj = units.find(u => u.unit_id === parseInt(selectedUnitId)) || {};
    const unitNo = unitObj.unit_number || '[Unit Number]';
    
    let compiled = `RESIDENTIAL LEASE AGREEMENT (PORTAL COMPILED DRAFT)\n`;
    compiled += `==================================================\n\n`;
    compiled += `1. PARTIES: This Lease Agreement is entered into between the Landlord:\n`;
    compiled += `   - Name: ${lessorFullName || '[Landlord Name]'}\n`;
    if (coLandlordName) {
      compiled += `   - Co-Landlord: ${coLandlordName}\n`;
    }
    compiled += `   - Notice/Payment Address: ${lessorAddress || 'Not Provided'}\n`;
    compiled += `   - Phone: ${lessorPhone || '[Landlord Phone]'}\n`;
    compiled += `   - Email: ${lessorEmail || '[Landlord Email]'}\n\n`;
    compiled += `   And the Tenant:\n`;
    compiled += `   - Name: ${tenantName || '[Tenant Name]'}\n`;
    compiled += `   - Phone: ${tenantPhone || '[Tenant Phone]'}\n`;
    compiled += `   - Email: ${tenantEmail || '[Tenant Email]'}\n\n`;
    
    compiled += `2. PROPERTY: Landlord rents to Tenant the premises located at:\n`;
    if (unitNo === 'Single Family') {
      compiled += `   - Property Type: Single Family Home\n`;
    } else if (unitNo === 'Condo Unit') {
      compiled += `   - Property Type: Condo Unit\n`;
    } else {
      compiled += `   - Unit Number: ${unitNo}\n`;
    }
    if (unitObj.property_id) {
      compiled += `   - Property Reference ID: ${unitObj.property_id}\n`;
    }
    compiled += `\n`;
    
    compiled += `3. TERM & DURATION: The lease shall start on ${startDate || '[Start Date]'}.\n`;
    compiled += `   - Lease Duration: ${duration === 'custom' ? `${customDuration} Months` : `${duration} Months`}\n`;
    compiled += `   - Calculated End Date: ${endDate || '[End Date]'}\n\n`;
    
    compiled += `4. RENT, DEPOSIT & FEES:\n`;
    compiled += `   - Monthly Rent: \$${rentAmount || '0.00'}\n`;
    compiled += `   - Rent Due Date: Rent is due on the ${rentDueDate || '1st'} day of each calendar month.\n`;
    compiled += `   - Security Deposit: \$${deposit || '0.00'}\n`;
    if (parseFloat(moveInFee) > 0) compiled += `   - Move-in Fee: \$${moveInFee}\n`;
    if (parseFloat(moveOutFee) > 0) compiled += `   - Move-out Fee: \$${moveOutFee}\n`;
    compiled += `   - Late Fee: Past due rent will incur a late fee of \$${feeAmount || '50'} (${feeType === 'FLAT' ? 'Flat Fee' : 'Percentage'}) after a grace period of ${gracePeriod || '5'} days.\n\n`;
    
    compiled += `5. UTILITIES RESPONSIBILITY:\n`;
    compiled += `   - Electricity: Paid by ${electricityPayee === 'landlord' ? 'Landlord' : 'Tenant'}\n`;
    compiled += `   - Water: Paid by ${waterPayee === 'landlord' ? 'Landlord' : 'Tenant'}\n`;
    compiled += `   - Gas: Paid by ${gasPayee === 'landlord' ? 'Landlord' : 'Tenant'}\n`;
    compiled += `   - Internet: Paid by ${internetPayee === 'landlord' ? 'Landlord' : 'Tenant'}\n`;
    compiled += `   - Trash Removal: Paid by ${trashPayee === 'landlord' ? 'Landlord' : 'Tenant'}\n`;
    if (hasUtilFee && parseFloat(utilFee) > 0) {
      compiled += `   - Flat Utility Fee Charged by Landlord: \$${utilFee}/month\n`;
    }
    compiled += `\n`;
    
    compiled += `6. ADDITIONAL CHARGES:\n`;
    if (hasParkingFee && parseFloat(parkingFeePerCar) > 0) {
      compiled += `   - Parking Fee: \$${parkingFeePerCar}/car per month (Total cars: ${parkingCarsCount}, calculated total: \$${parseFloat(parkingFeePerCar) * parseInt(parkingCarsCount)}/mo)\n`;
    } else {
      compiled += `   - Parking Fee: None / Not applicable\n`;
    }
    if (hasPetFee && parseFloat(petFeePerPet) > 0) {
      compiled += `   - Pet Fee: \$${petFeePerPet}/pet per month (Total pets: ${petsCount}, calculated total: \$${parseFloat(petFeePerPet) * parseInt(petsCount)}/mo)\n`;
    } else {
      compiled += `   - Pet Fee: None / Not applicable\n`;
    }
    if (keyExchangeNotes) {
      compiled += `   - Key Exchange Instructions: ${keyExchangeNotes}\n`;
    }
    compiled += `\n`;
    
    compiled += `7. LEASE CLAUSES & AGREEMENTS:\n`;
    if (clauseOnlineRent) {
      compiled += `   - ONLINE RENT PAYMENT: Tenant agrees to pay monthly rent via the secure online portal.\n`;
    }
    if (clauseQuietHours) {
      compiled += `   - COMMUNITY QUIET HOURS: Tenant agrees to respect quiet hours from 10:00 PM to 8:00 AM daily.\n`;
    }
    if (clauseMaintenance) {
      compiled += `   - MAINTENANCE & REPAIRS: Tenant shall keep the premises in clean condition and report any defects immediately.\n`;
    }
    if (clauseCustomText && clauseCustomText.trim()) {
      compiled += `   - ADDITIONAL CUSTOM CLAUSE: ${clauseCustomText.trim()}\n`;
    }
    compiled += `\n`;
    
    compiled += `8. RULES & POLICIES:\n`;
    rules.forEach((rule, idx) => {
      compiled += `   - Rule ${idx + 1}: ${rule}\n`;
    });
    compiled += `\n`;
    
    let currentSecNum = 9;
    if (disclosureLeadPaint || disclosureMold || disclosureBedBugs) {
      compiled += `${currentSecNum}. LEGAL DISCLOSURES:\n`;
      if (disclosureLeadPaint) {
        compiled += `   - LEAD-BASED PAINT DISCLOSURE: Lead-based paint hazards warning received and understood (applicable for units built before 1978).\n`;
      }
      if (disclosureMold) {
        compiled += `   - MOLD DISCLOSURE: Tenant acknowledges warning regarding potential mold growth and agrees to ventilate unit.\n`;
      }
      if (disclosureBedBugs) {
        compiled += `   - BED BUG DISCLOSURE: Tenant has inspected the unit and found no active bed bug infestation.\n`;
      }
      compiled += `\n`;
      currentSecNum += 1;
    }
    return compiled;
  };

  useEffect(() => {
    fetchLeases();
    if (isLandlord) {
      fetchUnits();
      fetchApplications();
    }
    if (localStorage.getItem('open_create_lease_modal') === 'true') {
      localStorage.removeItem('open_create_lease_modal');
      setShowCreateModal(true);
    }

    const handleGlobalUpdate = () => {
      fetchLeases(true);
      if (isLandlord) {
        fetchUnits();
        fetchApplications();
      }
    };
    window.addEventListener('rental-data-changed', handleGlobalUpdate);
    return () => {
      window.removeEventListener('rental-data-changed', handleGlobalUpdate);
    };
  }, [isLandlord, user?.property_name, user?.unit_number]);

  useEffect(() => {
    if (showCreateModal && user) {
      setLessorFullName(user.name || user.full_name || '');
      setLessorEmail(user.email || '');
      setLessorPhone(formatPhoneAsYouType(user.mobile_number || ''));
      if (isLandlord) {
        fetchApplications();
      }
    }
  }, [showCreateModal, user, isLandlord]);

  useEffect(() => {
    const showUtilityFeeOption = 
      electricityPayee === 'landlord' || 
      waterPayee === 'landlord' || 
      gasPayee === 'landlord' || 
      internetPayee === 'landlord' || 
      trashPayee === 'landlord';
    if (!showUtilityFeeOption) {
      setHasUtilFee(false);
    }
  }, [electricityPayee, waterPayee, gasPayee, internetPayee, trashPayee]);


  useEffect(() => {
    if (tenantEmail && selectedUnitId && applications.length > 0) {
      const matchedApp = applications.find(app => 
        app.tenant_email?.toLowerCase().trim() === tenantEmail.toLowerCase().trim() &&
        String(app.unit_id) === String(selectedUnitId) &&
        app.screening_status === 'APPROVED'
      );
      if (matchedApp) {
        if (matchedApp.full_name) {
          setTenantName(matchedApp.full_name);
        }
        if (matchedApp.phone) {
          setTenantPhone(formatPhoneAsYouType(matchedApp.phone));
        }
      }
    }
  }, [tenantEmail, selectedUnitId, applications]);


  useEffect(() => {
    if (showCreateModal) {
      setLeaseText(compileLeaseText());
    }
  }, [

    showCreateModal,
    selectedUnitId,
    tenantEmail,
    tenantName,
    tenantPhone,
    startDate,
    endDate,
    duration,
    customDuration,
    rentAmount,
    deposit,
    rentDueDate,
    moveInFee,
    moveOutFee,
    gracePeriod,
    feeType,
    feeAmount,
    electricityPayee,
    waterPayee,
    gasPayee,
    internetPayee,
    trashPayee,
    hasUtilFee,
    utilFee,
    hasParkingFee,
    parkingFeePerCar,
    parkingCarsCount,
    hasPetFee,
    petFeePerPet,
    petsCount,
    keyExchangeNotes,
    clauseOnlineRent,
    clauseQuietHours,
    clauseMaintenance,
    clauseCustomText,
    rules,
    disclosureLeadPaint,
    disclosureMold,
    disclosureBedBugs,
    attachments,
    lessorFullName,
    lessorAddress,
    lessorPhone,
    lessorEmail,
    coLandlordName
  ]);

  useEffect(() => {
    if (!startDate) {
      setEndDate('');
      return;
    }
    
    const numMonths = duration === 'custom' ? parseInt(customDuration) : parseInt(duration);
    if (isNaN(numMonths) || numMonths < 1) {
      setEndDate('');
      return;
    }
    
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      setEndDate('');
      return;
    }
    
    const end = new Date(start);
    end.setMonth(start.getMonth() + numMonths);
    end.setDate(end.getDate() - 1);
    
    const yyyy = end.getFullYear();
    const mm = String(end.getMonth() + 1).padStart(2, '0');
    const dd = String(end.getDate()).padStart(2, '0');
    setEndDate(`${yyyy}-${mm}-${dd}`);
  }, [startDate, duration, customDuration]);

  useEffect(() => {
    if (editingLeaseId) return; // Do not overwrite values when editing a lease!
    if (selectedUnitId && units.length > 0) {
      const u = units.find(item => item.unit_id === parseInt(selectedUnitId));
      if (u && u.rent_amount) {
        setRentAmount(u.rent_amount.toString());
        setDeposit(u.rent_amount.toString());
      }
    } else {
      setRentAmount('');
      setDeposit('');
    }
  }, [selectedUnitId, units, editingLeaseId]);
  useEffect(() => {
    if (selectedUnitId && units.length > 0) {
      const u = units.find(item => item.unit_id === parseInt(selectedUnitId));
      if (u && u.property_address) {
        const fullAddr = `${u.property_address}, ${u.property_city || ''}, ${u.property_state || ''} ${u.property_zip || ''}`.replace(/,\s*,/g, ',').trim().replace(/^,|,$/g, '');
        setLessorAddress(fullAddr);
        setIsLessorAddressSelected(true);
      }
    }
  }, [selectedUnitId, units]);


  useEffect(() => {
    if (editingLeaseId) return; // Do not overwrite unit selection in edit mode!
    if (isLandlord && units.length > 0 && showCreateModal && !prefilledFromApp) {
      const propUnits = units.filter(u => 
        selectedPropertyFilterId === 'all' || String(u.property_id) === String(selectedPropertyFilterId)
      );
      if (propUnits.length > 0) {
        if (!selectedUnitId || !propUnits.some(u => String(u.unit_id) === String(selectedUnitId))) {
          setSelectedUnitId(propUnits[0].unit_id.toString());
        }
      } else {
        setSelectedUnitId('');
      }
    }
  }, [selectedPropertyFilterId, units, isLandlord, showCreateModal, prefilledFromApp, editingLeaseId]);

  useEffect(() => {
    const selectedUnitObj = units.find(u => String(u.unit_id) === String(selectedUnitId));
    if (selectedUnitObj && (selectedUnitObj.property_type === 'condo' || selectedUnitObj.unit_number === 'Condo Unit')) {
      setCustomUnitNo(getCleanUnitNumber(selectedUnitObj.unit_number));
    } else {
      setCustomUnitNo('');
    }
  }, [selectedUnitId, units]);


  useEffect(() => {
    if (selectedLease) {
      if (selectedLease.landlord_signature && !selectedLease.co_landlord_signature) {
        setSigningAsRole('co_landlord');
      } else {
        setSigningAsRole('landlord');
      }
      setTenantDob(selectedLease.tenant_dob || '');
      setTenantCurrentAddress(selectedLease.tenant_current_address || '');
      setTenantEmergencyContact(selectedLease.tenant_emergency_contact || '');
      setTenantEmergencyPhone(selectedLease.tenant_emergency_phone || '');
      setTenantSignatureText(selectedLease.tenant_signature || '');
      setNumOccupants(selectedLease.num_occupants || 1);
      setNumMinors(selectedLease.num_minors || 0);

      setUploadedDocs(selectedLease.documents || []);
      setTenantOnboardingStep(1);
      setTenantAgreeTerms(false);

      const hasPark = parseFloat(selectedLease.parking_fee || 0) > 0;
      setTenantHasParking(hasPark);
      const carCount = hasPark ? Math.round(parseFloat(selectedLease.parking_fee) / 25) : 1;
      const safeCarCount = carCount > 0 ? carCount : 1;
      setTenantParkingCarsCount(safeCarCount);
      
      const parsedVehicles = [];
      if (selectedLease.vehicle_details) {
        const parts = selectedLease.vehicle_details.split(';');
        parts.forEach(part => {
          const match = part.match(/Car \d+:\s*(.*?)\s*\(State:\s*(.*?)\)/i);
          if (match && match[1]) {
            parsedVehicles.push({
              plate: match[1] === 'N/A' ? '' : match[1].trim(),
              state: match[2] ? match[2].trim() : 'AL'
            });
          } else {
            const simplePart = part.trim();
            if (simplePart) {
              parsedVehicles.push({ plate: simplePart, state: 'AL' });
            }
          }
        });
      }
      while (parsedVehicles.length < safeCarCount) {
        parsedVehicles.push({ plate: '', state: 'AL' });
      }
      setTenantVehicles(parsedVehicles.slice(0, safeCarCount));

      const hasPetsVal = parseFloat(selectedLease.pet_fee || 0) > 0;
      setTenantHasPets(hasPetsVal);
      const petCount = hasPetsVal ? Math.round(parseFloat(selectedLease.pet_fee) / 50) : 1;
      const safePetCount = petCount > 0 ? petCount : 1;
      setTenantPetsCount(safePetCount);
      
      const parsedPets = [];
      if (selectedLease.pet_details) {
        const parts = selectedLease.pet_details.split(';');
        parts.forEach(part => {
          const match = part.match(/Pet \d+:\s*(.*)/i);
          if (match && match[1]) {
            parsedPets.push({ type: match[1].trim() });
          } else if (part.trim()) {
            parsedPets.push({ type: part.trim() });
          }
        });
      }
      while (parsedPets.length < safePetCount) {
        parsedPets.push({ type: 'Dog' });
      }
      setTenantPets(parsedPets.slice(0, safePetCount));
      setTenantPetDetails(selectedLease.pet_fee ? 'Dog' : 'Dog');
    }
  }, [selectedLease]);

  async function fetchLeases(isSilent = false) {
    try {
      if (!isSilent) setLoading(true);
      const res = await API.get('/rental/leases');

      const pendingLeaseId = localStorage.getItem('pending_lease_id');
      if (pendingLeaseId) {
        const found = res.data.find(l => String(l.lease_id) === String(pendingLeaseId));
        if (found) {
          setSelectedLease(found);
        }
        localStorage.removeItem('pending_lease_id');
      }

      if (!isLandlord) {
        setLeases(res.data);
        const pendingToSign = res.data.find(l => l.status === 'PENDING_TENANT_REVIEW' || l.status === 'PENDING_SIGNATURE');
        if (pendingToSign && !selectedLease) {
          setSelectedLease(pendingToSign);
        }
      } else {
        setLeases(res.data);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUnits() {
    try {
      const prefillEmail = localStorage.getItem('prefill_lease_email');
      const prefillUnitId = localStorage.getItem('prefill_lease_unit_id');

      const propRes = await API.get('/rental/properties');
      const props = propRes.data;
      const allUnits = [];
      for (const p of props) {
        const unitRes = await API.get(`/rental/properties/${p.property_id}/units`);
        const mapped = unitRes.data.map(u => ({ 
          ...u, 
          property_name: p.name,
          property_type: p.property_type,
          property_address: p.address,
          property_city: p.city,
          property_state: p.state,
          property_zip: p.zip_code
        }));


        allUnits.push(...mapped.filter(u => !u.has_active_lease || String(u.unit_id) === String(prefillUnitId)));
      }
      setUnits(allUnits);
      
      if (prefillUnitId) {
        setSelectedUnitId(prefillUnitId);
        localStorage.removeItem('prefill_lease_unit_id');
        if (prefillEmail) {
          setTenantEmail(prefillEmail);
          localStorage.removeItem('prefill_lease_email');
        }

        const prefillPets = localStorage.getItem('prefill_lease_pets');
        const prefillVehicles = localStorage.getItem('prefill_lease_vehicles');
        const prefillRent = localStorage.getItem('prefill_lease_rent');

        if (prefillPets) {
          localStorage.removeItem('prefill_lease_pets');
          const petMatch = prefillPets.match(/(\d+)/);
          const pCount = petMatch ? parseInt(petMatch[1]) : 1;
          setHasPetFee(true);
          setPetsCount(String(pCount));
          setPetFeePerPet('50');
          setPetFee(String(pCount * 50));
          setClauseCustomText(prev => prev + `\nTenant is authorized to keep pets: ${prefillPets}.`);
        }

        if (prefillVehicles) {
          localStorage.removeItem('prefill_lease_vehicles');
          const vehicleMatch = prefillVehicles.match(/(\d+)/);
          const vCount = vehicleMatch ? parseInt(vehicleMatch[1]) : 1;
          setHasParkingFee(true);
          setParkingCarsCount(String(vCount));
          setParkingFeePerCar('25');
          setParkingFee(String(vCount * 25));
          setClauseCustomText(prev => prev + `\nTenant is authorized to park vehicles: ${prefillVehicles}.`);
        }

        if (prefillRent && prefillRent !== 'undefined' && prefillRent !== 'null') {
          localStorage.removeItem('prefill_lease_rent');
          setRentAmount(prefillRent);
          setDeposit(prefillRent);
        }

        setPrefilledFromApp(true);
        setShowCreateModal(true);
      } else {
        setSelectedUnitId('');
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchApplications() {
    try {
      const res = await API.get('/rental/applications');
      setApplications(res.data || []);
    } catch (err) {
      console.error("Error fetching applications for validation:", err);
    }
  }

  async function handleCreateLease(e) {
    if (e) e.preventDefault();
    
    // Final check for all steps
    for (let step = 1; step <= 5; step++) {
      const validationErrors = validateStep(step);
      if (Object.keys(validationErrors).length > 0) {
        setFormErrors(validationErrors);
        setCurrentStep(step);
        toast.error(`Please complete the required details in Step ${step} before submitting.`);
        return;
      }
    }

    try {
      const selectedUnitObj = units.find(u => String(u.unit_id) === String(selectedUnitId));
      if (selectedUnitObj && (selectedUnitObj.property_type === 'condo' || selectedUnitObj.unit_number === 'Condo Unit') && customUnitNo.trim()) {
        const cleaned = customUnitNo.trim();
        if (cleaned !== selectedUnitObj.unit_number) {
          await API.put(`/rental/units/${selectedUnitId}`, {
            property_id: selectedUnitObj.property_id,
            unit_number: cleaned,
            rent_amount: selectedUnitObj.rent_amount || 0.0
          });
          setUnits(prev => prev.map(u => String(u.unit_id) === String(selectedUnitId) ? { ...u, unit_number: cleaned } : u));
          selectedUnitObj.unit_number = cleaned;
        }
      }

      const calculatedUtilFee = hasUtilFee ? parseFloat(utilFee || 0) : 0;
      const calculatedParkingFee = hasParkingFee ? (parseFloat(parkingFeePerCar || 0) * parseInt(parkingCarsCount || 1)) : 0;
      const calculatedPetFee = hasPetFee ? (parseFloat(petFeePerPet || 0) * parseInt(petsCount || 1)) : 0;

      const payload = {
        unit_id: parseInt(selectedUnitId),
        tenant_email: tenantEmail,
        tenant_name: tenantName,
        start_date: startDate,
        end_date: endDate,
        rent_amount: parseFloat(rentAmount),
        security_deposit: parseFloat(deposit || 0),
        grace_period_days: parseInt(gracePeriod),
        late_fee_type: feeType,
        late_fee_amount: parseFloat(feeAmount),
        lease_agreement_text: leaseText,
        utilities_fee: calculatedUtilFee,
        parking_fee: calculatedParkingFee,
        pet_fee: calculatedPetFee,
        co_landlord_name: coLandlordName.trim() || null
      };

      if (editingLeaseId) {
        const res = await API.put(`/rental/leases/${editingLeaseId}`, payload);
        const newLeases = leases.map(l => l.lease_id === editingLeaseId ? res.data : l);
        setLeases(newLeases);
        setSelectedLease(res.data);
        resetWizardForm();
        setShowCreateModal(false);
        setPrefilledFromApp(false);
        toast.success("Lease agreement updated successfully!");
        if (onLeaseCreated) onLeaseCreated(newLeases);
      } else {
        const res = await API.post('/rental/leases', payload);
        const newLeases = [...leases, res.data];
        setLeases(newLeases);
        setSelectedLease(res.data);
        resetWizardForm();
        setShowCreateModal(false);
        setPrefilledFromApp(false);
        toast.success("Lease agreement created successfully!");
        if (onLeaseCreated) onLeaseCreated(newLeases);
      }

    } catch (err) {
      const detail = err.response?.data?.detail;
      let msg = "Failed to create lease.";
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail)) {
        msg = detail.map(d => `${d.loc ? d.loc.join('.') : ''}: ${d.msg || ''}`).join(', ');
      } else if (detail) {
        msg = JSON.stringify(detail);
      }
      setErrorMsg(msg);
      toast.error(msg);
    }
  }

  // --- NEW WORKFLOW API HANDLERS ---
  async function handleTenantDocUpload(e, docType) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Size check
    if (file.size > 10 * 1024 * 1024) {
      setDocUploadError("File size exceeds 10MB limit. Max allowed is 10MB.");
      setTimeout(() => setDocUploadError(''), 4000);
      return;
    }
    
    // Type check
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setDocUploadError("Invalid file format. Please upload PDF, JPG, PNG or WEBP.");
      setTimeout(() => setDocUploadError(''), 4000);
      return;
    }

    setUploadingDoc(docType);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await API.post(`/rental/leases/${selectedLease.lease_id}/documents?doc_type=${docType}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      // No blocking alert — uploaded status shows inline with green ✓ text
      setUploadedDocs(prev => [...prev, {
        document_id: res.data.document_id,
        doc_type: docType,
        original_name: file.name
      }]);
    } catch (err) {
      // Use console + inline — avoid window.alert which closes the modal
      const errMsg = err.response?.data?.detail || "Failed to upload document.";
      console.error("Doc upload error:", errMsg);
      setDocUploadError(errMsg);
      setTimeout(() => setDocUploadError(''), 4000);
    } finally {
      setUploadingDoc(null);
    }
  }

  async function handleDownloadDoc(docId, originalName) {
    try {
      const res = await API.get(`/rental/leases/${selectedLease.lease_id}/documents/${docId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Failed to download or decrypt document.");
    }
  }

  async function handleViewDoc(docId, originalName) {
    try {
      const res = await API.get(`/rental/leases/${selectedLease.lease_id}/documents/${docId}/download`, { responseType: 'blob' });
      let contentType = 'application/octet-stream';
      const ext = originalName.split('.').pop().toLowerCase();
      if (ext === 'pdf') {
        contentType = 'application/pdf';
      } else if (['jpg', 'jpeg'].includes(ext)) {
        contentType = 'image/jpeg';
      } else if (ext === 'png') {
        contentType = 'image/png';
      } else if (ext === 'webp') {
        contentType = 'image/webp';
      }
      
      const file = new Blob([res.data], { type: contentType });
      const url = window.URL.createObjectURL(file);
      window.open(url, '_blank');
    } catch (err) {
      toast.error("Failed to view document.");
    }
  }

  async function handleRemoveDoc(docId, docType) {
    if (!window.confirm("Are you sure you want to remove this document?")) return;
    try {
      await API.delete(`/rental/leases/${selectedLease.lease_id}/documents/${docId}`);
      toast.success("Document removed successfully!");
      setUploadedDocs(prev => prev.filter(d => d.document_id !== docId));
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to remove document.");
    }
  }

  async function handleTenantOnboardingSubmit(e) {
    if (e) e.preventDefault();
    
    // Validate Step 2 details
    if (!tenantDob) {
      toast.error("Please enter your date of birth.");
      return;
    }
    
    // 18+ check
    const birthDate = new Date(tenantDob);
    const ageDiffMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDiffMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    if (age < 18) {
      toast.error("You must be 18 years or older to sign a lease.");
      return;
    }

    if (!tenantCurrentAddress.trim() || tenantCurrentAddress.length < 10) {
      toast.error("Please enter a valid current address (min 10 chars).");
      return;
    }

    if (!tenantEmergencyContact.trim() || !/^[a-zA-Z\s.-]{2,50}$/.test(tenantEmergencyContact.trim())) {
      toast.error("Please enter a valid emergency contact name (letters only).");
      return;
    }

    const cleanedPhone = tenantEmergencyPhone.replace(/\D/g, '');
    if (!cleanedPhone || cleanedPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit US emergency phone number.");
      return;
    }

    // Documents check
    const requiredTypes = ["PAY_SLIP", "DRIVING_LICENSE", "ADDRESS_PROOF"];
    const missing = requiredTypes.filter(type => !uploadedDocs.some(d => d.doc_type === type));
    if (missing.length > 0) {
      const labels = { PAY_SLIP: "Pay Slip", DRIVING_LICENSE: "Driving License / ID", ADDRESS_PROOF: "Address Proof" };
      toast.error(`Please upload: ${missing.map(m => labels[m]).join(", ")}`);
      return;
    }

    // Step 3 validation (Signature)
    if (!tenantSignatureText.trim() || !/^[a-zA-Z\s]+$/.test(tenantSignatureText.trim()) || tenantSignatureText.trim().length < 3) {
      toast.error("Please enter your full legal name to sign (letters only, min 3 chars).");
      return;
    }

    if (!tenantAgreeTerms) {
      toast.error("You must agree to the terms in the lease contract.");
      return;
    }

    try {
      const res = await API.post(`/rental/leases/${selectedLease.lease_id}/tenant-submit`, {
        tenant_dob: tenantDob,
        tenant_current_address: tenantCurrentAddress,
        tenant_emergency_contact: tenantEmergencyContact,
        tenant_emergency_phone: tenantEmergencyPhone,
        signature_text: tenantSignatureText,
        has_parking: tenantHasParking,
        parking_cars_count: tenantHasParking ? parseInt(tenantParkingCarsCount) : 0,
        vehicle_details: tenantHasParking
          ? tenantVehicles.slice(0, tenantParkingCarsCount).map((v, i) => `Car ${i + 1}: ${v.plate || 'N/A'} (State: ${v.state || 'AL'})`).join('; ')
          : "",
        has_pets: tenantHasPets,
        pets_count: tenantHasPets ? parseInt(tenantPetsCount) : 0,
        pet_details: tenantHasPets
          ? tenantPets.slice(0, tenantPetsCount).map((p, i) => `Pet ${i + 1}: ${p.type || 'Dog'}`).join('; ')
          : "",
        num_occupants: parseInt(numOccupants) || 1,
        num_minors: parseInt(numMinors) || 0

      });
      toast.success("Lease submitted successfully! Landlord has been notified for final approval.");
      setLeases(prev => prev.map(l => l.lease_id === selectedLease.lease_id ? res.data : l));
      setSelectedLease(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Submission failed.");
    }
  }

  async function handleTenantRequestUnitChange(e) {
    if (e) e.preventDefault();
    if (!tenantChangeUnitNotes.trim()) {
      toast.error("Please enter a note explaining the unit change request.");
      return;
    }

    try {
      const res = await API.post(`/rental/leases/${selectedLease.lease_id}/request-unit-change`, {
        notes: tenantChangeUnitNotes
      });
      toast.success("Unit change request sent to landlord successfully!");
      setLeases(prev => prev.map(l => l.lease_id === selectedLease.lease_id ? res.data : l));
      setSelectedLease(res.data);
      setShowTenantChangeUnitModal(false);
      setTenantChangeUnitNotes('');
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit request.");
    }
  }

  async function handleLandlordApproveLease() {
    try {
      const res = await API.post(`/rental/leases/${selectedLease.lease_id}/approve`);
      toast.success("Lease approved and activated! The unit is now occupied.");
      setLeases(prev => prev.map(l => l.lease_id === selectedLease.lease_id ? res.data : l));
      setSelectedLease(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to approve lease.");
    }
  }
  const renderTenantOnboardingFlow = () => {
    const docLabels = { PAY_SLIP: "Pay Slip / Income Proof", DRIVING_LICENSE: "Driving License / National ID", ADDRESS_PROOF: "Notice/Payment Address Proof" };
    return (
      <div className="space-y-6 text-left">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b dark:border-white/5 pb-4 select-none">
          <div className="flex items-center gap-2 py-1">
            {[1, 2].map((step, idx) => {
              const isActive = tenantOnboardingStep === step;
              const isCompleted = step < tenantOnboardingStep;
              
              return (
                <div key={step} className="flex items-center gap-2 shrink-0">
                  {/* Step Circle */}
                  <button
                    type="button"
                    disabled={step > tenantOnboardingStep}
                    onClick={() => setTenantOnboardingStep(step)}
                    className="focus:outline-none cursor-pointer"
                    title={`Step ${step}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border shrink-0 ${
                      isActive 
                        ? 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-500/20 shadow-md shadow-blue-550/10' 
                        : isCompleted
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/10'
                          : 'bg-white dark:bg-[#132030] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-350 dark:hover:border-white/25'
                    }`}>
                      {isCompleted ? '✓' : step}
                    </div>
                  </button>

                  {/* Connector Line */}
                  {idx < 1 && (
                    <div className="w-8 sm:w-12 h-0.5 bg-slate-200 dark:bg-white/10 relative shrink-0">
                      <div className={`absolute inset-y-0 left-0 bg-blue-600 transition-all duration-300 ${
                        step < tenantOnboardingStep ? 'w-full' : 'w-0'
                      }`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tenant Onboarding Flow</span>
        </div>

        {tenantOnboardingStep === 1 && (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">Step 1: Enter Details & Upload Identity Documents</h3>
            
            {/* Details Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Your Date of Birth (must be 18+)</label>
                <input
                  type="date"
                  value={tenantDob}
                  onChange={e => setTenantDob(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="relative">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Current Physical Address</label>
                <input
                  type="text"
                  value={tenantCurrentAddress}
                  onChange={e => handleTenantAddressChange(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Street, City, State, ZIP"
                />
                {tenantAddressSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#1D2B3A] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar text-left">
                    {tenantAddressSuggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectTenantSuggestion(suggestion)}
                        className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer text-xs font-semibold border-b border-slate-100 dark:border-white/[0.03] last:border-none text-slate-700 dark:text-slate-350"
                      >
                        {suggestion.formatted}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Emergency Contact Name</label>
                <input
                  type="text"
                  value={tenantEmergencyContact}
                  onChange={e => setTenantEmergencyContact(e.target.value.replace(/[^a-zA-Z\s.-]/g, ''))}
                  className="w-full text-xs px-3.5 py-2.5 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Contact full name"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Emergency Phone Number</label>
                <input
                  type="tel"
                  value={tenantEmergencyPhone}
                  onChange={e => setTenantEmergencyPhone(formatPhoneAsYouType(e.target.value))}
                  className="w-full text-xs px-3.5 py-2.5 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="(555) 555-5555"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Number of Residents / People in Unit</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={numOccupants}
                  onChange={e => setNumOccupants(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full text-xs px-3.5 py-2.5 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Number of occupants"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Total Number of Minors</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={numMinors}
                  onChange={e => setNumMinors(Math.min(20, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full text-xs px-3.5 py-2.5 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Number of minors"
                />
              </div>
            </div>

            {/* Parking & Pet Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-white/5">
              {/* Parking */}
              <div className={`p-4 border rounded-2xl transition-all text-left ${tenantHasParking ? 'border-blue-500/30 bg-blue-500/[0.02]' : 'border-slate-200 dark:border-white/5 bg-slate-50/30 dark:bg-slate-950/5'}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white block">Do you need vehicle parking?</span>
                    <span className="text-[10px] text-slate-400">Flat rate of $25/month per vehicle.</span>
                  </div>
                  <div className="flex w-24 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 p-0.5 bg-white dark:bg-[#132030] shrink-0">
                    <button
                      type="button"
                      onClick={() => setTenantHasParking(true)}
                      className={`flex-1 text-[10px] font-bold py-1 rounded-md transition cursor-pointer ${
                        tenantHasParking ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-white bg-transparent'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTenantHasParking(false);
                        setTenantParkingCarsCount(1);
                        setTenantVehicles([{ plate: '', state: 'AL' }]);
                      }}
                      className={`flex-1 text-[10px] font-bold py-1 rounded-md transition cursor-pointer ${
                        !tenantHasParking ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-white bg-transparent'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {tenantHasParking && (
                  <div className="space-y-3 mt-3 pt-3 border-t border-blue-500/10 animate-fade-in">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-455 uppercase tracking-wider mb-1.5 font-sans">Number of Cars (1 to 3)</label>
                      <input 
                        type="number" 
                        min="1"
                        max="3"
                        value={tenantParkingCarsCount} 
                        onChange={e => {
                          const count = Math.min(3, Math.max(1, parseInt(e.target.value) || 1));
                          setTenantParkingCarsCount(count);
                          setTenantVehicles(prev => {
                            const updated = [...prev];
                            while (updated.length < count) updated.push({ plate: '', state: 'AL' });
                            return updated.slice(0, count);
                          });
                        }}
                        className="w-full text-xs px-3 py-2 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none border-slate-200 dark:border-white/10"
                      />
                    </div>
                    {Array.from({ length: tenantParkingCarsCount }).map((_, idx) => (
                      <div key={idx} className="space-y-2 animate-fade-in text-left">
                        {tenantParkingCarsCount > 1 && (
                          <span className="block text-[9px] font-black text-blue-500 uppercase tracking-widest">Car {idx + 1}</span>
                        )}
                        <div className="grid grid-cols-2 gap-3 items-start">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-455 uppercase tracking-wider mb-1.5 font-sans">License Plate / Model</label>
                            <div className="relative">
                              <input
                                type="text"
                                required
                                value={tenantVehicles[idx]?.plate || ''}
                                onChange={e => {
                                  const updated = [...tenantVehicles];
                                  if (!updated[idx]) updated[idx] = { plate: '', state: 'AL' };
                                  updated[idx] = { ...updated[idx], plate: e.target.value };
                                  setTenantVehicles(updated);
                                }}
                                placeholder="e.g. Toyota Camry (ABC-123)"
                                className={`w-full text-xs pr-8 pl-3 py-2 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none transition-all ${
                                  (tenantVehicles[idx]?.plate || '').trim().length >= 3
                                    ? 'border-emerald-500/50 dark:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/20'
                                    : 'border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20'
                                }`}
                              />
                              {(tenantVehicles[idx]?.plate || '').trim().length >= 3 && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-[10px] font-black select-none pointer-events-none">✓</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-455 uppercase tracking-wider mb-1.5 font-sans">Registration State</label>
                            <select
                              value={tenantVehicles[idx]?.state || 'AL'}
                              onChange={e => {
                                const updated = [...tenantVehicles];
                                if (!updated[idx]) updated[idx] = { plate: '', state: 'AL' };
                                updated[idx] = { ...updated[idx], state: e.target.value };
                                setTenantVehicles(updated);
                              }}
                              className="w-full text-xs px-3 py-2.5 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none border-slate-200 dark:border-white/10 cursor-pointer font-medium"
                            >
                              {[
                                { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
                                { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
                                { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
                                { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
                                { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
                                { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
                                { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
                                { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
                                { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
                                { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
                                { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
                                { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
                                { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
                                { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
                                { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
                                { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
                                { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }
                              ].map(st => (
                                <option key={st.code} value={st.code}>{st.name} ({st.code})</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 py-2 px-3 rounded-xl text-center">
                      Monthly Charges: ${tenantParkingCarsCount * 25}/mo
                    </div>
                  </div>
                )}
              </div>

              {/* Pets */}
              <div className={`p-4 border rounded-2xl transition-all text-left ${tenantHasPets ? 'border-blue-500/30 bg-blue-500/[0.02]' : 'border-slate-200 dark:border-white/5 bg-slate-50/30 dark:bg-slate-950/5'}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white block">Do you have any pets?</span>
                    <span className="text-[10px] text-slate-400">Flat rate of $50/month per pet.</span>
                  </div>
                  <div className="flex w-24 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 p-0.5 bg-white dark:bg-[#132030] shrink-0">
                    <button
                      type="button"
                      onClick={() => setTenantHasPets(true)}
                      className={`flex-1 text-[10px] font-bold py-1 rounded-md transition cursor-pointer ${
                        tenantHasPets ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-white bg-transparent'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTenantHasPets(false);
                        setTenantPetsCount(1);
                        setTenantPetDetails('Dog');
                        setTenantPets([{ type: 'Dog' }]);
                      }}
                      className={`flex-1 text-[10px] font-bold py-1 rounded-md transition cursor-pointer ${
                        !tenantHasPets ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-white bg-transparent'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {tenantHasPets && (
                  <div className="space-y-3 mt-3 pt-3 border-t border-blue-500/10 animate-fade-in">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-455 uppercase tracking-wider mb-1.5 font-sans">Number of Pets (1 to 5)</label>
                      <input 
                        type="number" 
                        min="1"
                        max="5"
                        value={tenantPetsCount} 
                        onChange={e => {
                          const count = Math.min(5, Math.max(1, parseInt(e.target.value) || 1));
                          setTenantPetsCount(count);
                          setTenantPets(prev => {
                            const updated = [...prev];
                            while (updated.length < count) updated.push({ type: 'Dog' });
                            return updated.slice(0, count);
                          });
                        }} 
                        className="w-full text-xs px-3 py-2 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none border-slate-200 dark:border-white/10"
                      />
                    </div>
                    {Array.from({ length: tenantPetsCount }).map((_, idx) => (
                      <div key={idx} className="space-y-2 animate-fade-in text-left">
                        {tenantPetsCount > 1 && (
                          <span className="block text-[9px] font-black text-blue-500 uppercase tracking-widest">Pet {idx + 1}</span>
                        )}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-455 uppercase tracking-wider mb-1.5 font-sans">Type of Pet</label>
                          <select 
                            required
                            value={tenantPets[idx]?.type || 'Dog'}
                            onChange={e => {
                              const updated = [...tenantPets];
                              if (!updated[idx]) updated[idx] = { type: 'Dog' };
                              updated[idx] = { ...updated[idx], type: e.target.value };
                              setTenantPets(updated);
                            }}
                            className="w-full text-xs px-3 py-2.5 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none border-slate-200 dark:border-white/10 cursor-pointer font-medium"
                          >
                            <option value="Dog">Dog</option>
                            <option value="Cat">Cat</option>
                            <option value="Bird">Bird</option>
                            <option value="Fish">Fish</option>
                            <option value="Rabbit">Rabbit</option>
                            <option value="Reptile">Reptile</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    ))}
                    <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 py-2 px-3 rounded-xl text-center">
                      Monthly Charges: ${tenantPetsCount * 50}/mo
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Document Upload Blocks */}
            <div className="space-y-3 pt-3 border-t dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Required Documents (PDF / JPG / PNG / WEBP)</span>
              {docUploadError && (
                <div className="mb-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <span>⚠️</span> {docUploadError}
                </div>
              )}
              {["PAY_SLIP", "DRIVING_LICENSE", "ADDRESS_PROOF"].map(type => {
                const existing = uploadedDocs.find(d => d.doc_type === type);
                return (
                  <div key={type} className="p-3 border border-slate-200 dark:border-white/5 rounded-xl flex items-center justify-between gap-4 bg-slate-50/20 dark:bg-white/[0.01]">
                    <div className="text-left">
                      <span className="text-xs font-bold text-slate-800 dark:text-white block">{docLabels[type]}</span>
                      {existing ? (
                        <span className="text-[10px] text-emerald-500 font-semibold block">✓ Uploaded: {existing.original_name}</span>
                      ) : (
                        <span className="text-[10px] text-red-500 block">⚠️ Upload Required (max 10MB)</span>
                      )}
                    </div>
                    <div>
                      {existing ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadDoc(existing.document_id, existing.original_name)}
                            className="px-3 py-1.5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-[10px] font-bold transition cursor-pointer"
                          >
                            Verify File
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveDoc(existing.document_id, type)}
                            className="px-3 py-1.5 border border-red-200 hover:border-red-300 dark:border-red-550/20 text-red-600 dark:text-red-450 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-[10px] font-bold transition cursor-pointer"
                          >
                            Remove File
                          </button>
                        </div>
                      ) : (
                        <div className="relative group">
                          <input
                            type="file"
                            onChange={e => handleTenantDocUpload(e, type)}
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                          />
                          <button
                            type="button"
                            disabled={uploadingDoc === type}
                            className="px-3 py-1.5 bg-blue-600 group-hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer pointer-events-none"
                          >
                            {uploadingDoc === type ? "Uploading..." : "Upload File"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {formError && (
              <div className="mb-3 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] font-semibold text-red-600 dark:text-red-400 flex items-start gap-2">
                <span className="mt-0.5">⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t dark:border-white/5">
              <button
                type="button"
                onClick={() => {
                  setFormError('');
                  if (!tenantDob) {
                    setFormError("Please enter your date of birth.");
                    return;
                  }
                  const birthDate = new Date(tenantDob);
                  const ageDiffMs = Date.now() - birthDate.getTime();
                  const ageDate = new Date(ageDiffMs);
                  const age = Math.abs(ageDate.getUTCFullYear() - 1970);
                  if (age < 18) {
                    setFormError("You must be 18 years or older to sign a lease.");
                    return;
                  }
                  if (!tenantCurrentAddress.trim() || tenantCurrentAddress.trim().length < 10) {
                    setFormError("Please enter a valid current address (min 10 characters).");
                    return;
                  }
                  if (!tenantEmergencyContact.trim() || !/^[a-zA-Z\s.-]{2,50}$/.test(tenantEmergencyContact.trim())) {
                    setFormError("Please enter a valid emergency contact name (letters only, 2–50 characters).");
                    return;
                  }
                  const cleanedPhone = tenantEmergencyPhone.replace(/\D/g, '');
                  if (!cleanedPhone || cleanedPhone.length !== 10) {
                    setFormError("Please enter a valid 10-digit US emergency phone number.");
                    return;
                  }
                  if (tenantHasParking) {
                    for (let i = 0; i < tenantParkingCarsCount; i++) {
                      if (!tenantVehicles[i]?.plate?.trim() || tenantVehicles[i].plate.trim().length < 3) {
                        setFormError(`Please enter license plate / model for Car ${i + 1}.`);
                        return;
                      }
                    }
                  }
                  if (tenantHasPets) {
                    for (let i = 0; i < tenantPetsCount; i++) {
                      if (!tenantPets[i]?.type) {
                        setFormError(`Please select type for Pet ${i + 1}.`);
                        return;
                      }
                    }
                  }
                  const requiredTypes = ["PAY_SLIP", "DRIVING_LICENSE", "ADDRESS_PROOF"];
                  const missing = requiredTypes.filter(type => !uploadedDocs.some(d => d.doc_type === type));
                  if (missing.length > 0) {
                    const labels = { PAY_SLIP: "Pay Slip / Income Proof", DRIVING_LICENSE: "Driving License / National ID", ADDRESS_PROOF: "Notice/Payment Address Proof" };
                    setFormError(`Please upload required documents: ${missing.map(m => labels[m]).join(", ")}`);
                    return;
                  }
                  setTenantOnboardingStep(2);
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-md shadow-blue-500/10 ml-auto"
              >
                Proceed to Review & Sign
              </button>
            </div>
          </div>
        )}

        {tenantOnboardingStep === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b dark:border-white/5 pb-3">
              <div className="space-y-1 text-left">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">Step 2: Review Prepared Lease Agreement</h3>
                <p className="text-xs text-slate-400">Please review all tenancy parameters (rent, deposit, charges, clauses) compiled by the landlord.</p>
              </div>
            </div>
            
            <div className="p-4 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50/40 dark:bg-black/20 text-xs font-mono max-h-72 overflow-y-auto leading-relaxed whitespace-pre-wrap">
              {selectedLease.lease_agreement_text}
            </div>

            {/* Signature Input and Verification Consent Checkbox right above buttons */}
            <div className="p-4 bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200/60 dark:border-white/[0.03] rounded-2xl text-left space-y-4 mt-4">
              <div className="space-y-1.5 text-left">
                <label className="block text-[9px] font-black text-gray-500 dark:text-gray-455 uppercase tracking-wider">Type Your Full Name to Digitally Sign</label>
                <input
                  required
                  type="text"
                  value={tenantSignatureText}
                  onChange={e => setTenantSignatureText(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                  className="w-full text-xs px-3 py-2.5 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white font-serif italic text-[13px] outline-none border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. John Doe"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={tenantAgreeTerms} 
                  onChange={e => setTenantAgreeTerms(e.target.checked)} 
                  className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 mt-1 cursor-pointer" 
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white block">I verify and agree to the terms in this lease agreement.</span>
                  <span className="text-[10px] text-slate-400">By checking this, you agree to digital execution of this lease contract under the U.S. ESIGN Act.</span>
                </div>
              </label>
            </div>

            {formError && (
              <div className="mb-3 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] font-semibold text-red-600 dark:text-red-400 flex items-start gap-2">
                <span className="mt-0.5">⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => setTenantOnboardingStep(1)}
                className="px-4 py-2 border border-slate-250 dark:border-white/10 text-slate-650 dark:text-slate-400 rounded-xl text-xs font-bold cursor-pointer transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormError('');
                  // Signature validation
                  if (!tenantSignatureText.trim() || !/^[a-zA-Z\s]+$/.test(tenantSignatureText.trim()) || tenantSignatureText.trim().length < 3) {
                    setFormError("Please type your full legal name in the signature box (letters only, min 3 chars).");
                    return;
                  }
                  if (!tenantAgreeTerms) {
                    setFormError("You must check the verification box to agree to the lease terms.");
                    return;
                  }
                  handleTenantOnboardingSubmit();
                }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold cursor-pointer transition shadow-md shadow-emerald-500/10"
              >
                Submit Signed Agreement
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLandlordApprovalPanel = () => {
    const docLabels = { PAY_SLIP: "Pay Slip / Income Proof", DRIVING_LICENSE: "Driving License / ID", ADDRESS_PROOF: "Address Proof" };
    return (
      <div className="space-y-6 text-left border-t dark:border-white/5 pt-6 animate-fade-in">
        <div>
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">Review Tenant Submission Details</h3>
          <p className="text-xs text-slate-400">Review the personal information and uploaded verification documents submitted by the tenant before activating the lease.</p>
        </div>

        {/* Tenant Information Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-xs bg-slate-50/50 dark:bg-white/[0.01] p-4 rounded-xl border border-slate-200/60 dark:border-white/[0.03]">
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Date of Birth</span>
            <span className="font-bold text-gray-950 dark:text-white">{selectedLease.tenant_dob || "Not Provided"}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Current Address</span>
            <span className="font-bold text-gray-950 dark:text-white">{selectedLease.tenant_current_address || "Not Provided"}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Emergency Contact</span>
            <span className="font-bold text-gray-950 dark:text-white">{selectedLease.tenant_emergency_contact || "Not Provided"}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Emergency Phone</span>
            <span className="font-bold text-gray-950 dark:text-white">{selectedLease.tenant_emergency_phone ? formatUsPhone(selectedLease.tenant_emergency_phone) : "Not Provided"}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Number of Occupants</span>
            <span className="font-bold text-gray-950 dark:text-white">{selectedLease.num_occupants || "1"}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Total Minors</span>
            <span className="font-bold text-gray-950 dark:text-white">{selectedLease.num_minors || "0"}</span>
          </div>
        </div>

        {/* Verification Documents List */}
        <div className="space-y-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Tenant Identity & Income Verification Files</span>
          {["PAY_SLIP", "DRIVING_LICENSE", "ADDRESS_PROOF"].map(type => {
            const doc = uploadedDocs.find(d => d.doc_type === type);
            return (
              <div key={type} className="p-3.5 border border-slate-200/5 rounded-xl flex items-center justify-between gap-4 bg-slate-50/20 dark:bg-white/[0.01]">
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-800 dark:text-white block">{docLabels[type]}</span>
                  {doc ? (
                    <span className="text-[10px] text-emerald-500 font-semibold block">✓ Uploaded</span>
                  ) : (
                    <span className="text-[10px] text-red-500 block">⚠️ Missing Document</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {doc && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleViewDoc(doc.document_id, doc.original_name)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        View Document
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadDoc(doc.document_id, doc.original_name)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-md shadow-blue-500/10 cursor-pointer flex items-center justify-center"
                        title="Download File"
                      >
                        <Download size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tenant Signature verification */}
        <div className="p-4 bg-indigo-500/[0.02] border border-dashed border-indigo-500/20 rounded-xl flex items-center justify-between gap-4">
          <div className="text-left">
            <span className="text-[10px] text-indigo-500 uppercase font-extrabold tracking-wider block">Verified Tenant E-Signature</span>
            <span className="text-lg font-serif italic font-bold dark:text-white">/ {selectedLease.tenant_signature || "Not Signed Yet"} /</span>
          </div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">U.S. ESIGN Compliant</span>
        </div>

        {/* Landlord Signatures Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t dark:border-white/5 pt-6">
          {/* Primary Landlord Signature */}
          <div className="p-4 bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200/60 dark:border-white/[0.03] rounded-xl text-left space-y-3">
            <span className="text-gray-400 block text-xs mb-1 font-bold uppercase tracking-wider">Primary Landlord Signature</span>
            {selectedLease.landlord_signature ? (
              <span className="font-semibold text-gray-900 dark:text-white italic text-lg font-serif">/ {selectedLease.landlord_signature} /</span>
            ) : (
              <div className="space-y-3">
                <span className="text-[10px] text-yellow-550 flex items-center gap-1 font-bold">
                  <Clock className="w-3.5 h-3.5" /> Pending Signature (Please sign below before approving)
                </span>
                <form onSubmit={(e) => handleSignLease(e, 'landlord')} className="flex gap-2">
                  <input 
                    required 
                    type="text" 
                    value={signature} 
                    onChange={e => setSignature(e.target.value)} 
                    className="flex-1 text-xs px-4 py-2.5 border rounded-xl bg-white dark:bg-black/20 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Type your full legal name to sign" 
                  />
                  <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-750 cursor-pointer transition shrink-0 shadow-md shadow-blue-500/10">
                    Sign Contract
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Co-Landlord Signature if configured */}
          {selectedLease.co_landlord_name && (
            <div className="p-4 bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200/60 dark:border-white/[0.03] rounded-xl text-left space-y-3">
              <span className="text-gray-400 block text-xs mb-1 font-bold uppercase tracking-wider">Co-Landlord Signature ({selectedLease.co_landlord_name})</span>
              {selectedLease.co_landlord_signature ? (
                <span className="font-semibold text-gray-900 dark:text-white italic text-lg font-serif">/ {selectedLease.co_landlord_signature} /</span>
              ) : (
                <div className="space-y-3">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5" /> Pending Co-Landlord Signature (Optional)
                  </span>
                  {selectedLease.landlord_signature && (
                    <form onSubmit={(e) => handleSignLease(e, 'co_landlord')} className="flex gap-2">
                      <input 
                        required 
                        type="text" 
                        value={signature} 
                        onChange={e => setSignature(e.target.value)} 
                        className="flex-1 text-xs px-4 py-2.5 border rounded-xl bg-white dark:bg-black/20 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="Type your full legal name as Co-Landlord" 
                      />
                      <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-750 cursor-pointer transition shrink-0 shadow-md shadow-blue-500/10">
                        Sign
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t dark:border-white/5">
          {!selectedLease.landlord_signature ? (
            <span className="text-xs text-red-500 font-semibold text-left">
              ⚠️ You must type your legal name and sign the lease contract above before you can approve and activate it.
            </span>
          ) : (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold text-left">
              ✓ Contract signed. You are ready to approve and activate the lease.
            </span>
          )}
          <div className="flex items-center gap-3 shrink-0 ml-auto">
            <button
              type="button"
              onClick={() => {
                setCancelReasonText('');
                setShowCancelReasonModal(true);
              }}
              className="px-5 py-3 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 transition cursor-pointer"
            >
              Reject / Cancel Lease
            </button>
            <button
              type="button"
              disabled={!selectedLease.landlord_signature}
              onClick={handleLandlordApproveLease}
              className={`px-6 py-3 rounded-xl text-xs font-extrabold transition shadow-lg cursor-pointer shrink-0 ${
                selectedLease.landlord_signature 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20' 
                  : 'bg-slate-200 dark:bg-white/5 text-slate-405 dark:text-slate-500 cursor-not-allowed shadow-none'
              }`}
            >
              ✓ Approve Submission & Activate Lease
            </button>
          </div>
        </div>
      </div>
    );
  };

  async function handleLandlordApproveLease() {
    if (!selectedLease) return;
    try {
      const res = await API.post(`/rental/leases/${selectedLease.lease_id}/approve`);
      setLeases(prev => prev.map(l => l.lease_id === selectedLease.lease_id ? res.data : l));
      setSelectedLease(res.data);
      toast.success('Lease approved and activated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to approve lease.");
    }
  }

  async function handleLandlordCancelLease(e) {
    if (e) e.preventDefault();
    if (!selectedLease) return;
    if (!cancelReasonText.trim()) {
      toast.error("Please provide a reason for cancelling this lease.");
      return;
    }
    try {
      setIsSubmittingCancel(true);
      const res = await API.post(`/rental/leases/${selectedLease.lease_id}/cancel`, {
        reason: cancelReasonText.trim()
      });
      setLeases(prev => prev.map(l => l.lease_id === selectedLease.lease_id ? res.data : l));
      setSelectedLease(res.data);
      setShowCancelReasonModal(false);
      setCancelReasonText('');
      toast.success('Lease agreement has been cancelled and notification sent to tenant.');
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to cancel lease.");
    } finally {
      setIsSubmittingCancel(false);
    }
  }
  async function handleSignLease(e, overrideRole = null) {
    if (e) e.preventDefault();
    const roleToSign = overrideRole || (isLandlord ? signingAsRole : 'tenant');
    try {
      const res = await API.post(`/rental/leases/${selectedLease.lease_id}/sign`, {
        signature_text: signature,
        signing_as: roleToSign
      });
      setLeases(prev => prev.map(l => l.lease_id === selectedLease.lease_id ? res.data : l));
      setSelectedLease(res.data);
      setSignature('');
      toast.success('Agreement signed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to sign lease.");
    }
  }

  async function handleDeleteLease(leaseId, e) {
    e.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      title: "Delete Lease Agreement",
      message: "Are you sure you want to delete this lease agreement? This will also remove any associated invoices.",
      onConfirm: async () => {
        try {
          await API.delete(`/rental/leases/${leaseId}`);
          setLeases(prev => prev.filter(l => l.lease_id !== leaseId));
          if (selectedLease?.lease_id === leaseId) {
            setSelectedLease(null);
          }
          toast.success('Lease agreement deleted successfully.');
        } catch (err) {
          console.error("Error deleting lease:", err);
          toast.error("Failed to delete lease agreement.");
        }
      }
    });
  }

  const renderStep1 = () => {
    const selectedUnitObj = units.find(u => String(u.unit_id) === String(selectedUnitId));
    const isSingleFamilyOrCondo = selectedUnitObj && (
      selectedUnitObj.property_type === 'single_family' ||
      selectedUnitObj.property_type === 'condo' ||
      selectedUnitObj.unit_number === 'Single Family' ||
      selectedUnitObj.unit_number === 'Condo Unit'
    );
    return (
      <div className="space-y-5">
        <div className="border-b dark:border-white/5 pb-3">
          <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">Step 1 of 5</span>
          <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mt-1">Tenant Profile Details</h4>
          <p className="text-xs text-slate-400">Specify the property, the tenant's email address, full name, and phone number.</p>
          {selectedUnitObj && (
            <div className="mt-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3 animate-fade-in">
              <Home className="text-blue-600 dark:text-blue-400 w-4 h-4 shrink-0" />
              <div className="text-left">
                <span className="text-[9px] uppercase font-extrabold text-blue-600 dark:text-blue-400 tracking-wider block">Assigned Property</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white block">
                  {selectedUnitObj.property_name || 'N/A'}
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Row 1: Tenant Name & Tenant Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-655 dark:text-gray-400 tracking-wider mb-2">TENANT NAME</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <input 
                required 
                type="text" 
                value={tenantName} 
                onChange={e => {
                  const val = e.target.value;
                  if (/^[a-zA-Z\s.-]*$/.test(val)) {
                    setTenantName(val);
                  }
                }} 
                className={`w-full text-sm pl-10 pr-3.5 py-3 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none transition focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border-slate-200 dark:border-white/10 ${formErrors.tenantName ? 'border-red-500 ring-2 ring-red-500/10' : ''}`} 
                placeholder="John Doe" 
              />
            </div>
            {formErrors.tenantName && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5"><AlertCircle size={13}/>{formErrors.tenantName}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-655 dark:text-gray-400 tracking-wider mb-2">TENANT EMAIL</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <input 
                required 
                disabled={prefilledFromApp}
                type="email" 
                value={tenantEmail} 
                onChange={e => setTenantEmail(e.target.value)} 
                className={`w-full text-sm pl-10 pr-3.5 py-3 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none transition focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                  prefilledFromApp ? 'opacity-80 cursor-not-allowed bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-white/5' : 'border-slate-200 dark:border-white/10'
                } ${formErrors.tenantEmail ? 'border-red-500 ring-2 ring-red-500/10' : ''}`} 
                placeholder="tenant@example.com" 
              />
            </div>
            {formErrors.tenantEmail && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5"><AlertCircle size={13}/>{formErrors.tenantEmail}</p>}
          </div>
        </div>

        {/* Row 2: Select Apartment & Tenant Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-655 dark:text-gray-400 tracking-wider mb-2">
              {selectedUnitObj?.property_type === 'condo' || selectedUnitObj?.unit_number === 'Condo Unit' ? 'CONDO UNIT / APT NUMBER' : isSingleFamilyOrCondo ? 'PROPERTY TYPE' : 'SELECT APARTMENT'}
            </label>
            <div className="relative">
              <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              {selectedUnitObj && (selectedUnitObj.property_type === 'condo' || selectedUnitObj.unit_number === 'Condo Unit') ? (
                <input
                  type="text"
                  value={customUnitNo}
                  onChange={e => setCustomUnitNo(e.target.value)}
                  className="w-full text-sm pl-10 pr-3.5 py-3 border rounded-xl bg-white dark:bg-[#132030] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                  placeholder="e.g. Apt 5, Apt 6, 7"
                />
              ) : isSingleFamilyOrCondo ? (
                <input
                  type="text"
                  readOnly
                  value='Single Family Home (Entire Property)'
                  className="w-full text-sm pl-10 pr-3.5 py-3 border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed font-bold"
                />
              ) : (
                <select 
                  required 
                  disabled={prefilledFromApp}
                  value={selectedUnitId} 
                  onChange={e => setSelectedUnitId(e.target.value)} 
                  className={`w-full text-sm pl-10 pr-3.5 py-3 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none transition focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                    prefilledFromApp ? 'opacity-80 cursor-not-allowed bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-white/5' : 'border-slate-200 dark:border-white/10'
                  } ${formErrors.selectedUnitId ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}
                >
                  <option value="">-- Select an Apartment --</option>
                  {filteredUnits.map(u => (
                    <option key={u.unit_id} value={u.unit_id}>
                      {getUnitDisplayLabel(u)}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {!isSingleFamilyOrCondo && formErrors.selectedUnitId && (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5"><AlertCircle size={13}/>{formErrors.selectedUnitId}</p>
            )}
          </div>


        <div>
          <label className="block text-xs font-bold text-slate-655 dark:text-gray-400 tracking-wider mb-2">TENANT PHONE</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            <input 
              required 
              type="text" 
              value={tenantPhone} 
              maxLength={15} 
              onChange={e => {
                setTenantPhone(formatPhoneAsYouType(e.target.value));
              }} 
              className={`w-full text-sm pl-10 pr-3.5 py-3 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none transition focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border-slate-200 dark:border-white/10 ${formErrors.tenantPhone ? 'border-red-500 ring-2 ring-red-500/10' : ''}`} 
              placeholder="+1 (555) 000-0000" 
            />
          </div>
          {formErrors.tenantPhone && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5"><AlertCircle size={13}/>{formErrors.tenantPhone}</p>}
        </div>
      </div>
    </div>
    );
  };

  const renderStep2 = () => {
    const selectedUnitObj = units.find(u => String(u.unit_id) === String(selectedUnitId));
    return (
      <div className="space-y-5">
        <div className="border-b dark:border-white/5 pb-3">
          <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">Step 2 of 5</span>
          <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mt-1">Lease Term Details</h4>
          <p className="text-xs text-slate-400">Specify lease start date/duration, monthly rent amounts, late fee guidelines, and security deposits.</p>
        </div>

        {selectedUnitObj && (
          <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center gap-3">
            <Home className="text-blue-600 dark:text-blue-400" size={18} />
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider block">Property Name</span>
              <span className="text-xs font-bold text-slate-800 dark:text-white">
                {selectedUnitObj.property_name || 'N/A'}
                {selectedUnitObj.unit_number !== 'Single Family' && (
                  <> (Apt {customUnitNo || getCleanUnitNumber(selectedUnitObj.unit_number)})</>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Section 1: Lease Period Settings */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-1.5">
            <div className="h-3.5 w-1 bg-blue-600 rounded-full"></div>
            <h5 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
              Let's Setup Start Date & Lease Duration
            </h5>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-655 dark:text-gray-400 tracking-wider mb-2">START DATE</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                <input 
                  required 
                  type="date" 
                  min={editingLeaseId ? undefined : new Date().toISOString().split('T')[0]} 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                  className={`w-full text-sm pl-10 pr-3.5 py-3 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none transition focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border-slate-200 dark:border-white/10 ${formErrors.startDate ? 'border-red-500 ring-2 ring-red-500/10' : ''}`} 
                />
              </div>
              {formErrors.startDate && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5"><AlertCircle size={13}/>{formErrors.startDate}</p>}
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-655 dark:text-gray-400 tracking-wider mb-2">LEASE DURATION</label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                <select 
                  value={duration} 
                  onChange={e => setDuration(e.target.value)} 
                  className="w-full text-sm pl-10 pr-3.5 py-3 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none transition focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border-slate-200 dark:border-white/10"
                >
                  <option value="12">12 Months (1 Year)</option>
                  <option value="6">6 Months</option>
                  <option value="24">24 Months (2 Years)</option>
                  <option value="custom">Custom Months</option>
                </select>
              </div>
            </div>
          </div>

          {duration === 'custom' && (
            <div className="w-full md:w-1/2">
              <label className="block text-xs font-bold text-slate-655 dark:text-gray-400 tracking-wider mb-2">CUSTOM DURATION (MONTHS)</label>
              <input 
                type="number" 
                min="1" 
                value={customDuration} 
                onChange={e => setCustomDuration(e.target.value)} 
                placeholder="Enter number of months" 
                className={`w-full text-sm px-3.5 py-3 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white border-slate-200 dark:border-white/10 ${formErrors.duration ? 'border-red-500 ring-2 ring-red-500/10' : ''}`} 
              />
              {formErrors.duration && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5"><AlertCircle size={13}/>{formErrors.duration}</p>}
            </div>
          )}
        </div>
        
        {/* Section 2: Monthly Rent Settings */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-1.5">
            <div className="h-3.5 w-1 bg-blue-600 rounded-full"></div>
            <h5 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
              Monthly Rent & Rent Due Date
            </h5>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-655 dark:text-gray-400 tracking-wider mb-2">MONTHLY RENT ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                <input 
                  required 
                  type="number" 
                  value={rentAmount} 
                  onChange={e => setRentAmount(e.target.value)} 
                  className={`w-full text-sm pl-10 pr-3.5 py-3 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none transition focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border-slate-200 dark:border-white/10 ${formErrors.rentAmount ? 'border-red-500 ring-2 ring-red-500/10' : ''}`} 
                  placeholder="1500" 
                />
              </div>
              {formErrors.rentAmount && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5"><AlertCircle size={13}/>{formErrors.rentAmount}</p>}
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-655 dark:text-gray-400 tracking-wider mb-2">RENT DUE DAY</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                <select 
                  value={rentDueDate} 
                  onChange={e => setRentDueDate(e.target.value)} 
                  className="w-full text-sm pl-10 pr-3.5 py-3 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none transition focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border-slate-200 dark:border-white/10"
                >
                  {[...Array(28).keys()].map(x => (
                    <option key={x + 1} value={String(x + 1)}>{x + 1}{x === 0 ? 'st' : x === 1 ? 'nd' : x === 2 ? 'rd' : 'th'} day of month</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Security Deposit & Fees */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-1.5">
            <div className="h-3.5 w-1 bg-blue-600 rounded-full"></div>
            <h5 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
              Security Deposit & Move-in/out Fees
            </h5>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-655 dark:text-gray-400 tracking-wider mb-2">SECURITY DEPOSIT ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                <input 
                  required 
                  type="number" 
                  value={deposit} 
                  onChange={e => setDeposit(e.target.value)} 
                  className={`w-full text-sm pl-10 pr-3.5 py-3 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none transition focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border-slate-200 dark:border-white/10 ${formErrors.deposit ? 'border-red-500 ring-2 ring-red-500/10' : ''}`} 
                  placeholder="1500" 
                />
              </div>
              {formErrors.deposit && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5"><AlertCircle size={13}/>{formErrors.deposit}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-655 dark:text-gray-400 tracking-wider mb-2">MOVE-IN FEE ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-455 pointer-events-none" size={14} />
                  <input 
                    type="number" 
                    value={moveInFee} 
                    onChange={e => setMoveInFee(e.target.value)} 
                    className={`w-full text-sm pl-7 pr-3 py-3 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none transition focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border-slate-200 dark:border-white/10 ${formErrors.moveInFee ? 'border-red-500 ring-2 ring-red-500/10' : ''}`} 
                  />
                </div>
                {formErrors.moveInFee && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5"><AlertCircle size={13}/>{formErrors.moveInFee}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-655 dark:text-gray-400 tracking-wider mb-2">MOVE-OUT FEE ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-455 pointer-events-none" size={14} />
                  <input 
                    type="number" 
                    value={moveOutFee} 
                    onChange={e => setMoveOutFee(e.target.value)} 
                    className={`w-full text-sm pl-7 pr-3 py-3 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none transition focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border-slate-200 dark:border-white/10 ${formErrors.moveOutFee ? 'border-red-500 ring-2 ring-red-500/10' : ''}`} 
                  />
                </div>
                {formErrors.moveOutFee && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5"><AlertCircle size={13}/>{formErrors.moveOutFee}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Grace Period & Late Fee Guidelines */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-1.5">
            <div className="h-3.5 w-1 bg-blue-600 rounded-full"></div>
            <h5 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
              Grace Days & Late Fee Guidelines
            </h5>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-655 dark:text-gray-400 tracking-wider mb-2">GRACE DAYS</label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-405 pointer-events-none" size={16} />
                <input 
                  required 
                  type="number" 
                  value={gracePeriod} 
                  onChange={e => setGracePeriod(e.target.value)} 
                  className={`w-full text-sm pl-10 pr-3.5 py-3 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none transition focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border-slate-200 dark:border-white/10 ${formErrors.gracePeriod ? 'border-red-500 ring-2 ring-red-500/10' : ''}`} 
                />
              </div>
              {formErrors.gracePeriod && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5"><AlertCircle size={13}/>{formErrors.gracePeriod}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-655 dark:text-gray-400 tracking-wider mb-2">LATE FEE TYPE</label>
              <input 
                readOnly
                type="text" 
                value="Flat Fee" 
                className="w-full text-sm px-3.5 py-3 border rounded-xl bg-slate-100/50 dark:bg-[#111c2a]/40 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 outline-none cursor-not-allowed font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-655 dark:text-gray-400 tracking-wider mb-2">LATE FEE AMOUNT</label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                <input 
                  required 
                  type="number" 
                  value={feeAmount} 
                  onChange={e => setFeeAmount(e.target.value)} 
                  className={`w-full text-sm pl-10 pr-3.5 py-3 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none transition focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border-slate-200 dark:border-white/10 ${formErrors.feeAmount ? 'border-red-500 ring-2 ring-red-500/10' : ''}`} 
                />
              </div>
              {formErrors.feeAmount && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5"><AlertCircle size={13}/>{formErrors.feeAmount}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    const showUtilityFeeOption = 
      electricityPayee === 'landlord' || 
      waterPayee === 'landlord' || 
      gasPayee === 'landlord' || 
      internetPayee === 'landlord' || 
      trashPayee === 'landlord';

    const ownerPaidUtils = [];
    if (electricityPayee === 'landlord') ownerPaidUtils.push('Electricity');
    if (waterPayee === 'landlord') ownerPaidUtils.push('Water');
    if (gasPayee === 'landlord') ownerPaidUtils.push('Gas');
    if (internetPayee === 'landlord') ownerPaidUtils.push('Internet/Wifi');
    if (trashPayee === 'landlord') ownerPaidUtils.push('Trash Removal');

    return (
      <div className="space-y-5">
        <div className="border-b dark:border-white/5 pb-3">
          <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">Step 3 of 5</span>
          <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mt-1">Utilities & Options</h4>
          <p className="text-xs text-slate-400">Define utilities coverage, flat monthly utility charges, parking and pet details.</p>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-655 dark:text-gray-400 tracking-wider mb-2 uppercase text-left">Utilities Responsibility</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[
              { id: 'electricity', label: 'Electricity', payee: electricityPayee, setPayee: setElectricityPayee },
              { id: 'water', label: 'Water', payee: waterPayee, setPayee: setWaterPayee },
              { id: 'gas', label: 'Gas', payee: gasPayee, setPayee: setGasPayee },
              { id: 'internet', label: 'Internet/Wifi', payee: internetPayee, setPayee: setInternetPayee },
              { id: 'trash', label: 'Trash Removal', payee: trashPayee, setPayee: setTrashPayee }
            ].map(util => (
              <div key={util.id} className="space-y-1.5 text-left bg-slate-50/50 dark:bg-white/[0.01] p-3 rounded-2xl border border-slate-200/60 dark:border-white/[0.03]">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">{util.label}</span>
                <select
                  value={util.payee}
                  onChange={e => util.setPayee(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer font-medium"
                >
                  <option value="tenant">Paid by Tenant</option>
                  <option value="landlord">Paid by Owner</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        {showUtilityFeeOption && (
          <div className={`p-4 border rounded-2xl transition-all text-left ${hasUtilFee ? 'border-blue-500/30 bg-blue-500/[0.02]' : 'border-slate-200 dark:border-white/5 bg-slate-50/30 dark:bg-slate-950/5'} animate-fade-in`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-white block">Landlord will charge flat monthly utility fee?</span>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-slate-400">
                    Enable this to add a set utility cost directly to the ledger bill.
                  </span>
                  {ownerPaidUtils.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">•</span>
                      <span className="text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/30">
                        Covering: {ownerPaidUtils.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex w-32 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 p-0.5 bg-white dark:bg-[#132030] shrink-0">
                <button
                  type="button"
                  onClick={() => setHasUtilFee(true)}
                  className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition cursor-pointer ${
                    hasUtilFee 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-white bg-transparent'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setHasUtilFee(false)}
                  className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition cursor-pointer ${
                    !hasUtilFee 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-white bg-transparent'
                  }`}
                >
                  No
                </button>
              </div>
            </div>
            {hasUtilFee && (
              <div className="w-full md:w-1/2 pt-3 mt-2 border-t border-blue-500/10 animate-fade-in">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Utility Fee Amount ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  <input 
                    type="number" 
                    value={utilFee} 
                    onChange={e => setUtilFee(e.target.value)} 
                    className={`w-full text-sm pl-10 pr-3.5 py-2.5 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none transition focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border-slate-200 dark:border-white/10 ${formErrors.utilFee ? 'border-red-500 ring-2 ring-red-500/10' : ''}`} 
                    placeholder="e.g. 100" 
                  />
                </div>
                {formErrors.utilFee && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12}/>{formErrors.utilFee}</p>}
              </div>
            )}
          </div>
        )}



      <div>
        <label className="block text-xs font-bold text-slate-600 dark:text-gray-400 tracking-wider mb-2">KEY EXCHANGE & ENTRY INSTRUCTIONS (OPTIONAL)</label>
        <textarea 
          value={keyExchangeNotes} 
          onChange={e => setKeyExchangeNotes(e.target.value)} 
          maxLength={500}
          className="w-full text-sm px-3.5 py-2.5 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white border-slate-200 dark:border-white/10 h-20 resize-none outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
          placeholder="e.g. Keys will be left in lockbox code 1234, or pick up from office."
        />
      </div>
    </div>
  );
};

  const renderStep4 = () => (
    <div className="space-y-5">
      <div className="border-b dark:border-white/5 pb-3">
        <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">Step 4 of 9</span>
        <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mt-1">Lease Clauses</h4>
        <p className="text-xs text-slate-400">Add operational covenants or insert custom addenda terms.</p>
      </div>
      
      <div className="space-y-3 text-left">
        <label className="flex items-start gap-3 cursor-pointer p-4 border border-slate-200 dark:border-white/5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/[0.01] transition">
          <input 
            type="checkbox" 
            checked={clauseOnlineRent} 
            onChange={e => setClauseOnlineRent(e.target.checked)} 
            className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 mt-1" 
          />
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-white block">Online Rent Payment Agreement</span>
            <span className="text-[10px] text-slate-400">Tenant agrees to pay rent online via the secure landlord ledger portal.</span>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer p-4 border border-slate-200 dark:border-white/5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/[0.01] transition">
          <input 
            type="checkbox" 
            checked={clauseQuietHours} 
            onChange={e => setClauseQuietHours(e.target.checked)} 
            className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 mt-1" 
          />
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-white block">Community Quiet Hours</span>
            <span className="text-[10px] text-slate-400">Tenant agrees to respect community noise limits and quiet hours (10:00 PM to 8:00 AM).</span>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer p-4 border border-slate-200 dark:border-white/5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/[0.01] transition">
          <input 
            type="checkbox" 
            checked={clauseMaintenance} 
            onChange={e => setClauseMaintenance(e.target.checked)} 
            className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 mt-1" 
          />
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-white block">Maintenance & Repairs Covenant</span>
            <span className="text-[10px] text-slate-400">Tenant shall keep premises clean and report any maintenance needs immediately.</span>
          </div>
        </label>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-600 dark:text-gray-400 tracking-wider mb-2">CUSTOM ADDITIONAL CLAUSE (OPTIONAL)</label>
        <textarea 
          value={clauseCustomText} 
          onChange={e => setClauseCustomText(e.target.value)} 
          className="w-full text-sm p-3.5 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white border-slate-200 dark:border-white/10 h-28 resize-none outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
          placeholder="Type any custom regulations or requirements for this lease..." 
        />
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-5">
      <div className="border-b dark:border-white/5 pb-3 flex justify-between items-center text-left">
        <div>
          <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">Step 4 of 6</span>
          <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mt-1 flex items-center gap-1.5 font-bold">Rules <span className="text-xs font-normal text-slate-400 normal-case">(editable)</span></h4>
          <p className="text-xs text-slate-400">Establish and customize rules for residents living in the property.</p>
        </div>
        <button
          type="button"
          onClick={() => setRules(INITIAL_RULES)}
          className="text-[10px] uppercase px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 font-extrabold text-slate-600 dark:text-slate-400 transition cursor-pointer"
        >
          Restore Original Rules
        </button>
      </div>

      <div className="space-y-3 text-left">
        {rules.map((rule, idx) => (
          <div key={idx} className="p-4 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl bg-slate-50/20 dark:bg-slate-950/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-sm transition-all animate-fade-in">
            <div className="flex-1 text-xs text-slate-800 dark:text-slate-200">
              {editingRuleIndex === idx ? (
                <div className="space-y-2">
                  <textarea
                    value={editingRuleText}
                    onChange={e => setEditingRuleText(e.target.value)}
                    className="w-full text-xs p-3 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white border-slate-200 dark:border-white/10 h-20 resize-none outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...rules];
                        updated[idx] = editingRuleText;
                        setRules(updated);
                        setEditingRuleIndex(null);
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 transition cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingRuleIndex(null)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-350 text-[10px] font-bold rounded-lg transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="leading-relaxed">
                  <span className="font-bold mr-1.5 text-slate-400 dark:text-slate-500">{idx + 1}.</span>
                  {rule}
                </div>
              )}
            </div>
             {editingRuleIndex !== idx && (
              <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingRuleIndex(idx);
                    setEditingRuleText(rule);
                  }}
                  className="w-7 h-7 flex items-center justify-center border border-slate-200 dark:border-white/10 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-blue-600 dark:text-blue-400 transition cursor-pointer"
                  title="Edit Rule"
                >
                  <Edit3 size={12} />
                </button>
                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => {
                    setRules(rules.filter((_, i) => i !== idx));
                  }}
                  className="w-7 h-7 flex items-center justify-center border border-slate-200 dark:border-white/10 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition cursor-pointer"
                  title="Delete Rule"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
        ))}
        
        {/* Add Custom Rule Button */}
        <button
          type="button"
          onClick={() => {
            const newRule = "Tenant shall agree to comply with all common area policies and guidelines of the property.";
            setRules([...rules, newRule]);
            setEditingRuleIndex(rules.length);
            setEditingRuleText(newRule);
          }}
          className="w-full py-3 border border-dashed border-blue-500/40 hover:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50/20 dark:hover:bg-blue-500/[0.01] text-xs font-bold rounded-2xl transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus size={14} /> Add Custom Rule
        </button>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-5">
      <div className="border-b dark:border-white/5 pb-3">
        <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">Step 6 of 9</span>
        <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mt-1">Legal Disclosures</h4>
        <p className="text-xs text-slate-400">Select legally mandated tenant notices and hazard statements.</p>
      </div>

      <div className="space-y-3 text-left">
        <label className="flex items-start gap-3 cursor-pointer p-4 border border-slate-200 dark:border-white/5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/[0.01] transition">
          <input 
            type="checkbox" 
            checked={disclosureLeadPaint} 
            onChange={e => setDisclosureLeadPaint(e.target.checked)} 
            className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 mt-1" 
          />
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-white block">Lead-Based Paint Hazard Warning</span>
            <span className="text-[10px] text-slate-400">Landlord discloses presence of lead-based paint and hazards (mandated for pre-1978 properties).</span>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer p-4 border border-slate-200 dark:border-white/5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/[0.01] transition">
          <input 
            type="checkbox" 
            checked={disclosureMold} 
            onChange={e => setDisclosureMold(e.target.checked)} 
            className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 mt-1" 
          />
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-white block">Mold Warning & Preventative Addendum</span>
            <span className="text-[10px] text-slate-400">Tenant acknowledges receipt of information regarding mold prevention and agreement to ventilate.</span>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer p-4 border border-slate-200 dark:border-white/5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/[0.01] transition">
          <input 
            type="checkbox" 
            checked={disclosureBedBugs} 
            onChange={e => setDisclosureBedBugs(e.target.checked)} 
            className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 mt-1" 
          />
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-white block">Bed Bug Infestation History & Info</span>
            <span className="text-[10px] text-slate-400">Tenant agrees to report active infestation and landlord confirms unit inspection.</span>
          </div>
        </label>
      </div>
    </div>
  );

  const renderStep7 = () => (
    <div className="space-y-5">
      <div className="border-b dark:border-white/5 pb-3 text-left">
        <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">Step 7 of 9</span>
        <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mt-1">Attachments & Addenda</h4>
        <p className="text-xs text-slate-400">Upload or attach disclosures, rules, or guides to include with the lease agreement.</p>
      </div>

      <div className="space-y-3 text-left">
        {attachments.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl text-center bg-slate-50/10">
            <Paperclip size={24} className="mx-auto text-slate-400 mb-2" />
            <p className="text-xs text-slate-500 font-semibold">No attachments added yet.</p>
            <p className="text-[10px] text-slate-400">Click below to upload or add documents.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {attachments.map((att) => (
              <div key={att.id} className="p-4 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl bg-slate-50/20 dark:bg-slate-950/10 flex justify-between items-center gap-4 hover:shadow-sm transition animate-fade-in">
                <div className="flex-1 min-w-0 font-bold">
                  {editingAttachmentId === att.id ? (
                    <div className="flex gap-2 max-w-md">
                      <input
                        type="text"
                        value={editingAttachmentName}
                        onChange={e => setEditingAttachmentName(e.target.value)}
                        className="flex-1 text-xs px-3 py-1.5 border rounded-lg bg-white dark:bg-[#132030] text-slate-900 dark:text-white border-slate-200 dark:border-white/10 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            setAttachments(attachments.map(a => a.id === att.id ? { ...a, name: editingAttachmentName } : a));
                            setEditingAttachmentId(null);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setAttachments(attachments.map(a => a.id === att.id ? { ...a, name: editingAttachmentName } : a));
                          setEditingAttachmentId(null);
                        }}
                        className="px-2.5 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{att.name}</span>
                    </div>
                  )}
                  {editingAttachmentId !== att.id && (
                    <div className="flex gap-3 mt-1.5 text-[10px] text-slate-400 font-semibold">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAttachmentId(att.id);
                          setEditingAttachmentName(att.name);
                        }}
                        className="hover:text-blue-500 transition cursor-pointer"
                      >
                        Rename
                      </button>
                      <span className="opacity-30">|</span>
                      <button
                        type="button"
                        onClick={() => handleDownloadAttachment(att)}
                        className="hover:text-blue-500 transition flex items-center gap-1 cursor-pointer"
                      >
                        <Download size={10} /> Download
                      </button>
                    </div>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => setAttachments(attachments.filter(a => a.id !== att.id))}
                  className="text-xs text-red-500 hover:text-red-600 font-bold uppercase tracking-wider shrink-0 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1.5 rounded-xl transition cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
        />
        
        {/* Upload Other Files Button */}
        <button
          type="button"
          onClick={handleUploadClick}
          className="w-full py-3 border border-dashed border-blue-500/40 hover:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50/20 dark:hover:bg-blue-500/[0.01] text-xs font-bold rounded-2xl transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Paperclip size={14} /> Upload other files
        </button>
      </div>
    </div>
  );

  const renderStep8 = () => (
    <div className="space-y-5">
      <div className="border-b dark:border-white/5 pb-3">
        <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">Step 4 of 5</span>
        <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mt-1">Lessor (Landlord) Information</h4>
        <p className="text-xs text-slate-400">Provide official contact information for payments and notices.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold text-slate-655 dark:text-gray-400 tracking-wider mb-2">PRIMARY LANDLORD NAME</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            <input 
              required 
              type="text" 
              value={lessorFullName} 
              onChange={e => {
                const val = e.target.value.replace(/[^a-zA-Z\s.-]/g, '');
                setLessorFullName(val);
                if (formErrors.lessorFullName) {
                  setFormErrors(prev => ({ ...prev, lessorFullName: '' }));
                }
              }} 
              className={`w-full text-sm pl-10 pr-3.5 py-3 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none transition focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border-slate-200 dark:border-white/10 ${formErrors.lessorFullName ? 'border-red-500 ring-2 ring-red-500/10' : ''}`} 
              placeholder="First and Last name" 
            />
          </div>
          {formErrors.lessorFullName && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5"><AlertCircle size={13}/>{formErrors.lessorFullName}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-655 dark:text-gray-400 tracking-wider mb-2">CO-LANDLORD NAME (OPTIONAL)</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-405 pointer-events-none" size={16} />
            <input 
              type="text" 
              value={coLandlordName} 
              onChange={e => {
                const val = e.target.value.replace(/[^a-zA-Z\s.-]/g, '');
                setCoLandlordName(val);
                if (formErrors.coLandlordName) {
                  setFormErrors(prev => ({ ...prev, coLandlordName: '' }));
                }
              }} 
              className={`w-full text-sm pl-10 pr-3.5 py-3 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none transition focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border-slate-200 dark:border-white/10 ${formErrors.coLandlordName ? 'border-red-500 ring-2 ring-red-500/10' : ''}`} 
              placeholder="e.g. Joint Owner Name" 
            />
          </div>
          {formErrors.coLandlordName && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5"><AlertCircle size={13}/>{formErrors.coLandlordName}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold text-slate-655 dark:text-gray-400 tracking-wider mb-2">CONTACT PHONE</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            <input 
              required 
              type="tel" 
              value={lessorPhone} 
              onChange={e => {
                const val = formatPhoneAsYouType(e.target.value);
                setLessorPhone(val);
                if (formErrors.lessorPhone) {
                  setFormErrors(prev => ({ ...prev, lessorPhone: '' }));
                }
              }} 
              className={`w-full text-sm pl-10 pr-3.5 py-3 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none transition focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border-slate-200 dark:border-white/10 ${formErrors.lessorPhone ? 'border-red-500 ring-2 ring-red-500/10' : ''}`} 
              placeholder="10-digit phone number" 
            />
          </div>
          {formErrors.lessorPhone && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5"><AlertCircle size={13}/>{formErrors.lessorPhone}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-655 dark:text-gray-400 tracking-wider mb-2">CONTACT EMAIL</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            <input 
              required 
              type="email" 
              value={lessorEmail} 
              onChange={e => {
                const val = e.target.value.replace(/\s/g, '');
                setLessorEmail(val);
                if (formErrors.lessorEmail) {
                  setFormErrors(prev => ({ ...prev, lessorEmail: '' }));
                }
              }} 
              className={`w-full text-sm pl-10 pr-3.5 py-3 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none transition focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border-slate-200 dark:border-white/10 ${formErrors.lessorEmail ? 'border-red-500 ring-2 ring-red-500/10' : ''}`} 
              placeholder="landlord@example.com" 
            />
          </div>
          {formErrors.lessorEmail && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5"><AlertCircle size={13}/>{formErrors.lessorEmail}</p>}
        </div>
      </div>

      <div className="relative">
        <label className="block text-xs font-bold text-slate-655 dark:text-gray-400 tracking-wider mb-2">NOTICE / RENT PAYMENT ADDRESS (OPTIONAL)</label>
        <div className="relative">
          <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          <input 
            type="text" 
            value={lessorAddress} 
            onChange={e => {
              handleLessorAddressChange(e.target.value);
              if (formErrors.lessorAddress) {
                setFormErrors(prev => ({ ...prev, lessorAddress: '' }));
              }
            }} 
            className={`w-full text-sm pl-10 pr-3.5 py-3 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white outline-none transition focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border-slate-200 dark:border-white/10 ${formErrors.lessorAddress ? 'border-red-500 ring-2 ring-red-500/10' : ''}`} 
            placeholder="Official address to send checks/notices" 
          />
          
          {lessorAddressSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 bottom-full mb-2 bg-white dark:bg-[#1D2B3A] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar text-left">
              {lessorAddressSuggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectLessorSuggestion(suggestion)}
                  className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer text-xs font-semibold border-b border-slate-100 dark:border-white/[0.03] last:border-none text-slate-700 dark:text-slate-350"
                >
                  {suggestion.formatted}
                </div>
              ))}
            </div>
          )}
        </div>
        {formErrors.lessorAddress && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5"><AlertCircle size={13}/>{formErrors.lessorAddress}</p>}
      </div>
    </div>
  );

  const renderStep9 = () => (
    <div className="space-y-5">
      <div className="border-b dark:border-white/5 pb-3">
        <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">Step 5 of 5</span>
        <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mt-1">Terms Agreement & Final Review</h4>
        <p className="text-xs text-slate-400">Customize property rules, review the compiled agreement draft, and sign to finalize.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Rules & Policies Column */}
        <div className="lg:col-span-5 flex flex-col bg-slate-50/30 dark:bg-slate-900/30 border border-slate-200/60 dark:border-white/5 rounded-2xl p-4 lg:h-[calc(100vh-295px)] min-h-[420px] lg:min-h-0">
          <div className="flex justify-between items-center text-left border-b dark:border-white/5 pb-2.5 shrink-0">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white block">Rules & Policies</span>
              <span className="text-[10px] text-slate-400">Customize rules for residents.</span>
            </div>
            <button
              type="button"
              onClick={() => setRules(INITIAL_RULES)}
              className="text-[9px] uppercase px-2.5 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 font-extrabold text-slate-600 dark:text-slate-400 transition cursor-pointer"
            >
              Restore Defaults
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 py-3 custom-scrollbar text-left">
            {rules.map((rule, idx) => (
              <div key={idx} className="p-3 border border-slate-200/80 dark:border-white/[0.08] rounded-xl bg-slate-50/20 dark:bg-slate-950/10 flex flex-col justify-between gap-2.5 hover:shadow-sm transition-all animate-fade-in">
                <div className="text-xs text-slate-800 dark:text-slate-200">
                  {editingRuleIndex === idx ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingRuleText}
                        onChange={e => setEditingRuleText(e.target.value)}
                        className="w-full text-xs p-2.5 border rounded-xl bg-white dark:bg-[#132030] text-slate-900 dark:text-white border-slate-200 dark:border-white/10 h-16 resize-none outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...rules];
                            updated[idx] = editingRuleText;
                            setRules(updated);
                            setEditingRuleIndex(null);
                          }}
                          className="px-2.5 py-1.5 bg-blue-600 text-white text-[9px] font-bold rounded-lg hover:bg-blue-700 transition cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingRuleIndex(null)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-350 text-[9px] font-bold rounded-lg transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="leading-relaxed">
                      <span className="font-bold mr-1.5 text-slate-400 dark:text-slate-500">{idx + 1}.</span>
                      {rule}
                    </div>
                  )}
                </div>
                {editingRuleIndex !== idx && (
                  <div className="flex items-center gap-1.5 justify-end shrink-0 border-t dark:border-white/5 pt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRuleIndex(idx);
                        setEditingRuleText(rule);
                      }}
                      className="w-6 h-6 flex items-center justify-center border border-slate-200 dark:border-white/10 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-blue-600 dark:text-blue-400 transition cursor-pointer"
                      title="Edit Rule"
                    >
                      <Edit3 size={10} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRules(rules.filter((_, i) => i !== idx));
                      }}
                      className="w-6 h-6 flex items-center justify-center border border-slate-200 dark:border-white/10 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition cursor-pointer"
                      title="Delete Rule"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2.5 border-t dark:border-white/5 shrink-0">
            <button
              type="button"
              onClick={() => {
                const newRule = "Tenant shall agree to comply with all common area policies and guidelines of the property.";
                setRules([...rules, newRule]);
                setEditingRuleIndex(rules.length);
                setEditingRuleText(newRule);
              }}
              className="w-full py-2.5 border border-dashed border-blue-500/40 hover:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50/20 dark:hover:bg-blue-500/[0.01] text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus size={12} /> Add Custom Rule
            </button>
          </div>
        </div>

        {/* Live Draft and Terms Column */}
        <div className="lg:col-span-7 flex flex-col lg:h-[calc(100vh-295px)] min-h-[420px] lg:min-h-0 space-y-4">
          <div className="flex-1 flex flex-col min-h-0 text-left">
            <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wider mb-2 uppercase text-left shrink-0">Live Compiled Lease Text</label>
            <textarea 
              value={leaseText} 
              onChange={e => setLeaseText(e.target.value)} 
              className="flex-1 w-full p-4 border border-blue-500/20 dark:border-white/10 rounded-2xl bg-slate-50 dark:bg-slate-950/40 text-xs font-mono text-slate-800 dark:text-slate-350 leading-relaxed overflow-y-auto shadow-inner resize-none focus:outline-none focus:border-blue-500 min-h-0" 
            />
          </div>

          <div className="p-3 bg-slate-50/50 dark:bg-slate-950/10 border border-slate-200 dark:border-white/5 rounded-xl text-left shrink-0">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input 
                type="checkbox" 
                checked={termsAgreed} 
                onChange={e => setTermsAgreed(e.target.checked)} 
                className="w-3.5 h-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 mt-0.5" 
              />
              <div>
                <span className="text-[11px] font-bold text-slate-800 dark:text-white block">I verify and agree to the terms in this lease agreement.</span>
                <span className="text-[9px] text-slate-400">Checking this will finalize the agreement and send an official invitation to the tenant.</span>
              </div>
            </label>
            {formErrors.termsAgreed && <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11}/>{formErrors.termsAgreed}</p>}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (showCreateModal) {
    return (
      <div className="p-2 relative text-slate-900 dark:text-white text-left animate-fade-in">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-220px)] lg:h-[calc(100vh-240px)] min-h-[420px]">
          {/* Top Navigation / Progress Bar */}
          <div className="w-full bg-slate-50 dark:bg-[#0B1520] border-b border-slate-200 dark:border-white/5 px-6 py-4 flex items-center justify-between gap-4 select-none">
            {/* Column 1: Title */}
            <div className="text-left shrink-0 w-32">
              <h3 className="text-xs font-black text-blue-600 dark:text-blue-400 tracking-widest uppercase">
                {editingLeaseId ? 'Lease Editor' : 'Lease Builder'}
              </h3>
            </div>

            {/* Column 2: Horizontal Stepper (Centered, No Scrollbar) */}
            <div className="flex items-center justify-center gap-2 flex-grow max-w-xl mx-auto py-1">
              {[
                { number: 1 },
                { number: 2 },
                { number: 3 },
                { number: 4 },
                { number: 5 }
              ].map((step, idx) => {
                const isCompleted = step.number < currentStep && Object.keys(validateStep(step.number)).length === 0;
                const isActive = currentStep === step.number;
                
                return (
                  <div key={step.number} className="flex items-center gap-2 shrink-0">
                    {/* Step Circle */}
                    <button
                      type="button"
                      onClick={() => handleStepClick(step.number)}
                      className="focus:outline-none cursor-pointer"
                      title={`Step ${step.number}`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all border shrink-0 ${
                        isActive 
                          ? 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-500/20 shadow-md shadow-blue-500/10' 
                          : isCompleted
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/10'
                            : 'bg-white dark:bg-[#132030] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-350 dark:hover:border-white/20'
                      }`}>
                        {isCompleted ? '✓' : step.number}
                      </div>
                    </button>

                    {/* Connector Line */}
                    {idx < 4 && (
                      <div className="w-10 sm:w-16 h-0.5 bg-slate-200 dark:bg-white/10 relative shrink-0">
                        <div className={`absolute inset-y-0 left-0 bg-blue-600 transition-all duration-300 ${
                          step.number < currentStep ? 'w-full' : 'w-0'
                        }`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Column 3: Cancel Button (Right Aligned) */}
            <div className="w-32 text-right shrink-0">
              <button
                type="button"
                onClick={() => { resetWizardForm(); setShowCreateModal(false); }}
                className="px-3.5 py-1.5 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-white/5 text-slate-550 dark:text-slate-400 font-extrabold transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Active Step Panel */}
          <div className="flex-grow flex-shrink flex flex-col justify-between bg-white dark:bg-slate-900 min-h-0 overflow-hidden">
            {/* Form Content Area */}
            <div className="flex-grow p-6 text-left overflow-y-auto">
              {errorMsg && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-xl mb-4 border border-red-500/20">{errorMsg}</p>}
              {!editingLeaseId && !hasVacantUnits && currentStep === 1 && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>Warning: There are no vacant units available in your portfolio. You cannot create a new lease agreement until you have a vacant unit.</span>
                </div>
              )}
              
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep8()}
              {currentStep === 5 && renderStep9()}
            </div>

            {/* Wizard Footer Controls */}
            <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20 flex justify-end items-center shrink-0">
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                )}
                
                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    Next <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!editingLeaseId && !hasVacantUnits && !prefilledFromApp}
                    onClick={handleCreateLease}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition shadow-lg shadow-blue-500/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    {editingLeaseId ? "Save Lease Changes" : "Create & Invite Tenant"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 relative text-slate-900 dark:text-white text-left animate-fade-in">
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
        
        {/* Header Section */}
        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="text-slate-800 dark:text-white font-medium text-sm flex items-center gap-2">
              <FileText size={16} /> Lease Agreements Directory
            </div>
            {isLandlord && (
              <button 
                onClick={() => { setShowCreateModal(true); setFormErrors({}); setErrorMsg(''); }}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all shadow-md shadow-blue-500/20 whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create Lease
              </button>
            )}
          </div>
          
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by tenant email or unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-2xl pl-9 pr-9 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {(() => {
          const filteredLeases = leases.filter(l => {
            const matchesSearch = 
              l.tenant_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              l.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (l.unit?.unit_number && String(l.unit.unit_number).toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesProperty = selectedPropertyFilterId === 'all' || String(l.unit?.property_id) === String(selectedPropertyFilterId);
            return matchesSearch && matchesProperty;
          });

          if (filteredLeases.length === 0) {
            return <div className="py-12 text-center text-slate-400 text-sm">No leases found matching your search.</div>;
          }

          return (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 uppercase text-[10px] tracking-wider font-bold text-slate-500 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-4">Tenant Email</th>
                    <th className="px-4 py-4">Applied Unit</th>
                    <th className="px-4 py-4">Monthly Rent</th>
                    <th className="px-4 py-4">Lease Term</th>
                    <th className="px-4 py-4 text-right">Status</th>
                    <th className="px-4 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-gray-300">
                  {filteredLeases.map(l => (
                    <tr 
                      key={l.lease_id} 
                      onClick={() => setSelectedLease(l)}
                      className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                    >
                      <td className="px-4 py-4 text-slate-600 dark:text-gray-400 font-medium">{l.tenant_email}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-start gap-1">
                          {l.unit?.unit_number === 'Single Family' ? (
                            <span className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-450 px-2.5 py-0.5 rounded text-[10px] font-bold border border-emerald-500/20 whitespace-nowrap inline-block animate-fade-in">
                              Single Family
                            </span>
                          ) : l.unit?.unit_number === 'Condo Unit' ? (
                            <span className="bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 px-2.5 py-0.5 rounded text-[10px] font-bold border border-indigo-500/20 whitespace-nowrap inline-block animate-fade-in">
                              Condo
                            </span>
                          ) : (
                            <span className="bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 px-2.5 py-0.5 rounded text-[10px] font-bold border border-blue-500/20 whitespace-nowrap inline-block animate-fade-in">
                            {l.unit?.property_type === 'condo' ? 'Apt' : 'Unit'} {getCleanUnitNumber(l.unit?.unit_number)}
                            </span>
                          )}
                          {(l.property_name || l.unit?.property_name) && (
                            <span className="text-[10px] text-slate-455 dark:text-slate-400 font-semibold tracking-wide truncate max-w-[150px]">
                              {l.property_name || l.unit?.property_name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono font-bold text-slate-900 dark:text-white font-semibold">
                        ${l.rent_amount}/mo
                      </td>
                      <td className="px-4 py-4 text-slate-600 dark:text-gray-450 text-xs">
                        {l.start_date} to {l.end_date}
                      </td>
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                          l.status === 'ACTIVE'
                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20'
                            : l.status === 'PENDING_LANDLORD_APPROVAL'
                              ? 'text-orange-600 dark:text-orange-400 bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/20 animate-pulse'
                              : l.status === 'PENDING_TENANT_REVIEW'
                                ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20'
                                : 'text-slate-650 dark:text-slate-400 bg-slate-500/10 dark:bg-slate-500/20 border-slate-500/20'
                        }`}>
                          {l.status === 'PENDING_LANDLORD_APPROVAL' ? (isLandlord ? 'Ready to Review' : 'Sent for Review') : l.status === 'PENDING_TENANT_REVIEW' ? 'Awaiting Tenant' : l.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right whitespace-nowrap space-x-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSelectedLease(l); }}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-blue-500 transition cursor-pointer"
                          title="Sign / View"
                        >
                          <Eye size={14} />
                        </button>
                        {isLandlord && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => handleEditLeaseClick(l, e)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-indigo-500 transition cursor-pointer"
                              title="Edit Lease"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteLease(l.lease_id, e)}
                              className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition cursor-pointer"
                              title="Delete Agreement"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}

                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

        {/* Lease Viewer & Digital Signature Modal */}
        {selectedLease && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] w-full max-w-4xl rounded-2xl p-6 space-y-6 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b dark:border-white/5 pb-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" /> Lease Agreement Contract
                  </h2>
                  <p className="text-xs text-gray-450 dark:text-gray-400 mt-1">Tenant Email: {selectedLease.tenant_email}</p>
                </div>
                <button 
                  onClick={() => setSelectedLease(null)} 
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>


              {isLandlord && selectedLease.unit_change_requested && (
                <div className="p-3.5 bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 rounded-xl text-xs font-semibold text-left flex flex-col gap-1.5">
                  <span className="font-bold flex items-center gap-1">⚠️ Tenant requested a unit change:</span>
                  <span className="bg-white/40 dark:bg-black/25 p-2.5 rounded-lg italic text-xs">
                    "{selectedLease.unit_change_request_notes}"
                  </span>
                  <span className="text-[10px] text-slate-450 dark:text-slate-400 font-medium">
                    To satisfy this request, close this modal and click the <strong>"Edit Lease"</strong> button (pencil icon) in the actions column of the leases table. Change the assigned unit, save changes, and the agreement text will automatically update.
                  </span>
                </div>
              )}

              {/* Onboarding Wizard for Tenant */}
              {!isLandlord && (selectedLease.status === 'PENDING_TENANT_REVIEW' || selectedLease.status === 'PENDING_SIGNATURE') ? (
                renderTenantOnboardingFlow()
              ) : (
                <>
                  {/* Cancellation Reason Alert */}
                  {selectedLease.status === 'CANCELLED' && (
                    <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-left space-y-1.5 animate-fade-in mb-4">
                      <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Lease Agreement Cancelled / Rejected</span>
                      </div>
                      {selectedLease.rejection_reason && (
                        <p className="text-xs text-rose-800 dark:text-rose-200 leading-relaxed font-medium pl-6">
                          <strong>Reason from Landlord:</strong> "{selectedLease.rejection_reason}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Lease parameters grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-gray-50/50 dark:bg-white/[0.01] p-4 rounded-xl border border-gray-200/60 dark:border-white/[0.03] text-left">
                    <div>
                      <span className="text-gray-400 block text-xs">Rent</span>
                      <span className="font-bold text-gray-950 dark:text-white">${selectedLease.rent_amount}/mo</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-xs">Security Deposit</span>
                      <span className="font-bold text-gray-950 dark:text-white">${selectedLease.security_deposit}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-xs">Start Date</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{selectedLease.start_date}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-xs">End Date</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{selectedLease.end_date}</span>
                    </div>
                  </div>

                  {/* Additional Fees Breakdown */}
                  {(selectedLease.utilities_fee > 0 || selectedLease.parking_fee > 0 || selectedLease.pet_fee > 0) && (
                    <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/[0.01] text-xs space-y-2 text-left">
                      <span className="font-bold text-gray-800 dark:text-gray-300 uppercase tracking-wider block">Additional Monthly Charge Items</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {selectedLease.utilities_fee > 0 && (
                          <div className="bg-white dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-200/50 dark:border-white/5">
                            <span className="text-gray-400 block">Utilities</span>
                            <span className="font-bold dark:text-white">${selectedLease.utilities_fee}/mo</span>
                          </div>
                        )}
                        {selectedLease.parking_fee > 0 && (
                          <div className="bg-white dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-200/50 dark:border-white/5">
                            <span className="text-gray-400 block">Parking</span>
                            <span className="font-bold dark:text-white">${selectedLease.parking_fee}/mo</span>
                          </div>
                        )}
                        {selectedLease.pet_fee > 0 && (
                          <div className="bg-white dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-200/50 dark:border-white/5">
                            <span className="text-gray-400 block">Pet Fee</span>
                            <span className="font-bold dark:text-white">${selectedLease.pet_fee}/mo</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Agreement text body */}
                  <div className="p-5 border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50/20 dark:bg-black/20 text-sm max-h-60 overflow-y-auto font-mono text-gray-800 dark:text-gray-300 leading-relaxed whitespace-pre-wrap text-left">
                    {selectedLease.lease_agreement_text}
                  </div>

                  {/* Landlord Approval Panel if awaiting approval */}
                  {isLandlord && selectedLease.status === 'PENDING_LANDLORD_APPROVAL' ? (
                    renderLandlordApprovalPanel()
                  ) : (
                    <>
                      {/* Tenant Identity & Income Verification Files */}
                      {uploadedDocs && uploadedDocs.length > 0 && (() => {
                        const docLabels = { 
                          PAY_SLIP: "Pay Slip / Income Proof", 
                          DRIVING_LICENSE: "Driving License / ID", 
                          ADDRESS_PROOF: "Address Proof" 
                        };
                        return (
                          <div className="space-y-3 mb-6">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-left">Tenant Identity & Income Verification Files</span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              {["PAY_SLIP", "DRIVING_LICENSE", "ADDRESS_PROOF"].map(type => {
                                const doc = uploadedDocs.find(d => d.doc_type === type);
                                if (!doc) return null;
                                return (
                                  <div key={type} className="p-3 border border-slate-200/5 rounded-xl flex items-center justify-between gap-3 bg-slate-50/20 dark:bg-white/[0.01]">
                                    <div className="text-left min-w-0 flex-1">
                                      <span className="text-xs font-bold text-slate-800 dark:text-white block truncate" title={docLabels[type]}>{docLabels[type]}</span>
                                      <span className="text-[9px] text-emerald-500 font-semibold block">✓ Uploaded</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleViewDoc(doc.document_id, doc.original_name)}
                                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                                      >
                                        View
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadDoc(doc.document_id, doc.original_name)}
                                        className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-md shadow-blue-500/10 cursor-pointer flex items-center justify-center"
                                        title="Download File"
                                      >
                                        <Download size={12} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Signatures display */}
                      <div className={`grid grid-cols-1 ${selectedLease.co_landlord_name ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6 border-t border-gray-100 dark:border-white/5 pt-6 text-sm text-left`}>
                        <div className="p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01]">
                          <span className="text-gray-400 block text-xs mb-1">Primary Landlord Signature</span>
                          {selectedLease.landlord_signature ? (
                            <span className="font-semibold text-gray-900 dark:text-white italic text-lg font-serif">/ {selectedLease.landlord_signature} /</span>
                          ) : (
                            <span className="text-yellow-550 text-xs flex items-center gap-1 font-bold">
                              <Clock className="w-3.5 h-3.5" /> Pending Landlord Sign
                            </span>
                          )}
                        </div>

                        {selectedLease.co_landlord_name && (
                          <div className="p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01]">
                            <span className="text-gray-400 block text-xs mb-1">Co-Landlord Signature ({selectedLease.co_landlord_name})</span>
                            {selectedLease.co_landlord_signature ? (
                              <span className="font-semibold text-gray-900 dark:text-white italic text-lg font-serif">/ {selectedLease.co_landlord_signature} /</span>
                            ) : (
                              <span className="text-slate-400 text-xs flex items-center gap-1 font-medium">
                                <Clock className="w-3.5 h-3.5" /> Pending Co-Landlord (Optional)
                              </span>
                            )}
                          </div>
                        )}

                        <div className="p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01]">
                          <span className="text-gray-400 block text-xs mb-1">Tenant Signature</span>
                          {selectedLease.tenant_signature ? (
                            <span className="font-semibold text-gray-900 dark:text-white italic text-lg font-serif">/ {selectedLease.tenant_signature} /</span>
                          ) : (
                            <span className="text-yellow-550 text-xs flex items-center gap-1 font-bold">
                              <Clock className="w-3.5 h-3.5" /> Pending Tenant Sign
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Signing Pad Form (Legacy compatibility) */}
                      {showSignPad && (
                        <form onSubmit={handleSignLease} className="p-5 border border-dashed border-blue-500/30 rounded-xl bg-blue-500/[0.02] space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <PenTool className="w-5 h-5 text-blue-500" />
                              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider text-left">E-Signature Pad</h3>
                            </div>
                            {isLandlord && selectedLease.co_landlord_name && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Signing As:</span>
                                <select 
                                  value={signingAsRole} 
                                  onChange={e => setSigningAsRole(e.target.value)} 
                                  className="text-xs px-2.5 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-[#1a2736] text-slate-900 dark:text-white outline-none cursor-pointer font-bold"
                                >
                                  {!selectedLease.landlord_signature && (
                                    <option value="landlord">Primary Landlord</option>
                                  )}
                                  {!selectedLease.co_landlord_signature && (
                                    <option value="co_landlord">Co-Landlord ({selectedLease.co_landlord_name})</option>
                                  )}
                                </select>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2 text-left">
                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 tracking-wider">TYPE YOUR LEGAL FULL NAME TO SIGN</label>
                            <div className="flex gap-2">
                              <input 
                                required 
                                type="text" 
                                value={signature} 
                                onChange={e=>setSignature(e.target.value)} 
                                className="flex-1 text-sm px-4 py-2.5 border rounded-lg bg-white dark:bg-black/20 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
                                placeholder="e.g. Johnathan Doe" 
                              />
                              <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 cursor-pointer transition">
                                Sign Contract
                              </button>
                            </div>
                          </div>
                        </form>
                      )}
                    </>
                  )}
                </>
              )}

              <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-white/5">
                <button
                  onClick={() => setSelectedLease(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-sm transition-all"
                >
                  Close Contract
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Tenant Unit Change Request Modal */}
      {showTenantChangeUnitModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e2a3b] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl animate-scale-up text-slate-900 dark:text-white text-left">
            <div className="flex justify-between items-center border-b dark:border-white/5 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Home className="w-5 h-5 text-indigo-500" /> Request Unit Change
              </h3>
              <button onClick={() => setShowTenantChangeUnitModal(false)} className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white text-lg cursor-pointer">×</button>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
              If you would like to move to a different unit, please specify which unit number you prefer (e.g. "Unit 2") and the reason for the change. The landlord will receive your request and can edit the unit in your lease agreement.
            </p>

            <form onSubmit={handleTenantRequestUnitChange} className="space-y-4">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide font-bold">Request Details / Preferred Unit</label>
                <textarea
                  required
                  rows={3}
                  value={tenantChangeUnitNotes}
                  onChange={e => setTenantChangeUnitNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-xl p-3 text-xs text-slate-900 dark:text-white outline-none resize-none font-sans"
                  placeholder="e.g. I prefer Unit 2 instead of Unit 1 because it has better ventilation."
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowTenantChangeUnitModal(false)} className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-500 transition-all shadow-md shadow-blue-500/25">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject / Cancel Lease Reason Modal */}
      {showCancelReasonModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1a2736] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-up text-slate-900 dark:text-white text-left p-6 space-y-4">
            <div className="flex items-center justify-between border-b dark:border-white/5 pb-3">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Reject & Cancel Lease</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowCancelReasonModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Please provide a specific reason for rejecting/cancelling this lease agreement. This explanation will be automatically emailed to the tenant and displayed on their portal.
            </p>

            <form onSubmit={handleLandlordCancelLease} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 font-sans">
                  Reason for Cancellation *
                </label>
                <textarea
                  required
                  rows={4}
                  value={cancelReasonText}
                  onChange={e => setCancelReasonText(e.target.value)}
                  placeholder="e.g. Identity proof is unverified / blurred, income requirement not met, or incorrect personal information."
                  className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-rose-500 rounded-xl p-3 text-xs text-slate-900 dark:text-white outline-none resize-none font-sans"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelReasonModal(false)}
                  disabled={isSubmittingCancel}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-slate-250 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                >
                  Go Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCancel || !cancelReasonText.trim()}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer ${
                    cancelReasonText.trim() && !isSubmittingCancel
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
                      : 'bg-slate-300 dark:bg-white/10 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                  }`}
                >
                  {isSubmittingCancel ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
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
