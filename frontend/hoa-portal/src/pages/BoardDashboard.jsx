import React, { useState, useEffect } from 'react';
import {
  Users, AlertTriangle, Wrench, DollarSign,
  Calendar, TrendingUp, RefreshCw, UserPlus,
  Clock, CheckCircle, XCircle, Building2, Download,
  ShieldAlert, Settings2, Wallet, Sparkles, Folder, FileText, Megaphone,
  Check, Trash2, Plus, MapPin, X, Search, ChevronLeft, ChevronRight
} from 'lucide-react';
import API, { getBaseUrl } from "../services/api";

const BoardDashboard = ({ community, user, setActivePage }) => {
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [exporting, setExporting]   = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState("violations");
  const [exportFormat, setExportFormat] = useState("csv");

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [newTaskText, setNewTaskText] = useState('');
  const [quickTasks, setQuickTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Pending Join Requests
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [actionId, setActionId] = useState(null);

  const formatAddress = (addr) => {
    if (!addr) return 'Bazar Chowk, Chicholi';
    if (typeof addr === 'string') return addr;
    const parts = [];
    if (addr.address) parts.push(addr.address);
    if (addr.city) parts.push(addr.city);
    if (addr.state_name || addr.state_id) parts.push(addr.state_name || addr.state_id);
    if (addr.zip_code) parts.push(addr.zip_code);
    return parts.length > 0 ? parts.join(', ') : 'Bazar Chowk, Chicholi';
  };

  useEffect(() => {
    if (community?.community_id || community?.id) {
      const commId = community.community_id || community.id;
      fetchDashboardData(commId);
      const saved = localStorage.getItem(`board_quick_tasks_${user?.user_id || 'guest'}_${commId}`);
      setQuickTasks(saved ? JSON.parse(saved) : [
        { id: 1, text: "Review pending amenity bookings", completed: false },
        { id: 2, text: "Check upcoming community meeting agenda", completed: true },
        { id: 3, text: "Follow up on active community violations", completed: false }
      ]);
    }
  }, [community]);

  const fetchDashboardData = async (communityId) => {
    try {
      setLoading(true);
      setLoadingRequests(true);

      const [statsRes, meetingsRes, bookingsRes, joinReqsRes] = await Promise.all([
        API.get(`/community/${communityId}/stats`),
        API.get(`/meeting-survey/meetings?community_id=${communityId}`).catch(() => ({ data: [] })),
        API.get(`/amenity/booking/${communityId}?limit=100&skip=0`).catch(() => ({ data: [] })),
        API.get(`/community/${communityId}/join-requests/pending`).catch(() => ({ data: [] }))
      ]);

      setStats(statsRes.data);
      setRequests(joinReqsRes.data || []);
      
      const meetingsData = meetingsRes?.data || [];
      const bookingsData = bookingsRes?.data || [];
      
      // Load personal notes
      let localNotes = [];
      try {
        const saved = localStorage.getItem(`personal_notes_${user?.user_id || 'guest'}_${communityId}`);
        localNotes = saved ? JSON.parse(saved) : [];
      } catch (_) {}

      // Combine
      const combined = [
        ...meetingsData.map(m => ({
          id: `meeting-${m.meeting_id}`,
          title: m.title,
          date: m.meeting_date,
          type: 'meeting'
        })),
        ...bookingsData
          .filter(b => b.status !== 'CANCELLED')
          .map(b => ({
            id: `booking-${b.booking_id}`,
            title: `${b.amenity_name || 'Amenity'} Booking`,
            date: b.booking_date,
            type: 'booking',
            status: b.status
          })),
        ...localNotes.map(n => ({
          id: `note-${n.note_id}`,
          title: n.title,
          date: n.date,
          type: 'note'
        }))
      ];

      // Parse date string as LOCAL date (avoid UTC midnight off-by-one in IST)
      const parseLocalDate = (dateStr) => {
        if (!dateStr) return new Date(0);
        const s = String(dateStr);
        const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
        return new Date(s);
      };

      // Sort allEvents chronologically
      const sortedAll = combined.sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date));
      setAllEvents(sortedAll);

      // Show all events sorted by date (future first, then past)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const futureEvents = sortedAll.filter(item => parseLocalDate(item.date) >= today);
      const pastEvents = sortedAll.filter(item => parseLocalDate(item.date) < today).reverse();
      const displayed = [...futureEvents, ...pastEvents];
      setUpcomingEvents(displayed.slice(0, 4));
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setLoadingRequests(false);
    }
  };

  const handleRequestAction = async (requestId, actionType) => {
    try {
      setActionId(requestId);
      const commId = community?.community_id || community?.id;
      await API.post(`/community/${commId}/join-requests/${requestId}/action`, {
        action: actionType
      });
      const updated = requests.filter(r => r.request_id !== requestId);
      setRequests(updated);
      fetchDashboardData(commId);
    } catch (err) {
      alert(`Failed to execute ${actionType.toLowerCase()} action. Please retry.`);
    } finally {
      setActionId(null);
    }
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newT = {
      id: Date.now(),
      text: newTaskText.trim(),
      completed: false
    };
    const updated = [...quickTasks, newT];
    setQuickTasks(updated);
    const commId = community?.community_id || community?.id;
    localStorage.setItem(`board_quick_tasks_${user?.user_id || 'guest'}_${commId}`, JSON.stringify(updated));
    setNewTaskText('');
  };

  const handleToggleTask = (taskId) => {
    const updated = quickTasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    setQuickTasks(updated);
    const commId = community?.community_id || community?.id;
    localStorage.setItem(`board_quick_tasks_${user?.user_id || 'guest'}_${commId}`, JSON.stringify(updated));
  };

  const handleDeleteTask = (taskId) => {
    const updated = quickTasks.filter(t => t.id !== taskId);
    setQuickTasks(updated);
    const commId = community?.community_id || community?.id;
    localStorage.setItem(`board_quick_tasks_${user?.user_id || 'guest'}_${commId}`, JSON.stringify(updated));
  };

  const handleExportReport = async () => {
    try {
      setExporting(true);
      const commId = community?.community_id || community?.id;
      const response = await API.get(`/report/${commId}/export?type=${exportType}&format=${exportFormat}`, {
        responseType: 'blob',
      });
      const fileExt = exportFormat === 'pdf' ? 'pdf' : exportFormat === 'excel' ? 'xlsx' : 'csv';
      const contentType = exportFormat === 'pdf' ? 'application/pdf' : exportFormat === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv';
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${exportType}_report_${commId}.${fileExt}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setShowExportModal(false);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export report. Please verify records exist for this community.");
    } finally {
      setExporting(false);
    }
  };

  const consoleButtons = [
    { label: "Service Req", page: "servicereq", count: stats?.open_requests, icon: <Wrench size={18} className="text-amber-500" /> },
    { label: "Vendor List", page: "vendors", icon: <Users size={18} className="text-blue-500" /> },
    { label: "Violations", page: "violations", count: stats?.active_violations, icon: <AlertTriangle size={18} className="text-red-500" /> },
    { label: "Amenities", page: "amenities", icon: <Building2 size={18} className="text-blue-500" /> },
    { label: "Payments", page: "payments", count: stats?.pending_payments, icon: <Wallet size={18} className="text-emerald-500" /> },
    { label: "Documents", page: "documents", icon: <Folder size={18} className="text-slate-500" /> },
    { label: "News & Announce", page: "news", icon: <Megaphone size={18} className="text-orange-500" /> },
    { label: "Members", page: "members", count: stats?.total_residents, icon: <UserPlus size={18} className="text-purple-500" /> },
    { label: "Reports", page: "reports", icon: <TrendingUp size={18} className="text-purple-500" /> }
  ];

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const renderDashboardCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const totalSlots = [...blanks, ...days];
    
    const monthName = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    
    return (
      <div className="bg-slate-50/40 dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200/50 dark:border-white/[0.04] rounded-2xl p-3 shadow-sm mb-3 w-full">
        {/* Calendar Navigation Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/50 dark:border-white/[0.04]">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">{monthName}</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
              className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-gray-400 transition"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                setCurrentMonth(today);
                setSelectedCalendarDate(today);
              }}
              className="px-2 py-0.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-md text-[9px] font-extrabold transition uppercase tracking-wider"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
              className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-gray-400 transition"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
        
        {/* Days of Week Headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400 dark:text-gray-500 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
        </div>
        
        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {totalSlots.map((day, idx) => {
            if (!day) return <div key={idx} className="h-8"></div>;
            
            const dateObj = new Date(year, month, day);
            const isToday = new Date().toDateString() === dateObj.toDateString();
            const isSelected = selectedCalendarDate && selectedCalendarDate.toDateString() === dateObj.toDateString();
            
            // Parse local date to avoid UTC midnight off-by-one
            const parseLD = (d) => { const s = String(d); const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/); return m2 ? new Date(+m2[1], +m2[2]-1, +m2[3]) : new Date(s); };
            // Check if day has meetings, bookings or notes
            const dayEvents = allEvents.filter(evt => parseLD(evt.date).toDateString() === dateObj.toDateString());
            const hasMeeting = dayEvents.some(e => e.type === 'meeting');
            const hasBooking = dayEvents.some(e => e.type === 'booking');
            const hasNote = dayEvents.some(e => e.type === 'note');
            
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedCalendarDate(dateObj)}
                className={`h-8 w-full flex flex-col items-center justify-center text-xs font-semibold rounded-xl transition-all relative ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                    : isToday
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/25'
                      : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-gray-300'
                }`}
              >
                <span className="relative z-10 leading-none">{day}</span>
                <div className="flex gap-0.5 justify-center absolute bottom-1">
                  {hasMeeting && (
                    <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-purple-500'}`}></span>
                  )}
                  {hasBooking && (
                    <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`}></span>
                  )}
                  {hasNote && (
                    <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`}></span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-white pb-12 animate-fade-in">
      
      {/* ── Page Header & Community Highlight Card (Unified Layout) ── */}
      <div className="bg-white dark:bg-[#1E2E42] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 sm:p-8 text-slate-800 dark:text-white shadow-sm dark:shadow-none relative overflow-hidden flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 group">
        {/* Subtle premium light blue glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/[0.03] dark:bg-blue-500/[0.02] rounded-full blur-3xl pointer-events-none" />

        {/* Left: Premium Welcome & Metadata */}
        <div className="flex-1 min-w-0 relative z-10 space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Welcome back, {user?.first_name || 'Board Member'}! 
            </h1>
            <p className="text-slate-500 dark:text-gray-400 text-xs mt-1 font-medium">
              Here is a summary of your community's active operations today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="inline-flex items-center text-[10px] font-bold text-slate-600 dark:text-slate-350 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-xl border border-slate-200/50 dark:border-white/10 font-mono">
              Code: {community?.community_code || 'N/A'}
            </span>
            <span className="inline-flex items-center text-[10px] font-black text-blue-700 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-xl border border-blue-500/20">
              BOARD MEMBER PORTAL
            </span>
            {community?.address && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 dark:text-gray-300 bg-slate-50 dark:bg-white/[0.02] px-2.5 py-1 rounded-xl border border-slate-200/40 dark:border-white/5">
                <MapPin size={11} className="text-slate-400 dark:text-slate-400 flex-shrink-0" />
                {formatAddress(community?.address)}
              </span>
            )}
          </div>
        </div>

        <div className="relative z-10 w-full lg:w-auto mt-5 lg:mt-0 pt-5 lg:pt-0 border-t border-slate-200/60 dark:border-white/5 lg:border-t-0">
          <div className="grid grid-cols-2 sm:flex sm:flex-row sm:items-center sm:justify-around lg:justify-end gap-5 sm:gap-8 lg:gap-11 w-full">
            <div className="text-center flex flex-col items-center min-w-[65px]">
              <p className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">{stats?.total_residents ?? 0}</p>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-gray-450 uppercase tracking-widest mt-1">Members</p>
            </div>
            <div className="text-center flex flex-col items-center min-w-[65px]">
              <p className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-500 font-mono tracking-tight">{stats?.active_violations ?? 0}</p>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-gray-455 uppercase tracking-widest mt-1">Violations</p>
            </div>
            <div className="text-center flex flex-col items-center min-w-[65px]">
              <p className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">{stats?.open_requests ?? 0}</p>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-gray-455 uppercase tracking-widest mt-1">Service Req</p>
            </div>
            <div className="text-center flex flex-col items-center min-w-[65px]">
              <p className="text-3xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">{stats?.total_units ?? 0}</p>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-gray-455 uppercase tracking-widest mt-1">Total Units</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Workspace Grid (Top Row) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Top: Community Console navigation */}
        <div className="lg:col-span-7 bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-[#1E2E42]/80 dark:to-[#162535]/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-3 border-b border-slate-200/60 dark:border-white/[0.05] gap-3">
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white uppercase tracking-wider whitespace-nowrap">
                Quick Links
              </h3>
              <div className="flex flex-row items-center gap-2 sm:gap-3 flex-shrink-0">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest font-mono hidden sm:inline">
                  {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] sm:text-xs font-bold transition shadow-sm active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Download size={11} />
                  Export Report
                </button>
              </div>
            </div>

            {/* Quick Navigation Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {(() => {
                const filtered = consoleButtons.filter(btn => 
                  btn.label.toLowerCase().includes(searchQuery.toLowerCase())
                );
                if (filtered.length === 0) {
                  return (
                    <div className="col-span-3 text-center py-10 text-xs text-slate-400 dark:text-gray-505 font-mono">
                      No shortcuts found matching "{searchQuery}"
                    </div>
                  );
                }
                return filtered.map((btn, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePage(btn.page)}
                    className="relative group p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.05] bg-white/40 dark:bg-white/[0.02] hover:bg-gradient-to-br hover:from-blue-500/10 hover:to-blue-650/5 hover:border-blue-500/30 dark:hover:border-blue-400/30 text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-md flex flex-col justify-between h-28"
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-350 group-hover:bg-blue-500/10 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {btn.icon}
                      </div>
                      {btn.count !== undefined && btn.count > 0 && (
                        <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                          {btn.count}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors block mt-2 leading-tight">
                      {btn.label}
                    </span>
                  </button>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* Right Top: Calendar Schedules & Upcoming events */}
        <div className="lg:col-span-5 bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-[#1E2E42]/80 dark:to-[#162535]/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/60 dark:border-white/[0.05]">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                Calendar Schedule
              </h3>
              <button
                onClick={() => setActivePage('meetings')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold"
              >
                View Calendar
              </button>
            </div>

            {/* Premium Mini Calendar */}
            {renderDashboardCalendar()}

            {/* Checklist upcoming items */}
            <div className="space-y-2.5 mt-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest block mb-1 font-mono">
                  {selectedCalendarDate 
                    ? `Events on ${selectedCalendarDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : "Upcoming Events & Tasks"
                  }
                </span>
                {selectedCalendarDate && (
                  <button
                    onClick={() => setSelectedCalendarDate(null)}
                    className="text-[9px] text-blue-605 dark:text-blue-400 font-extrabold hover:underline uppercase transition"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              {(() => {
                const parseLD = (d) => { const s = String(d); const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? new Date(+m[1], +m[2]-1, +m[3]) : new Date(s); };
                const eventsToDisplay = selectedCalendarDate 
                  ? allEvents.filter(evt => parseLD(evt.date).toDateString() === selectedCalendarDate.toDateString())
                  : upcomingEvents;

                if (eventsToDisplay.length === 0) {
                  return (
                    <p className="text-xs text-slate-405 dark:text-gray-505 italic py-6 text-center bg-slate-50/30 dark:bg-black/10 rounded-2xl border border-dashed border-slate-200/60 dark:border-white/5 font-medium">
                      {selectedCalendarDate 
                        ? "No events scheduled for this day." 
                        : "No meetings, bookings or notes found."
                      }
                    </p>
                  );
                }

                const limit = 1;
                const slicedEvents = eventsToDisplay.slice(0, limit);
                const hasMore = eventsToDisplay.length > 0;

                return (
                  <div className="space-y-2">
                    {slicedEvents.map((evt, idx) => {
                      const parseLD2 = (d) => { const s = String(d); const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/); return m2 ? new Date(+m2[1], +m2[2]-1, +m2[3]) : new Date(s); };
                      const dateStr = parseLD2(evt.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      });
                      return (
                        <div 
                          key={evt.id} 
                          className="flex gap-3 items-center p-3 bg-white/40 dark:bg-white/[0.02] border border-slate-200/85 dark:border-white/[0.05] rounded-xl hover:border-blue-500/25 dark:hover:border-blue-400/25 hover:shadow-sm transition-all duration-200 cursor-pointer"
                          onClick={() => setActivePage('meetings')}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            evt.type === 'meeting' 
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' 
                              : evt.type === 'booking'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate">{evt.title}</p>
                            <span className="text-[10px] text-slate-455 dark:text-gray-500 font-semibold">{dateStr}</span>
                          </div>
                          <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider flex-shrink-0 ${
                            evt.type === 'meeting' 
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' 
                              : evt.type === 'booking'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {evt.type === 'meeting' ? 'Meeting' : evt.type === 'booking' ? 'Booking' : 'Note'}
                          </span>
                        </div>
                      );
                    })}
                    {hasMore && (
                      <button
                        type="button"
                        onClick={() => setActivePage('meetings')}
                        className="w-full py-2 bg-blue-50 hover:bg-blue-100 dark:bg-white/5 dark:hover:bg-white/10 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-extrabold transition border border-blue-200/50 dark:border-white/5 shadow-sm text-center uppercase tracking-wider block"
                      >
                        + View All {eventsToDisplay.length} Events
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

      </div>

      {/* ── Main Workspace Grid (Bottom Row) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Bottom: Resident Join Requests */}
        <div className="lg:col-span-7 bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-[#1E2E42]/80 dark:to-[#162535]/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200/60 dark:border-white/10 flex items-center justify-between bg-white/30 dark:bg-white/[0.01]">
            <div className="flex items-center space-x-2">
              <UserPlus className="w-5 h-5 text-blue-500" />
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">Resident Join Requests</h2>
            </div>
            <span className="px-2.5 py-1 text-xs font-mono font-bold bg-amber-500/10 text-amber-600 rounded-full">
              {requests.length} Pending
            </span>
          </div>

          <div className="flex-1">
            {loadingRequests ? (
              <div className="p-10 text-center text-slate-500 dark:text-gray-400 font-mono text-xs">
                Fetching active approval pool records...
              </div>
            ) : requests.length === 0 ? (
              <div className="p-10 text-center text-slate-500 dark:text-gray-400 flex flex-col justify-center items-center py-16">
                <p className="text-sm font-bold text-slate-800 dark:text-white">No pending resident requests found for this community.</p>
                <p className="text-xs text-slate-400 dark:text-gray-500 mt-1.5 font-mono">Everything is cleared up! </p>
              </div>
            ) : (
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[360px] overflow-y-auto custom-scrollbar">
                {requests.map((req) => (
                  <div
                    key={req.request_id}
                    className="bg-white/40 dark:bg-white/[0.01] border border-slate-200/60 dark:border-white/[0.03] rounded-2xl p-4 flex flex-col gap-3.5 hover:border-blue-500/20 dark:hover:border-blue-400/20 transition duration-150 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {(req.full_name?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-850 dark:text-white text-sm truncate">{req.full_name}</div>
                        <div className="text-xs text-slate-400 dark:text-gray-500 truncate">{req.email_id || req.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">
                        Unit {req.unit_no || 'N/A'}
                      </span>
                      <span className="text-slate-400 dark:text-gray-505 font-mono">
                        {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {req.id_proof_url ? (
                        <a
                          href={getBaseUrl(req.id_proof_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-blue-500/10 hover:bg-blue-500 text-blue-600 hover:text-white rounded-xl border border-blue-500/20 transition-all"
                        >
                          ID Proof
                        </a>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-mono">No ID</span>
                      )}
                      {req.address_proof_url ? (
                        <a
                          href={getBaseUrl(req.address_proof_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-purple-500/10 hover:bg-purple-500 text-purple-600 hover:text-white rounded-xl border border-purple-500/20 transition-all"
                        >
                          Address Proof
                        </a>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-mono">No Address</span>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                      <button
                        disabled={actionId !== null}
                        onClick={() => handleRequestAction(req.request_id, 'APPROVE')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        disabled={actionId !== null}
                        onClick={() => handleRequestAction(req.request_id, 'REJECT')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Bottom: Interactive Tasks */}
        <div className="lg:col-span-5 bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-[#1E2E42]/80 dark:to-[#162535]/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-4 pb-3 border-b border-slate-200/60 dark:border-white/[0.05]">
              Quick Notes & Tasks
            </h3>
            
            <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Add a quick note or reminder task..."
                className="flex-1 bg-white/40 dark:bg-[#0D1B2A]/60 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
              />
              <button
                type="submit"
                className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition shadow-md shadow-blue-500/10 active:scale-95 flex-shrink-0"
              >
                <Plus size={14} />
              </button>
            </form>

            <div className="space-y-2 max-h-[175px] overflow-y-auto custom-scrollbar pr-1">
              {quickTasks.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-gray-500 italic pl-1 py-8 text-center">
                  No quick notes or tasks yet. Add one above!
                </p>
              ) : (
                quickTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 p-3 bg-white/30 dark:bg-white/[0.03] hover:bg-slate-100/50 dark:hover:bg-white/[0.06] border border-slate-200/50 dark:border-white/[0.08] rounded-xl transition duration-150"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                          task.completed
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 dark:border-white/20 hover:border-blue-500'
                        }`}
                      >
                        {task.completed && <Check size={11} className="stroke-[3]" />}
                      </button>
                      <span
                        className={`text-xs font-semibold truncate ${
                          task.completed
                            ? 'line-through text-slate-400 dark:text-gray-505'
                            : 'text-slate-800 dark:text-slate-250'
                        }`}
                      >
                        {task.text}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 hover:bg-red-500/10 rounded text-slate-400 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-500 transition flex-shrink-0"
                      title="Delete task"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-3.5 italic text-right">
             Auto-saved locally
          </p>
        </div>

      </div>

      {/* ── Export Report Modal ── */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gradient-to-br dark:from-[#1E2E42] dark:to-[#162535] rounded-3xl p-8 w-full max-w-md border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white shadow-2xl flex flex-col">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              Export Report
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-6">
              Select the type of report and format for {community.name}
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1.5 block">Report Type</label>
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition"
                >
                  <option value="violations">Violation Report</option>
                  <option value="payments">Payment Report</option>
                  <option value="servicerequests">Service Request Report</option>
                  <option value="bookings">Amenity Booking Report</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1.5 block">Export Format</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition"
                >
                  <option value="csv">CSV (Supported)</option>
                  <option value="excel">Excel (.xlsx)</option>
                  <option value="pdf">PDF Document</option>
                </select>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 dark:text-gray-500 italic mb-6">
              * Note: Full history of records will be generated for download.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={exporting}
                onClick={handleExportReport}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center min-w-[80px]"
              >
                {exporting ? "Exporting..." : "Export"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BoardDashboard;