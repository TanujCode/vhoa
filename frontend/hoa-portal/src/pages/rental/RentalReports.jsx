import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, FileText, Wrench, CreditCard, Building2, Users } from 'lucide-react';
import API from '../../services/api';

const RentalReports = ({ user, selectedPropertyFilterId = 'all', setActivePage }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);
  const [exportFormats, setExportFormats] = useState({
    properties: 'csv',
    leases: 'csv',
    payments: 'csv',
    maintenance: 'csv'
  });

  useEffect(() => {
    fetchStats();
  }, [selectedPropertyFilterId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/rental/reports/stats?property_id=${selectedPropertyFilterId}`);
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch rental report stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    const format = exportFormats[type] || 'csv';
    try {
      setExporting(type);
      const response = await API.get(`/rental/reports/export?type=${type}&format=${format}&property_id=${selectedPropertyFilterId}`, {
        responseType: 'blob',
      });
      
      const fileExt = format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'csv';
      const contentType = format === 'pdf' ? 'application/pdf' : format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv';

      const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rental_report_${type}_${selectedPropertyFilterId}_${new Date().toISOString().slice(0,10)}.${fileExt}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(`Export failed for type: ${type} format: ${format}`, err);
      alert('Failed to generate report export. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  const handleFormatChange = (type, val) => {
    setExportFormats(prev => ({ ...prev, [type]: val }));
  };

  if (loading && !stats) {
    return (
      <div className="p-20 text-center text-slate-500 dark:text-gray-400">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        Loading rental reports & analytics...
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

  // Helper values for calculations
  const totalLeasesCount = stats.leases.total || 0;
  const activeLeasesCount = stats.leases.active || 0;
  const pendingSigCount = stats.leases.pending_signature || 0;

  const totalPaymentsCount = stats.ledgers.total_count || 0;
  const paidPaymentsCount = stats.ledgers.by_status?.PAID || 0;
  const unpaidPaymentsCount = stats.ledgers.by_status?.UNPAID || 0;
  const overduePaymentsCount = stats.ledgers.by_status?.OVERDUE || 0;

  const totalMaintCount = stats.maintenance.total || 0;
  const openMaintCount = stats.maintenance.by_status?.OPEN || 0;
  const resolvedMaintCount = stats.maintenance.by_status?.COMPLETED || 0;
  const inProgressMaintCount = (stats.maintenance.by_status?.IN_PROGRESS || 0) + (stats.maintenance.by_status?.VENDOR_ASSIGNED || 0);

  return (
    <div className="text-slate-900 dark:text-white text-left">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Card 1: Revenue Collected */}
        <div 
          onClick={() => setActivePage && setActivePage('rent_ledger')}
          className="bg-gradient-to-br from-white to-slate-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm font-semibold text-slate-500 dark:text-gray-400">Revenue Collected</div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            ${stats.ledgers.total_collected.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-semibold">
            ✓ {paidPaymentsCount} payments settled
          </div>
        </div>

        {/* Card 2: Overdue Invoices */}
        <div 
          onClick={() => setActivePage && setActivePage('rent_ledger')}
          className="bg-gradient-to-br from-white to-slate-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm font-semibold text-slate-500 dark:text-gray-400">Overdue Rent</div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-450 flex items-center justify-center">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            ${stats.ledgers.total_overdue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </div>
          <div className="text-xs text-rose-600 dark:text-rose-400 mt-2 font-semibold">
            ⚠️ {overduePaymentsCount} invoices overdue
          </div>
        </div>

        {/* Card 3: Active Leases */}
        <div 
          onClick={() => setActivePage && setActivePage('leases_hub')}
          className="bg-gradient-to-br from-white to-slate-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm font-semibold text-slate-500 dark:text-gray-400">Active Leases</div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {activeLeasesCount}
          </div>
          <div className="text-xs text-blue-500 mt-2 font-semibold">
            Out of {totalLeasesCount} total lease records
          </div>
        </div>

        {/* Card 4: Open Maintenance */}
        <div 
          onClick={() => setActivePage && setActivePage('servicereq')}
          className="bg-gradient-to-br from-white to-slate-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm font-semibold text-slate-500 dark:text-gray-400">Open Maintenance Requests</div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500 flex items-center justify-center">
              <Wrench size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {openMaintCount}
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-500 mt-2 font-semibold">
            {inProgressMaintCount} in progress • {resolvedMaintCount} resolved
          </div>
        </div>
      </div>

      {/* Reports Export Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Report 1: Properties Summary */}
        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <Building2 className="text-blue-500" size={20} /> Properties Summary
              </h3>
              
              <div className="flex items-center gap-2">
                <select 
                  value={exportFormats.properties}
                  onChange={(e) => handleFormatChange('properties', e.target.value)}
                  className="bg-white dark:bg-[#162535] border border-slate-200 dark:border-white/10 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none cursor-pointer"
                >
                  <option value="csv">CSV Format</option>
                  <option value="excel">Excel Format</option>
                  <option value="pdf">PDF Format</option>
                </select>
                <button
                  onClick={() => handleExport('properties')}
                  disabled={exporting === 'properties'}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <Download size={13} /> {exporting === 'properties' ? 'Downloading...' : 'Download'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-gray-400 mb-1">
                  <span>Properties in Portfolio</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{stats.properties_count}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-gray-400 mb-1">
                  <span>Units count</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{stats.units_count} total units</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full w-full" />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 border-t border-slate-200 dark:border-white/10 pt-4 text-xs text-slate-400 font-medium">
            ✓ Includes Property names, address fields, total units count, and occupancy breakdowns.
          </div>
        </div>

        {/* Report 2: Leases Hub Report */}
        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <FileText className="text-indigo-500" size={20} /> Lease Agreements Report
              </h3>
              
              <div className="flex items-center gap-2">
                <select 
                  value={exportFormats.leases}
                  onChange={(e) => handleFormatChange('leases', e.target.value)}
                  className="bg-white dark:bg-[#162535] border border-slate-200 dark:border-white/10 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none cursor-pointer"
                >
                  <option value="csv">CSV Format</option>
                  <option value="excel">Excel Format</option>
                  <option value="pdf">PDF Format</option>
                </select>
                <button
                  onClick={() => handleExport('leases')}
                  disabled={exporting === 'leases'}
                  className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-600 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <Download size={13} /> {exporting === 'leases' ? 'Downloading...' : 'Download'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-gray-400 mb-1">
                  <span>Active Leases</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{activeLeasesCount} / {totalLeasesCount}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-500" 
                    style={{ width: `${totalLeasesCount ? (activeLeasesCount / totalLeasesCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-gray-400 mb-1">
                  <span>Pending Signatures</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{pendingSigCount}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full transition-all duration-500" 
                    style={{ width: `${totalLeasesCount ? (pendingSigCount / totalLeasesCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 border-t border-slate-200 dark:border-white/10 pt-4 text-xs text-slate-400 font-medium">
            ✓ Includes Lease IDs, unit numbers, start/end timelines, monthly rent amounts, deposits, and status.
          </div>
        </div>

        {/* Report 3: Payments Ledger */}
        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-sm flex flex-col justify-between mt-8">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <CreditCard className="text-emerald-500" size={20} /> Payments & Invoices Report
              </h3>
              
              <div className="flex items-center gap-2">
                <select 
                  value={exportFormats.payments}
                  onChange={(e) => handleFormatChange('payments', e.target.value)}
                  className="bg-white dark:bg-[#162535] border border-slate-200 dark:border-white/10 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none cursor-pointer"
                >
                  <option value="csv">CSV Format</option>
                  <option value="excel">Excel Format</option>
                  <option value="pdf">PDF Format</option>
                </select>
                <button
                  onClick={() => handleExport('payments')}
                  disabled={exporting === 'payments'}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <Download size={13} /> {exporting === 'payments' ? 'Downloading...' : 'Download'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-gray-400 mb-1">
                  <span>Paid Invoices</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{paidPaymentsCount} / {totalPaymentsCount}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-500" 
                    style={{ width: `${totalPaymentsCount ? (paidPaymentsCount / totalPaymentsCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-gray-400 mb-1">
                  <span>Overdue Invoices</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{overduePaymentsCount}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-rose-500 h-full transition-all duration-500" 
                    style={{ width: `${totalPaymentsCount ? (overduePaymentsCount / totalPaymentsCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 border-t border-slate-200 dark:border-white/10 pt-4 text-xs text-slate-400 font-medium">
            ✓ Captures tenant names, invoice dues, amount metrics, settlement dates, payment channels, and transaction IDs.
          </div>
        </div>

        {/* Report 4: Maintenance desk */}
        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-sm flex flex-col justify-between mt-8">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <Wrench className="text-amber-500" size={20} /> Maintenance Desk Report
              </h3>
              
              <div className="flex items-center gap-2">
                <select 
                  value={exportFormats.maintenance}
                  onChange={(e) => handleFormatChange('maintenance', e.target.value)}
                  className="bg-white dark:bg-[#162535] border border-slate-200 dark:border-white/10 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none cursor-pointer"
                >
                  <option value="csv">CSV Format</option>
                  <option value="excel">Excel Format</option>
                  <option value="pdf">PDF Format</option>
                </select>
                <button
                  onClick={() => handleExport('maintenance')}
                  disabled={exporting === 'maintenance'}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <Download size={13} /> {exporting === 'maintenance' ? 'Downloading...' : 'Download'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-gray-400 mb-1">
                  <span>Resolved tickets</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{resolvedMaintCount} / {totalMaintCount}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full transition-all duration-500" 
                    style={{ width: `${totalMaintCount ? (resolvedMaintCount / totalMaintCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-gray-400 mb-1">
                  <span>Open requests</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{openMaintCount}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full transition-all duration-500" 
                    style={{ width: `${totalMaintCount ? (openMaintCount / totalMaintCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 border-t border-slate-200 dark:border-white/10 pt-4 text-xs text-slate-400 font-medium">
            ✓ Includes request IDs, descriptions, priority levels, estimated job costs, payment statuses, and timelines.
          </div>
        </div>

      </div>
    </div>
  );
};

export default RentalReports;
