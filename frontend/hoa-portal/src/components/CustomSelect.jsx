import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * CustomSelect - Clean, Compact & Premium Custom Dropdown Menu
 */
export default function CustomSelect({ 
  value, 
  onChange, 
  options = [], 
  placeholder = 'Select option...', 
  className = '',
  disabled = false,
  direction = 'auto' // 'down' | 'up' | 'auto'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(direction === 'up');
  const dropdownRef = useRef(null);

  // Auto-detect direction based on space below
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      if (direction === 'up') {
        setOpenUpward(true);
      } else if (direction === 'down') {
        setOpenUpward(false);
      } else {
        const rect = dropdownRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow < 220) {
          setOpenUpward(true);
        } else {
          setOpenUpward(false);
        }
      }
    }
  }, [isOpen, direction]);

  // Outside click listener
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return { 
        value: String(opt.value !== undefined ? opt.value : opt.id || ''), 
        label: opt.label || opt.name || opt.text || String(opt.value) 
      };
    }
    return { value: String(opt), label: String(opt) };
  });

  const selectedOption = normalizedOptions.find(opt => String(opt.value) === String(value));

  const handleSelect = (val) => {
    if (disabled) return;
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className || 'w-full'} text-left`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 bg-slate-50 dark:bg-[#0D1B2A] hover:bg-slate-100/80 dark:hover:bg-[#112236] border border-slate-200 dark:border-white/20 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer shadow-sm hover:shadow'
        }`}
      >
        <span className={`truncate ${!selectedOption || selectedOption.value === '' ? 'text-slate-400 dark:text-gray-500 font-normal' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={14} 
          className={`text-slate-400 dark:text-gray-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-blue-500 dark:text-blue-400' : ''
          }`} 
        />
      </button>

      {/* Options Popup Overlay */}
      {isOpen && (
        <div 
          className={`absolute left-0 min-w-full w-max max-w-xs z-[100] bg-white/95 dark:bg-[#162535]/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/15 rounded-2xl shadow-2xl p-1 max-h-56 overflow-y-auto custom-scrollbar transition-all duration-150 ${
            openUpward ? 'bottom-full mb-1.5 origin-bottom animate-in fade-in zoom-in-95' : 'top-full mt-1.5 origin-top animate-in fade-in zoom-in-95'
          }`}
        >
          {normalizedOptions.length === 0 ? (
            <div className="px-3.5 py-2 text-xs text-slate-400 dark:text-gray-500 text-center">
              No options available
            </div>
          ) : (
            normalizedOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value);

              return (
                <div
                  key={opt.value + opt.label}
                  onClick={() => handleSelect(opt.value)}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
