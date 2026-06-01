import React, { useState, useEffect } from 'react';
import { Check, X, Users, ClipboardList, AlertTriangle, Clock } from 'lucide-react';
import API, { getBaseUrl } from '../services/api'; 

export default function BoardDashboard({ community, user }) {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total_residents: 0, pending_requests: 0, open_issues: 0 });
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [actionId, setActionId] = useState(null); // Loader tracking for button clicks

  useEffect(() => {
    if (community?.community_id || community?.id) {
      fetchDashboardData();
    }
  }, [community]);

  const fetchDashboardData = async () => {
    try {
      setLoadingRequests(true);
      const commId = community?.community_id || community?.id;
      
      // 1. Fetch pending join requests from backend
      const requestsRes = await API.get(`/community/${commId}/join-requests/pending`);
      setRequests(requestsRes.data || []);

      // 2. Fetch real statistics from backend
      try {
        const statsRes = await API.get(`/community/${commId}/stats`);
        const statsData = statsRes.data;
        
        setStats({
          total_residents: statsData.total_residents || 0,
          pending_requests: requestsRes.data?.length || 0,
          open_issues: statsData.active_violations || 0
        });
      } catch (statsErr) {
        console.error("Failed to fetch stats:", statsErr);
        // Fallback if stats API fails
        setStats({
          total_residents: community?.total_members || 0,
          pending_requests: requestsRes.data?.length || 0,
          open_issues: 0
        });
      }
    } catch (err) {
      console.error("Failed to sync board metrics:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  // 🔥 ACTION HANDLER: Approve ya Reject submit karne ke liye
  const handleRequestAction = async (requestId, actionType) => {
    try {
      setActionId(requestId);
      const commId = community?.community_id || community?.id;

      // Backend API fire karo
      await API.post(`/community/${commId}/join-requests/${requestId}/action`, {
        action: actionType // "APPROVE" ya "REJECT"
      });

      // UI state local update karke row hatao aur counter change karo
      const updatedRequests = requests.filter(r => r.request_id !== requestId);
      setRequests(updatedRequests);
      setStats(prev => ({
        ...prev,
        pending_requests: updatedRequests.length,
        total_residents: actionType === 'APPROVE' ? prev.total_residents + 1 : prev.total_residents
      }));

    } catch (err) {
      alert(`Failed to execute ${actionType.toLowerCase()} action. Please retry.`);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-7">
      {/* Upper Welcome Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 dark:border-white/10 pb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Welcome Back, {user?.first_name || 'Board Member'}! 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-mono">
            Managing: <span className="text-teal-500 font-sans font-semibold">{community?.name || 'Your Community'}</span>
          </p>
        </div>
      </div>

      {/* Stats Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 flex items-center space-x-4 shadow-sm">
          <div className="p-3 rounded-xl bg-teal-500/10 text-teal-500"><Users className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Total Residents</p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{stats.total_residents}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 flex items-center space-x-4 shadow-sm">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500"><Clock className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Pending Approvals</p>
            <p className="text-2xl font-bold mt-1 text-amber-500">{stats.pending_requests}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 flex items-center space-x-4 shadow-sm">
          <div className="p-3 rounded-xl bg-red-500/10 text-red-500"><AlertTriangle className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Open Violations</p>
            <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">{stats.open_issues}</p>
          </div>
        </div>
      </div>

      {/* 🔥 DYNAMIC APPROVAL TABLE COMPONENT */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ClipboardList className="w-5 h-5 text-teal-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Resident Join Requests</h2>
          </div>
          <span className="px-2.5 py-1 text-xs font-mono font-bold bg-amber-500/10 text-amber-500 rounded-full">
            {requests.length} Pending
          </span>
        </div>

        {loadingRequests ? (
          <div className="p-10 text-center text-gray-500 dark:text-gray-400 font-mono text-xs">
            Fetching active approval pool records...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-10 text-center text-gray-500 dark:text-gray-400">
            <p className="text-sm">No pending resident requests found for this community.</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Everything is cleared up! 👍</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0d1622] text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/10">
                  <th className="p-4">Resident Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Unit / Block</th>
                  <th className="p-4">Requested Date</th>
                  <th className="p-4">Verification Docs</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/10 text-sm">
                {requests.map((req) => (
                  <tr key={req.request_id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium text-gray-955 dark:text-white">{req.full_name}</td>
                    <td className="p-4 text-gray-500 dark:text-gray-400">{req.email_id || req.email}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">
                        Unit {req.unit_no || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-gray-400 font-mono">
                      {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {req.id_proof_url ? (
                          <a
                            href={getBaseUrl(req.id_proof_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 text-xs font-semibold bg-blue-500/10 hover:bg-blue-500 text-blue-600 hover:text-white rounded-xl border border-blue-500/20 transition-all"
                          >
                            ID Proof
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400 font-mono">No ID</span>
                        )}
                        {req.address_proof_url ? (
                          <a
                            href={getBaseUrl(req.address_proof_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 text-xs font-semibold bg-purple-500/10 hover:bg-purple-500 text-purple-600 hover:text-white rounded-xl border border-purple-500/20 transition-all"
                          >
                            Address Proof
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400 font-mono">No Address</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          disabled={actionId !== null}
                          onClick={() => handleRequestAction(req.request_id, 'APPROVE')}
                          className="flex items-center justify-center p-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-lg transition-all disabled:opacity-50"
                          title="Approve Resident"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          disabled={actionId !== null}
                          onClick={() => handleRequestAction(req.request_id, 'REJECT')}
                          className="flex items-center justify-center p-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all disabled:opacity-50"
                          title="Reject Request"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}