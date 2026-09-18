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
  // Clear any persistent theme keys from localStorage so light mode is default
  try {
    localStorage.removeItem('theme');
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('theme_')) {
        localStorage.removeItem(k);
      }
    });
  } catch (e) {
    // Silent catch
  }

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
    return sessionStorage.getItem(key) || sessionStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const key = getThemeKey();
      const storedTheme = sessionStorage.getItem(key) || sessionStorage.getItem('theme') || 'light';
      setTheme(storedTheme);
    };

    window.addEventListener('localstorage-user-changed', handleStorageChange);
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
    sessionStorage.setItem(key, theme);
    sessionStorage.setItem('theme', theme);
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