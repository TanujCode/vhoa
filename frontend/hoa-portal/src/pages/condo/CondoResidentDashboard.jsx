import React from 'react';
import { 
  Home, Building2, Key, Package, CreditCard, Wrench, FileText, ArrowRight
} from 'lucide-react';

export default function CondoResidentDashboard({ user, setActivePage }) {
  const commName = user?.community_name || 'My Condo Building';
  const unitNo = user?.unit_no || 'N/A';

  return (
    <div className="p-0 space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-white font-sans">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/90 to-sky-50/80 dark:from-[#162535] dark:via-[#1A2E44] dark:to-[#162535] text-slate-900 dark:text-white p-5 border border-indigo-100 dark:border-white/10 shadow-sm">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-400/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-100 dark:bg-indigo-500/20 border border-blue-200 dark:border-indigo-400/30 text-blue-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-2 shadow-xs">
            👋 Welcome Back, {user?.name || 'Resident'}!
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-1">
            Resident Hub - Unit {unitNo}
          </h1>
          <p className="text-slate-600 dark:text-slate-300/90 text-xs sm:text-sm max-w-2xl leading-normal">
            Welcome to the digital portal of <span className="font-bold text-slate-900 dark:text-white">{commName}</span>. Manage guest logs, pay HOA dues, and request maintenance directly.
          </p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: My Unit */}
        <div className="bg-white dark:bg-[#162535] p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
            <Home size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">My Suite / Unit</p>
            <h4 className="text-lg font-bold">Apt {unitNo}</h4>
          </div>
        </div>

        {/* Card 2: Visitor Passes */}
        <div className="bg-white dark:bg-[#162535] p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <Key size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Guest Passes</p>
            <h4 className="text-lg font-bold">0 Active</h4>
          </div>
        </div>

        {/* Card 3: Pending Parcels */}
        <div className="bg-white dark:bg-[#162535] p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-550 rounded-xl">
            <Package size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivered Packages</p>
            <h4 className="text-lg font-bold">0 Pending</h4>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Resident Operations Shortcuts
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Action 1: Maintenance */}
          <div 
            onClick={() => setActivePage('maintenance')}
            className="p-5 bg-white dark:bg-[#162535] rounded-3xl border border-slate-200/80 dark:border-white/10 hover:border-blue-500/50 cursor-pointer group transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-455">
                <Wrench size={22} />
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
              Maintenance Desk
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              File a request for repairs in your unit or common areas.
            </p>
          </div>

          {/* Action 2: Visitors */}
          <div 
            onClick={() => setActivePage('visitors')}
            className="p-5 bg-white dark:bg-[#162535] rounded-3xl border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/50 cursor-pointer group transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-455">
                <Key size={22} />
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
              Guest Visitor Passes
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Pre-verify and generate access codes for family or delivery staff.
            </p>
          </div>

          {/* Action 3: Payments */}
          <div 
            onClick={() => setActivePage('payments')}
            className="p-5 bg-white dark:bg-[#162535] rounded-3xl border border-slate-200/80 dark:border-white/10 hover:border-purple-500/50 cursor-pointer group transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-455">
                <CreditCard size={22} />
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
              Payments & Ledger
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Pay monthly maintenance fees, building dues, or check logs.
            </p>
          </div>

          {/* Action 4: Documents */}
          <div 
            onClick={() => setActivePage('documents')}
            className="p-5 bg-white dark:bg-[#162535] rounded-3xl border border-slate-200/80 dark:border-white/10 hover:border-amber-500/50 cursor-pointer group transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-550 dark:bg-amber-500/20 dark:text-amber-455">
                <FileText size={22} />
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
              Building Files
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Browse building guidelines, rules, bylaws, and community newsletters.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
