import React from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * CaptchaBox Component
 * Reusable anti-bot security verification widget styled with security grid pattern & input box
 */
export default function CaptchaBox({
  question = '8 + 7 = ?',
  loading = false,
  refreshing = false,
  onRefresh,
  register,
  error,
  label = 'ENTER CAPTCHA',
  helperText = 'Solve the calculation in the box above.'
}) {
  const displayQuestion = loading ? '...' : (question.includes('=') ? question : `${question} = ?`);

  return (
    <div className="space-y-1.5 w-full text-left">
      {/* Label */}
      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 tracking-wider">
        {label} <span className="text-red-500">*</span>
      </label>

      {/* Main Row: Captcha Image Box + Refresh on left, Input on right */}
      <div className="flex items-center gap-2 sm:gap-3 w-full">
        {/* Left: Security Pattern Captcha Badge + Refresh */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div 
            className="relative h-10 px-3 flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-500 bg-[#f8fafc] overflow-hidden select-none shadow-inner min-w-[105px] sm:min-w-[125px]"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(148, 163, 184, 0.25) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(148, 163, 184, 0.25) 1px, transparent 1px)
              `,
              backgroundSize: '8px 8px'
            }}
          >
            {/* Subtle decorative security noise waves */}
            <svg className="absolute inset-0 w-full h-full opacity-35 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <line x1="0" y1="35" x2="100%" y2="8" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />
              <line x1="0" y1="12" x2="100%" y2="30" stroke="#64748b" strokeWidth="1" />
              <line x1="15%" y1="0" x2="85%" y2="100%" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 3" />
            </svg>

            {/* Captcha Text with Sketchy/Mono Font Style */}
            <span 
              className="relative z-10 text-base sm:text-lg font-black tracking-widest text-slate-800 font-mono italic select-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]"
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                letterSpacing: '0.18em',
                transform: 'skewX(-4deg)'
              }}
            >
              {displayQuestion}
            </span>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 bg-slate-100 hover:bg-blue-50 active:scale-95 text-slate-500 hover:text-blue-600 rounded-lg border border-slate-200 transition duration-150 disabled:opacity-50 h-10 w-10 flex items-center justify-center shrink-0 shadow-sm"
            title="Refresh CAPTCHA"
          >
            <RefreshCw
              size={16}
              className={`transition-transform duration-500 ${refreshing ? 'animate-spin text-blue-600' : 'hover:rotate-180'}`}
            />
          </button>
        </div>

        {/* Right: Input Box */}
        <div className="flex-1 min-w-[90px]">
          <input
            type="text"
            {...register('captchaAnswer', {
              required: 'Answer is required',
              pattern: {
                value: /^[0-9]+$/,
                message: 'Numbers only'
              }
            })}
            onKeyPress={(e) => {
              if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
              }
            }}
            placeholder="Result"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm font-bold text-gray-900 bg-white dark:bg-white dark:text-gray-900 text-center font-mono shadow-sm h-10 transition-all"
          />
        </div>
      </div>

      {/* Helper text */}
      <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
        {helperText}
      </p>

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-xs mt-0.5 ml-0.5 font-medium">{error.message}</p>
      )}
    </div>
  );
}
