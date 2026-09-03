import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Wallet, 
  TrendingUp, 
  UserCheck, 
  Receipt, 
  Wrench, 
  CreditCard, 
  Ticket, 
  Download, 
  Bell, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Sparkles, 
  Check, 
  Clock, 
  Smartphone,
  Shield
} from 'lucide-react';
import Navbar from '../../../components/marketing/Navbar';
import Footer from '../../../components/marketing/Footer';
import InteractiveAssistant from '../../../components/marketing/InteractiveAssistant';
import { useTheme } from '../../../context/ThemeContext';

export default function RentalSolutionPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const landlordFeatures = [
    {
      title: "Digital Lease Creation",
      desc: "Generate state-compliant leases in minutes. eSignatures included for you and your tenants.",
      icon: FileText,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/50 dark:border-emerald-500/20"
    },
    {
      title: "Rent Collection",
      desc: "Automated ACH and credit card payments. Say goodbye to chasing checks on the 1st of the month.",
      icon: Wallet,
      color: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 border-teal-200/50 dark:border-teal-500/20"
    },
    {
      title: "Rent Increment",
      desc: "Schedule automated rent increases tied to lease renewals or local inflation metrics.",
      icon: TrendingUp,
      color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200/50 dark:border-blue-500/20"
    },
    {
      title: "Tenant Approval",
      desc: "Integrated background and credit checks. Approve reliable tenants with confidence.",
      icon: UserCheck,
      color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200/50 dark:border-indigo-500/20"
    },
    {
      title: "Tax Reports",
      desc: "Generate Schedule E reports instantly. Categorized expenses ready for your CPA.",
      icon: Receipt,
      color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200/50 dark:border-purple-500/20"
    },
    {
      title: "Maintenance",
      desc: "Track tenant requests, assign contractors, and manage repair costs from one central inbox.",
      icon: Wrench,
      color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200/50 dark:border-amber-500/20"
    }
  ];

  const tenantFeatures = [
    {
      title: "Pay Rent",
      desc: "Autopay & Instant Receipts",
      icon: CreditCard,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800"
    },
    {
      title: "Raise Tickets",
      desc: "Maintenance in Clicks",
      icon: Ticket,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800"
    },
    {
      title: "Download Lease",
      desc: "Always Accessible PDF",
      icon: Download,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800"
    },
    {
      title: "Landlord Notices",
      desc: "Direct Digital In-App Alerts",
      icon: Bell,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800"
    }
  ];

  const comparisonRows = [
    {
      bad: "WhatsApp rent reminders & manual follow-ups",
      good: "Auto-reminders sent for you via SMS & Email"
    },
    {
      bad: "Manual paper/PDF receipts that get lost",
      good: "Digital receipts instantly generated with audit logs"
    },
    {
      bad: "Spreadsheet tax tracking at year end",
      good: "One-click Schedule E export ready for your accountant"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-[#061412] transition-colors duration-300 font-sans text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      <main className="flex-1 overflow-x-hidden">

        {/* ─── SECTION 1: HERO (Collect Rent. Manage Tenants. Grow Your Portfolio.) ─── */}
        <section className="relative pt-6 sm:pt-10 lg:pt-12 pb-12 sm:pb-16 max-w-7xl mx-auto px-5 sm:px-8">
          <div className="absolute top-0 left-1/4 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-10 right-10 w-80 h-80 bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-4 sm:space-y-5 text-left">
              
              {/* Badge Pill */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider w-fit">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                #1 RENTAL PROPERTY MANAGEMENT
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
                Collect Rent. <br className="hidden sm:inline" />
                Manage Tenants. <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-400">Grow Your Portfolio.</span>
              </h1>

              {/* Description */}
              <p className="text-xs sm:text-sm lg:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                Streamline your property management from a single, dependable dashboard. Handle digital leases, automate rent collection, and generate tax-ready reports instantly.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to="/portal-select?type=rental"
                  className="px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-full shadow-sm transition-all active:scale-95"
                >
                  Start Managing Free
                </Link>
                <Link
                  to="/contact"
                  className="px-7 py-3 bg-white dark:bg-white/[0.05] text-slate-700 dark:text-slate-200 border border-slate-250 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30 hover:bg-slate-50 dark:hover:bg-white/10 font-bold text-xs sm:text-sm rounded-full shadow-sm transition-all active:scale-95"
                >
                  Watch Demo
                </Link>
              </div>

              {/* Feature check bullet list */}
              <div className="space-y-1.5 pt-2 text-xs text-slate-600 dark:text-slate-300">
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Works for 1 unit or 100+</p>
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Digital leases in minutes</p>
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Auto rent reminders built-in</p>
              </div>

            </div>

            {/* Right Card / Landlord Dashboard Preview */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[480px] rounded-3xl bg-white dark:bg-[#0c1f1c]/90 border border-slate-200/80 dark:border-white/10 shadow-2xl p-5 sm:p-6 text-left space-y-4">
                
                {/* Header bar */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs">
                      LA
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Lakeview Apartments</h4>
                      <p className="text-[10px] text-slate-400">LANDLORD DASHBOARD</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    Auto-Collect ON
                  </span>
                </div>

                {/* 3 Metric Pills */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Collected</p>
                    <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">$12,400</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Overdue</p>
                    <p className="text-base font-bold text-rose-500 mt-0.5">$850</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Occupied</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">92%</p>
                  </div>
                </div>

                {/* Recent Activity List */}
                <div className="space-y-2 pt-1">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Rent Received · Apt 2B</p>
                      <p className="text-[10px] text-slate-400">Today, 10:45 AM</p>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">+$1,450</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Lease Signed · Apt 4A</p>
                      <p className="text-[10px] text-slate-400">eSign Completed</p>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">12 Months</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>


        {/* ─── SECTION 2: 4 STATS ROW ─── */}
        <section className="border-y border-slate-200/70 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.02] py-8 sm:py-10">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">&lt; 5 min</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Time to Create a Lease</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400">4 Steps</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Simplified Lease Flow</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">Auto</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Reminders Built-In</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">Real-Time</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Payment Tracking</p>
            </div>
          </div>
        </section>


        {/* ─── SECTION 3: EVERYTHING FROM ONE DASHBOARD (6 CARDS) ─── */}
        <section className="py-14 sm:py-20 max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center space-y-2 mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              LANDLORD SUPERPOWERS
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-slate-900 dark:text-white tracking-tight">
              Everything From One Dashboard
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-6xl mx-auto">
            {landlordFeatures.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#0c1f1c]/70 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left space-y-3"
                >
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>


        {/* ─── SECTION 4: GIVE TENANTS A SEAMLESS EXPERIENCE (4 CARDS) ─── */}
        <section className="py-14 sm:py-18 bg-white/60 dark:bg-white/[0.02] border-y border-slate-200/70 dark:border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 text-center space-y-10 sm:space-y-12">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                TENANT PORTAL TOO
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Give Tenants a Seamless Experience
              </h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {tenantFeatures.map((t, idx) => {
                const Icon = t.icon;
                return (
                  <div
                    key={idx}
                    className="bg-white dark:bg-[#0c1f1c]/70 border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-lg transition-all text-center flex flex-col items-center space-y-3"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${t.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">{t.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1">{t.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>


        {/* ─── SECTION 5: WHY WE BUILT NESTBLOQ & COMPARISON ─── */}
        <section className="py-14 sm:py-18 max-w-4xl mx-auto px-5 sm:px-8 text-center space-y-10">
          
          {/* Quote */}
          <div className="p-8 sm:p-10 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 text-center space-y-4">
            <p className="text-base sm:text-lg italic text-slate-800 dark:text-slate-200 max-w-2xl mx-auto leading-relaxed">
              "We built NestBloq because we watched landlords manage tenants across WhatsApp groups, paper receipts, and broken spreadsheets. There had to be a better way."
            </p>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              — THE NESTBLOQ PRODUCT TEAM
            </p>
          </div>

          {/* Comparison Table */}
          <div className="space-y-4 pt-4 text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white text-center">
              What Makes NestBloq Different
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center pb-4">
              Stop managing your properties like it's 2010. Upgrade to a modern platform designed for landlords.
            </p>

            <div className="space-y-3 max-w-3xl mx-auto">
              {comparisonRows.map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-white dark:bg-[#0c1f1c]/70 border border-slate-200/80 dark:border-white/10"
                >
                  <div className="flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>{row.bad}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{row.good}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>


        {/* ─── SECTION 6: BOTTOM CTA BANNER (Emerald Gradient Card) ─── */}
        <section className="py-10 pb-16 max-w-6xl mx-auto px-5 sm:px-8">
          <div className="relative rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 p-8 sm:p-12 text-center text-white shadow-2xl overflow-hidden space-y-5">
            <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
            
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight max-w-2xl mx-auto">
              Stop Chasing Rent. Start Managing Smarter.
            </h2>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/portal-select?type=rental"
                className="px-8 py-3 bg-white text-emerald-950 font-bold text-xs sm:text-sm rounded-full shadow-lg hover:bg-slate-100 transition-all active:scale-95"
              >
                Start Free Trial
              </Link>
              <Link
                to="/contact"
                className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm rounded-full transition-all active:scale-95"
              >
                Book a Demo
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Bottom Footer & Interactive Assistant */}
      <Footer />
      <InteractiveAssistant />
    </div>
  );
}
