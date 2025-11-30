import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { MarketTicker } from './MarketTicker';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { LogOut, LayoutDashboard, Menu, X, ShieldCheck, User as UserIcon, Settings } from 'lucide-react';

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

  // Updated NavLink to match the "Pill" design
  const NavLink = ({ to, label }: { to: string, label: string }) => (
    <Link 
      to={to} 
      onClick={() => window.scrollTo(0,0)}
      className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap flex items-center justify-center ${
        location.pathname === to 
          ? 'bg-gold-500 text-navy-950 shadow-[0_0_20px_rgba(255,215,0,0.3)]' 
          : 'text-gray-300 hover:text-white hover:bg-white/5'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col shadow-2xl bg-transparent">
      {/* 1. Main Navbar (Fixed Top) */}
      <nav className={`w-full transition-all duration-300 border-b border-white/5 relative z-[102] ${scrolled ? 'bg-navy-950/95 backdrop-blur-xl py-2' : 'bg-navy-900/95 backdrop-blur-lg py-3'}`}>
        <div className="container-custom flex items-center justify-between h-full">
          
          {/* Logo */}
          <Link to="/" className="relative z-50 flex-shrink-0" onClick={() => window.scrollTo(0,0)}>
            <Logo className={`${scrolled ? 'scale-90' : 'scale-95'} transition-transform duration-300 origin-right rtl:origin-right ltr:origin-left`} />
          </Link>

          {/* Desktop Menu - Pill Container Design */}
          <div className="hidden lg:flex items-center justify-center flex-1 px-4">
            <div className="flex items-center gap-1 p-1.5 bg-[#0C1220] border border-white/10 rounded-full shadow-lg backdrop-blur-md">
                <NavLink to="/" label={t('home')} />
                <NavLink to="/courses" label={t('courses')} />
                <NavLink to="/about" label={t('about')} />
                <NavLink to="/contact" label={t('contact')} />
            </div>
          </div>

          {/* Auth Buttons / User Profile */}
          <div className="hidden lg:flex items-center gap-3">
            
            {/* Language Switcher */}
            <button 
              onClick={toggleLanguage} 
              className="flex items-center justify-center w-9 h-9 text-gold-500 hover:bg-white/5 border border-gold-500/20 rounded-lg transition-all font-bold text-xs tracking-wider shrink-0"
              title={language === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
            >
              {language === 'ar' ? 'EN' : 'AR'}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                {user.role === 'admin' ? (
                  // Admin View: Dashboard Button ONLY (No Profile Pill)
                  <Link to="/admin" className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-navy-950 rounded-lg hover:bg-gold-400 transition-colors shadow-md shadow-gold-500/20 group whitespace-nowrap h-9 shrink-0 font-bold text-sm">
                    <LayoutDashboard size={16} className="group-hover:rotate-3 transition-transform" />
                    <span>{t('dashboard')}</span>
                  </Link>
                ) : (
                  // Student View: Clickable Profile Pill
                  <Link to="/profile" className="flex items-center gap-3 ps-1 pe-4 py-1 bg-navy-800/50 rounded-full border border-white/10 backdrop-blur-sm h-9 shrink-0 max-w-[200px] hover:bg-navy-800 hover:border-gold-500/30 transition-all group">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-navy-950 font-bold text-xs shadow-lg shrink-0 group-hover:scale-105 transition-transform">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
                      <span className="text-xs font-bold text-white truncate max-w-[80px] group-hover:text-gold-400 transition-colors">{user.full_name || user.email.split('@')[0]}</span>
                      <span className="text-gray-600 text-[10px] shrink-0">|</span>
                      <span className={`text-[10px] flex items-center gap-1 shrink-0 ${user.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                        <ShieldCheck size={10} />
                      </span>
                    </div>
                  </Link>
                )}

                {/* Logout Button - Flipped in RTL */}
                <button 
                  onClick={handleSignOut} 
                  className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/20 shrink-0" 
                  title={t('logout')}
                >
                  <LogOut size={18} className="rtl:rotate-180" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm font-bold text-gray-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5 whitespace-nowrap">
                  {t('login')}
                </Link>
                <Link to="/register" className="btn-gold px-5 py-2 text-sm shadow-md shadow-gold-500/10 whitespace-nowrap rounded-lg">
                  {t('register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-3">
            <button onClick={toggleLanguage} className="text-gold-500 font-bold text-xs border border-gold-500/20 px-3 py-1.5 rounded-lg hover:bg-white/5">
                {language === 'ar' ? 'EN' : 'AR'}
            </button>
            <button className="text-white p-2 hover:bg-white/5 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X size={28} className="text-gold-500" /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`lg:hidden fixed top-full left-0 w-full bg-navy-950/95 backdrop-blur-xl border-b border-white/10 shadow-2xl transition-all duration-300 overflow-hidden z-[105] ${mobileMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="p-6 flex flex-col gap-3">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="p-4 rounded-xl bg-white/5 text-gold-400 font-bold flex items-center justify-between text-lg">
              {t('home')} <UserIcon size={20} className="opacity-0" />
            </Link>
            <Link to="/courses" onClick={() => setMobileMenuOpen(false)} className="p-4 rounded-xl hover:bg-white/5 text-gray-300 font-bold text-lg transition-colors">{t('courses')}</Link>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="p-4 rounded-xl hover:bg-white/5 text-gray-300 font-bold text-lg transition-colors">{t('about')}</Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="p-4 rounded-xl hover:bg-white/5 text-gray-300 font-bold text-lg transition-colors">{t('contact')}</Link>
            
            <div className="h-px bg-white/10 my-4"></div>
            
            {!user ? (
              <div className="grid grid-cols-2 gap-4">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn-glass py-4 text-center justify-center text-lg">{t('login')}</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn-gold py-4 text-center justify-center text-lg">{t('register')}</Link>
              </div>
            ) : (
               <div className="flex flex-col gap-4">
                  {user.role !== 'admin' && (
                    <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 p-4 bg-navy-900 rounded-xl border border-white/5 hover:border-gold-500/30 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-gold-500 flex items-center justify-center text-navy-950 font-bold text-xl">
                        {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                        <p className="text-base font-bold text-white">{user.full_name || user.email}</p>
                        <p className="text-sm text-gray-400">{user.status === 'active' ? t('active_member') : t('pending_member')}</p>
                        </div>
                        <Settings className="text-gold-500 mr-auto" size={20} />
                    </Link>
                  )}
                  
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="p-4 bg-gold-500/10 text-gold-400 rounded-xl text-center font-bold border border-gold-500/20 text-lg">{t('dashboard')}</Link>
                  )}
                  <button onClick={handleSignOut} className="p-4 bg-red-500/10 text-red-400 rounded-xl text-center font-bold border border-red-500/20 text-lg">{t('logout')}</button>
               </div>
            )}
          </div>
        </div>
      </nav>

      {/* 2. Ticker Bar */}
      <div className="h-10 bg-navy-900/60 backdrop-blur-md relative z-[101] border-b border-white/5">
         <MarketTicker />
      </div>
    </div>
  );
};
