import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, FileText } from 'lucide-react';
import Logo from '../marketing/Logo';

export default function AuthLayout({ children }) {
  React.useEffect(() => {
    const path = window.location.pathname.replace(/\/$/, '');
    const isLoginPage = path === '/login' || 
                        path === '/rental/login' || 
                        path === '/condo/login';

    if (isLoginPage) {
      // Push state to capture browser back button click
      window.history.pushState(null, null, window.location.pathname);

      const handlePopState = () => {
        window.location.href = '/';
      };

      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, []);

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden flex flex-col md:flex-row font-sans">
      {/* Left Form Container */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-4 sm:p-6 md:p-8 bg-white dark:bg-[#0B1424] relative md:h-full overflow-y-auto">
        <div className="w-full max-w-md">{children}</div>
      </div>

      {/* Right Hero / Branding Container */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#07172E] via-[#0A2240] to-[#051122] text-white flex-col justify-center items-center p-12 relative overflow-hidden md:h-full select-none border-l border-white/[0.08]">
        
        {/* Subtle glowing ambient lights */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-sm text-center relative z-10 mx-auto flex flex-col items-center">
          
          <div className="flex justify-center items-center w-full mb-6">
            <Link to="/" title="Back to website" className="inline-flex justify-center items-center">
              <Logo variant="auth" className="h-20 sm:h-22 w-auto cursor-pointer hover:opacity-90 transition-opacity" />
            </Link>
          </div>

          <div className="inline-flex items-center justify-center px-3.5 py-1 rounded-full bg-blue-500/15 border border-blue-400/25 text-blue-300 text-xs font-semibold tracking-wide uppercase mb-3">
            Rental Property Management
          </div>
          
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed w-full mx-auto mb-8 font-normal">
            Manage your entire rental portfolio, collect rent automatically, and execute digital leases in one seamless platform.
          </p>

          <div className="grid grid-cols-2 gap-3.5 text-left w-full mx-auto">
            
            {/* Box 1: Automated Rent Collection */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-blue-500/10 via-white/[0.04] to-transparent backdrop-blur-md border border-blue-400/20 hover:border-blue-400/40 hover:-translate-y-0.5 transition-all duration-300 shadow-sm group">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 mb-2.5 group-hover:scale-105 transition-transform">
                <CreditCard className="w-4 h-4" />
              </div>
              <p className="font-bold text-xs sm:text-sm text-white mb-1">Automated Rent</p>
              <span className="text-[11px] text-slate-300 leading-snug block">Instant online payments & live ledger accounting.</span>
            </div>

            {/* Box 2: Smart Digital Leases */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-indigo-500/10 via-white/[0.04] to-transparent backdrop-blur-md border border-indigo-400/20 hover:border-indigo-400/40 hover:-translate-y-0.5 transition-all duration-300 shadow-sm group">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 mb-2.5 group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <p className="font-bold text-xs sm:text-sm text-white mb-1">Smart Leases</p>
              <span className="text-[11px] text-slate-300 leading-snug block">Digital e-signatures & automated approvals.</span>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}