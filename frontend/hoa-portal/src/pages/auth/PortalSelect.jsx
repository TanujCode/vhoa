import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { 
  Building2, 
  KeyRound, 
  ShieldAlert, 
  ArrowRight, 
  ArrowLeft, 
  Sun, 
  Moon, 
  CheckCircle2, 
  Lock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import Logo from '../../components/marketing/Logo';

export default function PortalSelect() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07060f] text-slate-800 dark:text-slate-100 flex flex-col relative overflow-hidden font-sans noise transition-colors duration-300">
      
      {/* Dynamic Glowing Spotlights for high-fidelity SaaS look */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[60%] h-[50%] rounded-full bg-violet-600/10 dark:bg-violet-900/15 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[10%] w-[50%] h-[50%] rounded-full bg-teal-600/5 dark:bg-teal-900/10 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute inset-0 grid-bg opacity-35 dark:opacity-20" />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-200/40 dark:border-white/[0.04]">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center group shrink-0">
          <Logo className="h-8" />
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <Link 
            to="/" 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100/60 dark:bg-white/5 border border-slate-200/50 dark:border-white/[0.06] hover:bg-slate-200/50 dark:hover:bg-white/10 transition-all duration-300 shadow-sm"
          >
            <ArrowLeft size={14} />
            <span>Back to website</span>
          </Link>

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100/60 dark:bg-white/5 border border-slate-200/50 dark:border-white/[0.06] hover:bg-slate-200/50 dark:hover:bg-white/10 transition-all duration-300 shadow-sm"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto px-6 py-12 md:py-20 w-full animate-float-up">
        
        {/* Title Block */}
        <div className="text-center max-w-2xl mb-12 md:mb-16">
          <span className="px-3.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-gradient-to-r from-violet-500/10 to-indigo-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 mb-4 inline-flex items-center gap-1.5 shadow-sm">
            <Sparkles size={11} />
            Unified Workspace Hub
          </span>
          <h1 className="text-3xl md:text-5xl font-black font-display tracking-tight text-slate-900 dark:text-white mb-4">
            Select Your <span className="gradient-text">Portal Gateway</span>
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
            Welcome back. Please choose the appropriate workspace environment below to coordinate your communities, rental properties, or system logs.
          </p>
        </div>

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          
          {/* Card 1: HOA Community Portal */}
          <div 
            onClick={() => navigate('/login')}
            className="rounded-2xl p-8 pb-8 flex flex-col justify-between min-h-[480px] h-auto relative overflow-hidden group cursor-pointer border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111C2A] shadow-md hover:shadow-xl hover:border-violet-500 hover:-translate-y-1 transition-all duration-300"
          >
            {/* Soft Hover Glow inside card */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 dark:bg-violet-500/10 rounded-full blur-3xl group-hover:scale-150 transition-all duration-500" />
            
            <div>
              {/* Simple Flat Icon Badge */}
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                <Building2 size={24} />
              </div>
              
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                HOA Community Portal
                <ExternalLink size={16} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-violet-500" />
              </h2>
              
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Management portal for property owners, residents, and board members to track accounting ledger dues, bookings, audits, and governance.
              </p>

              {/* Feature Bullet Points */}
              <ul className="space-y-2 text-[12px]">
                {[
                  'Assessments, Fees & Dues Invoicing',
                  'Board Governance & Roster Directories',
                  'Amenity Scheduling & Facility Bookings',
                  'Violation Appeals & Maintenance Tickets'
                ].map((feat, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-xs text-slate-655 dark:text-slate-355 font-medium">
                    <CheckCircle2 size={14} className="text-violet-600 shrink-0 font-bold" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button 
              className="w-full mt-8 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-violet-500/20 active:scale-[0.98] transition-all"
            >
              Sign In to HOA Portal
              <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-300" />
            </button>
          </div>

          {/* Card 2: Rental Property Portal */}
          <div 
            onClick={() => navigate('/rental/login')}
            className="rounded-2xl p-8 pb-8 flex flex-col justify-between min-h-[480px] h-auto relative overflow-hidden group cursor-pointer border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111C2A] shadow-md hover:shadow-xl hover:border-teal-500 hover:-translate-y-1 transition-all duration-300"
          >
            {/* Soft Hover Glow inside card */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-650/5 dark:bg-teal-500/10 rounded-full blur-3xl group-hover:scale-150 transition-all duration-500" />
            
            <div>
              {/* Simple Flat Icon Badge */}
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-teal-50 dark:bg-teal-950/30 text-teal-650 dark:text-teal-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                <KeyRound size={22} />
              </div>
              
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                Rental Property Portal
                <ExternalLink size={16} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-teal-500" />
              </h2>
              
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Self-service ecosystem for tenants, landlords, and property agents to manage leasing terms, dues, and maintenance jobs.
              </p>

              {/* Feature Bullet Points */}
              <ul className="space-y-2 text-[12px]">
                {[
                  'Automated Rent Collection & ACH Dues',
                  'Digital Lease Coordination & Signing',
                  'Real-Time Maintenance Logs & Updates',
                  'Direct Landlord-Tenant Chat Channels'
                ].map((feat, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-xs text-slate-655 dark:text-slate-355 font-medium">
                    <CheckCircle2 size={14} className="text-teal-600 shrink-0 font-bold" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button 
              className="w-full mt-8 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-teal-500/20 active:scale-[0.98] transition-all"
            >
              Sign In to Rental Portal
              <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-300" />
            </button>
          </div>

          {/* Card 3: Condo Management Portal */}
          <div 
            onClick={() => navigate('/login')}
            className="rounded-2xl p-8 pb-8 flex flex-col justify-between min-h-[480px] h-auto relative overflow-hidden group cursor-pointer border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111C2A] shadow-md hover:shadow-xl hover:border-amber-500 hover:-translate-y-1 transition-all duration-300"
          >
            {/* Soft Hover Glow inside card */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-650/5 dark:bg-amber-500/10 rounded-full blur-3xl group-hover:scale-150 transition-all duration-500" />

            <div>
              {/* Simple Flat Icon Badge */}
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-950/30 text-amber-650 dark:text-amber-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                <Building2 size={24} />
              </div>
              
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                Condo Management Portal
                <ExternalLink size={16} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-amber-500" />
              </h2>
              
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Integrated solution for high-rise condominiums, co-op apartments, and housing complexes to coordinate dues, guest passes, and bookings.
              </p>

              {/* Feature Bullet Points */}
              <ul className="space-y-2 text-[12px]">
                {[
                  'Facility Booking & Amenity Scheduler',
                  'Smart Guest Access & Visitor OTPs',
                  'Resident Directory & Roster Lists',
                  'HOA Guidelines & Violation Appeals'
                ].map((feat, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-xs text-slate-655 dark:text-slate-355 font-medium">
                    <CheckCircle2 size={14} className="text-amber-600 shrink-0 font-bold" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button 
              className="w-full mt-8 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-amber-500/20 active:scale-[0.98] transition-all"
            >
              Sign In to Condo Portal
              <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-300" />
            </button>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 border-t border-slate-200/50 dark:border-white/[0.04] mt-auto">
        <p className="text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-widest font-semibold">
          © {new Date().getFullYear()} VHOA Management. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
