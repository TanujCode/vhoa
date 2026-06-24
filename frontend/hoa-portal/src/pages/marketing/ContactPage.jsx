import React, { useState } from 'react';
import { Mail, Phone, MapPin, CheckCircle, AlertCircle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';
import { useTheme } from '../../context/ThemeContext';

// Import image assets
import heroClubLight from '../../assets/hero_club_light.png';
import heroClubDark from '../../assets/hero_club_dark.png';
import heroGardenLight from '../../assets/hero_garden_light.png';
import heroGardenDark from '../../assets/hero_garden_dark.png';
import heroCondoLight from '../../assets/hero_condo_light.png';
import heroCondoDark from '../../assets/hero_condo_dark.png';

export default function ContactPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const validate = () => {
    let tempErrors = {};
    if (!formData.firstName.trim()) tempErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) tempErrors.lastName = "Last name is required";
    if (!formData.email.trim()) {
      tempErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = "Invalid email address";
    }
    if (!formData.message.trim()) tempErrors.message = "Message details are required";
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setShowSuccessModal(true);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          subject: 'General Inquiry',
          message: ''
        });
      }, 1200);
    }
  };

  const galleryImages = [
    {
      light: heroClubLight,
      dark: heroClubDark,
      label: "Community Amenities"
    },
    {
      light: heroGardenLight,
      dark: heroGardenDark,
      label: "Lush Green Spaces"
    },
    {
      light: heroCondoLight,
      dark: heroCondoDark,
      label: "Residential Complexes"
    }
  ];

  const faqs = [
    {
      question: "How quickly can we expect a response?",
      answer: "Our onboarding team typically responds within 2-4 business hours. Technical and billing support is active 24/7."
    },
    {
      question: "Can residents submit maintenance tickets directly?",
      answer: "Yes! The NestBloq portal includes a dedicated resident login where members can log requests, track tickets, and pay dues."
    },
    {
      question: "Is our community's financial data secure?",
      answer: "Absolutely. We employ bank-grade SHA-256 encryption and partner with PCI-DSS compliant payment gateways (ACH/Card) for security."
    },
    {
      question: "Can we migrate our existing registry records?",
      answer: "Yes, we support bulk imports via CSV/Excel and provide free hands-on assistant guides to help move rosters easily."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#120824] transition-colors duration-250 font-sans text-slate-900 dark:text-slate-100">
      <Navbar />

      <div className="flex-1 overflow-x-hidden">

      {/* --- Page Header Banner --- */}
      <header className="relative w-full overflow-hidden py-20 border-b border-slate-200/50 dark:border-white/[0.04] bg-slate-900">
        <div className="absolute inset-0 z-0">
          <img
            src={heroCondoLight}
            alt="Modern Residential Complexes"
            className="w-full h-full object-cover object-center opacity-20 select-none pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-950/75 to-[#120824] dark:to-[#120824]" />
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/40 text-violet-300 text-[10px] font-extrabold tracking-widest uppercase">
            Get in touch
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl mx-auto">
            We're Here to Support Your Community
          </h1>
          <p className="text-base sm:text-lg text-slate-350 max-w-xl mx-auto leading-relaxed">
            Have questions about our platform or need technical assistance? Our team is ready to help.
          </p>
        </div>
      </header>

      {/* --- Main Section split in two columns --- */}
      <section className="py-16 max-w-7xl mx-auto px-5 sm:px-8 w-full flex-1 relative z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/[0.03] dark:bg-violet-600/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/[0.03] dark:bg-teal-500/6 rounded-full blur-[120px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch relative z-10">
          
          {/* Column 1: Contact Details */}
          <div className="lg:col-span-5 space-y-6 flex flex-col justify-start">
            
            {/* Card 1: Email Us */}
            <div className="bg-white dark:bg-[#180a2d]/40 border border-slate-200/80 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4 text-left">
              <div className="w-10 h-10 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl flex items-center justify-center shrink-0 border border-violet-500/20">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-505">Email Us</h4>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1">support@nestbloq.com</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">sales@nestbloq.com</p>
              </div>
            </div>

            {/* Card 2: Call Us */}
            <div className="bg-white dark:bg-[#180a2d]/40 border border-slate-200/80 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4 text-left">
              <div className="w-10 h-10 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl flex items-center justify-center shrink-0 border border-violet-500/20">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550">Call Us</h4>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1">+1 (800) 555-0199</p>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Mon-Fri, 9am - 6pm EST</p>
              </div>
            </div>

            {/* Card 3: Office */}
            <div className="bg-white dark:bg-[#180a2d]/40 border border-slate-200/80 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4 text-left">
              <div className="w-10 h-10 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl flex items-center justify-center shrink-0 border border-violet-500/20">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550">Office</h4>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1">123 Community Blvd, Suite 400</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Austin, TX 78701</p>
              </div>
            </div>

          </div>

          {/* Column 2: Inquiry Form */}
          <div className="lg:col-span-7 bg-white dark:bg-[#180a2d]/40 border border-slate-200/80 dark:border-white/[0.06] p-6 sm:p-8 rounded-3xl shadow-sm text-left relative overflow-hidden">
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-6">Send us a message</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* First name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Jane"
                    className={`w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900 border text-sm rounded-xl outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-slate-900 dark:text-slate-100 ${
                      errors.firstName ? 'border-red-500' : 'border-slate-200/80 dark:border-white/[0.08]'
                    }`}
                  />
                  {errors.firstName && <p className="text-red-500 text-[10px] font-semibold mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.firstName}</p>}
                </div>

                {/* Last name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    className={`w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900 border text-sm rounded-xl outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-slate-900 dark:text-slate-100 ${
                      errors.lastName ? 'border-red-500' : 'border-slate-200/80 dark:border-white/[0.08]'
                    }`}
                  />
                  {errors.lastName && <p className="text-red-500 text-[10px] font-semibold mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.lastName}</p>}
                </div>

              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Work Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="jane.doe@ourcommunityemail.com"
                  className={`w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900 border text-sm rounded-xl outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-slate-900 dark:text-slate-100 ${
                    errors.email ? 'border-red-500' : 'border-slate-200/80 dark:border-white/[0.08]'
                  }`}
                />
                {errors.email && <p className="text-red-500 text-[10px] font-semibold mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.email}</p>}
              </div>

              {/* Subject dropdown */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Subject *</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] text-sm rounded-xl outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 dark:text-slate-200 font-semibold"
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Sales Presentation">Sales Presentation / Custom Proposal</option>
                  <option value="Billing & Accounts">Billing & Accounts</option>
                  <option value="Technical Help">Technical & Admin Support</option>
                </select>
              </div>

              {/* Message Details */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Message *</label>
                <textarea
                  name="message"
                  rows="4"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="How can we help you today?"
                  className={`w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900 border text-sm rounded-xl outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-slate-900 dark:text-slate-100 resize-none ${
                    errors.message ? 'border-red-500' : 'border-slate-200/80 dark:border-white/[0.08]'
                  }`}
                />
                {errors.message && <p className="text-red-500 text-[10px] font-semibold mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-750 hover:to-indigo-750 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg hover:shadow-violet-500/10 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Sending Message..." : "Send Message"}
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* --- Property Gallery Row --- */}
      <section className="py-12 max-w-7xl mx-auto px-5 sm:px-8 w-full relative z-10 border-t border-slate-200/60 dark:border-white/[0.04]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {galleryImages.map((img, i) => {
            const activeSrc = isDark ? img.dark : img.light;
            return (
              <div key={i} className="group relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-white/[0.05] bg-white dark:bg-slate-900 p-2 shadow-xs transition-all duration-300 hover:scale-[1.01]">
                <div className="relative aspect-[1.6] w-full overflow-hidden rounded-xl">
                  <img
                    src={activeSrc}
                    alt={img.label}
                    className="w-full h-full object-cover object-center select-none pointer-events-none transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-80" />
                  <span className="absolute bottom-3 left-3 text-xs font-bold text-white uppercase tracking-wider bg-slate-900/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                    {img.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* --- Frequently Asked Questions Section --- */}
      <section className="py-16 max-w-4xl mx-auto px-5 sm:px-8 w-full relative z-10 border-t border-slate-200/60 dark:border-white/[0.04] pb-24">
        <div className="text-center space-y-3 mb-10">
          <span className="text-violet-600 dark:text-violet-400 text-[10px] font-extrabold tracking-widest uppercase">Support Center</span>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Frequently Asked Questions</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Find quick answers to common support and onboarding questions</p>
        </div>

        <div className="space-y-4 text-left">
          {faqs.map((faq, i) => {
            const isOpen = openFaqIndex === i;
            return (
              <div
                key={i}
                className="bg-white dark:bg-[#180a2d]/30 border border-slate-200/80 dark:border-white/[0.06] rounded-2xl overflow-hidden shadow-xs transition-all"
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full px-6 py-4 flex items-center justify-between gap-4 font-bold text-sm text-slate-800 dark:text-slate-200 focus:outline-none hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                >
                  <span>{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-violet-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-550 shrink-0" />
                  )}
                </button>
                
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs text-slate-555 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-black/10">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* --- SUCCESS MODAL OVERLAY --- */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#162535] rounded-3xl max-w-md w-full border border-slate-100 dark:border-slate-800 p-8 text-center space-y-5 shadow-2xl relative">
            <div className="w-16 h-16 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex justify-center items-center gap-1.5">
                Inquiry Received!
                <Sparkles size={16} className="text-yellow-500" />
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Thank you! Your message has been sent successfully. One of our onboarding experts will review your details and get back to you via email within the next 24 hours.
              </p>
            </div>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95"
            >
              Back to Contact
            </button>
          </div>
        </div>
      )}

      <Footer />
      </div>
    </div>
  );
}
