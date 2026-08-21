import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { LogOut, FileText, Trash2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import API from '../../services/api';

const cleanDescription = (desc) => {
  if (!desc) return "";
  let clean = desc;
  clean = clean.replace(/User:\s+([^(]+)\s+\(ID:[^)]+\)/gi, '$1');
  clean = clean.replace(/User:\s+([^(]+)\s+\([^)]+\)/gi, '$1');
  clean = clean.replace(/Service Request\s+(\d+)/gi, 'Service Request #$1');
  clean = clean.replace(/\.?\s*Time\s*\(ET\):.*$/gi, '');
  clean = clean.replace(/\s+->\s+/g, '  ');
  
  // Clean up "unit" references for Single Family compatibility
  clean = clean.replace(/\s*for unit Single Family/gi, '');
  clean = clean.replace(/\s*for unit Condo Unit/gi, '');
  clean = clean.replace(/\s*for unit Entire Property/gi, '');
  clean = clean.replace(/\s*for unit \d+/gi, '');
  clean = clean.replace(/unit change/gi, 'property type details change');
  clean = clean.replace(/Unit 'Single Family' added/gi, 'Property added');
  clean = clean.replace(/Unit 'Condo Unit' added/gi, 'Property added');
  clean = clean.replace(/Unit '[^']+' added/gi, 'Property details added');
  clean = clean.replace(/Unit \d+ soft deleted/gi, 'Property deleted');
  clean = clean.replace(/Unit '[^']+' updated/gi, 'Property details updated');
  
  clean = clean.replace(/\s+/g, ' ');
  return clean.trim();
};

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
import RentalReports from './RentalReports';
import NotifPanel from '../../components/NotifPanel';

// Services
import { getRentalMe } from '../../services/authService';

const RentalAdminPortal = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [properties, setProperties] = useState([]);
  const [selectedPropertyFilterId, setSelectedPropertyFilterId] = useState('all');
  const [leasesList, setLeasesList] = useState([]);

  // Derived: does any property have an occupied (leased) unit?
  const hasOccupiedUnit = properties.some(p =>
    (p.units || []).some(u => u.status === 'OCCUPIED' && u.active_status !== false)
  );
  // Sidebar unlocks as soon as ANY lease exists (don't wait for tenant to sign)
  const hasAnyLease = leasesList.length > 0;

  const currentTab = searchParams.get('tab') || 'dashboard';
  const [activePage, _setActivePage] = useState(currentTab);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Sync tab with browser back/forward buttons
  useEffect(() => {
    if (currentTab !== activePage) {
      _setActivePage(currentTab);
    }
  }, [currentTab]);

  const activePageRef = useRef(activePage);
  useEffect(() => {
    activePageRef.current = activePage;
  }, [activePage]);

  // Push guard state when on dashboard to prevent unmounting when navigating back
  useEffect(() => {
    if (activePage === 'dashboard' && !window.history.state?.isPortalGuard) {
      window.history.pushState({ isPortalGuard: true }, '', '/rental/dashboard');
    }
  }, [activePage]);
  
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
  const [leases, setLeases] = useState([]);

  // Intercept browser back button when on dashboard to show exit confirmation
  useEffect(() => {
    const handlePopState = (e) => {
      if (activePageRef.current === 'dashboard') {
        setShowExitConfirm(true);
        window.history.pushState({ isPortalGuard: true }, '', '/rental/dashboard');
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
    } else {
      setSearchParams({ tab: newPage });
    }
    _setActivePage(newPage);
  };

  const handleBack = () => {
    window.history.back();
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

  const prevNotificationsRef = useRef([]);
  const isFirstFetchRef = useRef(true);

  useEffect(() => {
    if (notifications.length > 0) {
      if (isFirstFetchRef.current) {
        prevNotificationsRef.current = notifications;
        isFirstFetchRef.current = false;
        return;
      }
      
      const prevIds = new Set(prevNotificationsRef.current.map(n => n.audit_id));
      const newNotifs = notifications.filter(n => !prevIds.has(n.audit_id));
      
      newNotifs.forEach(n => {
        const action = n.action || "";
        const desc = n.description || "";
        const isLease = action.includes("LEASE") || (n.module || "").toLowerCase() === "lease";
        const isDelete = action.includes("DELETE") || action.includes("CANCEL");
        
        if (isLease || isDelete) {
          const title = action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          window.alert(`${title}\n\n${cleanDescription(desc)}`);
        }
      });
      
      prevNotificationsRef.current = notifications;
    }
  }, [notifications]);

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

    const handleGlobalUpdate = () => {
      fetchInitialData(true);
    };
    window.addEventListener('rental-data-changed', handleGlobalUpdate);
    return () => {
      window.removeEventListener('rental-data-changed', handleGlobalUpdate);
    };
  }, []);

  useEffect(() => {
    if (user && (user.role === 'landlord' || user.role === 'super_admin')) {
      API.get('/rental/properties')
        .then(res => setProperties(res.data))
        .catch(err => console.error("Sync landlord properties list:", err));
    }
  }, [activePage, user]);

  // Auto-poll every 8s when landlord has NO properties yet → stop once a property is registered
  useEffect(() => {
    if (!user || (user.role !== 'landlord' && user.role !== 'super_admin')) return;
    if (properties.length > 0) return; // already have properties, no need to poll
    const id = setInterval(() => {
      API.get('/rental/properties')
        .then(res => {
          if (res.data && res.data.length > 0) {
            setProperties(res.data);
          }
        })
        .catch(() => {});
    }, 8000);
    return () => clearInterval(id);
  }, [user, properties.length]);

  // Auto-poll every 6s when landlord has properties but NO lease yet → stop once any lease is created
  useEffect(() => {
    if (!user || user.role !== 'landlord') return;
    if (properties.length === 0) return; // wait until property exists
    if (hasAnyLease) return;             // already has a lease, stop polling
    const id = setInterval(() => {
      API.get('/rental/leases')
        .then(res => {
          if (res.data && res.data.length > 0) setLeasesList(res.data);
        })
        .catch(() => {});
    }, 6000);
    return () => clearInterval(id);
  }, [user, properties.length, hasAnyLease]);

  const fetchInitialData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);

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
        user_profile_url: meData.user_profile_url || null,
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
          const [propRes, leasesRes] = await Promise.all([
            API.get('/rental/properties'),
            API.get('/rental/leases'),
          ]);
          setProperties(propRes.data);
          if (leasesRes.data && leasesRes.data.length > 0) setLeasesList(leasesRes.data);
        } catch (propErr) {
          console.error("Failed to load landlord properties/leases at root:", propErr);
        }
      } else if (freshUser.role === 'tenant') {
        try {
          const leaseRes = await API.get('/rental/leases');
          setLeases(leaseRes.data);
          const savedLeaseId = localStorage.getItem('tenant_active_lease_id');
          let activeLease = null;
          if (savedLeaseId) {
            activeLease = leaseRes.data.find(l => String(l.lease_id) === String(savedLeaseId));
          }
          if (!activeLease) {
            activeLease = leaseRes.data.find(l => l.status === 'ACTIVE') || leaseRes.data[0];
          }
          if (activeLease) {
            localStorage.setItem('tenant_active_lease_id', String(activeLease.lease_id));
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

  const handlePropertiesChange = (newProperties) => {
    if (newProperties) {
      setProperties(newProperties);
    } else {
      API.get('/rental/properties')
        .then(res => setProperties(res.data))
        .catch(err => console.error("Sync landlord properties list:", err));
    }
  };

  const renderPage = () => {
    if (loading) return null;

    const role = (user?.role || 'tenant').toLowerCase();

    // Landlord onboarding flow locking
    if (role === 'landlord') {
      // Case 1: No properties registered yet -> Force show Property Creation Wizard inline
      if (properties.length === 0) {
        return (
          <PropertiesHub 
            user={user} 
            selectedPropertyFilterId={selectedPropertyFilterId} 
            setSelectedPropertyFilterId={setSelectedPropertyFilterId} 
            properties={properties} 
            setActivePage={setActivePage} 
            onPropertiesChange={handlePropertiesChange}
            leases={leasesList}
          />
        );
      }

      // Case 2: Properties exist, but no tenant is active yet (no occupied units) → Force onboarding setup screen (PropertiesHub)
      if (!hasOccupiedUnit) {
        if (activePage === 'leases_hub') {
          return <LeasesHub user={user} selectedPropertyFilterId={selectedPropertyFilterId} initialShowCreate={leasesList.length === 0} onLeaseCreated={(leases) => setLeasesList(leases || [])} />;
        }
        if (activePage === 'profile') {
          return <RentalProfile user={user} setUser={setUser} viewRole={role} />;
        }
        // Force properties setup hub content to act as Dashboard
        return (
          <PropertiesHub 
            user={user} 
            selectedPropertyFilterId={selectedPropertyFilterId} 
            setSelectedPropertyFilterId={setSelectedPropertyFilterId} 
            properties={properties} 
            setActivePage={setActivePage} 
            onPropertiesChange={handlePropertiesChange}
            leases={leasesList}
          />
        );
      }
    }

    switch (activePage) {
      case 'dashboard':
        if (role === 'super_admin') return <SuperAdminDashboard user={user} setActivePage={setActivePage} />;
        if (role === 'landlord') return <LandlordDashboard user={user} setActivePage={setActivePage} selectedPropertyFilterId={selectedPropertyFilterId} setSelectedPropertyFilterId={setSelectedPropertyFilterId} properties={properties} />;
        return <TenantDashboard user={user} setUser={setUser} setActivePage={setActivePage} />;

      case 'properties_hub':
        return <PropertiesHub user={user} selectedPropertyFilterId={selectedPropertyFilterId} setSelectedPropertyFilterId={setSelectedPropertyFilterId} properties={properties} setActivePage={setActivePage} onPropertiesChange={handlePropertiesChange} />;

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

      case 'reports':
        return <RentalReports user={user} selectedPropertyFilterId={selectedPropertyFilterId} setActivePage={setActivePage} />;

      default:
        if (role === 'super_admin') return <SuperAdminDashboard user={user} setActivePage={setActivePage} />;
        if (role === 'landlord') return <LandlordDashboard user={user} setActivePage={setActivePage} selectedPropertyFilterId={selectedPropertyFilterId} setSelectedPropertyFilterId={setSelectedPropertyFilterId} properties={properties} />;
        return <TenantDashboard user={user} setUser={setUser} setActivePage={setActivePage} />;
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
        properties={properties}
        hasLease={
          (user?.role || 'tenant').toLowerCase() === 'landlord' || (user?.role || 'tenant').toLowerCase() === 'super_admin'
            ? hasOccupiedUnit
            : leases.some(l => l.status === 'ACTIVE')
        }
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
          leases={leases}
          onTenantLeaseSwitch={(selectedId) => {
            const selected = leases.find(l => l.lease_id === selectedId);
            if (selected) {
              localStorage.setItem('tenant_active_lease_id', String(selected.lease_id));
              setUser(prevUser => {
                const updatedUser = {
                  ...prevUser,
                  property_name: selected.property_name || (selected.unit && selected.unit.property ? selected.unit.property.name : selected.property?.name || null),
                  unit_number: selected.unit ? selected.unit.unit_number : null,
                  property_type: selected.unit ? selected.unit.property_type : null
                };
                try {
                  localStorage.setItem('rental_user', JSON.stringify(updatedUser));
                } catch (_) {}
                return updatedUser;
              });
            }
          }}
        />

        <main className="flex-1 overflow-auto p-5 lg:p-7 bg-slate-50 dark:bg-[#0D1B2A] custom-scrollbar">
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
