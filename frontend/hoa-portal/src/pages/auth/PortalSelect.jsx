import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  KeyRound, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import Logo from '../../components/marketing/Logo';

export default function PortalSelect() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen lg:h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 flex flex-col justify-between relative overflow-y-auto lg:overflow-hidden font-sans noise transition-colors duration-300">
      
      {/* Dynamic Glowing Spotlights for high-fidelity SaaS look */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[25%] w-[50%] h-[50%] rounded-full bg-teal-600/10 dark:bg-teal-900/15 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[20%] w-[50%] h-[50%] rounded-full bg-emerald-600/5 dark:bg-emerald-900/10 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
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
        <div className="text-center max-w-2xl mb-5 sm:mb-6">
          <span className="px-3 py-0.5 rounded-full text-[9.5px] font-bold tracking-wider uppercase bg-gradient-to-r from-teal-500/10 to-emerald-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 mb-2 inline-flex items-center gap-1 shadow-sm">
            <Sparkles size={10} />
            Unified Workspace Hub
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-black font-display tracking-tight text-slate-900 dark:text-white mb-1.5">
            Select Your <span className="gradient-text">Portal Gateway</span>
          </h1>
          <p className="text-xs sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg mx-auto">
            Choose your dedicated workspace environment below to coordinate rental properties and leasing.
          </p>
        </div>

        {/* Centered Single Card Layout */}
        <div className="w-full max-w-md mx-auto">
          {/* Card: Rental Property Portal */}
          <div 
            onClick={() => navigate('/rental/login')}
            className="rounded-2xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden group cursor-pointer border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-[#1e293b] shadow-md hover:shadow-2xl hover:border-teal-500 hover:-translate-y-1 transition-all duration-300"
          >
            {/* Soft Hover Glow inside card */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-600/5 dark:bg-teal-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500" />
            
            <div>
              {/* Flat Icon Badge */}
              <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                <KeyRound size={22} />
              </div>
              
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-between">
                <span>Rental Property Portal</span>
                <ExternalLink size={15} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-teal-500" />
              </h2>
              
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                Self-service ecosystem for tenants, landlords, and property agents to manage leasing terms, dues, and maintenance jobs.
              </p>

              {/* Feature Bullet Points */}
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 mb-6 font-medium">
                {[
                  'Automated Rent Collection & ACH Dues',
                  'Digital Lease Coordination & Signing',
                  'Real-Time Maintenance Logs & Updates',
                  'Direct Landlord-Tenant Chat Channels'
                ].map((feat, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <CheckCircle2 size={14} className="text-teal-600 shrink-0 font-bold" />
                    <span className="truncate">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button 
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm hover:shadow-teal-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              Sign In to Rental Portal
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-3 border-t border-slate-200/50 dark:border-white/[0.04] shrink-0">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold">
          © {new Date().getFullYear()} VHOA Management. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
