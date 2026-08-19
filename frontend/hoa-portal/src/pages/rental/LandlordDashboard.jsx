import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, FileText, CreditCard, 
  ArrowUpRight, ArrowDownRight, Activity, 
  TrendingUp, Clock, AlertCircle, Sparkles, 
  CheckCircle2, Plus, Filter, Calendar, 
  ChevronDown, DollarSign, Wallet, Percent, Info,
  Wrench, ShieldAlert
} from 'lucide-react';
import API from '../../services/api';

export default function LandlordDashboard({ 
  user, 
  setActivePage,
  selectedPropertyFilterId = 'all',
  setSelectedPropertyFilterId,
  properties: globalProperties
}) {
  // Filters & State
  const [properties, setProperties] = useState(globalProperties || []);
  const [units, setUnits] = useState([]);
  const [leases, setLeases] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [maintRequests, setMaintRequests] = useState([]);
  const [applications, setApplications] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected filters
  const selectedPropertyId = selectedPropertyFilterId;
  const setSelectedPropertyId = setSelectedPropertyFilterId;
  const [selectedPeriod, setSelectedPeriod] = useState('12months'); // "thismonth", "3months", "12months", "alltime"
  
  // Interactive UI state
  const [hoveredBar, setHoveredBar] = useState(null);
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState('actions');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (globalProperties) {
      setProperties(globalProperties);
    }
  }, [globalProperties]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Fetch properties
      const propRes = await API.get('/rental/properties');
      const props = propRes.data;
      setProperties(props);

      // 2. Fetch units for each property in parallel
      const unitsPromises = props.map(p => 
          API.get(`/rental/properties/${p.property_id}/units`)
            .then(res => res.data.map(u => ({ ...u, property_id: p.property_id, property_name: p.name })))
            .catch(() => [])
      );
      const unitsArrays = await Promise.all(unitsPromises);
      const allUnits = unitsArrays.flat();
      setUnits(allUnits);

      // 3. Fetch leases
      const leaseRes = await API.get('/rental/leases');
      const allLeases = leaseRes.data;
      setLeases(allLeases);

      // 4. Fetch ledgers for each lease in parallel
      const ledgersPromises = allLeases.map(l => {
        const unit = allUnits.find(u => u.unit_id === l.unit_id);
        const propId = unit ? unit.property_id : null;
        const propName = unit ? unit.property_name : 'Unknown Property';
        const unitNum = unit ? unit.unit_number : 'N/A';

        return API.get(`/rental/leases/${l.lease_id}/ledgers`)
          .then(res => res.data.map(ledger => ({ 
            ...ledger, 
            property_id: propId,
            property_name: propName,
            unit_number: unitNum,
            rent_amount: l.rent_amount
          })))
          .catch(() => []);
      });
      const ledgersArrays = await Promise.all(ledgersPromises);
      const allLedgers = ledgersArrays.flat();
      setLedgers(allLedgers);

      // 5. Fetch maintenance requests
      const maintRes = await API.get('/rental/maintenance');
      const allMaint = maintRes.data.map(req => {
        const lease = allLeases.find(l => l.lease_id === req.lease_id);
        const unit = lease ? allUnits.find(u => u.unit_id === lease.unit_id) : null;
        const propId = unit ? unit.property_id : null;
        const propName = unit ? unit.property_name : 'Unknown Property';
        const unitNum = unit ? unit.unit_number : 'N/A';

        return {
          ...req,
          property_id: propId,
          property_name: propName,
          unit_number: unitNum
        };
      });
      setMaintRequests(allMaint);

      // 6. Fetch applications
      const appRes = await API.get('/rental/applications');
      setApplications(appRes.data);

      // 7. Fetch recent audit logs
      try {
        const auditRes = await API.get('/rental/audit?limit=5');
        setRecentLogs(auditRes.data || []);
      } catch (auditErr) {
        console.error("Failed to load dashboard recent logs:", auditErr);
      }

    } catch (err) {
      console.error("Failed to load landlord dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setShowCreateDropdown(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32 bg-slate-50 dark:bg-[#0D1B2A] rounded-3xl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 font-mono tracking-wider">PREPARING PORTFOLIO...</p>
        </div>
      </div>
    );
  }

  // --- Filtering Logic ---
  const propertyFilter = (item) => {
    return selectedPropertyId === 'all' || item.property_id === Number(selectedPropertyId);
  };

  const periodFilter = (dateStr) => {
    if (!dateStr) return true;
    const date = new Date(dateStr);
    const now = new Date();
    if (selectedPeriod === 'thismonth') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    } else if (selectedPeriod === '3months') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      return date >= threeMonthsAgo && date <= now;
    } else if (selectedPeriod === '12months') {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(now.getMonth() - 12);
      return date >= twelveMonthsAgo;
    }
    return true; // all time
  };

  // Filtered collections for metrics
  const filteredUnits = units.filter(propertyFilter);
  const filteredLedgers = ledgers.filter(l => propertyFilter(l) && periodFilter(l.due_date));
  const filteredMaint = maintRequests.filter(m => propertyFilter(m) && periodFilter(m.created_date));

  // Collections for Cashflow Chart (ignores period filter, only filters by selected property)
  const chartLedgers = ledgers.filter(propertyFilter);
  const chartMaint = maintRequests.filter(propertyFilter);

  // --- Calculate Metrics ---
  // 1. Rent Received vs Expected
  const rentPaid = filteredLedgers.filter(l => l.status === 'PAID').reduce((sum, l) => sum + l.amount, 0);
  const rentTotal = filteredLedgers.reduce((sum, l) => sum + l.amount, 0);
  const rentCollectedPercent = rentTotal > 0 ? Math.round((rentPaid / rentTotal) * 100) : 0;

  // 2. Unpaid Expenses (Maintenance cost where status is not completed/cancelled, or payment status is UNPAID)
  const unpaidExpensesCount = filteredMaint.filter(m => m.payment_status === 'UNPAID' || (m.status !== 'COMPLETED' && m.status !== 'CANCELLED' && m.estimated_cost > 0)).length;
  const unpaidExpensesAmount = filteredMaint.filter(m => m.payment_status === 'UNPAID' || (m.status !== 'COMPLETED' && m.status !== 'CANCELLED')).reduce((sum, m) => sum + (m.estimated_cost || 0), 0);

  // 3. Overdue Rent
  const overdueLedgers = filteredLedgers.filter(l => l.status === 'OVERDUE' || (l.status === 'UNPAID' && new Date(l.due_date) < new Date()));
  const overdueRentCount = overdueLedgers.length;
  const overdueRentAmount = overdueLedgers.reduce((sum, l) => sum + l.amount, 0);

  // 4. Upcoming Expenses
  const upcomingExpensesCount = filteredMaint.filter(m => m.status === 'OPEN' || m.status === 'VENDOR_ASSIGNED').length;
  const upcomingExpensesAmount = filteredMaint.filter(m => m.status === 'OPEN' || m.status === 'VENDOR_ASSIGNED').reduce((sum, m) => sum + (m.estimated_cost || 0), 0);

  // --- Occupancy Stats ---
  const totalUnitsCount = filteredUnits.length;
  const occupiedUnitsCount = filteredUnits.filter(u => u.status === 'OCCUPIED').length;
  const vacantUnitsCount = filteredUnits.filter(u => u.status === 'VACANT').length;
  const maintenanceUnitsCount = filteredUnits.filter(u => u.status === 'MAINTENANCE').length;
  const occupancyPercent = totalUnitsCount > 0 ? Math.round((occupiedUnitsCount / totalUnitsCount) * 100) : 0;

  // --- Action Required Items ---
  const pendingScreening = applications.filter(a => a.screening_status === 'SUBMITTED');
  const approvedScreeningNoLease = applications.filter(a => {
    if (a.screening_status !== 'APPROVED') return false;
    return !leases.some(l => l.unit_id === a.unit_id && l.tenant_email === a.tenant_email);
  });
  const pendingSignatures = leases.filter(l => l.status === 'PENDING_SIGNATURE' || l.status === 'PENDING_TENANT_REVIEW');
  const leasesAwaitingApproval = leases.filter(l => l.status === 'PENDING_LANDLORD_APPROVAL');
  const openMaint = maintRequests.filter(m => m.status === 'OPEN');
  const totalActionsCount = pendingScreening.length + approvedScreeningNoLease.length + pendingSignatures.length + leasesAwaitingApproval.length + openMaint.length;

  // --- Dynamic Monthly Cashflow Generation (Historical 6-Month Timeline) ---
  const cashflowMonths = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString('en-US', { month: 'short' });
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    cashflowMonths.push({ 
      label, 
      monthKey, 
      income: 0, 
      expenses: 0,
      overdue: 0,
      upcoming: 0
    });
  }

  // Group chart ledgers (unfiltered by selected period) by month
  chartLedgers.forEach(l => {
    const d = new Date(l.due_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthObj = cashflowMonths.find(m => m.monthKey === key);
    if (monthObj) {
      if (l.status === 'PAID') {
        monthObj.income += l.amount;
      } else if (l.status === 'OVERDUE' || (l.status === 'UNPAID' && new Date(l.due_date) < new Date())) {
        monthObj.overdue += l.amount;
      }
    }
  });

  // Group chart maintenance requests (unfiltered by selected period) by month
  chartMaint.forEach(m => {
    const d = new Date(m.created_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthObj = cashflowMonths.find(m => m.monthKey === key);
    if (monthObj) {
      if (m.status === 'OPEN' || m.status === 'VENDOR_ASSIGNED') {
        monthObj.upcoming += m.estimated_cost || 0;
      } else if (m.status === 'COMPLETED' || m.payment_status === 'PAID') {
        monthObj.expenses += m.estimated_cost || 0;
      } else {
        monthObj.expenses += m.estimated_cost || 0;
      }
    }
  });

  // --- Calculate Real Portfolio Financial Metrics ---
  const totalMonthlyRent = filteredUnits.reduce((sum, u) => sum + (Number(u.rent_amount) || 0), 0);
  const annualGrossRent = totalMonthlyRent * 12;

  const activeLeases = leases.filter(l => propertyFilter(l) && l.status === 'ACTIVE');
  const activeLeasesAnnualRent = activeLeases.reduce((sum, l) => sum + ((Number(l.rent_amount) || 0) * 12), 0);
  const totalSecurityDeposits = activeLeases.reduce((sum, l) => sum + (Number(l.security_deposit) || 0), 0);

  const totalRevenueCollected = ledgers
    .filter(l => propertyFilter(l) && l.status === 'PAID')
    .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

  const totalMaintenanceExpenses = maintRequests
    .filter(m => propertyFilter(m) && (m.status === 'COMPLETED' || m.payment_status === 'PAID'))
    .reduce((sum, m) => sum + (Number(m.estimated_cost) || 0), 0);

  const contractedYieldPercent = annualGrossRent > 0 ? ((activeLeasesAnnualRent / annualGrossRent) * 100).toFixed(1) : "0.0";


  // --- SVG Chart Calculations ---
  // Find max value in cashflow to scale bars
  const maxCashflowValue = Math.max(...cashflowMonths.map(m => Math.max(m.income, m.expenses, m.overdue, m.upcoming)), 100);
  const chartHeight = 180;
  const getBarHeight = (val) => (val / maxCashflowValue) * chartHeight;

  // Donut chart calculations
  const totalDonut = Math.max(1, totalUnitsCount);
  const occupiedAngle = (occupiedUnitsCount / totalDonut) * 360;
  const vacantAngle = (vacantUnitsCount / totalDonut) * 360;
  const maintAngle = (maintenanceUnitsCount / totalDonut) * 360;

  // Render SVG Donut
  const c = 251.3; // Circumference for r=40
  const dashOccupied = (occupiedUnitsCount / totalDonut) * c;
  const dashVacant = (vacantUnitsCount / totalDonut) * c;
  const dashMaint = (maintenanceUnitsCount / totalDonut) * c;

  const offsetOccupied = 0;
  const offsetVacant = dashOccupied;
  const offsetMaint = dashOccupied + dashVacant;

  if (properties.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in text-left pb-16 font-sans">
        
        {/* Single Merged Hero Card */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-blue-500/[0.04] via-indigo-500/[0.02] to-purple-500/[0.04] dark:from-blue-500/[0.05] dark:via-indigo-500/[0.02] dark:to-purple-500/[0.05] border border-blue-550/20 dark:border-blue-500/30 relative overflow-hidden shadow-sm flex flex-col md:flex-row items-center gap-8 group animate-fade-in">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/[0.03] dark:bg-blue-500/[0.04] rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative p-6 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/20 flex-shrink-0 animate-bounce-slow">
            <Building2 className="w-14 h-14 stroke-[1.5]" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full" />
          </div>

          <div className="space-y-5 text-center md:text-left flex-1 relative z-10">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <span className="inline-flex items-center text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-xl border border-slate-200/50 dark:border-white/10 font-mono">
                  Properties: 0
                </span>
                <span className="inline-flex items-center text-[10px] font-black text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                  ONBOARDING
                </span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                Welcome, {user?.name || 'Landlord'}! <Sparkles className="inline-block w-6 h-6 text-blue-500 animate-pulse shrink-0 animate-bounce-slow" />
              </h2>
              
              <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 tracking-wide uppercase">
                Your workspace is ready.
              </h3>
              
              <p className="text-sm text-slate-500 dark:text-gray-400 font-medium max-w-2xl leading-relaxed">
                Create your first property to start managing everything in one place. Draft leases, approve tenant applications, schedule maintenance, and automate rent invoicing.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-4">
              <button
                onClick={() => {
                  localStorage.setItem('open_add_property_modal', 'true');
                  setActivePage('properties_hub');
                }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-lg shadow-blue-550/15 hover:shadow-blue-550/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition duration-200 flex items-center gap-2 cursor-pointer text-sm"
              >
                <Plus className="w-4.5 h-4.5 stroke-[2.5]" /> Create Property
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Steps Roadmap */}
        <div className="space-y-5 animate-fade-in">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Getting Started is Easy</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Follow these three standard steps to initialize your landlord dashboard</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Step 1 */}
            <div 
              className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/10 transition-all duration-350 flex flex-col justify-between text-left"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">1. Add Properties & Units</h4>
                  <p className="text-[11px] text-slate-500 dark:text-gray-400 font-medium leading-relaxed font-sans">
                    Set up your real estate assets. Register and manage single-family rental properties.
                  </p>

                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div 
              className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/10 transition-all duration-350 flex flex-col justify-between text-left"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">2. Draft Digital Leases</h4>
                  <p className="text-[11px] text-slate-500 dark:text-gray-450 font-medium leading-relaxed font-sans">
                    Establish lease terms, security deposits, monthly rent values, and late fee rules using pre-approved templates.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div 
              className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/10 transition-all duration-350 flex flex-col justify-between text-left"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">3. Onboard & Automate</h4>
                  <p className="text-[11px] text-slate-500 dark:text-gray-455 font-medium leading-relaxed font-sans">
                    Invite tenants to sign leases, set up auto-pay, track monthly collection ledgers, and automate ticket assignments.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Feature Lock Previews */}
        <div className="space-y-5 border-t border-slate-200/60 dark:border-white/[0.05] pt-8 animate-fade-in">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white font-sans">Workspace Feature Suite</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Explore standard tools that unlock immediately after adding a property</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50/50 dark:bg-[#1E2E42]/20 border border-slate-100 dark:border-white/[0.03] flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-blue-500 shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="text-left space-y-1">
                <h5 className="text-xs font-black text-slate-800 dark:text-white font-sans">Rent Invoicing</h5>
                <p className="text-[10px] text-slate-500 dark:text-gray-400 font-semibold leading-normal">Track paid, unpaid, and overdue rental invoices automatically.</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50/50 dark:bg-[#1E2E42]/20 border border-slate-100 dark:border-white/[0.03] flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-purple-500 shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <div className="text-left space-y-1">
                <h5 className="text-xs font-black text-slate-800 dark:text-white font-sans">Maintenance Desk</h5>
                <p className="text-[10px] text-slate-500 dark:text-gray-400 font-semibold leading-normal">Assign service requests to vendors and track cost estimates.</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50/50 dark:bg-[#1E2E42]/20 border border-slate-100 dark:border-white/[0.03] flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-amber-500 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-left space-y-1">
                <h5 className="text-xs font-black text-slate-800 dark:text-white font-sans">Tenant Screening</h5>
                <p className="text-[10px] text-slate-500 dark:text-gray-400 font-semibold leading-normal">Review applications, credit scores, and background check files.</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50/50 dark:bg-[#1E2E42]/20 border border-slate-100 dark:border-white/[0.03] flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-emerald-500 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-left space-y-1">
                <h5 className="text-xs font-black text-slate-800 dark:text-white font-sans">Financial Yields</h5>
                <p className="text-[10px] text-slate-500 dark:text-gray-400 font-semibold leading-normal">Generate historical cashflow charts and annual valuation metrics.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-left pb-16 font-sans">
      
      {/* ── Page Header & Unified Layout Card matching HOA ── */}
      <div className="bg-white dark:bg-[#1E2E42] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 sm:p-8 text-slate-800 dark:text-white shadow-sm dark:shadow-none relative overflow-visible flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 group animate-fade-in">
        {/* Subtle premium light blue glow wrapper to prevent overflow clipping */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/[0.03] dark:bg-blue-500/[0.02] rounded-full blur-3xl" />
        </div>

        {/* Left: Premium Welcome & Metadata */}
        <div className="flex-1 min-w-0 relative z-10 space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight flex items-center gap-2">
              Welcome back, {user?.name?.split(' ')[0] || 'Landlord'}! <Sparkles className="w-6 h-6 text-blue-550 dark:text-blue-400 animate-pulse shrink-0 animate-bounce-slow" />
            </h1>
            <p className="text-slate-500 dark:text-gray-455 text-xs mt-1 font-medium">
              Rental Console • Real-Time Portfolio Summary
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center text-[10px] font-bold text-slate-600 dark:text-slate-350 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-xl border border-slate-200/50 dark:border-white/10 font-mono">
              Properties: {properties.length}
            </span>
            <span className="inline-flex items-center text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
              ACTIVE
            </span>
          </div>

          {/* Inline Controls (Period Filter & Action Button) */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* Time Period Filter */}
            <div className="relative flex items-center">
              <Calendar className="absolute left-3 w-4 h-4 text-slate-450 dark:text-slate-400 pointer-events-none" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="appearance-none bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 py-2 pl-9 pr-10 rounded-xl text-xs font-bold shadow-sm hover:border-blue-550 transition focus:outline-none cursor-pointer"
              >
                <option value="thismonth">This Month</option>
                <option value="3months">Last 3 Months</option>
                <option value="12months">Last 12 Months</option>
                <option value="alltime">All Time</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-450 dark:text-slate-400 pointer-events-none" />
            </div>

            {/* Create New Action Button */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 transition active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Create new
              </button>

              {showCreateDropdown && (
                <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-[#1A2635] border border-slate-100 dark:border-white/10 rounded-2xl shadow-2xl z-30 py-2 text-slate-800 dark:text-slate-200 overflow-hidden animate-slide-up">
                  <button
                    onClick={() => { 
                      localStorage.setItem('open_add_property_modal', 'true');
                      setActivePage('properties_hub'); 
                      setShowCreateDropdown(false); 
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition flex items-center gap-2 cursor-pointer"
                  >
                    <Building2 className="w-4 h-4 text-blue-500" /> Add Property
                  </button>
                  <button
                    onClick={() => { 
                      localStorage.setItem('open_create_lease_modal', 'true');
                      setActivePage('leases_hub'); 
                      setShowCreateDropdown(false); 
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-purple-500" /> Draft Lease Agreement
                  </button>
                  <button
                    onClick={() => { 
                      localStorage.setItem('open_create_ticket_modal', 'true');
                      setActivePage('servicereq'); 
                      setShowCreateDropdown(false); 
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition flex items-center gap-2 cursor-pointer"
                  >
                    <Wrench className="w-4 h-4 text-amber-500" /> Log Maintenance Ticket
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side stats block matching HOA layout */}
        <div className="relative z-10 w-full lg:w-auto mt-5 lg:mt-0 pt-5 lg:pt-0 border-t border-slate-200/60 dark:border-white/5 lg:border-t-0">
          <div className="grid grid-cols-2 sm:flex sm:flex-row sm:items-center sm:justify-around lg:justify-end gap-5 sm:gap-8 lg:gap-11 w-full">
            <div className="text-center flex flex-col items-center min-w-[65px]">
              <p className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">{properties.length}</p>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-gray-455 uppercase tracking-widest mt-1">Properties</p>
            </div>
            <div className="text-center flex flex-col items-center min-w-[65px]">
              <p className="text-3xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">{totalUnitsCount}</p>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-gray-455 uppercase tracking-widest mt-1">Total Units</p>
            </div>
            <div className="text-center flex flex-col items-center min-w-[65px]">
              <p className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">{occupiedUnitsCount}</p>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-gray-455 uppercase tracking-widest mt-1">Tenants</p>
            </div>
            <div className="text-center flex flex-col items-center min-w-[65px]">
              <p className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-500 font-mono tracking-tight">{upcomingExpensesCount}</p>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-gray-455 uppercase tracking-widest mt-1">Open Tickets</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leases Awaiting Approval Alert */}
      {leasesAwaitingApproval.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 dark:border-amber-500/20 rounded-3xl p-5 sm:p-6 text-slate-800 dark:text-white shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in mb-6">
          <div className="flex items-center gap-3.5 text-left">
            <div className="p-3 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-800 dark:text-amber-400">Lease Agreement Awaiting Your Review</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {leasesAwaitingApproval.length === 1 
                  ? `A tenant has signed the lease terms and submitted onboarding details. Please review and approve to activate.`
                  : `${leasesAwaitingApproval.length} lease agreements have been signed by tenants and are awaiting your final approval.`
                }
              </p>
            </div>
          </div>
          <button
            onClick={() => setActivePage('leases_hub')}
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-600/25 hover:shadow-amber-600/40 shrink-0 cursor-pointer text-center"
          >
            Review & Approve
          </button>
        </div>
      )}

      {/* --- Main 4-Metrics Row --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1: Rent Received */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.05] hover:border-emerald-500/30 transition shadow-sm hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest block">Rent received</span>
              <span className="text-2xl font-black text-gray-950 dark:text-white mt-1 block">${rentPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 dark:text-gray-500">
              <span>Collection Rate</span>
              <span className="text-emerald-500">{rentCollectedPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700" 
                style={{ width: `${rentCollectedPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Metric 2: Unpaid Expenses */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.05] hover:border-rose-500/30 transition shadow-sm hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest block">Unpaid expenses</span>
              <span className="text-2xl font-black text-gray-950 dark:text-white mt-1 block">${unpaidExpensesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between text-xs font-bold">
            <span className="text-gray-400 dark:text-gray-500">Active Invoices</span>
            <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md font-mono text-[10px]">
              {unpaidExpensesCount} unpaid
            </span>
          </div>
        </div>

        {/* Metric 3: Overdue Rent */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.05] hover:border-amber-500/30 transition shadow-sm hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest block">Overdue rent</span>
              <span className="text-2xl font-black text-gray-955 dark:text-white mt-1 block">${overdueRentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between text-xs font-bold">
            <span className="text-gray-400 dark:text-gray-500">Overdue Invoices</span>
            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-450 dark:text-amber-400 px-2 py-0.5 rounded-md font-mono text-[10px]">
              {overdueRentCount} overdue
            </span>
          </div>
        </div>

        {/* Metric 4: Upcoming Expenses */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.05] hover:border-blue-500/30 transition shadow-sm hover:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest block">Upcoming expenses</span>
              <span className="text-2xl font-black text-gray-950 dark:text-white mt-1 block">${upcomingExpensesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between text-xs font-bold">
            <span className="text-gray-400 dark:text-gray-500">Open Tickets</span>
            <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md font-mono text-[10px]">
              {upcomingExpensesCount} this month
            </span>
          </div>
        </div>
      </div>

      {/* --- Section: Cashflow & Tabbed Requests (Grid 8/4) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Animated Custom Cashflow SVG Chart */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.05] relative shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white">Cashflow Summary</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Real-time Income vs Expense comparison (6 Month Period)</p>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-2 text-xs font-bold shrink-0 whitespace-nowrap">
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                <span className="w-3 h-3 rounded bg-emerald-500 block"></span> Income
              </span>
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                <span className="w-3 h-3 rounded bg-rose-500 block"></span> Expenses
              </span>
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                <span className="w-3 h-3 rounded bg-amber-500 block"></span> Overdue Rent
              </span>
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                <span className="w-3 h-3 rounded bg-blue-500 block"></span> Upcoming Exp
              </span>
            </div>
          </div>

          {/* Interactive Chart Container */}
          <div className="relative pt-2">
            <svg viewBox="0 0 600 260" className="w-full h-auto overflow-visible select-none">
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F43F5E" />
                  <stop offset="100%" stopColor="#E11D48" />
                </linearGradient>
                <linearGradient id="overdueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
                <linearGradient id="upcomingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
                const y = 30 + p * chartHeight;
                return (
                  <g key={i}>
                    <line x1="40" y1={y} x2="580" y2={y} stroke="currentColor" className="text-slate-200 dark:text-white/5" strokeDasharray="4" />
                    <text x="32" y={y + 4} textAnchor="end" className="fill-slate-400 dark:fill-gray-500 text-[10px] font-bold font-mono">
                      ${Math.round(maxCashflowValue * (1 - p)).toLocaleString()}
                    </text>
                  </g>
                );
              })}

              {/* Draw Monthly Bar Groups */}
              {cashflowMonths.map((m, idx) => {
                const groupX = 65 + idx * 85;
                const incHeight = getBarHeight(m.income);
                const expHeight = getBarHeight(m.expenses);
                const ovdHeight = getBarHeight(m.overdue);
                const upcHeight = getBarHeight(m.upcoming);

                const incY = 30 + chartHeight - incHeight;
                const expY = 30 + chartHeight - expHeight;
                const ovdY = 30 + chartHeight - ovdHeight;
                const upcY = 30 + chartHeight - upcHeight;

                const barWidth = 11;
                const gap = 2;

                return (
                  <g key={m.monthKey}>
                    {/* Income Bar */}
                    <rect
                      x={groupX}
                      y={incY}
                      width={barWidth}
                      height={incHeight}
                      fill="url(#incomeGrad)"
                      rx="2"
                      className="transition-all duration-300 hover:opacity-85 cursor-pointer"
                      onMouseEnter={(e) => setHoveredBar({
                        month: m.label,
                        type: 'Income',
                        val: m.income,
                        x: groupX + barWidth / 2,
                        y: incY - 10
                      })}
                      onMouseLeave={() => setHoveredBar(null)}
                    />

                    {/* Expense Bar */}
                    <rect
                      x={groupX + barWidth + gap}
                      y={expY}
                      width={barWidth}
                      height={expHeight}
                      fill="url(#expenseGrad)"
                      rx="2"
                      className="transition-all duration-300 hover:opacity-85 cursor-pointer"
                      onMouseEnter={(e) => setHoveredBar({
                        month: m.label,
                        type: 'Expense',
                        val: m.expenses,
                        x: groupX + barWidth + gap + barWidth / 2,
                        y: expY - 10
                      })}
                      onMouseLeave={() => setHoveredBar(null)}
                    />

                    {/* Overdue Rent Bar */}
                    <rect
                      x={groupX + 2 * (barWidth + gap)}
                      y={ovdY}
                      width={barWidth}
                      height={ovdHeight}
                      fill="url(#overdueGrad)"
                      rx="2"
                      className="transition-all duration-300 hover:opacity-85 cursor-pointer"
                      onMouseEnter={(e) => setHoveredBar({
                        month: m.label,
                        type: 'Overdue Rent',
                        val: m.overdue,
                        x: groupX + 2 * (barWidth + gap) + barWidth / 2,
                        y: ovdY - 10
                      })}
                      onMouseLeave={() => setHoveredBar(null)}
                    />

                    {/* Upcoming Expense Bar */}
                    <rect
                      x={groupX + 3 * (barWidth + gap)}
                      y={upcY}
                      width={barWidth}
                      height={upcHeight}
                      fill="url(#upcomingGrad)"
                      rx="2"
                      className="transition-all duration-300 hover:opacity-85 cursor-pointer"
                      onMouseEnter={(e) => setHoveredBar({
                        month: m.label,
                        type: 'Upcoming Exp',
                        val: m.upcoming,
                        x: groupX + 3 * (barWidth + gap) + barWidth / 2,
                        y: upcY - 10
                      })}
                      onMouseLeave={() => setHoveredBar(null)}
                    />

                    {/* X-axis Label */}
                    <text
                      x={groupX + 2 * barWidth + 1.5 * gap}
                      y={235}
                      textAnchor="middle"
                      className="fill-slate-600 dark:fill-gray-400 text-[11px] font-extrabold"
                    >
                      {m.label}
                    </text>
                  </g>
                );
              })}

              {/* Base Line */}
              <line x1="40" y1={30 + chartHeight} x2="580" y2={30 + chartHeight} stroke="currentColor" className="text-slate-300 dark:text-white/10" strokeWidth="1.5" />
            </svg>

            {/* Custom Tooltip */}
            {hoveredBar && (
              <div 
                className="absolute bg-slate-950/95 dark:bg-slate-900/95 text-white p-2 rounded-xl shadow-xl text-[10px] font-bold border border-white/10 pointer-events-none transition-all duration-150 z-10"
                style={{
                  left: `${(hoveredBar.x / 600) * 100}%`,
                  top: `${(hoveredBar.y / 260) * 100}%`,
                  transform: 'translate(-50%, -100%)'
                }}
              >
                <div className="text-slate-400 uppercase tracking-wider text-[9px] mb-0.5">{hoveredBar.month} {hoveredBar.type}</div>
                <div className="text-xs font-black font-mono">${hoveredBar.val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Sidebar Panel (Tabs: Actions Required & Tenant Requests) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.05] shadow-sm flex flex-col justify-between min-h-[380px]">
          <div>
            {/* Tabs Header */}
            <div className="flex border-b border-slate-100 dark:border-white/[0.06] mb-5">
              <button
                onClick={() => setActiveSidebarTab('actions')}
                className={`pb-3 text-sm font-black transition relative flex items-center gap-2 cursor-pointer ${
                  activeSidebarTab === 'actions'
                    ? 'text-blue-500 dark:text-blue-400'
                    : 'text-slate-400 dark:text-gray-500 hover:text-slate-650'
                }`}
              >
                Action Required
                {totalActionsCount > 0 && (
                  <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 min-w-[16px] text-center">
                    {totalActionsCount}
                  </span>
                )}
                {activeSidebarTab === 'actions' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 dark:bg-blue-400 rounded-full" />
                )}
              </button>
              
              <button
                onClick={() => setActiveSidebarTab('requests')}
                className={`ml-6 pb-3 text-sm font-black transition relative flex items-center gap-2 cursor-pointer ${
                  activeSidebarTab === 'requests'
                    ? 'text-blue-500 dark:text-blue-400'
                    : 'text-slate-400 dark:text-gray-500 hover:text-slate-650'
                }`}
              >
                Tenant Requests
                {filteredMaint.length > 0 && (
                  <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 min-w-[16px] text-center">
                    {filteredMaint.length}
                  </span>
                )}
                {activeSidebarTab === 'requests' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 dark:bg-blue-400 rounded-full" />
                )}
              </button>
            </div>

            {/* Tab Body */}
            {activeSidebarTab === 'actions' ? (
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                {totalActionsCount === 0 ? (
                  <div className="py-12 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center">
                    <CheckCircle2 className="w-10 h-10 mb-2 text-emerald-500/60" />
                    <p className="text-xs font-bold">All Caught Up!</p>
                    <p className="text-[10px] text-gray-450 mt-1">No urgent actions require attention</p>
                  </div>
                ) : (
                  <>
                    {pendingScreening.map(app => (
                      <div key={app.application_id} className="p-3.5 rounded-2xl bg-amber-500/[0.03] dark:bg-amber-500/[0.01] border border-amber-500/10 dark:border-amber-500/5 flex items-center justify-between gap-3 text-xs font-semibold shadow-sm hover:border-amber-500/30 transition text-left">
                        <div className="min-w-0 space-y-0.5">
                          <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider block">New Screening</span>
                          <p className="text-xs text-slate-800 dark:text-white font-bold truncate">{app.full_name}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-normal truncate">Unit {app.unit?.unit_number} (FICO: {app.credit_score})</p>
                        </div>
                        <button 
                          onClick={() => setActivePage('screening_hub')}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition whitespace-nowrap cursor-pointer shrink-0"
                        >
                          Review
                        </button>
                      </div>
                    ))}

                    {approvedScreeningNoLease.map(app => (
                      <div key={app.application_id} className="p-3.5 rounded-2xl bg-blue-500/[0.03] dark:bg-blue-500/[0.01] border border-blue-500/10 dark:border-blue-500/5 flex items-center justify-between gap-3 text-xs font-semibold shadow-sm hover:border-blue-500/30 transition text-left">
                        <div className="min-w-0 space-y-0.5">
                          <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider block">Ready for Lease</span>
                          <p className="text-xs text-slate-800 dark:text-white font-bold truncate">{app.full_name}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-normal truncate">Unit {app.unit?.unit_number}</p>
                        </div>
                        <button 
                          onClick={() => {
                            localStorage.setItem('prefill_lease_email', app.tenant_email);
                            localStorage.setItem('prefill_lease_unit_id', app.unit_id.toString());
                            setActivePage('leases_hub');
                          }}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition whitespace-nowrap cursor-pointer shrink-0"
                        >
                          Draft
                        </button>
                      </div>
                    ))}

                    {leasesAwaitingApproval.map(lease => (
                      <div key={lease.lease_id} className="p-3.5 rounded-2xl bg-orange-500/[0.03] dark:bg-orange-500/[0.01] border border-orange-500/10 dark:border-orange-500/5 flex items-center justify-between gap-3 text-xs font-semibold shadow-sm hover:border-orange-500/30 transition text-left animate-pulse">
                        <div className="min-w-0 space-y-0.5">
                          <span className="text-[9px] text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider block">Approval Needed</span>
                          <p className="text-xs text-slate-800 dark:text-white font-bold truncate">Unit {lease.unit?.unit_number || 'N/A'}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-normal truncate">{lease.tenant_email}</p>
                        </div>
                        <button 
                          onClick={() => {
                            localStorage.setItem('pending_lease_id', lease.lease_id);
                            setActivePage('leases_hub');
                          }}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition whitespace-nowrap cursor-pointer shrink-0"
                        >
                          Review & Sign
                        </button>
                      </div>
                    ))}

                    {pendingSignatures.map(lease => (
                      <div key={lease.lease_id} className="p-3.5 rounded-2xl bg-purple-500/[0.03] dark:bg-purple-500/[0.01] border border-purple-500/10 dark:border-purple-500/5 flex items-center justify-between gap-3 text-xs font-semibold shadow-sm hover:border-purple-500/30 transition text-left">
                        <div className="min-w-0 space-y-0.5">
                          <span className="text-[9px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider block">Pending Sign</span>
                          <p className="text-xs text-slate-800 dark:text-white font-bold truncate">Unit {lease.unit?.unit_number || 'N/A'}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-normal truncate">{lease.tenant_email}</p>
                        </div>
                        <button 
                          onClick={() => {
                            localStorage.setItem('pending_lease_id', lease.lease_id);
                            setActivePage('leases_hub');
                          }}
                          className="bg-purple-600 hover:bg-purple-500 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition whitespace-nowrap cursor-pointer shrink-0"
                        >
                          Status
                        </button>
                      </div>
                    ))}

                    {openMaint.map(req => (
                      <div key={req.request_id} className="p-3.5 rounded-2xl bg-rose-500/[0.03] dark:bg-rose-500/[0.01] border border-rose-500/10 dark:border-rose-500/5 flex items-center justify-between gap-3 text-xs font-semibold shadow-sm hover:border-rose-500/30 transition text-left">
                        <div className="min-w-0 space-y-0.5">
                          <span className="text-[9px] text-rose-600 dark:text-rose-500 font-bold uppercase tracking-wider block">New Ticket</span>
                          <p className="text-xs text-slate-800 dark:text-white font-bold truncate">{req.title}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-normal truncate">Unit {req.unit_number} • Priority: {req.priority}</p>
                        </div>
                        <button 
                          onClick={() => setActivePage('servicereq')}
                          className="bg-rose-500 hover:bg-rose-600 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition whitespace-nowrap cursor-pointer shrink-0"
                        >
                          Assign
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredMaint.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center">
                    <CheckCircle2 className="w-10 h-10 mb-2 text-emerald-500/60" />
                    <p className="text-xs font-bold">No active requests</p>
                    <p className="text-[10px] text-gray-450 mt-1">Tenant tickets will show up here</p>
                  </div>
                ) : (
                  filteredMaint.slice(0, 4).map((req, idx) => (
                    <div 
                      key={req.request_id || idx}
                      className="p-3.5 rounded-2xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] flex flex-col gap-2 hover:border-blue-500/20 transition cursor-pointer text-left"
                      onClick={() => setActivePage('servicereq')}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200 block truncate">{req.title}</span>
                          <span className="text-[10px] font-bold text-gray-455 block truncate mt-0.5">{req.property_name} • Unit {req.unit_number}</span>
                        </div>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                          req.priority === 'URGENT' || req.priority === 'HIGH'
                            ? 'bg-rose-500/10 text-rose-500'
                            : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-400'
                        }`}>
                          {req.priority}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-bold border-t border-slate-100 dark:border-white/[0.03] pt-2">
                        <span className="text-slate-400 dark:text-gray-500">
                          {new Date(req.created_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wide font-black ${
                          req.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : req.status === 'IN_PROGRESS' || req.status === 'VENDOR_ASSIGNED'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          {req.status?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {activeSidebarTab === 'requests' && filteredMaint.length > 4 && (
            <div className="pt-4 border-t border-slate-100 dark:border-white/[0.04] text-center">
              <button 
                onClick={() => setActivePage('servicereq')}
                className="text-[10px] font-bold text-blue-500 hover:underline cursor-pointer font-sans"
              >
                +{filteredMaint.length - 4} more requests. View all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- Portfolio Analytics Row (Donut, Radial, Valuation) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Analytics 1: Property Overview Donut Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.05] shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-gray-900 dark:text-white mb-1">Property Overview</h3>
            <p className="text-[11px] text-gray-550 dark:text-gray-405">Portfolio breakdown by unit status</p>
          </div>

          <div className="flex items-center justify-around py-4 gap-4">
            {/* SVG Donut */}
            <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" className="text-slate-100 dark:text-white/5" strokeWidth="8" />
                
                {totalUnitsCount > 0 ? (
                  <>
                    {/* Occupied (emerald) */}
                    {dashOccupied > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#10B981"
                        strokeWidth="10"
                        strokeDasharray={`${dashOccupied} ${c}`}
                        strokeDashoffset={-offsetOccupied}
                        strokeLinecap="round"
                      />
                    )}
                    {/* Vacant (blue) */}
                    {dashVacant > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#3B82F6"
                        strokeWidth="10"
                        strokeDasharray={`${dashVacant} ${c}`}
                        strokeDashoffset={-offsetVacant}
                        strokeLinecap="round"
                      />
                    )}
                    {/* Maintenance (amber) */}
                    {dashMaint > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#F59E0B"
                        strokeWidth="10"
                        strokeDasharray={`${dashMaint} ${c}`}
                        strokeDashoffset={-offsetMaint}
                        strokeLinecap="round"
                      />
                    )}
                  </>
                ) : (
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#94A3B8" strokeWidth="10" />
                )}
              </svg>

              <div className="absolute text-center">
                <span className="text-xl font-black text-slate-900 dark:text-white">{totalUnitsCount}</span>
                <span className="text-[9px] font-bold text-gray-400 block uppercase tracking-wider">Units</span>
              </div>
            </div>

            {/* Legend & Count */}
            <div className="space-y-2 text-xs font-bold">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
                <span className="text-gray-600 dark:text-gray-300">Occupied ({occupiedUnitsCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-blue-500"></span>
                <span className="text-gray-600 dark:text-gray-300">Vacant ({vacantUnitsCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
                <span className="text-gray-600 dark:text-gray-300">Maintenance ({maintenanceUnitsCount})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics 2: Occupancy Rate Radial Gauge */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.05] shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-gray-900 dark:text-white mb-1">Occupancy Rate</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Target occupancy benchmark</p>
          </div>

          <div className="flex flex-col items-center py-2">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" className="text-slate-100 dark:text-white/5" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#3B82F6"
                  strokeWidth="8"
                  strokeDasharray={251.3}
                  strokeDashoffset={251.3 - (251.3 * occupancyPercent) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-xl font-black text-slate-900 dark:text-white">{occupancyPercent}%</span>
                <span className="text-[8px] font-black text-blue-500 block uppercase tracking-widest mt-0.5">Leased</span>
              </div>
            </div>
          </div>

          <div className="text-center text-xs font-bold text-gray-400">
            {occupiedUnitsCount} of {totalUnitsCount} units are active leased
          </div>
        </div>

        {/* Analytics 3: Real Portfolio Valuation & Revenue Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.05] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white mb-1">Portfolio Valuation</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Based on active units & rental contracts</p>
              </div>
              <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> +{contractedYieldPercent}% Leased
              </span>
            </div>

            <div className="mt-5">
              <span className="text-3xl font-black text-slate-950 dark:text-white font-mono">
                ${annualGrossRent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] font-bold text-emerald-500 block mt-1">
                +${totalRevenueCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} rent collected to date
              </span>
            </div>
          </div>

          <div className="mt-5 space-y-3.5">
            <div>
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 mb-1">
                <span>Contracted Rent vs Potential</span>
                <span>${activeLeasesAnnualRent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} of ${annualGrossRent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-700" 
                  style={{ width: `${annualGrossRent > 0 ? Math.min(100, (activeLeasesAnnualRent / annualGrossRent) * 100) : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-white/[0.04] flex justify-between items-center text-[10px] font-bold text-gray-500 dark:text-gray-400">
              <span>Deposits: <strong className="text-slate-800 dark:text-white">${totalSecurityDeposits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
              <span>Expenses: <strong className="text-rose-500">${totalMaintenanceExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* --- Recent Portfolio Activity Section --- */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.05] shadow-sm mt-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" /> Recent Portfolio Activity
          </h2>
          <button 
            onClick={() => setActivePage('audit')}
            className="text-xs font-bold text-blue-500 hover:underline"
          >
            View Full Audit Trail
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
          {recentLogs.length === 0 ? (
            <div className="py-10 text-center text-gray-400 dark:text-gray-500">
              <Clock className="w-8 h-8 mx-auto mb-2 text-slate-350 dark:text-slate-650 animate-pulse" />
              <p className="text-xs font-bold">No recent activities logged</p>
            </div>
          ) : (
            recentLogs.map((log, idx) => (
              <div 
                key={log.audit_id || idx}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                    log.action?.includes('CREATE') || log.action?.includes('LOGIN')
                      ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/10'
                      : log.action?.includes('DELETE')
                        ? 'bg-red-500/10 text-red-655 dark:bg-red-500/20 dark:text-red-400 border border-red-500/10'
                        : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/10'
                  }`}>
                    {log.action}
                  </span>
                  <div className="text-left">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {log.description ? log.description.replace(/User:\s+([^(]+)\s+\(ID:[^)]+\)/gi, '$1') : '—'}
                    </span>
                    {log.user_name && (
                      <span className="text-[10px] text-slate-400 dark:text-gray-500 block mt-0.5">
                        Performed by {log.user_name}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-slate-450 dark:text-gray-500 font-medium shrink-0">
                  {new Date(log.created_at).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
      
    </div>
  );
}
