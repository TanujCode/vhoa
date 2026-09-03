import React, { useState, useEffect } from 'react';
import { 
  CreditCard, DollarSign, Activity, Settings2, 
  ShieldAlert, Sparkles, CheckCircle2, X, Landmark, Edit3,
  Car, PawPrint, Eye, FileText, Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import API from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';

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

  const getInvoiceSeqNum = (inv) => {
    const propId = inv.lease?.unit?.property_id;
    if (!propId) return inv.invoice_id;
    const propInvoices = invoices
      .filter(item => item.lease?.unit?.property_id === propId)
      .sort((a, b) => a.invoice_id - b.invoice_id);
    const idx = propInvoices.findIndex(item => item.invoice_id === inv.invoice_id);
    return idx !== -1 ? idx + 1 : inv.invoice_id;
  };
  
  // Payment states
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payMethod, setPayMethod] = useState('ACH');
  const [showPayModal, setShowPayModal] = useState(false);

  // Itemized breakdown modal state
  const [detailsInvoice, setDetailsInvoice] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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
      // Fetch leases to get invoices
      const leaseRes = await API.get('/rental/leases');
      const allLeases = leaseRes.data || [];
      setLeases(allLeases);
      
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
      // Sort by invoice_id ascending
      allInvoices.sort((a, b) => a.invoice_id - b.invoice_id);
      setInvoices(allInvoices);
    } catch (err) {
      console.error(err);
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
      "Are you sure you want to run late fee calculations for all unpaid invoices? This will search and apply configured late fees to all overdue accounts.",
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
      "Yes, Run Simulation"
    );
  }

  async function handleApplySingleLateFee(invoiceId) {
    showConfirm(
      "Apply Late Fee",
      `Are you sure you want to apply the late penalty fee to invoice #${invoiceId}?`,
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
      showAlert("Success", `Invoice #${selectedInvoice.invoice_id} successfully paid via mock ${payMethod}!`, "success");
    } catch (err) {
      showAlert("Error", err.response?.data?.detail || "Failed to make payment.", "danger");
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

          const pendingLease = leases.find(l => ['PENDING_TENANT_REVIEW', 'PENDING_SIGNATURE'].includes((l.status || '').toUpperCase()));

          if (filteredInvoices.length === 0) {
            if (pendingLease && !isLandlord) {
              return (
                <div className="py-16 px-6 text-center space-y-4 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                    <FileText size={24} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Lease Signature Required</h4>
                    <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
                      Your lease agreement for <strong>{pendingLease.property_name || 'your property'}</strong> is awaiting your signature. Once signed and approved, your monthly rent invoices will appear here for online payment.
                    </p>
                  </div>
                  <a
                    href="/rental/dashboard?tab=leases_hub"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20"
                  >
                    <Edit3 size={14} /> Review & Sign Lease
                  </a>
                </div>
              );
            }
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
                    <td className="px-4 py-4 font-mono text-xs font-bold text-indigo-650 dark:text-[#5BA4F5] whitespace-nowrap">#{getInvoiceSeqNum(inv)}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-white">{inv.lease?.unit?.property_type === 'condo' ? 'Apt' : 'Unit'} {inv.lease?.unit?.unit_number || 'N/A'}</span>
                        {inv.lease?.tenant_name && (
                          <span className="text-[10px] text-slate-500 dark:text-gray-400 font-medium">
                            Tenant: {inv.lease.tenant_name}
                          </span>
                        )}
                        {inv.lease?.property_name && (
                          <span className="text-[10px] text-slate-400 dark:text-gray-550 font-medium italic">
                            Property: {inv.lease.property_name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500 dark:text-gray-400 whitespace-nowrap">{inv.due_date}</td>
                    <td className="px-4 py-4">
                      {(() => {
                        const parkFee = inv.parking_charge > 0 
                          ? inv.parking_charge 
                          : (inv.lease?.parking_fee ? parseFloat(inv.lease.parking_fee) : (inv.lease?.vehicle_details ? inv.lease.vehicle_details.split(';').filter(Boolean).length * 25 : 0));

                        const petFee = inv.pet_charge > 0 
                          ? inv.pet_charge 
                          : (inv.lease?.pet_fee ? parseFloat(inv.lease.pet_fee) : (inv.lease?.pet_details ? inv.lease.pet_details.split(';').filter(Boolean).length * 50 : 0));

                        const rentFee = inv.rent_charge > 0 
                          ? inv.rent_charge 
                          : (inv.lease?.rent_amount || (inv.amount - (inv.pet_charge || 0) - (inv.parking_charge || 0) - (inv.utilities_charge || 0) - (inv.maintenance_charge || 0)));

                        const totalAmount = rentFee + parkFee + petFee + (inv.utilities_charge || 0) + (inv.maintenance_charge || 0);

                        return (
                          <div>
                            <div className="font-mono font-bold text-slate-900 dark:text-white">${totalAmount}</div>
                            <div className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wide flex flex-wrap gap-x-2 gap-y-0.5 font-medium">
                              <span>Rent: ${rentFee}</span>
                              {parkFee > 0 && <span>• Vehicle: ${parkFee}</span>}
                              {petFee > 0 && <span>• Pet: ${petFee}</span>}
                              {inv.utilities_charge > 0 && <span>• Util: ${inv.utilities_charge}</span>}
                              {inv.maintenance_charge > 0 && <span>• Maint: ${inv.maintenance_charge}</span>}
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                     <td className="px-4 py-4 whitespace-nowrap">
                       <div className="font-mono font-bold text-rose-600 dark:text-rose-400">
                         ${inv.late_fee_applied || '0.00'}
                       </div>
                       {inv.late_fee_applied > 0 && inv.lease?.late_fee_type && (
                         <div className="text-[9px] uppercase tracking-wide font-bold mt-0.5 text-rose-400/70">
                           {inv.lease.late_fee_type === 'PERCENTAGE' ? `${inv.lease.late_fee_amount}% of rent` : 'Flat fee'}
                         </div>
                       )}
                     </td>
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      {inv.status !== 'PAID' && !isLandlord ? (
                        <button
                          onClick={() => { setSelectedInvoice(inv); setShowPayModal(true); }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition active:scale-95 shadow-md shadow-blue-500/20 cursor-pointer"
                        >
                          Pay Invoice
                        </button>
                      ) : inv.status === 'PAID' ? (
                        <div className="flex flex-col items-end">
                           <span className="text-xs text-slate-900 dark:text-gray-300 font-semibold">Paid</span>
                           <span className="text-[9px] text-slate-400 dark:text-gray-500 uppercase tracking-wide font-medium">via {inv.payment_method}</span>
                        </div>
                      ) : isLandlord ? (
                        <div className="flex items-center justify-end gap-2">
                          {inv.status === 'OVERDUE' || inv.late_fee_applied > 0 ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="px-2.5 py-1 bg-rose-500/10 text-rose-500 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                Overdue (Fee Applied)
                              </span>
                              <button
                                onClick={() => handleRevertSingleLateFee(inv.invoice_id)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 dark:text-gray-300 rounded-lg text-[10px] font-bold transition active:scale-95 cursor-pointer shadow-sm"
                                title="Remove late fee"
                              >
                                Revert Fee
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleApplySingleLateFee(inv.invoice_id)}
                              className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500 hover:text-white text-yellow-600 dark:text-yellow-455 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer flex items-center gap-1"
                            >
                              <ShieldAlert className="w-3 h-3" />
                              <span>Apply Late Fee</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-gray-500 italic font-medium">Awaiting payment</span>
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
                <span className="font-bold text-gray-900 dark:text-white">{selectedInvoice.lease?.unit?.property_type === 'condo' ? 'Apt' : 'Unit'} {selectedInvoice.lease?.unit?.unit_number}</span>
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
                    className={`py-3 px-4 rounded-xl border font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                      payMethod === 'ACH'
                        ? 'bg-blue-650/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <Landmark size={20} className={payMethod === 'ACH' ? 'text-blue-600 dark:text-blue-450' : 'text-slate-400'} />
                    <span className="text-xs">ACH Transfer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMethod('CARD')}
                    className={`py-3 px-4 rounded-xl border font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                      payMethod === 'CARD'
                        ? 'bg-blue-650/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <CreditCard size={20} className={payMethod === 'CARD' ? 'text-blue-600 dark:text-blue-450' : 'text-slate-400'} />
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

      {/* Edit Late Fee Modal */}
      {showEditFeeModal && editFeeInvoice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e2a3b] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl animate-scale-up text-slate-900 dark:text-white text-left">
            <div className="flex justify-between items-center border-b dark:border-white/5 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-500" /> Edit Late Fee
              </h3>
              <button onClick={() => setShowEditFeeModal(false)} className="text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white cursor-pointer"><X size={20} /></button>
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
                <span className="font-bold text-rose-500">${editFeeInvoice.late_fee_applied || '0.00'}</span>
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
                <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">Enter 0 to remove the late fee entirely (reverts to UNPAID).</p>
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowEditFeeModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" disabled={editFeeLoading} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-500 transition-all shadow-md shadow-indigo-500/25 disabled:opacity-60">
                  {editFeeLoading ? 'Saving...' : 'Save Fee'}
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
