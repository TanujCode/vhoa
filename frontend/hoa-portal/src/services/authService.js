import API from './api';

// Get Current Rental User Profile
export const getRentalMe = async () => {
  const res = await API.get('/rental/auth/me');
  return res.data;
};

// Rental Logout
export const rentalLogout = () => {
  const keys = ['rental_token', 'rental_session_token', 'rental_user', 'token', 'session_token', 'access_token', 'user'];
  keys.forEach(k => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
  window.location.href = '/rental/login';
};

export const logout = rentalLogout;

// Check if logged in
export const isLoggedIn = () => {
  return !!(
    localStorage.getItem('rental_token') ||
    sessionStorage.getItem('rental_token') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token')
  );
};