import React, { useId } from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * NestBloq Logo — Premium pure SVG implementation.
 * Renders sharp scalable vector shapes matching the design specifications exactly.
 * Applies drop shadow filters for realistic 3D depth, resolves gradient conflicts
 * using unique IDs, and adjusts colors dynamically to look perfect on both light
 * and dark backgrounds.
 *
 * variants: "currentColor" | "light" | "dark" | "auth" | "white"
 */
export default function Logo({ className = 'h-9', variant = 'currentColor', forceWhite = false }) {
  const uniqueId = useId().replace(/:/g, '');
  const gradientId = `nb_g_${uniqueId}`;

  let theme = 'light';
  try {
    const context = useTheme();
    if (context && context.theme) {
      theme = context.theme;
    }
  } catch (e) {
    // Fallback if rendered outside ThemeContext
  }

  // Determine if background context is dark vs light
  const isDarkBg =
    forceWhite ||
    variant === 'white' ||
    variant === 'auth' ||
    variant === 'dark' ||
    (variant === 'currentColor' && theme === 'dark');

  // Colors based on theme/variant context
  const textFill = isDarkBg ? '#ffffff' : '#0F172A';
  const startColor = isDarkBg ? '#74B9FF' : '#5BA4F5';
  const endColor = isDarkBg ? '#3882F6' : '#1D68DF';
  const circleColor = isDarkBg ? '#3882F6' : '#1D68DF';
  
  // Shadow colors based on background
  const shadowColor = isDarkBg ? 'rgba(0, 0, 0, 0.5)' : 'rgba(15, 23, 42, 0.25)';
  const circleShadowColor = isDarkBg ? 'rgba(0, 0, 0, 0.35)' : 'rgba(15, 23, 42, 0.15)';
  const overlapShadowColor = isDarkBg ? 'rgba(0, 0, 0, 0.5)' : 'rgba(15, 23, 42, 0.3)';

  return (
    <svg
      className={className}
      viewBox="0 0 228 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="NestBloq"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={startColor} />
          <stop offset="100%" stopColor={endColor} />
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

      {/* ── E (House Icon) with Drop Shadow ── */}
      <g style={{ filter: `drop-shadow(0px 2.5px 2px ${shadowColor})` }}>
        {/* Roof triangle */}
        <path d="M33 21 L47 4 L61 21 Z" fill={`url(#${gradientId})`} />
        {/* Window panes */}
        <rect x="44" y="10" width="3" height="3" rx="0.5" fill="#ffffff" />
        <rect x="48.5" y="10" width="3" height="3" rx="0.5" fill="#ffffff" />
        <rect x="44" y="14.5" width="3" height="3" rx="0.5" fill="#ffffff" />
        <rect x="48.5" y="14.5" width="3" height="3" rx="0.5" fill="#ffffff" />
      </g>

      {/* 3 bars (E body) */}
      <rect x="33" y="24" width="28" height="5" rx="2.5" fill={`url(#${gradientId})`} />
      <rect x="33" y="32" width="28" height="5" rx="2.5" fill={`url(#${gradientId})`} />
      <rect x="33" y="40" width="28" height="5" rx="2.5" fill={`url(#${gradientId})`} />

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

      {/* ── OQ Overlap & Shadows ──────────────── */}
      {/* O circle */}
      <circle
        cx="169"
        cy="33"
        r="13"
        stroke={circleColor}
        strokeWidth="4.5"
        fill="none"
        style={{ filter: `drop-shadow(0px 1.5px 2px ${circleShadowColor})` }}
      />

      {/* Q group with shadow casting on O */}
      <g style={{ filter: `drop-shadow(-2px 1.5px 2px ${overlapShadowColor})` }}>
        {/* Q circle */}
        <circle cx="186" cy="33" r="13" stroke={circleColor} strokeWidth="4.5" fill="none" />
        {/* Wavy Q tail */}
        <path d="M 191 41 C 193 46, 196 50, 206 50" stroke={circleColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}

