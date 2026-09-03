import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Check, 
  X, 
  ShieldCheck, 
  ArrowRight, 
  HelpCircle, 
  Headset, 
  TrendingUp, 
  Lock, 
  Users, 
  Database, 
  FolderLock, 
  Mail, 
  MessageSquare,
  Building,
  Building2,
  KeyRound,
  Shield,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';
import { useTheme } from '../../context/ThemeContext';

export default function PricingPage() {
  const [activePortal, setActivePortal] = useState('hoa'); // 'hoa', 'rental', 'condo'
  const [billingCycle, setBillingCycle] = useState('annual'); // 'monthly' or 'annual'
  const [calcTier, setCalcTier] = useState('premium'); // 'basic' or 'premium'
  const [calcUnits, setCalcUnits] = useState(125);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Portals configuration: HOA -> Rental -> Condo
  const portals = [
    {
      id: 'hoa',
      name: 'HOA Communities',
      icon: Building,
      badge: 'Homeowners Association',
      unitLabel: 'Homes / Units',
      minUnits: 10,
      maxUnits: 1000,
      defaultCalc: 125,
      heroSubtitle: 'No hidden fees, no complicated contracts. Just the tools you need to run your HOA efficiently, priced for your size.'
    },
    {
      id: 'rental',
      name: 'Rental Properties',
      icon: KeyRound,
      badge: 'Landlords & Property Managers',
      unitLabel: 'Properties',
      minUnits: 1,
      maxUnits: 150,
      defaultCalc: 20,
      heroSubtitle: 'Automated rent collection, tenant screening, lease agreements, and maintenance work orders for landlords.'
    },
    {
      id: 'condo',
      name: 'Condos & High-Rise',
      icon: Building2,
      badge: 'Condo & Strata Management',
      unitLabel: 'Condo Units',
      minUnits: 10,
      maxUnits: 800,
      defaultCalc: 100,
      heroSubtitle: 'Elevators, parking stalls, amenities, and resident governance packed into one simple modern package.'
    }
  ];

  // Pricing plans for each portal (2 plans: Basic & Premium)
  const portalPlans = {
    hoa: {
      basic: {
        name: "Basic",
        desc: "Essential tools for small communities and self-managed associations.",
        monthlyPrice: 59,
        annualPrice: 49,
        limitText: "Up to 100 units • Billed annually",
        ctaText: "Get Started",
        ctaLink: "/register",
        features: [
          "Resident & owner roster directory",
          "Expense tracking & monthly statements",
          "Online dues collection (ACH/Card)",
          "1 Amenity booking scheduler",
          "Email notifications & bulletins",
          "Standard email support"
        ]
      },
      premium: {
        name: "Premium",
        badge: "MOST POPULAR",
        desc: "Advanced features and automation for growing HOAs and active boards.",
        monthlyPrice: 159,
        annualPrice: 129,
        limitText: "Up to 350 units • Billed annually",
        ctaText: "Start Free Trial",
        ctaLink: "/register",
        featureHeader: "Everything in Basic, plus:",
        features: [
          "Maintenance ticket kanban board",
          "Automated late fees & payment reminders",
          "SMS alerts & broadcast system",
          "Unlimited amenities & facilities",
          "Digital assemblies & SHA-256 e-voting",
          "Priority phone & chat support"
        ]
      }
    },
    rental: {
      basic: {
        name: "Basic",
        desc: "Everything you need to automate tenant rent collection and lease tracking.",
        monthlyPrice: 49,
        annualPrice: 39,
        limitText: "Up to 15 Properties • Billed annually",
        ctaText: "Get Started",
        ctaLink: "/rental/register",
        features: [
          "Automated online rent collection (ACH/Card)",
          "Digital lease vault & document storage",
          "Direct tenant-to-landlord messaging",
          "Income & expense cashflow tracking",
          "Maintenance ticket submissions",
          "Standard email support"
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
        ctaLink: "/rental/register",
        featureHeader: "Everything in Basic, plus:",
        features: [
          "Online tenant credit & background screening",
          "Automated late fee rules & lease renewal alerts",
          "Vendor work order dispatch & invoices",
          "Multi-owner payout statements",
          "Property performance & tax reports",
          "Priority support & dedicated onboarding"
        ]
      }
    },
    condo: {
      basic: {
        name: "Basic",
        desc: "Essential management for single-building condos and boutique complexes.",
        monthlyPrice: 69,
        annualPrice: 59,
        limitText: "Up to 75 units • Billed annually",
        ctaText: "Get Started",
        ctaLink: "/condo/register",
        features: [
          "Unit & floor resident directory",
          "Maintenance ticket logger",
          "Amenity & elevator scheduling",
          "Digital announcements & notices",
          "Bylaws document repository",
          "Standard email support"
        ]
      },
      premium: {
        name: "Premium",
        badge: "MOST POPULAR",
        desc: "Full-scale building operations with visitor logs, packages, and contractors.",
        monthlyPrice: 179,
        annualPrice: 149,
        limitText: "Up to 250 units • Billed annually",
        ctaText: "Start Free Trial",
        ctaLink: "/condo/register",
        featureHeader: "Everything in Basic, plus:",
        features: [
          "Visitor registration & parking stall tracker",
          "Concierge package & delivery logging",
          "Automated violation fines & rules",
          "Contractor dispatch with Kanban workflow",
          "Emergency push broadcast notifications",
          "Priority 24/7 dedicated support"
        ]
      }
    }
  };

  const currentPortalData = portals.find(p => p.id === activePortal) || portals[0];
  const currentPlans = portalPlans[activePortal];

  // Calculator Price Computation
  const calculateEstimate = () => {
    const isBasic = calcTier === 'basic';
    const basePlan = isBasic ? currentPlans.basic : currentPlans.premium;
    const baseRate = billingCycle === 'annual' ? basePlan.annualPrice : basePlan.monthlyPrice;
    
    let estimatedMonthly = baseRate;
    let isCustomQuote = false;

    if (activePortal === 'rental') {
      if (isBasic) {
        if (calcUnits > 15) {
          estimatedMonthly = Math.round(baseRate + (calcUnits - 15) * 1.5);
        }
      } else {
        if (calcUnits > 60) {
          if (calcUnits > 130) {
            isCustomQuote = true;
          } else {
            estimatedMonthly = Math.round(baseRate + (calcUnits - 60) * 1.2);
          }
        }
      }
    } else {
      if (isBasic) {
        if (calcUnits > 100) {
          estimatedMonthly = Math.round(baseRate + (calcUnits - 100) * 0.45);
        }
      } else {
        if (calcUnits > 350) {
          if (calcUnits > 900) {
            isCustomQuote = true;
          } else {
            estimatedMonthly = Math.round(baseRate + (calcUnits - 350) * 0.35);
          }
        }
      }
    }

    const totalAnnual = estimatedMonthly * 12;
    return {
      monthly: estimatedMonthly,
      annualTotal: totalAnnual,
      isCustom: isCustomQuote
    };
  };

  const estimate = calculateEstimate();

  // Feature Comparison Table Data
  const compareFeatures = [
    { 
      name: activePortal === 'rental' ? "Property Limits" : "Unit Limits", 
      basic: activePortal === 'rental' ? "Up to 15 Properties" : "Up to 100 Units", 
      premium: activePortal === 'rental' ? "Up to 60 Properties (Scalable)" : "Up to 350 Units (Scalable)" 
    },
    { name: "Admin & Manager Accounts", basic: "2 Users", premium: "Unlimited" },
    { 
      name: activePortal === 'rental' ? "Lease & Document Storage" : "Amenity & Facility Booking", 
      basic: activePortal === 'rental' ? "Standard Vault" : "1 Facility", 
      premium: activePortal === 'rental' ? "Unlimited Leases & Vault" : "Unlimited Facilities" 
    },
    { name: "SMS Notification Alerts", basic: false, premium: true },
    { name: "Automated Late Fees & Rules", basic: false, premium: true },
    { 
      name: activePortal === 'rental' ? "Tenant Credit & Background Screening" : "Electronic Voting & Ballots", 
      basic: false, 
      premium: true 
    },
    { name: "Maintenance Kanban Board", basic: false, premium: true },
    { name: "NestBloq AI Resident Bot", basic: false, premium: true },
    { name: "Priority Support & Phone Access", basic: false, premium: true }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaff] dark:bg-[#070614] transition-colors duration-200 font-sans text-slate-900 dark:text-slate-100">
      <Navbar />

      <div className="flex-1 overflow-x-hidden">

        {/* --- Top Hero Section (Matching Homepage Hero Typography) --- */}
        <header className="relative w-full pt-6 pb-4 sm:pt-8 sm:pb-6 px-5 sm:px-8 text-center">
          {/* Subtle Ambient Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-violet-600/10 dark:bg-violet-600/15 rounded-full blur-[110px] pointer-events-none -z-10" />

          <div className="max-w-4xl mx-auto space-y-4 animate-fade-in-up">
            
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400">
              <span className="text-[10px] font-bold tracking-widest uppercase">Transparent Pricing For Every Community</span>
            </div>

            {/* Main Headline — Exact Home Page Display Typography */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-black leading-[1.08] tracking-tight text-slate-900 dark:text-white">
              Choose the plan that fits your community's needs
            </h1>

            {/* Sub-headline */}
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal">
              {currentPortalData.heroSubtitle}
            </p>

            {/* --- 3-Portal Switcher Tabs (HOA -> Rental -> Condo) --- */}
            <div className="pt-1 flex justify-center">
              <div className="inline-flex p-1.5 rounded-2xl bg-white dark:bg-[#120f30] border border-slate-200 dark:border-violet-900/40 shadow-sm gap-1">
                {portals.map((p) => {
                  const Icon = p.icon;
                  const isActive = activePortal === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActivePortal(p.id);
                        setCalcUnits(p.defaultCalc);
                      }}
                      className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* --- Monthly / Annual Billing Toggle Switch --- */}
            <div className="flex items-center justify-center gap-2 pt-0.5">
              <div className="inline-flex items-center p-0.5 rounded-full bg-slate-100 dark:bg-[#141033] border border-slate-200/80 dark:border-white/10 shadow-inner">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-200 ${
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
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-200 ${
                    billingCycle === 'annual'
                      ? 'bg-white dark:bg-violet-600 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                  }`}
                >
                  <span>Annually</span>
                  <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[8px] px-1.5 py-0.2 rounded-full font-extrabold uppercase">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>

          </div>
        </header>

        {/* --- 2 Pricing Cards (Compact Single View Layout) --- */}
        <section className="py-2 pb-8 max-w-4xl mx-auto px-4 sm:px-6 w-full relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
            
            {/* --- CARD 1: BASIC / STANDARD --- */}
            <div className="relative flex flex-col justify-between p-5 sm:p-6 rounded-[24px] bg-white dark:bg-[#0f0c29] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all duration-200 hover:shadow-lg">
              
              <div className="space-y-3.5 text-left">
                {/* Title & Description */}
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {currentPlans.basic.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {currentPlans.basic.desc}
                  </p>
                </div>

                {/* Price */}
                <div>
                  <div className="flex items-baseline gap-1 text-slate-900 dark:text-white">
                    <span className="text-3xl sm:text-4xl font-black tracking-tight">
                      ${billingCycle === 'annual' ? currentPlans.basic.annualPrice : currentPlans.basic.monthlyPrice}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">/mo</span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                    {currentPlans.basic.limitText}
                  </p>
                </div>

                {/* CTA Button */}
                <Link
                  to={currentPlans.basic.ctaLink}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#f1f5f9] dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-800 dark:text-white font-bold text-xs text-center block transition-all active:scale-[0.98]"
                >
                  {currentPlans.basic.ctaText}
                </Link>

                {/* Features List */}
                <div className="pt-2.5 space-y-2 border-t border-slate-100 dark:border-white/[0.06]">
                  {currentPlans.basic.features.map((feat, idx) => (
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
            <div className="relative flex flex-col justify-between p-5 sm:p-6 rounded-[24px] bg-gradient-to-br from-[#7c3aed] via-[#6d28d9] to-[#4c1d95] text-white border border-violet-300/40 shadow-xl shadow-violet-950/30 transition-all duration-200 hover:shadow-2xl">
              
              {/* Floating "Most Popular" Pill */}
              <div className="absolute -top-3 right-6">
                <span className="px-3 py-0.5 rounded-full bg-violet-950 text-white text-[10px] font-extrabold uppercase tracking-wider border border-violet-400/40 shadow-sm">
                  {currentPlans.premium.badge}
                </span>
              </div>

              <div className="space-y-3.5 text-left">
                {/* Title & Description */}
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    {currentPlans.premium.name}
                  </h3>
                  <p className="text-xs text-violet-100/90 mt-0.5 leading-snug">
                    {currentPlans.premium.desc}
                  </p>
                </div>

                {/* Price */}
                <div>
                  <div className="flex items-baseline gap-1 text-white">
                    <span className="text-3xl sm:text-4xl font-black tracking-tight">
                      ${billingCycle === 'annual' ? currentPlans.premium.annualPrice : currentPlans.premium.monthlyPrice}
                    </span>
                    <span className="text-xs text-violet-200 font-semibold">/mo</span>
                  </div>
                  <p className="text-[11px] text-violet-200/80 mt-0.5 font-medium">
                    {currentPlans.premium.limitText}
                  </p>
                </div>

                {/* CTA Button */}
                <Link
                  to={currentPlans.premium.ctaLink}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-[#5b21b6] font-extrabold text-xs text-center block transition-all shadow-md active:scale-[0.98]"
                >
                  {currentPlans.premium.ctaText}
                </Link>

                {/* Features List */}
                <div className="pt-2.5 space-y-2 border-t border-white/15">
                  <p className="text-[10px] font-extrabold text-violet-200 uppercase tracking-wider">
                    {currentPlans.premium.featureHeader}
                  </p>
                  {currentPlans.premium.features.map((feat, idx) => (
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

        {/* --- Interactive Pricing Calculator ("Estimate Your Pricing") --- */}
        <section className="py-8 max-w-5xl mx-auto px-5 sm:px-8 w-full relative z-10">
          <div className="bg-white dark:bg-[#0f0c29] border border-slate-200/90 dark:border-white/[0.08] rounded-[32px] p-6 sm:p-10 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Sliders & Controls (7 Cols) */}
              <div className="md:col-span-7 space-y-6 text-left">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Estimate Your Pricing
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    See exactly what you'll pay based on your {activePortal === 'rental' ? 'portfolio' : 'community'} size and feature needs.
                  </p>
                </div>

                {/* Select Plan Tier */}
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    SELECT PLAN TIER
                  </label>
                  <div className="flex gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200/70 dark:border-white/10 max-w-xs">
                    <button
                      type="button"
                      onClick={() => setCalcTier('basic')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        calcTier === 'basic'
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Basic
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcTier('premium')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        calcTier === 'premium'
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Premium
                    </button>
                  </div>
                </div>

                {/* Number of Properties / Units Slider */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      NUMBER OF {currentPortalData.unitLabel.toUpperCase()}
                    </span>
                    <span className="text-lg font-black font-mono text-violet-600 dark:text-violet-400">
                      {calcUnits}
                    </span>
                  </div>

                  {/* Slider Input */}
                  <div className="relative flex items-center">
                    <input
                      type="range"
                      min={currentPortalData.minUnits}
                      max={currentPortalData.maxUnits}
                      step={activePortal === 'rental' ? 1 : 5}
                      value={calcUnits}
                      onChange={(e) => setCalcUnits(parseInt(e.target.value, 10))}
                      className="w-full h-2.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-600 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-500 font-mono">
                    <span>{currentPortalData.minUnits} {currentPortalData.unitLabel}</span>
                    <span>{currentPortalData.maxUnits}+ {currentPortalData.unitLabel}</span>
                  </div>
                </div>

              </div>

              {/* Right Column: Estimated Monthly Cost Card (5 Cols) */}
              <div className="md:col-span-5 bg-gradient-to-br from-[#7c3aed] via-[#6d28d9] to-[#4c1d95] text-white rounded-[28px] p-8 text-center flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden">
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold text-violet-200 uppercase tracking-widest block">
                    ESTIMATED MONTHLY COST
                  </span>
                  
                  {estimate.isCustom ? (
                    <div className="py-2">
                      <span className="text-3xl font-black">Custom Quote</span>
                    </div>
                  ) : (
                    <div>
                      <div className="text-5xl font-black tracking-tight">
                        ${estimate.monthly}
                      </div>
                      <p className="text-xs text-violet-200 mt-1 font-medium">
                        {billingCycle === 'annual' ? `Billed $${estimate.annualTotal.toLocaleString()} annually` : 'Billed monthly'}
                      </p>
                    </div>
                  )}
                </div>

                <Link
                  to={estimate.isCustom ? "/contact" : currentPlans[calcTier].ctaLink}
                  className="w-full py-3.5 px-4 rounded-xl bg-white text-[#5b21b6] hover:bg-slate-100 font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 text-center"
                >
                  {estimate.isCustom ? "Contact Enterprise Sales" : "Start My Free Trial"}
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* --- Built for Peace of Mind (Trust Pillars) --- */}
        <section className="py-12 max-w-5xl mx-auto px-5 sm:px-8 w-full text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-10">
            Built for Peace of Mind
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            
            {/* Pillar 1 */}
            <div className="space-y-3 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-1">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Bank-Level Security
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
                All resident data and payments are protected with AES-256 encryption and SOC2 compliant infrastructure.
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
                Our experts are available to help you navigate community and rental property challenges quickly.
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
                Moving from another platform? Our onboarding team will import your rosters, leases, and historical data for free.
              </p>
            </div>

          </div>
        </section>

        {/* --- What's Included in Every Plan --- */}
        <section className="py-12 max-w-5xl mx-auto px-5 sm:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  What's included in every plan
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  No matter which tier you choose, you get access to our robust foundational tools designed to modernize your property operations.
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
                  <span>Resident & Tenant Rosters</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <Database className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                  <span>Cloud Database</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <FolderLock className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                  <span>Document Vault</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <Mail className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                  <span>Member & Tenant Invites</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <MessageSquare className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                  <span>Message Board</span>
                </div>
              </div>

            </div>

            {/* Right Dashboard Mockup (Pure Code SaaS Interface - No Stock Images) */}
            <div className="lg:col-span-6">
              <div className="bg-[#f5f3ff] dark:bg-[#120f30] rounded-3xl p-4 sm:p-5 border border-violet-200/80 dark:border-white/10 shadow-xl relative overflow-hidden">
                
                {/* Browser Top Window Bar */}
                <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-violet-200/60 dark:border-white/10">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>NestBloq Interactive Workspace</span>
                  </div>
                  <div className="w-8" />
                </div>

                {/* Dashboard Inner App Canvas */}
                <div className="bg-white dark:bg-[#0b081d] rounded-2xl p-4 border border-slate-200/70 dark:border-white/5 shadow-inner space-y-3.5 text-left">
                  
                  {/* Mini Portal Banner Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-md">
                        NB
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                          {activePortal === 'hoa' ? 'Oakridge Estates HOA' : activePortal === 'rental' ? 'Skyline Portfolio Management' : 'Marina High-Rise Tower'}
                        </h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          {activePortal === 'hoa' ? '142 Active Homes • Board Portal' : activePortal === 'rental' ? '28 Properties • Real-Time Ledger' : '96 Condo Units • Concierge Desk'}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      ● Operational
                    </span>
                  </div>

                  {/* 3 Metric Stat Cards */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05]">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block truncate">
                        {activePortal === 'rental' ? 'Rent Collected' : 'Dues Collected'}
                      </span>
                      <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white block mt-0.5">
                        {activePortal === 'rental' ? '$34,800' : '$48,250'}
                      </span>
                      <span className="text-[8px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
                        ↑ 98.4% on-time
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05]">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block truncate">
                        {activePortal === 'rental' ? 'Properties' : 'Total Units'}
                      </span>
                      <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white block mt-0.5">
                        {activePortal === 'rental' ? '28 Active' : '142 Units'}
                      </span>
                      <span className="text-[8px] font-extrabold text-violet-600 dark:text-violet-400 flex items-center gap-0.5 mt-0.5">
                        ✓ 100% verified
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05]">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block truncate">
                        {activePortal === 'rental' ? 'Work Orders' : 'Active Tickets'}
                      </span>
                      <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white block mt-0.5">
                        2 Pending
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
                            {activePortal === 'rental' ? 'Auto-Rent received via ACH • Unit 3B' : 'Online Dues payment cleared • Home #104'}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono">2m ago</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.04]">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                          <span className="text-slate-700 dark:text-slate-200 font-medium">
                            {activePortal === 'rental' ? 'Digital Lease Agreement signed by Tenant' : activePortal === 'hoa' ? 'Annual Assembly E-Voting Quorum reached (94%)' : 'Elevator reservation confirmed for Moving'}
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

          <div className="rounded-[28px] overflow-hidden border border-slate-200 dark:border-white/10 shadow-md bg-white dark:bg-[#0f0c29]">
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

        {/* --- Need a Custom Plan? Banner --- */}
        <section className="py-8 pb-20 max-w-5xl mx-auto px-5 sm:px-8 w-full">
          <div className="rounded-[28px] p-8 sm:p-10 bg-gradient-to-r from-[#7c3aed] via-[#6d28d9] to-[#4c1d95] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-violet-950/20">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-2xl font-black tracking-tight">
                Need a custom plan?
              </h3>
              <p className="text-xs sm:text-sm text-violet-200">
                For enterprise portfolios, multi-association managers, and custom integrations.
              </p>
            </div>
            <Link
              to="/contact"
              className="px-6 py-3 rounded-full bg-white text-[#5b21b6] hover:bg-slate-100 font-bold text-xs uppercase tracking-wider shadow-md shrink-0 transition-all active:scale-95"
            >
              Contact Sales
            </Link>
          </div>
        </section>

      </div>

      <Footer />
    </div>
  );
}
