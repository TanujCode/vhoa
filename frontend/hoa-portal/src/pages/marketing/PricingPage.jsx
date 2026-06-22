import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ShieldCheck, ArrowRight, HelpCircle, Headset, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';
import heroCondoLight from '../../assets/hero_condo_light.png';
import communityHero from '../../assets/community_hero.png';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState('annual'); // 'monthly' or 'annual'

  const plans = [
    {
      name: "Starter",
      desc: "Perfect for self-managed small HOAs, condos, and societies.",
      units: "Up to 50 units",
      monthlyPrice: 49,
      annualPrice: 39,
      features: [
        "Resident & Owner Roster Directory",
        "Expense Tracking & Statements",
        "Online Dues Collection (ACH/Card)",
        "Single Amenity Booking Scheduler",
        "Email Notifications & Bulletins",
        "Standard L1 Email Support"
      ],
      cta: "Select Starter",
      path: "/register",
      highlight: false
    },
    {
      name: "Growth",
      desc: "Best for active communities, board members & managers.",
      units: "Up to 150 units",
      monthlyPrice: 99,
      annualPrice: 79,
      features: [
        "All Starter Features Included",
        "Maintenance Ticket Kanban Board",
        "Automated Late Dues Fee Rules",
        "SMS Alerts & Broadcast System",
        "Unlimited Amenity Facility Booking",
        "Customizable Directory Fields",
        "Priority Email & Chat Support"
      ],
      cta: "Select Growth",
      path: "/register",
      highlight: true
    },
    {
      name: "Professional",
      desc: "Custom workflows and scale for large portfolios & builders.",
      units: "Unlimited units",
      monthlyPrice: 199,
      annualPrice: 159,
      features: [
        "All Growth Features Included",
        "Dedicated Customer Success Manager",
        "Advanced API & Webhook Access",
        "Custom Automated Workflows",
        "White-Labeled Portal Application",
        "Digital Assemblies & SHA-256 E-Voting",
        "24/7 Telephone Priority Dispatch"
      ],
      cta: "Select Professional",
      path: "/register",
      highlight: false
    }
  ];

  const compareFeatures = [
    { name: "Max Community Units", starter: "50", professional: "150", enterprise: "Unlimited" },
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
      <header className="relative w-full overflow-hidden py-24 sm:py-32 border-b border-slate-200/50 dark:border-white/[0.04] bg-slate-900">
        {/* Background Image of Modern Apartments */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroCondoLight}
            alt="Modern Residential Complexes"
            className="w-full h-full object-cover object-center opacity-40 select-none pointer-events-none"
          />
          {/* Dark Glassmorphic/Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-950/75 to-[#120824] dark:to-[#120824]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-violet-500/20 border border-violet-400/40 text-violet-300 text-[10px] font-extrabold tracking-widest uppercase">
            Transparent pricing for every community
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl mx-auto">
            Choose the plan that fits your community's needs
          </h1>
          
          <p className="text-base sm:text-lg text-slate-350 max-w-xl mx-auto leading-relaxed">
            No hidden setup fees or locked-in contracts. Scale your package as your housing list grows.
          </p>

          {/* --- Billing Selector Switch --- */}
          <div className="flex items-center justify-center gap-3 pt-6">
            <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>
              Monthly Billing
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="w-14 h-8 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-full p-1 transition-colors duration-200 focus:outline-none flex items-center relative"
              aria-label="Toggle Billing Cycle"
            >
              <div
                className={`w-6 h-6 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 shadow-md transform transition-transform duration-200 ${
                  billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${billingCycle === 'annual' ? 'text-white' : 'text-slate-400'}`}>
              Annual Billing
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase border border-emerald-500/35">Save 20%</span>
            </span>
          </div>
        </div>
      </header>

      {/* --- Pricing Tiers Grid --- */}
      <section className="py-20 max-w-7xl mx-auto px-5 sm:px-8 w-full relative z-10">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-violet-600/[0.04] dark:bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-teal-500/[0.03] dark:bg-teal-500/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch relative z-10">
          {plans.map((plan, idx) => {
            const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;

            return (
              <div
                key={idx}
                className={`relative flex flex-col justify-between p-8 rounded-3xl border shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                  plan.highlight
                    ? 'border-violet-500 dark:border-violet-400 bg-white dark:bg-gradient-to-br dark:from-[#1b0a34] dark:via-[#120824] dark:to-[#0c0418] scale-100 lg:scale-[1.03] z-10 shadow-violet-500/5'
                    : 'border-slate-200/80 dark:border-white/[0.05] bg-white dark:bg-gradient-to-br dark:from-[#120824]/90 dark:to-[#0c0418]/95'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-extrabold text-[10px] uppercase rounded-full tracking-wider shadow-md shadow-violet-500/20">
                    MOST POPULAR
                  </span>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{plan.desc}</p>
                  </div>

                  <div className="py-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{plan.units}</p>
                    <div className="flex items-baseline gap-1 mt-1 text-slate-900 dark:text-white">
                      <span className="text-4xl font-extrabold tracking-tight">${price}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">/ Month</span>
                    </div>
                    {billingCycle === 'annual' && (
                      <p className="text-[10px] text-emerald-500 dark:text-emerald-450 font-bold mt-1.5">Billed annually (${price * 12}/yr)</p>
                    )}
                  </div>

                  {/* Bullet list */}
                  <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/[0.05]">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">Features included:</h4>
                    <div className="space-y-3">
                      {plan.features.map((feature, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-650 dark:text-slate-355 leading-relaxed">
                          <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <Link
                    to={plan.path}
                    className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all ${
                      plan.highlight
                        ? 'bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25'
                        : 'bg-slate-50 dark:bg-white/[0.02] text-slate-800 dark:text-white border border-slate-200 dark:border-white/[0.08] hover:border-violet-500 dark:hover:border-violet-500 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>
            );
          })}
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
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
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
            <p className="text-sm text-slate-500 dark:text-slate-455 leading-relaxed font-normal">
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
                <div key={i} className="flex items-center gap-2 text-xs text-slate-650 dark:text-slate-350">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
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
              <p className="text-sm text-slate-350 leading-relaxed font-normal">
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
                  <th className="p-5 text-center">Starter</th>
                  <th className="p-5 text-center">Growth</th>
                  <th className="p-5 text-center">Professional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-700 dark:text-slate-350">
                {compareFeatures.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="p-5 font-semibold text-slate-900 dark:text-white">{row.name}</td>
                    <td className="p-5 text-center font-semibold">
                      {row.starter === true ? (
                        <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mx-auto" />
                      ) : row.starter === false ? (
                        <X className="w-4 h-4 text-gray-300 mx-auto" />
                      ) : (
                        row.starter
                      )}
                    </td>
                    <td className="p-5 text-center font-semibold text-emerald-500 dark:text-emerald-400">
                      {row.professional === true ? (
                        <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mx-auto" />
                      ) : row.professional === false ? (
                        <X className="w-4 h-4 text-gray-300 mx-auto" />
                      ) : (
                        row.professional
                      )}
                    </td>
                    <td className="p-5 text-center font-semibold text-emerald-500 dark:text-emerald-400">
                      {row.enterprise === true ? (
                        <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mx-auto" />
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
