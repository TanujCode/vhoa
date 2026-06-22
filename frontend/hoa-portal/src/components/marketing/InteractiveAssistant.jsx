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
  
  'nestbloq': 'NestBloq is an all-in-one community management platform designed for HOAs, condos, apartments, and rental properties.',
  'who developed nestbloq': 'NestBloq was developed by **Crestcode Technology** to serve as a comprehensive operating system for community and property management.',
  'who founded nestbloq': 'NestBloq was founded and developed by **Crestcode Technology**.',
  'who created nestbloq': 'NestBloq was created by **Crestcode Technology**.'
};

export default function InteractiveAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! 👋 I'm your NestBloq AI Assistant.\n\nAsk me anything about our plans, security, features, billing, or community management workflows!",
      time: 'Just now'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const presetQuestions = [
    {
      q: "💳 What are the pricing plans?",
      a: "NestBloq offers three tiers:\n\n• **Basic** — $1.50/unit/month\n  Essential dues, roster & assembly tools\n• **Pro** — $3.00/unit/month\n  Adds Bylaws AI Copilot, Kanban boards & SMS alerts\n• **Enterprise** — Custom pricing\n  Dedicated server + SHA-256 voting audits\n\n✅ All plans: **14-day free trial**, no credit card needed!"
    },
    {
      q: "🔒 Is my community data secure?",
      a: "Absolutely! Security is our top priority:\n\n🔐 **Stripe & Plaid** — zero card data stored on our servers\n🔐 **Bank-grade SSL** encryption on all communications\n🔐 **SHA-256 audit logs** for every vote & resolution\n🔐 **GDPR & SOC 2** compliant infrastructure\n\nYour data is in safe hands!"
    },
    {
      q: "🧠 How does the Bylaws AI work?",
      a: "The Bylaws AI Copilot reads your community rulebook & documents. It:\n\n• Answers resident queries 24/7 (parking, pets, noise rules)\n• Auto-drafts meeting agendas\n• Reduces admin workload by up to **80%**\n• Available on **Pro** and **Enterprise** plans"
    },
    {
      q: "🚀 How do I get started?",
      a: "Super easy to get started!\n\n1️⃣ Click **'Get Started'** in the navbar\n2️⃣ Create your free account (no card needed)\n3️⃣ Explore with demo data\n4️⃣ Or **Book a Demo** for a live walkthrough\n\nOur team helps you go live in under 24 hours!"
    }
  ];

  const floatingChips = [
    { label: "💳 Pricing Plans", q: "What are the pricing plans?" },
    { label: "🔒 Data Security", q: "Is my community data secure?" },
    { label: "🧠 Bylaws AI", q: "How does the Bylaws AI work?" },
    { label: "🚀 Get Started", q: "How do I get started?" }
  ];

  // ─── AI BRAIN: Intent-based response engine ──────────────────────────────
  const generateResponse = async (text) => {
    const q = text.toLowerCase().trim();

    // Word-boundary safe match: won't match 'hi' inside 'this' or 'hoa' inside 'shoal'
    const w = (...terms) => terms.some(term => {
      if (term.includes(' ')) return q.includes(term);
      try {
        return new RegExp(`(?<![a-zA-Z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-zA-Z0-9])`, 'i').test(q);
      } catch { return q.includes(term); }
    });

    // ── 0. HOW TO / OPERATIONAL PROCEDURES ──────────────────
    if (q.includes('community') && w('create', 'add', 'make', 'new', 'register', 'setup', 'set up')) {
      return `Here are the steps to **Create a Community** in NestBloq:\n\n1️⃣ **Register/Sign Up** — Click **'Start Free Trial'** on the homepage to create your admin account.\n2️⃣ **Add Community** — In your Admin Dashboard, click the **'Add Community'** or **'Create Community'** button.\n3️⃣ **Enter Details** — Fill in the community details (Name, Address, Zip, and Type: HOA, Condo, Apartment, or Rental).\n4️⃣ **Get Community Code** — A unique code (e.g., \`VIK071\`) will be generated. You can share this code with residents to invite them to join!`;
    }

    if (w('add member', 'invite member', 'add resident', 'invite resident', 'add homeowner', 'invite homeowner', 'add user', 'invite user') || 
        ((q.includes('member') || q.includes('resident') || q.includes('homeowner') || q.includes('user')) && w('add', 'invite', 'register'))) {
      return `Here is how to **Add/Invite Members** to your community:\n\n1️⃣ **Generate Invite Link** — Go to the **Members** page in your dashboard and click **'Invite Member'**.\n2️⃣ **Role Selection** — Select the role (Homeowner, Board Member, Auditor, or Manager).\n3️⃣ **Share Code/Link** — Copy the unique invitation link or your **Community Code** (e.g., \`VIK071\`) and send it to them via email, text, or WhatsApp.\n4️⃣ **Resident Join** — Residents register using your link, and they will automatically join your specific community workspace.`;
    }

    if (w('create service request', 'log service request', 'new service request', 'report issue', 'create work order', 'log complaint') ||
        ((q.includes('service') || q.includes('request') || q.includes('maintenance')) && w('create', 'add', 'log', 'report'))) {
      return `Here is how to **Create a Service Request** (Maintenance Ticket):\n\n• **For Residents**: Log in to your Resident Portal, go to **Service Requests**, click **'New Request'**, describe the issue, upload photos, and click submit.\n• **For Admins**: Go to the **Kanban Maintenance Board**, click **'Create Work Order'**, fill in the details, and assign a Vendor/Contractor directly.`;
    }

    if (w('book amenity', 'book facility', 'reserve amenity', 'reserve facility', 'book pool', 'book clubhouse', 'book gym') ||
        ((q.includes('amenity') || q.includes('facility') || q.includes('pool') || q.includes('gym') || q.includes('clubhouse')) && w('book', 'reserve'))) {
      return `Here is how to **Book an Amenity** (e.g. pool, clubhouse, gym):\n\n1️⃣ **Select Amenity** — Go to the **Amenity Booking** tab in the sidebar.\n2️⃣ **Choose Slot** — Open the live calendar, select your desired date and time slot.\n3️⃣ **Submit Request** — Click **'Book Slot'**. Depending on community rules, it will either be instantly confirmed or sent to the board/admin for approval.`;
    }

    if (w('log violation', 'report violation', 'create violation', 'add violation', 'file violation') ||
        ((q.includes('violation') || q.includes('infraction')) && w('log', 'report', 'add', 'create', 'file'))) {
      return `Here is how to **Log a Community Violation**:\n\n1️⃣ **Create Ticket** — Go to the **Violations** tab in the admin sidebar and click **'Log Violation'**.\n2️⃣ **Specify Rules** — Select the resident/unit, choose the violated rule category (parking, trash, lawn, etc.), write notes, and upload photos.\n3️⃣ **Send Warning** — Click **'Submit'**. The system automatically generates a warning notification letter/email with a **30-day dispute window** and late fee details.`;
    }

    if (w('pay dues', 'collect dues', 'collect fees', 'how to pay', 'payment method', 'pay invoice') ||
        ((q.includes('dues') || q.includes('invoice') || q.includes('fee')) && w('pay', 'collect'))) {
      return `Here is how to **Pay or Collect Dues**:\n\n• **For Residents**: Log in to the Resident Portal, link your bank securely via Plaid (or enter a credit card), and pay outstanding invoices under the **Payments** section.\n• **For Admins**: Set up automated billing schedules in **Finances & Dues** to automatically send monthly/annual invoices, track payments on your ledger, and send automated late reminders.`;
    }

    if (w('cast vote', 'how to vote', 'submit vote', 'cast ballot', 'start vote', 'create vote', 'create election') ||
        (q.includes('vote') && w('cast', 'how to', 'submit', 'start', 'create', 'how do i'))) {
      return `Here is how to use the **E-Voting System**:\n\n• **For Admins**: Go to the **E-Voting** section, click **'New Resolution/Election'**, specify options/candidates, upload docs, set quorum criteria, and launch.\n• **For Residents**: You will receive a secure email notification. Log in, click **'Cast Vote'**, select your choice. Your vote gets securely sealed with a cryptographic SHA-256 hash audit trail.`;
    }

    // ── 1. WHAT IS NESTBLOQ ────────────
    if (
      (q.includes('nestbloq') && (w('what', 'explain', 'about', 'is', 'platform', 'software', 'app', 'product'))) ||
      w('what is nestbloq', 'about nestbloq', 'nestbloq platform', 'nestbloq software', 'tell me about nestbloq', 'explain nestbloq')
    ) {
      return `**NestBloq** is a modern all-in-one **community management platform**! 🏘️\n\nIt brings together everything a property community needs:\n\n🏠 **Dues Collection** — Automated billing via ACH & card\n🔧 **Maintenance Kanban** — Work orders & contractor dispatch\n🗳️ **E-Voting** — SHA-256 secure online voting & resolutions\n🤖 **Bylaws AI Copilot** — 24/7 automated resident Q&A\n📅 **Amenity Booking** — Real-time pool, gym & clubhouse booking\n📊 **Financial Ledger** — Auto accounting & reporting\n\n✅ Built for **HOAs, Apartments, Condos & Rental** communities.\n\nWant to know more about any feature?`;
    }

    // ── 2. SUBSCRIPTION RENEWAL + CREDITS ──────────────────────────────────
    if (
      w('subscription renew', 'credit renew', 'credits renew', 'credit also renew', 'subscription renewal',
        'plan renew', 'auto renew', 'automatic renewal')
    ) {
      return `Yes, absolutely! 🎉\n\nWhen your **subscription renews**:\n\n✅ All **credits reset automatically** with the new cycle\n✅ Secure payment processed via Stripe\n✅ Invoice emailed to your registered address\n\nTrack everything at **Dashboard → Settings → Billing**.`;
    }

    // ── 3. SUBSCRIPTION / BILLING (general) ────────────────────────────────
    if (w('subscription', 'billing', 'invoice', 'billing cycle') && !w('credit')) {
      return `NestBloq subscriptions renew **monthly or annually**. 💳\n\nPlans:\n• **Basic**: $1.50/unit/month\n• **Pro**: $3.00/unit/month\n• **Enterprise**: Custom pricing\n\nCredits auto-refresh with every billing cycle renewal.\n\nManage at **Dashboard → Settings → Billing**.`;
    }

    // ── 4. CREDITS ──────────────────────────────────────────────────────────
    if (w('credit', 'credits') && !w('credit card')) {
      return `NestBloq **credits** power your platform usage — AI queries, SMS alerts, etc. 🔄\n\nThey **automatically reset** with every subscription renewal.\n\nRunning low? Top up anytime from your **Dashboard**.`;
    }

    // ── 5. PRICING / PLANS ──────────────────────────────────────────────────
    if (w('plan', 'price', 'pricing', 'cost', 'package', 'how much', 'charges', 'annual plan', 'free trial', 'rate', 'rates')) {
      return presetQuestions[0].a;
    }

    // ── 6. SECURITY ─────────────────────────────────────────────────────────
    if (w('secure', 'security', 'privacy', 'private', 'encrypt', 'hack', 'data breach',
        'gdpr', 'soc', 'ssl', 'sha-256', 'data safe', 'safe', 'protected')) {
      return presetQuestions[1].a;
    }

    // ── 7. BYLAWS AI ────────────────────────────────────────────────────────
    if (w('bylaw', 'bylaws', 'copilot', 'ai copilot', 'rulebook', 'bylaws ai',
        'artificial intelligence', 'document ai', 'rules ai')) {
      return presetQuestions[2].a;
    }

    // ── 8. GET STARTED / DEMO ───────────────────────────────────────────────
    if (w('get started', 'how to start', 'book demo', 'sign up', 'signup',
        'onboard', 'create account', 'free account', 'register', 'start free', 'trial start')) {
      return presetQuestions[3].a;
    }

    // ── 9. MAINTENANCE ──────────────────────────────────────────────────────
    if (w('maintenance', 'repair', 'leak', 'plumbing', 'work order', 'kanban',
        'contractor', 'dispatch', 'complain', 'complaint', 'breakdown')) {
      return `NestBloq has a smart **Kanban Maintenance Board**! 🔧\n\n• Residents submit issues with photos & notes\n• Managers dispatch contractors in one click\n• Residents get automatic SMS status updates\n• Real-time progress tracking\n\nAll from one dashboard — zero manual coordination!`;
    }

    // ── 10. AMENITIES ───────────────────────────────────────────────────────
    if (w('amenity', 'amenities', 'pool', 'gym', 'clubhouse', 'book amenity',
        'facility booking', 'reserve facility', 'court booking', 'hall booking')) {
      return `NestBloq lets residents **book amenities in real-time**! 🏊\n\n• Pool, gym, clubhouse, banquet halls — all online\n• Automatic double-booking prevention\n• Instant booking confirmation\n• Live availability calendar`;
    }

    // ── 11. VOTING / MEETINGS ───────────────────────────────────────────────
    if (w('vote', 'voting', 'election', 'meeting', 'assembly', 'quorum', 'resolution', 'ballot')) {
      return `NestBloq's **E-Voting system** is secure & fully auditable! 🗳️\n\n• Every vote has a **SHA-256 cryptographic audit trail**\n• Run online general assemblies easily\n• Automatic quorum tracking\n• Auto-generated meeting minutes\n• Legal-grade tamper-proof records`;
    }

    // ── 12. DUES / PAYMENTS ─────────────────────────────────────────────────
    if (w('dues', 'payment', 'collect payment', 'ach payment', 'plaid', 'outstanding balance',
        'ledger', 'pending payment', 'rent collection', 'hoa fee', 'maintenance fee')) {
      return `NestBloq makes dues collection **100% automated**! 💳\n\n• Residents securely connect bank via **Plaid**\n• Pay by credit card or ACH bank transfer\n• Outstanding balances auto-tracked\n• Automatic late payment reminders\n• Digital ledger entries generated instantly`;
    }

    // ── 13. INTEGRATIONS ────────────────────────────────────────────────────
    if (w('integration', 'integrate', 'zapier', 'quickbooks', 'twilio', 'open api',
        'rest api', 'third party', 'connect with', 'api access')) {
      return `NestBloq integrates with your favorite tools! 🔗\n\n• **Stripe & Plaid** — Secure payment processing\n• **Twilio** — SMS & WhatsApp notifications\n• **QuickBooks** — Accounting sync\n• **Zapier** — 5,000+ app connections\n• **Open REST API** — Custom integrations\n\nAll available on Pro & Enterprise plans.`;
    }

    // ── 14. PROPERTY TYPES ──────────────────────────────────────────────────
    if (
      w('hoa', 'homeowner association', 'apartment complex', 'condominium', 'condo association',
        'rental property', 'community type', 'property type', 'residential community')
    ) {
      return `NestBloq is purpose-built for **all community types**! 🏘️\n\n• **HOA** — Homeowner Association management\n• **Apartments** — Multi-unit residential buildings\n• **Condos** — Condominium association tools\n• **Rentals** — Rental portfolio management\n\nEach module is tailored to the workflows of that community type!`;
    }

    // ── 15. IDENTITY ────────────────────────────────────────────────────────
    if (
      w('who are you', 'what are you', 'your name', 'yourself') ||
      (w('name') && q.split(' ').length <= 5)
    ) {
      return `I'm the **NestBloq AI Assistant** — your intelligent community management guide! 🤖✨\n\nI can help with:\n• NestBloq plans & pricing\n• Security & compliance\n• Bylaws AI, e-voting, maintenance\n• Billing, credits & subscriptions\n• General questions too!\n\nWhat would you like to know? 😊`;
    }

    // ── 16. HOW ARE YOU ─────────────────────────────────────────────────────
    if (
      w('how are you', "how's it going", 'how is it going', 'doing') ||
      q === 'sup' || q === 'wassup'
    ) {
      return `I'm doing great, thank you for asking! 😊 How about you?\n\nFeel free to ask me anything — about NestBloq or just for a chat!`;
    }

    // ── 17. GREETINGS (ONLY when message IS the greeting — not embedded) ────
    const greetPatterns = ['hi', 'hello', 'hey', 'yo', 'namaste', 'namaskar', 'hola',
      'howdy', 'hii', 'hiii', 'hiiii', 'heyyy', 'hello there', 'hey there'];
    const isJustGreeting = greetPatterns.some(g =>
      q === g || q.startsWith(g + ' ') || q.startsWith(g + ',') || q.startsWith(g + '!')
    );
    if (isJustGreeting) {
      return `Hello there! 👋 I'm your NestBloq AI Assistant.\n\nAsk me anything — NestBloq plans, features, security, billing, or just have a chat! What's on your mind?`;
    }

    // ── 18. CAPABILITIES ────────────────────────────────────────────────────
    if (w('what can you do', 'help me', 'capabilities', 'features', 'help')) {
      return `Here's what I can help with! 🚀\n\n🏷️ **NestBloq Plans & Pricing**\n🔐 **Security & Privacy**\n🤖 **Bylaws AI Copilot**\n💳 **Billing & Credits**\n🔧 **Maintenance & Work Orders**\n📅 **Amenity Booking**\n🗳️ **E-Voting & Meetings**\n💬 **General chat too!**\n\nWhat would you like to explore?`;
    }

    // ── 19. THANKS ──────────────────────────────────────────────────────────
    if (w('thank', 'thanks', 'tysm', 'helpful', 'great answer', 'good job')) {
      return `You're very welcome! 😊 Happy to help!\n\nFeel free to ask anything else about NestBloq anytime!`;
    }

    // ── 20. JOKES ───────────────────────────────────────────────────────────
    if (w('joke', 'funny', 'laugh', 'comedy', 'humor')) {
      const jokes = [
        `Why did the property manager carry a ladder? 🪜\nBecause the **rent was going up!** 😄\n\nWith NestBloq, at least the management part is stress-free!`,
        `Why do HOA managers love NestBloq?\nBecause it finally **fixes the "no response" bug** in community life! 😄`,
        `Resident: "It has been 3 days since my maintenance request, no response!"\nNestBloq user: "Ours gets resolved within 2 hours!" 😂`
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }

    // ── 21. TIME / DATE ─────────────────────────────────────────────────────
    if (w('current time', 'what time', 'what day', 'today date') ||
        q === 'time' || q === 'date') {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      return `Current time: **${timeStr}** ⏰\nToday: **${dateStr}**\n\nAnything else I can help you with?`;
    }

    // ── 22. WEATHER ─────────────────────────────────────────────────────────
    if (w('weather', 'temperature', 'rain', 'sunny')) {
      return `I don't have real-time weather data (I'm not connected to the internet). Check Google or weather.com! ☀️\n\nFun fact: NestBloq's amenity booking lets residents book outdoor spaces like pools & parks in real-time!`;
    }

    // ── 23. MATH ────────────────────────────────────────────────────────────
    if (/\d+\s*[\+\-\*\/]\s*\d+/.test(q)) {
      try {
        const sanitized = q.replace(/[^0-9+\-*/().\s]/g, '').trim();
        const result = Function(`"use strict"; return (${sanitized})`)();
        if (!isNaN(result) && isFinite(result)) {
          return `**${text.trim()}** = **${result}** 🧮\n\nSpeaking of numbers — NestBloq's ROI Calculator shows how much time & money your community saves!`;
        }
      } catch { /* fall through */ }
    }

    // ── 24. COMPETITOR COMPARISON ───────────────────────────────────────────
    if (w('vs', 'versus', 'compare', 'better than', 'buildium', 'appfolio', 'yardi',
        'propertyware', 'alternative to', 'other platform')) {
      return `NestBloq vs the competition 🏆\n\n**vs Buildium / AppFolio / Yardi:**\n• ✅ More affordable — $1.50/unit vs $2–4/unit\n• ✅ Built-in **Bylaws AI Copilot** (unique to NestBloq)\n• ✅ **SHA-256 e-voting** audit trails\n• ✅ Go live in **under 24 hours**\n• ✅ Dedicated onboarding specialist\n\nWant a personalized demo to see the difference?`;
    }

    // ── 25. SUPPORT / CONTACT ───────────────────────────────────────────────
    if (w('support', 'contact', 'email support', 'phone support', 'help center',
        'customer service', 'helpdesk', 'customer support')) {
      return `NestBloq support is **available 24/7**! 📞\n\n• **Email**: support@nestbloq.com\n• **Live Chat**: In-dashboard support\n• **Phone**: Dedicated for Enterprise customers\n• **Docs**: docs.nestbloq.com\n\nWe're always here to help!`;
    }

    // ── 26. ROI / SAVINGS ───────────────────────────────────────────────────
    if (w('roi', 'savings', 'save money', 'save time', 'worth it', 'benefit')) {
      return `Communities on NestBloq typically see:\n\n💰 **80% reduction** in admin time\n💰 **$500+/month saved** vs manual methods\n💰 **Near-zero late dues** with auto-reminders\n\nTry our **ROI Calculator** to see your projected savings! 📊`;
    }

    // ── 27. TECHNOLOGY ──────────────────────────────────────────────────────
    if (w('cloud', 'saas', 'mobile app', 'android', 'ios app', 'web app', 'browser support',
        'offline mode', 'technology')) {
      return `NestBloq is a modern **cloud-based SaaS platform**! 📱💻\n\n• Works in any web browser\n• **Android & iOS** native apps\n• Real-time data sync\n• 99.9% uptime guarantee`;
    }

    // ── 28. DEMO / TRIAL ────────────────────────────────────────────────────
    if (w('demo', 'free trial', 'try nestbloq', 'test nestbloq', 'trial period', 'evaluation')) {
      return `NestBloq offers a **14-day free trial** — no credit card required! 🎉\n\nOr book a **live demo** where our team personally walks you through the platform.\n\n👉 Click **"Get Started"** or **"Book a Demo"** in the top navbar!`;
    }

    // ── LOCAL GENERAL KNOWLEDGE ANSWERS ──────────────────────
    const cleanQuery = q.replace(/[?.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim().toLowerCase();
    if (localGeneralAnswers[cleanQuery]) {
      return localGeneralAnswers[cleanQuery];
    }

    // ── SMART KNOWLEDGE BASE FALLBACK SEARCH ──────────────────
    const knowledgeBase = [
      {
        keywords: ['user roles', 'user permissions', 'role isolation', 'rbac', 'access control', 'board member role', 'property manager role', 'resident role', 'homeowner role', 'board president role'],
        answer: `NestBloq features comprehensive **Role-Based Access Control (RBAC)** to isolate data and tasks:\n\n• **Super Admin / Property Manager** — Full control over community settings, billing, dues collection, violations, and vendor management.\n• **Board Members (President, Secretary)** — Access to financial ledgers, voting audits, and general community oversight.\n• **Homeowners / Residents** — Access to their personal portal to pay dues, book amenities, log maintenance requests, and cast encrypted votes.\n• **Vendors / Contractors** — Access to specific work orders assigned to them to update status, track time, and submit completion notes.`
      },
      {
        keywords: ['pricing plan', 'pricing plans', 'nestbloq pricing', 'nestbloq cost', 'nestbloq price', 'nestbloq plans', 'subscription cost', 'subscription plan', 'basic plan', 'pro plan', 'enterprise plan'],
        answer: `NestBloq offers three simple subscription tiers:\n\n• **Basic Plan** ($1.50/unit/month) — Core financial tools, digital ledger, rosters, and basic member invites.\n• **Pro Plan** ($3.00/unit/month) — Includes Bylaws AI Copilot, Kanban maintenance desk, SMS alerts, QuickBooks integration, and SHA-256 secure e-voting.\n• **Enterprise Plan** (Custom Pricing) — Dedicated server, custom REST API, custom integrations, and priority 24/7 phone support.\n\n🎁 **Free Trial**: Every account starts with a 14-day free trial (no credit card required!). Har billing cycle renew hone par credits automatically reset ho jaate hain.`
      },
      {
        keywords: ['pay dues', 'collect dues', 'hoa dues', 'hoa fees', 'nestbloq payment', 'stripe payment', 'plaid integration', 'ach transfer', 'automated dues', 'payment reminders'],
        answer: `NestBloq automates **Dues & Payments** fully:\n\n• **ACH & Credit Cards** — Residents pay directly online through Stripe and Plaid integrations (no card details are stored on our servers).\n• **Autopay & Reminders** — Residents can enable auto-payments. Admins can schedule automatic email/SMS reminders for past-due balances.\n• **Accounting Ledger** — Payments automatically reconcile and post to the digital ledger, making audit reports instant.`
      },
      {
        keywords: ['maintenance request', 'maintenance ticket', 'work order', 'workorders', 'kanban board', 'kanban maintenance', 'report leak', 'dispatch contractor', 'dispatch vendor', 'property repair'],
        answer: `Our **Kanban Maintenance Desk** coordinates repairs from start to finish:\n\n1️⃣ **Resident Logs Issue** — Residents submit requests via their portal with photos and descriptions.\n2️⃣ **Admin Dispatches** — Property managers assign work orders to contractors in one click.\n3️⃣ **Vendor Updates** — Contractors receive details and mark items as 'In Progress' or 'Completed' via temporary links.\n4️⃣ **Auto Alerts** — The system automatically alerts the resident upon resolution via SMS/email.`
      },
      {
        keywords: ['e-voting', 'cast vote', 'nestbloq voting', 'tamper-proof voting', 'voting audit', 'quorum tracking', 'community election', 'community voting', 'board resolution', 'board resolutions', 'sha-256 voting', 'online voting'],
        answer: `NestBloq provides a secure, legal-grade **E-Voting System**:\n\n• **Quorum Tracking** — Automatically computes quorum requirements based on community bylaws.\n• **SHA-256 Encryption** — Every vote is cryptographically sealed and logged to guarantee a tamper-proof, auditable trail.\n• **Online Assemblies** — Launch elections and board resolutions online. Residents receive instant notification to cast their votes safely.`
      },
      {
        keywords: ['amenity booking', 'amenity bookings', 'reserve amenity', 'book pool', 'book gym', 'book clubhouse', 'book tennis court', 'book facility', 'amenity scheduler', 'hoa pool', 'hoa gym'],
        answer: `The **Amenity Scheduler** makes facility bookings simple:\n\n• **Live Calendar** — Residents view real-time availability for pools, clubhouses, tennis courts, and gym slots.\n• **Double-Booking Protection** — Auto-locks slots to prevent race conditions.\n• **Custom Rules** — Admins set time limits, guest policies, and automated approval requirements per amenity.`
      },
      {
        keywords: ['bylaws', 'bylaw', 'bylaws ai', 'copilot ai', 'ai copilot', 'nestbloq bylaws', 'rulebook ai', 'rules ai', 'bylaws assistant'],
        answer: `The **Bylaws AI Copilot** is a 24/7 intelligent resident assistant:\n\n• **Automatic Answers** — Reads your community's official rulebooks, bylaws, and covenants to answer resident questions instantly (e.g., 'What are the gym hours?' or 'Are pitbulls allowed?').\n• **Reduced Admin Load** — Deflects up to 80% of repetitive daily email/phone queries, freeing up board members and managers.`
      },
      {
        keywords: ['nestbloq integration', 'nestbloq integrations', 'integrate with', 'quickbooks sync', 'twilio sms', 'zapier integration', 'nestbloq api', 'api integration'],
        answer: `NestBloq connects with your existing tech stack:\n\n• **Stripe & Plaid** — Automated online payments.\n• **Twilio** — Real-time SMS and WhatsApp alerts.\n• **QuickBooks** — Sync dues ledger with your bookkeeping.\n• **Zapier & Open REST API** — Connects NestBloq to over 5,000+ third-party tools and custom business systems.`
      },
      {
        keywords: ['financial report', 'financial reports', 'generate reports', 'nestbloq ledger', 'download ledger', 'export reports', 'balance sheet report', 'audit report'],
        answer: `NestBloq makes community audits quick and easy with **One-Click Exports**:\n\n• **Financial Statements** — Export income statements, balance sheets, and transaction history to PDF/Excel.\n• **Outstanding Balances** — Generate reports on unpaid dues, late fees, and active payment schedules.\n• **Activity Logs** — Export historical maintenance dispatches, audit trails, and member records.`
      },
      {
        keywords: ['violation', 'violations', 'bylaw infraction', 'community compliance', 'dispute violation', 'parking violation', 'trash violation', 'hoa violation', 'hoa warning', 'hoa fine', 'hoa compliance'],
        answer: `NestBloq simplifies **Violation Management & Compliance**:\n\n• **Logging** — Admins log violations (e.g. trash cans left out, parking rules) with photo evidence.\n• **Automatic Warnings** — The system automatically emails warning notices with fine schedules.\n• **Dispute Portal** — Gives residents a fair, structured 30-day window to file disputes or clarify issues directly with the board.`
      },
      {
        keywords: ['contact nestbloq', 'nestbloq support', 'nestbloq email', 'nestbloq phone', 'nestbloq contact', 'contact support', 'customer support', 'customer service', 'helpdesk', 'support team', 'nestbloq help', 'email support', 'phone support'],
        answer: `Our support team is here for you 24/7:\n\n• **Email** — support@nestbloq.com\n• **In-App Chat** — Available directly inside your dashboard.\n• **Phone Support** — Priority phone lines are dedicated to Enterprise tier subscribers.\n• **Documentation** — Access articles and setup guides at docs.nestbloq.com.`
      },
      {
        keywords: ['free trial', 'book demo', 'nestbloq demo', 'nestbloq trial', 'how to sign up', 'how to register', 'start trial', 'try nestbloq', 'sign up for nestbloq', 'nestbloq signup'],
        answer: `Getting started is entirely risk-free:\n\n• **14-Day Free Trial** — Full access to all features (no credit card required).\n• **Demo Setup** — Try out the platform instantly with pre-populated dummy communities and properties.\n• **Live Walkthrough** — Book a video demo with one of our onboarding specialists at contact@nestbloq.com.`
      },
      {
        keywords: ['who developed you', 'who built you', 'who created you', 'who is your developer', 'who founded you', 'who made you', 'who developed nestbloq', 'who founded nestbloq', 'who created nestbloq', 'crestcode', 'crestcode technology', 'tanuj', 'tongse'],
        answer: `NestBloq was founded and developed by **Crestcode Technology** to serve as a comprehensive operating system for community and property management. It was built to eliminate manual administrative friction, automate dues payments, track compliance, and establish direct channels of communication between property managers, board members, residents, and vendors.`
      },
      {
        keywords: ['nestbloq tech', 'nestbloq technology', 'nestbloq stack', 'tech stack', 'technology stack', 'what is nestbloq built with', 'what stack does nestbloq use', 'nestbloq codebase'],
        answer: `NestBloq leverages a state-of-the-art web and mobile technology stack:\n\n• **Frontend**: React.js structured with responsive Tailwind CSS & Vanilla CSS designs.\n• **Backend**: Python (FastAPI framework) engineered for security, high scalability, and fast execution.\n• **Database**: PostgreSQL with isolated schema containers for individual community security.\n• **Integrations**: Stripe API for online cards, Plaid for ACH linkups, Twilio for SMS alerts, and QuickBooks Sync.`
      },
      {
        keywords: ['where is nestbloq', 'nestbloq location', 'nestbloq office', 'nestbloq hq', 'nestbloq headquarters', 'nestbloq address', 'where are you located', 'where are you based', 'where is your office', 'where is your hq', 'where is your headquarters', 'headquarters', 'office address'],
        answer: `NestBloq is a cloud-based SaaS platform operated globally, with core product development spearheaded by **Crestcode Technology**. For inquiries or custom deployment options, you can connect with us directly at **contact@nestbloq.com**.`
      }
    ];

    let bestMatch = null;
    let maxScore = 0;
    
    for (const item of knowledgeBase) {
      let score = 0;
      for (const kw of item.keywords) {
        // Word-boundary check for each keyword
        const matched = kw.includes(' ')
          ? q.includes(kw)
          : new RegExp(`(?<![a-zA-Z0-9])${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-zA-Z0-9])`, 'i').test(q);
        
        if (matched) {
          score += kw.includes(' ') ? 3 : 1;
        }
      }
      if (score > maxScore) {
        maxScore = score;
        bestMatch = item;
      }
    }
    
    if (bestMatch && maxScore > 0) {
      return bestMatch.answer;
    }

    // ── ASYNC WIKIPEDIA PAGE SUMMARY LOOKUP ──────────────────
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
      } catch (e) {
        console.log("Wikipedia fetch error or timeout:", e);
      }
    }

    // ── SMART CHATGPT-LIKE FALLBACK ─────────────────────────
    const stopWords = ['what', 'is', 'the', 'a', 'an', 'of', 'to', 'how', 'do', 'you', 'can', 'tell', 'me', 'about', 'who', 'where', 'why', 'are', 'your', 'my', 'in', 'on', 'at', 'with', 'for', 'this', 'that', 'there', 'here', 'please', 'give', 'show', 'list', 'do', 'does', 'did', 'has', 'have', 'had', 'should', 'would', 'could', 'want', 'like'];
    const queryWords = q.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(w => !stopWords.includes(w) && w.length > 2);
    const mainTopic = queryWords.length > 0 ? queryWords.join(' ') : '';
    
    let fallbackText = '';
    if (mainTopic) {
      fallbackText = `I understand you are asking about **"${mainTopic}"**. While my core focus as NestBloq's AI Assistant is property management workflows and community bylaws, I'm happy to guide you! \n\nFor general topics like this, you can check our documentation or start your 14-day free trial to see how our platform handles these operations.`;
    } else {
      fallbackText = `Great question! As the NestBloq AI Assistant, I'm here to help you automate community management.`;
    }

    return `${fallbackText}\n\nTo keep things focused, let me know if you would like details on:\n• 💳 **Plans & Pricing** ($1.50 - $3.00/unit/month)\n• 👥 **Role Isolation** (Manager, Board, Resident, Vendor)\n• 🔧 **Kanban Repairs & Dues Automation**\n• 🤖 **Bylaws AI Copilots**`;
  };

  // ── SEND MESSAGE ────────────────────────────────────────────────────────────
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
      text: "Hello! 👋 I'm your NestBloq AI Assistant.\n\nAsk me anything about our plans, security, features, billing, or community management workflows!",
      time: 'Just now'
    }]);
    setIsTyping(false);
  };

  const handleChipClick = (question) => {
    setIsOpen(true);
    setShowWelcome(false);
    handleSend(question);
  };

  useEffect(() => {
    if (isOpen) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isOpen]);

  // Render bold **text** and newlines properly
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

      {/* ── CLOSED STATE ── */}
      {!isOpen && (
        <div className="flex flex-col items-end gap-2 mb-3 pointer-events-auto">
          <div className="hidden sm:flex flex-col items-end gap-2 pr-1 animate-fade-in-up">
            {floatingChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleChipClick(chip.q)}
                className="px-3.5 py-2 text-xs font-semibold bg-white dark:bg-[#11101d] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.08] hover:border-violet-500 hover:text-violet-500 dark:hover:text-violet-400 rounded-full shadow-lg shadow-black/[0.04] dark:shadow-black/[0.15] hover:shadow-violet-500/10 transition-all duration-300 hover:-translate-x-1 whitespace-nowrap"
              >
                {chip.label}
              </button>
            ))}
          </div>
          {showWelcome && (
            <div className="relative mt-2 p-4 bg-white dark:bg-[#11101d] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-xl max-w-[260px] animate-fade-in-up flex gap-3 items-start">
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
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">Welcome! 👋</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Ask me anything about NestBloq!</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CHAT PANEL ── */}
      {isOpen && (
        <div className="w-[360px] max-w-[95vw] h-[540px] max-h-[85vh] bg-white dark:bg-[#11101d] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xl flex flex-col overflow-hidden animate-fade-in-up mb-4 transition-colors duration-200">

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
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/30 dark:bg-[#090812]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'ml-auto flex-row-reverse max-w-[85%]' : 'max-w-[92%]'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white'
                    : 'bg-white dark:bg-white/[0.04] text-violet-400 border border-slate-100 dark:border-white/[0.06]'
                }`}>
                  {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className="space-y-1 min-w-0">
                  <div className={`p-3 rounded-2xl shadow-sm text-xs leading-relaxed ${
                    msg.sender === 'user'
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
            className="p-3 bg-white dark:bg-[#11101d] border-t border-slate-100 dark:border-white/[0.04] flex items-center gap-2 shrink-0"
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
