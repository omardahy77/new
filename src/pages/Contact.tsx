import React from 'react';
import { useStore } from '../context/Store';
import { useLanguage } from '../context/LanguageContext';
import { Facebook, Send, Instagram, ExternalLink, Youtube, Video, Phone } from 'lucide-react';

export const Contact: React.FC = () => {
  const { siteSettings } = useStore();
  const { t, language, dir } = useLanguage();
  const content = siteSettings.content_config || {};
  const features = siteSettings.features_config || {};

  const getContent = (key: string) => {
    if (language === 'en') {
      return (content as any)[`${key}_en`] || (content as any)[key] || '';
    }
    return (content as any)[key] || '';
  };

  const socialCards = [
    {
      key: 'facebook',
      name: getContent('fb_card_title') || 'Facebook',
      icon: Facebook,
      color: '#1877F2',
      bg: 'bg-[#1877F2]/10',
      border: 'border-[#1877F2]/20',
      link: siteSettings.social_links.facebook,
      actionText: getContent('fb_card_btn') || 'Follow on Facebook',
      subText: getContent('fb_card_sub') || 'Latest News',
      visible: features.social_facebook_visible !== false
    },
    {
      key: 'instagram',
      name: getContent('insta_card_title') || 'Instagram',
      icon: Instagram,
      color: '#E4405F',
      bg: 'bg-[#E4405F]/10',
      border: 'border-[#E4405F]/20',
      link: siteSettings.social_links.instagram,
      actionText: getContent('insta_card_btn') || 'Follow on Instagram',
      subText: getContent('insta_card_sub') || 'Daily Stories',
      visible: features.social_instagram_visible !== false
    },
    {
      key: 'telegram',
      name: getContent('tg_card_title') || 'Telegram',
      icon: Send,
      color: '#229ED9',
      bg: 'bg-[#229ED9]/10',
      border: 'border-[#229ED9]/20',
      link: siteSettings.social_links.telegram,
      actionText: getContent('tg_card_btn') || 'Join Channel',
      subText: getContent('tg_card_sub') || 'Live Signals',
      visible: features.social_telegram_visible !== false
    },
    {
      key: 'youtube',
      name: getContent('yt_card_title') || 'YouTube',
      icon: Youtube,
      color: '#FF0000',
      bg: 'bg-[#FF0000]/10',
      border: 'border-[#FF0000]/20',
      link: siteSettings.social_links.youtube,
      actionText: getContent('yt_card_btn') || 'Subscribe',
      subText: getContent('yt_card_sub') || 'Video Tutorials',
      visible: features.social_youtube_visible !== false
    },
    {
      key: 'tiktok',
      name: getContent('tt_card_title') || 'TikTok',
      icon: Video,
      color: '#FE2C55',
      bg: 'bg-[#FE2C55]/10',
      border: 'border-[#FE2C55]/20',
      link: siteSettings.social_links.tiktok,
      actionText: getContent('tt_card_btn') || 'Follow',
      subText: getContent('tt_card_sub') || 'Short Clips',
      visible: features.social_tiktok_visible !== false
    },
    {
      key: 'whatsapp',
      name: getContent('wa_card_title') || 'WhatsApp',
      icon: Phone,
      color: '#25D366',
      bg: 'bg-[#25D366]/10',
      border: 'border-[#25D366]/20',
      link: siteSettings.social_links.whatsapp,
      actionText: getContent('wa_card_btn') || 'Message Us',
      subText: getContent('wa_card_sub') || 'Direct Contact',
      visible: features.social_whatsapp_visible !== false
    }
  ];

  return (
    <div className="min-h-screen page-padding-top pb-20 relative overflow-hidden" dir={dir}>
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-20 animate-fade-in pt-10">
          <h1 className="text-5xl font-black text-white mb-6">
            {getContent('contact_main_title') || t('contact')}
          </h1>
          <p className="text-gray-400 text-lg">
            {getContent('contact_main_desc') || "Our support team is ready to answer your queries"}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
          {socialCards.map((card) => (
            card.visible && card.link && card.link !== '#' && card.link !== '' && (
              <a 
                key={card.key} 
                href={card.link} 
                target="_blank" 
                rel="noreferrer"
                className={`glass-card border ${card.border} rounded-[2rem] p-10 flex flex-col items-center text-center group hover:bg-navy-900 transition-all duration-300 shadow-lg hover:-translate-y-2 relative overflow-hidden`}
              >
                <div className={`absolute top-0 left-0 w-full h-1 bg-${card.color} opacity-50`}></div>
                
                <div 
                  className={`w-24 h-24 rounded-full ${card.bg} border ${card.border} flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 shadow-inner`}
                >
                  <card.icon size={40} style={{ color: card.color }} strokeWidth={1.5} />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">{card.name}</h3>
                <p className="text-gray-500 text-sm mb-8">{card.subText}</p>
                
                <div className="mt-auto w-full">
                  <span 
                    className="w-full block py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 text-sm shadow-lg" 
                    style={{ backgroundColor: card.color, color: 'white' }}
                  >
                     {card.actionText} <ExternalLink size={16} />
                  </span>
                </div>
              </a>
            )
          ))}
        </div>
      </div>
    </div>
  );
};
