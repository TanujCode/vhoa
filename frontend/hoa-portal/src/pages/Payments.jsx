import React, { useState, useEffect } from 'react';
import { 
  DollarSign, CreditCard, Calendar, History, CheckCircle, 
  AlertCircle, ArrowRight, Lock, Shield, X, Loader, 
  FileText, ArrowDownLeft, ArrowUpRight, Zap
} from 'lucide-react';
import API from '../services/api';

const Payments = ({ community, user, paymentState, setPaymentState }) => {
  const [activeTab, setActiveTab] = useState('pay');
  const [dues, setDues] = useState([]);
  const [history, setHistory] = useState([]);
  const [recurring, setRecurring] = useState(null);
  const [loading, setLoading] = useState(false);

  // Admin/Board Views State
  const [vendorAssignments, setVendorAssignments] = useState([]);
  const [virtualHoadues, setVirtualHoadues] = useState([
    { id: 101, title: 'VirtualHOA Platform Setup Fee', amount: 500.00, reason: 'VHOA_SETUP_FEE', status: 'PENDING', due_date: '2026-06-01' },
    { id: 102, title: 'VirtualHOA Monthly Subscription (June 2026)', amount: 99.00, reason: 'VHOA_MONTHLY_FEE', status: 'PENDING', due_date: '2026-06-10' }
  ]);

  // Wizard Modal State
  const [wizard, setWizard] = useState({
    isOpen: false,
    currentStep: 1, // 1: Confirm, 2: Method, 3: Tokenizing/Processing, 4: Success
    dueItem: null,
    paymentMethod: '', // 'PAYPAL' | 'VISA_CHECKOUT' | 'BANK_TRANSFER'
    payerBankName: '',
    payerAccountNo: '',
    processing: false,
    error: '',
    receipt: null
  });

  const isBoardOrAdmin = [1, 2, 3].includes(user?.role_id) || ['super_admin', 'property_manager', 'board_member'].includes(user?.role) || ['super_admin', 'property_manager', 'board_member'].includes(user?.role_name);

  useEffect(() => {
    if (community?.community_id) {
      fetchData();
    }
  }, [community, activeTab]);

  useEffect(() => {
    if (paymentState && paymentState.dueItem) {
      handleOpenWizard(paymentState.dueItem);
      if (setPaymentState) {
        setPaymentState(null);
      }
    }
  }, [paymentState]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'pay') {
        const res = await API.get(`/payment/due/${community.community_id}`);
        setDues(res.data);
      } else if (activeTab === 'history') {
        const res = await API.get(`/payment/history/${community.community_id}`);
        setHistory(res.data);
      } else if (activeTab === 'recurring') {
        try {
          const res = await API.get(`/payment/recurring/${community.community_id}`);
          setRecurring(res.data);
        } catch (e) {
          setRecurring(null);
        }
      } else if (activeTab === 'vendors' && isBoardOrAdmin) {
        // Fetch assignments for quotes/invoices
        const res = await API.get(`/vendor/assignment/${community.community_id}`);
        // Filter those needing payment or history of vendor payments
        setVendorAssignments(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching payments data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWizard = (item) => {
    setWizard({
      isOpen: true,
      currentStep: 1,
      dueItem: item,
      paymentMethod: '',
      payerBankName: '',
      payerAccountNo: '',
      processing: false,
      error: '',
      receipt: null
    });
  };

  const handleCloseWizard = () => {
    setWizard(prev => ({ ...prev, isOpen: false }));
    fetchData();
  };

  const executePayment = async () => {
    setWizard(prev => ({ ...prev, currentStep: 3, processing: true, error: '' }));
    try {
      const payload = {
        amount: wizard.dueItem.amount,
        reason: wizard.dueItem.reason,
        reference_id: wizard.dueItem.reference_id || wizard.dueItem.id,
        payment_method: wizard.paymentMethod,
        payer_bank_name: wizard.paymentMethod === 'BANK_TRANSFER' ? wizard.payerBankName : null,
        payer_account_no: wizard.paymentMethod === 'BANK_TRANSFER' ? wizard.payerAccountNo : null,
        escrow_flag: !['VHOA_SETUP_FEE', 'VHOA_MONTHLY_FEE'].includes(wizard.dueItem.reason) && wizard.dueItem.escrow_flag !== false,
      };

      // Call backend
      const response = await API.post('/payment/pay', payload);
      
      // Update VirtualHOA item local state if that's what was paid
      if (['VHOA_SETUP_FEE', 'VHOA_MONTHLY_FEE'].includes(wizard.dueItem.reason)) {
        setVirtualHoadues(prev => prev.map(d => d.id === wizard.dueItem.id ? { ...d, status: 'COMPLETED' } : d));
      }

      setWizard(prev => ({
        ...prev,
        currentStep: 4,
        processing: false,
        receipt: response.data
      }));
    } catch (err) {
      console.error(err);
      setWizard(prev => ({
        ...prev,
        currentStep: 2,
        processing: false,
        error: err.response?.data?.detail || 'Transaction failed. Please try again.'
      }));
    }
  };

  const handleSetupRecurring = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const amount = parseFloat(data.get('amount'));
    const interval = data.get('interval');
    const paymentMethod = data.get('payment_method');
    const payerBankName = data.get('payer_bank_name');
    const payerAccountNo = data.get('payer_account_no');

    try {
      setLoading(true);
      await API.post('/payment/recurring', {
        community_id: community.community_id,
        amount,
        interval,
        payment_method: paymentMethod,
        payer_bank_name: paymentMethod === 'BANK_TRANSFER' ? payerBankName : null,
        payer_account_no: paymentMethod === 'BANK_TRANSFER' ? payerAccountNo : null
      });
      alert('Recurring Payment (Auto-Pay) configured successfully!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to setup auto-pay');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateRecurring = async () => {
    if (!window.confirm('Are you sure you want to turn off Auto-Pay?')) return;
    try {
      setLoading(true);
      await API.post(`/payment/deactivate-recurring/${community.community_id}`);
      alert('Auto-Pay turned off.');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Deactivation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-12 text-slate-900 dark:text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Payments & Escrow</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1">{community?.name} • Resident Escrow Management</p>
        </div>
        {community?.bank_name ? (
          <div className="bg-teal-500/10 border border-teal-500/20 px-4 py-2.5 rounded-2xl flex items-center gap-3">
            <span className="text-teal-600 dark:text-teal-400 font-semibold text-xs py-1 px-2.5 bg-teal-500/10 dark:bg-teal-500/20 rounded-full">ESCROW ACTIVE</span>
            <div className="text-xs">
              <div className="font-medium text-slate-700 dark:text-gray-300">{community.bank_name}</div>
              <div className="text-slate-400 dark:text-gray-500 font-mono">Account ending in *{community.bank_account_no?.slice(-4) || 'XXXX'}</div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 rounded-2xl flex items-center gap-3">
            <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs py-1 px-2.5 bg-amber-500/10 dark:bg-amber-500/20 rounded-full">NO ESCROW BANK</span>
            <div className="text-xs text-slate-500 dark:text-gray-400">
              Board members must set up bank details in Settings.
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-2xl mb-8 w-fit overflow-x-auto max-w-full shadow-sm">
        <button
          onClick={() => setActiveTab('pay')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'pay' ? 'bg-[#1D9E75] hover:bg-[#15805d] text-white hover:text-white shadow-lg shadow-[#1D9E75]/25' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'
          }`}
        >
          <DollarSign size={16} /> Outstanding Dues
        </button>
        <button
          onClick={() => setActiveTab('recurring')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'recurring' ? 'bg-[#1D9E75] hover:bg-[#15805d] text-white hover:text-white shadow-lg shadow-[#1D9E75]/25' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'
          }`}
        >
          <Calendar size={16} /> Auto-Pay (Recurring)
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'history' ? 'bg-[#1D9E75] hover:bg-[#15805d] text-white hover:text-white shadow-lg shadow-[#1D9E75]/25' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'
          }`}
        >
          <History size={16} /> Transaction History
        </button>

        {isBoardOrAdmin && (
          <>
            <button
              onClick={() => setActiveTab('virtualhoa')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === 'virtualhoa' ? 'bg-[#1D9E75] hover:bg-[#15805d] text-white hover:text-white shadow-lg shadow-[#1D9E75]/25' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'
              }`}
            >
              <Zap size={16} /> VirtualHOA Invoices
            </button>
            <button
              onClick={() => setActiveTab('vendors')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === 'vendors' ? 'bg-[#1D9E75] hover:bg-[#15805d] text-white hover:text-white shadow-lg shadow-[#1D9E75]/25' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'
              }`}
            >
              <FileText size={16} /> Pay Vendors
            </button>
          </>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader className="animate-spin text-[#25C490]" size={40} />
          <p className="text-slate-500 dark:text-gray-400 text-sm">Retrieving financial records...</p>
        </div>
      )}

      {!loading && activeTab === 'pay' && (
        <div>
          {dues.length === 0 ? (
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-600 dark:text-teal-400 text-3xl mx-auto mb-4">🎉</div>
              <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">No Outstanding Dues</h3>
              <p className="text-slate-500 dark:text-gray-400 text-sm">You are fully paid up for all community services, amenities, and dues.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dues.map((due, idx) => (
                <div key={idx} className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:border-teal-500/30 transition shadow-sm hover:shadow-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-500/5 to-transparent rounded-bl-full pointer-events-none" />
                  <div>
                    <span className="text-[10px] font-mono tracking-wider bg-slate-100 dark:bg-[#1E3248] text-teal-600 dark:text-teal-400 px-3 py-1 rounded-full font-bold uppercase">
                      {due.reason.replace('_', ' ')}
                    </span>
                    <h3 className="text-lg font-semibold mt-4 text-slate-800 dark:text-white line-clamp-2">{due.title}</h3>
                    <div className="mt-2 text-2xl font-bold font-mono text-teal-600 dark:text-teal-400">${due.amount.toFixed(2)}</div>
                    {due.due_date && (
                      <div className="text-xs text-slate-500 dark:text-gray-400 mt-4 flex items-center gap-1.5">
                        <Calendar size={13} />
                        Due Date: <span className="text-slate-700 dark:text-white font-medium">{due.due_date}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleOpenWizard(due)}
                    className="w-full mt-6 flex items-center justify-center gap-2 bg-[#1D9E75] hover:bg-[#25C490] text-white py-3 rounded-2xl font-medium transition shadow-lg shadow-[#1D9E75]/20 group-hover:scale-[1.02]"
                  >
                    Pay Now <ArrowRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && activeTab === 'recurring' && (
        <div className="max-w-2xl bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-slate-900 dark:text-white">
            <Shield className="text-teal-600 dark:text-teal-400" size={22} />
            Secure Auto-Pay Setup
          </h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm mb-6">
            Configure recurring monthly payments for your regular HOA dues. Funds will be securely tokenized and processed automatically on the due date of each month.
          </p>

          {recurring ? (
            <div className="bg-slate-50 dark:bg-[#1E3248] border border-slate-200 dark:border-teal-500/20 rounded-2xl p-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest bg-teal-500/10 dark:bg-teal-500/20 px-3 py-1 rounded-full">Auto-Pay Active</span>
                  <div className="text-3xl font-mono font-bold mt-4 text-slate-900 dark:text-white">${recurring.amount.toFixed(2)}</div>
                  <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Processed: <span className="text-slate-800 dark:text-white font-medium">{recurring.interval}</span></p>
                  
                  {recurring.payment_method && (
                    <div className="mt-4 text-xs text-slate-500 dark:text-gray-400 flex items-center gap-2">
                      <CreditCard size={14} />
                      Method: <span className="text-slate-800 dark:text-white font-medium">{recurring.payment_method.replace('_', ' ')}</span>
                      {recurring.payer_bank_name && (
                        <span>({recurring.payer_bank_name} - *{recurring.payer_account_no?.slice(-4)})</span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleDeactivateRecurring}
                  className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-500/20 dark:hover:bg-red-500/20 transition"
                >
                  Turn Off Auto-Pay
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSetupRecurring} className="space-y-6">
              <div>
                <label className="block text-sm text-slate-600 dark:text-gray-400 mb-2">Monthly Fee Amount ($)</label>
                <input
                  type="number"
                  name="amount"
                  defaultValue="150"
                  required
                  min="1"
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl p-4 text-slate-900 dark:text-white focus:outline-none focus:border-[#1D9E75]"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 dark:text-gray-400 mb-2">Billing Frequency</label>
                <select
                  name="interval"
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl p-4 text-slate-900 dark:text-white focus:outline-none focus:border-[#1D9E75]"
                >
                  <option value="MONTHLY">Monthly (10th of every month)</option>
                  <option value="ANNUALLY">Annually</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 dark:text-gray-400 mb-2">Auto-Pay Method</label>
                <select
                  name="payment_method"
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl p-4 text-slate-900 dark:text-white focus:outline-none focus:border-[#1D9E75]"
                  onChange={(e) => {
                    const el = document.getElementById('recurring-bank-fields');
                    if (el) el.style.display = e.target.value === 'BANK_TRANSFER' ? 'block' : 'none';
                  }}
                >
                  <option value="PAYPAL">Mock PayPal Account</option>
                  <option value="VISA_CHECKOUT">Mock Visa Checkout Token</option>
                  <option value="BANK_TRANSFER">ACH Bank Account</option>
                </select>
              </div>

              <div id="recurring-bank-fields" style={{ display: 'none' }} className="space-y-4 bg-slate-50 dark:bg-[#1E3248] rounded-2xl p-4 border border-slate-200 dark:border-white/5">
                <h4 className="text-sm font-medium text-teal-600 dark:text-teal-400">ACH Bank Transfer Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Bank Name</label>
                    <input
                      type="text"
                      name="payer_bank_name"
                      placeholder="Chase, Wells Fargo etc."
                      className="w-full bg-slate-100 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#1D9E75]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Account Number</label>
                    <input
                      type="text"
                      name="payer_account_no"
                      placeholder="Account No"
                      className="w-full bg-slate-100 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#1D9E75]"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#1D9E75] hover:bg-[#25C490] text-white py-4 rounded-2xl font-semibold transition shadow-lg shadow-[#1D9E75]/25"
              >
                Enable Auto-Pay
              </button>
            </form>
          )}
        </div>
      )}

      {!loading && activeTab === 'history' && (
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Transaction History Logs</h3>
            <span className="text-xs text-slate-500 dark:text-gray-400">Total processed transactions: {history.length}</span>
          </div>
          {history.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-gray-400 text-sm">
              No payments logged yet for this community.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#1E3248] text-xs text-slate-500 dark:text-gray-400 font-medium uppercase border-b border-slate-200 dark:border-white/5">
                    <th className="p-4">Transaction ID</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Payment Date</th>
                    <th className="p-4">Method</th>
                    <th className="p-4 text-right">Amount</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm text-slate-700 dark:text-gray-300">
                  {history.map((h) => (
                    <tr key={h.payment_id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono text-xs text-teal-600 dark:text-teal-400">
                        {h.gateway_token || `TXN_${h.payment_id}`}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{h.reason.replace('_', ' ').toUpperCase()}</div>
                        <div className="text-xs text-slate-400 dark:text-gray-500">Ref ID: {h.reference_id || 'N/A'}</div>
                      </td>
                      <td className="p-4 text-xs text-slate-500 dark:text-gray-400">
                        {new Date(h.payment_date).toLocaleString()}
                      </td>
                      <td className="p-4 text-xs">
                        {h.payment_method?.replace('_', ' ') || 'SANDBOX'}
                        {h.payer_bank_name && (
                          <div className="text-slate-400 dark:text-gray-500 text-[10px]">{h.payer_bank_name} (*{h.payer_account_no?.slice(-4)})</div>
                        )}
                      </td>
                      <td className="p-4 text-right font-mono font-semibold text-teal-600 dark:text-teal-400">
                        ${h.amount.toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                          h.status === 'COMPLETED' ? 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400' : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                        }`}>
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Admin/Board Views */}
      {!loading && activeTab === 'virtualhoa' && isBoardOrAdmin && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">VirtualHOA Subscription Invoices</h3>
            <p className="text-slate-500 dark:text-gray-400 text-sm mb-6">
              Track setup fees and license subscriptions due to the platform provider VirtualHOA.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {virtualHoadues.map((item) => (
                <div key={item.id} className="bg-slate-50 dark:bg-[#1E3248] rounded-2xl p-6 flex flex-col justify-between border border-slate-200 dark:border-white/5 hover:border-teal-500/20 transition shadow-sm hover:shadow-md relative overflow-hidden group">
                  <div>
                    <span className="text-[10px] font-mono tracking-wider bg-slate-200 dark:bg-[#0D1B2A] text-teal-700 dark:text-teal-400 px-3 py-1 rounded-full font-bold uppercase">
                      SYSTEM LICENSE
                    </span>
                    <h3 className="text-lg font-semibold mt-4 text-slate-800 dark:text-white">{item.title}</h3>
                    <div className="mt-2 text-2xl font-bold font-mono text-teal-600 dark:text-teal-400">${item.amount.toFixed(2)}</div>
                    <div className="text-xs text-slate-500 dark:text-gray-400 mt-4 flex items-center gap-1.5">
                      <Calendar size={13} />
                      Due Date: <span className="text-slate-700 dark:text-white font-medium">{item.due_date}</span>
                    </div>
                  </div>
                  
                  {item.status === 'COMPLETED' ? (
                    <div className="w-full mt-6 bg-teal-500/10 text-teal-600 dark:text-teal-400 py-3 rounded-2xl font-semibold text-center text-sm border border-teal-500/20">
                      ✓ Paid & Synchronized
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenWizard({ ...item, escrow_flag: false })}
                      className="w-full mt-6 flex items-center justify-center gap-2 bg-[#1D9E75] hover:bg-[#25C490] text-white py-3 rounded-2xl font-medium transition"
                    >
                      Pay VirtualHOA <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === 'vendors' && isBoardOrAdmin && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Vendor Quotes & Escrow Payments</h3>
            <p className="text-slate-500 dark:text-gray-400 text-sm mb-6">
              Review quotes approved by residents. Pay the vendor from the escrow account once work is verified.
            </p>

            {vendorAssignments.filter(v => v.status === 'APPROVED' || v.status === 'COMPLETED').length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-gray-400 text-sm">
                No active resident-approved vendor invoices found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vendorAssignments.filter(v => v.status === 'APPROVED' || v.status === 'COMPLETED').map((v) => (
                  <div key={v.assignment_id} className="bg-slate-50 dark:bg-[#1E3248] rounded-2xl p-6 flex flex-col justify-between border border-slate-200 dark:border-white/5 hover:border-teal-500/20 transition shadow-sm hover:shadow-md relative overflow-hidden group">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] font-mono tracking-wider px-3 py-1 rounded-full font-bold uppercase ${
                          v.status === 'COMPLETED' ? 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400' : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300'
                        }`}>
                          {v.status === 'COMPLETED' ? 'PAID TO VENDOR' : 'ESCROW RECEIVED (AWAITING PAYOUT)'}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold mt-4 text-slate-900 dark:text-white">{v.vendor?.company_name || 'Vendor Company'}</h3>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Receipt No: {v.vendor_receipt_no || 'N/A'}</p>
                      
                      <div className="mt-2 text-2xl font-bold font-mono text-teal-600 dark:text-teal-400">${(v.quote_amount || 0).toFixed(2)}</div>
                      <div className="text-xs text-slate-500 dark:text-gray-400 mt-4 space-y-1">
                        <div>Location: <span className="text-slate-700 dark:text-white font-medium">{v.service_location || 'N/A'}</span></div>
                        <div>Quote Date: <span className="text-slate-700 dark:text-white font-medium">{v.quote_date || 'N/A'}</span></div>
                      </div>
                    </div>

                    {v.status === 'COMPLETED' ? (
                      <div className="w-full mt-6 bg-teal-500/10 text-teal-600 dark:text-teal-400 py-3 rounded-2xl font-semibold text-center text-sm border border-teal-500/20">
                        ✓ Disbursed to Vendor
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenWizard({
                          id: v.assignment_id,
                          reference_id: v.assignment_id,
                          title: `Vendor Payout: ${v.vendor?.company_name} (Invoice #${v.vendor_receipt_no})`,
                          amount: v.quote_amount,
                          reason: 'VENDOR_PAYMENT',
                          escrow_flag: false // Pay OUT of escrow to vendor
                        })}
                        className="w-full mt-6 flex items-center justify-center gap-2 bg-[#1D9E75] hover:bg-[#25C490] text-white py-3 rounded-2xl font-medium transition"
                      >
                        Disburse Funds <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Wizard Modal */}
      {wizard.isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gradient-to-br dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative text-slate-900 dark:text-white">
            
            {/* Close Button */}
            {wizard.currentStep !== 3 && (
              <button 
                onClick={handleCloseWizard}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition"
              >
                <X size={20} />
              </button>
            )}

            {/* Content Switcher */}
            <div className="p-8">
              {/* Step 1: Confirm Details */}
              {wizard.currentStep === 1 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield className="text-teal-600 dark:text-teal-400" size={22} />
                    Confirm Payment Details
                  </h3>
                  
                  <div className="bg-slate-50 dark:bg-[#1E3248] border border-slate-200 dark:border-0 rounded-2xl p-6 space-y-4 mb-6">
                    <div>
                      <label className="text-xs text-slate-500 dark:text-gray-400 block uppercase tracking-widest font-bold">Payment Item</label>
                      <div className="text-lg font-semibold text-slate-900 dark:text-white mt-1">{wizard.dueItem.title}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-white/5">
                      <div>
                        <label className="text-xs text-slate-500 dark:text-gray-400 block uppercase tracking-widest">Amount Due</label>
                        <div className="text-2xl font-bold font-mono text-teal-600 dark:text-teal-400 mt-1">${wizard.dueItem.amount.toFixed(2)}</div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 dark:text-gray-400 block uppercase tracking-widest">Target Bank</label>
                        <div className="text-sm font-semibold text-slate-800 dark:text-white mt-1.5">
                          {wizard.dueItem.escrow_flag !== false ? (community.bank_name || 'Community Escrow') : 'VirtualHOA Ledger'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs mb-6 flex items-center gap-2 bg-[#1D9E75]/10 border border-[#1D9E75]/20 p-3 rounded-xl text-[#1D9E75] dark:text-[#25C490]">
                    <Lock size={14} /> Payments are secured with mock SSL encryption and gateway tokenization.
                  </p>

                  <button
                    onClick={() => setWizard(prev => ({ ...prev, currentStep: 2 }))}
                    className="w-full bg-[#1D9E75] hover:bg-[#25C490] text-white py-4 rounded-2xl font-semibold transition"
                  >
                    Confirm & Select Method
                  </button>
                </div>
              )}

              {/* Step 2: Choose Payment Method */}
              {wizard.currentStep === 2 && (
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Select Payment Method</h3>
                  <p className="text-slate-500 dark:text-gray-400 text-sm mb-6">Choose how you want to settle the transaction amount.</p>
                  
                  {wizard.error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl p-3 text-xs mb-4 flex items-center gap-2">
                      <AlertCircle size={14} /> {wizard.error}
                    </div>
                  )}

                  <div className="space-y-3 mb-6">
                    {/* Mock PayPal */}
                    <button
                      onClick={() => setWizard(prev => ({ ...prev, paymentMethod: 'PAYPAL' }))}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                        wizard.paymentMethod === 'PAYPAL' ? 'border-[#1D9E75] bg-[#1D9E75]/5 text-[#1D9E75] dark:text-white' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 text-lg font-bold">P</span>
                        <div>
                          <div className="text-sm font-semibold">Mock PayPal Account</div>
                          <div className="text-xs text-slate-500 dark:text-gray-400">Generates instant secure checkout token</div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        wizard.paymentMethod === 'PAYPAL' ? 'border-[#1D9E75] bg-[#1D9E75]' : 'border-slate-300 dark:border-gray-500'
                      }`}>
                        {wizard.paymentMethod === 'PAYPAL' && <div className="w-2.5 h-2.5 bg-white dark:bg-[#162535] rounded-full" />}
                      </div>
                    </button>

                    {/* Mock Visa Checkout */}
                    <button
                      onClick={() => setWizard(prev => ({ ...prev, paymentMethod: 'VISA_CHECKOUT' }))}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                        wizard.paymentMethod === 'VISA_CHECKOUT' ? 'border-[#1D9E75] bg-[#1D9E75]/5 text-[#1D9E75] dark:text-white' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-lg font-bold">V</span>
                        <div>
                          <div className="text-sm font-semibold">Mock Visa Checkout</div>
                          <div className="text-xs text-slate-500 dark:text-gray-400">Sandbox VISA tokenization framework</div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        wizard.paymentMethod === 'VISA_CHECKOUT' ? 'border-[#1D9E75] bg-[#1D9E75]' : 'border-slate-300 dark:border-gray-500'
                      }`}>
                        {wizard.paymentMethod === 'VISA_CHECKOUT' && <div className="w-2.5 h-2.5 bg-white dark:bg-[#162535] rounded-full" />}
                      </div>
                    </button>

                    {/* ACH Bank Transfer */}
                    <button
                      onClick={() => setWizard(prev => ({ ...prev, paymentMethod: 'BANK_TRANSFER' }))}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                        wizard.paymentMethod === 'BANK_TRANSFER' ? 'border-[#1D9E75] bg-[#1D9E75]/5 text-[#1D9E75] dark:text-white' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 bg-teal-500/10 dark:bg-teal-500/20 rounded-xl flex items-center justify-center text-teal-600 dark:text-teal-400 text-lg font-bold">🏦</span>
                        <div>
                          <div className="text-sm font-semibold">ACH Bank Transfer</div>
                          <div className="text-xs text-slate-500 dark:text-gray-400">Direct escrow bank wire routing</div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        wizard.paymentMethod === 'BANK_TRANSFER' ? 'border-[#1D9E75] bg-[#1D9E75]' : 'border-slate-300 dark:border-gray-500'
                      }`}>
                        {wizard.paymentMethod === 'BANK_TRANSFER' && <div className="w-2.5 h-2.5 bg-white dark:bg-[#162535] rounded-full" />}
                      </div>
                    </button>
                  </div>

                  {wizard.paymentMethod === 'BANK_TRANSFER' && (
                    <div className="space-y-3 mb-6 bg-slate-50 dark:bg-[#1E3248] rounded-2xl p-4 border border-slate-200 dark:border-white/5">
                      <h4 className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide">ACH Wire Account Info</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-500 dark:text-gray-400 block mb-1">Bank Name</label>
                          <input
                            type="text"
                            placeholder="Chase, Wells Fargo"
                            value={wizard.payerBankName}
                            onChange={(e) => setWizard(prev => ({ ...prev, payerBankName: e.target.value }))}
                            className="w-full bg-slate-100 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 dark:text-gray-400 block mb-1">Account Number</label>
                          <input
                            type="text"
                            placeholder="Account Number"
                            value={wizard.payerAccountNo}
                            onChange={(e) => setWizard(prev => ({ ...prev, payerAccountNo: e.target.value }))}
                            className="w-full bg-slate-100 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={() => setWizard(prev => ({ ...prev, currentStep: 1 }))}
                      className="w-1/3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white py-4 rounded-2xl font-semibold transition"
                    >
                      Back
                    </button>
                    <button
                      onClick={executePayment}
                      disabled={!wizard.paymentMethod || (wizard.paymentMethod === 'BANK_TRANSFER' && (!wizard.payerBankName || !wizard.payerAccountNo))}
                      className="w-2/3 bg-[#1D9E75] hover:bg-[#25C490] text-white py-4 rounded-2xl font-semibold transition disabled:opacity-50"
                    >
                      Secure Pay
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Gateway Tokenizer Simulation */}
              {wizard.currentStep === 3 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Loader className="animate-spin text-[#25C490] mb-6" size={50} />
                  <h3 className="text-xl font-semibold mb-2">Redirecting to Secure Gateway</h3>
                  <p className="text-slate-500 dark:text-gray-400 text-sm max-w-xs">
                    Please do not close this window. We are establishing connection to the mock payment processor and retrieving authorization token...
                  </p>
                </div>
              )}

              {/* Step 4: Success confirmation */}
              {wizard.currentStep === 4 && wizard.receipt && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 animate-bounce">
                    ✓
                  </div>
                  <h3 className="text-2xl font-bold mb-1">Payment Completed!</h3>
                  <p className="text-slate-500 dark:text-gray-400 text-sm">A receipt has been sent to your email.</p>

                  <div className="bg-slate-50 dark:bg-[#1E3248] border border-slate-200 dark:border-0 rounded-2xl p-6 my-6 text-left space-y-3 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-gray-400">Transaction Ref:</span>
                      <span className="text-teal-600 dark:text-teal-400 text-right select-all">{wizard.receipt.gateway_token}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 dark:border-white/5 pt-3">
                      <span className="text-slate-500 dark:text-gray-400">Paid Amount:</span>
                      <span className="text-slate-900 dark:text-white font-bold">${wizard.receipt.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-gray-400">Payment Reason:</span>
                      <span className="text-slate-900 dark:text-white">{wizard.receipt.reason.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-gray-400">Timestamp:</span>
                      <span className="text-slate-900 dark:text-white">{new Date(wizard.receipt.payment_date).toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCloseWizard}
                    className="w-full bg-[#1D9E75] hover:bg-[#25C490] text-white py-4 rounded-2xl font-semibold transition"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
