import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, BarChart2, ShieldAlert, Wrench, CreditCard, Calendar, Users, ChevronDown, FileSpreadsheet, FileText, FileDown, AlertTriangle, DollarSign, User, Waves, CalendarDays, CheckCircle2 } from 'lucide-react';
import API from '../services/api';

const Reports = ({ community, user, setActivePage }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null); // 'violations'|'servicerequests'|'payments'|'bookings'

  useEffect(() => {
    if (community?.community_id) {
      fetchStats();
    }
  }, [community]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/report/${community.community_id}/stats`);
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch report stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type, format = 'csv') => {
    try {
      setExporting(type);
      setOpenDropdown(null);
      const response = await API.get(`/report/${community.community_id}/export?type=${type}`, {
        responseType: 'blob',
      });

      const mimeMap = { csv: 'text/csv', pdf: 'application/pdf', excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
      const extMap  = { csv: 'csv',      pdf: 'pdf',            excel: 'xlsx' };

      const blob = new Blob([response.data], { type: mimeMap[format] });
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `report_${type}_${community.community_id}_${new Date().toISOString().slice(0,10)}.${extMap[format]}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Export failed for type: ${type}`, err);
      alert('Failed to generate report export. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  // Close dropdown when clicking outside
  const handleOutsideClick = () => setOpenDropdown(null);

  const ExportDropdown = ({ reportType, colorClass, iconColorClass }) => (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpenDropdown(openDropdown === reportType ? null : reportType)}
        disabled={exporting === reportType}
        className={`flex items-center gap-1.5 ${colorClass} px-3 py-2 rounded-xl text-xs font-semibold transition`}
      >
        <Download size={13} />
        {exporting === reportType ? 'Exporting...' : 'Export'}
        <ChevronDown size={12} className={`transition-transform ${openDropdown === reportType ? 'rotate-180' : ''}`} />
      </button>
      {openDropdown === reportType && (
        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-50 min-w-[130px] overflow-hidden">
          <button
            onClick={() => handleExport(reportType, 'csv')}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5 transition"
          >
            <FileDown size={13} className="text-blue-500" /> CSV File
          </button>
          <button
            onClick={() => handleExport(reportType, 'excel')}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5 transition"
          >
            <FileSpreadsheet size={13} className="text-emerald-500" /> Excel File
          </button>
          <button
            onClick={() => handleExport(reportType, 'pdf')}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5 transition"
          >
            <FileText size={13} className="text-red-500" /> PDF File
          </button>
        </div>
      )}
    </div>
  );

  if (loading && !stats) {
    return (
      <div className="p-20 text-center text-slate-500 dark:text-gray-400">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        Loading community reports & analytics...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-20 text-center text-slate-500 dark:text-gray-400">
        <p className="text-lg font-medium">Failed to load reports summary.</p>
        <button onClick={fetchStats} className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-500 transition">
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="text-slate-900 dark:text-white">

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div 
          onClick={() => setActivePage('violations')}
          className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm font-semibold text-slate-500 dark:text-gray-400">Total Fines Issued</div>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 dark:bg-red-500/20 text-red-500 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">${stats.violations.fine_amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          <div className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1"><AlertTriangle size={11} /> {stats.violations.total} total violations issued</div>
        </div>

        <div 
          onClick={() => setActivePage('payments')}
          className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm font-semibold text-slate-500 dark:text-gray-400">Revenue Collected</div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">${stats.payments.total_collected.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          <div className="text-xs text-blue-500 mt-2 font-medium flex items-center gap-1"><CheckCircle2 size={11} /> {stats.payments.total_count} transactions completed</div>
        </div>

        <div 
          onClick={() => setActivePage('servicereq')}
          className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm font-semibold text-slate-500 dark:text-gray-400">Active Service Requests</div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 flex items-center justify-center">
              <Wrench size={20} />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {stats.service_requests.total}
          </div>
          <div className="text-xs text-blue-500 mt-2 font-medium">
            Pending: {stats.service_requests.by_status?.OPEN || 0} Open, {stats.service_requests.by_status?.IN_PROGRESS || 0} In Progress
          </div>
        </div>

        <div 
          onClick={() => setActivePage('members')}
          className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm font-semibold text-slate-500 dark:text-gray-400">Total Residents</div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 flex items-center justify-center">
              <User size={20} />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.residents_count}</div>
          <div className="text-xs text-indigo-500 mt-2 font-medium">Active registered accounts</div>
        </div>
      </div>

      {/* Reports Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" onClick={handleOutsideClick}>
        
        {/* Violations Report */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <ShieldAlert className="text-red-500" size={20} /> Violations Report
              </h3>
              <ExportDropdown reportType="violations" colorClass="bg-red-500/10 hover:bg-red-500/20 dark:bg-[#3B1C1C] dark:hover:bg-[#5C2323] text-red-600 dark:text-red-400" />
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-gray-400 mb-1">
                  <span>Paid Violations</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{stats.violations.by_status?.PAID || 0} / {stats.violations.total}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full transition-all duration-500" 
                    style={{ width: `${stats.violations.total ? ((stats.violations.by_status?.PAID || 0) / stats.violations.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-gray-400 mb-1">
                  <span>Open & Unpaid</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{stats.violations.by_status?.OPEN || 0}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-red-500 h-full transition-all duration-500" 
                    style={{ width: `${stats.violations.total ? ((stats.violations.by_status?.OPEN || 0) / stats.violations.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-gray-400 mb-1">
                  <span>Appealed / Disputed</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{stats.violations.disputed}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full transition-all duration-500" 
                    style={{ width: `${stats.violations.total ? (stats.violations.disputed / stats.violations.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 border-t border-slate-200 dark:border-white/10 pt-4 text-xs text-slate-400">
            ✓ Captures fine amounts, dispute resolutions, and timestamps.
          </div>
        </div>

        {/* Service Requests Report */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Wrench className="text-blue-500" size={20} /> Service Requests Report
              </h3>
              <ExportDropdown reportType="servicerequests" colorClass="bg-blue-500/10 hover:bg-blue-500/20 dark:bg-[#1E3248] dark:hover:bg-white/5 text-blue-600 dark:text-blue-400" />
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-gray-400 mb-1">
                  <span>Resolved & Closed Requests</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{stats.service_requests.by_status?.CLOSED || 0} / {stats.service_requests.total}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full transition-all duration-500" 
                    style={{ width: `${stats.service_requests.total ? ((stats.service_requests.by_status?.CLOSED || 0) / stats.service_requests.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-gray-400 mb-1">
                  <span>Open (Awaiting Review)</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{stats.service_requests.by_status?.OPEN || 0}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full transition-all duration-500" 
                    style={{ width: `${stats.service_requests.total ? ((stats.service_requests.by_status?.OPEN || 0) / stats.service_requests.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-gray-400 mb-1">
                  <span>In Progress / Vendor Assigned</span>
                  <span className="font-semibold text-slate-800 dark:text-white">
                    {(stats.service_requests.by_status?.IN_PROGRESS || 0) + (stats.service_requests.by_status?.VENDOR_ASSIGNED || 0)}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full transition-all duration-500" 
                    style={{ width: `${stats.service_requests.total ? (((stats.service_requests.by_status?.IN_PROGRESS || 0) + (stats.service_requests.by_status?.VENDOR_ASSIGNED || 0)) / stats.service_requests.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 border-t border-slate-200 dark:border-white/10 pt-4 text-xs text-slate-400">
            ✓ Captures resident details, vendor assignments, and dates.
          </div>
        </div>

        {/* Payments & Financials Report */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <CreditCard className="text-blue-500" size={20} /> Payments & Financials
              </h3>
              <ExportDropdown reportType="payments" colorClass="bg-blue-500/10 hover:bg-blue-500/20 dark:bg-blue-500/20 dark:hover:bg-blue-500/30 text-blue-600 dark:text-blue-400" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-white/5 pb-2">
                <span className="text-slate-500 dark:text-gray-400">HOA Monthly Dues</span>
                <span className="font-semibold text-slate-800 dark:text-white">${(stats.payments.by_reason?.HOA_FEE || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-white/5 pb-2">
                <span className="text-slate-500 dark:text-gray-400">Amenity Booking Fees</span>
                <span className="font-semibold text-slate-800 dark:text-white">${(stats.payments.by_reason?.AMENITY_BOOKING || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-white/5 pb-2">
                <span className="text-slate-500 dark:text-gray-400">Violation Fine Payments</span>
                <span className="font-semibold text-slate-800 dark:text-white">${(stats.payments.by_reason?.VIOLATION || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm pb-1">
                <span className="text-slate-500 dark:text-gray-400">Total HOA Revenue</span>
                <span className="font-bold text-blue-500">${stats.payments.total_collected.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="mt-6 border-t border-slate-200 dark:border-white/10 pt-4 text-xs text-slate-400">
            ✓ Captures escrow bank transactions, reasons, and reference IDs.
          </div>
        </div>

        {/* Amenity Bookings Report */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Calendar className="text-indigo-500" size={20} /> Amenity Bookings Report
              </h3>
              <ExportDropdown reportType="bookings" colorClass="bg-indigo-500/10 hover:bg-indigo-500/20 dark:bg-white/5 text-indigo-600 dark:text-indigo-400" />
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-[#0D1B2A]/50 p-4 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-white/5">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{stats.amenity_bookings.amenities_count}</div>
                  <div className="text-xs text-slate-500 dark:text-gray-400">Total Active Amenities</div>
                </div>
                <div className="w-10 h-10 bg-blue-500/10 dark:bg-[#0D1B2A]/50 rounded-2xl flex items-center justify-center text-blue-500">
                  <Waves size={22} />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-[#0D1B2A]/50 p-4 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-white/5">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{stats.amenity_bookings.total}</div>
                  <div className="text-xs text-slate-500 dark:text-gray-400">Total Bookings Made</div>
                </div>
                <div className="w-10 h-10 bg-blue-500/10 dark:bg-[#0D1B2A]/50 rounded-2xl flex items-center justify-center text-blue-500">
                  <CalendarDays size={22} />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 border-t border-slate-200 dark:border-white/10 pt-4 text-xs text-slate-400">
            ✓ Captures booking dates, timeslots, fees, and status.
          </div>
        </div>

      </div>
    </div>
  );
};

export default Reports;
