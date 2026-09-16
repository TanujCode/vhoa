import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

export const defaultSecurityFaqs = [
  {
    id: 1,
    category: "Technical",
    q: "Where is our rental portfolio database hosted?",
    answerParts: [
      "All NestBloq property and portfolio data is hosted on **Amazon Web Services (AWS)** infrastructure in the **US-East** region, with automatic failover to a secondary region. Your data never leaves US borders unless you explicitly configure cross-region replication.",
      "We maintain a 99.9% uptime SLA backed by AWS's enterprise-grade infrastructure, redundant storage, and automated daily backups retained for 30 days."
    ]
  },
  {
    id: 2,
    category: "Security",
    q: "Who can see our tenant directory and rent accounting logs?",
    answerParts: [
      "Access is strictly role-based. **Landlords and Property Managers** have access to portfolio units, lease agreements, and financials. **Contractors & Vendors** only see assigned repair tickets. **Tenants** can only ever access their personal unit profile, lease agreements, work order statuses, and rent receipts.",
      "Every administrative access attempt and ledger edit is permanently logged in our immutable **Audit Trail**."
    ]
  },
  {
    id: 3,
    category: "Security",
    q: "How does NestBloq safeguard rental payment transactions?",
    answerParts: [
      "All digital payments and rent transactions are processed through **Stripe's PCI-DSS Level 1** certified gateway using end-to-end tokenization.",
      "Every rent receipt, security deposit record, and payout ledger entry is stamped with a cryptographic **SHA-256 verification hash**."
    ]
  },
  {
    id: 4,
    category: "Technical",
    q: "What happens if there is a server outage?",
    answerParts: [
      "Our production architecture operates behind automated **Elastic Load Balancers** with redundant multi-zone failover. If an active server node experiences degradation, traffic instantly reroutes to hot-standby instances within seconds.",
      "All database transactions use real-time write-ahead replication so no rental data or rent payment confirmations are ever dropped during failover."
    ]
  },
  {
    id: 5,
    category: "Data & Privacy",
    q: "Is our financial or tenant data shared with third parties?",
    answerParts: [
      "**Never.** We do not sell, rent, or monetize property financial ledgers, tenant rosters, or personal identifiable information (PII).",
      "All payment transactions are handled securely through certified payment gateways. NestBloq never stores raw credit card numbers or banking passwords on internal servers."
    ]
  },
  {
    id: 6,
    category: "Technical",
    q: "How do you handle data backups and disaster recovery?",
    answerParts: [
      "We execute **hourly automated database snapshot backups** with continuous point-in-time recovery (PITR) logs. Backups are encrypted with AES-256 and replicated across geo-isolated AWS data centers.",
      "Disaster recovery simulations and backup restore integrity drills are tested regularly to ensure a Recovery Point Objective (RPO) of under 1 hour."
    ]
  },
  {
    id: 7,
    category: "Data & Privacy",
    q: "Can we export our rental data if we ever leave NestBloq?",
    answerParts: [
      "**Yes, 100%.** You retain complete ownership of your portfolio data. Landlords and property managers can export full tenant rosters, ledger transaction logs, maintenance histories, and lease documents in standardized formats (CSV, Excel, JSON, and PDF packages) at any time with one click."
    ]
  },
  {
    id: 8,
    category: "Security",
    q: "How does two-factor authentication (2FA) protect landlord accounts?",
    answerParts: [
      "We provide time-based **TOTP and Email OTP Two-Factor Authentication (2FA)** for landlord and property manager accounts.",
      "When enabled, logins require both password authentication and a dynamic one-time passcode, preventing unauthorized access even in the event of compromised staff passwords."
    ]
  },
  {
    id: 9,
    category: "General",
    q: "How does NestBloq support lease compliance and residential tenancy standards?",
    answerParts: [
      "NestBloq's digital lease management, automated late fee rules, security deposit tracking, and maintenance records are built to help landlords stay compliant with standard residential tenancy guidelines.",
      "Instant digital audit trails and itemized payment invoices ensure your property business remains transparent and audit-ready."
    ]
  }
];

