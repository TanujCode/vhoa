import API from './api';

// ── Login ─────────────────────────────────────
export const login = async (email_id, password) => {
  const res = await API.post('/auth/login', { email_id, password });
  const { access_token, session_token } = res.data;

  // Dono tokens localStorage mein save karo
  localStorage.setItem('access_token', access_token);
  localStorage.setItem('session_token', session_token);

  return res.data;
};

// ── Get Current User ──────────────────────────
export const getMe = async () => {
  const res = await API.get('/auth/me');
  return res.data;
};

// ── Logout ────────────────────────────────────
export const logout = async () => {
  try {
    await API.post('/auth/logout');
  } catch {}
  localStorage.removeItem('access_token');
  localStorage.removeItem('session_token');
  window.location.href = '/login';
};

// ── OTP Send ─────────────────────────────────
export const sendOtp = async (email_id, otp_type) => {
  const res = await API.post('/auth/otp/send', { email_id, otp_type });
  return res.data;
};

// ── OTP Verify ────────────────────────────────
export const verifyOtp = async (email_id, otp_code, otp_type) => {
  const res = await API.post('/auth/otp/verify', { email_id, otp_code, otp_type });
  return res.data;
};

// ── Check if logged in ────────────────────────
export const isLoggedIn = () => {
  return !!localStorage.getItem('access_token');
};