import React, { useState, useEffect } from 'react';
import { 
  FileText, CheckCircle, Clock, Plus, DollarSign, 
  TrendingUp, Users, Building, Copy, Check, RefreshCw, Sparkles
} from 'lucide-react';
import { getContracts } from '../services/contractService';

// ── Sales Stat Card ─────────────────────────────────
const SalesStatCard = ({ label, value, icon: Icon, color, sub, prefix = "" }) => (
  <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 transition-all duration-300 hover:border-slate-200 dark:hover:border-white/20 hover:-translate-y-1 shadow-sm dark:shadow-none">
    <div className="flex items-center justify-between mb-3">
      <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">{label}</p>
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${color} shadow-inner`}>
        <Icon size={18} className="text-white" />
      </div>
    </div>
    <p className="text-4xl font-mono font-bold mt-1 text-slate-900 dark:text-white">
      {prefix}{typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : (value ?? '—')}
    </p>
    {sub && <p className="text-xs text-slate-500 dark:text-gray-500 mt-2 font-sans">{sub}</p>}
  </div>
);

export default function SalesDashboard({ setActivePage }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await getContracts();
      setContracts(data || []);
    } catch (err) {
      setErrorMsg('Failed to load contract stream records.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Metrics calculations
  const totalContracts = contracts.length;
  const onboardedContracts = contracts.filter(c => c.status === 'ONBOARDED');
  const activeContracts = contracts.filter(c => c.status === 'ACTIVE');
  const draftContracts = contracts.filter(c => c.status === 'DRAFT');

  // Realized Revenue = setup fee + annual fee for ONBOARDED clients
  const realizedRevenue = onboardedContracts.reduce((acc, curr) => {
    const setup = parseFloat(curr.one_time_set_up) || 0;
    const annual = parseFloat(curr.annual_renewal_fee) || 0;
    return acc + setup + annual;
  }, 0);

  // Pipeline Revenue = potential revenue from ACTIVE/DRAFT contracts
  const pipelineRevenue = contracts.filter(c => c.status !== 'ONBOARDED').reduce((acc, curr) => {
    const setup = parseFloat(curr.one_time_set_up) || 0;
    const annual = parseFloat(curr.annual_renewal_fee) || 0;
    return acc + setup + annual;
  }, 0);

  // Plan Selected Distribution
  const planCounts = { Standard: 0, Premium: 0, Enterprise: 0, Custom: 0 };
  contracts.forEach(c => {
    const plan = c.plan_selected || 'Custom';
    if (planCounts[plan] !== undefined) {
      planCounts[plan]++;
    } else {
      planCounts.Custom++;
    }
  });

  const onboardingRate = totalContracts ? Math.round((onboardedContracts.length / totalContracts) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Sales agent Dashboard <Sparkles className="text-teal-600 dark:text-teal-400" size={24} />
          </h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1">Aggregated statistics, pipeline forecasting, and onboarding telemetry</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="px-5 py-2.5 bg-slate-200/60 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-2xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 border border-slate-300/30 dark:border-white/5 active:scale-95 disabled:opacity-60"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh Stats
          </button>
          <button
            onClick={() => setActivePage('contracts')}
            className="px-5 py-2.5 bg-[#1D9E75] hover:bg-[#15805d] text-white rounded-2xl text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-teal-600/10 dark:shadow-teal-950/20 active:scale-95"
          >
            <Plus size={15} /> Create Contract
          </button>
        </div>
      </div>

      {loading && contracts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Calculating sales aggregates...
        </div>
      ) : (
        <>
          {/* Main Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SalesStatCard
              label="Realized Revenue"
              value={realizedRevenue}
              icon={DollarSign}
              color="bg-emerald-600"
              prefix="$"
              sub="Paid by onboarded clients"
            />
            <SalesStatCard
              label="Forecasted Pipeline"
              value={pipelineRevenue}
              icon={TrendingUp}
              color="bg-blue-600"
              prefix="$"
              sub="From active and draft codes"
            />
            <SalesStatCard
              label="Onboarded Clients"
              value={onboardedContracts.length}
              icon={Building}
              color="bg-purple-600"
              sub={`${onboardingRate}% overall conversion rate`}
            />
            <SalesStatCard
              label="Total Contracts"
              value={totalContracts}
              icon={FileText}
              color="bg-teal-600"
              sub={`${activeContracts.length} active codes ready`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Plan Distribution Progress */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm dark:shadow-none flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5">Subscription Plan Breakdown</h3>
                <div className="space-y-4">
                  {Object.entries(planCounts).map(([plan, count]) => {
                    const pct = totalContracts ? Math.round((count / totalContracts) * 100) : 0;
                    const barColor = 
                      plan === 'Standard' ? 'bg-teal-500' :
                      plan === 'Premium' ? 'bg-blue-500' :
                      plan === 'Enterprise' ? 'bg-purple-500' : 'bg-gray-500';
                    return (
                      <div key={plan}>
                        <div className="flex justify-between text-sm mb-1.5 font-medium">
                          <span className="text-slate-700 dark:text-gray-300">{plan} Plan</span>
                          <span className="text-slate-500 dark:text-gray-400 font-mono">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-2 overflow-hidden">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="border-t border-slate-100 dark:border-white/5 pt-4 mt-6 flex justify-between items-center text-xs text-slate-500 dark:text-gray-500">
                <span>Standard values based on pricing guidelines</span>
                <span className="text-teal-600 dark:text-[#25C490] hover:underline cursor-pointer" onClick={() => setActivePage('contracts')}>Edit Prices</span>
              </div>
            </div>

            {/* Status Segment Gauge */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm dark:shadow-none flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5">Contract Onboarding Funnel</h3>
                <div className="flex items-center justify-center py-4">
                  {/* Visual Concentric Rings / Simple Progress Circles */}
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-white/5" />
                      <circle cx="50" cy="50" r="40" stroke="#1D9E75" strokeWidth="8" fill="transparent"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (251.2 * onboardingRate) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">{onboardingRate}%</span>
                      <p className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase mt-1 tracking-wider">Converted</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono border-t border-slate-100 dark:border-white/5 pt-4 mt-4">
                <div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold">{onboardedContracts.length}</div>
                  <div className="text-slate-500 dark:text-gray-500 text-[10px] uppercase">Onboarded</div>
                </div>
                <div>
                  <div className="text-blue-600 dark:text-blue-400 font-bold">{activeContracts.length}</div>
                  <div className="text-slate-500 dark:text-gray-500 text-[10px] uppercase">Active</div>
                </div>
                <div>
                  <div className="text-slate-700 dark:text-gray-400 font-bold">{draftContracts.length}</div>
                  <div className="text-slate-500 dark:text-gray-500 text-[10px] uppercase">Drafts</div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Notes */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm dark:shadow-none flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Sales Actions</h3>
                <p className="text-slate-500 dark:text-gray-400 text-xs leading-relaxed mb-4">Use these onboarding tools to distribute active codes or follow up with prospective HOA communities.</p>
                <div className="space-y-2">
                  <button
                    onClick={() => setActivePage('contracts')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-teal-50 dark:bg-[#1D9E75]/10 hover:bg-teal-100 dark:hover:bg-[#1D9E75]/20 text-teal-700 dark:text-[#25C490] border border-teal-200/50 dark:border-[#1D9E75]/20 rounded-xl transition duration-150 text-sm font-semibold text-left"
                  >
                    <span>Create & Copy Active Code</span>
                    <Plus size={16} />
                  </button>
                  <button
                    onClick={() => setActivePage('contracts')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-xl transition duration-150 text-sm font-semibold text-left"
                  >
                    <span>View Unused Codes</span>
                    <FileText size={16} />
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 p-3 rounded-2xl text-[11px] text-slate-500 dark:text-gray-500 leading-snug mt-4">
                💡 Tip: Copy the Onboarding Link for any Active contract code and email it directly to the property manager for quick self-onboarding.
              </div>
            </div>
          </div>

          {/* Directory of Onboarded Clients */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm dark:shadow-none">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-100 dark:border-white/5 pb-2">Recently Onboarded Clients</h3>
            {onboardedContracts.length === 0 ? (
              <p className="text-slate-500 dark:text-gray-400 py-10 text-center text-sm">No client registrations have completed onboarding yet.</p>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/5 text-slate-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-3 py-4">Client Name</th>
                      <th className="px-3 py-4 whitespace-nowrap">Business / Management</th>
                      <th className="px-3 py-4 font-mono whitespace-nowrap">Contract Code</th>
                      <th className="px-3 py-4 whitespace-nowrap">Plan Selected</th>
                      <th className="px-3 py-4 whitespace-nowrap">Max Units</th>
                      <th className="px-3 py-4 whitespace-nowrap">Setup Fee</th>
                      <th className="px-3 py-4 text-right whitespace-nowrap">Renewal Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                    {onboardedContracts.slice(0, 5).map((contract) => (
                      <tr key={contract.contract_id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition">
                        <td className="px-3 py-4 font-medium text-slate-900 dark:text-white">
                          {contract.client_first_name} {contract.client_last_name}
                          <div className="text-[10px] text-slate-500 dark:text-gray-500 font-normal">{contract.client_email_address}</div>
                        </td>
                        <td className="px-3 py-4 text-slate-700 dark:text-gray-300 font-medium">
                          {contract.business_name || "N/A"}
                        </td>
                        <td className="px-3 py-4 font-mono whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-teal-700 dark:text-[#25C490] font-bold bg-teal-50 dark:bg-[#25C490]/10 px-2 py-0.5 rounded text-xs">{contract.contract_code}</span>
                            <button
                              onClick={() => handleCopyCode(contract.contract_code)}
                              className="text-slate-400 hover:text-slate-700 dark:text-gray-500 dark:hover:text-white transition"
                              title="Copy Code"
                            >
                              {copiedCode === contract.contract_code ? (
                                <Check size={13} className="text-green-400" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span className="text-xs font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-lg border border-blue-100 dark:border-blue-500/10">
                            {contract.plan_selected || "Custom"}
                          </span>
                        </td>
                        <td className="px-3 py-4 font-mono text-slate-700 dark:text-gray-300 whitespace-nowrap">
                          {contract.size_of_the_community || "Unlimited"}
                        </td>
                        <td className="px-3 py-4 font-mono text-slate-700 dark:text-gray-300 whitespace-nowrap">
                          ${parseFloat(contract.one_time_set_up || 0).toLocaleString()}
                        </td>
                        <td className="px-3 py-4 font-mono text-right text-emerald-700 dark:text-emerald-400 font-medium whitespace-nowrap">
                          ${parseFloat(contract.annual_renewal_fee || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
