import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Sparkles, MessageSquare, X, RotateCcw } from 'lucide-react';

// Helper for fetching with a timeout
const fetchWithTimeout = async (url, options = {}, timeout = 2500) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// Extractor to find core subject/topic from a question
const extractTopic = (q) => {
  let clean = q.replace(/[?.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim().toLowerCase();

  const stripPrefixes = [
    'who is the founder of', 'who is the creator of', 'who is the developer of', 'who is your creator', 'who is your developer',
    'who developed', 'who created', 'who founded', 'who built', 'who made', 'who is', 'who was', 'who are',
    'what is the meaning of', 'what is the capital of', 'what is the definition of', 'what is', 'what was', 'what are', 'what does', 'what do',
    'where is', 'where was', 'where are',
    'when was', 'when is', 'when did',
    'why is', 'why does', 'why did',
    'how to', 'how do i', 'how does', 'how to use', 'how can i',
    'tell me about', 'explain to me', 'explain', 'tell me', 'about', 'information on', 'info on'
  ];

  for (const prefix of stripPrefixes) {
    if (clean.startsWith(prefix + ' ')) {
      clean = clean.substring(prefix.length).trim();
      break;
    }
  }

  const stopWords = ['the', 'a', 'an', 'of', 'to', 'in', 'on', 'at', 'with', 'for', 'about', 'by', 'from'];
  let words = clean.split(/\s+/).filter(w => w.length > 0);
  if (words.length > 0 && stopWords.includes(words[0])) {
    words.shift();
  }

  return words.join(' ');
};

// Hardcoded answers for quick, common general knowledge queries
const localGeneralAnswers = {
  'chatgpt': 'ChatGPT is a state-of-the-art artificial intelligence chatbot developed by **OpenAI** in 2022. It uses large language models to generate human-like text responses.',
  'who developed chatgpt': 'ChatGPT was developed by **OpenAI**. NestBloq, on the other hand, was developed by **Crestcode Technology**.',
  'who created chatgpt': 'ChatGPT was created by **OpenAI**. NestBloq, on the other hand, was developed by **Crestcode Technology**.',
  'who made chatgpt': 'ChatGPT was made by **OpenAI**. NestBloq, on the other hand, was developed by **Crestcode Technology**.',

  'gemini': 'Gemini is a family of multimodal artificial intelligence models developed by **Google**, serving as the successor to LaMDA and PaLM 2.',
  'who developed gemini': 'Gemini was developed by **Google**. NestBloq, on the other hand, was developed by **Crestcode Technology**.',
  'who created gemini': 'Gemini was created by **Google**. NestBloq, on the other hand, was developed by **Crestcode Technology**.',
  'who made gemini': 'Gemini was made by **Google**. NestBloq, on the other hand, was developed by **Crestcode Technology**.',

  'openai': 'OpenAI is an artificial intelligence research laboratory consisting of the non-profit OpenAI, Inc. and its for-profit subsidiary OpenAI, LLC. It is famous for creating ChatGPT and DALL-E.',
  'who founded openai': 'OpenAI was founded by Sam Altman, Elon Musk, Ilya Sutskever, Greg Brockman, Wojciech Zaremba, and John Schulman in December 2015.',

  'google': 'Google is a multinational technology company focusing on artificial intelligence, search engine technology, online advertising, cloud computing, and computer software.',
  'who founded google': 'Google was founded by Larry Page and Sergey Brin on September 4, 1998, while they were PhD students at Stanford University.',
  'who created google': 'Google was founded by Larry Page and Sergey Brin in 1998.',

  'nestbloq': 'NestBloq is an all-in-one rental property management platform designed for landlords, property managers, and tenants.',
  'who developed nestbloq': 'NestBloq was developed by **Crestcode Technology** to serve as a comprehensive operating system for rental and property management.',
  'who founded nestbloq': 'NestBloq was founded and developed by **Crestcode Technology**.',
  'who created nestbloq': 'NestBloq was created by **Crestcode Technology**.'
};

export default function InteractiveAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I am your NestBloq AI Assistant.\n\nAsk me anything about our rental property management platform, pricing plans, security, tenant screening, or digital leases.",
      time: 'Just now'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const presetQuestions = [
    {
      q: "What are the pricing plans?",
      a: "NestBloq offers three tiers for rental management:\n\n• Basic — $1.50/unit/month (Essential rent invoicing, leases, and tenant portals)\n• Pro — $3.00/unit/month (Adds Kanban maintenance desk, digital e-signatures, and auto late fees)\n• Enterprise — Custom pricing (Dedicated server, multi-portfolio management, custom API access)\n\nAll plans include a 14-day free trial with no credit card required."
    },
    {
      q: "Is tenant and financial data secure?",
      a: "Security and privacy are our top priorities:\n\n• Bank-grade SSL encryption on all transactions\n• Zero sensitive financial card data stored on our servers\n• Immutable audit logs for all lease and financial events\n• GDPR and SOC 2 compliant infrastructure"
    },
    {
      q: "How does digital lease signing work?",
      a: "Digital lease management is fully built-in:\n\n• Generate standard state-compliant residential lease agreements\n• Tenants sign electronically via their tenant portal\n• Landlords counter-sign with automated activation\n• PDF agreements are stored securely and accessible 24/7"
    },
    {
      q: "How do I get started?",
      a: "Getting started takes less than 2 minutes:\n\n1. Click 'Get Started' in the navigation bar\n2. Create your landlord account\n3. Register your property and units\n4. Invite tenants or draft your first lease contract"
    }
  ];

  // AI BRAIN: Intent-based response engine
  const generateResponse = async (text) => {
    const q = text.toLowerCase().trim();

    const w = (...terms) => terms.some(term => {
      if (term.includes(' ')) return q.includes(term);
      try {
        return new RegExp(`(?<![a-zA-Z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-zA-Z0-9])`, 'i').test(q);
      } catch { return q.includes(term); }
    });

    if (q.includes('property') && w('create', 'add', 'make', 'new', 'register', 'setup', 'set up')) {
      return `Steps to add a property in NestBloq:\n\n1. Sign in to your Landlord Dashboard\n2. Navigate to Properties in the sidebar\n3. Click 'Add Property' and enter the address and property type (Single Family, Multi-Unit, Condo)\n4. Add units and set monthly target rents`;
    }

    if (w('add tenant', 'invite tenant', 'add resident', 'invite resident', 'onboard tenant')) {
      return `Steps to invite a tenant:\n\n1. Go to Lease Agreements in your Landlord Dashboard\n2. Click 'Create Lease' and select the property and unit\n3. Enter the tenant email, lease term, and rent amount\n4. Send the invitation for digital review and signature`;
    }

    if (w('create service request', 'log service request', 'new service request', 'report issue', 'create work order', 'maintenance ticket')) {
      return `Creating a maintenance request:\n\n• For Tenants: Log in to your Tenant Portal, open Maintenance Request, describe the issue, and attach photos.\n• For Landlords: Open the Maintenance Desk to dispatch work orders directly to assigned vendors.`;
    }

    if (w('pay rent', 'collect rent', 'rent payment', 'payment method', 'pay invoice', 'rent ledger')) {
      return `Rent Collection & Payments:\n\n• For Tenants: Log in to the Tenant Portal, view active invoices under Payments & Ledger, and pay online.\n• For Landlords: Automated invoicing generates monthly rent bills with real-time payment tracking and audit logs.`;
    }

    if (
      (q.includes('nestbloq') && (w('what', 'explain', 'about', 'is', 'platform', 'software', 'app', 'product'))) ||
      w('what is nestbloq', 'about nestbloq', 'nestbloq platform', 'nestbloq software', 'tell me about nestbloq', 'explain nestbloq')
    ) {
      return `NestBloq is an all-in-one Rental Property Management platform built for landlords, property managers, and tenants.\n\nKey capabilities:\n• Online Rent Collection & Invoicing\n• State-Compliant Digital Leases & E-Signatures\n• Tenant Background & Document Screening\n• Kanban Maintenance Desk & Vendor Dispatch\n• Real-Time Financial Ledger & Tax Reports`;
    }

    if (w('subscription renew', 'credit renew', 'subscription renewal', 'plan renew', 'auto renew')) {
      return `Subscriptions renew automatically on a monthly or annual basis via Stripe. Invoices and receipts are automatically sent to your registered billing email.`;
    }

    if (w('plan', 'price', 'pricing', 'cost', 'package', 'how much', 'charges', 'annual plan', 'free trial', 'rate', 'rates')) {
      return presetQuestions[0].a;
    }

    if (w('secure', 'security', 'privacy', 'private', 'encrypt', 'data safe', 'safe', 'protected')) {
      return presetQuestions[1].a;
    }

    if (w('lease', 'agreement', 'esign', 'digital signature', 'contract', 'signature')) {
      return presetQuestions[2].a;
    }

    if (w('get started', 'how to start', 'book demo', 'sign up', 'signup', 'onboard', 'create account', 'free account', 'register', 'start free', 'trial start')) {
      return presetQuestions[3].a;
    }

    if (w('maintenance', 'repair', 'leak', 'plumbing', 'work order', 'kanban', 'contractor', 'dispatch', 'complain', 'complaint')) {
      return `NestBloq includes a Kanban Maintenance Desk:\n\n• Tenants log repair tickets with photos\n• Landlords assign contractors with one click\n• Status updates track progress from triage to completion\n• Real-time email notifications keep all parties updated`;
    }

    if (w('property type', 'rental property', 'residential', 'single family', 'apartment', 'multi unit')) {
      return `NestBloq supports all residential rental types:\n\n• Single Family Homes\n• Multi-Family Residential Buildings & Apartments\n• Condominium Rental Units`;
    }

    if (w('who are you', 'what are you', 'your name', 'yourself') || (w('name') && q.split(' ').length <= 5)) {
      return `I'm the **NestBloq AI Assistant** — your intelligent community management guide! \n\nI can help with:\n• NestBloq plans & pricing\n• Security & compliance\n• Bylaws AI, e-voting, maintenance\n• Billing, credits & subscriptions\n• General questions too!\n\nWhat would you like to know? `;
    }

    if (w('how are you', "how's it going", 'how is it going', 'doing') || q === 'sup' || q === 'wassup') {
      return `I'm doing great, thank you for asking!  How about you?\n\nFeel free to ask me anything — about NestBloq or just for a chat!`;
    }

    const greetPatterns = ['hi', 'hello', 'hey', 'yo', 'namaste', 'namaskar', 'hola', 'howdy', 'hii', 'hiii', 'hiiii', 'heyyy', 'hello there', 'hey there'];
    const isJustGreeting = greetPatterns.some(g => q === g || q.startsWith(g + ' ') || q.startsWith(g + ',') || q.startsWith(g + '!'));
    if (isJustGreeting) {
      return `Hello there! I am your NestBloq AI Assistant.\n\nAsk me anything — NestBloq plans, rental features, security, billing, or tenant management. What is on your mind?`;
    }

    if (w('what can you do', 'help me', 'capabilities', 'features', 'help')) {
      return `Here is what I can help with:\n\n• NestBloq Plans & Pricing\n• Security & Privacy\n• Digital Leases & E-Signatures\n• Rent Collection & Invoicing\n• Maintenance & Vendor Dispatch\n• Tenant Screening\n\nWhat would you like to explore?`;
    }

    if (w('thank', 'thanks', 'tysm', 'helpful', 'great answer', 'good job')) {
      return `You are very welcome! Happy to help.\n\nFeel free to ask anything else about NestBloq anytime.`;
    }

    if (w('joke', 'funny', 'laugh', 'comedy', 'humor')) {
      const jokes = [
        `Why did the property manager carry a ladder?\nBecause the rent was going up!\n\nWith NestBloq, at least the management part is stress-free.`,
        `Why do landlords love NestBloq?\nBecause it automates rent collection and lease renewals!`
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }

    if (w('current time', 'what time', 'what day', 'today date') || q === 'time' || q === 'date') {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      return `Current time: ${timeStr}\nToday: ${dateStr}\n\nAnything else I can help you with?`;
    }

    if (w('weather', 'temperature', 'rain', 'sunny')) {
      return `I do not have real-time weather data. Please check Google or weather.com.`;
    }

    if (/\d+\s*[\+\-\*\/]\s*\d+/.test(q)) {
      try {
        const sanitized = q.replace(/[^0-9+\-*/().\s]/g, '').trim();
        const result = Function(`"use strict"; return (${sanitized})`)();
        if (!isNaN(result) && isFinite(result)) {
          return `${text.trim()} = ${result}\n\nSpeaking of numbers, NestBloq helps calculate automated rent totals and property yields!`;
        }
      } catch { /* fall through */ }
    }

    if (w('vs', 'versus', 'compare', 'better than', 'buildium', 'appfolio', 'yardi', 'propertyware', 'alternative to', 'other platform')) {
      return `NestBloq vs the competition:\n\n• More affordable — $1.50/unit vs $2–4/unit\n• Fast setup — Go live in under 24 hours\n• Streamlined digital leases and e-signatures\n• Dedicated onboarding support\n\nWant a live walkthrough?`;
    }

    if (w('support', 'contact', 'email support', 'phone support', 'help center', 'customer service', 'helpdesk', 'customer support')) {
      return `NestBloq support is available 24/7:\n\n• Email: support@nestbloq.com\n• Live Chat: In-dashboard support\n• Phone: Dedicated for Enterprise customers\n\nWe are always here to help.`;
    }

    if (w('roi', 'savings', 'save money', 'save time', 'worth it', 'benefit')) {
      return `Landlords and managers on NestBloq typically see:\n\n• 80% reduction in manual paperwork\n• Automated on-time rent collection\n• Instant contractor work order dispatch`;
    }

    if (w('cloud', 'saas', 'mobile app', 'android', 'ios app', 'web app', 'browser support', 'offline mode', 'technology')) {
      return `NestBloq is a modern cloud-based SaaS platform:\n\n• Fully responsive for mobile and desktop browsers\n• Real-time data sync\n• 99.9% uptime guarantee`;
    }

    if (w('demo', 'free trial', 'try nestbloq', 'test nestbloq', 'trial period', 'evaluation')) {
      return `NestBloq offers a 14-day free trial with no credit card required.\n\nClick 'Get Started' in the top navigation bar to begin.`;
    }

    const cleanQuery = q.replace(/[?.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim().toLowerCase();
    if (localGeneralAnswers[cleanQuery]) {
      return localGeneralAnswers[cleanQuery];
    }

    const knowledgeBase = [
      {
        keywords: ['user roles', 'user permissions', 'role isolation', 'rbac', 'access control', 'landlord role', 'tenant role', 'super admin role'],
        answer: `NestBloq features Role-Based Access Control (RBAC):\n\n• Super Admin — Full system oversight and platform analytics.\n• Landlord / Property Owner — Manages properties, creates digital leases, dispatches maintenance, and tracks rental income.\n• Tenant — Views active lease agreements, pays rent online, and submits service requests.\n• Contractors / Vendors — Receives and updates assigned repair tickets.`
      },
      {
        keywords: ['pricing plan', 'pricing plans', 'nestbloq pricing', 'nestbloq cost', 'nestbloq price', 'nestbloq plans', 'subscription cost', 'subscription plan', 'basic plan', 'pro plan', 'enterprise plan'],
        answer: `NestBloq offers three simple subscription tiers:\n\n• Basic Plan ($1.50/unit/month) — Core rent invoicing, leases, and tenant portals.\n• Pro Plan ($3.00/unit/month) — Includes Kanban maintenance desk, digital e-signatures, and auto late fees.\n• Enterprise Plan (Custom Pricing) — Dedicated server, custom REST API, and priority 24/7 phone support.\n\nFree Trial: Every account starts with a 14-day free trial.`
      },
      {
        keywords: ['pay rent', 'collect rent', 'rental dues', 'nestbloq payment', 'stripe payment', 'plaid integration', 'ach transfer', 'automated rent', 'payment reminders'],
        answer: `NestBloq automates Rent Collection & Payments:\n\n• ACH & Credit Cards — Tenants pay directly online through secure integrations.\n• Automated Invoices & Reminders — Automated monthly rent rolls with past-due reminders.\n• Digital Ledger — Payments automatically reconcile and post to the property ledger.`
      },
      {
        keywords: ['maintenance request', 'maintenance ticket', 'work order', 'workorders', 'kanban board', 'kanban maintenance', 'report leak', 'dispatch contractor', 'dispatch vendor', 'property repair'],
        answer: `Our Kanban Maintenance Desk coordinates repairs from start to finish:\n\n1. Tenant Logs Issue — Tenants submit requests via their portal with photos and descriptions.\n2. Landlord Dispatches — Property managers assign work orders to contractors in one click.\n3. Vendor Updates — Contractors mark items as 'In Progress' or 'Completed'.\n4. Notifications — Real-time email notifications keep everyone informed.`
      },
      {
        keywords: ['lease agreement', 'digital lease', 'esignature', 'tenant signature', 'landlord signature', 'lease template', 'contract'],
        answer: `Digital Lease Management in NestBloq:\n\n• Create state-compliant standard residential leases\n• Tenant review and digital e-signature via tenant portal\n• Landlord signature and one-click lease activation\n• Secure document storage for pay stubs and ID proofs`
      },
      {
        keywords: ['nestbloq integration', 'nestbloq integrations', 'integrate with', 'quickbooks sync', 'twilio sms', 'zapier integration', 'nestbloq api', 'api integration'],
        answer: `NestBloq connects with modern tools:\n\n• Stripe & Plaid — Automated online payments\n• Twilio — Real-time SMS and email alerts\n• Open REST API — Custom integrations for enterprise portfolios`
      },
      {
        keywords: ['who developed you', 'who built you', 'who created you', 'who is your developer', 'who founded you', 'who made you', 'who developed nestbloq', 'who founded nestbloq', 'who created nestbloq', 'crestcode', 'crestcode technology'],
        answer: `NestBloq is engineered by Crestcode Technology as a comprehensive operating system for modern rental property management.`
      },
      {
        keywords: ['nestbloq tech', 'nestbloq technology', 'nestbloq stack', 'tech stack', 'technology stack', 'what is nestbloq built with'],
        answer: `NestBloq leverages a modern technology stack:\n\n• Frontend: React.js with Tailwind CSS\n• Backend: Python (FastAPI framework)\n• Database: PostgreSQL\n• Integrations: Stripe, Plaid, Twilio`
      },
      {
        keywords: ['where is nestbloq', 'nestbloq location', 'nestbloq office', 'nestbloq hq', 'nestbloq headquarters', 'nestbloq address'],
        answer: `NestBloq is a cloud-based SaaS platform operated globally. For inquiries, connect with us at contact@nestbloq.com.`
      }
    ];

    let bestMatch = null;
    let maxScore = 0;

    for (const item of knowledgeBase) {
      let score = 0;
      for (const kw of item.keywords) {
        const matched = kw.includes(' ')
          ? q.includes(kw)
          : new RegExp(`(?<![a-zA-Z0-9])${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-zA-Z0-9])`, 'i').test(q);
        if (matched) score += kw.includes(' ') ? 3 : 1;
      }
      if (score > maxScore) { maxScore = score; bestMatch = item; }
    }

    if (bestMatch && maxScore > 0) return bestMatch.answer;

    const topic = extractTopic(q);
    if (topic && topic.length > 2) {
      try {
        const response = await fetchWithTimeout(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic.replace(/\s+/g, '_'))}`);
        if (response.ok) {
          const data = await response.json();
          if (data.extract) {
            return `**${data.title}**\n\n${data.extract}\n\n*Source: Wikipedia*\n\n---\n\nHope that helps! As your **NestBloq AI Assistant**, I can also help you with NestBloq-specific topics like pricing, security, user roles, bylaws AI, e-voting, or booking facilities. What would you like to explore?`;
          }
        }
      } catch (e) { console.log("Wikipedia fetch error or timeout:", e); }
    }

    const stopWords = ['what', 'is', 'the', 'a', 'an', 'of', 'to', 'how', 'do', 'you', 'can', 'tell', 'me', 'about', 'who', 'where', 'why', 'are', 'your', 'my', 'in', 'on', 'at', 'with', 'for', 'this', 'that', 'there', 'here', 'please', 'give', 'show', 'list', 'do', 'does', 'did', 'has', 'have', 'had', 'should', 'would', 'could', 'want', 'like'];
    const queryWords = q.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(w => !stopWords.includes(w) && w.length > 2);
    const mainTopic = queryWords.length > 0 ? queryWords.join(' ') : '';

    let fallbackText = mainTopic
      ? `I understand you are asking about **"${mainTopic}"**. While my core focus is property management workflows, I'm happy to guide you!\n\nFor general topics like this, you can check our documentation or start your 14-day free trial.`
      : `Great question! As the NestBloq AI Assistant, I'm here to help you automate community management.`;

    return `${fallbackText}\n\nTo keep things focused, let me know if you would like details on:\n•  **Plans & Pricing** ($1.50 - $3.00/unit/month)\n•  **Role Isolation** (Manager, Board, Resident, Vendor)\n•  **Kanban Repairs & Dues Automation**\n•  **Bylaws AI Copilots**`;
  };

  const handleSend = (text) => {
    if (!text.trim() || isTyping) return;
    setMessages(prev => [...prev, { sender: 'user', text, time: 'Just now' }]);
    setInputValue('');
    setIsTyping(true);

    const startTime = Date.now();
    generateResponse(text).then(resp => {
      const elapsed = Date.now() - startTime;
      const minDelay = 800 + Math.random() * 600;
      const remainingDelay = Math.max(0, minDelay - elapsed);
      setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'ai', text: resp, time: 'Just now' }]);
        setIsTyping(false);
      }, remainingDelay);
    }).catch(err => {
      console.error(err);
      setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'ai', text: "I'm sorry, I'm having trouble processing that question right now. Can you try again or ask something about NestBloq?", time: 'Just now' }]);
        setIsTyping(false);
      }, 500);
    });
  };

  const handleReset = () => {
    setMessages([{
      sender: 'ai',
      text: "Hello!  I'm your NestBloq AI Assistant.\n\nAsk me anything about our plans, security, features, billing, or community management workflows!",
      time: 'Just now'
    }]);
    setIsTyping(false);
  };

  useEffect(() => {
    if (isOpen) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isOpen]);

  const renderText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part.split('\n').map((line, j) => (
        <React.Fragment key={`${i}-${j}`}>
          {j > 0 && <br />}
          {line}
        </React.Fragment>
      ));
    });
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end select-none font-sans">

      {/* ── CLOSED STATE — only welcome bubble, NO floating chips ── */}
      {!isOpen && showWelcome && (
        <div className="relative mb-3 p-4 bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-slate-700 rounded-2xl shadow-xl max-w-[260px] animate-fade-in-up flex gap-3 items-start pointer-events-auto">
          <button
            onClick={(e) => { e.stopPropagation(); setShowWelcome(false); }}
            className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Dismiss"
          >
            <X size={12} />
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
            <Bot size={18} />
          </div>
          <div className="pr-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs">Welcome! </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Ask me anything about NestBloq!</p>
          </div>
        </div>
      )}

      {/* ── CHAT PANEL ── */}
      {isOpen && (
        <div className="w-[360px] max-w-[95vw] h-[540px] max-h-[85vh] bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-fade-in-up mb-4 transition-colors duration-200">

          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 via-[#5942be] to-indigo-600 p-4 flex items-center justify-between text-white shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center border border-white/20">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#5942be]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  NestBloq Assistant
                  <Sparkles size={12} className="text-yellow-300" />
                </h3>
                <p className="text-[10px] text-white/80 font-medium">Your smart community guide</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleReset} title="Reset" className="p-1.5 rounded-lg hover:bg-white/10 text-white/90 hover:text-white transition-colors">
                <RotateCcw size={15} />
              </button>
              <button onClick={() => setIsOpen(false)} title="Close" className="p-1.5 rounded-lg hover:bg-white/10 text-white/90 hover:text-white transition-colors">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Quick suggestions (only on first open) */}
          {messages.length === 1 && (
            <div className="p-3 bg-slate-50/50 dark:bg-white/[0.01] border-b border-slate-100 dark:border-white/[0.04] shrink-0">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Popular questions:</p>
              <div className="flex flex-wrap gap-1.5">
                {presetQuestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.q)}
                    disabled={isTyping}
                    className="px-2.5 py-1 text-[11px] bg-white dark:bg-white/[0.02] text-slate-700 dark:text-slate-300 hover:text-white border border-slate-200/80 dark:border-white/[0.06] hover:bg-gradient-to-r hover:from-violet-600 hover:to-indigo-600 hover:border-transparent rounded-lg shadow-sm transition-all duration-200 disabled:opacity-50"
                  >
                    {item.q.split(" ").slice(1).join(" ")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/30 dark:bg-[#0f172a]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'ml-auto flex-row-reverse max-w-[85%]' : 'max-w-[92%]'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm shrink-0 ${msg.sender === 'user'
                    ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white'
                    : 'bg-white dark:bg-white/[0.04] text-violet-400 border border-slate-100 dark:border-white/[0.06]'
                  }`}>
                  {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className="space-y-1 min-w-0">
                  <div className={`p-3 rounded-2xl shadow-sm text-xs leading-relaxed ${msg.sender === 'user'
                      ? 'bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-tr-none'
                      : 'bg-white dark:bg-white/[0.04] text-slate-800 dark:text-slate-200 border border-slate-100/80 dark:border-white/[0.04] rounded-tl-none'
                    }`}>
                    {renderText(msg.text)}
                  </div>
                  <p className={`text-[9px] text-slate-400 ${msg.sender === 'user' ? 'text-right' : ''}`}>{msg.time}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start gap-2.5 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-white/[0.04] text-violet-400 border border-slate-100 dark:border-white/[0.06] flex items-center justify-center shrink-0">
                  <Bot size={14} />
                </div>
                <div className="bg-white dark:bg-white/[0.04] border border-slate-100/80 dark:border-white/[0.04] px-3.5 py-2.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Footer disclaimer */}
          <div className="px-4 py-1.5 bg-slate-100/40 dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/[0.03] text-center shrink-0">
            <span className="text-[9px] text-slate-400">
              NestBloq AI Assistant •{' '}
              <a href="#" className="underline text-violet-500 hover:text-violet-600">Terms of Use</a>
            </span>
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); if (inputValue.trim()) handleSend(inputValue); }}
            className="p-3 bg-white dark:bg-[#1e293b] border-t border-slate-100 dark:border-slate-700 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-white/[0.01] border border-slate-200/80 dark:border-white/[0.06] text-xs rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="w-9 h-9 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white flex items-center justify-center shadow-md active:scale-95 transition-all disabled:opacity-40"
            >
              <Send size={14} />
            </button>
          </form>

        </div>
      )}

      {/* ── FAB BUTTON ── */}
      <button
        onClick={() => { setIsOpen(!isOpen); setShowWelcome(false); }}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white flex items-center justify-center shadow-xl shadow-violet-500/20 active:scale-95 transition-all duration-300 hover:scale-105"
        aria-label="Toggle NestBloq Assistant"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

    </div>
  );
}