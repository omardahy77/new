import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { MarketTicker } from './MarketTicker';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { LogOut, LayoutDashboard, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useStore();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  // Custom NavLink matching the image (Inside the dark pill) - Smaller Size
  const NavLink = ({ to, label }: { to: string, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to} 
        onClick={() => window.scrollTo(0,0)}
        className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap flex items-center justify-center ${
          isActive 
            ? 'bg-[#FFD700] text-black shadow-[0_0_10px_rgba(255,215,0,0.4)]' 
            : 'text-gray-300 hover:text-white'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col shadow-2xl bg-transparent font-cairo" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* 1. Main Navbar (Fixed Top) */}
      <nav className={`w-full transition-all duration-300 border-b border-white/5 relative z-[102] ${scrolled ? 'bg-[#040711]/95 backdrop-blur-xl py-2' : 'bg-[#040711]/90 backdrop-blur-lg py-3'}`}>
        <div className="container-custom flex items-center justify-between h-full">
          
          {/* Right Side: Logo */}
          <Link to="/" className="relative z-50 flex-shrink-0 flex items-center gap-2" onClick={() => window.scrollTo(0,0)}>
            <Logo className={`${scrolled ? 'scale-90' : 'scale-100'} transition-transform duration-300`} />
          </Link>

          {/* Center: Navigation Menu (The Dark Pill Container) */}
          <div className="hidden lg:flex items-center justify-center flex-1 px-4">
            {/* This container mimics the dark background behind links in the image - Compact Padding */}
            <div className="flex items-center bg-[#0f1218] border border-white/10 rounded-full p-1 gap-1 shadow-lg backdrop-blur-md">
                <NavLink to="/" label={t('home')} />
                <NavLink to="/courses" label={t('courses')} />
                <NavLink to="/about" label={t('about')} />
                <NavLink to="/contact" label={t('contact')} />
            </div>
          </div>

          {/* Left Side: Auth & Language */}
          <div className="hidden lg:flex items-center gap-4">
            
            {/* Language Switcher (Outlined Box) - Smaller */}
            <button 
              onClick={toggleLanguage} 
              className="flex items-center justify-center px-2.5 py-1 text-[#FFD700] border border-[#FFD700]/30 rounded-lg hover:bg-white/5 transition-all font-bold text-[11px] tracking-wider shrink-0 h-8"
            >
              {language === 'ar' ? 'EN' : 'AR'}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                {user.role === 'admin' ? (
                  <Link to="/admin" className="flex items-center gap-2 px-4 py-2 bg-[#FFD700] text-black rounded-lg hover:bg-[#E6C200] transition-colors shadow-lg font-bold text-xs">
                    <LayoutDashboard size={16} />
                    <span>{t('dashboard')}</span>
                  </Link>
                ) : (
                  <Link to="/profile" className="flex items-center gap-3 ps-1 pe-4 py-1 bg-navy-800/50 rounded-full border border-white/10 backdrop-blur-sm h-9 hover:bg-navy-800 hover:border-gold-500/30 transition-all group">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-navy-950 font-bold text-xs shadow-lg">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-gold-400 transition-colors">{user.full_name || 'User'}</span>
                    </div>
                  </Link>
                )}

                <button 
                  onClick={handleSignOut} 
                  className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" 
                  title={t('logout')}
                >
                  <LogOut size={18} className="rtl:rotate-180" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {/* Login Text Link (White Text) - Smaller */}
                <Link to="/login" className="text-sm font-bold text-white hover:text-[#FFD700] transition-colors">
                  {t('login')}
                </Link>
                {/* Create Account Button (Yellow Rect) - Smaller/Compact */}
                <Link to="/register" className="bg-[#FFD700] hover:bg-[#E6C200] text-black px-6 py-2 rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(255,215,0,0.2)] hover:shadow-[0_0_25px_rgba(255,215,0,0.4)] transition-all transform hover:-translate-y-0.5">
                  {t('create_account_btn')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-3">
            <button onClick={toggleLanguage} className="text-[#FFD700] font-bold text-xs border border-white/20 px-3 py-1.5 rounded-lg hover:bg-white/5">
                {language === 'ar' ? 'EN' : 'AR'}
            </button>
            <button className="text-white p-2 hover:bg-white/5 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X size={28} className="text-[#FFD700]" /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`lg:hidden fixed top-full left-0 w-full bg-[#040711]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl transition-all duration-300 overflow-hidden z-[105] ${mobileMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="p-6 flex flex-col gap-3">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="p-4 rounded-xl bg-[#FFD700]/10 text-[#FFD700] font-bold flex items-center justify-between text-lg border border-[#FFD700]/20">
              {t('home')}
            </Link>
            <Link to="/courses" onClick={() => setMobileMenuOpen(false)} className="p-4 rounded-xl hover:bg-white/5 text-gray-300 font-bold text-lg transition-colors">{t('courses')}</Link>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="p-4 rounded-xl hover:bg-white/5 text-gray-300 font-bold text-lg transition-colors">{t('about')}</Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="p-4 rounded-xl hover:bg-white/5 text-gray-300 font-bold text-lg transition-colors">{t('contact')}</Link>
            
            <div className="h-px bg-white/10 my-4"></div>
            
            {!user ? (
              <div className="flex flex-col gap-3">
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn-gold py-4 text-center justify-center text-lg">{t('create_account_btn')}</Link>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-center py-3 text-gray-300 font-bold hover:text-white">{t('login')}</Link>
              </div>
            ) : (
               <div className="flex flex-col gap-4">
                  {user.role === 'admin' ? (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="p-4 bg-[#FFD700] text-black rounded-xl text-center font-bold text-lg">{t('dashboard')}</Link>
                  ) : (
                    <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 p-4 bg-navy-900 rounded-xl border border-white/5">
                        <div className="w-10 h-10 rounded-full bg-[#FFD700] flex items-center justify-center text-black font-bold text-lg">
                        {user.email.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-bold">{user.full_name}</span>
                    </Link>
                  )}
                  <button onClick={handleSignOut} className="p-4 bg-red-500/10 text-red-400 rounded-xl text-center font-bold border border-red-500/20 text-lg">{t('logout')}</button>
               </div>
            )}
          </div>
        </div>
      </nav>

      {/* 2. Ticker Bar */}
      <div className="h-10 bg-[#020305] relative z-[101] border-b border-white/5">
         <MarketTicker />
      </div>
    </div>
  );
};
