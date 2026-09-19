import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Decoupled Rental Pages
import RentalLoginPage from './pages/rental/auth/RentalLoginPage';
import RentalRegisterPage from './pages/rental/auth/RentalRegisterPage';
import RentalForgotPassword from './pages/rental/auth/RentalForgotPassword';
import RentalVerifyOtpPage from './pages/rental/auth/RentalVerifyOtpPage';
import RentalAdminPortal from './pages/rental/RentalAdminPortal';

// Marketing pages
import LandingPage from './pages/marketing/LandingPage';
import PricingPage from './pages/marketing/PricingPage';
import AboutPage from './pages/marketing/AboutPage';
import ContactPage from './pages/marketing/ContactPage';
import SecurityPage from './pages/marketing/SecurityPage';
import RentalSolutionPage from './pages/marketing/solutions/RentalSolutionPage';

import ScrollToTop from './components/ScrollToTop';
import GlobalModal from './components/GlobalModal';
import { toast } from 'react-hot-toast';

// Globally override react-hot-toast functions to show in the center modal (via window.alert)
try {
  const overrideToast = (msg) => {
    if (msg) window.alert(msg);
    return 'toast-id';
  };
  toast.success = overrideToast;
  toast.error = overrideToast;
  toast.loading = overrideToast;
  toast.custom = (content) => {
    if (typeof content === 'string') {
      window.alert(content);
    }
    return 'toast-id';
  };
} catch (err) {
  console.error("Failed to override toast:", err);
}

// Smart Protected Route for Rental Dashboard
const ProtectedRentalRoute = () => {
  const token = localStorage.getItem('rental_token') || sessionStorage.getItem('rental_token') || localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  
  if (!token) {
    return <Navigate to="/rental/login" replace />;
  }

  return <Outlet />;
};

export default function App() {
  React.useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  return (
    <BrowserRouter>
      <Toaster 
        position="top-center" 
        toastOptions={{
          className: 'dark:bg-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-2xl',
          style: {
            borderRadius: '16px',
            background: '#ffffff',
            color: '#0f172a',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          },
        }} 
      />
      <ScrollToTop />
      <GlobalModal />
      <Routes>
        {/* --- Marketing Routes --- */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/solutions/rental" element={<RentalSolutionPage />} />

        {/* --- Public Rental Authentication Routes --- */}
        <Route path="/rental/login" element={<RentalLoginPage />} />
        <Route path="/rental/register" element={<RentalRegisterPage />} />
        <Route path="/rental/forgot-password" element={<RentalForgotPassword />} />
        <Route path="/rental/verify-otp" element={<RentalVerifyOtpPage />} />

        {/* --- Protected Rental Routes --- */}
        <Route element={<ProtectedRentalRoute />}>
          <Route path="/rental/dashboard" element={<RentalAdminPortal />} />
        </Route>

        {/* --- Legacy & Convenience Redirects --- */}
        <Route path="/login" element={<Navigate to="/rental/login" replace />} />
        <Route path="/register" element={<Navigate to="/rental/register" replace />} />
        <Route path="/dashboard" element={<Navigate to="/rental/dashboard" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/rental/forgot-password" replace />} />
        <Route path="/verify-otp" element={<Navigate to="/rental/verify-otp" replace />} />
        <Route path="/portal-select" element={<Navigate to="/rental/login" replace />} />
        <Route path="/features" element={<Navigate to="/#features" replace />} />
        <Route path="/solutions/*" element={<Navigate to="/solutions/rental" replace />} />

        {/* --- Fallback Route --- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}