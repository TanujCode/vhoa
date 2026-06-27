import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, CheckCircle, Wallet, Mail, FileText, 
  Shield, Sparkles, Clock, Star
} from 'lucide-react';
import Navbar from '../../../components/marketing/Navbar';
import Footer from '../../../components/marketing/Footer';

// Import high-fidelity image assets
import solutionRental from '../../../assets/solution_rental.png';
import heroClubDark from '../../../assets/hero_club_dark.png';
import heroGardenDark from '../../../assets/hero_garden_dark.png';
import heroCondoDark from '../../../assets/hero_condo_dark.png';

export default function RentalSolutionPage() {
  const features = [
    {
      title: "Automated Billing & Ledger",
      desc: "Automatically generate monthly rent rolls, issue secure digital invoices, and track payments inside an immutable ledger.",
      icon: Wallet,
      color: "text-blue-600 bg-blue-500/10 border border-blue-500/20",
      bg: "bg-blue-100/85 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-805/50 hover:shadow-lg hover:shadow-blue-500/[0.05] hover:border-blue-500/50 dark:hover:border-blue-500/40"
    },
    {
      title: "SMTP Notice Dispatcher",
      desc: "Identify overdue payments instantly and send legal reminder notifications via email or SMS with full compliance IP logging.",
      icon: Mail,
      color: "text-indigo-650 bg-indigo-500/10 border border-indigo-500/20",
      bg: "bg-indigo-100/85 dark:bg-indigo-950/30 border-indigo-200/80 dark:border-indigo-800/50 hover:shadow-lg hover:shadow-indigo-500/[0.05] hover:border-indigo-500/50 dark:hover:border-indigo-500/40"
    },
    {
      title: "Digital Lease Directory",
      desc: "Store executed contracts, occupant security deposits, and maintenance logs in isolated tenant directories.",
      icon: FileText,
      color: "text-violet-600 bg-violet-500/10 border border-violet-500/20",
      bg: "bg-violet-100/85 dark:bg-violet-950/30 border-violet-200/80 dark:border-violet-800/50 hover:shadow-lg hover:shadow-violet-500/[0.05] hover:border-violet-500/50 dark:hover:border-violet-500/40"
    }
  ];

  const faqs = [
    { q: "How secure is payment collection?", a: "Extremely secure. All credit card and bank transactions are processed via PCI-DSS Compliant Stripe integration. NestBloq never handles raw credentials directly on its servers." },
    { q: "Can we set custom rules for late fees?", a: "Yes, you can configure late fees, grace periods, and custom email notification triggers based on the unit layout rules." },
    { q: "Can tenants raise maintenance tickets directly?", a: "Yes, tenants receive their own secure portal credentials to submit service requests, upload photos, and track vendor dispatch ETAs." }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-tr from-[#f0f4fa] via-[#fafbfc] to-[#f0f4fa] dark:bg-gradient-to-tr dark:from-[#040c1a] dark:via-[#070611] dark:to-[#060b1e] transition-colors duration-300 font-sans relative">
      <Navbar />

      <div className="flex-1 overflow-x-hidden">
        {/* Dynamic Visual Accents / Auroras */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-300/10 dark:bg-blue-950/15 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse-glow" />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-indigo-200/10 dark:bg-indigo-950/10 rounded-full blur-[140px] pointer-events-none -z-10 animate-float-bob" />
        <div className="absolute bottom-1/4 left-10 w-[450px] h-[450px] bg-violet-400/5 dark:bg-violet-950/10 rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* Hero Section */}
        <section className="relative py-14 sm:py-20 px-5 sm:px-8 border-b border-slate-200/40 dark:border-white/[0.04] overflow-hidden">
          {/* Background glow auroras */}
          <div className="absolute inset-0 grid-bg opacity-[0.35] [mask-image:radial-gradient(ellipse_at_center,white_30%,transparent_70%)] pointer-events-none" />
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-gradient-radial from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-[20%] right-[-10%] w-[45vw] h-[45vw] bg-gradient-radial from-indigo-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            <div className="lg:col-span-5 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Rental Portfolio Management
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.05] tracking-tight">
                Unified Portals for <br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">Landlords & Renters.</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 font-normal leading-relaxed max-w-xl font-display">
                NestBloq streamlines monthly collections, tracks roster vacancies, and auto-dispatches late notices with secure verification tracking.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="btn-glow px-8 py-3.5 text-sm font-semibold text-white rounded-xl flex items-center gap-2">
                  Start for Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/contact" className="px-6 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                  Book a Demo
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 relative flex justify-center">
              {/* Visual highlight: 3D Stack / Frame */}
              <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-3xl overflow-hidden border border-slate-200/60 dark:border-white/[0.08] shadow-2xl group">
                <img 
                  src={solutionRental} 
                  alt="Premium Rental Space" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                
                {/* Floating stats card overlapping the image */}
                <div className="absolute bottom-5 left-5 right-5 p-4 sm:p-5 rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 text-white flex justify-between items-center gap-4">
                  <div className="space-y-0.5 text-left">
                    <p className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider">AVERAGE ROI</p>
                    <p className="text-sm sm:text-base font-black">45% Faster Dues</p>
                  </div>
                  <div className="w-px h-8 bg-white/20" />
                  <div className="space-y-0.5 text-left">
                    <p className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider">AUDITS TRACE</p>
                    <p className="text-sm sm:text-base font-black">100% Secure</p>
                  </div>
                </div>
              </div>
              
              {/* Subtle background glow under the card */}
              <div className="absolute -inset-4 bg-blue-500/10 rounded-[40px] blur-2xl pointer-events-none -z-10" />
            </div>
          </div>
        </section>

        {/* Social Proof / Logo Cloud */}
        <section className="py-12 border-b border-slate-200/40 dark:border-white/[0.04] bg-white/20 dark:bg-white/[0.01] backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-5 text-center space-y-6">
            <p className="text-[11px] font-black text-slate-400 dark:text-slate-400/70 uppercase tracking-widest">
              TRUSTED BY 12,000+ PROPERTY MANAGERS & Rental Portfolio Managers WORLDWIDE
            </p>
            <div className="flex flex-wrap justify-center items-center gap-12 sm:gap-20 text-sm font-black tracking-widest text-slate-500 dark:text-slate-300 opacity-60 dark:opacity-70">
              <span>BUILDER.CO</span>
              <span>METRO RENTALS</span>
              <span>COMMUNITY MANAGEMENT CORP</span>
              <span>APARTMENTS ALLIANCE</span>
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section className="py-24 max-w-7xl mx-auto px-5 sm:px-8 w-full relative">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
            <span className="text-blue-500 text-xs font-black uppercase tracking-wider">Core Capabilities</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Streamlined Collections, Zero Friction
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-display">
              NestBloq unifies payment workflows, roster vacancy profiles, and tenant support channels in one platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className={`p-6 rounded-2xl border backdrop-blur-md transition-all duration-300 space-y-4 text-left ${item.bg}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="text-xs text-slate-655 dark:text-slate-400 leading-relaxed font-display">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Premium Visual Gallery & Showcases */}
        <section className="py-24 border-t border-slate-200/40 dark:border-white/[0.04] bg-slate-50/30 dark:bg-[#070c0a]/40 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-[10%] left-[-10%] w-[30vw] h-[30vw] bg-blue-500/[0.03] rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-5 sm:px-8 w-full relative z-10">
            <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
              <span className="text-blue-500 text-xs font-black uppercase tracking-wider">Interactive Showcase</span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Virtual Communities & Amenities Showcase
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-display">
                Designed to connect landlords, property managers, and tenants inside a visually premium ecosystem. Explore shared spaces managed under the NestBloq portal framework.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {/* Card 1: Swimming Pool */}
              <div className="group relative rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/[0.08] shadow-md aspect-[4/3] bg-slate-900 flex flex-col justify-end p-6">
                <img 
                  src={heroClubDark} 
                  alt="Resort Swimming Pool" 
                  className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                <div className="relative text-left text-white space-y-1 z-10">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-blue-400">Amenity Center</span>
                  <h4 className="text-base font-black">Clubhouse Resort Pool</h4>
                  <p className="text-xs text-slate-300">Luxury pool deck and slots scheduling integration.</p>
                </div>
              </div>

              {/* Card 2: Fitness & Gym */}
              <div className="group relative rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/[0.08] shadow-md aspect-[4/3] bg-slate-900 flex flex-col justify-end p-6">
                <img 
                  src={heroCondoDark} 
                  alt="Modern Club Fitness" 
                  className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                <div className="relative text-left text-white space-y-1 z-10">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-violet-400">Wellness Gym</span>
                  <h4 className="text-base font-black">Modern Fitness Center</h4>
                  <p className="text-xs text-slate-300">High-end equipment reservations and tracking logs.</p>
                </div>
              </div>

              {/* Card 3: Community Garden */}
              <div className="group relative rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/[0.08] shadow-md aspect-[4/3] bg-slate-900 flex flex-col justify-end p-6">
                <img 
                  src={heroGardenDark} 
                  alt="Community Park Gardens" 
                  className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                <div className="relative text-left text-white space-y-1 z-10">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-400">Green Spaces</span>
                  <h4 className="text-base font-black">Botanical Gardens & Parks</h4>
                  <p className="text-xs text-slate-300">Lush walking tracks, pet zones, and outdoor areas.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Integrations Section */}
        <section className="py-24 border-t border-slate-200/40 dark:border-white/[0.04] relative">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 w-full text-center space-y-4 mb-16">
            <span className="text-blue-500 text-xs font-black uppercase tracking-wider">Enterprise Integrations</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Integrated with Leading SaaS Providers
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-display">
              NestBloq connects directly with Stripe, Plaid, SMTP servers, and Twilio to build secure rent-collection pipelines.
            </p>
          </div>
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-4 gap-6 px-5">
            {/* Stripe */}
            <div className="p-6 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/50 bg-indigo-100/85 dark:bg-indigo-950/30 backdrop-blur-md text-left space-y-2 hover:shadow-lg hover:shadow-indigo-500/[0.05] hover:border-indigo-500/50 dark:hover:border-indigo-500/40 transition-all duration-300">
              <span className="text-[10px] font-black text-indigo-655 dark:text-indigo-400 uppercase tracking-widest">01 / PAYMENTS</span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">Stripe Core</h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal font-display">Secure PCI-DSS compliant credit card and ACH transactions.</p>
            </div>
            {/* Plaid */}
            <div className="p-6 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/50 bg-indigo-100/85 dark:bg-indigo-950/30 backdrop-blur-md text-left space-y-2 hover:shadow-lg hover:shadow-indigo-500/[0.05] hover:border-indigo-500/50 dark:hover:border-indigo-500/40 transition-all duration-300">
              <span className="text-[10px] font-black text-indigo-655 dark:text-indigo-400 uppercase tracking-widest">02 / VERIFY</span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">Plaid Links</h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal font-display">Instant tenant account link and balance checking.</p>
            </div>
            {/* SMTP */}
            <div className="p-6 rounded-2xl border border-blue-200/80 dark:border-blue-800/50 bg-blue-100/85 dark:bg-blue-950/30 backdrop-blur-md text-left space-y-2 hover:shadow-lg hover:shadow-blue-500/[0.05] hover:border-blue-500/50 dark:hover:border-blue-500/40 transition-all duration-300">
              <span className="text-[10px] font-black text-blue-650 dark:text-blue-400 uppercase tracking-widest">03 / NOTICES</span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">SMTP Relay</h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal font-display">Auto-dispatch rent notices with legal delivery IP logs.</p>
            </div>
            {/* Twilio */}
            <div className="p-6 rounded-2xl border border-violet-200/80 dark:border-violet-800/50 bg-violet-100/85 dark:bg-violet-950/30 backdrop-blur-md text-left space-y-2 hover:shadow-lg hover:shadow-violet-500/[0.05] hover:border-violet-500/50 dark:hover:border-violet-500/40 transition-all duration-300">
              <span className="text-[10px] font-black text-violet-655 dark:text-violet-400 uppercase tracking-widest">04 / ALERTS</span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">Twilio SMS</h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal font-display">Text updates, payment confirmation tokens, and warnings.</p>
            </div>
          </div>
        </section>

        {/* ROI Statistics Section */}
        <section className="py-24 border-t border-slate-200/40 dark:border-white/[0.04] bg-slate-50/10 dark:bg-[#07060f]/20">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 w-full text-center space-y-4 mb-20">
            <span className="text-blue-500 text-xs font-black uppercase tracking-wider">Metrics that Matter</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Engineered for Rental Performance
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-display">
              Compare how properties operate before and after migrating to NestBloq's automated payment systems.
            </p>
          </div>
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 px-5">
            {/* Before */}
            <div className="p-8 rounded-3xl border border-violet-500/20 bg-violet-500/[0.02] backdrop-blur-md text-left space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-violet-500/30 text-[10px] font-semibold text-violet-500 bg-violet-500/10 uppercase tracking-wider">
                Traditional Landlordship
              </span>
              <ul className="space-y-4 text-xs text-slate-600 dark:text-slate-400 font-display">
                <li className="flex items-start gap-2.5">
                  <span className="text-violet-500 font-black">✕</span> <span>Chasing rent checks and cash logs manually every month.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-violet-550 font-black">✕</span> <span>Slow late notices with zero compliance logging.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-violet-550 font-black">✕</span> <span>Disorganized lease agreements and deposit balances.</span>
                </li>
              </ul>
            </div>
            {/* After */}
            <div className="p-8 rounded-3xl border border-indigo-500/30 bg-indigo-500/[0.03] backdrop-blur-md text-left space-y-4 shadow-xl shadow-indigo-500/5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/30 text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 uppercase tracking-wider">
                NestBloq Automated Portal
              </span>
              <ul className="space-y-4 text-xs text-slate-600 dark:text-slate-400 font-display">
                <li className="flex items-start gap-2.5">
                  <span className="text-indigo-400 font-black">✓</span> <span>100% digital ledgers with automatic recurring billing.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-indigo-455 font-black">✓</span> <span>Instantly dispatch late warnings via verified email and SMS logs.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-indigo-455 font-black">✓</span> <span>Isolated occupant directory for security deposits and lease logs.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="py-24 max-w-5xl mx-auto px-5 sm:px-8 w-full text-center relative z-10">
          <div className="bg-white/50 dark:bg-slate-900/45 backdrop-blur-xl border border-slate-200/70 dark:border-blue-500/20 p-8 sm:p-12 rounded-3xl space-y-6 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-center gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
            </div>
            <blockquote className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 max-w-3xl mx-auto leading-relaxed">
              "NestBloq completely turned our rent roll collection operations around. Late fees are applied automatically and the notice dispatch tool resolved our cashflow delays in 2 months. Unbelievable efficiency."
            </blockquote>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">Marcus Vance</p>
              <p className="text-xs text-slate-550 dark:text-slate-400">Managing Partner, Liberty Real Estate Ltd</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 max-w-3xl mx-auto px-5 sm:px-8 w-full border-t border-slate-200/40 dark:border-white/[0.04] relative z-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white text-center mb-12 animate-fade-in-up">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6 text-left">
            {faqs.map((faq, i) => (
              <div key={i} className="space-y-2 p-5 rounded-2xl bg-white/20 dark:bg-white/[0.01] border border-slate-200/40 dark:border-white/[0.04]">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">{faq.q}</h4>
                <p className="text-xs text-slate-555 dark:text-slate-455 leading-relaxed font-normal font-display">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-20 bg-gradient-to-br from-blue-500/5 via-[#f8fafc] to-indigo-500/10 dark:from-[#040c1a] dark:to-[#070611] border-t border-slate-200/40 dark:border-white/[0.04] text-center relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-6 px-5 relative z-10">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Ready to Streamline Your Rental Dues?
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto font-display">
              Get started for free today with a 14-day trial, or request an onboarding specialist to sync your tenant rolls.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-glow px-6 py-3 text-white font-bold text-xs rounded-xl shadow-md">
                Start Free Trial
              </Link>
              <Link to="/contact" className="px-6 py-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5">
                Contact Sales <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
