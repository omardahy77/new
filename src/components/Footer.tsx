import React from 'react';
import { useStore } from '../context/Store';

export const Footer: React.FC = () => {
  const { siteSettings } = useStore();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy-950 border-t border-white/5 py-8 mt-20">
      <div className="container mx-auto px-4 text-center">
        <p className="text-gray-500 text-sm">
          جميع الحقوق محفوظة &copy; {year} {siteSettings.site_name}.
        </p>
        <div className="mt-4 flex justify-center gap-6 text-xs text-gray-600">
          <a href="#" className="hover:text-gold-500 transition-colors">سياسة الخصوصية</a>
          <a href="#" className="hover:text-gold-500 transition-colors">شروط الاستخدام</a>
          <a href="#" className="hover:text-gold-500 transition-colors">إخلاء المسؤولية</a>
        </div>
      </div>
    </footer>
  );
};
