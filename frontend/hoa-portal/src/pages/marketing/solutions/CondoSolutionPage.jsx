import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, CheckCircle, CalendarRange, Clock, Users, 
  ShieldCheck, Sparkles, Star
} from 'lucide-react';
import Navbar from '../../../components/marketing/Navbar';
import Footer from '../../../components/marketing/Footer';
import Logo from '../../../components/marketing/Logo';

// Import high-fidelity image assets
import solutionCondo from '../../../assets/solution_condo.png';
import heroClubDark from '../../../assets/hero_club_dark.png';
import heroParkDark from '../../../assets/hero_park_dark.png';
import heroGardenDark from '../../../assets/hero_garden_dark.png';

export default function CondoSolutionPage() {
  const features = [
    {
      title: "Double-Booking Prevention",
      desc: "Smart facility algorithms automatically lock time slots on resident calendars, preventing double bookings instantly.",
      icon: CalendarRange,
      color: "text-violet-650 bg-violet-500/10 border border-violet-500/20",
      bg: "bg-violet-100/85 dark:bg-violet-950/30 border-violet-200/80 dark:border-violet-800/50 hover:shadow-lg hover:shadow-violet-500/[0.05] hover:border-violet-500/50 dark:hover:border-violet-500/40"
    },
    {
      title: "Temporary Gate Pass OTPs",
      desc: "Generate guest access security codes automatically when amenity slots are confirmed, sending them directly via SMS.",
      icon: ShieldCheck,
      color: "text-indigo-650 bg-indigo-500/10 border border-indigo-500/20",
      bg: "bg-indigo-100/85 dark:bg-indigo-950/30 border-indigo-200/80 dark:border-indigo-800/50 hover:shadow-lg hover:shadow-indigo-500/[0.05] hover:border-indigo-500/50 dark:hover:border-indigo-500/40"
    },
    {
      title: "Integrated Amenity Billing",
      desc: "Apply booking tariffs directly onto resident ledger profiles or automatically charge for excess usage deposits.",
      icon: Users,
      color: "text-blue-650 bg-blue-500/10 border border-blue-500/20",
      bg: "bg-blue-100/85 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-800/50 hover:shadow-lg hover:shadow-blue-500/[0.05] hover:border-blue-500/50 dark:hover:border-blue-500/40"
    }
  ];

  const faqs = [
    { q: "Can we restrict scheduling hours for certain users?", a: "Yes. Admin configurations support setting custom scheduling windows, deposit requirements, and booking limits per resident profile." },
    { q: "Is clean-up/buffer time supported?", a: "Absolutely. You can inject custom buffer times (e.g., 30 minutes) between bookings to allow housekeeping staff to refresh the facility." },
    { q: "How do residents receive confirmation?", a: "Residents receive instant push notifications, emails, and temporary entry gate OTPs upon successful slot reservations." }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-tr from-[#f5f2fa] via-[#faf7fc] to-[#f5f2fa] dark:bg-gradient-to-tr dark:from-[#070511] dark:via-[#07060f] dark:to-[#0a0614] transition-colors duration-300 font-sans relative">
      <Navbar />

      <div className="flex-1 overflow-x-hidden">
        {/* Dynamic Visual Accents / Auroras */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-300/10 dark:bg-violet-950/15 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse-glow" />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-indigo-200/10 dark:bg-indigo-950/10 rounded-full blur-[140px] pointer-events-none -z-10 animate-float-bob" />
        <div className="absolute bottom-1/4 left-10 w-[450px] h-[450px] bg-purple-400/5 dark:bg-purple-950/10 rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* Hero Section */}
        <section className="relative py-14 sm:py-20 px-5 sm:px-8 border-b border-slate-200/40 dark:border-white/[0.04] overflow-hidden">
          {/* Background glow auroras */}
          <div className="absolute inset-0 grid-bg opacity-[0.35] [mask-image:radial-gradient(ellipse_at_center,white_30%,transparent_70%)] pointer-events-none" />
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-gradient-radial from-violet-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-[20%] right-[-10%] w-[45vw] h-[45vw] bg-gradient-radial from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            <div className="lg:col-span-5 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Condo Association Scheduler
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.05] tracking-tight">
                Shared Spaces, <br />
                <span className="bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-400 bg-clip-text text-transparent">Scheduled Easily.</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 font-normal leading-relaxed max-w-xl font-display">
                NestBloq delivers administrative command over facility bookings, resident scheduling rules, and security guest pass distribution.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/portal-select" className="btn-glow px-8 py-3.5 text-sm font-semibold text-white rounded-xl flex items-center gap-2">
                  Start for Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/contact" className="px-6 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                  Book a Demo
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 relative flex justify-center">
              {/* Visual highlight: Mockup Condo Bookings Workspace */}
              <div className="relative w-full h-[320px] sm:h-[380px] rounded-3xl overflow-hidden border border-slate-200/60 dark:border-white/[0.08] shadow-2xl flex flex-col bg-slate-50 dark:bg-[#090F16] z-10">
                {/* Browser top bar */}
                <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-[#0D1B2A] border-b border-slate-200/60 dark:border-white/[0.06] shrink-0 text-left">
                  <div className="flex gap-1.5 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white dark:bg-[#090F16] rounded px-3 py-0.5 text-[9px] text-slate-405 dark:text-slate-500 max-w-xs mx-auto border border-slate-200 dark:border-white/[0.06]">
                      app.nestbloq.com/condo/bookings
                    </div>
                  </div>
                </div>
                
                {/* Browser Body */}
                <div className="flex-1 flex overflow-hidden text-left text-slate-800 dark:text-slate-200">
                  {/* Mini Sidebar */}
                  <aside className="w-24 sm:w-28 shrink-0 bg-slate-100/50 dark:bg-[#0B132B] border-r border-slate-200/60 dark:border-white/[0.06] p-2 flex flex-col gap-2">
                    <div className="px-1 py-1.5 border-b border-slate-200/50 dark:border-white/[0.05] mb-1 shrink-0">
                      <Logo className="h-5 w-auto" />
                    </div>
                    {[
                      { label: 'Dashboard', active: false },
                      { label: 'Amenities', active: true },
                      { label: 'Residents', active: false },
                      { label: 'Bookings', active: false },
                      { label: 'Parking Slots', active: false }
                    ].map((item, idx) => (
                      <div key={idx} className={`px-2 py-1 rounded text-[8px] font-bold ${item.active ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-white/5'}`}>
                        {item.label}
                      </div>
                    ))}
                  </aside>
                  
                  {/* Workspace */}
                  <main className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 bg-white dark:bg-[#090F16] custom-scrollbar text-[9px]">
                    <div className="pb-2 border-b border-slate-200/50 dark:border-white/[0.05] flex justify-between items-center">
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-tight text-[10px]">Amenity Bookings</h4>
                        <p className="text-[7.5px] text-slate-400">Manage bookings, schedule slots, and check reservation status.</p>
                      </div>
                      <button className="bg-violet-600 hover:bg-violet-500 text-white px-2 py-1 rounded text-[7.5px] font-black shadow-sm shrink-0">+ Add Booking</button>
                    </div>

                    {/* Status filter tabs */}
                    <div className="flex items-center gap-1.5 pb-1">
                      {[
                        { label: 'All', count: 5, active: true },
                        { label: 'Approved', count: 3, active: false },
                        { label: 'Pending', count: 2, active: false }
                      ].map((tab, idx) => (
                        <div key={idx} className={`px-2 py-0.5 rounded-lg text-[7px] font-bold flex items-center gap-1 border cursor-pointer transition-all ${
                          tab.active 
                            ? 'bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-500/10' 
                            : 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/5 hover:bg-slate-100'
                        }`}>
                          <span>{tab.label}</span>
                          <span className={`text-[6px] px-1 py-0.2 rounded-full font-black ${
                            tab.active ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-500'
                          }`}>{tab.count}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Booking Card 1 */}
                    <div className="p-3 border border-slate-200/70 dark:border-white/[0.05] bg-white dark:bg-[#1E2E42] rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-extrabold text-slate-900 dark:text-white">Clubhouse Party Hall</span>
                        <span className="text-[7px] px-2 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">Amenity booked</span>
                      </div>
                      <div className="flex justify-between text-[7.5px] font-medium text-slate-500">
                        <span>Today, 14:00 - 18:00</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-350">Unit 305 — Tanuj Tongse</span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-[7.5px]">
                        <span className="text-slate-400">Temporary entry gate pass issued:</span>
                        <span className="font-mono font-black text-violet-500 bg-violet-500/5 px-2 py-0.5 rounded border border-violet-500/10">OTP: 7810</span>
                      </div>
                    </div>

                    {/* Booking Card 2 */}
                    <div className="p-3 border border-slate-200/70 dark:border-white/[0.05] bg-white dark:bg-[#1E2E42] rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-extrabold text-slate-900 dark:text-white">Indoor Tennis Court B</span>
                        <span className="text-[7px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">PENDING</span>
                      </div>
                      <div className="flex justify-between text-[7.5px] font-medium text-slate-500">
                        <span>Tomorrow, 08:00 - 10:00</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-350">Unit 102 — John Smith</span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex justify-end gap-2 text-[7.5px]">
                        <button className="bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded">Decline</button>
                        <button className="bg-violet-600 hover:bg-violet-500 text-white font-black px-2 py-0.5 rounded shadow-sm">Approve Booking</button>
                      </div>
                    </div>
                  </main>
                </div>
              </div>
              
              {/* Subtle background glow under the card */}
              <div className="absolute -inset-4 bg-violet-500/10 rounded-[40px] blur-2xl pointer-events-none -z-10" />
            </div>
          </div>
        </section>

        {/* Social Proof / Logo Cloud */}
        <section className="py-12 border-b border-slate-200/40 dark:border-white/[0.04] bg-white/20 dark:bg-white/[0.01] backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-5 text-center space-y-6">
            <p className="text-[11px] font-black text-slate-400 dark:text-slate-400/70 uppercase tracking-widest">
              TRUSTED BY 12,000+ PROPERTY MANAGERS & Condo Councils WORLDWIDE
            </p>
            <div className="flex flex-wrap justify-center items-center gap-12 sm:gap-20 text-sm font-black tracking-widest text-slate-500 dark:text-slate-300 opacity-60 dark:opacity-70">
              <span>CONDO ALLIANCE</span>
              <span>METRO BOARD PROS</span>
              <span>LAKESIDE ASSOCIATES</span>
              <span>COOPERATIVE NET</span>
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section className="py-24 max-w-7xl mx-auto px-5 sm:px-8 w-full relative">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
            <span className="text-violet-500 text-xs font-black uppercase tracking-wider">Core Capabilities</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Comprehensive Facility Oversight
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-display">
              Organize amenities, coordinate cleanups, and track security codes inside a single control board.
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
        <section className="py-24 border-t border-slate-200/40 dark:border-white/[0.04] bg-slate-50/30 dark:bg-[#080712]/40 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-[10%] left-[-10%] w-[30vw] h-[30vw] bg-violet-500/[0.03] rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-5 sm:px-8 w-full relative z-10">
            <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
              <span className="text-violet-500 text-xs font-black uppercase tracking-wider">Interactive Showcase</span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Virtual Communities & Amenities Showcase
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-display">
                Deliver gorgeous layouts and interactive dashboards for reserving luxury shared spaces with absolute peace of mind. Explore shared spaces managed under the NestBloq portal framework.
              </p>
            </div>

             <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {/* Card 1: Members Directory */}
              <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.08] shadow-md bg-white dark:bg-[#0E1927] p-5 flex flex-col justify-between text-left h-[260px]">
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/5">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-violet-500">Members Directory</span>
                    <span className="text-[7.5px] font-mono text-slate-400">Roster</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: 'John Smith', role: 'Property Manager', status: 'Active' },
                      { name: 'Sarah Jenkins', role: 'Board President', status: 'Active' },
                      { name: 'Marcus Vance', role: 'Homeowner', status: 'Active' }
                    ].map((member, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[8.5px] py-1">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-violet-500/10 text-violet-650 flex items-center justify-center font-bold text-[8px] uppercase">{member.name[0]}</div>
                          <div>
                            <p className="font-extrabold text-slate-900 dark:text-white leading-none">{member.name}</p>
                            <span className="text-[7px] text-slate-400 leading-none">{member.role}</span>
                          </div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">{member.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-[7.5px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-white/5">
                  Showing 3 of 42 active community members
                </div>
              </div>

              {/* Card 2: Maintenance Kanban */}
              <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.08] shadow-md bg-white dark:bg-[#0E1927] p-5 flex flex-col justify-between text-left h-[260px]">
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/5">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-blue-500">Maintenance Dispatch</span>
                    <span className="text-[7.5px] font-mono text-slate-400">Kanban</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { title: 'AC Compressor Repair', prio: 'High', status: 'Unassigned', contractor: 'None' },
                      { title: 'Unit 304 Pipe Leak', prio: 'Medium', status: 'Assigned', contractor: 'Plumber Pro' },
                      { title: 'Pool Light Replacement', prio: 'Low', status: 'Completed', contractor: 'Elite Electrics' }
                    ].map((ticket, idx) => (
                      <div key={idx} className="p-2 border border-slate-100 dark:border-white/5 rounded-xl bg-slate-50/50 dark:bg-white/[0.01] space-y-1">
                        <div className="flex justify-between items-center text-[7.5px]">
                          <p className="font-extrabold text-slate-900 dark:text-white truncate max-w-[120px]">{ticket.title}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[6.5px] font-bold ${
                            ticket.prio === 'High' ? 'bg-red-500/10 text-red-500 border border-red-500/25' :
                            ticket.prio === 'Medium' ? 'bg-amber-500/10 text-amber-605 border border-amber-500/25' :
                            'bg-emerald-500/10 text-emerald-600 border border-emerald-500/25'
                          }`}>{ticket.prio}</span>
                        </div>
                        <div className="flex justify-between items-center text-[6.5px] text-slate-400 leading-none">
                          <span>Status: {ticket.status}</span>
                          <span>Contractor: {ticket.contractor}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-[7.5px] text-slate-400 dark:text-slate-550 pt-2 border-t border-slate-100 dark:border-white/5">
                  Real-time ticket dispatch logs
                </div>
              </div>

              {/* Card 3: Payments Ledger */}
              <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.08] shadow-md bg-white dark:bg-[#0E1927] p-5 flex flex-col justify-between text-left h-[260px]">
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/5">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-500">Dues & Payments</span>
                    <span className="text-[7.5px] font-mono text-slate-400">Ledger</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { type: 'Monthly HOA Assessment', amount: '+$150.00', date: 'Aug 5', status: 'Paid' },
                      { type: 'Clubhouse Slot Deposit', amount: '+$100.00', date: 'Aug 3', status: 'Paid' },
                      { type: 'Late Payment Penalty Fee', amount: '+$50.00', date: 'Aug 1', status: 'Pending' }
                    ].map((row, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[8.5px]">
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white leading-none">{row.type}</p>
                          <span className="text-[7px] text-slate-400 leading-none">{row.date} · verified</span>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-slate-900 dark:text-white leading-none">{row.amount}</p>
                          <span className={`text-[6.5px] font-bold ${row.status === 'Paid' ? 'text-emerald-500' : 'text-amber-500'}`}>{row.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-[7.5px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-white/5">
                  SHA-256 Ledger Balance Trail
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Integrations Section */}
        <section className="py-24 border-t border-slate-200/40 dark:border-white/[0.04] relative">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 w-full text-center space-y-4 mb-16">
            <span className="text-violet-500 text-xs font-black uppercase tracking-wider">Enterprise Integrations</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Integrated with Leading SaaS Providers
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-display">
              NestBloq connects directly with Stripe, Plaid, and Twilio to build secure scheduling and entry permission flows.
            </p>
          </div>
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-4 gap-6 px-5">
            {/* Stripe */}
            <div className="p-6 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/50 bg-indigo-100/85 dark:bg-indigo-950/30 backdrop-blur-md text-left space-y-2 hover:shadow-lg hover:shadow-indigo-500/[0.05] hover:border-indigo-500/50 dark:hover:border-indigo-500/40 transition-all duration-300">
              <span className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest">01 / PAYMENTS</span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">Stripe Processing</h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal font-display">Handle amenity reservation deposits and hourly block tariffs.</p>
            </div>
            {/* Plaid */}
            <div className="p-6 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/50 bg-indigo-100/85 dark:bg-indigo-950/30 backdrop-blur-md text-left space-y-2 hover:shadow-lg hover:shadow-indigo-500/[0.05] hover:border-indigo-500/50 dark:hover:border-indigo-500/40 transition-all duration-300">
              <span className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest">02 / VERIFY</span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">Plaid Security</h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal font-display">Verify resident accounts to confirm payment profiles instantly.</p>
            </div>
            {/* Twilio */}
            <div className="p-6 rounded-2xl border border-violet-200/80 dark:border-violet-800/50 bg-violet-100/85 dark:bg-violet-950/30 backdrop-blur-md text-left space-y-2 hover:shadow-lg hover:shadow-violet-500/[0.05] hover:border-violet-500/50 dark:hover:border-violet-500/40 transition-all duration-300">
              <span className="text-[10px] font-black text-violet-650 dark:text-violet-400 uppercase tracking-widest">03 / GATE CODES</span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">Twilio API</h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal font-display">Auto-dispatch temporary entry gate OTP passcodes to guest cellphones.</p>
            </div>
            {/* SMTP */}
            <div className="p-6 rounded-2xl border border-blue-200/80 dark:border-blue-800/50 bg-blue-100/85 dark:bg-blue-950/30 backdrop-blur-md text-left space-y-2 hover:shadow-lg hover:shadow-blue-500/[0.05] hover:border-blue-500/50 dark:hover:border-blue-500/40 transition-all duration-300">
              <span className="text-[10px] font-black text-blue-650 dark:text-blue-400 uppercase tracking-widest">04 / ALERTS</span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">SMTP Relay</h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal font-display">Send hourly slot reservations and cleanup reminders instantly.</p>
            </div>
          </div>
        </section>

        {/* ROI Statistics Section */}
        <section className="py-24 border-t border-slate-200/40 dark:border-white/[0.04] bg-slate-50/10 dark:bg-[#07060f]/20">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 w-full text-center space-y-4 mb-20">
            <span className="text-violet-500 text-xs font-black uppercase tracking-wider">Metrics that Matter</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Engineered for Shared Facilities
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-display">
              Compare how properties operate before and after migrating to NestBloq's specialized reservation platforms.
            </p>
          </div>
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 px-5">
            {/* Before */}
            <div className="p-8 rounded-3xl border border-violet-500/20 bg-violet-500/[0.02] backdrop-blur-md text-left space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-violet-500/30 text-[10px] font-semibold text-violet-500 bg-violet-500/10 uppercase tracking-wider">
                Traditional Schedules
              </span>
              <ul className="space-y-4 text-xs text-slate-600 dark:text-slate-400 font-display">
                <li className="flex items-start gap-2.5">
                  <span className="text-violet-500 font-black"></span> <span>Constant double bookings on pools and community clubhouse spaces.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-violet-500 font-black"></span> <span>Unverified guests accessing shared areas without tracking logs.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-violet-500 font-black"></span> <span>Chasing cash deposits for reservation cleanups.</span>
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
                  <span className="text-indigo-400 font-black"></span> <span>Smart calendars with real-time double-booking blocks.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-indigo-400 font-black"></span> <span>Automated temporary gate pass OTP dispatches.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-indigo-400 font-black"></span> <span>Online deposit authorization holds via Stripe checkout.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="py-24 max-w-5xl mx-auto px-5 sm:px-8 w-full text-center relative z-10">
          <div className="bg-white/50 dark:bg-[#0b0814]/45 backdrop-blur-xl border border-slate-200/70 dark:border-violet-500/20 p-8 sm:p-12 rounded-3xl space-y-6 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-center gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
            </div>
            <blockquote className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 max-w-3xl mx-auto leading-relaxed">
              "We used to struggle with double bookings for the tennis court and community pool constantly. NestBloq's double-booking prevention locks schedules in real-time, giving residents complete clarity."
            </blockquote>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">Clara Miller</p>
              <p className="text-xs text-slate-550 dark:text-slate-400">Board Secretary, Blue Ridge Condominium Council</p>
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
        <section className="py-20 bg-gradient-to-br from-violet-500/5 via-[#faf7fc] to-indigo-500/10 dark:from-[#080512] dark:to-[#07060f] border-t border-slate-200/40 dark:border-white/[0.04] text-center relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-6 px-5 relative z-10">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Organize Shared Facilities Today
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto font-display">
              Get started for free today with a 14-day trial, or request an onboarding specialist to customize your amenity options.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/portal-select" className="btn-glow px-6 py-3 text-white font-bold text-xs rounded-xl shadow-md">
                Start Free Trial
              </Link>
              <Link to="/contact" className="px-6 py-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-500 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5">
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
