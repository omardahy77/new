import React from 'react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  // Ensure this matches StoreProvider version
  const APP_VERSION = '1.6.0'; 

  return (
    <footer className="bg-black text-gray-500 py-6 border-t border-white/5 text-center text-sm font-sans relative z-50">
      <div className="flex flex-col items-center gap-1">
        <span>&copy; {currentYear} Sniper FX Gold. All Rights Reserved.</span>
        <span className="text-[10px] opacity-30 font-mono">v{APP_VERSION} • System Stable</span>
      </div>
    </footer>
  );
};
