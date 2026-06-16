import React from 'react';

/**
 * NestBloq Logo — vector SVG, pixel-perfect match to original brand logo.
 * 
 * Variants:
 *   "currentColor" — N/STBL follow CSS currentColor (works with dark: classes)
 *   "light"        — dark text, blue gradient icon (light sidebar bg)
 *   "dark"         — white text, blue gradient icon (dark sidebar bg)
 *   "auth"         — white text, blue gradient icon (dark-navy auth panel)
 *   "white"        — all white (coloured navbar bg)
 */
export default function Logo({ className = 'h-9', variant = 'currentColor', forceWhite = false }) {
  const v = forceWhite ? 'white' : variant;

  // Text fill for N and STBL
  const textFill =
    v === 'white' ? '#ffffff'
    : v === 'auth' || v === 'dark' ? '#ffffff'
    : v === 'light' ? '#0f172a'
    : 'currentColor';          // 'currentColor' — inherits from CSS

  // Icon shapes (house + OQ)
  const iconColor =
    v === 'white' ? '#ffffff'
    : 'url(#nb_grad)';

  // Window panes inside roof — should contrast with house fill
  const windowFill =
    v === 'white'  ? '#00A878'
    : v === 'auth' ? '#0A2240'
    : v === 'dark' ? '#162535'
    : v === 'light'? '#E3F2FD'
    : 'white';

  /*
   * Layout (viewBox 0 0 264 56):
   *   N     : x=4,  width≈27 → ends ≈31
   *   [E]   : x=35, width=28 → ends ≈63  (4px gap after N)
   *   STBL  : x=66, width≈98 → ends ≈164 (3px gap after E)
   *   O circ: cx=179, r=13   → left≈166  (2px gap after L)
   *   Q circ: cx=197, r=13   → overlaps O
   *   Q tail: from 205,38 → 218,52
   */
  return (
    <svg
      className={className}
      viewBox="0 0 264 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="NestBloq"
    >
      <defs>
        {/* Sky-blue → cobalt gradient matching original brand */}
        <linearGradient id="nb_grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#74B9FF" />
          <stop offset="100%" stopColor="#4A90D9" />
        </linearGradient>
      </defs>

      {/* ── N ─────────────────────────────────────────── */}
      <text
        x="3"
        y="48"
        fontFamily="'Plus Jakarta Sans', 'Inter', sans-serif"
        fontWeight="800"
        fontSize="38"
        fill={textFill}
        letterSpacing="-0.5"
      >N</text>

      {/* ── E  (house icon) ───────────────────────────── */}
      {/* Roof triangle */}
      <path d="M36 22 L50 5 L64 22 Z" fill={iconColor} />
      {/* Window panes */}
      <rect x="47" y="10" width="3.5" height="3.5" rx="0.5" fill={windowFill} />
      <rect x="51.5" y="10" width="3.5" height="3.5" rx="0.5" fill={windowFill} />
      <rect x="47" y="14.5" width="3.5" height="3.5" rx="0.5" fill={windowFill} />
      <rect x="51.5" y="14.5" width="3.5" height="3.5" rx="0.5" fill={windowFill} />
      {/* 3 horizontal bars (E body) */}
      <rect x="36" y="25" width="28" height="5.5" rx="2.5" fill={iconColor} />
      <rect x="36" y="33" width="28" height="5.5" rx="2.5" fill={iconColor} />
      <rect x="36" y="41" width="28" height="5.5" rx="2.5" fill={iconColor} />

      {/* ── STBL ──────────────────────────────────────── */}
      <text
        x="67"
        y="48"
        fontFamily="'Plus Jakarta Sans', 'Inter', sans-serif"
        fontWeight="800"
        fontSize="38"
        fill={textFill}
        letterSpacing="-0.5"
      >STBL</text>

      {/* ── OQ (two overlapping circles + Q tail) ─────── */}
      {/* O circle */}
      <circle cx="179" cy="30" r="13" stroke={iconColor} strokeWidth="4.5" fill="none" />
      {/* Q circle (overlaps O) */}
      <circle cx="197" cy="30" r="13" stroke={iconColor} strokeWidth="4.5" fill="none" />
      {/* Q diagonal tail */}
      <line
        x1="205" y1="39"
        x2="218" y2="52"
        stroke={iconColor}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
