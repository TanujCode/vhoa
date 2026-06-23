import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, DollarSign, ShieldAlert, Wrench } from 'lucide-react';
import API from '../services/api';

const AiAssistant = ({ user, community }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `Hi ${user?.first_name || 'there'}! I am your NestBloq AI Copilot. How can I help you manage ${community?.name || 'your community'} today?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    { text: 'Show Dues Collected', icon: DollarSign },
    { text: 'Check Open Violations', icon: ShieldAlert },
    { text: 'Check Service Requests', icon: Wrench }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages]);

  const handleSend = async (textToSend) => {
    const queryText = textToSend || input;
    if (!queryText.trim()) return;

    // Add user message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: queryText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    // Contextual responses based on database values or mock data
    setTimeout(async () => {
      let botResponse = '';
      const query = queryText.toLowerCase();

      try {
        // Fetch stats if possible to answer questions accurately
        let stats = null;
        if (community?.community_id) {
          const res = await API.get(`/community/${community.community_id}/stats`);
          stats = res.data;
        }

        const collected = stats?.dues_collected ?? 19227.00;
        const pending = stats?.dues_pending ?? 3800.00;
        const overdue = stats?.dues_overdue ?? 1623.00;
        const totalViolations = stats?.active_violations ?? 2;
        const openReqs = stats?.open_requests ?? 4;

        if (query.includes('due') || query.includes('payment') || query.includes('collect') || query.includes('money')) {
          botResponse = `Based on current statistics for **${community?.name || 'this community'}**:\n\n- **Dues Collected**: $${collected.toLocaleString(undefined, {minimumFractionDigits: 2})}\n- **Pending Payments**: $${pending.toLocaleString(undefined, {minimumFractionDigits: 2})}\n- **Overdue Payments**: $${overdue.toLocaleString(undefined, {minimumFractionDigits: 2})}\n\nLet me know if you would like me to trigger payment reminders or sync details with QuickBooks!`;
        } else if (query.includes('violation') || query.includes('compliance') || query.includes('rule')) {
          botResponse = `Currently, there are **${totalViolations} open violation records** registered for this community requiring compliance tracking. You can review them in detail in the *Violations* tab or ask me to check a specific unit.`;
        } else if (query.includes('request') || query.includes('service') || query.includes('maintenance') || query.includes('leak')) {
          botResponse = `There are **${openReqs} active service requests** logged in the system. The latest requests involve elevator noises and water leak issues. Let me know if you need to dispatch a technician.`;
        } else if (query.includes('hi') || query.includes('hello') || query.includes('hey')) {
          botResponse = `Hello! How can I assist you with your HOA property management tasks today? You can ask me about community statistics, dues, or violations.`;
        } else {
          botResponse = `I'm here to assist with managing **${community?.name || 'your community'}**. I can fetch active statistics for dues collection, check open violations, or help you track service requests. Try using one of the quick suggestions above!`;
        }
      } catch (err) {
        botResponse = `I was unable to load real-time stats at the moment. However, I can help you review community bylaws, violations, and dues. What would you like to check?`;
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: botResponse,
        timestamp: new Date()
      }]);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating launcher button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-teal-650 hover:bg-teal-500 dark:bg-teal-600 dark:hover:bg-teal-500 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(13,148,136,0.4)] transition-all duration-300 transform hover:scale-105"
          title="Open AI Copilot"
        >
          <Sparkles className="w-6 h-6 animate-pulse" />
        </button>
      )}

      {/* Chat window panel */}
      {isOpen && (
        <div className="bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 rounded-3xl shadow-[0_16px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.45)] w-[360px] sm:w-[380px] h-[500px] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
          
          {/* Header */}
          <div className="bg-teal-650 dark:bg-[#152435] text-white p-4 flex items-center justify-between border-b border-slate-200/20 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">NestBloq Copilot</h3>
                <span className="text-[10px] text-teal-200 dark:text-teal-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" /> Online
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/40 dark:bg-[#0E1A27]/20">
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <div key={msg.id} className={`flex items-start gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}>
                  {isBot && (
                    <div className="w-7 h-7 bg-teal-600/10 dark:bg-white/5 text-teal-650 dark:text-teal-400 rounded-lg flex items-center justify-center shrink-0 border border-teal-600/10 dark:border-white/5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div className={`p-3 rounded-2xl max-w-[80%] text-xs shadow-sm ${
                    isBot 
                      ? 'bg-white dark:bg-[#253952] text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-white/5 rounded-tl-none' 
                      : 'bg-teal-650 dark:bg-teal-600 text-white rounded-tr-none'
                  }`}>
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                    <span className={`text-[8px] mt-1.5 block text-right ${isBot ? 'text-slate-400 dark:text-gray-500' : 'text-teal-200'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {loading && (
              <div className="flex items-start gap-2.5 justify-start">
                <div className="w-7 h-7 bg-teal-600/10 dark:bg-white/5 text-teal-650 dark:text-teal-400 rounded-lg flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white dark:bg-[#253952] border border-slate-100 dark:border-white/5 p-3 rounded-2xl rounded-tl-none">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} style={{ margin: '0 2px' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          <div className="px-4 py-2 bg-white dark:bg-[#1E2E42] border-t border-slate-100 dark:border-white/5 flex gap-2 overflow-x-auto custom-scrollbar shrink-0">
            {quickPrompts.map((p, i) => {
              const PromptIcon = p.icon;
              return (
                <button
                  key={i}
                  onClick={() => handleSend(p.text)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-teal-50 dark:hover:bg-teal-950/20 hover:text-teal-650 border border-slate-200/60 dark:border-white/5 text-[10px] font-semibold text-slate-600 dark:text-slate-400 transition shrink-0"
                >
                  <PromptIcon className="w-3.5 h-3.5" />
                  {p.text}
                </button>
              );
            })}
          </div>

          {/* Input form */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="p-3 bg-white dark:bg-[#1E2E42] border-t border-slate-100 dark:border-white/5 flex gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder="Ask Copilot..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 placeholder-slate-400 dark:placeholder-gray-500"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-8 h-8 bg-teal-650 hover:bg-teal-500 dark:bg-teal-600 dark:hover:bg-teal-500 text-white rounded-xl flex items-center justify-center transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AiAssistant;
