import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ShieldCheck, ArrowRight, HelpCircle, Headset, ArrowLeftRight, CheckCircle2, Shield, Crown, Building2 } from 'lucide-react';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';
import { useTheme } from '../../context/ThemeContext';
import heroCondoLight from '../../assets/hero_condo_light.png';
import communityHero from '../../assets/community_hero.png';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState('annual'); // 'monthly' or 'annual'
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [calcUnits, setCalcUnits] = useState(150);

  const getCalcDetails = (units) => {
    if (units <= 100) {
      return {
        plan: "Standard",
        monthly: 99,
        annual: 83.25,
        totalAnnual: 999,
        limit: "Up to 100 units",
        isCustom: false
      };
    } else if (units <= 350) {
      return {
        plan: "Premium",
        monthly: 199,
        annual: 166.58,
        totalAnnual: 1999,
        limit: "Up to 350 units",
        isCustom: false
      };
    } else if (units <= 1000) {
      return {
        plan: "Enterprise",
        monthly: 499,
        annual: 416.58,
        totalAnnual: 4999,
        limit: "Up to 1,000 units",
        isCustom: false
      };
    } else {
      return {
        plan: "Custom",
        monthly: 0,
        annual: 0,
        totalAnnual: 0,
        limit: "Over 1,000 units",
        isCustom: true
      };
    }
  };

  const handleSliderChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setCalcUnits(val);
  };

  const handleInputChange = (e) => {
    let val = e.target.value.replace(/\D/g, ''); // numbers only
    if (val === '') {
      setCalcUnits('');
      return;
    }
    let num = parseInt(val, 10);
    if (num > 5000) num = 5000; // clamp max
    setCalcUnits(num);
  };

  const handleSelectPlan = (planName) => {
    if (planName === 'Standard') setCalcUnits(100);
    else if (planName === 'Premium') setCalcUnits(350);
    else if (planName === 'Enterprise') setCalcUnits(1000);
  };

  const plans = [
    {
      name: "Standard",
      desc: "Get all the core features to automate your roster, checkbooks, dues, and announcements from a single dashboard.",
      units: "Up to 100 units",
      monthlyPrice: 99,
      annualPrice: 83,
      features: [
        "Resident & Owner Roster Directory",
        "Expense Tracking & Statements",
        "Online Dues Collection (ACH/Card)",
        "Single Amenity Booking Scheduler",
        "Email Notifications & Bulletins",
        "Standard L1 Email Support"
      ],
      cta: "Select Standard",
      path: "/register",
      highlight: false,
      icon: Shield,
      accent: "indigo",
      badge: "Basic",
      themeStyles: {
        card: "border-slate-200/80 dark:border-white/[0.05] bg-white dark:bg-gradient-to-br dark:from-[#130d22] dark:to-[#090312] hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:shadow-indigo-500/5",
        badgeBg: "bg-slate-100 dark:bg-white/[0.04] text-slate-650 dark:text-slate-400 border border-slate-200/60 dark:border-white/[0.05]",
        iconBg: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/70 dark:border-indigo-900/30",
        button: "bg-slate-50 dark:bg-white/[0.02] text-slate-800 dark:text-white border border-slate-200 dark:border-white/[0.08] hover:bg-indigo-600 hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-indigo-500/20"
      }
    },
    {
      name: "Premium",
      desc: "Grow your community operations with advanced violations logs, maintenance Kanban boards, and smart SMS alerts.",
      units: "Up to 350 units",
      monthlyPrice: 199,
      annualPrice: 166,
      features: [
        "All Standard Features Included",
        "Maintenance Ticket Kanban Board",
        "Automated Late Dues Fee Rules",
        "SMS Alerts & Broadcast System",
        "Unlimited Amenity Facility Booking",
        "Customizable Directory Fields",
        "Priority Email & Chat Support"
      ],
      cta: "Select Premium",
      path: "/register",
      highlight: true,
      icon: Crown,
      accent: "violet",
      badge: "Most Popular",
      themeStyles: {
        card: "border-violet-500 dark:border-violet-400 bg-white dark:bg-gradient-to-br dark:from-[#1b0a34] dark:via-[#120824] dark:to-[#0c0418] lg:scale-[1.03] shadow-lg shadow-violet-500/5 hover:shadow-xl hover:shadow-violet-500/15",
        badgeBg: "bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-extrabold shadow-sm shadow-violet-500/20",
        iconBg: "bg-violet-650 text-white shadow-lg shadow-violet-500/30",
        button: "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-750 hover:to-indigo-750 text-white shadow-lg shadow-violet-500/25 dark:shadow-violet-500/40 hover:scale-[1.02]"
      }
    },
    {
      name: "Enterprise",
      desc: "Take governance to the next level with customized setups, developer APIs, white-labeled portals, and secure e-voting.",
      units: "Up to 1000 units",
      monthlyPrice: 499,
      annualPrice: 416,
      features: [
        "All Premium Features Included",
        "Dedicated Customer Success Manager",
        "Advanced API & Webhook Access",
        "Custom Automated Workflows",
        "White-Labeled Portal Application",
        "Digital Assemblies & SHA-256 E-Voting",
        "24/7 Telephone Priority Dispatch"
      ],
      cta: "Select Enterprise",
      path: "/register",
      highlight: false,
      icon: Building2,
      accent: "blue",
      badge: "Enterprise Elite",
      themeStyles: {
        card: "border-slate-200/80 dark:border-white/[0.05] bg-white dark:bg-gradient-to-br dark:from-[#111124] dark:to-[#080814] hover:border-blue-400 dark:hover:border-blue-500/50 hover:shadow-blue-500/5",
        badgeBg: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20",
        iconBg: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100/70 dark:border-blue-900/30",
        button: "bg-slate-50 dark:bg-white/[0.02] text-slate-800 dark:text-white border border-slate-200 dark:border-white/[0.08] hover:bg-blue-600 hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-blue-500/20"
      }
    }
  ];

  const compareFeatures = [
    { name: "Max Community Units", starter: "100", professional: "350", enterprise: "1000" },
    { name: "Online Dues Payments", starter: true, professional: true, enterprise: true },
    { name: "SMS Notification Broadcasts", starter: false, professional: true, enterprise: true },
    { name: "Amenities Allocation Tracker", starter: "1 Amenity", professional: "Unlimited", enterprise: "Unlimited" },
    { name: "Bylaws Violation Logs", starter: false, professional: true, enterprise: true },
    { name: "Digital Assemblies & Voting", starter: false, professional: true, enterprise: true },
    { name: "NestBloq AI Resident Assistant", starter: false, professional: true, enterprise: true },
    { name: "White-labeled Application", starter: false, professional: false, enterprise: true },
    { name: "Dedicated CSM Manager", starter: false, professional: false, enterprise: true },
    { name: "API & Webhooks", starter: false, professional: false, enterprise: true }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#120824] transition-colors duration-250 font-sans text-slate-900 dark:text-slate-100">
      <Navbar />

      <div className="flex-1 overflow-x-hidden">

      {/* --- Page Header Banner with Background Image --- */}
      <header className="relative w-full overflow-hidden py-12 sm:py-16 border-b border-slate-200/50 dark:border-white/[0.04] bg-slate-50 dark:bg-slate-950">
        {/* Background Image of Modern Apartments */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroCondoLight}
            alt="Modern Residential Complexes"
            className="w-full h-full object-cover object-center opacity-15 dark:opacity-20 blur-[2px] select-none pointer-events-none"
          />
          {/* Glowing navy/sky-blue overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50/90 via-sky-50/30 to-slate-50/90 dark:from-slate-950/90 dark:via-sky-900/40 dark:to-slate-950/90" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-sky-500/10 dark:bg-sky-500/20 border border-sky-300/30 dark:border-sky-400/30 text-sky-600 dark:text-sky-200 text-[10px] font-extrabold tracking-widest uppercase">
            Transparent pricing for every community
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight max-w-3xl mx-auto">
            Choose the plan that fits your community's needs
          </h1>
          
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
            No hidden setup fees or locked-in contracts. Scale your package as your housing list grows.
          </p>

          {/* --- Billing Selector Switch --- */}
          <div className="flex items-center justify-center gap-3 pt-6">
            <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${billingCycle === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
              Monthly Billing
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="w-14 h-8 bg-slate-200/60 dark:bg-white/5 border border-slate-350 dark:border-white/10 rounded-full p-1 transition-colors duration-200 focus:outline-none flex items-center relative"
              aria-label="Toggle Billing Cycle"
            >
              <div
                className={`w-6 h-6 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 shadow-md transform transition-transform duration-200 ${
                  billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${billingCycle === 'annual' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
              Annual Billing
              <span className="bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase border border-emerald-500/20 dark:border-emerald-500/35">Save 20%</span>
            </span>
          </div>
        </div>
      </header>

      {/* --- Pricing Tiers Grid --- */}
      <section className="py-20 max-w-7xl mx-auto px-5 sm:px-8 w-full relative z-10">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-violet-600/[0.04] dark:bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-500/[0.03] dark:bg-blue-500/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch relative z-10">
          {plans.map((plan, idx) => {
            const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
            const IconComponent = plan.icon;

            return (
              <div
                key={idx}
                className={`relative flex flex-col justify-between p-6 rounded-3xl border transition-all duration-300 group hover:-translate-y-1.5 ${plan.themeStyles.card}`}
              >
                {/* Accent glow on hover */}
                <div className={`absolute -inset-px rounded-3xl bg-gradient-to-r ${plan.highlight ? 'from-violet-500/30 to-indigo-500/30' : plan.accent === 'blue' ? 'from-blue-500/20 to-indigo-500/20' : 'from-indigo-500/20 to-purple-500/20'} opacity-0 group-hover:opacity-100 blur-[8px] transition-all duration-300 pointer-events-none -z-10`} />

                <div className="relative z-10 flex flex-col h-full justify-between space-y-4">
                  
                  {/* Top info and badge */}
                  <div className="space-y-3 text-left">
                    <div className="flex items-center justify-between gap-3">
                      {/* Icon Container */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${plan.themeStyles.iconBg}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      
                      {/* Top Badge */}
                      <span className={`px-2.5 py-0.5 text-[9px] font-extrabold uppercase rounded-full tracking-wider ${plan.themeStyles.badgeBg}`}>
                        {plan.badge}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                        {plan.name}
                      </h3>
                      <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        {plan.units}
                      </p>
                    </div>
                  </div>

                  {/* Pricing Box */}
                  <div className="py-3 border-y border-slate-100 dark:border-white/[0.06] text-left relative overflow-hidden">
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">starting at</p>
                    <div className="flex items-baseline gap-1 mt-0.5 text-slate-900 dark:text-white">
                      <span className="text-4xl font-black tracking-tight">${price}</span>
                      <span className="text-[10px] text-slate-455 dark:text-slate-500 font-bold uppercase">/ month</span>
                    </div>
                    {billingCycle === 'annual' && (
                      <p className="text-[9px] text-indigo-650 dark:text-indigo-450 font-bold mt-1 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-indigo-500 inline-block" />
                        Billed annually (${price * 12}/yr)
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-655 dark:text-slate-350 leading-relaxed text-left min-h-[35px]">
                    {plan.desc}
                  </p>

                  {/* Divider line */}
                  <div className="h-px bg-slate-100 dark:bg-white/[0.06]" />

                  {/* Features List */}
                  <div className="space-y-3 flex-1 flex flex-col justify-start">
                    <h4 className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-widest text-left">
                      What's Included:
                    </h4>
                    <div className="space-y-2">
                      {plan.features.map((feature, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-655 dark:text-slate-300 leading-normal text-left">
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${plan.highlight ? 'bg-violet-500/10 text-violet-500 dark:bg-violet-500/20 dark:text-violet-400' : 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400'}`}>
                            <Check className="w-2 h-2 stroke-[3]" />
                          </div>
                          <span className="font-medium text-[11px]">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Button Container */}
                  <div className="pt-2">
                    <Link
                      to={plan.path}
                      className={`w-full py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all duration-200 ${plan.themeStyles.button}`}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      </section>

      {/* --- Interactive Pricing Calculator --- */}
      <section className="py-20 max-w-5xl mx-auto px-5 sm:px-8 w-full relative z-10 border-t border-slate-200/50 dark:border-white/[0.04]">
        <div className="text-center space-y-3 mb-12">
          <span className="text-violet-600 dark:text-[#a78bfa] text-xs font-extrabold tracking-widest uppercase">
            Interactive Calculator
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Estimate Your Pricing
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Drag the slider or enter your community's unit size to see which plan is best for you.
          </p>
        </div>

        {/* Outer calculator flex card layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch bg-white dark:bg-[#180a2d]/40 border border-slate-200/80 dark:border-white/[0.06] rounded-3xl p-6 sm:p-10 shadow-lg backdrop-blur-md">
          
          {/* Left Panel: Inputs (col-span-7) */}
          <div className="md:col-span-7 space-y-8 flex flex-col justify-between text-left">
            
            {/* 1. Plan Tabs selectors */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Select Plan Tier
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {['Standard', 'Premium', 'Enterprise'].map((pName) => {
                  const details = getCalcDetails(calcUnits);
                  const isSelected = details.plan === pName;
                  return (
                    <button
                      key={pName}
                      type="button"
                      onClick={() => handleSelectPlan(pName)}
                      className={`py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 border ${
                        isSelected
                          ? 'bg-gradient-to-r from-violet-500 to-indigo-600 border-transparent text-white shadow-md'
                          : 'bg-slate-50 dark:bg-white/[0.02] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      {pName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Unit Count Input & Slider */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between gap-4">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Enter Your Unit Count
                </label>
                <div className="relative w-28">
                  <input
                    type="text"
                    value={calcUnits}
                    onChange={handleInputChange}
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/[0.08] rounded-xl text-sm font-bold font-mono text-slate-800 dark:text-white text-center focus:outline-none focus:border-violet-500"
                  />
                  <span className="absolute right-2.5 top-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                    Units
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                How many units or properties do you manage in your portfolio?
              </p>

              {/* Slider Input */}
              <div className="pt-4 relative flex items-center">
                <input
                  type="range"
                  min="10"
                  max="1200"
                  step="10"
                  value={calcUnits || 10}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500 focus:outline-none"
                  style={{
                    background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${((calcUnits - 10) / 1190) * 100}%, ${isDark ? '#1e1b4b' : '#e2e8f0'} ${((calcUnits - 10) / 1190) * 100}%, ${isDark ? '#1e1b4b' : '#e2e8f0'} 100%)`
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono px-0.5">
                <span>10 Units</span>
                <span>500 Units</span>
                <span>1,000 Units</span>
                <span>1,200+ Units</span>
              </div>
            </div>

            {/* Helper threshold text */}
            <div className="pt-2 text-xs text-slate-400 dark:text-slate-500 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <span>
                Need specific pricing for communities larger than 1,200 units? Select Custom or slide past 1,000 units to request a custom contract.
              </span>
            </div>

          </div>

          {/* Right Panel: Pricing Box Card (col-span-5) */}
          <div className="md:col-span-5 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 text-center text-white bg-gradient-to-br from-indigo-950 via-[#160b2d] to-slate-950 border border-white/10 shadow-2xl relative overflow-hidden">
            
            {/* background blur sphere */}
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-violet-600/20 rounded-full blur-2xl pointer-events-none" />

            {/* calculated values */}
            {(() => {
              const details = getCalcDetails(calcUnits);
              const price = billingCycle === 'annual' ? details.annual : details.monthly;

              return (
                <>
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
                      {details.isCustom ? "Enterprise Quote" : "Calculated Rate"}
                    </p>
                    
                    <div className="space-y-1">
                      {details.isCustom ? (
                        <h3 className="text-3xl font-black text-white py-2">Custom Quote</h3>
                      ) : (
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-5xl font-black tracking-tight">$</span>
                          <span className="text-5xl font-black tracking-tight">{Math.floor(price)}</span>
                          <span className="text-xl font-extrabold text-indigo-300">
                            {price % 1 !== 0 ? `.${(price % 1).toFixed(2).split('.')[1]}` : ''}
                          </span>
                          <span className="text-xs text-indigo-300 uppercase font-bold ml-1">/ Month</span>
                        </div>
                      )}
                      
                      {!details.isCustom && (
                        <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">
                          {details.limit}
                        </p>
                      )}
                    </div>

                    {!details.isCustom && (
                      <div className="text-xs text-slate-300 leading-relaxed font-normal pt-2">
                        {billingCycle === 'annual' ? (
                          <span className="text-blue-400 font-bold">
                            Billed annually (${details.totalAnnual}/yr)
                          </span>
                        ) : (
                          <span>Billed monthly</span>
                        )}
                      </div>
                    )}

                    {details.isCustom && (
                      <p className="text-xs text-slate-300 leading-relaxed font-normal">
                        For communities larger than 1,000 units, we design custom portfolios with White-Label portals and a dedicated CSM.
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Link
                      to={details.isCustom ? "/contact" : "/register"}
                      className="w-full py-3.5 bg-gradient-to-r from-violet-500 to-indigo-650 hover:from-violet-600 hover:to-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-violet-500/20 active:scale-95 transition-all text-center"
                    >
                      {details.isCustom ? "Contact Sales" : "Start My Free Trial"}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <p className="text-[9px] text-indigo-300">
                      {details.isCustom
                        ? "Contact our team to get a quote within 24 hours."
                        : "Includes a 14-day full feature trial. No credit card required."}
                    </p>
                  </div>
                </>
              );
            })()}

          </div>

        </div>
      </section>

      {/* --- Trust Elements Grid --- */}
      <section className="py-16 bg-white dark:bg-[#180a2d]/45 border-y border-slate-200/60 dark:border-white/[0.04] relative z-10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-6 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/[0.04] rounded-2xl space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 dark:text-violet-400 flex items-center justify-center border border-violet-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">Bank-Grade Security</h4>
              <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed font-normal">
                Your community data and financial transactions are protected with industry-standard SHA-256 encryption.
              </p>
            </div>

            <div className="p-6 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/[0.04] rounded-2xl space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Headset className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">Expert Support</h4>
              <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed font-normal">
                Our dedicated support team is available 24/7 to resolve operations issues and assist resident managers.
              </p>
            </div>

            <div className="p-6 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/[0.04] rounded-2xl space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">Seamless Migration</h4>
              <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed font-normal">
                Transition your existing complex records and roster members effortlessly using our smart import utilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- What's Included Section --- */}
      <section className="py-24 max-w-7xl mx-auto px-5 sm:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Block */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              What's included in every plan
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
              All plans come equipped with the core features designed to keep your residential society, apartment portal, or condo association running smoothly.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-white/[0.05]">
              {[
                "100% Data Encryption",
                "Online Document Vault",
                "Community Rosters",
                "Member Invite System",
                "Automated Database",
                "Direct Message Board"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Block: Preview Image with Glowing effects */}
          <div className="lg:col-span-7 flex justify-center relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-2xl blur-xl opacity-20 dark:opacity-30" />
            <div className="relative border border-slate-200 dark:border-white/[0.06] bg-slate-950 rounded-2xl p-2 shadow-2xl">
              <img
                src={communityHero}
                alt="NestBloq Community Dashboard Preview"
                className="rounded-xl w-full max-w-[580px] h-auto object-cover object-center pointer-events-none select-none shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- Need a Custom Plan? Banner --- */}
      <section className="py-8 pb-20 max-w-7xl mx-auto px-5 sm:px-8 w-full relative z-10">
        <div className="relative overflow-hidden rounded-3xl p-10 sm:p-12 text-left" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #120824 100%)' }}>
          {/* Overlay elements */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="absolute right-0 top-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Need a custom plan?</h3>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                For portfolios larger than 1,000 units or custom integration needs, connect with our sales team to arrange customized terms.
              </p>
            </div>
            <Link
              to="/contact"
              className="px-6 py-3.5 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-650 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl text-center shadow-lg shadow-violet-500/15 flex items-center gap-1.5 shrink-0 self-start md:self-center transition-all active:scale-95"
            >
              Contact Sales
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* --- Features Comparison Matrix --- */}
      <section className="py-12 pb-24 max-w-7xl mx-auto px-5 sm:px-8 w-full relative z-10">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Compare Feature Details</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-450">Evaluate detailed module differences across the three packages</p>
        </div>

        <div className="bg-white/85 dark:bg-[#180a2d]/85 border border-slate-200/80 dark:border-white/[0.06] rounded-3xl overflow-hidden shadow-md backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-[#0a0414] text-slate-800 dark:text-slate-200 border-b border-slate-200/80 dark:border-white/[0.06] font-bold uppercase tracking-wider">
                  <th className="p-5">Feature Module</th>
                  <th className="p-5 text-center">Standard</th>
                  <th className="p-5 text-center">Premium</th>
                  <th className="p-5 text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-700 dark:text-slate-350">
                {compareFeatures.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="p-5 font-semibold text-slate-900 dark:text-white">{row.name}</td>
                    <td className="p-5 text-center font-semibold">
                      {row.starter === true ? (
                        <Check className="w-4 h-4 text-indigo-500 dark:text-indigo-400 mx-auto" />
                      ) : row.starter === false ? (
                        <X className="w-4 h-4 text-gray-300 mx-auto" />
                      ) : (
                        row.starter
                      )}
                    </td>
                    <td className="p-5 text-center font-semibold text-indigo-500 dark:text-indigo-400">
                      {row.professional === true ? (
                        <Check className="w-4 h-4 text-indigo-500 dark:text-indigo-400 mx-auto" />
                      ) : row.professional === false ? (
                        <X className="w-4 h-4 text-gray-300 mx-auto" />
                      ) : (
                        row.professional
                      )}
                    </td>
                    <td className="p-5 text-center font-semibold text-indigo-500 dark:text-indigo-400">
                      {row.enterprise === true ? (
                        <Check className="w-4 h-4 text-indigo-500 dark:text-indigo-400 mx-auto" />
                      ) : row.enterprise === false ? (
                        <X className="w-4 h-4 text-gray-300 mx-auto" />
                      ) : (
                        row.enterprise
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Footer />
      </div>
    </div>
  );
}
