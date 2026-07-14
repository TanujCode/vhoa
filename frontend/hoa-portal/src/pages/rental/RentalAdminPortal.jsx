import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

// Layout Components
import RentalSidebar from '../../components/rental/RentalSidebar';
import RentalTopbar from '../../components/rental/RentalTopbar';

// Page Components
import LandlordDashboard from './LandlordDashboard';
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

// Services
import { getRentalMe } from '../../services/authService';

const RentalAdminPortal = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [activePage, _setActivePage] = useState('dashboard');
  const [pageHistory, setPageHistory] = useState(['dashboard']);

  const setActivePage = (newPage) => {
    if (newPage === activePage) return;
    if (newPage === 'dashboard') {
      setPageHistory(['dashboard']);
    } else {
      setPageHistory(prev => {
        if (prev[prev.length - 1] === newPage) return prev;
        return [...prev, newPage];
      });
    }
    _setActivePage(newPage);
  };

  const handleBack = () => {
    if (pageHistory.length > 1) {
      const newHistory = [...pageHistory];
      newHistory.pop();
      const prevPage = newHistory[newHistory.length - 1];
      setPageHistory(newHistory);
      _setActivePage(prevPage);
    } else {
      _setActivePage('dashboard');
      setPageHistory(['dashboard']);
    }
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

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
      let defaultRoleId = roleStr === 'landlord' ? 7 : 8;

      const userRoleId = Number(meData.role_id || defaultRoleId);
      let mappedRole = roleStr === 'landlord' ? 'landlord' : 'tenant';

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
        if (role === 'landlord') return <LandlordDashboard user={user} setActivePage={setActivePage} />;
        return <TenantDashboard user={user} setActivePage={setActivePage} />;

      case 'properties_hub':
        return <PropertiesHub user={user} />;

      case 'screening_hub':
        return <ScreeningHub user={user} setActivePage={setActivePage} />;

      case 'leases_hub':
        return <LeasesHub user={user} />;

      case 'tenants_hub':
        return <TenantsHub user={user} />;

      case 'rent_ledger':
        return <RentLedger user={user} />;

      case 'servicereq':
        return <RentalMaintenanceDesk user={user} />;

      case 'vendors_hub':
        return <RentalVendors user={user} />;

      case 'profile':
        return <RentalProfile user={user} setUser={setUser} viewRole={role} />;

      case 'audit':
        return <RentalAuditHistory user={user} />;

      default:
        if (role === 'landlord') return <LandlordDashboard user={user} setActivePage={setActivePage} />;
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
          canGoBack={pageHistory.length > 1}
          onBack={handleBack}
        />

        <main className="flex-1 overflow-auto p-5 lg:p-7 bg-white dark:bg-[#0D1B2A] custom-scrollbar">
          <div className="max-w-[1600px] mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default RentalAdminPortal;
