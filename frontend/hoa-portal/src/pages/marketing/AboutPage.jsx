import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Zap, 
  Sparkles,
  TrendingUp,
  Check,
  X,
  Lock,
  Eye
} from 'lucide-react';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';
import InteractiveAssistant from '../../components/marketing/InteractiveAssistant';
import { useTheme } from '../../context/ThemeContext';

export default function AboutPage() {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-[#0f172a] transition-colors duration-300 font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar />

      <main className="flex-1 overflow-x-hidden">

        {/* ══════════════════════════════════════════════════════════════
            SECTION 1: HERO / OUR MISSION
        ══════════════════════════════════════════════════════════════ */}
        <section className="relative pt-6 sm:pt-8 lg:pt-10 pb-10 sm:pb-12 max-w-6xl mx-auto px-5 sm:px-8">
          {/* Ambient Background Glows */}
          <div className="absolute top-2 left-1/4 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-6 right-10 w-72 h-72 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-3.5 text-left">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 dark:bg-violet-500/20 border border-violet-500/20 text-[10px] sm:text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider w-fit">
                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                OUR MISSION
              </div>

              {/* Main Headline */}
              <h1 className="font-display text-2xl sm:text-3xl lg:text-[34px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Empowering <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-500 dark:from-indigo-400 dark:via-purple-300 dark:to-violet-400">Rental Landlords &amp; Portfolios</span> across the USA
              </h1>

              {/* Narrative Paragraphs */}
              <div className="space-y-3 text-slate-600 dark:text-slate-300 text-xs sm:text-[13.5px] leading-relaxed font-normal">
                <p>
                  NestBloq was founded with a singular vision: to simplify the complex world of property operations for <strong className="font-semibold text-slate-900 dark:text-white">independent landlords, residential property owners, and rental portfolio managers</strong> across the USA.
                </p>
                <p>
                  We believe property managers and landlords should spend less time wrestling with manual spreadsheets, paper leases, and fragmented payment tracking, and more time maximizing occupancy, revenue, and tenant relationships.
                </p>
                <p>
                  By delivering intuitive design and automated tools for digital lease creation, real-time rent ledgers, and fast maintenance dispatch, we are setting a new standard for modern, effortless rental management.
                </p>
              </div>

            </div>

            {/* Right Card Column (Compact Gradient Card with Glassmorphic Stats) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[340px] aspect-[4/4.3] rounded-[24px] bg-gradient-to-br from-[#6366F1] via-[#7048E8] to-[#845EF7] shadow-xl shadow-indigo-500/20 overflow-hidden flex flex-col justify-between p-5 select-none border border-white/20">
                
                {/* Background Ambient Particles & Soft Glows */}
                <div className="absolute top-6 left-8 w-2 h-2 rounded-full bg-white/90 blur-[1px] shadow-[0_0_12px_#fff] animate-pulse" />
                <div className="absolute top-16 right-10 w-2 h-2 rounded-full bg-white/80 blur-[1px] shadow-[0_0_14px_#fff]" />
                <div className="absolute bottom-10 right-12 w-1.5 h-1.5 rounded-full bg-white/90 blur-[1px]" />
                <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/20 rounded-full blur-xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-indigo-900/40 rounded-full blur-xl pointer-events-none" />

                {/* Top card header */}
                <div className="relative z-10 flex items-center justify-between text-white/90">
                  <div>
                    <span className="text-[9px] font-bold tracking-widest text-indigo-200 uppercase block">PLATFORM VELOCITY</span>
                    <span className="text-xs font-bold text-white">National Footprint</span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <TrendingUp className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>

                {/* Glassmorphism Stat Cards */}
                <div className="relative z-10 space-y-2.5 my-auto">
                  
                  {/* Stat Card 1 (Growth Rate) */}
                  <div className="backdrop-blur-xl bg-white/15 hover:bg-white/20 border border-white/30 rounded-xl p-3 text-white shadow-md shadow-black/5 transition-all duration-300">
                    <div className="text-indigo-100 text-[9px] font-bold tracking-wider uppercase">
                      GROWTH RATE
                    </div>
                    <div className="font-display text-2xl font-black tracking-tight text-white mt-0.5">
                      312%
                    </div>
                    <p className="text-[10px] text-white/80">
                      Year-over-year rental portfolio expansion
                    </p>
                  </div>

                  {/* Stat Card 2 (Processed Annually) */}
                  <div className="backdrop-blur-xl bg-white/15 hover:bg-white/20 border border-white/30 rounded-xl p-3 text-white shadow-md shadow-black/5 transition-all duration-300">
                    <div className="text-indigo-100 text-[9px] font-bold tracking-wider uppercase">
                      PROCESSED ANNUALLY
                    </div>
                    <div className="font-display text-2xl font-black tracking-tight text-white mt-0.5">
                      $1.2B
                    </div>
                    <p className="text-[10px] text-white/80">
                      In online rent collections, security deposits &amp; ledger payments
                    </p>
                  </div>

                </div>

                {/* Bottom card footer */}
                <div className="relative z-10 flex items-center justify-between text-[10px] text-white/80 border-t border-white/15 pt-2.5">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    On-Time Rent Rate 99.2%
                  </span>
                  <span>&gt; 28.4K+ Leases Managed</span>
                </div>

              </div>
            </div>

          </div>
        </section>


        {/* ══════════════════════════════════════════════════════════════
            SECTION 2: OUR PURPOSE & HORIZON (GUIDING PRINCIPLES)
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-10 sm:py-12 bg-slate-50/70 dark:bg-white/[0.02] border-t border-slate-200/70 dark:border-white/[0.06] relative">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            
            {/* Header */}
            <div className="text-center space-y-1.5 mb-7 sm:mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 dark:bg-violet-500/20 border border-violet-500/20 text-[10px] sm:text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                GUIDING PRINCIPLES
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Our Purpose &amp; Horizon
              </h2>
            </div>

            {/* 2-Column Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 max-w-4xl mx-auto">
              
              {/* Card 1: What We Do Today */}
              <div className="bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-white/10 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 text-[10px] font-bold tracking-wider uppercase mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-sm bg-violet-600 dark:bg-violet-400" />
                    OUR MISSION
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2.5">
                    What We Do Today
                  </h3>
                  <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 italic leading-relaxed font-normal">
                    &ldquo;To simplify residential rental management so that independent landlords, property managers, and tenants spend less time on administration and more time enjoying hassle-free renting.&rdquo;
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-2 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 rounded-lg">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Empowering independent landlords and residential property managers.</span>
                </div>
              </div>

              {/* Card 2: Where We're Going */}
              <div className="bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-white/10 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold tracking-wider uppercase mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-sm bg-emerald-600 dark:bg-emerald-400" />
                    OUR VISION
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2.5">
                    Where We&apos;re Going
                  </h3>
                  <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 italic leading-relaxed font-normal">
                    &ldquo;A world where every property owner — whether managing 1 single rental home or a 50-property portfolio — has access to enterprise-grade tools that are simple enough to use on day one.&rdquo;
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-2 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 rounded-lg">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Democratizing modern property management software for all landlords.</span>
                </div>
              </div>

            </div>

          </div>
        </section>


        {/* ══════════════════════════════════════════════════════════════
            SECTION 3: BUILT BECAUSE THIS NEEDED TO CHANGE (WHY WE EXIST)
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-10 sm:py-12 max-w-6xl mx-auto px-5 sm:px-8 relative">
          
          {/* Header */}
          <div className="text-center space-y-1.5 mb-7 sm:mb-8 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 dark:bg-violet-500/20 border border-violet-500/20 text-[10px] sm:text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
              WHY WE EXIST
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Built Because This Needed to Change
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
              Traditional rental management tools were built for giant corporate real estate firms with dedicated IT teams. We built NestBloq for independent landlords, residential property owners, and modern tenants.
            </p>
          </div>

          {/* 3 Columns: Rental Pillars Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
            
            {/* 1. LEASE & TENANT MANAGEMENT */}
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-white/10 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/[0.06] mb-3">
                  <span className="text-[10px] sm:text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    LEASE &amp; TENANT ONBOARDING
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                </div>

                {/* BEFORE */}
                <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/30 rounded-lg p-3 mb-2.5 text-left">
                  <div className="flex items-center gap-1 text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
                    <X className="w-3 h-3 stroke-[3]" />
                    <span>BEFORE</span>
                  </div>
                  <p className="text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    &ldquo;Landlords tracking paper contracts in physical folders. Manual tenant onboarding and messy email threads for signatures.&rdquo;
                  </p>
                </div>

                {/* WITH NESTBLOQ */}
                <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30 rounded-lg p-3 text-left">
                  <div className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>WITH NESTBLOQ</span>
                  </div>
                  <p className="text-[11.5px] text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                    &ldquo;Digital lease creation in 4 steps, instant tenant profile linking, and secure cloud storage accessible 24/7.&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* 2. RENT COLLECTION & LEDGERS */}
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-white/10 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/[0.06] mb-3">
                  <span className="text-[10px] sm:text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                    RENT COLLECTION &amp; LEDGERS
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                </div>

                {/* BEFORE */}
                <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/30 rounded-lg p-3 mb-2.5 text-left">
                  <div className="flex items-center gap-1 text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
                    <X className="w-3 h-3 stroke-[3]" />
                    <span>BEFORE</span>
                  </div>
                  <p className="text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    &ldquo;Chasing late rent checks, cash handoffs, and error-prone Excel spreadsheets with manual accounting reconciliations.&rdquo;
                  </p>
                </div>

                {/* WITH NESTBLOQ */}
                <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30 rounded-lg p-3 text-left">
                  <div className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>WITH NESTBLOQ</span>
                  </div>
                  <p className="text-[11.5px] text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                    &ldquo;Automated online rent collection, recurring payment tracking, instant digital receipts, and real-time ledger accounting.&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* 3. MAINTENANCE & REPAIRS */}
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-white/10 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/[0.06] mb-3">
                  <span className="text-[10px] sm:text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                    MAINTENANCE &amp; REPAIRS
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                </div>

                {/* BEFORE */}
                <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/30 rounded-lg p-3 mb-2.5 text-left">
                  <div className="flex items-center gap-1 text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
                    <X className="w-3 h-3 stroke-[3]" />
                    <span>BEFORE</span>
                  </div>
                  <p className="text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    &ldquo;Tenants texting late-night repair requests, lost paper receipts, and messy back-and-forth phone calls with contractors.&rdquo;
                  </p>
                </div>

                {/* WITH NESTBLOQ */}
                <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30 rounded-lg p-3 text-left">
                  <div className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>WITH NESTBLOQ</span>
                  </div>
                  <p className="text-[11.5px] text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                    &ldquo;Centralized maintenance ticket desk with photo attachments, direct contractor assignment, and status updates.&rdquo;
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>


        {/* ══════════════════════════════════════════════════════════════
            SECTION 4: OUR CORE VALUES (WHAT WE STAND FOR)
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-10 sm:py-12 bg-slate-50/70 dark:bg-white/[0.02] border-t border-slate-200/70 dark:border-white/[0.06] relative">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            
            {/* Header */}
            <div className="text-center space-y-1.5 mb-7 sm:mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 dark:bg-violet-500/20 border border-violet-500/20 text-[10px] sm:text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                WHAT WE STAND FOR
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Our Core Values
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                The foundational convictions that guide every product decision and line of code we write.
              </p>
            </div>

            {/* 2x2 Values Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              
              {/* Value 1: Security First */}
              <div className="bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-white/10 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 text-left">
                  <h3 className="font-display font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    Security First
                  </h3>
                  <p className="text-[11.5px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">Bank-level AES-256 encryption</span> and strict <span className="text-indigo-600 dark:text-indigo-400 font-medium">PCI payment compliance</span> protect your rental income, bank accounts, and tenant records at all times.
                  </p>
                </div>
              </div>

              {/* Value 2: Landlord & Tenant Focused */}
              <div className="bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-white/10 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <Users className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 text-left">
                  <h3 className="font-display font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    Landlord &amp; Tenant Focused
                  </h3>
                  <p className="text-[11.5px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                    Designed with direct input from <span className="text-indigo-600 dark:text-indigo-400 font-medium">real landlords and tenants</span>, prioritizing clear communication, prompt maintenance, and <span className="text-indigo-600 dark:text-indigo-400 font-medium">seamless leasing</span>.
                  </p>
                </div>
              </div>

              {/* Value 3: Radical Simplicity */}
              <div className="bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-white/10 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 text-left">
                  <h3 className="font-display font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    Radical Simplicity
                  </h3>
                  <p className="text-[11.5px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                    No steep setup or complex onboarding. <span className="text-indigo-600 dark:text-indigo-400 font-medium">Zero training required</span> so any landlord or tenant can create leases and pay rent in <span className="text-indigo-600 dark:text-indigo-400 font-medium">under 60 seconds</span>.
                  </p>
                </div>
              </div>

              {/* Value 4: Transparent Accounting */}
              <div className="bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-white/10 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <Eye className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 text-left">
                  <h3 className="font-display font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    Transparent Accounting
                  </h3>
                  <p className="text-[11.5px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                    Real-time rent ledgers, <span className="text-indigo-600 dark:text-indigo-400 font-medium">exportable financial reports</span>, and audit-ready payment histories ensure <span className="text-indigo-600 dark:text-indigo-400 font-medium">complete financial clarity</span>.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </section>


        {/* ══════════════════════════════════════════════════════════════
            SECTION 5: CALL TO ACTION (CTA BANNER)
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-10 pb-16 max-w-6xl mx-auto px-5 sm:px-8">
          <div className="relative rounded-3xl bg-gradient-to-r from-[#4c1d95] via-[#5b21b6] to-[#311075] p-8 sm:p-12 md:p-14 text-center text-white shadow-2xl overflow-hidden space-y-5">
            <div className="absolute top-0 right-0 w-80 h-80 bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-violet-300">
              JOIN THE MODERN RENTAL MANAGEMENT REVOLUTION
            </p>

            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight max-w-2xl mx-auto">
              Ready to Modernize Your Rental Operations?
            </h2>

            <p className="text-xs sm:text-sm text-violet-200 max-w-lg mx-auto leading-relaxed">
              Join thousands of independent landlords and property managers who have simplified leasing, rent collection, and maintenance with NestBloq.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/rental/register"
                className="px-8 py-3.5 bg-white text-[#4c1d95] font-extrabold text-xs sm:text-sm rounded-full shadow-lg hover:bg-slate-100 transition-all active:scale-95"
              >
                Get Started Free
              </Link>
              <Link
                to="/#features"
                className="px-8 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm rounded-full transition-all active:scale-95"
              >
                Explore Features
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Footer & Interactive AI Assistant */}
      <Footer />
      <InteractiveAssistant />
    </div>
  );
}
