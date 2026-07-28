import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AdminPortal from './pages/auth/AdminPortal';
import ForgotPassword from './pages/auth/ForgotPassword';
import SearchAndJoinHOA from './pages/SearchAndJoinHOA';
import VerifyOtpPage from './pages/VerifyOtpPage';
import WaitingApproval from './pages/WaitingApproval'; // 🔥 Waiting page ko import kiya
import ClientOnboarding from './pages/auth/ClientOnboarding';
import PortalSelect from './pages/auth/PortalSelect';

// Decoupled Rental Pages
import RentalLoginPage from './pages/rental/auth/RentalLoginPage';
import RentalRegisterPage from './pages/rental/auth/RentalRegisterPage';
import RentalForgotPassword from './pages/rental/auth/RentalForgotPassword';
import RentalVerifyOtpPage from './pages/rental/auth/RentalVerifyOtpPage';
import RentalAdminPortal from './pages/rental/RentalAdminPortal';


// Marketing pages
import LandingPage from './pages/marketing/LandingPage';
import FeaturesPage from './pages/marketing/FeaturesPage';
import PricingPage from './pages/marketing/PricingPage';
import AboutPage from './pages/marketing/AboutPage';
import ContactPage from './pages/marketing/ContactPage';
import SecurityPage from './pages/marketing/SecurityPage';
import ScrollToTop from './components/ScrollToTop';


// Solution subpages
import RentalSolutionPage from './pages/marketing/solutions/RentalSolutionPage';
import CondoSolutionPage from './pages/marketing/solutions/CondoSolutionPage';
import ApartmentSolutionPage from './pages/marketing/solutions/ApartmentSolutionPage';
import HoaSolutionPage from './pages/marketing/solutions/HoaSolutionPage';
import CondoLoginPage from './pages/condo/auth/CondoLoginPage';
import CondoRegisterPage from './pages/condo/auth/CondoRegisterPage';
import CondoVerifyOtpPage from './pages/condo/auth/CondoVerifyOtpPage';
import CondoForgotPassword from './pages/condo/auth/CondoForgotPassword';
import CondoOnboardingPage from './pages/condo/auth/CondoOnboardingPage';
import SearchAndJoinCondo from './pages/condo/SearchAndJoinCondo';
import CondoWaitingApproval from './pages/condo/CondoWaitingApproval';
import CondoAdminPortal from './pages/condo/CondoAdminPortal';
import CondoContracts from './pages/condo/CondoContracts';

// Smart Protected Route with Security Check
const ProtectedRoute = () => {
  const path = window.location.pathname;
  const isRentalPath = path.startsWith('/rental') || window.location.search.includes('role=tenant') || window.location.search.includes('role=landlord');
  const isCondoPath = path.startsWith('/condo');
  
  let tokenKey = 'token';
  if (isRentalPath) tokenKey = 'rental_token';
  else if (isCondoPath) tokenKey = 'condo_token';
  
  const token = localStorage.getItem(tokenKey) || sessionStorage.getItem(tokenKey) || localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  
  // Agar token nahi hai toh seedha corresponding login pe bhejo
  if (!token) {
    if (isRentalPath) return <Navigate to="/rental/login" replace />;
    if (isCondoPath) return <Navigate to="/condo/login" replace />;
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
      <Toaster 
        position="top-right" 
        toastOptions={{
          className: 'dark:bg-slate-800 dark:text-white',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          }
        }} 
      />
      <ScrollToTop />
      <Routes>
        {/* --- Marketing Routes --- */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/features" element={<FeaturesPage />} />

        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/solutions/rental" element={<RentalSolutionPage />} />
        <Route path="/solutions/condo" element={<CondoSolutionPage />} />
        <Route path="/solutions/apartment" element={<ApartmentSolutionPage />} />
        <Route path="/solutions/hoa" element={<HoaSolutionPage />} />

        {/* --- Public Routes --- */}
        <Route path="/portal-select" element={<PortalSelect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* --- Public Decoupled Rental Routes --- */}
        <Route path="/rental/login" element={<RentalLoginPage />} />
        <Route path="/rental/register" element={<RentalRegisterPage />} />
        <Route path="/rental/forgot-password" element={<RentalForgotPassword />} />
        <Route path="/rental/verify-otp" element={<RentalVerifyOtpPage />} />

        {/* --- Public Decoupled Condo Routes --- */}
        <Route path="/condo/login" element={<CondoLoginPage />} />
        <Route path="/condo/register" element={<CondoRegisterPage />} />
        <Route path="/condo/verify-otp" element={<CondoVerifyOtpPage />} />
        <Route path="/condo/forgot-password" element={<CondoForgotPassword />} />
        <Route path="/condo/onboard" element={<CondoOnboardingPage />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/onboarding" element={<ClientOnboarding />} />

        {/* --- Private/Protected Routes --- */}
        <Route element={<ProtectedRoute />}>
          {/* 1. User register ke baad yahan aayenge community search karne */}
          <Route path="/join-community" element={<SearchAndJoinHOA />} />
          <Route path="/condo/join-community" element={<SearchAndJoinCondo />} />
          
          {/* 2. 🔥 NEW ROUTE: Submit karne ke baad waiting lock standard map */}
          <Route path="/waiting-approval" element={<WaitingApproval />} />
          <Route path="/condo/waiting-approval" element={<CondoWaitingApproval />} />
          
          {/* 3. Final Main Dashboard Portal view */}
          <Route path="/dashboard" element={<AdminPortal />} />
          <Route path="/rental/dashboard" element={<RentalAdminPortal />} />
          <Route path="/condo/dashboard" element={<CondoAdminPortal />} />
          <Route path="/condo-contracts" element={<CondoContracts />} />
        </Route>

        {/* --- Redirects & Fallbacks --- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}