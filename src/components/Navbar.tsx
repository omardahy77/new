import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { MarketTicker } from './MarketTicker';
import { useStore } from '../context/Store';
import { LogOut, LayoutDashboard, Menu, X, ShieldCheck, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useStore();
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

  const NavLink = ({ to, label }: { to: string, label: string }) => (
    <Link 
      to={to} 
      onClick={() => window.scrollTo(0,0)}
      className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
        location.pathname === to 
          ? 'bg-gold-500 text-navy-950 shadow-lg shadow-gold-500/20' 
          : 'text-gray-300 hover:text-white hover:bg-white/5'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col shadow-2xl bg-navy-950">
      {/* 1. Main Navbar (Fixed Top) */}
      <nav className={`w-full transition-all duration-300 border-b border-white/5 relative z-[102] ${scrolled ? 'bg-navy-950/95 backdrop-blur-xl py-2' : 'bg-navy-900/95 backdrop-blur-lg py-3'}`}>
        <div className="container-custom flex items-center justify-between h-full">
          
          {/* Logo */}
          <Link to="/" className="relative z-50 flex-shrink-0" onClick={() => window.scrollTo(0,0)}>
            <Logo className={`${scrolled ? 'scale-90' : 'scale-100'} transition-transform duration-300`} />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-1 bg-white/5 p-1.5 rounded-full border border-white/5 backdrop-blur-md mx-4">
            <NavLink to="/" label="الرئيسية" />
            <NavLink to="/courses" label="الكورسات" />
            <NavLink to="/about" label="من نحن" />
            <NavLink to="/contact" label="تواصل معنا" />
          </div>

          {/* Auth Buttons / User Profile */}
          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {user.role === 'admin' && (
                  <Link to="/admin" className="flex items-center gap-2 px-4 py-2 bg-gold-500/10 text-gold-400 rounded-xl hover:bg-gold-500/20 transition-colors border border-gold-500/20 group">
                    <LayoutDashboard size={18} className="group-hover:rotate-3 transition-transform" />
                    <span className="text-xs font-bold">لوحة التحكم</span>
                  </Link>
                )}
                <div className="flex items-center gap-3 pl-2 pr-4 py-1.5 bg-navy-800/50 rounded-full border border-white/10 backdrop-blur-sm">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-navy-950 font-bold text-sm shadow-lg">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">{user.email.split('@')[0]}</span>
                    <span className={`text-[10px] flex items-center gap-1 ${user.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                      <ShieldCheck size={10} /> {user.status === 'active' ? 'عضو نشط' : 'معلق'}
                    </span>
                  </div>
                </div>
                <button onClick={handleSignOut} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all" title="تسجيل الخروج">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-bold text-gray-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
                  تسجيل الدخول
                </Link>
                <Link to="/register" className="btn-gold px-6 py-2.5 text-sm shadow-lg shadow-gold-500/10">
                  إنشاء حساب
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="lg:hidden text-white p-2 hover:bg-white/5 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={28} className="text-gold-500" /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu Overlay - FIXED Z-INDEX to cover Ticker */}
        <div className={`lg:hidden fixed top-full left-0 w-full bg-navy-950/95 backdrop-blur-xl border-b border-white/10 shadow-2xl transition-all duration-300 overflow-hidden z-[105] ${mobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="p-4 flex flex-col gap-2">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="p-4 rounded-xl bg-white/5 text-gold-400 font-bold flex items-center justify-between">
              الرئيسية <UserIcon size={16} className="opacity-0" />
            </Link>
            <Link to="/courses" onClick={() => setMobileMenuOpen(false)} className="p-4 rounded-xl hover:bg-white/5 text-right text-gray-300 font-medium transition-colors">الكورسات</Link>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="p-4 rounded-xl hover:bg-white/5 text-right text-gray-300 font-medium transition-colors">من نحن</Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="p-4 rounded-xl hover:bg-white/5 text-right text-gray-300 font-medium transition-colors">تواصل معنا</Link>
            
            <div className="h-px bg-white/10 my-2"></div>
            
            {!user ? (
              <div className="grid grid-cols-2 gap-3">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn-glass py-3 text-center justify-center">دخول</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn-gold py-3 text-center justify-center">تسجيل</Link>
              </div>
            ) : (
               <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 p-3 bg-navy-900 rounded-xl border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center text-navy-950 font-bold">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{user.email}</p>
                      <p className="text-xs text-gray-400">{user.status === 'active' ? 'عضو نشط' : 'في الانتظار'}</p>
                    </div>
                  </div>
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="p-3 bg-gold-500/10 text-gold-400 rounded-xl text-center font-bold border border-gold-500/20">لوحة التحكم</Link>
                  )}
                  <button onClick={handleSignOut} className="p-3 bg-red-500/10 text-red-400 rounded-xl text-center font-bold border border-red-500/20">تسجيل الخروج</button>
               </div>
            )}
          </div>
        </div>
      </nav>

      {/* 2. Ticker Bar (Fixed Below Navbar) */}
      <div className="h-10 bg-navy-950 relative z-[101] border-b border-white/5">
         <MarketTicker />
      </div>
    </div>
  );
};
