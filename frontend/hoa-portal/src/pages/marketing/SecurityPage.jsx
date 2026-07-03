import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, ShieldCheck, Lock, Key, Server, Database, EyeOff, 
  ArrowRight, Activity, ChevronDown, ChevronUp
} from 'lucide-react';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';
import { useTheme } from '../../context/ThemeContext';

export default function SecurityPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [openFaq, setOpenFaq] = useState(null);

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
      desc: "Every vote, resolution signature, and amenity survey response is recorded with a unique SHA-256 verification hash. This prevents retro-active tamper or manipulation of board approvals.",
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

  const faqs = [
    {
      q: "Where is our community database hosted?",
      a: "Our primary databases are hosted on AWS and Google Cloud nodes located in the United States. These servers are protected by industrial firewalls, physical security checkpoints, and continuous network packet auditing."
    },
    {
      q: "Who can see our resident registry and accounting logs?",
      a: "Only authenticated administrators assigned to your specific HOA or community can view registry lists and billing ledgers. Residents can only view their own personal profiles and unit payment receipts."
    },
    {
      q: "How does NestBloq safeguard our board e-voting records?",
      a: "Each ballot submitted is stamped with a digital fingerprint hash (SHA-256) matching the voter ID, meeting date, and approval selection. The system runs integrity checks to ensure no record has been altered post-ballot."
    },
    {
      q: "What happens if there is a server outage?",
      a: "Our infrastructure features auto-scaling replica instances. If one host node goes offline, traffic is dynamically rerouted to a hot-standby node within seconds, ensuring maximum uptime."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090F16] transition-colors duration-250 font-sans text-slate-900 dark:text-white">
      <Navbar />

      <div className="flex-1 overflow-x-hidden pt-12">
        {/* --- Hero Banner --- */}
        <header className="relative w-full overflow-hidden py-20 border-b border-slate-200/50 dark:border-white/[0.04]">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/[0.03] dark:bg-blue-500/[0.05] rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-500/[0.03] dark:bg-violet-500/[0.05] rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 text-center space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold tracking-widest uppercase">
              Security & Compliance
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.08]">
              Enterprise-grade security<br />
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">for your community.</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed text-sm">
              At NestBloq, we understand that community governance holds private member records and financial accounts. We enforce strict encryption, real-time audit hashes, and robust credentials control.
            </p>
          </div>
        </header>

        {/* --- Interactive Status Check Widget --- */}
        <section className="py-16 max-w-5xl mx-auto px-5 sm:px-8">
          <div className="bg-gradient-to-br from-slate-100 to-slate-200/50 dark:from-[#111A24] dark:to-[#0D1620] border border-slate-200 dark:border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Live System Integrity Checklist</h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Real-time verification of security shielding modules</p>
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                SECURE PLATFORM
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {systemStatusChecks.map((item, idx) => (
                <div key={idx} className="p-4 bg-white/60 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/[0.04] rounded-2xl flex items-center justify-between text-left shadow-sm">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{item.name}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- Pillars Grid --- */}
        <section className="py-12 bg-slate-100/50 dark:bg-[#070D14]/40 border-y border-slate-200/40 dark:border-white/[0.04]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-display text-3xl font-black text-slate-900 dark:text-white">Our Security Safeguards</h2>
              <p className="text-xs text-slate-400 dark:text-gray-500 mt-1.5 uppercase tracking-wider font-extrabold">Active Protection Matrix</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {securityFeatures.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div key={idx} className="bg-white dark:bg-[#0D1620] border border-slate-200/60 dark:border-white/[0.06] rounded-3xl p-6 shadow-sm hover:shadow-lg transition flex flex-col justify-between text-left">
                    <div className="space-y-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Icon size={20} />
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">{feat.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
                    </div>
                    <div className="pt-5 border-t border-slate-100 dark:border-white/5 mt-5">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-400 bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 px-2 py-0.5 rounded">
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
        <section className="py-20 max-w-5xl mx-auto px-5 sm:px-8 text-center space-y-12">
          <div className="space-y-4">
            <h2 className="font-display text-3xl font-black text-slate-900 dark:text-white">Compliance & Infrastructure</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
              We align our services with secure cloud hosting practices, verifying data pathways continuously.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "SOC 2 Type II", desc: "Hosting Node Certs" },
              { label: "PCI-DSS Level 1", desc: "Secure Payments Tunnel" },
              { label: "GDPR Compliant", desc: "Data Registry Policies" },
              { label: "Hourly Snapshots", desc: "Database Backups" }
            ].map((std, i) => (
              <div key={i} className="p-5 border border-slate-200 dark:border-white/[0.06] rounded-2xl bg-white/40 dark:bg-white/[0.005]">
                <div className="w-10 h-10 mx-auto rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center mb-3">
                  <ShieldCheck size={18} />
                </div>
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{std.label}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{std.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* --- FAQ Section --- */}
        <section className="py-20 border-t border-slate-200/50 dark:border-white/[0.04] bg-slate-50 dark:bg-[#080E15]">
          <div className="max-w-3xl mx-auto px-5 sm:px-8 space-y-12">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-violet-500 text-[10px] font-extrabold tracking-widest uppercase">
                SECURITY Q&A
              </div>
              <h2 className="font-display text-3xl font-black text-slate-900 dark:text-white">Frequently Asked Questions</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Need details on compliance or infrastructure settings? Reach out to our IT audit team.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div 
                    key={idx} 
                    className="border border-slate-200 dark:border-white/[0.06] rounded-2xl bg-white dark:bg-[#0D1620] overflow-hidden transition-all text-left shadow-sm"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-5 flex items-center justify-between text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition"
                    >
                      <span className="font-extrabold text-sm">{faq.q}</span>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-white/5">
                        <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed pt-3">{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* --- Call to Action Banner --- */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-violet-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent)]" />
          <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 text-center space-y-6">
            <h2 className="font-display text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Have security compliance requirements?
            </h2>
            <p className="text-blue-100 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed">
              We gladly support enterprise HOA security questionnaires, database isolation preferences, and custom vendor agreements. Talk to our IT compliance specialists.
            </p>
            <div className="pt-2">
              <Link 
                to="/contact" 
                className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold px-6 py-3 rounded-xl hover:bg-slate-50 transition shadow-lg"
              >
                Request Security Docs
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
