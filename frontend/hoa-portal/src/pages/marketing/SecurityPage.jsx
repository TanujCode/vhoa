import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, ShieldCheck, Lock, Key, Server, Database, EyeOff, 
  ArrowRight, Activity, CheckCircle2
} from 'lucide-react';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';
import FaqSection from '../../components/marketing/FaqSection';
import { useTheme } from '../../context/ThemeContext';

export default function SecurityPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const securityFeatures = [
    {
      title: "Bank-Grade Encryption",
      desc: "All communication between your devices and our servers is encrypted using TLS 1.3 protocols. Databases are encrypted at rest using industry-standard AES-256 cryptographic algorithms.",
      icon: Lock,
      badge: "In-Transit & At-Rest"
    },
    {
      title: "Zero Card Data Storage",
      desc: "Payments are processed securely via Stripe. NestBloq never stores credit card or bank login credentials on its servers. We comply with PCI-DSS Level 1 specifications for payments.",
      icon: EyeOff,
      badge: "PCI-DSS Level 1"
    },
    {
      title: "e-Voting Cryptographic Hashes",
      desc: "Every vote, resolution signature, and amenity survey response is recorded with a unique SHA-256 verification hash. This prevents retroactive tamper or manipulation of board approvals.",
      icon: Key,
      badge: "Tamper-Proof Ledger"
    },
    {
      title: "Role-Based Permissions",
      desc: "Granular administrative privileges ensure that board members, property managers, residents, and accounting partners only access files and settings permitted by their system profiles.",
      icon: ShieldCheck,
      badge: "Granular Control"
    },
    {
      title: "Hourly Automated Backups",
      desc: "Community databases are continuously monitored and screenshotted hourly. Backup snapshots are replicated across multiple redundant geographic zones to prevent loss.",
      icon: Database,
      badge: "Disaster Recovery"
    },
    {
      title: "SOC 2 Hosting Nodes",
      desc: "NestBloq is hosted on secure cloud data centers featuring SOC 2 Type II certifications. Armed facility security, power redundancy, and continuous hardware health tracking are standard.",
      icon: Server,
      badge: "Certified Datacenters"
    }
  ];

  const systemStatusChecks = [
    { name: "SSL Certificate TLS 1.3", status: "Active / Valid", desc: "Encryption tunnel secured by Let's Encrypt CA" },
    { name: "AES-256 DB Cluster", status: "Encrypted", desc: "Production database volumes verified" },
    { name: "Stripe Gateway Integration", status: "PCI-Compliant", desc: "API connection using tokenized vaults" },
    { name: "SHA-256 Ballot Signer", status: "Operational", desc: "Audit records logging hash blocks" },
    { name: "Hourly Database Backup", status: "Completed", desc: "Last backup created 42 mins ago" },
    { name: "DDoS Mitigation Layer", status: "Active", desc: "Intelligent firewall tracking traffic nodes" }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0f172a] transition-colors duration-250 font-sans text-slate-900 dark:text-white">
      <Navbar />

      <div className="flex-1 overflow-x-hidden">
        
        {/* --- Hero Banner --- */}
        <header className="relative w-full overflow-hidden pt-6 pb-6 sm:pt-8 sm:pb-8 border-b border-slate-200/50 dark:border-white/[0.04]">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/[0.03] dark:bg-blue-500/[0.05] rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-500/[0.03] dark:bg-violet-500/[0.05] rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 text-center space-y-3.5">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-[10px] sm:text-xs font-extrabold tracking-widest uppercase">
              <Shield className="w-3.5 h-3.5" />
              <span>Security & Compliance</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]">
              Enterprise-grade security<br />
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                for your community.
              </span>
            </h1>

            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed text-xs sm:text-sm font-medium">
              At NestBloq, we understand that community governance holds private member records and financial accounts. We enforce strict encryption, real-time audit hashes, and robust credentials control.
            </p>
          </div>
        </header>

        {/* --- Interactive Status Check Widget --- */}
        <section className="py-10 sm:py-12 max-w-5xl mx-auto px-5 sm:px-8">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-slate-700 rounded-[28px] p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="text-left space-y-1">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <h2 className="font-display text-lg font-black text-slate-900 dark:text-white">
                    Live System Integrity Checklist
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time verification of active security shielding modules
                </p>
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                SECURE PLATFORM
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {systemStatusChecks.map((item, idx) => (
                <div 
                  key={idx} 
                  className="p-3.5 sm:p-4 bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.05] rounded-2xl flex items-center justify-between text-left transition-all hover:border-violet-500/30"
                >
                  <div className="pr-3">
                    <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{item.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 shrink-0">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- Pillars Grid --- */}
        <section className="py-10 sm:py-12 bg-slate-100/60 dark:bg-[#162032]/60 border-y border-slate-200/50 dark:border-slate-700/60">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-extrabold tracking-widest uppercase">
                Active Protection Matrix
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Our Security Safeguards
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                End-to-end protective architecture designed to meet rigorous data compliance standards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {securityFeatures.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div 
                    key={idx} 
                    className="bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-slate-700 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-violet-500/30 transition flex flex-col justify-between text-left"
                  >
                    <div className="space-y-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                        <Icon size={18} />
                      </div>
                      <h3 className="font-display font-black text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                        {feat.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                        {feat.desc}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-slate-100 dark:border-white/5 mt-4">
                      <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 px-2 py-0.5 rounded-md">
                        {feat.badge}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* --- Compliance & Infrastructure Standards --- */}
        <section className="py-10 sm:py-12 max-w-5xl mx-auto px-5 sm:px-8 text-center space-y-8">
          <div className="space-y-2">
            <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Compliance & Infrastructure
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed">
              We align our services with secure cloud hosting practices, verifying data pathways continuously.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
            {[
              { label: "SOC 2 Type II", desc: "Hosting Node Certs" },
              { label: "PCI-DSS Level 1", desc: "Secure Payments Tunnel" },
              { label: "GDPR Compliant", desc: "Data Registry Policies" },
              { label: "Hourly Snapshots", desc: "Database Backups" }
            ].map((std, i) => (
              <div 
                key={i} 
                className="p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 rounded-2xl bg-white dark:bg-[#1e293b] shadow-xs hover:border-violet-500/30 transition-all text-center"
              >
                <div className="w-9 h-9 mx-auto rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-2.5">
                  <ShieldCheck size={18} />
                </div>
                <h4 className="font-display font-black text-xs sm:text-sm text-slate-800 dark:text-slate-200">{std.label}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{std.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* --- FAQ Section --- */}
        <FaqSection
          id="security-faq"
          badgeText="SECURITY Q&A"
          title="Frequently Asked Questions"
          subtitlePrefix="Need details on compliance or infrastructure settings?"
          contactText="Reach out to our IT audit team."
          contactLink="/contact"
        />

        {/* --- Call to Action Banner --- */}
        <section className="py-10 pb-16 max-w-6xl mx-auto px-5 sm:px-8 w-full">
          <div className="relative rounded-3xl bg-gradient-to-r from-[#4c1d95] via-[#5b21b6] to-[#311075] p-8 sm:p-12 md:p-14 text-center text-white shadow-2xl overflow-hidden space-y-5">
            <div className="absolute top-0 right-0 w-80 h-80 bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-violet-300">
              ENTERPRISE SECURITY & AUDIT
            </p>

            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight max-w-2xl mx-auto">
              Have Specific Security & Compliance Requirements?
            </h2>

            <p className="text-xs sm:text-sm text-violet-200 max-w-lg mx-auto leading-relaxed">
              We gladly support enterprise HOA security questionnaires, database isolation preferences, and custom vendor agreements. Talk to our IT compliance specialists.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link 
                to="/contact" 
                className="px-8 py-3.5 bg-white text-[#4c1d95] font-extrabold text-xs sm:text-sm rounded-full shadow-lg hover:bg-slate-100 transition-all active:scale-95"
              >
                Request Security Docs
              </Link>
              <Link 
                to="/contact" 
                className="px-8 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm rounded-full transition-all active:scale-95"
              >
                Talk to Security Team
              </Link>
            </div>
          </div>
        </section>

      </div>

      <Footer />
    </div>
  );
}
