import React, { useState, useEffect } from 'react';
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

export default function CondoAdminPortal() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get('tab') || 'dashboard';
  const [activePage, _setActivePage] = useState(currentTab);
  const [pageHistory, setPageHistory] = useState([currentTab]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState('all');

  useEffect(() => {
    if (currentTab !== activePage) {
      _setActivePage(currentTab);
      setPageHistory(prev => {
        if (prev[prev.length - 1] === currentTab) return prev;
        return [...prev, currentTab];
      });
    }
  }, [currentTab]);

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

    switch (activePage) {
      case 'dashboard':
        if (role === 'super_admin') return <CondoSuperAdminDashboard />;
        if (role === 'property_manager') return <CondoPropertyManagerDashboard user={user} setActivePage={setActivePage} />;
        if (role === 'board_member') return <CondoBoardDashboard user={user} setActivePage={setActivePage} />;
        return <CondoResidentDashboard user={user} setActivePage={setActivePage} />;

      case 'buildings':
        return renderPlaceholder("Condo Buildings", "Manage list of towers, units registry, and settings codes.", Building2);
      
      case 'users':
        return renderPlaceholder("Users Directory", "Block/unblock user profiles, assign roles and manage accounts.", Users);

      case 'members':
        return renderPlaceholder("Residents Directory", "Verify occupant details, unit parking slots and contact info.", Users);

      case 'documents':
        return renderPlaceholder("Documents Center", "Access high-rise bylaws, fire drill guidelines and newsletters.", FileText);

      case 'maintenance':
        return renderPlaceholder("Maintenance requests", "File or review work logs for elevator issues, plumbing, or paint.", Wrench);

      case 'payments':
        return renderPlaceholder("Payments Ledger", "Pay building HOA monthly dues, check ledger, or review invoices.", CreditCard);

      case 'parking':
        return renderPlaceholder("Parking Allocations", "Manage assigned slots, guest parking tickets, and registry.", ParkingSquare);

      case 'visitors':
        return renderPlaceholder("Visitor Passes", "Generate numeric code passes for guests or parcel deliveries.", Key);

      case 'parcels':
        return renderPlaceholder("Parcels Logs", "Track package packages dropped at reception desk by mail carriers.", Package);

      case 'profile':
        return renderPlaceholder("My Profile Settings", "Manage notification preferences, email, phone, and upload avatar.", User);

      default:
        if (role === 'super_admin') return <CondoSuperAdminDashboard />;
        if (role === 'property_manager') return <CondoPropertyManagerDashboard user={user} setActivePage={setActivePage} />;
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
    <div className="flex h-screen bg-white dark:bg-[#0D1B2A] text-gray-900 dark:text-white overflow-hidden font-sans">
      
      {/* Condo Sidebar */}
      <CondoSidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        user={user}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
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

        <main className="flex-1 overflow-auto p-5 lg:p-7 bg-white dark:bg-[#0D1B2A] custom-scrollbar">
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
