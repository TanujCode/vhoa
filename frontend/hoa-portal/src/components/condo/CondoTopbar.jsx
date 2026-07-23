import React, { useState } from 'react';
import { 
  Sun, Moon, User, LogOut, ChevronDown, Menu, Building2, ArrowLeft, RefreshCw
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getBaseUrl } from '../../services/api';
import SystemSelectorDropdown from '../layout/SystemSelectorDropdown';

const CondoTopbar = ({
  toggleSidebar,
  user,
  setActivePage,
  canGoBack,
  onBack,
  communities = [],
  selectedCommunityId,
  setSelectedCommunityId
}) => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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
    const keys = ['condo_token', 'condo_session_token', 'condo_user'];
    keys.forEach(k => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
    window.location.href = '/condo/login';
  };

  const isSuperAdmin = (user?.role_name || user?.role || '').toLowerCase() === 'super_admin';

  return (
    <header className="h-16 bg-white dark:bg-[#162535] border-b border-slate-200 dark:border-white/10 flex items-center px-3 sm:px-4 lg:px-6 z-30 sticky top-0 shrink-0">
      
      {/* Mobile Sidebar Toggle */}
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

      {/* Building Switcher/Indicator */}
      <div className="relative flex-1 lg:flex-none min-w-0">
        {isSuperAdmin && communities.length > 0 ? (
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 sm:gap-3 max-w-[150px] xs:max-w-[200px] sm:max-w-[420px] lg:max-w-none select-none cursor-pointer group"
          >
            <Building2 className="hidden sm:block text-indigo-500 flex-shrink-0" size={18} />
            <div className="min-w-0 text-left">
              <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-gray-400 font-semibold uppercase tracking-widest leading-normal mb-0.5 truncate">
                MANAGING BUILDING
              </p>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[14px] xs:text-[16px] sm:text-lg font-black text-slate-900 dark:text-white leading-tight truncate group-hover:text-indigo-600 dark:group-hover:text-[#5BA4F5] transition-colors">
                  {selectedCommunityId === 'all' 
                    ? 'All Buildings' 
                    : (communities.find(c => String(c.community_id) === String(selectedCommunityId))?.name || 'All Buildings')
                  }
                </span>
                <ChevronDown size={16} className={`text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-[#5BA4F5] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-3 max-w-[150px] xs:max-w-[200px] sm:max-w-[420px] lg:max-w-none select-none">
            <Building2 className="hidden sm:block text-indigo-500 flex-shrink-0" size={18} />
            <div className="min-w-0 text-left">
              <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-gray-400 font-semibold uppercase tracking-widest leading-normal mb-0.5 truncate">
                {user?.community_name ? 'MY RESIDENCE' : 'PORTAL MODE'}
              </p>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[14px] xs:text-[16px] sm:text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {user?.community_name || 'Condo Management Portal'}
                </span>
                {user?.unit_no && (
                  <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-750 dark:bg-indigo-550/10 dark:text-indigo-400 rounded-lg border border-indigo-200 dark:border-indigo-500/20 flex-shrink-0 ml-1 shadow-sm">
                    {user.unit_no}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Building List Dropdown */}
        {isDropdownOpen && isSuperAdmin && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)} />
            <div className="absolute left-0 mt-2 w-64 sm:w-72 bg-white dark:bg-[#162535] border border-slate-200 dark:border-white/10 rounded-2xl p-2.5 shadow-2xl z-40 max-h-96 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                onClick={() => {
                  setSelectedCommunityId('all');
                  setIsDropdownOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2.5 transition text-left cursor-pointer ${
                  selectedCommunityId === 'all'
                    ? 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-[#5BA4F5]'
                    : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-gray-300'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${selectedCommunityId === 'all' ? 'bg-indigo-500' : 'bg-transparent'}`} />
                🏢 All Condo Buildings
              </button>
              <div className="h-px bg-slate-100 dark:bg-white/5 my-1.5" />
              <div className="space-y-0.5">
                {communities.map(c => (
                  <button
                    key={c.community_id}
                    onClick={() => {
                      setSelectedCommunityId(String(c.community_id));
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2.5 transition text-left cursor-pointer ${
                      String(selectedCommunityId) === String(c.community_id)
                        ? 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-[#5BA4F5]'
                        : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-gray-300'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${String(selectedCommunityId) === String(c.community_id) ? 'bg-indigo-500' : 'bg-transparent'}`} />
                    🏢 {c.name}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right Side Header Items */}
      <div className="ml-auto flex items-center gap-1 sm:gap-2 lg:gap-4 flex-shrink-0">
        {isSuperAdmin && (
          <SystemSelectorDropdown currentSystem="condo" />
        )}
        
        <button
          onClick={() => window.location.reload()}
          className="hidden sm:flex w-8 h-8 sm:w-10 sm:h-10 items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw size={18} className="sm:w-5 sm:h-5" />
        </button>

        <button
          onClick={toggleTheme}
          className="hidden sm:flex w-8 h-8 sm:w-10 sm:h-10 items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun size={18} className="sm:w-5 sm:h-5" /> : <Moon size={18} className="sm:w-5 sm:h-5" />}
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button 
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/5 p-1 px-2 rounded-xl transition duration-150 select-none cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl font-bold text-white transition-all overflow-hidden border border-slate-200 dark:border-white/10 bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm flex items-center justify-center">
              {user?.user_profile_url ? (
                <img 
                  src={getProfileImage(user.user_profile_url)} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `<span class="text-xs">${getInitials(user?.name || user?.full_name)}</span>`;
                  }}
                />
              ) : (
                <span className="text-xs">{getInitials(user?.name || user?.full_name)}</span>
              )}
            </div>
            <span className="hidden lg:block text-xs font-bold text-slate-800 dark:text-gray-200 max-w-[100px] truncate">
              {user?.first_name || 'Profile'}
            </span>
            <ChevronDown size={14} className="text-slate-400 hidden lg:block" />
          </button>

          {isUserDropdownOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsUserDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#162535] border border-slate-200 dark:border-white/10 rounded-2xl p-2 shadow-2xl z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={() => {
                    setActivePage('profile');
                    setIsUserDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-gray-300 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-left flex items-center gap-2 cursor-pointer"
                >
                  <User size={14} /> Profile Settings
                </button>
                <div className="h-px bg-slate-100 dark:bg-white/5 my-1.5" />
                <button
                  onClick={() => {
                    setIsUserDropdownOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="w-full px-4 py-2.5 text-xs font-bold text-red-500 rounded-xl hover:bg-red-500/10 text-left flex items-center gap-2 cursor-pointer"
                >
                  <LogOut size={14} /> Exit Portal
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-gradient-to-br dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200 dark:border-white/10 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl text-slate-900 dark:text-white">
            <div className="w-14 h-14 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <LogOut size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Confirm Exit & Logout</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-6 leading-relaxed">
              Are you sure you want to log out and exit the Condo management portal?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 px-4 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-gray-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-3 px-4 rounded-2xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/25 transition cursor-pointer"
              >
                Yes, Exit & Logout
              </button>
            </div>
          </div>
        </div>
      )}

    </header>
  );
};

export default CondoTopbar;
