import React, { useState, useEffect } from 'react';
import { 
  Wrench, Plus, Clock, CheckCircle2, AlertTriangle, 
  Send, DollarSign, UserCheck, ShieldAlert, Sparkles, 
  Search, X, Edit, ChevronDown, Droplets, Zap, Leaf, Shield, Bug, Wind,
  MessageSquare, XCircle, FileText, Filter, CreditCard, Landmark, Lightbulb, Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import API from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import { validateTicketTitle, validateTicketDescription } from '../../utils/fieldValidators';

const REQUEST_TYPES = [
  "Plumbing Issue",
  "Electrical Issue",
  "Carpentry Work",
  "Cleaning",
  "Security Issue",
  "Landscaping",
  "Painting",
  "Other"
];

const parseTitleAndType = (fullTitle) => {
  const match = (fullTitle || '').match(/^\[(.*?)\]\s*(.*)$/);
  if (match) {
    return {
      type: match[1],
      title: match[2]
    };
  }
  return {
    type: 'Other',
    title: fullTitle || ''
  };
};

// Standardized Badge components matching reference
const StatusBadge = ({ status }) => {
  const map = {
    OPEN: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    VENDOR_ASSIGNED: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
    IN_PROGRESS: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300',
    FORWARDED_TO_HOA: 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
    HOA_IN_PROGRESS: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
    COMPLETED: 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-450',
    CANCELLED: 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 dark:text-rose-450',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const config = {
    LOW: { label: 'Low', color: 'bg-green-500 text-green-600 dark:text-green-400' },
    NORMAL: { label: 'Medium', color: 'bg-yellow-500 text-yellow-600 dark:text-yellow-400 font-medium' },
    HIGH: { label: 'High', color: 'bg-red-500 text-red-600 dark:text-red-400' },
    URGENT: { label: 'Urgent', color: 'bg-red-500 text-red-600 dark:text-red-400' }
  };
  const item = config[priority] || { label: priority, color: 'bg-gray-400 text-gray-500 dark:text-gray-400' };
  const parts = item.color.split(' ');
  const circleColor = parts[0];
  const textColor = parts.slice(1).join(' ');
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${textColor}`}>
      {item.label} <span className={`w-2.5 h-2.5 rounded-full ${circleColor}`}></span>
    </span>
  );
};

const ScopeBadge = ({ scope }) => {
  const config = {
    INTERNAL: { label: 'Landlord Responsibility', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' },
    EXTERNAL_HOA: { label: 'HOA/COA Responsibility', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20' }
  };
  const item = config[scope] || { label: 'Landlord Responsibility', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.color}`}>
      {item.label}
    </span>
  );
};

