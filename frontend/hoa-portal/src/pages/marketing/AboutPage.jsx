import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Users, Zap, Maximize, CheckCircle2, Heart, HelpCircle, ArrowUpRight } from 'lucide-react';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';
import { useTheme } from '../../context/ThemeContext';

// Asset imports
import aboutHero from '../../assets/about_hero.png';
import solutionHoa from '../../assets/solution_hoa.png';
import aboutTeamCulture from '../../assets/about_team_culture.png';
import aboutCommunityMeeting from '../../assets/about_community_meeting.png';
import aboutModernTownhomes from '../../assets/about_modern_townhomes.png';

export default function AboutPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const values = [
    {
      title: "Security First",
      desc: "Every feature we build starts with security. SSL, data encryption, captcha verification - non-negotiable for us.",
      icon: Shield,
      color: "text-blue-500 bg-blue-500/15 dark:text-blue-300 dark:bg-blue-500/20 border-blue-400/30",
      cardBg: "bg-gradient-to-br from-blue-50 to-indigo-100/60 dark:from-blue-950/50 dark:to-indigo-950/40 border-blue-200/60 dark:border-blue-500/20 hover:border-blue-400/50 dark:hover:border-blue-400/30",
      titleColor: "text-blue-900 dark:text-blue-100",
      descColor: "text-blue-700/80 dark:text-blue-300/70"
    },
    {
      title: "Community driven",
      desc: "NestBloq is built based on real feedback from HOA boards, admins, and members across the US.",
      icon: Users,
      color: "text-indigo-600 bg-indigo-500/15 dark:text-indigo-300 dark:bg-indigo-500/20 border-indigo-400/30",
      cardBg: "bg-gradient-to-br from-indigo-50 to-blue-100/60 dark:from-indigo-950/50 dark:to-blue-950/40 border-indigo-200/60 dark:border-indigo-500/20 hover:border-indigo-400/50 dark:hover:border-indigo-400/30",
      titleColor: "text-indigo-900 dark:text-indigo-100",
      descColor: "text-indigo-700/80 dark:text-indigo-300/70"
    },
    {
      title: "Speed & simplicity",
      desc: "Complex HOA operations made simple. We choose clear menus, reducing clicks, and saving time.",
      icon: Zap,
      color: "text-violet-600 bg-violet-500/15 dark:text-violet-300 dark:bg-violet-500/20 border-violet-400/30",
      cardBg: "bg-gradient-to-br from-violet-50 to-purple-100/60 dark:from-violet-950/50 dark:to-purple-950/40 border-violet-200/60 dark:border-violet-500/20 hover:border-violet-400/50 dark:hover:border-violet-400/30",
      titleColor: "text-violet-900 dark:text-violet-100",
      descColor: "text-violet-700/80 dark:text-violet-300/70"
    },
    {
      title: "Built to scale",
      desc: "From 50 units to 5,000 - NestBloq grows with your community, without extra complexity.",
      icon: Maximize,
      color: "text-blue-650 bg-blue-500/15 dark:text-blue-300 dark:bg-blue-500/20 border-blue-400/30",
      cardBg: "bg-gradient-to-br from-blue-50 to-indigo-100/60 dark:from-blue-950/50 dark:to-indigo-950/40 border-blue-200/60 dark:border-blue-500/20 hover:border-blue-400/50 dark:hover:border-blue-400/30",
      titleColor: "text-blue-900 dark:text-blue-100",
      descColor: "text-blue-700/80 dark:text-blue-300/70"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#120824] transition-colors duration-250 font-sans text-slate-900 dark:text-slate-100">
      <Navbar />

      <div className="flex-1 overflow-x-hidden">

        {/* --- Page Header Banner with Background Image --- */}
        <header className="relative w-full overflow-hidden py-14 sm:py-20 border-b border-slate-200/50 dark:border-white/[0.04] bg-slate-50 dark:bg-slate-950">
          {/* Background Image of Modern Apartments */}
          <div className="absolute inset-0 z-0">
            <img
              src={aboutHero}
              alt="Modern Residential Communities"
              className="w-full h-full object-cover object-center opacity-15 dark:opacity-20 blur-[2px] select-none pointer-events-none"
            />
            {/* Glowing navy/sky-blue overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-50/90 via-sky-50/30 to-slate-50/90 dark:from-slate-950/90 dark:via-sky-900/40 dark:to-slate-950/90" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 text-center space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-sky-500/10 dark:bg-sky-500/20 border border-sky-300/30 dark:border-sky-400/30 text-sky-600 dark:text-sky-200 text-[10px] font-extrabold tracking-widest uppercase">
              OUR STORY
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight max-w-3xl mx-auto">
              Built for communities. <br className="hidden sm:inline" />Driven by purpose.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
              NestBloq was born from a simple belief: every HOA community deserves modern, affordable tools.
            </p>
          </div>
        </header>

        {/* --- Our Mission Section --- */}
        <section className="py-24 max-w-7xl mx-auto px-5 sm:px-8 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left Block: Image Preview with glowing effect */}
            <div className="lg:col-span-6 flex justify-center relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-3xl blur-xl opacity-20 dark:opacity-25" />
              <div className="relative border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-slate-950 rounded-3xl p-2 shadow-2xl overflow-hidden hover:scale-[1.01] transition-transform duration-300">
                <img
                  src={solutionHoa}
                  alt="Modern HOA Residential Development"
                  className="rounded-2xl w-full max-w-[540px] h-auto object-cover object-center pointer-events-none select-none shadow-md"
                />
              </div>
            </div>

            {/* Right Block: Content & Stats */}
            <div className="lg:col-span-6 space-y-8 text-left">
              <div className="space-y-4">
                <span className="text-indigo-605 dark:text-indigo-400 text-xs font-extrabold tracking-widest uppercase">
                  OUR MISSION
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  Empowering HOA communities across the USA
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                  Most HOA communities rely on expensive management companies or outdated portals that don't talk to each other. We're changing that - one platform, every function, built for self-management.
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                  We believe community management should be transparent, accessible, and affordable for every homeowner - not just large complexes with big budgets.
                </p>
              </div>

              {/* Glowing Stats Cards */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-white/[0.05]">
                <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04] shadow-sm">
                  <p className="text-3xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">500+</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase mt-1 tracking-wider">Active Communities</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04] shadow-sm">
                  <p className="text-3xl font-extrabold font-mono text-violet-500 dark:text-violet-400">40,000+</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase mt-1 tracking-wider">Homes Onboarded</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- Core Values Section --- */}
        <section className="py-24 bg-white dark:bg-[#180a2d]/45 border-y border-slate-200/60 dark:border-white/[0.04] relative z-10 transition-colors duration-200">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/[0.03] dark:bg-violet-600/8 font-bold rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/[0.02] dark:bg-indigo-500/6 rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="text-center space-y-3 mb-16">
              <span className="text-violet-500 dark:text-violet-400 text-xs font-extrabold tracking-widest uppercase">
                WHAT WE STAND FOR
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Our core values</h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">The principles that guide how we design features, manage data, and support our users.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {values.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className={`group p-6 border rounded-2xl flex items-start gap-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${item.cardBg}`}
                  >
                    <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center border transition-transform duration-300 group-hover:scale-110 shadow-sm ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <h3 className={`font-bold text-base ${item.titleColor}`}>{item.title}</h3>
                      <p className={`text-xs leading-relaxed font-normal ${item.descColor}`}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* --- Creator Studio Section (Dark Indigo Card) --- */}
        <section className="py-24 max-w-7xl mx-auto px-5 sm:px-8 w-full relative z-10">
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-left bg-gradient-to-br from-indigo-950 via-slate-950 to-[#120824] border border-white/10 shadow-2xl">
            {/* Overlay grid lines */}
            <div className="absolute inset-0 opacity-[0.03] select-none pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            <div className="absolute right-0 top-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

              {/* Left Content */}
              <div className="lg:col-span-7 space-y-5">
                <span className="text-indigo-400 text-[10px] font-extrabold tracking-widest uppercase">
                  THE TEAM BEHIND NESTBLOQ
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                  Built by Crestcode Product Studio
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-normal max-w-xl">
                  NestBloq is a product of Crestcode Product Studio - a modern software product studio that partners with founders and builders to build high-quality digital products.
                </p>
                <div className="pt-2">
                  <a
                    href="https://cctps.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold group"
                  >
                    Learn about the Studio
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </div>
              </div>

              {/* Right Checklist */}
              <div className="lg:col-span-5 p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3.5 backdrop-blur-md">
                {[
                  "Focus on resident needs",
                  "Rapid product development",
                  "Future-proof features"
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                    <span className="font-semibold">{text}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* --- Image Gallery Row --- */}
        <section className="py-8 pb-16 max-w-7xl mx-auto px-5 sm:px-8 w-full relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { img: aboutTeamCulture, title: "Our Team & Culture" },
              { img: aboutCommunityMeeting, title: "Community Governance" },
              { img: aboutModernTownhomes, title: "Premium Neighborhoods" }
            ].map((item, i) => (
              <div key={i} className="group relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/5 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-4 left-4 text-left">
                  <p className="text-xs font-bold text-white uppercase tracking-wider">{item.title}</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">NestBloq Communities</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- Bottom CTA Section --- */}
        <section className="py-20 max-w-7xl mx-auto px-5 sm:px-8 w-full text-center relative z-10 border-t border-slate-200/50 dark:border-white/[0.04]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/[0.03] dark:bg-indigo-500/8 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Ready to Try NestBloq?
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Get started for free today, or request a customized setup plan to present directly to your community board.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Link
                to="/register"
                className="px-6 py-3.5 bg-gradient-to-r from-violet-500 to-indigo-650 hover:from-violet-600 hover:to-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-violet-500/20 transition-all active:scale-95 text-center"
              >
                Get Started Now
              </Link>
              <Link
                to="/contact"
                className="px-6 py-3.5 bg-white dark:bg-white/[0.02] text-slate-800 dark:text-white border border-slate-250 dark:border-white/[0.08] hover:border-violet-500 dark:hover:border-violet-500 hover:bg-slate-100 dark:hover:bg-white/[0.04] font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                Contact Sales <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
