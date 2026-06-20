import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Play, CheckCircle, Zap,
  ChevronDown, ChevronUp, Star, UserPlus, Mail,
  Wallet, Wrench, MessageSquare, Send,
  Shield, Activity, Sparkles, TrendingUp, Globe, Clock,
  Phone, Map, Building, FileText, UserCheck,
  ClipboardSignature, Scale, CalendarRange, Users, ShieldCheck,
  CreditCard, Megaphone, History, Sliders, RotateCcw
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
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

/* ─── Hero Image Slideshow Slides ────────────────────── */
const slides = [
  {
    title: "Central Community Park",
    desc: "Vibrant green lawns, paved walking trails & serene seating corners.",
    tag: "🌳 Society Park",
    light: heroParkLight,
    dark: heroParkDark,
    accent: "border-emerald-500/30 text-emerald-500 dark:text-emerald-400 bg-emerald-500/10"
  },
  {
    title: "Botanical & Terrace Gardens",
    desc: "Exquisite seasonal flowers, curated shrubberies & peaceful walks.",
    tag: "🌸 Botanical Gardens",
    light: heroGardenLight,
    dark: heroGardenDark,
    accent: "border-pink-500/30 text-pink-500 dark:text-pink-400 bg-pink-500/10"
  },
  {
    title: "Premium Clubhouse & Pool",
    desc: "Luxury lounge spaces, glass architecture & a refreshing pool deck.",
    tag: "🏊 Luxury Clubhouse",
    light: heroClubLight,
    dark: heroClubDark,
    accent: "border-sky-500/30 text-sky-500 dark:text-sky-400 bg-sky-500/10"
  },
  {
    title: "Modern Facade & Towers",
    desc: "High-end contemporary architecture with lush balcony integrations.",
    tag: "🏢 Modern Condominiums",
    light: heroCondoLight,
    dark: heroCondoDark,
    accent: "border-violet-500/30 text-violet-500 dark:text-violet-400 bg-violet-500/10"
  }
];

