import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, UserPlus, Mail, Phone, Shield } from 'lucide-react';
import API from '../services/api';

const Members = ({ community }) => {
  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [searched, setSearched] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (community?.community_id) {
      fetchMembers();
    }
  }, [community]);

  // Local Search
  useEffect(() => {
    if (!search.trim()) {
      setSearched(members);
    } else {
      const q = search.toLowerCase();
      setSearched(members.filter(m =>
        m.full_name?.toLowerCase().includes(q) ||
        m.email_id?.toLowerCase().includes(q) ||
        m.mobile_number?.includes(q)
      ));
    }
  }, [search, members]);

  const fetchMembers = async () => {
    if (!community?.community_id) return;
    
    try {
      setLoading(true);
      const res = await API.get(`/user/community/${community.community_id}?limit=100`);
      setMembers(res.data || []);
      setSearched(res.data || []);
    } catch (err) {
      console.error('Members fetch error:', err);
      setMembers([]);
      setSearched([]);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const map = {
      super_admin:      'bg-purple-500/20 text-purple-400',
      property_manager: 'bg-blue-500/20 text-blue-400',
      board_member:     'bg-teal-500/20 text-teal-400',
      resident:         'bg-green-500/20 text-green-400',
      vendor:           'bg-amber-500/20 text-amber-400',
    };
    return map[role] || 'bg-gray-500/20 text-gray-400';
  };

  const getStatusBadge = (status) => {
    const map = {
      ACTIVE:               'bg-green-500/20 text-green-400',
      INACTIVE:             'bg-red-500/20 text-red-400',
      PENDING_VERIFICATION: 'bg-amber-500/20 text-amber-400',
      LOCKED:               'bg-red-500/20 text-red-400',
    };
    return map[status] || 'bg-gray-500/20 text-gray-400';
  };

  const totalActive   = members.filter(m => m.account_status === 'ACTIVE').length;
  const totalPending  = members.filter(m => m.account_status === 'PENDING_VERIFICATION').length;
  const totalInactive = members.filter(m => m.account_status === 'INACTIVE').length;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold">Members</h1>
          <p className="text-gray-400 mt-1">
            {community?.name || "No Community Selected"}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchMembers}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-sm font-medium transition flex items-center gap-2"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          
          <button 
            onClick={() => setShowInviteModal(true)}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-2xl text-sm font-medium transition flex items-center gap-2 text-white"
          >
            <UserPlus size={15} />
            Invite Member
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Total Members', value: members.length,  color: 'text-white' },
          { label: 'Active',        value: totalActive,      color: 'text-teal-400' },
          { label: 'Pending',       value: totalPending,     color: 'text-amber-400' },
          { label: 'Inactive',      value: totalInactive,    color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#162535] border border-white/10 rounded-3xl p-6">
            <div className={`text-4xl font-mono font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-400 mt-2">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#162535] border border-white/10 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between gap-4">
          <h2 className="font-semibold whitespace-nowrap">All Members</h2>
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#1E3248] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-teal-500 text-white placeholder-gray-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-gray-400">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Loading members...
            </div>
          ) : searched.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <UserPlus size={32} className="mx-auto mb-3 opacity-50" />
              {search ? 'No members found matching your search.' : 'No members found in this community.'}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-sm">
                  <th className="text-left p-5">Member</th>
                  <th className="text-left p-5">Email</th>
                  <th className="text-left p-5">Phone</th>
                  <th className="text-left p-5">Role</th>
                  <th className="text-left p-5">Status</th>
                  <th className="text-left p-5">Verified</th>
                </tr>
              </thead>
              <tbody>
                {searched.map((m) => (
                  <tr key={m.user_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                          {m.first_name?.[0]}{m.last_name?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white whitespace-nowrap">{m.full_name}</p>
                          <p className="text-xs text-gray-500">ID: {m.user_id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-5">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Mail size={13} />
                        {m.email_id}
                      </div>
                    </td>

                    <td className="p-5">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Phone size={13} />
                        {m.mobile_number || '—'}
                      </div>
                    </td>

                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full whitespace-nowrap text-xs font-medium capitalize ${getRoleBadge(m.role_name)}`}>
                        {m.role_name?.replace('_', ' ') || '—'}
                      </span>
                    </td>

                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(m.account_status)}`}>
                        {m.account_status === 'PENDING_VERIFICATION' ? 'PENDING' : m.account_status}
                      </span>
                    </td>

                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${m.email_id_is_verified ? 'text-teal-400' : 'text-red-400'}`}>
                          {m.email_id_is_verified ? '✓ Email' : '✗ Email'}
                        </span>
                        {m.mobile_number && (
                          <span className={`text-xs ${m.mobile_is_verified ? 'text-teal-400' : 'text-red-400'}`}>
                            {m.mobile_is_verified ? '✓ Phone' : '✗ Phone'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && searched.length > 0 && (
          <div className="p-4 border-t border-white/10 text-center text-xs text-gray-500">
            Showing {searched.length} of {members.length} members
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1E3248] border border-white/20 rounded-3xl w-full max-w-lg mx-4">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-2xl font-semibold">Invite Member</h2>
              <p className="text-gray-400 text-sm mt-1">Send an email invitation with a community-specific join link.</p>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">First Name *</label>
                  <input type="text" className="w-full bg-[#0D1B2A] border border-white/20 rounded-2xl p-4 text-white" placeholder="e.g. James" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Last Name *</label>
                  <input type="text" className="w-full bg-[#0D1B2A] border border-white/20 rounded-2xl p-4 text-white" placeholder="e.g. Holloway" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Email Address *</label>
                <input type="email" className="w-full bg-[#0D1B2A] border border-white/20 rounded-2xl p-4 text-white" placeholder="member@email.com" />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Unit / Address</label>
                <input type="text" className="w-full bg-[#0D1B2A] border border-white/20 rounded-2xl p-4 text-white" placeholder="e.g. Unit 14A" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Role</label>
                  <select className="w-full bg-[#0D1B2A] border border-white/20 rounded-2xl p-4 text-white">
                    <option>HOA Member</option>
                    <option>Board Member</option>
                    <option>Resident</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Community</label>
                  <select className="w-full bg-[#0D1B2A] border border-white/20 rounded-2xl p-4 text-white" defaultValue={community?.name}>
                    <option>{community?.name}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 py-3 text-gray-400 hover:bg-white/10 rounded-2xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert("✅ Invitation Sent Successfully!");
                  setShowInviteModal(false);
                }}
                className="flex-1 py-3 bg-teal-600 hover:bg-teal-500 rounded-2xl font-medium text-white transition"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;