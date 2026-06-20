import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Sparkles, MessageSquare, X, RotateCcw } from 'lucide-react';

export default function InteractiveAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I am your NestBloq Assistant. Ask me anything about your community, book an amenity, or report a maintenance issue!",
      time: 'Just now'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const presetQuestions = [
    {
      q: "🗓️ When is trash pickup?",
      a: "Trash pickup occurs every Tuesday and Friday morning at 7:00 AM. Recycling is collected on Wednesdays. Please make sure to place your bins at the curb the evening before."
    },
    {
      q: "💳 How to pay my dues?",
      a: "You can pay your dues directly online in seconds! Go to your resident dashboard, click on the 'Payments' section, select your outstanding dues, and check out securely via credit card, debit card, or ACH transfer."
    },
    {
      q: "🏊 Reserve clubhouse pool?",
      a: "Yes, you can! The clubhouse pool is available for private bookings on weekends. Navigate to the 'Amenities' tab in the app, select the clubhouse pool, choose your preferred slot, and submit the booking. It takes just a few clicks!"
    },
    {
      q: "🛠️ Report water leak?",
      a: "Oh no! I will help you file a maintenance request right away. Please log into the portal, navigate to 'Service Requests', upload a photo of the leak, and select the priority. An admin will dispatch a vendor immediately."
    }
  ];

  const floatingChips = [
    { label: "🗓️ Trash Schedule", q: "When is trash pickup?" },
    { label: "💳 Pay Dues", q: "How to pay my dues?" },
    { label: "🏊 Book Pool", q: "Reserve clubhouse pool?" },
    { label: "🛠️ Report Leak", q: "Report water leak?" }
  ];

  const handleSend = (text) => {
    if (!text.trim() || isTyping) return;

    // Add user message
    const newMessages = [...messages, { sender: 'user', text, time: 'Just now' }];
    setMessages(newMessages);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      let aiResponse = "";
      const query = text.toLowerCase().trim();
      
      // 1. Handle Greetings
      if (query === 'hi' || query === 'hello' || query === 'hey' || query === 'yo' || query === 'namaste' || query.startsWith('hi ') || query.startsWith('hello ')) {
        aiResponse = "Hello! I am your NestBloq Assistant. How can I help you today? You can ask about community rules, bookings, payments, or maintenance.";
      } 
      // 2. Handle Presets
      else {
        const matched = presetQuestions.find(
          item => item.q.toLowerCase().includes(query) || query.includes(item.q.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, "").trim().toLowerCase())
        );
        
        if (matched) {
          aiResponse = matched.a;
        } 
        // 3. Handle Keyword Matches
        else if (query.includes('trash') || query.includes('garbage') || query.includes('waste') || query.includes('cleanup')) {
          aiResponse = presetQuestions[0].a;
        } else if (query.includes('due') || query.includes('pay') || query.includes('maintenance fee') || query.includes('payment') || query.includes('invoice')) {
          aiResponse = presetQuestions[1].a;
        } else if (query.includes('pool') || query.includes('clubhouse') || query.includes('book') || query.includes('reserve') || query.includes('amenity')) {
          aiResponse = presetQuestions[2].a;
        } else if (query.includes('leak') || query.includes('water') || query.includes('broken') || query.includes('repair') || query.includes('maintenance')) {
          aiResponse = presetQuestions[3].a;
        } 
        // 4. Fallback (Not understood)
        else {
          aiResponse = "I am not able to understand that. Could you please ask about trash pickup, paying dues, pool bookings, or leak repairs? Alternatively, feel free to try one of the quick-test buttons above!";
        }
      }

      setMessages(prev => [...prev, { sender: 'ai', text: aiResponse, time: 'Just now' }]);
      setIsTyping(false);
    }, 1200);
  };

  const handleReset = () => {
    setMessages([
      {
        sender: 'ai',
        text: "Hello! I am your NestBloq Assistant. Ask me anything about your community, book an amenity, or report a maintenance issue!",
        time: 'Just now'
      }
    ]);
    setIsTyping(false);
  };

  const handleChipClick = (question) => {
    setIsOpen(true);
    setShowWelcome(false);
    handleSend(question);
  };

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end select-none font-sans">
      
      {/* ─── CLOSED STATE WELCOME & CHIPS ─── */}
      {!isOpen && (
        <div className="flex flex-col items-end gap-2 mb-3 pointer-events-auto">
          
          {/* Floating Action Chips */}
          <div className="flex flex-col items-end gap-2 pr-1 animate-fade-in-up">
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

          {/* Welcome Dialog Bubble */}
          {showWelcome && (
            <div className="relative mt-2 p-4 bg-white dark:bg-[#11101d] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-xl max-w-[260px] animate-fade-in-up flex gap-3 items-start">
              {/* Close Welcome button */}
              <button 
                onClick={(e) => { e.stopPropagation(); setShowWelcome(false); }}
                className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                aria-label="Dismiss welcome"
              >
                <X size={12} />
              </button>
              
              {/* Avatar logo */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <Bot size={18} />
              </div>

              <div className="pr-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1">Welcome! 👋</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">What can I help you with today?</p>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ─── OPENED CHAT WINDOW PANEL ─── */}
      {isOpen && (
        <div className="w-[360px] max-w-[95vw] h-[520px] max-h-[80vh] bg-white dark:bg-[#11101d] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xl flex flex-col overflow-hidden animate-fade-in-up mb-4 transition-colors duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 via-[#5942be] to-indigo-600 p-4 flex items-center justify-between text-white shadow-md relative shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center border border-white/20">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#5942be]" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight text-white flex items-center gap-1.5">
                  NestBloq Assistant
                </h3>
                <p className="text-[10px] text-white/80 font-medium">Automated Community Guide</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleReset} 
                title="Reset Chat"
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/90 hover:text-white transition-colors"
              >
                <RotateCcw size={15} />
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                title="Minimize"
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/90 hover:text-white transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Preset Suggestions inside panel (only visible if no user messages sent yet) */}
          {messages.length === 1 && (
            <div className="p-3 bg-slate-50/50 dark:bg-white/[0.01] border-b border-slate-100 dark:border-white/[0.04] shrink-0">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Popular suggestions:</p>
              <div className="flex flex-wrap gap-1.5">
                {presetQuestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.q)}
                    disabled={isTyping}
                    className="px-2.5 py-1 text-[11px] bg-white dark:bg-white/[0.02] text-slate-700 dark:text-slate-300 hover:text-white dark:hover:text-white border border-slate-200/80 dark:border-white/[0.06] hover:bg-gradient-to-r hover:from-violet-600 hover:to-indigo-600 hover:border-transparent rounded-lg shadow-sm transition-all duration-200 disabled:opacity-50 select-none"
                  >
                    {item.q.split(" ").slice(1).join(" ")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Logs */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/30 dark:bg-[#090812]">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start gap-2.5 max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white'
                    : 'bg-white dark:bg-white/[0.04] text-violet-400 border border-slate-100 dark:border-white/[0.06]'
                }`}>
                  {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>

                {/* Bubble */}
                <div className="space-y-1">
                  <div className={`p-3 rounded-2xl shadow-sm text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-tr-none'
                      : 'bg-white dark:bg-white/[0.04] text-slate-800 dark:text-slate-200 border border-slate-100/80 dark:border-white/[0.04] rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                  <p className={`text-[9px] text-slate-400 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start gap-2.5 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-white/[0.04] text-violet-400 border border-slate-100 dark:border-white/[0.06] flex items-center justify-center shrink-0">
                  <Bot size={14} />
                </div>
                <div className="bg-white dark:bg-white/[0.04] border border-slate-100/80 dark:border-white/[0.04] px-3.5 py-2.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Terms Disclaimer Text */}
          <div className="px-4 py-1.5 bg-slate-100/40 dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/[0.03] text-center shrink-0">
            <span className="text-[9px] text-slate-400 font-medium">
              By clicking or typing, you accept our <a href="#" className="underline text-violet-500 hover:text-violet-600">Terms of Use</a>
            </span>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputValue.trim()) {
                handleSend(inputValue);
              }
            }}
            className="p-3 bg-white dark:bg-[#11101d] border-t border-slate-100 dark:border-white/[0.04] flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a community question..."
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-white/[0.01] border border-slate-200/80 dark:border-white/[0.06] text-xs rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
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

      {/* ─── FLOATING TOGGLE BUTTON ─── */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setShowWelcome(false);
        }}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white flex items-center justify-center shadow-xl shadow-violet-500/20 active:scale-95 transition-all duration-300 hover:scale-105"
        aria-label="Toggle chat assistant"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

    </div>
  );
}
