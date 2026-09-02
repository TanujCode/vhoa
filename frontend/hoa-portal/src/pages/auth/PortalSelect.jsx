import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  KeyRound, 
  ShieldAlert, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import Logo from '../../components/marketing/Logo';

export default function PortalSelect() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen lg:h-screen bg-slate-50 dark:bg-[#07060f] text-slate-800 dark:text-slate-100 flex flex-col justify-between relative overflow-y-auto lg:overflow-hidden font-sans noise transition-colors duration-300">
      
      {/* Dynamic Glowing Spotlights for high-fidelity SaaS look */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[60%] h-[50%] rounded-full bg-violet-600/10 dark:bg-violet-900/15 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[10%] w-[50%] h-[50%] rounded-full bg-teal-600/5 dark:bg-teal-900/10 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute inset-0 grid-bg opacity-35 dark:opacity-20" />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-3 sm:py-3.5 flex items-center justify-between border-b border-slate-200/40 dark:border-white/[0.04] shrink-0">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center group shrink-0">
          <Logo className="h-7 sm:h-8" />
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto px-4 sm:px-6 py-2 sm:py-4 w-full animate-float-up my-auto">
        
        {/* Title Block */}
        <div className="text-center max-w-2xl mb-4 sm:mb-5">
          <span className="px-3 py-0.5 rounded-full text-[9.5px] font-bold tracking-wider uppercase bg-gradient-to-r from-violet-500/10 to-indigo-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 mb-2 inline-flex items-center gap-1 shadow-sm">
            <Sparkles size={10} />
            Unified Workspace Hub
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-black font-display tracking-tight text-slate-900 dark:text-white mb-1.5">
            Select Your <span className="gradient-text">Portal Gateway</span>
          </h1>
          <p className="text-xs sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg mx-auto">
            Choose your dedicated workspace environment below to coordinate communities, rental properties, or condominiums.
          </p>
        </div>

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 w-full max-w-5xl">
          
          {/* Card 1: HOA Community Portal */}
          <div 
            onClick={() => navigate('/login')}
            className="rounded-2xl p-5 sm:p-5.5 flex flex-col justify-between relative overflow-hidden group cursor-pointer border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111C2A] shadow-sm hover:shadow-xl hover:border-violet-500 hover:-translate-y-1 transition-all duration-300"
          >
            {/* Soft Hover Glow inside card */}
            <div className="absolute top-0 right-0 w-28 h-28 bg-violet-600/5 dark:bg-violet-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500" />
            
            <div>
              {/* Flat Icon Badge */}
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 mb-3 group-hover:scale-110 transition-transform duration-300">
                <Building2 size={20} />
              </div>
              
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                HOA Community Portal
                <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-violet-500" />
              </h2>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3.5 leading-relaxed line-clamp-2">
                Management portal for property owners, residents, and board members to track accounting ledger dues, bookings, and governance.
              </p>

              {/* Feature Bullet Points */}
              <ul className="space-y-1.5 text-[11.5px]">
                {[
                  'Assessments, Fees & Dues Invoicing',
                  'Board Governance & Roster Directories',
                  'Amenity Scheduling & Facility Bookings',
                  'Violation Appeals & Maintenance Tickets'
                ].map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-655 dark:text-slate-355 font-medium">
                    <CheckCircle2 size={13} className="text-violet-600 shrink-0 font-bold" />
                    <span className="truncate">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button 
              className="w-full mt-4 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow-violet-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              Sign In to HOA Portal
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>

          {/* Card 2: Rental Property Portal */}
          <div 
            onClick={() => navigate('/rental/login')}
            className="rounded-2xl p-5 sm:p-5.5 flex flex-col justify-between relative overflow-hidden group cursor-pointer border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111C2A] shadow-sm hover:shadow-xl hover:border-teal-500 hover:-translate-y-1 transition-all duration-300"
          >
            {/* Soft Hover Glow inside card */}
            <div className="absolute top-0 right-0 w-28 h-28 bg-teal-650/5 dark:bg-teal-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500" />
            
            <div>
              {/* Flat Icon Badge */}
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-teal-50 dark:bg-teal-950/40 text-teal-650 dark:text-teal-400 mb-3 group-hover:scale-110 transition-transform duration-300">
                <KeyRound size={19} />
              </div>
              
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                Rental Property Portal
                <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-teal-500" />
              </h2>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3.5 leading-relaxed line-clamp-2">
                Self-service ecosystem for tenants, landlords, and property agents to manage leasing terms, dues, and maintenance jobs.
              </p>

              {/* Feature Bullet Points */}
              <ul className="space-y-1.5 text-[11.5px]">
                {[
                  'Automated Rent Collection & ACH Dues',
                  'Digital Lease Coordination & Signing',
                  'Real-Time Maintenance Logs & Updates',
                  'Direct Landlord-Tenant Chat Channels'
                ].map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-655 dark:text-slate-355 font-medium">
                    <CheckCircle2 size={13} className="text-teal-600 shrink-0 font-bold" />
                    <span className="truncate">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button 
              className="w-full mt-4 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow-teal-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              Sign In to Rental Portal
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>

          {/* Card 3: Condo Management Portal */}
          <div 
            onClick={() => navigate('/condo/login')}
            className="rounded-2xl p-5 sm:p-5.5 flex flex-col justify-between relative overflow-hidden group cursor-pointer border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111C2A] shadow-sm hover:shadow-xl hover:border-amber-500 hover:-translate-y-1 transition-all duration-300"
          >
            {/* Soft Hover Glow inside card */}
            <div className="absolute top-0 right-0 w-28 h-28 bg-amber-650/5 dark:bg-amber-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500" />

            <div>
              {/* Flat Icon Badge */}
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-950/40 text-amber-650 dark:text-amber-400 mb-3 group-hover:scale-110 transition-transform duration-300">
                <Building2 size={20} />
              </div>
              
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                Condo Management Portal
                <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-amber-500" />
              </h2>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3.5 leading-relaxed line-clamp-2">
                Integrated solution for high-rise condominiums, co-op apartments, and housing complexes to coordinate dues, guest passes, and bookings.
              </p>

              {/* Feature Bullet Points */}
              <ul className="space-y-1.5 text-[11.5px]">
                {[
                  'Facility Booking & Amenity Scheduler',
                  'Smart Guest Access & Visitor OTPs',
                  'Resident Directory & Roster Lists',
                  'HOA Guidelines & Violation Appeals'
                ].map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-655 dark:text-slate-355 font-medium">
                    <CheckCircle2 size={13} className="text-amber-600 shrink-0 font-bold" />
                    <span className="truncate">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button 
              className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              Sign In to Condo Portal
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-3 border-t border-slate-200/50 dark:border-white/[0.04] shrink-0">
        <p className="text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-widest font-semibold">
          © {new Date().getFullYear()} VHOA Management. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
