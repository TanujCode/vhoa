import React, { useState, useEffect } from 'react';
import { 
  Wrench, Plus, Clock, CheckCircle2, AlertTriangle, 
  Send, DollarSign, UserCheck, ShieldAlert, Sparkles, 
  Search, X, Edit, ChevronDown 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import API from '../../services/api';

// Standardized Badge components matching reference
const StatusBadge = ({ status }) => {
  const map = {
    OPEN: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20',
    IN_PROGRESS: 'text-amber-600 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20',
    VENDOR_ASSIGNED: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/20',
    COMPLETED: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20',
    CANCELLED: 'text-rose-600 dark:text-rose-450 bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase whitespace-nowrap ${map[status] || 'text-gray-500 border-gray-500/20 bg-gray-500/10'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const map = {
    LOW: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20',
    NORMAL: 'text-blue-600 dark:text-blue-450 bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20',
    HIGH: 'text-amber-600 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20',
    URGENT: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase whitespace-nowrap ${map[priority] || 'text-gray-500 border-gray-500/20 bg-gray-500/10'}`}>
      {priority}
    </span>
  );
};

export default function RentalMaintenanceDesk({ user, selectedPropertyFilterId = 'all' }) {
  const isLandlord = user?.role === 'landlord' || user?.role_name === 'landlord' || user?.role_id === 1;

  const [requests, setRequests] = useState([]);
  const [leases, setLeases] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Tenant submit request states
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [selectedLeaseId, setSelectedLeaseId] = useState('');

  // Landlord action states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignVendorId, setAssignVendorId] = useState('');
  const [estCost, setEstCost] = useState('0');
  const [statusVal, setStatusVal] = useState('OPEN');
  // Payment states
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState('ACH');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      
      // Fetch maintenance requests
      const reqRes = await API.get('/rental/maintenance');
      setRequests(reqRes.data);

      // If tenant, fetch leases to get a lease ID for the request form
      const leaseRes = await API.get('/rental/leases');
      setLeases(leaseRes.data);
      if (leaseRes.data.length > 0) {
        setSelectedLeaseId(leaseRes.data[0].lease_id);
      }

      // If landlord, fetch vendors to allow assignment
      if (isLandlord) {
        const vendorRes = await API.get('/rental/vendors');
        setVendors(vendorRes.data);
        if (vendorRes.data.length > 0) {
          setAssignVendorId(vendorRes.data[0].vendor_id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitRequest(e) {
    e.preventDefault();
    if (!selectedLeaseId) {
      toast.error("You must have an active lease to submit a maintenance request.");
      return;
    }
    try {
      const res = await API.post('/rental/maintenance', {
        lease_id: parseInt(selectedLeaseId),
        title,
        description,
        priority
      });
      setRequests(prev => [...prev, res.data]);
      setShowSubmitModal(false);
      setTitle('');
      setDescription('');
      setPriority('NORMAL');
      toast.success("Maintenance request successfully filed! Landlord has been notified.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit request.");
    }
  }

  async function handleUpdateWorkOrder(e) {
    e.preventDefault();
    try {
      const params = {};
      if (statusVal) params.status = statusVal;
      if (assignVendorId) params.vendor_id = parseInt(assignVendorId);
      if (estCost) params.estimated_cost = parseFloat(estCost);

      const queryParams = new URLSearchParams(params).toString();
      const res = await API.post(`/rental/maintenance/${selectedRequest.request_id}?${queryParams}`);
      
      setRequests(prev => prev.map(r => r.request_id === selectedRequest.request_id ? res.data : r));
      setShowAssignModal(false);
      toast.success(`Work order #${selectedRequest.request_id} successfully updated!`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update work order.");
    }
  }

  async function handlePayMaintenance(e) {
    e.preventDefault();
    try {
      setPaying(true);
      const res = await API.post(`/rental/maintenance/${selectedRequest.request_id}/pay`, {
        payment_method: payMethod
      });
      setRequests(prev => prev.map(r => r.request_id === selectedRequest.request_id ? res.data : r));
      setShowPayModal(false);
      toast.success(`Repair cost of $${selectedRequest.estimated_cost} successfully paid via mock ${payMethod}!`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit payment.");
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 bg-slate-50 dark:bg-[#0D1B2A] rounded-3xl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-semibold text-gray-550 dark:text-gray-400 font-mono tracking-wider">LOADING TICKETS...</p>
        </div>
      </div>
    );
  }

  // Filter requests by property first
  const propertyFilteredRequests = requests.filter(r => 
    selectedPropertyFilterId === 'all' || String(r.property_id) === String(selectedPropertyFilterId)
  );

  // Compute stats
  const totalCount = propertyFilteredRequests.length;
  const openCount = propertyFilteredRequests.filter(r => r.status === 'OPEN').length;
  const inProgressCount = propertyFilteredRequests.filter(r => r.status === 'IN_PROGRESS' || r.status === 'VENDOR_ASSIGNED').length;
  const completedCount = propertyFilteredRequests.filter(r => r.status === 'COMPLETED').length;

  // Filter requests by search query next
  const filteredRequests = propertyFilteredRequests.filter(r => 
    r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.vendor_company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.request_id?.toString().includes(searchQuery)
  );

  return (
    <div className="space-y-8 text-left animate-fade-in font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-905 dark:text-white tracking-tight">Maintenance Desk</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Submit, schedule, and track work orders and repairs.</p>
        </div>

        {!isLandlord && (
          <button
            onClick={() => setShowSubmitModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-md shadow-blue-500/20 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Request
          </button>
        )}
      </div>



      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#1E2E42] border border-slate-200/80 dark:border-white/10 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-450 dark:text-gray-400 block uppercase font-bold tracking-wider">Total Requests</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalCount}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E2E42] border border-slate-200/80 dark:border-white/10 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-450 dark:text-gray-400 block uppercase font-bold tracking-wider">Open Tickets</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{openCount}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E2E42] border border-slate-200/80 dark:border-white/10 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition">
          <div className="p-3 bg-[#A855F7]/10 text-[#A855F7] rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-450 dark:text-gray-400 block uppercase font-bold tracking-wider">In Progress</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{inProgressCount}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E2E42] border border-slate-200/80 dark:border-white/10 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-450 dark:text-gray-400 block uppercase font-bold tracking-wider">Completed</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* Requests List Card Container formatted as a Table */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
        
        {/* Header Section */}
        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-slate-800 dark:text-white font-medium text-sm flex items-center gap-2">
            <Wrench size={16} /> Active Maintenance Tickets
          </div>
          
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by title, vendor or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-2xl pl-9 pr-9 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-650 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">No maintenance requests found matching your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 uppercase text-[10px] tracking-wider font-bold text-slate-500 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-4">Ticket</th>
                  <th className="px-4 py-4">Description</th>
                  <th className="px-4 py-4">Urgency</th>
                  <th className="px-4 py-4">HOA Vendor</th>
                  <th className="px-4 py-4">Cost</th>
                  <th className="px-4 py-4 text-center">Payment</th>
                  <th className="px-4 py-4 text-center">Status</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-gray-300">
                {filteredRequests.map(req => (
                  <tr key={req.request_id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition group">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-[10px] text-gray-450 uppercase font-mono tracking-wider block mb-0.5">#{req.request_id}</span>
                      <span className="text-slate-900 dark:text-white font-medium group-hover:text-blue-650 dark:group-hover:text-blue-400 transition-colors">{req.title}</span>
                    </td>
                    <td className="px-4 py-4 max-w-[240px]">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate leading-relaxed" title={req.description}>{req.description}</p>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <PriorityBadge priority={req.priority} />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {req.vendor_company_name ? (
                        <span className="text-slate-900 dark:text-gray-300 font-medium">{req.vendor_company_name}</span>
                      ) : (
                        <span className="text-slate-450 italic text-xs">Pending assignment</span>
                      )}
                    </td>
                    <td className="px-4 py-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {req.estimated_cost > 0 ? `$${req.estimated_cost}` : '$0.00'}
                    </td>
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      {req.estimated_cost > 0 ? (
                        req.payment_status === 'PAID' ? (
                          <div className="flex flex-col items-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-emerald-500/10 text-emerald-500 border-emerald-500/20" title={`Paid via ${req.payment_method} | Txn: ${req.transaction_id}`}>
                              PAID
                            </span>
                            <span className="text-[9px] text-gray-450 mt-0.5 uppercase tracking-wide">via {req.payment_method}</span>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-rose-500/10 text-rose-500 border-rose-500/20">
                            UNPAID
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400 text-xs italic">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      {isLandlord ? (
                        <button
                          disabled={req.status === 'COMPLETED' || req.status === 'CANCELLED'}
                          onClick={() => { setSelectedRequest(req); setStatusVal(req.status); setEstCost(req.estimated_cost.toString()); setAssignVendorId(req.vendor_id || ''); setShowAssignModal(true); }}
                          className="bg-blue-600/10 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-white/5 disabled:text-slate-450 dark:disabled:text-gray-500 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-1"
                        >
                          <Edit size={12} />
                          <span>Manage</span>
                        </button>
                      ) : (
                        req.payment_status === 'UNPAID' && req.estimated_cost > 0 ? (
                          <button
                            onClick={() => { setSelectedRequest(req); setPayMethod('ACH'); setShowPayModal(true); }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                          >
                            <DollarSign className="w-3.5 h-3.5" /> Pay Cost
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs italic">No actions</span>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tenant Submit Request Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e2a3b] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl animate-scale-up text-slate-900 dark:text-white text-left">
            <div className="flex justify-between items-center border-b dark:border-white/5 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-500" /> Submit Maintenance Request
              </h3>
              <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white text-lg cursor-pointer"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              {leases.length > 1 && (
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">SELECT LEASE UNIT *</label>
                  <div className="relative">
                    <select
                      value={selectedLeaseId}
                      onChange={e=>setSelectedLeaseId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none appearance-none cursor-pointer"
                    >
                      {leases.map(l => (
                        <option key={l.lease_id} value={l.lease_id}>Lease #{l.lease_id} (Unit {l.unit?.unit_number})</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-450 pointer-events-none" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">ISSUE TITLE / HEADING *</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={e=>setTitle(e.target.value)}
                  placeholder="e.g. Kitchen Sink Pipe Leakage"
                  className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">DETAILED DESCRIPTION *</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={e=>setDescription(e.target.value)}
                  placeholder="Please describe the repair issue, when it started, and exact location inside the property..."
                  className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">URGENCY PRIORITY *</label>
                <div className="relative">
                  <select
                    value={priority}
                    onChange={e=>setPriority(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none appearance-none cursor-pointer"
                  >
                    <option value="LOW">Low (Cosmetic, non-urgent)</option>
                    <option value="NORMAL">Medium (Normal standard repair)</option>
                    <option value="HIGH">High (Impacts daily comfort)</option>
                    <option value="URGENT">Urgent (Safety issue / flooding)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-450 pointer-events-none" />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowSubmitModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 transition-all shadow-md shadow-blue-500/25">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Landlord Manage Request Modal */}
      {showAssignModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e2a3b] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl animate-scale-up text-slate-905 dark:text-white text-left">
            <div className="flex justify-between items-center border-b dark:border-white/5 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" /> Manage Work Order
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white text-lg cursor-pointer"><X size={20} /></button>
            </div>

            <div className="bg-slate-50 dark:bg-[#111c2a] p-3.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs text-gray-500 space-y-1">
              <div><strong className="text-slate-900 dark:text-white font-medium">Title:</strong> {selectedRequest.title}</div>
              <div><strong className="text-slate-900 dark:text-white font-medium">Details:</strong> {selectedRequest.description}</div>
            </div>
            
            <form onSubmit={handleUpdateWorkOrder} className="space-y-4">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">WORK ORDER STATUS *</label>
                <div className="relative">
                  <select
                    value={statusVal}
                    onChange={e=>setStatusVal(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none appearance-none cursor-pointer"
                  >
                    <option value="OPEN">Open (Awaiting review)</option>
                    <option value="IN_PROGRESS">In Progress (Reviewing contractors)</option>
                    <option value="VENDOR_ASSIGNED">Vendor Assigned</option>
                    <option value="COMPLETED">Completed (Repairs done)</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-450 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">ASSIGN APPROVED HOA VENDOR / CONTRACTOR</label>
                <div className="relative">
                  <select
                    value={assignVendorId}
                    onChange={e=>setAssignVendorId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none appearance-none cursor-pointer"
                  >
                    <option value="">-- Do Not Assign / Keep Pending --</option>
                    {vendors.map(v => (
                      <option key={v.vendor_id} value={v.vendor_id}>{v.company_name} ({v.category})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-450 pointer-events-none" />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1.5">Select from the community network of certified professionals.</p>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">ESTIMATED REPAIR COST ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-450">$</span>
                  <input
                    type="number"
                    value={estCost}
                    onChange={e=>setEstCost(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg pl-7 pr-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAssignModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 transition-all shadow-md shadow-blue-500/25">Apply Updates</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Maintenance Modal */}
      {showPayModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e2a3b] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl animate-scale-up text-slate-905 dark:text-white text-left">
            <div className="flex justify-between items-center border-b dark:border-white/5 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" /> Pay Repair Invoice
              </h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white text-lg cursor-pointer"><X size={20} /></button>
            </div>

            <div className="bg-slate-50 dark:bg-[#111c2a] p-3.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs text-gray-500 space-y-2">
              <div><strong className="text-slate-900 dark:text-white font-medium">Ticket:</strong> {selectedRequest.title}</div>
              {selectedRequest.vendor_company_name && (
                <div><strong className="text-slate-900 dark:text-white font-medium">Vendor:</strong> {selectedRequest.vendor_company_name}</div>
              )}
              <div className="text-sm font-bold text-slate-900 dark:text-white border-t dark:border-white/10 pt-2 flex justify-between">
                <span>Amount Due:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">${selectedRequest.estimated_cost}</span>
              </div>
            </div>

            <form onSubmit={handlePayMaintenance} className="space-y-4">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">PAYMENT METHOD</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPayMethod('ACH')}
                    className={`p-3 rounded-xl border text-center transition-all text-xs font-bold cursor-pointer ${
                      payMethod === 'ACH'
                        ? 'border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400'
                        : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-gray-400'
                    }`}
                  >
                    🏦 Bank ACH
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('CARD')}
                    className={`p-3 rounded-xl border text-center transition-all text-xs font-bold cursor-pointer ${
                      payMethod === 'CARD'
                        ? 'border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400'
                        : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-gray-400'
                    }`}
                  >
                    💳 Credit Card
                  </button>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowPayModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" disabled={paying} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-500 transition-all disabled:opacity-50 shadow-md shadow-emerald-500/25">
                  {paying ? 'Processing...' : 'Submit Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
