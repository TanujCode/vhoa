import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Zap, 
  Layers, 
  Home, 
  Building2, 
  KeyRound, 
  TrendingUp, 
  Banknote,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';
import InteractiveAssistant from '../../components/marketing/InteractiveAssistant';
import { useTheme } from '../../context/ThemeContext';

export default function AboutPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const coreValues = [
    {
      title: "Security First",
      desc: "Bank-level encryption and rigorous compliance protocols protect your community's financial and personal data at all times.",
      icon: Shield,
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-50 dark:bg-blue-950/50",
    },
    {
      title: "Community Driven",
      desc: "Designed with input from board members, landlords, and residents to ensure every feature solves real-world neighborhood challenges.",
      icon: Users,
      iconColor: "text-indigo-600 dark:text-indigo-400",
      iconBg: "bg-indigo-50 dark:bg-indigo-950/50",
    },
    {
      title: "Speed & Simplicity",
      desc: "An intuitive interface that reduces administrative overhead, allowing managers to complete tasks in clicks, not hours.",
      icon: Zap,
      iconColor: "text-violet-600 dark:text-violet-400",
      iconBg: "bg-violet-50 dark:bg-violet-950/50",
    },
    {
      title: "Built to Scale",
      desc: "From a single ten-unit building to multi-state portfolios, our infrastructure seamlessly handles growth without compromise.",
      icon: Layers,
      iconColor: "text-teal-600 dark:text-teal-400",
      iconBg: "bg-teal-50 dark:bg-teal-950/50",
    }
  ];

  // Strictly Ordered: 1. HOA -> 2. Rental -> 3. Condo (Condo is last)
  const propertyTypes = [
    {
      title: "HOA Communities",
      badge: "Single Family & Subdivisions",
      desc: "Streamline violations, architectural requests, and dues collection for single-family home developments.",
      icon: Home,
      iconColor: "text-indigo-600 dark:text-indigo-400",
      iconBg: "bg-indigo-50 dark:bg-indigo-950/60",
      link: "/solutions/hoa"
    },
    {
      title: "Rental Portfolios",
      badge: "Landlords & Multi-Unit Portfolios",
      desc: "Handle multi-unit lease tracking, automated payment reminders, and tenant communications.",
      icon: KeyRound,
      iconColor: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-50 dark:bg-purple-950/60",
      link: "/solutions/rental"
    },
    {
      title: "Condo Associations",
      badge: "High-Rise & Multi-Unit Towers",
      desc: "Manage shared amenities, elevator bookings, and complex maintenance reserves with precision.",
      icon: Building2,
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-50 dark:bg-blue-950/60",
      link: "/solutions/condo"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-[#0f0720] transition-colors duration-300 font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar matching Homepage */}
      <Navbar />

      <main className="flex-1 overflow-x-hidden">

        {/* ─── SECTION 1: HERO / OUR MISSION ─── */}
        <section className="relative pt-3 sm:pt-5 lg:pt-6 pb-10 sm:pb-14 max-w-7xl mx-auto px-5 sm:px-8">
          {/* Ambient Background Glows */}
          <div className="absolute top-2 left-1/4 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-8 right-10 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-3.5 sm:space-y-4 text-left">
              
              {/* Rounded Badge with Sparkle */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] sm:text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider w-fit">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                OUR MISSION
              </div>

              {/* Main Headline */}
              <h1 className="text-2xl sm:text-3xl lg:text-[38px] font-bold text-slate-900 dark:text-white tracking-tight leading-[1.25]">
                Empowering <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-500 dark:from-indigo-400 dark:via-purple-300 dark:to-violet-400">HOA, Rental & Condo</span> communities across the USA
              </h1>

              {/* Narrative Paragraphs */}
              <div className="space-y-3 text-slate-600 dark:text-slate-300 text-xs sm:text-sm lg:text-[14.5px] leading-relaxed font-normal">
                <p>
                  Nestbloq was founded with a singular vision: to simplify the complex world of property management across <strong className="font-semibold text-slate-900 dark:text-white">HOA Communities, Rental Portfolios, and Condo Associations</strong>. We believe that community leaders, property managers, and board members should spend less time wrestling with outdated software and more time building thriving neighborhoods.
                </p>
                <p>
                  By bringing intuitive design and powerful automation tailored specifically for HOA governance, rental lease operations, and condo amenity tracking, we are setting a new standard for transparency, efficiency, and resident satisfaction across the nation.
                </p>
              </div>

            </div>

            {/* Right Card Column (Proportional Gradient Card with Floating Glassmorphic Badges) */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[400px] aspect-[4/4.5] rounded-[30px] bg-gradient-to-b from-[#6366F1] via-[#7048E8] to-[#845EF7] shadow-xl shadow-indigo-500/25 overflow-hidden flex flex-col justify-center items-center p-6 sm:p-7 select-none border border-white/20">
                
                {/* Background Ambient Particles / Glowing Orbs */}
                <div className="absolute top-8 left-10 w-2 h-2 rounded-full bg-white/90 blur-[1px] shadow-[0_0_12px_#fff] animate-pulse" />
                <div className="absolute top-20 right-12 w-2.5 h-2.5 rounded-full bg-white/80 blur-[1px] shadow-[0_0_14px_#fff]" />
                <div className="absolute bottom-12 right-14 w-2 h-2 rounded-full bg-white/90 blur-[1px] shadow-[0_0_10px_#fff] animate-ping" />
                <div className="absolute bottom-20 left-10 w-1.5 h-1.5 rounded-full bg-white/70 blur-[1px]" />
                
                {/* Subtle soft gradient background flares */}
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-900/40 rounded-full blur-2xl pointer-events-none" />

                {/* Floating Glassmorphism Cards */}
                <div className="relative z-10 w-full flex flex-col items-center gap-4.5">
                  
                  {/* Floating Card 1 (Growth Rate) */}
                  <div className="w-[85%] max-w-[245px] -mr-6 sm:-mr-8 backdrop-blur-xl bg-white/20 hover:bg-white/25 border border-white/35 rounded-2xl p-3.5 text-white shadow-lg shadow-black/10 transition-all duration-300 hover:scale-[1.03] cursor-default">
                    <div className="flex items-center gap-2 text-white/90 text-[10px] sm:text-[11px] font-bold tracking-widest uppercase">
                      <TrendingUp className="w-3.5 h-3.5 text-white" />
                      <span>GROWTH RATE</span>
                    </div>
                    <div className="text-lg sm:text-xl font-black tracking-tight text-white mt-1">
                      312%
                    </div>
                  </div>

                  {/* Floating Card 2 (Processed Annually) */}
                  <div className="w-[88%] max-w-[255px] -ml-6 sm:-ml-8 backdrop-blur-xl bg-white/20 hover:bg-white/25 border border-white/35 rounded-2xl p-3.5 text-white shadow-lg shadow-black/10 transition-all duration-300 hover:scale-[1.03] cursor-default">
                    <div className="flex items-center gap-2 text-white/90 text-[10px] sm:text-[11px] font-bold tracking-widest uppercase">
                      <Banknote className="w-3.5 h-3.5 text-white" />
                      <span>PROCESSED ANNUALLY</span>
                    </div>
                    <div className="text-lg sm:text-xl font-black tracking-tight text-white mt-1">
                      $1.2B
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </section>


        {/* ─── SECTION 2: WHAT WE STAND FOR (OUR CORE VALUES) ─── */}
        <section className="py-14 sm:py-16 bg-white/60 dark:bg-white/[0.02] border-y border-slate-200/70 dark:border-white/[0.06] relative">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            
            {/* Section Header */}
            <div className="text-center space-y-2 mb-10 sm:mb-12">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] sm:text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                WHAT WE STAND FOR
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Our Core Values
              </h2>
            </div>

            {/* 2x2 Values Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
              {coreValues.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="group bg-white dark:bg-[#180d2e]/70 border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-300 flex items-start gap-4"
                  >
                    {/* Icon Badge */}
                    <div className={`w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${item.iconBg} ${item.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="space-y-1 text-left">
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>


        {/* ─── SECTION 3: ONE PLATFORM, EVERY PROPERTY TYPE (Strict Order: HOA -> Rental -> Condo) ─── */}
        <section className="py-14 sm:py-16 max-w-7xl mx-auto px-5 sm:px-8">
          {/* Section Header */}
          <div className="text-center space-y-2 mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] sm:text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              SOLUTIONS FOR EVERY PROPERTY TYPE
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              One Platform, Every Property Type
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm sm:max-w-xl mx-auto leading-relaxed">
              Tailored workflows designed for the unique structural needs of different community associations and rental operations.
            </p>
          </div>

          {/* 3-Column Grid: 1. HOA | 2. Rental | 3. Condo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {propertyTypes.map((type, idx) => {
              const Icon = type.icon;
              return (
                <div
                  key={idx}
                  className="group bg-white dark:bg-[#180d2e]/70 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center text-center"
                >
                  {/* Icon Badge */}
                  <div className={`w-13 h-13 p-3.5 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${type.iconBg} ${type.iconColor}`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mt-4 mb-1.5">
                    {type.title}
                  </h3>

                  {/* Badge */}
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full mb-3">
                    {type.badge}
                  </span>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal mb-4">
                    {type.desc}
                  </p>

                  {/* Explore Link */}
                  <Link
                    to={type.link}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors uppercase tracking-wider mt-auto"
                  >
                    Explore Portal
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>


        {/* ─── SECTION 4: CALL TO ACTION (CTA) ─── */}
        <section className="py-12 sm:py-14 border-t border-slate-200/70 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.01]">
          <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center space-y-4">
            
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Ready to Try Nestbloq?
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                Join hundreds of HOA, Rental, and Condo communities modernizing their management operations today.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
              <Link
                to="/portal-select"
                className="px-8 py-3 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm rounded-full shadow-sm transition-all active:scale-95 text-center"
              >
                Get Started Now
              </Link>
              <Link
                to="/contact"
                className="px-8 py-3 bg-white dark:bg-white/[0.05] text-slate-700 dark:text-slate-200 border border-slate-250 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30 hover:bg-slate-50 dark:hover:bg-white/10 font-bold text-xs sm:text-sm rounded-full shadow-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                Contact Sales
              </Link>
            </div>

          </div>
        </section>

      </main>

      {/* Bottom Footer & Interactive Assistant matching Homepage */}
      <Footer />
      <InteractiveAssistant />
    </div>
  );
}
