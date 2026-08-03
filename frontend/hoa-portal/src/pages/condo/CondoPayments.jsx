import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  RefreshCw, Search, Plus, CreditCard, ChevronDown, 
  Copy, Check, Calendar, Receipt, Award, Landmark, Wallet
} from 'lucide-react';
import API from '../../services/api';

export default function CondoPayments({ community, user }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null); // Detailed invoice view
  const [copiedTxnId, setCopiedTxnId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Payment Form state
  const [amount, setAmount] = useState('');
  const [payType, setPayType] = useState('MAINTENANCE');
  const [payMethod, setPayMethod] = useState('ACH');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const role = (user?.role_name || user?.role || '').toLowerCase();
  const commId = community?.community_id;

  const paymentTypes = ["MAINTENANCE", "SPECIAL_ASSESSMENT", "ELEVATOR_DEPOSIT", "FINE"];
  const paymentMethods = ["ACH", "CREDIT_CARD", "PAYPAL"];
  const quickAmounts = [100, 250, 500, 1000];

  useEffect(() => {
    if (commId) {
      fetchPayments();
    }
  }, [commId]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await API.get(`/condo/operations/payments?community_id=${commId}`);
      setPayments(res.data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load payments ledger.");
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return setErrorMsg('Please enter a valid amount');

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      await API.post('/condo/operations/payments', {
        community_id: commId,
        amount: parseFloat(amount),
        payment_type: payType,
        payment_method: payMethod,
        notes: notes.trim()
      });

      setSuccessMsg("Payment processed successfully! Transaction recorded.");
      setAmount('');
      setNotes('');
      setShowPayModal(false);
      fetchPayments();
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to process payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (txt) => {
    navigator.clipboard.writeText(txt);
    setCopiedTxnId(txt);
    setTimeout(() => setCopiedTxnId(''), 2000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getMethodIcon = (method) => {
    switch (method?.toUpperCase()) {
      case 'ACH':
        return <Landmark size={15} className="text-blue-500" />;
      case 'CREDIT_CARD':
        return <CreditCard size={15} className="text-violet-500" />;
      default:
        return <Wallet size={15} className="text-indigo-500" />;
    }
  };

  const getCategoryColor = (type) => {
    switch (type?.toUpperCase()) {
      case 'MAINTENANCE': return 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-[#818CF8]';
      case 'SPECIAL_ASSESSMENT': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400';
      case 'FINE': return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-450';
      default: return 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-350';
    }
  };

  const filteredPayments = payments.filter(p => 
    p.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.payment_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics calculation
  const totalPaid = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const lastPayment = payments.length > 0 ? payments[0] : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-white font-sans p-2 animate-fade-in-up">
      


      {/* System alert messages */}
      {(errorMsg || successMsg) && (
        <div className="space-y-2 animate-fade-in-scale">
          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-455 text-xs rounded-xl flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-455 text-xs rounded-xl flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {successMsg}
            </div>
          )}
        </div>
      )}

      {/* Account stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total paid */}
        <div className="bg-slate-50/50 dark:bg-[#1E2E42]/30 border border-slate-200/60 dark:border-white/5 p-5 rounded-3xl flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl border border-purple-500/20">
            <Receipt size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Slipped</p>
            <h4 className="text-xl font-black">${totalPaid.toFixed(2)}</h4>
          </div>
        </div>

        {/* Ledger account status */}
        <div className="bg-slate-50/50 dark:bg-[#1E2E42]/30 border border-slate-200/60 dark:border-white/5 p-5 rounded-3xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20">
            <Award size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Account Status</p>
            <h4 className="text-sm font-extrabold text-emerald-600 dark:text-emerald-450 uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> In Good Standing
            </h4>
          </div>
        </div>

        {/* Last checkout */}
        <div className="bg-slate-50/50 dark:bg-[#1E2E42]/30 border border-slate-200/60 dark:border-white/5 p-5 rounded-3xl flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl border border-indigo-500/20">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Last Activity</p>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350">
              {lastPayment ? `${formatDate(lastPayment.payment_date).split(',')[0]} - $${lastPayment.amount}` : 'No activity logged'}
            </h4>
          </div>
        </div>
      </div>

      {/* Search Header */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-50/50 dark:bg-[#1E2E42]/20 p-4 rounded-2xl border border-slate-200/60 dark:border-white/5">
        <div className="relative w-full sm:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={16} />
          </span>
          <input 
            type="text" 
            placeholder="Search transactions by code or memo..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-455 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/25 transition-all shadow-xs"
          />
        </div>

        {role === 'resident' && (
          <button 
            onClick={() => setShowPayModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all hover:-translate-y-[1px] flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20 cursor-pointer whitespace-nowrap animate-in fade-in"
          >
            <Plus size={15} /> Make a Payment
          </button>
        )}
      </div>

      {/* Ledger Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw size={32} className="animate-spin text-purple-500 mb-3" />
          <span className="text-xs text-slate-450 font-mono">LOADING TRANSACTION HISTORY...</span>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="text-center py-20 bg-slate-50/50 dark:bg-[#162535] rounded-3xl border border-dashed border-slate-200 dark:border-white/10 text-slate-450 flex flex-col items-center justify-center p-6 animate-fade-in-scale">
          <Receipt size={40} className="stroke-[1.5] mb-3 text-slate-350 dark:text-slate-600" />
          <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No transactions recorded.</p>
          <p className="text-xs mt-1">Payments made through the portal will reflect here immediately.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1E2E42]/45 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-xs animate-fade-in-scale">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/40 text-[9px] font-extrabold text-slate-450 dark:text-gray-400 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                  <th className="px-6 py-4">Transaction Code</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Settle Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                {filteredPayments.map((p) => (
                  <tr 
                    key={p.payment_id} 
                    className="hover:bg-slate-50/40 dark:hover:bg-white/[0.01] transition-colors cursor-pointer"
                    onClick={() => setSelectedInvoice(p)}
                  >
                    <td className="px-6 py-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <span>{p.transaction_id || 'N/A'}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(p.transaction_id);
                          }}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                          title="Copy Transaction ID"
                        >
                          {copiedTxnId === p.transaction_id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${getCategoryColor(p.payment_type)}`}>
                        {p.payment_type?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900 dark:text-white text-sm">
                      ${p.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-300 uppercase">
                        {getMethodIcon(p.payment_method)}
                        <span>{p.payment_method}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">
                      {formatDate(p.payment_date || p.created_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {showPayModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#162535] rounded-3xl border border-slate-200 dark:border-white/10 w-full max-w-md overflow-hidden shadow-2xl">
            
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-900/30">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span></span> Submit Condo Payment
              </h3>
              <button 
                onClick={() => { setShowPayModal(false); setErrorMsg(''); }}
                className="text-slate-450 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:scale-105 transition-all w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                
              </button>
            </div>

            <form onSubmit={handlePay} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-[10px] rounded-xl font-bold uppercase tracking-widest">
                  {errorMsg}
                </div>
              )}
              
              {/* Payment selection chips */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Quick Amount Select</label>
                <div className="grid grid-cols-4 gap-2">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(String(amt))}
                      className={`py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        parseFloat(amount) === amt
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-slate-50 dark:bg-[#0D1B2A] text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/50 border border-slate-200 dark:border-white/20'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Payment Amount ($) <span className="text-red-500">*</span></label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 250.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Category <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      value={payType}
                      onChange={e => setPayType(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl pl-4 pr-10 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer appearance-none"
                    >
                      {paymentTypes.map(t => (
                        <option key={t} value={t} className="text-slate-900 dark:text-white">{t.replace('_', ' ')}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={18} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Payment Method <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      value={payMethod}
                      onChange={e => setPayMethod(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl pl-4 pr-10 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer appearance-none"
                    >
                      {paymentMethods.map(m => (
                        <option key={m} value={m} className="text-slate-900 dark:text-white">{m}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={18} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Notes / Memo</label>
                <input 
                  type="text"
                  placeholder="e.g. Monthly maintenance fee Unit 302"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-200 dark:border-white/10 mt-6">
                <button 
                  type="button" 
                  onClick={() => { setShowPayModal(false); setErrorMsg(''); }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-md shadow-purple-500/10"
                >
                  {submitting ? "Processing..." : "Authorize Pay Now"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Invoice receipt Detail Modal */}
      {selectedInvoice && ReactDOM.createPortal(
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={() => setSelectedInvoice(null)}
        >
          <div 
            className="bg-white dark:bg-[#162535] rounded-3xl border border-slate-200 dark:border-white/10 w-full max-w-sm overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cutout details on receipt */}
            <div className="absolute -left-3 top-1/2 w-6 h-6 rounded-full bg-black/70" />
            <div className="absolute -right-3 top-1/2 w-6 h-6 rounded-full bg-black/70" />

            <div className="p-6 border-b border-dashed border-slate-250 dark:border-white/10 text-center">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Receipt size={24} />
              </div>
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Digital Payment Receipt</h3>
              <h2 className="text-2xl font-black mt-1.5 text-slate-900 dark:text-white">${selectedInvoice.amount.toFixed(2)}</h2>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase mt-1 tracking-widest">Transaction Successful</p>
            </div>

            <div className="p-6 space-y-4 text-xs font-semibold">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Code Ref</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedInvoice.transaction_id}</span>
              </div>
              
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Payment Category</span>
                <span className="text-slate-800 dark:text-slate-200 uppercase">{selectedInvoice.payment_type?.replace('_', ' ')}</span>
              </div>

              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Paid via</span>
                <span className="text-slate-800 dark:text-slate-200 uppercase flex items-center gap-1.5">
                  {getMethodIcon(selectedInvoice.payment_method)}
                  {selectedInvoice.payment_method}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Account Unit</span>
                <span className="text-slate-800 dark:text-slate-200"># {user?.unit_no || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Timestamp</span>
                <span className="text-slate-800 dark:text-slate-200">{formatDate(selectedInvoice.payment_date || selectedInvoice.created_date)}</span>
              </div>

              {selectedInvoice.notes && (
                <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-1">
                  <p className="text-[9px] uppercase tracking-widest text-slate-400">Memo / Notes</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-350 italic">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-white/5 flex gap-2 justify-end">
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
