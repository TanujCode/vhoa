import React, { useState, useEffect } from 'react';
import { 
  CreditCard, DollarSign, Activity, Settings2, 
  ShieldAlert, Sparkles, CheckCircle2, X, Landmark, Edit3,
  Car, PawPrint, Eye, FileText, Check, Mail, Clock, Calendar,
  History, TrendingUp, AlertTriangle, ChevronRight, ArrowRight,
  Wrench, Shield, Building2, User as UserIcon, Printer, Download,
  CheckCircle, ArrowDownLeft, ArrowUpRight, Search, Filter, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import API from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import Logo from '../../components/marketing/Logo';

// Translucent Status Badge mapping
const StatusBadge = ({ status }) => {
  const map = {
    PAID: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20',
    COMPLETED: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20',
    OVERDUE: 'text-rose-600 dark:text-rose-450 bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/20',
    UNPAID: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20',
    'N/A': 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase whitespace-nowrap ${map[status] || 'text-gray-500 border-gray-500/20'}`}>
      {status}
    </span>
  );
};

export default function RentLedger({ user, selectedPropertyFilterId = 'all' }) {
  const isLandlord = user?.role === 'landlord' || user?.role_name === 'landlord' || user?.role_id === 1;

  // Active Sub-Tab: 'rent' | 'maintenance' | 'history' | 'autopay' | 'vendors'
  const [activeTab, setActiveTab] = useState('rent');

  const [invoices, setInvoices] = useState([]);
  const [leases, setLeases] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState('ALL');

  // Payment states for Rent Invoice
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payMethod, setPayMethod] = useState('ACH');
  const [showPayModal, setShowPayModal] = useState(false);

  // Payment states for Maintenance Request
  const [selectedMaintReq, setSelectedMaintReq] = useState(null);
  const [showMaintPayModal, setShowMaintPayModal] = useState(false);
  const [maintPayLoading, setMaintPayLoading] = useState(false);

  // Itemized breakdown modal state
  const [detailsInvoice, setDetailsInvoice] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Receipt Modal State
  const [receiptTxn, setReceiptTxn] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Edit Late Fee states
  const [showEditFeeModal, setShowEditFeeModal] = useState(false);
  const [editFeeInvoice, setEditFeeInvoice] = useState(null);
  const [editFeeAmount, setEditFeeAmount] = useState('');
  const [editFeeLoading, setEditFeeLoading] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    confirmText: 'OK', 
    cancelText: 'Cancel', 
    onConfirm: null, 
    onCancel: null, 
    type: 'info', 
    singleButton: false 
  });

  const showAlert = (title, message, type = 'info') => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      confirmText: 'OK',
      singleButton: true,
      type,
      onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const showConfirm = (title, message, onConfirm, type = 'danger', confirmText = 'Yes, Proceed') => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText: 'Cancel',
      singleButton: false,
      type,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const getInvoiceSeqNum = (inv) => {
    const propId = inv.lease?.unit?.property_id;
    if (!propId) return inv.invoice_id;
    const propInvoices = invoices
      .filter(item => item.lease?.unit?.property_id === propId)
      .sort((a, b) => a.invoice_id - b.invoice_id);
    const idx = propInvoices.findIndex(item => item.invoice_id === inv.invoice_id);
    return idx !== -1 ? idx + 1 : inv.invoice_id;
  };

  useEffect(() => {
    fetchData();

    const handleGlobalUpdate = () => {
      fetchData();
    };
    window.addEventListener('rental-data-changed', handleGlobalUpdate);
    return () => {
      window.removeEventListener('rental-data-changed', handleGlobalUpdate);
    };
  }, [user?.property_name, user?.unit_number]);

  async function fetchData() {
    try {
      setLoading(true);
      
      // 1. Fetch Leases & Rent Ledgers
      const [leaseRes, maintRes, txnRes] = await Promise.allSettled([
        API.get('/rental/leases'),
        API.get('/rental/maintenance'),
        API.get('/rental/transactions')
      ]);

      const allLeases = leaseRes.status === 'fulfilled' ? leaseRes.value.data || [] : [];
      setLeases(allLeases);

      // Maintenance requests
      if (maintRes.status === 'fulfilled') {
        setMaintenanceRequests(maintRes.value.data || []);
      }

      // Unified transactions
      if (txnRes.status === 'fulfilled') {
        setTransactions(txnRes.value.data || []);
      }

      // Invoices
      const allInvoices = [];
      const validLeases = allLeases.filter(l => !['CANCELLED', 'REJECTED', 'TERMINATED', 'VOID', 'EXPIRED'].includes((l.status || '').toUpperCase()));
      const tenantLeases = validLeases.length > 0 ? validLeases : allLeases;

      for (const lease of tenantLeases) {
        try {
          const ledgerRes = await API.get(`/rental/leases/${lease.lease_id}/ledgers`);
          allInvoices.push(...ledgerRes.data.map(i => ({ ...i, lease })));
        } catch (lErr) {
          console.warn("Could not fetch ledgers for lease", lease.lease_id, lErr);
        }
      }
      allInvoices.sort((a, b) => a.invoice_id - b.invoice_id);
      setInvoices(allInvoices);

      // Fetch vendors if landlord
      if (isLandlord) {
        try {
          const vRes = await API.get('/rental/vendors');
          setVendors(vRes.data || []);
        } catch (_) {}
      }

    } catch (err) {
      console.error("Error fetching financial data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSimulateBilling() {
    showConfirm(
      "Trigger Rent Rolls",
      "Are you sure you want to trigger rent rolls? This will generate monthly rent invoice ledger records for all active tenant leases.",
      async () => {
        try {
          const res = await API.post('/rental/simulate/monthly-billing');
          showAlert("Success", res.data.message || 'Billing simulation executed.', "success");
          fetchData();
        } catch (err) {
          showAlert("Error", "Failed to run billing simulation.", "danger");
        }
      },
      "info",
      "Yes, Trigger"
    );
  }

  async function handleSimulateLateFees() {
    showConfirm(
      "Apply Late Fees",
      "Are you sure you want to run late fee calculations for all unpaid invoices? This will assess configured USA initial and recurring late fees to all overdue accounts.",
      async () => {
        try {
          const res = await API.post('/rental/simulate/late-fees');
          showAlert("Success", res.data.message || 'Late fee simulation executed.', "success");
          fetchData();
        } catch (err) {
          showAlert("Error", "Failed to run late fee simulation.", "danger");
        }
      },
      "warning",
      "Yes, Run Late Fees"
    );
  }

  async function handleSendDueReminders() {
    showConfirm(
      "Send Rent Due Email Reminders",
      "Send automated pre-due warning reminder emails to all tenants whose rent is due or approaching grace period expiration?",
      async () => {
        try {
          const res = await API.post('/rental/simulate/send-reminders');
          showAlert("Reminders Dispatched", res.data.message || 'Pre-due warning emails sent successfully.', "success");
          fetchData();
        } catch (err) {
          showAlert("Error", "Failed to send due reminder emails.", "danger");
        }
      },
      "info",
      "Yes, Send Emails"
    );
  }

  async function handleApplySingleLateFee(invoiceId) {
    showConfirm(
      "Apply Late Fee",
      `Are you sure you want to apply the initial & recurring late penalties to invoice #${invoiceId}?`,
      async () => {
        try {
          const res = await API.post(`/rental/ledgers/${invoiceId}/apply-late-fee`);
          setInvoices(prev => prev.map(inv => inv.invoice_id === invoiceId ? { ...res.data, lease: inv.lease } : inv));
          showAlert("Success", `Late fee penalty has been applied successfully to invoice #${invoiceId}!`, "success");
        } catch (err) {
          showAlert("Error", err.response?.data?.detail || "Failed to apply late fee.", "danger");
        }
      },
      "warning",
      "Yes, Apply Fee"
    );
  }

  async function handleRevertSingleLateFee(invoiceId) {
    showConfirm(
      "Revert Late Fee",
      `Are you sure you want to remove the late penalty fee from invoice #${invoiceId}?`,
      async () => {
        try {
          const res = await API.post(`/rental/ledgers/${invoiceId}/revert-late-fee`);
          setInvoices(prev => prev.map(inv => inv.invoice_id === invoiceId ? { ...res.data, lease: inv.lease } : inv));
          showAlert("Success", `Late fee penalty has been reverted successfully for invoice #${invoiceId}!`, "success");
        } catch (err) {
          showAlert("Error", err.response?.data?.detail || "Failed to revert late fee.", "danger");
        }
      },
      "danger",
      "Yes, Revert Fee"
    );
  }

  async function handleEditLateFeeSubmit(e) {
    e.preventDefault();
    const amount = parseFloat(editFeeAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Please enter a valid non-negative amount.');
      return;
    }
    try {
      setEditFeeLoading(true);
      const res = await API.patch(`/rental/ledgers/${editFeeInvoice.invoice_id}/edit-late-fee`, { amount });
      setInvoices(prev => prev.map(inv => inv.invoice_id === editFeeInvoice.invoice_id ? { ...res.data, lease: inv.lease } : inv));
      setShowEditFeeModal(false);
      toast.success(`Late fee updated to $${amount} on invoice #${editFeeInvoice.invoice_id}.`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update late fee.');
    } finally {
      setEditFeeLoading(false);
    }
  }

  async function handlePayInvoice(e) {
    e.preventDefault();
    try {
      const res = await API.post(`/rental/ledgers/${selectedInvoice.invoice_id}/pay`, {
        payment_method: payMethod
      });
      setInvoices(prev => prev.map(inv => inv.invoice_id === selectedInvoice.invoice_id ? { ...res.data, lease: selectedInvoice.lease } : inv));
      setShowPayModal(false);
      showAlert("Payment Successful", `Monthly rent invoice #${getInvoiceSeqNum(selectedInvoice)} has been paid successfully via ${payMethod}!`, "success");
      fetchData();
    } catch (err) {
      showAlert("Error", err.response?.data?.detail || "Failed to make payment.", "danger");
    }
  }

  async function handlePayMaintenance(e) {
    e.preventDefault();
    try {
      setMaintPayLoading(true);
      await API.post(`/rental/maintenance/${selectedMaintReq.request_id}/pay`, {
        payment_method: payMethod
      });
      setShowMaintPayModal(false);
      showAlert("Maintenance Bill Paid", `Maintenance request #${selectedMaintReq.request_id} ($${selectedMaintReq.estimated_cost?.toFixed(2)}) marked as paid!`, "success");
      fetchData();
    } catch (err) {
      showAlert("Error", err.response?.data?.detail || "Failed to pay maintenance bill.", "danger");
    } finally {
      setMaintPayLoading(false);
    }
  }

  const parseTimeline = (inv) => {
    if (!inv) return [];
    if (inv.fee_breakdown_json) {
      try {
        const parsed = JSON.parse(inv.fee_breakdown_json);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (_) {}
    }
    const baseCharges = (inv.rent_charge || inv.amount || 0);
    const list = [{
      date: inv.due_date,
      type: "INVOICED",
      title: "Monthly Rent Invoiced",
      description: `Monthly base rent charge`,
      amount: baseCharges,
      running_total: baseCharges
    }];
    if (inv.initial_late_fee_applied > 0 || inv.late_fee_applied > 0) {
      const initFee = inv.initial_late_fee_applied || inv.late_fee_applied;
      list.push({
        date: inv.due_date,
        type: "INITIAL_LATE_FEE",
        title: "Initial Flat Late Fee",
        description: "Assessed after grace period expired",
        amount: initFee,
        running_total: baseCharges + initFee
      });
    }
    if (inv.recurring_late_fee_applied > 0) {
      list.push({
        date: inv.due_date,
        type: "RECURRING_LATE_FEE",
        title: "Recurring Overdue Penalty",
        description: `Accumulated weekly overdue penalty`,
        amount: inv.recurring_late_fee_applied,
        running_total: baseCharges + (inv.initial_late_fee_applied || 0) + inv.recurring_late_fee_applied
      });
    }
    return list;
  };

  // Filtered Invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchProp = selectedPropertyFilterId === 'all' || String(inv.lease?.unit?.property_id) === String(selectedPropertyFilterId);
    const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchSearch = !searchTerm || 
      inv.lease?.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.lease?.unit?.unit_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(inv.invoice_id).includes(searchTerm);
    return matchProp && matchStatus && matchSearch;
  });

  // Filtered Maintenance Requests
  const filteredMaintenance = maintenanceRequests.filter(req => {
    const matchProp = selectedPropertyFilterId === 'all' || String(req.property_id) === String(selectedPropertyFilterId);
    const matchStatus = statusFilter === 'ALL' || 
      (statusFilter === 'UNPAID' && req.payment_status === 'UNPAID') ||
      (statusFilter === 'PAID' && req.payment_status === 'PAID');
    const matchSearch = !searchTerm || 
      req.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.submitted_by_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(req.request_id).includes(searchTerm);
    return matchProp && matchStatus && matchSearch;
  });

  // Filtered Transactions History
  const filteredTransactions = transactions.filter(txn => {
    const matchCategory = historyCategoryFilter === 'ALL' || txn.category === historyCategoryFilter;
    const matchSearch = !searchTerm || 
      txn.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.paid_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.item_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(txn.reference_id).includes(searchTerm);
    return matchCategory && matchSearch;
  });

  // Financial Metrics
  const totalRentInvoiced = filteredInvoices.reduce((acc, inv) => acc + (inv.amount || 0), 0);
  const totalRentCollected = filteredInvoices.filter(i => i.status === 'PAID').reduce((acc, inv) => acc + (inv.amount || 0), 0);
  const totalRentOutstanding = filteredInvoices.filter(i => i.status !== 'PAID').reduce((acc, inv) => acc + (inv.amount || 0) + (inv.late_fee_applied || 0), 0);
  const totalOverdueCount = filteredInvoices.filter(i => i.status === 'OVERDUE').length;

  const totalMaintBilled = filteredMaintenance.reduce((acc, r) => acc + (r.estimated_cost || 0), 0);
  const totalMaintUnpaid = filteredMaintenance.filter(r => r.payment_status === 'UNPAID').reduce((acc, r) => acc + (r.estimated_cost || 0), 0);
  const totalMaintPaid = filteredMaintenance.filter(r => r.payment_status === 'PAID').reduce((acc, r) => acc + (r.estimated_cost || 0), 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 bg-slate-50 dark:bg-[#0D1B2A] rounded-3xl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-semibold text-slate-500 dark:text-gray-400 font-mono tracking-wider">LOADING FINANCIAL DIRECTORY...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 dark:text-white text-left animate-fade-in font-sans">
      
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500 shrink-0" />
            Financial & Payments Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            USA Standard Monthly Rent Invoicing, Maintenance Billing, Late Penalties & Real-time Audit Logs
          </p>
        </div>

        {/* Global Action Tools in 1 Single Line */}
        {isLandlord && (
          <div className="flex items-center gap-2 shrink-0 flex-nowrap overflow-x-auto max-w-full">
            <button 
              onClick={handleSendDueReminders}
              className="px-3 py-2 border border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-xl flex items-center gap-1.5 font-bold transition-all text-xs cursor-pointer shadow-sm whitespace-nowrap"
              title="Send pre-due reminder emails to tenants approaching grace cutoff"
            >
              <Mail className="w-3.5 h-3.5 shrink-0" /> Send Reminders
            </button>
            <button 
              onClick={handleSimulateLateFees}
              className="px-3 py-2 border border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-xl flex items-center gap-1.5 font-bold transition-all text-xs cursor-pointer shadow-sm whitespace-nowrap"
              title="Assess initial flat and weekly overdue penalties"
            >
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> Apply Late Fees
            </button>
            <button 
              onClick={handleSimulateBilling}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center gap-1.5 font-bold transition-all text-xs shadow-md shadow-blue-500/20 cursor-pointer whitespace-nowrap"
            >
              <Settings2 className="w-3.5 h-3.5 shrink-0" /> Trigger Rent Rolls
            </button>
          </div>
        )}
      </div>

      {/* Pill-styled Sub-Tabs Navigation (Fits 100% width on 1 page without horizontal scroll) */}
      <div className="w-full flex flex-wrap lg:flex-nowrap gap-1.5 sm:gap-2 p-1.5 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm">
        <button
          onClick={() => setActiveTab('rent')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer text-center ${
            activeTab === 'rent'
              ? 'bg-[#1D68DF] text-white shadow-lg shadow-[#1D68DF]/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/5'
          }`}
        >
          <DollarSign size={15} className="shrink-0" /> <span>Monthly Rent Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer text-center ${
            activeTab === 'maintenance'
              ? 'bg-[#1D68DF] text-white shadow-lg shadow-[#1D68DF]/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/5'
          }`}
        >
          <Wrench size={15} className="shrink-0" /> <span>Maintenance Billing</span>
          {filteredMaintenance.filter(r => r.payment_status === 'UNPAID').length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-mono">
              {filteredMaintenance.filter(r => r.payment_status === 'UNPAID').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer text-center ${
            activeTab === 'history'
              ? 'bg-[#1D68DF] text-white shadow-lg shadow-[#1D68DF]/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/5'
          }`}
        >
          <History size={15} className="shrink-0" /> <span>Transaction History</span>
        </button>

        {isLandlord && (
          <button
            onClick={() => setActiveTab('vendors')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer text-center ${
              activeTab === 'vendors'
                ? 'bg-[#1D68DF] text-white shadow-lg shadow-[#1D68DF]/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/5'
            }`}
          >
            <FileText size={15} className="shrink-0" /> <span>Pay Vendors ({vendors.length})</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MONTHLY RENT LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'rent' && (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Total Invoiced</span>
                <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl"><DollarSign size={16} /></div>
              </div>
              <div className="text-2xl font-black font-mono mt-2 text-slate-900 dark:text-white">${totalRentInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              <div className="text-[10px] text-slate-500 dark:text-gray-400 mt-1">Total contractually billed rent</div>
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Outstanding Dues</span>
                <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl"><Clock size={16} /></div>
              </div>
              <div className="text-2xl font-black font-mono mt-2 text-amber-600 dark:text-amber-400">${totalRentOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              <div className="text-[10px] text-slate-500 dark:text-gray-400 mt-1">Pending tenant balance</div>
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Collected YTD</span>
                <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl"><CheckCircle2 size={16} /></div>
              </div>
              <div className="text-2xl font-black font-mono mt-2 text-emerald-600 dark:text-emerald-400">${totalRentCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              <div className="text-[10px] text-slate-500 dark:text-gray-400 mt-1">Successfully cleared payments</div>
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Overdue Invoices</span>
                <div className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl"><AlertTriangle size={16} /></div>
              </div>
              <div className="text-2xl font-black font-mono mt-2 text-rose-600 dark:text-rose-400">{totalOverdueCount}</div>
              <div className="text-[10px] text-slate-500 dark:text-gray-400 mt-1">Past grace period cutoff</div>
            </div>
          </div>

          {/* Search & Filter Row */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by tenant, unit or invoice #..."
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto">
              {['ALL', 'UNPAID', 'OVERDUE', 'PAID'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Rent Invoices Directory Table */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard size={16} className="text-blue-500" /> Payments Ledger Directory
              </div>
              <span className="text-xs text-slate-500 dark:text-gray-400">Total invoices: {filteredInvoices.length}</span>
            </div>

            {filteredInvoices.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                No rent invoice records matching your filters.
              </div>
            ) : (
              <div className="w-full overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 uppercase text-[10px] tracking-wider font-bold text-slate-500 dark:text-gray-400">
                    <tr>
                      <th className="px-3 py-3 w-[10%]">Invoice ID</th>
                      <th className="px-3 py-3 w-[22%]">Lease Unit</th>
                      <th className="px-3 py-3 w-[14%]">Due Date</th>
                      <th className="px-3 py-3 w-[22%]">Base & Add-ons</th>
                      <th className="px-3 py-3 w-[14%]">Late Penalty (USA)</th>
                      <th className="px-3 py-3 w-[8%] text-center">Status</th>
                      <th className="px-3 py-3 w-[10%] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-gray-300">
                    {filteredInvoices.map(inv => {
                      const parkFee = inv.parking_charge > 0 
                        ? inv.parking_charge 
                        : (inv.lease?.parking_fee ? parseFloat(inv.lease.parking_fee) : 0);

                      const petFee = inv.pet_charge > 0 
                        ? inv.pet_charge 
                        : (inv.lease?.pet_fee ? parseFloat(inv.lease.pet_fee) : 0);

                      const rentFee = inv.rent_charge > 0 
                        ? inv.rent_charge 
                        : (inv.lease?.rent_amount || inv.amount);

                      const baseTotal = rentFee + parkFee + petFee + (inv.utilities_charge || 0);
                      const totalPayable = baseTotal + (inv.late_fee_applied || 0);

                      return (
                        <tr key={inv.invoice_id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                          <td className="px-3 py-3.5 whitespace-nowrap">
                            <button
                              onClick={() => { setDetailsInvoice(inv); setShowDetailsModal(true); }}
                              className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                              title="Click to view itemized due history"
                            >
                              <span>#{getInvoiceSeqNum(inv)}</span>
                              <Eye size={12} className="opacity-60" />
                            </button>
                          </td>

                          <td className="px-3 py-3.5 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {inv.lease?.unit?.property_type === 'condo' ? 'Apt' : 'Unit'} {inv.lease?.unit?.unit_number || 'N/A'}
                              </span>
                              {inv.lease?.tenant_name && (
                                <span className="text-[10px] text-slate-500 dark:text-gray-400 font-medium">
                                  Tenant: {inv.lease.tenant_name}
                                </span>
                              )}
                              {inv.lease?.property_name && (
                                <span className="text-[10px] text-slate-400 dark:text-gray-500 font-medium italic">
                                  Property: {inv.lease.property_name}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-3 py-3.5 text-xs text-slate-600 dark:text-gray-400 whitespace-nowrap font-medium">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-slate-400" />
                              <span>{inv.due_date}</span>
                            </div>
                          </td>

                          <td className="px-3 py-3.5">
                            <div>
                              <div className="font-mono font-bold text-slate-900 dark:text-white">${baseTotal.toFixed(2)}</div>
                              <div className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wide flex flex-wrap gap-x-2 gap-y-0.5 font-medium">
                                <span>Rent: ${rentFee.toFixed(2)}</span>
                                {parkFee > 0 && <span>• Vehicle: ${parkFee.toFixed(2)}</span>}
                                {petFee > 0 && <span>• Pet: ${petFee.toFixed(2)}</span>}
                                {inv.utilities_charge > 0 && <span>• Util: ${inv.utilities_charge.toFixed(2)}</span>}
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-3.5 whitespace-nowrap">
                            {inv.late_fee_applied > 0 ? (
                              <div>
                                <div className="font-mono font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                  <span>+${inv.late_fee_applied.toFixed(2)}</span>
                                </div>
                                <div className="text-[9px] text-rose-500/80 font-bold mt-0.5 flex flex-col">
                                  {inv.initial_late_fee_applied > 0 && (
                                    <span>Initial: ${inv.initial_late_fee_applied.toFixed(2)}</span>
                                  )}
                                  {inv.recurring_late_fee_applied > 0 && (
                                    <span>Recurring: +${inv.recurring_late_fee_applied.toFixed(2)}</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 dark:text-gray-500 font-mono">$0.00</span>
                            )}
                          </td>

                          <td className="px-3 py-3.5 text-center whitespace-nowrap">
                            <StatusBadge status={inv.status} />
                          </td>

                          <td className="px-3 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => { setDetailsInvoice(inv); setShowDetailsModal(true); }}
                                className="px-2.5 py-1.5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-xs font-semibold text-slate-700 dark:text-gray-300 transition active:scale-95 cursor-pointer flex items-center gap-1"
                                title="View date-wise fee timeline breakdown"
                              >
                                <History size={13} className="text-blue-500" />
                                <span>Timeline</span>
                              </button>

                              {inv.status !== 'PAID' && !isLandlord ? (
                                <button
                                  onClick={() => { setSelectedInvoice(inv); setShowPayModal(true); }}
                                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition active:scale-95 shadow-md shadow-blue-500/20 cursor-pointer"
                                >
                                  Pay ${totalPayable.toFixed(2)}
                                </button>
                              ) : inv.status === 'PAID' ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-xs text-slate-900 dark:text-gray-300 font-semibold">Paid</span>
                                  <span className="text-[9px] text-slate-400 dark:text-gray-500 uppercase tracking-wide font-medium">via {inv.payment_method || 'ONLINE'}</span>
                                </div>
                              ) : isLandlord ? (
                                <div className="flex items-center gap-1.5">
                                  {inv.status === 'OVERDUE' || inv.late_fee_applied > 0 ? (
                                    <>
                                      <button
                                        onClick={() => { setEditFeeInvoice(inv); setEditFeeAmount(String(inv.late_fee_applied || '')); setShowEditFeeModal(true); }}
                                        className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold transition active:scale-95 cursor-pointer"
                                        title="Edit late fee amount"
                                      >
                                        Edit Fee
                                      </button>
                                      <button
                                        onClick={() => handleRevertSingleLateFee(inv.invoice_id)}
                                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 dark:text-gray-300 rounded-lg text-[10px] font-bold transition active:scale-95 cursor-pointer"
                                        title="Revert late fee"
                                      >
                                        Revert
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => handleApplySingleLateFee(inv.invoice_id)}
                                      className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer flex items-center gap-1"
                                    >
                                      <ShieldAlert className="w-3 h-3" />
                                      <span>Apply Fee</span>
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 dark:text-gray-500 italic font-medium">Awaiting payment</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MAINTENANCE BILLING */}
      {/* ========================================================================= */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          {/* Summary KPI Cards for Maintenance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Total Repairs Invoiced</span>
                <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl"><Wrench size={16} /></div>
              </div>
              <div className="text-2xl font-black font-mono mt-2 text-slate-900 dark:text-white">${totalMaintBilled.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              <div className="text-[10px] text-slate-500 dark:text-gray-400 mt-1">Total estimated repair costs</div>
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Unpaid Repairs</span>
                <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl"><Clock size={16} /></div>
              </div>
              <div className="text-2xl font-black font-mono mt-2 text-amber-600 dark:text-amber-400">${totalMaintUnpaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              <div className="text-[10px] text-slate-500 dark:text-gray-400 mt-1">Pending maintenance payment</div>
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Paid Repairs</span>
                <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl"><CheckCircle2 size={16} /></div>
              </div>
              <div className="text-2xl font-black font-mono mt-2 text-emerald-600 dark:text-emerald-400">${totalMaintPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              <div className="text-[10px] text-slate-500 dark:text-gray-400 mt-1">Fully settled work orders</div>
            </div>
          </div>

          {/* Maintenance Table */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Wrench size={16} className="text-indigo-500" /> Maintenance & Repair Invoices
                </h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                  Track repair costs separately from monthly rent. Pay contractor bills online.
                </p>
              </div>
              <span className="text-xs text-slate-500 dark:text-gray-400">Total tickets: {filteredMaintenance.length}</span>
            </div>

            {filteredMaintenance.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No maintenance billing records found.
              </div>
            ) : (
              <div className="w-full overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                      <th className="px-3 py-3 w-[12%]">Request ID</th>
                      <th className="px-3 py-3 w-[22%]">Repair Item & Scope</th>
                      <th className="px-3 py-3 w-[18%]">Unit / Property</th>
                      <th className="px-3 py-3 w-[16%]">Assigned Vendor</th>
                      <th className="px-3 py-3 w-[10%] text-right">Cost</th>
                      <th className="px-3 py-3 w-[11%] text-center">Work Status</th>
                      <th className="px-3 py-3 w-[11%] text-center">Payment Status</th>
                      <th className="px-3 py-3 w-[10%] text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-gray-300">
                    {filteredMaintenance.map(req => (
                      <tr key={req.request_id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-3 py-3.5 font-mono text-xs font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          #REQ-{req.request_id}
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <Wrench size={14} className="text-indigo-500 shrink-0" />
                            <span>{req.title}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                            <span className="font-mono uppercase px-1.5 py-0.2 bg-slate-200 dark:bg-white/10 rounded text-[9px] font-bold">
                              {req.scope || 'INTERNAL'}
                            </span>
                            <span>Priority: {req.priority}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 whitespace-nowrap text-xs">
                          <div className="font-medium text-slate-900 dark:text-white">{req.property_name || 'Property'}</div>
                          <div className="text-[10px] text-slate-400">By: {req.submitted_by_name || 'Tenant'}</div>
                        </td>
                        <td className="px-3 py-3.5 whitespace-nowrap text-xs">
                          {req.vendor_company_name ? (
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{req.vendor_company_name}</span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          ${(req.estimated_cost || 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-3.5 text-center whitespace-nowrap">
                          <StatusBadge status={req.status || 'OPEN'} />
                        </td>
                        <td className="px-3 py-3.5 text-center whitespace-nowrap">
                          <StatusBadge status={req.payment_status || 'N/A'} />
                        </td>
                        <td className="px-3 py-3.5 text-right whitespace-nowrap">
                          {req.payment_status === 'UNPAID' && req.estimated_cost > 0 ? (
                            <button
                              onClick={() => { setSelectedMaintReq(req); setShowMaintPayModal(true); }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                            >
                              Pay ${(req.estimated_cost).toFixed(2)}
                            </button>
                          ) : req.payment_status === 'PAID' ? (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Settled</span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No bill</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TRANSACTION HISTORY LOGS (MATCHING USER SCREENSHOT) */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-500" />
                  Transaction History Logs
                </h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                  Unified audit directory of all processed rental invoices, maintenance fees, and payments
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400 font-medium">
                <span>Total processed transactions:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-200/60 dark:bg-white/10 px-2 py-0.5 rounded-full">
                  {filteredTransactions.length}
                </span>
              </div>
            </div>

            {/* Filter Pills & Search */}
            <div className="p-4 border-b border-slate-200 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/50 dark:bg-black/10">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                <button
                  onClick={() => setHistoryCategoryFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    historyCategoryFilter === 'ALL'
                      ? 'bg-[#1D68DF] text-white shadow-sm'
                      : 'bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:bg-slate-100'
                  }`}
                >
                  All Items ({transactions.length})
                </button>
                <button
                  onClick={() => setHistoryCategoryFilter('RENT')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    historyCategoryFilter === 'RENT'
                      ? 'bg-[#1D68DF] text-white shadow-sm'
                      : 'bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:bg-slate-100'
                  }`}
                >
                  <Building2 size={13} /> Monthly Rent
                </button>
                <button
                  onClick={() => setHistoryCategoryFilter('MAINTENANCE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    historyCategoryFilter === 'MAINTENANCE'
                      ? 'bg-[#1D68DF] text-white shadow-sm'
                      : 'bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:bg-slate-100'
                  }`}
                >
                  <Wrench size={13} /> Maintenance Repairs
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search transactions..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Transactions Table */}
            {filteredTransactions.length === 0 ? (
              <div className="p-16 text-center text-slate-400 text-sm">
                No payment transactions recorded in the history log.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 dark:bg-white/5 text-[11px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-white/10">
                    <tr>
                      <th className="px-3 py-3.5 whitespace-nowrap">TRANSACTION ID</th>
                      <th className="px-3 py-3.5 whitespace-nowrap">PAID BY</th>
                      <th className="px-3 py-3.5">PURPOSE / ITEM</th>
                      <th className="px-3 py-3.5 whitespace-nowrap">PAYMENT DATE</th>
                      <th className="px-3 py-3.5 whitespace-nowrap text-center">METHOD</th>
                      <th className="px-3 py-3.5 text-right whitespace-nowrap">AMOUNT</th>
                      <th className="px-3 py-3.5 text-center whitespace-nowrap">STATUS</th>
                      <th className="px-3 py-3.5 text-right whitespace-nowrap">RECEIPT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-gray-300">
                    {filteredTransactions.map((txn, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                        
                        {/* Transaction ID */}
                        <td className="px-3 py-3 font-mono text-[11px] text-blue-600 dark:text-blue-400 whitespace-nowrap font-medium">
                          <span className="bg-blue-500/10 px-2 py-0.5 rounded" title={txn.transaction_id}>
                            {txn.transaction_id?.length > 18 ? `${txn.transaction_id.slice(0, 14)}...` : txn.transaction_id}
                          </span>
                        </td>

                        {/* Paid By */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px]">
                              {txn.paid_by?.charAt(0) || 'T'}
                            </div>
                            <span>{txn.paid_by}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-gray-400 pl-6.5 font-medium">
                            {txn.payer_role} • {txn.unit_number || 'Unit'}
                          </div>
                        </td>

                        {/* Purpose / Item */}
                        <td className="px-3 py-3">
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {txn.category === 'MAINTENANCE' ? (
                              <Wrench size={14} className="text-indigo-500 shrink-0" />
                            ) : (
                              <Building2 size={14} className="text-emerald-500 shrink-0" />
                            )}
                            <span className="line-clamp-1">{txn.item_title}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-gray-500 font-mono mt-0.5 pl-5">
                            Ref ID: #{txn.reference_id} ({txn.property_name})
                          </div>
                        </td>

                        {/* Payment Date */}
                        <td className="px-3 py-3 text-[11px] text-slate-500 dark:text-gray-400 whitespace-nowrap">
                          {new Date(txn.payment_date).toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' })}, {new Date(txn.payment_date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </td>

                        {/* Method */}
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/10 rounded font-mono text-[10px] font-bold uppercase">
                            {txn.payment_method?.replace('_', ' ') || 'ACH'}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="px-3 py-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap text-xs sm:text-sm">
                          ${txn.amount?.toFixed(2)}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20">
                            {txn.status || 'COMPLETED'}
                          </span>
                        </td>

                        {/* Receipt Modal Trigger */}
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => { setReceiptTxn(txn); setShowReceiptModal(true); }}
                            className="px-2.5 py-1 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-xs font-semibold text-slate-700 dark:text-gray-300 transition cursor-pointer inline-flex items-center gap-1.5 shadow-sm active:scale-95"
                            title="View / Print official receipt"
                          >
                            <FileText size={12} className="text-blue-500 shrink-0" />
                            <span>Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: VENDOR DISBURSEMENTS (LANDLORD VIEW) */}
      {/* ========================================================================= */}
      {activeTab === 'vendors' && isLandlord && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Registered Contractors & Vendor Directory
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-6">
              Contractor compliance, licenses, and maintenance payouts for repair jobs.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendors.map(v => (
                <div key={v.vendor_id} className="bg-white dark:bg-[#1E3248] rounded-2xl p-5 border border-slate-200 dark:border-white/5 space-y-3 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-mono tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-bold uppercase">
                        {v.category || 'GENERAL'}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-2">{v.company_name}</h4>
                      <p className="text-xs text-slate-500 dark:text-gray-400">{v.contact_person}</p>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">Active</span>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-gray-400 space-y-1 font-mono pt-2 border-t border-slate-100 dark:border-white/5">
                    <div>License: {v.license_number || 'LIC-VERIFIED'}</div>
                    <div>Phone: {v.phone || 'N/A'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Pay Rent Invoice Modal */}
      {showPayModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e2a3b] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl animate-scale-up text-slate-900 dark:text-white text-left">
            <div className="flex justify-between items-center border-b dark:border-white/5 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-500" /> Pay Invoice #{getInvoiceSeqNum(selectedInvoice)}
              </h3>
              <button onClick={() => setShowPayModal(false)} className="text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white cursor-pointer"><X size={20} /></button>
            </div>

            <div className="bg-slate-50 dark:bg-[#111c2a] p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-gray-400">
                <span>Base Monthly Rent:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">${(selectedInvoice.rent_charge || selectedInvoice.amount).toFixed(2)}</span>
              </div>
              {(selectedInvoice.parking_charge > 0 || selectedInvoice.pet_charge > 0 || selectedInvoice.utilities_charge > 0) && (
                <div className="flex justify-between text-slate-600 dark:text-gray-400">
                  <span>Add-on Services (Util/Pet/Parking):</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    ${((selectedInvoice.parking_charge || 0) + (selectedInvoice.pet_charge || 0) + (selectedInvoice.utilities_charge || 0)).toFixed(2)}
                  </span>
                </div>
              )}
              {selectedInvoice.late_fee_applied > 0 && (
                <div className="flex justify-between text-rose-500 font-bold">
                  <span>Late Fee Penalties:</span>
                  <span className="font-mono">+${selectedInvoice.late_fee_applied.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 dark:border-white/10 pt-2 flex justify-between items-center">
                <span className="font-bold text-sm">Total Balance Due:</span>
                <span className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono">
                  ${((selectedInvoice.amount || 0) + (selectedInvoice.late_fee_applied || 0)).toFixed(2)}
                </span>
              </div>
            </div>

            <form onSubmit={handlePayInvoice} className="space-y-4 text-left">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide font-bold">PAYMENT METHOD (USA ACH/CARD)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPayMethod('ACH')}
                    className={`py-3 px-4 rounded-xl border font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                      payMethod === 'ACH'
                        ? 'bg-blue-600/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <Landmark size={20} className={payMethod === 'ACH' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} />
                    <span className="text-xs">ACH Bank Transfer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMethod('CARD')}
                    className={`py-3 px-4 rounded-xl border font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                      payMethod === 'CARD'
                        ? 'bg-blue-600/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <CreditCard size={20} className={payMethod === 'CARD' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} />
                    <span className="text-xs">Credit Card</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button type="button" onClick={() => setShowPayModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 transition-all shadow-md shadow-blue-500/25 cursor-pointer">Confirm & Pay</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Maintenance Request Modal */}
      {showMaintPayModal && selectedMaintReq && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e2a3b] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl animate-scale-up text-slate-900 dark:text-white text-left">
            <div className="flex justify-between items-center border-b dark:border-white/5 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-indigo-500" /> Pay Maintenance Bill #REQ-{selectedMaintReq.request_id}
              </h3>
              <button onClick={() => setShowMaintPayModal(false)} className="text-gray-400 hover:text-gray-900 cursor-pointer"><X size={20} /></button>
            </div>

            <div className="bg-slate-50 dark:bg-[#111c2a] p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-gray-400">
                <span>Work Order Title:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedMaintReq.title}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-gray-400">
                <span>Scope / Category:</span>
                <span className="font-mono font-bold uppercase">{selectedMaintReq.scope || 'INTERNAL'}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-gray-400">
                <span>Assigned Vendor:</span>
                <span className="font-bold">{selectedMaintReq.vendor_company_name || 'Assigned Specialist'}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-white/10 pt-2 flex justify-between items-center">
                <span className="font-bold text-sm">Amount Due:</span>
                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  ${selectedMaintReq.estimated_cost?.toFixed(2)}
                </span>
              </div>
            </div>

            <form onSubmit={handlePayMaintenance} className="space-y-4">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide font-bold">PAYMENT METHOD</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPayMethod('ACH')}
                    className={`py-3 px-4 rounded-xl border font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                      payMethod === 'ACH'
                        ? 'bg-indigo-600/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-700'
                    }`}
                  >
                    <Landmark size={20} />
                    <span className="text-xs">ACH Bank Debit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMethod('CARD')}
                    className={`py-3 px-4 rounded-xl border font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                      payMethod === 'CARD'
                        ? 'bg-indigo-600/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-700'
                    }`}
                  >
                    <CreditCard size={20} />
                    <span className="text-xs">Credit Card</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button type="button" onClick={() => setShowMaintPayModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 hover:bg-slate-100 cursor-pointer">Cancel</button>
                <button type="submit" disabled={maintPayLoading} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-500 transition-all shadow-md shadow-indigo-500/25 cursor-pointer">
                  {maintPayLoading ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Receipt Modal */}
      {showReceiptModal && receiptTxn && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e2a3b] border border-slate-200 dark:border-white/10 w-full max-w-lg rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-scale-up text-slate-900 dark:text-white text-left max-h-[90vh] overflow-y-auto">
            
            {/* Top Brand & Verification Stamp */}
            <div className="flex justify-between items-start border-b dark:border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <Logo className="h-7 w-auto" />
                  <div className="border-l border-slate-200 dark:border-white/10 pl-3">
                    <p className="text-[10px] text-slate-400 dark:text-gray-400 uppercase font-mono tracking-widest font-bold">Official Payment Receipt</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full font-bold text-[10px] uppercase tracking-wider">
                    VERIFIED PAID
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">{new Date(receiptTxn.payment_date).toLocaleDateString()}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition cursor-pointer"
                  title="Close receipt"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-50 dark:bg-[#111c2a] p-5 rounded-2xl border border-slate-200/80 dark:border-white/5 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-gray-400">Transaction ID:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{receiptTxn.transaction_id}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-gray-400">Payer Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{receiptTxn.paid_by}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-gray-400">Property / Unit:</span>
                <span className="font-medium text-slate-800 dark:text-gray-200">{receiptTxn.unit_number} ({receiptTxn.property_name})</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-gray-400">Payment Method:</span>
                <span className="font-medium uppercase">{receiptTxn.payment_method} Transfer</span>
              </div>
              <div className="border-t border-slate-200 dark:border-white/10 pt-3 flex justify-between items-center">
                <span className="font-bold text-sm">Total Amount Paid:</span>
                <span className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
                  ${receiptTxn.amount?.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Itemized Info */}
            <div className="text-xs space-y-2 text-slate-600 dark:text-gray-400">
              <div className="font-bold text-slate-800 dark:text-white uppercase tracking-wide text-[10px]">Payment Purpose:</div>
              <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 text-slate-800 dark:text-gray-200 font-medium">
                {receiptTxn.item_title} (Ref ID: #{receiptTxn.reference_id})
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer size={15} /> Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Itemized Invoice & Due History Timeline Modal */}
      {showDetailsModal && detailsInvoice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e2a3b] border border-slate-200 dark:border-white/10 w-full max-w-xl rounded-2xl p-6 space-y-5 shadow-2xl animate-scale-up text-slate-900 dark:text-white text-left max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b dark:border-white/5 pb-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-500" /> Invoice #{getInvoiceSeqNum(detailsInvoice)} Due Breakdown
                  </h3>
                  <StatusBadge status={detailsInvoice.status} />
                </div>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                  Unit: <strong>{detailsInvoice.lease?.unit?.property_type === 'condo' ? 'Apt' : 'Unit'} {detailsInvoice.lease?.unit?.unit_number || 'N/A'}</strong> ({detailsInvoice.lease?.property_name || 'Property'}) • Due Date: <strong>{detailsInvoice.due_date}</strong>
                </p>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white cursor-pointer"><X size={20} /></button>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-50 dark:bg-[#111c2a] p-3 rounded-xl border border-slate-200/80 dark:border-white/5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Base Rent</span>
                <span className="text-sm font-black font-mono text-slate-900 dark:text-white mt-1 block">
                  ${(detailsInvoice.rent_charge || detailsInvoice.amount).toFixed(2)}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-[#111c2a] p-3 rounded-xl border border-slate-200/80 dark:border-white/5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Add-on Services</span>
                <span className="text-sm font-black font-mono text-slate-900 dark:text-white mt-1 block">
                  ${((detailsInvoice.parking_charge || 0) + (detailsInvoice.pet_charge || 0) + (detailsInvoice.utilities_charge || 0)).toFixed(2)}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-[#111c2a] p-3 rounded-xl border border-slate-200/80 dark:border-white/5">
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">Late Fees</span>
                <span className="text-sm font-black font-mono text-rose-500 mt-1 block">
                  +${(detailsInvoice.late_fee_applied || 0).toFixed(2)}
                </span>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Total Payable</span>
                <span className="text-sm font-black font-mono text-blue-600 dark:text-blue-400 mt-1 block">
                  ${((detailsInvoice.amount || 0) + (detailsInvoice.late_fee_applied || 0)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Chronological Due Assessment Timeline */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={15} className="text-blue-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300">
                  Chronological Due Assessment Timeline (Audit Log)
                </h4>
              </div>

              <div className="space-y-3 relative pl-4 border-l-2 border-slate-200 dark:border-white/10 ml-2">
                {parseTimeline(detailsInvoice).map((item, idx) => (
                  <div key={idx} className="relative group">
                    <div className={`absolute -left-[23px] top-1.5 w-3 h-3 rounded-full border-2 ${
                      item.type === 'INITIAL_LATE_FEE' || item.type === 'RECURRING_LATE_FEE'
                        ? 'bg-rose-500 border-rose-200'
                        : item.type === 'PAYMENT'
                        ? 'bg-emerald-500 border-emerald-200'
                        : 'bg-blue-500 border-blue-200'
                    }`}></div>

                    <div className="bg-slate-50 dark:bg-[#111c2a] p-3.5 rounded-xl border border-slate-200 dark:border-white/5 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 font-mono bg-slate-200/60 dark:bg-white/10 px-1.5 py-0.5 rounded">
                            {item.date}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {item.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-xs font-mono font-bold block ${
                          item.type === 'INITIAL_LATE_FEE' || item.type === 'RECURRING_LATE_FEE'
                            ? 'text-rose-500'
                            : 'text-slate-900 dark:text-white'
                        }`}>
                          {item.type === 'INITIAL_LATE_FEE' || item.type === 'RECURRING_LATE_FEE' ? `+$${item.amount.toFixed(2)}` : `$${item.amount.toFixed(2)}`}
                        </span>
                        <span className="text-[9px] text-slate-400 dark:text-gray-500 font-mono block mt-0.5">
                          Bal: ${item.running_total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-2 flex justify-end gap-3 border-t dark:border-white/5">
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Close
              </button>
              {detailsInvoice.status !== 'PAID' && !isLandlord && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedInvoice(detailsInvoice);
                    setShowDetailsModal(false);
                    setShowPayModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Proceed to Pay
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Late Fee Modal */}
      {showEditFeeModal && editFeeInvoice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e2a3b] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl animate-scale-up text-slate-900 dark:text-white text-left">
            <div className="flex justify-between items-center border-b dark:border-white/5 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-500" /> Edit Late Fee
              </h3>
              <button onClick={() => setShowEditFeeModal(false)} className="text-gray-400 hover:text-gray-900 cursor-pointer"><X size={20} /></button>
            </div>

            <div className="bg-slate-50 dark:bg-[#111c2a] p-3.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-gray-400">Invoice:</span>
                <span className="font-bold text-slate-900 dark:text-white">#{getInvoiceSeqNum(editFeeInvoice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-gray-400">Unit:</span>
                <span className="font-bold text-slate-900 dark:text-white">{editFeeInvoice.lease?.unit?.property_type === 'condo' ? 'Apt' : 'Unit'} {editFeeInvoice.lease?.unit?.unit_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-gray-400">Current Late Fee:</span>
                <span className="font-bold text-rose-500">${(editFeeInvoice.late_fee_applied || 0).toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleEditLateFeeSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide font-bold">New Late Fee Amount ($)</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={editFeeAmount}
                  onChange={e => setEditFeeAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-indigo-500 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                  placeholder="e.g. 75.00"
                />
                <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">Enter 0 to remove late fee (reverts to UNPAID).</p>
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowEditFeeModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 hover:bg-slate-100 cursor-pointer">Cancel</button>
                <button type="submit" disabled={editFeeLoading} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-500 transition-all shadow-md shadow-indigo-500/25 disabled:opacity-60 cursor-pointer">
                  {editFeeLoading ? 'Saving...' : 'Save Fee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        type={confirmConfig.type}
        singleButton={confirmConfig.singleButton}
        onConfirm={() => {
          confirmConfig.onConfirm?.();
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => {
          if (confirmConfig.onCancel) {
            confirmConfig.onCancel();
          }
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }}
      />
    </div>
  );
}
