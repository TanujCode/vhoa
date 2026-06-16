import React from 'react';
import logoDark from '../../assets/logo_dark.png';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans">
      {/* Left Form Container */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">{children}</div>
      </div>

      {/* Right Hero / Branding Container */}
      <div className="hidden md:flex md:w-1/2 bg-[#0A2240] text-white flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="max-w-md text-center">
          <div className="flex justify-center mb-6">
            <img src={logoDark} alt="NestBloq" className="h-16 w-auto object-contain" />
          </div>
          <p className="text-blue-300 font-medium mb-6">Self-Service Property Management</p>
          <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto mb-10">
            Join thousands of communities managing their governance with administrative precision and communal harmony.
          </p>
          <div className="grid grid-cols-2 gap-4 text-left max-w-sm mx-auto">
            <div className="p-4 bg-white/5 rounded-lg backdrop-blur-sm border border-white/5">
              <p className="font-semibold text-sm mb-1 text-blue-200">Unified Dashboard</p>
              <span className="text-xs text-gray-400">Complete visibility into HOA finances and tasks.</span>
            </div>
            <div className="p-4 bg-white/5 rounded-lg backdrop-blur-sm border border-white/5">
              <p className="font-semibold text-sm mb-1 text-blue-200">Secure Portal</p>
              <span className="text-xs text-gray-400">Encrypted data protection for every homeowner.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}