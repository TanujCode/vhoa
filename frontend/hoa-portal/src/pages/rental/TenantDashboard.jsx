import React, { useState, useEffect } from 'react';
import { 
  Home, FileText, CreditCard, Wrench, ShieldAlert, Sparkles, 
  Building2, ArrowRight, ArrowUpRight, CheckCircle2, Clock, Calendar,
  Search, ChevronRight
} from 'lucide-react';
import API from '../../services/api';
import ScreeningHub from './ScreeningHub';

export default function TenantDashboard({ user, setUser, setActivePage }) {
  const [leases, setLeases] = useState([]);
  const [activeLease, setActiveLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [applications, setApplications] = useState([]);
  const [showSelector, setShowSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getCleanUnitNumber = (unitNum) => {
    if (!unitNum) return 'N/A';
    let clean = unitNum.replace(/^(apt|apartment|unit|room|suite)\.?\s*/i, '').trim();
    const isEntireProperty = unitNum === 'Single Family' || unitNum === 'Entire Property' || unitNum === 'Condo Unit' || !/\d/.test(clean);
    return isEntireProperty ? '1' : clean;
  };

  useEffect(() => {
    fetchTenantLeaseData();
  }, [user?.property_name, user?.unit_number]);

  async function fetchTenantLeaseData() {
    try {
      setLoading(true);
      // Fetch leases for current tenant
      const leaseRes = await API.get('/rental/leases');
      setLeases(leaseRes.data);
      
      const savedLeaseId = localStorage.getItem('tenant_active_lease_id');
      let active = null;
      if (savedLeaseId) {
        active = leaseRes.data.find(l => String(l.lease_id) === String(savedLeaseId));
      }
      if (!active) {
        active = leaseRes.data.find(l => l.status === 'ACTIVE') || leaseRes.data[0];
      }
      if (active) {
        setActiveLease(active);
        // Fetch ledger invoices for active lease
        const ledgerRes = await API.get(`/rental/leases/${active.lease_id}/ledgers`);
        const sorted = [...ledgerRes.data].sort((a, b) => a.invoice_id - b.invoice_id);
        const mappedInvoices = ledgerRes.data.map(inv => {
          const seq = sorted.findIndex(item => item.invoice_id === inv.invoice_id) + 1;
          return { ...inv, seq_num: seq };
        });
        setInvoices(mappedInvoices.slice(0, 3)); // show top 3 recent invoices

        // Synchronize topbar user state if mismatched
        const propName = active.property_name || (active.unit && active.unit.property ? active.unit.property.name : null);
        const unitNo = active.unit ? active.unit.unit_number : null;
        if (setUser && (user?.property_name !== propName || user?.unit_number !== unitNo)) {
          setUser(prevUser => {
            const updatedUser = {
              ...prevUser,
              property_name: propName,
              unit_number: unitNo,
              property_type: active.unit?.property_type || null
            };
            try {
              localStorage.setItem('rental_user', JSON.stringify(updatedUser));
            } catch (_) {}
            return updatedUser;
          });
        }
      }

      // Fetch applications to check for pending invites
      const appRes = await API.get('/rental/applications/my');
      setApplications(appRes.data);
    } catch (err) {
      console.error("Error fetching tenant lease data:", err);
    } finally {
      setLoading(false);
    }
  }
  const getLeaseSeqNum = (lease) => {
    if (!lease) return '';
    const sorted = [...leases].sort((a, b) => a.lease_id - b.lease_id);
    const idx = sorted.findIndex(item => item.lease_id === lease.lease_id);
    return idx !== -1 ? idx + 1 : lease.lease_id;
  };

  // Group leases by property
  const uniquePropertiesMap = {};
  leases.forEach(l => {
    const propId = l.unit?.property_id;
    const propName = l.property_name || (l.unit && l.unit.property ? l.unit.property.name : l.property?.name || 'Private Landlord');
    if (propId && !uniquePropertiesMap[propId]) {
      uniquePropertiesMap[propId] = {
        property_id: propId,
        name: propName,
        leases: []
      };
    }
    if (propId) {
      uniquePropertiesMap[propId].leases.push(l);
    }
  });
  const uniqueProperties = Object.values(uniquePropertiesMap);
  const hasMultipleProperties = uniqueProperties.length > 1;

  const selectProperty = (propId) => {
    const propObj = uniquePropertiesMap[propId];
    if (propObj && propObj.leases.length > 0) {
      const chosenLease = propObj.leases.find(l => l.status === 'ACTIVE') || propObj.leases[0];
      localStorage.setItem('tenant_active_lease_id', String(chosenLease.lease_id));
      localStorage.setItem('tenant_active_property_id', String(propId));
      setActiveLease(chosenLease);
      
      const propName = chosenLease.property_name || (chosenLease.unit && chosenLease.unit.property ? chosenLease.unit.property.name : null);
      const unitNo = chosenLease.unit ? chosenLease.unit.unit_number : null;
      if (setUser) {
        setUser(prevUser => {
          const updatedUser = {
            ...prevUser,
            property_name: propName,
            unit_number: unitNo,
            property_type: chosenLease.unit?.property_type || null
          };
          try {
            localStorage.setItem('rental_user', JSON.stringify(updatedUser));
          } catch (_) {}
          return updatedUser;
        });
      }
      setShowSelector(false);
    }
  };

  const handleSwitchProperty = () => {
    setShowSelector(true);
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Scenario 1: Tenant has NO lease invitation or active lease
  if (leases.length === 0) {
    return (
      <div className="space-y-6 text-left">
        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-500/5 to-indigo-500/5 border border-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="text-blue-500" /> Welcome to NestBloq Rental Portal
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xl">
              You are currently registered as a Tenant, but there is no lease contract linked to your email yet. You can submit a background screening application below to get started.
            </p>
          </div>
          <div className="flex-shrink-0 bg-blue-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider">
            Awaiting Invite
          </div>
        </div>

        {/* Render Screening Application component so they can apply immediately */}
        <ScreeningHub user={user} />
      </div>
    );
  }

  // Choose Residence Screen if multiple properties exist and selector is open or no active property is selected
  if (hasMultipleProperties && (showSelector || !localStorage.getItem('tenant_active_property_id'))) {
    const filteredProperties = uniqueProperties.filter(prop => 
      prop.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.leases.some(l => l.unit?.unit_number?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
      <div className="w-full h-[calc(100vh-150px)] lg:h-[calc(100vh-170px)] flex flex-col overflow-hidden animate-fade-in font-sans">
        
        {/* Compact Card Layout */}
        <div className="flex-1 bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200/80 dark:border-white/[0.05] rounded-3xl shadow-lg overflow-hidden flex flex-col animate-scale-up">
          
          {/* Header inside Container */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-purple-600/10 p-6 border-b border-slate-100 dark:border-white/5 text-left shrink-0">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none -ml-12 -mb-12"></div>
            
            <div className="relative z-10 space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                <Building2 size={10} className="animate-pulse" />
                Active Portals
              </div>
              <h1 className="text-xl md:text-2xl font-black text-gray-950 dark:text-white tracking-tight leading-none">
                Select Your Residence
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You are linked to multiple properties. Choose a portal to view your specific rent details, leases, and maintenance dashboard.
              </p>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-white/5 shrink-0">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search by property name or unit..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs border rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-white/10 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-550"
              />
            </div>
          </div>

          {/* Scrollable List Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/5">
            {filteredProperties.length > 0 ? (
              filteredProperties.map(prop => (
                <div
                  key={prop.property_id}
                  onClick={() => selectProperty(prop.property_id)}
                  className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-white/[0.03] bg-slate-50/30 hover:bg-blue-50/30 dark:bg-white/[0.01] dark:hover:bg-blue-500/5 hover:border-blue-500/30 dark:hover:border-blue-500/20 transition-all duration-200 cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="p-2.5 bg-blue-500/5 dark:bg-blue-500/10 rounded-xl border border-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-105 transition-transform duration-200">
                      <Home className="w-5 h-5" />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-250 truncate group-hover:text-blue-650 dark:group-hover:text-blue-450 transition-colors">
                        {prop.name}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          {prop.leases.length} {prop.leases.length === 1 ? 'Unit' : 'Units'} Assigned:
                        </span>
                        {prop.leases.map(l => (
                          <span 
                            key={l.lease_id} 
                            className="bg-blue-500/5 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold border border-blue-500/10"
                          >
                            {l.unit?.property_type === 'condo' ? 'Apt' : 'Unit'} {l.unit?.unit_number || 'N/A'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-450 transition-colors opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-250">
                      Enter Portal
                    </span>
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105 transition-all duration-200">
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center space-y-2">
                <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
                  <Building2 size={20} className="opacity-50" />
                </div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No properties found</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
                  We couldn't find any residences matching "{searchQuery}". Try searching for another name or unit number.
                </p>
              </div>
            )}
          </div>
          
        </div>
      </div>
    );
  }

  // Scenario 2: Tenant has an active/pending lease
  const totalUnpaid = invoices.filter(i => i.status !== 'PAID').reduce((sum, i) => sum + i.amount + (i.late_fee_applied || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Premium Header Banner */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.05] rounded-3xl p-6 md:p-8 text-slate-900 dark:text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="bg-slate-100 dark:bg-white/10 text-slate-650 dark:text-gray-300 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-slate-250/20 dark:border-white/5">
              Resident Dashboard
            </span>
            {activeLease?.property_name && (
              <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold tracking-wider px-3 py-1 rounded-full border border-blue-100/60 dark:border-blue-900/30 flex items-center gap-1">
                <Building2 size={10} /> {activeLease.property_name}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Hello, {user?.full_name || 'Resident'}!</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm max-w-lg leading-relaxed font-semibold">
            Manage your lease contracts, review recent invoicing history, submit maintenance requests, and track utility charges all in one place.
          </p>
        </div>

        {hasMultipleProperties && (
          <button
            onClick={handleSwitchProperty}
            className="relative z-10 flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-2xl font-bold text-xs cursor-pointer whitespace-nowrap transition-all shadow-lg shadow-blue-500/20 border border-transparent"
          >
            <Building2 className="w-4 h-4" />
            Switch Property Portal
          </button>
        )}
      </div>

      {/* Pending Invites, Reviews, & Signature alerts */}
      {(applications.some(a => a.screening_status === 'INVITED') || leases.some(l => ['PENDING_SIGNATURE', 'PENDING_TENANT_REVIEW', 'PENDING_LANDLORD_APPROVAL'].includes(l.status))) && (
        <div className="space-y-3">
          {applications.filter(a => a.screening_status === 'INVITED').map(app => (
            <div key={app.application_id} className="p-5 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 dark:border-indigo-550/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-semibold animate-pulse shadow-sm">
              <div className="space-y-1 text-left">
                <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-wider block">Action Required • Screening Invitation</span>
                <p className="text-base text-slate-900 dark:text-white font-black">
                  {app.unit?.property_type === 'condo' ? 'Apt' : 'Unit'} {app.unit?.unit_number} at {app.unit?.propertyName || app.unit?.property?.name || 'Assigned Property'}
                </p>
                <p className="text-xs text-slate-550 dark:text-gray-400 font-normal">
                  Your landlord has invited you to complete a background screening check. Please complete it to sign the lease.
                </p>
              </div>
              <button
                onClick={() => setActivePage('screening_hub')}
                className="bg-indigo-600 hover:bg-indigo-550 active:scale-95 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-500/20 whitespace-nowrap cursor-pointer"
              >
                Complete Application
              </button>
            </div>
          ))}

          {leases.filter(l => l.status === 'PENDING_TENANT_REVIEW' || l.status === 'PENDING_SIGNATURE').map(lease => (
            <div key={lease.lease_id} className="p-5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 dark:border-amber-550/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-semibold shadow-sm animate-pulse">
              <div className="space-y-1 text-left">
                <span className="text-[10px] text-amber-500 dark:text-amber-400 font-bold uppercase tracking-wider block">Action Required • Lease Review & Signature</span>
                <p className="text-base text-slate-900 dark:text-white font-black">
                  {lease.unit?.property_type === 'condo' ? 'Apt' : 'Unit'} {lease.unit?.unit_number} at {lease.property_name || lease.unit?.property?.name || 'Assigned Property'}
                </p>
                <p className="text-xs text-slate-550 dark:text-gray-400 font-normal">
                  A new lease contract is ready for your review, document uploads, and signature to complete your onboarding.
                </p>
              </div>
              <button
                onClick={() => {
                  localStorage.setItem('pending_lease_id', lease.lease_id);
                  setActivePage('leases_hub');
                }}
                className="bg-amber-600 hover:bg-amber-550 active:scale-95 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-amber-500/20 whitespace-nowrap cursor-pointer"
              >
                Review & Sign Lease
              </button>
            </div>
          ))}

          {leases.filter(l => l.status === 'PENDING_LANDLORD_APPROVAL').map(lease => (
            <div key={lease.lease_id} className="p-5 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-550/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-semibold shadow-sm">
              <div className="space-y-1 text-left">
                <span className="text-[10px] text-blue-500 dark:text-blue-400 font-bold uppercase tracking-wider block">Pending Approval • Awaiting Landlord</span>
                <p className="text-base text-slate-900 dark:text-white font-black">
                  {lease.unit?.property_type === 'condo' ? 'Apt' : 'Unit'} {lease.unit?.unit_number} at {lease.property_name || lease.unit?.property?.name || 'Assigned Property'}
                </p>
                <p className="text-xs text-slate-550 dark:text-gray-400 font-normal">
                  You have successfully submitted your documents and signed the lease agreement. The landlord is reviewing it for final activation.
                </p>
              </div>
              <div className="bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-gray-300 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap">
                Under Review
              </div>
            </div>
          ))}
        </div>
      )}

      {activeLease?.status === 'ACTIVE' && (
        <>
          {/* Premium Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Lease Residence */}
        <div className="group p-5 rounded-3xl bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.05] shadow-sm hover:shadow-xl hover:border-blue-500/20 hover:-translate-y-1 transition-all duration-300 text-left">
          <div className="flex justify-between items-center text-slate-450 dark:text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-450">Residence</span>
            <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition duration-300">
              <Home className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {activeLease?.unit?.unit_number === 'Single Family' ? (
                'Entire House'
              ) : activeLease?.unit?.unit_number === 'Condo Unit' ? (
                'Condominium'
              ) : (
                `${activeLease?.unit?.property_type === 'condo' ? 'Apt' : 'Unit'} ${getCleanUnitNumber(activeLease?.unit?.unit_number)}`
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-gray-400 mt-1 font-semibold flex items-center gap-1">
              <Building2 size={12} className="text-slate-400" /> {activeLease?.property_name || 'Sunset Heights'}
            </div>
          </div>
        </div>

        {/* Card 2: Monthly Rent */}
        <div className="group p-5 rounded-3xl bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.05] shadow-sm hover:shadow-xl hover:border-emerald-500/20 hover:-translate-y-1 transition-all duration-300 text-left">
          <div className="flex justify-between items-center text-slate-450 dark:text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-450">Monthly Rent</span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 transition duration-300">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {activeLease?.rent_amount ? `$${activeLease.rent_amount.toLocaleString()}` : '$0'}
            </div>
            <div className="text-xs text-slate-550 dark:text-gray-405 mt-1 font-semibold flex items-center gap-1">
              <Calendar size={12} className="text-slate-400" /> Due on 1st of month
            </div>
          </div>
        </div>

        {/* Card 3: Lease Status */}
        <div className="group p-5 rounded-3xl bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.05] shadow-sm hover:shadow-xl hover:border-violet-500/20 hover:-translate-y-1 transition-all duration-300 text-left">
          <div className="flex justify-between items-center text-slate-450 dark:text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-450">Lease Agreement</span>
            <div className="p-2.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-2xl group-hover:scale-110 transition duration-300">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                activeLease?.status === 'ACTIVE' 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                  : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-405 border border-yellow-500/20'
              }`}>
                {activeLease?.status}
                <span className={`w-1.5 h-1.5 rounded-full ${activeLease?.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500 animate-pulse'}`}></span>
              </span>
            </div>
            <div className="text-xs text-slate-450 dark:text-slate-500 mt-2 font-mono font-medium">Agreement ID: #{getLeaseSeqNum(activeLease)}</div>
          </div>
        </div>

        {/* Card 4: Balance Due */}
        <div className="group p-5 rounded-3xl bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.05] shadow-sm hover:shadow-xl hover:border-rose-500/20 hover:-translate-y-1 transition-all duration-300 text-left">
          <div className="flex justify-between items-center text-slate-450 dark:text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-450">Balance Due</span>
            <div className="p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl group-hover:scale-110 transition duration-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className={`text-2xl font-black ${totalUnpaid > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
              ${totalUnpaid.toLocaleString()}
            </div>
            <div className="text-xs text-slate-550 dark:text-gray-405 mt-1 font-semibold flex items-center gap-1">
              {totalUnpaid > 0 ? 'Action required immediately' : 'Account fully paid'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Recent Invoices */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.05] shadow-sm space-y-5">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText size={18} className="text-blue-500" /> Recent Rent Invoices
            </h3>
            <span className="text-xs text-slate-400 dark:text-gray-500 font-semibold font-mono">Ledger history</span>
          </div>

          {invoices.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm font-semibold">No invoices generated for this lease yet.</div>
          ) : (
            <div className="space-y-3">
              {invoices.map(inv => (
                <div 
                  key={inv.invoice_id} 
                  className="group p-4 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-blue-500/20 bg-slate-50/50 hover:bg-slate-50 dark:bg-white/[0.01] dark:hover:bg-white/[0.03] flex justify-between items-center text-sm transition-all duration-200"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="p-2.5 bg-blue-500/5 text-blue-600 dark:text-blue-400 rounded-xl">
                      <FileText size={16} />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">Invoice #{inv.seq_num || inv.invoice_id}</span>
                      <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5 flex items-center gap-1 font-semibold">
                        <Calendar size={11} className="text-slate-400" /> Due Date: {new Date(inv.due_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-900 dark:text-white font-mono text-base">
                      ${(inv.amount + (inv.late_fee_applied || 0)).toLocaleString()}
                    </span>
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                      inv.status === 'PAID' 
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                        : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.05] shadow-sm space-y-5">
          <div className="pb-2 border-b border-slate-100 dark:border-white/5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" /> Quick Tasks
            </h3>
          </div>
          
          <div className="space-y-3">
             {/* Task 1: View/Sign Lease Contract */}
             <div 
               onClick={() => {
                 const pendingLease = leases.find(l => l.status === 'PENDING_TENANT_REVIEW' || l.status === 'PENDING_SIGNATURE');
                 if (pendingLease) {
                   localStorage.setItem('pending_lease_id', pendingLease.lease_id);
                 }
                 setActivePage('leases_hub');
               }}
               className="group p-4 rounded-2xl border border-slate-150/80 dark:border-white/5 hover:border-blue-500/30 bg-slate-50/40 hover:bg-blue-500/5 dark:bg-white/[0.01] dark:hover:bg-blue-500/5 cursor-pointer text-left transition-all duration-350 flex justify-between items-center gap-3"
             >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl mt-0.5 group-hover:scale-110 transition duration-300">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">Lease Agreement</h4>
                  <p className="text-[10px] text-slate-450 dark:text-gray-400 mt-0.5 font-semibold">View or sign lease contracts.</p>
                </div>
              </div>
              <ArrowUpRight size={16} className="text-slate-400 group-hover:text-blue-550 dark:group-hover:text-blue-400 transition" />
            </div>

            {/* Task 2: Pay Outstanding Dues */}
            <div 
              onClick={() => setActivePage('rent_ledger')}
              className="group p-4 rounded-2xl border border-slate-150/80 dark:border-white/5 hover:border-emerald-500/30 bg-slate-50/40 hover:bg-emerald-500/5 dark:bg-white/[0.01] dark:hover:bg-emerald-500/5 cursor-pointer text-left transition-all duration-350 flex justify-between items-center gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl mt-0.5 group-hover:scale-110 transition duration-300">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">Pay Rent</h4>
                  <p className="text-[10px] text-slate-450 dark:text-gray-400 mt-0.5 font-semibold">Make secure online rent payments.</p>
                </div>
              </div>
              <ArrowUpRight size={16} className="text-slate-400 group-hover:text-emerald-550 dark:group-hover:text-emerald-400 transition" />
            </div>

            {/* Task 3: Submit Maintenance Ticket */}
            <div 
              onClick={() => setActivePage('servicereq')}
              className="group p-4 rounded-2xl border border-slate-150/80 dark:border-white/5 hover:border-violet-500/30 bg-slate-50/40 hover:bg-violet-500/5 dark:bg-white/[0.01] dark:hover:bg-violet-500/5 cursor-pointer text-left transition-all duration-350 flex justify-between items-center gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl mt-0.5 group-hover:scale-110 transition duration-300">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">Service Request</h4>
                  <p className="text-[10px] text-slate-450 dark:text-gray-400 mt-0.5 font-semibold">Report maintanance or unit repairs.</p>
                </div>
              </div>
              <ArrowUpRight size={16} className="text-slate-400 group-hover:text-violet-550 dark:group-hover:text-violet-400 transition" />
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
