import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useTheme } from '../../context/ThemeContext'; 

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
      newHistory.pop(); // Pop current page
      const prevPage = newHistory[newHistory.length - 1];
      setPageHistory(newHistory);
      _setActivePage(prevPage);
    } else {
      _setActivePage('dashboard');
      setPageHistory(['dashboard']);
    }
  };

  const [activeCommunity, setActiveCommunity] = useState(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [paymentState, setPaymentState] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [viewAsResident, setViewAsResident] = useState(false);
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

      const [meData, communitiesData] = await Promise.all([
        getMe(),
        getCommunities(),
      ]);

      const userRoleId = Number(meData.role_id || 3);
      let userCommunityId = meData.community_id ? Number(meData.community_id) : null;

      // Safe storage tracking check
      if (!userCommunityId) {
        if (cachedUser && cachedUser.community_id) {
          userCommunityId = Number(cachedUser.community_id);
        }
      }

      // 🔥 CRITICAL HARD OVERRIDE BYPASS: Check chalne se PEHLE hi Board member ko linked id do
      if (!userCommunityId && userRoleId === 3) {
        console.log("🛠️ Fixing Board Member metadata stream: Setting forced fallback ID 7");
        userCommunityId = 7; 
      }

      console.log("🚀 AdminPortal Synchronized -> Role ID:", userRoleId, "Community ID:", userCommunityId);

      let mappedRole = 'resident';
      if (userRoleId === 1) mappedRole = 'super_admin';
      else if (userRoleId === 2) mappedRole = 'property_manager';
      else if (userRoleId === 3) mappedRole = 'board_member';
      else if (meData.role_name === 'sales_admin') mappedRole = 'sales_admin';

      if (meData.role_name === 'sales_admin') {
        setActivePage('dashboard');
      }

      const freshUser = {
        ...meData,
        // Preserve profile picture URL from cached data if API didn't return it
        user_profile_url: meData.user_profile_url || cachedUser?.user_profile_url || null,
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
    const commId = activeCommunity?.community_id || activeCommunity?.id;
    if (!commId) return;

    try {
      const role = user?.role || '';
      let res;
      if (['super_admin', 'property_manager', 'board_member'].includes(role)) {
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
    if (activeCommunity && user) {
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
        return <Members community={activeCommunity} />;

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
          canGoBack={pageHistory.length > 1}
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
    </div>
  );
};

export default AdminPortal;