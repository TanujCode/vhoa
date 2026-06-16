import React from 'react';

export default function Logo({ className = "h-9", variant = "currentColor", forceWhite = false }) {
  const activeVariant = forceWhite ? "white" : variant;

  let textFill = "currentColor";
  let shapeFill = "url(#logoBlueGrad)";
  let shapeStroke = "url(#logoBlueGrad)";
  let windowFill = "white";
  let textClass = "text-slate-900 dark:text-white transition-colors duration-200";

  if (activeVariant === "white") {
    textFill = "#ffffff";
    shapeFill = "#ffffff";
    shapeStroke = "#ffffff";
    windowFill = "#00A878";
    textClass = "";
  } else if (activeVariant === "auth") {
    textFill = "#ffffff";
    shapeFill = "url(#logoBlueGrad)";
    shapeStroke = "url(#logoBlueGrad)";
    windowFill = "#0A2240";
    textClass = "";
  } else if (activeVariant === "dark") {
    textFill = "#ffffff";
    shapeFill = "url(#logoBlueGrad)";
    shapeStroke = "url(#logoBlueGrad)";
    windowFill = "#162535";
    textClass = "";
  } else if (activeVariant === "light") {
    textFill = "#0f172a";
    shapeFill = "url(#logoBlueGrad)";
    shapeStroke = "url(#logoBlueGrad)";
    windowFill = "#E3F2FD";
    textClass = "";
  }

  return (
    <svg
      className={className}
      viewBox="0 0 250 54"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Sky-blue to cobalt-blue gradient matching the uploaded logo images */}
        <linearGradient id="logoBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>

      {/* --- LETTER N --- */}
      <text
        x="4"
        y="47"
        fontFamily="'Plus Jakarta Sans', 'Inter', sans-serif"
        fontWeight="800"
        fontSize="36"
        fill={textFill}
        className={textClass}
      >
        N
      </text>

      {/* --- LETTER E (House Roof + 3 Bars) --- */}
      {/* House Roof Triangle */}
      <path
        d="M45 20 L61 4 L77 20 Z"
        fill={shapeFill}
      />
      {/* Window Panes Inside Roof */}
      <rect x="58" y="10" width="3" height="3" fill={windowFill} />
      <rect x="62" y="10" width="3" height="3" fill={windowFill} />
      <rect x="58" y="14" width="3" height="3" fill={windowFill} />
      <rect x="62" y="14" width="3" height="3" fill={windowFill} />

      {/* 3 Horizontal Bars of E (matching original logo) */}
      <rect x="45" y="24" width="32" height="5" rx="2.5" fill={shapeFill} />
      <rect x="45" y="33" width="32" height="5" rx="2.5" fill={shapeFill} />
      <rect x="45" y="42" width="32" height="5" rx="2.5" fill={shapeFill} />

      {/* --- LETTERS STBL --- */}
      <text
        x="82"
        y="47"
        fontFamily="'Plus Jakarta Sans', 'Inter', sans-serif"
        fontWeight="800"
        fontSize="36"
        fill={textFill}
        letterSpacing="0"
        className={textClass}
      >
        STBL
      </text>

      {/* --- LETTERS OQ (Overlapping Blue Circles, matching original logo) --- */}
      {/* Circle 1 (O) */}
      <circle
        cx="196"
        cy="29"
        r="13"
        stroke={shapeStroke}
        strokeWidth="4"
        fill="none"
      />
      {/* Circle 2 (Q) — overlaps O slightly, matching logo */}
      <circle
        cx="215"
        cy="29"
        r="13"
        stroke={shapeStroke}
        strokeWidth="4"
        fill="none"
      />
      {/* Q Tail — diagonal, matching original */}
      <path
        d="M222 38 L232 48"
        stroke={shapeStroke}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
