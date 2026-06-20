import React, { useState } from 'react';
import { ArrowRight, Calculator, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RoiCalculator() {
  const [units, setUnits] = useState(120); // matching Vikash Property Management 120 units default
  const [hours, setHours] = useState(5); // hours spent per unit/month manually

  // Calculations
  const hoursSavedPerMonth = Math.round(units * (hours * 0.65)); // 65% automation efficiency
  const annualSavings = Math.round(hoursSavedPerMonth * 35 * 12); // Average $35 hourly valuation
  
  const formattedSavings = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(annualSavings);

  return (
    <div className="w-full bg-gradient-to-br from-white to-slate-50/50 dark:from-[#180a2d] dark:to-[#120824]/40 rounded-3xl border border-slate-200/80 dark:border-white/[0.05] shadow-xl overflow-hidden p-6 md:p-8 transition-colors duration-200">
      
      {/* Title Header */}
      <div className="flex items-center gap-3 mb-6 text-left">
        <div className="w-10 h-10 bg-[#00A878]/10 rounded-xl flex items-center justify-center text-[#00A878]">
          <Calculator className="w-5 h-5" />
        </div>
        <div className="text-left">
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">Interactive ROI Calculator</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">See how much time and money NestBloq saves your team</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Sliders Container */}
        <div className="space-y-6">
          
          {/* Slider 1: Community Units */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Community Size (Units)</span>
              <span className="font-bold text-lg text-[#00A878]">{units} Units</span>
            </div>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={units}
              onChange={(e) => setUnits(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#00A878]"
            />
            <div className="flex justify-between text-[11px] text-gray-400">
              <span>10 Units</span>
              <span>500 Units</span>
              <span>1,000+ Units</span>
            </div>
          </div>

          {/* Slider 2: Admin Hours per unit */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Manual Admin Hours (per unit / month)</span>
              <span className="font-bold text-lg text-[#00A878]">{hours} Hours</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={hours}
              onChange={(e) => setHours(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#00A878]"
            />
            <div className="flex justify-between text-[11px] text-gray-400">
              <span>1 Hour</span>
              <span>10 Hours</span>
              <span>20 Hours</span>
            </div>
          </div>

          {/* Savings bullets */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">How NestBloq achieves this:</h4>
            {[
              "Automated quarterly dues collection & instant receipt generation",
              "Self-service resident booking for pools, gyms, & community halls",
              "AI resident helpdesk resolves 85% of queries without admin intervention",
              "Structured violation reporting with photograph attachments"
            ].map((text, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                <CheckCircle className="w-4 h-4 text-[#00A878] shrink-0 mt-0.5" />
                <span>{text}</span>
              </div>
            ))}
          </div>

        </div>

        {/* Results Container */}
        <div className="bg-slate-100/50 dark:bg-[#0a0414]/50 rounded-2xl border border-slate-200/50 dark:border-white/[0.04] p-6 flex flex-col justify-between gap-6">
          
          <div className="space-y-5">
            
            {/* Metric 1: Hours Saved */}
            <div className="p-4 bg-white dark:bg-[#1a102b] rounded-xl border border-slate-150 dark:border-white/[0.06] shadow-sm flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Hours Saved / Month</p>
                <p className="text-3xl font-extrabold text-[#00A878] tracking-tight mt-1">{hoursSavedPerMonth} Hrs</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#00A878]/10 text-[#00A878] flex items-center justify-center font-bold text-sm">
                ~85%
              </div>
            </div>

            {/* Metric 2: Cost Savings */}
            <div className="p-4 bg-white dark:bg-[#1a102b] rounded-xl border border-slate-150 dark:border-white/[0.06] shadow-sm flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Estimated Annual Savings</p>
                <p className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 to-[#0A2240] dark:from-white dark:to-blue-100 bg-clip-text text-transparent tracking-tight mt-1 animate-pulse">
                  {formattedSavings}
                </p>
              </div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 text-right">
                Valued @ $35/hr <br />
                admin time
              </div>
            </div>

          </div>

          {/* CTA Box */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800/60">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Based on standard community operations efficiency metrics.
            </p>
            <Link
              to="/contact"
              className="w-full py-3 bg-[#00A878] hover:bg-[#008f65] text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group active:scale-95"
            >
              Get My Savings Report
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}
