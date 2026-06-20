import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ShieldCheck, ArrowRight, HelpCircle } from 'lucide-react';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState('annual'); // 'monthly' or 'annual'

  const plans = [
    {
      name: "Starter",
      desc: "Perfect for self-managed small HOAs and societies.",
      units: "Up to 50 units",
      monthlyPrice: 29,
      annualPrice: 24,
      features: [
        "Resident Directory",
        "Announcements via Email",
        "Online Dues Collection (ACH/Card)",
        "Amenity Booking (1 amenity)",
        "Basic Support (Email only)"
      ],
      cta: "Start Free Trial",
      path: "/register",
      highlight: false
    },
    {
      name: "Professional",
      desc: "Best for medium communities & active property managers.",
      units: "Up to 250 units",
      monthlyPrice: 79,
      annualPrice: 64,
      features: [
        "All Starter Features",
        "Announcements (Email + SMS + Text)",
        "Violation tracking with attachments",
        "Amenity Booking (Unlimited)",
        "Digital Assembly & E-Voting",
        "NestBloq AI Resident Assistant",
        "Priority Support (Email + Chat)"
      ],
      cta: "Get Started Free",
      path: "/register",
      highlight: true
    },
    {
      name: "Enterprise",
      desc: "Custom tooling for large portfolios and developers.",
      units: "Unlimited units",
      monthlyPrice: "Custom",
      annualPrice: "Custom",
      features: [
        "All Professional Features",
        "Custom White-labeled Resident App",
        "Dedicated Account Success Manager",
        "Advanced Security & SAML SSO",
        "Custom Accounting Integrations",
        "API access & custom reporting widgets"
      ],
      cta: "Contact Sales",
      path: "/contact",
      highlight: false
    }
  ];

  const compareFeatures = [
    { name: "Max Community Units", starter: "50", professional: "250", enterprise: "Unlimited" },
    { name: "Online Payments", starter: true, professional: true, enterprise: true },
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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#120824] transition-colors duration-200 overflow-x-hidden font-sans text-slate-900 dark:text-slate-100">
      <Navbar />

      {/* --- Page Header --- */}
      <header className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center space-y-6">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#00A878]/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <span className="text-[#00A878] text-xs font-bold uppercase tracking-wider">Pricing Plans</span>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          Flexible Pricing for Every Community Size
        </h1>
        <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">
          No hidden fees or locked-in setup costs. Scale your plan as your community grows.
        </p>

        {/* --- Toggle switch --- */}
        <div className="flex items-center justify-center gap-3 pt-6">
          <span className={`text-xs font-bold uppercase tracking-wider ${billingCycle === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-gray-400'}`}>
            Monthly Billing
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            className="w-14 h-8 bg-slate-200 dark:bg-slate-800 rounded-full p-1 transition-colors duration-200 focus:outline-none flex items-center relative"
          >
            <div
              className={`w-6 h-6 rounded-full bg-[#00A878] shadow-md transform transition-transform duration-200 ${
                billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${billingCycle === 'annual' ? 'text-slate-900 dark:text-white' : 'text-gray-400'}`}>
            Annual Billing
            <span className="bg-[#00A878]/10 text-[#00A878] text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Save 20%</span>
          </span>
        </div>
      </header>

      {/* --- Pricing Tiers Grid --- */}
      <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => {
            const isCustom = plan.monthlyPrice === "Custom";
            const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;

            return (
              <div
                key={idx}
                className={`relative flex flex-col justify-between p-8 rounded-3xl border shadow-md hover:shadow-xl transition-all duration-300 ${
                  plan.highlight
                    ? 'border-violet-500 bg-gradient-to-br from-violet-50/70 via-white to-indigo-50/50 dark:from-[#1b0a34] dark:via-[#120824] dark:to-[#0c0418] scale-100 lg:scale-[1.03] z-10 shadow-violet-500/5'
                    : 'border-slate-200/80 dark:border-white/[0.04] bg-white dark:bg-gradient-to-br dark:from-[#120824]/90 dark:to-[#0c0418]/95'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#00A878] text-white font-extrabold text-[10px] uppercase rounded-full tracking-wider shadow-sm">
                    Recommended Plan
                  </span>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{plan.desc}</p>
                  </div>

                  <div className="py-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{plan.units}</p>
                    <div className="flex items-baseline gap-1 mt-1 text-slate-900 dark:text-white">
                      {isCustom ? (
                        <span className="text-3xl font-extrabold">{price}</span>
                      ) : (
                        <>
                          <span className="text-4xl font-extrabold">${price}</span>
                          <span className="text-xs text-gray-400 font-bold uppercase">/ Month</span>
                        </>
                      )}
                    </div>
                    {!isCustom && billingCycle === 'annual' && (
                      <p className="text-[10px] text-[#00A878] font-bold mt-1">Billed annually (${price * 12}/yr)</p>
                    )}
                  </div>

                  {/* Bullet list */}
                  <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/[0.05]">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">Features included:</h4>
                    <div className="space-y-2.5">
                      {plan.features.map((feature, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-650 dark:text-slate-350">
                          <Check className="w-4 h-4 text-[#00A878] shrink-0 mt-0.5" />
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
                        ? 'bg-[#00A878] hover:bg-[#008f65] text-white'
                        : 'bg-slate-50 dark:bg-white/[0.02] text-slate-800 dark:text-white border border-slate-200 dark:border-white/[0.08] hover:border-[#00A878] dark:hover:border-[#00A878] hover:bg-slate-100 dark:hover:bg-white/[0.04]'
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

      {/* --- Features Comparison Matrix --- */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Compare Feature Details</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Evaluate detailed module differences across the three packages</p>
        </div>

        <div className="bg-white/80 dark:bg-[#180a2d]/80 border border-slate-200/80 dark:border-white/[0.06] rounded-3xl overflow-hidden shadow-md backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-[#0a0414] text-slate-800 dark:text-slate-200 border-b border-slate-200/80 dark:border-white/[0.06] font-bold uppercase tracking-wider">
                  <th className="p-5">Feature Module</th>
                  <th className="p-5 text-center">Starter</th>
                  <th className="p-5 text-center">Professional</th>
                  <th className="p-5 text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-700 dark:text-slate-350">
                {compareFeatures.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="p-5 font-semibold text-slate-900 dark:text-white">{row.name}</td>
                    <td className="p-5 text-center font-semibold">
                      {row.starter === true ? (
                        <Check className="w-4 h-4 text-[#00A878] mx-auto" />
                      ) : row.starter === false ? (
                        <X className="w-4 h-4 text-gray-300 mx-auto" />
                      ) : (
                        row.starter
                      )}
                    </td>
                    <td className="p-5 text-center font-semibold text-[#00A878]">
                      {row.professional === true ? (
                        <Check className="w-4 h-4 text-[#00A878] mx-auto" />
                      ) : row.professional === false ? (
                        <X className="w-4 h-4 text-gray-300 mx-auto" />
                      ) : (
                        row.professional
                      )}
                    </td>
                    <td className="p-5 text-center font-semibold text-[#00A878]">
                      {row.enterprise === true ? (
                        <Check className="w-4 h-4 text-[#00A878] mx-auto" />
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

      {/* --- Guarantee and Security Note --- */}
      <section className="bg-slate-100/50 dark:bg-[#0a0414]/50 py-12 border-t border-slate-200/80 dark:border-white/[0.05] transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#00A878]/10 text-[#00A878] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">30-Day Money-Back Guarantee</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Test NestBloq fully. If you're not completely satisfied, we will issue a full refund, no questions asked.</p>
            </div>
          </div>
          <Link
            to="/contact"
            className="px-5 py-3 bg-white dark:bg-[#1a102b] text-slate-800 dark:text-white border border-slate-200 dark:border-white/[0.08] hover:border-[#00A878] dark:hover:border-[#00A878] font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all flex items-center gap-1 shrink-0"
          >
            Have Questions? Ask Sales <HelpCircle className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
