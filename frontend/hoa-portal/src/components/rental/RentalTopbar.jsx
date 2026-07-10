import React, { useState } from 'react';
import { 
  Sun, Moon, User, LogOut, ChevronDown, Menu, Building2, Bell, ArrowLeft, RefreshCw
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getBaseUrl } from '../../services/api';

const RentalTopbar = ({
  toggleSidebar,
  user,
  setActivePage,
  canGoBack,
  onBack,
  unreadCount = 0,
  toggleNotif
}) => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const getProfileImage = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return getBaseUrl(url.startsWith('/') ? url : '/' + url);
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const handleLogout = () => {
    const keys = ['rental_token', 'rental_session_token', 'rental_user'];
    keys.forEach(k => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
    window.location.href = '/rental/login';
  };

  return (
    <header className="h-16 bg-white dark:bg-[#162535] border-b border-slate-200 dark:border-white/10 flex items-center px-3 sm:px-4 lg:px-6 z-30 sticky top-0">
      
      {/* Mobile Sidebar Button */}
      <button onClick={toggleSidebar} className="lg:hidden p-2 mr-1 sm:mr-2 text-gray-500 dark:text-gray-400">
        <Menu size={20} />
      </button>

      {/* Back Button */}
      {canGoBack && (
        <button 
          onClick={onBack}
          className="p-2 mr-2 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition duration-150 flex items-center justify-center group shrink-0"
          title="Go Back"
        >
          <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-0.5" />
        </button>
      )}

      {/* Workspace Indicator */}
      <div className="relative flex-1 lg:flex-none min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-3 select-none">
          <Building2 className="hidden sm:block text-[#6366F1] dark:text-[#818CF8] flex-shrink-0" size={18} />
          <div className="min-w-0 text-left">
            <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-gray-400 font-semibold uppercase tracking-widest leading-normal mb-0.5 truncate">
              WORKSPACE MODE
            </p>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[14px] xs:text-[16px] sm:text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
                {user?.role === 'landlord' ? 'Landlord Portfolio' : 'Tenant Rental Portal'}
              </span>
              <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-500/20 flex-shrink-0 ml-1 shadow-sm uppercase">
                Rental
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="ml-auto flex items-center gap-1 sm:gap-2 lg:gap-4 flex-shrink-0">
        
        <button
          onClick={() => window.location.reload()}
          className="hidden sm:flex w-8 h-8 sm:w-10 sm:h-10 items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
          title="Refresh Data"
        >
          <RefreshCw size={18} className="sm:w-5 sm:h-5" />
        </button>

        <button
          onClick={toggleTheme}
          className="hidden sm:flex w-8 h-8 sm:w-10 sm:h-10 items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
        >
          {theme === 'dark' ? <Sun size={18} className="sm:w-5 sm:h-5" /> : <Moon size={18} className="sm:w-5 sm:h-5" />}
        </button>

        <button
          onClick={toggleNotif}
          className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 relative transition-colors"
        >
          <Bell size={18} className="sm:w-5 sm:h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-red-500 text-white text-[8px] sm:text-[9px] font-bold font-mono px-1 sm:px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-4 sm:min-w-5 h-4 sm:h-5 border border-white dark:border-[#162535] shadow-sm animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile */}
        <div className="relative ml-1 sm:ml-2 flex items-center gap-2">
          <div className="hidden sm:flex flex-col text-right select-none mr-1.5">
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white leading-tight tracking-tight">
              {user?.name || "User"}
            </span>
            <span className="text-[9px] sm:text-[10px] text-blue-600 dark:text-[#5BA4F5] font-bold uppercase tracking-wider leading-none mt-0.5">
              {(user?.role || "tenant").split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </span>
          </div>
          <div
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-white cursor-pointer hover:ring-2 ring-teal-500/5 transition-all overflow-hidden border border-white/10 bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg flex-shrink-0"
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
          >
            {user?.user_profile_url ? (
              <img 
                src={getProfileImage(user.user_profile_url)} 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<span class="text-xs sm:text-sm">${getInitials(user?.name)}</span>`;
                }}
              />
            ) : (
              <span className="text-xs sm:text-sm tracking-tighter">{getInitials(user?.name)}</span>
            )}
          </div>

          {isUserDropdownOpen && (
            <>
              {/* Screen overlay to close dropdown */}
              <div className="fixed inset-0 z-40" onClick={() => setIsUserDropdownOpen(false)} />
              
              <div className="fixed sm:absolute top-16 sm:top-[calc(100%+12px)] left-4 right-4 sm:left-auto sm:right-0 w-auto sm:w-60 bg-white dark:bg-[#1E3248] border border-slate-200 dark:border-white/20 rounded-3xl shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                  <p className="font-bold text-gray-900 dark:text-white truncate">{user?.name || "User"}</p>
                  <p className="text-[10px] text-blue-500 font-mono uppercase font-black tracking-widest mt-0.5">
                    {(user?.role || "tenant").replace('_', ' ')}
                  </p>
                </div>

                <div className="p-2">
                  {/* Mobile-only Theme Toggle */}
                  <button 
                    onClick={() => { toggleTheme(); }}
                    className="sm:hidden w-full px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 transition-colors mb-1"
                  >
                    {theme === 'dark' ? <Sun size={16} className="text-blue-500" /> : <Moon size={16} className="text-blue-500" />}
                    {theme === 'dark' ? "Light Mode" : "Dark Mode"}
                  </button>

                  <button 
                    onClick={() => { setIsUserDropdownOpen(false); setActivePage('profile'); }}
                    className="w-full px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 transition-colors"
                  >
                    <User size={16} className="text-blue-500" /> Profile Settings
                  </button>

                  <button 
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 hover:bg-red-500/10 rounded-2xl flex items-center gap-3 text-sm text-red-500 transition-colors mt-1"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default RentalTopbar;
