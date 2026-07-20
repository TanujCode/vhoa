import React, { useState, useEffect } from 'react';
import { FileText, Plus, CheckCircle, Clock, Send, Lock, PenTool, Sparkles, Trash2, ShieldAlert, Search, X, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import API from '../../services/api';

const LEASE_TEMPLATES = {
  standard: `STANDARD RESIDENTIAL LEASE AGREEMENT

This lease agreement is made and entered on {{START_DATE}} by and between the Landlord and Tenant:
1. PROPERTY: Landlord rents to Tenant the property located at Unit {{UNIT_NUMBER}}.
2. TERM: The term of this lease shall begin on {{START_DATE}} and terminate on {{END_DATE}}.
3. RENT: Tenant agrees to pay a monthly rent of \${{RENT_AMOUNT}} due on the 1st of each month. A grace period of {{GRACE_PERIOD}} days is allowed, after which a late fee of \${{LATE_FEE}} will be applied.
4. SECURITY DEPOSIT: Tenant shall deposit \${{DEPOSIT_AMOUNT}} as security for any damage caused to the premises.

Signatures below indicate full agreement to these terms.`,

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

export default function LeasesHub({ user, selectedPropertyFilterId = 'all' }) {
  const isLandlord = user?.role === 'landlord' || user?.role_name === 'landlord' || user?.role_id === 1;

  const [leases, setLeases] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLease, setSelectedLease] = useState(null);
  const [prefilledFromApp, setPrefilledFromApp] = useState(false);
  const hasVacantUnits = units.length === 0 || units.some(u => u.status === 'VACANT');

  // Create Lease Form States
  const [selectedTemplate, setSelectedTemplate] = useState('standard');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [deposit, setDeposit] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [gracePeriod, setGracePeriod] = useState('5');
  const [feeType, setFeeType] = useState('FLAT');
  const [feeAmount, setFeeAmount] = useState('50');
  const [leaseText, setLeaseText] = useState('');
  const [utilFee, setUtilFee] = useState('0');
  const [parkingFee, setParkingFee] = useState('0');
  const [petFee, setPetFee] = useState('0');
  
  // Co-Landlord states
  const [coLandlordName, setCoLandlordName] = useState('');
  const [signingAsRole, setSigningAsRole] = useState('landlord');

  // Signature state
  const [signature, setSignature] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const canSignAsPrimary = selectedLease && isLandlord && !selectedLease.landlord_signature;
  const isUserPrimaryLandlord = selectedLease && selectedLease.landlord_signature && 
    (user?.name && (
      selectedLease.landlord_signature.toLowerCase().trim().includes(user.name.toLowerCase().trim()) ||
      user.name.toLowerCase().trim().includes(selectedLease.landlord_signature.toLowerCase().trim())
    ));
  const canSignAsCo = selectedLease && isLandlord && selectedLease.co_landlord_name && !selectedLease.co_landlord_signature && !isUserPrimaryLandlord;
  const canSignAsTenant = selectedLease && !isLandlord && !selectedLease.tenant_signature && selectedLease.tenant_id === user?.user_id;

  const showSignPad = selectedLease && (canSignAsPrimary || canSignAsCo || canSignAsTenant);

  const validateLeaseForm = () => {
    const errs = {};
    const selectedUnitObj = units.find(u => u.unit_id === parseInt(selectedUnitId));
    if (selectedUnitObj && selectedUnitObj.status === 'OCCUPIED') {
      errs.selectedUnitId = 'This unit is currently occupied. You cannot lease it out again.';
    }

    if (!tenantEmail) {
      errs.tenantEmail = 'Tenant email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tenantEmail.trim())) {
      errs.tenantEmail = 'Please enter a valid email address.';
    }

    const rent = parseFloat(rentAmount);
    if (!rentAmount || isNaN(rent) || rent <= 0) {
      errs.rentAmount = 'Monthly rent must be a positive number greater than 0.';
    }

    const dep = parseFloat(deposit);
    if (!deposit || isNaN(dep) || dep < 0) {
      errs.deposit = 'Security deposit must be 0 or a positive number.';
    }

    if (!startDate) {
      errs.startDate = 'Start date is required.';
    }

    if (!endDate) {
      errs.endDate = 'End date is required.';
    } else if (startDate && new Date(endDate) <= new Date(startDate)) {
      errs.endDate = 'End date must be after start date.';
    }

    const gp = parseInt(gracePeriod);
    if (!gracePeriod || isNaN(gp) || gp < 0) {
      errs.gracePeriod = 'Grace days must be a positive number (min 0).';
    }

    const fee = parseFloat(feeAmount);
    if (!feeAmount || isNaN(fee) || fee < 0) {
      errs.feeAmount = 'Fee amount must be 0 or positive.';
    }

    const util = parseFloat(utilFee);
    if (utilFee && (isNaN(util) || util < 0)) {
      errs.utilFee = 'Utilities fee must be 0 or positive.';
    }

    const park = parseFloat(parkingFee);
    if (parkingFee && (isNaN(park) || park < 0)) {
      errs.parkingFee = 'Parking fee must be 0 or positive.';
    }

    const pet = parseFloat(petFee);
    if (petFee && (isNaN(pet) || pet < 0)) {
      errs.petFee = 'Pet fee must be 0 or positive.';
    }

    return errs;
  };

  const compileLeaseText = (templateKey, rent, dep, start, end, grace, fee, email, unitId, util, park, pet) => {
    const template = LEASE_TEMPLATES[templateKey] || '';
    const unitObj = units.find(u => u.unit_id === parseInt(unitId)) || {};
    const unitNo = unitObj.unit_number || 'N/A';
    
    let compiled = template
      .replace(/\{\{START_DATE\}\}/g, start || '[Start Date]')
      .replace(/\{\{END_DATE\}\}/g, end || '[End Date]')
      .replace(/\{\{UNIT_NUMBER\}\}/g, unitNo)
      .replace(/\{\{RENT_AMOUNT\}\}/g, rent || '[Rent]')
      .replace(/\{\{DEPOSIT_AMOUNT\}\}/g, dep || '[Deposit]')
      .replace(/\{\{GRACE_PERIOD\}\}/g, grace || '5')
      .replace(/\{\{LATE_FEE\}\}/g, fee || '50')
      .replace(/\{\{TENANT_EMAIL\}\}/g, email || '[Tenant Email]');

    if (parseFloat(util) > 0 || parseFloat(park) > 0 || parseFloat(pet) > 0) {
      compiled += `\n\nADDITIONAL MONTHLY CHARGES BREAKDOWN:\n`;
      if (parseFloat(util) > 0) compiled += `- Monthly Utilities Fee: \$${util}\n`;
      if (parseFloat(park) > 0) compiled += `- Monthly Parking Fee: \$${park}\n`;
      if (parseFloat(pet) > 0) compiled += `- Monthly Pet Fee: \$${pet}\n`;
    }
    return compiled;
  };

  useEffect(() => {
    fetchLeases();
    if (isLandlord) {
      fetchUnits();
    }
  }, [isLandlord]);

  useEffect(() => {
    if (showCreateModal) {
      setLeaseText(compileLeaseText(selectedTemplate, rentAmount, deposit, startDate, endDate, gracePeriod, feeAmount, tenantEmail, selectedUnitId, utilFee, parkingFee, petFee));
    }
  }, [selectedTemplate, rentAmount, deposit, startDate, endDate, gracePeriod, feeAmount, tenantEmail, selectedUnitId, showCreateModal, units, utilFee, parkingFee, petFee]);

  useEffect(() => {
    if (selectedUnitId && units.length > 0) {
      const u = units.find(item => item.unit_id === parseInt(selectedUnitId));
      if (u && u.rent_amount) {
        setRentAmount(u.rent_amount.toString());
        setDeposit(u.rent_amount.toString());
      }
    }
  }, [selectedUnitId, units]);

  useEffect(() => {
    if (selectedLease) {
      if (selectedLease.landlord_signature && !selectedLease.co_landlord_signature) {
        setSigningAsRole('co_landlord');
      } else {
        setSigningAsRole('landlord');
      }
    }
  }, [selectedLease]);

  async function fetchLeases() {
    try {
      setLoading(true);
      const res = await API.get('/rental/leases');
      setLeases(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUnits() {
    try {
      const propRes = await API.get('/rental/properties');
      const props = propRes.data;
      const allUnits = [];
      for (const p of props) {
        const unitRes = await API.get(`/rental/properties/${p.property_id}/units`);
        allUnits.push(...unitRes.data);
      }
      setUnits(allUnits);
      
      const prefillEmail = localStorage.getItem('prefill_lease_email');
      const prefillUnitId = localStorage.getItem('prefill_lease_unit_id');
      
      if (prefillUnitId) {
        setSelectedUnitId(prefillUnitId);
        localStorage.removeItem('prefill_lease_unit_id');
        if (prefillEmail) {
          setTenantEmail(prefillEmail);
          localStorage.removeItem('prefill_lease_email');
        }
        setPrefilledFromApp(true);
        setShowCreateModal(true);
      } else if (allUnits.length > 0) {
        const firstVacant = allUnits.find(u => u.status !== 'OCCUPIED');
        if (firstVacant) {
          setSelectedUnitId(firstVacant.unit_id);
        } else {
          setSelectedUnitId(allUnits[0].unit_id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreateLease(e) {
    e.preventDefault();
    
    const validationErrors = validateLeaseForm();
    setFormErrors(validationErrors);
    
    const hasErrors = Object.keys(validationErrors).length > 0;
    if (hasErrors) {
      toast.error('Please correct the highlighted errors before creating the lease.');
      return;
    }

    try {
      const res = await API.post('/rental/leases', {
        unit_id: parseInt(selectedUnitId),
        tenant_email: tenantEmail,
        start_date: startDate,
        end_date: endDate,
        rent_amount: parseFloat(rentAmount),
        security_deposit: parseFloat(deposit || 0),
        grace_period_days: parseInt(gracePeriod),
        late_fee_type: feeType,
        late_fee_amount: parseFloat(feeAmount),
        lease_agreement_text: leaseText,
        utilities_fee: parseFloat(utilFee || 0),
        parking_fee: parseFloat(parkingFee || 0),
        pet_fee: parseFloat(petFee || 0),
        co_landlord_name: coLandlordName.trim() || null
      });
      setLeases(prev => [...prev, res.data]);
      setSelectedLease(res.data);
      setShowCreateModal(false);
      setPrefilledFromApp(false);
      setTenantEmail('');
      setRentAmount('');
      setDeposit('');
      setStartDate('');
      setEndDate('');
      setLeaseText('');
      setUtilFee('0');
      setParkingFee('0');
      setPetFee('0');
      setCoLandlordName('');
      setFormErrors({});
      toast.success("Lease agreement created successfully!");
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to create lease.";
      setErrorMsg(msg);
      toast.error(msg);
    }
  }

  async function handleSignLease(e) {
    e.preventDefault();
    try {
      const res = await API.post(`/rental/leases/${selectedLease.lease_id}/sign`, {
        signature_text: signature,
        signing_as: isLandlord ? signingAsRole : 'tenant'
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
    if (!window.confirm("Are you sure you want to delete this lease agreement? This will also remove any associated invoices.")) return;
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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
                    <th className="px-4 py-4">Agreement ID</th>
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
                      className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-4 py-4 font-mono text-xs font-bold text-indigo-650 dark:text-[#5BA4F5]">Lease #{l.lease_id}</td>
                      <td className="px-4 py-4 text-slate-600 dark:text-gray-400">{l.tenant_email}</td>
                      <td className="px-4 py-4">
                        <span className="bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 px-2.5 py-0.5 rounded text-[10px] font-bold border border-blue-500/20 whitespace-nowrap">
                          Unit {l.unit?.unit_number || 'N/A'}
                        </span>
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
                            : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right whitespace-nowrap space-x-1">
                        <button
                          type="button"
                          onClick={() => setSelectedLease(l)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-blue-500 transition cursor-pointer"
                          title="Sign / View"
                        >
                          <Eye size={14} />
                        </button>
                        {isLandlord && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteLease(l.lease_id, e)}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition cursor-pointer"
                            title="Delete Agreement"
                          >
                            <Trash2 size={14} />
                          </button>
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

              {/* Status Banner */}
              <div className="flex justify-between items-center bg-slate-50 dark:bg-white/[0.01] p-3 rounded-xl border border-gray-150 dark:border-white/5">
                <span className="text-xs font-semibold text-gray-550 dark:text-gray-400">Signature Status:</span>
                <span className={`flex items-center gap-1 text-xs font-bold py-1 px-3 rounded-full ${
                  selectedLease.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-yellow-500/10 text-yellow-500'
                }`}>
                  {selectedLease.status === 'ACTIVE' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  {selectedLease.status}
                </span>
              </div>

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

              {/* Signing Pad Form */}
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
                        className="flex-1 text-sm px-4 py-2.5 border rounded-lg bg-white dark:bg-black/20 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600" 
                        placeholder="e.g. Johnathan Doe" 
                      />
                      <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 cursor-pointer transition">
                        Sign Contract
                      </button>
                    </div>
                  </div>
                </form>
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

      {/* Create Lease Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] w-full max-w-4xl rounded-2xl p-6 space-y-4 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b dark:border-white/5 pb-3">
              <h3 className="text-lg font-bold text-gray-905 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" /> Build Lease Agreement
              </h3>
              <button onClick={() => { setShowCreateModal(false); setPrefilledFromApp(false); setFormErrors({}); setErrorMsg(''); }} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
            </div>
             {errorMsg && <p className="text-xs text-red-500 bg-red-50 p-2.5 rounded-lg">{errorMsg}</p>}
            {!hasVacantUnits && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>Warning: There are no vacant units available in your portfolio. You cannot create a new lease agreement until you have a vacant unit.</span>
              </div>
            )}
            
            <form onSubmit={handleCreateLease} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {/* Form Controls Column */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 tracking-wider mb-1">SELECT LEASE TEMPLATE</label>
                  <select 
                    value={selectedTemplate} 
                    onChange={e=>setSelectedTemplate(e.target.value)} 
                    className="w-full text-sm px-3 py-2 border rounded-lg bg-white dark:bg-black/20 text-gray-900 dark:text-white border-blue-500/30"
                  >
                    <option value="standard">Standard Residential Lease Template</option>
                    <option value="condo">Condominium (HOA Guidelines) Lease</option>
                    <option value="guaranty">Co-Signer Guaranty Addendum</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-605 dark:text-gray-400 tracking-wider mb-1">
                      {prefilledFromApp ? 'SELECT UNIT (LOCKED)' : 'SELECT UNIT'}
                    </label>
                    <select 
                      required 
                      disabled={prefilledFromApp}
                      value={selectedUnitId} 
                      onChange={e=>setSelectedUnitId(e.target.value)} 
                      className={`w-full text-sm px-3 py-2 border rounded-lg bg-white dark:bg-black/20 text-gray-905 dark:text-white ${
                        prefilledFromApp ? 'bg-gray-100 dark:bg-slate-900 cursor-not-allowed opacity-80 border-gray-200 dark:border-white/5 text-gray-450 dark:text-gray-500' : 'border-gray-250 dark:border-white/10'
                      } ${formErrors.selectedUnitId ? 'border-red-500' : ''}`}
                    >
                      {units.map(u=>(
                        <option key={u.unit_id} value={u.unit_id}>
                          Unit {u.unit_number} (${u.rent_amount}) - {u.status || 'VACANT'}
                        </option>
                      ))}
                    </select>
                    {formErrors.selectedUnitId && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.selectedUnitId}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-605 dark:text-gray-400 tracking-wider mb-1">
                      {prefilledFromApp ? 'TENANT EMAIL (LOCKED)' : 'TENANT EMAIL'}
                    </label>
                    <input 
                      required 
                      disabled={prefilledFromApp}
                      type="email" 
                      value={tenantEmail} 
                      onChange={e=>setTenantEmail(e.target.value)} 
                      className={`w-full text-sm px-3 py-2 border rounded-lg bg-white dark:bg-black/20 text-gray-905 dark:text-white ${
                        prefilledFromApp ? 'bg-gray-100 dark:bg-slate-900 cursor-not-allowed opacity-80 border-gray-200 dark:border-white/5 text-gray-450 dark:text-gray-500' : 'border-gray-250 dark:border-white/10'
                      } ${formErrors.tenantEmail ? 'border-red-500 focus:ring-red-200' : ''}`} 
                      placeholder="tenant@example.com" 
                    />
                    {formErrors.tenantEmail && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.tenantEmail}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 tracking-wider mb-1">MONTHLY RENT ($)</label>
                    <input required type="number" value={rentAmount} onChange={e=>setRentAmount(e.target.value)} className={`w-full text-sm px-3 py-2 border rounded-lg bg-white dark:bg-black/20 text-gray-900 dark:text-white ${formErrors.rentAmount ? 'border-red-500' : 'border-gray-250 dark:border-white/10'}`} placeholder="1500" />
                    {formErrors.rentAmount && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.rentAmount}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 tracking-wider mb-1">SECURITY DEPOSIT ($)</label>
                    <input required type="number" value={deposit} onChange={e=>setDeposit(e.target.value)} className={`w-full text-sm px-3 py-2 border rounded-lg bg-white dark:bg-black/20 text-gray-900 dark:text-white ${formErrors.deposit ? 'border-red-500' : 'border-gray-250 dark:border-white/10'}`} placeholder="1500" />
                    {formErrors.deposit && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.deposit}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 tracking-wider mb-1">UTILITIES FEE ($)</label>
                    <input type="number" value={utilFee} onChange={e=>setUtilFee(e.target.value)} className={`w-full text-sm px-3 py-2 border rounded-lg bg-white dark:bg-black/20 text-gray-900 dark:text-white ${formErrors.utilFee ? 'border-red-500' : 'border-gray-250 dark:border-white/10'}`} placeholder="50" />
                    {formErrors.utilFee && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.utilFee}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 tracking-wider mb-1">PARKING FEE ($)</label>
                    <input type="number" value={parkingFee} onChange={e=>setParkingFee(e.target.value)} className={`w-full text-sm px-3 py-2 border rounded-lg bg-white dark:bg-black/20 text-gray-900 dark:text-white ${formErrors.parkingFee ? 'border-red-500' : 'border-gray-250 dark:border-white/10'}`} placeholder="25" />
                    {formErrors.parkingFee && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.parkingFee}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 tracking-wider mb-1">PET FEE ($)</label>
                    <input type="number" value={petFee} onChange={e=>setPetFee(e.target.value)} className={`w-full text-sm px-3 py-2 border rounded-lg bg-white dark:bg-black/20 text-gray-900 dark:text-white ${formErrors.petFee ? 'border-red-500' : 'border-gray-250 dark:border-white/10'}`} placeholder="15" />
                    {formErrors.petFee && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.petFee}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 tracking-wider mb-1">START DATE</label>
                    <input required type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className={`w-full text-sm px-3 py-2 border rounded-lg bg-white dark:bg-black/20 text-gray-900 dark:text-white ${formErrors.startDate ? 'border-red-500' : 'border-gray-250 dark:border-white/10'}`} />
                    {formErrors.startDate && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.startDate}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 tracking-wider mb-1">END DATE</label>
                    <input required type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className={`w-full text-sm px-3 py-2 border rounded-lg bg-white dark:bg-black/20 text-gray-900 dark:text-white ${formErrors.endDate ? 'border-red-500' : 'border-gray-250 dark:border-white/10'}`} />
                    {formErrors.endDate && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.endDate}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 tracking-wider mb-1">GRACE DAYS</label>
                    <input required type="number" value={gracePeriod} onChange={e=>setGracePeriod(e.target.value)} className={`w-full text-sm px-3 py-2 border rounded-lg bg-white dark:bg-black/20 text-gray-900 dark:text-white ${formErrors.gracePeriod ? 'border-red-500' : 'border-gray-250 dark:border-white/10'}`} />
                    {formErrors.gracePeriod && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.gracePeriod}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 tracking-wider mb-1">LATE FEE TYPE</label>
                    <select value={feeType} onChange={e=>setFeeType(e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-250 dark:border-white/10 rounded-lg bg-white dark:bg-black/20 text-gray-900 dark:text-white">
                      <option value="FLAT">Flat Fee</option>
                      <option value="PERCENTAGE">Percentage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 tracking-wider mb-1">FEE AMOUNT</label>
                    <input required type="number" value={feeAmount} onChange={e=>setFeeAmount(e.target.value)} className={`w-full text-sm px-3 py-2 border rounded-lg bg-white dark:bg-black/20 text-gray-900 dark:text-white ${formErrors.feeAmount ? 'border-red-500' : 'border-gray-250 dark:border-white/10'}`} />
                    {formErrors.feeAmount && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.feeAmount}</p>}
                  </div>
                </div>
                
                <div className="pt-2">
                  <label className="block text-xs font-bold text-gray-605 dark:text-gray-400 tracking-wider mb-1">CO-LANDLORD FULL NAME (OPTIONAL)</label>
                  <input 
                    type="text" 
                    value={coLandlordName} 
                    onChange={e => setCoLandlordName(e.target.value)} 
                    className="w-full text-sm px-3 py-2 border rounded-lg bg-white dark:bg-black/20 text-gray-900 dark:text-white border-gray-250 dark:border-white/10 outline-none focus:border-blue-500" 
                    placeholder="e.g. Jane Doe (Joint Landlord)" 
                  />
                  <p className="text-[10px] text-gray-400 mt-1 italic">
                    If specified, they will be given the option to sign the lease contract as an optional second landlord.
                  </p>
                </div>
              </div>

              {/* Dynamic Contract Preview Sheet Column */}
              <div className="flex flex-col h-full space-y-2">
                <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wider">LIVE LEASE CONTRACT PREVIEW</label>
                <div className="flex-1 p-4 border border-blue-500/20 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-black/20 text-xs font-mono text-gray-800 dark:text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[320px] overflow-y-auto shadow-inner">
                  {leaseText}
                </div>
                <p className="text-[10px] text-gray-400 italic">Note: Placeholders like tenant name and unit are compiled dynamically as you type.</p>
                
                <div className="flex gap-3 justify-end pt-3 mt-auto">
                  <button type="button" onClick={() => { setShowCreateModal(false); setPrefilledFromApp(false); setFormErrors({}); setErrorMsg(''); }} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 text-gray-600 dark:text-gray-400 font-bold">Cancel</button>
                  <button type="submit" disabled={!hasVacantUnits && !prefilledFromApp} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed">Create & Invite Tenant</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
