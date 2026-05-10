import React from 'react';

const Settings = ({ community }) => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Community Settings</h1>
        <p className="text-gray-400 mt-1">{community?.name}</p>
      </div>

      {/* Timezone Section */}
      <div className="bg-[#162535] border border-white/10 rounded-3xl p-8 mb-8">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
          🌐 Platform Timezone
        </h2>
        
        <div className="bg-[#1E3248] rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-teal/10 rounded-2xl flex items-center justify-center text-3xl">🕒</div>
            <div>
              <div className="text-2xl font-mono font-bold">EST (UTC−5)</div>
              <div className="text-gray-400">Currently selected timezone</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Select Timezone</label>
              <select className="w-full bg-[#0D1B2A] border border-white/20 rounded-2xl p-4 text-white focus:outline-none focus:border-teal">
                <option>EST — Eastern Standard Time (UTC−5)</option>
                <option>CST — Central Standard Time (UTC−6)</option>
                <option>IST — India Standard Time (UTC+5:30)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Apply To</label>
              <select className="w-full bg-[#0D1B2A] border border-white/20 rounded-2xl p-4 text-white focus:outline-none focus:border-teal">
                <option>All modules (Recommended)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center py-8 text-gray-400">
        More settings (Payment, Visibility, etc.) coming soon...
      </div>
    </div>
  );
};

export default Settings;