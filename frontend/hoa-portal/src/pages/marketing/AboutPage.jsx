import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Heart, Cpu, Sparkles } from 'lucide-react';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';

export default function AboutPage() {
  const values = [
    {
      title: "Community-First Design",
      desc: "Software is useless if residents find it hard to navigate. We design interfaces that are simple, intuitive, and accessible to homeowners of all age groups.",
      icon: Heart,
      color: "text-red-500 bg-red-500/10"
    },
    {
      title: "Ironclad Trust & Security",
      desc: "Your data privacy is sacred. We encrypt every financial invoice, personal email, audit trace, and booking record using bank-grade safety protocols.",
      icon: ShieldCheck,
      color: "text-emerald-500 bg-emerald-500/10"
    },
    {
      title: "AI-Native Automation",
      desc: "We believe volunteers and managers shouldn't spend weekends answering bylaws queries. Our integrated AI relieves 85% of administrative support.",
      icon: Cpu,
      color: "text-purple-500 bg-purple-500/10"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#120824] transition-colors duration-200 overflow-x-hidden font-sans">
      <Navbar />

      {/* --- Page Header --- */}
      <header className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center space-y-4">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#00A878]/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <span className="text-[#00A878] text-xs font-bold uppercase tracking-wider">Our Vision</span>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          Modernizing the Way Communities Live
        </h1>
        <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">
          At NestBloq, we believe that managing a housing society should be as simple and frictionless as booking a cab.
        </p>
      </header>

      {/* --- Brand Story Section --- */}
      <section className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          {/* Left Text */}
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              The Story Behind NestBloq
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              NestBloq was founded by a team of property managers and engineers who grew tired of the endless administrative friction of housing governance. We saw board members spending 15 hours a week handling paper complaints, tracking down late dues checkbooks, and resolving heated clubhouse booking conflicts.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              We realized that the problem wasn't a lack of goodwill—it was a lack of unified digital tooling. Existing property management systems were outdated, complicated, and ignored the resident experience.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-bold text-slate-900 dark:text-slate-200">
              So we built NestBloq: an elegant, AI-native platform designed to bring administrative efficiency and communal harmony back to housing societies.
            </p>
          </div>

          {/* Right Visual Card */}
          <div className="flex justify-center">
            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 p-8 rounded-3xl space-y-4 max-w-sm text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#00A878]/10 rounded-full blur-xl pointer-events-none" />
              <div className="w-12 h-12 rounded-2xl bg-[#00A878]/10 text-[#00A878] flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Over 500+ Active Boards</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Across apartments, gated communities, and retail blocks, NestBloq is helping boards run their operations smoothly, saving hours every single week.
              </p>
              <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800 flex justify-center gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                <div>
                  <p className="text-lg text-[#00A878] font-black">99.9%</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Uptime</p>
                </div>
                <div>
                  <p className="text-lg text-[#00A878] font-black">15,000+</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Resolved Tasks</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* --- Core Values Section --- */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-100 dark:border-slate-800/60 mt-12">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Our Core Principles</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">The values that guide how we write code, support residents, and protect community logs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((item, idx) => {
            const Icon = item.icon;

            return (
              <div
                key={idx}
                className="bg-white dark:bg-[#162535]/60 border border-slate-100 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 space-y-4"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* --- Guarantee and bottom call to action --- */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center relative border-t border-slate-100 dark:border-slate-800/60">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#00A878]/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Ready to Try NestBloq?
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Get started for free today with a 14-day trial, or request an onboarding consultant to present a proposal to your board.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-6 py-3 bg-[#00A878] hover:bg-[#008f65] text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              Start Free Trial
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 hover:border-[#00A878] dark:hover:border-[#00A878] font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex items-center justify-center gap-1.5"
            >
              Contact Sales Onboarding <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
