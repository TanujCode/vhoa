import React from 'react';
import { Bell, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const NotifPanel = ({ isOpen, onClose, notifications = [], onMarkAllRead, lastReadTimestamp }) => {
  const lastRead = lastReadTimestamp !== undefined ? lastReadTimestamp : Number(localStorage.getItem('last_read_notifications') || 0);
  const unreadCount = notifications.filter(n => new Date(n.created_at).getTime() > lastRead).length;

  // Helper to format/clean description to look professional
  const cleanDescription = (desc) => {
    if (!desc) return "";
    let clean = desc;
    
    // Simplify "User: Name (ID: ..., Email: ..., Role: ...)" -> "Name"
    clean = clean.replace(/User:\s+([^(]+)\s+\(ID:[^)]+\)/gi, '$1');
    clean = clean.replace(/User:\s+([^(]+)\s+\([^)]+\)/gi, '$1');
    
    // Format "Service Request 15" -> "Service Request #15"
    clean = clean.replace(/Service Request\s+(\d+)/gi, 'Service Request #$1');
    
    // Strip time zone / audit time stamp if any
    clean = clean.replace(/\.?\s*Time\s*\(ET\):.*$/gi, '');
    
    // Nice arrow symbol transition
    clean = clean.replace(/\s+->\s+/g, ' ➔ ');
    
    return clean.trim();
  };

  // Format relative time helper
  const formatRelativeTime = (dateString) => {
    if (!dateString) return "Recent";
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    if (diffMs < 0) return "Just now";
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Map notifications to details
  const getNotifDetails = (log) => {
    const action = log.action || "";
    const module = log.module || "";
    
    let details = {
      title: action.replace(/_/g, ' '),
      icon: Bell,
      color: "text-slate-400"
    };

    if (module === 'violation') {
      details.icon = AlertTriangle;
      details.color = "text-red-400";
      if (action.includes("CREATE")) details.title = "New Violation Reported";
      else if (action.includes("STATUS")) details.title = "Violation Status Updated";
    } else if (module === 'service_request') {
      details.icon = Clock;
      details.color = "text-blue-400";
      if (action.includes("CREATE")) details.title = "New Service Request";
      else if (action.includes("STATUS") || action.includes("DETAILS")) details.title = "Service Request Updated";
    } else if (module === 'payment') {
      details.icon = CheckCircle;
      details.color = "text-teal-400";
      if (action.includes("RECEIVE") || action.includes("CREATE")) details.title = "Payment Processed";
    } else if (module === 'auth') {
      details.icon = Bell;
      details.color = "text-amber-400";
      if (action === 'LOGIN_FAILED') details.title = "Failed Login Attempt";
      else if (action === 'ACCOUNT_LOCKED') details.title = "Account Locked";
      else if (action === 'LOGIN') details.title = "User Logged In";
    }

    return details;
  };

  return (
    <div className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-full sm:w-96 bg-white dark:bg-[#162535] border-l border-slate-200 dark:border-white/10 shadow-2xl transform transition-transform duration-300 z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#1E3248] sticky top-0">
        <div className="flex items-center gap-3">
          <Bell className="text-teal-500" size={22} />
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
              {unreadCount} new
            </span>
          )}
        </div>
        <button 
          onClick={onClose} 
          className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-white transition"
        >
          ✕
        </button>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto custom-scrollbar h-full pb-20">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Bell size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
          </div>
        ) : (
          notifications.map((log) => {
            const details = getNotifDetails(log);
            const isUnread = new Date(log.created_at).getTime() > lastRead;
            const IconComponent = details.icon;
            return (
              <div 
                key={log.audit_id}
                className={`p-5 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition ${isUnread ? 'bg-teal-50/50 dark:bg-teal-900/10' : ''}`}
              >
                <div className="flex gap-4">
                  <div className={`w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center ${details.color.replace('text-', 'bg-').replace('400', '500')}/10`}>
                    <IconComponent size={20} className={details.color} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-[15px] truncate">{details.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-snug break-words">
                      {cleanDescription(log.description)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{formatRelativeTime(log.created_at)}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#162535]">
        <button 
          onClick={onMarkAllRead}
          className="w-full py-3 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-white/5 rounded-2xl text-sm font-medium transition"
        >
          Mark all as read
        </button>
      </div>
    </div>
  );
};

export default NotifPanel;