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
import PhoneInputWithCountry from '../../components/common/PhoneInputWithCountry';
import API from '../../services/api';
import toast from 'react-hot-toast';

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
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  const validateSingleField = (name, value) => {
    let errorMsg = '';
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const val = typeof value === 'string' ? value.trim() : '';

    if (name === 'firstName') {
      if (!val) errorMsg = 'First name is required.';
      else if (val.length < 2) errorMsg = 'First name must be at least 2 characters.';
      else if (val.length > 50) errorMsg = 'First name cannot exceed 50 characters.';
      else if (!nameRegex.test(val)) errorMsg = 'Only letters, spaces, and hyphens are allowed.';
    } else if (name === 'lastName') {
      if (!val) errorMsg = 'Last name is required.';
      else if (val.length < 2) errorMsg = 'Last name must be at least 2 characters.';
      else if (val.length > 50) errorMsg = 'Last name cannot exceed 50 characters.';
      else if (!nameRegex.test(val)) errorMsg = 'Only letters, spaces, and hyphens are allowed.';
    } else if (name === 'workEmail') {
      if (!val) errorMsg = 'Work email is required.';
      else if (!emailRegex.test(val)) errorMsg = 'Please enter a valid email address (e.g. name@company.com).';
    } else if (name === 'phone') {
      if (val) {
        const digits = val.replace(/[^\d]/g, '');
        if (digits.length > 0 && digits.length < 7) errorMsg = 'Phone number must have at least 7 digits.';
        else if (digits.length > 15) errorMsg = 'Phone number is too long (max 15 digits).';
      }
    } else if (name === 'companyName') {
      if (val.length > 150) errorMsg = 'Company name cannot exceed 150 characters.';
    } else if (name === 'subject') {
      if (!val) errorMsg = 'Please select a subject.';
    } else if (name === 'message') {
      if (!val) errorMsg = 'Please write your message.';
      else if (val.length < 10) errorMsg = `Message is too short (${val.length}/10 min characters).`;
      else if (val.length > 3000) errorMsg = 'Message cannot exceed 3000 characters.';
    }

    setErrors(prev => ({ ...prev, [name]: errorMsg }));
    return errorMsg;
  };

  const handleInputChange = (e) => {
    let { name, value } = e.target;

    // Keystroke sanitizer: strictly block numbers and special symbols on name fields as they type
    if (name === 'firstName' || name === 'lastName') {
      value = value.replace(/[^a-zA-Z\s\-']/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      validateSingleField(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateSingleField(name, value);
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

  const validateAll = () => {
    let temp = {};
    const fields = ['firstName', 'lastName', 'workEmail', 'phone', 'companyName', 'subject', 'message'];
    let allTouched = {};
    let isValid = true;

    fields.forEach(f => {
      allTouched[f] = true;
      const err = validateSingleField(f, formData[f]);
      if (err) {
        temp[f] = err;
        isValid = false;
      }
    });

    setTouched(allTouched);
    setErrors(temp);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) {
      toast.error("Please fix the highlighted errors before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        work_email: formData.workEmail.trim().toLowerCase(),
        phone: formData.phone?.trim() || null,
        company_name: formData.communityName?.trim() || null,
        subject: formData.subject.trim(),
        message: formData.message.trim()
      };

      const res = await API.post('/contact/submit', payload);
      
      setSubmittedData({
        email: payload.work_email,
        refId: res.data?.id ? String(res.data.id).slice(0, 8).toUpperCase() : 'PENDING'
      });
      setSubmitted(true);
      toast.success("Thank you! Your inquiry has been sent and a confirmation email has been dispatched.");

      setFormData({
        firstName: '',
        lastName: '',
        workEmail: '',
        phone: '',
        communityName: '',
        subject: 'Technical Support',
        message: ''
      });
      setErrors({});
      setTouched({});
    } catch (err) {
      console.error("Contact submission error:", err);
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        toast.error(detail);
      } else if (Array.isArray(detail)) {
        toast.error(detail.map(d => d.msg || d).join(', '));
      } else {
        toast.error("Failed to send message. Please try again or email us directly at support@nestbloq.com.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] dark:bg-[#0f172a] transition-colors duration-300 font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
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
          <h1 className="font-display text-2xl sm:text-3xl lg:text-[36px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
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
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-300 text-left space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  Response Within 2 Hours
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Mon–Fri, 9AM–6PM IST
                </p>
              </div>
            </div>

            {/* Card 2: Your Data Stays Private */}
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-300 text-left space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/50 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Lock className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  Your Data Stays Private
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Encrypted & confidential
                </p>
              </div>
            </div>

            {/* Card 3: Dedicated Account Manager */}
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-300 text-left space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/50 dark:border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
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
            <div className="lg:col-span-8 bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none text-left">
              
              <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
                Send us a message
              </h2>

              {submitted ? (
                <div className="py-10 flex flex-col items-center text-center space-y-4 animate-scale-up">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <Check className="w-8 h-8 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-2">
                      REF ID: #NB-{submittedData?.refId || 'INQ-SUCCESS'}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      Message Sent Successfully!
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md leading-relaxed">
                    Thank you for reaching out! We have dispatched a confirmation email to <strong className="text-slate-900 dark:text-white">{submittedData?.email}</strong>. Our support team will review your inquiry and get back to you shortly.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Send Another Message
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  
                  {/* Row 1: First Name & Last Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        First Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        name="firstName"
                        maxLength={40}
                        value={formData.firstName}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="Jane"
                        className={`w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50/50 dark:bg-white/[0.02] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                          errors.firstName && touched.firstName
                            ? 'border-rose-500 ring-2 ring-rose-500/20'
                            : 'border-slate-200 dark:border-white/10 focus:ring-indigo-500/20 focus:border-indigo-500'
                        }`}
                      />
                      {errors.firstName && touched.firstName && (
                        <span className="text-[11px] font-medium text-rose-500 mt-1 block animate-fade-in flex items-center gap-1">
                          {errors.firstName}
                        </span>
                      )}
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Last Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        name="lastName"
                        maxLength={40}
                        value={formData.lastName}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="Doe"
                        className={`w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50/50 dark:bg-white/[0.02] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                          errors.lastName && touched.lastName
                            ? 'border-rose-500 ring-2 ring-rose-500/20'
                            : 'border-slate-200 dark:border-white/10 focus:ring-indigo-500/20 focus:border-indigo-500'
                        }`}
                      />
                      {errors.lastName && touched.lastName && (
                        <span className="text-[11px] font-medium text-rose-500 mt-1 block animate-fade-in flex items-center gap-1">
                          {errors.lastName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Work Email & Phone Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="workEmail" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Work Email <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="workEmail"
                        type="email"
                        name="workEmail"
                        maxLength={100}
                        value={formData.workEmail}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="jane@company.com"
                        className={`w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50/50 dark:bg-white/[0.02] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                          errors.workEmail && touched.workEmail
                            ? 'border-rose-500 ring-2 ring-rose-500/20'
                            : 'border-slate-200 dark:border-white/10 focus:ring-indigo-500/20 focus:border-indigo-500'
                        }`}
                      />
                      {errors.workEmail && touched.workEmail && (
                        <span className="text-[11px] font-medium text-rose-500 mt-1 block animate-fade-in flex items-center gap-1">
                          {errors.workEmail}
                        </span>
                      )}
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Phone Number
                      </label>
                      <PhoneInputWithCountry
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={(e, formatted) => {
                          setFormData(prev => ({ ...prev, phone: formatted }));
                          setTouched(prev => ({ ...prev, phone: true }));
                          validateSingleField('phone', formatted);
                        }}
                        size="sm"
                        placeholder="(555) 000-0000"
                      />
                      {errors.phone && touched.phone && (
                        <span className="text-[11px] font-medium text-rose-500 mt-1 block animate-fade-in flex items-center gap-1">
                          {errors.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Community / Company Name */}
                  <div>
                    <label htmlFor="communityName" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Company / Property Portfolio Name
                    </label>
                    <input
                      id="communityName"
                      type="text"
                      name="communityName"
                      maxLength={150}
                      value={formData.communityName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="Skyline Rentals / Property Portfolio LLC"
                      className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                    {errors.communityName && touched.communityName && (
                      <span className="text-[11px] font-medium text-rose-500 mt-1 block animate-fade-in flex items-center gap-1">
                        {errors.communityName}
                      </span>
                    )}
                  </div>

                  {/* Row 4: Subject Dropdown */}
                  <div>
                    <label htmlFor="subject" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Subject <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50/50 dark:bg-[#1E293B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer ${
                          errors.subject && touched.subject
                            ? 'border-rose-500 ring-2 ring-rose-500/20'
                            : 'border-slate-200 dark:border-white/10 focus:ring-indigo-500/20 focus:border-indigo-500'
                        }`}
                      >
                        <option value="" disabled className="dark:bg-slate-900">Select inquiry reason...</option>
                        {SUBJECT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} className="dark:bg-slate-900">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                    {errors.subject && touched.subject && (
                      <span className="text-[11px] font-medium text-rose-500 mt-1 block animate-fade-in flex items-center gap-1">
                        {errors.subject}
                      </span>
                    )}
                  </div>

                  {/* Row 5: Message */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label htmlFor="message" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Message / Details <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {formData.message.length}/2000
                      </span>
                    </div>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      maxLength={2000}
                      value={formData.message}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="Tell us about your rental portfolio size, specific requirements, or any questions..."
                      className={`w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50/50 dark:bg-white/[0.02] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all resize-y ${
                        errors.message && touched.message
                          ? 'border-rose-500 ring-2 ring-rose-500/20'
                          : 'border-slate-200 dark:border-white/10 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                    />
                    {errors.message && touched.message && (
                      <span className="text-[11px] font-medium text-rose-500 mt-1 block animate-fade-in flex items-center gap-1">
                        {errors.message}
                      </span>
                    )}
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