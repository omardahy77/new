import React from 'react';
import { useStore } from '../context/Store';

export const Logo: React.FC<{ className?: string }> = ({ className }) => {
  const { siteSettings } = useStore();
  // الرابط الدقيق للصورة التي طلبها المستخدم
  const defaultLogo = "https://i.postimg.cc/Bb0PZ00P/tsmym-bdwn-wnwan-2.png";
  const logoUrl = siteSettings.logo_url || defaultLogo;

  return (
    <div className={`flex items-center gap-3 select-none group ${className}`}>
      {/* 1. أيقونة الشعار المتوهجة */}
      <div className="relative w-14 h-14 rounded-full overflow-hidden border-[2px] border-gold-500 bg-black flex-shrink-0 transition-all duration-500 
        shadow-[0_0_20px_rgba(255,196,0,0.4)] 
        group-hover:shadow-[0_0_40px_rgba(255,196,0,0.8)] 
        group-hover:border-gold-400">
         
         {/* الصورة */}
         <img
            src={logoUrl}
            alt="Sniper FX Logo"
            className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
         />
         
         {/* تأثير اللمعة الزجاجية */}
         <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>
      
      {/* 2. الكتلة النصية */}
      <div className="flex flex-col justify-center items-start -space-y-0.5">
        {/* السطر العلوي */}
        <span className="text-sm font-bold text-white tracking-widest uppercase leading-none group-hover:text-gray-200 transition-colors font-cairo">
          SNIPER <span className="text-gold-500">FX</span>
        </span>
        
        {/* السطر السفلي مع السبيكة */}
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FFD700] to-[#E6B800] tracking-[0.2em] leading-none uppercase drop-shadow-sm font-cairo">
            GOLD
          </span>
          {/* أيقونة السبيكة SVG */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md transform group-hover:rotate-12 transition-transform duration-500">
             <defs>
                <linearGradient id="goldBarGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFD700" />
                    <stop offset="100%" stopColor="#E6B800" />
                </linearGradient>
             </defs>
             <path d="M5 8L7 4H17L19 8H5Z" fill="url(#goldBarGradient)" stroke="#E6B800" strokeWidth="0.5"/>
             <path d="M5 8V16C5 17.1 5.9 18 7 18H17C18.1 18 19 17.1 19 16V8H5Z" fill="url(#goldBarGradient)" fillOpacity="0.9" stroke="#E6B800" strokeWidth="0.5"/>
             <path d="M8 13H16" stroke="#B48E00" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
};
