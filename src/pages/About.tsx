import React from 'react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { Logo } from '../components/Logo';
import { Target, Award, Users, Clock, Headphones } from 'lucide-react';

export const About: React.FC = () => {
  const { siteSettings } = useStore();
  const { t, language, dir } = useLanguage();
  const content = siteSettings.content_config || {};

  const getContent = (key: string) => {
    if (language === 'en') {
      return (content as any)[`${key}_en`] || (content as any)[key] || '';
    }
    return (content as any)[key] || '';
  };

  const stats = [
    { icon: Users, label: getContent('stats_students_label') || (language === 'ar' ? "متدرب نشط" : "Active Students"), value: siteSettings.stats?.students || "+1500" },
    { icon: Clock, label: getContent('stats_hours_label') || (language === 'ar' ? "ساعة تدريبية" : "Training Hours"), value: siteSettings.stats?.hours || "+50" },
    { icon: Headphones, label: getContent('stats_support_label') || (language === 'ar' ? "دعم فني" : "Support"), value: content.stats_support_value || "24/7" },
  ];

  return (
    <div className="min-h-screen page-padding-top pb-20 relative overflow-hidden" dir={dir}>
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gold-500/5 blur-[150px] rounded-full -z-10"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-600/5 blur-[150px] rounded-full -z-10"></div>

      <div className="container-custom">
        {/* Header Section */}
        <div className="text-center max-w-4xl mx-auto mb-16 animate-fade-in pt-10">
          <div className="mb-8 flex justify-center transform scale-150">
            <Logo />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6">
            {getContent('about_main_title') || t('about_main_title_default')}
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed max-w-3xl mx-auto">
            {getContent('about_main_desc') || t('about_main_desc_default')}
          </p>
        </div>

        {/* Vision & Mission Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-24 max-w-6xl mx-auto">
          {/* Mission */}
          <div className="glass-card p-10 text-center hover:shadow-[0_0_30px_rgba(255,215,0,0.1)] transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent opacity-50"></div>
            <div className="flex justify-center mb-6">
               <Award className="text-gold-500 w-12 h-12" strokeWidth={1.5} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">{getContent('mission_title') || t('mission_title_default')}</h2>
            <p className="text-gray-300 leading-relaxed text-lg">
              {getContent('mission_desc') || t('mission_desc_default')}
            </p>
          </div>

          {/* Vision */}
          <div className="glass-card p-10 text-center hover:shadow-[0_0_30px_rgba(255,215,0,0.1)] transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent opacity-50"></div>
            <div className="flex justify-center mb-6">
               <Target className="text-gold-500 w-12 h-12" strokeWidth={1.5} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">{getContent('vision_title') || t('vision_title_default')}</h2>
            <p className="text-gray-300 leading-relaxed text-lg">
              {getContent('vision_desc') || t('vision_desc_default')}
            </p>
          </div>
        </div>

        {/* Professional Statistics Section */}
        <div className="pt-16 border-t border-white/5">
          <div className="text-center mb-16">
             <h2 className="text-3xl font-bold text-white">{language === 'en' ? 'Numbers Speak for Success' : 'أرقام تتحدث عن نجاحنا'}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {stats.map((stat, idx) => (
              <div key={idx} className="glass-card p-8 text-center group hover:border-gold-500/50 hover:-translate-y-2 transition-all duration-300">
                <div className="w-20 h-20 bg-navy-950 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 group-hover:border-gold-500/50 transition-colors shadow-lg relative">
                  <div className="absolute inset-0 bg-gold-500/5 rounded-full animate-pulse-slow"></div>
                  <stat.icon className="text-gold-500 relative z-10" size={36} />
                </div>
                <h3 className="text-4xl font-black text-white mb-2 font-sans tracking-tight">{stat.value}</h3>
                <p className="text-gray-400 font-bold text-lg">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
