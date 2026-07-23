import React, { useState } from 'react';
import { 
  Bell, Sun, Moon, User, LogOut, Search, ChevronDown, Plus, Menu, Building2, ArrowLeft, RefreshCw, ArrowLeftRight
} from 'lucide-react';
import AddCommunityModal from './AddCommunityModal';
import { useTheme } from '../context/ThemeContext';
import { getBaseUrl } from '../services/api';
import SystemSelectorDropdown from './layout/SystemSelectorDropdown';

const Topbar = ({
  activeCommunity,
  setActiveCommunity,
  communities = [],
  toggleNotif,
  toggleSidebar,
  user,
  setActivePage,
  unreadCount = 0,
  viewAsResident,
  setViewAsResident,
  canSwitchView,
  canGoBack,
  onBack
}) => {
  const [isCommDropdownOpen, setIsCommDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { theme, toggleTheme } = useTheme();

  const isResident = user?.role === 'resident';
  const isSuperAdmin = user?.role === 'super_admin' || user?.role_name === 'super_admin';
  const isBoardMember = ['board_member', 'board', 'president', 'director'].includes(user?.role?.toLowerCase());

  const getProfileImage = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return getBaseUrl(url.startsWith('/') ? url : '/' + url);
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const filteredCommunities = communities.filter((c) =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = () => {
    const keys = ['token', 'session_token', 'access_token', 'user', 'view_as_resident'];
    keys.forEach(k => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
    window.location.href = '/login';
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

      {/* Community Section */}
      <div className="relative flex-1 lg:flex-none min-w-0">
        {(isResident || isBoardMember) && communities.length <= 1 ? (
          // Board Member + Resident ke liye Fixed Community
          <div className="flex items-center gap-1.5 sm:gap-3 max-w-[150px] xs:max-w-[200px] sm:max-w-[420px] lg:max-w-none select-none">
            <Building2 className="hidden sm:block text-[#6366F1] dark:text-[#818CF8] flex-shrink-0" size={18} />
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-gray-400 font-semibold uppercase tracking-widest leading-normal mb-0.5 truncate">MY COMMUNITY</p>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[14px] xs:text-[16px] sm:text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {activeCommunity?.name || "Oakwood Estates"}
                </span>
                {(activeCommunity?.community_code || "OAK-2291") && (
                  <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-bold px-2 py-0.5 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 rounded-lg border border-sky-200 dark:border-sky-500/20 flex-shrink-0 ml-1 shadow-sm">
                    {activeCommunity?.community_code || "OAK-2291"}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Admin / Super Admin OR Multi-Community Resident/Board Member ke liye dropdown
          <div className="flex items-center gap-1.5 sm:gap-3 max-w-[150px] xs:max-w-[200px] sm:max-w-[420px] lg:max-w-none select-none">
            <Building2 className="hidden sm:block text-[#6366F1] dark:text-[#818CF8] flex-shrink-0" size={18} />
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-gray-400 font-semibold uppercase tracking-widest leading-normal mb-0.5 truncate">
                {user?.role === 'super_admin' ? 'MANAGING' : 'MY COMMUNITY'}
              </p>
              <div
                className="flex items-center gap-1 cursor-pointer transition select-none hover:opacity-80"
                onClick={() => setIsCommDropdownOpen(!isCommDropdownOpen)}
              >
                <span className="text-[14px] xs:text-[16px] sm:text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {activeCommunity?.name || "Select Community"}
                </span>
                {activeCommunity?.community_code && (
                  <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-bold px-2 py-0.5 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 rounded-lg border border-sky-200 dark:border-sky-500/20 flex-shrink-0 ml-1 shadow-sm">
                    {activeCommunity.community_code}
                  </span>
                )}
                <ChevronDown size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0 transition-transform" style={{ transform: isCommDropdownOpen ? 'rotate(180deg)' : 'none' }} />
              </div>
            </div>
          </div>
        )}

        {/* Dropdown panel */}
        {isCommDropdownOpen && !(user?.role === 'landlord' || user?.role === 'tenant') && (
          <div className="fixed sm:absolute top-16 sm:top-[calc(100%+12px)] left-4 right-4 sm:left-0 sm:right-auto w-auto sm:w-80 bg-white dark:bg-[#1E3248] border border-slate-200 dark:border-white/20 rounded-3xl shadow-2xl z-50 py-3 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-3 relative">
              <Search size={16} className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 dark:text-white"
              />
            </div>

            <div className="max-h-64 overflow-y-auto px-2 mt-3 custom-scrollbar">
              {filteredCommunities.map((comm) => (
                <div
                  key={comm.community_id}
                  onClick={() => { 
                    setActiveCommunity(comm); 
                    setIsCommDropdownOpen(false); 
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl mx-1 cursor-pointer transition hover:bg-slate-100 dark:hover:bg-white/10 ${
                    activeCommunity?.community_id === comm.community_id ? 'bg-blue-50 dark:bg-blue-500/10 border border-blue-500/20' : ''
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <p className="font-medium text-gray-900 dark:text-white truncate">{comm.name}</p>
                </div>
              ))}
            </div>

            {user?.role === 'super_admin' && (
              <div
                className="mx-3 mt-3 border-t border-slate-200 dark:border-white/10 pt-3 px-4 py-3 text-blue-500 hover:bg-blue-500/5 rounded-2xl cursor-pointer flex items-center gap-2 text-sm font-bold transition"
                onClick={() => { setIsCommDropdownOpen(false); setShowAddModal(true); }}
              >
                <Plus size={18} /> Add New Community
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Side Actions */}
      <div className="ml-auto flex items-center gap-1 sm:gap-2 lg:gap-4 flex-shrink-0">
        
        {canSwitchView && (
          <button
            onClick={() => setViewAsResident(!viewAsResident)}
            className="hidden md:flex px-4 py-2 bg-blue-500/10 dark:bg-blue-500/25 border-2 border-blue-500/30 hover:border-blue-500 hover:bg-blue-500 hover:text-white text-blue-700 dark:text-blue-400 dark:hover:text-white dark:hover:bg-blue-500 rounded-2xl text-xs font-bold transition-all duration-200 items-center gap-1.5 shadow-sm active:scale-95"
          >
            {viewAsResident 
              ? (isBoardMember ? "Switch to Board View" : "Switch to Admin View") 
              : "Switch to Resident View"}
          </button>
        )}

        {isSuperAdmin && (
          <SystemSelectorDropdown currentSystem="hoa" />
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
              {(viewAsResident && canSwitchView) 
                ? "Resident" 
                : (user?.role || "resident").split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
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
                    {(viewAsResident && canSwitchView) ? "resident" : (user?.role || "resident").replace('_', ' ')}
                  </p>
                </div>

                <div className="p-2">
                  {/* Mobile-only view switcher */}
                  {canSwitchView && (
                    <button 
                      onClick={() => { 
                        setIsUserDropdownOpen(false); 
                        setViewAsResident(!viewAsResident); 
                      }}
                      className="md:hidden w-full px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl flex items-center gap-3 text-sm text-blue-600 dark:text-blue-400 font-bold transition-colors mb-1"
                    >
                      <Plus size={16} /> 
                      {viewAsResident 
                        ? (isBoardMember ? "Switch to Board View" : "Switch to Admin View") 
                        : "Switch to Resident View"}
                    </button>
                  )}

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

      {showAddModal && (
        <AddCommunityModal 
          isOpen={showAddModal} 
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => window.location.reload()} 
        />
      )}

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

export default Topbar;