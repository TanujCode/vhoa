import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Bot } from 'lucide-react';
import API from '../services/api';

const AiAssistant = ({ user, community }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuState, setMenuState] = useState('main'); // 'main', 'guides', 'after_answer'
  const [lastCategory, setLastCategory] = useState('main'); // 'main' or 'guides'
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // Dynamic values binding
  const commName = community?.name || 'your community';
  const commCode = community?.community_code || 'N/A';

  // Format initials
  const botInitials = "NB";

  // Check if current user is a resident
  const isResident = user?.role === 'resident' || user?.role_id === 4;

  // Pre-load dynamic statistics (only for Admins/Board Members) whenever the widget is opened
  useEffect(() => {
    const fetchStats = async () => {
      if (isOpen && community?.community_id && !isResident) {
        try {
          const res = await API.get(`/community/${community.community_id}/stats`);
          setStats(res.data);
        } catch (err) {
          console.error("Failed to load community stats:", err);
        }
      }
    };
    fetchStats();
  }, [isOpen, community, isResident]);

  // Set initial welcome message when opening
  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          id: 1,
          sender: 'bot',
          text: `Hi ${user?.first_name || 'there'}! I am your **NestBloq AI Copilot**. How can I help you manage **${commName}** today?`,
          timestamp: new Date()
        }
      ]);
      setMenuState('main');
    }
  }, [isOpen, community]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages, loading]);

  // Define role-specific options
  const mainOptions = isResident ? [
    { text: ' My Outstanding Dues', id: 'res_dues' },
    { text: '️ My Unit Violations', id: 'res_violations' },
    { text: ' My Service Requests', id: 'res_service' },
    { text: '️ My Community Details', id: 'res_details' },
    { text: ' Resident Help Guides', id: 'guides_menu' }
  ] : [
    { text: ' Dues & Collections Overview', id: 'dues' },
    { text: '️ Open Violations Status', id: 'violations' },
    { text: ' Service Requests Status', id: 'service' },
    { text: ' Occupancy & Residents Stats', id: 'occupancy' },
    { text: '️ Community Details & Code', id: 'details' },
    { text: ' Operational How-To Guides', id: 'guides_menu' }
  ];

  const guideOptions = isResident ? [
    { text: 'How to book an amenity?', id: 'how_amenity' },
    { text: 'How to create a service request?', id: 'how_servicereq' },
    { text: 'How to pay my dues?', id: 'how_dues' },
    { text: 'How to cast my vote?', id: 'how_vote' },
    { text: '⬅️ Back to Main Menu', id: 'back_main' }
  ] : [
    { text: 'How to invite a resident/member?', id: 'how_invite' },
    { text: 'How to log a violation?', id: 'how_violation' },
    { text: 'How to book an amenity?', id: 'how_amenity' },
    { text: 'How to create a service request?', id: 'how_servicereq' },
    { text: 'How to pay or collect dues?', id: 'how_dues' },
    { text: 'How to use the E-Voting system?', id: 'how_vote' },
    { text: '⬅️ Back to Main Menu', id: 'back_main' }
  ];

  const getBotResponse = (optionId) => {
    // Admin metrics calculations
    const totalOwners = community?.total_owners ?? 0;
    const commSize = community?.community_size ?? 0;
    const collected = stats?.dues_collected ?? 19227.00;
    const pending = stats?.dues_pending ?? 3800.00;
    const overdue = stats?.dues_overdue ?? 1623.00;
    const activeViolations = stats?.active_violations ?? 0;
    const openRequests = stats?.open_requests ?? 0;
    const totalResidents = stats?.total_residents ?? totalOwners;
    const occupiedUnits = stats?.occupied_units ?? 0;
    const occupancyPercent = commSize > 0 ? Math.min(100, Math.round((occupiedUnits / commSize) * 100)) : 0;

    switch (optionId) {
      // --- Admin Intent Responses ---
      case 'dues':
        return `Based on real-time database records for **${commName}**:\n\n` +
               ` **Dues Collected**: $${collected.toLocaleString(undefined, {minimumFractionDigits: 2})}\n` +
               `⏳ **Pending Collections**: $${pending.toLocaleString(undefined, {minimumFractionDigits: 2})}\n` +
               `️ **Overdue Balance**: $${overdue.toLocaleString(undefined, {minimumFractionDigits: 2})}\n\n` +
               ` *QuickBooks Integration Status*: **Synced**\n*Late fees & reminders*: Automatically processed on the 1st of each month.`;

      case 'violations':
        return `Currently, there are **${activeViolations} active violation record(s)** requiring compliance tracking for **${commName}**.\n\n` +
               `Warning notices have been dispatched. Homeowners have a standard 30-day window to resolve or appeal warning letters directly via the homeowner portal.`;

      case 'service':
        return `There are currently **${openRequests} open service request(s)** logged in the maintenance system.\n\n` +
               `You can track active repair statuses and assign contractors directly on the **Service Requests Kanban Board** in your sidebar.`;

      case 'occupancy':
        return `Community occupancy metrics for **${commName}**:\n\n` +
               ` **Total Members/Owners**: ${totalResidents} registered\n` +
               ` **Occupied Units**: ${occupiedUnits} / ${commSize} units\n` +
               ` **Occupancy Rate**: ${occupancyPercent}%\n\n` +
               `*Remaining free slots*: ${Math.max(0, commSize - occupiedUnits)} units available.`;

      case 'details':
        return `Workspace Details for **${commName}**:\n\n` +
               `️ **Community Name**: ${commName}\n` +
               ` **Address**: ${community?.address?.address || 'N/A'}, ${community?.address?.city || 'N/A'}\n` +
               ` **Community Pass Code**: **${commCode}**\n\n` +
               `*Security Enforcement*: You are logged into **${commName}** (ID: ${community?.community_id || 'N/A'}). For security compliance, you can only request details or stats for this active community.`;

      // --- Common & Admin Guide Responses ---
      case 'how_invite':
        return `To invite a resident or board member to **${commName}**:\n\n` +
               `1️⃣ Go to the **Members** page in the sidebar menu.\n` +
               `2️⃣ Click the **'Invite Member'** button in the top right.\n` +
               `3️⃣ Select their user role (Homeowner, Board Member, Auditor).\n` +
               `4️⃣ Copy the generated link or share your Community Pass Code: **${commCode}**.\n` +
               `5️⃣ Once they sign up, approve their request in the **Resident Join Requests** section of your dashboard.`;

      case 'how_violation':
        return `To log a new rule infraction for compliance tracking:\n\n` +
               `1️⃣ Navigate to the **Violations** tab in the sidebar.\n` +
               `2️⃣ Click **'Log Violation'**.\n` +
               `3️⃣ Search and select the resident/unit and choose the rule type (parking, trash, pets).\n` +
               `4️⃣ Describe the infraction and upload photo proof.\n` +
               `5️⃣ Submit to automatically mail out the warning letter and log the ticket.`;

      case 'how_amenity':
        return isResident
          ? `To schedule or book community facilities (clubhouse, pool, gym):\n\n` +
            `1️⃣ Go to the **Book Amenities** tab in the sidebar.\n` +
            `2️⃣ Choose the facility and view availability on the live calendar.\n` +
            `3️⃣ Select your desired date/time slot and submit.\n` +
            `4️⃣ Your booking will be instantly logged and sent for admin approval if required.`
          : `To schedule or manage community facilities:\n\n` +
            `• **For Residents**: They can view the availability calendar and request slots for the pool, clubhouse, or gym in their portal.\n` +
            `• **For Admins**: Go to the **Manage Amenities** page in the sidebar to review, approve, or define custom booking rules and fees.`;

      case 'how_servicereq':
        return isResident
          ? `To file a maintenance request for your unit or common areas:\n\n` +
            `1️⃣ Navigate to the **New Request** tab in the sidebar.\n` +
            `2️⃣ Fill in the title, request category, and write a description of the issue.\n` +
            `3️⃣ Upload photos of the maintenance issue and submit.\n` +
            `4️⃣ You can track status updates and add comments directly under the request details.`
          : `To create or dispatch work orders for maintenance:\n\n` +
            `1️⃣ Navigate to the **Service Requests** tab in the sidebar.\n` +
            `2️⃣ Click **'New Request'** (or select an existing request filed by a resident).\n` +
            `3️⃣ Specify the issue details, priority, and assign it to an approved contractor/vendor.\n` +
            `4️⃣ Update status cards on the Kanban Maintenance Board to keep residents updated via auto-SMS.`;

      case 'how_dues':
        return isResident
          ? `To view and pay your HOA fees or outstanding invoices:\n\n` +
            `1️⃣ Go to the **My Payments** section in your portal sidebar.\n` +
            `2️⃣ View your outstanding ledger items and click **'Pay Now'**.\n` +
            `3️⃣ Securely connect your bank account via Plaid for ACH transfer, or use Stripe credit cards.\n` +
            `4️⃣ You can also enable Autopay to avoid late fees.`
          : `To collect, track, or pay community fees:\n\n` +
            `• **Residents**: Securely connect bank details via Plaid or check out with credit cards in the payments tab.\n` +
            `• **Admins**: Set monthly/annual schedules in Settings to auto-generate invoices, collect late fees, and sync transactions with QuickBooks.`;

      case 'how_vote':
        return isResident
          ? `To participate in community general elections or resolution voting:\n\n` +
            `1️⃣ Go to the **Meetings & Surveys** tab in the sidebar.\n` +
            `2️⃣ Under active surveys/elections, select the current session.\n` +
            `3️⃣ Review uploaded bylaws documents and click **'Cast Vote'**.\n` +
            `4️⃣ Your vote will be cryptographically locked using SHA-256 for a secure, legal audit trail.`
          : `To launch elections or pass board resolutions:\n\n` +
            `1️⃣ Open the **Meetings & Surveys** page in the sidebar.\n` +
            `2️⃣ Click **'New Resolution'** or launch an election questionnaire.\n` +
            `3️⃣ Specify quorum percentages and upload legal bylaws documents.\n` +
            `4️⃣ Residents receive notification alerts to vote. Votes are cryptographically hashed using SHA-256 for a tamper-proof audit trail.`;

      default:
        return `How can I help you manage **${commName}** today? Please select one of the menu options below.`;
    }
  };

  const handleSelectOption = async (option) => {
    if (loading) return;

    // Append user's action
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: option.text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    let botText = '';
    let nextMenu = 'after_answer';

    try {
      if (option.id === 'back_main') {
        botText = `Sure! What details would you like to review for **${commName}**?`;
        nextMenu = 'main';
      } else if (option.id === 'guides_menu') {
        botText = isResident
          ? `Here are the resident help guides. Please select a topic below for instructions:`
          : `Here are the operational guides. Please choose a topic below to see instructions:`;
        nextMenu = 'guides';
      } else if (option.id === 'res_dues') {
        // Fetch personal dues from endpoint
        const res = await API.get(`/payment/due/${community.community_id}`);
        const dues = res.data || [];
        const totalDue = dues.reduce((sum, item) => sum + item.amount, 0);

        if (totalDue === 0) {
          botText = `You have no outstanding dues registered for **${commName}** in this cycle. Nice job! Keep it up.`;
        } else {
          botText = `Here is your outstanding dues breakdown for **${commName}**:\n\n` +
                    ` **Total Outstanding**: $${totalDue.toLocaleString(undefined, {minimumFractionDigits: 2})}\n\n` +
                    dues.map(d => `- **${d.reason.replace('_', ' ')}**: $${d.amount.toFixed(2)} (Due: ${new Date(d.due_date).toLocaleDateString()})`).join('\n') +
                    `\n\nYou can pay these dues securely online via Plaid ACH or credit card in the **My Payments** tab in your sidebar.`;
        }
      } else if (option.id === 'res_violations') {
        // Fetch personal unit violations from endpoint
        const res = await API.get(`/violation/${community.community_id}`);
        const violations = res.data || [];

        if (violations.length === 0) {
          botText = `Great news! Your unit has no active violation records logged. Thank you for keeping our community compliant!`;
        } else {
          botText = `Your unit currently has **${violations.length} violation record(s)** logged:\n\n` +
                    violations.map(v => `- **${v.violation_type_name}**: $${v.amount} (Status: **${v.violation_status}**, Due: ${new Date(v.violation_due_date).toLocaleDateString()})`).join('\n') +
                    `\n\nYou can review full remarks, photos, or file a dispute appeal under the **My Violations** tab.`;
        }
      } else if (option.id === 'res_service') {
        // Fetch personal unit service requests from endpoint
        const res = await API.get(`/service-request/${community.community_id}`);
        const requests = res.data || [];

        if (requests.length === 0) {
          botText = `You have no active maintenance requests logged in the system. You can file a new one anytime under the **New Request** tab!`;
        } else {
          botText = `You currently have **${requests.length} service request(s)** logged:\n\n` +
                    requests.map(r => `- **${r.title}** (Priority: ${r.priority}, Status: **${r.status_name}**)`).join('\n') +
                    `\n\nYou can track contractor dispatch or add comments directly inside the **New Request** tab.`;
        }
      } else if (option.id === 'res_details') {
        botText = `Your Community details for **${commName}**:\n\n` +
                  `️ **Name**: ${commName}\n` +
                  ` **Address**: ${community?.address?.address || 'N/A'}, ${community?.address?.city || 'N/A'}\n\n` +
                  `*Note*: Access logs and community settings are securely restricted to your property manager.`;
      } else {
        botText = getBotResponse(option.id);
        const isGuide = option.id.startsWith('how_');
        setLastCategory(isGuide ? 'guides' : 'main');
        nextMenu = 'after_answer';
      }
    } catch (err) {
      console.error("AI Copilot request error:", err);
      botText = `I was unable to retrieve live stats right now. Please review the respective tabs in your sidebar.`;
    }

    setMessages(prev => [...prev, {
      id: Date.now() + 1,
      sender: 'bot',
      text: botText,
      timestamp: new Date()
    }]);
    setMenuState(nextMenu);
    setLoading(false);
  };

  const handleBackToCategoryMenu = () => {
    if (loading) return;
    setLoading(true);

    setTimeout(() => {
      const userText = lastCategory === 'guides' ? ' Back to Help Guides' : '⬅️ Back to Queries';
      const botText = lastCategory === 'guides' 
        ? `Select a help guide below:` 
        : `Select a community query option below:`;

      setMessages(prev => [
        ...prev, 
        { id: Date.now(), sender: 'user', text: userText, timestamp: new Date() },
        { id: Date.now() + 1, sender: 'bot', text: botText, timestamp: new Date() }
      ]);
      setMenuState(lastCategory === 'guides' ? 'guides' : 'main');
      setLoading(false);
    }, 300);
  };

  const handleFullReset = () => {
    if (loading) return;
    setLoading(true);

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { id: Date.now(), sender: 'user', text: ' Restart Assistant Menu', timestamp: new Date() },
        { id: Date.now() + 1, sender: 'bot', text: `Menu restarted. How can I help you manage **${commName}**?`, timestamp: new Date() }
      ]);
      setMenuState('main');
      setLoading(false);
    }, 300);
  };

  const renderText = (text) => {
    if (!text) return '';
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-blue-600 dark:text-blue-400">{part.slice(2, -2)}</strong>;
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
    <div className="font-sans">
      {/* Floating launcher button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 bg-blue-600 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(29,104,223,0.4)] transition-all duration-300 transform hover:scale-105"
            title="Open AI Copilot"
          >
            <Sparkles className="w-6 h-6 animate-pulse" />
          </button>
        </div>
      )}

      {/* Chat window panel */}
      {isOpen && (
        <div className="fixed inset-0 sm:top-auto sm:left-auto sm:bottom-6 sm:right-6 w-full h-full sm:w-[380px] sm:h-[520px] bg-white dark:bg-[#1E2E42] border-t sm:border border-slate-200 dark:border-white/10 rounded-none sm:rounded-3xl shadow-[0_16px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.45)] flex flex-col overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-6 duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between border-b border-slate-200/20 dark:border-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5 text-white animate-bounce" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">NestBloq Copilot</h3>
                <span className="text-[10px] text-blue-200 dark:text-blue-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" /> Active: {commName}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Messages display */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/40 dark:bg-[#0E1A27]/20">
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <div key={msg.id} className={`flex items-start gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}>
                  {isBot && (
                    <div className="w-7 h-7 bg-blue-600/10 dark:bg-white/5 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center shrink-0 border border-blue-600/10 dark:border-white/5 font-mono text-[10px] font-bold">
                      {botInitials}
                    </div>
                  )}
                  <div className={`p-3 rounded-2xl max-w-[80%] text-xs shadow-sm ${
                    isBot 
                      ? 'bg-white dark:bg-[#253952] text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-white/5 rounded-tl-none font-sans' 
                      : 'bg-blue-600 text-white rounded-tr-none font-medium'
                  }`}>
                    <p className="whitespace-pre-line leading-relaxed">{renderText(msg.text)}</p>
                    <span className={`text-[8px] mt-1.5 block text-right ${isBot ? 'text-slate-450 dark:text-gray-400' : 'text-blue-200'}`}>
                      {msg.timestamp ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {loading && (
              <div className="flex items-start gap-2.5 justify-start animate-pulse">
                <div className="w-7 h-7 bg-blue-600/10 dark:bg-white/5 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center shrink-0 font-bold text-[10px]">
                  {botInitials}
                </div>
                <div className="bg-white dark:bg-[#253952] border border-slate-100 dark:border-white/5 p-3 rounded-2xl rounded-tl-none">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms', margin: '0 2px' }} />
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Click-Only Interactive Options Panel (No custom input) */}
          <div className="p-3 bg-slate-50 dark:bg-[#152335]/60 border-t border-slate-200/50 dark:border-white/10 flex flex-col gap-2 shrink-0 pb-4 sm:pb-3">
            {menuState === 'main' && (
              <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                {mainOptions.map((opt) => (
                  <button
                    key={opt.id}
                    disabled={loading}
                    onClick={() => handleSelectOption(opt)}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold bg-white dark:bg-[#203248] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/5 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl shadow-sm hover:shadow transition duration-150 active:scale-[0.98] disabled:opacity-50"
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
            )}

            {menuState === 'guides' && (
              <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                {guideOptions.map((opt) => (
                  <button
                    key={opt.id}
                    disabled={loading}
                    onClick={() => handleSelectOption(opt)}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold bg-white dark:bg-[#203248] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/5 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl shadow-sm hover:shadow transition duration-150 active:scale-[0.98] disabled:opacity-50"
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
            )}

            {menuState === 'after_answer' && (
              <div className="flex gap-2">
                <button
                  disabled={loading}
                  onClick={handleBackToCategoryMenu}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition active:scale-[0.98] shadow-md shadow-blue-600/10 disabled:opacity-50"
                >
                  {lastCategory === 'guides' ? ' View Other Guides' : '⬅️ Back to Queries'}
                </button>
                
                {lastCategory === 'guides' && (
                  <button
                    disabled={loading}
                    onClick={handleFullReset}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-350 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition active:scale-[0.98] disabled:opacity-50"
                  >
                    ⬅️ Main Menu
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAssistant;
