import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom'; 
import { useTheme } from '../../context/ThemeContext'; 
import { LogOut, FileText, Trash2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const cleanDescription = (desc) => {
  if (!desc) return "";
  let clean = desc;
  clean = clean.replace(/User:\s+([^(]+)\s+\(ID:[^)]+\)/gi, '$1');
  clean = clean.replace(/User:\s+([^(]+)\s+\([^)]+\)/gi, '$1');
  clean = clean.replace(/Service Request\s+(\d+)/gi, 'Service Request #$1');
  clean = clean.replace(/\.?\s*Time\s*\(ET\):.*$/gi, '');
  clean = clean.replace(/\s+->\s+/g, ' ➔ ');
  return clean.trim();
};

// Layout Components
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import NotifPanel from '../../components/NotifPanel';
import AiAssistant from '../../components/AiAssistant';

// Page Components
import Dashboard from '../Dashboard'; 
import ResidentDashboard from '../ResidentDashboard'; 
import BoardDashboard from '../BoardDashboard'; 
import PropertyManagerDashboard from '../PropertyManagerDashboard';
import SalesDashboard from '../SalesDashboard';
import Members from '../Members';
import Vendors from '../Vendors';
import Violations from '../Violations';
import Settings from '../Settings';
import Profile from '../Profile';
import Overview from '../Overview';
import ServiceRequests from '../ServiceRequests';
import News from '../News';
import Meetings from '../Meetings';
import Contracts from '../Contracts';
import CondoContracts from '../condo/CondoContracts';
import Amenity from '../Amenity';
import Payments from '../Payments';
import AuditHistory from '../AuditHistory';
import Documents from '../Documents';
import Reports from '../Reports';
import ChangeRequests from '../ChangeRequests';
// Services
import { getMe } from '../../services/authService';
import { getCommunities } from '../../services/communityService';
import API from '../../services/api';

const AdminPortal = () => {
  const { theme } = useTheme();
  const navigate = useNavigate(); 
  const [searchParams, setSearchParams] = useSearchParams();

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
      window.history.pushState({ isPortalGuard: true }, '', '/dashboard');
    }
  }, [activePage]);

  // Intercept browser back button when on dashboard to show exit confirmation
  useEffect(() => {
    const handlePopState = (e) => {
      if (activePageRef.current === 'dashboard') {
        setShowExitConfirm(true);
        window.history.pushState({ isPortalGuard: true }, '', '/dashboard');
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
    const keys = ['token', 'session_token', 'access_token', 'user', 'view_as_resident'];
    keys.forEach(k => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
    window.location.href = '/login';
  };

  const [activeCommunity, setActiveCommunity] = useState(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [paymentState, setPaymentState] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [viewAsResident, setViewAsResidentState] = useState(() => {
    return localStorage.getItem('view_as_resident') === 'true';
  });

  const setViewAsResident = (val) => {
    setViewAsResidentState(val);
    localStorage.setItem('view_as_resident', String(val));
    setActivePage('dashboard');
  };
  const [lastReadTimestamp, setLastReadTimestamp] = useState(() => {
    return Number(localStorage.getItem('last_read_notifications') || 0);
  });
  const [badgeClearedTimestamp, setBadgeClearedTimestamp] = useState(() => {
    return Number(localStorage.getItem('last_read_notifications') || 0);
  });
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('read_notification_ids') || '[]');
    } catch (_) {
      return [];
    }
  });

  // Track previous unread count to detect NEW notifications
  const prevUnreadRef = useRef(0);
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
          toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 shadow-lg rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4`}>
              <div className="flex-1 w-0 text-left">
                <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  {isDelete ? <Trash2 size={16} className="text-red-400" /> : <FileText size={16} className="text-indigo-400" />}
                  {title}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {cleanDescription(desc)}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="bg-transparent rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <span className="sr-only">Close</span>
                  <X size={16} />
                </button>
              </div>
            </div>
          ), { duration: 6000 });
        }
      });
      
      prevNotificationsRef.current = notifications;
    }
  }, [notifications]);

  // Play soft ding sound using Web Audio API
  const playNotifSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);         // A5 note
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15); // G5
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (_) {
      // Browser may block AudioContext without user interaction — silently ignore
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      // ⚡ INSTANT: Show cached user from localStorage first to avoid blank screen
      const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      let cachedUser = null;
      if (rawUser && rawUser !== 'undefined' && rawUser !== 'null') {
        try { cachedUser = JSON.parse(rawUser); } catch (_) {}
      }

      const res = await Promise.all([
        getMe(),
        getCommunities(),
      ]);
      const meData = res[0];
      const communitiesData = res[1];

      const roleStr = (meData.role_name || meData.role || '').toLowerCase();
      let defaultRoleId = 3;
      if (roleStr === 'sales_admin') defaultRoleId = 6;
      else if (roleStr === 'resident') defaultRoleId = 4;
      
      const userRoleId = Number(meData.role_id || defaultRoleId);
      let userCommunityId = meData.community_id ? Number(meData.community_id) : null;

      // Safe storage tracking check
      if (!userCommunityId) {
        if (cachedUser && cachedUser.community_id) {
          userCommunityId = Number(cachedUser.community_id);
        }
      }

      console.log("🚀 AdminPortal Synchronized -> Role ID:", userRoleId, "Community ID:", userCommunityId);

      let mappedRole = 'resident';
      if (userRoleId === 1) mappedRole = 'super_admin';
      else if (userRoleId === 2) mappedRole = 'property_manager';
      else if (userRoleId === 3) mappedRole = 'board_member';
      else if (roleStr === 'sales_admin') mappedRole = 'sales_admin';

      if (mappedRole === 'sales_admin') {
        setActivePage('dashboard');
      }

      const freshUser = {
        ...meData,
        user_profile_url: meData.user_profile_url || null,
        initials: `${meData.first_name?.[0] || 'U'}${meData.last_name?.[0] || 'R'}`.toUpperCase(),
        name: meData.full_name || `${meData.first_name} ${meData.last_name}`,
        email: meData.email_id,
        role_id: userRoleId,
        role: mappedRole,
        community_id: userCommunityId,
        unit_no: meData.unit_no || 'N/A'
      };

      setUser(freshUser);
      // Keep localStorage in sync with fresh data
      try {
        if (localStorage.getItem('user')) {
          localStorage.setItem('user', JSON.stringify(freshUser));
        }
      } catch (_) {}

      setCommunities(communitiesData || []);

      // 🔥 ROUTE GUARD FOR UNASSIGNED RESIDENTS ONLY
      // Ab board member yahan nahi fasega kyunki uski ID upar 7 set ho chuki hai
      if ((userRoleId === 4 || userRoleId === 3) && (!userCommunityId || userCommunityId === 0)) {
        console.log(`⚠️ Redirecting unassigned profile to wizard layout...`);
        setLoading(false);
        if (freshUser.account_status === 'PENDING_APPROVAL') {
          navigate('/waiting-approval');
        } else {
          navigate('/join-community');
        }
        return;
      }

      // Active Community Data Binding
      if (communitiesData?.length > 0) {
        if (userCommunityId) {
          const matchingComm = communitiesData.find(c => Number(c.community_id || c.id) === userCommunityId);
          setActiveCommunity(matchingComm || communitiesData[0]);
        } else if (userRoleId === 1) {
          setActiveCommunity(communitiesData[0]);
        } else {
          setActiveCommunity(null);
        }
      }

    } catch (err) {
      console.error('Failed to parse database records in initial stream:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshCommunities = async () => {
    try {
      const communitiesData = await getCommunities();
      setCommunities(communitiesData || []);
    } catch (err) {
      console.error('Failed to refresh communities:', err);
    }
  };

  const handleSwitchCommunity = async (comm) => {
    if (!comm) return;
    try {
      // 1. Call backend to update active community in DB
      const res = await API.post(`/user/switch-community/${comm.community_id}`);
      const updatedUser = res.data;
      
      // 2. Update frontend state
      setActiveCommunity(comm);
      
      // 3. Update user state
      setUser(prev => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          ...updatedUser,
          community_id: comm.community_id,
          unit_no: updatedUser.unit_no || 'N/A',
          unit_no_2: updatedUser.unit_no_2 || ''
        };
        
        // 4. Update stored user in localStorage / sessionStorage so it matches
        const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (rawUser && rawUser !== "undefined" && rawUser !== "null") {
          try {
            const parsed = JSON.parse(rawUser);
            parsed.community_id = comm.community_id;
            parsed.unit_no = updatedUser.unit_no;
            parsed.unit_no_2 = updatedUser.unit_no_2;
            if (localStorage.getItem('user')) {
              localStorage.setItem('user', JSON.stringify(parsed));
            } else {
              sessionStorage.setItem('user', JSON.stringify(parsed));
            }
          } catch (e) {
            console.error("Failed to parse user storage:", e);
          }
        }
        return updated;
      });

      // Clear any session-specific settings for the previous community
      sessionStorage.removeItem(`vendors_unlocked_${comm.community_id}`);
      localStorage.removeItem(`vendors_unlocked_${comm.community_id}`);
      
    } catch (err) {
      console.error("Failed to switch community:", err);
      alert(err.response?.data?.detail || "Failed to switch community. Please try again.");
    }
  };

  const fetchNotifications = async () => {
    const role = user?.role || '';
    const isSuperAdmin = role === 'super_admin';
    const commId = activeCommunity?.community_id || activeCommunity?.id;
    if (!commId && !isSuperAdmin) return;

    try {
      let res;
      if (isSuperAdmin) {
        res = await API.get('/audit?limit=20');
      } else if (['property_manager', 'board_member'].includes(role)) {
        res = await API.get(`/audit?community_id=${commId}&limit=20`);
      } else {
        res = await API.get('/audit/my?limit=20');
      }
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Setup a 15-second polling interval for real-time notifications
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [activeCommunity, user]);

  const unreadCount = notifications.filter(n => 
    new Date(n.created_at).getTime() > badgeClearedTimestamp &&
    !readNotificationIds.includes(n.audit_id)
  ).length;

  // Sound alert jab naya notification aaye
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current && prevUnreadRef.current !== 0) {
      // Check if sound alerts are enabled for this user
      try {
        const notifKey = `notif_prefs_${user?.user_id || 'guest'}`;
        const stored = localStorage.getItem(notifKey);
        if (stored) {
          const prefs = JSON.parse(stored);
          if (prefs?.push?.soundAlerts) {
            playNotifSound();
          }
        }
      } catch (_) {}
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

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
      // Clear the bell badge immediately
      setBadgeClearedTimestamp(Date.now());
    } else {
      // Closing the panel. Now mark everything as read in localStorage!
      const threshold = getReadThresholdTimestamp();
      localStorage.setItem('last_read_notifications', String(threshold));
      setLastReadTimestamp(threshold);
      setBadgeClearedTimestamp(threshold);
      localStorage.setItem('read_notification_ids', '[]');
      setReadNotificationIds([]);
    }
  };

  const handleNotifClick = (log) => {
    if (!log) return;
    
    // Mark as read immediately
    const currentReadIds = [...readNotificationIds];
    if (!currentReadIds.includes(log.audit_id)) {
      currentReadIds.push(log.audit_id);
      localStorage.setItem('read_notification_ids', JSON.stringify(currentReadIds));
      setReadNotificationIds(currentReadIds);
    }
    
    // Map module to page name
    const module = log.module || "";
    if (module === 'service_request') {
      setActivePage('servicereq');
    } else if (module === 'violation') {
      setActivePage('violations');
    } else if (module === 'payment') {
      setActivePage('payments');
    } else if (module === 'news') {
      setActivePage('news');
    } else if (module === 'meeting') {
      setActivePage('meetings');
    } else if (module === 'document') {
      setActivePage('documents');
    } else if (module === 'community_change_request') {
      setActivePage('change_requests');
    }
    
    setIsNotifOpen(false);
  };

  const isResident = user?.role_id === 4 || user?.role === 'resident';
  const isBoardMember = user?.role_id === 3 || user?.role === 'board_member';
  const isPropertyManager = user?.role_id === 2 || user?.role === 'property_manager';
  const isSalesAdmin = user?.role === 'sales_admin';

  const canSwitchView = isPropertyManager || isBoardMember;
  const effectiveRole = (viewAsResident && canSwitchView) ? 'resident' : (user?.role || 'resident');

  const activeIsResident = effectiveRole === 'resident';
  const activeIsBoardMember = effectiveRole === 'board_member';
  const activeIsPropertyManager = effectiveRole === 'property_manager';
  const activeIsSalesAdmin = effectiveRole === 'sales_admin';

  const renderPage = () => {
    if (loading) return null;

    const effectiveUser = user ? { ...user, role: effectiveRole, role_name: effectiveRole } : null;

    switch (activePage) {
      case 'overview':   
        return (
          <Overview 
            communities={communities} 
            setActiveCommunity={setActiveCommunity}
            setActivePage={setActivePage}
            user={effectiveUser}
            refreshCommunities={refreshCommunities}
          />
        );

      case 'dashboard':  
        if (activeIsResident) return <ResidentDashboard community={activeCommunity} user={effectiveUser} setActivePage={setActivePage} />; 
        if (activeIsBoardMember) return <BoardDashboard community={activeCommunity} user={effectiveUser} setActivePage={setActivePage} />;
        if (activeIsPropertyManager) return <PropertyManagerDashboard community={activeCommunity} user={effectiveUser} setActivePage={setActivePage} />;
        if (activeIsSalesAdmin) return <SalesDashboard setActivePage={setActivePage} />;
        return <Dashboard community={activeCommunity} user={effectiveUser} setActivePage={setActivePage} />;

      case 'members':    
        return <Members community={activeCommunity} user={effectiveUser} />;

      case 'servicereq': 
        return (
          <ServiceRequests 
            community={activeCommunity} 
            user={effectiveUser} 
            setActivePage={setActivePage}
            setPaymentState={setPaymentState}
          />
        );

      case 'vendors': 
        return <Vendors communityId={activeCommunity?.community_id} userRole={effectiveRole} user={effectiveUser} />;
        
      case 'violations': 
        return <Violations community={activeCommunity} user={effectiveUser} setActivePage={setActivePage} setPaymentState={setPaymentState} />;
      
      case 'settings':   
        return (
          <Settings 
            community={activeCommunity} 
            onCommunityUpdate={(updatedComm) => {
              setActiveCommunity(updatedComm);
              refreshCommunities();
            }} 
          />
        );
      
      case 'profile':    
        return <Profile user={user} setUser={setUser} viewRole={effectiveRole} />;

      case 'news': 
        return <News community={activeCommunity} user={effectiveUser} />;

      case 'meetings':
        return <Meetings community={activeCommunity} user={effectiveUser} />;

      case 'contracts':
        return <Contracts />;

      case 'condo-contracts':
        return <CondoContracts />;

      case 'documents':
        return <Documents community={activeCommunity} user={effectiveUser} />;

      case 'reports':
        return <Reports community={activeCommunity} user={effectiveUser} setActivePage={setActivePage} />;

      case 'amenities': 
        return <Amenity community={activeCommunity} user={effectiveUser} setActivePage={setActivePage} setPaymentState={setPaymentState} />;
      
      case 'payments':
        return (
          <Payments 
            community={activeCommunity} 
            user={effectiveUser} 
            paymentState={paymentState}
            setPaymentState={setPaymentState}
            viewAsResident={viewAsResident}
          />
        );

      case 'audit': 
          return <AuditHistory community={activeCommunity} user={effectiveUser} />;

      case 'change_requests':
        return <ChangeRequests />;
      
      default:           
        if (activeIsResident) return <ResidentDashboard community={activeCommunity} user={effectiveUser} setActivePage={setActivePage} />;
        if (activeIsBoardMember) return <BoardDashboard community={activeCommunity} user={effectiveUser} setActivePage={setActivePage} />;
        if (activeIsPropertyManager) return <PropertyManagerDashboard community={activeCommunity} user={effectiveUser} setActivePage={setActivePage} />;
        if (activeIsSalesAdmin) return <SalesDashboard setActivePage={setActivePage} />;
        return <Dashboard community={activeCommunity} user={effectiveUser} />;
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
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        user={user}
        userRole={effectiveRole} 
        activeCommunity={activeCommunity}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          activeCommunity={activeCommunity}
          setActiveCommunity={handleSwitchCommunity}
          communities={communities}
          toggleNotif={handleToggleNotif}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          user={user}
          setActivePage={setActivePage}
          unreadCount={unreadCount}
          viewAsResident={viewAsResident}
          setViewAsResident={(val) => {
            setViewAsResident(val);
            sessionStorage.removeItem(`vendors_unlocked_${activeCommunity?.community_id}`);
            localStorage.removeItem(`vendors_unlocked_${activeCommunity?.community_id}`);
          }}
          canSwitchView={canSwitchView}
          canGoBack={true}
          onBack={handleBack}
        />

        <main className="flex-1 overflow-auto p-5 lg:p-7 bg-white dark:bg-[#0D1B2A] custom-scrollbar">
          <div className="max-w-[1600px] mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>

      <NotifPanel
        isOpen={isNotifOpen}
        onClose={() => {
          setIsNotifOpen(false);
          const threshold = getReadThresholdTimestamp();
          localStorage.setItem('last_read_notifications', String(threshold));
          setLastReadTimestamp(threshold);
          setBadgeClearedTimestamp(threshold);
          localStorage.setItem('read_notification_ids', '[]');
          setReadNotificationIds([]);
        }}
        notifications={notifications}
        lastReadTimestamp={lastReadTimestamp}
        readNotificationIds={readNotificationIds}
        onNotifClick={handleNotifClick}
        onMarkAllRead={() => {
          const threshold = getReadThresholdTimestamp();
          localStorage.setItem('last_read_notifications', String(threshold));
          setLastReadTimestamp(threshold);
          setBadgeClearedTimestamp(threshold);
          localStorage.setItem('read_notification_ids', '[]');
          setReadNotificationIds([]);
        }}
      />
      {activeCommunity && user?.role !== 'sales_admin' && activeCommunity?.visible_tabs?.ai_assistant !== false && (
        <AiAssistant user={user} community={activeCommunity} />
      )}

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

export default AdminPortal;