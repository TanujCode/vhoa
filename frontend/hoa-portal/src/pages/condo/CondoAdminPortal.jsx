import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LogOut, Building2, Users, FileText, Wrench, CreditCard, ParkingSquare, Key, Package, User } from 'lucide-react';
import API from '../../services/api';
import CondoSidebar from '../../components/condo/CondoSidebar';
import CondoTopbar from '../../components/condo/CondoTopbar';

// Dashboards
import CondoSuperAdminDashboard from './CondoSuperAdminDashboard';
import CondoPropertyManagerDashboard from './CondoPropertyManagerDashboard';
import CondoBoardDashboard from './CondoBoardDashboard';
import CondoResidentDashboard from './CondoResidentDashboard';
import CondoContracts from './CondoContracts';
import Profile from '../Profile';
import CondoMembers from './CondoMembers';
import CondoDocuments from './CondoDocuments';
import CondoServiceRequests from './CondoServiceRequests';
import CondoPayments from './CondoPayments';
import CondoParking from './CondoParking';
import CondoVisitors from './CondoVisitors';
import CondoParcels from './CondoParcels';
import CondoVendors from './CondoVendors';
import CondoSecurityDashboard from './CondoSecurityDashboard';

export default function CondoAdminPortal() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get('tab') || 'dashboard';
  const [activePage, _setActivePage] = useState(currentTab);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState('all');

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
      window.history.pushState({ isPortalGuard: true }, '', '/condo/dashboard');
    }
  }, [activePage]);

  // Intercept browser back button when on dashboard to show exit confirmation
  useEffect(() => {
    const handlePopState = (e) => {
      if (activePageRef.current === 'dashboard') {
        setShowExitConfirm(true);
        window.history.pushState({ isPortalGuard: true }, '', '/condo/dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      const meRes = await API.get('/condo/auth/me');
      const meData = meRes.data;

      const roleStr = (meData.role_name || meData.role || '').toLowerCase();
      let defaultRoleId = 4;
      if (roleStr === 'property_manager') defaultRoleId = 2;
      else if (roleStr === 'board_member') defaultRoleId = 3;
      else if (roleStr === 'super_admin') defaultRoleId = 1;
      else if (roleStr === 'security_guard' || roleStr === 'front_desk_concierge') defaultRoleId = 9;

      const freshUser = {
        ...meData,
        name: meData.full_name || `${meData.first_name} ${meData.last_name}`,
        email: meData.email_id,
        role_id: defaultRoleId,
        role: roleStr || 'resident',
      };

      setUser(freshUser);
      localStorage.setItem('condo_user', JSON.stringify(freshUser));

      // Guard check: unassigned manual residents
      if (freshUser.role === 'resident' && (!freshUser.community_id || freshUser.community_id === 0)) {
        if (freshUser.account_status === 'PENDING_APPROVAL') {
          navigate('/condo/waiting-approval');
        } else {
          navigate('/condo/join-community');
        }
        return;
      }

      // If Super Admin, fetch all condo buildings/communities
      if (freshUser.role === 'super_admin') {
        const commsRes = await API.get('/condo/community');
        setCommunities(commsRes.data || []);
      }

    } catch (err) {
      console.error("Condo Portal Initialization Failed:", err);
      navigate('/condo/login');
    } finally {
      setLoading(false);
    }
  };

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
    const keys = ['condo_token', 'condo_session_token', 'condo_user'];
    keys.forEach(k => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
    window.location.href = '/condo/login';
  };

  const renderPlaceholder = (title, description, Icon) => {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-16 text-center text-slate-800 dark:text-white min-h-[50vh] bg-white dark:bg-[#162535] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm font-sans">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-4">
          <Icon size={32} />
        </div>
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className="text-sm text-slate-500 max-w-sm leading-relaxed">{description}</p>
      </div>
    );
  };

  const renderPage = () => {
    if (loading || !user) return null;

    const role = user.role.toLowerCase();

    // Resolve active community context
    let activeCommunity = null;
    if (role === 'super_admin') {
      if (selectedCommunityId !== 'all') {
        activeCommunity = communities.find(c => String(c.community_id) === String(selectedCommunityId));
      }
    } else {
      activeCommunity = {
        community_id: user.community_id,
        name: user.community_name || 'My Residence'
      };
    }

    const needsSpecificBuilding = ['members', 'documents', 'maintenance', 'payments', 'parking', 'visitors', 'parcels', 'vendors'].includes(activePage);

    if (role === 'super_admin' && needsSpecificBuilding && !activeCommunity) {
      return (
        <div className="flex flex-col items-center justify-center p-8 sm:p-16 text-center text-slate-800 dark:text-white min-h-[50vh] bg-white dark:bg-[#162535] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm font-sans animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-500/20">
            <Building2 size={32} />
          </div>
          <h2 className="text-xl font-bold mb-2">Select a Condo Building</h2>
          <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
            Please select a specific building from the dropdown menu in the topbar (managing building switcher) to access this feature.
          </p>
        </div>
      );
    }

    const handleEnterCommunity = (communityId) => {
      setSelectedCommunityId(communityId);
      setActivePage('dashboard');
    };

    switch (activePage) {
      case 'dashboard':
        if (role === 'super_admin') return <CondoSuperAdminDashboard selectedCommunityId={selectedCommunityId} onEnterCommunity={handleEnterCommunity} />;
        if (role === 'property_manager') return <CondoPropertyManagerDashboard user={user} setActivePage={setActivePage} />;
        if (role === 'board_member') return <CondoBoardDashboard user={user} setActivePage={setActivePage} />;
        if (role === 'security_guard' || role === 'front_desk_concierge') return <CondoSecurityDashboard user={user} setActivePage={setActivePage} />;
        return <CondoResidentDashboard user={user} setActivePage={setActivePage} />;

      case 'condo-contracts':
        return <CondoContracts />;

      case 'buildings':
        return <CondoSuperAdminDashboard defaultSection="buildings" selectedCommunityId={selectedCommunityId} onEnterCommunity={handleEnterCommunity} />;
      
      case 'users':
        return <CondoSuperAdminDashboard defaultSection="users" selectedCommunityId={selectedCommunityId} onEnterCommunity={handleEnterCommunity} />;

      case 'members':
        return <CondoMembers community={activeCommunity} user={user} />;

      case 'documents':
        return <CondoDocuments community={activeCommunity} user={user} />;

      case 'maintenance':
        return <CondoServiceRequests community={activeCommunity} user={user} />;

      case 'payments':
        return <CondoPayments community={activeCommunity} user={user} />;

      case 'parking':
        return <CondoParking community={activeCommunity} user={user} />;

      case 'visitors':
        return <CondoVisitors community={activeCommunity} user={user} />;

      case 'parcels':
        return <CondoParcels community={activeCommunity} user={user} />;

      case 'vendors':
        return <CondoVendors communityId={activeCommunity?.community_id} userRole={user?.role} user={user} />;

      case 'profile':
        return <Profile user={user} setUser={setUser} viewRole={user?.role} />;

      default:
        if (role === 'super_admin') return <CondoSuperAdminDashboard selectedCommunityId={selectedCommunityId} onEnterCommunity={handleEnterCommunity} />;
        if (role === 'property_manager') return <CondoPropertyManagerDashboard user={user} setActivePage={setActivePage} />;
        if (role === 'board_member') return <CondoBoardDashboard user={user} setActivePage={setActivePage} />;
        if (role === 'security_guard' || role === 'front_desk_concierge') return <CondoSecurityDashboard user={user} setActivePage={setActivePage} />;
        return <CondoResidentDashboard user={user} setActivePage={setActivePage} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-[#0D1B2A]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="dark:text-gray-400 text-gray-500 font-mono">LOADING CONDO PORTAL...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-[#0D1B2A] text-gray-900 dark:text-white font-sans">
      
      {/* Condo Sidebar */}
      <CondoSidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        user={user}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Condo Topbar */}
        <CondoTopbar
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          user={user}
          setActivePage={setActivePage}
          canGoBack={true}
          onBack={handleBack}
          communities={communities}
          selectedCommunityId={selectedCommunityId}
          setSelectedCommunityId={setSelectedCommunityId}
        />

        <main className="flex-1 overflow-auto pt-2 sm:pt-3 lg:pt-4 px-3 sm:px-4 lg:px-6 pb-6 bg-white dark:bg-[#0D1B2A] custom-scrollbar">
          <div className="max-w-[1600px] mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>

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
}
