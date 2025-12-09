import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const NotFound: React.FC = () => {
  const { t, dir } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-navy-950 text-white p-6 text-center relative overflow-hidden" dir={dir}>
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gold-500/5 blur-[150px] rounded-full -z-10"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-600/5 blur-[150px] rounded-full -z-10"></div>

      <div className="glass-card p-12 max-w-lg w-full border-gold-500/20 shadow-[0_0_50px_rgba(255,215,0,0.05)]">
        <div className="w-24 h-24 bg-navy-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-gold-500/30 shadow-inner relative">
           <div className="absolute inset-0 bg-gold-500/10 rounded-full animate-pulse"></div>
           <AlertTriangle size={48} className="text-gold-500 relative z-10" />
        </div>
        
        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 mb-2">404</h1>
        <h2 className="text-2xl font-bold text-white mb-4">{dir === 'rtl' ? 'الصفحة غير موجودة' : 'Page Not Found'}</h2>
        
        <p className="text-gray-400 mb-8 leading-relaxed">
          {dir === 'rtl' 
            ? 'عذراً، الرابط الذي تحاول الوصول إليه غير صحيح أو تم نقله.' 
            : 'Sorry, the link you followed may be broken, or the page may have been removed.'}
        </p>
        
        <Link to="/" className="btn-gold w-full py-4 flex items-center justify-center gap-2 font-bold text-lg shadow-lg shadow-gold-500/10">
           <Home size={20} /> {t('back_home')}
        </Link>
      </div>
    </div>
  );
};
