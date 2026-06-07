import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

// Helper to get theme key based on current user
const getThemeKey = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.email_id) {
        return `theme_${user.email_id.toLowerCase().trim()}`;
      }
    }
  } catch (e) {
    // Silent catch
  }
  return 'theme';
};

// Listeners setup to intercept login/logout in the same tab
if (typeof window !== 'undefined') {
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function (key, value) {
    originalSetItem.apply(this, arguments);
    if (key === 'user') {
      window.dispatchEvent(new Event('localstorage-user-changed'));
    }
  };

  const originalRemoveItem = localStorage.removeItem;
  localStorage.removeItem = function (key) {
    originalRemoveItem.apply(this, arguments);
    if (key === 'user') {
      window.dispatchEvent(new Event('localstorage-user-changed'));
    }
  };
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const key = getThemeKey();
    return localStorage.getItem(key) || localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const key = getThemeKey();
      const storedTheme = localStorage.getItem(key) || localStorage.getItem('theme') || 'dark';
      setTheme(storedTheme);
    };

    window.addEventListener('localstorage-user-changed', handleStorageChange);
    // Listen to storage event for multi-tab support
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('localstorage-user-changed', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
    const key = getThemeKey();
    localStorage.setItem(key, theme);
    // Sync with generic 'theme' too
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);