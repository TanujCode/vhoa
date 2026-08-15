import axios from 'axios';

export const getApiUrl = (path = '') => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:9999/api';
  return `${baseURL}${path}`;
};

export const getBaseUrl = (path = '') => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:9999/api';
  const base = baseURL.endsWith('/api') ? baseURL.slice(0, -4) : baseURL;
  return `${base}${path}`;
};

const API = axios.create({
  baseURL: getApiUrl(),
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor ──
API.interceptors.request.use((config) => {
  const url = config.url || '';

  // Skip auth token for all public auth endpoints
  const isPublicAuthRoute =
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/otp/') ||
    url.includes('/auth/password/') ||
    url.includes('/auth/captcha') ||
    url.includes('/auth/google') ||
    url.includes('/auth/forgot-password');

  if (isPublicAuthRoute) return config;

  const isRentalRequest = url.includes('/rental/');
  const isCondoRequest  = url.includes('/condo/');

  let tokenKey = 'token';
  if (isRentalRequest) tokenKey = 'rental_token';
  else if (isCondoRequest) tokenKey = 'condo_token';

  const token =
    localStorage.getItem(tokenKey) ||
    sessionStorage.getItem(tokenKey) ||
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Helper to sanitize raw SQL / system exceptions into user-friendly messages
export const getCleanErrorMessage = (err, fallbackMessage = "An unexpected error occurred. Please try again.") => {
  const rawDetail = err?.response?.data?.detail || err?.response?.data?.message || err?.message;
  if (!rawDetail) return fallbackMessage;
  if (typeof rawDetail !== 'string') return fallbackMessage;
  
  const dLower = rawDetail.toLowerCase();
  if (
    dLower.includes('psycopg2') ||
    dLower.includes('undefinedcolumn') ||
    dLower.includes('syntax error') ||
    dLower.includes('sql:') ||
    dLower.includes('internal server error') ||
    dLower.includes('traceback') ||
    dLower.includes('sqlalchemy') ||
    dLower.includes('relation') ||
    dLower.includes('table') && dLower.includes('column')
  ) {
    return "A temporary database error occurred. Please try again or contact support.";
  }
  return rawDetail;
};

// ── Response interceptor ──
API.interceptors.response.use(
  (response) => {
    const method = response.config?.method?.toLowerCase();
    const url = response.config?.url || '';
    if (method && ['post', 'put', 'delete', 'patch'].includes(method) && url.includes('/rental/')) {
      try {
        window.dispatchEvent(new CustomEvent('rental-data-changed'));
      } catch (e) {
        console.warn("Failed to dispatch rental-data-changed event:", e);
      }
    }
    return response;
  },
  async (error) => {
    // Sanitize raw DB error strings in response data
    if (error.response?.data?.detail && typeof error.response.data.detail === 'string') {
      error.response.data.detail = getCleanErrorMessage(error);
    }

    const original = error.config;

    if (error.response?.status === 401 && !original._retry && !original.url.includes('/auth/login') && !original.url.includes('/auth/google')) {
      original._retry = true;

      const isRental = original.url.includes('/rental/');
      const isCondo = original.url.includes('/condo/');

      let sessionKey = 'session_token';
      let tokenKey = 'token';
      let refreshUrl = '/auth/refresh';
      let loginRedirectUrl = '/login';

      if (isRental) {
        sessionKey = 'rental_session_token';
        tokenKey = 'rental_token';
        refreshUrl = '/rental/auth/refresh';
        loginRedirectUrl = '/rental/login';
      } else if (isCondo) {
        sessionKey = 'condo_session_token';
        tokenKey = 'condo_token';
        refreshUrl = '/condo/auth/refresh';
        loginRedirectUrl = '/condo/login';
      }

      const sessionToken = localStorage.getItem(sessionKey) || sessionStorage.getItem(sessionKey);
      if (!sessionToken) {
        if (isRental) {
          localStorage.removeItem('rental_token');
          localStorage.removeItem('rental_user');
          localStorage.removeItem('rental_session_token');
          sessionStorage.removeItem('rental_token');
          sessionStorage.removeItem('rental_user');
          sessionStorage.removeItem('rental_session_token');
          window.location.href = '/rental/login';
        } else if (isCondo) {
          localStorage.removeItem('condo_token');
          localStorage.removeItem('condo_user');
          localStorage.removeItem('condo_session_token');
          sessionStorage.removeItem('condo_token');
          sessionStorage.removeItem('condo_user');
          sessionStorage.removeItem('condo_session_token');
          window.location.href = '/condo/login';
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('session_token');
          localStorage.removeItem('access_token');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('session_token');
          sessionStorage.removeItem('access_token');
          window.location.href = '/login'; 
        }
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(
          getApiUrl(refreshUrl),
          { session_token: sessionToken }
        );
        const newToken = res.data.access_token;
        
        // Save back to whichever storage contained the token
        if (localStorage.getItem(tokenKey)) {
          localStorage.setItem(tokenKey, newToken);
        } else if (sessionStorage.getItem(tokenKey)) {
          sessionStorage.setItem(tokenKey, newToken);
        } else if (isRental) {
          localStorage.setItem('rental_token', newToken);
        } else if (isCondo) {
          localStorage.setItem('condo_token', newToken);
        } else if (localStorage.getItem('access_token')) {
          localStorage.setItem('access_token', newToken);
        } else {
          sessionStorage.setItem('access_token', newToken);
        }

        original.headers.Authorization = `Bearer ${newToken}`;
        return API(original);
      } catch (err) {
        if (isRental) {
          localStorage.removeItem('rental_token');
          localStorage.removeItem('rental_user');
          localStorage.removeItem('rental_session_token');
          sessionStorage.removeItem('rental_token');
          sessionStorage.removeItem('rental_user');
          sessionStorage.removeItem('rental_session_token');
          window.location.href = '/rental/login';
        } else if (isCondo) {
          localStorage.removeItem('condo_token');
          localStorage.removeItem('condo_user');
          localStorage.removeItem('condo_session_token');
          sessionStorage.removeItem('condo_token');
          sessionStorage.removeItem('condo_user');
          sessionStorage.removeItem('condo_session_token');
          window.location.href = '/condo/login';
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('session_token');
          localStorage.removeItem('access_token');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('session_token');
          sessionStorage.removeItem('access_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default API;