const getRequestIconDetails = (title) => {
  const parsed = parseTitleAndType(title);
  const type = parsed.type.toLowerCase();
  
  if (type.includes('plumb') || type.includes('water') || type.includes('sink') || type.includes('leak') || type.includes('plumbing')) {
    return { Icon: Droplets, bg: 'bg-sky-500/10 dark:bg-sky-500/20', text: 'text-sky-600 dark:text-sky-400' };
  }
  if (type.includes('elect') || type.includes('light') || type.includes('power') || type.includes('electrical')) {
    return { Icon: Zap, bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400' };
  }
  if (type.includes('paint') || type.includes('brush') || type.includes('painting')) {
    return { Icon: Sparkles, bg: 'bg-rose-500/10 dark:bg-rose-500/20', text: 'text-rose-600 dark:text-rose-400' };
  }
  if (type.includes('landscap') || type.includes('garden') || type.includes('leaf') || type.includes('landscaping')) {
    return { Icon: Leaf, bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' };
  }
  if (type.includes('secur') || type.includes('lock') || type.includes('key') || type.includes('security')) {
    return { Icon: Shield, bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400' };
  }
  if (type.includes('clean') || type.includes('swee') || type.includes('trash') || type.includes('garbage') || type.includes('cleaning')) {
    return { Icon: Sparkles, bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400' };
  }
  if (type.includes('carpentr') || type.includes('wood') || type.includes('furniture') || type.includes('carpentry')) {
    return { Icon: Wrench, bg: 'bg-orange-500/10 dark:bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400' };
  }
  
  // Fallback checking on display title
  const name = parsed.title.toLowerCase();
  if (name.includes('paint') || name.includes('color') || name.includes('wall') || name.includes('brush')) {
    return { Icon: Sparkles, bg: 'bg-rose-500/10 dark:bg-rose-500/20', text: 'text-rose-600 dark:text-rose-400' };
  }
  if (name.includes('plumb') || name.includes('leak') || name.includes('water') || name.includes('pipe') || name.includes('drain') || name.includes('sink') || name.includes('toilet')) {
    return { Icon: Droplets, bg: 'bg-sky-500/10 dark:bg-sky-500/20', text: 'text-sky-600 dark:text-sky-400' };
  }
  if (name.includes('elect') || name.includes('light') || name.includes('power') || name.includes('wire') || name.includes('bulb') || name.includes('fan')) {
    return { Icon: Zap, bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400' };
  }
  if (name.includes('landscap') || name.includes('garden') || name.includes('tree') || name.includes('lawn') || name.includes('grass')) {
    return { Icon: Leaf, bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' };
  }
  if (name.includes('secur') || name.includes('guard') || name.includes('lock') || name.includes('cctv') || name.includes('key') || name.includes('door')) {
    return { Icon: Shield, bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400' };
  }
  if (name.includes('clean') || name.includes('swee') || name.includes('housekeep') || name.includes('trash') || name.includes('wash') || name.includes('garbage')) {
    return { Icon: Sparkles, bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400' };
  }
  if (name.includes('pest') || name.includes('bug') || name.includes('insect') || name.includes('termite')) {
    return { Icon: Bug, bg: 'bg-orange-500/10 dark:bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400' };
  }
  if (name.includes('ac') || name.includes('hvac') || name.includes('heat') || name.includes('cool') || name.includes('air') || name.includes('filter')) {
    return { Icon: Wind, bg: 'bg-cyan-500/10 dark:bg-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-400' };
  }
  return { Icon: Wrench, bg: 'bg-slate-500/10 dark:bg-slate-500/20', text: 'text-slate-600 dark:text-slate-400' };
};

export default function RentalMaintenanceDesk({ user, selectedPropertyFilterId = 'all' }) {
  const isLandlord = user?.role === 'landlord' || user?.role_name === 'landlord' || user?.role_id === 1;

  const [requests, setRequests] = useState([]);
  const [leases, setLeases] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('oldest');

  // Tenant submit request states
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [selectedLeaseId, setSelectedLeaseId] = useState('');
  const [errors, setErrors] = useState({});
  const [requestType, setRequestType] = useState('');
  const [scope, setScope] = useState('INTERNAL');
  const [editRequestType, setEditRequestType] = useState('');
  const activeLease = leases.find(l => String(l.lease_id) === String(selectedLeaseId || (leases[0] && leases[0].lease_id)));
  const isCondo = activeLease?.unit?.property_type === 'condo' || activeLease?.unit?.unit_number === 'Condo Unit';

  // Tenant edit & note modal states
  const [showTenantEditModal, setShowTenantEditModal] = useState(false);
  const [tenantEditTitle, setTenantEditTitle] = useState('');
  const [tenantEditDesc, setTenantEditDesc] = useState('');
  const [tenantEditPriority, setTenantEditPriority] = useState('NORMAL');

  const [showTenantNoteModal, setShowTenantNoteModal] = useState(false);
  const [tenantNoteText, setTenantNoteText] = useState('');

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
  const [confirmConfig, setConfirmConfig] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    confirmText: 'OK', 
    cancelText: 'Cancel', 
    onConfirm: null, 
    onCancel: null, 
    type: 'info', 
    singleButton: false 
  });

  const showAlert = (title, message, type = 'info') => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      confirmText: 'OK',
      singleButton: true,
      type,
      onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const showConfirm = (title, message, onConfirm, type = 'danger', confirmText = 'Yes, Proceed') => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText: 'Cancel',
      singleButton: false,
      type,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  useEffect(() => {
    fetchData();
    if (localStorage.getItem('open_create_ticket_modal') === 'true') {
      localStorage.removeItem('open_create_ticket_modal');
      setErrors({});
      setRequestType('');
      setTitle('');
      setDescription('');
      setPriority('NORMAL');
      setShowSubmitModal(true);
    }

    const handleGlobalUpdate = () => {
      fetchData();
    };
    window.addEventListener('rental-data-changed', handleGlobalUpdate);
    return () => {
      window.removeEventListener('rental-data-changed', handleGlobalUpdate);
    };
  }, [user?.property_name, user?.unit_number]);

  async function fetchData() {
    try {
      setLoading(true);
      
      const activeId = localStorage.getItem('tenant_active_lease_id');

      // 1. Fetch leases first to validate activeId
      const leaseRes = await API.get('/rental/leases');
      const allLeases = leaseRes.data;

      let validatedActiveId = activeId;
      if (!isLandlord && allLeases.length > 0) {
        const leaseExists = allLeases.some(l => String(l.lease_id) === String(activeId));
        if (!leaseExists) {
          // Fallback to active/first lease
          const primaryLease = allLeases.find(l => l.status === 'ACTIVE') || allLeases[0];
          validatedActiveId = String(primaryLease.lease_id);
          localStorage.setItem('tenant_active_lease_id', validatedActiveId);
        }
      }

      // 2. Filter leases by validatedActiveId
      const tenantLeases = !isLandlord && validatedActiveId
        ? allLeases.filter(l => String(l.lease_id) === String(validatedActiveId))
        : allLeases;
      setLeases(tenantLeases);
      if (tenantLeases.length > 0) {
        setSelectedLeaseId(tenantLeases[0].lease_id);
      }

      // 3. Fetch maintenance requests and filter by validatedActiveId
      const reqRes = await API.get('/rental/maintenance');
      const tenantReqs = !isLandlord && validatedActiveId
        ? reqRes.data.filter(r => String(r.lease_id) === String(validatedActiveId))
        : reqRes.data;
      setRequests(tenantReqs);

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
    
    const activeLease = leases.find(l => String(l.lease_id) === String(selectedLeaseId || (leases[0] && leases[0].lease_id)));
    const isCondo = activeLease?.unit?.property_type === 'condo' || activeLease?.unit?.unit_number === 'Condo Unit';

    // Front-end Validations
    const newErrors = {};
    if (!requestType) {
      newErrors.requestType = "Request Type is required.";
    }

    const titleErr = validateTicketTitle(title);
    if (titleErr !== true) {
      newErrors.title = titleErr;
    }

    const descErr = validateTicketDescription(description);
    if (descErr !== true) {
      newErrors.description = descErr;
    }

    if (isCondo && !scope) {
      newErrors.scope = "Location of Issue is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    let leaseIdToUse = selectedLeaseId;
    if (!leaseIdToUse && leases.length > 0) {
      leaseIdToUse = leases[0].lease_id;
      setSelectedLeaseId(leases[0].lease_id);
    }

    const finalTitle = `[${requestType}] ${title.trim()}`;

    try {
      const res = await API.post('/rental/maintenance', {
        lease_id: leaseIdToUse ? parseInt(leaseIdToUse) : 0,
        title: finalTitle,
        description: description.trim(),
        priority,
        scope: isCondo ? scope : 'INTERNAL'
      });
      setRequests(prev => [...prev, res.data]);
      setShowSubmitModal(false);
      setTitle('');
      setDescription('');
      setPriority('NORMAL');
      setRequestType('');
      setScope('INTERNAL');
      showAlert("Success", "Maintenance request successfully filed! Landlord has been notified.", "success");
    } catch (err) {
      showAlert("Error", err.response?.data?.detail || "Failed to submit request.", "danger");
    }
  }

  async function handleTenantEditSubmit(e) {
    e.preventDefault();
    if (!selectedRequest) return;

    // Front-end Validations
    const newErrors = {};
    if (!editRequestType) {
      newErrors.requestType = "Request Type is required.";
    }

    const titleErr = validateTicketTitle(tenantEditTitle);
    if (titleErr !== true) {
      newErrors.title = titleErr;
    }

    const descErr = validateTicketDescription(tenantEditDesc);
    if (descErr !== true) {
      newErrors.description = descErr;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const finalTitle = `[${editRequestType}] ${tenantEditTitle.trim()}`;

    try {
      const res = await API.put(`/rental/maintenance/${selectedRequest.request_id}/tenant-update`, {
        title: finalTitle,
        description: tenantEditDesc.trim(),
        priority: tenantEditPriority
      });
      setRequests(prev => prev.map(r => r.request_id === selectedRequest.request_id ? res.data : r));
      setShowTenantEditModal(false);
      showAlert("Success", "Maintenance request updated successfully!", "success");
    } catch (err) {
      showAlert("Error", err.response?.data?.detail || "Failed to update request.", "danger");
    }
  }

  async function handleTenantNoteSubmit(e) {
    e.preventDefault();
    if (!selectedRequest) return;
    
    // Front-end Validations
    const newErrors = {};
    if (!tenantNoteText || !tenantNoteText.trim()) {
      newErrors.note = "Note is required.";
    } else if (tenantNoteText.trim().length < 5) {
      newErrors.note = "Note must be at least 5 characters long.";
    } else if (tenantNoteText.trim().length > 500) {
      newErrors.note = "Note cannot exceed 500 characters.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    try {
      const res = await API.post(`/rental/maintenance/${selectedRequest.request_id}/note`, {
        note: tenantNoteText.trim()
      });
      setRequests(prev => prev.map(r => r.request_id === selectedRequest.request_id ? res.data : r));
      setShowTenantNoteModal(false);
      setTenantNoteText('');
      showAlert("Success", "Note sent to landlord successfully!", "success");
    } catch (err) {
      showAlert("Error", err.response?.data?.detail || "Failed to send note.", "danger");
    }
  }

  async function handleTenantCancelRequest(req) {
    showConfirm(
      "Cancel Maintenance Request",
      `Are you sure you want to cancel maintenance request #${req.request_id}?`,
      async () => {
        try {
          const res = await API.post(`/rental/maintenance/${req.request_id}/cancel`);
          setRequests(prev => prev.map(r => r.request_id === req.request_id ? res.data : r));
          showAlert("Success", `Request #${req.request_id} has been cancelled.`, "success");
        } catch (err) {
          showAlert("Error", err.response?.data?.detail || "Failed to cancel request.", "danger");
        }
      },
      "danger",
      "Yes, Cancel"
    );
  }

  async function handleUpdateWorkOrder(e) {
    e.preventDefault();

    // Front-end Validations
    const newErrors = {};
    if (statusVal === 'VENDOR_ASSIGNED' && !assignVendorId) {
      newErrors.vendor_id = "Please select a vendor to assign.";
    }

    const parsedCost = parseFloat(estCost);
    if (statusVal === 'VENDOR_ASSIGNED' && (isNaN(parsedCost) || parsedCost < 0)) {
      newErrors.est_cost = "Estimated cost must be 0 or a positive number.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    try {
      const params = {};
      if (statusVal) params.status = statusVal;
      
      // Only set vendor_id and estimated_cost if assigning a vendor
      if (statusVal === 'VENDOR_ASSIGNED') {
        if (assignVendorId) params.vendor_id = parseInt(assignVendorId);
        params.estimated_cost = parsedCost;
      }

      const queryParams = new URLSearchParams(params).toString();
      const res = await API.post(`/rental/maintenance/${selectedRequest.request_id}?${queryParams}`);
      
      setRequests(prev => prev.map(r => r.request_id === selectedRequest.request_id ? res.data : r));
      setShowAssignModal(false);
      showAlert("Success", `Work order #${selectedRequest.request_id} successfully updated!`, "success");
    } catch (err) {
      showAlert("Error", err.response?.data?.detail || "Failed to update work order.", "danger");
    }
  }

  async function handlePayMaintenance(e) {
    e.preventDefault();

    // Front-end Validations
    if (payMethod !== 'ACH' && payMethod !== 'CREDIT_CARD') {
      showAlert("Validation Error", "Please select a valid payment method.", "warning");
      return;
    }

    try {
      setPaying(true);
      const res = await API.post(`/rental/maintenance/${selectedRequest.request_id}/pay`, {
        payment_method: payMethod
      });
      setRequests(prev => prev.map(r => r.request_id === selectedRequest.request_id ? res.data : r));
      setShowPayModal(false);
      showAlert("Success", `Repair cost of $${selectedRequest.estimated_cost} successfully paid via mock ${payMethod}!`, "success");
    } catch (err) {
      showAlert("Error", err.response?.data?.detail || "Failed to submit payment.", "danger");
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

  // Filter requests by search query, status and priority next
  const filteredRequests = propertyFilteredRequests.filter(r => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      r.title?.toLowerCase().includes(query) ||
      r.description?.toLowerCase().includes(query) ||
      r.vendor_company_name?.toLowerCase().includes(query) ||
      r.status?.toLowerCase().includes(query) ||
      r.request_id?.toString().includes(query);

    const matchesStatus = !statusFilter || r.status === statusFilter;
    const matchesPriority = !priorityFilter || r.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_date) - new Date(a.created_date);
    }
    if (sortBy === 'oldest') {
      return new Date(a.created_date) - new Date(b.created_date);
    }
    if (sortBy === 'priority') {
      const priorityMap = { HIGH: 3, NORMAL: 2, LOW: 1 };
      const aVal = priorityMap[a.priority] || 0;
      const bVal = priorityMap[b.priority] || 0;
      if (bVal !== aVal) return bVal - aVal;
      return new Date(b.created_date) - new Date(a.created_date);
    }
    return 0;
  });

  return (
    <div className="space-y-8 text-left animate-fade-in font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Maintenance Desk</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Submit, schedule, and track work orders and repairs.</p>
        </div>

        {!isLandlord && (
          <button
            onClick={() => { setErrors({}); setRequestType(''); setTitle(''); setDescription(''); setPriority('NORMAL'); setShowSubmitModal(true); }}
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
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
          <h2 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Wrench size={16} /> Active Maintenance Tickets
          </h2>
          
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full lg:w-auto lg:justify-end">
            {/* Search Bar */}
            <div className="relative w-full sm:w-60">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100/60 dark:bg-[#1E3248] border border-slate-200/80 dark:border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-all shadow-inner"
              />
            </div>

            {/* Status Filter */}
            <div className="relative w-full sm:w-auto">
              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto bg-slate-100/60 dark:bg-[#1E3248] border border-slate-200/80 dark:border-white/10 rounded-2xl pl-4 pr-10 py-2.5 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none appearance-none cursor-pointer transition-colors"
              >
                <option value="" className="text-slate-900 dark:text-white">Status (All)</option>
                <option value="OPEN" className="text-slate-900 dark:text-white">Open</option>
                <option value="VENDOR_ASSIGNED" className="text-slate-900 dark:text-white">Vendor Assigned</option>
                <option value="IN_PROGRESS" className="text-slate-900 dark:text-white">In Progress</option>
                <option value="FORWARDED_TO_HOA" className="text-slate-900 dark:text-white">Forwarded to HOA/COA</option>
                <option value="HOA_IN_PROGRESS" className="text-slate-900 dark:text-white">HOA Work in Progress</option>
                <option value="COMPLETED" className="text-slate-900 dark:text-white">Completed</option>
                <option value="CANCELLED" className="text-slate-900 dark:text-white">Cancelled</option>
              </select>
              <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={13} />
            </div>

            {/* Priority Filter */}
            <div className="relative w-full sm:w-auto">
              <select 
                value={priorityFilter} 
                onChange={e => setPriorityFilter(e.target.value)}
                className="w-full sm:w-auto bg-slate-100/60 dark:bg-[#1E3248] border border-slate-200/80 dark:border-white/10 rounded-2xl pl-4 pr-10 py-2.5 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none appearance-none cursor-pointer transition-colors"
              >
                <option value="" className="text-slate-900 dark:text-white">Priority (All)</option>
                <option value="LOW" className="text-slate-900 dark:text-white">Low</option>
                <option value="NORMAL" className="text-slate-900 dark:text-white">Medium</option>
                <option value="HIGH" className="text-slate-900 dark:text-white">High</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={13} />
            </div>

            {/* Sort By */}
            <div className="relative w-full sm:w-auto">
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                className="w-full sm:w-auto bg-slate-100/60 dark:bg-[#1E3248] border border-slate-200/80 dark:border-white/10 rounded-2xl pl-4 pr-10 py-2.5 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none appearance-none cursor-pointer transition-colors"
              >
                <option value="newest" className="text-slate-900 dark:text-white">Newest First</option>
                <option value="oldest" className="text-slate-900 dark:text-white">Oldest First</option>
                <option value="priority" className="text-slate-900 dark:text-white">Highest Priority</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={13} />
            </div>
          </div>
        </div>

        {sortedRequests.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">No maintenance requests found matching your search and filter criteria.</div>
        ) : (

          <div className="divide-y divide-slate-100 dark:divide-white/5 bg-white/40 dark:bg-transparent">
            {sortedRequests.map((req) => {
              const details = getRequestIconDetails(req.title);
              const RequestIcon = details.Icon;
              
              return (
                <div 
                  key={req.request_id}
                  className="p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-white/5 transition flex gap-3 text-left"
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 ${details.bg} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <RequestIcon size={20} className={details.text} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title + Status */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base leading-tight break-words">
                          {parseTitleAndType(req.title).title}
                        </h3>
                        <p className="text-slate-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5 line-clamp-2 leading-relaxed" title={req.description}>
                          {req.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <StatusBadge status={req.status} />
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-slate-500 dark:text-gray-400">
                      <span>Type: <span className="text-slate-800 dark:text-gray-300 font-medium">{parseTitleAndType(req.title).type}</span></span>
                      <span>Property: <span className="text-slate-800 dark:text-gray-300 font-medium">{req.property_name || 'Unknown Property'}</span></span>
                      <span>By: <span className="text-slate-800 dark:text-gray-300 font-medium">{req.submitted_by_name || 'Unknown Tenant'}</span></span>
                      <span>Vendor: <span className={`font-medium ${req.vendor_company_name ? 'text-slate-800 dark:text-gray-300' : 'text-slate-400 dark:text-gray-500'}`}>{req.vendor_company_name || 'Pending assignment'}</span></span>
                      <span>Cost: <span className="text-slate-800 dark:text-gray-300 font-semibold font-mono">{req.estimated_cost > 0 ? `$${req.estimated_cost.toFixed(2)}` : '$0.00'}</span></span>
                      {req.estimated_cost > 0 && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                          req.payment_status === 'PAID' 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        }`}>
                          {req.payment_status}
                        </span>
                      )}
                      <span className="hidden sm:inline">Date: <span className="text-slate-800 dark:text-gray-300 font-medium">
                        {new Date(req.created_date).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span></span>
                      <PriorityBadge priority={req.priority} />
                      <ScopeBadge scope={req.scope} />
                    </div>

                    {/* Tenant Notes / Change Requests Display */}
                    {req.tenant_notes && (
                      <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-900 dark:text-amber-300">
                        <span className="font-bold flex items-center gap-1.5 mb-1 text-amber-600 dark:text-amber-400">
                          <MessageSquare size={13} /> Tenant Notes / Change Requests:
                        </span>
                        <div className="whitespace-pre-line text-slate-800 dark:text-amber-200/90 font-mono text-[11px] leading-relaxed">
                          {req.tenant_notes}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 mt-3.5">
                      {isLandlord ? (
                        <button
                          disabled={req.status === 'COMPLETED' || req.status === 'CANCELLED'}
                          onClick={() => { setSelectedRequest(req); setErrors({}); setStatusVal(req.status); setEstCost(req.estimated_cost.toString()); setAssignVendorId(req.vendor_id || ''); setShowAssignModal(true); }}
                          className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-medium transition flex items-center gap-1 shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <Edit size={12} />
                          <span>Manage Request</span>
                        </button>
                      ) : (
                        <>
                          {/* Direct Edit Button if OPEN */}
                          {req.status === 'OPEN' ? (
                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                setErrors({});
                                const parsed = parseTitleAndType(req.title);
                                setEditRequestType(parsed.type);
                                setTenantEditTitle(parsed.title);
                                setTenantEditDesc(req.description);
                                setTenantEditPriority(req.priority);
                                setShowTenantEditModal(true);
                              }}
                              className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-medium transition flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                              title="Edit Request"
                            >
                              <Edit size={13} />
                              <span>Edit Ticket</span>
                            </button>
                          ) : (
                            req.status !== 'COMPLETED' && req.status !== 'CANCELLED' && (
                              <button
                                onClick={() => {
                                  toast.error("This ticket is in progress or vendor assigned. Direct edit is locked. Please send a note to your landlord using 'Add Note / Request Update'.");
                                }}
                                className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-gray-500 rounded-xl text-xs font-medium cursor-pointer flex items-center gap-1 opacity-80 hover:opacity-100"
                                title="Direct Edit Locked (In Progress/Vendor Assigned)"
                              >
                                <Edit size={13} />
                                <span>Edit Locked</span>
                              </button>
                            )
                          )}
 
                          {/* Add Note / Request Update Button */}
                          {req.status !== 'COMPLETED' && req.status !== 'CANCELLED' && (
                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                setErrors({});
                                setTenantNoteText('');
                                setShowTenantNoteModal(true);
                              }}
                              className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-medium transition flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                              title="Add Note or Request Update from Landlord"
                            >
                              <MessageSquare size={13} />
                              <span>Add Note / Request Update</span>
                            </button>
                          )}

                          {/* Pay Cost Button */}
                          {req.payment_status === 'UNPAID' && req.estimated_cost > 0 && (
                            <button
                              onClick={() => { setSelectedRequest(req); setPayMethod('ACH'); setShowPayModal(true); }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                            >
                              <DollarSign className="w-3.5 h-3.5" /> Pay Cost
                            </button>
                          )}

                          {/* Cancel Request Button */}
                          {req.status === 'OPEN' && (
                            <button
                              onClick={() => handleTenantCancelRequest(req)}
                              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-medium transition flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer sm:ml-auto"
                              title="Cancel Maintenance Request"
                            >
                              <XCircle size={13} />
                              <span>Cancel Request</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tenant Submit Request Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:from-[#1E2E42] dark:to-[#162535] dark:bg-gradient-to-br rounded-3xl p-6 w-full max-w-md border border-slate-200/80 dark:border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar text-slate-900 dark:text-white shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-500" /> New Service Request
              </h3>
              <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitRequest} className="space-y-5">
              {leases.length > 1 && (
                <div>
                  <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block uppercase font-bold tracking-wider">Select Lease Unit *</label>
                  <div className="relative">
                    <select
                      value={selectedLeaseId}
                      onChange={e => setSelectedLeaseId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-2xl pl-4 pr-10 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                    >
                      {leases.map(l => (
                        <option key={l.lease_id} value={l.lease_id}>Lease #{l.lease_id} ({l.unit?.property_type === 'condo' ? 'Apt' : 'Unit'} {l.unit?.unit_number})</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={18} />
                  </div>
                </div>
              )}

              {isCondo && (
                <div>
                  <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block uppercase font-bold tracking-wider">Location / Scope of Issue *</label>
                  <div className="relative">
                    <select
                      value={scope}
                      onChange={e => {
                        setScope(e.target.value);
                        if (errors.scope) setErrors(prev => ({ ...prev, scope: null }));
                      }}
                      className={`w-full bg-slate-50 dark:bg-[#0D1B2A] border ${errors.scope ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/20'} rounded-2xl pl-4 pr-10 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer`}
                    >
                      <option value="INTERNAL">Inside Apartment (Landlord Responsibility)</option>
                      <option value="EXTERNAL_HOA">Outside Apartment / Common Area (HOA/COA Responsibility)</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={18} />
                  </div>
                  {errors.scope && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.scope}</p>}
                </div>
              )}

              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block uppercase font-bold tracking-wider">Request Type *</label>
                <div className="relative">
                  <select
                    value={requestType}
                    onChange={e => {
                      setRequestType(e.target.value);
                      if (errors.requestType) setErrors(prev => ({ ...prev, requestType: null }));
                    }}
                    className={`w-full bg-slate-50 dark:bg-[#0D1B2A] border ${errors.requestType ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/20'} rounded-2xl pl-4 pr-10 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer`}
                  >
                    <option value="">Select type...</option>
                    {REQUEST_TYPES.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={18} />
                </div>
                {errors.requestType && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.requestType}</p>}
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block uppercase font-bold tracking-wider">Title *</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={e => {
                    const cleaned = e.target.value.replace(/[^A-Za-z\s]/g, '');
                    setTitle(cleaned);
                    if (errors.title) setErrors(prev => ({ ...prev, title: null }));
                  }}
                  placeholder="Brief title of the issue..."
                  className={`w-full bg-slate-50 dark:bg-[#0D1B2A] border ${errors.title ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/20'} rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-550 focus:outline-none focus:border-blue-500`}
                />
                {errors.title && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.title}</p>}
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block uppercase font-bold tracking-wider">Detailed Description *</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={e => {
                    setDescription(e.target.value);
                    if (errors.description) setErrors(prev => ({ ...prev, description: null }));
                  }}
                  placeholder="Describe the problem in detail..."
                  className={`w-full bg-slate-50 dark:bg-[#0D1B2A] border ${errors.description ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/20'} rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-y`}
                />
                {errors.description && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.description}</p>}
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 mb-2 block uppercase font-bold tracking-wider">Priority</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 'LOW', label: 'Low', color: 'bg-green-500', activeClass: 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400' },
                    { value: 'NORMAL', label: 'Medium', color: 'bg-yellow-500', activeClass: 'border-yellow-500 bg-yellow-500/10 text-yellow-700 dark:text-yellow-405' },
                    { value: 'HIGH', label: 'High', color: 'bg-red-500', activeClass: 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400' },
                    { value: 'URGENT', label: 'Urgent', color: 'bg-rose-500 animate-pulse', activeClass: 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-400' },
                  ].map((opt) => {
                    const isActive = priority === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPriority(opt.value)}
                        className={`flex items-center justify-between px-2.5 py-2.5 rounded-2xl border text-xs font-semibold transition cursor-pointer ${
                          isActive
                            ? `${opt.activeClass} border-2`
                            : 'border-slate-200 dark:border-white/10 text-slate-650 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/5 bg-transparent'
                        }`}
                      >
                        <span>{opt.label}</span>
                        <span className={`w-2 h-2 rounded-full ${opt.color} flex-shrink-0 ml-1.5`}></span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-semibold transition-all shadow-md shadow-blue-500/25 cursor-pointer"
                >
                  Submit Request
                </button>
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
              {selectedRequest.scope === 'EXTERNAL_HOA' && (
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-400 text-xs font-semibold rounded-xl flex items-start gap-2">
                  <Info size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <strong>HOA/COA Responsibility:</strong> This issue is in a common area. The association is responsible for this repair. You do not need to dispatch a private vendor or pay for it.
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">WORK ORDER STATUS *</label>
                <div className="relative">
                  {selectedRequest.scope === 'EXTERNAL_HOA' ? (
                    <select
                      value={statusVal}
                      onChange={e=>setStatusVal(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#111c2a] border border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none appearance-none cursor-pointer"
                    >
                      <option value="OPEN">Open (Awaiting review)</option>
                      <option value="FORWARDED_TO_HOA">Forwarded to HOA/COA</option>
                      <option value="HOA_IN_PROGRESS">HOA Work in Progress</option>
                      <option value="COMPLETED">Completed (HOA Repairs done)</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  ) : (
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
                  )}
                  <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-450 pointer-events-none" />
                </div>
              </div>

              {statusVal === 'VENDOR_ASSIGNED' && (
                <>
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">ASSIGN APPROVED HOA VENDOR / CONTRACTOR</label>
                    <div className="relative">
                      <select
                        value={assignVendorId}
                        onChange={e => {
                          setAssignVendorId(e.target.value);
                          if (errors.vendor_id) setErrors(prev => ({ ...prev, vendor_id: null }));
                        }}
                        className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${errors.vendor_id ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10'} focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none appearance-none cursor-pointer`}
                      >
                        <option value="">-- Do Not Assign / Keep Pending --</option>
                        {vendors.map(v => (
                          <option key={v.vendor_id} value={v.vendor_id}>{v.company_name} ({v.category})</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-450 pointer-events-none" />
                    </div>
                    {errors.vendor_id && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.vendor_id}</p>}
                    <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1.5">Select from the community network of certified professionals.</p>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">ESTIMATED REPAIR COST ($)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-450">$</span>
                      <input
                        type="number"
                        value={estCost}
                        onChange={e => {
                          setEstCost(e.target.value);
                          if (errors.est_cost) setErrors(prev => ({ ...prev, est_cost: null }));
                        }}
                        className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${errors.est_cost ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10'} focus:border-blue-500 rounded-lg pl-7 pr-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none`}
                        placeholder="0.00"
                      />
                    </div>
                    {errors.est_cost && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.est_cost}</p>}
                  </div>
                </>
              )}

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
                    className={`p-3 rounded-xl border text-center transition-all text-xs font-bold cursor-pointer flex items-center justify-center gap-2 ${
                      payMethod === 'ACH'
                        ? 'border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400'
                        : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-gray-400'
                    }`}
                  >
                    <Landmark size={14} className={payMethod === 'ACH' ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400'} /> Bank ACH
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('CARD')}
                    className={`p-3 rounded-xl border text-center transition-all text-xs font-bold cursor-pointer flex items-center justify-center gap-2 ${
                      payMethod === 'CARD'
                        ? 'border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400'
                        : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-gray-400'
                    }`}
                  >
                    <CreditCard size={14} className={payMethod === 'CARD' ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400'} /> Credit Card
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

      {/* Tenant Direct Edit Ticket Modal (Only when Status == OPEN) */}
      {showTenantEditModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:from-[#1E2E42] dark:to-[#162535] dark:bg-gradient-to-br rounded-3xl p-6 w-full max-w-md border border-slate-200/80 dark:border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar text-slate-900 dark:text-white shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-500" /> Edit Ticket #{selectedRequest.request_id}
              </h3>
              <button onClick={() => setShowTenantEditModal(false)} className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleTenantEditSubmit} className="space-y-5">
              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block uppercase font-bold tracking-wider">Request Type *</label>
                <div className="relative">
                  <select
                    value={editRequestType}
                    onChange={e => {
                      setEditRequestType(e.target.value);
                      if (errors.requestType) setErrors(prev => ({ ...prev, requestType: null }));
                    }}
                    className={`w-full bg-slate-50 dark:bg-[#0D1B2A] border ${errors.requestType ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/20'} rounded-2xl pl-4 pr-10 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer`}
                  >
                    <option value="">Select type...</option>
                    {REQUEST_TYPES.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={18} />
                </div>
                {errors.requestType && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.requestType}</p>}
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block uppercase font-bold tracking-wider">Title *</label>
                <input
                  required
                  type="text"
                  value={tenantEditTitle}
                  onChange={e => {
                    const cleaned = e.target.value.replace(/[^A-Za-z\s]/g, '');
                    setTenantEditTitle(cleaned);
                    if (errors.title) setErrors(prev => ({ ...prev, title: null }));
                  }}
                  className={`w-full bg-slate-50 dark:bg-[#0D1B2A] border ${errors.title ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/20'} rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500`}
                  placeholder="Brief title of the issue..."
                />
                {errors.title && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.title}</p>}
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 mb-1.5 block uppercase font-bold tracking-wider">Detailed Description *</label>
                <textarea
                  required
                  rows={4}
                  value={tenantEditDesc}
                  onChange={e => {
                    setTenantEditDesc(e.target.value);
                    if (errors.description) setErrors(prev => ({ ...prev, description: null }));
                  }}
                  className={`w-full bg-slate-50 dark:bg-[#0D1B2A] border ${errors.description ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/20'} rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-550 focus:outline-none focus:border-blue-500 resize-y`}
                  placeholder="Describe the issue in detail..."
                />
                {errors.description && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.description}</p>}
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-gray-400 mb-2 block uppercase font-bold tracking-wider">Priority Level</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 'LOW', label: 'Low', color: 'bg-green-500', activeClass: 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400' },
                    { value: 'NORMAL', label: 'Medium', color: 'bg-yellow-500', activeClass: 'border-yellow-500 bg-yellow-500/10 text-yellow-700 dark:text-yellow-405' },
                    { value: 'HIGH', label: 'High', color: 'bg-red-500', activeClass: 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400' },
                    { value: 'URGENT', label: 'Urgent', color: 'bg-rose-500 animate-pulse', activeClass: 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-400' },
                  ].map((opt) => {
                    const isActive = tenantEditPriority === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTenantEditPriority(opt.value)}
                        className={`flex items-center justify-between px-2.5 py-2.5 rounded-2xl border text-xs font-semibold transition cursor-pointer ${
                          isActive
                            ? `${opt.activeClass} border-2`
                            : 'border-slate-200 dark:border-white/10 text-slate-650 dark:text-gray-400 hover:bg-slate-55 dark:hover:bg-white/5 bg-transparent'
                        }`}
                      >
                        <span>{opt.label}</span>
                        <span className={`w-2 h-2 rounded-full ${opt.color} flex-shrink-0 ml-1.5`}></span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTenantEditModal(false)}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-semibold transition-all shadow-md shadow-blue-500/25 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tenant Add Note / Request Update Modal */}
      {showTenantNoteModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:from-[#1E2E42] dark:to-[#162535] dark:bg-gradient-to-br rounded-3xl p-6 w-full max-w-md border border-slate-200/80 dark:border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar text-slate-900 dark:text-white shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-500" /> Send Note / Request Update
              </h3>
              <button onClick={() => setShowTenantNoteModal(false)} className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white transition-colors cursor-pointer"><X size={20} /></button>
            </div>

            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-950 dark:text-[#BF80FF] flex gap-2 items-start">
              <Lightbulb size={16} className="text-purple-500 shrink-0 mt-0.5" />
              <div>
                <strong>Note to Landlord:</strong> Write your note or update request below. Your landlord will review this note and update the maintenance ticket details.
              </div>
            </div>

            <form onSubmit={handleTenantNoteSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">YOUR NOTE / REQUEST DETAILS *</label>
                <textarea
                  required
                  rows={4}
                  value={tenantNoteText}
                  onChange={e => {
                    setTenantNoteText(e.target.value);
                    if (errors.note) setErrors(prev => ({ ...prev, note: null }));
                  }}
                  className={`w-full bg-slate-50 dark:bg-[#111c2a] border ${errors.note ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10'} rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none resize-none`}
                  placeholder="e.g., Please schedule vendor visit after 2 PM on Tuesday..."
                />
                {errors.note && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.note}</p>}
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowTenantNoteModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-500 transition-all shadow-md shadow-purple-500/25 cursor-pointer">Send Note to Landlord</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        type={confirmConfig.type}
        singleButton={confirmConfig.singleButton}
        onConfirm={() => {
          confirmConfig.onConfirm?.();
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => {
          if (confirmConfig.onCancel) {
            confirmConfig.onCancel();
          }
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }}
      />
    </div>
  );
}
