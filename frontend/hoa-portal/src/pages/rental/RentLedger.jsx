import React, { useState, useEffect } from 'react';
import { 
  CreditCard, DollarSign, Activity, Settings2, 
  ShieldAlert, Sparkles, CheckCircle2, X 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import API from '../../services/api';

// Translucent Status Badge mapping
const StatusBadge = ({ status }) => {
  const map = {
    PAID: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20',
    OVERDUE: 'text-rose-600 dark:text-rose-450 bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/20',
    UNPAID: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase whitespace-nowrap ${map[status] || 'text-gray-550 border-gray-500/20'}`}>
      {status}
    </span>
  );
};

export default function RentLedger({ user, selectedPropertyFilterId = 'all' }) {
  const isLandlord = user?.role === 'landlord' || user?.role_name === 'landlord' || user?.role_id === 1;

  const [invoices, setInvoices] = useState([]);
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Payment states
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payMethod, setPayMethod] = useState('ACH');
  const [showPayModal, setShowPayModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      // Fetch leases to get invoices
      const leaseRes = await API.get('/rental/leases');
      setLeases(leaseRes.data);
      
      const allInvoices = [];
      for (const lease of leaseRes.data) {
        const ledgerRes = await API.get(`/rental/leases/${lease.lease_id}/ledgers`);
        allInvoices.push(...ledgerRes.data.map(i => ({ ...i, lease })));
      }
      // Sort by due date descending
      allInvoices.sort((a, b) => new Date(b.due_date) - new Date(a.due_date));
      setInvoices(allInvoices);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSimulateBilling() {
    try {
      const res = await API.post('/rental/simulate/monthly-billing');
      toast.success(res.data.message || 'Billing simulation executed.');
      fetchData();
    } catch (err) {
      toast.error('Failed to run billing simulation.');
    }
  }

  async function handleSimulateLateFees() {
    try {
      const res = await API.post('/rental/simulate/late-fees');
      toast.success(res.data.message || 'Late fee simulation executed.');
      fetchData();
    } catch (err) {
      toast.error('Failed to run late fee simulation.');
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
      toast.success(`Invoice #${selectedInvoice.invoice_id} successfully paid via mock ${payMethod}!`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to make payment.");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 bg-slate-50 dark:bg-[#0D1B2A] rounded-3xl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-semibold text-gray-550 dark:text-gray-400 font-mono tracking-wider">LOADING LEDGER...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 relative text-slate-900 dark:text-white text-left animate-fade-in font-sans">
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
        
        {/* Header Section */}
        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-slate-805 dark:text-white font-medium text-sm flex items-center gap-2">
            <CreditCard size={16} /> Payments Ledger Directory
          </div>
          
          {/* Landlord Simulator Tools */}
          {isLandlord && (
            <div className="flex gap-2">
              <button 
                onClick={handleSimulateLateFees}
                className="px-3.5 py-1.5 border border-yellow-500/50 text-yellow-600 dark:text-yellow-450 hover:bg-yellow-500/10 rounded-xl flex items-center gap-1.5 font-bold transition-all text-xs cursor-pointer whitespace-nowrap"
              >
                <ShieldAlert className="w-3.5 h-3.5" /> Apply Late Fees
              </button>
              <button 
                onClick={handleSimulateBilling}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center gap-1.5 font-bold transition-all text-xs shadow-md shadow-blue-500/20 cursor-pointer whitespace-nowrap"
              >
                <Settings2 className="w-3.5 h-3.5" /> Trigger Rent Rolls
              </button>
            </div>
          )}
        </div>



        {(() => {
          const filteredInvoices = invoices.filter(inv => {
            return selectedPropertyFilterId === 'all' || String(inv.lease?.unit?.property_id) === String(selectedPropertyFilterId);
          });

          if (filteredInvoices.length === 0) {
            return <div className="py-20 text-center text-slate-400 text-sm">No transaction invoices generated in ledger records.</div>;
          }

          return (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 uppercase text-[10px] tracking-wider font-bold text-slate-500 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-4">Invoice ID</th>
                    <th className="px-4 py-4">Lease Unit</th>
                    <th className="px-4 py-4">Due Date</th>
                    <th className="px-4 py-4">Amount Due</th>
                    <th className="px-4 py-4">Late Penalty</th>
                    <th className="px-4 py-4 text-center">Status</th>
                    <th className="px-4 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-gray-300">
                  {filteredInvoices.map(inv => (
                  <tr key={inv.invoice_id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-4 py-4 font-mono text-xs font-bold text-indigo-650 dark:text-[#5BA4F5] whitespace-nowrap">#{inv.invoice_id}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 dark:text-white">Unit {inv.lease?.unit?.unit_number || 'N/A'}</span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500 dark:text-gray-400 whitespace-nowrap">{inv.due_date}</td>
                    <td className="px-4 py-4">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">${inv.amount}</div>
                      {(inv.utilities_charge > 0 || inv.parking_charge > 0 || inv.pet_charge > 0 || inv.maintenance_charge > 0) && (
                        <div className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wide flex flex-wrap gap-x-2 gap-y-0.5">
                          {inv.rent_charge > 0 && <span>Rent: ${inv.rent_charge}</span>}
                          {inv.utilities_charge > 0 && <span>• Util: ${inv.utilities_charge}</span>}
                          {inv.parking_charge > 0 && <span>• Park: ${inv.parking_charge}</span>}
                          {inv.pet_charge > 0 && <span>• Pet: ${inv.pet_charge}</span>}
                          {inv.maintenance_charge > 0 && <span>• Maint: ${inv.maintenance_charge}</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">${inv.late_fee_applied || '0.00'}</td>
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      {inv.status !== 'PAID' && !isLandlord ? (
                        <button
                          onClick={() => { setSelectedInvoice(inv); setShowPayModal(true); }}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Pay Invoice
                        </button>
                      ) : inv.status === 'PAID' ? (
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-slate-905 dark:text-gray-300 font-medium">Paid</span>
                          <span className="text-[9px] text-gray-450 dark:text-gray-500 uppercase tracking-wide">via {inv.payment_method}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-gray-500 italic">Awaiting payment</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ); })()}
      </div>

      {/* Pay Invoice Modal */}
      {showPayModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e2a3b] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl animate-scale-up text-slate-900 dark:text-white text-left">
            <div className="flex justify-between items-center border-b dark:border-white/5 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pay Rental Invoice</h3>
              <button onClick={() => setShowPayModal(false)} className="text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white text-lg cursor-pointer"><X size={20} /></button>
            </div>
            
            <div className="bg-slate-50 dark:bg-[#111c2a] p-4 rounded-xl border border-slate-200 dark:border-white/10 text-xs text-gray-500 dark:text-gray-400 space-y-2">
              <div className="flex justify-between">
                <span>Unit:</span>
                <span className="font-bold text-gray-900 dark:text-white">Unit {selectedInvoice.lease?.unit?.unit_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Due Date:</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedInvoice.due_date}</span>
              </div>
              
              <div className="border-t border-dashed dark:border-white/10 my-2 pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Base Rent:</span>
                  <span className="font-medium text-gray-900 dark:text-white">${selectedInvoice.rent_charge || selectedInvoice.amount}</span>
                </div>
                {selectedInvoice.utilities_charge > 0 && (
                  <div className="flex justify-between">
                    <span>Utilities Charge:</span>
                    <span className="font-medium text-gray-900 dark:text-white">${selectedInvoice.utilities_charge}</span>
                  </div>
                )}
                {selectedInvoice.parking_charge > 0 && (
                  <div className="flex justify-between">
                    <span>Parking Fee:</span>
                    <span className="font-medium text-gray-900 dark:text-white">${selectedInvoice.parking_charge}</span>
                  </div>
                )}
                {selectedInvoice.pet_charge > 0 && (
                  <div className="flex justify-between">
                    <span>Pet Rent:</span>
                    <span className="font-medium text-gray-900 dark:text-white">${selectedInvoice.pet_charge}</span>
                  </div>
                )}
                {selectedInvoice.late_fee_applied > 0 && (
                  <div className="flex justify-between text-rose-500 font-bold">
                    <span>Late Penalty Fee:</span>
                    <span>${selectedInvoice.late_fee_applied}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-slate-900 dark:text-white mt-2 pt-2 border-t border-slate-200 dark:border-white/10 font-bold">
                <span>Total Amount:</span>
                <span className="text-lg font-black text-blue-600 dark:text-blue-400">${selectedInvoice.amount + selectedInvoice.late_fee_applied}</span>
              </div>
            </div>

            <form onSubmit={handlePayInvoice} className="space-y-4 text-left">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide font-bold">PAYMENT METHOD (USA ACH/CARD)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPayMethod('ACH')}
                    className={`py-3 px-4 rounded-xl border font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      payMethod === 'ACH'
                        ? 'bg-blue-650/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    🏦
                    <span className="text-xs">ACH Transfer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMethod('CARD')}
                    className={`py-3 px-4 rounded-xl border font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      payMethod === 'CARD'
                        ? 'bg-blue-650/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    💳
                    <span className="text-xs">Credit Card</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowPayModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 transition-all shadow-md shadow-blue-500/25">Submit Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
