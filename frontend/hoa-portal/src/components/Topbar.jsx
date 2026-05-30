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
    if (url.startsWith('http')) return url;
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
    <header className="h-16 bg-white dark:bg-[#162535] border-b border-slate-200 dark:border-white/10 flex items-center px-4 lg:px-6 z-30 sticky top-0">
      
      {/* Mobile Sidebar Button */}
      <button onClick={toggleSidebar} className="lg:hidden p-2 mr-2 text-gray-500 dark:text-gray-400">
        <Menu size={20} />
      </button>

      {/* Community Section */}
      <div className="relative flex-1 lg:flex-none">
        {isResident || isBoardMember ? (
          // Board Member + Resident ke liye Fixed Community (jaise HTML mein hai)
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-[#1E3248] border border-slate-200 dark:border-white/10 rounded-2xl">
            <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
            <div>
              <p className="text-[10px] text-slate-500 dark:text-gray-400 font-mono uppercase tracking-widest leading-none mb-0.5">MY COMMUNITY</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-none truncate">
                {activeCommunity?.name || "Oakwood Estates"}
              </p>
            </div>
            <div className="ml-auto text-[10px] font-mono text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded">
              {activeCommunity?.community_code || "OAK-2291"}
            </div>
          </div>
        ) : (
          // Admin / Super Admin ke liye original dropdown
          <div
            className="bg-slate-100 dark:bg-[#1E3248] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-2 flex items-center gap-3 cursor-pointer hover:border-teal-500 transition min-w-[240px] lg:min-w-[280px]"
            onClick={() => setIsCommDropdownOpen(!isCommDropdownOpen)}
          >
            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">
                {activeCommunity?.name || "Select Community"}
              </p>
            </div>
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${isCommDropdownOpen ? 'rotate-180' : ''}`} />
          </div>
        )}

        {/* Original Dropdown (Sirf non-board members ke liye) */}
        {!isResident && !isBoardMember && isCommDropdownOpen && (
          <div className="absolute top-[calc(100%+12px)] left-0 w-80 bg-white dark:bg-[#1E3248] border border-slate-200 dark:border-white/20 rounded-3xl shadow-2xl z-50 py-3 overflow-hidden animate-in fade-in zoom-in-95">
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

      {/* Right Side Actions - Original Code Same Rakha Hai */}
      <div className="ml-auto flex items-center gap-2 lg:gap-4">
        
        {canSwitchView && (
          <button
            onClick={() => setViewAsResident(!viewAsResident)}
            className="px-4 py-2 bg-gradient-to-r from-teal-500/10 to-blue-500/10 hover:from-teal-500/20 hover:to-blue-500/20 text-[#25C490] hover:text-[#2ae2a6] border border-teal-500/25 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-teal-950/5 active:scale-95"
          >
            {viewAsResident 
              ? (isBoardMember ? "Switch to Board View" : "Switch to Admin View") 
              : "Switch to Resident View"}
          </button>
        )}
        
        <button
          onClick={toggleTheme}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button
          onClick={toggleNotif}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 relative transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-5 h-5 border-2 border-white dark:border-[#162535] shadow-sm animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile - FIXED IMAGE LOGIC */}
        <div className="relative ml-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white cursor-pointer hover:ring-2 ring-teal-500/5 transition-all overflow-hidden border border-white/10 bg-gradient-to-br from-teal-500 to-blue-600 shadow-lg"
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
          >
            {user?.user_profile_url ? (
              <img 
                src={getProfileImage(user.user_profile_url)} 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<span class="text-sm">${getInitials(user?.name)}</span>`;
                }}
              />
            ) : (
              <span className="text-sm tracking-tighter">{getInitials(user?.name)}</span>
            )}
          </div>

          {isUserDropdownOpen && (
            <div className="absolute right-0 top-[calc(100%+12px)] w-60 bg-white dark:bg-[#1E3248] border border-slate-200 dark:border-white/20 rounded-3xl shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                <p className="font-bold text-gray-900 dark:text-white truncate">{user?.name || "User"}</p>
                <p className="text-[10px] text-teal-500 font-mono uppercase font-black tracking-widest mt-0.5">
                  {(viewAsResident && canSwitchView) ? "resident" : (user?.role || "resident").replace('_', ' ')}
                </p>
              </div>

              <div className="p-2">
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