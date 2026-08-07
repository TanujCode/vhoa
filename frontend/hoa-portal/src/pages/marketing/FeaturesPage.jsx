import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight, CheckCircle, DollarSign, Calendar, Bot,
  Send, Check, Activity, Shield, Sliders, Wrench, Users, Clock, Search,
  Zap, Lock, Bell, BarChart3, ChevronRight, Star, Sparkles
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';
import featuresHero from '../../assets/features_hero_dashboard.png';

export default function FeaturesPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const location = useLocation();
  const [flashingCard, setFlashingCard] = useState(null);

  const ledgerRef = useRef(null);
  const assistantRef = useRef(null);
  const kanbanRef = useRef(null);
  const amenitiesRef = useRef(null);
  const rbacRef = useRef(null);

  const refMap = {
    ledger: ledgerRef, assistant: assistantRef, kanban: kanbanRef,
    amenities: amenitiesRef, rbac: rbacRef, violations: ledgerRef,
    otp_gate: kanbanRef, voting: rbacRef, announcements: rbacRef,
    audit_logs: rbacRef, roster: rbacRef
  };

  const params = new URLSearchParams(location.search);
  const activeTab = params.get('tab');

  // 1. Finance state
  const [collectedDues, setCollectedDues] = useState(82400);
  const [pendingDues, setPendingDues] = useState(7600);
  const [transactions, setTransactions] = useState([
    { id: 1, name: "Aarav Sharma", unit: "Unit 302", amount: 500, status: "pending", loading: false },
    { id: 2, name: "Sneha Reddy", unit: "Unit 104", amount: 750, status: "pending", loading: false },
    { id: 3, name: "Kabir Mehta", unit: "Unit 405", amount: 500, status: "paid", loading: false },
    { id: 4, name: "Rohan Das", unit: "Unit 211", amount: 500, status: "paid", loading: false }
  ]);

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
          return { ...tx, status: 'paid', loading: false };
        }
        return tx;
      }));
    }, 900);
  };

  // 2. Maintenance state
  const [tickets, setTickets] = useState([
    { id: 1, title: "Water leak in Clubhouse restroom", status: "todo", priority: "High", category: "Plumbing", loading: false },
    { id: 2, title: "Elevator B safety inspection", status: "progress", priority: "Medium", category: "Safety", loading: false },
    { id: 3, title: "Lobby lighting replacement", status: "done", priority: "Low", category: "Electrical", loading: false }
  ]);

  const handleDispatchVendor = (id) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, loading: true } : t));
    setTimeout(() => {
      setTickets(prev => prev.map(t => {
        if (t.id === id) return { ...t, status: 'progress', loading: false };
        return t;
      }));
    }, 800);
  };

  // 3. Amenities state
  const [slots, setSlots] = useState([
    { time: "9:00 AM – 11:00 AM", status: "Booked · Unit 402", booked: true },
    { time: "12:00 PM – 2:00 PM", status: "Available", booked: false },
    { time: "3:00 PM – 5:00 PM", status: "Booked · Unit 209", booked: true },
    { time: "6:00 PM – 8:00 PM", status: "Available", booked: false }
  ]);

  // 4. AI Chat state
  const chatMessages = [
    { sender: 'ai', text: "Hello! I'm the NestBloq AI. Ask me anything about rules, scheduling, or payments." },
    { sender: 'user', text: "️ Trash pickup schedule?" },
    { sender: 'ai', text: "Trash pickup is every Tuesday & Friday at 7:00 AM. Recyclables on Wednesdays." }
  ];

  // 5. RBAC state
  const [selectedRole, setSelectedRole] = useState('board');

  // Violations data
  const violationsList = [
    { id: 1, type: "Trash can left out", resident: "Aarav Sharma", fine: 50, status: "Open" },
    { id: 2, type: "Unapproved yard structure", resident: "Sneha Reddy", fine: 250, status: "Appealed" },
    { id: 3, type: "Overnight guest parking", resident: "Kabir Mehta", fine: 100, status: "Paid" }
  ];

  // OTP data
  const otpCode = '482 915';
  const otpLogs = [
    { time: "14:20", event: "Gate Access – FedEx Express", gate: "Gate 1A" },
    { time: "11:05", event: "Gate Access – Pest Control", gate: "Gate 2B" }
  ];

  // Audit logs
  const auditLogsList = [
    { id: 1, action: "User Login Successful", user: "Vikash Sharma (Board)", ip: "192.168.1.42", time: "15:24" },
    { id: 2, action: "Invoice Auto-Generated", user: "Auto-Reconcile System", ip: "10.0.4.15", time: "15:02" },
    { id: 3, action: "Bylaw Amendment Approved", user: "Vikash Sharma (Board)", ip: "192.168.1.42", time: "14:15" },
    { id: 4, action: "Gate Passcode Verified", user: "Vendor Guest (FedEx)", ip: "172.56.21.9", time: "14:02" }
  ];

  // Voting data
  const voteCounts = { yes: 29, no: 12 };
  const totalVotes = voteCounts.yes + voteCounts.no;
  const yesPercent = Math.round((voteCounts.yes / totalVotes) * 100);
  const noPercent = Math.round((voteCounts.no / totalVotes) * 100);

  // Roster data
  const [rosterSearch, setRosterSearch] = useState('');
  const rosterList = [
    { name: "Aarav Sharma", unit: "Unit 302", email: "aarav@nestbloq.com", status: "Owner" },
    { name: "Sneha Reddy", unit: "Unit 104", email: "sneha@nestbloq.com", status: "Owner" },
    { name: "Kabir Mehta", unit: "Unit 405", email: "kabir@nestbloq.com", status: "Resident" },
    { name: "Neha Patel", unit: "Unit 212", email: "neha.p@nestbloq.com", status: "Board Member" }
  ];
  const filteredRoster = rosterList.filter(r =>
    r.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
    r.unit.toLowerCase().includes(rosterSearch.toLowerCase())
  );

  const featureDetailsData = {
    ledger: {
      title: "NestPay Automated Billing",
      tagline: "PCI-DSS compliant dues engine & accounts reconciliation",
      color: "from-blue-500 to-indigo-500",
      desc: "Our automated billing engine manages payment processing for modern HOAs. It supports credit cards, bank accounts (ACH), and processes late fee checks completely unattended.",
      benefits: ["Invoices generated automatically on custom schedule intervals.", "Residents pay online via web/mobile portal instantly.", "System ledger calculates interest or flat penalties on outstanding accounts.", "Direct export formats for accounting integration workflows."]
    },
    assistant: {
      title: "NestBloq AI Resident Assistant",
      tagline: "24/7 intelligent conversational helpdesk",
      color: "from-violet-500 to-purple-500",
      desc: "NestBloq AI Assistant resolves routine inquiries by parsing the community's governing rules, bylaws, and trash schedules. It keeps boards hands-free.",
      benefits: ["Resolves up to 85% of standard questions instantly.", "Maintains accurate booking records and availability lookups.", "Drafts work order issues with photo attachment context.", "Ensures rules compliance through direct conversational citations."]
    },
    kanban: {
      title: "Maintenance Desk & Dispatch",
      tagline: "Collaborative repairs board from report to resolution",
      color: "from-indigo-500 to-blue-500",
      desc: "Log repairs, assign local contractors, configure work order dispatches, and message affected residents automatically through our responsive board.",
      benefits: ["Keep admins, residents, and vendors fully aligned.", "Include internal admin-only resolution logs and audits.", "Dispatch work tickets with automated SMS notifications.", "Integrate contracts with localized service level agreements."]
    },
    amenities: {
      title: "Amenities Reservation Grid",
      tagline: "Facility scheduling with race-condition blockages",
      color: "from-indigo-500 to-blue-500",
      desc: "Organize bookings for shared community features like swimming pools, lounge spaces, gyms, and sports fields.",
      benefits: ["Stops double-booking conflicts via instant atomic state updates.", "Implements strict allocation limits (e.g. max slots per household).", "Supports online fee collections for clubhouse usage deposits.", "Enables customizable approval stages for board review."]
    },
    rbac: {
      title: "Access Control & Governance",
      tagline: "Isolated workspaces for compliance and IP audits",
      color: "from-violet-500 to-purple-600",
      desc: "Provide role-based interfaces so Board Members, Property Managers, and Residents see only their respective resources and options.",
      benefits: ["Roster directory tracks home units and occupancy status.", "Public document library hosts bylaws, manuals, and files.", "Digital Assemblies support virtual voting on community items.", "Audit logs capture logins, status updates, and client IP addresses."]
    },
    violations: {
      title: "Violation Fines & Citation",
      tagline: "Transparent enforcement, dispute handling, and payment cycles",
      color: "from-violet-500 to-indigo-500",
      desc: "Maintain community standards and visual curb appeal. Issue compliance notices, calculate late fee accumulation, track dispute history, and collect fines online.",
      benefits: ["Create standard violation types with pre-set fine schedules.", "Residents can file disputes with document upload proofs directly online.", "Integrates with NestPay to allow quick self-service fine settlements.", "Generates certified mail compliance notification letters."]
    },
    otp_gate: {
      title: "Direct OTP Vendor Gate",
      tagline: "Temporary access codes for secure utility arrivals",
      color: "from-blue-500 to-indigo-500",
      desc: "Provide secure temporary access to community facilities, gates, and services. Generate one-time passcodes (OTP) for utility teams, guests, and delivery companies.",
      benefits: ["Generate short-lived, self-expiring security gate PIN codes.", "Vendors receive codes instantly via automated SMS notifications.", "Audit trail logs exact entry timestamps for absolute accountability.", "Revoke or edit access permissions in real-time from the Board dashboard."]
    },
    voting: {
      title: "Digital Assemblies & E-Voting",
      tagline: "Cryptographically verified voting on HOA matters",
      color: "from-indigo-500 to-violet-600",
      desc: "Run virtual elections and pass bylaws securely. Set up interactive community polls, verify owner credentials, and cast anonymous ballots.",
      benefits: ["Create custom ballots with multiple options and approval thresholds.", "Verify votes using secure SHA-256 cryptographic signatures.", "Interactive community polls to gather resident sentiment quickly.", "Automatic quorum checks to validate board voting outcomes."]
    },
    announcements: {
      title: "Pinned Announcements & Broadcasts",
      tagline: "Multi-channel community alerts via SMS, email, and portal",
      color: "from-violet-500 to-purple-500",
      desc: "Broadcast important updates to your community instantly. Keep owners notified about water shutdowns, paving, board elections, or holiday closures.",
      benefits: ["Draft and send alerts across SMS, email, and resident portals simultaneously.", "Pin critical warnings to the top of the resident home feeds.", "Read-receipt indicators track exactly who has viewed the notice.", "Scheduled delivery for planned community maintenance notifications."]
    },
    audit_logs: {
      title: "Compliance & Action IP Audit Logs",
      tagline: "Unalterable activity logs for absolute transparency",
      color: "from-blue-500 to-indigo-650",
      desc: "Track every state change, document upload, status update, and login. Provide complete transparency for board decisions and vendor payouts.",
      benefits: ["Every log record captures the user, action type, timestamp, and client IP.", "Immutable logs prevent unauthorized deletions or back-dating.", "Searchable audit index simplifies compliance checks.", "Alerts board on unusual login locations or consecutive failed tries."]
    },
    roster: {
      title: "Community Roster Directory",
      tagline: "Verified profile database of homeowner accounts",
      color: "from-violet-500 to-indigo-500",
      desc: "Manage owner records in a secure, unified database. Track occupancy statuses, unit numbers, contact numbers, and login logs.",
      benefits: ["Manage unit numbers, owner contact profiles, and email registries.", "Residents can control their visibility level in the public directory.", "Quick directory search filters by unit number or owner name.", "Seamless billing updates linked directly to account profile logs."]
    }
  };
  // ─── SANDBOX RENDERS ─── (each card has a unique color identity)

  const renderLedgerSandbox = () => (
    <div ref={ledgerRef} className="w-full h-full flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-blue-500/20 bg-slate-100/60 dark:bg-[#060b18] shadow-xl shadow-slate-200/50 dark:shadow-blue-900/20">
      {/* Header stripe */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-white" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">NestPay Billing</span>
        </div>
        <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">Auto-Sync On</span>
      </div>
      <div className="p-5 flex-1 space-y-4 overflow-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-slate-200 dark:border-blue-500/20 rounded-xl p-3">
            <p className="text-[9px] text-blue-600 dark:text-blue-400/70 font-bold uppercase tracking-wider">Collected Q3</p>
            <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">${collectedDues.toLocaleString()}</p>
          </div>
          <div className="bg-indigo-500/5 dark:bg-indigo-500/10 border border-slate-200 dark:border-indigo-500/20 rounded-xl p-3">
            <p className="text-[9px] text-indigo-600 dark:text-indigo-400/70 font-bold uppercase tracking-wider">Outstanding</p>
            <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">${pendingDues.toLocaleString()}</p>
          </div>
        </div>
        {/* Ledger */}
        <div className="space-y-2">
          <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dues Ledger</p>
          {transactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between p-2.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-lg text-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">{tx.name} <span className="text-slate-500 font-normal">({tx.unit})</span></p>
                <p className="text-slate-650 dark:text-slate-400">${tx.amount}</p>
              </div>
              {tx.status === 'paid' ? (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/25 text-blue-650 dark:text-blue-400 font-bold rounded-md text-[9px]">
                  <Check className="w-2.5 h-2.5" /> Paid
                </span>
              ) : (
                <button
                  onClick={() => handleSimulatePayment(tx.id)}
                  disabled={tx.loading}
                  className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-md text-[9px] transition-colors disabled:opacity-50"
                >
                  {tx.loading ? '...' : 'Collect'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAssistantSandbox = () => (
    <div ref={assistantRef} className="w-full h-full flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-violet-500/20 bg-slate-100/60 dark:bg-[#0f0618] shadow-xl shadow-slate-200/50 dark:shadow-violet-900/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-white" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">AI Assistant</span>
        </div>
        <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">24/7 Live</span>
      </div>
      <div className="p-5 flex-1 flex flex-col space-y-4 overflow-hidden">
        <div className="flex-1 space-y-3 overflow-y-auto">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex gap-2 items-start text-[11px] ${msg.sender === 'user' ? 'justify-end' : ''}`}>
              {msg.sender === 'ai' && (
                <div className="w-6 h-6 rounded-lg bg-violet-500/10 dark:bg-violet-500/20 border border-violet-250/20 dark:border-violet-500/30 flex items-center justify-center text-[10px] shrink-0"></div>
              )}
              <div className={`px-3 py-2 rounded-xl max-w-[85%] leading-relaxed ${msg.sender === 'user' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 rounded-tl-none shadow-[0_1px_3px_rgba(0,0,0,0.01)]'}`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Try asking:</p>
          <div className="flex flex-wrap gap-1.5">
            {["️ Trash schedule?", " Pay dues?", " Pool rules?"].map((q, i) => (
              <span key={i} className="px-2.5 py-1 bg-violet-500/10 border border-violet-500/20 rounded-lg text-[9px] font-semibold text-violet-650 dark:text-violet-300 select-none cursor-pointer hover:border-violet-400/40">{q}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderKanbanSandbox = () => (
    <div ref={kanbanRef} className="w-full h-full flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-indigo-500/20 bg-slate-100/60 dark:bg-[#080f1a] shadow-xl shadow-slate-200/50 dark:shadow-indigo-900/20">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-white" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">Maintenance Desk</span>
        </div>
        <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">{tickets.filter(t => t.status === 'todo').length} Open</span>
      </div>
      <div className="p-5 flex-1 space-y-2.5 overflow-auto">
        {tickets.map(t => (
          <div key={t.id} className="p-3 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-xl space-y-2 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
            <div className="flex items-center justify-between">
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                t.status === 'done' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-405 border border-blue-500/20' :
                t.status === 'progress' ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' :
                'bg-violet-500/15 text-violet-600 dark:text-violet-405 border border-violet-500/20'
              }`}>{t.status === 'done' ? ' Resolved' : t.status === 'progress' ? '⏳ In Progress' : `${t.priority} Priority`}</span>
              <span className="text-[8px] text-slate-500">{t.category}</span>
            </div>
            <p className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 leading-snug">{t.title}</p>
            {t.status === 'todo' && (
              <button onClick={() => handleDispatchVendor(t.id)} disabled={t.loading}
                className="w-full py-1 text-[9px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50">
                {t.loading ? 'Dispatching...' : 'Dispatch Vendor'}
              </button>
            )}
            {t.status === 'progress' && (
              <div className="flex items-center gap-1 text-[9px] text-indigo-600 dark:text-indigo-400 font-semibold">
                <Clock className="w-2.5 h-2.5 animate-pulse" /> Vendor ETA: 20 mins
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderAmenitiesSandbox = () => (
    <div ref={amenitiesRef} className="w-full h-full flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-indigo-500/20 bg-slate-100/60 dark:bg-[#080f1a] shadow-xl shadow-slate-200/50 dark:shadow-indigo-900/20">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-white" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">Pool Reservations</span>
        </div>
        <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">Today</span>
      </div>
      <div className="p-5 flex-1 space-y-2.5 overflow-auto">
        <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Clubhouse Pool · June 26</p>
        {slots.map((s, i) => (
          <div key={i} className={`p-3 border rounded-xl flex items-center justify-between transition-all ${s.booked ? 'bg-slate-200/30 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.05]' : 'bg-indigo-550/5 dark:bg-indigo-500/10 border-indigo-300/30 dark:border-indigo-500/20 hover:border-indigo-550/50 dark:hover:border-indigo-500/40'}`}>
            <div>
              <p className="text-[10px] font-bold text-slate-800 dark:text-slate-300">{s.time}</p>
              <p className={`text-[9px] mt-0.5 ${s.booked ? 'text-slate-500' : 'text-indigo-600 dark:text-indigo-400 font-semibold'}`}>{s.status}</p>
            </div>
            {!s.booked && (
              <button
                onClick={() => setSlots(prev => prev.map((sl, idx) => idx === i ? { ...sl, status: 'Reserved · Your Unit', booked: true } : sl))}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-bold rounded-lg transition-colors"
              >
                Book
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderRbacSandbox = () => (
    <div ref={rbacRef} className="w-full h-full flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-violet-500/20 bg-slate-100/60 dark:bg-[#10071f] shadow-xl shadow-slate-200/50 dark:shadow-violet-900/20">
      <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-white" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">Role Dashboard</span>
        </div>
        <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">RBAC</span>
      </div>
      <div className="p-5 flex-1 space-y-3 overflow-auto">
        <div className="flex gap-1.5 p-1 bg-white/40 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
          {[{ id: 'board', label: ' Board' }, { id: 'manager', label: ' Manager' }, { id: 'resident', label: ' Owner' }].map(role => (
            <button key={role.id} onClick={() => setSelectedRole(role.id)}
              className={`flex-1 py-1.5 text-[9px] font-bold rounded-lg transition-all ${selectedRole === role.id ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}>
              {role.label}
            </button>
          ))}
        </div>
        {selectedRole === 'board' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-violet-500/5 dark:bg-violet-500/10 border border-slate-200 dark:border-violet-500/20 rounded-xl text-center">
                <p className="text-[8px] text-violet-600 dark:text-violet-400/70 font-bold uppercase">Reserve Funds</p>
                <p className="text-sm font-black text-violet-600 dark:text-violet-400 mt-0.5">$18,500</p>
              </div>
              <div className="p-2.5 bg-violet-500/5 dark:bg-violet-500/10 border border-slate-200 dark:border-violet-500/20 rounded-xl text-center">
                <p className="text-[8px] text-violet-600 dark:text-violet-400/70 font-bold uppercase">Open Votes</p>
                <p className="text-sm font-black text-violet-600 dark:text-violet-400 mt-0.5">3 Active</p>
              </div>
            </div>
            {['Audit Logs', 'Bylaw Repository', 'Vendor Contracts', 'Full Financials'].map((item, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-300">{item}</span>
                <span className="text-[8px] px-1.5 py-0.5 bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded font-bold"> Visible</span>
              </div>
            ))}
          </div>
        )}
        {selectedRole === 'manager' && (
          <div className="space-y-2">
            {['Work Orders', 'Resident Roster', 'Vendor Dispatch', 'Amenity Calendar'].map((item, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-300">{item}</span>
                <span className="text-[8px] px-1.5 py-0.5 bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded font-bold"> Visible</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Reserve Funds</span>
              <span className="text-[8px] px-1.5 py-0.5 bg-red-500/10 dark:bg-red-500/15 text-red-600 dark:text-red-450 border border-red-500/20 rounded font-bold"> Hidden</span>
            </div>
          </div>
        )}
        {selectedRole === 'resident' && (
          <div className="space-y-2">
            {['My Payments', 'Amenity Bookings', 'Announcements', 'My Violations'].map((item, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-300">{item}</span>
                <span className="text-[8px] px-1.5 py-0.5 bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded font-bold"> Visible</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Audit Logs</span>
              <span className="text-[8px] px-1.5 py-0.5 bg-red-500/10 dark:bg-red-500/15 text-red-600 dark:text-red-450 border border-red-500/20 rounded font-bold"> Restricted</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderViolationsSandbox = () => (
    <div className="w-full h-full flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-indigo-500/20 bg-slate-100/60 dark:bg-[#0a081a] shadow-xl shadow-slate-200/50 dark:shadow-indigo-900/20">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-white" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">Violations Tracker</span>
        </div>
        <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">{violationsList.length} Cases</span>
      </div>
      <div className="p-5 flex-1 space-y-2.5 overflow-auto">
        {violationsList.map(v => (
          <div key={v.id} className="p-3 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-xl space-y-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{v.type}</span>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${v.status === 'Open' ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20' : v.status === 'Appealed' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20' : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'}`}>{v.status}</span>
            </div>
            <p className="text-[9px] text-slate-550 dark:text-slate-400">{v.resident} · <span className="text-violet-600 dark:text-violet-400 font-bold">${v.fine} fine</span></p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderOtpGateSandbox = () => (
    <div className="w-full h-full flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-blue-500/20 bg-slate-100/60 dark:bg-[#060b18] shadow-xl shadow-slate-200/50 dark:shadow-blue-900/20">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-white" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">OTP Gate Access</span>
        </div>
        <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">Secure</span>
      </div>
      <div className="p-5 flex-1 space-y-4 overflow-auto">
        <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-slate-200 dark:border-blue-500/20 rounded-xl p-4 text-center space-y-1">
          <p className="text-[9px] text-blue-600 dark:text-blue-400/70 font-bold uppercase tracking-wider">Active Passcode</p>
          <p className="text-3xl font-mono font-black text-blue-600 dark:text-blue-400 tracking-widest">{otpCode}</p>
          <p className="text-[9px] text-blue-500 dark:text-blue-400 font-bold">Expires in 14m 58s · Authorized</p>
        </div>
        <div className="space-y-2">
          <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Gate Access Log</p>
          {otpLogs.map((log, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.04] rounded-lg text-[9px] shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{log.event}</p>
                <p className="text-slate-500">{log.time} · {log.gate}</p>
              </div>
              <span className="px-1.5 py-0.5 bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-405 border border-blue-500/20 rounded font-bold text-[8px]">OK</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderVotingSandbox = () => (
    <div className="w-full h-full flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-indigo-500/20 bg-slate-100/60 dark:bg-[#07091a] shadow-xl shadow-slate-200/50 dark:shadow-indigo-900/20">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-white" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">Digital E-Voting</span>
        </div>
        <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">SHA-256</span>
      </div>
      <div className="p-5 flex-1 space-y-4 overflow-auto">
        <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] p-4 rounded-xl space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
          <span className="text-[8px] px-1.5 py-0.5 bg-indigo-550/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/30 rounded font-bold uppercase">Active Ballot</span>
          <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-snug">Should the HOA approve $15,000 for tennis court resurfacing?</p>
          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between text-[9px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
                <span> Approve (Yes)</span><span>{voteCounts.yes} votes ({yesPercent}%)</span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                <div className="bg-indigo-650 h-full rounded-full transition-all duration-700" style={{ width: `${yesPercent}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[9px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
                <span> Reject (No)</span><span>{voteCounts.no} votes ({noPercent}%)</span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                <div className="bg-violet-650 h-full rounded-full transition-all duration-700" style={{ width: `${noPercent}%` }} />
              </div>
            </div>
          </div>
          <p className="text-[9px] text-slate-500 italic">{totalVotes} verified owner votes · Quorum met</p>
        </div>
      </div>
    </div>
  );

  const renderAnnouncementsSandbox = () => (
    <div className="w-full h-full flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-violet-500/20 bg-slate-100/60 dark:bg-[#0e0618] shadow-xl shadow-slate-200/50 dark:shadow-violet-900/20">
      <div className="bg-gradient-to-r from-violet-600 to-purple-650 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-white" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">Broadcast Center</span>
        </div>
        <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">142 Members</span>
      </div>
      <div className="p-5 flex-1 space-y-3 overflow-auto">
        {[
          { text: "Annual elevator safety inspection tomorrow 9 AM – 4 PM.", date: "Just now", channels: ["SMS", "Email", "Portal"], views: 42 },
          { text: "Clubhouse pool closed for chemical treatment Wednesday 9 AM – 1 PM.", date: "1 day ago", channels: ["SMS", "Portal"], views: 114 },
          { text: "Annual HOA Board Meeting – July 12th, Community Hall.", date: "3 days ago", channels: ["Email", "Portal"], views: 142 }
        ].map((a, i) => (
          <div key={i} className="p-3 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-xl space-y-2 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
            <p className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 leading-snug">{a.text}</p>
            <div className="flex items-center gap-2">
              {a.channels.map(c => <span key={c} className="text-[8px] font-bold px-1.5 py-0.5 bg-violet-500/10 dark:bg-violet-500/15 text-violet-600 dark:text-violet-300 border border-violet-500/20 rounded">{c}</span>)}
              <span className="ml-auto text-[8px] text-slate-500">{a.views} views · {a.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAuditLogsSandbox = () => (
    <div className="w-full h-full flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-blue-500/20 bg-slate-100/60 dark:bg-[#060b18] shadow-xl shadow-slate-200/50 dark:shadow-blue-900/20">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-white" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">Audit Trail</span>
        </div>
        <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">Immutable</span>
      </div>
      <div className="p-5 flex-1 space-y-3 overflow-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={11} />
          <input type="text" disabled placeholder="Search audit trail..." className="w-full bg-slate-200/50 dark:bg-white/5 border border-slate-300/40 dark:border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-[10px] text-slate-500 placeholder-slate-650 outline-none cursor-not-allowed" />
        </div>
        {auditLogsList.map(log => (
          <div key={log.id} className="p-2.5 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.04] rounded-lg text-[9px] space-y-0.5 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-[10px]">{log.action}</span>
              <span className="font-mono text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-[8px]">{log.ip}</span>
            </div>
            <p className="text-slate-550 dark:text-slate-400">{log.user} · {log.time}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRosterSandbox = () => (
    <div className="w-full h-full flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-violet-500/20 bg-slate-100/60 dark:bg-[#0a071a] shadow-xl shadow-slate-200/50 dark:shadow-violet-900/20">
      <div className="bg-gradient-to-r from-violet-600 to-indigo-700 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-white" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">Roster Directory</span>
        </div>
        <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">{rosterList.length} Members</span>
      </div>
      <div className="p-5 flex-1 space-y-3 overflow-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={11} />
          <input type="text" value={rosterSearch} onChange={e => setRosterSearch(e.target.value)}
            placeholder="Search by name or unit..." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-[10px] text-slate-800 dark:text-slate-200 placeholder-slate-450 outline-none focus:ring-1 focus:ring-violet-500" />
        </div>
        {filteredRoster.map((res, i) => (
          <div key={i} className="flex items-center justify-between p-2.5 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.04] rounded-xl text-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">{res.name}</p>
              <p className="text-slate-500 text-[8px]">{res.email}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[9px] font-mono text-slate-605 dark:text-slate-300">{res.unit}</p>
              <span className="inline-block px-1.5 py-0.5 bg-violet-500/10 dark:bg-violet-500/15 border border-violet-500/20 dark:border-violet-500/25 text-violet-650 dark:text-violet-300 rounded text-[7px] font-bold uppercase">{res.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Features showcase for the main page (non-tab view)
  const allFeatures = [
    { key: 'ledger', icon: DollarSign, label: 'Automated Billing', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { key: 'assistant', icon: Bot, label: 'AI Assistant', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
    { key: 'kanban', icon: Wrench, label: 'Maintenance Desk', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
    { key: 'amenities', icon: Calendar, label: 'Amenity Booking', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { key: 'rbac', icon: Shield, label: 'Access Control', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
    { key: 'violations', icon: Bell, label: 'Violations & Fines', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
    { key: 'otp_gate', icon: Lock, label: 'OTP Gate Access', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { key: 'voting', icon: Sliders, label: 'E-Voting', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
    { key: 'announcements', icon: Send, label: 'Announcements', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
    { key: 'audit_logs', icon: Activity, label: 'Audit Logs', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { key: 'roster', icon: Users, label: 'Roster Directory', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
    { key: 'analytics', icon: BarChart3, label: 'Analytics Dashboard', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0a0614] transition-colors duration-250 font-sans text-slate-900 dark:text-slate-100">
      <Navbar />

      <div className="flex-1 overflow-x-hidden">
        {activeTab && featureDetailsData[activeTab] ? (
          /* ─── DEDICATED FEATURE VIEW ─── */
          <div className="flex-1 py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="mb-8 text-left">
              <Link to="/features" className="inline-flex items-center gap-1.5 text-xs font-black text-violet-500 hover:text-violet-400 uppercase tracking-widest transition-all hover:-translate-x-0.5">
                ← Back to Features
              </Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-5 space-y-6 text-left">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-gradient-to-r ${featureDetailsData[activeTab].color} text-white`}>
                  Interactive Feature Tour
                </span>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  {featureDetailsData[activeTab].title}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">{featureDetailsData[activeTab].tagline}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{featureDetailsData[activeTab].desc}</p>
                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-200 uppercase tracking-wider">Key Capabilities:</h4>
                  <ul className="space-y-2.5">
                    {featureDetailsData[activeTab].benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-violet-500" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-4 flex gap-3">
                  <Link to="/portal-select" className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl text-center shadow-md active:scale-95 transition-all">
                    Start Free Trial
                  </Link>
                  <Link to="/contact" className="px-5 py-3 border border-slate-200 dark:border-white/[0.08] hover:border-violet-500/25 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl text-center hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition-all">
                    Ask Sales
                  </Link>
                </div>
              </div>
              <div className="lg:col-span-7 w-full" style={{ minHeight: '420px' }}>
                {activeTab === 'ledger' && renderLedgerSandbox()}
                {activeTab === 'assistant' && renderAssistantSandbox()}
                {activeTab === 'kanban' && renderKanbanSandbox()}
                {activeTab === 'amenities' && renderAmenitiesSandbox()}
                {activeTab === 'rbac' && renderRbacSandbox()}
                {activeTab === 'violations' && renderViolationsSandbox()}
                {activeTab === 'otp_gate' && renderOtpGateSandbox()}
                {activeTab === 'voting' && renderVotingSandbox()}
                {activeTab === 'announcements' && renderAnnouncementsSandbox()}
                {activeTab === 'audit_logs' && renderAuditLogsSandbox()}
                {activeTab === 'roster' && renderRosterSandbox()}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ─── HERO HEADER ─── */}
            <header className="relative w-full overflow-hidden bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-white/[0.06]" style={{ minHeight: '480px' }}>
              {/* Background image */}
              <img
                src={featuresHero}
                alt="NestBloq Features Dashboard"
                className="absolute inset-0 w-full h-full object-cover object-center opacity-15 dark:opacity-20 blur-[5px] select-none pointer-events-none"
              />
              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-50/90 via-violet-50/30 to-slate-50/90 dark:from-slate-950/95 dark:via-violet-950/60 dark:to-slate-950/90" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50 dark:to-slate-950/80" />
              {/* Ambient glow orbs */}
              <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-violet-600/10 dark:bg-violet-600/20 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none" />
              {/* Grid pattern */}
              <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

              <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 py-24 text-center space-y-6">
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-violet-500/10 dark:bg-violet-500/15 border border-violet-300/30 dark:border-violet-500/30 text-violet-600 dark:text-violet-300 text-[10px] font-extrabold tracking-widest uppercase">
                  <Zap className="w-3 h-3" /> Platform Capabilities
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight max-w-4xl mx-auto">
                  Everything Your HOA Needs,{' '}
                  <span className="bg-gradient-to-r from-violet-500 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">In One Platform</span>
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300/80 max-w-2xl mx-auto leading-relaxed">
                  From automated billing and AI assistance to gate security and digital voting — NestBloq brings enterprise-grade tools to every homeowners association.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                  <Link to="/pricing" className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-500/20 transition-all hover:-translate-y-0.5">
                    See Pricing <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link to="/contact" className="inline-flex items-center gap-2 px-7 py-3.5 bg-slate-200/50 hover:bg-slate-200/80 dark:bg-white/10 dark:hover:bg-white/15 border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white font-bold text-sm rounded-xl transition-all hover:-translate-y-0.5 backdrop-blur-sm">
                    Book a Demo
                  </Link>
                </div>
                {/* Social proof */}
                <div className="flex items-center justify-center gap-1.5 pt-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
                  <span className="text-slate-400 text-xs ml-1.5">Trusted by 500+ HOA boards across the US</span>
                </div>
              </div>
            </header>

            {/* ─── FEATURE GRID BADGE PILLS ─── */}
            <section className="py-12 px-5 sm:px-8 max-w-7xl mx-auto w-full">
              <div className="text-center mb-8 space-y-2">
                <span className="text-violet-600 dark:text-violet-400 text-[10px] font-extrabold tracking-widest uppercase">11+ Core Modules</span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Click any feature to explore it live</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Each module below is an interactive sandbox — try them before you commit.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {allFeatures.map(f => {
                  const Icon = f.icon;
                  return (
                    <Link
                      key={f.key}
                      to={`/features?tab=${f.key}`}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${f.bg} hover:scale-[1.04] transition-all duration-200 group cursor-pointer`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${f.bg}`}>
                        <Icon className={`w-4 h-4 ${f.color}`} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{f.label}</span>
                      <ChevronRight className={`w-3 h-3 ${f.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* ─── INTERACTIVE BENTO PLAYGROUND ─── */}
            <section className="py-16 px-5 sm:px-8 max-w-7xl mx-auto w-full border-t border-slate-200/60 dark:border-white/[0.05]">
              <div className="text-center mb-10 space-y-2">
                <span className="text-violet-600 dark:text-violet-400 text-[10px] font-extrabold tracking-widest uppercase">Live Playground</span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Try NestBloq's Core Modules Right Now</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">These are real interactive widgets — click the buttons, switch roles, and see NestBloq in action.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" style={{ minHeight: '480px' }}>
                <div ref={ledgerRef} className="col-span-12 lg:col-span-7 flex" style={{ minHeight: '420px' }}>
                  {renderLedgerSandbox()}
                </div>
                <div ref={assistantRef} className="col-span-12 lg:col-span-5 flex" style={{ minHeight: '420px' }}>
                  {renderAssistantSandbox()}
                </div>
                <div ref={kanbanRef} className="col-span-12 md:col-span-6 lg:col-span-4 flex" style={{ minHeight: '380px' }}>
                  {renderKanbanSandbox()}
                </div>
                <div ref={amenitiesRef} className="col-span-12 md:col-span-6 lg:col-span-4 flex" style={{ minHeight: '380px' }}>
                  {renderAmenitiesSandbox()}
                </div>
                <div ref={rbacRef} className="col-span-12 md:col-span-12 lg:col-span-4 flex" style={{ minHeight: '380px' }}>
                  {renderRbacSandbox()}
                </div>
              </div>
            </section>

            {/* ─── BOTTOM CTA ─── */}
            <section className="py-20 px-5 sm:px-8 max-w-5xl mx-auto w-full text-center border-t border-slate-200/80 dark:border-white/[0.06] relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-64 bg-violet-500/[0.06] dark:bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative max-w-2xl mx-auto space-y-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-600 dark:text-violet-300 text-[10px] font-extrabold tracking-widest uppercase">
                  <Sparkles className="w-3 h-3" /> Ready to get started?
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  See NestBloq in Action
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Schedule a customized demo with one of our HOA consultants to see how NestBloq fits your community's specific needs and rules.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                  <Link to="/contact" className="px-8 py-3.5 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all hover:-translate-y-0.5">
                    Request Custom Demo
                  </Link>
                  <Link to="/pricing" className="inline-flex items-center justify-center gap-1.5 px-8 py-3.5 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] hover:border-violet-500 text-slate-800 dark:text-white font-bold text-sm rounded-xl transition-all hover:-translate-y-0.5">
                    View Pricing <ArrowRight className="w-4 h-4" />
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
