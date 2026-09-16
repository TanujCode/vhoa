import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Check, 
  ShieldCheck, 
  ArrowRight, 
  Headset, 
  TrendingUp, 
  Lock, 
  Users, 
  Database, 
  FolderLock, 
  Mail, 
  MessageSquare,
  Building2,
  KeyRound,
  Shield,
  Sparkles,
  CheckCircle2,
  Phone
} from 'lucide-react';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';
import FaqSection from '../../components/marketing/FaqSection';
import { useTheme } from '../../context/ThemeContext';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState('annual'); // 'monthly' or 'annual'
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // 2 Pure Rental Pricing Plans (Basic & Premium)
  const plans = {
    basic: {
      name: "Basic",
      desc: "Everything you need to automate tenant rent collection and lease tracking.",
      monthlyPrice: 49,
      annualPrice: 39,
      limitText: "Up to 15 Properties • Billed annually",
      ctaText: "Get Started",
      ctaLink: "/portal-select",
      features: [
        "Automated online rent collection (ACH/Stripe)",
        "Digital lease vault & document storage",
        "Direct tenant-to-landlord communication",
        "Income & expense cashflow tracking",
        "Maintenance repair ticket submissions",
        "Standard email & chat support"
      ]
    },
    premium: {
      name: "Premium",
      badge: "MOST POPULAR",
      desc: "Comprehensive suite for portfolio investors and multi-property managers.",
      monthlyPrice: 139,
      annualPrice: 109,
      limitText: "Up to 60 Properties • Billed annually",
      ctaText: "Start Free Trial",
      ctaLink: "/portal-select",
      featureHeader: "Everything in Basic, plus:",
      features: [
        "Online tenant background & credit screening",
        "Automated late fee rules & renewal alerts",
        "Contractor & vendor work order dispatch",
        "Multi-property cashflow statements",
        "Comprehensive tax & financial reports",
        "Priority 24/7 dedicated support & onboarding"
      ]
    }
  };

  // Feature Comparison Table Data
  const compareFeatures = [
    { 
      name: "Properties Limit", 
      basic: "Up to 15 Properties", 
      premium: "Up to 60 Properties (Scalable)" 
    },
    { name: "Admin & Manager Accounts", basic: "2 Users", premium: "Unlimited" },
    { 
      name: "Digital Lease Vault & Storage", 
      basic: "Standard Vault", 
      premium: "Unlimited Leases & Docs" 
    },
    { name: "Online Rent Collection (Stripe/ACH)", basic: true, premium: true },
    { name: "Automated Late Fees & Reminders", basic: false, premium: true },
    { 
      name: "Tenant Background & Credit Screening", 
      basic: false, 
      premium: true 
    },
    { name: "Maintenance Kanban & Dispatch", basic: "Basic Logging", premium: "Interactive Kanban" },
    { name: "NestBloq AI Rental Assistant", basic: false, premium: true },
    { name: "Dedicated Onboarding & Priority Support", basic: false, premium: true }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaff] dark:bg-[#0f172a] transition-colors duration-200 font-sans text-slate-900 dark:text-slate-100">
      <Navbar />

      <div className="flex-1 overflow-x-hidden">

        {/* --- Top Hero Section --- */}
        <header className="relative w-full pt-6 pb-4 sm:pt-8 sm:pb-6 px-5 sm:px-8 text-center">
          {/* Subtle Ambient Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-violet-600/10 dark:bg-violet-600/15 rounded-full blur-[110px] pointer-events-none -z-10" />

          <div className="max-w-4xl mx-auto space-y-4 animate-fade-in-up">
            
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400">
              <span className="text-[10px] font-bold tracking-widest uppercase">Transparent Rental Pricing</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-black leading-[1.08] tracking-tight text-slate-900 dark:text-white">
              Simple, transparent pricing for your rental portfolio
            </h1>

            {/* Sub-headline */}
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal">
              No hidden fees, no complicated contracts. Just the tools you need to manage your rental properties, leases, and tenants efficiently.
            </p>

            {/* --- Monthly / Annual Billing Toggle Switch --- */}
            <div className="flex items-center justify-center gap-2 pt-3">
              <div className="inline-flex items-center p-0.5 rounded-full bg-slate-100 dark:bg-[#1e293b] border border-slate-200/80 dark:border-white/10 shadow-inner">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                    billingCycle === 'monthly'
                      ? 'bg-white dark:bg-violet-600 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                    billingCycle === 'annual'
                      ? 'bg-white dark:bg-violet-600 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                  }`}
                >
                  <span>Annually</span>
                  <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-extrabold uppercase">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>

          </div>
        </header>

        {/* --- 2 Pricing Cards (Compact Single View Layout) --- */}
        <section className="py-4 pb-12 max-w-4xl mx-auto px-4 sm:px-6 w-full relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            
            {/* --- CARD 1: BASIC / STANDARD --- */}
            <div className="relative flex flex-col justify-between p-6 sm:p-7 rounded-[24px] bg-white dark:bg-[#1e293b] border border-slate-200/90 dark:border-slate-700 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all duration-200 hover:shadow-lg">
              
              <div className="space-y-4 text-left">
                {/* Title & Description */}
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {plans.basic.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {plans.basic.desc}
                  </p>
                </div>

                {/* Price */}
                <div>
                  <div className="flex items-baseline gap-1 text-slate-900 dark:text-white">
                    <span className="text-3xl sm:text-4xl font-black tracking-tight">
                      ${billingCycle === 'annual' ? plans.basic.annualPrice : plans.basic.monthlyPrice}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">/mo</span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
                    {plans.basic.limitText}
                  </p>
                </div>

                {/* CTA Button */}
                <Link
                  to={plans.basic.ctaLink}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#f1f5f9] dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-800 dark:text-white font-bold text-xs text-center block transition-all active:scale-[0.98]"
                >
                  {plans.basic.ctaText}
                </Link>

                {/* Features List */}
                <div className="pt-3 space-y-2.5 border-t border-slate-100 dark:border-white/[0.06]">
                  {plans.basic.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <div className="w-4 h-4 rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className="font-medium text-[11.5px] leading-tight">{feat}</span>
                    </div>
                  ))}
                </div>

              </div>

            </div>

            {/* --- CARD 2: PREMIUM (HERO CARD WITH VIOLET GRADIENT) --- */}
            <div className="relative flex flex-col justify-between p-6 sm:p-7 rounded-[24px] bg-gradient-to-br from-[#7c3aed] via-[#6d28d9] to-[#4c1d95] text-white border border-violet-300/40 shadow-xl shadow-violet-950/30 transition-all duration-200 hover:shadow-2xl">
              
              {/* Floating "Most Popular" Pill */}
              <div className="absolute -top-3 right-6">
                <span className="px-3 py-0.5 rounded-full bg-violet-950 text-white text-[10px] font-extrabold uppercase tracking-wider border border-violet-400/40 shadow-sm">
                  {plans.premium.badge}
                </span>
              </div>

              <div className="space-y-4 text-left">
                {/* Title & Description */}
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    {plans.premium.name}
                  </h3>
                  <p className="text-xs text-violet-100/90 mt-1 leading-relaxed">
                    {plans.premium.desc}
                  </p>
                </div>

                {/* Price */}
                <div>
                  <div className="flex items-baseline gap-1 text-white">
                    <span className="text-3xl sm:text-4xl font-black tracking-tight">
                      ${billingCycle === 'annual' ? plans.premium.annualPrice : plans.premium.monthlyPrice}
                    </span>
                    <span className="text-xs text-violet-200 font-semibold">/mo</span>
                  </div>
                  <p className="text-[11px] text-violet-200/80 mt-1 font-medium">
                    {plans.premium.limitText}
                  </p>
                </div>

                {/* CTA Button */}
                <Link
                  to={plans.premium.ctaLink}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-[#5b21b6] font-extrabold text-xs text-center block transition-all shadow-md active:scale-[0.98]"
                >
                  {plans.premium.ctaText}
                </Link>

                {/* Features List */}
                <div className="pt-3 space-y-2.5 border-t border-white/15">
                  <p className="text-[10px] font-extrabold text-violet-200 uppercase tracking-wider">
                    {plans.premium.featureHeader}
                  </p>
                  {plans.premium.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-violet-50">
                      <div className="w-4 h-4 rounded-full bg-white text-[#6d28d9] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className="font-medium text-[11.5px] leading-tight">{feat}</span>
                    </div>
                  ))}
                </div>

              </div>

            </div>

          </div>
        </section>

        {/* --- Built for Peace of Mind (Trust Pillars) --- */}
        <section className="py-10 max-w-5xl mx-auto px-5 sm:px-8 w-full text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-8">
            Built for Landlords' Peace of Mind
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            
            {/* Pillar 1 */}
            <div className="space-y-3 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-1">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Bank-Grade Security
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
                All tenant payment data and lease documents are protected with AES-256 encryption and PCI-DSS compliant infrastructure.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="space-y-3 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-1">
                <Headset className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Dedicated Support
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
                Our property management experts are available to help you streamline tenant onboarding and leasing operations.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="space-y-3 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-1">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                White-Glove Migration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
                Moving from spreadsheets or another system? Our onboarding team will import your property portfolios, active leases, and tenants for free.
              </p>
            </div>

          </div>
        </section>

        {/* --- What's Included in Every Plan --- */}
        <section className="py-10 max-w-5xl mx-auto px-5 sm:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  What's included in every plan
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  No matter which tier you choose, you get access to our robust foundational tools designed to modernize your rental property operations.
                </p>
              </div>

              {/* 6 Feature Badges */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <Lock className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                  <span>256-bit Encryption</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <Users className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                  <span>Tenant Directory</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <Database className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                  <span>Cloud Database</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <FolderLock className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                  <span>Digital Lease Vault</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <Mail className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                  <span>Instant Tenant Invites</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <MessageSquare className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                  <span>Maintenance Desk</span>
                </div>
              </div>

            </div>

            {/* Right Dashboard Mockup */}
            <div className="lg:col-span-6">
              <div className="bg-[#f5f3ff] dark:bg-[#1e293b] rounded-3xl p-4 sm:p-5 border border-violet-200/80 dark:border-slate-700 shadow-xl relative overflow-hidden">
                
                {/* Browser Top Window Bar */}
                <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-violet-200/60 dark:border-slate-700">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>NestBloq Rental Workspace</span>
                  </div>
                  <div className="w-8" />
                </div>

                {/* Dashboard Inner App Canvas */}
                <div className="bg-white dark:bg-[#162032] rounded-2xl p-4 border border-slate-200/70 dark:border-slate-700/60 shadow-inner space-y-3.5 text-left">
                  
                  {/* Mini Portal Banner Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-md">
                        NB
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                          Skyline Property Portfolio
                        </h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          3 Active Properties • Real-Time Ledger
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      ● Active
                    </span>
                  </div>

                  {/* 3 Metric Stat Cards */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05]">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block truncate">
                        Rent Collected
                      </span>
                      <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white block mt-0.5">
                        $23,350
                      </span>
                      <span className="text-[8px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
                        ↑ 98.4% on-time
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05]">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block truncate">
                        Properties
                      </span>
                      <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white block mt-0.5">
                        3 Active
                      </span>
                      <span className="text-[8px] font-extrabold text-violet-600 dark:text-violet-400 flex items-center gap-0.5 mt-0.5">
                        ✓ 100% verified
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05]">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block truncate">
                        Work Orders
                      </span>
                      <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white block mt-0.5">
                        2 Open
                      </span>
                      <span className="text-[8px] font-extrabold text-indigo-500 flex items-center gap-0.5 mt-0.5">
                        ⚡ Auto-assigned
                      </span>
                    </div>
                  </div>

                  {/* Activity Feed Widget */}
                  <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05] space-y-2">
                    <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Live Operations Stream
                    </span>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.04]">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-slate-700 dark:text-slate-200 font-medium">
                            Auto-Rent received via Stripe • 742 Evergreen Terrace
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono">2m ago</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.04]">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                          <span className="text-slate-700 dark:text-slate-200 font-medium">
                            Digital Lease Agreement signed by Tenant • 128 Oakwood Blvd
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono">14m ago</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </section>

        {/* --- Compare Features Table --- */}
        <section className="py-10 max-w-5xl mx-auto px-5 sm:px-8 w-full text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-8">
            Compare Features
          </h2>

          <div className="rounded-[28px] overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md bg-white dark:bg-[#1e293b]">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-violet-600 to-indigo-700 text-white font-bold">
                  <th className="p-4 sm:p-5 w-1/2">Features</th>
                  <th className="p-4 sm:p-5 text-center w-1/4">Basic</th>
                  <th className="p-4 sm:p-5 text-center w-1/4">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-slate-700 dark:text-slate-300">
                {compareFeatures.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 sm:p-5 font-semibold text-slate-900 dark:text-white">
                      {row.name}
                    </td>
                    <td className="p-4 sm:p-5 text-center font-medium">
                      {row.basic === true ? (
                        <Check className="w-4 h-4 text-emerald-600 mx-auto stroke-[2.5]" />
                      ) : row.basic === false ? (
                        <span className="text-slate-400 font-bold">—</span>
                      ) : (
                        row.basic
                      )}
                    </td>
                    <td className="p-4 sm:p-5 text-center font-bold text-violet-600 dark:text-violet-400">
                      {row.premium === true ? (
                        <Check className="w-4 h-4 text-violet-600 dark:text-violet-400 mx-auto stroke-[3]" />
                      ) : row.premium === false ? (
                        <span className="text-slate-400 font-bold">—</span>
                      ) : (
                        row.premium
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* --- Pricing FAQ Section --- */}
        <FaqSection
          id="pricing-faq"
          badgeText="PRICING & BILLING FAQ"
          title="Frequently Asked Questions"
          subtitlePrefix="Have questions regarding subscriptions, billing tiers, or custom quotes?"
          contactText="Contact our billing team →"
          contactLink="/contact"
        />

        {/* --- Need a Custom Plan / Bottom CTA Banner --- */}
        <section className="py-10 pb-16 max-w-6xl mx-auto px-5 sm:px-8 w-full">
          <div className="relative rounded-3xl bg-gradient-to-r from-[#4c1d95] via-[#5b21b6] to-[#311075] p-8 sm:p-12 md:p-14 text-center text-white shadow-2xl overflow-hidden space-y-5">
            <div className="absolute top-0 right-0 w-80 h-80 bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-violet-300">
              ENTERPRISE & LARGE PORTFOLIOS
            </p>

            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight max-w-2xl mx-auto">
              Need a Custom Plan for Your Portfolio?
            </h2>

            <p className="text-xs sm:text-sm text-violet-200 max-w-lg mx-auto leading-relaxed">
              We provide dedicated solutions, volume discounts, custom integrations, and white-glove onboarding for multi-property landlords and real estate firms.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/contact"
                className="px-8 py-3.5 bg-white text-[#4c1d95] font-extrabold text-xs sm:text-sm rounded-full shadow-lg hover:bg-slate-100 transition-all active:scale-95"
              >
                Contact Sales
              </Link>
              <Link
                to="/portal-select"
                className="px-8 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm rounded-full transition-all active:scale-95"
              >
                Start 30-Day Free Trial
              </Link>
            </div>
          </div>
        </section>

      </div>

      <Footer />
    </div>
  );
}
