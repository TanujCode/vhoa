import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Menu, X, ChevronDown } from 'lucide-react';
import Logo from './Logo';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showRegisterDropdown, setShowRegisterDropdown] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: 'Features', path: '#features' },
    { name: 'Products', path: '#solutions' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const handleNavClick = (e, link) => {
    if (link.path.startsWith('#')) {
      e.preventDefault();
      const targetId = link.path.substring(1);
      
      if (window.location.pathname === '/') {
        // If already on landing page, scroll smoothly
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        // Redirect to home page with hash
        window.location.href = `/${link.path}`;
      }
      setMobileMenuOpen(false);
    }
  };

  const isActive = (path) => {
    if (path.startsWith('#')) {
      return window.location.pathname === '/' && window.location.hash === path;
    }
    return location.pathname === path;
  };

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 dark:bg-[#07060f]/85 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/[0.06] shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]'
          : 'bg-white/50 dark:bg-[#07060f]/50 backdrop-blur-md border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center group shrink-0">
            <Logo className="h-8" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={(e) => handleNavClick(e, link)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.path)
                    ? 'text-violet-600 dark:text-violet-400 bg-violet-500/8 dark:bg-violet-500/12'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/8 transition-all duration-200 animate-pulse-glow"
              title="Toggle theme"
            >
              {theme === 'dark'
                ? <Sun size={17} strokeWidth={1.8} />
                : <Moon size={17} strokeWidth={1.8} />}
            </button>

            {/* Sign In */}
            <Link
              to="/portal-select"
              className="px-4 py-2 text-sm font-semibold text-slate-650 dark:text-slate-400 hover:text-slate-905 dark:hover:text-white transition-colors duration-200"
            >
              Sign in
            </Link>

            {/* Get Started Button */}
            <Link
              to="/portal-select"
              className="btn-glow px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Icon */}
          <div className="flex md:hidden items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/8 transition-all">
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/8 transition-all"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-white/[0.06] bg-white/95 dark:bg-[#07060f]/95 backdrop-blur-2xl">
          <div className="px-5 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={(e) => handleNavClick(e, link)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive(link.path)
                    ? 'text-violet-600 dark:text-violet-400 bg-violet-500/8'
                    : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                {link.name}
              </Link>
            ))}

             <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] space-y-4 px-2">
              <Link
                to="/portal-select"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all block bg-slate-50/50 dark:bg-white/[0.02]"
              >
                Sign in to Gateway
              </Link>
              
              <div className="pt-2">
                <Link
                  to="/portal-select"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-glow text-center py-2.5 rounded-xl text-xs font-bold text-white transition-all block"
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
