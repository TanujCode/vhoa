import React, { useState, useEffect } from 'react';
import { Home, FileText, CreditCard, Wrench, ShieldAlert, Sparkles, Building2 } from 'lucide-react';
import API from '../../services/api';
import ScreeningHub from './ScreeningHub';

export default function TenantDashboard({ user, setActivePage }) {
  const [leases, setLeases] = useState([]);
  const [activeLease, setActiveLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    fetchTenantLeaseData();
  }, []);

  async function fetchTenantLeaseData() {
    try {
      setLoading(true);
      // Fetch leases for current tenant
      const leaseRes = await API.get('/rental/leases');
      setLeases(leaseRes.data);
      
      const active = leaseRes.data.find(l => l.status === 'ACTIVE') || leaseRes.data[0];
      if (active) {
        setActiveLease(active);
        // Fetch ledger invoices for active lease
        const ledgerRes = await API.get(`/rental/leases/${active.lease_id}/ledgers`);
        setInvoices(ledgerRes.data.slice(0, 3)); // show top 3 recent invoices
      }
    } catch (err) {
      console.error("Error fetching tenant lease data:", err);
    } finally {
      setLoading(false);
    }
  }

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

  // Scenario 2: Tenant has an active/pending lease
  const totalUnpaid = invoices.filter(i => i.status !== 'PAID').reduce((sum, i) => sum + i.amount + (i.late_fee_applied || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div>
        <h1 className="text-3xl font-black text-gray-950 dark:text-white">Tenant Portal</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your rental payments, lease signing, and maintenance tickets.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.05] shadow-sm">
          <div className="flex justify-between items-center text-slate-450 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Lease Unit</span>
            <Home className="w-5 h-5 text-blue-500" />
          </div>
          <div className="mt-3 text-2xl font-black dark:text-white">Unit {activeLease?.unit?.unit_number || 'N/A'}</div>
          <div className="text-xs text-gray-450 mt-1">{activeLease?.property?.name || 'Private Landlord'}</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.05] shadow-sm">
          <div className="flex justify-between items-center text-slate-450 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Monthly Rent</span>
            <CreditCard className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-3 text-2xl font-black dark:text-white">${activeLease?.monthly_rent}</div>
          <div className="text-xs text-gray-450 mt-1">Due on 1st of month</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.05] shadow-sm">
          <div className="flex justify-between items-center text-slate-450 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Lease Status</span>
            <FileText className="w-5 h-5 text-violet-500" />
          </div>
          <div className="mt-3">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
              activeLease?.status === 'ACTIVE' 
                ? 'bg-emerald-500/10 text-emerald-500' 
                : 'bg-yellow-500/10 text-yellow-500'
            }`}>
              {activeLease?.status}
            </span>
          </div>
          <div className="text-xs text-gray-450 mt-2 font-mono">ID: #{activeLease?.lease_id}</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.05] shadow-sm">
          <div className="flex justify-between items-center text-slate-450 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Balance Due</span>
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
          <div className="mt-3 text-2xl font-black text-red-550 dark:text-red-400">${totalUnpaid}</div>
          <div className="text-xs text-gray-450 mt-1">Include any applied late fees</div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Recent Invoices */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.05] space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Rent Invoices</h3>
          {invoices.length === 0 ? (
            <p className="text-sm text-gray-450 py-6 text-center">No invoices generated for this lease yet.</p>
          ) : (
            <div className="space-y-3">
              {invoices.map(inv => (
                <div key={inv.invoice_id} className="p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01] flex justify-between items-center text-sm">
                  <div>
                    <span className="font-bold text-gray-950 dark:text-white font-mono">Invoice #{inv.invoice_id}</span>
                    <p className="text-xs text-gray-450 mt-0.5">Due Date: {inv.due_date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900 dark:text-white">${inv.amount + (inv.late_fee_applied || 0)}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'
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
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border border-slate-200/60 dark:border-white/[0.05] space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Tasks</h3>
            <div className="space-y-2">
              <button 
                onClick={() => setActivePage('leases_hub')}
                className="w-full py-3 px-4 rounded-xl border border-gray-100 dark:border-white/5 hover:border-blue-500/30 bg-slate-50/40 dark:bg-white/[0.01] text-xs font-bold text-gray-800 dark:text-gray-300 hover:text-blue-500 hover:bg-blue-500/5 transition-all text-left flex items-center gap-2.5"
              >
                <FileText className="w-4 h-4 text-blue-500" /> View/Sign Lease Contract
              </button>
              
              <button 
                onClick={() => setActivePage('rent_ledger')}
                className="w-full py-3 px-4 rounded-xl border border-gray-100 dark:border-white/5 hover:border-emerald-500/30 bg-slate-50/40 dark:bg-white/[0.01] text-xs font-bold text-gray-800 dark:text-gray-300 hover:text-emerald-500 hover:bg-emerald-500/5 transition-all text-left flex items-center gap-2.5"
              >
                <CreditCard className="w-4 h-4 text-emerald-500" /> Pay Outstanding Dues
              </button>

              <button 
                onClick={() => setActivePage('servicereq')}
                className="w-full py-3 px-4 rounded-xl border border-gray-100 dark:border-white/5 hover:border-violet-500/30 bg-slate-50/40 dark:bg-white/[0.01] text-xs font-bold text-gray-800 dark:text-gray-300 hover:text-violet-500 hover:bg-violet-500/5 transition-all text-left flex items-center gap-2.5"
              >
                <Wrench className="w-4 h-4 text-violet-500" /> Submit Maintenance Ticket
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
