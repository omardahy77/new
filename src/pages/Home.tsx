import React from 'react';
import { useStore } from '../context/Store';
import { useLanguage } from '../context/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Star, Play, Lock, Crown, 
  LineChart, Shield, Brain, Users, ArrowLeft,
  Facebook, Instagram, Send, CheckCircle2, UserPlus, LogIn, Target, LayoutDashboard, Sparkles, Video, Phone, Youtube
} from 'lucide-react';
import { Logo } from '../components/Logo';

const getIcon = (name: string) => {
  const icons: any = { LineChart, Shield, Brain, Users };
  const Icon = icons[name] || Star;
  return <Icon size={32} className="text-gold-500" />;
};

export const Home: React.FC = () => {
  const { user, courses, siteSettings, checkAccess } = useStore();
  const { t, language, dir } = useLanguage();
  const navigate = useNavigate();
  const links = siteSettings.social_links || {};
  const content = siteSettings.content_config || {};
  const features = siteSettings.features_config || { show_coming_soon: true, show_stats: true };

  // Helper to get content based on language
  const getContent = (key: string) => {
    if (language === 'en') {
      return (content as any)[`${key}_en`] || (content as any)[key] || '';
    }
    return (content as any)[key] || '';
  };

  const getSetting = (key: string) => {
    if (language === 'en') {
      return (siteSettings as any)[`${key}_en`] || (siteSettings as any)[key] || '';
    }
    return (siteSettings as any)[key] || '';
  };

  const availableCourses = user ? courses : courses.filter(c => !c.is_paid);
  const featuredCourses = availableCourses.slice(0, 3);
  const showComingSoon = user && features.show_coming_soon;

  const handleCourseClick = (courseId: string) => {
    if (!user) navigate('/register');
    else navigate(`/course/${courseId}`);
  };

  return (
    <div className="min-h-screen text-white relative overflow-x-hidden font-cairo selection:bg-gold-500 selection:text-navy-950" dir={dir}>
      
      {/* Global Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#0a0f1c]/40 rounded-full blur-[150px] opacity-40"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-[150px] opacity-20"></div>
      </div>

      {/* ================= HERO SECTION ================= */}
      <section className="relative z-10 pt-[160px] pb-24 container-custom text-center">
        {user ? (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="glass-card p-10 md:p-14 border-gold-500/20 shadow-[0_0_60px_rgba(0,0,0,0.5)] relative overflow-hidden group bg-[#080b14]/80">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent opacity-50"></div>
              
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 mx-auto mb-6 flex items-center justify-center text-navy-950 text-4xl font-bold shadow-lg ring-4 ring-navy-950">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                {t('welcome_back')} <span className="text-gold-500">{user.email.split('@')[0]}</span>
              </h1>
              <p className="text-gray-400 mb-8">{t('continue_journey')}</p>
              
              <div className="flex justify-center gap-3 mb-8">
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold border flex items-center gap-2 ${user.status === 'active' ? 'bg-green-900/20 text-green-400 border-green-500/10' : 'bg-yellow-900/20 text-yellow-400 border-yellow-500/10'}`}>
                  {user.status === 'active' ? <CheckCircle2 size={14} /> : null}
                  {user.status === 'active' ? t('active_member') : t('pending_member')}
                </span>
                {user.role === 'admin' && <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-gold-500/10 text-gold-400 border border-gold-500/10">Admin</span>}
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/courses" className="btn-gold px-12 py-4 text-lg inline-flex items-center justify-center gap-3 shadow-xl shadow-gold-500/10 hover:shadow-gold-500/30 transition-shadow">
                  <Play size={22} fill="currentColor" /> {t('start_learning')}
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="btn-glass px-8 py-4 text-lg font-bold inline-flex items-center justify-center gap-3 hover:bg-white/5">
                    <LayoutDashboard size={22} /> {t('control_panel')}
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto animate-fade-in relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-gold-500/5 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
            
            <div className="inline-flex items-center gap-2 mb-8 px-5 py-2 rounded-full border border-white/5 bg-[#0a0f1c]/50 text-gold-500 text-xs md:text-sm font-bold tracking-wide backdrop-blur-sm shadow-lg">
              <Target size={16} className="text-gold-500" />
              {getContent('footer_tagline') || t('platform_tagline')}
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 tracking-tight leading-[1.1]">
              <span className="block text-white drop-shadow-2xl z-0 relative">
                {getSetting('hero_title_line1') || "Trade Smart"}
              </span>
              <span className="block text-gold-500 drop-shadow-[0_0_15px_rgba(255,215,0,0.2)] relative z-10 mt-2 md:mt-4">
                {getSetting('hero_title_line2') || "With Sniper Precision"}
              </span>
            </h1>
            
            <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-3xl mx-auto leading-relaxed opacity-80 font-light">
              {getSetting('hero_desc')}
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-5 mb-12">
              <Link to="/register" className="btn-gold px-8 py-4 text-lg font-bold shadow-[0_0_30px_rgba(255,215,0,0.2)] hover:shadow-[0_0_50px_rgba(255,215,0,0.4)] transition-all flex items-center justify-center gap-2">
                <UserPlus size={20} /> {t('create_account_btn')}
              </Link>
              <Link to="/login" className="btn-glass px-8 py-4 text-lg font-bold hover:bg-white/5 border-white/10 flex items-center justify-center gap-2">
                {t('login_btn')} <LogIn size={20} />
              </Link>
            </div>

            {features.show_stats && (
              <div className="flex items-center justify-center gap-8 md:gap-16 text-sm md:text-base font-bold text-gray-500 animate-fade-in">
                 <div className="flex items-center gap-2">
                    <Shield className="text-gold-500" size={20} />
                    <span>{t('protected_content')}</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <Users className="text-gold-500" size={20} />
                    <span>{siteSettings.stats.students} {t('students_count')}</span>
                 </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ================= FEATURED COURSES ================= */}
      <section className="relative z-10 section-padding border-t border-white/5 bg-[#010205]">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 flex items-center gap-3">
                <span className="w-1.5 h-8 bg-gold-500 rounded-full"></span>
                {t('latest_courses')}
              </h2>
              <p className="text-gray-500 text-lg">{t('latest_courses_sub')}</p>
            </div>
            <Link to="/courses" className="group flex items-center gap-2 text-gold-500 hover:text-gold-400 font-bold transition-colors px-6 py-3 rounded-xl bg-gold-500/5 hover:bg-gold-500/10 border border-gold-500/10">
              {t('view_all_courses')} <ArrowRight size={18} className={`transition-transform ${dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCourses.length === 0 && (
               <div className="col-span-full text-center text-gray-600">{t('no_featured_courses')}</div>
            )}

            {featuredCourses.map((course, idx) => {
              const hasAccess = checkAccess(course);
              return (
                <div key={course.id} onClick={() => handleCourseClick(course.id)} className="group cursor-pointer h-full">
                  <div className="glass-card h-full flex flex-col overflow-hidden hover:border-gold-500/30 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all duration-500 relative bg-[#080b14]/60">
                    {/* Image Container */}
                    <div className="relative h-60 bg-[#05070E] overflow-hidden">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#05070E]"><Play size={40} className="text-gray-700" /></div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-[#080b14] via-[#080b14]/40 to-transparent"></div>
                      
                      <div className={`absolute top-4 z-10 flex flex-col gap-2 ${dir === 'rtl' ? 'right-4' : 'left-4'}`}>
                        {course.is_paid ? (
                          <span className="bg-black/80 backdrop-blur-md text-gold-500 px-3 py-1.5 rounded-lg text-xs font-bold border border-gold-500/20 flex items-center gap-1 shadow-lg">
                            <Crown size={12} fill="currentColor" /> {t('premium')}
                          </span>
                        ) : (
                          <span className="bg-green-900/80 backdrop-blur-md text-green-400 px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg border border-green-500/20">{t('free')}</span>
                        )}
                      </div>

                      {!hasAccess && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-14 h-14 rounded-full bg-black border border-gold-500/40 flex items-center justify-center text-gold-500 shadow-[0_0_20px_rgba(255,215,0,0.1)] scale-0 group-hover:scale-100 transition-transform duration-300">
                            <Lock size={24} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-7 flex-1 flex flex-col">
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} className={i < Math.floor(course.rating) ? "text-gold-500 fill-gold-500" : "text-gray-800"} />
                        ))}
                        <span className={`text-xs text-gray-600 font-mono ${dir === 'rtl' ? 'mr-2' : 'ml-2'}`}>({course.rating})</span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-gold-400 transition-colors line-clamp-1">{course.title}</h3>
                      <p className="text-gray-500 text-sm line-clamp-2 mb-6 leading-relaxed">{course.description}</p>
                      
                      <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-bold flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gold-500"></div>
                          {course.lesson_count || 12} {t('lessons')}
                        </span>
                        <span className={`text-sm font-bold transition-colors ${hasAccess ? 'text-gold-500 group-hover:text-gold-400' : 'text-gray-600'}`}>
                          {hasAccess ? t('watch_now') : t('login_to_access')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= MASTER CLASS PRO (COMING SOON) ================= */}
      {showComingSoon && (
        <section className="relative z-10 py-20">
          <div className="container-custom">
            <div className="relative rounded-[2rem] overflow-hidden border border-gold-500/10 group bg-[#05070E]">
              <div className="absolute inset-0 bg-[#020204]"></div>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 mix-blend-overlay"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#020204] via-[#0a0f1c] to-[#020204] opacity-80"></div>
              
              <div className="absolute top-0 left-1/4 w-1/2 h-full bg-gold-500/5 blur-[120px] animate-pulse-slow"></div>
              
              <div className="relative z-10 p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10">
                
                <div className={`flex-1 text-center ${dir === 'rtl' ? 'md:text-right' : 'md:text-left'}`}>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/5 border border-gold-500/10 text-gold-500 text-xs font-bold uppercase tracking-widest mb-6 animate-fade-in">
                    <Sparkles size={14} />
                    {getContent('coming_soon_badge') || "Coming Soon"}
                  </div>
                  
                  <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
                    {getContent('coming_soon_title') || "Master Class Pro"}
                  </h2>
                  
                  <p className="text-xl text-gray-500 max-w-2xl leading-relaxed mb-8">
                    {getContent('coming_soon_desc') || "Advanced professional course revealing market maker secrets."}
                  </p>

                  <div className={`flex flex-wrap justify-center ${dir === 'rtl' ? 'md:justify-start' : 'md:justify-start'} gap-4`}>
                    <div className="px-6 py-3 bg-[#020204] rounded-xl border border-white/5 flex items-center gap-3 text-gray-400">
                       <Lock size={18} className="text-gold-500/40" />
                       <span className="text-sm font-bold">{getContent('coming_soon_feature_1') || "Exclusive Content"}</span>
                    </div>
                    <div className="px-6 py-3 bg-[#020204] rounded-xl border border-white/5 flex items-center gap-3 text-gray-400">
                       <Target size={18} className="text-gold-500/40" />
                       <span className="text-sm font-bold">{getContent('coming_soon_feature_2') || "Advanced Strategies"}</span>
                    </div>
                  </div>
                </div>

                <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center shrink-0">
                   <div className="absolute inset-0 bg-gold-500/5 rounded-full blur-[80px] animate-pulse"></div>
                   <div className="w-full h-full rounded-full border border-gold-500/10 flex items-center justify-center relative bg-[#020204]/80 backdrop-blur-sm shadow-2xl group-hover:scale-105 transition-transform duration-700">
                      <div className="absolute inset-0 border border-gold-500/10 rounded-full animate-[spin_12s_linear_infinite]"></div>
                      <Lock size={80} className="text-gold-500 drop-shadow-[0_0_20px_rgba(255,215,0,0.3)]" strokeWidth={1} />
                   </div>
                </div>

              </div>
            </div>
          </div>
        </section>
      )}

      {/* ================= WHY CHOOSE US ================= */}
      {!user && (
        <section className="relative z-10 section-padding bg-[#000000]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-[#0a0f1c] blur-[150px] rounded-full pointer-events-none opacity-30"></div>

          <div className="container-custom relative">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{getContent('why_choose_us_title') || "Why Choose Us?"}</h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-lg">{getContent('why_choose_us_desc') || "We provide a complete educational experience."}</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {siteSettings.home_features?.map((feature, idx) => (
                <div key={idx} className="bg-[#05070E] border border-white/5 p-8 rounded-2xl hover:-translate-y-2 transition-all duration-300 text-center group hover:bg-[#080b14] hover:border-gold-500/10 hover:shadow-lg">
                  <div className="w-16 h-16 bg-[#020204] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/5 shadow-inner">
                    {getIcon(feature.icon)}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-gold-400 transition-colors">
                    {language === 'en' ? 
                        (feature.title === 'تحليل فني متقدم' ? t('feat_analysis') : 
                         feature.title === 'إدارة مخاطر صارمة' ? t('feat_risk') :
                         feature.title === 'سيكولوجية التداول' ? t('feat_psych') :
                         feature.title === 'مجتمع حصري' ? t('feat_community') : feature.title)
                        : feature.title
                    }
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                     {language === 'en' ? 
                        (feature.title === 'تحليل فني متقدم' ? t('feat_analysis_desc') : 
                         feature.title === 'إدارة مخاطر صارمة' ? t('feat_risk_desc') :
                         feature.title === 'سيكولوجية التداول' ? t('feat_psych_desc') :
                         feature.title === 'مجتمع حصري' ? t('feat_community_desc') : feature.description)
                        : feature.description
                    }
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= CTA SECTION ================= */}
      {!user && (
        <section className="relative z-10 pt-16 pb-0">
          <div className="container-custom">
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] transform hover:scale-[1.01] transition-transform duration-500 bg-[#FFC400]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700] via-[#FFC400] to-[#E6B800]"></div>
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay"></div>
              <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] animate-shine"></div>

              <div className="relative z-10 p-12 md:p-20 text-center">
                <h2 className="text-4xl md:text-5xl font-black text-navy-950 mb-6 drop-shadow-sm">
                  {getContent('cta_title') || "Ready to Start?"}
                </h2>
                <p className="text-navy-900 font-bold text-xl md:text-2xl mb-12 leading-relaxed max-w-3xl mx-auto opacity-90">
                  {getContent('cta_desc') || "Join Sniper FX Gold community now."}
                </p>
                
                <Link 
                  to="/register" 
                  className="inline-flex items-center gap-3 bg-navy-950 text-white px-10 py-5 rounded-xl font-bold text-lg hover:bg-black hover:scale-105 transition-all duration-300 shadow-2xl ring-4 ring-white/10"
                >
                  {t('create_account_btn')} {dir === 'rtl' ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ================= BOTTOM SECTION ================= */}
      <section className="relative z-10 py-20 bg-transparent">
         <div className="container-custom flex flex-col items-center text-center">
            <div className="mb-8 transform scale-125 hover:scale-110 transition-transform duration-500">
              <Logo />
            </div>
            <h3 className="text-gold-500 font-bold text-xl mb-3 tracking-wide">
              {getContent('footer_tagline') || t('platform_tagline')}
            </h3>
            <p className="text-gray-600 text-sm mb-8 font-medium tracking-wider uppercase">
              {getContent('footer_sub_tagline') || "Real Education. Real Results."}
            </p>
            <h4 className="text-white font-bold text-lg mb-6">
              {t('contact')}
            </h4>
            <div className="flex items-center justify-center gap-8 flex-wrap">
              {[
                { icon: Send, link: links.telegram, color: '#229ED9', visible: features.social_telegram_visible !== false },
                { icon: Instagram, link: links.instagram, color: '#E4405F', visible: features.social_instagram_visible !== false },
                { icon: Facebook, link: links.facebook, color: '#1877F2', visible: features.social_facebook_visible !== false },
                { icon: Youtube, link: links.youtube, color: '#FF0000', visible: features.social_youtube_visible !== false },
                { icon: Video, link: links.tiktok, color: '#000000', borderColor: '#FE2C55', visible: features.social_tiktok_visible !== false }, 
                { icon: Phone, link: links.whatsapp, color: '#25D366', visible: features.social_whatsapp_visible !== false } 
              ].map((social, idx) => (
                (social.link && social.visible) && (
                    <a 
                    key={idx}
                    href={social.link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-14 h-14 rounded-2xl bg-[#05070E] border border-white/5 flex items-center justify-center text-gray-500 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg group relative overflow-hidden"
                    style={{ borderColor: social.borderColor }}
                    >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300" style={{ backgroundColor: social.color }}></div>
                    <social.icon size={24} className="relative z-10 transition-colors duration-300" style={{ color: social.color === '#000000' ? 'white' : social.color }} />
                    </a>
                )
              ))}
            </div>
         </div>
      </section>
    </div>
  );
};
