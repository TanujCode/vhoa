import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Split, 
  Vote, 
  Coins, 
  MessageSquare, 
  Wrench, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Check, 
  Building2, 
  ShieldCheck, 
  Lock, 
  Layers
} from 'lucide-react';
import Navbar from '../../../components/marketing/Navbar';
import Footer from '../../../components/marketing/Footer';
import InteractiveAssistant from '../../../components/marketing/InteractiveAssistant';
import { useTheme } from '../../../context/ThemeContext';

export default function CondoSolutionPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const committeeFeatures = [
    {
      title: "Shared Amenity Scheduler",
      desc: "Prevent double-bookings for pools, gyms, and BBQ pits with real-time slot locking and waitlists.",
      icon: Calendar,
      color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200/50 dark:border-blue-500/20"
    },
    {
      title: "Utility Bill Splitting",
      desc: "Automatically divide shared water or electricity bills by unit size or occupancy, and dispatch invoices instantly.",
      icon: Split,
      color: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 border-teal-200/50 dark:border-teal-500/20"
    },
    {
      title: "Committee Voting",
      desc: "Conduct secure, auditable digital votes for AGM resolutions or emergency repairs without gathering in person.",
      icon: Vote,
      color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200/50 dark:border-indigo-500/20"
    },
    {
      title: "Sinking Fund Management",
      desc: "Track major structural repair funds separately from daily operational accounts with clear visual dashboards.",
      icon: Coins,
      color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200/50 dark:border-amber-500/20"
    },
    {
      title: "Resident Communication",
      desc: "Broadcast urgent notices, elevator maintenance schedules, and community guidelines directly to resident apps.",
      icon: MessageSquare,
      color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200/50 dark:border-rose-500/20"
    },
    {
      title: "Common Area Maintenance",
      desc: "Log issues in hallways or lobbies, assign vendors, and track repair status from submission to completion.",
      icon: Wrench,
      color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200/50 dark:border-purple-500/20"
    }
  ];

  const condoProblems = [
    {
      problem: "Amenities get double-booked almost every weekend.",
      solution: "Server-side slot locking makes it physically impossible for two residents to book the same slot."
    },
    {
      problem: "Splitting utility bills across dozens of units by hand takes days.",
      solution: "Bills are split automatically — per-unit or proportional — and sent out in a couple of clicks."
    },
    {
      problem: "AGM votes get low turnout and no clear record of who voted.",
      solution: "Digital voting with timestamp and audit trail — every resident can participate from their phone."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-[#070e1c] transition-colors duration-300 font-sans text-slate-900 dark:text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      <main className="flex-1 overflow-x-hidden">

        {/* ─── SECTION 1: HERO (Shared Spaces. Zero Conflicts.) ─── */}
        <section className="relative pt-6 sm:pt-10 lg:pt-12 pb-12 sm:pb-16 max-w-7xl mx-auto px-5 sm:px-8">
          <div className="absolute top-0 left-1/4 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-10 right-10 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-4 sm:space-y-5 text-left">
              
              {/* Badge Pill */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider w-fit">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                CONDO ASSOCIATION MANAGEMENT
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
                Shared Spaces. <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 dark:from-blue-400 dark:via-indigo-300 dark:to-blue-400">Zero Conflicts.</span>
              </h1>

              {/* Description */}
              <p className="text-xs sm:text-sm lg:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                The modern operating system for condo committees. Eliminate double-bookings, automate utility splitting, and bring complete transparency to your sinking fund.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to="/portal-select?type=condo"
                  className="px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-full shadow-sm transition-all active:scale-95"
                >
                  Get Started Free
                </Link>
                <Link
                  to="/contact"
                  className="px-7 py-3 bg-white dark:bg-white/[0.05] text-slate-700 dark:text-slate-200 border border-slate-250 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30 hover:bg-slate-50 dark:hover:bg-white/10 font-bold text-xs sm:text-sm rounded-full shadow-sm transition-all active:scale-95"
                >
                  See Features
                </Link>
              </div>

              {/* Feature check bullet list */}
              <div className="space-y-1.5 pt-2 text-xs text-slate-600 dark:text-slate-300">
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" /> Smart amenity scheduling</p>
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" /> Automated utility bill splitting</p>
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" /> Digital committee voting tools</p>
              </div>

            </div>

            {/* Right Card / Condo Committee Dashboard Preview */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[480px] rounded-3xl bg-white dark:bg-[#0d182b]/90 border border-slate-200/80 dark:border-white/10 shadow-2xl p-5 sm:p-6 text-left space-y-4">
                
                {/* Header bar */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs">
                      BT
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Bayview Towers Condo</h4>
                      <p className="text-[10px] text-slate-400">COMMITTEE DASHBOARD</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    AGM In 12 Days
                  </span>
                </div>

                {/* 3 Metric Pills */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Units</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">142</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Sinking Fund</p>
                    <p className="text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5">$45k</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Bookings</p>
                    <p className="text-base font-bold text-emerald-600 mt-0.5">18</p>
                  </div>
                </div>

                {/* Recent Activity List */}
                <div className="space-y-2 pt-1">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Pool Deck Booking · Unit 804</p>
                      <p className="text-[10px] text-slate-400">Saturday, 4:00 PM – 7:00 PM</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">Confirmed</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">AGM Resolution 3: Elevator Overhaul</p>
                      <p className="text-[10px] text-slate-400">Electronic Ballot Open</p>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">61 Voted (84%)</span>
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
              <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">100% Digital</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Committee Voting & Resolutions</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400">Zero</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Double-Bookings for Lounges</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">Same-Day</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Utility Bill Splitting</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">Bank-Grade</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Payment Security</p>
            </div>
          </div>
        </section>


        {/* ─── SECTION 3: EVERY FEATURE YOUR COMMITTEE NEEDS (6 CARDS) ─── */}
        <section className="py-14 sm:py-20 max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center space-y-2 mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              BUILT FOR CONDOS
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-slate-900 dark:text-white tracking-tight">
              Every Feature Your Committee Needs
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-6xl mx-auto">
            {committeeFeatures.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#0d182b]/70 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left space-y-3"
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


        {/* ─── SECTION 4: THE PROBLEMS EVERY CONDO COMMITTEE FACES ─── */}
        <section className="py-14 sm:py-18 bg-white/60 dark:bg-white/[0.02] border-y border-slate-200/70 dark:border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 text-center space-y-10 sm:space-y-12">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                REAL PROBLEMS · REAL FIXES
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                The Problems Every Condo Committee Faces
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                No invented reviews. Just the friction points NestBloq was built to remove.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {condoProblems.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#0d182b]/70 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-rose-500">THE PROBLEM</p>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                      "{item.problem}"
                    </h4>
                  </div>

                  <div className="space-y-1.5 pt-4 border-t border-slate-100 dark:border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">HOW NESTBLOQ SOLVES IT</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.solution}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ─── SECTION 5: BOTTOM CTA BANNER (Blue/Indigo Gradient Card) ─── */}
        <section className="py-10 pb-16 max-w-6xl mx-auto px-5 sm:px-8">
          <div className="relative rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 p-8 sm:p-12 text-center text-white shadow-2xl overflow-hidden space-y-5">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-300">
              BUILT FOR CONDO LIVING
            </p>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight max-w-2xl mx-auto">
              Your Residents Deserve a Modern Community Experience.
            </h2>

            <p className="text-xs sm:text-sm text-blue-200 max-w-lg mx-auto leading-relaxed">
              Join over 1,500 condo associations that have replaced spreadsheets and endless email threads with our seamless platform.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/portal-select?type=condo"
                className="px-8 py-3 bg-white text-blue-950 font-bold text-xs sm:text-sm rounded-full shadow-lg hover:bg-slate-100 transition-all active:scale-95"
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