export default function FaqSection({
  id = "faq",
  badgeText = "FREQUENTLY ASKED QUESTIONS",
  title = "Everything you need to know",
  subtitlePrefix = "Have questions about how NestBloq powers modern communities?",
  contactText = "Contact our team →",
  contactLink = "/contact",
  items = defaultSecurityFaqs,
  className = ""
}) {
  const [expandedIds, setExpandedIds] = useState(new Set());

  const toggleItem = (itemId) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    const allIds = new Set(items.map((item, idx) => item.id || idx));
    setExpandedIds(allIds);
  };

  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  const isAllExpanded = items.length > 0 && items.every((item, idx) => expandedIds.has(item.id || idx));

  // Helper to render bold markdown (**text**) in answer
  const renderFormattedText = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-bold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <section id={id} className={`py-10 sm:py-12 px-5 sm:px-8 bg-slate-50 dark:bg-[#0f172a] border-t border-slate-200/60 dark:border-slate-800 ${className}`}>
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5">
        
        {/* --- Header --- */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-[10px] sm:text-xs font-bold tracking-wider uppercase">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{badgeText}</span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            {subtitlePrefix}{' '}
            {contactLink ? (
              <Link to={contactLink} className="text-violet-600 dark:text-violet-400 font-bold hover:underline">
                {contactText}
              </Link>
            ) : (
              <span className="text-violet-600 dark:text-violet-400 font-bold">{contactText}</span>
            )}
          </p>
        </div>

        {/* --- Centered Expand All / Collapse All Button --- */}
        <div className="flex items-center justify-center pt-2 pb-1">
          <button
            type="button"
            onClick={isAllExpanded ? handleCollapseAll : handleExpandAll}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all shadow-sm border active:scale-95 cursor-pointer ${
              isAllExpanded
                ? "bg-violet-600 border-violet-600 text-white shadow-violet-500/25 hover:bg-violet-700"
                : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-violet-300 dark:hover:border-violet-500/40"
            }`}
          >
            {isAllExpanded ? (
              <>
                <span className="text-base leading-none font-black">−</span>
                <span>Collapse All</span>
              </>
            ) : (
              <>
                <span className="text-base leading-none font-black">+</span>
                <span>Expand All</span>
              </>
            )}
          </button>
        </div>

        {/* --- FAQ Accordion Cards (Structured Q: and A: Layout) --- */}
        <div className="space-y-3">
          {items.map((item, idx) => {
            const itemId = item.id || idx;
            const isOpen = expandedIds.has(itemId);

            return (
              <div
                key={itemId}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden text-left ${
                  isOpen
                    ? "bg-violet-50/40 dark:bg-violet-950/20 border-violet-300 dark:border-violet-500/40 shadow-sm"
                    : "bg-white dark:bg-[#1e293b] border-slate-200/90 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-500/30 shadow-xs"
                }`}
              >
                {/* Question Header Button */}
                <button
                  type="button"
                  onClick={() => toggleItem(itemId)}
                  className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-3 text-left group"
                >
                  <div className="flex items-start sm:items-center gap-2.5 flex-1 pr-2">
                    {isOpen && (
                      <span className="text-xs sm:text-sm font-black font-mono text-violet-600 dark:text-violet-400 shrink-0">
                        Q:
                      </span>
                    )}
                    <span className={`text-xs sm:text-sm font-bold tracking-tight transition-colors ${
                      isOpen
                        ? "text-slate-900 dark:text-white font-extrabold"
                        : "text-slate-800 dark:text-slate-200 group-hover:text-violet-600 dark:group-hover:text-violet-400"
                    }`}>
                      {item.q}
                    </span>
                  </div>

                  {/* Expand/Collapse Chevron Indicator */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isOpen
                        ? "bg-violet-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-white/10 text-slate-400 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/40 group-hover:text-violet-600"
                    }`}
                  >
                    {isOpen ? (
                      <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                  </div>
                </button>

                {/* Expanded Answer Body (Structured with A: prefix as in sketch) */}
                {isOpen && (
                  <div className="px-4 sm:px-4.5 pb-4.5 pt-0 border-t border-violet-100 dark:border-white/10">
                    <div className="pt-3.5 flex items-start gap-2.5 text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                      <span className="text-xs sm:text-sm font-black font-mono text-violet-600 dark:text-violet-400 shrink-0 mt-0.5">
                        A:
                      </span>
                      <div className="space-y-2 flex-1">
                        {Array.isArray(item.answerParts) ? (
                          item.answerParts.map((para, pIdx) => (
                            <p key={pIdx}>{renderFormattedText(para)}</p>
                          ))
                        ) : (
                          <p>{renderFormattedText(item.a || "")}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
