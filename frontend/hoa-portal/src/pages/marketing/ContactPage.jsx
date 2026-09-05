import React, { useState, useRef } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle, 
  Sparkles, 
  Zap, 
  Lock, 
  UserCheck, 
  Share2, 
  Globe, 
  Send,
  Check,
  ChevronDown
} from 'lucide-react';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';
import InteractiveAssistant from '../../components/marketing/InteractiveAssistant';
import { useTheme } from '../../context/ThemeContext';

export default function ContactPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const formRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    workEmail: '',
    phone: '',
    communityName: '',
    subject: 'Technical Support',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
    const firstInput = document.getElementById('firstName');
    firstInput?.focus();
  };

  const handleBookDemo = () => {
    setFormData(prev => ({ ...prev, subject: 'Sales & Demo' }));
    scrollToForm();
  };

  const validate = () => {
    let temp = {};
    if (!formData.firstName.trim()) temp.firstName = "First name is required";
    if (!formData.lastName.trim()) temp.lastName = "Last name is required";
    if (!formData.workEmail.trim()) {
      temp.workEmail = "Work email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.workEmail)) {
      temp.workEmail = "Invalid email format";
    }
    if (!formData.message.trim()) temp.message = "Please write your message";

    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setFormData({
            firstName: '',
            lastName: '',
            workEmail: '',
            phone: '',
            communityName: '',
            subject: 'Technical Support',
            message: ''
          });
        }, 4000);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-[#0f0720] transition-colors duration-300 font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      <main className="flex-1 overflow-x-hidden">

        {/* ─── SECTION 1: HEADER & INTRO ─── */}
        <section className="relative pt-4 sm:pt-6 lg:pt-8 pb-8 sm:pb-10 max-w-5xl mx-auto px-5 sm:px-8 text-center space-y-4 sm:space-y-5">
          {/* Ambient Background Glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-80 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

          {/* Badge Pill */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] sm:text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            GET IN TOUCH
          </div>

          {/* Main Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            We're Here to Support Your <span className="gradient-text">Community</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal">
            Whether you need technical assistance, want to explore our premium features, or just have a quick question, our concierge team is ready to assist.
          </p>

          {/* Top Action Buttons with Brand Glow */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              onClick={scrollToForm}
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:via-indigo-500 hover:to-purple-500 text-white font-semibold text-xs sm:text-sm rounded-full shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              Send us a Message
            </button>
            <button
              onClick={handleBookDemo}
              className="px-6 py-2.5 bg-white dark:bg-white/[0.05] text-slate-700 dark:text-slate-200 border border-slate-250 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30 hover:bg-slate-50 dark:hover:bg-white/10 font-semibold text-xs sm:text-sm rounded-full shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              Book a Demo
            </button>
          </div>
        </section>


        {/* ─── SECTION 2: 3 VALUE / PROMISE CARDS ─── */}
        <section className="max-w-5xl mx-auto px-5 sm:px-8 mb-10 sm:mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            
            {/* Card 1: Response Within 2 Hours */}
            <div className="bg-white dark:bg-[#180d2e]/70 border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-300 text-left space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Response Within 2 Hours
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Mon–Fri, 9AM–6PM IST
                </p>
              </div>
            </div>

            {/* Card 2: Your Data Stays Private */}
            <div className="bg-white dark:bg-[#180d2e]/70 border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-300 text-left space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/50 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Lock className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Your Data Stays Private
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Encrypted & confidential
                </p>
              </div>
            </div>

            {/* Card 3: Dedicated Account Manager */}
            <div className="bg-white dark:bg-[#180d2e]/70 border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-300 text-left space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/50 dark:border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Dedicated Account Manager
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Named contact for premium plans
                </p>
              </div>
            </div>

          </div>
        </section>


        {/* ─── SECTION 3: CONTACT INFO & SEND US A MESSAGE FORM ─── */}
        <section ref={formRef} className="max-w-5xl mx-auto px-5 sm:px-8 pb-16 sm:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            
            {/* Left Column: Direct Contact Details */}
            <div className="lg:col-span-4 space-y-6 text-left pt-2">
              
              {/* Item 1: Email Us */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Mail className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Email Us
                    </h4>
                    <a href="mailto:support@nestbloq.com" className="text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      support@nestbloq.com
                    </a>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 pl-13 font-normal">
                  For general inquiries and support requests.
                </p>
              </div>

              {/* Item 2: Call Us */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Phone className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Call Us
                    </h4>
                    <a href="tel:+18001234567" className="text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      +1 (800) 123-4567
                    </a>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 pl-13 font-normal">
                  Available Mon–Fri, 9AM–6PM IST.
                </p>
              </div>

              {/* Item 3: Headquarters */}
              <div className="space-y-1.5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                    <MapPin className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Headquarters
                    </h4>
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      123 Innovation Drive, Tech Park<br />
                      Bengaluru, KA 560001<br />
                      India
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Social / Web Icons */}
              <div className="flex items-center gap-2.5 pt-4">
                <button
                  type="button"
                  title="Share"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: 'NestBloq', url: window.location.href });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link copied to clipboard!');
                    }
                  }}
                  className="w-9 h-9 rounded-full bg-white dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-500/40 shadow-sm transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <a
                  href="https://nestbloq.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Website"
                  className="w-9 h-9 rounded-full bg-white dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-500/40 shadow-sm transition-all cursor-pointer"
                >
                  <Globe className="w-4 h-4" />
                </a>
              </div>

            </div>

            {/* Right Column: Send Us A Message Form */}
            <div className="lg:col-span-8 bg-white dark:bg-[#180d2e]/70 border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none text-left">
              
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-6">
                Send us a message
              </h2>

              {submitted ? (
                <div className="py-12 flex flex-col items-center text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-bounce">
                    <Check className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Message Sent Successfully!</h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                    Thank you for reaching out. Our team will review your inquiry and get back to you within 2 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  
                  {/* Row 1: First Name & Last Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        First Name
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Jane"
                        className={`w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50/50 dark:bg-white/[0.02] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                          errors.firstName ? 'border-rose-400 dark:border-rose-500' : 'border-slate-200 dark:border-white/10'
                        }`}
                      />
                      {errors.firstName && <span className="text-[11px] text-rose-500 mt-1 block">{errors.firstName}</span>}
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Doe"
                        className={`w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50/50 dark:bg-white/[0.02] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                          errors.lastName ? 'border-rose-400 dark:border-rose-500' : 'border-slate-200 dark:border-white/10'
                        }`}
                      />
                      {errors.lastName && <span className="text-[11px] text-rose-500 mt-1 block">{errors.lastName}</span>}
                    </div>
                  </div>

                  {/* Row 2: Work Email & Phone Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="workEmail" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Work Email
                      </label>
                      <input
                        id="workEmail"
                        type="email"
                        name="workEmail"
                        value={formData.workEmail}
                        onChange={handleInputChange}
                        placeholder="jane@community.com"
                        className={`w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50/50 dark:bg-white/[0.02] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                          errors.workEmail ? 'border-rose-400 dark:border-rose-500' : 'border-slate-200 dark:border-white/10'
                        }`}
                      />
                      {errors.workEmail && <span className="text-[11px] text-rose-500 mt-1 block">{errors.workEmail}</span>}
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Phone Number
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Row 3: Community / Company Name */}
                  <div>
                    <label htmlFor="communityName" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Community / Company Name
                    </label>
                    <input
                      id="communityName"
                      type="text"
                      name="communityName"
                      value={formData.communityName}
                      onChange={handleInputChange}
                      placeholder="Oakwood Estates HOA"
                      className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* Row 4: Subject Dropdown */}
                  <div>
                    <label htmlFor="subject" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Subject
                    </label>
                    <div className="relative">
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#180d2e] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none pr-10 cursor-pointer transition-all"
                      >
                        <option value="Technical Support">Technical Support</option>
                        <option value="Sales & Demo">Sales & Demo</option>
                        <option value="Billing & Invoices">Billing & Invoices</option>
                        <option value="General Inquiry">General Inquiry</option>
                        <option value="Partnership">Partnership</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Row 5: Message Textarea */}
                  <div>
                    <label htmlFor="message" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="How can we help you today?"
                      className={`w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50/50 dark:bg-white/[0.02] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none ${
                        errors.message ? 'border-rose-400 dark:border-rose-500' : 'border-slate-200 dark:border-white/10'
                      }`}
                    />
                    {errors.message && <span className="text-[11px] text-rose-500 mt-1 block">{errors.message}</span>}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>SENDING...</span>
                        </>
                      ) : (
                        <span>SEND MESSAGE</span>
                      )}
                    </button>
                  </div>

                  {/* Privacy Policy & Turnaround Disclaimer */}
                  <div className="text-center pt-2 space-y-1">
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      By submitting, you agree to our{' '}
                      <a href="#" className="underline text-indigo-600 dark:text-indigo-400 hover:opacity-80">
                        Privacy Policy
                      </a>.
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      We aim to respond to all inquiries within 2 hours.
                    </p>
                  </div>

                </form>
              )}

            </div>

          </div>
        </section>

      </main>

      {/* Bottom Footer & Interactive Assistant matching Homepage */}
      <Footer />
      <InteractiveAssistant />
    </div>
  );
}