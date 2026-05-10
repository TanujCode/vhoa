import React from 'react';
import { Bell, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const NotifPanel = ({ isOpen, onClose }) => {
  const notifications = [
    {
      id: 1,
      type: "violation",
      title: "New Violation Reported",
      message: "Unapproved construction at House #324",
      time: "2 min ago",
      read: false,
      icon: AlertTriangle,
      color: "text-red-400"
    },
    {
      id: 2,
      type: "payment",
      title: "Payment Received",
      message: "₹12,500 received from Mr. Sharma",
      time: "15 min ago",
      read: false,
      icon: CheckCircle,
      color: "text-teal-400"
    },
    {
      id: 3,
      type: "request",
      title: "Service Request Updated",
      message: "Water leakage complaint marked as In Progress",
      time: "1 hour ago",
      read: true,
      icon: Clock,
      color: "text-blue-400"
    },
    {
      id: 4,
      type: "meeting",
      title: "Board Meeting Reminder",
      message: "Annual General Meeting tomorrow at 7 PM",
      time: "3 hours ago",
      read: true,
      icon: Bell,
      color: "text-amber-400"
    },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-96 bg-white dark:bg-[#162535] border-l border-slate-200 dark:border-white/10 shadow-2xl transform transition-transform duration-300 z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

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
      <div className="overflow-y-auto h-full pb-20">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Bell size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id}
              className={`p-5 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition ${!notif.read ? 'bg-teal-50 dark:bg-teal-900/20' : ''}`}
            >
              <div className="flex gap-4">
                <div className={`w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center ${notif.color.replace('text-', 'bg-').replace('400', '500')}/10`}>
                  <notif.icon size={20} className={notif.color} />
                </div>
                
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white text-[15px]">{notif.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-snug">
                    {notif.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{notif.time}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#162535]">
        <button className="w-full py-3 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-white/5 rounded-2xl text-sm font-medium transition">
          Mark all as read
        </button>
      </div>
    </div>
  );
};

export default NotifPanel;