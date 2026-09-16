import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight, Play, CheckCircle, Zap,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Star, UserPlus, Mail,
  Wallet, Wrench, MessageSquare, Send,
  Shield, Activity, Sparkles, TrendingUp, Globe, Clock,
  Phone, Map, Building, FileText, UserCheck,
  ClipboardSignature, Scale, CalendarRange, Users, ShieldCheck,
  CreditCard, Megaphone, History, Sliders, RotateCcw, Sun, Moon, Bell, LayoutDashboard, Truck,
  MapPin, AlertTriangle, Building2, Folder, Download
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../../components/marketing/Logo';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';
import FaqSection from '../../components/marketing/FaqSection';
import InteractiveAssistant from '../../components/marketing/InteractiveAssistant';

import heroParkLight from '../../assets/hero_park_light.png';
import heroParkDark from '../../assets/hero_park_dark.png';
import heroGardenLight from '../../assets/hero_garden_light.png';
import heroGardenDark from '../../assets/hero_garden_dark.png';
import heroClubLight from '../../assets/hero_club_light.png';
import heroClubDark from '../../assets/hero_club_dark.png';
import heroCondoLight from '../../assets/hero_condo_light.png';
import heroCondoDark from '../../assets/hero_condo_dark.png';

import featureFinance from '../../assets/feature_finance.png';
import featureMaintenance from '../../assets/feature_maintenance.png';
import featureSecurity from '../../assets/feature_security.png';
import featureCopilot from '../../assets/feature_copilot.png';

import solutionRental from '../../assets/solution_rental.png';
import solutionCondo from '../../assets/solution_condo.png';
import solutionHoa from '../../assets/solution_hoa.png';

/* ─── Hero Image Slideshow Slides ────────────────────── */
const slides = [
  {
    title: "Central Community Park",
    desc: "Vibrant green lawns, paved walking trails & serene seating corners.",
    tag: " Society Park",
    light: heroParkLight,
    dark: heroParkDark,
    accent: "border-emerald-500/30 text-emerald-500 dark:text-emerald-400 bg-emerald-500/10"
  },
  {
    title: "Botanical & Terrace Gardens",
    desc: "Exquisite seasonal flowers, curated shrubberies & peaceful walks.",
    tag: " Botanical Gardens",
    light: heroGardenLight,
    dark: heroGardenDark,
    accent: "border-pink-500/30 text-pink-500 dark:text-pink-400 bg-pink-500/10"
  },
  {
    title: "Premium Clubhouse & Pool",
    desc: "Luxury lounge spaces, glass architecture & a refreshing pool deck.",
    tag: " Luxury Clubhouse",
    light: heroClubLight,
    dark: heroClubDark,
    accent: "border-sky-500/30 text-sky-500 dark:text-sky-400 bg-sky-500/10"
  },
  {
    title: "Modern Facade & Towers",
    desc: "High-end contemporary architecture with lush balcony integrations.",
    tag: " Modern Condominiums",
    light: heroCondoLight,
    dark: heroCondoDark,
    accent: "border-violet-500/30 text-violet-500 dark:text-violet-400 bg-violet-500/10"
  }
];

