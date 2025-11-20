import React from 'react';
import { useStore } from '../context/Store';
import { Facebook, Send, Instagram, ExternalLink } from 'lucide-react';

export const Contact: React.FC = () => {
  const { siteSettings } = useStore();

  const socialCards = [
    {
      key: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: '#1877F2',
      bg: 'bg-[#1877F2]/10',
      border: 'border-[#1877F2]/20',
      link: siteSettings.social_links.facebook,
      actionText: 'تابعنا على فيسبوك',
      subText: 'آخر الأخبار والتحديثات'
    },
    {
      key: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: '#E4405F',
      bg: 'bg-[#E4405F]/10',
      border: 'border-[#E4405F]/20',
      link: siteSettings.social_links.instagram,
      actionText: 'تابعنا على انستجرام',
      subText: 'تحليلات يومية وستوريات'
    },
    {
      key: 'telegram',
      name: 'Telegram',
      icon: Send,
      color: '#229ED9',
      bg: 'bg-[#229ED9]/10',
      border: 'border-[#229ED9]/20',
      link: siteSettings.social_links.telegram,
      actionText: 'انضم للقناة',
      subText: 'توصيات ومناقشات حية'
    }
  ];

  return (
    <div className="min-h-screen page-padding-top pb-20 relative overflow-hidden">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-20 animate-fade-in pt-10">
          <h1 className="text-5xl font-black text-white mb-6">
            {siteSettings.contact_title || "تواصل معنا"}
          </h1>
          <p className="text-gray-400 text-lg">
            {siteSettings.contact_desc || "فريق الدعم الفني جاهز للرد على استفساراتكم ومساعدتكم في رحلتكم التعليمية"}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
          {socialCards.map((card) => (
            card.link && card.link !== '#' && (
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
