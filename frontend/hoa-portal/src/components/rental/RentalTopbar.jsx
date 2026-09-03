import React, { useState } from 'react';
import { 
  Sun, Moon, User, LogOut, ChevronDown, Menu, Building2, Bell, ArrowLeft, RefreshCw, Search, ArrowLeftRight, Home
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getBaseUrl } from '../../services/api';
import SystemSelectorDropdown from '../layout/SystemSelectorDropdown';

const RentalTopbar = ({
  toggleSidebar,
  user,
  setActivePage,
  canGoBack,
  onBack,
  unreadCount = 0,
  toggleNotif,
  properties = [],
  selectedPropertyFilterId = 'all',
  setSelectedPropertyFilterId,
  leases = [],
  onTenantLeaseSwitch
}) => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const getCleanUnitNumber = (unitNum) => {
    if (!unitNum) return 'N/A';
    const isEntireProperty = unitNum === 'Single Family' || unitNum === 'Entire Property' || unitNum === 'Condo Unit' || !/\d/.test(unitNum);
    return isEntireProperty ? '1' : unitNum;
  };

  const filteredTenantLeases = user?.role === 'tenant'
    ? leases.filter(l => {
        const propName = l.property_name || (l.unit && l.unit.property ? l.unit.property.name : l.property?.name || 'Private Landlord');
        return String(propName) === String(user?.property_name);
      })
    : [];

  const isUserCondo = user?.property_type === 'condo' || 
                      String(user?.unit_number || '').toLowerCase().includes('apt') || 
                      String(user?.property_name || '').toLowerCase().includes('condo');

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
    <header className="h-16 bg-white dark:bg-[#162535] border-b border-slate-200 dark:border-white/10 flex items-center px-3 sm:px-4 lg:px-6 z-30 sticky top-0 shrink-0">
      
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

      {/* Workspace Indicator / Property Dropdown */}
      <div className="relative flex-1 lg:flex-none min-w-0">
        {(user?.role === 'landlord' || user?.role === 'super_admin') && properties.length > 0 ? (
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 sm:gap-3 max-w-[150px] xs:max-w-[200px] sm:max-w-[420px] lg:max-w-none select-none cursor-pointer group"
          >
            <Building2 className="hidden sm:block text-[#6366F1] dark:text-[#818CF8] flex-shrink-0" size={18} />
            <div className="min-w-0 text-left">
              <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-gray-400 font-semibold uppercase tracking-widest leading-normal mb-0.5 truncate">
                MANAGING
              </p>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[14px] xs:text-[16px] sm:text-lg font-black text-slate-900 dark:text-white leading-tight truncate group-hover:text-blue-600 dark:group-hover:text-[#5BA4F5] transition-colors">
                  {selectedPropertyFilterId === 'all' 
                    ? 'All Properties' 
                    : (properties.find(p => String(p.property_id) === String(selectedPropertyFilterId))?.name || 'All Properties')
                  }
                </span>
                <ChevronDown size={16} className={`text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-[#5BA4F5] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-3 max-w-[150px] xs:max-w-[200px] sm:max-w-[420px] lg:max-w-none select-none">
            <Building2 className="hidden sm:block text-[#6366F1] dark:text-[#818CF8] flex-shrink-0" size={18} />
            <div className="min-w-0 text-left">
              <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-gray-400 font-semibold uppercase tracking-widest leading-normal mb-0.5 truncate">
                {user?.property_name ? 'MY RESIDENCE' : 'WORKSPACE MODE'}
              </p>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[14px] xs:text-[16px] sm:text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {user?.property_name || 'Tenant Rental Portal'}
                </span>
                {user?.unit_number ? (
                  <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-lg border border-indigo-200 dark:border-indigo-500/20 flex-shrink-0 ml-1 shadow-sm uppercase animate-fade-in">
                    {user.unit_number === 'Single Family' ? 'Single Family' : user.unit_number === 'Condo Unit' ? 'Condo' : `${isUserCondo ? 'Apt' : 'Unit'} ${getCleanUnitNumber(user.unit_number)}`}
                  </span>
                ) : (
                  <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-500/20 flex-shrink-0 ml-1 shadow-sm uppercase">
                    Rental
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dropdown Popover Menu for Landlord */}
        {isDropdownOpen && (user?.role === 'landlord' || user?.role === 'super_admin') && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
            <div className="fixed sm:absolute top-16 sm:top-[calc(100%+12px)] left-4 right-4 sm:left-0 sm:right-auto w-auto sm:w-80 bg-white dark:bg-[#1E3248] border border-slate-200 dark:border-white/20 rounded-3xl shadow-2xl z-50 py-3 overflow-hidden animate-in fade-in zoom-in-95 text-left">
              {/* Search Bar inside popover */}
              <div className="px-3 relative">
                <Search size={16} className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={dropdownSearch}
                  onChange={(e) => setDropdownSearch(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                />
              </div>

              {/* Dropdown Options */}
              <div className="max-h-64 overflow-y-auto px-2 mt-3 custom-scrollbar">
                {/* All Properties option */}
                {('all'.includes(dropdownSearch.toLowerCase()) || 'all properties'.includes(dropdownSearch.toLowerCase())) && (
                  <div
                    onClick={() => {
                      setSelectedPropertyFilterId('all');
                      setIsDropdownOpen(false);
                      setDropdownSearch('');
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl mx-1 cursor-pointer transition hover:bg-slate-100 dark:hover:bg-white/10 ${
                      selectedPropertyFilterId === 'all'
                        ? 'bg-blue-50 dark:bg-blue-500/10 border border-blue-500/20'
                        : ''
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <p className="font-semibold text-gray-900 dark:text-white truncate">All Properties</p>
                  </div>
                )}

                {/* Properties list */}
                {properties
                  .filter(p => p.name.toLowerCase().includes(dropdownSearch.toLowerCase()))
                  .map(p => (
                    <div
                      key={p.property_id}
                      onClick={() => {
                        setSelectedPropertyFilterId(String(p.property_id));
                        setIsDropdownOpen(false);
                        setDropdownSearch('');
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl mx-1 cursor-pointer transition hover:bg-slate-100 dark:hover:bg-white/10 ${
                        String(selectedPropertyFilterId) === String(p.property_id)
                          ? 'bg-blue-50 dark:bg-blue-500/10 border border-blue-500/20'
                        : ''
                      }`}
                    >
                      <Home className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                    </div>
                  ))
                }
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right Side Actions */}
      <div className="ml-auto flex items-center gap-1 sm:gap-2 lg:gap-4 flex-shrink-0">
        {user?.role === 'super_admin' && (
          <SystemSelectorDropdown currentSystem="rental" />
        )}
        
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
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      setShowLogoutConfirm(true);
                    }}
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

      {/* Confirmation Modal before Logging out */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-gradient-to-br dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl text-slate-900 dark:text-white">
            <div className="w-14 h-14 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <LogOut size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Confirm Logout</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-6 leading-relaxed">
              Are you sure you want to log out of your session? You will need to sign back in to access your portal.
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
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default RentalTopbar;