/* ─── Hero Image (Dynamic 3D Stacked Slideshow) ───────── */
const HeroImage = ({ isDark }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-play cycling effect
  useEffect(() => {
    if (isHovered) return;
    
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    
    return () => clearTimeout(timer);
  }, [currentIndex, isHovered]);

  const handleCardClick = (offset, index) => {
    if (offset !== 0) {
      setCurrentIndex(index);
    }
  };

  return (
    <div 
      className="relative w-full h-[320px] sm:h-[420px] md:h-[480px] flex items-center justify-center select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D Stack Container */}
      <div className="relative w-full h-full max-w-[90%] md:max-w-full perspective-1000">
        {slides.map((slide, index) => {
          const offset = (index - currentIndex + slides.length) % slides.length;
          
          let transformStyle = '';
          let zIndexClass = '';
          let opacityClass = '';
          let pointerEventsClass = '';

          if (offset === 0) {
            // Front Card
            transformStyle = 'translate3d(0px, 0px, 0px) scale(1) rotate(0deg)';
            zIndexClass = 'z-30';
            opacityClass = 'opacity-100';
            pointerEventsClass = 'pointer-events-auto cursor-default';
          } else if (offset === 1) {
            // Second Card
            transformStyle = 'translate3d(24px, 24px, -50px) scale(0.95) rotate(2deg)';
            zIndexClass = 'z-20';
            opacityClass = 'opacity-70 dark:opacity-60';
            pointerEventsClass = 'pointer-events-auto cursor-pointer hover:translate3d(28px, 28px, -45px)';
          } else if (offset === 2) {
            // Third Card
            transformStyle = 'translate3d(48px, 48px, -100px) scale(0.90) rotate(4deg)';
            zIndexClass = 'z-10';
            opacityClass = 'opacity-40 dark:opacity-30';
            pointerEventsClass = 'pointer-events-auto cursor-pointer hover:translate3d(52px, 52px, -95px)';
          } else {
            // Hidden Card (exit to left)
            transformStyle = 'translate3d(-120%, 20px, -150px) scale(0.85) rotate(-12deg)';
            zIndexClass = 'z-0';
            opacityClass = 'opacity-0';
            pointerEventsClass = 'pointer-events-none';
          }

          const imageSrc = isDark ? slide.dark : slide.light;

          return (
            <div
              key={index}
              className={`absolute inset-0 w-full h-full rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] border border-slate-200/50 dark:border-white/[0.08] ${zIndexClass} ${opacityClass} ${pointerEventsClass}`}
              style={{
                transform: transformStyle,
                transformStyle: 'preserve-3d',
                display: 'block',
                transformOrigin: 'center center'
              }}
              onClick={() => handleCardClick(offset, index)}
            >
              {/* Stack Wrapper */}
              <div className="relative w-full h-full transition-opacity duration-500">
                
                {/* Image */}
                <img
                  src={imageSrc}
                  alt={slide.title}
                  className="w-full h-full object-cover select-none"
                  draggable={false}
                />

                {/* Ambient dark vignette for better text contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20" />

                {/* Floating Glassmorphic Badge */}
                {offset === 0 && (
                  <div className="absolute top-6 left-6 animate-fade-in-up">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md ${slide.accent}`}>
                      {slide.tag}
                    </span>
                  </div>
                )}

                {/* Content Overlay (Title, Description, Progress indicator) */}
                {offset === 0 && (
                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 flex flex-col gap-4 text-white animate-fade-in-up">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-md text-white">
                        {slide.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-200/90 font-medium mt-1.5 drop-shadow-sm max-w-[90%]">
                        {slide.desc}
                      </p>
                    </div>

                    {/* Pagination / Instagram-style story progress line */}
                    <div className="flex gap-2 w-full mt-2">
                      {slides.map((_, dotIndex) => {
                        const isActive = dotIndex === currentIndex;
                        return (
                          <div 
                            key={dotIndex} 
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentIndex(dotIndex);
                            }}
                            className="h-1 flex-1 bg-white/20 rounded-full cursor-pointer overflow-hidden relative"
                          >
                            {isActive && (
                              <div 
                                key={`${dotIndex}-${isHovered}`}
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-400 to-indigo-500 animate-progress-bar"
                                style={{
                                  animationPlayState: isHovered ? 'paused' : 'running',
                                  width: isHovered ? '0%' : 'auto'
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Stat Counter ───────────────────────────────────── */
function StatCounter({ end, suffix = '', prefix = '', duration = 1800 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const startTime = performance.now();
        const step = (now) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(eased * end));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

/* ─── 8 Core Features Data Structure (Consolidated & Enriched) ────────── */
const featureList = [
  {
    number: '01',
    title: 'Rental Properties Hub',
    tagline: 'Centralized property directory',
    desc: 'Add and organize your rental properties and residential homes. Track occupancy status, monthly rental rates, and property addresses seamlessly.',
    icon: Building2,
    gradient: 'from-cyan-500 to-sky-600',
    textColor: 'text-cyan-500',
    glowRgb: 'rgba(6, 182, 212, 0.25)',
    borderClass: 'border-cyan-500/20 dark:border-cyan-500/10 hover:border-cyan-500/50',
    shadowColor: 'hover:shadow-cyan-500/10',
    cardBg: 'bg-gradient-to-br from-cyan-500/[0.04] via-transparent to-sky-950/[0.04] dark:from-cyan-950/20 dark:via-transparent dark:to-sky-950/15',
    details: [
      'Residential property setup',
      'Real-time Vacant/Occupied status',
      'Property addresses & rent rates',
      'Portfolio-wide property overview'
    ]
  },
  {
    number: '02',
    title: 'Maintenance Desk',
    tagline: 'Smart ticket management',
    desc: 'Log repair requests, dispatch certified contractors, track resolution progress end-to-end, and notify tenants in real-time.',
    icon: Wrench,
    gradient: 'from-blue-500 to-indigo-600',
    textColor: 'text-blue-500',
    glowRgb: 'rgba(59, 130, 246, 0.25)',
    borderClass: 'border-blue-500/20 dark:border-blue-500/10 hover:border-blue-500/50',
    shadowColor: 'hover:shadow-blue-500/10',
    cardBg: 'bg-gradient-to-br from-blue-500/[0.04] via-transparent to-indigo-950/[0.04] dark:from-blue-950/20 dark:via-transparent dark:to-indigo-950/15',
    details: [
      'Tenant repair request submission',
      'Direct Contractor ticket dispatch',
      'Real-time status tracking log',
      'Photo attachment & issue notes'
    ]
  },
  {
    number: '03',
    title: 'Lease Agreements',
    tagline: 'Digital contract management',
    desc: 'Draft and manage active tenant leases with custom rent amounts, security deposits, validity periods, and digital archives.',
    icon: FileText,
    gradient: 'from-amber-500 to-orange-600',
    textColor: 'text-amber-500',
    glowRgb: 'rgba(245, 158, 11, 0.25)',
    borderClass: 'border-amber-500/20 dark:border-amber-500/10 hover:border-amber-500/50',
    shadowColor: 'hover:shadow-amber-500/10',
    cardBg: 'bg-gradient-to-br from-amber-500/[0.04] via-transparent to-orange-950/[0.04] dark:from-amber-950/20 dark:via-transparent dark:to-orange-950/15',
    details: [
      'Digital lease drafting & storage',
      'Rent & security deposit terms',
      'Lease validity & expiry tracking',
      'Direct tenant property linking'
    ]
  },
  {
    number: '04',
    title: 'Tenants Directory',
    tagline: 'Resident profiles & rosters',
    desc: 'Maintain complete tenant directories with verified contact information, active lease links, and structured resident profiles.',
    icon: Users,
    gradient: 'from-indigo-500 to-purple-600',
    textColor: 'text-indigo-500',
    glowRgb: 'rgba(99, 102, 241, 0.25)',
    borderClass: 'border-indigo-500/20 dark:border-indigo-500/10 hover:border-indigo-500/50',
    shadowColor: 'hover:shadow-indigo-500/10',
    cardBg: 'bg-gradient-to-br from-indigo-500/[0.04] via-transparent to-purple-950/[0.04] dark:from-indigo-950/20 dark:via-transparent dark:to-purple-950/15',
    details: [
      'Complete tenant contact profiles',
      'Active lease & property association',
      'Tenant portal access management',
      'Direct onboarding status'
    ]
  },
  {
    number: '05',
    title: 'Rent Ledger',
    tagline: 'Automated billing engine',
    desc: 'Send invoices, track rent collections, manage payment ledgers, and auto-reconcile with PCI-DSS compliant gateways.',
    icon: Wallet,
    gradient: 'from-emerald-500 to-teal-600',
    textColor: 'text-emerald-500',
    glowRgb: 'rgba(16, 185, 129, 0.25)',
    borderClass: 'border-emerald-500/20 dark:border-emerald-500/10 hover:border-emerald-500/50',
    shadowColor: 'hover:shadow-emerald-500/10',
    cardBg: 'bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-teal-950/[0.04] dark:from-emerald-950/20 dark:via-transparent dark:to-teal-950/15',
    details: [
      'Paid, pending & overdue filters',
      'Monthly rent billing tracker',
      'Real-time collection rate metrics',
      'Property-level accounting balances'
    ]
  },
  {
    number: '06',
    title: 'Payments Hub',
    tagline: 'Digital & manual records',
    desc: 'Log online digital transactions and manual cash or check receipts with instant verification and complete payment history.',
    icon: CreditCard,
    gradient: 'from-rose-500 to-red-600',
    textColor: 'text-rose-500',
    glowRgb: 'rgba(244, 63, 94, 0.25)',
    borderClass: 'border-rose-500/20 dark:border-rose-500/10 hover:border-rose-500/50',
    shadowColor: 'hover:shadow-rose-500/10',
    cardBg: 'bg-gradient-to-br from-rose-500/[0.04] via-transparent to-red-950/[0.04] dark:from-rose-950/20 dark:via-transparent dark:to-red-950/15',
    details: [
      'Digital payment gateway sync',
      'Manual cash & check entry',
      'Downloadable payment receipts',
      'Verified transaction archives'
    ]
  },
  {
    number: '07',
    title: 'Contractors / Vendors',
    tagline: 'Certified vendor dispatch',
    desc: 'Manage electricians, plumbers, and maintenance specialists. Assign work orders and monitor resolution speed.',
    icon: Truck,
    gradient: 'from-fuchsia-500 to-pink-600',
    textColor: 'text-fuchsia-500',
    glowRgb: 'rgba(217, 70, 239, 0.25)',
    borderClass: 'border-fuchsia-500/20 dark:border-fuchsia-500/10 hover:border-fuchsia-500/50',
    shadowColor: 'hover:shadow-fuchsia-500/10',
    cardBg: 'bg-gradient-to-br from-fuchsia-500/[0.04] via-transparent to-pink-950/[0.04] dark:from-fuchsia-950/20 dark:via-transparent dark:to-pink-950/15',
    details: [
      'Certified contractor directory',
      'Direct ticket assignment flow',
      'Contact & trade categorization',
      'Work completion tracking'
    ]
  },
  {
    number: '08',
    title: 'Reports & Analytics',
    tagline: 'Portfolio cashflow & metrics',
    desc: 'Generate real-time cashflow summaries, track rental income vs expenses, and export complete audit packages anytime.',
    icon: TrendingUp,
    gradient: 'from-violet-600 to-purple-700',
    textColor: 'text-violet-600',
    glowRgb: 'rgba(139, 92, 246, 0.25)',
    borderClass: 'border-violet-500/20 dark:border-violet-500/10 hover:border-violet-500/50',
    shadowColor: 'hover:shadow-violet-600/10',
    cardBg: 'bg-gradient-to-br from-violet-600/[0.04] via-transparent to-purple-950/[0.04] dark:from-violet-950/20 dark:via-transparent dark:to-purple-950/15',
    details: [
      'Real-time Income vs Expense chart',
      'Rent collection efficiency rate',
      '1-Click CSV/PDF report exports',
      'Action audit logs & history'
    ]
  }
];

/* ─── 3D Perspective Card Component ──────────────────── */
function InteractiveFeatureCard({ feature }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef(null);
  const isFlippedRef = useRef(false);

  const handleMouseMove = (e) => {
    if (isFlippedRef.current) return; // Disable tilt when flipped (checked synchronously)
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((centerY - y) / centerY) * 12; // Max 12 deg tilt
    const rotateY = ((x - centerX) / centerX) * 12; // Max 12 deg tilt

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
    card.style.setProperty('--x', `${x}px`);
    card.style.setProperty('--y', `${y}px`);
  };

  const handleMouseLeave = () => {
    if (isFlippedRef.current) return; // Disable hover reset if the card is flipped (checked synchronously)
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  };

  const handleFlip = (e) => {
    e.stopPropagation();
    const nextFlipped = !isFlipped;
    setIsFlipped(nextFlipped);
    isFlippedRef.current = nextFlipped; // Update synchronously to intercept incoming mouse moves
    const card = cardRef.current;
    if (card) {
      card.style.transform = nextFlipped 
        ? 'perspective(1000px) rotateY(180deg)' 
        : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    }
  };

  const IconComponent = feature.icon;

  return (
    <div className="w-full h-[235px] sm:h-[240px] perspective-1000 cursor-pointer group" onClick={handleFlip}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: isFlipped ? 'rotateY(180deg)' : 'none',
          transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease'
        }}
        className={`w-full h-full preserve-3d relative rounded-2xl border ${feature.borderClass} shadow-sm hover:shadow-xl transition-all duration-300 ${
          isFlipped ? '' : `${feature.shadowColor} ${feature.cardBg}`
        } bg-white dark:bg-[#0D1B2A]`}
      >
        {/* --- FRONT FACE --- */}
        <div className="absolute inset-0 backface-hidden rounded-2xl p-4 sm:p-5 flex flex-col justify-between overflow-hidden">
          {/* Tracking radial light glow (always visible soft glow, brightens on hover) */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity duration-500 z-0"
            style={{
              background: `radial-gradient(circle 160px at var(--x, 50%) var(--y, 35%), ${feature.glowRgb}, transparent)`
            }}
          />
          {/* Top border accent line */}
          <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${feature.gradient} z-10`} />

          <div className="space-y-3 relative z-10 flex-1 flex flex-col">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-md transform group-hover:rotate-3 transition-transform duration-300 shrink-0`}>
              <IconComponent className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="space-y-1 flex-1">
              <div>
                <span className="text-[8.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Module {feature.number}</span>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug">{feature.title}</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">{feature.tagline}</p>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal pt-0.5 line-clamp-3 sm:line-clamp-none">
                {feature.desc}
              </p>
            </div>
          </div>
        </div>

        {/* --- BACK FACE --- */}
        <div className={`absolute inset-0 backface-hidden rotate-y-180 rounded-2xl bg-gradient-to-br ${feature.gradient} p-4 sm:p-5 flex flex-col justify-between overflow-hidden text-white shadow-xl`}>
          <div className="space-y-2.5 flex-1">
            <div className="flex items-center gap-2 pb-2 border-b border-white/20">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <IconComponent className="w-3.5 h-3.5 text-white" />
              </div>
              <h4 className="font-black text-xs sm:text-sm text-white leading-tight">{feature.title}</h4>
            </div>

            <ul className="space-y-1.5">
              {feature.details.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-[10.5px] sm:text-[11px] text-white/95">
                  <CheckCircle className="w-3 h-3 shrink-0 mt-0.5 text-white" />
                  <span className="leading-tight font-medium">{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Premium Custom Testimonial Card Component ───────── */
function TestimonialCard({ testimonial }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--x', `${x}px`);
    card.style.setProperty('--y', `${y}px`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`relative group rounded-3xl p-8 pt-14 flex flex-col justify-between border ${testimonial.borderColor} ${testimonial.cardBg} transition-all duration-500 hover:-translate-y-2 shadow-sm hover:shadow-2xl ${testimonial.glowColor} shrink-0 w-full h-full`}
    >
      {/* Absolute inner wrapper for background effects that needs overflow-hidden */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none z-0">
        {/* Spotlight mouse glow overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"
          style={{
            background: `radial-gradient(circle 200px at var(--x, 50%) var(--y, 50%), ${testimonial.glowRgb}, transparent)`
          }}
        />

        {/* Elegant quotation watermark in background */}
        <div className={`absolute bottom-6 right-8 text-[110px] leading-none select-none font-serif opacity-[0.03] dark:opacity-[0.05] transition-opacity duration-500 group-hover:opacity-[0.08] ${testimonial.textColor}`}>
          “
        </div>
      </div>

      {/* Floating profile avatar badge (overlapping top border) - Placed outside the overflow-hidden wrapper */}
      <div className="absolute top-0 left-8 -translate-y-1/2 z-20">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-black text-base shadow-lg border-4 border-slate-50 dark:border-[#090F16] transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3`}>
          {testimonial.avatar}
        </div>
      </div>

      {/* Floating portfolio scale badge */}
      <div className="absolute top-4 right-6 z-20">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[9px] font-extrabold tracking-wide uppercase backdrop-blur-md bg-white/40 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.08] ${testimonial.textColor}`}>
          {testimonial.portfolio}
        </span>
      </div>

      {/* Rating stars */}
      <div className="flex gap-1 mb-5 relative z-10">
        {[...Array(testimonial.rating)].map((_, i) => (
          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
        ))}
      </div>

      {/* Testimonial text */}
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium mb-8 relative z-10 italic">
        "{testimonial.comment}"
      </p>

      {/* Author info (docked at bottom) */}
      <div className="relative z-10 pt-4 border-t border-slate-100 dark:border-white/[0.04] mt-auto">
        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{testimonial.name}</h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
          {testimonial.role} &middot; <span className="opacity-80">{testimonial.society}</span>
        </p>
      </div>
    </div>
  );
}

/* ─── Lease Agreements Console ─── */
function LeaseOperationsConsole() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`w-full rounded-2xl overflow-hidden shadow-xl border transition-all ${isDark ? 'shadow-indigo-900/30 border-white/[0.08]' : 'shadow-slate-200/80 border-slate-200'} relative h-[340px] sm:h-[350px] flex flex-col justify-between`} style={{ background: isDark ? 'linear-gradient(145deg, #090a1f 0%, #101438 50%, #060817 100%)' : 'linear-gradient(145deg, #f8fafc 0%, #eef2ff 50%, #e2e8f0 100%)' }}>
      {isDark && (
        <>
          <div className="absolute top-0 right-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-violet-500/10 rounded-full blur-[60px] pointer-events-none" />
        </>
      )}

      {/* Header */}
      <div className={`relative px-4 py-2.5 flex items-center justify-between border-b shrink-0 h-[52px] ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50/50 border-slate-200'}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
            <FileText size={16} className="text-white" />
          </div>
          <div className="text-left">
            <h3 className={`font-bold text-xs sm:text-sm leading-none ${isDark ? 'text-white' : 'text-slate-800'}`}>Lease Agreements</h3>
            <p className="text-[9.5px] text-slate-400 mt-0.5">Active contracts & tenant terms</p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[9.5px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
          Active Leases
        </span>
      </div>

      {/* Main Content Body */}
      <div className="p-3.5 flex-1 flex flex-col justify-center space-y-2 text-left overflow-hidden">
        {/* Metrics Row */}
        <div className={`grid grid-cols-3 rounded-lg border ${isDark ? 'divide-x divide-white/[0.05] bg-white/[0.02] border-white/[0.05]' : 'divide-x divide-slate-200/80 bg-white border-slate-200/80'} shadow-sm`}>
          {[
            { label: 'Occupancy', val: '100%', color: 'text-indigo-600 dark:text-indigo-400' },
            { label: 'Avg Rent', val: '$1,900', color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Deposits', val: '$5,700', color: 'text-amber-600 dark:text-amber-400' }
          ].map((m, i) => (
            <div key={i} className="p-1 text-center">
              <div className={`text-[11px] font-black ${m.color} tracking-tight`}>{m.val}</div>
              <div className={`text-[7.5px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Leases List */}
        <div className="space-y-1.5">
          {[
            { tenant: 'Sarah Jenkins', prop: '742 Evergreen Terrace', rent: '$1,850/mo', exp: 'Expires Jun 2027', status: 'Active', badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
            { tenant: 'David Miller', prop: '128 Oakwood Blvd', rent: '$2,200/mo', exp: 'Expires Dec 2026', status: 'Active', badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
            { tenant: 'Emily Zhang', prop: '500 Sunset Way', rent: '$1,650/mo', exp: 'Expires in 28 days', status: 'Renewal Due', badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' }
          ].map((item, idx) => (
            <div key={idx} className={`p-2 rounded-xl border flex items-center justify-between gap-3 text-[9.5px] ${
              isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{item.tenant}</span>
                  <span className="text-[8px] text-slate-400">· {item.exp}</span>
                </div>
                <p className="text-[8.5px] text-slate-400 truncate">{item.prop}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400 block text-[10px]">{item.rent}</span>
                <span className={`text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border inline-block mt-0.5 ${item.badgeColor}`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer bar */}
      <div className={`px-4 py-2 flex items-center justify-between border-t shrink-0 h-[46px] ${isDark ? 'border-white/[0.05] bg-white/[0.02]' : 'border-slate-200 bg-slate-50'}`}>
        <span className="text-[9.5px] text-slate-500 dark:text-slate-400">Digital signatures & lease agreements</span>
        <span className="flex items-center gap-1 text-[9.5px] text-indigo-600 dark:text-indigo-400 font-bold cursor-pointer hover:underline">
          View All Leases →
        </span>
      </div>
    </div>
  );
}

/* ─── Properties Console ─── */
function PropertiesOperationsConsole() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`w-full rounded-2xl overflow-hidden shadow-xl border transition-all ${isDark ? 'shadow-blue-900/30 border-white/[0.08]' : 'shadow-slate-200/80 border-slate-200'} relative h-[340px] sm:h-[350px] flex flex-col justify-between`} style={{ background: isDark ? 'linear-gradient(145deg, #07162c 0%, #0b1a36 50%, #050d18 100%)' : 'linear-gradient(145deg, #f8fafc 0%, #f0f7ff 50%, #e2e8f0 100%)' }}>
      {isDark && (
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />
      )}

      {/* Header */}
      <div className={`relative px-4 py-2.5 flex items-center justify-between border-b shrink-0 h-[52px] ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50/50 border-slate-200'}`}>
        <div className="flex items-center gap-2.5 text-left">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md shadow-blue-500/30">
            <Building2 size={16} className="text-white" />
          </div>
          <div>
            <h3 className={`font-bold text-xs sm:text-sm leading-none ${isDark ? 'text-white' : 'text-slate-800'}`}>Property Portfolio</h3>
            <p className="text-[9.5px] text-slate-400 mt-0.5">Residential rental properties & addresses</p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[9.5px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
          3 Properties
        </span>
      </div>

      {/* Property Cards */}
      <div className="p-3.5 flex-1 flex flex-col justify-center space-y-2 text-left overflow-hidden">
        {[
          { name: "Evergreen Terrace Villa", type: "Single Family", address: "742 Evergreen Terrace, Portland, OR", tenant: "Tenant: Sarah Jenkins", revenue: "$1,850/mo", status: "Occupied" },
          { name: "Oakwood Residential Home", type: "Single Family", address: "128 Oakwood Blvd, Seattle, WA", tenant: "Tenant: David Miller", revenue: "$2,200/mo", status: "Occupied" },
          { name: "Sunset Hill Residence", type: "Single Family", address: "500 Sunset Way, Austin, TX", tenant: "Tenant: Vacant / Listed", revenue: "$1,650/mo", status: "Vacant" }
        ].map((prop, i) => (
          <div key={i} className={`p-2.5 rounded-xl border transition-all ${
            isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className={`text-[11px] font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{prop.name}</h4>
                  <span className="text-[8px] font-medium text-slate-400">· {prop.type}</span>
                </div>
                <p className="text-[8.5px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin size={10} className="text-blue-500 shrink-0" />
                  <span className="truncate">{prop.address}</span>
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-extrabold text-blue-600 dark:text-blue-400 text-[10.5px] block">{prop.revenue}</span>
                <span className={`text-[7.5px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                  prop.status === 'Occupied' 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                }`}>
                  {prop.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer bar */}
      <div className={`px-4 py-2 flex items-center justify-between border-t shrink-0 h-[46px] ${isDark ? 'border-white/[0.05] bg-white/[0.02]' : 'border-slate-200 bg-slate-50'}`}>
        <span className="text-[9.5px] text-slate-500 dark:text-slate-400">3 Properties · Real-time occupancy tracking</span>
        <span className="flex items-center gap-1 text-[9.5px] text-blue-600 dark:text-blue-400 font-bold cursor-pointer hover:underline">
          Manage Properties →
        </span>
      </div>
    </div>
  );
}

/* ─── Maintenance Operations Console ─── */
function MaintenanceOperationsConsole() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`w-full rounded-2xl overflow-hidden shadow-xl border transition-all ${isDark ? 'shadow-emerald-900/30 border-white/[0.08]' : 'shadow-slate-200/80 border-slate-200'} relative h-[340px] sm:h-[350px] flex flex-col justify-between`} style={{ background: isDark ? 'linear-gradient(145deg, #051a10 0%, #0a2418 50%, #030f0a 100%)' : 'linear-gradient(145deg, #f8fafc 0%, #f0fdf4 50%, #e2e8f0 100%)' }}>
      {isDark && (
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-emerald-600/10 rounded-full blur-[80px] pointer-events-none" />
      )}

      {/* Header */}
      <div className={`relative px-4 py-2.5 flex items-center justify-between border-b shrink-0 h-[52px] ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50/50 border-slate-200'}`}>
        <div className="flex items-center gap-2.5 text-left">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/30">
            <Wrench size={16} className="text-white" />
          </div>
          <div>
            <h3 className={`font-bold text-xs sm:text-sm leading-none ${isDark ? 'text-white' : 'text-slate-800'}`}>Maintenance Desk</h3>
            <p className="text-[9.5px] text-slate-400 mt-0.5">Active work orders & vendor dispatches</p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
          Active Orders
        </span>
      </div>

      {/* Work Orders */}
      <div className="p-3 flex-1 space-y-1.5 flex flex-col justify-center text-left overflow-hidden">
        {[
          { text: "742 Evergreen Terrace: Kitchen sink faucet repair", done: false, badge: "In Progress" },
          { text: "128 Oakwood Blvd: Annual HVAC filter check & tune-up", done: true, badge: "Completed" },
          { text: "500 Sunset Way: Electronic front door smart lock battery", done: false, badge: "Open" },
          { text: "312 Pine Street: Water heater pressure relief inspection", done: true, badge: "Completed" }
        ].map((item, i) => (
          <div key={i} className={`p-2 rounded-xl border flex items-center justify-between gap-3 transition-all ${
            item.done 
              ? 'bg-slate-500/5 dark:bg-white/[0.02] border-slate-200/40 dark:border-white/5 opacity-75' 
              : isDark ? 'bg-white/[0.02] border-emerald-500/20 shadow-sm' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border text-[7px] shrink-0 font-bold ${
                item.done 
                  ? 'bg-emerald-500 border-emerald-500 text-white' 
                  : isDark ? 'border-white/30 text-transparent' : 'border-slate-300 text-transparent'
              }`}></span>
              <span className={`text-[10.5px] font-semibold truncate ${item.done ? 'line-through text-slate-400 dark:text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>{item.text}</span>
            </div>
            <span className={`text-[7.5px] font-extrabold px-1.5 py-0.5 rounded border uppercase shrink-0 ${
              item.done 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                : item.badge === 'In Progress'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
            }`}>{item.badge}</span>
          </div>
        ))}
      </div>

      {/* Footer bar */}
      <div className={`px-4 py-2 flex items-center justify-between border-t shrink-0 h-[46px] ${isDark ? 'border-white/[0.05] bg-white/[0.02]' : 'border-slate-200 bg-slate-50'}`}>
        <span className="text-[9.5px] text-slate-500 dark:text-slate-400">2 active · 2 completed</span>
        <span className="flex items-center gap-1 text-[9.5px] text-emerald-600 dark:text-emerald-400 font-bold cursor-pointer hover:underline text-left">
          Manage Dispatch →
        </span>
      </div>
    </div>
  );
}

function PaymentsOperationsConsole() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`w-full rounded-2xl overflow-hidden shadow-xl border transition-all ${isDark ? 'shadow-teal-900/30 border-white/[0.08]' : 'shadow-slate-200/80 border-slate-200'} relative h-[340px] sm:h-[350px] flex flex-col justify-between`} style={{ background: isDark ? 'linear-gradient(145deg, #031818 0%, #062828 50%, #020e0e 100%)' : 'linear-gradient(145deg, #f8fafc 0%, #f0fdfa 50%, #e2e8f0 100%)' }}>
      {isDark && (
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-teal-600/10 rounded-full blur-[80px] pointer-events-none" />
      )}

      {/* Header */}
      <div className={`relative px-4 py-2.5 flex items-center justify-between border-b shrink-0 h-[52px] ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50/50 border-slate-200'}`}>
        <div className="flex items-center gap-2.5 text-left">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md shadow-teal-500/30">
            <Wallet size={16} className="text-white" />
          </div>
          <div>
            <h3 className={`font-bold text-xs sm:text-sm leading-none ${isDark ? 'text-white' : 'text-slate-800'}`}>Rent Ledger & Invoices</h3>
            <p className="text-[9.5px] text-slate-400 mt-0.5">Automated rent collection ledger</p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[9.5px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full">
          Current Month
        </span>
      </div>

      {/* Metrics & Ledger Preview */}
      <div className="p-3 flex-1 flex flex-col justify-center space-y-2 text-left overflow-hidden">
        <div className="flex items-center gap-3 p-2 rounded-xl border border-slate-200/60 dark:border-white/5 bg-white/50 dark:bg-white/[0.01]">
          <div className="relative w-9 h-9 shrink-0">
            <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90">
              <circle cx="18" cy="18" r="14.5" fill="none" stroke={isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"} strokeWidth="3.5" />
              <circle cx="18" cy="18" r="14.5" fill="none" stroke="#14B8A6" strokeWidth="3.5" strokeDasharray="88 100" strokeLinecap="round" />
            </svg>
            <div className={`absolute inset-0 flex items-center justify-center text-[9px] font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>88%</div>
          </div>
          <div>
            <p className={`text-xs sm:text-sm font-black leading-none ${isDark ? 'text-white' : 'text-slate-800'}`}>$23,350.00 Collected</p>
            <p className="text-[8.5px] text-slate-400 mt-0.5">$1,850 Pending • $1,650 Overdue</p>
          </div>
        </div>

        <div className="space-y-1 text-left">
          {[
            { title: "742 Evergreen Terrace (Sarah Jenkins) - Monthly Rent", desc: "Digital bank transfer (Stripe)", amt: "+$1,850.00", status: "Paid" },
            { title: "500 Sunset Way (Late Rent + $50 Late Fee)", desc: "Automated payment reminder sent", amt: "+$1,700.00", status: "Overdue" }
          ].map((item, idx) => (
            <div key={idx} className={`p-1.5 rounded-lg border flex items-center justify-between text-[9.5px] ${
              isDark ? 'bg-white/[0.01] border-white/5' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <h4 className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{item.title}</h4>
                <p className="text-[8px] text-slate-400">{item.desc}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-extrabold text-teal-600 dark:text-teal-400 block">{item.amt}</span>
                <span className={`text-[7.5px] font-black uppercase tracking-wider ${item.status === 'Paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer bar */}
      <div className={`px-4 py-2 flex items-center justify-between border-t shrink-0 h-[46px] ${isDark ? 'border-white/[0.05] bg-white/[0.02]' : 'border-slate-200 bg-slate-50'}`}>
        <span className="text-[9.5px] text-slate-500 dark:text-slate-400">Verified Rental Ledger</span>
        <span className="flex items-center gap-1 text-[8.5px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
          Audited
        </span>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [openFaq, setOpenFaq] = useState(null);
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  // Landlord Rental dashboard data
  const pd = {
    managerName: 'James Mitchell',
    managerRole: 'LANDLORD',
    managerInitials: 'JM',
    managerColor: 'bg-teal-500',
    contextLabel: 'MY PORTFOLIO',
    communityName: 'All Properties',
    communityCode: '3 Props ▾',
    welcomeMsg: 'Welcome back, James! 🔑',
    subMsg: 'Rental Portfolio Summary · Real-Time Property Overview',
    badge1: 'Props Loan: 3',
    badge1color: isDark ? 'bg-white/5 text-slate-300 border-white/10' : 'bg-slate-100 text-slate-600 border-slate-200',
    badge2: 'ACTIVE',
    badge2color: 'text-teal-700 dark:text-teal-400 bg-teal-500/10 border-teal-500/20',
    address: '742 Evergreen Terrace, Portland, OR 97201',
    stats: [
      { val: '3', label: 'Properties', color: 'text-teal-600 dark:text-teal-400' },
      { val: '3', label: 'Active Leases', color: 'text-blue-600 dark:text-blue-400' },
      { val: '3', label: 'Tenants', color: 'text-violet-600 dark:text-violet-400' },
      { val: '2', label: 'Open Tickets', color: 'text-amber-600 dark:text-amber-400' },
    ],
    leftPanelTitle: 'Rent Overview',
    rightPanelTitle: 'Action Required',
    rightPanelSub: 'Tenant Requests ●4',
  };

  const automationSlides = [
    {
      tabLabel: "🔧 Maintenance Kanban",
      badge: "Work Orders & Repairs",
      title: "Interactive Kanban Desk",
      subtitle: "for rental maintenance dispatches.",
      desc: "Coordinate rental repairs and tenant service requests. Track issues in real-time, dispatch jobs directly to certified contractors, and manage task statuses from an intuitive board.",
      points: [
        { icon: '🔧', text: 'Drag-and-drop repair ticket triage & status updates' },
        { icon: '👷', text: 'Assign work orders directly to verified vendors' },
        { icon: '📝', text: 'Attach repair photos and landlord internal notes' },
        { icon: '⚡', text: 'Real-time tenant status updates upon job completion' }
      ],
      linkText: "Explore Maintenance Features",
      linkTo: "/features",
      badgeColor: "bg-emerald-500/10 border-emerald-500/25 text-emerald-650 dark:text-emerald-400",
      btnColor: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25",
      image: featureMaintenance,
      component: <MaintenanceOperationsConsole />
    },
    {
      tabLabel: "📄 Lease Agreements",
      badge: "Digital Leases & Contracts",
      title: "Active Lease Tracking",
      subtitle: "and automated renewals.",
      desc: "Create, monitor, and organize digital tenant leases. Keep track of start and end dates, security deposit balances, monthly rent terms, and renewal timelines.",
      points: [
        { icon: '📄', text: 'Store 12-month and custom residential lease agreements' },
        { icon: '💰', text: 'Record security deposits, monthly rent and fee terms' },
        { icon: '👤', text: 'Centralized tenant directory linked to individual properties' },
        { icon: '🔔', text: 'Automated 30-day and 60-day lease expiration alerts' }
      ],
      linkText: "Explore Leases",
      linkTo: "/features",
      badgeColor: "bg-indigo-500/10 border-indigo-500/25 text-indigo-600 dark:text-indigo-400",
      btnColor: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25",
      image: featureSecurity,
      component: <LeaseOperationsConsole />
    },
    {
      tabLabel: "🏠 Property Portfolio",
      badge: "Properties & Addresses",
      title: "Property Portfolio Hub",
      subtitle: "with live occupancy tracking.",
      desc: "Organize your residential rental properties and homes in a single workspace. Monitor real-time rental rates, tenant occupancy, and property addresses.",
      points: [
        { icon: '🏠', text: 'Residential rental properties & addresses management' },
        { icon: '📊', text: 'Live occupancy & vacancy tracking across all properties' },
        { icon: '📍', text: 'Complete property location and tenant mapping' },
        { icon: '🏷️', text: 'Monthly rental pricing and security deposit records' }
      ],
      linkText: "Explore Properties",
      linkTo: "/features",
      badgeColor: "bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-400",
      btnColor: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25",
      image: featureCopilot,
      component: <PropertiesOperationsConsole />
    },
    {
      tabLabel: "💼 Rent Ledger",
      badge: "Rent Collection & Accounting",
      title: "Rent Collection Ledger",
      subtitle: "and cashflow accounting.",
      desc: "Track monthly tenant rental payments on a centralized accounting ledger. Issue invoices, record bank payments, manage deposits, and generate income reports.",
      points: [
        { icon: '💳', text: 'Real-time record of paid, pending, and overdue rent' },
        { icon: '📈', text: 'Automated cashflow metrics tracking net rental income' },
        { icon: '🏦', text: 'Direct logging of digital transfers, cash, and checks' },
        { icon: '📋', text: 'Clean financial audit trails linked to each unit' }
      ],
      linkText: "Explore Rent Ledger",
      linkTo: "/features",
      badgeColor: "bg-teal-500/10 border-teal-500/25 text-teal-650 dark:text-teal-400",
      btnColor: "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/25",
      image: featureFinance,
      component: <PaymentsOperationsConsole />
    }
  ];

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    const fullWord = "Rental Property Management";
    if (typedText.length < fullWord.length) {
      const timer = setTimeout(() => {
        setTypedText(fullWord.substring(0, typedText.length + 1));
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [typedText]);

  const location = useLocation();
  const solutionsSectionRef = useRef(null);
  const [activeSolution, setActiveSolution] = useState('rental');

  // Parse URL search query for solutions tab
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get('type');
    const validTypes = ['rental', 'condo', 'hoa'];
    if (type && validTypes.includes(type)) {
      setActiveSolution(type);
      setTimeout(() => {
        if (solutionsSectionRef.current) {
          solutionsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    } else if (location.hash === '#solutions') {
      setTimeout(() => {
        if (solutionsSectionRef.current) {
          solutionsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  }, [location]);

  /* ─── Simulator State: Rental ─── */
  const [rentalUnits, setRentalUnits] = useState([
    { id: '101', occupant: 'Sarah Jenkins', rent: 1850, status: 'Paid', date: 'June 1' },
    { id: '102', occupant: 'Marcus Vance', rent: 2100, status: 'Overdue', date: 'June 5' },
    { id: '103', occupant: 'Aria Sterling', rent: 1950, status: 'Paid', date: 'June 2' },
    { id: '104', occupant: 'N/A', rent: 2000, status: 'Vacant', date: '-' }
  ]);
  const [rentalSendingId, setRentalSendingId] = useState(null);

  const sendRentalNotice = (id) => {
    setRentalSendingId(id);
    setTimeout(() => {
      setRentalUnits(prev => prev.map(unit => {
        if (unit.id === id) {
          return { ...unit, status: 'Notice Sent' };
        }
        return unit;
      }));
      setRentalSendingId(null);
    }, 1200);
  };

  const resetRentalDemo = () => {
    setRentalUnits([
      { id: '101', occupant: 'Sarah Jenkins', rent: 1850, status: 'Paid', date: 'June 1' },
      { id: '102', occupant: 'Marcus Vance', rent: 2100, status: 'Overdue', date: 'June 5' },
      { id: '103', occupant: 'Aria Sterling', rent: 1950, status: 'Paid', date: 'June 2' },
      { id: '104', occupant: 'N/A', rent: 2000, status: 'Vacant', date: '-' }
    ]);
  };

  /* ─── Simulator State: Condo ─── */
  const [selectedFacility, setSelectedFacility] = useState('pool');
  const [bookedSlots, setBookedSlots] = useState({
    'pool_09:00': true,
    'gym_13:00': true,
    'tennis_15:00': true
  });
  const [bookingMsg, setBookingMsg] = useState(null);

  const toggleSlot = (facility, time) => {
    const slotKey = `${facility}_${time}`;
    if (bookedSlots[slotKey]) {
      setBookedSlots(prev => {
        const next = { ...prev };
        delete next[slotKey];
        return next;
      });
      setBookingMsg(null);
    } else {
      setBookedSlots(prev => ({ ...prev, [slotKey]: true }));
      const rsvCode = `RSV-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      setBookingMsg(`Booking confirmed for ${time}! Reference: ${rsvCode}`);
      setTimeout(() => setBookingMsg(null), 4000);
    }
  };

  /* ─── Simulator State: Apartment ─── */
  const [apartmentTickets, setApartmentTickets] = useState([
    { id: 'T-802', title: 'Elevator C Braking Noise', priority: 'High', status: 'Unassigned', contractor: 'None' },
    { id: 'T-803', title: 'Basement Parking Pipe Leak', priority: 'High', status: 'Unassigned', contractor: 'None' },
    { id: 'T-804', title: 'Breezeway Light Replacement', priority: 'Low', status: 'Completed', contractor: 'Elite Electrics' }
  ]);
  const [assigningTicketId, setAssigningTicketId] = useState(null);
  const [dispatchStatus, setDispatchStatus] = useState(null);

  const assignTicket = (ticketId, vendor) => {
    setAssigningTicketId(ticketId);
    setDispatchStatus("Connecting with vendor network...");
    setTimeout(() => {
      setDispatchStatus(`Generating temporary gate pass OTP for ${vendor}...`);
      setTimeout(() => {
        setApartmentTickets(prev => prev.map(t => {
          if (t.id === ticketId) {
            return { ...t, status: 'Dispatched', contractor: vendor };
          }
          return t;
        }));
        setAssigningTicketId(null);
        setDispatchStatus(null);
      }, 1000);
    }, 1000);
  };

  const resetApartmentDemo = () => {
    setApartmentTickets([
      { id: 'T-802', title: 'Elevator C Braking Noise', priority: 'High', status: 'Unassigned', contractor: 'None' },
      { id: 'T-803', title: 'Basement Parking Pipe Leak', priority: 'High', status: 'Unassigned', contractor: 'None' },
      { id: 'T-804', title: 'Breezeway Light Replacement', priority: 'Low', status: 'Completed', contractor: 'Elite Electrics' }
    ]);
  };

  /* ─── Simulator State: HOA e-Voting ─── */
  const [voteStats, setVoteStats] = useState({ approve: 68, reject: 32 });
  const [userChoice, setUserChoice] = useState(null);
  const [votesAuditLogs, setVotesAuditLogs] = useState([
    { time: '10:42 AM', action: 'Member #182 verified by credential hash.', hash: '8f2a...c011' },
    { time: '10:45 AM', action: 'Member #094 cast encrypted vote.', hash: '9b3e...44fd' }
  ]);

  const castVote = (choice) => {
    if (userChoice === choice) return;

    setVoteStats(prev => {
      let nextApprove = prev.approve;
      let nextReject = prev.reject;

      if (choice === 'approve') {
        nextApprove += 1;
        if (userChoice === 'reject') nextReject -= 1;
      } else {
        nextReject += 1;
        if (userChoice === 'approve') nextApprove -= 1;
      }

      return { approve: nextApprove, reject: nextReject };
    });

    setUserChoice(choice);
    
    // Add audit log
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const mockHash = Math.random().toString(16).substr(2, 8) + '...' + Math.random().toString(16).substr(2, 4);
    setVotesAuditLogs(prev => [
      { time: now, action: `You cast verified vote: ${choice.toUpperCase()}`, hash: mockHash },
      ...prev
    ]);
  };

  const resetHoaDemo = () => {
    setVoteStats({ approve: 68, reject: 32 });
    setUserChoice(null);
    setVotesAuditLogs([
      { time: '10:42 AM', action: 'Member #182 verified by credential hash.', hash: '8f2a...c011' },
      { time: '10:45 AM', action: 'Member #094 cast encrypted vote.', hash: '9b3e...44fd' }
    ]);
  };

  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i);

  const testimonials = [
    {
      name: 'Sarah Jenkins',
      role: 'Portfolio Landlord',
      society: 'Highland Residential Rentals',
      rating: 5,
      comment: 'NestBloq completely transformed our rental operations. Automated online rent collection, digital lease tracking, and instant tenant maintenance dispatches. Absolutely brilliant platform!',
      avatar: 'SJ',
      portfolio: '4 Properties',
      gradient: 'from-violet-500 to-indigo-600',
      glowColor: 'group-hover:shadow-[0_20px_40px_rgba(124,58,237,0.15)]',
      glowRgb: 'rgba(124,58,237,0.15)',
      textColor: 'text-violet-500',
      cardBg: 'bg-gradient-to-br from-violet-500/[0.07] via-white to-indigo-500/[0.03] dark:from-violet-950/20 dark:via-[#0D1B2A] dark:to-indigo-950/10',
      borderColor: 'border-violet-500/20 dark:border-violet-500/10 hover:border-violet-500/40 dark:hover:border-violet-500/30'
    },
    {
      name: 'Robert Mitchell',
      role: 'Residential Property Owner',
      society: 'Oakridge Rental Portfolio',
      rating: 5,
      comment: 'Onboarding our entire rental portfolio was seamless — property listings, active lease terms, tenant directories, and contractor dispatch were live in under 48 hours. The landlord dashboard is second to none.',
      avatar: 'RM',
      portfolio: '8 Properties',
      gradient: 'from-emerald-500 to-blue-600',
      glowColor: 'group-hover:shadow-[0_20px_40px_rgba(16,185,129,0.15)]',
      glowRgb: 'rgba(16,185,129,0.15)',
      textColor: 'text-emerald-500',
      cardBg: 'bg-gradient-to-br from-emerald-500/[0.07] via-white to-blue-500/[0.03] dark:from-emerald-950/20 dark:via-[#0D1B2A] dark:to-blue-950/10',
      borderColor: 'border-emerald-500/20 dark:border-emerald-500/10 hover:border-emerald-500/40 dark:hover:border-emerald-500/30'
    },
    {
      name: 'Emily Parker',
      role: 'Rental Property Manager',
      society: 'Sunset Property Holdings',
      rating: 5,
      comment: 'Direct tenant portals and the real-time rent collection ledger gave our team complete financial control. Rent collections are 45% faster and repair tickets are resolved with zero friction.',
      avatar: 'EP',
      portfolio: '12 Properties',
      gradient: 'from-amber-500 to-orange-600',
      glowColor: 'group-hover:shadow-[0_20px_40px_rgba(245,158,11,0.15)]',
      glowRgb: 'rgba(245,158,11,0.15)',
      textColor: 'text-amber-500',
      cardBg: 'bg-gradient-to-br from-amber-500/[0.07] via-white to-orange-500/[0.03] dark:from-amber-950/20 dark:via-[#0D1B2A] dark:to-orange-950/10',
      borderColor: 'border-amber-500/20 dark:border-amber-500/10 hover:border-amber-500/40 dark:hover:border-amber-500/30'
    }
  ];

  // Start at top or scroll to target hash on mount
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 200);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);

  const features = [
    {
      icon: Wallet, title: 'Finances & Dues', tagline: 'Automated billing engine', color: 'violet',
      desc: 'Send invoices, track collections, manage payment ledgers, and auto-reconcile with PCI-DSS compliant gateways.',
      stats: '45% faster collection'
    },
    {
      icon: Wrench, title: 'Maintenance Desk', tagline: 'Smart ticket management', color: 'blue',
      desc: 'Log service requests, dispatch vendors, track statuses end-to-end, and notify residents in real-time.',
      stats: '3× faster resolution'
    },
    {
      icon: Shield, title: 'RBAC Security', tagline: 'Role-based workspaces', color: 'indigo',
      desc: 'Granular permissions for Landlords, Property Managers, Accountants, Contractors, and Tenants with fully isolated data.',
      stats: '100% data isolation'
    },
    {
      icon: Activity, title: 'NestBloq Assistant', tagline: '24/7 intelligent assistant', color: 'rose',
      desc: 'Conversational AI that answers tenant queries, collects repair photos, and logs maintenance work orders automatically.',
      stats: '85% query automation'
    }
  ];

  const landingFaqs = [
    {
      id: 1,
      category: "General",
      q: "How does the NestBloq Rental Assistant work?",
      answerParts: [
        "Our **NestBloq Rental Assistant** runs on advanced conversational AI trained specifically for rental operations and property management.",
        "It instantly answers tenant queries about lease terms, rent payment schedules, and maintenance issues 24/7. When a tenant reports an issue, AI automatically triages the problem, collects photos, and generates a structured work order in the landlord portal."
      ]
    },
    {
      id: 2,
      category: "Security",
      q: "Is our financial data and tenant registry secure on NestBloq?",
      answerParts: [
        "**Yes, security is our foundational priority.** We enforce bank-grade **AES-256 encryption at rest** and **TLS 1.3 in transit** for all property databases.",
        "Online rent collection is handled through **Stripe's PCI-DSS Level 1** certified gateway using end-to-end tokenization. Credit cards and bank account credentials are never stored on internal servers."
      ]
    },
    {
      id: 3,
      category: "Technical",
      q: "Can NestBloq integrate with our existing accounting and property systems?",
      answerParts: [
        "**Absolutely.** NestBloq features native 1-click synchronization with **QuickBooks Online, Yardi, AppFolio**, and direct bank feeds (Plaid / ACH).",
        "You can also export full GL ledgers, invoices, rent payment histories, and tenant rosters in standard CSV, Excel, JSON, and PDF audit packages anytime."
      ]
    },
    {
      id: 4,
      category: "General",
      q: "What is the onboarding process and timeline for new landlords and portfolios?",
      answerParts: [
        "Onboarding typically completes in **less than 48 hours** with zero downtime.",
        "Our dedicated customer success team handles importing your existing property portfolios, unit rosters, active lease agreements, and vendor directories, followed by a personalized walkthrough."
      ]
    },
    {
      id: 5,
      category: "General",
      q: "How does the invitation and role assignment system work for tenants?",
      answerParts: [
        "Landlords or Property Managers can trigger automated email invites or generate secure one-time onboarding links directly from the admin panel.",
        "When tenants join, the system automatically assigns their role-based permissions (Landlord, Property Manager, Tenant, Contractor, or Accountant) ensuring complete data privacy and isolation."
      ]
    },
    {
      id: 6,
      category: "Security",
      q: "How does NestBloq safeguard rental financial transactions and audit records?",
      answerParts: [
        "Every rent payment, security deposit refund, maintenance log, and digital lease agreement is recorded with a **cryptographic SHA-256 audit fingerprint**.",
        "Ledger records are maintained on an append-only transaction stream that prevents retroactive tampering, unauthorized balance changes, or lost records."
      ]
    },
    {
      id: 7,
      category: "Technical",
      q: "Where is our property portfolio database hosted and what is your uptime SLA?",
      answerParts: [
        "All NestBloq data is hosted on **Amazon Web Services (AWS)** multi-region cloud infrastructure in the **US-East** region, backed by a **99.9% uptime SLA**.",
        "We maintain automated multi-zone failover and hourly encrypted snapshot backups retained for 30 days."
      ]
    },
    {
      id: 8,
      category: "Data & Privacy",
      q: "Can we export our rental data if we ever decide to leave?",
      answerParts: [
        "**Yes, 100%.** You retain complete ownership of your portfolio data.",
        "Admins can export full tenant rosters, accounting logs, maintenance archives, and lease document vaults in standard open formats at any time with one click."
      ]
    },
    {
      id: 9,
      category: "Data & Privacy",
      q: "Is our financial or tenant data shared or monetized with third parties?",
      answerParts: [
        "**Never.** We do not sell, rent, or share rental financial ledgers, tenant rosters, or personally identifiable information (PII) with third-party advertisers or data brokers."
      ]
    }
  ];


  const colorMap = {
    violet: { 
      activeBg: 'bg-gradient-to-br from-violet-500/[0.06] via-white to-violet-500/[0.01] dark:from-violet-900/20 dark:via-[#0D1B2A] dark:to-transparent border-violet-500/20 dark:border-violet-500/20 shadow-sm shadow-violet-500/5',
      icon: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
      badge: 'text-violet-600 dark:text-violet-400 bg-violet-500/10 border border-violet-500/20 dark:border-violet-500/10'
    },
    blue: { 
      activeBg: 'bg-gradient-to-br from-blue-500/[0.06] via-white to-blue-500/[0.01] dark:from-blue-900/20 dark:via-[#0D1B2A] dark:to-transparent border-blue-500/20 dark:border-blue-500/20 shadow-sm shadow-blue-500/5',
      icon: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      badge: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/10'
    },
    indigo: { 
      activeBg: 'bg-gradient-to-br from-indigo-500/[0.06] via-white to-indigo-500/[0.01] dark:from-indigo-900/20 dark:via-[#0D1B2A] dark:to-transparent border-indigo-500/20 dark:border-indigo-500/20 shadow-sm shadow-indigo-500/5',
      icon: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      badge: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 dark:border-indigo-500/10'
    },
    rose: { 
      activeBg: 'bg-gradient-to-br from-rose-500/[0.06] via-white to-rose-500/[0.01] dark:from-rose-900/20 dark:via-[#0D1B2A] dark:to-transparent border-rose-500/20 dark:border-rose-500/20 shadow-sm shadow-rose-500/5',
      icon: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
      badge: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 dark:border-rose-500/10'
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0f172a] font-sans transition-colors duration-300">
      <Navbar />

      <div className="flex-1 overflow-x-hidden">

      {/* ═══════════════════════════════════════════════════════
          HERO SECTION — centered layout matching client PNG
      ═══════════════════════════════════════════════════════ */}
      <section className="relative pt-5 sm:pt-6 pb-0 px-5 sm:px-8 overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 grid-bg opacity-100 pointer-events-none" />
        {/* Radial spotlight — top center */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-radial from-violet-500/20 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-violet-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-40 w-80 h-80 bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto w-full text-center space-y-6 animate-fade-in-up">

          {/* Badge pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400">
            <span className="text-[10px] font-bold tracking-widest uppercase">All-in-One Property Management</span>
          </div>

          {/* Hero headline — matching client PNG */}
          <div className="space-y-3.5">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[58px] font-black leading-[1.05] tracking-tight text-slate-900 dark:text-white">
              The operating system<br />
              <span className="gradient-text">for every property</span>{' '}
              <span className="text-slate-900 dark:text-white">you own.</span>
            </h1>
            <div className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-650 dark:text-slate-400 select-none">
              Built for <span className="gradient-text">{typedText}</span>
              <span className="text-violet-500 dark:text-violet-400 font-light animate-pulse ml-1">|</span>
            </div>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-450 leading-relaxed max-w-2xl mx-auto font-normal">
              Manage homes, rentals, communities, and investments with AI-powered tools
              that save time, reduce costs, and keep everything under control.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/portal-select" className="btn-glow px-8 py-3.5 text-sm font-semibold text-white rounded-xl flex items-center gap-2 group">
              Start Free Trial
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link to="/contact" className="px-7 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 hover:border-violet-300 dark:hover:border-violet-500/30 transition-all duration-200 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-violet-500/10 flex items-center justify-center">
                <Play className="w-3 h-3 fill-violet-500 text-violet-500 ml-0.5" />
              </span>
              Book a Demo
            </Link>
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 pt-2">
            {['No credit card required', '14-day free trial', 'Cancel anytime'].map((item, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                {item}
              </span>
            ))}
          </div>

          {/* ── DASHBOARD BROWSER MOCKUP — RENTAL PORTAL ── */}
          <div className="relative mt-10 animate-fade-in-up-delay-2">
            {/* Glow beneath the browser */}
            <div className="absolute -inset-x-20 -bottom-10 h-40 bg-gradient-to-t from-teal-600/20 via-blue-500/10 to-transparent blur-2xl pointer-events-none rounded-full" />

            {/* Browser chrome wrapper */}
            <div 
              className="relative rounded-t-2xl overflow-hidden border border-slate-200/60 dark:border-white/[0.08] shadow-[0_32px_80px_rgba(0,0,0,0.12)] dark:shadow-[0_32px_80px_rgba(0,0,0,0.5)] bg-white dark:bg-[#0B1929]"
            >

              {/* Browser top bar */}
              <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-slate-100 dark:bg-[#0D1B2A] border-b border-slate-200/60 dark:border-white/[0.06]">
                <div className="flex gap-1.5 shrink-0">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate px-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">NestBloq Rental Management Dashboard</span>
                </div>
                <div className="w-6 sm:w-8 shrink-0" />
              </div>

              {/* Dashboard Layout */}
              <div
                className="flex h-[520px] sm:h-[480px] overflow-hidden bg-slate-50 dark:bg-[#090F16]"
              >
                {/* ── Sidebar ── */}
                <aside className={`hidden sm:flex w-44 shrink-0 border-r flex flex-col transition-colors duration-300 ${
                  isDark ? 'bg-[#0B132B] border-white/[0.06]' : 'bg-[#E8F1FC] border-slate-200/80'
                }`}>
                  <div className={`p-4 border-b flex items-center shrink-0 ${isDark ? 'border-white/[0.06]' : 'border-slate-200/80'}`}>
                    <Logo className="h-5 w-auto" variant={isDark ? "white" : "default"} />
                  </div>
                  <div className="p-2.5 shrink-0">
                    <span className={`text-[7px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>MAIN MENU</span>
                  </div>
                  <nav className="flex-1 px-2 pb-2 space-y-0.5 text-[9px] font-medium overflow-y-auto custom-scrollbar">
                    {[
                      { label: 'Landlord Dashboard', icon: LayoutDashboard, active: true },
                      { label: 'Properties & Units', icon: Building2, active: false },
                      { label: 'Tenant Screening', icon: UserCheck, active: false },
                      { label: 'Lease Agreements', icon: FileText, active: false },
                      { label: 'Tenants', icon: Users, active: false },
                      { label: 'Payments Ledger', icon: Wallet, active: false },
                      { label: 'Maintenance Desk', icon: Wrench, active: false },
                      { label: 'Contractors / Vendors', icon: Truck, active: false },
                      { label: 'Reports', icon: TrendingUp, active: false },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors ${
                          item.active
                            ? isDark ? 'bg-teal-500/10 text-teal-400 font-semibold border-l-2 border-teal-500' : 'bg-white text-teal-600 font-semibold border-l-2 border-teal-600 shadow-sm'
                            : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                        }`}>
                          <Icon size={11} className="shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </div>
                      );
                    })}
                  </nav>
                  <div className={`p-2.5 border-t shrink-0 ${isDark ? 'border-white/[0.06] bg-[#0A1128]/40' : 'border-slate-200/80 bg-slate-200/25'}`}>
                    <div className={`flex items-center gap-2 p-1.5 rounded-xl border ${isDark ? 'bg-slate-900/35 border-white/[0.04]' : 'bg-white border-slate-200/60 shadow-sm'}`}>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black text-white ${pd.managerColor}`}>{pd.managerInitials}</div>
                      <div className="min-w-0">
                        <div className={`text-[8px] font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{pd.managerName}</div>
                        <div className={`text-[6px] font-extrabold uppercase tracking-widest truncate ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>{pd.managerRole}</div>
                      </div>
                    </div>
                  </div>
                </aside>

                {/* ── Main Content ── */}
                <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                  {/* Topbar */}
                  <div className={`px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between shrink-0 transition-colors duration-300 border-b gap-2 ${
                    isDark ? 'bg-[#0B132B] border-white/[0.06]' : 'bg-white border-slate-200/80 shadow-sm'
                  }`}>
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0"><Building size={12} /></div>
                      <div className="text-left min-w-0">
                        <span className="text-[6px] font-extrabold text-slate-400 uppercase tracking-widest block leading-none truncate">{pd.contextLabel}</span>
                        <div className="flex items-center gap-1 mt-0.5 min-w-0">
                          <span className={`text-[11px] sm:text-xs font-black truncate max-w-[100px] sm:max-w-none ${isDark ? 'text-white' : 'text-slate-800'}`}>{pd.communityName}</span>
                          <span className={`text-[7px] font-extrabold px-1.5 py-0.5 rounded font-mono border shrink-0 ${isDark ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-teal-50 text-teal-600 border-teal-500/20'}`}>{pd.communityCode}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <div className={`flex items-center gap-1.5 sm:gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <Sun size={12} />
                        <div className="relative"><Bell size={12} /><span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full border ${isDark ? 'border-[#0B132B]' : 'border-white'}`} /></div>
                      </div>
                      <div className={`flex items-center gap-2 pl-2 sm:pl-3 border-l ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
                        <div className="hidden sm:block text-right">
                          <p className={`text-[8px] font-bold leading-none ${isDark ? 'text-white' : 'text-slate-800'}`}>{pd.managerName}</p>
                          <span className={`text-[6px] font-extrabold uppercase tracking-wider ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>{pd.managerRole}</span>
                        </div>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black text-white shrink-0 ${pd.managerColor}`}>{pd.managerInitials}</div>
                      </div>
                    </div>
                  </div>

                  {/* Dashboard body */}
                  <div className={`flex-1 overflow-y-auto p-2.5 sm:p-4 space-y-3 sm:space-y-4 custom-scrollbar transition-colors duration-300 ${
                    isDark ? 'bg-[#090F16]' : 'bg-slate-50'
                  }`}>

                    {/* Welcome + Stats Header Card */}
                    <div className={`rounded-2xl p-3 sm:p-4 border flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4 ${
                      isDark ? 'bg-gradient-to-r from-[#1E2E42] via-[#162535] to-[#121B2A] border-white/[0.06]' : 'bg-white border-slate-200/80 shadow-sm'
                    }`}>
                      <div className="flex-1 min-w-0 text-left w-full">
                        <h2 className={`text-xs sm:text-sm font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{pd.welcomeMsg}</h2>
                        <p className={`text-[8px] mt-0.5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{pd.subMsg}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className={`inline-flex items-center text-[7px] font-bold px-2 py-0.5 rounded-lg border ${pd.badge1color}`}>{pd.badge1}</span>
                          <span className={`inline-flex items-center text-[7px] font-black px-2 py-0.5 rounded-lg border ${pd.badge2color}`}>{pd.badge2}</span>
                          <span className={`inline-flex items-center gap-1 text-[7px] font-semibold px-2 py-0.5 rounded-lg border truncate max-w-full ${isDark ? 'bg-white/[0.02] text-gray-300 border-white/5' : 'bg-slate-50 text-slate-600 border-slate-200/40'}`}>
                            <MapPin size={8} className="shrink-0" /><span className="truncate">{pd.address}</span>
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 sm:flex sm:flex-row gap-2 sm:gap-6 lg:gap-8 w-full lg:w-auto pt-1 lg:pt-0 border-t lg:border-t-0 border-slate-200/50 dark:border-white/5">
                        {pd.stats.map((s, i) => (
                          <div key={i} className="text-center min-w-0 flex-1 sm:flex-initial">
                            <p className={`text-xs sm:text-base font-black font-mono truncate ${s.color}`}>{s.val}</p>
                            <p className={`text-[6px] font-extrabold uppercase tracking-wider mt-0.5 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rental Dashboard Content */}
                    <div className="space-y-3 sm:space-y-4">
                      {/* 4 Cards Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-left">
                        <div className={`p-2 sm:p-3 rounded-xl border flex flex-col gap-0.5 sm:gap-1 shadow-sm min-w-0 ${isDark ? 'bg-[#111C2A]/60 border-white/5' : 'bg-white border-slate-200/80'}`}>
                          <span className="text-[6.5px] sm:text-[7px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block truncate">RENT RECEIVED</span>
                          <span className="text-xs sm:text-base font-black text-slate-900 dark:text-white font-mono truncate">$3,100.00</span>
                          <span className="text-[5.5px] sm:text-[6px] text-emerald-600 dark:text-emerald-400 font-bold truncate">Collection Rate: 39%</span>
                        </div>
                        <div className={`p-2 sm:p-3 rounded-xl border flex flex-col gap-0.5 sm:gap-1 shadow-sm min-w-0 ${isDark ? 'bg-[#111C2A]/60 border-white/5' : 'bg-white border-slate-200/80'}`}>
                          <span className="text-[6.5px] sm:text-[7px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block truncate">UNPAID EXPENSES</span>
                          <span className="text-xs sm:text-base font-black text-slate-900 dark:text-white font-mono truncate">$100.00</span>
                          <span className="text-[5.5px] sm:text-[6px] text-red-600 dark:text-red-400 font-bold truncate">Active Invoices</span>
                        </div>
                        <div className={`p-2 sm:p-3 rounded-xl border flex flex-col gap-0.5 sm:gap-1 shadow-sm min-w-0 ${isDark ? 'bg-[#111C2A]/60 border-white/5' : 'bg-white border-slate-200/80'}`}>
                          <span className="text-[6.5px] sm:text-[7px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block truncate">OVERDUE RENT</span>
                          <span className="text-xs sm:text-base font-black text-slate-955 dark:text-white font-mono truncate">$5,000.00</span>
                          <span className="text-[5.5px] sm:text-[6px] text-amber-600 dark:text-amber-500 font-bold truncate">Overdue Invoices</span>
                        </div>
                        <div className={`p-2 sm:p-3 rounded-xl border flex flex-col gap-0.5 sm:gap-1 shadow-sm min-w-0 ${isDark ? 'bg-[#111C2A]/60 border-white/5' : 'bg-white border-slate-200/80'}`}>
                          <span className="text-[6.5px] sm:text-[7px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block truncate">UPCOMING EXPENSES</span>
                          <span className="text-xs sm:text-base font-black text-slate-900 dark:text-white font-mono truncate">$100.00</span>
                          <span className="text-[5.5px] sm:text-[6px] text-blue-600 dark:text-blue-400 font-bold font-sans truncate">Open Tickets</span>
                        </div>
                      </div>

                      {/* Cashflow Summary & Action Required Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-left">
                        {/* Cashflow chart */}
                        <div className={`md:col-span-7 border rounded-2xl p-3 flex flex-col gap-3 ${isDark ? 'bg-[#1E2E42] border-white/[0.06]' : 'bg-white border-slate-200/80 shadow-sm'}`}>
                          <div className="flex justify-between items-center pb-2 border-b border-slate-200/40 dark:border-white/5">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Cashflow Summary</span>
                            <span className="text-[6px] text-slate-500">Real-time Income vs Expense</span>
                          </div>
                          <div className="flex items-end justify-between h-20 sm:h-24 pt-3 sm:pt-4 px-2">
                            {[
                              { month: 'Mar', inc: 10, exp: 5 },
                              { month: 'Apr', inc: 15, exp: 8 },
                              { month: 'May', inc: 35, exp: 20 },
                              { month: 'Jun', inc: 40, exp: 12 },
                              { month: 'Jul', inc: 75, exp: 40 },
                              { month: 'Aug', inc: 20, exp: 10 },
                            ].map((d, idx) => (
                              <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
                                <div className="w-full flex items-end justify-center gap-1 h-12 sm:h-14">
                                  <div className="w-1.5 bg-emerald-500 rounded-t-sm" style={{ height: `${d.inc}%` }} />
                                  <div className="w-1.5 bg-amber-500 rounded-t-sm" style={{ height: `${d.exp}%` }} />
                                </div>
                                <span className="text-[7px] font-semibold text-slate-400">{d.month}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action Required: Tenant requests */}
                        <div className={`md:col-span-5 border rounded-2xl p-3 flex flex-col justify-between gap-2.5 ${isDark ? 'bg-[#1E2E42] border-white/[0.06]' : 'bg-white border-slate-200/80 shadow-sm'}`}>
                          <div className="flex justify-between items-center pb-2 border-b border-slate-200/40 dark:border-white/5">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Action Required</span>
                            <span className="text-[6px] text-blue-600 font-bold">Tenant Requests</span>
                          </div>
                          <div className="space-y-2 py-1 flex-1 flex flex-col justify-center">
                            <div className={`p-2 border rounded-xl flex items-center justify-between gap-2 ${isDark ? 'bg-[#111C2A]/60 border-red-500/20' : 'bg-red-50/50 border-red-100'}`}>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-[8px] font-bold text-slate-800 dark:text-red-300 truncate">Electrician</h4>
                                <p className="text-[6px] text-slate-505 dark:text-slate-450 mt-0.5 truncate">Unit 102 — Priority: NORMAL</p>
                              </div>
                              <button className="bg-red-500 hover:bg-red-600 text-white font-bold text-[7px] px-2 py-1 rounded shrink-0 transition-colors shadow-sm">Assign</button>
                            </div>
                            <div className={`p-2 border rounded-xl flex items-center justify-between gap-2 ${isDark ? 'bg-[#111C2A]/60 border-white/5' : 'bg-slate-50 border-slate-200/50'}`}>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-[8px] font-bold text-slate-800 dark:text-slate-200 truncate">Plumber</h4>
                                <p className="text-[6px] text-slate-505 dark:text-slate-450 mt-0.5 truncate">Unit 104 — Pipe Leak Report</p>
                              </div>
                              <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[7px] px-2 py-1 rounded shrink-0 transition-colors shadow-sm">Assign</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
            {/* Bottom glow reflection */}
            <div className="h-16 bg-gradient-to-b from-slate-200/40 dark:from-[#0D1B2A]/80 to-transparent" />
          </div>

        </div>

      </section>


      {/* ═══════════════════════════════════════════════════════
          SOLUTIONS SECTION (Interactive Use Cases & Simulators)
      ═══════════════════════════════════════════════════════ */}
      <section 
        id="solutions" 
        ref={solutionsSectionRef}
        className="scroll-mt-16 sm:scroll-mt-20 relative py-8 sm:py-10 px-5 sm:px-8 border-t border-slate-200/40 dark:border-white/[0.06] overflow-hidden bg-white dark:bg-[#0f172a]"
      >
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-gradient-radial from-violet-500/[0.03] dark:from-violet-500/[0.06] to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-32 top-1/4 w-96 h-96 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.05] rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Purpose-Built Rental Solutions
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Complete Control for <span className="gradient-text">Your Rental Portfolio.</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal leading-relaxed max-w-2xl mx-auto">
              Manage properties, active lease agreements, rent payments ledger, and maintenance work orders in one unified landlord & tenant portal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {[
              {
                title: 'Rental Properties Hub',
                tagline: 'Properties & Addresses',
                desc: 'Add and organize your rental properties and residential homes. Track occupancy status, monthly rental rates, and property addresses seamlessly.',
                icon: Building2,
                colorClass: 'text-teal-600 dark:text-teal-400 bg-teal-500/10 dark:bg-teal-500/20 border-teal-500/20',
                cardBg: 'hover:border-teal-500/40 dark:hover:border-teal-500/35 hover:shadow-teal-500/5',
                textColor: 'text-teal-600 dark:text-teal-400',
                link: '/solutions/rental'
              },
              {
                title: 'Lease Agreements & Tenants',
                tagline: 'Leases & Tenant Registry',
                desc: 'Create structured lease agreements, set monthly rent amounts and deposits, track lease validity dates, and maintain verified tenant directories.',
                icon: FileText,
                colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20',
                cardBg: 'hover:border-emerald-500/40 dark:hover:border-emerald-500/35 hover:shadow-emerald-500/5',
                textColor: 'text-emerald-600 dark:text-emerald-400',
                link: '/solutions/rental'
              },
              {
                title: 'Rent Ledger & Maintenance Desk',
                tagline: 'Payments & Work Orders',
                desc: 'Monitor real-time paid, pending, and overdue rent. Receive repair requests with photo attachments and assign tickets to contractors.',
                icon: Wallet,
                colorClass: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20',
                cardBg: 'hover:border-blue-500/40 dark:hover:border-blue-500/35 hover:shadow-blue-500/5',
                textColor: 'text-blue-600 dark:text-blue-400',
                link: '/solutions/rental'
              }
            ].map((solution, i) => {
              const IconComponent = solution.icon;
              return (
                <div
                  key={i}
                  className={`group relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-white/[0.07] bg-white/60 dark:bg-white/[0.01] p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm flex flex-col justify-between text-left ${solution.cardBg}`}
                >
                  <div className="space-y-3.5">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${solution.colorClass}`}>
                      <IconComponent className="w-4.5 h-4.5" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">{solution.tagline}</span>
                      </div>
                      <h3 className="font-display font-black text-base sm:text-lg text-slate-900 dark:text-white leading-snug group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                        {solution.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1 font-normal">
                        {solution.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-white/5 mt-4 flex items-center justify-between">
                    <Link
                      to={solution.link}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold transition-all uppercase tracking-wider ${solution.textColor}`}
                    >
                      Explore Portal
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CORE CAPABILITIES (3D Tilt & Flip Showcase)
      ═══════════════════════════════════════════════════════ */}
      <section id="features" className="scroll-mt-16 sm:scroll-mt-20 relative py-10 sm:py-12 px-5 sm:px-8 bg-slate-50/60 dark:bg-[#162032] border-t border-slate-200/40 dark:border-white/[0.06] overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-7 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-[10px] sm:text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              Advanced Capabilities
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Powerful modules for{' '}
              <span className="gradient-text">complete rental control</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal leading-relaxed max-w-xl mx-auto">
              Hover to tilt cards in 3D and click to reveal detailed modules, rules, and configurations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {featureList.map((feature, i) => (
              <InteractiveFeatureCard key={i} feature={feature} />
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          AI COPILOT
      ═══════════════════════════════════════════════════════ */}
      <section id="ai" className="relative py-16 px-5 sm:px-8 overflow-hidden bg-white dark:bg-[#0f172a] border-t border-slate-200/40 dark:border-white/[0.06]">
        {/* Soft glow orbs — light & subtle */}
        <div className="absolute -top-20 left-1/3 w-80 h-80 bg-violet-400/[0.06] dark:bg-violet-500/[0.08] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-indigo-400/[0.05] dark:bg-indigo-500/[0.07] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Slide selector tab pills — full width above two-column grid */}
          <div className="flex flex-wrap gap-2.5 mb-10">
            {automationSlides.map((slide, idx) => {
              const isActive = activeSlide === idx;
              let activeColors = "";
              if (idx === 0) activeColors = "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400";
              if (idx === 1) activeColors = "bg-indigo-500/10 border-indigo-500/40 text-indigo-600 dark:text-indigo-400";
              if (idx === 2) activeColors = "bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400";
              if (idx === 3) activeColors = "bg-teal-500/10 border-teal-500/40 text-teal-600 dark:text-teal-400";
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveSlide(idx);
                    setIsAutoPlaying(false);
                  }}
                  className={`px-3.5 py-2 rounded-xl border text-[11px] font-bold transition-all duration-300 ${
                    isActive 
                      ? activeColors 
                      : "border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 text-slate-500 dark:text-slate-400 bg-white/40 dark:bg-white/[0.01]"
                  }`}
                >
                  {slide.tabLabel}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

            {/* Left: Text content */}
            <div className="lg:col-span-5 space-y-4 text-left">
              <div className="space-y-4 transition-all duration-500">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all ${automationSlides[activeSlide].badgeColor}`}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  {automationSlides[activeSlide].badge}
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight min-h-[70px]">
                  {automationSlides[activeSlide].title}{' '}
                  <span className="block bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">{automationSlides[activeSlide].subtitle}</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-xs sm:text-sm min-h-[60px]">
                  {automationSlides[activeSlide].desc}
                </p>
                <div className="space-y-2.5 pt-1">
                  {automationSlides[activeSlide].points.map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-xs shrink-0">{item.icon}</div>
                      <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">{item.text}</span>
                    </div>
                  ))}
                </div>
                <Link to={automationSlides[activeSlide].linkTo} className={`inline-flex items-center gap-2 px-5 py-2.5 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all hover:-translate-y-0.5 group ${automationSlides[activeSlide].btnColor}`}>
                  {automationSlides[activeSlide].linkText}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Right: Console Slider Wrapper */}
            <div 
              className="lg:col-span-7 relative group cursor-pointer"
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
              onClick={() => setActiveSlide(prev => (prev + 1) % 4)}
            >
              {/* Dynamic Slide Container with transition */}
              <div key={activeSlide} className="transition-all duration-500 ease-in-out transform hover:scale-[1.01]">
                {automationSlides[activeSlide].component}
              </div>

              {/* Slider Controls (Hover Visible) */}
              <div className="absolute inset-y-0 left-3 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click trigger
                    setActiveSlide(prev => (prev - 1 + 4) % 4);
                  }}
                  className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white flex items-center justify-center pointer-events-auto border border-white/10 shadow-lg transition"
                >
                  <svg className="w-4 h-4 -translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>

              <div className="absolute inset-y-0 right-3 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click trigger
                    setActiveSlide(prev => (prev + 1) % 4);
                  }}
                  className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white flex items-center justify-center pointer-events-auto border border-white/10 shadow-lg transition"
                >
                  <svg className="w-4 h-4 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Bottom Dot Indicators Centered below the card */}
              <div className="flex justify-center gap-2 mt-3 pointer-events-none">
                {automationSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSlide(idx);
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 pointer-events-auto ${
                      activeSlide === idx 
                        ? 'bg-gradient-to-r from-violet-500 to-indigo-600 w-5' 
                        : 'bg-slate-300 dark:bg-white/15 w-2'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          TESTIMONIALS (Clean Balanced 3-Column Layout)
      ═══════════════════════════════════════════════════════ */}
      <section id="testimonials" className="relative py-10 sm:py-12 px-5 sm:px-8 bg-slate-50/60 dark:bg-[#162032] border-t border-slate-200/40 dark:border-white/[0.06] overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-7 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] sm:text-xs font-semibold">
              <Star className="w-3.5 h-3.5 fill-current" />
              Client Testimonials
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              What landlords & property managers say
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal leading-relaxed max-w-xl mx-auto">
              Discover how landlords, rental property managers, and investors are streamlining their daily leasing operations and rent collections with NestBloq.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="w-full h-full">
                <TestimonialCard testimonial={testimonial} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FAQ
      ═══════════════════════════════════════════════════════ */}
      <FaqSection
        id="faq"
        badgeText="FREQUENTLY ASKED QUESTIONS"
        title="Everything you need to know"
        subtitlePrefix="Have questions about how NestBloq powers modern rental property portfolios?"
        contactText="Contact our team →"
        contactLink="/contact"
        items={landingFaqs}
      />

      {/* ═══════════════════════════════════════════════════════
          CTA BANNER
      ═══════════════════════════════════════════════════════ */}
      <section className="relative py-10 sm:py-12 px-5 sm:px-8 border-t border-slate-200/40 dark:border-white/[0.06] overflow-hidden bg-slate-50/60 dark:bg-[#162032]">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center" style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 25%, #4338ca 60%, #3730a3 100%)' }}>
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            {/* Orbs */}
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-violet-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-56 h-56 bg-indigo-400/20 rounded-full blur-3xl" />
            <div className="absolute top-1/2 -translate-y-1/2 right-8 w-32 h-32 bg-purple-400/15 rounded-full blur-2xl" />

            <div className="relative space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 text-white text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                No credit card required · Free 30-day trial
              </div>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-[34px] font-black text-white leading-tight">
                Ready to transform your<br />rental portfolio?
              </h2>
              <p className="text-white/80 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
                Join 500+ landlords and property managers on NestBloq. Get your properties, leases, and tenants live in under 48 hours with full setup support.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link to="/portal-select" className="px-7 py-3 bg-white text-violet-700 font-black text-xs sm:text-sm rounded-xl hover:bg-white/95 shadow-xl shadow-black/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 group">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link to="/contact" className="px-7 py-3 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />
                  Talk to Sales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      </div>
      <InteractiveAssistant />
    </div>
  );
}