/* ─── Hero Image (Dynamic 3D Stacked Slideshow) ───────── */
const HeroImage = ({ isDark }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef(null);

  // Auto-play cycling effect
  useEffect(() => {
    if (!isHovered) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      }, 4500);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHovered]);

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
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-400 to-indigo-500 animate-[progress_4.5s_linear_infinite]"
                                style={{
                                  animationPlayState: isHovered ? 'paused' : 'running'
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
    gradient: 'from-emerald-500 to-teal-600',
    textColor: 'text-emerald-500',
    glowRgb: 'rgba(16, 185, 129, 0.2)',
    borderClass: 'border-emerald-500/20 dark:border-emerald-500/10 hover:border-emerald-500/50',
    shadowColor: 'hover:shadow-emerald-500/10',
    cardBg: 'bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-teal-950/[0.04] dark:from-emerald-950/20 dark:via-transparent dark:to-teal-950/15',
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
    gradient: 'from-teal-500 to-emerald-600',
    textColor: 'text-teal-500',
    glowRgb: 'rgba(20, 184, 166, 0.2)',
    borderClass: 'border-teal-500/20 dark:border-teal-500/10 hover:border-teal-500/50',
    shadowColor: 'hover:shadow-teal-500/10',
    cardBg: 'bg-gradient-to-br from-teal-500/[0.04] via-transparent to-emerald-950/[0.04] dark:from-teal-950/20 dark:via-transparent dark:to-emerald-950/15',
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
        } bg-white dark:bg-[#0c0b16]`}
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
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-black text-base shadow-lg border-4 border-slate-50 dark:border-[#07060f] transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3`}>
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

/* ─── AI Operations Console (Dashboard Visual for Landing Page) ─── */
function AiOperationsConsole() {
  return (
    <div className="w-full bg-[#0c0b16] rounded-3xl border border-violet-500/10 dark:border-white/[0.08] shadow-2xl overflow-hidden flex flex-col h-[520px] relative">
      
      {/* Header */}
      <div className="bg-[#11101f] p-5 border-b border-white/[0.04] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h3 className="font-bold text-white text-sm">NestBloq AI Operations Console</h3>
            <p className="text-[10px] text-slate-400">Live community resolution activity</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">Active Node</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 border-b border-white/[0.04] bg-[#0e0d1a]">
        {[
          { label: 'Auto-Resolved', val: '85.4%', desc: 'No admin intervention', color: 'text-violet-400' },
          { label: 'Avg Latency', val: '0.85s', desc: 'Real-time pipeline', color: 'text-emerald-400' },
          { label: 'Saved Hours', val: '42h/mo', desc: 'Per community board', color: 'text-amber-400' }
        ].map((metric, i) => (
          <div key={i} className="p-4 border-r border-white/[0.04] last:border-0 text-center">
            <div className={`text-lg font-black ${metric.color}`}>{metric.val}</div>
            <div className="text-[10px] text-white/90 font-bold mt-0.5">{metric.label}</div>
            <div className="text-[9px] text-slate-500 mt-0.5">{metric.desc}</div>
          </div>
        ))}
      </div>

      {/* Live Activity Feed Log */}
      <div className="flex-1 p-5 space-y-4 overflow-y-auto custom-scrollbar bg-[#090812]">
        
        {/* Item 1 */}
        <div className="bg-[#11101f] border border-white/[0.04] rounded-2xl p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inquiry #2409</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              <span className="text-[10px] text-slate-500 font-medium">Unit 304</span>
            </div>
            <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">Auto-Resolved</span>
          </div>
          <div className="space-y-1.5 text-left">
            <p className="text-xs text-slate-300"><span className="font-bold text-violet-400">Resident:</span> "Are pets allowed in the clubhouse?"</p>
            <p className="text-xs text-slate-400 pl-4 border-l border-violet-500/30 leading-relaxed"><span className="font-bold text-slate-300">AI:</span> "According to Article 4, Section B: Registered service dogs are allowed. Other pets must be kept on a leash in courtyard areas."</p>
          </div>
        </div>

        {/* Item 2 */}
        <div className="bg-[#11101f] border border-white/[0.04] rounded-2xl p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Facility Reservation</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              <span className="text-[10px] text-slate-500 font-medium">Unit 102</span>
            </div>
            <span className="text-[9px] font-extrabold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">Booked & Confirmed</span>
          </div>
          <div className="space-y-1.5 text-left">
            <p className="text-xs text-slate-300"><span className="font-bold text-violet-400">Resident:</span> "Can I book the tennis court for 4pm today?"</p>
            <p className="text-xs text-slate-400 pl-4 border-l border-violet-500/30 leading-relaxed"><span className="font-bold text-slate-300">AI:</span> "Tennis Court 2 is available from 4:00 PM to 6:00 PM. I've booked this slot under Unit 102. Have a great game!"</p>
          </div>
        </div>

        {/* Item 3 */}
        <div className="bg-[#11101f] border border-white/[0.04] rounded-2xl p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Maintenance Desk</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              <span className="text-[10px] text-slate-500 font-medium">Unit 508</span>
            </div>
            <span className="text-[9px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">Work Order Dispatched</span>
          </div>
          <div className="space-y-1.5 text-left">
            <p className="text-xs text-slate-300"><span className="font-bold text-violet-400">Resident:</span> "Elevator B is making squeaking sounds."</p>
            <p className="text-xs text-slate-400 pl-4 border-l border-violet-500/30 leading-relaxed"><span className="font-bold text-slate-300">AI:</span> "Request logged. Dispatched Work Order #ME-402 to Schindler Elevator Group. You can track progress under your dashboard."</p>
          </div>
        </div>

      </div>

    </div>
  );
}

export default function LandingPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [openFaq, setOpenFaq] = useState(null);
  const [activeFeature, setActiveFeature] = useState(0);

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
      cardBg: 'bg-gradient-to-br from-violet-500/[0.07] via-white to-indigo-500/[0.03] dark:from-violet-950/20 dark:via-[#11101d] dark:to-indigo-950/10',
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
      gradient: 'from-emerald-500 to-teal-600',
      glowColor: 'group-hover:shadow-[0_20px_40px_rgba(16,185,129,0.15)]',
      glowRgb: 'rgba(16,185,129,0.15)',
      textColor: 'text-emerald-500',
      cardBg: 'bg-gradient-to-br from-emerald-500/[0.07] via-white to-teal-500/[0.03] dark:from-emerald-950/20 dark:via-[#11101d] dark:to-teal-950/10',
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
      cardBg: 'bg-gradient-to-br from-amber-500/[0.07] via-white to-orange-500/[0.03] dark:from-amber-950/20 dark:via-[#11101d] dark:to-orange-950/10',
      borderColor: 'border-amber-500/20 dark:border-amber-500/10 hover:border-amber-500/40 dark:hover:border-amber-500/30'
    }
  ];

  // Always start at top on mount/refresh
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const features = [
    {
      icon: Wallet, title: 'Finances & Dues', tagline: 'Automated billing engine', color: 'violet',
      desc: 'Send invoices, track collections, manage payment ledgers, and auto-reconcile with PCI-DSS compliant gateways.',
      stats: '45% faster collection',
      preview: (
        <div className="relative w-full aspect-[4/3] flex items-center justify-center p-8 sm:p-12 bg-gradient-to-br from-[#0c1630] via-[#091022] to-[#040814]">
          <img
            src={featureFinance}
            alt="Finances & Dues Illustration"
            className="w-full h-auto rounded-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] transform hover:scale-[1.03] transition-transform duration-500"
          />
        </div>
      )
    },
    {
      icon: Wrench, title: 'Maintenance Desk', tagline: 'Smart ticket management', color: 'blue',
      desc: 'Log service requests, dispatch vendors, track statuses end-to-end, and notify residents in real-time.',
      stats: '3× faster resolution',
      preview: (
        <div className="relative w-full aspect-[4/3] flex items-center justify-center p-8 sm:p-12 bg-gradient-to-br from-[#051128] via-[#081634] to-[#0a234f]">
          <img
            src={featureMaintenance}
            alt="Maintenance Desk Illustration"
            className="w-full h-auto rounded-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] transform hover:scale-[1.03] transition-transform duration-500"
          />
        </div>
      )
    },
    {
      icon: Shield, title: 'RBAC Security', tagline: 'Role-based workspaces', color: 'indigo',
      desc: 'Granular permissions for Board Presidents, Property Managers, Auditors, and Homeowners with fully isolated data.',
      stats: '100% data isolation',
      preview: (
        <div className="relative w-full aspect-[4/3] flex items-center justify-center p-8 sm:p-12 bg-gradient-to-br from-[#080c20] via-[#0c122e] to-[#151c4a]">
          <img
            src={featureSecurity}
            alt="RBAC Security Illustration"
            className="w-full h-auto rounded-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] transform hover:scale-[1.03] transition-transform duration-500"
          />
        </div>
      )
    },
    {
      icon: Activity, title: 'NestBloq Assistant', tagline: '24/7 intelligent assistant', color: 'rose',
      desc: 'Conversational AI that answers bylaws queries, books amenities, and logs maintenance requests automatically.',
      stats: '85% query automation',
      preview: (
        <div className="relative w-full aspect-[4/3] flex items-center justify-center p-8 sm:p-12 bg-gradient-to-br from-[#120610] via-[#1f0a18] to-[#360e24]">
          <img
            src={featureCopilot}
            alt="NestBloq Assistant Illustration"
            className="w-full h-auto rounded-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] transform hover:scale-[1.03] transition-transform duration-500"
          />
        </div>
      )
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
      activeBg: 'bg-gradient-to-br from-violet-500/[0.06] via-white to-violet-500/[0.01] dark:from-violet-950/20 dark:via-white/[0.01] dark:to-transparent border-violet-500/20 dark:border-violet-500/10 shadow-sm shadow-violet-500/5',
      icon: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
      badge: 'text-violet-600 dark:text-violet-400 bg-violet-500/10 border border-violet-500/20 dark:border-violet-500/10'
    },
    blue: { 
      activeBg: 'bg-gradient-to-br from-blue-500/[0.06] via-white to-blue-500/[0.01] dark:from-blue-950/20 dark:via-white/[0.01] dark:to-transparent border-blue-500/20 dark:border-blue-500/10 shadow-sm shadow-blue-500/5',
      icon: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      badge: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/10'
    },
    indigo: { 
      activeBg: 'bg-gradient-to-br from-indigo-500/[0.06] via-white to-indigo-500/[0.01] dark:from-indigo-950/20 dark:via-white/[0.01] dark:to-transparent border-indigo-500/20 dark:border-indigo-500/10 shadow-sm shadow-indigo-500/5',
      icon: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      badge: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 dark:border-indigo-500/10'
    },
    rose: { 
      activeBg: 'bg-gradient-to-br from-rose-500/[0.06] via-white to-rose-500/[0.01] dark:from-rose-950/20 dark:via-white/[0.01] dark:to-transparent border-rose-500/20 dark:border-rose-500/10 shadow-sm shadow-rose-500/5',
      icon: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
      badge: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 dark:border-rose-500/10'
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#07060f] overflow-x-hidden font-sans transition-colors duration-300">
      <Navbar />

      {/* ═══════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center pt-8 pb-16 px-5 sm:px-8">
        {/* Background grid */}
        <div className="absolute inset-0 grid-bg opacity-100 pointer-events-none" />
        {/* Radial spotlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-radial from-violet-500/15 via-indigo-500/8 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-violet-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-center">

            {/* Left: Copy */}
            <div className="space-y-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
                </span>
                <span className="text-xs font-semibold tracking-wide">All-in-One Community Platform</span>
              </div>

              <div className="space-y-4">
                <h1 className="font-display text-5xl sm:text-6xl lg:text-[60px] font-black text-slate-900 dark:text-white leading-[1.06] tracking-tight">
                  Smarter Living.<br />
                  <span className="gradient-text">Better Communities.</span>
                </h1>
                <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl font-normal">
                  NestBloq unifies dues collection, maintenance, governance, and AI-powered resident support into one beautiful, secure platform.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="btn-glow px-8 py-3.5 text-sm font-semibold text-white rounded-xl flex items-center gap-2 group">
                  Start for Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link to="/how-it-works" className="px-7 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 hover:border-violet-300 dark:hover:border-violet-500/30 transition-all duration-200 flex items-center gap-2 group">
                  <span className="w-6 h-6 rounded-full bg-violet-500/10 flex items-center justify-center">
                    <Play className="w-3 h-3 fill-violet-500 text-violet-500 ml-0.5" />
                  </span>
                  Watch Demo
                </Link>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-5 pt-1">
                <div className="flex -space-x-2.5">
                  {['SL', 'RK', 'PP', 'AM', 'TG'].map((initials, i) => (
                    <div key={i} className="w-9 h-9 rounded-full border-2 border-white dark:border-[#07060f] bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[9px] font-black shadow-md" style={{ zIndex: 5 - i }}>
                      {initials}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Loved by <span className="font-bold text-slate-800 dark:text-white">500+</span> communities
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Hero Illustration */}
            <div className="animate-fade-in-up-delay-2">
              <HeroImage isDark={isDark} />
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-20 pt-10 border-t border-slate-100 dark:border-white/[0.06] grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-10">
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
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SCROLLING MARQUEE
      ═══════════════════════════════════════════════════════ */}
      <div className="relative py-7 border-y border-slate-200/40 dark:border-white/[0.04] bg-slate-50/40 dark:bg-white/[0.01] backdrop-blur-sm overflow-hidden before:absolute before:left-0 before:top-0 before:h-full before:w-32 before:bg-gradient-to-r before:from-white dark:before:from-[#07060f] before:to-transparent before:z-10 after:absolute after:right-0 after:top-0 after:h-full after:w-32 after:bg-gradient-to-l after:from-white dark:after:from-[#07060f] after:to-transparent after:z-10">
        <div className="flex gap-8 animate-marquee whitespace-nowrap">
          {['Sunrise Heights', 'Green Park Society', 'Maple Heights Enclave', 'Prestige Lakeside', 'Royal Palms HOA', 'Emerald Springs Apts', 'Blue Ridge Condos', 'Silver Oak Society', 'Sunrise Heights', 'Green Park Society', 'Maple Heights Enclave', 'Prestige Lakeside', 'Royal Palms HOA', 'Emerald Springs Apts', 'Blue Ridge Condos', 'Silver Oak Society'].map((name, i) => (
            <span key={i} className="inline-flex items-center gap-2.5 px-4.5 py-2.5 rounded-xl bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] text-slate-600 dark:text-slate-400 text-xs font-semibold shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.015)]">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 shrink-0" />
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          FEATURES (Interactive Tabs)
      ═══════════════════════════════════════════════════════ */}
      <section id="features" className="relative py-28 px-5 sm:px-8 overflow-hidden transition-colors duration-300">
        
        {/* Background ambient light blobs */}
        <div className="absolute top-1/4 left-10 w-[500px] h-[400px] bg-gradient-radial from-violet-500/[0.02] dark:from-violet-500/[0.05] to-transparent rounded-full blur-3xl pointer-events-none z-0" />
        <div className="absolute bottom-1/4 right-10 w-[500px] h-[400px] bg-gradient-radial from-blue-500/[0.02] dark:from-blue-500/[0.05] to-transparent rounded-full blur-3xl pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Tab list */}
            <div className="lg:col-span-5 space-y-3.5">
              {features.map((feature, i) => (
                <button
                  key={i}
                  onClick={() => setActiveFeature(i)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 ${
                    activeFeature === i
                      ? `${colorMap[feature.color]?.activeBg || colorMap.violet.activeBg}`
                      : 'border-slate-200/80 dark:border-white/[0.07] bg-white/60 dark:bg-white/[0.01] hover:border-slate-300 dark:hover:border-white/15 hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-all ${
                      activeFeature === i ? colorMap[feature.color]?.icon || colorMap.violet.icon : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/10'
                    }`}>
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className={`font-bold text-sm ${activeFeature === i ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{feature.title}</h3>
                        {activeFeature === i && (
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${colorMap[feature.color]?.badge || colorMap.violet.badge}`}>{feature.stats}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Preview panel with Glowing gradient frame */}
            <div className="lg:col-span-7 sticky top-24">
              <div 
                key={activeFeature} 
                className={`animate-fade-in-scale shadow-2xl transition-all duration-500 rounded-3xl p-2 bg-gradient-to-br ${
                  activeFeature === 0 ? 'from-violet-500/10 to-indigo-500/10 shadow-violet-500/5 dark:shadow-violet-500/10 border border-violet-500/10' :
                  activeFeature === 1 ? 'from-blue-500/10 to-teal-500/10 shadow-blue-500/5 dark:shadow-blue-500/10 border border-blue-500/10' :
                  activeFeature === 2 ? 'from-indigo-500/10 to-blue-500/10 shadow-indigo-500/5 dark:shadow-indigo-500/10 border border-indigo-500/10' :
                  'from-rose-500/10 to-pink-500/10 shadow-rose-500/5 dark:shadow-rose-500/10 border border-rose-500/10'
                }`}
              >
                <div className="rounded-2xl overflow-hidden bg-white dark:bg-[#0c0b16]">
                  {features[activeFeature].preview}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CORE CAPABILITIES (3D Tilt & Flip Showcase)
      ═══════════════════════════════════════════════════════ */}
      <section id="features-grid" className="py-28 px-5 sm:px-8 bg-slate-50/60 dark:bg-white/[0.012] border-y border-slate-100 dark:border-white/[0.05]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
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
          HOW IT WORKS (Premium Connection Timeline Pathway)
      ═══════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-28 px-5 sm:px-8 border-t border-slate-100 dark:border-white/[0.05]">
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-500 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" />
              Onboarding Process
            </div>
            <h2 className="font-display text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              From demo call to<br />
              <span className="gradient-text">fully operational</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400">Six simple, streamlined steps to deploy NestBloq in your residential society.</p>
          </div>

          <div className="relative space-y-12 md:space-y-16 pb-2">
            {/* Timeline Connector Line (Dual-layer for premium blurred neon glow effect, constrained from Step 1 header to Step 6 header) */}
            <div className="absolute left-4 md:left-1/2 top-[48px] md:top-[56px] bottom-[48px] md:bottom-[56px] w-[2px] bg-slate-200 dark:bg-white/10 md:-translate-x-1/2 pointer-events-none" />
            <div className="absolute left-4 md:left-1/2 top-[48px] md:top-[56px] bottom-[48px] md:bottom-[56px] w-[2px] bg-gradient-to-b from-violet-500 via-blue-500 via-teal-500 via-amber-500 via-pink-500 to-purple-600 md:-translate-x-1/2 pointer-events-none blur-[1px] opacity-70" />

            {[
              { 
                step: '01', 
                title: 'Sales Consultation & Demo', 
                desc: 'Connect with a NestBloq sales consultant to align on community requirements, customize pricing, and secure your setup.', 
                icon: MessageSquare, 
                color: 'from-violet-500 to-indigo-600',
                badge: 'Demo Call',
                pulseBg: 'bg-violet-500/20',
                glowColor: 'group-hover:shadow-[0_0_30px_rgba(124,58,237,0.2)]',
                ambientColor: 'from-violet-500/10 to-transparent'
              },
              { 
                step: '02', 
                title: 'Sign Contract Form', 
                desc: 'Finalize plans and securely sign the digital contract agreement form to initialize your dedicated workspace deployment.', 
                icon: FileText, 
                color: 'from-blue-500 to-indigo-600',
                badge: 'License Activation',
                pulseBg: 'bg-blue-500/20',
                glowColor: 'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]',
                ambientColor: 'from-blue-500/10 to-transparent'
              },
              { 
                step: '03', 
                title: 'BM & PM Initialization Options', 
                desc: 'Deploy your workspace. Choose your administration mode: set up as a Board Member (BM) or Property Manager (PM) to initialize the community.', 
                icon: UserCheck, 
                color: 'from-emerald-500 to-teal-600',
                badge: 'Admin Roles',
                pulseBg: 'bg-emerald-500/20',
                glowColor: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]',
                ambientColor: 'from-emerald-500/10 to-transparent'
              },
              { 
                step: '04', 
                title: 'Community Created', 
                desc: 'NestBloq deploys your dedicated secure isolated database instance. Your property configuration, units, and custom settings are live.', 
                icon: Building, 
                color: 'from-amber-500 to-orange-600',
                badge: 'Workspace Live',
                pulseBg: 'bg-amber-500/20',
                glowColor: 'group-hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]',
                ambientColor: 'from-amber-500/10 to-transparent'
              },
              { 
                step: '05', 
                title: 'Resident Invitation Links', 
                desc: 'Board members and managers invite residents easily by entering emails or sharing a secure joining invitation link.', 
                icon: Send, 
                color: 'from-pink-500 to-rose-600',
                badge: 'Invites Sent',
                pulseBg: 'bg-pink-500/20',
                glowColor: 'group-hover:shadow-[0_0_30px_rgba(236,72,153,0.2)]',
                ambientColor: 'from-pink-500/10 to-transparent'
              },
              { 
                step: '06', 
                title: 'Resident Joins NestBloq', 
                desc: 'Residents register, access their personalized workspaces, pay dues, book amenities, and start interacting with AI Copilot!', 
                icon: Sparkles, 
                color: 'from-violet-500 to-purple-600',
                badge: 'Onboarded',
                pulseBg: 'bg-purple-500/20',
                glowColor: 'group-hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]',
                ambientColor: 'from-purple-500/10 to-transparent'
              }
            ].map((item, i) => {
              const isEven = i % 2 === 0;
              return (
                <div key={i} className={`relative flex flex-col md:flex-row items-center justify-between ${isEven ? 'md:flex-row-reverse' : ''} group`}>
                  
                  {/* Connector Dot */}
                  <div className="absolute left-4 md:left-1/2 top-[48px] md:top-[56px] -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center">
                    <span className={`absolute inline-flex h-12 w-12 rounded-full ${item.pulseBg} animate-ping opacity-75 group-hover:scale-125 transition-all duration-300`} />
                    <div className={`relative w-10 h-10 rounded-full bg-gradient-to-br ${item.color} border-4 border-white dark:border-[#07060f] flex items-center justify-center text-[10px] font-black text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      {item.step}
                    </div>
                  </div>

                  {/* Empty placeholder space to align timeline card alternately on desktop */}
                  <div className="hidden md:block w-[45%]" />

                  {/* Onboarding Timeline Content Card */}
                  <div className="w-full md:w-[45%] pl-12 md:pl-0">
                    <div className={`premium-card rounded-2xl p-6 md:p-8 flex flex-col gap-4 relative overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 ${item.glowColor} border border-slate-200/50 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]`}>
                      
                      {/* Ambient background corner light overlay showing on hover */}
                      <div className={`absolute -right-16 -top-16 w-32 h-32 bg-gradient-to-br ${item.ambientColor} opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl pointer-events-none`} />
                      
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg shrink-0 group-hover:rotate-6 transition-transform duration-300`}>
                          <item.icon className="w-5.5 h-5.5 text-white" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Step {item.step}</span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/[0.06]">{item.badge}</span>
                          </div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg mt-1">{item.title}</h3>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          AI COPILOT
      ═══════════════════════════════════════════════════════ */}
      <section id="ai" className="py-28 px-5 sm:px-8 bg-slate-50/60 dark:bg-white/[0.012] border-y border-slate-100 dark:border-white/[0.05]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-5 space-y-7">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
                <Activity className="w-3.5 h-3.5" />
                Intelligent Automation
              </div>
              <h2 className="font-display text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Your NestBloq Assistant that<br />
                <span className="gradient-text">never sleeps</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Tired of answering the same bylaws queries at midnight? Our Assistant automatically handles queries, books amenities, and logs maintenance requests — freeing your team completely.
              </p>
              <div className="space-y-3">
                {['Reduces resident queries by up to 85%', 'Operates 24/7 in a friendly conversational tone', 'Auto-logs service requests to the manager desk', 'Trained on your specific community bylaws'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-3 h-3 text-violet-500" />
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{item}</span>
                  </div>
                ))}
              </div>
              <Link to="/features" className="inline-flex items-center gap-2 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors group">
                Explore AI features
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="lg:col-span-7">
              <AiOperationsConsole />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          TESTIMONIALS (Apple-Style Staggered Grid Layout)
      ═══════════════════════════════════════════════════════ */}
      <section id="testimonials" className="py-28 pb-36 px-5 sm:px-8 bg-slate-50/60 dark:bg-white/[0.012] border-y border-slate-100 dark:border-white/[0.05]">
        <div className="max-w-7xl mx-auto space-y-20">
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
      <section id="faq" className="py-28 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto space-y-12">
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
              <div key={i} className={`rounded-2xl border overflow-hidden transition-all duration-200 ${openFaq === i ? 'border-violet-500/30 bg-violet-500/[0.03]' : 'border-slate-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] hover:border-violet-200 dark:hover:border-white/15'}`}>
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
      <section className="py-20 px-5 sm:px-8 pb-28">
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
      <InteractiveAssistant />
    </div>
  );
}
