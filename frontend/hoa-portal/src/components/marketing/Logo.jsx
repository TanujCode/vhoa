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
      viewBox="0 0 220 50"
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
        x="8"
        y="42"
        fontFamily="'Plus Jakarta Sans', 'Inter', sans-serif"
        fontWeight="800"
        fontSize="34"
        fill={textFill}
        className={textClass}
      >
        N
      </text>

      {/* --- LETTER E (House Roof + 3 Bars) --- */}
      {/* House Roof Triangle */}
      <path
        d="M44 19 L60 5 L76 19 Z"
        fill={shapeFill}
      />
      {/* 4 Window Panes Inside Roof */}
      <rect x="57.5" y="11" width="2" height="2" fill={windowFill} />
      <rect x="60.5" y="11" width="2" height="2" fill={windowFill} />
      <rect x="57.5" y="14" width="2" height="2" fill={windowFill} />
      <rect x="60.5" y="14" width="2" height="2" fill={windowFill} />

      {/* 3 Horizontal Bars of E */}
      <rect x="44" y="23" width="32" height="4" rx="2" fill={shapeFill} />
      <rect x="44" y="31" width="32" height="4" rx="2" fill={shapeFill} />
      <rect x="44" y="39" width="32" height="4" rx="2" fill={shapeFill} />

      {/* --- LETTERS STBL --- */}
      <text
        x="81"
        y="42"
        fontFamily="'Plus Jakarta Sans', 'Inter', sans-serif"
        fontWeight="800"
        fontSize="34"
        fill={textFill}
        letterSpacing="1"
        className={textClass}
      >
        STBL
      </text>

      {/* --- LETTERS OQ (Overlapping Blue Circles) --- */}
      {/* Circle 1 (O) */}
      <circle
        cx="174"
        cy="28"
        r="11"
        stroke={shapeStroke}
        strokeWidth="4"
        fill="none"
      />
      {/* Circle 2 (Q) */}
      <circle
        cx="191"
        cy="28"
        r="11"
        stroke={shapeStroke}
        strokeWidth="4"
        fill="none"
      />
      {/* Q Tail */}
      <path
        d="M197 35 C201 39 204 41 208 42"
        stroke={shapeStroke}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
