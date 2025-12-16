import React from 'react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';

export const Footer: React.FC = () => {
  const { siteSettings } = useStore();
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#020305] text-white py-6 border-t border-white/5 font-sans relative z-50">
      <div className="container-custom flex flex-col items-center text-center">
        
        {/* Copyright Only - Logo and Social Icons removed as requested */}
        <div className="w-full text-center">
            <p className="text-gray-600 text-sm font-medium">
                {siteSettings.site_name} {t('rights_reserved')} {currentYear} &copy;
            </p>
        </div>

      </div>
    </footer>
  );
};
