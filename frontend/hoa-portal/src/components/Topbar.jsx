import React, { useState } from 'react';
import AddCommunityModal from './AddCommunityModal';
import { useTheme } from '../context/ThemeContext';

const Topbar = ({
  activeCommunity,
  setActiveCommunity,
  communities = [],
  toggleNotif,
  toggleSidebar,
  user,
  setActivePage
}) => {
  const [isCommDropdownOpen, setIsCommDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const { theme, toggleTheme } = useTheme();

  // Filter communities
  const filteredCommunities = communities.filter((c) =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectCommunity = (comm) => {
    setActiveCommunity(comm);
    setIsCommDropdownOpen(false);
    setSearchTerm('');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <header className="h-16 bg-white dark:bg-[#162535] border-b border-slate-200 dark:border-white/10 flex items-center px-4 lg:px-6 z-30">

      {/* Mobile Sidebar Button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 mr-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white text-xl"
      >
        ☰
      </button>

      {/* Community Dropdown */}
      <div className="relative">
        <div
          className="bg-slate-100 dark:bg-[#1E3248] border border-slate-200 dark:border-white/20 rounded-2xl px-5 py-2 flex items-center gap-3 cursor-pointer hover:border-teal-500 transition min-w-[280px]"
          onClick={() => setIsCommDropdownOpen(!isCommDropdownOpen)}
        >
          <div className="w-3 h-3 bg-teal-500 rounded-full"></div>

          <div className="min-w-0">
            <p className="text-sm font-medium truncate text-gray-900 dark:text-white">
              {activeCommunity?.name || "Select Community"}
            </p>
            <p className="text-xs text-slate-500 dark:text-gray-400">
              {activeCommunity?.total_owners ?? 0} members ·{" "}
              {activeCommunity?.license_status || "Active"}
            </p>
          </div>

          <span className="ml-auto text-gray-400">▾</span>
        </div>

        {/* Community Dropdown Menu */}
        {isCommDropdownOpen && (
          <div className="absolute top-[calc(100%+8px)] left-0 w-80 bg-white dark:bg-[#1E3248] border border-slate-200 dark:border-white/20 rounded-3xl shadow-2xl z-50 py-3">
            {/* Search Input */}
            <div className="px-3">
              <input
                type="text"
                placeholder="Search communities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500"
                autoFocus
              />
            </div>

            {/* Community List */}
            <div className="max-h-64 overflow-y-auto px-2 mt-3">
              {filteredCommunities.length === 0 ? (
                <div className="text-center text-gray-400 py-6 text-sm">
                  No communities found
                </div>
              ) : (
                filteredCommunities.map((comm) => (
                  <div
                    key={comm.community_id}
                    onClick={() => handleSelectCommunity(comm)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl mx-1 cursor-pointer transition hover:bg-slate-100 dark:hover:bg-white/10 ${
                      activeCommunity?.community_id === comm.community_id
                        ? 'bg-teal-50 dark:bg-teal-500/10 border border-teal-500/20'
                        : ''
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{comm.name}</p>
                      <p className="text-xs text-slate-500 dark:text-gray-400">
                        {comm.total_owners ?? 0} members · {comm.license_status || "ACTIVE"}
                      </p>
                    </div>
                    {activeCommunity?.community_id === comm.community_id && (
                      <span className="text-teal-400 font-bold">✓</span>
                    )}
                  </div>
                ))
              )}
            </div>

            <div
              className="mx-3 mt-3 border-t border-slate-200 dark:border-white/10 pt-3 px-4 py-3 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-500/10 rounded-2xl cursor-pointer flex items-center gap-2 text-sm font-medium transition"
              onClick={() => {
                setIsCommDropdownOpen(false);
                setShowAddModal(true);
              }}
            >
              <span className="text-lg">+</span> Add New Community
            </div>
          </div>
        )}
      </div>

      {/* Right Side */}
      <div className="ml-auto flex items-center gap-4">
        {/* Notification */}
        <button
          onClick={toggleNotif}
          className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 relative text-xl transition"
        >
          🔔
          
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 text-xl transition"
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* User Avatar + Dropdown */}
       <div className="relative">
  <div
    className="w-10 h-10 rounded-2xl flex items-center justify-center font-semibold text-white cursor-pointer hover:scale-105 transition-transform overflow-hidden border border-white/30"
    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
  >
    {user?.user_profile_url || user?.photo_url ? (
      <img
        src={
          (user.user_profile_url || user.photo_url).startsWith('http')
            ? user.user_profile_url || user.photo_url
            : `http://127.0.0.1:9999${user.user_profile_url || user.photo_url}`
        }
        alt="Profile"
        className="w-full h-full object-cover"
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.parentElement.innerHTML = user?.initials || "TT";
        }}
      />
    ) : (
      <div className="w-full h-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center font-semibold">
        {user?.initials || "TT"}
      </div>
    )}
  </div>

          {isUserDropdownOpen && (
            <div className="absolute right-0 top-14 w-56 bg-white dark:bg-[#1E3248] border border-slate-200 dark:border-white/20 rounded-3xl shadow-2xl z-50 py-2">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-white/10">
                <p className="font-medium text-gray-900 dark:text-white">{user?.name || "User"}</p>
                <p className="text-xs text-slate-500 dark:text-gray-400">{user?.email}</p>
              </div>

              <div
                onClick={() => {
                  setIsUserDropdownOpen(false);
                  setActivePage('profile');
                }}
                className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer flex items-center gap-3 text-sm transition"
              >
                👤 Profile Settings
              </div>

              <div
                onClick={() => {
                  setIsUserDropdownOpen(false);
                  handleLogout();
                }}
                className="px-4 py-3 hover:bg-red-500/10 text-red-400 cursor-pointer flex items-center gap-3 text-sm transition"
              >
                ⬅️ Logout
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Community Modal */}
      <AddCommunityModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onSuccess={() => window.location.reload()} 
      />
    </header>
  );
};

export default Topbar;