import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';   // ← Yeh import add kiya

import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import NotifPanel from '../../components/NotifPanel';

import Dashboard from '../Dashboard';
import Members from '../Members';
import Violations from '../Violations';
import Settings from '../Settings';
import Profile from '../Profile';
import Overview from '../Overview';

import { getMe } from '../../services/authService';
import { getCommunities } from '../../services/communityService';

const ComingSoon = ({ title }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="text-5xl mb-4">🚧</div>
      <h2 className="text-2xl font-semibold dark:text-white text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-500 dark:text-gray-400">Coming soon...</p>
    </div>
  </div>
);

const AdminPortal = () => {
  const { theme } = useTheme();   // ← Theme context se le rahe hain

  const [activePage, setActivePage] = useState('dashboard');
  const [activeCommunity, setActiveCommunity] = useState(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [meData, communitiesData] = await Promise.all([
        getMe(),
        getCommunities(),
      ]);

      setUser({
        ...meData,
        initials: `${meData.first_name?.[0] || ''}${meData.last_name?.[0] || ''}`.toUpperCase() || "TT",
        name: meData.full_name || meData.name,
        email: meData.email_id,
        role: meData.role_name || "Admin"
      });

      setCommunities(communitiesData || []);
      if (communitiesData?.length > 0) setActiveCommunity(communitiesData[0]);
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderPage = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="dark:text-gray-400 text-gray-500">Loading dashboard...</p>
          </div>
        </div>
      );
    }

    switch (activePage) {
      case 'overview':   return <Overview communities={communities} />;
      case 'dashboard':  return <Dashboard community={activeCommunity} user={user} />;
      case 'members':    return <Members community={activeCommunity} />;
      case 'violations': return <Violations community={activeCommunity} />;
      case 'settings':   return <Settings community={activeCommunity} />;
      case 'profile':    return <Profile user={user} setUser={setUser} />;
      default:           return <Dashboard community={activeCommunity} user={user} />;
    }
  };

  return (
    <div className="flex h-screen 
                    bg-slate-50 dark:bg-[#0D1B2A] 
                    text-gray-900 dark:text-white 
                    overflow-hidden font-sans">
      
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        user={user}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          activeCommunity={activeCommunity}
          setActiveCommunity={setActiveCommunity}
          communities={communities}
          toggleNotif={() => setIsNotifOpen(!isNotifOpen)}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          user={user}
          setActivePage={setActivePage}
        />

        <main className="flex-1 overflow-auto p-5 lg:p-7 
                         bg-slate-50 dark:bg-[#0D1B2A]">
          {renderPage()}
        </main>
      </div>

      <NotifPanel
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />
    </div>
  );
};

export default AdminPortal;