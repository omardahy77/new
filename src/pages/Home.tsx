import React from 'react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { 
  ArrowRight, Star, Play, Lock, Crown, 
  Target, LayoutDashboard, UserPlus, CheckCircle2,
  LineChart, Shield, Brain, Users, ArrowLeft,
  Facebook, Instagram, Send, ShieldCheck, LogIn
} from 'lucide-react';

const CourseSkeleton = () => (
  <div className="glass-card h-full flex flex-col overflow-hidden bg-[#080b14]/60 animate-pulse">
    <div className="h-60 bg-navy-800/50 w-full"></div>
    <div className="p-7 flex-1 flex flex-col space-y-4">
       <div className="h-4 bg-navy-800/50 rounded w-1/4"></div>
       <div className="h-6 bg-navy-800/50 rounded w-3/4"></div>
       <div className="h-4 bg-navy-800/50 rounded w-full"></div>
    </div>
  </div>
);

export const Home: React.FC = () => {
  const { user, courses, siteSettings, checkAccess, coursesLoading } = useStore();
  const { t, language, dir } = useLanguage();
  const navigate = useNavigate();
  const content = siteSettings.content_config || {};
  const links = siteSettings.social_links || {};

  const getContent = (key: string) => {
    return content[key] || '';
  };

  const availableCourses = user ? courses : courses.filter(c => !c.is_paid);
  const featuredCourses = availableCourses.slice(0, 3);

  const handleCourseClick = (courseId: string) => {
    if (!user) navigate('/login'); 
    else navigate(`/course/${courseId}`);
  };

  return (
    <div className="min-h-screen text-white relative overflow-x-hidden font-cairo selection:bg-gold-500 selection:text-navy-950" dir={dir}>
      
      {/* Global Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[150px] opacity-30"></div>
      </div>

      {/* ================= HERO SECTION (MATCHING IMAGE EXACTLY) ================= */}
      <section className="relative z-10 pt-[180px] pb-24 container-custom text-center">
        {user ? (
          // Logged In View
          <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="glass-card p-10 md:p-14 border-gold-500/20 shadow-[0_0_60px_rgba(0,0,0,0.5)] relative overflow-hidden group bg-[#080b14]/80">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent opacity-50"></div>
              
              <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-right rtl:md:text-right ltr:md:text-left">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-navy-950 text-4xl font-bold shadow-lg ring-4 ring-navy-950 shrink-0">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                      <h1 className="text-3xl md:text-4xl font-black mb-2">
                        {t('welcome_back')} <span className="text-gold-500">{user.full_name || user.email.split('@')[0]}</span>
                      </h1>
                      <p className="text-gray-400 mb-4 font-bold">{t('continue_journey')}</p>
                      
                      <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold border flex items-center gap-2 ${user.status === 'active' ? 'bg-green-900/20 text-green-400 border-green-500/10' : 'bg-yellow-900/20 text-yellow-400 border-yellow-500/10'}`}>
                          {user.status === 'active' ? <CheckCircle2 size={14} /> : null}
                          {user.status === 'active' ? t('active_member') : t('pending_member')}
                        </span>
                        {user.role === 'admin' && <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-gold-500/10 text-gold-400 border border-gold-500/10">Admin</span>}
                      </div>
                  </div>
                  <div className="flex flex-col gap-3 w-full md:w-auto">
                    <Link to="/courses" className="btn-gold px-8 py-3 text-base inline-flex items-center justify-center gap-2 shadow-xl shadow-gold-500/10 hover:shadow-gold-500/30 transition-shadow whitespace-nowrap">
                      <Play size={18} fill="currentColor" /> {t('start_learning')}
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="btn-glass px-8 py-3 text-base font-bold inline-flex items-center justify-center gap-2 hover:bg-white/5 whitespace-nowrap">
                        <LayoutDashboard size={18} /> {t('control_panel')}
                      </Link>
                    )}
                  </div>
              </div>
            </div>
          </div>
        ) : (
          // Public Hero View (Matching Image)
          <div className="max-w-6xl mx-auto animate-fade-in relative">
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-8 px-5 py-2 rounded-full border border-[#FFD700]/20 bg-[#0a0f1c]/80 text-[#FFD700] text-sm font-bold tracking-wide backdrop-blur-md shadow-[0_0_15px_rgba(255,215,0,0.05)]">
              <Target size={16} className="text-[#FFD700]" />
              {getContent('footer_tagline') || t('platform_tagline')}
            </div>
            
            {/* Main Title - Stacked & Resized to Match Image */}
            <h1 className="mb-8 tracking-tight leading-[1.1] drop-shadow-2xl">
              {/* Line 1: White, Same Size as Line 2 */}
              <span className="block text-white text-6xl md:text-8xl font-black mb-6">
                {getContent('hero_title') || t('hero_line1_default')}
              </span>
              
              {/* Line 2: Gold, Same Size, Glowing */}
              <span className="block text-[#FFD700] text-6xl md:text-8xl font-black drop-shadow-[0_0_35px_rgba(255,215,0,0.35)]">
                {getContent('hero_title_2') || t('hero_line2_default')}
              </span>
            </h1>
            
            {/* Description */}
            <p className="text-gray-400 text-lg md:text-xl mb-12 max-w-3xl mx-auto leading-relaxed opacity-80 font-medium">
              {getContent('hero_desc') || t('hero_desc_default')}
            </p>
            
            {/* Buttons (Matching Image) */}
            <div className="flex flex-col sm:flex-row justify-center gap-5 mb-16">
              {/* Create Account - Yellow Solid */}
              <Link to="/register" className="bg-[#FFD700] text-black px-8 py-3.5 text-lg font-bold rounded-xl shadow-[0_0_30px_rgba(255,215,0,0.25)] hover:shadow-[0_0_50px_rgba(255,215,0,0.4)] transition-all flex items-center justify-center gap-2 hover:scale-105 hover:bg-[#FFE066]">
                <UserPlus size={20} /> {t('create_account_btn')}
              </Link>
              
              {/* Login - Dark/Transparent */}
              <Link to="/login" className="px-8 py-3.5 text-lg font-bold bg-[#1a1d26]/80 border border-white/10 text-white hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2 rounded-xl backdrop-blur-sm">
                 {dir === 'rtl' ? <LogIn size={20} className="rotate-180" /> : null}
                 {t('login_btn')} 
                 {dir === 'ltr' ? <ArrowRight size={20} /> : null}
              </Link>
            </div>

            {/* NEW: Stats / Protected Content Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 text-sm md:text-base font-bold text-gray-400">
               <div className="flex items-center gap-2.5">
                  <ShieldCheck size={22} className="text-[#FFD700]" />
                  <span>{t('protected_content')}</span>
               </div>
               <div className="flex items-center gap-2.5">
                  <Users size={22} className="text-[#FFD700]" />
                  <span dir="ltr">{siteSettings.stats?.students || "+1500"}</span> 
                  <span>{t('students_count')}</span>
               </div>
            </div>

          </div>
        )}
      </section>

      {/* ================= WHY CHOOSE US ================= */}
      <section className="relative z-10 section-padding bg-[#020305] border-t border-white/5">
           <div className="container-custom">
              <div className="text-center mb-16">
                 <h2 className="text-3xl md:text-4xl font-black text-white mb-4">{getContent('why_choose_us_title') || t('why_choose_us_title_default')}</h2>
                 <p className="text-gray-500 max-w-2xl mx-auto font-bold">{getContent('why_choose_us_desc') || t('why_choose_us_desc_default')}</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {/* Card 1: Advanced Analysis */}
                 <div className="bg-[#05070E] border border-white/5 p-8 rounded-2xl hover:-translate-y-2 transition-all duration-300 text-center group hover:border-gold-500/20">
                    <div className="w-16 h-16 bg-[#020204] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/5 group-hover:border-gold-500/20 transition-colors">
                       <LineChart size={32} className="text-gold-500" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-3">
                        {getContent('feat_analysis_title') || t('feat_analysis')}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed font-bold">
                       {getContent('feat_analysis_desc') || t('feat_analysis_desc')}
                    </p>
                 </div>

                 {/* Card 2: Risk Management */}
                 <div className="bg-[#05070E] border border-white/5 p-8 rounded-2xl hover:-translate-y-2 transition-all duration-300 text-center group hover:border-gold-500/20">
                    <div className="w-16 h-16 bg-[#020204] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/5 group-hover:border-gold-500/20 transition-colors">
                       <Shield size={32} className="text-gold-500" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-3">
                        {getContent('feat_risk_title') || t('feat_risk')}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed font-bold">
                       {getContent('feat_risk_desc') || t('feat_risk_desc')}
                    </p>
                 </div>

                 {/* Card 3: Psychology */}
                 <div className="bg-[#05070E] border border-white/5 p-8 rounded-2xl hover:-translate-y-2 transition-all duration-300 text-center group hover:border-gold-500/20">
                    <div className="w-16 h-16 bg-[#020204] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/5 group-hover:border-gold-500/20 transition-colors">
                       <Brain size={32} className="text-gold-500" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-3">
                        {getContent('feat_psych_title') || t('feat_psych')}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed font-bold">
                       {getContent('feat_psych_desc') || t('feat_psych_desc')}
                    </p>
                 </div>

                 {/* Card 4: Community */}
                 <div className="bg-[#05070E] border border-white/5 p-8 rounded-2xl hover:-translate-y-2 transition-all duration-300 text-center group hover:border-gold-500/20">
                    <div className="w-16 h-16 bg-[#020204] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/5 group-hover:border-gold-500/20 transition-colors">
                       <Users size={32} className="text-gold-500" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-3">
                        {getContent('feat_community_title') || t('feat_community')}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed font-bold">
                       {getContent('feat_community_desc') || t('feat_community_desc')}
                    </p>
                 </div>
              </div>
           </div>
      </section>

      {/* ================= FEATURED COURSES ================= */}
      <section className="relative z-10 section-padding border-t border-white/5 bg-[#010205]">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3 flex items-center gap-3">
                <span className="w-1.5 h-8 bg-gold-500 rounded-full"></span>
                {t('latest_courses')}
              </h2>
              <p className="text-gray-500 text-lg font-bold">{t('latest_courses_sub')}</p>
            </div>
            <Link to="/courses" className="group flex items-center gap-2 text-gold-500 hover:text-gold-400 font-bold transition-colors px-6 py-3 rounded-xl bg-gold-500/5 hover:bg-gold-500/10 border border-gold-500/10">
              {t('view_all_courses')} <ArrowRight size={18} className={`transition-transform ${dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coursesLoading ? (
               <>
                 <CourseSkeleton />
                 <CourseSkeleton />
                 <CourseSkeleton />
               </>
            ) : featuredCourses.length === 0 ? (
               <div className="col-span-full text-center text-gray-600 font-bold">{t('no_featured_courses')}</div>
            ) : (
                featuredCourses.map((course) => {
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
                        </div>
                        
                        <h3 className="text-xl font-black text-white mb-3 group-hover:text-gold-400 transition-colors line-clamp-1">{course.title}</h3>
                        <p className="text-gray-500 text-sm line-clamp-2 mb-6 leading-relaxed font-bold">{course.description}</p>
                        
                        <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                            <span className={`text-sm font-bold transition-colors ${hasAccess ? 'text-gold-500 group-hover:text-gold-400' : 'text-gray-600'}`}>
                            {hasAccess ? t('watch_now') : t('login_to_access')}
                            </span>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${hasAccess ? 'border-gold-500 text-gold-500' : 'border-gray-700 text-gray-700'}`}>
                                {hasAccess ? <Play size={12} fill="currentColor" /> : <Lock size={12} />}
                            </div>
                        </div>
                        </div>
                    </div>
                    </div>
                );
                })
            )}
          </div>
        </div>
      </section>

      {/* ================= YELLOW CTA SECTION (INTERACTIVE & GLOWING) ================= */}
      {!user && (
        <section className="relative z-10 py-20 bg-[#010205]">
            <div className="container-custom">
                <div className="bg-gold-500 rounded-[2.5rem] py-16 px-8 text-center relative overflow-hidden shadow-[0_0_50px_rgba(255,215,0,0.3)] hover:shadow-[0_0_100px_rgba(255,215,0,0.6)] transition-all duration-500 hover:-translate-y-2 group">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] group-hover:opacity-20 transition-opacity duration-500"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                    
                    <div className="relative z-10 max-w-3xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-black text-navy-950 mb-4 drop-shadow-sm">
                            {getContent('cta_title') || t('cta_title_default')}
                        </h2>
                        <p className="text-navy-950/80 text-lg md:text-xl font-black mb-10">
                            {getContent('cta_desc') || t('cta_desc_default')}
                        </p>
                        
                        <Link 
                            to="/register" 
                            className="inline-flex items-center gap-3 bg-navy-950 text-white px-12 py-5 rounded-2xl font-bold text-xl hover:bg-navy-900 transition-all hover:scale-105 shadow-2xl hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                        >
                             {dir === 'rtl' ? <ArrowLeft size={24} /> : null}
                             {t('create_account_btn')}
                             {dir === 'ltr' ? <ArrowRight size={24} /> : null}
                        </Link>
                    </div>
                </div>
            </div>
        </section>
      )}

      {/* ================= HOME-ONLY BOTTOM SECTION (RE-DESIGNED) ================= */}
      <section className="bg-[#020305] pt-24 pb-20 text-center relative z-10 border-t border-white/5">
         <div className="container-custom flex flex-col items-center">
            
            {/* 1. Logo (Centered) */}
            <div className="mb-8 transform scale-125">
                <Logo />
            </div>

            {/* 2. Taglines */}
            <h2 className="text-2xl md:text-3xl font-black text-gold-500 mb-2 drop-shadow-[0_0_15px_rgba(255,215,0,0.4)]">
                {getContent('footer_tagline') || t('footer_tagline_default')}
            </h2>
            <p className="text-gray-500 text-base md:text-lg mb-12 font-bold">
                {getContent('footer_sub_tagline') || t('footer_sub_tagline_default')}
            </p>

            {/* 3. Contact Us Header */}
            <h3 className="text-3xl font-black text-white mb-8">
                {t('footer_contact_title')}
            </h3>

            {/* 4. Social Icons (Styled like Image) */}
            <div className="flex items-center justify-center gap-6">
                {/* Facebook */}
                <a 
                    href={links.facebook || '#'} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-14 h-14 rounded-2xl bg-[#05070E] border border-white/10 flex items-center justify-center text-[#1877F2] hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition-all duration-300 shadow-lg hover:-translate-y-2 hover:shadow-[#1877F2]/40"
                >
                    <Facebook size={28} />
                </a>

                {/* Instagram */}
                <a 
                    href={links.instagram || '#'} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-14 h-14 rounded-2xl bg-[#05070E] border border-white/10 flex items-center justify-center text-[#E4405F] hover:bg-[#E4405F] hover:text-white hover:border-[#E4405F] transition-all duration-300 shadow-lg hover:-translate-y-2 hover:shadow-[#E4405F]/40"
                >
                    <Instagram size={28} />
                </a>

                {/* Telegram */}
                <a 
                    href={links.telegram || '#'} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-14 h-14 rounded-2xl bg-[#05070E] border border-white/10 flex items-center justify-center text-[#229ED9] hover:bg-[#229ED9] hover:text-white hover:border-[#229ED9] transition-all duration-300 shadow-lg hover:-translate-y-2 hover:shadow-[#229ED9]/40"
                >
                    <Send size={28} />
                </a>
            </div>
         </div>
      </section>

    </div>
  );
};
