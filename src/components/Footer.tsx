import React from 'react';
import { useStore } from '../context/Store';

export const Footer: React.FC = () => {
  const { siteSettings } = useStore();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-gray-500 py-6 border-t border-white/5 text-center text-sm font-sans relative z-50">
      &copy; {currentYear} {siteSettings.site_name || 'SNIPER FX GOLD'}. All Rights Reserved.
    </footer>
  );
};
