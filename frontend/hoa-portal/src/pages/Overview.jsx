import React, { useState } from 'react';
import AddCommunityModal from '../components/AddCommunityModal';

const Overview = ({ communities = [] }) => {

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-semibold">
            All Communities Overview
          </h1>

          <p className="text-gray-400 mt-1">
            Live updates across all your HOA communities
          </p>
        </div>

        <button
          className="px-6 py-3 bg-teal hover:bg-teal-light rounded-2xl text-sm font-medium transition"
          onClick={() => setIsModalOpen(true)}
        >
          + Add Community
        </button>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

        <div className="bg-[#162535] border border-red-500/30 rounded-3xl p-6">
          <div className="text-red-400 text-5xl font-mono font-bold">
            25
          </div>
          <div className="text-sm text-gray-400 mt-2">
            Total Open Violations
          </div>
        </div>

        <div className="bg-[#162535] border border-amber-500/30 rounded-3xl p-6">
          <div className="text-amber-400 text-5xl font-mono font-bold">
            $3,450
          </div>
          <div className="text-sm text-gray-400 mt-2">
            Total Overdue Payments
          </div>
        </div>

        <div className="bg-[#162535] border border-blue-500/30 rounded-3xl p-6">
          <div className="text-blue-400 text-5xl font-mono font-bold">
            42
          </div>
          <div className="text-sm text-gray-400 mt-2">
            Open Service Requests
          </div>
        </div>

        <div className="bg-[#162535] border border-teal/30 rounded-3xl p-6">
          <div className="text-teal text-5xl font-mono font-bold">
            $87,400
          </div>
          <div className="text-sm text-gray-400 mt-2">
            Monthly Revenue
          </div>
        </div>

      </div>

      {/* Communities Grid */}
      <div className="section-title mb-6">
        Communities at a Glance
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {communities.map((comm, index) => (

          <div
            key={comm.community_id || comm.id || index}
            className="bg-[#162535] border border-white/10 rounded-3xl overflow-hidden hover:border-teal cursor-pointer transition-all hover:-translate-y-1"
          >

            {/* Card Header */}
            <div className="p-6 border-b border-white/10 flex items-center gap-4">

              <div className="w-14 h-14 bg-teal/10 rounded-2xl flex items-center justify-center text-4xl">
                {comm.icon || '🏘️'}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">
                  {comm.name}
                </h3>

                <p className="text-xs text-gray-400 truncate">
                  {comm.address?.address || comm.address || 'N/A'}
                </p>
              </div>

              <span className="text-xs px-3 py-1 bg-teal/10 text-teal rounded-full font-medium">
                {comm.plan || 'Pro'}
              </span>

            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 border-b border-white/10">

              <div className="text-center py-5 border-r border-white/10">
                <div className="text-2xl font-bold text-teal">
                  {comm.members || comm.total_owners || 0}
                </div>

                <div className="text-[10px] uppercase tracking-widest text-gray-400">
                  Members
                </div>
              </div>

              <div className="text-center py-5 border-r border-white/10">
                <div className="text-2xl font-bold text-red-400">
                  {comm.violations || 0}
                </div>

                <div className="text-[10px] uppercase tracking-widest text-gray-400">
                  Violations
                </div>
              </div>

              <div className="text-center py-5">
                <div className="text-2xl font-bold text-blue-400">
                  {comm.sr || 0}
                </div>

                <div className="text-[10px] uppercase tracking-widest text-gray-400">
                  Requests
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-5 flex justify-between items-center">

              <div>
                <div className="text-xs text-gray-400">
                  Revenue
                </div>

                <div className="text-teal font-mono font-bold">
                  {comm.revenue || '$24,800'}
                </div>
              </div>

              <button className="text-teal text-sm font-medium hover:text-teal-light">
                Open Dashboard →
              </button>

            </div>

          </div>

        ))}

      </div>

      {/* Empty State */}
      {communities.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          No communities found. Please check your API.
        </div>
      )}

      {/* Modal */}
      <AddCommunityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />

    </div>
  );
};

export default Overview;