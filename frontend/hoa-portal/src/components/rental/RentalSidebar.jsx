import React from 'react';
import { 
  Globe, Layout, Users, Wrench, 
  CreditCard, Home, FileText, ClipboardList,
  User, Settings, Truck, BarChart2
} from 'lucide-react';
import { getBaseUrl } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../marketing/Logo';

const RentalSidebar = ({ activePage, setActivePage, isOpen, setIsOpen, user, properties = [], hasLease = false }) => {
  const userRole = (user?.role_name || user?.role || 'tenant').toLowerCase();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const getProfileImage = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return getBaseUrl(url.startsWith('/') ? url : '/' + url);
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  // Super Admin Menu
  const superAdminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layout },
    { id: 'properties_hub', label: 'All Properties & Units', icon: Globe },
    { id: 'leases_hub', label: 'Lease Agreements', icon: FileText },
    { id: 'tenants_hub', label: 'Tenants Directory', icon: Users },
    { id: 'rent_ledger', label: 'Payments Ledger', icon: CreditCard },
    { id: 'servicereq', label: 'Maintenance Desk', icon: Wrench },
    { id: 'vendors_hub', label: 'Contractors / Vendors', icon: Truck },
    { id: 'reports', label: 'Reports', icon: BarChart2 },
  ];

  // Landlord Menu
  const landlordNavItems = [
    { id: 'dashboard', label: 'Landlord Dashboard', icon: Layout },
    { id: 'properties_hub', label: 'Properties & Units', icon: Globe },
    { id: 'leases_hub', label: 'Lease Agreements', icon: FileText },
    { id: 'tenants_hub', label: 'Tenants', icon: Users },
    { id: 'rent_ledger', label: 'Payments Ledger', icon: CreditCard },
    { id: 'servicereq', label: 'Maintenance Desk', icon: Wrench },
    { id: 'vendors_hub', label: 'Contractors / Vendors', icon: Truck },
    { id: 'reports', label: 'Reports', icon: BarChart2 },
  ];

  // Tenant Menu
  const tenantNavItems = [
    { id: 'dashboard', label: 'My Rental Portal', icon: Home },
    { id: 'leases_hub', label: 'My Lease Agreement', icon: FileText },
    { id: 'rent_ledger', label: 'Pay Rent Ledger', icon: CreditCard },
    { id: 'servicereq', label: 'Maintenance Request', icon: Wrench },
  ];

  const hasNoProperties = (userRole === 'landlord' || userRole === 'super_admin') && properties.length === 0;

  // When landlord has properties but no lease created yet, show limited sidebar
  const isLandlordNoLease = userRole === 'landlord' && properties.length > 0 && !hasLease;

  let navItems = tenantNavItems;
  if (userRole === 'super_admin') {
    navItems = hasNoProperties ? superAdminNavItems.filter(item => item.id === 'dashboard') : superAdminNavItems;
  } else if (userRole === 'landlord') {
    if (hasNoProperties) {
      navItems = landlordNavItems.filter(item => item.id === 'dashboard');
    } else if (isLandlordNoLease) {
      // Only show Dashboard + Lease Agreements until a lease is created
      navItems = landlordNavItems.filter(item => item.id === 'dashboard' || item.id === 'leases_hub');
    } else {
      navItems = landlordNavItems;
    }
  }

  const getNavItemClass = (itemId) => {
    const isActive = activePage === itemId;
    if (isActive) {
      return "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-sm font-medium transition-all bg-white dark:bg-[#1D68DF]/10 text-sky-700 dark:text-[#5BA4F5] border-l-4 border-sky-500 dark:border-[#1D68DF] shadow-sm dark:shadow-none";
    }
    return "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-sm font-medium transition-all border-l-4 border-transparent text-slate-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-sky-700 dark:hover:text-white";
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-[#E3F2FD] dark:bg-[#162535] border-r border-slate-200/60 dark:border-white/10 z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 overflow-hidden flex flex-col shrink-0`}>
        
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-slate-200/60 dark:border-white/10">
          <Logo variant={isDark ? "dark" : "light"} className="h-9 w-auto" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
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
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-slate-500 dark:text-gray-500 tracking-widest px-3 mb-4 uppercase">System</div>
            <div className="space-y-1">
              <div
                onClick={() => { setActivePage('profile'); setIsOpen(false); }}
                className={getNavItemClass('profile')}
              >
                <User size={18} /> My Profile
              </div>

              {(userRole === 'landlord' || userRole === 'super_admin') && !hasNoProperties && !isLandlordNoLease && (
                <div
                  onClick={() => { setActivePage('audit'); setIsOpen(false); }}
                  className={getNavItemClass('audit')}
                >
                  <ClipboardList size={18} /> Audit History
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-200/60 dark:border-white/10">
          <div className="bg-white/60 dark:bg-[#1E3248] p-3 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-white/80 dark:hover:bg-white/10 transition-colors" onClick={() => setActivePage('profile')}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white transition-all overflow-hidden border border-white/10 bg-gradient-to-br from-blue-500 to-blue-600 shadow-md flex-shrink-0">
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
              <div className="text-[10px] text-blue-600 dark:text-[#5BA4F5] font-mono uppercase tracking-tighter">
                {userRole}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default RentalSidebar;
