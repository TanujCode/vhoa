import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:9999/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — access token attach ──
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// ── Response interceptor — auto refresh ────────
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // 401 aaya → access token expire hua
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const sessionToken = localStorage.getItem('session_token');
      if (!sessionToken) {
        // Session bhi nahi → logout
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Naya access token lo
        const res = await axios.post(
          'http://127.0.0.1:9999/api/auth/refresh',
          { session_token: sessionToken }
        );
        const newToken = res.data.access_token;
        localStorage.setItem('access_token', newToken);

        // Original request retry karo
        original.headers.Authorization = `Bearer ${newToken}`;
        return API(original);
      } catch {
        // Refresh bhi fail → logout
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default API;