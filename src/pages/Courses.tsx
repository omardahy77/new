import React from 'react';
import { useStore } from '../context/Store';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Play, Star, Clock, BookOpen, Crown, Lock, Sparkles, Target } from 'lucide-react';

export const Courses: React.FC = () => {
  const { courses, user, checkAccess, siteSettings } = useStore();
  const { t, language, dir } = useLanguage();
  const navigate = useNavigate();
  const content = siteSettings.content_config || {};

  const getContent = (key: string) => {
    if (language === 'en') {
      return (content as any)[`${key}_en`] || (content as any)[key] || '';
    }
    return (content as any)[key] || '';
  };

  const handleCourseClick = (courseId: string) => {
    if (!user) {
      navigate('/register');
    } else {
      navigate(`/course/${courseId}`);
    }
  };

  const visibleCourses = user ? courses : courses.filter(c => !c.is_paid);
  const showComingSoon = user && (siteSettings.features_config?.show_coming_soon ?? true);

  return (
    <div className="min-h-screen pt-40 pb-20" dir={dir}>
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            {getContent('courses_main_title') || t('courses')}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {getContent('courses_main_desc') || t('latest_courses_sub')}
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid gap-8">
          {visibleCourses.length === 0 && !showComingSoon && (
            <div className="text-center text-gray-500 py-10 col-span-full">
              {t('no_courses')}
            </div>
          )}

          {visibleCourses.map((course, idx) => {
            const hasAccess = checkAccess(course);
            return (
              <div 
                key={course.id} 
                onClick={() => handleCourseClick(course.id)}
                className="group glass-card overflow-hidden flex flex-col lg:flex-row hover:border-gold-500/30 transition-all duration-500 cursor-pointer"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Image Section */}
                <div className="lg:w-1/3 relative h-64 lg:h-auto overflow-hidden bg-black">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-navy-800"><Play size={48} className="text-gray-600" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 to-transparent lg:bg-gradient-to-r"></div>
                  
                  {/* Badges */}
                  <div className={`absolute top-4 z-10 flex flex-col gap-2 ${dir === 'rtl' ? 'right-4' : 'left-4'}`}>
                    {course.is_paid ? (
                      <span className="bg-navy-950/90 text-gold-400 px-3 py-1 rounded-lg text-xs font-bold border border-gold-500/30 flex items-center gap-1 shadow-lg backdrop-blur-sm w-fit">
                        <Crown size={12} fill="currentColor" /> {t('premium')}
                      </span>
                    ) : (
                      <span className="bg-green-500/90 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-lg backdrop-blur-sm w-fit">{t('free')}</span>
                    )}
                    <span className="bg-white/10 text-white px-3 py-1 rounded-lg text-xs font-bold backdrop-blur-sm w-fit border border-white/10">
                      {course.level || 'Intermediate'}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-6 lg:p-8 flex flex-col justify-center relative">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className={i < Math.floor(course.rating) ? "text-gold-500 fill-gold-500" : "text-gray-700"} />
                    ))}
                    <span className={`text-sm text-gray-500 ${dir === 'rtl' ? 'mr-2' : 'ml-2'}`}>({course.rating})</span>
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-gold-400 transition-colors">{course.title}</h2>
                  <p className="text-gray-400 mb-6 line-clamp-2 lg:line-clamp-none leading-relaxed">{course.description}</p>

                  <div className="flex flex-wrap items-center gap-6 mb-8 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-gold-500" />
                      <span>{course.duration || '0'} {t('duration_min')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className="text-gold-500" />
                      <span>{course.lesson_count || 0} {t('lessons_count')}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <button 
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${hasAccess ? 'bg-gold-500 text-navy-950 hover:scale-110 shadow-[0_0_20px_rgba(255,215,0,0.4)]' : 'bg-navy-800 text-gray-500'}`}
                    >
                      {hasAccess ? <Play size={20} fill="currentColor" /> : <Lock size={20} />}
                    </button>
                    <span className={`text-sm font-bold ${hasAccess ? 'text-gold-400' : 'text-gray-500'}`}>
                      {hasAccess ? t('start_watching') : t('login_to_watch')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Coming Soon Card */}
          {showComingSoon && (
             <div className="glass-card border-gold-500/10 p-12 flex flex-col items-center justify-center text-center min-h-[300px] relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-navy-900/80"></div>
                
                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-full bg-navy-900 border border-gold-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,215,0,0.05)] group-hover:scale-110 transition-transform duration-500 mx-auto">
                    <Lock className="text-gold-500/50 group-hover:text-gold-500 transition-colors" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{getContent('coming_soon_title') || "Master Class Pro"}</h3>
                  <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">{getContent('coming_soon_desc') || "Advanced professional course."}</p>
                  <span className="px-4 py-1.5 bg-gold-500/5 border border-gold-500/10 rounded-lg text-xs text-gold-500/70 font-bold uppercase tracking-wider">
                    {getContent('coming_soon_badge') || "Coming Soon"}
                  </span>
                </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};
