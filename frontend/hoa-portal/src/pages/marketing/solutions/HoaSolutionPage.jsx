import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Users, 
  DollarSign, 
  AlertTriangle, 
  Calendar, 
  Wrench, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  Check,
  Building,
  Lock,
  Clock,
  Laptop
} from 'lucide-react';
import Navbar from '../../../components/marketing/Navbar';
import Footer from '../../../components/marketing/Footer';
import InteractiveAssistant from '../../../components/marketing/InteractiveAssistant';
import { useTheme } from '../../../context/ThemeContext';

export default function HoaSolutionPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const rolesFeatures = [
    {
      title: "Board Governance",
      desc: "Streamline board meetings, track voting, and manage community decisions with transparent, secure governance tools.",
      icon: Users,
      color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200/50 dark:border-indigo-500/20"
    },
    {
      title: "Automated Dues",
      desc: "Set up recurring payments, send automated reminders, and maintain complete visibility into your community's financial health.",
      icon: DollarSign,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/50 dark:border-emerald-500/20"
    },
    {
      title: "Violation Tracking",
      desc: "Log CC&R violations with photo evidence, automate notices, and track resolution progress in a centralized dashboard.",
      icon: AlertTriangle,
      color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200/50 dark:border-amber-500/20"
    },
    {
      title: "Amenity Booking",
      desc: "Allow residents to self-serve reservations for pools, clubhouses, and tennis courts with automated calendar management.",
      icon: Calendar,
      color: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 border-teal-200/50 dark:border-teal-500/20"
    },
    {
      title: "Service Requests",
      desc: "Intake maintenance tickets from residents, assign vendors, and track repair status through completion.",
      icon: Wrench,
      color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200/50 dark:border-blue-500/20"
    },
    {
      title: "Document Hub",
      desc: "Store and share bylaws, meeting minutes, and financial reports securely with role-based access controls.",
      icon: FileText,
      color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200/50 dark:border-purple-500/20"
    }
  ];

  const setupSteps = [
    {
      step: "1",
      title: "Register Your HOA",
      desc: "Enter basic community details and verify your board status securely."
    },
    {
      step: "2",
      title: "Invite Members",
      desc: "Import resident rosters via CSV or invite via email link."
    },
    {
      step: "3",
      title: "Configure Rules",
      desc: "Set up dues schedules, amenity hours, and violation categories."
    },
    {
      step: "4",
      title: "Go Live",
      desc: "Start collecting payments and managing requests immediately."
    }
  ];

  const comparisonPoints = [
    {
      pain: "Manual dues tracking eats hours every week.",
      benefit: "NestBloq automates reminders, reconciliation, and payment logs."
    },
    {
      pain: "Bylaws & documents scattered across email and paper folders.",
      benefit: "Every bylaw, receipt, and notice lives in one cloud-encrypted hub."
    },
    {
      pain: "Violation tracking is slow and hard to trace resolution history.",
      benefit: "Real-time violation tracking with photo evidence and audit logs."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-[#0f0720] transition-colors duration-300 font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      <main className="flex-1 overflow-x-hidden">

        {/* ─── SECTION 1: HERO (Run Your HOA Without the Headaches) ─── */}
        <section className="relative pt-6 sm:pt-10 lg:pt-12 pb-12 sm:pb-16 max-w-7xl mx-auto px-5 sm:px-8">
          <div className="absolute top-0 left-1/4 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-10 right-10 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-4 sm:space-y-5 text-left">
              
              {/* Badge Pill */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] sm:text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider w-fit">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                HOMEOWNER ASSOCIATION MANAGEMENT
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
                Run Your HOA Without the <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 dark:from-violet-400 dark:via-indigo-300 dark:to-purple-400">Headaches</span>
              </h1>

              {/* Description */}
              <p className="text-xs sm:text-sm lg:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                Streamline dues, automate violation tracking, and engage your community in one secure platform. Designed specifically for modern HOA boards and property managers.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to="/portal-select?type=hoa"
                  className="px-7 py-3 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm rounded-full shadow-sm transition-all active:scale-95"
                >
                  Start Free Trial
                </Link>
                <Link
                  to="/contact"
                  className="px-7 py-3 bg-white dark:bg-white/[0.05] text-slate-700 dark:text-slate-200 border border-slate-250 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30 hover:bg-slate-50 dark:hover:bg-white/10 font-bold text-xs sm:text-sm rounded-full shadow-sm transition-all active:scale-95"
                >
                  See How It Works
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-4 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 pt-2 font-medium">
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> No credit card required</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Cancel anytime</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Setup in 30 minutes</span>
              </div>

            </div>

            {/* Right Card / Interactive HOA Dashboard Preview */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[480px] rounded-3xl bg-white dark:bg-[#180d2e]/90 border border-slate-200/80 dark:border-white/10 shadow-2xl p-5 sm:p-6 text-left space-y-4">
                
                {/* Header bar of card */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black text-xs">
                      OE
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Oakwood Estates</h4>
                      <p className="text-[10px] text-slate-400">HOA DASHBOARD</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    Live Active
                  </span>
                </div>

                {/* 3 Metric Pills */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Homes</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">142</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Dues Collected</p>
                    <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">94%</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Open Violations</p>
                    <p className="text-base font-bold text-amber-500 mt-0.5">7</p>
                  </div>
                </div>

                {/* Mini List Preview */}
                <div className="space-y-2 pt-1">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-violet-500" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Quarterly Board Meeting</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Oct 24 · 7:00 PM</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Architectural Review: 12 Elm St</span>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-500">Under Review</span>
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
              <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">100%</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Digital Record Keeping</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-violet-600 dark:text-violet-400">&lt; 30 min</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Average Setup Time</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">24/7</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Resident Portal Access</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">Bank-Grade</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Payment Encryption</p>
            </div>
          </div>
        </section>


        {/* ─── SECTION 3: BUILT FOR EVERY ROLE IN YOUR HOA (6 CARDS) ─── */}
        <section className="py-14 sm:py-20 max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center space-y-2 mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] sm:text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              EVERYTHING YOU NEED
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-slate-900 dark:text-white tracking-tight">
              Built for Every Role in Your HOA
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal">
              From board members overseeing financials to residents booking the clubhouse, NestBloq provides dedicated tools to make community living effortless.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-6xl mx-auto">
            {rolesFeatures.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#180d2e]/70 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left space-y-3"
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


        {/* ─── SECTION 4: UP AND RUNNING IN 4 STEPS ─── */}
        <section className="py-14 sm:py-18 bg-white/60 dark:bg-white/[0.02] border-y border-slate-200/70 dark:border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 text-center space-y-10 sm:space-y-12">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] sm:text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                SIMPLE ONBOARDING
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Up and Running in 4 Steps
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                Ditch the legacy software. Our guided setup gets your community online faster than a board meeting.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
              {setupSteps.map((s, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#180d2e]/70 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all text-left space-y-2 relative"
                >
                  <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 font-black text-xs flex items-center justify-center">
                    {s.step}
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white pt-1">
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ─── SECTION 5: WHY PROPERTY MANAGERS CHOOSE NESTBLOQ ─── */}
        <section className="py-14 sm:py-18 max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center space-y-2 mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Why Property Managers Choose NestBloq
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {comparisonPoints.map((item, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#180d2e]/70 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all text-left space-y-4"
              >
                <div className="text-xs text-slate-500 dark:text-slate-400 line-through opacity-75">
                  "{item.pain}"
                </div>
                <div className="flex items-start gap-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{item.benefit}</span>
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* ─── SECTION 6: BOTTOM CTA BANNER (Purple Gradient Card) ─── */}
        <section className="py-10 pb-16 max-w-6xl mx-auto px-5 sm:px-8">
          <div className="relative rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-8 sm:p-12 text-center text-white shadow-2xl overflow-hidden space-y-5">
            <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
            
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-violet-300">
              START TODAY — IT'S FREE
            </p>
            
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight max-w-2xl mx-auto">
              Your Community Deserves Better Management
            </h2>

            <p className="text-xs sm:text-sm text-violet-200 max-w-lg mx-auto leading-relaxed">
              Join thousands of HOAs who have modernized their operations, improved resident satisfaction, and eliminated administrative headaches.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/portal-select?type=hoa"
                className="px-8 py-3 bg-white text-indigo-900 font-bold text-xs sm:text-sm rounded-full shadow-lg hover:bg-slate-100 transition-all active:scale-95"
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

            <p className="text-[10px] text-violet-300/80 pt-1">
              No credit card required · Setup in 30 min · Cancel anytime
            </p>
          </div>
        </section>

      </main>

      {/* Bottom Footer & Interactive Assistant */}
      <Footer />
      <InteractiveAssistant />
    </div>
  );
}
