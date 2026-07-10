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
  if (config.url.includes('/auth/login') || config.url.includes('/auth/register')) {
    return config;
  }

  const isRentalRequest = config.url.includes('/rental/');
  const tokenKey = isRentalRequest ? 'rental_token' : 'token';
  const token = localStorage.getItem(tokenKey) || sessionStorage.getItem(tokenKey) || localStorage.getItem('access_token') || sessionStorage.getItem('access_token'); 
  
  console.log("DEBUG API Request interceptor:", {
    url: config.url,
    isRentalRequest,
    tokenKey,
    tokenPresent: !!token,
    tokenPrefix: token ? token.substring(0, 15) + "..." : "none"
  });

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// ── Response interceptor ──
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry && !original.url.includes('/auth/login') && !original.url.includes('/auth/google')) {
      original._retry = true;

      const isRental = original.url.includes('/rental/');
      const sessionKey = isRental ? 'rental_session_token' : 'session_token';
      const tokenKey = isRental ? 'rental_token' : 'token';
      const refreshUrl = isRental ? '/rental/auth/refresh' : '/auth/refresh';

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