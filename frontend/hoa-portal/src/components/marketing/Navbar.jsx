import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Menu, X, CreditCard, Wrench, FileText, Bot, ChevronDown } from 'lucide-react';
import Logo from './Logo';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFeaturesOpen, setMobileFeaturesOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const megaMenuRef = useRef(null);
  const solutionsMenuRef = useRef(null);
  const [solutionsMenuOpen, setSolutionsMenuOpen] = useState(false);
  const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target)) {
        setMegaMenuOpen(false);
      }
      if (solutionsMenuRef.current && !solutionsMenuRef.current.contains(event.target)) {
        setSolutionsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mega menu on route changes
  useEffect(() => {
    setMegaMenuOpen(false);
    setSolutionsMenuOpen(false);
    setMobileMenuOpen(false);
    setMobileFeaturesOpen(false);
    setMobileSolutionsOpen(false);
  }, [location]);

  const navLinks = [
    { name: 'Features', path: '/features' },
    { name: 'Solutions', path: '#solutions' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const solutionsData = [
    { name: 'Rental Property Management', desc: 'Rent rolls, tenant directory, pay reminders', path: '/solutions/rental' },
    { name: 'Condo Association Management', desc: 'Amenities blocks, shared facility booking', path: '/solutions/condo' },
    { name: 'Apartment Complex Portal', desc: 'Work order Kanban dispatches, resident roster', path: '/solutions/apartment' },
    { name: 'HOA Governance & Assemblies', desc: 'e-Voting voting resolutions, bylaws audits', path: '/solutions/hoa' },
  ];

  const megaMenuData = [
    {
      category: "Finances & Billing",
      icon: <CreditCard className="w-4 h-4 text-emerald-500" />,
      items: [
        { name: "Online Dues Payments", desc: "Secure automated credit card/ACH billing", tab: "ledger" },
        { name: "Violation Fines Citation", desc: "Issue compliance charges & late penalties", tab: "violations" },
        { name: "Account Ledger Reports", desc: "Interactive statements & financial outputs", tab: "ledger" },
        { name: "Automated Late Fees", desc: "Custom percentages & flat rate grace rules", tab: "ledger" },
      ]
    },
    {
      category: "Community Operations",
      icon: <Wrench className="w-4 h-4 text-amber-500" />,
      items: [
        { name: "Maintenance Ticket Desk", desc: "Log requests, attach photos, track vendor ETAs", tab: "kanban" },
        { name: "Amenity Facility Scheduler", desc: "Smart double-booking pool & clubhouse blocks", tab: "amenities" },
        { name: "Vendor Dispatch Kanban", desc: "Assign work orders to trusted local contractors", tab: "kanban" },
        { name: "Direct OTP Vendor Gate", desc: "Temporary gate security passcode OTP dispatches", tab: "otp_gate" },
      ]
    },
    {
      category: "Governance & Voting",
      icon: <FileText className="w-4 h-4 text-indigo-500" />,
      items: [
        { name: "Digital Assemblies & E-Voting", desc: "Conduct virtual HOA meetings & pass laws", tab: "voting" },
        { name: "Interactive Community Polls", desc: "Collect opinions on upcoming board proposals", tab: "voting" },
        { name: "Pinned Announcements", desc: "Official updates via SMS, email & dashboard", tab: "announcements" },
        { name: "Action IP Audit Logs", desc: "Track system access details & compliance IP audits", tab: "audit_logs" },
      ]
    },
    {
      category: "Intelligent AI & Portal",
      icon: <Bot className="w-4 h-4 text-rose-500" />,
      items: [
        { name: "NestBloq AI Assistant", desc: "24/7 conversational bylaws & query answers", tab: "assistant" },
        { name: "Auto-Resolved Queries", desc: "Instant response system with zero admin overhead", tab: "assistant" },
        { name: "Role-Based Access Control", desc: "Granular workspaces for Board, Manager, Resident", tab: "rbac" },
        { name: "Community Roster Directory", desc: "Secure profile database of verified homeowners", tab: "roster" },
      ]
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 dark:bg-[#07060f]/85 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/[0.06] shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]'
          : 'bg-white/50 dark:bg-[#07060f]/50 backdrop-blur-md border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center group shrink-0">
            <Logo className="h-8" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              if (link.name === 'Solutions') {
                return (
                  <div
                    key={link.name}
                    ref={solutionsMenuRef}
                    className="relative py-2"
                    onMouseEnter={() => setSolutionsMenuOpen(true)}
                    onMouseLeave={() => setSolutionsMenuOpen(false)}
                  >
                    <button
                      onClick={() => setSolutionsMenuOpen(!solutionsMenuOpen)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 outline-none ${
                        isActive(link.path) || solutionsMenuOpen
                          ? 'text-violet-600 dark:text-violet-400 bg-violet-500/8 dark:bg-violet-500/12'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5'
                      }`}
                    >
                      {link.name}
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${solutionsMenuOpen ? 'rotate-180 text-violet-500' : 'text-slate-400'}`}
                      />
                    </button>

                    {/* Solutions Dropdown Menu */}
                    {solutionsMenuOpen && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white dark:bg-[#07060f] border border-slate-200 dark:border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] rounded-2xl p-4 z-50 animate-fade-in-up">
                        <div className="flex flex-col gap-1">
                          {solutionsData.map((item, idx) => (
                            <Link
                              key={idx}
                              to={item.path}
                              className="p-3 rounded-xl hover:bg-violet-500/5 dark:hover:bg-violet-500/10 transition-colors text-left group"
                            >
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-violet-500 transition-colors">
                                {item.name}
                              </p>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block font-medium font-display">
                                {item.desc}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              if (link.name === 'Features') {
                return (
                  <div
                    key={link.name}
                    ref={megaMenuRef}
                    className="py-2"
                    onMouseEnter={() => setMegaMenuOpen(true)}
                    onMouseLeave={() => setMegaMenuOpen(false)}
                  >
                    <button
                      onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 outline-none ${
                        isActive(link.path) || megaMenuOpen
                          ? 'text-violet-600 dark:text-violet-400 bg-violet-500/8 dark:bg-violet-500/12'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5'
                      }`}
                    >
                      {link.name}
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${megaMenuOpen ? 'rotate-180 text-violet-500' : 'text-slate-400'}`}
                      />
                    </button>

                    {/* Mega Menu Dropdown */}
                    {megaMenuOpen && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 md:-translate-x-[40%] lg:-translate-x-1/2 mt-2 w-[95vw] md:w-[720px] lg:w-[880px] bg-white dark:bg-[#07060f] border border-slate-200 dark:border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] rounded-3xl p-6 md:p-8 z-50 animate-fade-in-up">
                        {/* 3D Stack / Glow highlights */}
                        <div className="absolute top-0 left-10 w-40 h-40 bg-violet-500/10 dark:bg-violet-500/20 rounded-full blur-3xl -z-10 pointer-events-none" />
                        <div className="absolute bottom-0 right-10 w-40 h-40 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl -z-10 pointer-events-none" />

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                          {megaMenuData.map((cat, catIdx) => (
                            <div key={catIdx} className="space-y-4">
                              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/[0.04]">
                                {cat.icon}
                                <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                  {cat.category}
                                </span>
                              </div>
                              <ul className="space-y-3.5">
                                {cat.items.map((item, itemIdx) => (
                                  <li key={itemIdx}>
                                    <Link
                                      to={`/features?tab=${item.tab}`}
                                      className="group/item block text-left transition-all duration-200 hover:translate-x-1"
                                      onClick={() => setMegaMenuOpen(false)}
                                    >
                                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover/item:text-violet-600 dark:group-hover/item:text-violet-400">
                                        {item.name}
                                      </p>
                                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal font-normal font-display">
                                        {item.desc}
                                      </p>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(link.path)
                      ? 'text-violet-600 dark:text-violet-400 bg-violet-500/8 dark:bg-violet-500/12'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/8 transition-all duration-200 animate-pulse-glow"
              title="Toggle theme"
            >
              {theme === 'dark'
                ? <Sun size={17} strokeWidth={1.8} />
                : <Moon size={17} strokeWidth={1.8} />}
            </button>

            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-200"
            >
              Sign in
            </Link>

            <Link
              to="/register"
              className="btn-glow px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 flex items-center gap-1.5"
            >
              Get Started
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/8 transition-all">
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/8 transition-all"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-white/[0.06] bg-white/95 dark:bg-[#07060f]/95 backdrop-blur-2xl">
          <div className="px-5 py-4 space-y-1">
            {navLinks.map((link) => {
              if (link.name === 'Solutions') {
                return (
                  <div key={link.name} className="space-y-1">
                    <button
                      onClick={() => setMobileSolutionsOpen(!mobileSolutionsOpen)}
                      className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between text-slate-600 dark:text-slate-355"
                    >
                      <span>Solutions</span>
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${mobileSolutionsOpen ? 'rotate-180 text-violet-500' : ''}`}
                      />
                    </button>
                    {mobileSolutionsOpen && (
                      <div className="pl-4 pr-2 py-1 space-y-2 border-l border-slate-100 dark:border-white/5 ml-4 flex flex-col">
                        {solutionsData.map((item, idx) => (
                          <Link
                            key={idx}
                            to={item.path}
                            className="p-2 rounded-lg hover:bg-violet-500/5 dark:hover:bg-violet-500/10 text-left transition-colors"
                          >
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                              {item.name}
                            </p>
                            <span className="text-[9px] text-slate-400 mt-0.5 block font-medium">
                              {item.desc}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              if (link.name === 'Features') {
                return (
                  <div key={link.name} className="space-y-1">
                    <button
                      onClick={() => setMobileFeaturesOpen(!mobileFeaturesOpen)}
                      className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between text-slate-600 dark:text-slate-350"
                    >
                      <span>Features</span>
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${mobileFeaturesOpen ? 'rotate-180 text-violet-500' : ''}`}
                      />
                    </button>
                    {mobileFeaturesOpen && (
                      <div className="pl-6 pr-2 py-1 space-y-3 border-l border-slate-100 dark:border-white/5 ml-4">
                        {megaMenuData.map((cat, idx) => (
                          <div key={idx} className="space-y-1.5 pt-1">
                            <div className="flex items-center gap-1.5">
                              {cat.icon}
                              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                {cat.category}
                              </p>
                            </div>
                            <div className="flex flex-col gap-1 pl-5">
                              {cat.items.map((item, itemIdx) => (
                                <Link
                                  key={itemIdx}
                                  to={`/features?tab=${item.tab}`}
                                  onClick={() => {
                                    setMobileMenuOpen(false);
                                    setMobileFeaturesOpen(false);
                                  }}
                                  className="block text-[11px] text-slate-500 dark:text-slate-400 hover:text-violet-500 py-1"
                                >
                                  {item.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive(link.path)
                      ? 'text-violet-600 dark:text-violet-400 bg-violet-500/8'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] flex flex-col gap-2.5">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-355 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-glow w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
