import React, { useState } from 'react';
import { 
  Bell, Sun, Moon, User, LogOut, Search, ChevronDown, Plus, Menu 
} from 'lucide-react';
import AddCommunityModal from './AddCommunityModal';
import { useTheme } from '../context/ThemeContext';
import { getBaseUrl } from '../services/api';

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
  canSwitchView
}) => {
  const [isCommDropdownOpen, setIsCommDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const { theme, toggleTheme } = useTheme();

  const isResident = user?.role === 'resident';
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
    const keys = ['token', 'session_token', 'access_token', 'user'];
    keys.forEach(k => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
    window.location.href = '/login';
  };

  return (
    <header className="h-16 bg-white dark:bg-[#162535] border-b border-slate-200 dark:border-white/10 flex items-center px-3 sm:px-4 lg:px-6 z-30 sticky top-0">
      
      {/* Mobile Sidebar Button */}
      <button onClick={toggleSidebar} className="lg:hidden p-2 mr-1 sm:mr-2 text-gray-500 dark:text-gray-400">
        <Menu size={20} />
      </button>

      {/* Community Section */}
      <div className="relative flex-1 lg:flex-none">
        {(isResident || isBoardMember) && communities.length <= 1 ? (
          // Board Member + Resident ke liye Fixed Community (jaise HTML mein hai)
          <div className="flex items-center gap-1.5 sm:gap-3 max-w-[130px] sm:max-w-[280px] lg:max-w-none select-none">
            <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse flex-shrink-0"></div>
            <div className="min-w-0">
              <p className="text-[8px] sm:text-[10px] text-slate-500 dark:text-gray-400 font-mono uppercase tracking-widest leading-none mb-0.5 truncate">MY COMMUNITY</p>
              <p className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-white leading-none truncate">
                {activeCommunity?.name || "Oakwood Estates"}
              </p>
            </div>
            {(activeCommunity?.community_code || "OAK-2291") && (
              <div className="hidden sm:block text-[10px] sm:text-xs font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 dark:bg-teal-500/20 px-2.5 py-0.5 rounded-full flex-shrink-0 border border-teal-500/20">
                {activeCommunity?.community_code || "OAK-2291"}
              </div>
            )}
          </div>
        ) : (
          // Admin / Super Admin OR Multi-Community Resident/Board Member ke liye dropdown
          <div
            className="flex items-center gap-2 cursor-pointer transition select-none hover:opacity-85"
            onClick={() => setIsCommDropdownOpen(!isCommDropdownOpen)}
          >
            <div className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 animate-pulse"></div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                {activeCommunity?.name || "Select Community"}
              </span>
              {activeCommunity?.community_code && (
                <span className="hidden sm:block text-[10px] sm:text-xs font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 dark:bg-teal-500/20 px-2.5 py-0.5 rounded-full flex-shrink-0 border border-teal-500/20">
                  {activeCommunity.community_code}
                </span>
              )}
            </div>
            <ChevronDown size={14} className="text-gray-400 flex-shrink-0 transition-transform sm:w-4 sm:h-4" style={{ transform: isCommDropdownOpen ? 'rotate(180deg)' : 'none' }} />
          </div>
        )}

        {/* Dropdown panel */}
        {isCommDropdownOpen && (
          <div className="absolute top-[calc(100%+12px)] left-0 w-72 sm:w-80 bg-white dark:bg-[#1E3248] border border-slate-200 dark:border-white/20 rounded-3xl shadow-2xl z-50 py-3 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-3 relative">
              <Search size={16} className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 dark:text-white"
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
                    activeCommunity?.community_id === comm.community_id ? 'bg-teal-50 dark:bg-teal-500/10 border border-teal-500/20' : ''
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                  <p className="font-medium text-gray-900 dark:text-white truncate">{comm.name}</p>
                </div>
              ))}
            </div>

            {user?.role === 'super_admin' && (
              <div
                className="mx-3 mt-3 border-t border-slate-200 dark:border-white/10 pt-3 px-4 py-3 text-teal-500 hover:bg-teal-500/5 rounded-2xl cursor-pointer flex items-center gap-2 text-sm font-bold transition"
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
            className="hidden md:flex px-4 py-2 bg-gradient-to-r from-teal-500/10 to-blue-500/10 hover:from-teal-500/20 hover:to-blue-500/20 text-[#25C490] hover:text-[#2ae2a6] border border-teal-500/25 rounded-2xl text-xs font-bold transition items-center gap-1.5 shadow-md shadow-teal-950/5 active:scale-95"
          >
            {viewAsResident 
              ? (isBoardMember ? "Switch to Board View" : "Switch to Admin View") 
              : "Switch to Resident View"}
          </button>
        )}
        
        <button
          onClick={toggleTheme}
          className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
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
        <div className="relative ml-1 sm:ml-2">
          <div
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-white cursor-pointer hover:ring-2 ring-teal-500/5 transition-all overflow-hidden border border-white/10 bg-gradient-to-br from-teal-500 to-blue-600 shadow-lg"
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
          >
            {user?.user_profile_url ? (
              <img 
                src={getProfileImage(user.user_profile_url)} 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<span class="text-xs sm:text-sm">${getInitials(user?.full_name || user?.name)}</span>`;
                }}
              />
            ) : (
              <span className="text-xs sm:text-sm tracking-tighter">{getInitials(user?.full_name || user?.name)}</span>
            )}
          </div>

          {isUserDropdownOpen && (
            <div className="absolute right-0 top-[calc(100%+12px)] w-60 bg-white dark:bg-[#1E3248] border border-slate-200 dark:border-white/20 rounded-3xl shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                <p className="font-bold text-gray-900 dark:text-white truncate">{user?.full_name || user?.name || "User"}</p>
                <p className="text-[10px] text-teal-500 font-mono uppercase font-black tracking-widest mt-0.5">
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
                    className="md:hidden w-full px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl flex items-center gap-3 text-sm text-teal-600 dark:text-teal-400 font-bold transition-colors mb-1"
                  >
                    <Plus size={16} /> 
                    {viewAsResident 
                      ? (isBoardMember ? "Switch to Board View" : "Switch to Admin View") 
                      : "Switch to Resident View"}
                  </button>
                )}

                <button 
                  onClick={() => { setIsUserDropdownOpen(false); setActivePage('profile'); }}
                  className="w-full px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 transition-colors"
                >
                  <User size={16} className="text-teal-500" /> Profile Settings
                </button>

                <button 
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 hover:bg-red-500/10 rounded-2xl flex items-center gap-3 text-sm text-red-500 transition-colors mt-1"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </div>
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
    </header>
  );
};

export default Topbar;
