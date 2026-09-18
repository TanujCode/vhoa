import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CreditCard,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Mail,
  Send,
  Sparkles,
  ArrowRight,
  BellRing
} from 'lucide-react';
import API from '../../services/api';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function RentalCalendarWidget({
  userRole = 'tenant',
  onNavigatePage,
  onPayRent,
  className = ''
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventsData, setEventsData] = useState({ events: [], next_rent_due: null });
  const [loading, setLoading] = useState(true);
  const [sendingReminderId, setSendingReminderId] = useState(null);
  const [reminderToast, setReminderToast] = useState(null);

  const isLandlord = ['landlord', 'super_admin'].includes((userRole || '').toLowerCase());

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true);
      const res = await API.get('/rental/reminders/calendar-events');
      if (res.data) {
        setEventsData(res.data);
      }
    } catch (err) {
      console.error('Failed to load rental calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarEvents();
  }, []);

  const showToast = (msg, type = 'success') => {
    setReminderToast({ msg, type });
    setTimeout(() => setReminderToast(null), 4000);
  };

  const handleSendReminder = async (leaseId, e) => {
    if (e) e.stopPropagation();
    try {
      setSendingReminderId(leaseId);
      const res = await API.post(`/rental/reminders/send-rent-reminder/${leaseId}`);
      showToast(res.data?.message || 'Rent reminder email sent to tenant!', 'success');
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Failed to send reminder email.';
      showToast(errMsg, 'error');
    } finally {
      setSendingReminderId(null);
    }
  };

  const prevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const jumpToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarCells = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, daysInPrevMonth - i);
    calendarCells.push({ date: d, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    calendarCells.push({ date: dateObj, isCurrentMonth: true });
  }

  // Next month leading days to complete grid (only 35 slots if fits in 5 rows, else 42)
  const totalSlots = calendarCells.length > 35 ? 42 : 35;
  const remainingCells = totalSlots - calendarCells.length;
  for (let d = 1; d <= remainingCells; d++) {
    const dateObj = new Date(year, month + 1, d);
    calendarCells.push({ date: dateObj, isCurrentMonth: false });
  }

  const formatIsoDate = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getEventsForDate = (dateObj) => {
    const iso = formatIsoDate(dateObj);
    return (eventsData.events || []).filter(e => e.date === iso);
  };

  const todayIso = formatIsoDate(new Date());
  const selectedDateIso = formatIsoDate(selectedDate);
  const selectedEvents = getEventsForDate(selectedDate);

  return (
    <div className={`p-4 sm:p-4.5 rounded-3xl bg-white dark:bg-[#1E2E42] border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between text-left h-full ${className}`}>
      
      {/* Toast Alert */}
      {reminderToast && (
        <div className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-between mb-2 transition-all duration-300 ${
          reminderToast.type === 'success'
            ? 'bg-emerald-500 text-white dark:bg-emerald-600'
            : 'bg-rose-500 text-white dark:bg-rose-600'
        }`}>
          <div className="flex items-center gap-1.5">
            <BellRing size={13} className="animate-bounce" />
            <span className="truncate">{reminderToast.msg}</span>
          </div>
          <button onClick={() => setReminderToast(null)} className="text-white/80 hover:text-white font-bold ml-2">✕</button>
        </div>
      )}

      {/* Header with Navigation */}
      <div>
        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
              <CalendarIcon size={15} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Rent & Lease Schedule
              </h3>
              <span className="text-[10px] text-slate-450 dark:text-gray-400 font-medium">
                {MONTH_NAMES[month]} {year}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={jumpToToday}
              className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition"
            >
              Today
            </button>
            <button
              onClick={prevMonth}
              className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded text-slate-600 dark:text-gray-300 transition"
              title="Previous Month"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded text-slate-600 dark:text-gray-300 transition"
              title="Next Month"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Days Grid Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 dark:text-slate-400 mt-2 mb-1">
          {DAY_NAMES.map(day => (
            <div key={day}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((cell, idx) => {
            const cellIso = formatIsoDate(cell.date);
            const isToday = cellIso === todayIso;
            const isSelected = cellIso === selectedDateIso;
            const dayEvents = getEventsForDate(cell.date);
            const hasRentDue = dayEvents.some(e => e.event_type === 'RENT_DUE');
            const hasLeaseEvent = dayEvents.some(e => ['LEASE_START', 'LEASE_END'].includes(e.event_type));
            const isPaid = dayEvents.some(e => e.status === 'PAID');
            const isOverdue = dayEvents.some(e => e.status === 'OVERDUE');

            return (
              <div
                key={idx}
                onClick={() => setSelectedDate(cell.date)}
                className={`h-7 sm:h-7.5 p-0.5 rounded-lg flex flex-col items-center justify-between cursor-pointer transition-all duration-150 border ${
                  !cell.isCurrentMonth
                    ? 'opacity-20 border-transparent'
                    : isSelected
                    ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                    : isToday
                    ? 'bg-amber-500/10 border-amber-400/50 text-slate-900 dark:text-white'
                    : hasRentDue
                    ? 'border-amber-300/40 dark:border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10'
                    : 'border-slate-100/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15'
                }`}
              >
                <span
                  className={`text-[10px] font-bold leading-none ${
                    isToday
                      ? 'w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] font-black'
                      : isSelected
                      ? 'font-black text-blue-600 dark:text-blue-400'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {cell.date.getDate()}
                </span>

                {/* Status Indicator Dots */}
                <div className="flex items-center gap-0.5">
                  {isOverdue && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Overdue Rent"></span>
                  )}
                  {hasRentDue && !isOverdue && isPaid && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Rent Paid"></span>
                  )}
                  {hasRentDue && !isOverdue && !isPaid && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Rent Due"></span>
                  )}
                  {hasLeaseEvent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500" title="Lease Milestone"></span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[9px] font-semibold text-slate-400 dark:text-slate-400 pt-2 mt-1.5 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Rent Due</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Paid</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span>Overdue</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
            <span>Lease</span>
          </div>
        </div>
      </div>

      {/* Selected Date Inspector Card (Ultra-Compact) */}
      <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-[#162535] border border-slate-100 dark:border-white/5 mt-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 font-mono">
            {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          {selectedDateIso === todayIso && (
            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 uppercase">
              Today
            </span>
          )}
        </div>

        {selectedEvents.length === 0 ? (
          <p className="text-[10px] text-slate-450 dark:text-slate-400 font-medium mt-0.5">
            No payments or lease milestones on this date.
          </p>
        ) : (
          selectedEvents.map((ev, i) => (
            <div key={i} className="flex items-center justify-between gap-2.5 pt-2 mt-2 border-t border-slate-100/80 dark:border-white/5 first:border-0 first:pt-0 first:mt-0">
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <div className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${
                  ev.event_type === 'RENT_DUE'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                }`}>
                  {ev.event_type === 'RENT_DUE' ? <CreditCard size={13} /> : <FileText size={13} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h5 className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {ev.title}
                    </h5>
                    {ev.status && (
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase ${
                        ev.status === 'PAID' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                        ev.status === 'OVERDUE' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20' :
                        'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}>
                        {ev.status}
                      </span>
                    )}
                  </div>
                  {(ev.tenant_name || ev.unit_label) && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                      {isLandlord && ev.tenant_name ? (
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {ev.tenant_name}
                        </span>
                      ) : null}
                      {isLandlord && ev.tenant_name && ev.unit_label ? ' • ' : ''}
                      <span>{ev.unit_label || ''}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              {!isLandlord && ev.event_type === 'RENT_DUE' && ev.status !== 'PAID' && (
                <button
                  onClick={() => onPayRent ? onPayRent() : onNavigatePage && onNavigatePage('rent_ledger')}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] transition shadow-sm shrink-0"
                >
                  Pay Now
                </button>
              )}

              {isLandlord && ev.event_type === 'RENT_DUE' && (
                <button
                  disabled={sendingReminderId === ev.lease_id}
                  onClick={(e) => handleSendReminder(ev.lease_id, e)}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-[10px] transition shadow-sm shrink-0 flex items-center gap-1"
                >
                  {sendingReminderId === ev.lease_id ? 'Sending...' : <><Send size={11} /> Remind</>}
                </button>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}
