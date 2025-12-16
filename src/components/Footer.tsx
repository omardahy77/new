import React from 'react';
import { useStore } from '../context/StoreContext';
import { Facebook, Instagram, Send, Youtube, Phone, Video, Twitter } from 'lucide-react';

export const Footer: React.FC = () => {
  const { siteSettings } = useStore();
  const currentYear = new Date().getFullYear();
  const APP_VERSION = '4.1.0 (Ultimate)';
  
  // Robust check: Use optional chaining to prevent crash if siteSettings is undefined
  const links = siteSettings?.social_links || {};
  const features = siteSettings?.features_config || {};

  const socialIcons = [
    { icon: Send, link: links.telegram, color: '#229ED9', visible: features.social_telegram_visible !== false },
    { icon: Instagram, link: links.instagram, color: '#E4405F', visible: features.social_instagram_visible !== false },
    { icon: Facebook, link: links.facebook, color: '#1877F2', visible: features.social_facebook_visible !== false },
    { icon: Youtube, link: links.youtube, color: '#FF0000', visible: features.social_youtube_visible !== false },
    { icon: Video, link: links.tiktok, color: '#FE2C55', visible: features.social_tiktok_visible !== false },
    { icon: Twitter, link: links.twitter, color: '#1DA1F2', visible: features.social_twitter_visible !== false },
    { icon: Phone, link: links.whatsapp, color: '#25D366', visible: features.social_whatsapp_visible !== false }
  ];

  return (
    <footer className="bg-[#020305] text-gray-500 py-10 border-t border-white/5 font-sans relative z-50">
      <div className="container-custom flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Copyright & Version */}
        <div className="flex flex-col items-center md:items-start gap-1 text-center md:text-left">
          <span className="font-bold text-gray-400">&copy; {currentYear} {siteSettings?.site_name || 'Sniper FX'}. All Rights Reserved.</span>
          <span className="text-[10px] opacity-30 font-mono tracking-widest">v{APP_VERSION} • SECURE SYSTEM</span>
        </div>

        {/* Dynamic Social Links */}
        <div className="flex items-center gap-4">
          {socialIcons.map((social, idx) => (
            (social.link && social.visible) && (
              <a 
                key={idx}
                href={social.link} 
                target="_blank" 
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-all hover:bg-white/10 hover:-translate-y-1 hover:shadow-lg hover:shadow-gold-500/10"
                style={{ color: social.color === '#000000' ? 'white' : social.color }}
              >
                <social.icon size={16} />
              </a>
            )
          ))}
        </div>
      </div>
    </footer>
  );
};
