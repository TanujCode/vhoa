import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, CheckCircle, Wrench, Shield, Clock,
  Sliders, Sparkles, Star
} from 'lucide-react';
import Navbar from '../../../components/marketing/Navbar';
import Footer from '../../../components/marketing/Footer';

// Import high-fidelity image assets
import solutionApartment from '../../../assets/solution_apartment.png';
import heroClubDark from '../../../assets/hero_club_dark.png';
import heroParkDark from '../../../assets/hero_park_dark.png';
import heroGardenDark from '../../../assets/hero_garden_dark.png';

export default function ApartmentSolutionPage() {
  const features = [
    {
      title: "Kanban Service Desk",
      desc: "Track resident maintenance requests, attach photos, and assign urgency ratings within an easy-to-use Kanban interface.",
      icon: Wrench,
      color: "text-blue-650 bg-blue-500/10 border border-blue-500/20",
      bg: "bg-blue-100/85 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-800/50 hover:shadow-lg hover:shadow-blue-500/[0.05] hover:border-blue-500/50 dark:hover:border-blue-500/40"
    },
    {
      title: "Contractor Network Dispatch",
      desc: "Connect tickets directly with local verified vendors, track arrival times, and automatically issue entry codes.",
      icon: Sliders,
      color: "text-violet-650 bg-violet-500/10 border border-violet-500/20",
      bg: "bg-violet-100/85 dark:bg-violet-950/30 border-violet-200/80 dark:border-violet-800/50 hover:shadow-lg hover:shadow-violet-500/[0.05] hover:border-violet-500/50 dark:hover:border-violet-500/40"
    },
    {
      title: "Temporary Visitor Passes",
      desc: "Assign time-limited OTP entry codes for incoming delivery workers, vendors, or housekeeping teams.",
      icon: Shield,
      color: "text-blue-600 bg-blue-500/10 border border-blue-500/20",
      bg: "bg-blue-100/85 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-805/50 hover:shadow-lg hover:shadow-blue-500/[0.05] hover:border-blue-500/50 dark:hover:border-blue-500/40"
    }
  ];

  const faqs = [
    { q: "How do residents log tickets?", a: "Residents simply log into their NestBloq account or converse with the integrated AI Copilot to log tickets with description notes and photo attachments." },
    { q: "Can we integrate existing preferred contractors?", a: "Yes, you can import your own preferred local contractor roster, customize contract rules, and set flat dispatch pricing parameters." },
    { q: "Can we track billing for parts?", a: "Yes, technicians can attach digital receipts and expense descriptions directly to the ticket log, updating the manager invoice boards." }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-tr from-[#f0f5fa] via-[#ebf2fa] to-[#f0f5fa] dark:bg-gradient-to-tr dark:from-[#040913] dark:via-[#07060f] dark:to-[#080b15] transition-colors duration-300 font-sans relative">
      <Navbar />

      <div className="flex-1 overflow-x-hidden">
        {/* Dynamic Visual Accents / Auroras */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-300/10 dark:bg-blue-950/15 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse-glow" />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-indigo-200/10 dark:bg-indigo-950/10 rounded-full blur-[140px] pointer-events-none -z-10 animate-float-bob" />
        <div className="absolute bottom-1/4 left-10 w-[450px] h-[450px] bg-indigo-400/5 dark:bg-indigo-950/10 rounded-full blur-[100px] pointer-events-none -z-10" />

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
                Apartment Complex Operations
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.05] tracking-tight">
                Unified Operations for <br />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 bg-clip-text text-transparent">Multi-Family Communities.</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 font-normal leading-relaxed max-w-xl font-display">
                NestBloq unifies work orders, local vendor dispatch lists, and guest entry management under a single administrative board.
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
                  src={solutionApartment} 
                  alt="Premium Apartment Towers" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                
                {/* Floating stats card overlapping the image */}
                <div className="absolute bottom-5 left-5 right-5 p-4 sm:p-5 rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 text-white flex justify-between items-center gap-4">
                  <div className="space-y-0.5 text-left">
                    <p className="text-[10px] text-blue-400 font-extrabold uppercase tracking-wider">AVG RESOLUTION</p>
                    <p className="text-sm sm:text-base font-black">3x Faster</p>
                  </div>
                  <div className="w-px h-8 bg-white/20" />
                  <div className="space-y-0.5 text-left">
                    <p className="text-[10px] text-blue-400 font-extrabold uppercase tracking-wider">VENDOR CONNECTION</p>
                    <p className="text-sm sm:text-base font-black">Automated</p>
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
              TRUSTED BY 12,000+ PROPERTY MANAGERS & Apartment Towers WORLDWIDE
            </p>
            <div className="flex flex-wrap justify-center items-center gap-12 sm:gap-20 text-sm font-black tracking-widest text-slate-500 dark:text-slate-300 opacity-60 dark:opacity-70">
              <span>METRO TOWERS GROUP</span>
              <span>SKYLINE RESIDENCES</span>
              <span>FEDERAL MANAGEMENT</span>
              <span>TOWNSHIP GROUP</span>
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section className="py-24 max-w-7xl mx-auto px-5 sm:px-8 w-full relative">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
            <span className="text-blue-500 text-xs font-black uppercase tracking-wider">Core Capabilities</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Integrated Maintenance & Dispatch Control
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-display">
              Unify work tickets, technician assignments, and entrance security codes in one portal.
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
                  <p className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed font-display">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Premium Visual Gallery & Showcases */}
        <section className="py-24 border-t border-slate-200/40 dark:border-white/[0.04] bg-slate-50/30 dark:bg-[#040913]/40 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-[10%] left-[-10%] w-[30vw] h-[30vw] bg-blue-500/[0.03] rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-5 sm:px-8 w-full relative z-10">
            <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
              <span className="text-blue-500 text-xs font-black uppercase tracking-wider">Interactive Showcase</span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Virtual Communities & Amenities Showcase
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-display">
                Designed to connect residents, landlords, and complex managers inside a visually premium ecosystem. Explore shared spaces managed under the NestBloq portal framework.
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
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-blue-400">Pool Area</span>
                  <h4 className="text-base font-black">Resort Amenity Pool</h4>
                  <p className="text-xs text-slate-350">Luxury pool decks, slot bookings, and deck chair logs.</p>
                </div>
              </div>

              {/* Card 2: Courtyard Parks */}
              <div className="group relative rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/[0.08] shadow-md aspect-[4/3] bg-slate-900 flex flex-col justify-end p-6">
                <img 
                  src={heroParkDark} 
                  alt="Society Courtyard Parks" 
                  className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                <div className="relative text-left text-white space-y-1 z-10">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-400">Green Courtyard</span>
                  <h4 className="text-base font-black">Society Courtyard Parks</h4>
                  <p className="text-xs text-slate-350">Paved walking trails, shaded seating, and kids zones.</p>
                </div>
              </div>

              {/* Card 3: Terrace Gardens */}
              <div className="group relative rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/[0.08] shadow-md aspect-[4/3] bg-slate-900 flex flex-col justify-end p-6">
                <img 
                  src={heroGardenDark} 
                  alt="Terrace Garden Paths" 
                  className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                <div className="relative text-left text-white space-y-1 z-10">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-400">Green Spaces</span>
                  <h4 className="text-base font-black">Terrace Garden Paths</h4>
                  <p className="text-xs text-slate-350">Exquisite rooftop shrubberies, flowers, and seating areas.</p>
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
              NestBloq connects directly with OpenAI, local contractor registries, and Twilio to build robust ticket resolution pipelines.
            </p>
          </div>
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-4 gap-6 px-5">
            {/* OpenAI */}
            <div className="p-6 rounded-2xl border border-blue-200/80 dark:border-blue-800/50 bg-blue-100/85 dark:bg-blue-950/30 backdrop-blur-md text-left space-y-2 hover:shadow-lg hover:shadow-blue-500/[0.05] hover:border-blue-500/50 dark:hover:border-blue-500/40 transition-all duration-300">
              <span className="text-[10px] font-black text-blue-655 dark:text-blue-400 uppercase tracking-widest">01 / INTELLIGENCE</span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">AI Assistant</h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal font-display">Log work orders and check maintenance history logs automatically.</p>
            </div>
            {/* Twilio */}
            <div className="p-6 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/50 bg-indigo-100/85 dark:bg-indigo-950/30 backdrop-blur-md text-left space-y-2 hover:shadow-lg hover:shadow-indigo-500/[0.05] hover:border-indigo-500/50 dark:hover:border-indigo-500/40 transition-all duration-300">
              <span className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest">02 / DISPATCH</span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">Twilio SMS</h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal font-display">Auto-dispatch repair warnings and technician assignments via text message.</p>
            </div>
            {/* Security Codes */}
            <div className="p-6 rounded-2xl border border-violet-200/80 dark:border-violet-800/50 bg-violet-100/85 dark:bg-violet-950/30 backdrop-blur-md text-left space-y-2 hover:shadow-lg hover:shadow-violet-500/[0.05] hover:border-violet-500/50 dark:hover:border-violet-500/40 transition-all duration-300">
              <span className="text-[10px] font-black text-violet-650 dark:text-violet-400 uppercase tracking-widest">03 / SECURITY CODES</span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">Twilio OTP</h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal font-display">Issue time-limited guest entrance code SMS messages instantly.</p>
            </div>
            {/* Stripe */}
            <div className="p-6 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/50 bg-indigo-100/85 dark:bg-indigo-950/30 backdrop-blur-md text-left space-y-2 hover:shadow-lg hover:shadow-indigo-500/[0.05] hover:border-indigo-500/50 dark:hover:border-indigo-500/40 transition-all duration-300">
              <span className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest">04 / PARTS BILLING</span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">Stripe Checkout</h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal font-display">Enable residents to pay for custom contractor service charges online.</p>
            </div>
          </div>
        </section>

        {/* ROI Statistics Section */}
        <section className="py-24 border-t border-slate-200/40 dark:border-white/[0.04] bg-slate-50/10 dark:bg-[#07060f]/20">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 w-full text-center space-y-4 mb-20">
            <span className="text-blue-500 text-xs font-black uppercase tracking-wider">Metrics that Matter</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Engineered for Multi-Family Complex Operations
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-display">
              Compare how complex managers operate before and after migrating to NestBloq's dispatch boards.
            </p>
          </div>
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 px-5">
            {/* Before */}
            <div className="p-8 rounded-3xl border border-violet-500/20 bg-violet-500/[0.02] backdrop-blur-md text-left space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-violet-500/30 text-[10px] font-semibold text-violet-500 bg-violet-500/10 uppercase tracking-wider">
                Traditional Complex Management
              </span>
              <ul className="space-y-4 text-xs text-slate-600 dark:text-slate-400 font-display">
                <li className="flex items-start gap-2.5">
                  <span className="text-violet-500 font-black"></span> <span>Days wasted calling contractors to resolve simple plumbing issues.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-violet-500 font-black"></span> <span>Vague maintenance tracking with zero photo verification logs.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-violet-500 font-black"></span> <span>Manually writing visitor logs on paper clipboard files.</span>
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
                  <span className="text-indigo-400 font-black"></span> <span>Kanban tickets assigned automatically to nearby contractors.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-indigo-400 font-black"></span> <span>Clean digital audits showing exact vendor entry & completion times.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-indigo-400 font-black"></span> <span>Time-limited OTP visitor codes dispatched automatically.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="py-24 max-w-5xl mx-auto px-5 sm:px-8 w-full text-center relative z-10">
          <div className="bg-white/50 dark:bg-[#040913]/45 backdrop-blur-xl border border-slate-200/70 dark:border-blue-500/20 p-8 sm:p-12 rounded-3xl space-y-6 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-center gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
            </div>
            <blockquote className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 max-w-3xl mx-auto leading-relaxed">
              "NestBloq cut our average maintenance resolution timeframe from 3 days to under 5 hours. The automated contractor integration handles security codes and vendor updates perfectly."
            </blockquote>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">Eric Stone</p>
              <p className="text-xs text-slate-555 dark:text-slate-400">Facilities Director, Metro Heights Towers</p>
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
        <section className="py-20 bg-gradient-to-br from-blue-500/5 via-[#ebf2fa] to-indigo-500/10 dark:from-[#040913] dark:to-[#07060f] border-t border-slate-200/40 dark:border-white/[0.04] text-center relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-6 px-5 relative z-10">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Streamline Apartment Service Tickets
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto font-display">
              Get started for free today with a 14-day trial, or request an onboarding specialist to customize your maintenance categories.
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
