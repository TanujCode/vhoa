import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Phone, X } from 'lucide-react';
import { COUNTRIES, DEFAULT_COUNTRY, formatPhoneByCountry } from '../../utils/countries';

/**
 * Universal Country Flag Image Component with SVG/PNG CDN and graceful fallback
 */
export const CountryFlag = ({ code, className = 'w-5 h-3.5' }) => {
  const [imgError, setImgError] = useState(false);

  if (!code) return null;
  const lowerCode = code.toLowerCase();

  if (imgError) {
    return (
      <span className="inline-flex items-center justify-center text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded px-1 min-w-[20px] h-3.5 leading-none select-none">
        {code}
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${lowerCode}.png`}
      alt={code}
      className={`${className} object-cover rounded-[2px] shadow-xs shrink-0 border border-slate-200/60 dark:border-slate-700/60 select-none`}
      loading="lazy"
      onError={() => setImgError(true)}
    />
  );
};

/**
 * Universal Phone Input Component with Country Code Selector
 * Features:
 * - Default: USA 🇺🇸 (+1)
 * - Visual Flag Images (compatible with all Windows browsers & devices)
 * - Dropdown opens upward (above input)
 * - Seamless type-to-search (no bulky search bar, types directly to filter)
 * - Strict digit validation (no letters/symbols allowed)
 * - Strict country-based max digit limits and formatting
 * - Accessible and works across dark / light modes
 */
export default function PhoneInputWithCountry({
  value = '',
  onChange,
  onCountryChange,
  countryCode = '+1',
  selectedCountry: customSelectedCountry,
  disabled = false,
  required = false,
  placeholder,
  error,
  id,
  name,
  className = '',
  showIcon = true,
  size = 'md' // 'sm' | 'md' | 'lg'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const listRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Determine currently selected country
  const currentCountry = customSelectedCountry || 
    COUNTRIES.find(c => c.dialCode === countryCode) || 
    DEFAULT_COUNTRY;

  const [activeCountry, setActiveCountry] = useState(currentCountry);

  useEffect(() => {
    if (countryCode) {
      const match = COUNTRIES.find(c => c.dialCode === countryCode);
      if (match) setActiveCountry(match);
    }
  }, [countryCode]);

  useEffect(() => {
    if (customSelectedCountry) {
      setActiveCountry(customSelectedCountry);
    }
  }, [customSelectedCountry]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter countries when user types while dropdown is open
  const filteredCountries = COUNTRIES.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(q) ||
      c.dialCode.includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  // Handle keyboard typing when dropdown is open (typeahead search)
  useEffect(() => {
    if (!isOpen) return;

    const handleWindowKeyDown = (e) => {
      // Close on Escape
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
        return;
      }

      // Clear search on Backspace
      if (e.key === 'Backspace') {
        setSearchQuery(prev => prev.slice(0, -1));
        return;
      }

      // If user types a single character (letter, number, +)
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setSearchQuery(prev => {
          const next = prev + e.key;
          // Auto clear after 2.5 seconds of inactivity
          if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
          searchTimeoutRef.current = setTimeout(() => {
            setSearchQuery('');
          }, 2500);
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [isOpen]);

  // Scroll to top of list when search query changes
  useEffect(() => {
    if (listRef.current && searchQuery) {
      listRef.current.scrollTop = 0;
    }
  }, [searchQuery]);

  const handleSelectCountry = (country) => {
    setActiveCountry(country);
    setIsOpen(false);
    setSearchQuery('');

    // Re-format current value according to new country format and limit
    if (value && onChange) {
      const rawDigits = String(value).replace(/\D/g, '');
      const maxDigits = country.maxDigits || 15;
      const formatted = formatPhoneByCountry(rawDigits.slice(0, maxDigits), country);
      const syntheticEvent = {
        target: { name, id, value: formatted }
      };
      onChange(syntheticEvent, formatted);
    }

    if (onCountryChange) {
      onCountryChange(country.dialCode, country);
    }
  };

  // Restrict key presses to digits and control keys only
  const handleKeyDown = (e) => {
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Tab' ||
      e.key === 'Escape' ||
      e.key === 'Enter' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'Home' ||
      e.key === 'End' ||
      (e.ctrlKey || e.metaKey)
    ) {
      return;
    }

    // Disallow letters, spaces, special symbols
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  // Handle paste to strictly allow digits only up to country max limit
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    const rawDigits = pastedText.replace(/\D/g, '');
    const maxDigits = activeCountry.maxDigits || 15;
    const currentDigits = String(value || '').replace(/\D/g, '');
    const combined = (currentDigits + rawDigits).slice(0, maxDigits);
    const formatted = formatPhoneByCountry(combined, activeCountry);

    if (onChange) {
      const syntheticEvent = {
        target: { name, id, value: formatted }
      };
      onChange(syntheticEvent, formatted);
    }
  };

  const handleInputChange = (e) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    const maxDigits = activeCountry.maxDigits || 15;
    const limitedDigits = rawDigits.slice(0, maxDigits);
    const formatted = formatPhoneByCountry(limitedDigits, activeCountry);

    if (onChange) {
      e.target.value = formatted;
      onChange(e, formatted);
    }
  };

  const sizeClasses = {
    sm: 'py-1.5 text-xs',
    md: 'py-2.5 sm:py-3 text-sm',
    lg: 'py-3.5 text-base'
  };

  const displayPlaceholder = placeholder || activeCountry.placeholder || '(555) 000-0000';

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <div className={`flex items-center rounded-xl border transition-all duration-200 bg-white dark:bg-[#253346] ${
        disabled 
          ? 'opacity-75 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-not-allowed' 
          : error 
            ? 'border-red-500 ring-2 ring-red-500/10 dark:border-red-500' 
            : 'border-slate-200 dark:border-slate-600 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 hover:border-slate-300 dark:hover:border-slate-500'
      }`}>
        
        {/* Country Flag & Dial Code Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setIsOpen(!isOpen);
              setSearchQuery('');
            }
          }}
          className={`flex items-center gap-2 pl-3 pr-2.5 border-r border-slate-200 dark:border-slate-600/80 hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded-l-xl transition-colors shrink-0 ${
            size === 'sm' ? 'py-1.5 text-xs' : size === 'lg' ? 'py-3.5 text-sm' : 'py-2.5 sm:py-3 text-xs sm:text-sm'
          } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          title={`${activeCountry.name} (${activeCountry.dialCode})`}
        >
          <CountryFlag code={activeCountry.code} className="w-5 h-3.5" />
          <span className="font-bold text-slate-700 dark:text-slate-200 tracking-tight font-mono text-xs sm:text-sm">
            {activeCountry.dialCode}
          </span>
          <ChevronDown size={14} className={`text-slate-400 dark:text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Optional Phone Icon inside field */}
        {showIcon && (
          <Phone className="w-4 h-4 text-slate-400 dark:text-slate-400 ml-3 pointer-events-none shrink-0" />
        )}

        {/* Strict Phone Number Input Field */}
        <input
          id={id}
          name={name}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          required={required}
          disabled={disabled}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={displayPlaceholder}
          maxLength={activeCountry.format ? activeCountry.format.length + 2 : 20}
          className={`w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 outline-none font-medium px-3.5 ${sizeClasses[size] || sizeClasses.md} ${
            disabled ? 'cursor-not-allowed' : ''
          }`}
        />
      </div>

      {/* Upward-Opening Country Dropdown Menu (bottom-full mb-2) */}
      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-72 sm:w-80 max-h-72 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-150">
          
          {/* Dynamic Floating Search Indicator when user types on keyboard */}
          {searchQuery && (
            <div className="px-3 py-2 bg-blue-50/90 dark:bg-blue-950/60 border-b border-blue-100 dark:border-blue-900/50 flex items-center justify-between text-xs text-blue-700 dark:text-blue-300">
              <span className="truncate">
                Searching: <strong className="font-semibold text-blue-900 dark:text-blue-100">"{searchQuery}"</strong>
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded text-blue-500 hover:text-blue-700 dark:hover:text-blue-200 transition-colors ml-1"
                title="Clear search"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Countries List */}
          <div ref={listRef} className="overflow-y-auto custom-scrollbar p-1.5 max-h-64 divide-y divide-slate-100/60 dark:divide-slate-800/60">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">
                No matching country found for "{searchQuery}"
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = activeCountry.code === c.code && activeCountry.dialCode === c.dialCode;
                return (
                  <button
                    key={`${c.code}-${c.dialCode}`}
                    type="button"
                    onClick={() => handleSelectCountry(c)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <CountryFlag code={c.code} className="w-5 h-3.5" />
                      <span className="truncate">{c.name}</span>
                    </div>
                    <span className="font-mono text-slate-400 dark:text-slate-400 text-xs shrink-0 ml-2 font-medium">
                      {c.dialCode}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
