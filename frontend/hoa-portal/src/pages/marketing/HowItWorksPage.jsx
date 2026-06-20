import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Sparkles, ShieldCheck, Zap, Mail, ChevronRight, 
  Settings, Building, FileText, CheckCircle, UserCheck, ShieldAlert,
  User, Lock, Phone, LayoutGrid, Map, Home, UserPlus, Users
} from 'lucide-react';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';

export default function HowItWorksPage() {
  const [activeStep, setActiveStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-play timeline loop
  useEffect(() => {
    // 5-second interval per step
    // 0% to 80% (0s - 4s): Current step progress bar fills up
    // 80% to 100% (4s - 5s): Connector line animate-dash-flow is active to guide path to next step
    const stepDuration = 5000;
    const updateInterval = 50; // Update progress bar every 50ms
    const totalTicks = stepDuration / updateInterval;
    let tick = 0;

    const interval = setInterval(() => {
      tick++;
      const currentProgress = (tick / totalTicks) * 100;
      setProgress(currentProgress);

      // Trigger transition state at 80% progress
      if (currentProgress >= 80 && currentProgress < 100) {
        setIsTransitioning(true);
      } else {
        setIsTransitioning(false);
      }

      if (tick >= totalTicks) {
        tick = 0;
        setActiveStep((prev) => (prev === 4 ? 1 : prev + 1));
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, []);

  const stepsData = [
    {
      id: 1,
      title: "Sales Person",
      desc: "Our dedicated sales representative assigns your customized plan structure, signs the service level agreement, and shares a unique activation code."
    },
    {
      id: 2,
      title: "Onboard Profile",
      desc: "Register your administrative account. Enter your contact details and securely configure your admin dashboard credentials to manage permissions."
    },
    {
      id: 3,
      title: "Create Community",
      desc: "Register your society profile. Map out blocks, wings, levels, and unit configurations. Instantly launch the live management dashboard and resident portals."
    },
    {
      id: 4,
      title: "Roles & Invites",
      desc: "Distribute access. Property Managers track operational requests, Board Members oversee governance, and residents are invited to join using secure passcodes."
    }
  ];

  // Auto-typing simulator helpers for Step 2 based on current loop progress (0 - 80)
  const getSimulatedInputValue = (fieldName, currentProgress) => {
    const nameMax = "Rajesh Kumar";
    const emailMax = "rajesh.k@email.com";
    const phoneMax = "9876543210";
    const passMax = "••••••••••••";

    if (fieldName === 'name') {
      const p = Math.min(Math.max((currentProgress - 0) / 15, 0), 1);
      return nameMax.substring(0, Math.floor(p * nameMax.length));
    }
    if (fieldName === 'email') {
      const p = Math.min(Math.max((currentProgress - 15) / 15, 0), 1);
      return emailMax.substring(0, Math.floor(p * emailMax.length));
    }
    if (fieldName === 'phone') {
      const p = Math.min(Math.max((currentProgress - 30) / 15, 0), 1);
      return phoneMax.substring(0, Math.floor(p * phoneMax.length));
    }
    if (fieldName === 'password') {
      const p = Math.min(Math.max((currentProgress - 45) / 15, 0), 1);
      return passMax.substring(0, Math.floor(p * passMax.length));
    }
    return '';
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#120824] text-slate-800 dark:text-slate-100 transition-colors duration-200 overflow-x-hidden font-sans">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#00A878]/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00A878]/10 text-[#00A878] font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Zero-Touch Automation
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            How NestBloq Deploys <br />
            <span className="bg-gradient-to-r from-[#00A878] to-emerald-500 bg-clip-text text-transparent font-black">Your HOA Portal Instantly</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Watch how our automated workflow takes a new community client from licensing to resident signup without writing code or manually setting up servers.
          </p>
        </div>
      </section>

      {/* --- AUTOMATED FLOW SHOWCASE --- */}
      <section className="pb-28 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        
        {/* 1. HORIZONTAL STEPS FLOW WITH SVG CONNECTORS */}
        <div className="relative mb-16 bg-white dark:bg-[#111C24] p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative">
            
            {/* Step 1 */}
            <div className="md:col-span-2.5 text-center md:text-left space-y-3 relative z-10">
              <div className="flex justify-center md:justify-start items-center gap-3">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 relative ${
                  activeStep === 1 
                    ? 'bg-[#00A878] text-white shadow-lg shadow-[#00A878]/30 scale-105' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-gray-550'
                }`}>
                  <User className="w-5 h-5" />
                  {activeStep === 1 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white dark:border-slate-900 animate-ping" />
                  )}
                </span>
                <h4 className={`text-sm font-extrabold transition-colors ${activeStep === 1 ? 'text-[#00A878]' : 'text-slate-900 dark:text-white'}`}>
                  Sales Person
                </h4>
              </div>
              {/* Active Step Progress bar */}
              <div className="h-1 bg-slate-100 dark:bg-slate-850 w-full rounded-full overflow-hidden">
                <div 
                  className="bg-[#00A878] h-full transition-all duration-75"
                  style={{ width: activeStep === 1 ? `${Math.min(progress / 0.8, 100)}%` : activeStep > 1 ? '100%' : '0%' }}
                />
              </div>
            </div>

            {/* Connector SVG Line 1 -> 2 */}
            <div className="hidden md:block md:col-span-0.7 flex justify-center items-center">
              <svg className="w-full h-8 overflow-visible" viewBox="0 0 50 20">
                <path 
                  d="M0 10 Q25 10 50 10" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  className={`transition-colors duration-300 ${
                    activeStep === 1 && isTransitioning 
                      ? 'text-[#00A878] animate-dash-flow' 
                      : activeStep > 1 
                      ? 'text-[#00A878]' 
                      : 'text-slate-200 dark:text-slate-800'
                  }`} 
                />
              </svg>
            </div>

            {/* Step 2 */}
            <div className="md:col-span-2.5 text-center md:text-left space-y-3 relative z-10">
              <div className="flex justify-center md:justify-start items-center gap-3">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 relative ${
                  activeStep === 2 
                    ? 'bg-[#00A878] text-white shadow-lg shadow-[#00A878]/30 scale-105' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-gray-550'
                }`}>
                  <FileText className="w-5 h-5" />
                  {activeStep === 2 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white dark:border-slate-900 animate-ping" />
                  )}
                </span>
                <h4 className={`text-sm font-extrabold transition-colors ${activeStep === 2 ? 'text-[#00A878]' : 'text-slate-900 dark:text-white'}`}>
                  Onboard Profile
                </h4>
              </div>
              {/* Active Step Progress bar */}
              <div className="h-1 bg-slate-100 dark:bg-slate-850 w-full rounded-full overflow-hidden">
                <div 
                  className="bg-[#00A878] h-full transition-all duration-75"
                  style={{ width: activeStep === 2 ? `${Math.min(progress / 0.8, 100)}%` : activeStep > 2 ? '100%' : '0%' }}
                />
              </div>
            </div>

            {/* Connector SVG Line 2 -> 3 */}
            <div className="hidden md:block md:col-span-0.7 flex justify-center items-center">
              <svg className="w-full h-8 overflow-visible" viewBox="0 0 50 20">
                <path 
                  d="M0 10 Q25 10 50 10" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  className={`transition-colors duration-300 ${
                    activeStep === 2 && isTransitioning 
                      ? 'text-[#00A878] animate-dash-flow' 
                      : activeStep > 2 
                      ? 'text-[#00A878]' 
                      : 'text-slate-200 dark:text-slate-800'
                  }`} 
                />
              </svg>
            </div>

            {/* Step 3 */}
            <div className="md:col-span-2.5 text-center md:text-left space-y-3 relative z-10">
              <div className="flex justify-center md:justify-start items-center gap-3">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 relative ${
                  activeStep === 3 
                    ? 'bg-[#00A878] text-white shadow-lg shadow-[#00A878]/30 scale-105' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-gray-550'
                }`}>
                  <Building className="w-5 h-5" />
                  {activeStep === 3 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white dark:border-slate-900 animate-ping" />
                  )}
                </span>
                <h4 className={`text-sm font-extrabold transition-colors ${activeStep === 3 ? 'text-[#00A878]' : 'text-slate-900 dark:text-white'}`}>
                  Create Community
                </h4>
              </div>
              {/* Active Step Progress bar */}
              <div className="h-1 bg-slate-100 dark:bg-slate-850 w-full rounded-full overflow-hidden">
                <div 
                  className="bg-[#00A878] h-full transition-all duration-75"
                  style={{ width: activeStep === 3 ? `${Math.min(progress / 0.8, 100)}%` : activeStep > 3 ? '100%' : '0%' }}
                />
              </div>
            </div>

            {/* Connector SVG Line 3 -> 4 */}
            <div className="hidden md:block md:col-span-0.7 flex justify-center items-center">
              <svg className="w-full h-8 overflow-visible" viewBox="0 0 50 20">
                <path 
                  d="M0 10 Q25 10 50 10" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  className={`transition-colors duration-300 ${
                    activeStep === 3 && isTransitioning 
                      ? 'text-[#00A878] animate-dash-flow' 
                      : activeStep > 3 
                      ? 'text-[#00A878]' 
                      : 'text-slate-200 dark:text-slate-800'
                  }`} 
                />
              </svg>
            </div>

            {/* Step 4 */}
            <div className="md:col-span-2.5 text-center md:text-left space-y-3 relative z-10">
              <div className="flex justify-center md:justify-start items-center gap-3">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 relative ${
                  activeStep === 4 
                    ? 'bg-[#00A878] text-white shadow-lg shadow-[#00A878]/30 scale-105' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-gray-550'
                }`}>
                  <Users className="w-5 h-5" />
                  {activeStep === 4 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white dark:border-slate-900 animate-ping" />
                  )}
                </span>
                <h4 className={`text-sm font-extrabold transition-colors ${activeStep === 4 ? 'text-[#00A878]' : 'text-slate-900 dark:text-white'}`}>
                  Roles & Invites
                </h4>
              </div>
              {/* Active Step Progress bar */}
              <div className="h-1 bg-slate-100 dark:bg-slate-850 w-full rounded-full overflow-hidden">
                <div 
                  className="bg-[#00A878] h-full transition-all duration-75"
                  style={{ width: activeStep === 4 ? `${Math.min(progress / 0.8, 100)}%` : '0%' }}
                />
              </div>
            </div>

          </div>
        </div>

        {/* 2. ADVERTISING SPLIT SHOWCASE VIEW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* LEFT: Info of Active Step */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-white dark:bg-[#111C24] border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-8 shadow-md relative overflow-hidden min-h-[380px]">
            
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-[#00A878]/10 text-[#00A878] font-bold text-xs rounded-full uppercase tracking-wider">
                  Phase {activeStep}
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-[#00A878] animate-ping" />
              </div>

              {stepsData.map((step) => {
                if (step.id !== activeStep) return null;
                return (
                  <div key={step.id} className="space-y-4 animate-float-up">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="pt-8 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
              <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-gray-300">
                <ShieldCheck className="w-5 h-5 text-[#00A878]" />
                <span>Automatically signed & secured under compliance policies</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-gray-300">
                <Zap className="w-5 h-5 text-[#00A878]" />
                <span>Zero administrative latency or database delays</span>
              </div>
            </div>

          </div>

          {/* RIGHT: Visual Graphics Panel */}
          <div className="lg:col-span-7 bg-[#091522] border border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col justify-center items-center relative overflow-hidden min-h-[380px]">
            
            {/* Visual Glass Glow Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#00A878]/10 rounded-full blur-3xl -z-10 pointer-events-none" />

            {/* STEP 1 PREVIEW: Sales Person & Sign Agreement Form */}
            {activeStep === 1 && (
              <div className="w-full max-w-md flex flex-col md:flex-row gap-4 items-stretch select-none animate-fade-in-scale">
                
                {/* Sales rep card */}
                <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl flex flex-col justify-between items-center text-center shadow-lg">
                  <div className="space-y-3 mt-2">
                    <div className="w-14 h-14 rounded-full bg-[#00A878]/10 text-[#00A878] font-bold text-lg flex items-center justify-center border-2 border-[#00A878]/30 mx-auto relative">
                      VK
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[8px] font-black border border-white dark:border-slate-900">✓</div>
                    </div>
                    <div>
                      <h5 className="text-xs font-extrabold text-slate-900 dark:text-white">Vikash Kumar</h5>
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Senior Onboarding Consultant</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-50 dark:bg-slate-950 p-2 rounded-xl text-[9px] text-gray-500 leading-normal border border-slate-100 dark:border-slate-850">
                    "Assigning customized plan ledgers and generating your security code."
                  </div>
                </div>

                {/* Agreement sign contract visual form */}
                <div className="flex-[1.2] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-lg flex flex-col overflow-hidden text-left text-slate-800 dark:text-slate-200">
                  <div className="bg-[#00A878] px-3 py-2 text-white flex justify-between items-center text-[10px] font-mono tracking-widest font-black uppercase">
                    <span>AGREEMENT CONTRACT</span>
                    <FileText className="w-3.5 h-3.5" />
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3 text-[10px]">
                    <div className="space-y-2">
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-850 pb-1">
                        <span className="text-gray-400 font-bold uppercase tracking-wide">Client Profile</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">Vikash Heights</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-850 pb-1">
                        <span className="text-gray-400 font-bold uppercase tracking-wide">Plan Tier</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">Enterprise Plan</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-850 pb-1">
                        <span className="text-gray-400 font-bold uppercase tracking-wide">HOA Code</span>
                        <span className="font-mono font-extrabold text-[#00A878]">VIK250-HOA</span>
                      </div>
                    </div>

                    {/* Signature animation */}
                    <div className="border-t border-dashed border-slate-200 dark:border-slate-850 pt-2 flex flex-col justify-end items-end h-12 relative overflow-hidden">
                      <span className="text-[7.5px] text-gray-400 uppercase tracking-widest absolute top-2 left-0 select-none">Authorized Sign</span>
                      
                      {/* Cursive Signature path simulation */}
                      <svg className="w-28 h-8 absolute bottom-1 right-2 text-emerald-500 overflow-visible" viewBox="0 0 100 30">
                        <path 
                          d="M10,20 Q25,5 35,25 T60,10 T85,20 T95,15" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeDasharray="100" 
                          strokeDashoffset={progress < 60 ? "100" : "0"} 
                          className="transition-all duration-1000 ease-in-out" 
                        />
                      </svg>
                      
                      {progress >= 60 && (
                        <span className="text-[7px] text-emerald-500 font-bold font-mono tracking-wider absolute bottom-1.5 left-0 animate-[pulse-glow_1s_infinite]">
                          Approved ✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* STEP 2 PREVIEW: Onboard Profile signup form auto-typing */}
            {activeStep === 2 && (
              <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-2xl p-6 text-left animate-fade-in-scale relative text-slate-800 dark:text-slate-200">
                
                {/* Form header */}
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3 mb-4 text-xs font-bold">
                  <span className="text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
                    <UserPlus className="w-4.5 h-4.5 text-[#00A878]" />
                    Admin Profile Setup
                  </span>
                  <span className="text-[8.5px] font-mono text-gray-500">Step 2 of 4</span>
                </div>

                {/* Form Input fields */}
                <div className="space-y-3 text-[10px]">
                  
                  {/* Name Input */}
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider block">Full Name</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-gray-400"><User size={12} /></span>
                      <input
                        type="text"
                        readOnly
                        value={getSimulatedInputValue('name', progress)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl py-2 pl-8 pr-8 text-xs font-bold focus:outline-none"
                        placeholder="Types name..."
                      />
                      {progress >= 15 && (
                        <span className="absolute right-3 text-emerald-500 animate-[pulse-glow_0.5s_ease-out]"><CheckCircle size={13} /></span>
                      )}
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider block">Email Address</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-gray-400"><Mail size={12} /></span>
                      <input
                        type="text"
                        readOnly
                        value={getSimulatedInputValue('email', progress)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl py-2 pl-8 pr-8 text-xs font-bold focus:outline-none"
                        placeholder="Types email..."
                      />
                      {progress >= 30 && (
                        <span className="absolute right-3 text-emerald-500 animate-[pulse-glow_0.5s_ease-out]"><CheckCircle size={13} /></span>
                      )}
                    </div>
                  </div>

                  {/* Phone Input */}
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider block">Mobile Number</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-gray-400"><Phone size={12} /></span>
                      <input
                        type="text"
                        readOnly
                        value={getSimulatedInputValue('phone', progress)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl py-2 pl-8 pr-8 text-xs font-bold focus:outline-none"
                        placeholder="Types phone..."
                      />
                      {progress >= 45 && (
                        <span className="absolute right-3 text-emerald-500 animate-[pulse-glow_0.5s_ease-out]"><CheckCircle size={13} /></span>
                      )}
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider block">Admin Password</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-gray-400"><Lock size={12} /></span>
                      <input
                        type="text"
                        readOnly
                        value={getSimulatedInputValue('password', progress)}
                        className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl py-2 pl-8 pr-8 text-xs font-mono font-bold focus:outline-none"
                        placeholder="Types password..."
                      />
                      {progress >= 60 && (
                        <span className="absolute right-3 text-emerald-500 animate-[pulse-glow_0.5s_ease-out]"><CheckCircle size={13} /></span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Submit button feedback */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-850">
                  <button
                    disabled
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-300 ${
                      progress >= 65 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {progress >= 65 ? (
                      <>
                        <CheckCircle size={14} />
                        Profile Registered ✓
                      </>
                    ) : (
                      'Register Administrator Account'
                    )}
                  </button>
                </div>

              </div>
            )}

            {/* STEP 3 PREVIEW: Create Community blueprint layout */}
            {activeStep === 3 && (
              <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-2xl p-6 text-center animate-fade-in-scale relative">
                
                {/* Structural map/wings blueprint indicator */}
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3 mb-4 text-xs font-bold">
                  <span className="text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                    <Map className="w-4 h-4 text-[#00A878]" />
                    Society Architecture Mapping
                  </span>
                  <span className="text-[9px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Active</span>
                </div>

                {/* Simulated blueprint layout blocks rising from the ground */}
                <div className="grid grid-cols-3 gap-2.5 mb-5 items-end min-h-[120px]">
                  {[
                    { block: "Block A", wings: "Wings: A1, A2", units: "80 Units", icon: LayoutGrid, color: "text-[#00A878]", finalHeight: "h-24", progressTrigger: 10 },
                    { block: "Block B", wings: "Wings: B1, B2", units: "120 Units", icon: LayoutGrid, color: "text-[#00A878]", finalHeight: "h-28", progressTrigger: 25 },
                    { block: "Block C", wings: "Wings: C1", units: "50 Units", icon: LayoutGrid, color: "text-[#00A878]", finalHeight: "h-20", progressTrigger: 40 }
                  ].map((item, idx) => {
                    const isVisible = progress >= item.progressTrigger;
                    return (
                      <div 
                        key={idx} 
                        className={`p-2 bg-slate-50 dark:bg-slate-955 border border-slate-150 dark:border-slate-850 rounded-xl flex flex-col items-center justify-center text-center space-y-1 transition-all duration-700 ease-out origin-bottom transform ${
                          isVisible 
                            ? `opacity-100 scale-y-100 ${item.finalHeight}` 
                            : 'opacity-0 scale-y-0 h-0'
                        }`}
                      >
                        {isVisible && (
                          <>
                            <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                            <p className="text-[9px] font-bold text-slate-800 dark:text-slate-200">{item.block}</p>
                            <span className="text-[7px] text-gray-500 font-mono block">{item.wings}</span>
                            <span className="text-[7px] text-gray-500 font-mono font-bold block">{item.units}</span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Stats recap row */}
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-3 rounded-xl flex justify-between items-center text-[10px] text-slate-700 dark:text-slate-355">
                  <div className="flex items-center gap-1">
                    <Home className="w-3.5 h-3.5 text-[#00A878]" />
                    <span className="font-bold">Vikash Heights Created</span>
                  </div>
                  <span className="font-mono font-bold text-[#00A878]">250 Total Units</span>
                </div>

                {/* Confirm badge */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850 flex justify-center">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-[10px] font-bold text-emerald-600 dark:text-emerald-400 transition-all duration-300 ${
                    progress >= 55 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                  }`}>
                    <CheckCircle className="w-3.5 h-3.5" />
                    HOA Portal Ready & Live
                  </div>
                </div>

              </div>
            )}

            {/* STEP 4 PREVIEW: Portal Roles Split (Property Manager, Board Member) & Invites */}
            {activeStep === 4 && (
              <div className="w-full max-w-md flex flex-col md:flex-row gap-4 items-stretch select-none animate-fade-in-scale text-left text-slate-800 dark:text-slate-200">
                
                {/* PM & Board Member Roles */}
                <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl flex flex-col justify-between shadow-lg space-y-3">
                  <div>
                    <h5 className="text-[10px] font-black text-[#00A878] uppercase tracking-wider">Dashboard Roles</h5>
                    <p className="text-[8px] text-gray-500 leading-normal mt-0.5">Separate operational workspaces generated instantly.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-[9px] text-slate-900 dark:text-white">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Property Manager
                      </div>
                      <p className="text-[8px] text-gray-500">Log violations, track dues, manage requests</p>
                    </div>

                    <div className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-[9px] text-slate-900 dark:text-white">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        Board Member
                      </div>
                      <p className="text-[8px] text-gray-500">Approve budgets, vote resolutions, audit logs</p>
                    </div>
                  </div>

                  <span className="text-[7.5px] text-slate-400 font-mono">RBAC Security active</span>
                </div>

                {/* Resident Invite logs */}
                <div className="flex-[1.1] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-lg p-4 flex flex-col justify-between relative overflow-hidden">
                  
                  <div>
                    <h5 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider">Resident Invites</h5>
                    
                    {/* Mail animation logs */}
                    <div className="mt-3 space-y-2 relative">
                      {/* Flying envelope envelope paths */}
                      {progress < 40 && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-full max-w-[120px] h-10 pointer-events-none">
                          <div className="absolute w-3.5 h-3.5 text-[#00A878] animate-[loader-bar_1.2s_linear_infinite]" style={{ left: '40%' }}><Mail size={12} /></div>
                        </div>
                      )}

                      {[
                        { name: "Rajesh Kumar", unit: "A-101", trigger: 15 },
                        { name: "Pooja Sharma", unit: "B-204", trigger: 35 }
                      ].map((res, idx) => {
                        const hasJoined = progress >= res.trigger;
                        return (
                          <div key={idx} className="flex justify-between items-center p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-lg text-[8.5px]">
                            <div className="truncate min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white truncate">{res.name}</p>
                              <span className="text-[7.5px] text-gray-500 font-mono">{res.unit}</span>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded text-[7.5px] font-bold ${
                              hasJoined 
                                ? 'text-emerald-600 bg-emerald-500/10 border border-emerald-500/20' 
                                : 'text-slate-400 bg-slate-100 dark:bg-slate-800'
                            }`}>
                              {hasJoined ? 'Joined ✓' : 'Sent'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-850 flex justify-center">
                    <span className="text-[8px] text-[#00A878] font-black uppercase tracking-wider animate-pulse">Broadcasting Invites...</span>
                  </div>

                </div>

              </div>
            )}

            {/* Simulated Canvas Footer */}
            <div className="pt-6 border-t border-slate-800 text-[9px] font-mono text-gray-500 text-center w-full shrink-0">
              Interactive Advertising Engine • loops every 5s
            </div>

          </div>

        </div>

      </section>

      {/* --- PREMIUM COMPREHENSIVE SECURITY ASSURANCE --- */}
      <section className="bg-slate-100 dark:bg-[#07111C] py-20 px-4 sm:px-6 lg:px-8 border-y border-slate-200 dark:border-slate-800/60 transition-colors duration-200">
        <div className="max-w-7xl mx-auto w-full text-center space-y-12">
          
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight">
              Bank-Grade Infrastructure Setup
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Every NestBloq community portal is deployed in its own isolated database namespace with strict SOC2 compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Isolated Tenant Databases",
                desc: "We do not mix resident records. Each HOA receives an isolated schema preventing cross-tenant vulnerabilities.",
                Icon: Building,
              },
              {
                title: "Strict Role RBAC Policies",
                desc: "Granular administrative control limits violation editing, service authorization, and payment ledgers by default.",
                Icon: Settings,
              },
              {
                title: "AES-256 Ledger Audits",
                desc: "All financial transactions and billing updates are cryptographically signed to maintain compliance.",
                Icon: ShieldCheck,
              }
            ].map((card, idx) => (
              <div key={idx} className="bg-white dark:bg-[#111C24] p-6 rounded-3xl border border-slate-200/50 dark:border-slate-850/80 text-left shadow-sm space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#00A878]/10 text-[#00A878] flex items-center justify-center">
                  <card.Icon className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-950 dark:text-white">{card.title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
