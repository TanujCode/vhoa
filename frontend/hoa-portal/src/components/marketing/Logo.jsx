import React from 'react';

/**
 * NestBloq Logo — SVG with textLength to guarantee consistent layout
 * across all platforms regardless of font loading state.
 *
 * variants: "currentColor" | "light" | "dark" | "auth" | "white"
 */
export default function Logo({ className = 'h-9', variant = 'currentColor', forceWhite = false }) {
  const v = forceWhite ? 'white' : variant;

  const textFill =
    v === 'white'               ? '#ffffff'
    : v === 'auth' || v === 'dark' ? '#ffffff'
    : v === 'light'             ? '#0f172a'
    : 'currentColor';

  const iconStroke = v === 'white' ? '#ffffff' : 'url(#nb_g)';
  const iconFill   = v === 'white' ? '#ffffff' : 'url(#nb_g)';

  const windowFill =
    v === 'white'  ? '#10b981'
    : v === 'auth' ? '#0A2240'
    : v === 'dark' ? '#162535'
    : v === 'light'? '#dbeafe'
    : '#ffffff';

  /*
   * Layout — viewBox "0 0 228 56"
   * N      : x=3,  forced width=26px  → ends x=29
   * [E]    : x=33, width=28px         → ends x=61  (4px gap after N)
   * STBL   : x=65, forced width=90px  → ends x=155 (4px gap after E)
   * O circ : cx=169, r=13             → left=156   (1px gap after STBL)
   * Q circ : cx=186, r=13             → overlaps O by 9px
   * Q tail : (193,43)→(207,54)
   */

  return (
    <svg
      className={className}
      viewBox="0 0 228 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="NestBloq"
    >
      <defs>
        <linearGradient id="nb_g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#74B9FF" />
          <stop offset="100%" stopColor="#4A90D9" />
        </linearGradient>
      </defs>

      {/* ── N ─────────────────────────────────── */}
      <text
        x="3"
        y="46"
        fontFamily="'Plus Jakarta Sans', 'Inter', sans-serif"
        fontWeight="800"
        fontSize="36"
        textLength="26"
        lengthAdjust="spacingAndGlyphs"
        fill={textFill}
      >N</text>

      {/* ── E  (house icon) ───────────────────── */}
      {/* Roof triangle */}
      <path d="M33 21 L47 4 L61 21 Z" fill={iconFill} />
      {/* Window panes */}
      <rect x="44"   y="10"   width="3" height="3" rx="0.5" fill={windowFill} />
      <rect x="48.5" y="10"   width="3" height="3" rx="0.5" fill={windowFill} />
      <rect x="44"   y="14.5" width="3" height="3" rx="0.5" fill={windowFill} />
      <rect x="48.5" y="14.5" width="3" height="3" rx="0.5" fill={windowFill} />
      {/* 3 bars (E body) */}
      <rect x="33" y="24" width="28" height="5" rx="2.5" fill={iconFill} />
      <rect x="33" y="32" width="28" height="5" rx="2.5" fill={iconFill} />
      <rect x="33" y="40" width="28" height="5" rx="2.5" fill={iconFill} />

      {/* ── STBL ──────────────────────────────── */}
      <text
        x="65"
        y="46"
        fontFamily="'Plus Jakarta Sans', 'Inter', sans-serif"
        fontWeight="800"
        fontSize="36"
        textLength="90"
        lengthAdjust="spacingAndGlyphs"
        fill={textFill}
      >STBL</text>

      {/* ── OQ ────────────────────────────────── */}
      {/* O circle — vertically centered at cy=33 (mid of cap height) */}
      <circle cx="169" cy="33" r="13" stroke={iconStroke} strokeWidth="4.5" fill="none" />
      {/* Q circle — overlaps O */}
      <circle cx="186" cy="33" r="13" stroke={iconStroke} strokeWidth="4.5" fill="none" />
      {/* Q tail — diagonal down-right */}
      <line
        x1="193" y1="42"
        x2="207" y2="54"
        stroke={iconStroke}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
