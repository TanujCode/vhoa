import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Check, ArrowRight } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  const socialLinks = [
    { name: 'X (Twitter)', href: '#', svg: <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg> },
    { name: 'LinkedIn', href: '#', svg: <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg> },
    { name: 'Instagram', href: '#', svg: <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg> }
  ];

  const links = {
    Platform: [
      { name: 'Features', path: '/features' },
      { name: 'Pricing', path: '/pricing' },
      { name: 'Security', path: '/security' },
      { name: 'Integrations', path: '#' },
    ],
    Products: [
      { name: 'Rental Property Management', path: '/solutions/rental' },
      { name: 'Condo Management', path: '/solutions/condo' },
      { name: 'Apartment Portal', path: '/solutions/apartment' },
      { name: 'HOA Governance', path: '/solutions/hoa' },
    ],
    Company: [
      { name: 'About Us', path: '/about' },
      { name: 'Contact Sales', path: '/contact' },
      { name: 'Careers', path: '#' },
      { name: 'Press', path: '#' },
    ]
  };

  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-[#120824] via-[#1a0c33] to-[#0a0414] text-slate-100 border-t border-white/[0.06] transition-colors duration-300">
      
      {/* Multicolored premium border top line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500/30 via-indigo-500/50 to-blue-500/30 z-10" />

      {/* Blurred background radial glow lights */}
      <div className="absolute -top-12 left-1/4 w-[400px] h-[300px] bg-gradient-radial from-violet-500/[0.08] to-transparent rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute -bottom-24 right-1/4 w-[350px] h-[250px] bg-gradient-radial from-indigo-500/[0.06] to-transparent rounded-full blur-3xl pointer-events-none z-0" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-12 pb-8 z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 text-left">

          {/* Brand column */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/" className="flex items-center group w-fit">
              <Logo className="h-8" forceWhite={true} />
            </Link>

            <p className="text-sm text-slate-400 leading-relaxed max-w-xs font-normal">
              NestBloq helps property managers and HOA boards unify operations, automate dues, and build better community experiences.
            </p>
          </div>

          {/* Link columns with Sliding hover animations */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group} className="lg:col-span-2 space-y-4">
              <h5 className="text-xs font-black uppercase tracking-wider text-slate-200">{group}</h5>
              <ul className="space-y-3">
                {items.map((item, i) => (
                  <li key={i}>
                    <Link 
                      to={item.path} 
                      className="inline-block text-sm text-slate-400 hover:text-violet-400 hover:translate-x-1 transition-all duration-200"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* CTA column */}
          <div className="lg:col-span-2 space-y-4">
            <h5 className="text-xs font-black uppercase tracking-wider text-slate-200">Get Started</h5>
            <div className="space-y-2.5">
              <Link to="/register" className="btn-glow w-full text-center py-3 text-sm font-semibold text-white rounded-xl flex items-center justify-center gap-1.5 group">
                Free Trial <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/contact" className="w-full text-center py-3 text-sm font-bold text-slate-350 rounded-xl border border-white/[0.08] bg-[#1a102b]/40 hover:bg-white/[0.03] hover:border-violet-500/20 transition-all block">
                Book Demo
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} NestBloq Technologies Pvt Ltd. All rights reserved.</p>
          <div className="flex flex-wrap gap-6 text-xs text-slate-500">
            {['Privacy Policy', 'Terms of Service', 'Cookie Preferences'].map((item) => (
              <a key={item} href="#" className="hover:text-violet-400 transition-colors duration-150">{item}</a>
            ))}
            <Link to="/security" className="hover:text-violet-400 transition-colors duration-150">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
