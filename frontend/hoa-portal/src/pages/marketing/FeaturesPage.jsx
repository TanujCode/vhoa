import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ArrowRight, CheckCircle, DollarSign, ShieldAlert, Calendar, Bot, 
  Send, Check, Activity, Shield, Sliders, Wrench, Users, User, Play, Clock, Sparkles, X
} from 'lucide-react';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';

export default function FeaturesPage() {
  const location = useLocation();
  const [flashingCard, setFlashingCard] = useState(null);

  // Card Refs (used in full bento grid playground mode)
  const ledgerRef = useRef(null);
  const assistantRef = useRef(null);
  const kanbanRef = useRef(null);
  const amenitiesRef = useRef(null);
  const rbacRef = useRef(null);

  const refMap = {
    ledger: ledgerRef,
    assistant: assistantRef,
    kanban: kanbanRef,
    amenities: amenitiesRef,
    rbac: rbacRef
  };

  // State parsing
  const params = new URLSearchParams(location.search);
  const activeTab = params.get('tab');

  // 1. Finances Simulator State
  const [collectedDues, setCollectedDues] = useState(82400);
  const [pendingDues, setPendingDues] = useState(7600);
  const [financeAlert, setFinanceAlert] = useState('');
  const [transactions, setTransactions] = useState([
    { id: 1, name: "Aarav Sharma", unit: "Unit 302", amount: 500, status: "pending", loading: false },
    { id: 2, name: "Sneha Reddy", unit: "Unit 104", amount: 750, status: "pending", loading: false },
    { id: 3, name: "Kabir Mehta", unit: "Unit 405", amount: 500, status: "paid", loading: false },
    { id: 4, name: "Rohan Das", unit: "Unit 211", amount: 500, status: "paid", loading: false }
  ]);

  // Deep linking scroll trigger (only when landing on features grid)
  useEffect(() => {
    if (activeTab && refMap[activeTab]) {
      setTimeout(() => {
        refMap[activeTab].current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setFlashingCard(activeTab);
        setTimeout(() => setFlashingCard(null), 3000);
      }, 350);
    }
  }, [location.search]);

  const handleSimulatePayment = (id) => {
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, loading: true } : tx));
    
    setTimeout(() => {
      setTransactions(prev => prev.map(tx => {
        if (tx.id === id) {
          setCollectedDues(c => c + tx.amount);
          setPendingDues(p => p - tx.amount);
          setFinanceAlert(`Payment of $${tx.amount.toLocaleString()} received from ${tx.name} (${tx.unit})!`);
          setTimeout(() => setFinanceAlert(''), 4000);
          return { ...tx, status: 'paid', loading: false };
        }
        return tx;
      }));
    }, 900);
  };

  // 2. Maintenance Board State
  const [tickets, setTickets] = useState([
    { id: 1, title: "Water leak in Clubhouse restroom", status: "todo", priority: "High", category: "Plumbing", loading: false },
    { id: 2, title: "Elevator B safety inspection", status: "progress", priority: "Medium", category: "Safety", loading: false },
    { id: 3, title: "Lobby lighting replacement", status: "done", priority: "Low", category: "Electrical", loading: false }
  ]);
  const [ticketAlert, setTicketAlert] = useState('');

  const handleDispatchVendor = (id) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, loading: true } : t));
    
    setTimeout(() => {
      setTickets(prev => prev.map(t => {
        if (t.id === id) {
          setTicketAlert(`Technician dispatched for: "${t.title}". SMS updates triggered for affected units.`);
          setTimeout(() => setTicketAlert(''), 4000);
          return { ...t, status: 'progress', loading: false };
        }
        return t;
      }));
    }, 800);
  };

  // 3. Amenities State
  const [bookingUnit, setBookingUnit] = useState('');
  const [bookingIndex, setBookingIndex] = useState(null);
  const [amenityAlert, setAmenityAlert] = useState('');
  const [slots, setSlots] = useState([
    { time: "9:00 AM - 11:00 AM", status: "Booked by Unit 402", theme: "text-slate-400 dark:text-slate-550 bg-white/5 border-white/[0.04]" },
    { time: "12:00 PM - 2:00 PM", status: "Available", theme: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/15" },
    { time: "3:00 PM - 5:00 PM", status: "Booked by Unit 209", theme: "text-slate-400 dark:text-slate-550 bg-white/5 border-white/[0.04]" },
    { time: "6:00 PM - 8:00 PM", status: "Available", theme: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/15" }
  ]);

  const handleBookSlotClick = (idx) => {
    setBookingIndex(idx);
    setBookingUnit('');
  };

  const confirmBooking = (e) => {
    e.preventDefault();
    if (bookingUnit.trim()) {
      setSlots(prev => prev.map((s, idx) => {
        if (idx === bookingIndex) {
          return {
            ...s,
            status: `Reserved by Unit ${bookingUnit}`,
            theme: "text-violet-400 bg-violet-500/10 border-violet-500/30 font-semibold"
          };
        }
        return s;
      }));
      setAmenityAlert(`Pool booking confirmed for Unit ${bookingUnit} at ${slots[bookingIndex].time}!`);
      setTimeout(() => setAmenityAlert(''), 4000);
      setBookingIndex(null);
    }
  };

  // 4. AI Assistant Chat State
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: "Hello! I am NestBloq Assistant. Click a prompt below to see how I handle resident lookups instantly:" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const prompts = [
    { q: "🗓️ Trash pickup schedule?", a: "Trash pickup is scheduled for Tuesdays and Fridays at 7:00 AM. Recyclables are collected on Wednesdays." },
    { q: "💳 How to pay maintenance?", a: "You can pay dues securely online in seconds. Just navigate to the 'Payments' tab in your resident portal, choose your method (ACH/Card), and clear it instantly." },
    { q: "🏊 Guest rules for the pool?", a: "Residents can host up to 4 guests at the Clubhouse pool. Guests must be accompanied by an adult homeowner at all times. Operating hours are 6:00 AM - 10:00 PM." }
  ];

  const handleSendPrompt = (prompt) => {
    if (isTyping) return;
    setChatMessages(prev => [...prev, { sender: 'user', text: prompt.q }]);
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      setChatMessages(prev => [...prev, { sender: 'ai', text: prompt.a }]);
    }, 1000);
  };

  // 5. Role Switcher State
  const [selectedRole, setSelectedRole] = useState('board');

  // Features Detail Data Dictionary
  const featureDetailsData = {
    ledger: {
      title: "NestPay Automated Billing",
      tagline: "PCI-DSS compliant dues engine & accounts reconciliation",
      color: "from-emerald-500 to-teal-500",
      accent: "text-emerald-400 dark:text-emerald-300",
      desc: "Our automated billing engine manages payment processing for modern HOAs. It supports credit cards, bank accounts (ACH), and processes late fee checks completely unattended.",
      benefits: [
        "Invoices generated automatically on custom schedule intervals.",
        "Residents pay online via web/mobile portal instantly.",
        "System ledger calculates interest or flat penalties on outstanding accounts.",
        "Direct export formats for accounting integration workflows."
      ]
    },
    assistant: {
      title: "NestBloq AI Resident Assistant",
      tagline: "24/7 intelligent conversational helpdesk",
      color: "from-rose-500 to-violet-500",
      accent: "text-rose-400 dark:text-rose-300",
      desc: "NestBloq AI Assistant resolves routine inquiries by parsing the community's governing rules, bylaws, and trash schedules. It keeps boards hands-free.",
      benefits: [
        "Resolves up to 85% of standard questions instantly.",
        "Maintains accurate booking records and availability lookups.",
        "Drafts work order issues with photo attachment context.",
        "Ensures rules compliance through direct conversational citations."
      ]
    },
    kanban: {
      title: "Maintenance Desk & Dispatch Kanban",
      tagline: "Collaborative repairs board from report to resolution",
      color: "from-amber-500 to-orange-500",
      accent: "text-amber-400 dark:text-amber-300",
      desc: "Log repairs, assign local contractors, configure work order dispatches, and message affected residents automatically through our responsive board.",
      benefits: [
        "Keep admins, residents, and vendors fully aligned.",
        "Include internal admin-only resolution logs and audits.",
        "Dispatch work tickets with automated SMS notifications.",
        "Integrate contracts with localized service level agreements."
      ]
    },
    amenities: {
      title: "Amenities Reservation Grid",
      tagline: "Facility scheduling with race-condition blockages",
      color: "from-indigo-500 to-blue-500",
      accent: "text-indigo-400 dark:text-indigo-300",
      desc: "Organize bookings for shared community features like swimming pools, lounge spaces, gyms, and sports fields.",
      benefits: [
        "Stops double-booking conflicts via instant atomic state updates.",
        "Implements strict allocation limits (e.g. max slots per household).",
        "Supports online fee collections for clubhouse usage deposits.",
        "Enables customizable approval stages for board review."
      ]
    },
    rbac: {
      title: "Access Control & Governance",
      tagline: "Isolated workspaces for compliance and IP audits",
      color: "from-violet-500 to-purple-600",
      accent: "text-violet-400 dark:text-violet-300",
      desc: "Provide role-based interfaces so Board Members, Property Managers, and Residents see only their respective resources and options.",
      benefits: [
        "Roster directory tracks home units and occupancy status.",
        "Public document library hosts bylaws, manuals, and files.",
        "Digital Assemblies support virtual voting on community items.",
        "Audit logs capture logins, status updates, and client IP addresses."
      ]
    }
  };

  // --- RENDERING MODULAR SANDBOXES ---
  const renderLedgerSandbox = (isGrid = false) => (
    <div 
      ref={ledgerRef} 
      className={`w-full bg-gradient-to-br from-[#4c249f] via-[#1a0b3f] to-[#0a0319] border hover:border-violet-500/40 hover:shadow-violet-500/[0.08] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6 sm:p-8 space-y-6 text-white transition-all duration-300 ${
        isGrid && flashingCard === 'ledger' 
          ? 'ring-4 ring-violet-400 shadow-[0_0_30px_rgba(139,92,246,0.6)] border-violet-400 scale-[1.01]' 
          : 'border-violet-500/20'
      }`}
    >
      <div className="flex justify-between items-center pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold tracking-wider text-slate-355 uppercase">NestPay Billing Simulator</span>
        </div>
        <div className="flex items-center gap-2">
          {isGrid && (
            <Link 
              to="/features?tab=ledger"
              className="text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
              title="Open Dedicated Page"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
            </Link>
          )}
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold">Auto-Sync On</span>
        </div>
      </div>

      {financeAlert && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/35 rounded-xl text-xs text-emerald-300 font-semibold animate-fade-in-up text-left">
          {financeAlert}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 text-left">
        <div className="bg-white/[0.03] border border-white/[0.06] p-4 rounded-2xl shadow-inner">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Collected Dues (Q3)</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">${collectedDues.toLocaleString()}</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] p-4 rounded-2xl shadow-inner">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Outstanding Dues</p>
          <p className="text-xl sm:text-2xl font-black text-amber-400 mt-1">${pendingDues.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-2 text-left">
        <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Dues Ledger Simulation</p>
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl text-xs">
              <div className="space-y-0.5">
                <p className="font-extrabold text-slate-200">{tx.name} <span className="text-[10px] text-slate-500 font-normal">({tx.unit})</span></p>
                <p className="text-slate-450 font-semibold">${tx.amount.toLocaleString()}</p>
              </div>
              {tx.status === 'paid' ? (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-bold rounded-lg text-[10px]">
                  <Check className="w-3 h-3" /> Cleared
                </span>
              ) : (
                <button
                  onClick={() => handleSimulatePayment(tx.id)}
                  disabled={tx.loading}
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed text-white font-extrabold rounded-lg text-[10px] shadow-md shadow-emerald-500/15 flex items-center gap-1.5 transition-all active:scale-95"
                >
                  {tx.loading ? (
                    <Clock className="w-3 h-3 animate-spin" />
                  ) : (
                    <>💰 Simulate Pay</>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAssistantSandbox = (isGrid = false) => (
    <div 
      ref={assistantRef}
      className={`w-full bg-gradient-to-br from-[#4c249f] via-[#1a0b3f] to-[#0a0319] border hover:border-violet-500/40 hover:shadow-violet-500/[0.08] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6 sm:p-8 space-y-4 text-white transition-all duration-300 ${
        isGrid && flashingCard === 'assistant' 
          ? 'ring-4 ring-violet-400 shadow-[0_0_30px_rgba(139,92,246,0.6)] border-violet-400 scale-[1.01]' 
          : 'border-violet-500/20'
      }`}
    >
      <div className="flex justify-between items-center pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-bold tracking-wider text-slate-355 uppercase">AI Resident Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          {isGrid && (
            <Link 
              to="/features?tab=assistant"
              className="text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
              title="Open Dedicated Page"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
            </Link>
          )}
          <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-md font-bold">24/7 Live</span>
        </div>
      </div>

      {/* Chat Log */}
      <div className="h-56 overflow-y-auto bg-white/[0.02] border border-white/[0.04] p-4 rounded-2xl space-y-3.5 flex flex-col justify-end">
        {chatMessages.map((msg, idx) => (
          <div key={idx} className={`flex gap-2 items-start text-[11px] ${msg.sender === 'user' ? 'justify-end' : ''}`}>
            {msg.sender === 'ai' && (
              <div className="w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold text-[10px] shrink-0">🤖</div>
            )}
            <div className={`px-3 py-2 rounded-xl max-w-[80%] leading-relaxed text-left ${
              msg.sender === 'user' 
                ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-medium rounded-tr-none' 
                : 'bg-white/[0.04] border border-white/[0.06] text-slate-200 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-2 items-center text-[10px] text-slate-400">
            <div className="w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold shrink-0">🤖</div>
            <div className="flex gap-1 items-center px-3 py-2 bg-white/[0.02] border border-white/[0.04] rounded-xl rounded-tl-none">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
            </div>
          </div>
        )}
      </div>

      {/* Preset Prompt Chips */}
      <div className="space-y-1.5 text-left">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tap to simulate query:</p>
        <div className="flex flex-wrap gap-2">
          {prompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendPrompt(p)}
              disabled={isTyping}
              className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] hover:border-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-[10px] font-semibold text-rose-300 transition-all active:scale-95"
            >
              {p.q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderKanbanSandbox = (isGrid = false) => (
    <div 
      ref={kanbanRef}
      className={`w-full bg-gradient-to-br from-[#4c249f] via-[#1a0b3f] to-[#0a0319] border hover:border-violet-500/40 hover:shadow-violet-500/[0.08] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6 text-white transition-all duration-300 ${
        isGrid && flashingCard === 'kanban' 
          ? 'ring-4 ring-violet-400 shadow-[0_0_30px_rgba(139,92,246,0.6)] border-violet-400 scale-[1.01]' 
          : 'border-violet-500/20'
      }`}
    >
      <div className="flex justify-between items-center pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold tracking-wider text-slate-355 uppercase">Dispatch Kanban</span>
        </div>
        {isGrid && (
          <Link 
            to="/features?tab=kanban"
            className="text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
            title="Open Dedicated Page"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
          </Link>
        )}
      </div>

      {ticketAlert && (
        <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] text-amber-300 font-semibold animate-fade-in-up text-left">
          {ticketAlert}
        </div>
      )}

      <div className="space-y-3 mt-4 text-left">
        <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-2xl space-y-3">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pb-1 border-b border-white/5">Dues & Repairs Dispatch</p>
          
          {tickets.map((t) => (
            <div key={t.id} className="p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide ${
                  t.status === 'done' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {t.status === 'done' ? 'Resolved' : `${t.priority} Priority`}
                </span>
                <span className="text-[8px] text-slate-550">{t.category}</span>
              </div>
              <p className="text-[10px] font-extrabold leading-snug text-slate-200">{t.title}</p>
              
              {t.status === 'todo' && (
                <button
                  onClick={() => handleDispatchVendor(t.id)}
                  disabled={t.loading}
                  className="w-full py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-slate-700 disabled:cursor-not-allowed text-white font-extrabold rounded text-[8px] flex items-center justify-center gap-1 transition-all"
                >
                  {t.loading ? <Clock className="w-2.5 h-2.5 animate-spin" /> : <>Dispatch Technician</>}
                </button>
              )}
              {t.status === 'progress' && (
                <div className="flex items-center gap-1 text-[8px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 p-1 rounded justify-center">
                  <Clock className="w-2.5 h-2.5 animate-pulse" />
                  <span>Vendor ETA: 20 mins</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAmenitiesSandbox = (isGrid = false) => (
    <div 
      ref={amenitiesRef}
      className={`w-full bg-gradient-to-br from-[#4c249f] via-[#1a0b3f] to-[#0a0319] border hover:border-violet-500/40 hover:shadow-violet-500/[0.08] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6 text-white transition-all duration-300 ${
        isGrid && flashingCard === 'amenities' 
          ? 'ring-4 ring-violet-400 shadow-[0_0_30px_rgba(139,92,246,0.6)] border-violet-400 scale-[1.01]' 
          : 'border-indigo-500/20'
      }`}
    >
      <div className="flex justify-between items-center pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold tracking-wider text-slate-355 uppercase">Amenities Grid</span>
        </div>
        {isGrid && (
          <Link 
            to="/features?tab=amenities"
            className="text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
            title="Open Dedicated Page"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
          </Link>
        )}
      </div>

      {amenityAlert && (
        <div className="mt-2 p-2 bg-indigo-500/15 border border-indigo-500/35 rounded-xl text-[10px] text-indigo-300 font-semibold animate-fade-in-up text-left">
          {amenityAlert}
        </div>
      )}

      <div className="space-y-3 mt-4 text-left">
        <div className="grid grid-cols-2 gap-2">
          {slots.map((s, idx) => (
            <div key={idx} className={`p-3 border rounded-xl flex flex-col justify-between h-20 transition-all ${s.theme}`}>
              <div>
                <p className="text-[9px] font-bold text-slate-350">{s.time}</p>
                <p className="text-[8px] font-medium mt-0.5">{s.status}</p>
              </div>
              {s.status === 'Available' && (
                <button
                  onClick={() => handleBookSlotClick(idx)}
                  className="w-fit px-2 py-0.5 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-bold rounded text-[8px] transition-all"
                >
                  Book Pool
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {bookingIndex !== null && (
        <form onSubmit={confirmBooking} className="mt-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl space-y-2 animate-fade-in-up text-left">
          <p className="text-[9px] font-bold text-slate-200">Confirm pool at {slots[bookingIndex].time}</p>
          <div className="flex gap-1.5">
            <input
              type="text"
              required
              value={bookingUnit}
              onChange={(e) => setBookingUnit(e.target.value)}
              placeholder="Unit (e.g. 104)"
              className="flex-1 px-2 py-1.5 border border-white/10 rounded-lg bg-white/5 text-[10px] text-slate-100 placeholder-slate-505 focus:outline-none focus:border-violet-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-bold rounded-lg text-[9px]"
            >
              Save
            </button>
          </div>
        </form>
      )}
    </div>
  );

  const renderRbacSandbox = (isGrid = false) => (
    <div 
      ref={rbacRef}
      className={`w-full bg-gradient-to-br from-[#4c249f] via-[#1a0b3f] to-[#0a0319] border hover:border-violet-500/40 hover:shadow-violet-500/[0.08] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6 text-white transition-all duration-300 ${
        isGrid && flashingCard === 'rbac' 
          ? 'ring-4 ring-violet-400 shadow-[0_0_30px_rgba(139,92,246,0.6)] border-violet-400 scale-[1.01]' 
          : 'border-violet-500/20'
      }`}
    >
      <div className="flex justify-between items-center pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-bold tracking-wider text-slate-355 uppercase">Access Levels</span>
        </div>
        {isGrid && (
          <Link 
            to="/features?tab=rbac"
            className="text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
            title="Open Dedicated Page"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
          </Link>
        )}
      </div>

      <div className="flex justify-center gap-1.5 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl mt-3">
        {[
          { id: 'board', label: '👑 Board' },
          { id: 'manager', label: '💼 Manager' },
          { id: 'resident', label: '🏠 Owner' }
        ].map((role) => (
          <button
            key={role.id}
            onClick={() => setSelectedRole(role.id)}
            className={`flex-1 py-1 text-[9px] font-extrabold rounded-lg transition-all ${
              selectedRole === role.id
                ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {role.label}
          </button>
        ))}
      </div>

      <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl space-y-3 mt-3 animate-fade-in-up text-left">
        {selectedRole === 'board' && (
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-extrabold text-slate-200">Board Suite</span>
              <span className="px-1.5 py-0.5 bg-violet-500/15 text-violet-300 border border-violet-500/30 rounded font-bold uppercase tracking-wide text-[7px]">Full Access</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-white/[0.03] border border-white/[0.05] rounded-lg text-center">
                <p className="text-[8px] text-slate-400 font-bold uppercase">Reserve Funds</p>
                <p className="text-sm font-black text-violet-400 mt-0.5">$18,500</p>
              </div>
              <div className="p-2 bg-white/[0.03] border border-white/[0.05] rounded-lg text-center">
                <p className="text-[8px] text-slate-400 font-bold uppercase">Open Votes</p>
                <p className="text-sm font-black text-violet-400 mt-0.5">3 Active</p>
              </div>
            </div>
            <p className="text-[9px] text-slate-450 leading-relaxed italic">
              Inspect audit trail operations, manage bylaws configurations, and launch community budget polls.
            </p>
          </div>
        )}

        {selectedRole === 'manager' && (
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-extrabold text-slate-200">Manager Desk</span>
              <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded font-bold uppercase tracking-wide text-[7px]">Staff Workspace</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-white/[0.03] border border-white/[0.05] rounded-lg text-center">
                <p className="text-[8px] text-slate-400 font-bold uppercase">Contractors</p>
                <p className="text-sm font-black text-emerald-400 mt-0.5">14 Dispatched</p>
              </div>
              <div className="p-2 bg-white/[0.03] border border-white/[0.05] rounded-lg text-center">
                <p className="text-[8px] text-slate-400 font-bold uppercase">Violations</p>
                <p className="text-sm font-black text-emerald-400 mt-0.5">8 Pending</p>
              </div>
            </div>
            <p className="text-[9px] text-slate-450 leading-relaxed italic">
              Manage service ticket lifecycles, log community safety violations, and balance collections.
            </p>
          </div>
        )}

        {selectedRole === 'resident' && (
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-extrabold text-slate-200">Owner Portal</span>
              <span className="px-1.5 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded font-bold uppercase tracking-wide text-[7px]">Self-Service</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-white/[0.03] border border-white/[0.05] rounded-lg text-center">
                <p className="text-[8px] text-slate-400 font-bold uppercase">Dues Balance</p>
                <p className="text-sm font-black text-amber-400 mt-0.5">$0.00</p>
              </div>
              <div className="p-2 bg-white/[0.03] border border-white/[0.05] rounded-lg text-center">
                <p className="text-[8px] text-slate-400 font-bold uppercase">Work Orders</p>
                <p className="text-sm font-black text-amber-400 mt-0.5">0 Active</p>
              </div>
            </div>
            <p className="text-[9px] text-slate-450 leading-relaxed italic">
              Homeowner portal. Submit dispatch service request, reserve community spaces, and sync billing invoices.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#120824] transition-colors duration-250 font-sans text-slate-900 dark:text-slate-100">
      <Navbar />

      <div className="flex-1 overflow-x-hidden">

      {activeTab && featureDetailsData[activeTab] ? (
        /* ─── DEDICATED SPECIFIC FEATURE VIEW ─── */
        <div className="flex-1 py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full animate-fade-in-up">
          <div className="mb-8 text-left">
            <Link 
              to="/features" 
              className="inline-flex items-center gap-1.5 text-xs font-black text-violet-500 hover:text-violet-400 uppercase tracking-widest transition-all hover:-translate-x-0.5"
            >
              ← Back to Bento Playground
            </Link>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left panel: Info & details */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-gradient-to-r ${featureDetailsData[activeTab].color} text-white`}>
                Interactive Feature Tour
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {featureDetailsData[activeTab].title}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 italic leading-relaxed">
                {featureDetailsData[activeTab].tagline}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-normal pt-2">
                {featureDetailsData[activeTab].desc}
              </p>

              <div className="space-y-3.5 pt-4 border-t border-slate-200 dark:border-white/[0.05]">
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-200 uppercase tracking-wider">Functional Capabilities:</h4>
                <ul className="space-y-3">
                  {featureDetailsData[activeTab].benefits.map((b, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-violet-500" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 flex gap-3">
                <Link 
                  to="/register" 
                  className="flex-1 py-3.5 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl text-center shadow-md active:scale-95 transition-all"
                >
                  Start Free Trial
                </Link>
                <Link 
                  to="/contact" 
                  className="px-5 py-3.5 border border-slate-200 dark:border-white/[0.08] hover:border-violet-500/25 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl text-center hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition-all"
                >
                  Ask Sales
                </Link>
              </div>
            </div>

            {/* Right panel: The interactive sandbox widget */}
            <div className="lg:col-span-7 w-full flex justify-center">
              {activeTab === 'ledger' && renderLedgerSandbox(false)}
              {activeTab === 'assistant' && renderAssistantSandbox(false)}
              {activeTab === 'kanban' && renderKanbanSandbox(false)}
              {activeTab === 'amenities' && renderAmenitiesSandbox(false)}
              {activeTab === 'rbac' && renderRbacSandbox(false)}
            </div>
          </div>
        </div>
      ) : (
        /* ─── DEFAULT BENTO GRID PLAYGROUND VIEW ─── */
        <>
          {/* ─── Page Header Banner ─── */}
          <div className="w-full bg-gradient-to-r from-violet-500/[0.05] via-indigo-500/[0.03] to-transparent border-b border-slate-200/60 dark:from-[#180a2f] dark:via-[#221043] dark:to-[#0f071f] dark:border-white/[0.04] py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background ambient orbs */}
            <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-violet-600/[0.04] dark:bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal-500/[0.03] dark:bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            
            <div className="max-w-7xl mx-auto w-full text-center space-y-5 relative z-10 animate-fade-in-up">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-violet-500/10 dark:bg-violet-500/15 border border-violet-500/25 dark:border-violet-500/35 text-violet-600 dark:text-violet-300 text-[10px] font-extrabold tracking-widest uppercase">
                Operations Playground
              </span>
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                Interactive Bento Playground
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-350 max-w-xl mx-auto leading-relaxed font-normal opacity-90">
                Interact with the grid modules below to test-drive NestBloq's US-optimized billing, scheduling, and management desks.
              </p>
            </div>
          </div>

          {/* ─── Bento Grid Sandbox ─── */}
          <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 animate-fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-7 flex">
                {renderLedgerSandbox(true)}
              </div>
              <div className="col-span-12 lg:col-span-5 flex">
                {renderAssistantSandbox(true)}
              </div>
              <div className="col-span-12 md:col-span-6 lg:col-span-4 flex">
                {renderKanbanSandbox(true)}
              </div>
              <div className="col-span-12 md:col-span-6 lg:col-span-4 flex">
                {renderAmenitiesSandbox(true)}
              </div>
              <div className="col-span-12 md:col-span-12 lg:col-span-4 flex">
                {renderRbacSandbox(true)}
              </div>
            </div>
          </section>

          {/* ─── Bottom CTA banner ─── */}
          <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center relative border-t border-slate-200/80 dark:border-white/[0.06] mt-12">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                See NestBloq in Action
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Schedule a customized demonstration with one of our community board consultants to see how NestBloq fits your HOA rules.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                <Link
                  to="/contact"
                  className="px-8 py-3.5 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:-translate-y-0.5"
                >
                  Request Custom Demo
                </Link>
                <Link
                  to="/pricing"
                  className="px-8 py-3.5 bg-white dark:bg-[#1a102b] text-slate-800 dark:text-white border border-slate-200 dark:border-white/[0.08] hover:border-violet-500 dark:hover:border-violet-500 font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all flex items-center justify-center gap-1.5 hover:-translate-y-0.5"
                >
                  View Pricing Tiers <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </section>
        </>
      )}

      <Footer />
      </div>
    </div>
  );
}
