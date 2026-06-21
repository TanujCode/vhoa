import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, CheckCircle, Users, Scale, FileText, 
  ShieldCheck, Sparkles, Star
} from 'lucide-react';
import Navbar from '../../../components/marketing/Navbar';
import Footer from '../../../components/marketing/Footer';

// Import high-fidelity image assets
import solutionHoa from '../../../assets/solution_hoa.png';
import heroClubDark from '../../../assets/hero_club_dark.png';
import heroParkDark from '../../../assets/hero_park_dark.png';
import heroGardenDark from '../../../assets/hero_garden_dark.png';

export default function HoaSolutionPage() {
  const features = [
    {
      title: "Digital General Assemblies",
      desc: "Conduct legally compliant board meetings virtually. Host community resolutions, document comments, and achieve quorum digitally.",
      icon: Users,
      color: "text-indigo-500 bg-indigo-500/10 border border-indigo-500/20"
    },
    {
      title: "Cryptographic IP Auditing",
      desc: "Protect democratic integrity. Every single vote cast generates an immutable SHA-256 security audit trail hash.",
      icon: ShieldCheck,
      color: "text-violet-500 bg-violet-500/10 border border-violet-500/20"
    },
    {
      title: "Bylaws Bylaw AI Assistant",
      desc: "Train our NestBloq AI directly on your society bylaws documents to answer resident regulation queries 24/7.",
      icon: Scale,
      color: "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20"
    }
  ];

  const faqs = [
    { q: "Is virtual e-voting legally binding?", a: "Yes. Our digital assemblies and voting audits align with regional cooperative society bylaws guidelines, providing legally valid electronic quorum logs." },
    { q: "Can we hide individual names during voting?", a: "Yes. Board administrators can configure proposal settings to run either secret ballots (anonymous logs) or public rosters." },
    { q: "Can we vote on financial budgets?", a: "Absolutely. HOA boards regularly use NestBloq to vote on annual maintenance budgets, reserve allocations, and special capital assessments." }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-tr from-[#f5f0fa] via-[#faf7fc] to-[#faedf5] dark:bg-gradient-to-tr dark:from-[#080512] dark:via-[#07060f] dark:to-[#0f0814] transition-colors duration-300 font-sans relative">
      <Navbar />

      <div className="flex-1 overflow-x-hidden">
        {/* Dynamic Visual Accents / Auroras */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-300/10 dark:bg-indigo-950/15 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse-glow" />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-purple-200/10 dark:bg-purple-950/10 rounded-full blur-[140px] pointer-events-none -z-10 animate-float-bob" />
        <div className="absolute bottom-1/4 left-10 w-[450px] h-[450px] bg-pink-400/5 dark:bg-pink-950/10 rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* Hero Section */}
        <section className="relative py-28 px-5 sm:px-8 border-b border-slate-200/40 dark:border-white/[0.04] overflow-hidden">
          {/* Background glow auroras */}
          <div className="absolute inset-0 grid-bg opacity-[0.35] [mask-image:radial-gradient(ellipse_at_center,white_30%,transparent_70%)] pointer-events-none" />
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-gradient-radial from-indigo-500/10 via-violet-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-[20%] right-[-10%] w-[45vw] h-[45vw] bg-gradient-radial from-violet-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            <div className="lg:col-span-5 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                HOA Governance Portal
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.05] tracking-tight">
                Transparent Governance <br />
                <span className="bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">for HOA Assemblies.</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 font-normal leading-relaxed max-w-xl font-display">
                NestBloq unifies e-voting resolutions, cryptographic audit log logs, and automated compliance tracking under one secure workspace.
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
                  src={solutionHoa} 
                  alt="Premium HOA Governance" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                
                {/* Floating stats card overlapping the image */}
                <div className="absolute bottom-5 left-5 right-5 p-4 sm:p-5 rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 text-white flex justify-between items-center gap-4">
                  <div className="space-y-0.5 text-left">
                    <p className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider">QUORUM TIME</p>
                    <p className="text-sm sm:text-base font-black">4 Days Avg</p>
                  </div>
                  <div className="w-px h-8 bg-white/20" />
                  <div className="space-y-0.5 text-left">
                    <p className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider">VOTE VERIFICATION</p>
                    <p className="text-sm sm:text-base font-black">SHA-256 Log</p>
                  </div>
                </div>
              </div>
              
              {/* Subtle background glow under the card */}
              <div className="absolute -inset-4 bg-indigo-500/10 rounded-[40px] blur-2xl pointer-events-none -z-10" />
            </div>
          </div>
        </section>

        {/* Social Proof / Logo Cloud */}
        <section className="py-12 border-b border-slate-200/40 dark:border-white/[0.04] bg-white/20 dark:bg-white/[0.01] backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-5 text-center space-y-6">
            <p className="text-[11px] font-black text-slate-400 dark:text-slate-400/70 uppercase tracking-widest">
              TRUSTED BY 12,000+ PROPERTY MANAGERS & HOA COUNCILS WORLDWIDE
            </p>
            <div className="flex flex-wrap justify-center items-center gap-12 sm:gap-20 text-sm font-black tracking-widest text-slate-500 dark:text-slate-300 opacity-60 dark:opacity-70">
              <span>SUMMIT COOPERATIVE</span>
              <span>GREEN VALLEY COUNCIL</span>
              <span>PINNACLE HOA GROUP</span>
              <span>LAKESIDE TRUST</span>
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section className="py-24 max-w-7xl mx-auto px-5 sm:px-8 w-full relative">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Ironclad Security & Transparent Voting
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-display">
              NestBloq provides HOA boards with legally compliant tools to draft laws, verify voters, and log compliance IP trails.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white/40 dark:bg-white/[0.02] backdrop-blur-md hover:bg-white/70 dark:hover:bg-white/[0.04] hover:border-indigo-500/30 dark:hover:border-indigo-500/20 shadow-sm hover:shadow-xl transition-all duration-300 space-y-4 text-left">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-display">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Premium Visual Gallery & Showcases */}
        <section className="py-24 border-t border-slate-200/40 dark:border-white/[0.04] bg-slate-50/30 dark:bg-[#080512]/40 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-[10%] left-[-10%] w-[30vw] h-[30vw] bg-indigo-500/[0.03] rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-5 sm:px-8 w-full relative z-10">
            <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
              <span className="text-indigo-500 text-xs font-black uppercase tracking-wider">Interactive Showcase</span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Virtual Communities & Amenities Showcase
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-display">
                Uphold compliance, transparent resolutions, and security audits across modern premium gated community councils. Explore shared spaces managed under the NestBloq portal framework.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {/* Card 1: Society Park */}
              <div className="group relative rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/[0.08] shadow-md aspect-[4/3] bg-slate-900 flex flex-col justify-end p-6">
                <img 
                  src={heroParkDark} 
                  alt="Central Community Park" 
                  className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                <div className="relative text-left text-white space-y-1 z-10">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-400">Nature Zone</span>
                  <h4 className="text-base font-black">Central Community Park</h4>
                  <p className="text-xs text-slate-300">Green lawns, paved walking trails, and serene seating corners.</p>
                </div>
              </div>

              {/* Card 2: Botanical Gardens */}
              <div className="group relative rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/[0.08] shadow-md aspect-[4/3] bg-slate-900 flex flex-col justify-end p-6">
                <img 
                  src={heroGardenDark} 
                  alt="Terrace Gardens & Trails" 
                  className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                <div className="relative text-left text-white space-y-1 z-10">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-400">Green Spaces</span>
                  <h4 className="text-base font-black">Terrace Gardens & Trails</h4>
                  <p className="text-xs text-slate-300">Curated shrubberies, seasonal flowers, and peaceful walks.</p>
                </div>
              </div>

              {/* Card 3: Clubhouse & Pool */}
              <div className="group relative rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/[0.08] shadow-md aspect-[4/3] bg-slate-900 flex flex-col justify-end p-6">
                <img 
                  src={heroClubDark} 
                  alt="Premium Clubhouse Pool" 
                  className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                <div className="relative text-left text-white space-y-1 z-10">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-violet-400">Amenity Center</span>
                  <h4 className="text-base font-black">Premium Clubhouse Pool</h4>
                  <p className="text-xs text-slate-300">Glass architecture, luxury decks, and relaxing pool space.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Integrations Section */}
        <section className="py-24 border-t border-slate-200/40 dark:border-white/[0.04] relative">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 w-full text-center space-y-4 mb-16">
            <span className="text-indigo-500 text-xs font-black uppercase tracking-wider">Enterprise Integrations</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Legally Compliant Integrations Deck
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-display">
              NestBloq connects directly with security systems, notification gateways, and audit relays to enforce transparent governance.
            </p>
          </div>
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-4 gap-6 px-5">
            {/* OpenAI */}
            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white/40 dark:bg-white/[0.02] backdrop-blur-md text-left space-y-2 hover:shadow-lg hover:border-indigo-500/20 transition-all duration-300">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">01 / COGNITIVE AI</span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">OpenAI Bylaws AI</h4>
              <p className="text-[11px] text-slate-550 dark:text-slate-400 leading-normal font-display">Train models on physical rulebooks to answer resident queries and draft compliant agendas.</p>
            </div>
            {/* Cryptographic Audits */}
            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white/40 dark:bg-white/[0.02] backdrop-blur-md text-left space-y-2 hover:shadow-lg hover:border-indigo-500/20 transition-all duration-300">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">02 / TAMPER-PROOF</span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">SHA-256 Audit Trail</h4>
              <p className="text-[11px] text-slate-550 dark:text-slate-400 leading-normal font-display">Cryptographic vote auditing ensures individual ballots are verified and immutably stored.</p>
            </div>
            {/* Twilio */}
            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white/40 dark:bg-white/[0.02] backdrop-blur-md text-left space-y-2 hover:shadow-lg hover:border-indigo-500/20 transition-all duration-300">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">03 / EMERGENCY ALERTS</span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">Twilio Alerts</h4>
              <p className="text-[11px] text-slate-550 dark:text-slate-400 leading-normal font-display">Broadcast urgent announcements, upcoming assemblies, and quorum alerts via SMS.</p>
            </div>
            {/* SMTP Relay */}
            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white/40 dark:bg-white/[0.02] backdrop-blur-md text-left space-y-2 hover:shadow-lg hover:border-indigo-500/20 transition-all duration-300">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">04 / LEGAL NOTICE</span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">SMTP Email Relay</h4>
              <p className="text-[11px] text-slate-550 dark:text-slate-400 leading-normal font-display">Deliver official convocations and resolution logs with delivery verification tracking.</p>
            </div>
          </div>
        </section>

        {/* ROI Statistics Section */}
        <section className="py-24 border-t border-slate-200/40 dark:border-white/[0.04] bg-slate-50/10 dark:bg-[#07060f]/20">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 w-full text-center space-y-4 mb-20">
            <span className="text-indigo-500 text-xs font-black uppercase tracking-wider">Governance Optimization</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Compare Governance Resolution Speed
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-display">
              See the direct impact of switching from offline paper-based community councils to NestBloq's automated assembly system.
            </p>
          </div>
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 px-5">
            {/* Before */}
            <div className="p-8 rounded-3xl border border-rose-500/20 bg-rose-500/[0.02] backdrop-blur-md text-left space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-rose-500/30 text-[10px] font-semibold text-rose-500 bg-rose-500/10 uppercase tracking-wider">
                Traditional HOA Operations
              </span>
              <ul className="space-y-4 text-xs text-slate-600 dark:text-slate-400 font-display">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-550 font-black">✕</span> <span>Weeks or months spent chasing residents to sign paper proxy votes and meet quorum.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-550 font-black">✕</span> <span>Bylaws violations and dispute resolution delayed due to manual rule lookups.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-550 font-black">✕</span> <span>Lack of verifiable audit trails leading to contested ballots and board distrust.</span>
                </li>
              </ul>
            </div>
            {/* After */}
            <div className="p-8 rounded-3xl border border-emerald-500/30 bg-emerald-500/[0.03] backdrop-blur-md text-left space-y-4 shadow-xl shadow-emerald-500/5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 text-[10px] font-semibold text-emerald-555 bg-emerald-500/10 uppercase tracking-wider">
                NestBloq Automated Portal
              </span>
              <ul className="space-y-4 text-xs text-slate-600 dark:text-slate-400 font-display">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-555 font-black">✓</span> <span>Legal digital assemblies reaching quorum securely in less than 4 days.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-555 font-black">✓</span> <span>AI Bylaws Copilot resolving compliance and rule questions in seconds.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-555 font-black">✓</span> <span>SHA-256 vote auditing providing transparency and tamper-proof trust.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="py-24 max-w-5xl mx-auto px-5 sm:px-8 w-full text-center relative z-10">
          <div className="bg-white/50 dark:bg-[#080512]/45 backdrop-blur-xl border border-slate-200/70 dark:border-indigo-500/20 p-8 sm:p-12 rounded-3xl space-y-6 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-center gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
            </div>
            <blockquote className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 max-w-3xl mx-auto leading-relaxed">
              "Resolving bylaws questions used to take weeks of calling meetings. NestBloq AI answers rules instantly, and digital ballots achieve society quorum in under 4 days. Absolutely life-changing for the board."
            </blockquote>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">Sarah Lincoln</p>
              <p className="text-xs text-slate-550 dark:text-slate-400">Board Secretary, Sunrise Heights HOA</p>
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
                <p className="text-xs text-slate-550 dark:text-slate-455 leading-relaxed font-normal font-display">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-20 bg-gradient-to-br from-indigo-500/5 via-[#faf7fc] to-violet-500/10 dark:from-[#080512] dark:to-[#07060f] border-t border-slate-200/40 dark:border-white/[0.04] text-center relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-6 px-5 relative z-10">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Bring Transparency to Your HOA Board Today
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto font-display">
              Get started for free today with a 14-day trial, or request a customized presentation proposal for your next board assembly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-glow px-6 py-3 text-white font-bold text-xs rounded-xl shadow-md">
                Start Free Trial
              </Link>
              <Link to="/contact" className="px-6 py-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5">
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
