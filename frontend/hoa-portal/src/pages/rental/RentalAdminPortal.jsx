import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { LogOut } from 'lucide-react';
import API from '../../services/api';

// Layout Components
import RentalSidebar from '../../components/rental/RentalSidebar';
import RentalTopbar from '../../components/rental/RentalTopbar';

// Page Components
import LandlordDashboard from './LandlordDashboard';
import SuperAdminDashboard from './SuperAdminDashboard';
import TenantDashboard from './TenantDashboard';
import PropertiesHub from './PropertiesHub';
import ScreeningHub from './ScreeningHub';
import LeasesHub from './LeasesHub';
import RentLedger from './RentLedger';
import RentalMaintenanceDesk from './RentalMaintenanceDesk';
import RentalVendors from './RentalVendors';
import RentalProfile from './RentalProfile';
import RentalAuditHistory from './RentalAuditHistory';
import TenantsHub from './TenantsHub';
import NotifPanel from '../../components/NotifPanel';

// Services
import { getRentalMe } from '../../services/authService';

const RentalAdminPortal = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [properties, setProperties] = useState([]);
  const [selectedPropertyFilterId, setSelectedPropertyFilterId] = useState('all');

  const currentTab = searchParams.get('tab') || 'dashboard';
  const [activePage, _setActivePage] = useState(currentTab);
  const [pageHistory, setPageHistory] = useState([currentTab]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Sync tab with browser back/forward buttons
  useEffect(() => {
    if (currentTab !== activePage) {
      _setActivePage(currentTab);
      setPageHistory(prev => {
        if (prev[prev.length - 1] === currentTab) return prev;
        return [...prev, currentTab];
      });
    }
  }, [currentTab]);
  
  // Notification states
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [lastReadTimestamp, setLastReadTimestamp] = useState(() => {
    return Number(localStorage.getItem('rental_last_read_notifications') || 0);
  });
  const [badgeClearedTimestamp, setBadgeClearedTimestamp] = useState(() => {
    return Number(localStorage.getItem('rental_last_read_notifications') || 0);
  });
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('rental_read_notification_ids') || '[]');
    } catch (_) {
      return [];
    }
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Intercept Chrome browser back button when on main dashboard page to ask confirmation before exiting
  useEffect(() => {
    window.history.pushState({ isPortalGuard: true }, '', window.location.href);

    const handlePopState = (e) => {
      const currentQueryTab = new URLSearchParams(window.location.search).get('tab');
      if (!currentQueryTab || currentQueryTab === 'dashboard') {
        setShowExitConfirm(true);
        window.history.pushState({ isPortalGuard: true }, '', window.location.href);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const setActivePage = (newPage) => {
    if (newPage === activePage) return;
    if (newPage === 'dashboard') {
      setSearchParams({});
      setPageHistory(['dashboard']);
    } else {
      setSearchParams({ tab: newPage });
      setPageHistory(prev => {
        if (prev[prev.length - 1] === newPage) return prev;
        return [...prev, newPage];
      });
    }
    _setActivePage(newPage);
  };

  const handleBack = () => {
    if (activePage !== 'dashboard') {
      if (pageHistory.length > 1) {
        const newHistory = [...pageHistory];
        newHistory.pop();
        const prevPage = newHistory[newHistory.length - 1] || 'dashboard';
        setPageHistory(newHistory.length > 0 ? newHistory : ['dashboard']);
        setSearchParams(prevPage === 'dashboard' ? {} : { tab: prevPage });
        _setActivePage(prevPage);
      } else {
        setPageHistory(['dashboard']);
        setSearchParams({});
        _setActivePage('dashboard');
      }
    } else {
      setShowExitConfirm(true);
    }
  };

  const handleConfirmExitLogout = () => {
    const keys = ['rental_token', 'rental_session_token', 'rental_user'];
    keys.forEach(k => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
    window.location.href = '/rental/login';
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      let res;
      if (user.role === 'landlord' || user.role === 'super_admin') {
        res = await API.get('/rental/audit?limit=20');
      } else {
        res = await API.get('/rental/audit/my?limit=20');
      }
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Failed to fetch rental notifications:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => 
    new Date(n.created_at).getTime() > badgeClearedTimestamp &&
    !readNotificationIds.includes(n.audit_id)
  ).length;

  const getReadThresholdTimestamp = () => {
    let threshold = Date.now();
    if (notifications.length > 0) {
      const times = notifications.map(n => new Date(n.created_at).getTime()).filter(t => !isNaN(t));
      if (times.length > 0) {
        threshold = Math.max(threshold, ...times) + 1000;
      }
    }
    return threshold;
  };

  const handleToggleNotif = () => {
    const nextState = !isNotifOpen;
    setIsNotifOpen(nextState);
    if (nextState) {
      setBadgeClearedTimestamp(Date.now());
    } else {
      const threshold = getReadThresholdTimestamp();
      localStorage.setItem('rental_last_read_notifications', String(threshold));
      setLastReadTimestamp(threshold);
      setBadgeClearedTimestamp(threshold);
      localStorage.setItem('rental_read_notification_ids', '[]');
      setReadNotificationIds([]);
    }
  };

  const handleNotifClick = (log) => {
    if (!log) return;
    const currentReadIds = [...readNotificationIds];
    if (!currentReadIds.includes(log.audit_id)) {
      currentReadIds.push(log.audit_id);
      localStorage.setItem('rental_read_notification_ids', JSON.stringify(currentReadIds));
      setReadNotificationIds(currentReadIds);
    }
    const module = log.module || "";
    if (module === 'service_request') {
      setActivePage('servicereq');
    } else if (module === 'payment') {
      setActivePage('rent_ledger');
    } else if (module === 'community') {
      setActivePage('properties_hub');
    }
    setIsNotifOpen(false);
  };

  const handleMarkAllRead = () => {
    const threshold = getReadThresholdTimestamp();
    localStorage.setItem('rental_last_read_notifications', String(threshold));
    setLastReadTimestamp(threshold);
    setBadgeClearedTimestamp(threshold);
    localStorage.setItem('rental_read_notification_ids', '[]');
    setReadNotificationIds([]);
    setIsNotifOpen(false);
  };



  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      const rawUser = localStorage.getItem('rental_user') || sessionStorage.getItem('rental_user');
      let cachedUser = null;
      if (rawUser && rawUser !== 'undefined' && rawUser !== 'null') {
        try { cachedUser = JSON.parse(rawUser); } catch (_) {}
      }

      const meData = await getRentalMe();
      const roleStr = (meData.role_name || meData.role || '').toLowerCase();
      let defaultRoleId = 8;
      if (roleStr === 'landlord') defaultRoleId = 7;
      else if (roleStr === 'super_admin') defaultRoleId = 1;

      const userRoleId = Number(meData.role_id || defaultRoleId);
      let mappedRole = roleStr;
      if (roleStr !== 'landlord' && roleStr !== 'super_admin' && roleStr !== 'tenant') {
        mappedRole = 'tenant';
      }

      const freshUser = {
        ...meData,
        user_profile_url: meData.user_profile_url || cachedUser?.user_profile_url || null,
        initials: `${meData.first_name?.[0] || 'U'}${meData.last_name?.[0] || 'R'}`.toUpperCase(),
        name: meData.full_name || `${meData.first_name} ${meData.last_name}`,
        email: meData.email_id,
        role_id: userRoleId,
        role: mappedRole,
      };

      setUser(freshUser);
      try {
        localStorage.setItem('rental_user', JSON.stringify(freshUser));
      } catch (_) {}

      if (freshUser.role === 'landlord' || freshUser.role === 'super_admin') {
        try {
          const propRes = await API.get('/rental/properties');
          setProperties(propRes.data);
        } catch (propErr) {
          console.error("Failed to load landlord properties list at root:", propErr);
        }
      } else if (freshUser.role === 'tenant') {
        try {
          const leaseRes = await API.get('/rental/leases');
          const activeLease = leaseRes.data.find(l => l.status === 'ACTIVE') || leaseRes.data[0];
          if (activeLease) {
            const updatedUser = {
              ...freshUser,
              property_name: activeLease.property_name || (activeLease.unit && activeLease.unit.property ? activeLease.unit.property.name : null),
              unit_number: activeLease.unit ? activeLease.unit.unit_number : null
            };
            setUser(updatedUser);
            try {
              localStorage.setItem('rental_user', JSON.stringify(updatedUser));
            } catch (_) {}
          }
        } catch (leaseErr) {
          console.error("Failed to load tenant lease at root:", leaseErr);
        }
      }

    } catch (err) {
      console.error('Failed to parse database records in initial stream:', err);
      // Redirect to login if user cannot be loaded
      navigate('/rental/login');
    } finally {
      setLoading(false);
    }
  };

  const renderPage = () => {
    if (loading) return null;

    const role = (user?.role || 'tenant').toLowerCase();

    switch (activePage) {
      case 'dashboard':
        if (role === 'super_admin') return <SuperAdminDashboard user={user} setActivePage={setActivePage} />;
        if (role === 'landlord') return <LandlordDashboard user={user} setActivePage={setActivePage} selectedPropertyFilterId={selectedPropertyFilterId} setSelectedPropertyFilterId={setSelectedPropertyFilterId} properties={properties} />;
        return <TenantDashboard user={user} setActivePage={setActivePage} />;

      case 'properties_hub':
        return <PropertiesHub user={user} selectedPropertyFilterId={selectedPropertyFilterId} setSelectedPropertyFilterId={setSelectedPropertyFilterId} properties={properties} />;

      case 'screening_hub':
        return <ScreeningHub user={user} setActivePage={setActivePage} selectedPropertyFilterId={selectedPropertyFilterId} />;

      case 'leases_hub':
        return <LeasesHub user={user} selectedPropertyFilterId={selectedPropertyFilterId} />;

      case 'tenants_hub':
        return <TenantsHub user={user} selectedPropertyFilterId={selectedPropertyFilterId} />;

      case 'rent_ledger':
        return <RentLedger user={user} selectedPropertyFilterId={selectedPropertyFilterId} />;

      case 'servicereq':
        return <RentalMaintenanceDesk user={user} selectedPropertyFilterId={selectedPropertyFilterId} />;

      case 'vendors_hub':
        return <RentalVendors user={user} />;

      case 'profile':
        return <RentalProfile user={user} setUser={setUser} viewRole={role} />;

      case 'audit':
        return <RentalAuditHistory user={user} />;

      default:
        if (role === 'super_admin') return <SuperAdminDashboard user={user} setActivePage={setActivePage} />;
        if (role === 'landlord') return <LandlordDashboard user={user} setActivePage={setActivePage} selectedPropertyFilterId={selectedPropertyFilterId} setSelectedPropertyFilterId={setSelectedPropertyFilterId} properties={properties} />;
        return <TenantDashboard user={user} setActivePage={setActivePage} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-[#0D1B2A]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="dark:text-gray-400 text-gray-500 font-mono">LOADING PORTAL...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-[#0D1B2A] text-gray-900 dark:text-white overflow-hidden font-sans">
      <RentalSidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        user={user}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <RentalTopbar
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          user={user}
          setActivePage={setActivePage}
          canGoBack={true}
          onBack={handleBack}
          properties={properties}
          selectedPropertyFilterId={selectedPropertyFilterId}
          setSelectedPropertyFilterId={setSelectedPropertyFilterId}
          unreadCount={unreadCount}
          toggleNotif={handleToggleNotif}
        />

        <main className="flex-1 overflow-auto p-5 lg:p-7 bg-white dark:bg-[#0D1B2A] custom-scrollbar">
          <div className="max-w-[1600px] mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>

      <NotifPanel
        isOpen={isNotifOpen}
        onClose={handleToggleNotif}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
        lastReadTimestamp={lastReadTimestamp}
        readNotificationIds={readNotificationIds}
        onNotifClick={handleNotifClick}
      />

      {/* Confirmation Modal when exiting portal via Back navigation */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-gradient-to-br dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl text-slate-900 dark:text-white">
            <div className="w-14 h-14 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <LogOut size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Confirm Exit & Logout</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-6 leading-relaxed">
              Are you sure you want to log out and return to the main website / sign in page?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-3 px-4 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-gray-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmExitLogout}
                className="flex-1 py-3 px-4 rounded-2xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/25 transition cursor-pointer"
              >
                Yes, Logout & Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentalAdminPortal;
