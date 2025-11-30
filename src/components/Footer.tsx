import React from 'react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-gray-500 py-6 border-t border-white/5 text-center text-sm font-sans relative z-50">
      &copy; {currentYear} Sniper FX Gold. All Rights Reserved.
    </footer>
  );
};
