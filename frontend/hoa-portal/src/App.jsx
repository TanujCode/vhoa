import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AdminPortal from './pages/auth/AdminPortal';
import ForgotPassword from './pages/auth/ForgotPassword';
import SearchAndJoinHOA from './pages/SearchAndJoinHOA';
import VerifyOtpPage from './pages/VerifyOtpPage';
import WaitingApproval from './pages/WaitingApproval';
import ClientOnboarding from './pages/auth/ClientOnboarding';

const ProtectedRoute = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  
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
        {/* --- Public Routes --- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/onboarding" element={<ClientOnboarding />} />

        {/* --- Private/Protected Routes --- */}
        <Route element={<ProtectedRoute />}>
          <Route path="/join-community" element={<SearchAndJoinHOA />} />
          
          <Route path="/waiting-approval" element={<WaitingApproval />} />
          
          {/* 3. Final Main Dashboard Portal view */}
          <Route path="/dashboard" element={<AdminPortal />} />
        </Route>

        {/* --- Redirects & Fallbacks --- */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
