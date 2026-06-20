import React, { useState } from 'react';
import { Mail, Phone, MapPin, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    communityName: '',
    communitySize: '50-100',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // clear error for that field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
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
    if (!formData.phone.trim()) {
      tempErrors.phone = "Phone number is required";
    } else if (!/^[0-9+() -]{10,15}$/.test(formData.phone)) {
      tempErrors.phone = "Invalid phone format (min 10 digits)";
    }
    if (!formData.communityName.trim()) tempErrors.communityName = "Community name is required";
    if (!formData.message.trim()) tempErrors.message = "Message details are required";
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      
      // Simulate API submit delay
      setTimeout(() => {
        setIsSubmitting(false);
        setShowSuccessModal(true);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          communityName: '',
          communitySize: '50-100',
          message: ''
        });
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#120824] transition-colors duration-200 overflow-x-hidden font-sans">
      <Navbar />

      {/* --- Page Header --- */}
      <header className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center space-y-4">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#00A878]/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <span className="text-[#00A878] text-xs font-bold uppercase tracking-wider">Inquiries</span>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          Request a Custom Board Presentation
        </h1>
        <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">
          Need a proposal or custom quote for your homeowner committee? Fill out the details below and we will prepare a demo presentation package.
        </p>
      </header>

      {/* --- Main Section split in two columns --- */}
      <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          
          {/* Column 1: Contact Details & Mock Map */}
          <div className="lg:col-span-5 space-y-8 flex flex-col justify-between">
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Connect with Us</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Whether you represent a 15-apartment complex or a multi-phase gated township with 1,200 villas, our onboarding experts have tailored setups.
              </p>
              
              <div className="space-y-4">
                
                {/* Phone */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#00A878]/10 text-[#00A878] rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Call Sales Support</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">+91 98765 43210</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#00A878]/10 text-[#00A878] rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Email Inquiry</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">onboarding@nestbloq.com</p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#00A878]/10 text-[#00A878] rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Headquarters</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">HSR Layout, Sector 6, Bengaluru, Karnataka, India</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Mock CSS Map widget */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between aspect-[1.8] shadow-xs">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00A878]/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <span className="bg-[#00A878]/15 text-[#00A878] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Bengaluru Office</span>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-2">Find us at HSR Plaza</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Plot 45, Sector 6, HSR Main Road</p>
              </div>
              <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 border-t border-slate-200/50 dark:border-slate-800 pt-3">
                <span>📍 Located near HSR Club</span>
                <span className="text-[#00A878] hover:underline cursor-pointer">Open Maps Directions →</span>
              </div>
            </div>

          </div>

          {/* Column 2: Inquiry Form */}
          <div className="lg:col-span-7 bg-white dark:bg-[#162535] border border-slate-100 dark:border-slate-800/80 p-6 sm:p-8 rounded-3xl shadow-md flex flex-col justify-between">
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
                    placeholder="Vikash"
                    className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border text-sm rounded-xl outline-none focus:ring-2 focus:ring-[#00A878] focus:border-transparent text-gray-900 dark:text-gray-100 ${
                      errors.firstName ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
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
                    placeholder="Kumar"
                    className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border text-sm rounded-xl outline-none focus:ring-2 focus:ring-[#00A878] focus:border-transparent text-gray-900 dark:text-gray-100 ${
                      errors.lastName ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  />
                  {errors.lastName && <p className="text-red-500 text-[10px] font-semibold mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.lastName}</p>}
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Email */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Work Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="pm@company.com"
                    className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border text-sm rounded-xl outline-none focus:ring-2 focus:ring-[#00A878] focus:border-transparent text-gray-900 dark:text-gray-100 ${
                      errors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  />
                  {errors.email && <p className="text-red-500 text-[10px] font-semibold mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Phone Number *</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 9876543210"
                    className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border text-sm rounded-xl outline-none focus:ring-2 focus:ring-[#00A878] focus:border-transparent text-gray-900 dark:text-gray-100 ${
                      errors.phone ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  />
                  {errors.phone && <p className="text-red-500 text-[10px] font-semibold mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.phone}</p>}
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Community name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Community Name *</label>
                  <input
                    type="text"
                    name="communityName"
                    value={formData.communityName}
                    onChange={handleInputChange}
                    placeholder="Green Park Society"
                    className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border text-sm rounded-xl outline-none focus:ring-2 focus:ring-[#00A878] focus:border-transparent text-gray-900 dark:text-gray-100 ${
                      errors.communityName ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  />
                  {errors.communityName && <p className="text-red-500 text-[10px] font-semibold mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.communityName}</p>}
                </div>

                {/* Community size dropdown */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Community Size *</label>
                  <select
                    name="communitySize"
                    value={formData.communitySize}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm rounded-xl outline-none focus:ring-2 focus:ring-[#00A878] text-gray-950 dark:text-slate-200 font-semibold"
                  >
                    <option value="under-50">Under 50 Units</option>
                    <option value="50-100">50 - 100 Units</option>
                    <option value="101-250">101 - 250 Units</option>
                    <option value="above-250">Above 250 Units</option>
                  </select>
                </div>

              </div>

              {/* Message Details */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Additional Requirements *</label>
                <textarea
                  name="message"
                  rows="4"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Tell us about your HOA bylaws, amenities, or typical support issues..."
                  className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border text-sm rounded-xl outline-none focus:ring-2 focus:ring-[#00A878] focus:border-transparent text-gray-900 dark:text-gray-100 resize-none ${
                    errors.message ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                  }`}
                />
                {errors.message && <p className="text-red-500 text-[10px] font-semibold mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#00A878] hover:bg-[#008f65] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting Inquiry..." : "Submit Presentation Request"}
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* --- SUCCESS MODAL OVERLAY --- */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#162535] rounded-3xl max-w-md w-full border border-slate-100 dark:border-slate-800 p-8 text-center space-y-5 shadow-2xl relative">
            <div className="w-16 h-16 bg-[#00A878]/10 text-[#00A878] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex justify-center items-center gap-1.5">
                Inquiry Received!
                <Sparkles size={16} className="text-yellow-500" />
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Thank you! Your community proposal request has been logged. One of our onboarding experts will review your units and send a demo calendar link to your email address within the next 24 hours.
              </p>
            </div>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 bg-[#00A878] hover:bg-[#008f65] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95"
            >
              Back to Inquiries
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
