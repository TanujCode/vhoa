import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight, Play, CheckCircle, Zap,
  ChevronDown, ChevronUp, Star, UserPlus, Mail,
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
import solutionApartment from '../../assets/solution_apartment.png';
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
    title: 'Violations',
    tagline: 'Fair community compliance',
    desc: 'Easily log society violations, manage automatic due dates, send email alerts, and govern fair disputes within a structured 30-day window.',
    icon: Scale,
    gradient: 'from-red-500 to-rose-600',
    textColor: 'text-red-500',
    glowRgb: 'rgba(239, 68, 68, 0.2)',
    borderClass: 'border-red-500/20 dark:border-red-500/10 hover:border-red-500/50',
    shadowColor: 'hover:shadow-red-500/10',
    cardBg: 'bg-gradient-to-br from-red-500/[0.04] via-transparent to-rose-950/[0.04] dark:from-red-950/20 dark:via-transparent dark:to-rose-950/15',
    details: [
      'Instant Issue & Violation logs',
      'Structured 30-day Dispute system',
      'Automatic Due dates & Late fees',
      'Integrated Email notifications'
    ]
  },
  {
    number: '02',
    title: 'Service Requests',
    tagline: 'Track repairs end-to-end',
    desc: 'Coordinate community repairs, dispatch tasks to vendors, monitor real-time statuses, and log private internal admin notes.',
    icon: Wrench,
    gradient: 'from-emerald-500 to-blue-600',
    textColor: 'text-emerald-500',
    glowRgb: 'rgba(16, 185, 129, 0.2)',
    borderClass: 'border-emerald-500/20 dark:border-emerald-500/10 hover:border-emerald-500/50',
    shadowColor: 'hover:shadow-emerald-500/10',
    cardBg: 'bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-blue-950/[0.04] dark:from-emerald-950/20 dark:via-transparent dark:to-blue-950/15',
    details: [
      'RBAC-based repair workflow',
      'Direct Vendor ticket assignment',
      'Real-time Status tracking log',
      'Private Admin resolution notes'
    ]
  },
  {
    number: '03',
    title: 'Amenity Booking',
    tagline: 'Sleek facility reservation',
    desc: 'Enable residents to reserve clubhouses, pools, and courts. Protect slots from race conditions and automate board approvals.',
    icon: CalendarRange,
    gradient: 'from-amber-500 to-orange-600',
    textColor: 'text-amber-500',
    glowRgb: 'rgba(245, 158, 11, 0.2)',
    borderClass: 'border-amber-500/20 dark:border-amber-500/10 hover:border-amber-500/50',
    shadowColor: 'hover:shadow-amber-500/10',
    cardBg: 'bg-gradient-to-br from-amber-500/[0.04] via-transparent to-orange-950/[0.04] dark:from-amber-950/20 dark:via-transparent dark:to-orange-950/15',
    details: [
      'Max 2 Booking slots per day',
      'Race condition protection',
      'Custom Fee configuration rules',
      'Multi-stage Board Approval flow'
    ]
  },
  {
    number: '04',
    title: 'Member Directory',
    tagline: 'Verified homeowner records',
    desc: 'Maintain verified records for homeowners. Validate via email/phone, map multiple properties, and configure HOA passcode joins.',
    icon: Users,
    gradient: 'from-pink-500 to-rose-600',
    textColor: 'text-pink-500',
    glowRgb: 'rgba(236, 72, 153, 0.2)',
    borderClass: 'border-pink-500/20 dark:border-pink-500/10 hover:border-pink-500/50',
    shadowColor: 'hover:shadow-pink-500/10',
    cardBg: 'bg-gradient-to-br from-pink-500/[0.04] via-transparent to-rose-950/[0.04] dark:from-pink-950/20 dark:via-transparent dark:to-rose-950/15',
    details: [
      'Secure Email & Phone verify',
      'Support for Multiple home units',
      'HOA Passcode-based joining',
      'Mandatory Admin approval gateway'
    ]
  },
  {
    number: '05',
    title: 'Vendor Portal',
    tagline: 'Secure third-party check-ins',
    desc: 'Provide security check-in portals with temporary access codes, verify business licenses/insurances, and collect member feedback.',
    icon: ShieldCheck,
    gradient: 'from-cyan-500 to-blue-600',
    textColor: 'text-cyan-500',
    glowRgb: 'rgba(6, 182, 212, 0.2)',
    borderClass: 'border-cyan-500/20 dark:border-cyan-500/10 hover:border-cyan-500/50',
    shadowColor: 'hover:shadow-cyan-500/10',
    cardBg: 'bg-gradient-to-br from-cyan-500/[0.04] via-transparent to-blue-950/[0.04] dark:from-cyan-950/20 dark:via-transparent dark:to-blue-950/15',
    details: [
      'One-time OTP secure access codes',
      'License & Insurance validation',
      'B2B Contract code tracking',
      'Resident Feedback & ratings log'
    ]
  },
  {
    number: '06',
    title: 'Payments',
    tagline: 'Automated society billing',
    desc: 'Send automatic invoices for monthly dues, collect facility fees, process violation fines, and integrate with secure payment gateways.',
    icon: CreditCard,
    gradient: 'from-blue-500 to-blue-700',
    textColor: 'text-blue-500',
    glowRgb: 'rgba(20, 184, 166, 0.2)',
    borderClass: 'border-blue-500/20 dark:border-blue-500/10 hover:border-blue-500/50',
    shadowColor: 'hover:shadow-blue-500/10',
    cardBg: 'bg-gradient-to-br from-blue-500/[0.04] via-transparent to-emerald-950/[0.04] dark:from-blue-950/20 dark:via-transparent dark:to-emerald-950/15',
    details: [
      'Automatic Annual HOA fees',
      'Violation Fine processing logs',
      'Amenity Booking payment checks',
      'Direct PayPal sync integration'
    ]
  },
  {
    number: '07',
    title: 'News & FAQ',
    tagline: 'Centralized board updates',
    desc: 'Broadcast announcements, organize documents, compile searchable categories, and serve paginated frequently asked questions.',
    icon: Megaphone,
    gradient: 'from-purple-500 to-pink-600',
    textColor: 'text-purple-500',
    glowRgb: 'rgba(168, 85, 247, 0.2)',
    borderClass: 'border-purple-500/20 dark:border-purple-500/10 hover:border-purple-500/50',
    shadowColor: 'hover:shadow-purple-500/10',
    cardBg: 'bg-gradient-to-br from-purple-500/[0.04] via-transparent to-pink-950/[0.04] dark:from-purple-950/20 dark:via-transparent dark:to-pink-950/15',
    details: [
      'Pinned Board Announcements',
      'Category-based post filters',
      'Sleek Paginated Frequently Asked Qs',
      'Public Bylaw Document downloads'
    ]
  },
  {
    number: '08',
    title: 'Settings & Audits',
    tagline: 'Configure rules & track logs',
    desc: 'Configure late fees, toggle page tabs, set timezones, and audit system activities with secure IP address logs.',
    icon: Sliders,
    gradient: 'from-violet-600 to-purple-700',
    textColor: 'text-violet-600',
    glowRgb: 'rgba(109, 40, 217, 0.2)',
    borderClass: 'border-violet-500/20 dark:border-violet-500/10 hover:border-violet-500/50',
    shadowColor: 'hover:shadow-violet-600/10',
    cardBg: 'bg-gradient-to-br from-violet-600/[0.04] via-transparent to-purple-950/[0.04] dark:from-violet-950/20 dark:via-transparent dark:to-purple-950/15',
    details: [
      'Tab Visibility Toggle controls',
      'Global Late fee configuration',
      'Society Timezone management',
      'Action audit logs & IP tracking'
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
    <div className="w-full h-[360px] perspective-1000 cursor-pointer group" onClick={handleFlip}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: isFlipped ? 'rotateY(180deg)' : 'none',
          transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease'
        }}
        className={`w-full h-full preserve-3d relative rounded-2xl border ${feature.borderClass} shadow-md hover:shadow-2xl transition-all duration-300 ${
          isFlipped ? '' : `${feature.shadowColor} ${feature.cardBg}`
        } bg-white dark:bg-[#0D1B2A]`}
      >
        {/* --- FRONT FACE --- */}
        <div className="absolute inset-0 backface-hidden rounded-2xl p-6 flex flex-col justify-between overflow-hidden">
          {/* Tracking radial light glow (always visible soft glow, brightens on hover) */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity duration-500 z-0"
            style={{
              background: `radial-gradient(circle 180px at var(--x, 50%) var(--y, 35%), ${feature.glowRgb}, transparent)`
            }}
          />
          {/* Top border accent line */}
          <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${feature.gradient} z-10`} />

          <div className="space-y-5 relative z-10 flex-1 flex flex-col">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg transform group-hover:rotate-3 transition-transform duration-300 shrink-0`}>
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-2 flex-1">
              <div>
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Module {feature.number}</span>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5 leading-snug">{feature.title}</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mt-0.5">{feature.tagline}</p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal pt-1">
                {feature.desc}
              </p>
            </div>
          </div>
        </div>

        {/* --- BACK FACE --- */}
        <div className={`absolute inset-0 backface-hidden rotate-y-180 rounded-2xl bg-gradient-to-br ${feature.gradient} p-6 flex flex-col justify-between overflow-hidden text-white shadow-xl`}>
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3 pb-3 border-b border-white/20">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <IconComponent className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-black text-sm text-white leading-tight">{feature.title}</h4>
            </div>

            <ul className="space-y-3">
              {feature.details.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-white/95">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-white" />
                  <span className="leading-normal font-semibold">{detail}</span>
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

      {/* Floating unit scale badge */}
      <div className="absolute top-4 right-6 z-20">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[9px] font-extrabold tracking-wide uppercase backdrop-blur-md bg-white/40 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.08] ${testimonial.textColor}`}>
          {testimonial.units}
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

/* ─── Meetings Operations Console ─── */
function MeetingsOperationsConsole() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`w-full rounded-3xl overflow-hidden shadow-2xl border transition-all ${isDark ? 'shadow-violet-900/30 border-white/[0.08]' : 'shadow-slate-200/80 border-slate-200'} relative h-[460px] flex flex-col justify-between`} style={{ background: isDark ? 'linear-gradient(145deg, #0a0618 0%, #0d1030 50%, #080e1a 100%)' : 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)' }}>

      {/* Ambient glow orbs inside the card */}
      {isDark && (
        <>
          <div className="absolute top-0 right-1/4 w-64 h-64 bg-violet-600/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none" />
        </>
      )}

      {/* Header */}
      <div className={`relative px-5 py-3.5 flex items-center justify-between border-b shrink-0 h-[64px] ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50/50 border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Users width="18" height="18" className="text-white" />
            </div>
          </div>
          <div className="text-left">
            <h3 className={`font-bold text-sm leading-none ${isDark ? 'text-white' : 'text-slate-800'}`}>Meetings & Surveys</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">E-voting, RSVP and audio logs</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-violet-600 dark:text-violet-350 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full">
            Active Resol.
          </span>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-center space-y-2 text-left overflow-hidden h-[336px]">
        {/* Integrated Metrics Row */}
        <div className={`grid grid-cols-3 rounded-xl border ${isDark ? 'divide-x divide-white/[0.05] bg-white/[0.02] border-white/[0.05]' : 'divide-x divide-slate-200/80 bg-white border-slate-200/80'} shadow-sm`}>
          {[
            { label: 'RSVP Rate', val: '92.5%', color: 'text-violet-600 dark:text-violet-400' },
            { label: 'Transcribed', val: '14 Meetings', color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Quorum Met', val: '100%', color: 'text-amber-600 dark:text-amber-400' }
          ].map((m, i) => (
            <div key={i} className="p-1.5 text-center">
              <div className={`text-xs font-black ${m.color} tracking-tight`}>{m.val}</div>
              <div className={`text-[8px] font-bold mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* E-Voting Log */}
        <div className={`rounded-xl overflow-hidden border ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white border-slate-200'}`}>
          <div className={`flex items-center justify-between px-3 py-1.5 border-b ${isDark ? 'border-white/[0.04]' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Active Survey</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono font-bold">Q3 Budget Proposal</span>
            </div>
            <span className="text-[8px] font-extrabold text-emerald-600 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded-full uppercase tracking-wide"> Quorum Reached</span>
          </div>
          <div className="px-3 py-1.5 space-y-1 text-left text-xs">
            <div className="flex justify-between items-center text-[10px] text-slate-600 dark:text-slate-300 font-bold">
              <span>Option A (Approve Budget)</span>
              <span className="text-emerald-600">82.4%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-[#0D1B2A] h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '82.4%' }} />
            </div>
          </div>
        </div>

        {/* Audio Diarization Log */}
        <div className={`rounded-xl overflow-hidden border ${isDark ? 'bg-white/[0.03] border-indigo-500/25' : 'bg-white border-indigo-200'}`}>
          <div className={`flex items-center justify-between px-3 py-1.5 border-b ${isDark ? 'border-white/[0.04]' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Audio Transcript</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono font-bold">Auto-Diarized</span>
            </div>
            <span className="text-[8px] font-extrabold text-indigo-600 dark:text-indigo-300 bg-indigo-500/15 border border-indigo-500/25 px-2 py-0.5 rounded-full uppercase tracking-wide">️ Processed</span>
          </div>
          <div className="px-3 py-1.5 space-y-1 text-left">
            <div className="flex items-start gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-violet-500/10 dark:bg-violet-500/20 border border-violet-500/20 dark:border-violet-500/30 flex items-center justify-center text-[8px] shrink-0 mt-0.5"></div>
              <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-tight"><span className="font-bold text-slate-900 dark:text-white">Speaker 1:</span> "Voting begins on the clubhouse fencing project."</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-violet-500/10 dark:bg-violet-500/20 border border-violet-500/20 dark:border-violet-500/30 flex items-center justify-center text-[8px] shrink-0 mt-0.5"></div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight"><span className="font-bold text-slate-800 dark:text-slate-200">Speaker 2:</span> "Both fence builder quotes are within Q3 reserves."</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div className={`px-5 py-3 flex items-center justify-between border-t shrink-0 h-[60px] ${isDark ? 'border-white/[0.05] bg-white/[0.02]' : 'border-slate-200 bg-slate-50'}`}>
        <span className="text-[10px] text-slate-500 dark:text-slate-400">Secure SHA-256 voting records</span>
        <span className="flex items-center gap-1.5 text-[10px] text-violet-600 dark:text-violet-400 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Verified Assemblies
        </span>
      </div>
    </div>
  );
}

function CalendarOperationsConsole() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`w-full rounded-3xl overflow-hidden shadow-2xl border transition-all ${isDark ? 'shadow-blue-900/30 border-white/[0.08]' : 'shadow-slate-200/80 border-slate-200'} relative h-[460px] flex flex-col justify-between`} style={{ background: isDark ? 'linear-gradient(145deg, #07162c 0%, #0b1a36 50%, #050d18 100%)' : 'linear-gradient(145deg, #f8fafc 0%, #f0f7ff 50%, #e2e8f0 100%)' }}>
      {isDark && (
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />
      )}

      {/* Header */}
      <div className={`relative px-5 py-3.5 flex items-center justify-between border-b shrink-0 h-[64px] ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50/50 border-slate-200'}`}>
        <div className="flex items-center gap-3 text-left">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <CalendarRange size={18} className="text-white" />
          </div>
          <div>
            <h3 className={`font-bold text-sm leading-none ${isDark ? 'text-white' : 'text-slate-800'}`}>Amenity Bookings</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Real-time facility reservations</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">
          July 2026
        </span>
      </div>

      {/* Calendar Grid Preview */}
      <div className="p-4 flex-1 flex flex-col justify-center text-left overflow-hidden h-[336px]">
        <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black text-slate-400 dark:text-gray-500 mb-1.5 uppercase tracking-wider">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }).map((_, idx) => {
            const dayNum = idx - 2;
            const isDay = dayNum > 0 && dayNum <= 31;
            const isToday = dayNum === 3;
            const isSelected = dayNum === 10;
            const hasBooking = dayNum === 3 || dayNum === 10;
            return (
              <div
                key={idx}
                className={`h-9 rounded-xl flex flex-col items-center justify-between p-1 border transition-all ${
                  !isDay ? 'opacity-0 border-transparent' :
                  isSelected ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-md shadow-blue-500/20' :
                  isToday ? 'bg-blue-500/10 border-blue-500/35 text-blue-600 dark:text-blue-400 font-bold' :
                  'bg-white/40 dark:bg-white/[0.01] border-slate-200/50 dark:border-white/[0.03] text-slate-800 dark:text-slate-200'
                }`}
              >
                <span className="text-[10px] font-mono leading-none">{isDay ? dayNum : ''}</span>
                {isDay && hasBooking && (
                  <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-purple-500 dark:bg-purple-400'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer bar */}
      <div className={`px-5 py-3 flex items-center justify-between border-t shrink-0 h-[60px] ${isDark ? 'border-white/[0.05] bg-white/[0.02]' : 'border-slate-200 bg-slate-50'}`}>
        <div className="min-w-0 flex-1 text-left">
          <h4 className={`text-[11px] font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>Clubhouse Party Reservation</h4>
          <p className="text-[9px] text-slate-400 mt-0.5">July 3, 2026 • Unit 104</p>
        </div>
        <span className="bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[8px] font-black px-2 py-0.5 rounded border border-purple-200/30 uppercase shrink-0">APPROVED</span>
      </div>
    </div>
  );
}

/* ─── Maintenance Operations Console ─── */
function MaintenanceOperationsConsole() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`w-full rounded-3xl overflow-hidden shadow-2xl border transition-all ${isDark ? 'shadow-emerald-900/30 border-white/[0.08]' : 'shadow-slate-200/80 border-slate-200'} relative h-[460px] flex flex-col justify-between`} style={{ background: isDark ? 'linear-gradient(145deg, #051a10 0%, #0a2418 50%, #030f0a 100%)' : 'linear-gradient(145deg, #f8fafc 0%, #f0fdf4 50%, #e2e8f0 100%)' }}>
      {isDark && (
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-emerald-600/10 rounded-full blur-[80px] pointer-events-none" />
      )}

      {/* Header */}
      <div className={`relative px-5 py-3.5 flex items-center justify-between border-b shrink-0 h-[64px] ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50/50 border-slate-200'}`}>
        <div className="flex items-center gap-3 text-left">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Wrench size={18} className="text-white" />
          </div>
          <div>
            <h3 className={`font-bold text-sm leading-none ${isDark ? 'text-white' : 'text-slate-800'}`}>Maintenance Kanban</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Active work orders & dispatches</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          Active Orders
        </span>
      </div>

      {/* Work Orders */}
      <div className="p-4 flex-1 space-y-2 flex flex-col justify-center text-left overflow-hidden h-[336px]">
        {[
          { text: "Repair leaking main valve in Courtyard B", done: false, badge: "In Progress" },
          { text: "Inspect clubhouse elevator safety certificate", done: true, badge: "Completed" },
          { text: "Replace broken lights in North Parking Lot", done: false, badge: "Open" },
          { text: "Repair damaged lock on courtyard main gate", done: true, badge: "Completed" }
        ].map((item, i) => (
          <div key={i} className={`p-2.5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
            item.done 
              ? 'bg-slate-500/5 dark:bg-white/[0.02] border-slate-200/40 dark:border-white/5 opacity-75' 
              : isDark ? 'bg-white/[0.02] border-emerald-500/20 shadow-sm' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-3 min-w-0">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center border text-[8px] shrink-0 font-bold ${
                item.done 
                  ? 'bg-emerald-500 border-emerald-500 text-white' 
                  : isDark ? 'border-white/30 text-transparent' : 'border-slate-300 text-transparent'
              }`}></span>
              <span className={`text-[11px] font-semibold truncate ${item.done ? 'line-through text-slate-400 dark:text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>{item.text}</span>
            </div>
            <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded border uppercase shrink-0 ${
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
      <div className={`px-5 py-3 flex items-center justify-between border-t shrink-0 h-[60px] ${isDark ? 'border-white/[0.05] bg-white/[0.02]' : 'border-slate-200 bg-slate-50'}`}>
        <span className="text-[10px] text-slate-500 dark:text-slate-400">2 active work orders · 2 completed</span>
        <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold cursor-pointer hover:underline text-left">
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
    <div className={`w-full rounded-3xl overflow-hidden shadow-2xl border transition-all ${isDark ? 'shadow-teal-900/30 border-white/[0.08]' : 'shadow-slate-200/80 border-slate-200'} relative h-[460px] flex flex-col justify-between`} style={{ background: isDark ? 'linear-gradient(145deg, #031818 0%, #062828 50%, #020e0e 100%)' : 'linear-gradient(145deg, #f8fafc 0%, #f0fdfa 50%, #e2e8f0 100%)' }}>
      {isDark && (
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-teal-600/10 rounded-full blur-[80px] pointer-events-none" />
      )}

      {/* Header */}
      <div className={`relative px-5 py-3.5 flex items-center justify-between border-b shrink-0 h-[64px] ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50/50 border-slate-200'}`}>
        <div className="flex items-center gap-3 text-left">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
            <Wallet size={18} className="text-white" />
          </div>
          <div>
            <h3 className={`font-bold text-sm leading-none ${isDark ? 'text-white' : 'text-slate-800'}`}>Dues & Invoices</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Automated accounting & invoice tracking</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-full">
          Q3 Billing Active
        </span>
      </div>

      {/* Metrics & Ledger Preview */}
      <div className="p-4 flex-1 flex flex-col justify-center space-y-2.5 text-left overflow-hidden h-[336px]">
        <div className="flex items-center gap-4 p-2.5 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white/50 dark:bg-white/[0.01]">
          <div className="relative w-11 h-11 shrink-0">
            <svg viewBox="0 0 36 36" className="w-11 h-11 -rotate-90">
              <circle cx="18" cy="18" r="14.5" fill="none" stroke={isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"} strokeWidth="3.5" />
              <circle cx="18" cy="18" r="14.5" fill="none" stroke="#14B8A6" strokeWidth="3.5" strokeDasharray="78 100" strokeLinecap="round" />
            </svg>
            <div className={`absolute inset-0 flex items-center justify-center text-[10px] font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>78%</div>
          </div>
          <div>
            <p className={`text-sm font-black leading-none ${isDark ? 'text-white' : 'text-slate-800'}`}>$19,227.00 Collected</p>
            <p className="text-[9px] text-slate-400 mt-0.5">$3,800.00 Pending • $1,623.00 Overdue</p>
          </div>
        </div>

        <div className="space-y-1 text-left">
          <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Recent Invoices</p>
          {[
            { title: "Unit 104 Q3 Maintenance Dues", desc: "Digital bank transfer payment", amt: "+$150.00", status: "Paid" },
            { title: "Unit 305 Late Payment Fine", desc: "Overdue fee notice generated", amt: "+$25.00 Fine", status: "Overdue" }
          ].map((item, idx) => (
            <div key={idx} className={`p-2 rounded-xl border flex items-center justify-between text-[10px] ${
              isDark ? 'bg-white/[0.01] border-white/5' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <h4 className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{item.title}</h4>
                <p className="text-[8.5px] text-slate-400 mt-0.5">{item.desc}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-extrabold text-teal-600 dark:text-teal-400 block">{item.amt}</span>
                <span className="text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer bar */}
      <div className={`px-5 py-3 flex items-center justify-between border-t shrink-0 h-[60px] ${isDark ? 'border-white/[0.05] bg-white/[0.02]' : 'border-slate-200 bg-slate-50'}`}>
        <span className="text-[10px] text-slate-500 dark:text-slate-400">Verified Ledger Registry</span>
        <span className="flex items-center gap-1.5 text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
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
  const [activeDashboard, setActiveDashboard] = useState(0);
  const [dashboardFading, setDashboardFading] = useState(false);
  // Auto-cycle dashboard portal every 5.0s
  useEffect(() => {
    const timer = setInterval(() => {
      setDashboardFading(true);
      setTimeout(() => {
        setActiveDashboard(prev => (prev + 1) % 3);
        setDashboardFading(false);
      }, 350);
    }, 5000);
    return () => clearInterval(timer);
  }, []);
  // Portal data configuration
  const dashboardData = [
    {
      url: 'app.nestbloq.com/hoa/dashboard',
      managerName: 'John Smith',
      managerRole: 'PROPERTY MANAGER',
      managerInitials: 'JS',
      managerColor: 'bg-blue-500',
      contextLabel: 'MY COMMUNITY',
      communityName: 'Willow Creek Community',
      communityCode: 'VIK774 ▾',
      welcomeMsg: 'Welcome back, John! 🏘️',
      subMsg: "Here is a summary of your community's active operations today.",
      badge1: 'Code: VIK774', badge1color: isDark ? 'bg-white/5 text-slate-300 border-white/10' : 'bg-slate-100 text-slate-600 border-slate-200',
      badge2: 'ACTIVE PM LICENSE', badge2color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      address: '123 Willow Creek Way, Sunnyvale, CA 94086',
      stats: [
        { val: '3', label: 'Members', color: 'text-blue-600 dark:text-blue-400' },
        { val: '2', label: 'Violations', color: 'text-amber-600 dark:text-amber-500' },
        { val: '1', label: 'Service Req', color: 'text-blue-600 dark:text-blue-400' },
        { val: '120', label: 'Total Units', color: 'text-indigo-600 dark:text-indigo-400' },
      ],
      leftPanelTitle: 'Quick Links',
      rightPanelTitle: 'Calendar Schedule',
      rightPanelSub: 'View Calendar',
    },
    {
      url: 'app.nestbloq.com/rental/dashboard',
      managerName: 'James Mitchell',
      managerRole: 'LANDLORD',
      managerInitials: 'JM',
      managerColor: 'bg-teal-500',
      contextLabel: 'MY PORTFOLIO',
      communityName: 'All Properties',
      communityCode: '3 Props ▾',
      welcomeMsg: 'Welcome back, James! 🔑',
      subMsg: 'Rental Portfolio Summary · Real-Time Property Overview',
      badge1: 'Props Loan: 3', badge1color: isDark ? 'bg-white/5 text-slate-300 border-white/10' : 'bg-slate-100 text-slate-600 border-slate-200',
      badge2: 'ACTIVE', badge2color: 'text-teal-700 dark:text-teal-400 bg-teal-500/10 border-teal-500/20',
      address: '742 Evergreen Terrace, Portland, OR 97201',
      stats: [
        { val: '3', label: 'Properties', color: 'text-teal-600 dark:text-teal-400' },
        { val: '6', label: 'Total Units', color: 'text-blue-600 dark:text-blue-400' },
        { val: '4', label: 'Tenants', color: 'text-violet-600 dark:text-violet-400' },
        { val: '2', label: 'Open Tickets', color: 'text-amber-600 dark:text-amber-400' },
      ],
      leftPanelTitle: 'Rent Overview',
      rightPanelTitle: 'Action Required',
      rightPanelSub: 'Tenant Requests ●4',
    },
    {
      url: 'app.nestbloq.com/condo/dashboard',
      managerName: 'Robert Hayes',
      managerRole: 'CONDO MANAGER',
      managerInitials: 'RH',
      managerColor: 'bg-amber-500',
      contextLabel: 'MY BUILDING',
      communityName: 'The Meridian Tower',
      communityCode: 'MDN-01 ▾',
      welcomeMsg: 'Welcome back, Robert! 🏙️',
      subMsg: 'Condo Operations Overview · Building & Unit Management',
      badge1: 'Bldg: MDN-01', badge1color: isDark ? 'bg-white/5 text-slate-300 border-white/10' : 'bg-slate-100 text-slate-600 border-slate-200',
      badge2: 'FULLY OCCUPIED', badge2color: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
      address: '1450 Harbor Blvd, San Diego, CA 92101',
      stats: [
        { val: '48', label: 'Total Units', color: 'text-amber-600 dark:text-amber-400' },
        { val: '46', label: 'Occupied', color: 'text-emerald-600 dark:text-emerald-400' },
        { val: '3', label: 'Maintenance', color: 'text-red-600 dark:text-red-400' },
        { val: '12', label: 'Bookings', color: 'text-blue-600 dark:text-blue-400' },
      ],
      leftPanelTitle: 'Unit Status Board',
      rightPanelTitle: 'Upcoming Bookings',
      rightPanelSub: 'View All',
    },
  ];
  const pd = dashboardData[activeDashboard];

  const automationSlides = [
    {
      tabLabel: " Maintenance Kanban",
      badge: "Service Requests",
      title: "Visual Kanban Board",
      subtitle: "for maintenance dispatches.",
      desc: "Coordinate community repairs and work orders. Track issues in real-time, dispatch jobs to vendors, and manage task columns from a simple interactive board.",
      points: [
        { icon: '', text: 'Drag-and-drop repair ticket workflow' },
        { icon: '️', text: 'Assign tasks to external community vendors' },
        { icon: '', text: 'Log private manager notes and action steps' },
        { icon: '', text: 'Instantly update residents on repair status' }
      ],
      linkText: "Explore Maintenance Features",
      linkTo: "/features",
      badgeColor: "bg-emerald-500/10 border-emerald-500/25 text-emerald-650 dark:text-emerald-400",
      btnColor: "bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20",
      image: featureMaintenance,
      component: <MaintenanceOperationsConsole />
    },
    {
      tabLabel: " Amenity Booking",
      badge: "Facility Scheduler",
      title: "Sleek reservation",
      subtitle: "and booking approvals.",
      desc: "Enable residents to reserve clubhouses, pools, gyms, or tennis courts. Prevent double bookings, manage slot constraints, and handle board approvals.",
      points: [
        { icon: '', text: 'Double-booking protection for all time slots' },
        { icon: '', text: 'Customizable daily slot booking limits' },
        { icon: '️', text: 'Seamless board approval and verification gates' },
        { icon: '', text: 'Real-time visual slot availability calendar' }
      ],
      linkText: "Explore Bookings",
      linkTo: "/features",
      badgeColor: "bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-400",
      btnColor: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20",
      image: featureCopilot,
      component: <CalendarOperationsConsole />
    },
    {
      tabLabel: "️ Meetings & Surveys",
      badge: "E-Voting & Assemblies",
      title: "Community assemblies",
      subtitle: "and resident surveys.",
      desc: "Schedule and organize board meetings, general assemblies, and resident opinion polls. Enable secure voting on resolutions with absolute transparency.",
      points: [
        { icon: '️', text: 'Run online community voting on key resolutions' },
        { icon: '️', text: 'Meeting audio recording and speaker diarization' },
        { icon: '', text: 'Collaborative RSVP tracker for board assemblies' },
        { icon: '', text: 'Real-time survey response analysis and logs' }
      ],
      linkText: "Explore Meetings & Surveys",
      linkTo: "/features",
      badgeColor: "bg-violet-500/10 border-violet-500/25 text-violet-650 dark:text-violet-400",
      btnColor: "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-violet-500/20",
      image: featureSecurity,
      component: <MeetingsOperationsConsole />
    },
    {
      tabLabel: " Dues & Payments",
      badge: "Financial Ledger",
      title: "Seamless collections",
      subtitle: "and automated accounting.",
      desc: "Track outstanding HOA dues and resident payments on a centralized ledger. Log payments, issue invoices, and manage community financial accounts.",
      points: [
        { icon: '', text: 'Keep clear record of paid, pending, and overdue invoices' },
        { icon: '', text: 'Financial metrics showing total collected funds' },
        { icon: '', text: 'Direct logging of manual checks and digital payments' },
        { icon: '', text: 'Clear audit trails linked to units and owner files' }
      ],
      linkText: "Explore Payments",
      linkTo: "/features",
      badgeColor: "bg-teal-500/10 border-teal-500/25 text-teal-650 dark:text-teal-400",
      btnColor: "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-teal-500/20",
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

  const rotatingWords = [
    "Rental Property Management",
    "Condo Management",
    "Apartment Management",
    "HOA Management"
  ];
  const [wordIndex, setWordIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(120);

  useEffect(() => {
    let timer;
    const handleTyping = () => {
      const fullWord = rotatingWords[wordIndex];
      
      if (!isDeleting) {
        // Typing state
        setTypedText(fullWord.substring(0, typedText.length + 1));
        setTypingSpeed(100);
        if (typedText === fullWord) {
          // Finished typing: pause
          timer = setTimeout(() => setIsDeleting(true), 2000);
          return;
        }
      } else {
        // Deleting state
        setTypedText(fullWord.substring(0, typedText.length - 1));
        setTypingSpeed(45);
        if (typedText === "") {
          setIsDeleting(false);
          setWordIndex((prevIndex) => (prevIndex + 1) % rotatingWords.length);
        }
      }

      timer = setTimeout(handleTyping, typingSpeed);
    };

    timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [typedText, isDeleting, wordIndex]);

  const location = useLocation();
  const solutionsSectionRef = useRef(null);
  const [activeSolution, setActiveSolution] = useState('rental');

  // Parse URL search query for solutions tab
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get('type');
    const validTypes = ['rental', 'condo', 'apartment', 'hoa'];
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
      name: 'Sarah L.',
      role: 'HOA Secretary',
      society: 'Sunrise Heights',
      rating: 5,
      comment: 'NestBloq completely transformed our community operations. Automated payments, zero midnight bylaws queries, and an interactive dashboard the whole board loves. Absolutely brilliant platform!',
      avatar: 'SL',
      units: '120+ Units',
      gradient: 'from-violet-500 to-indigo-600',
      glowColor: 'group-hover:shadow-[0_20px_40px_rgba(124,58,237,0.15)]',
      glowRgb: 'rgba(124,58,237,0.15)',
      textColor: 'text-violet-500',
      cardBg: 'bg-gradient-to-br from-violet-500/[0.07] via-white to-indigo-500/[0.03] dark:from-violet-950/20 dark:via-[#0D1B2A] dark:to-indigo-950/10',
      borderColor: 'border-violet-500/20 dark:border-violet-500/10 hover:border-violet-500/40 dark:hover:border-violet-500/30'
    },
    {
      name: 'Rajesh K.',
      role: 'Board President',
      society: 'Green Park Residency',
      rating: 5,
      comment: 'Onboarding was incredibly seamless — units, resident directories, and maintenance tracking were all live in under 48 hours. The setup support was exceptionally cooperative and professional.',
      avatar: 'RK',
      units: '500+ Units',
      gradient: 'from-emerald-500 to-blue-600',
      glowColor: 'group-hover:shadow-[0_20px_40px_rgba(16,185,129,0.15)]',
      glowRgb: 'rgba(16,185,129,0.15)',
      textColor: 'text-emerald-500',
      cardBg: 'bg-gradient-to-br from-emerald-500/[0.07] via-white to-blue-500/[0.03] dark:from-emerald-950/20 dark:via-[#0D1B2A] dark:to-blue-950/10',
      borderColor: 'border-emerald-500/20 dark:border-emerald-500/10 hover:border-emerald-500/40 dark:hover:border-emerald-500/30'
    },
    {
      name: 'Priya Patel',
      role: 'Property Manager',
      society: 'Maple Heights Enclave',
      rating: 5,
      comment: 'Isolated community databases gave our board complete trust. Dues are collected 45% faster and service requests are auto-dispatched from raise to resolve. Zero hassle operations.',
      avatar: 'PP',
      units: '2,600+ Units',
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
      desc: 'Granular permissions for Board Presidents, Property Managers, Auditors, and Homeowners with fully isolated data.',
      stats: '100% data isolation'
    },
    {
      icon: Activity, title: 'NestBloq Assistant', tagline: '24/7 intelligent assistant', color: 'rose',
      desc: 'Conversational AI that answers bylaws queries, books amenities, and logs maintenance requests automatically.',
      stats: '85% query automation'
    }
  ];

  const faqs = [
    { q: 'How does the NestBloq Resident Assistant work?', a: 'Our NestBloq Assistant runs on advanced conversational models trained for property management. It auto-answers resident queries about bylaws, trash schedules, and amenity bookings. When a resident reports an issue, AI gathers details and submits service requests directly into the manager portal.' },
    { q: 'Is our financial data secure on NestBloq?', a: 'Yes, security is our absolute priority. We use bank-grade AES-256 encryption for all records. Online dues are processed via PCI-DSS compliant payment gateways — credit card and bank details are never stored on our servers.' },
    { q: 'Can NestBloq integrate with our existing accounting system?', a: 'Absolutely. NestBloq provides seamless integrations with QuickBooks, Yardi, AppFolio, and direct banking sync for quick reconciliation.' },
    { q: 'What is the onboarding process like?', a: 'Onboarding typically takes less than 48 hours. Our customer success team handles importing resident rosters, outstanding balances, and amenities, then guides your board through a full walkthrough.' },
    { q: 'How does the invitation system work for members?', a: 'The Property Manager or Board President generates a unique invite link from the admin panel. Members receive an email invite, register under the correct community, and are automatically assigned their role-based workspace.' }
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
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#090F16] font-sans transition-colors duration-300">
      <Navbar />

      <div className="flex-1 overflow-x-hidden">

      {/* ═══════════════════════════════════════════════════════
          HERO SECTION — centered layout matching client PNG
      ═══════════════════════════════════════════════════════ */}
      <section className="relative pt-14 pb-0 px-5 sm:px-8 overflow-hidden">
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
            <Link to="/register" className="btn-glow px-8 py-3.5 text-sm font-semibold text-white rounded-xl flex items-center gap-2 group">
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

          {/* ── DASHBOARD BROWSER MOCKUP — AUTO-ROTATING 3 PORTALS ── */}
          <div className="relative mt-14 animate-fade-in-up-delay-2">
            {/* Glow beneath the browser */}
            <div className="absolute -inset-x-20 -bottom-10 h-40 bg-gradient-to-t from-violet-600/20 via-indigo-500/10 to-transparent blur-2xl pointer-events-none rounded-full" />

            {/* Portal Tab Switcher */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {[
                { label: '🏘️ HOA Portal', color: 'violet' },
                { label: '🔑 Rental Portal', color: 'teal' },
                { label: '🏙️ Condo Portal', color: 'amber' }
              ].map((tab, idx) => (
                <button
                  key={idx}
                  onClick={() => { setDashboardFading(true); setTimeout(() => { setActiveDashboard(idx); setDashboardFading(false); }, 200); }}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all duration-300 ${
                    activeDashboard === idx
                      ? tab.color === 'violet' ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/30'
                        : tab.color === 'teal' ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-500/30'
                        : 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/30'
                      : isDark ? 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              {/* Auto-cycle indicator dots */}
              <div className="flex items-center gap-1 ml-2">
                {[0,1,2].map(i => (
                  <div key={i} className={`rounded-full transition-all duration-300 ${
                    activeDashboard === i ? 'w-4 h-1.5 bg-violet-500' : 'w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600'
                  }`} />
                ))}
              </div>
            </div>

            {/* Browser chrome wrapper */}
            <div className="relative rounded-t-2xl overflow-hidden border border-slate-200/60 dark:border-white/[0.08] shadow-[0_32px_80px_rgba(0,0,0,0.12)] dark:shadow-[0_32px_80px_rgba(0,0,0,0.5)] bg-white dark:bg-[#0B1929]">

              {/* Browser top bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-[#0D1B2A] border-b border-slate-200/60 dark:border-white/[0.06]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white dark:bg-[#090F16] rounded-md px-3 py-1 text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-2 max-w-xs mx-auto border border-slate-200 dark:border-white/[0.06]">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    {pd.url}
                  </div>
                </div>
              </div>

              {/* Dashboard Layout — fades between portals */}
              <div
                className="flex h-[480px] overflow-hidden bg-slate-50 dark:bg-[#090F16] transition-opacity duration-300"
                style={{ opacity: dashboardFading ? 0 : 1 }}
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
                    {(activeDashboard === 0 ? [
                      { label: 'Dashboard', icon: LayoutDashboard, active: true },
                      { label: 'Members', icon: Users, active: false },
                      { label: 'Violations', icon: Scale, active: false },
                      { label: 'Service Requests', icon: Wrench, active: false },
                      { label: 'Vendors', icon: Truck, active: false },
                      { label: 'Manage Amenities', icon: Building2, active: false },
                      { label: 'Payments', icon: Wallet, active: false },
                      { label: 'Documents', icon: Folder, active: false },
                      { label: 'Reports', icon: TrendingUp, active: false },
                      { label: 'Meetings & Surveys', icon: CalendarRange, active: false },
                      { label: 'News & Announcements', icon: Megaphone, active: false },
                    ] : activeDashboard === 1 ? [
                      { label: 'Landlord Dashboard', icon: LayoutDashboard, active: true },
                      { label: 'Properties & Units', icon: Building2, active: false },
                      { label: 'Tenant Screening', icon: UserCheck, active: false },
                      { label: 'Lease Agreements', icon: FileText, active: false },
                      { label: 'Tenants', icon: Users, active: false },
                      { label: 'Payments Ledger', icon: Wallet, active: false },
                      { label: 'Maintenance Desk', icon: Wrench, active: false },
                      { label: 'Contractors / Vendors', icon: Truck, active: false },
                      { label: 'Reports', icon: TrendingUp, active: false },
                    ] : [
                      { label: 'Condo Dashboard', icon: LayoutDashboard, active: true },
                      { label: 'Unit Owners', icon: Users, active: false },
                      { label: 'Amenity Booking', icon: CalendarRange, active: false },
                      { label: 'Guest Access & OTPs', icon: Shield, active: false },
                      { label: 'Maintenance', icon: Wrench, active: false },
                      { label: 'Dues & Payments', icon: Wallet, active: false },
                      { label: 'Building Notices', icon: Megaphone, active: false },
                      { label: 'Documents', icon: Folder, active: false },
                      { label: 'Reports', icon: TrendingUp, active: false },
                    ]).map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors ${
                          item.active
                            ? isDark ? 'bg-blue-500/10 text-blue-400 font-semibold border-l-2 border-blue-500' : 'bg-white text-blue-600 font-semibold border-l-2 border-blue-600 shadow-sm'
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
                        <div className={`text-[6px] font-extrabold uppercase tracking-widest truncate ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{pd.managerRole}</div>
                      </div>
                    </div>
                  </div>
                </aside>

                {/* ── Main Content ── */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Topbar */}
                  <div className={`px-4 py-2.5 flex items-center justify-between shrink-0 transition-colors duration-300 border-b ${
                    isDark ? 'bg-[#0B132B] border-white/[0.06]' : 'bg-white border-slate-200/80 shadow-sm'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400"><Building size={12} /></div>
                      <div className="text-left">
                        <span className="text-[6px] font-extrabold text-slate-400 uppercase tracking-widest block leading-none">{pd.contextLabel}</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{pd.communityName}</span>
                          <span className={`text-[7px] font-extrabold px-1.5 py-0.5 rounded font-mono border ${isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-500/20'}`}>{pd.communityCode}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <Sun size={12} />
                        <div className="relative"><Bell size={12} /><span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full border ${isDark ? 'border-[#0B132B]' : 'border-white'}`} /></div>
                      </div>
                      <div className={`flex items-center gap-2 pl-3 border-l ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
                        <div className="hidden sm:block text-right">
                          <p className={`text-[8px] font-bold leading-none ${isDark ? 'text-white' : 'text-slate-800'}`}>{pd.managerName}</p>
                          <span className={`text-[6px] font-extrabold uppercase tracking-wider ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{pd.managerRole}</span>
                        </div>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black text-white ${pd.managerColor}`}>{pd.managerInitials}</div>
                      </div>
                    </div>
                  </div>

                  {/* Dashboard body */}
                  <div className={`flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar transition-colors duration-300 ${
                    isDark ? 'bg-[#090F16]' : 'bg-slate-50'
                  }`}>

                    {/* Welcome + Stats Header Card */}
                    <div className={`rounded-2xl p-4 border flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${
                      isDark ? 'bg-gradient-to-r from-[#1E2E42] via-[#162535] to-[#121B2A] border-white/[0.06]' : 'bg-white border-slate-200/80 shadow-sm'
                    }`}>
                      <div className="flex-1 min-w-0 text-left">
                        <h2 className={`text-sm font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{pd.welcomeMsg}</h2>
                        <p className={`text-[8px] mt-0.5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{pd.subMsg}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className={`inline-flex items-center text-[7px] font-bold px-2 py-0.5 rounded-lg border ${pd.badge1color}`}>{pd.badge1}</span>
                          <span className={`inline-flex items-center text-[7px] font-black px-2 py-0.5 rounded-lg border ${pd.badge2color}`}>{pd.badge2}</span>
                          <span className={`inline-flex items-center gap-1 text-[7px] font-semibold px-2 py-0.5 rounded-lg border ${isDark ? 'bg-white/[0.02] text-gray-300 border-white/5' : 'bg-slate-50 text-slate-600 border-slate-200/40'}`}>
                            <MapPin size={8} />{pd.address}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-row gap-6 sm:gap-8">
                        {pd.stats.map((s, i) => (
                          <div key={i} className="text-center min-w-[36px]">
                            <p className={`text-base font-black font-mono ${s.color}`}>{s.val}</p>
                            <p className={`text-[6px] font-extrabold uppercase tracking-wider mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* DYNAMIC DASHBOARD PORTALS LAYOUTS */}
                    {activeDashboard === 0 && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                        {/* HOA Left Panel: Quick Links */}
                        <div className={`lg:col-span-7 border rounded-2xl p-4 flex flex-col justify-between ${isDark ? 'bg-[#1E2E42] border-white/[0.06]' : 'bg-white border-slate-200/80 shadow-sm'}`}>
                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/50 dark:border-white/[0.05] text-left">
                            <h3 className={`font-extrabold text-[9px] uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Quick Links</h3>
                            <div className="flex items-center gap-2">
                              <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest font-mono hidden sm:inline">July 2026</span>
                              <button className={`px-2 py-0.5 rounded border text-[7.5px] font-bold ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>All Communities</button>
                              <button className="px-2 py-0.5 bg-blue-600 text-white rounded text-[7.5px] font-black flex items-center gap-1"><Download size={8} />Export</button>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2.5">
                            {[
                              { label: 'Service Req', icon: <Wrench size={12} className="text-amber-500" />, badge: 1 },
                              { label: 'Vendor List', icon: <Users size={12} className="text-blue-500" /> },
                              { label: 'Violations', icon: <AlertTriangle size={12} className="text-red-500" />, badge: 2 },
                              { label: 'Amenities', icon: <Building2 size={12} className="text-blue-500" /> },
                              { label: 'Payments', icon: <Wallet size={12} className="text-emerald-500" /> },
                              { label: 'Documents', icon: <Folder size={12} className="text-slate-500" /> },
                            ].map((btn, idx) => (
                              <div key={idx} className={`relative p-3 rounded-xl border flex flex-col justify-between h-16 text-left ${isDark ? 'border-white/[0.04] bg-white/[0.01]' : 'border-slate-200/60 bg-slate-50/50'}`}>
                                <div className="flex justify-between items-start">
                                  <div className={`p-1 rounded-lg ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>{btn.icon}</div>
                                  {btn.badge && <span className="bg-red-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full">{btn.badge}</span>}
                                </div>
                                <span className={`text-[8px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{btn.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* HOA Right Panel: Calendar Schedule */}
                        <div className={`lg:col-span-5 border rounded-2xl p-4 text-left flex flex-col justify-between ${isDark ? 'bg-[#1E2E42] border-white/[0.06]' : 'bg-white border-slate-200/80 shadow-sm'}`}>
                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/50 dark:border-white/[0.05]">
                            <h3 className={`font-extrabold text-[9px] uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Calendar Schedule</h3>
                            <span className="text-[7.5px] font-bold text-blue-600 hover:underline cursor-pointer">View Calendar</span>
                          </div>
                          <div className="space-y-2 flex-1 flex flex-col justify-center">
                            {[
                              { title: 'Budget Meeting', sub: 'Jul 3, 2026, 04:31 PM', badge: 'MEETING', bc: 'bg-purple-100 dark:bg-purple-500/10 text-purple-650 dark:text-purple-400 border-purple-200/30' },
                              { title: 'Annual Budget Review & Fee...', sub: 'Jul 10, 2026, 11:00 AM', badge: 'MEETING', bc: 'bg-purple-100 dark:bg-purple-500/10 text-purple-650 dark:text-purple-400 border-purple-200/30' },
                            ].map((evt, idx) => (
                              <div key={idx} className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50/70 border-slate-200/50'}`}>
                                <div className="min-w-0 flex-1 text-left">
                                  <h4 className={`text-[8px] font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{evt.title}</h4>
                                  <p className="text-[7px] text-slate-405 mt-0.5">{evt.sub}</p>
                                </div>
                                <span className={`text-[6px] font-extrabold px-1.5 py-0.5 rounded border shrink-0 ${evt.bc}`}>{evt.badge}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeDashboard === 1 && (
                      <div className="space-y-4">
                        {/* 4 Cards Grid - Matching Real Landlord Dashboard exactly */}
                        <div className="grid grid-cols-4 gap-3 text-left">
                          <div className={`p-3 rounded-xl border flex flex-col justify-between shadow-sm ${isDark ? 'bg-[#111C2A]/60 border-white/5' : 'bg-white border-slate-200/80'}`}>
                            <span className="text-[7px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">RENT RECEIVED</span>
                            <span className="text-base font-black text-slate-900 dark:text-white mt-1 font-mono">$3,100.00</span>
                            <span className="text-[6px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">Collection Rate: 39%</span>
                          </div>
                          <div className={`p-3 rounded-xl border flex flex-col justify-between shadow-sm ${isDark ? 'bg-[#111C2A]/60 border-white/5' : 'bg-white border-slate-200/80'}`}>
                            <span className="text-[7px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">UNPAID EXPENSES</span>
                            <span className="text-base font-black text-slate-900 dark:text-white mt-1 font-mono">$100.00</span>
                            <span className="text-[6px] text-red-600 dark:text-red-400 font-bold mt-1">Active Invoices</span>
                          </div>
                          <div className={`p-3 rounded-xl border flex flex-col justify-between shadow-sm ${isDark ? 'bg-[#111C2A]/60 border-white/5' : 'bg-white border-slate-200/80'}`}>
                            <span className="text-[7px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">OVERDUE RENT</span>
                            <span className="text-base font-black text-slate-900 dark:text-white mt-1 font-mono">$5,000.00</span>
                            <span className="text-[6px] text-amber-600 dark:text-amber-500 font-bold mt-1">Overdue Invoices</span>
                          </div>
                          <div className={`p-3 rounded-xl border flex flex-col justify-between shadow-sm ${isDark ? 'bg-[#111C2A]/60 border-white/5' : 'bg-white border-slate-200/80'}`}>
                            <span className="text-[7px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">UPCOMING EXPENSES</span>
                            <span className="text-base font-black text-slate-900 dark:text-white mt-1 font-mono">$100.00</span>
                            <span className="text-[6px] text-blue-600 dark:text-blue-400 font-bold mt-1 font-sans">Open Tickets</span>
                          </div>
                        </div>

                        {/* Cashflow Summary & Action Required Grid */}
                        <div className="grid grid-cols-12 gap-3 text-left">
                          {/* Cashflow chart (7 Cols) */}
                          <div className={`col-span-7 border rounded-2xl p-3 flex flex-col justify-between ${isDark ? 'bg-[#1E2E42] border-white/[0.06]' : 'bg-white border-slate-200/80 shadow-sm'}`}>
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200/40 dark:border-white/5">
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Cashflow Summary</span>
                              <span className="text-[6px] text-slate-500">Real-time Income vs Expense</span>
                            </div>
                            <div className="flex items-end justify-between h-24 pt-4 px-2">
                              {[
                                { month: 'Mar', inc: 10, exp: 5 },
                                { month: 'Apr', inc: 15, exp: 8 },
                                { month: 'May', inc: 35, exp: 20 },
                                { month: 'Jun', inc: 40, exp: 12 },
                                { month: 'Jul', inc: 75, exp: 40 },
                                { month: 'Aug', inc: 20, exp: 10 },
                              ].map((d, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
                                  <div className="w-full flex items-end justify-center gap-1 h-14">
                                    <div className="w-1.5 bg-emerald-500 rounded-t-sm" style={{ height: `${d.inc}%` }} />
                                    <div className="w-1.5 bg-amber-500 rounded-t-sm" style={{ height: `${d.exp}%` }} />
                                  </div>
                                  <span className="text-[7px] font-semibold text-slate-400">{d.month}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Action Required: Tenant requests (5 Cols) */}
                          <div className={`col-span-5 border rounded-2xl p-3 flex flex-col justify-between ${isDark ? 'bg-[#1E2E42] border-white/[0.06]' : 'bg-white border-slate-200/80 shadow-sm'}`}>
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200/40 dark:border-white/5">
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Action Required</span>
                              <span className="text-[6px] text-blue-600 font-bold">Tenant Requests</span>
                            </div>
                            <div className="space-y-2 py-1.5 flex-1 flex flex-col justify-center">
                              <div className={`p-2 border rounded-xl flex items-center justify-between gap-2 ${isDark ? 'bg-[#111C2A]/60 border-red-500/20' : 'bg-red-50/50 border-red-100'}`}>
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-[8px] font-bold text-slate-800 dark:text-red-300 truncate">Electrician</h4>
                                  <p className="text-[6px] text-slate-500 dark:text-slate-450 mt-0.5">Unit 102 — Priority: NORMAL</p>
                                </div>
                                <button className="bg-red-500 hover:bg-red-600 text-white font-bold text-[7px] px-2 py-1 rounded shrink-0 transition-colors shadow-sm">Assign</button>
                              </div>
                              <div className={`p-2 border rounded-xl flex items-center justify-between gap-2 ${isDark ? 'bg-[#111C2A]/60 border-white/5' : 'bg-slate-50 border-slate-200/50'}`}>
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-[8px] font-bold text-slate-800 dark:text-slate-200 truncate">Plumber</h4>
                                  <p className="text-[6px] text-slate-500 dark:text-slate-450 mt-0.5">Unit 104 — Pipe Leak Report</p>
                                </div>
                                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[7px] px-2 py-1 rounded shrink-0 transition-colors shadow-sm">Assign</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeDashboard === 2 && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 text-left">
                        {/* Condo Left Panel: Visitor OTP Logs */}
                        <div className={`lg:col-span-7 border rounded-2xl p-4 flex flex-col justify-between ${isDark ? 'bg-[#1E2E42] border-white/[0.06]' : 'bg-white border-slate-200/80 shadow-sm'}`}>
                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/50 dark:border-white/[0.05]">
                            <h3 className={`font-extrabold text-[9px] uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Guest Access & OTPs</h3>
                            <div className="flex items-center gap-2">
                              <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest font-mono">14 Active Passes</span>
                              <button className="px-2 py-0.5 bg-blue-600 text-white rounded text-[7.5px] font-black">+ Issue Pass</button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {[
                              { guest: 'Sarah Connor', unit: 'Unit #404', code: 'OTP-9821', time: 'Exp: 2 Hours', status: 'Active' },
                              { guest: 'John Miller', unit: 'Unit #102', code: 'OTP-1055', time: 'Exp: 6 Hours', status: 'Active' },
                              { guest: 'David Wilson', unit: 'Unit #301', code: 'OTP-4482', time: 'Exp: 10 mins', status: 'Expired' }
                            ].map((g, idx) => (
                              <div key={idx} className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50/70 border-slate-200/50'}`}>
                                <div className="min-w-0 flex-1">
                                  <h4 className={`text-[8px] font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{g.guest}</h4>
                                  <p className="text-[7px] text-slate-450 mt-0.5">{g.unit} • {g.time}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-[8.5px] font-mono font-black text-blue-600 dark:text-blue-400">{g.code}</p>
                                  <span className={`text-[6.5px] font-bold ${g.status === 'Active' ? 'text-emerald-500' : 'text-slate-500'}`}>{g.status}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Condo Right Panel: Upcoming Bookings */}
                        <div className={`lg:col-span-5 border rounded-2xl p-4 flex flex-col justify-between ${isDark ? 'bg-[#1E2E42] border-white/[0.06]' : 'bg-white border-slate-200/80 shadow-sm'}`}>
                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/50 dark:border-white/[0.05]">
                            <h3 className={`font-extrabold text-[9px] uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Upcoming Bookings</h3>
                            <span className="text-[7.5px] font-bold text-blue-600 hover:underline cursor-pointer">View All</span>
                          </div>
                          <div className="space-y-2 flex-1 flex flex-col justify-center">
                            {[
                              { title: 'Pool — Carter Family', sub: 'Jul 5, 2026 · 10:00 AM', badge: 'APPROVED', bc: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/30' },
                              { title: 'Gym — Kevin Andrews', sub: 'Jul 6, 2026 · 07:00 AM', badge: 'APPROVED', bc: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/30' },
                              { title: 'Clubhouse — Diana Moore', sub: 'Jul 8, 2026 · 06:00 PM', badge: 'PENDING', bc: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/30' },
                            ].map((evt, idx) => (
                              <div key={idx} className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50/70 border-slate-200/50'}`}>
                                <div className="min-w-0 flex-1 text-left">
                                  <h4 className={`text-[8px] font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{evt.title}</h4>
                                  <p className="text-[7px] text-slate-400 mt-0.5">{evt.sub}</p>
                                </div>
                                <span className={`text-[6px] font-extrabold px-1.5 py-0.5 rounded border shrink-0 ${evt.bc}`}>{evt.badge}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </div>
            {/* Bottom glow reflection */}
            <div className="h-12 bg-gradient-to-b from-slate-200/40 dark:from-[#0D1B2A]/80 to-transparent" />
          </div>

        </div>

        {/* Stats row — below mockup (Commented out for now)
        <div className="max-w-5xl mx-auto mt-16 pb-16 grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-10 border-t border-slate-100 dark:border-white/[0.06] pt-10">
          {[
            { label: 'Active Communities', end: 500, suffix: '+', icon: Globe, color: 'text-violet-500 bg-violet-500/10' },
            { label: 'Client Satisfaction', end: 98, suffix: '%', icon: Star, color: 'text-amber-500 bg-amber-500/10' },
            { label: 'Dues Collected', end: 15, suffix: 'M+', prefix: '$', icon: TrendingUp, color: 'text-emerald-500 bg-emerald-500/10' },
            { label: 'Avg Onboarding', end: 48, suffix: 'h', icon: Clock, color: 'text-blue-500 bg-blue-500/10' }
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  <StatCounter end={stat.end} suffix={stat.suffix} prefix={stat.prefix || ''} />
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
        */}

        {/* Image Slideshow Slider Section (Commented out for now)
        <div className="max-w-5xl mx-auto mt-8 pb-16 border-t border-slate-100 dark:border-white/[0.06] pt-12">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-semibold text-violet-600 dark:text-violet-400">
               Society Spaces
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              A Glimpse into Our Premium Communities
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              From lush parks to clubhouse amenities, NestBloq maintains facility bookings, visual excellence, and comfort across every square foot.
            </p>
          </div>
          <HeroImage isDark={isDark} />
        </div>
        */}

      </section>


      {/* ═══════════════════════════════════════════════════════
          SOLUTIONS SECTION (Interactive Use Cases & Simulators)
      ═══════════════════════════════════════════════════════ */}
      <section 
        id="solutions" 
        ref={solutionsSectionRef}
        className="relative py-16 px-5 sm:px-8 border-t border-slate-200/40 dark:border-white/[0.06] overflow-hidden bg-white dark:bg-[#090F16]"
      >
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-gradient-radial from-violet-500/[0.03] dark:from-violet-500/[0.06] to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-32 top-1/4 w-96 h-96 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.05] rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Solutions for Every Property Type
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
              Tailored Portals for <span className="gradient-text">Your Community Scale.</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
              NestBloq unifies administrative workflow and resident experiences across all community frameworks. Explore our specialized portals tailored to your specific community scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 pt-8">
            {[
              {
                title: 'Rental Property Management',
                tagline: 'Rent Roll & Vacancy Tracker',
                desc: 'Automating rent collection schedules, payment reminders, and tenant portals with zero friction.',
                icon: Wallet,
                colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20',
                cardBg: 'hover:border-emerald-500/40 dark:hover:border-emerald-500/35 hover:shadow-emerald-500/5',
                textColor: 'text-emerald-600 dark:text-emerald-400'
              },
              {
                title: 'Condo Association Management',
                tagline: 'Shared Amenity Scheduler',
                desc: 'Enable seamless slot reservations for shared facilities like swimming pools, clubhouses, and gyms.',
                icon: CalendarRange,
                colorClass: 'text-violet-600 dark:text-violet-400 bg-violet-500/10 dark:bg-violet-500/20 border-violet-500/20',
                cardBg: 'hover:border-violet-500/40 dark:hover:border-violet-500/35 hover:shadow-violet-500/5',
                textColor: 'text-violet-650 dark:text-violet-400'
              },
              {
                title: 'Apartment Complex Portal',
                tagline: 'Work Order & Dispatch Desk',
                desc: 'Collaborative work ticket dispatches, maintenance logs, and visitor directories for unified operations.',
                icon: Wrench,
                colorClass: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20',
                cardBg: 'hover:border-blue-500/40 dark:hover:border-blue-500/35 hover:shadow-blue-500/5',
                textColor: 'text-blue-600 dark:text-blue-400'
              },
              {
                title: 'Homeowner Association (HOA)',
                tagline: 'Assemblies & e-Voting',
                desc: 'E-voting on society resolutions, bylaws audits, and quarterly security audits with absolute transparency.',
                icon: Users,
                colorClass: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-500/20',
                cardBg: 'hover:border-indigo-500/40 dark:hover:border-indigo-500/35 hover:shadow-indigo-500/5',
                textColor: 'text-indigo-600 dark:text-indigo-400'
              }
            ].map((solution, i) => {
              const IconComponent = solution.icon;
              return (
                <div
                  key={i}
                  className={`group relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-white/[0.07] bg-white/60 dark:bg-white/[0.01] p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm flex flex-col justify-between text-left ${solution.cardBg}`}
                >
                  <div className="space-y-5">
                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${solution.colorClass}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">{solution.tagline}</span>
                      </div>
                      <h3 className="font-display font-black text-lg text-slate-900 dark:text-white leading-snug group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors">
                        {solution.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1.5 font-normal">
                        {solution.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-white/5 mt-6 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold transition-all uppercase tracking-wider ${solution.textColor}`}>
                      Explore Portal
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SCROLLING MARQUEE (Commented out for now)
          ═══════════════════════════════════════════════════════
      <div className="relative py-7 border-y border-slate-200/40 dark:border-white/[0.06] bg-slate-50/40 dark:bg-[#0B1420]/60 backdrop-blur-sm overflow-hidden before:absolute before:left-0 before:top-0 before:h-full before:w-32 before:bg-gradient-to-r before:from-white dark:before:from-[#090F16] before:to-transparent before:z-10 after:absolute after:right-0 after:top-0 after:h-full after:w-32 after:bg-gradient-to-l after:from-white dark:after:from-[#090F16] after:to-transparent after:z-10">
        <div className="flex gap-8 animate-marquee whitespace-nowrap">
          {['Sunrise Heights', 'Green Park Society', 'Maple Heights Enclave', 'Prestige Lakeside', 'Royal Palms HOA', 'Emerald Springs Apts', 'Blue Ridge Condos', 'Silver Oak Society', 'Sunrise Heights', 'Green Park Society', 'Maple Heights Enclave', 'Prestige Lakeside', 'Royal Palms HOA', 'Emerald Springs Apts', 'Blue Ridge Condos', 'Silver Oak Society'].map((name, i) => (
            <span key={i} className="inline-flex items-center gap-2.5 px-4.5 py-2.5 rounded-xl bg-white dark:bg-[#0D1B2A] border border-slate-200/60 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 text-xs font-semibold shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.015)]">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 shrink-0" />
              {name}
            </span>
          ))}
        </div>
      </div>
      */}

      {/* ═══════════════════════════════════════════════════════
          FEATURES (Interactive Tabs)
      ═══════════════════════════════════════════════════════ */}
      <section id="features" className="relative py-16 px-5 sm:px-8 overflow-hidden transition-colors duration-300">
        
        {/* Background ambient light blobs */}
        <div className="absolute top-1/4 left-10 w-[500px] h-[400px] bg-gradient-radial from-violet-500/[0.02] dark:from-violet-500/[0.05] to-transparent rounded-full blur-3xl pointer-events-none z-0" />
        <div className="absolute bottom-1/4 right-10 w-[500px] h-[400px] bg-gradient-radial from-blue-500/[0.02] dark:from-blue-500/[0.05] to-transparent rounded-full blur-3xl pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-500 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Platform Features
            </div>
            <h2 className="font-display text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Everything your community needs,<br />
              <span className="gradient-text">beautifully unified</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Replace scattered WhatsApp groups, Excel sheets, and email chains with a single AI-powered platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {features.map((feature, i) => (
              <div
                key={i}
                className="relative overflow-hidden group rounded-3xl border border-slate-200/80 dark:border-white/[0.07] bg-white/60 dark:bg-white/[0.01] hover:border-violet-500/40 dark:hover:border-violet-500/40 p-8 shadow-sm hover:shadow-xl transition-all duration-305 hover:-translate-y-1 backdrop-blur-sm"
              >
                {/* Ambient hover glow */}
                <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-br ${
                  feature.color === 'violet' ? 'from-violet-500/10 to-indigo-500/5' :
                  feature.color === 'blue' ? 'from-blue-500/10 to-blue-500/5' :
                  feature.color === 'indigo' ? 'from-indigo-500/10 to-blue-500/5' :
                  'from-rose-500/10 to-pink-500/5'
                } rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-305`} />

                <div className="flex justify-between items-start gap-4 mb-6">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                    feature.color === 'violet' ? 'bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500/20' :
                    feature.color === 'blue' ? 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/20' :
                    feature.color === 'indigo' ? 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' :
                    'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/20'
                  } group-hover:scale-110`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  {/* Stats Badge */}
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                    feature.color === 'violet' ? 'text-violet-600 dark:text-violet-400 bg-violet-500/10' :
                    feature.color === 'blue' ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10' :
                    feature.color === 'indigo' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10' :
                    'text-rose-600 dark:text-rose-400 bg-rose-500/10'
                  }`}>
                    {feature.stats}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-display font-extrabold text-lg text-slate-800 dark:text-white group-hover:text-violet-500 transition-colors duration-200">
                    {feature.title}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-display">
                    {feature.tagline}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed pt-2">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CORE CAPABILITIES (3D Tilt & Flip Showcase)
      ═══════════════════════════════════════════════════════ */}
      <section id="features-grid" className="py-16 px-5 sm:px-8 bg-slate-50/60 dark:bg-[#0B1420]/70 border-y border-slate-100 dark:border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              Advanced Capabilities
            </div>
            <h2 className="font-display text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Powerful modules for<br />
              <span className="gradient-text">complete HOA control</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Hover to tilt cards in 3D and click to reveal detailed modules, rules, and configurations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featureList.map((feature, i) => (
              <InteractiveFeatureCard key={i} feature={feature} />
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          AI COPILOT
      ═══════════════════════════════════════════════════════ */}
      <section id="ai" className="relative py-16 px-5 sm:px-8 overflow-hidden bg-white dark:bg-[#090F16] border-y border-slate-100 dark:border-white/[0.06]">
        {/* Soft glow orbs — light & subtle */}
        <div className="absolute -top-20 left-1/3 w-80 h-80 bg-violet-400/[0.06] dark:bg-violet-500/[0.08] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-indigo-400/[0.05] dark:bg-indigo-500/[0.07] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Slide selector tab pills — full width above two-column grid */}
          <div className="flex flex-wrap gap-2.5 pb-6">
            {automationSlides.map((slide, idx) => {
              const isActive = activeSlide === idx;
              let activeColors = "";
              if (idx === 0) activeColors = "bg-emerald-500/10 border-emerald-500/40 text-emerald-750 dark:text-emerald-300";
              if (idx === 1) activeColors = "bg-blue-500/10 border-blue-500/40 text-blue-700 dark:text-blue-300";
              if (idx === 2) activeColors = "bg-violet-500/10 border-violet-500/40 text-violet-750 dark:text-violet-300";
              if (idx === 3) activeColors = "bg-teal-500/10 border-teal-500/40 text-teal-650 dark:text-teal-450";
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

            {/* Left: Text content */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <div className="space-y-6 transition-all duration-500">
                <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${automationSlides[activeSlide].badgeColor}`}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  {automationSlides[activeSlide].badge}
                </div>
                <h2 className="font-display text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.08] min-h-[110px]">
                  {automationSlides[activeSlide].title}
                  <span className="block bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">{automationSlides[activeSlide].subtitle}</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm min-h-[84px]">
                  {automationSlides[activeSlide].desc}
                </p>
                <div className="space-y-3 pt-2">
                  {automationSlides[activeSlide].points.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-sm shrink-0">{item.icon}</div>
                      <span className="text-sm text-slate-600 dark:text-slate-300">{item.text}</span>
                    </div>
                  ))}
                </div>
                <Link to={automationSlides[activeSlide].linkTo} className={`inline-flex items-center gap-2 px-6 py-3 text-white font-bold text-sm rounded-xl shadow-lg transition-all hover:-translate-y-0.5 group ${automationSlides[activeSlide].btnColor}`}>
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
                  className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white flex items-center justify-center pointer-events-auto border border-white/10 shadow-lg transition"
                >
                  <svg className="w-5 h-5 -translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
                  className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white flex items-center justify-center pointer-events-auto border border-white/10 shadow-lg transition"
                >
                  <svg className="w-5 h-5 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Bottom Dot Indicators Centered below the card */}
              <div className="flex justify-center gap-2 mt-4 pointer-events-none">
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
          TESTIMONIALS (Apple-Style Staggered Grid Layout)
      ═══════════════════════════════════════════════════════ */}
      <section id="testimonials" className="py-16 pb-24 px-5 sm:px-8 bg-slate-50/60 dark:bg-[#0B1420]/70 border-y border-slate-100 dark:border-white/[0.06]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold">
              <Star className="w-3.5 h-3.5 fill-current" />
              Client Testimonials
            </div>
            <h2 className="font-display text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              What community leaders say
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
              Discover how board members, property managers, and community secretaries are streamlining their daily operations with NestBloq.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-6 lg:gap-8 items-start pt-6">
            {testimonials.map((testimonial, i) => {
              const staggerClass = i === 1 ? 'md:translate-y-8' : 'md:translate-y-0';
              return (
                <div key={i} className={`${staggerClass} w-full h-full`}>
                  <TestimonialCard testimonial={testimonial} />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FAQ
      ═══════════════════════════════════════════════════════ */}
      <section id="faq" className="py-16 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 text-xs font-semibold">
              <MessageSquare className="w-3.5 h-3.5" />
              FAQs
            </div>
            <h2 className="font-display text-4xl font-black text-slate-900 dark:text-white tracking-tight">Everything you need to know</h2>
            <p className="text-slate-500 dark:text-slate-400">Can't find an answer? <Link to="/contact" className="text-violet-500 hover:text-violet-600 font-medium">Contact our team →</Link></p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className={`rounded-2xl border overflow-hidden transition-all duration-200 ${openFaq === i ? 'border-violet-500/30 bg-violet-500/[0.03] dark:bg-[#0D1B2A]' : 'border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0D1B2A] hover:border-violet-200 dark:hover:border-violet-500/30'}`}>
                <button onClick={() => toggleFaq(i)} className="w-full flex items-center justify-between px-6 py-5 text-left gap-4">
                  <span className={`font-semibold text-sm ${openFaq === i ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{faq.q}</span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${openFaq === i ? 'bg-violet-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                    {openFaq === i ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-sm text-slate-500 dark:text-slate-400 leading-relaxed animate-float-up border-t border-violet-500/10 pt-4">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CTA BANNER
      ═══════════════════════════════════════════════════════ */}
      <section className="py-12 px-5 sm:px-8 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl p-12 md:p-16 text-center" style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 25%, #4338ca 60%, #3730a3 100%)' }}>
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            {/* Orbs */}
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-violet-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-56 h-56 bg-indigo-400/20 rounded-full blur-3xl" />
            <div className="absolute top-1/2 -translate-y-1/2 right-8 w-32 h-32 bg-purple-400/15 rounded-full blur-2xl" />

            <div className="relative space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/25 text-white text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                No credit card required · Free 30-day trial
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-black text-white leading-tight">
                Ready to transform your<br />community?
              </h2>
              <p className="text-white/75 text-base max-w-xl mx-auto leading-relaxed">
                Join 500+ communities on NestBloq. Get your community live in under 48 hours with full setup support.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                <Link to="/register" className="px-8 py-4 bg-white text-violet-700 font-black text-sm rounded-2xl hover:bg-white/95 shadow-2xl shadow-black/30 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 group">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link to="/contact" className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold text-sm rounded-2xl transition-all flex items-center justify-center gap-2">
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
