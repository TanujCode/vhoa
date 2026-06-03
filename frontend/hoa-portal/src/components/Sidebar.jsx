import React from 'react';
import { 
  Globe, Layout, Users, AlertTriangle, Wrench, 
  CreditCard, Home, FileText, HelpCircle, 
  Settings, Megaphone, User, ShieldAlert, Truck,
  ClipboardList, Info, Building2
} from 'lucide-react';
import { getBaseUrl } from '../services/api';

const Sidebar = ({ activePage, setActivePage, isOpen, setIsOpen, user, userRole: propRole, activeCommunity }) => {
  const userRole = propRole || user?.role || 'resident';

  const getProfileImage = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return getBaseUrl(url.startsWith('/') ? url : '/' + url);
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  // 1. Admin/Manager Menu (Complete List)
  let adminNavItems = [
    { id: 'overview', label: 'All Communities', icon: Globe },
    { id: 'dashboard', label: 'Dashboard', icon: Layout },
    { id: 'contracts', label: 'Manage Contracts', icon: FileText },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'violations', label: 'Violations', icon: AlertTriangle, badge: '', badgeColor: 'red' },
    { id: 'servicereq', label: 'Service Requests', icon: Wrench },
    { id: 'vendors', label: 'Vendors', icon: Truck },
    { id: 'amenities', label: 'Manage Amenities', icon: Building2 },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'reports', label: 'Reports', icon: ClipboardList },
    { id: 'meetings', label: 'Meetings & Surveys', icon: ClipboardList },
    { id: 'news', label: 'News & Announcements', icon: Megaphone },
  ];

  // Board members should not see 'All Communities' or 'Manage Contracts'
  if (userRole === 'board_member') {
    adminNavItems = adminNavItems.filter(item => item.id !== 'overview' && item.id !== 'contracts');
  }

  // Property managers do not see 'Manage Contracts'
  if (userRole === 'property_manager') {
    adminNavItems = adminNavItems.filter(item => item.id !== 'contracts');
  }
  
  // 2. Resident Menu (Complete List)
  const residentNavItems = [
    { id: 'dashboard', label: 'My Portal', icon: Home },
    { id: 'payments', label: 'My Payments', icon: CreditCard },
    { id: 'servicereq', label: 'New Request', icon: Wrench },
    { id: 'violations', label: 'My Violations', icon: ShieldAlert },
    { id: 'amenities', label: 'Book Amenities', icon: Building2 },
    { id: 'vendors', label: 'Approved Vendors', icon: Truck },
    { id: 'documents', label: 'HOA Documents', icon: FileText },
    { id: 'meetings', label: 'Meetings & Surveys', icon: ClipboardList },
    { id: 'news', label: 'News & Updates', icon: Megaphone },
  ];

  // 3. Sales Admin Menu
  const salesNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layout },
    { id: 'contracts', label: 'Manage Contracts', icon: FileText },
  ];

  const visibleTabs = activeCommunity?.visible_tabs || {};
  const tabMapping = {
    payments: 'payments',
    servicereq: 'service_requests',
    violations: 'violations',
    amenities: 'amenity_booking',
    documents: 'documents',
    news: 'news'
  };

  let navItems = adminNavItems;
  if (userRole === 'resident') {
    navItems = residentNavItems.filter(item => {
      const settingKey = tabMapping[item.id];
      if (settingKey && visibleTabs[settingKey] === false) {
        return false;
      }
      return true;
    });
  } else if (userRole === 'sales_admin') {
    navItems = salesNavItems;
  }

  const getNavItemClass = (itemId) => {
    const isActive = activePage === itemId;
    if (isActive) {
      return "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-sm font-medium transition-all bg-white dark:bg-[#1D9E75]/10 text-sky-700 dark:text-[#25C490] border-l-4 border-sky-500 dark:border-[#1D9E75] shadow-sm dark:shadow-none";
    }
    return "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-sm font-medium transition-all border-l-4 border-transparent text-slate-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-sky-700 dark:hover:text-white";
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-[#E3F2FD] dark:bg-[#162535] border-r border-slate-200/60 dark:border-white/10 z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 overflow-hidden flex flex-col`}>
        
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200/60 dark:border-white/10">
          <div className="logo-mark w-8 h-8 bg-[#1D9E75] rounded-xl flex items-center justify-center text-white font-bold text-lg">VH</div>
          <span className="ml-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">V<span className="text-[#1D9E75]">HOAS</span></span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          
          {/* Main Section */}
          <div>
            <div className="text-[10px] font-bold text-slate-500 dark:text-gray-500 tracking-widest px-3 mb-4 uppercase">
              Main Menu
            </div>
            <div className="space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => { setActivePage(item.id); setIsOpen(false); }}
                    className={getNavItemClass(item.id)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-500/20 text-red-400">
                        {item.badge}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* System & Support Section */}
          <div>
            <div className="text-[10px] font-bold text-slate-500 dark:text-gray-500 tracking-widest px-3 mb-4 uppercase">System</div>
            <div className="space-y-1">
              <div
                onClick={() => { setActivePage('profile'); setIsOpen(false); }}
                className={getNavItemClass('profile')}
              >
                <User size={18} /> My Profile
              </div>

              {/* Audit History */}
              {userRole !== 'resident' && userRole !== 'sales_admin' && (
                <div
                  onClick={() => { setActivePage('audit'); setIsOpen(false); }}
                  className={getNavItemClass('audit')}
                >
                  <ClipboardList size={18} /> Audit History
                </div>
              )}

              {userRole !== 'resident' && userRole !== 'sales_admin' && (
                <div
                  onClick={() => { setActivePage('settings'); setIsOpen(false); }}
                  className={getNavItemClass('settings')}
                >
                  <Settings size={18} /> HOA Settings
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-200/60 dark:border-white/10">
          <div className="bg-white/60 dark:bg-[#1E3248] p-3 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-white/80 dark:hover:bg-white/10 transition-colors" onClick={() => setActivePage('profile')}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white transition-all overflow-hidden border border-white/10 bg-gradient-to-br from-teal-500 to-blue-600 shadow-md flex-shrink-0">
              {user?.user_profile_url ? (
                <img 
                  src={getProfileImage(user.user_profile_url)} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `<span class="text-sm">${getInitials(user?.full_name || user?.name)}</span>`;
                  }}
                />
              ) : (
                <span className="text-sm">{getInitials(user?.full_name || user?.name)}</span>
              )}
            </div>
            <div className="overflow-hidden text-slate-900 dark:text-white">
              <div className="text-sm font-medium truncate">{user?.full_name || user?.name || "User"}</div>
              <div className="text-[10px] text-teal-600 dark:text-[#1D9E75] font-mono uppercase tracking-tighter">
                {userRole.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;