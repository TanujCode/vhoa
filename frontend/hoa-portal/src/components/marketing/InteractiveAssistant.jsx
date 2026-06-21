import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Sparkles, MessageSquare, X, RotateCcw } from 'lucide-react';

export default function InteractiveAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! 👋 I'm your NestBloq AI Assistant.\n\nAsk me anything — NestBloq plans, security, features, billing, or just have a conversation in Hindi or English!",
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
  const generateResponse = (text) => {
    const q = text.toLowerCase().trim();

    // Word-boundary safe match: won't match 'hi' inside 'this' or 'hoa' inside 'shoal'
    const w = (...terms) => terms.some(term => {
      if (term.includes(' ')) return q.includes(term);
      // Use lookbehind/lookahead to ensure whole-word match
      try {
        return new RegExp(`(?<![a-zA-Z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-zA-Z0-9])`, 'i').test(q);
      } catch { return q.includes(term); }
    });

    // Hinglish detection — only strong Hindi-exclusive tokens
    const H = ['kya', 'hai', 'hain', 'kaise', 'kese', 'batao', 'bata', 'bhai',
      'aap', 'tum', 'mujhe', 'kaun', 'kyun', 'kab', 'kahan', 'kitna', 'kitne',
      'chahiye', 'nahi', 'nhi', 'yaar', 'yrr', 'matlab', 'toh', 'woh', 'mera',
      'meri', 'apna', 'humara', 'kuch', 'bahut', 'bilkul', 'zaroor', 'hoga',
      'milega', 'karega', 'paisa', 'paise', 'rupay', 'hoon', 'poochh', 'are',
      'arre', 'sunao', 'bolo', 'chalo', 'shukriya', 'dhanyawad', 'theek', 'acha',
      'accha', 'badhiya', 'samjha', 'jaanna'];
    const hi = H.some(t => {
      try {
        return new RegExp(`(?<![a-zA-Z0-9])${t}(?![a-zA-Z0-9])`, 'i').test(q);
      } catch { return q.includes(t); }
    });

    // ── 1. WHAT IS NESTBLOQ (most common question, check FIRST) ────────────
    if (
      (q.includes('nestbloq') && (w('kya', 'what', 'batao', 'bata', 'explain', 'kaun', 'about', 'hai', 'he'))) ||
      w('what is nestbloq', 'nestbloq kya hai', 'nestbloq kya he', 'nestbloq kya h',
        'nestbloq ke baare', 'about nestbloq', 'nestbloq kya karta', 'nestbloq platform',
        'nestbloq kya hota', 'nestbloq software', 'nestbloq product', 'tell me about nestbloq',
        'nestbloq kaise kaam', 'nestbloq app kya', 'nestbloq ka kaam')
    ) {
      return hi
        ? `**NestBloq** ek all-in-one **community management SaaS platform** hai! 🏘️\n\nIsme ye powerful features hain:\n\n🏠 **Dues Collection** — Automated billing, ACH & card payments\n🔧 **Maintenance Kanban** — Work orders & contractor dispatch\n🗳️ **E-Voting** — SHA-256 secure online resolutions & elections\n🤖 **Bylaws AI Copilot** — 24/7 resident query auto-answers\n📅 **Amenity Booking** — Pool, gym, clubhouse real-time booking\n📊 **Financial Ledger** — Auto accounting & reports\n\n✅ **HOAs, Apartments, Condos, Rentals** — sab ke liye built!\n\nKisi specific feature ke baare me jaanna hai?`
        : `**NestBloq** is a modern all-in-one **community management platform**! 🏘️\n\nIt brings together everything a property community needs:\n\n🏠 **Dues Collection** — Automated billing via ACH & card\n🔧 **Maintenance Kanban** — Work orders & contractor dispatch\n🗳️ **E-Voting** — SHA-256 secure online voting & resolutions\n🤖 **Bylaws AI Copilot** — 24/7 automated resident Q&A\n📅 **Amenity Booking** — Real-time pool, gym & clubhouse booking\n📊 **Financial Ledger** — Auto accounting & reporting\n\n✅ Built for **HOAs, Apartments, Condos & Rental** communities.\n\nWant to know more about any feature?`;
    }

    // ── 2. SUBSCRIPTION RENEWAL + CREDITS ──────────────────────────────────
    if (
      w('subscription renew', 'renew honga', 'renew honge', 'renew hogi', 'credit renew',
        'credits renew', 'credit bhi renew', 'credit milenge', 'subscription renewal',
        'plan renew', 'auto renew', 'automatic renewal', 'renew karenge', 'renew ho jayega')
    ) {
      return hi
        ? `Haan bilkul! 🎉\n\nJab aapka **subscription renew** hota hai:\n\n✅ Saare **credits automatically reset** ho jaate hain\n✅ Naya billing cycle start ho jaata hai\n✅ Invoice aapki email par aa jaati hai\n✅ Stripe se secure payment process hoti hai\n\n💡 Status check karo: **Dashboard → Settings → Billing**\n\nKoi aur sawaal?`
        : `Yes, absolutely! 🎉\n\nWhen your **subscription renews**:\n\n✅ All **credits reset automatically** with the new cycle\n✅ Secure payment processed via Stripe\n✅ Invoice emailed to your registered address\n\nTrack everything at **Dashboard → Settings → Billing**.`;
    }

    // ── 3. SUBSCRIPTION / BILLING (general) ────────────────────────────────
    if (w('subscription', 'billing', 'invoice', 'billing cycle') && !w('credit')) {
      return hi
        ? `NestBloq subscriptions **monthly ya yearly** renew hoti hain. 💳\n\nPlans:\n• **Basic**: $1.50/unit/month\n• **Pro**: $3.00/unit/month\n• **Enterprise**: Custom pricing\n\n✅ Har renewal par credits auto-reset hote hain\n✅ Stripe se 100% secure payment\n\nDetails: **Dashboard → Settings → Billing**`
        : `NestBloq subscriptions renew **monthly or annually**. 💳\n\nPlans:\n• **Basic**: $1.50/unit/month\n• **Pro**: $3.00/unit/month\n• **Enterprise**: Custom pricing\n\n✅ Credits auto-refresh every renewal\n✅ Secure via Stripe\n\nManage at **Dashboard → Settings → Billing**.`;
    }

    // ── 4. CREDITS ──────────────────────────────────────────────────────────
    if (w('credit', 'credits') && !w('credit card')) {
      return hi
        ? `NestBloq **credits** aapke plan ke usage ke liye hote hain — AI queries, SMS notifications, etc. 🔄\n\nSubscription renew hone par credits **automatically reset** ho jaate hain.\n\nAgar credits jaldi khatam ho rahe hain, toh **Dashboard se top-up** bhi kar sakte hain!`
        : `NestBloq **credits** power your platform usage — AI queries, SMS alerts, etc. 🔄\n\nThey **automatically reset** with every subscription renewal.\n\nRunning low? Top up anytime from your **Dashboard**.`;
    }

    // ── 5. PRICING / PLANS ──────────────────────────────────────────────────
    if (w('plan', 'price', 'pricing', 'cost', 'package', 'how much', 'charges',
        'kitna', 'per unit', 'annual plan', 'free trial', 'rupay', 'dollar', 'inr')) {
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
    if (w('get started', 'how to start', 'kaise shuru', 'book demo', 'sign up', 'signup',
        'onboard', 'create account', 'free account', 'register', 'start free',
        'shuru kaise', 'kaise use kare', 'trial shuru')) {
      return presetQuestions[3].a;
    }

    // ── 9. MAINTENANCE ──────────────────────────────────────────────────────
    if (w('maintenance', 'repair', 'leak', 'plumbing', 'work order', 'kanban',
        'contractor', 'dispatch', 'complain', 'complaint', 'breakdown')) {
      return hi
        ? `NestBloq me powerful **Kanban Maintenance Board** hai! 🔧\n\n• Residents complaints photo ke saath log karte hain\n• Managers directly contractors dispatch karte hain\n• Automatic SMS updates milti hain\n• Real-time status tracking hoti hai\n\nSab kuch ek hi dashboard me — zero manual coordination!`
        : `NestBloq has a smart **Kanban Maintenance Board**! 🔧\n\n• Residents submit issues with photos & notes\n• Managers dispatch contractors in one click\n• Residents get automatic SMS status updates\n• Real-time progress tracking\n\nAll from one dashboard — zero manual coordination!`;
    }

    // ── 10. AMENITIES ───────────────────────────────────────────────────────
    if (w('amenity', 'amenities', 'pool', 'gym', 'clubhouse', 'book amenity',
        'facility booking', 'reserve facility', 'court booking', 'hall booking')) {
      return hi
        ? `NestBloq me residents **real-time amenities book** kar sakte hain! 🏊\n\n• Pool, gym, clubhouse, banquet hall — sab online\n• Double-booking automatically blocked hoti hai\n• Instant confirmation notification milti hai\n• Live availability calendar dikhta hai`
        : `NestBloq lets residents **book amenities in real-time**! 🏊\n\n• Pool, gym, clubhouse, banquet halls — all online\n• Automatic double-booking prevention\n• Instant booking confirmation\n• Live availability calendar`;
    }

    // ── 11. VOTING / MEETINGS ───────────────────────────────────────────────
    if (w('vote', 'voting', 'election', 'meeting', 'assembly', 'quorum', 'resolution', 'ballot')) {
      return hi
        ? `NestBloq ka **E-Voting system** poori tarah secure hai! 🗳️\n\n• Har vote **SHA-256 cryptographic audit trail** se protected\n• Online general assemblies easily organize hoti hain\n• Automatic quorum tracking\n• Meeting minutes auto-generate hote hain\n• Legal-grade tamper-proof records`
        : `NestBloq's **E-Voting system** is secure & fully auditable! 🗳️\n\n• Every vote has a **SHA-256 cryptographic audit trail**\n• Run online general assemblies easily\n• Automatic quorum tracking\n• Auto-generated meeting minutes\n• Legal-grade tamper-proof records`;
    }

    // ── 12. DUES / PAYMENTS ─────────────────────────────────────────────────
    if (w('dues', 'payment', 'collect payment', 'ach payment', 'plaid', 'outstanding balance',
        'ledger', 'pending payment', 'rent collection', 'hoa fee', 'maintenance fee')) {
      return hi
        ? `NestBloq dues collection **poori tarah automatic** hai! 💳\n\n• Residents bank account Plaid se securely connect karte hain\n• Credit card ya ACH — dono options available hain\n• Outstanding balances auto-track hoti hain\n• Late payment reminders automatically jaate hain\n• Digital ledger entries auto-generate hoti hain`
        : `NestBloq makes dues collection **100% automated**! 💳\n\n• Residents securely connect bank via **Plaid**\n• Pay by credit card or ACH bank transfer\n• Outstanding balances auto-tracked\n• Automatic late payment reminders\n• Digital ledger entries generated instantly`;
    }

    // ── 13. INTEGRATIONS ────────────────────────────────────────────────────
    if (w('integration', 'integrate', 'zapier', 'quickbooks', 'twilio', 'open api',
        'rest api', 'third party', 'connect with', 'api access')) {
      return `NestBloq integrates with your favorite tools! 🔗\n\n• **Stripe & Plaid** — Secure payment processing\n• **Twilio** — SMS & WhatsApp notifications\n• **QuickBooks** — Accounting sync\n• **Zapier** — 5,000+ app connections\n• **Open REST API** — Custom integrations\n\nAll available on Pro & Enterprise plans.`;
    }

    // ── 14. PROPERTY TYPES ──────────────────────────────────────────────────
    if (
      (w('hoa') && !q.includes('nestbloq kya')) ||
      w('homeowner association', 'apartment complex', 'condominium', 'condo association',
        'rental property', 'community type', 'property type', 'residential community')
    ) {
      return `NestBloq is purpose-built for **all community types**! 🏘️\n\n• **HOA** — Homeowner Association management\n• **Apartments** — Multi-unit residential buildings\n• **Condos** — Condominium association tools\n• **Rentals** — Rental portfolio management\n\nEach module is tailored to the workflows of that community type!`;
    }

    // ── 15. IDENTITY ────────────────────────────────────────────────────────
    if (
      w('who are you', 'what are you', 'your name', 'tum kaun', 'kaun ho', 'kon ho', 'naam kya') ||
      (w('naam') && q.split(' ').length <= 5)
    ) {
      return hi
        ? `Main hoon **NestBloq AI Assistant** — aapka smart community guide! 🤖✨\n\nMujhse poochh sakte ho:\n• NestBloq plans & pricing\n• Security & data protection\n• Bylaws AI, e-voting, maintenance\n• Billing, credits & subscriptions\n• Ya koi bhi sawaal!\n\nKya jaanna chahte ho? 😊`
        : `I'm the **NestBloq AI Assistant** — your intelligent community management guide! 🤖✨\n\nI can help with:\n• NestBloq plans & pricing\n• Security & compliance\n• Bylaws AI, e-voting, maintenance\n• Billing, credits & subscriptions\n• General questions too!\n\nWhat would you like to know? 😊`;
    }

    // ── 16. HOW ARE YOU ─────────────────────────────────────────────────────
    if (
      w('how are you', "how's it going", 'how is it going', 'kya hal', 'kya haal',
        'kese ho', 'kaise ho', 'kaisa hai', 'sab theek', 'kya chal raha') ||
      q === 'sup' || q === 'wassup' || q === 'kya hal' || q === 'kese ho'
    ) {
      return hi
        ? `Main bilkul badhiya hoon, shukriya bhai! 😊 Aap sunao kaise hain?\n\nNestBloq ke plans, features, ya kuch bhi poochhna ho — main yahan hoon! 🚀`
        : `I'm doing great, thank you for asking! 😊 How about you?\n\nFeel free to ask me anything — about NestBloq or just for a chat!`;
    }

    // ── 17. GREETINGS (ONLY when message IS the greeting — not embedded) ────
    const greetPatterns = ['hi', 'hello', 'hey', 'yo', 'namaste', 'namaskar', 'hola',
      'howdy', 'hii', 'hiii', 'hiiii', 'heyyy', 'hello there', 'hey there'];
    const isJustGreeting = greetPatterns.some(g =>
      q === g || q.startsWith(g + ' ') || q.startsWith(g + ',') || q.startsWith(g + '!')
    );
    if (isJustGreeting) {
      return hi
        ? `Namaste! 🙏 Main NestBloq AI Assistant hoon.\n\nAap mujhse kuch bhi poochh sakte hain — plans, features, security, billing, ya bas aise baat karo! 😊`
        : `Hello there! 👋 I'm your NestBloq AI Assistant.\n\nAsk me anything — NestBloq plans, features, security, billing, or just have a chat! What's on your mind?`;
    }

    // ── 18. CAPABILITIES ────────────────────────────────────────────────────
    if (w('what can you do', 'help me', 'kya kar sakte', 'capabilities', 'kaise help', 'madad karo')) {
      return hi
        ? `Main aapki in baaton me madad kar sakta hoon! 🚀\n\n🏷️ **NestBloq Plans & Pricing**\n🔐 **Security & Privacy**\n🤖 **Bylaws AI Copilot**\n💳 **Billing & Subscription Renewal**\n🔧 **Maintenance & Work Orders**\n📅 **Amenity Booking**\n🗳️ **E-Voting & Meetings**\n💬 **General baat-cheet bhi!**\n\nKya jaanna chahte ho?`
        : `Here's what I can help with! 🚀\n\n🏷️ **NestBloq Plans & Pricing**\n🔐 **Security & Privacy**\n🤖 **Bylaws AI Copilot**\n💳 **Billing & Credits**\n🔧 **Maintenance & Work Orders**\n📅 **Amenity Booking**\n🗳️ **E-Voting & Meetings**\n💬 **General chat too!**\n\nWhat would you like to explore?`;
    }

    // ── 19. THANKS ──────────────────────────────────────────────────────────
    if (w('thank', 'thanks', 'shukriya', 'dhanyawad', 'tysm', 'helpful', 'great answer', 'bahut accha')) {
      return hi
        ? `Arre koi baat nahi yaar! 😊 Khushi hui madad karke!\n\nNestBloq ke baare me aur kuch jaanna ho toh zaroor batao! 🚀`
        : `You're very welcome! 😊 Happy to help!\n\nFeel free to ask anything else about NestBloq anytime!`;
    }

    // ── 20. JOKES ───────────────────────────────────────────────────────────
    if (w('joke', 'funny', 'laugh', 'hasao', 'comedy', 'mazak')) {
      const jokes = [
        `Why did the property manager carry a ladder? 🪜\nBecause the **rent was going up!** 😄\n\nWith NestBloq, at least the management part is stress-free!`,
        `Why do HOA managers love NestBloq?\nBecause it finally **fixes the "no response" bug** in community life! 😄`,
        `Resident: "Maintenance request se 3 din ho gaye, koi response nahi!"\nNestBloq user: "Mera toh 2 ghante me ho gaya!" 😂`
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }

    // ── 21. TIME / DATE ─────────────────────────────────────────────────────
    if (w('current time', 'what time', 'abhi time', 'what day', 'today date', 'aaj kya') ||
        q === 'time' || q === 'date' || q === 'aaj' || q === 'what is the time') {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      return hi
        ? `Abhi ka time: **${timeStr}** ⏰\nAaj ki date: **${dateStr}**\n\nAur NestBloq ke baare me kuch poochhna ho toh main hazir hoon! 😊`
        : `Current time: **${timeStr}** ⏰\nToday: **${dateStr}**\n\nAnything else I can help you with?`;
    }

    // ── 22. WEATHER ─────────────────────────────────────────────────────────
    if (w('weather', 'mausam', 'temperature', 'barish', 'garmi', 'sardi', 'sunny', 'rain today')) {
      return hi
        ? `Yaar, mujhe real-time weather access nahi hai (main internet se connected nahi hoon)! ☀️\n\nGoogle ya weather.com par check karo!\n\nHaan, NestBloq me outdoor amenity booking hai — pool & park real-time book kar sakte ho! 🌤️`
        : `I don't have real-time weather data (I'm not connected to the internet). Check Google or weather.com! ☀️\n\nFun fact: NestBloq's amenity booking lets residents book outdoor spaces like pools & parks in real-time!`;
    }

    // ── 23. MATH ────────────────────────────────────────────────────────────
    if (/\d+\s*[\+\-\*\/]\s*\d+/.test(q)) {
      try {
        const sanitized = q.replace(/[^0-9+\-*/().\s]/g, '').trim();
        const result = Function(`"use strict"; return (${sanitized})`)();
        if (!isNaN(result) && isFinite(result)) {
          return hi
            ? `**${text.trim()}** = **${result}** 🧮\n\nBy the way — NestBloq ka ROI Calculator bhi hai, dekho kitna time & paisa bachega! 💰`
            : `**${text.trim()}** = **${result}** 🧮\n\nSpeaking of numbers — NestBloq's ROI Calculator shows how much time & money your community saves!`;
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
        'customer service', 'madad chahiye', 'helpdesk', 'customer support')) {
      return hi
        ? `NestBloq Support **24/7 available** hai! 📞\n\n• **Email**: support@nestbloq.com\n• **Live Chat**: Dashboard me available\n• **Phone**: Enterprise customers ke liye dedicated\n• **Docs**: docs.nestbloq.com\n\nKoi bhi problem — hum hamesha yahan hain!`
        : `NestBloq support is **available 24/7**! 📞\n\n• **Email**: support@nestbloq.com\n• **Live Chat**: In-dashboard support\n• **Phone**: Dedicated for Enterprise customers\n• **Docs**: docs.nestbloq.com\n\nWe're always here to help!`;
    }

    // ── 26. ROI / SAVINGS ───────────────────────────────────────────────────
    if (w('roi', 'savings', 'save money', 'save time', 'worth it', 'kitna bachega', 'fayda', 'benefit')) {
      return hi
        ? `NestBloq se communities average me:\n\n💰 **80% less admin time**\n💰 **$500+/month saved** vs manual processes\n💰 **Near-zero late dues** with auto-reminders\n\n**ROI Calculator** check karo — khud calculate karo kitna bachega! 📊`
        : `Communities on NestBloq typically see:\n\n💰 **80% reduction** in admin time\n💰 **$500+/month saved** vs manual methods\n💰 **Near-zero late dues** with auto-reminders\n\nTry our **ROI Calculator** to see your projected savings! 📊`;
    }

    // ── 27. TECHNOLOGY ──────────────────────────────────────────────────────
    if (w('cloud', 'saas', 'mobile app', 'android', 'ios app', 'web app', 'browser support',
        'offline mode', 'technology')) {
      return hi
        ? `NestBloq ek modern **cloud-based SaaS platform** hai! 📱💻\n\n• Kisi bhi web browser me kaam karta hai\n• **Android & iOS** native apps available\n• Real-time sync across all devices\n• 99.9% uptime guarantee`
        : `NestBloq is a modern **cloud-based SaaS platform**! 📱💻\n\n• Works in any web browser\n• **Android & iOS** native apps\n• Real-time data sync\n• 99.9% uptime guarantee`;
    }

    // ── 28. DEMO / TRIAL ────────────────────────────────────────────────────
    if (w('demo', 'free trial', 'try nestbloq', 'test nestbloq', 'trial period', 'evaluation')) {
      return hi
        ? `NestBloq ka **14-day free trial** available hai — koi credit card nahi chahiye! 🎉\n\nYa aap ek **live demo** book kar sakte ho jisme hamari team aapko personally walkthrough degi.\n\n👉 Top navbar me **"Get Started"** ya **"Book a Demo"** click karo!`
        : `NestBloq offers a **14-day free trial** — no credit card required! 🎉\n\nOr book a **live demo** where our team personally walks you through the platform.\n\n👉 Click **"Get Started"** or **"Book a Demo"** in the top navbar!`;
    }

    // ── SMART FALLBACK — always helpful, never dismissive ───────────────────
    const hiFallback = [
      `"${text}" — interesting sawaal! 😊\n\nMain NestBloq ke baare me expert hoon. Ye topics pe poochho:\n• 💳 Plans & Pricing\n• 🔐 Security\n• 🤖 Bylaws AI features\n• 💰 Billing & Credits renewal\n• 🔧 Maintenance & Amenities\n\nKya specifically jaanna hai?`,
      `Aapka sawaal samjha! Main NestBloq ka AI Guide hoon. 🏘️\n\nNestBloq platform ke kisi bhi feature ke baare me poochho — pricing, security, demo, ya features — poori detail dunga!\n\nKya jaanna chahte ho?`,
      `"${text}" ke baare me! 😊 Main NestBloq me specialist hoon — platform features, plans, security, billing — sab poochho, poora jawab dunga! Kya specific chahiye?`
    ];
    const enFallback = [
      `"${text}" — great question! I'm NestBloq's AI guide. Ask me about:\n\n• 💳 Plans & Pricing\n• 🔐 Security & compliance\n• 🤖 Bylaws AI features\n• 💰 Billing & credits\n• 🔧 Maintenance & amenities\n\nWhat would you like to know? 😊`,
      `Interesting! I specialize in NestBloq — ask me about pricing, security, AI features, e-voting, amenity booking, or getting started. I'll give you full details! 🏘️`,
      `I'm NestBloq's expert assistant! Ask about any platform feature and I'll walk you through it in detail. What would you like to explore? 🚀`
    ];
    return hi
      ? hiFallback[Math.floor(Math.random() * hiFallback.length)]
      : enFallback[Math.floor(Math.random() * enFallback.length)];
  };

  // ── SEND MESSAGE ────────────────────────────────────────────────────────────
  const handleSend = (text) => {
    if (!text.trim() || isTyping) return;
    setMessages(prev => [...prev, { sender: 'user', text, time: 'Just now' }]);
    setInputValue('');
    setIsTyping(true);
    setTimeout(() => {
      const resp = generateResponse(text);
      setMessages(prev => [...prev, { sender: 'ai', text: resp, time: 'Just now' }]);
      setIsTyping(false);
    }, 800 + Math.random() * 600);
  };

  const handleReset = () => {
    setMessages([{
      sender: 'ai',
      text: "Hello! 👋 I'm your NestBloq AI Assistant.\n\nAsk me anything — NestBloq plans, security, features, billing, or just have a conversation in Hindi or English!",
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
                <p className="text-[10px] text-white/80 font-medium">Ask me anything • Hindi & English</p>
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
              placeholder="Ask anything in Hindi or English..."
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
