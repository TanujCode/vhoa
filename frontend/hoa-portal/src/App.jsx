import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AdminPortal from './pages/auth/AdminPortal';
import ForgotPassword from './pages/auth/ForgotPassword';
import SearchAndJoinHOA from './pages/SearchAndJoinHOA';
import VerifyOtpPage from './pages/VerifyOtpPage';
import WaitingApproval from './pages/WaitingApproval'; // 🔥 Waiting page ko import kiya
import ClientOnboarding from './pages/auth/ClientOnboarding';

// Marketing pages
import LandingPage from './pages/marketing/LandingPage';
import FeaturesPage from './pages/marketing/FeaturesPage';
import PricingPage from './pages/marketing/PricingPage';
import AboutPage from './pages/marketing/AboutPage';
import ContactPage from './pages/marketing/ContactPage';
import HowItWorksPage from './pages/marketing/HowItWorksPage';

// Solution subpages
import RentalSolutionPage from './pages/marketing/solutions/RentalSolutionPage';
import CondoSolutionPage from './pages/marketing/solutions/CondoSolutionPage';
import ApartmentSolutionPage from './pages/marketing/solutions/ApartmentSolutionPage';
import HoaSolutionPage from './pages/marketing/solutions/HoaSolutionPage';


// Smart Protected Route with Security Check
const ProtectedRoute = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  
  // Agar token nahi hai toh seedha login pe bhejo
  if (!token) {
    return <Navigate to="/login" replace />;
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
      <Routes>
        {/* --- Marketing Routes --- */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/solutions/rental" element={<RentalSolutionPage />} />
        <Route path="/solutions/condo" element={<CondoSolutionPage />} />
        <Route path="/solutions/apartment" element={<ApartmentSolutionPage />} />
        <Route path="/solutions/hoa" element={<HoaSolutionPage />} />

        {/* --- Public Routes --- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/onboarding" element={<ClientOnboarding />} />

        {/* --- Private/Protected Routes --- */}
        <Route element={<ProtectedRoute />}>
          {/* 1. User register ke baad yahan aayenge community search karne */}
          <Route path="/join-community" element={<SearchAndJoinHOA />} />
          
          {/* 2. 🔥 NEW ROUTE: Submit karne ke baad waiting lock standard map */}
          <Route path="/waiting-approval" element={<WaitingApproval />} />
          
          {/* 3. Final Main Dashboard Portal view */}
          <Route path="/dashboard" element={<AdminPortal />} />
        </Route>

        {/* --- Redirects & Fallbacks --- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}