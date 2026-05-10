import React from 'react';

const Sidebar = ({
  activePage,
  setActivePage,
  isOpen,
  setIsOpen,
  user
}) => {

  const navItems = [
    { id: 'overview', label: 'All Communities', icon: '🌐' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'members', label: 'Members', icon: '👥', badge: '' },
    { id: 'violations', label: 'Violations', icon: '⚠️', badge: '', badgeColor: 'red' },
    { id: 'servicereq', label: 'Service Requests', icon: '🔧' },
    { id: 'payments', label: 'Payments', icon: '💰' },
    { id: 'amenities', label: 'Amenities', icon: '🏠' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'faqs', label: 'FAQs', icon: '❓' },
    { id: 'vendors', label: 'Vendors', icon: '🛠️' },
    { id: 'news', label: 'News & Updates', icon: '📢' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-[#162535] border-r border-white/10 z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 overflow-hidden flex flex-col`}>

        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <div className="logo-mark w-8 h-8 bg-teal rounded-xl flex items-center justify-center text-white font-bold text-lg">VH</div>
          <span className="ml-3 text-2xl font-semibold tracking-tight">V<span className="text-teal">HOAS</span></span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <div className="nav-label px-3 mb-2">OVERVIEW</div>
            {navItems.map(item => (
              <div
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  setIsOpen(false);
                }}
                className={`nav-item flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-sm transition-all ${
                  activePage === item.id 
                    ? 'bg-teal/10 text-teal-light' 
                    : 'hover:bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-medium ${item.badgeColor === 'red' ? 'bg-red-500 text-white' : 'bg-teal text-white'}`}>
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div>
            <div className="nav-label px-3 mb-2">ADMIN</div>
            <div
              onClick={() => { setActivePage('profile'); setIsOpen(false); }}
              className={`nav-item flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-sm transition-all ${activePage === 'profile' ? 'bg-teal/10 text-teal-light' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
            >
              👤 Profile Settings
            </div>
            <div
              onClick={() => { setActivePage('settings'); setIsOpen(false); }}
              className={`nav-item flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-sm transition-all ${activePage === 'settings' ? 'bg-teal/10 text-teal-light' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
            >
              ⚙️ Settings
            </div>
            <div
              onClick={() => { setActivePage('audit'); setIsOpen(false); }}
              className={`nav-item flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-sm transition-all ${activePage === 'audit' ? 'bg-teal/10 text-teal-light' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
            >
              📋 Audit History
            </div>
          </div>
        </nav>

        {/* Footer - User Info */}
        <div className="sidebar-footer p-4 border-t border-white/10">
          <div className="admin-chip bg-[#1E3248] p-3 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-white/5" onClick={() => setActivePage('profile')}>
            <div className="avatar w-9 h-9 bg-gradient-to-br from-teal to-blue-500 rounded-2xl flex items-center justify-center font-semibold">
              {user?.initials || "RA"}
            </div>
            <div className="admin-info">
              <div className="admin-name text-sm font-medium">{user?.name || "Robert Ashford"}</div>
              <div className="admin-role text-xs text-gray-400">{user?.role || "HOA Admin"}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;