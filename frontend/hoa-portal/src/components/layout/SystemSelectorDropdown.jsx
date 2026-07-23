import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Building2, Home, Layers } from 'lucide-react';

const SystemSelectorDropdown = ({ currentSystem }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const systems = [
    {
      id: 'hoa',
      name: 'HOA System',
      desc: 'Community Management',
      icon: Building2,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      redirect: '/dashboard',
      tokenKey: 'token',
      sessionKey: 'session_token',
      userKey: 'user'
    },
    {
      id: 'rental',
      name: 'Rental System',
      desc: 'Landlord & Leases',
      icon: Home,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      redirect: '/rental/dashboard',
      tokenKey: 'rental_token',
      sessionKey: 'rental_session_token',
      userKey: 'rental_user'
    },
    {
      id: 'condo',
      name: 'Condo System',
      desc: 'High-Rise & Buildings',
      icon: Layers,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      redirect: '/condo/dashboard',
      tokenKey: 'condo_token',
      sessionKey: 'condo_session_token',
      userKey: 'condo_user'
    }
  ];

  const current = systems.find(s => s.id === currentSystem) || systems[0];

  const handleSystemSwitch = (target) => {
    if (target.id === currentSystem) return;

    // 1. Source keys
    let srcTokenKey = 'token';
    let srcSessionKey = 'session_token';
    let srcUserKey = 'user';

    if (currentSystem === 'rental') {
      srcTokenKey = 'rental_token';
      srcSessionKey = 'rental_session_token';
      srcUserKey = 'rental_user';
    } else if (currentSystem === 'condo') {
      srcTokenKey = 'condo_token';
      srcSessionKey = 'condo_session_token';
      srcUserKey = 'condo_user';
    }

    // 2. Fetch current active keys
    const token = localStorage.getItem(srcTokenKey) || sessionStorage.getItem(srcTokenKey);
    const sessionToken = localStorage.getItem(srcSessionKey) || sessionStorage.getItem(srcSessionKey);
    const userObj = localStorage.getItem(srcUserKey) || sessionStorage.getItem(srcUserKey);

    // 3. Write to destination keys
    if (token) localStorage.setItem(target.tokenKey, token);
    if (sessionToken) localStorage.setItem(target.sessionKey, sessionToken);
    if (userObj) {
      try {
        const parsed = JSON.parse(userObj);
        localStorage.setItem(target.userKey, JSON.stringify({
          ...parsed,
          role: 'super_admin',
          role_name: 'super_admin'
        }));
      } catch (_) {
        localStorage.setItem(target.userKey, userObj);
      }
    }

    setIsOpen(false);
    // 4. Redirect
    window.location.href = target.redirect;
  };

  const IconComponent = current.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 hover:border-indigo-500 text-indigo-700 dark:text-indigo-300 rounded-2xl text-xs font-bold transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
        title="Switch Management System"
      >
        <IconComponent size={14} className={current.color} />
        <span className="hidden md:inline">{current.name}</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-2.5 shadow-2xl z-[999] animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-white/5 mb-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">
              Switch Systems
            </span>
          </div>
          <div className="space-y-1">
            {systems.map((sys) => {
              const ItemIcon = sys.icon;
              const isActive = sys.id === currentSystem;
              return (
                <button
                  key={sys.id}
                  onClick={() => handleSystemSwitch(sys)}
                  disabled={isActive}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition text-left cursor-pointer ${
                    isActive
                      ? 'bg-slate-50 dark:bg-white/5 opacity-60 cursor-default'
                      : 'hover:bg-slate-50 dark:hover:bg-white/5 group'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${sys.bgColor} ${sys.color}`}>
                    <ItemIcon size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-gray-200">
                      {sys.name}
                    </p>
                    <p className="text-[9px] text-slate-400 dark:text-gray-500 font-medium">
                      {sys.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSelectorDropdown;
