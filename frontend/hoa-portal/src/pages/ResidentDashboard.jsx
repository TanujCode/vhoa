import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Wrench, Bell, ArrowUpRight, Download, RefreshCw } from 'lucide-react';
import API from '../services/api';

const ResidentStatCard = ({ label, value, icon: Icon, color, sub, actionLabel, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 hover:border-teal-500/30 dark:hover:border-teal-500/30 transition-all shadow-sm dark:shadow-none group ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : ''}`}
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <span className="text-[10px] text-slate-400 dark:text-gray-500 font-mono group-hover:text-teal-500 dark:group-hover:text-teal-400 transition-colors">ACTIVE</span>
    </div>
    <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">{label}</p>
    <p className="text-3xl font-mono font-bold text-slate-900 dark:text-white mb-2">{value}</p>
    <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
      <span className="text-xs text-slate-400 dark:text-gray-500">{sub}</span>
      {actionLabel && (
        <span className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1">
          {actionLabel} <ArrowUpRight size={12} />
        </span>
      )}
    </div>
  </div>
);

const ResidentDashboard = ({ community, user: initialUser, setActivePage }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(initialUser || null);
  const [loading, setLoading] = useState(true);
  const [dues, setDues] = useState([]);
  const [requests, setRequests] = useState([]);
  const [news, setNews] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (userObj) => {
    const communityId = userObj?.community_id;
    if (!communityId) return;

    try {
      const [duesRes, requestsRes, newsRes] = await Promise.allSettled([
        API.get(`/payment/due/${communityId}`),
        API.get(`/service-request/${communityId}?limit=20`),
        API.get(`/news/${communityId}?limit=10`)
      ]);

      if (duesRes.status === 'fulfilled') setDues(duesRes.value.data || []);
      if (requestsRes.status === 'fulfilled') setRequests(requestsRes.value.data || []);
      if (newsRes.status === 'fulfilled') setNews(newsRes.value.data || []);
    } catch (err) {
      console.error("Error loading dashboard data", err);
    }
  };

  const loadUserAndData = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) {
      setLoading(true);
    }
    try {
      const res = await API.get('/auth/me');
      const freshUser = res.data;
      
      if (localStorage.getItem('user')) {
        localStorage.setItem('user', JSON.stringify(freshUser));
      } else {
        sessionStorage.setItem('user', JSON.stringify(freshUser));
      }
      setUser(freshUser);

      if (!freshUser?.community_id) {
        navigate('/join-community');
        return;
      }

      await fetchDashboardData(freshUser);
    } catch (err) {
      console.error(err);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserAndData(true);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserAndData(false);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-500 dark:text-gray-400 font-mono text-sm animate-pulse">
        Loading your dashboard...
      </div>
    );
  }

  if (!user) {
    return <div className="text-slate-900 dark:text-white p-10">No user data found. Please login again.</div>;
  }

  const residentName = user?.first_name || user?.full_name || 'Resident';
  const communityName = user?.community_name || community?.name || 'No Community Joined';
  const unitNumber = user?.unit_no || user?.unit_number || 'N/A';

  // 1. Calculate dues outstanding
  const totalDues = dues.reduce((sum, item) => sum + (item.amount || 0), 0);
  const sortedDues = [...dues].sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  const earliestDue = sortedDues[0];

  const duesValue = totalDues > 0 ? `$${totalDues.toFixed(2)}` : '$0.00';
  const duesSub = earliestDue 
    ? `Due by ${new Date(earliestDue.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` 
    : 'No outstanding dues';

  // 2. Calculate open service requests
  const activeRequests = requests.filter(r => !['CLOSED', 'CANCELLED'].includes(r.status_name));
  const openRequestsCount = activeRequests.length;
  const inProgressCount = activeRequests.filter(r => ['IN_PROGRESS', 'VENDOR_ASSIGNED'].includes(r.status_name)).length;
  const requestsSub = openRequestsCount > 0
    ? (inProgressCount > 0 ? `${inProgressCount} in progress` : 'Pending review')
    : 'No active requests';

  // 3. Calculate notices
  const noticesCount = news.length;
  const noticesSub = noticesCount > 0 ? `${noticesCount} new updates` : 'No new notices';

  // News category styling maps
  const categoryBorderMap = {
    GENERAL:     'border-l-teal-500 dark:border-l-teal-500',
    MEETING:     'border-l-blue-500 dark:border-l-blue-500',
    MAINTENANCE: 'border-l-orange-500 dark:border-l-orange-500',
    EMERGENCY:   'border-l-red-500 dark:border-l-red-500',
    EVENT:       'border-l-purple-500 dark:border-l-purple-500',
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white font-mono">
            Welcome, {residentName}
          </h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1">
            {communityName} • Unit {unitNumber}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-200/60 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-2xl text-sm font-semibold transition disabled:opacity-60"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResidentStatCard 
          label="Dues Outstanding" 
          value={duesValue} 
          icon={CreditCard} 
          color="bg-red-600" 
          sub={duesSub} 
          actionLabel={totalDues > 0 ? "Pay Now" : ""}
          onClick={() => setActivePage?.('payments')}
        />
        <ResidentStatCard 
          label="Open Requests" 
          value={String(openRequestsCount)} 
          icon={Wrench} 
          color="bg-blue-600" 
          sub={requestsSub} 
          actionLabel="Track" 
          onClick={() => setActivePage?.('servicereq')}
        />
        <ResidentStatCard 
          label="Notices" 
          value={String(noticesCount)} 
          icon={Bell} 
          color="bg-amber-600" 
          sub={noticesSub} 
          actionLabel="Read" 
          onClick={() => setActivePage?.('news')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm dark:shadow-none">
          <h3 className="text-slate-900 dark:text-white font-semibold mb-4 flex items-center gap-2">
            <Bell size={18} className="text-amber-500" /> Community News
          </h3>
          <div className="space-y-4">
            {news.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-gray-400 text-sm">
                No news updates in your community yet.
              </div>
            ) : (
              news.slice(0, 3).map(item => (
                <div 
                  key={item.news_id} 
                  className={`p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-0 rounded-2xl border-l-4 ${categoryBorderMap[item.category] || 'border-l-teal-500'} transition-all hover:bg-slate-100/50 dark:hover:bg-white/10`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{item.title}</p>
                    <span className="text-[10px] text-slate-400 dark:text-gray-500 font-mono">
                      {new Date(item.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">{item.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm dark:shadow-none">
          <h3 className="text-slate-900 dark:text-white font-semibold mb-4">Quick Links</h3>
          <div className="space-y-2">
            {['HOA Bylaws', 'Monthly Minutes', 'Parking Rules'].map(doc => (
              <button key={doc} className="w-full text-left p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-sm text-slate-700 dark:text-gray-300 flex justify-between items-center transition" onClick={() => setActivePage?.('documents')}>
                {doc} <Download size={14} className="text-gray-500" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResidentDashboard;