import React from 'react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { formatDuration } from '../utils/videoHelpers';
import { Play, Star, Clock, BookOpen, Crown, Lock, BarChart3 } from 'lucide-react';

const CourseCardSkeleton = () => (
  <div className="glass-card h-full flex flex-col overflow-hidden bg-[#080b14]/60 animate-pulse">
    <div className="h-64 lg:h-auto lg:w-1/3 bg-navy-800/50 w-full"></div>
    <div className="flex-1 flex flex-col p-6 lg:p-8 space-y-4">
       <div className="flex justify-between">
          <div className="h-4 bg-navy-800/50 rounded w-1/4"></div>
          <div className="h-6 bg-navy-800/50 rounded w-16"></div>
       </div>
       <div className="h-8 bg-navy-800/50 rounded w-3/4"></div>
       <div className="h-4 bg-navy-800/50 rounded w-full"></div>
       <div className="h-4 bg-navy-800/50 rounded w-2/3"></div>
       <div className="mt-auto pt-6 flex justify-between items-center">
          <div className="h-4 bg-navy-800/50 rounded w-1/4"></div>
          <div className="h-10 bg-navy-800/50 rounded w-32"></div>
       </div>
    </div>
  </div>
);

export const Courses: React.FC = () => {
  const { courses, user, checkAccess, siteSettings, coursesLoading } = useStore();
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
      navigate('/login');
    } else {
      navigate(`/course/${courseId}`);
    }
  };

  const getLevelLabel = (level: string | undefined) => {
    if (!level) return t('level_intermediate');
    const l = level.toLowerCase();
    if (l.includes('begin') || l.includes('مبتدئ')) return t('level_beginner');
    if (l.includes('inter') || l.includes('متوسط')) return t('level_intermediate');
    if (l.includes('expert') || l.includes('خبير')) return t('level_expert');
    return level;
  };

  // VISIBILITY LOGIC:
  // 1. Logged In: Show ALL courses (Free + Paid)
  // 2. Logged Out: Show ONLY Free courses
  const visibleCourses = user 
    ? courses 
    : courses.filter(c => !c.is_paid);

  return (
    <div className="min-h-screen pt-40 pb-20" dir={dir}>
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            {getContent('courses_main_title') || t('courses')}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {user 
              ? (getContent('courses_main_desc') || t('latest_courses_sub'))
              : 'سجل الدخول لمشاهدة الكورسات المدفوعة والاحترافية'
            }
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid gap-8">
          {coursesLoading ? (
             <>
               <CourseCardSkeleton />
               <CourseCardSkeleton />
             </>
          ) : visibleCourses.length === 0 ? (
            <div className="text-center text-gray-500 py-10 col-span-full bg-navy-900/50 rounded-2xl border border-white/5 p-10">
              <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-xl font-bold">{t('no_courses')}</p>
              {!user && <p className="text-sm mt-2 text-gold-500">ملاحظة: الكورسات المدفوعة تظهر فقط للأعضاء المسجلين.</p>}
            </div>
          ) : (
            visibleCourses.map((course, idx) => {
                const hasAccess = checkAccess(course);
                return (
                <div 
                    key={course.id} 
                    onClick={() => handleCourseClick(course.id)}
                    className="group glass-card overflow-hidden flex flex-col lg:flex-row hover:border-gold-500/30 transition-all duration-500 cursor-pointer bg-[#080b14]/80"
                    style={{ animationDelay: `${idx * 100}ms` }}
                >
                    {/* Image Section */}
                    <div className="lg:w-1/3 relative h-64 lg:h-auto overflow-hidden bg-black">
                    {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-navy-800"><Play size={48} className="text-gray-600" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 to-transparent lg:bg-gradient-to-r"></div>
                    
                    {/* Badges */}
                    <div className={`absolute top-4 z-10 flex flex-col gap-2 ${dir === 'rtl' ? 'right-4' : 'left-4'}`}>
                        {course.is_paid ? (
                        <span className="bg-navy-950/90 text-gold-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-gold-500/30 flex items-center gap-1 shadow-lg backdrop-blur-sm w-fit">
                            <Crown size={12} fill="currentColor" /> {t('premium')}
                        </span>
                        ) : (
                        <span className="bg-green-500/90 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg backdrop-blur-sm w-fit">{t('free')}</span>
                        )}
                    </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 flex flex-col relative">
                    <div className="p-6 lg:p-8 pb-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                <Star key={i} size={16} className={i < Math.floor(course.rating) ? "text-gold-500 fill-gold-500" : "text-gray-700"} />
                                ))}
                                <span className={`text-sm text-gray-500 ${dir === 'rtl' ? 'mr-2' : 'ml-2'}`}>({course.rating})</span>
                            </div>
                            <span className="text-xs font-bold text-gold-500/80 bg-gold-500/5 px-2 py-1 rounded border border-gold-500/10 flex items-center gap-1">
                            <BarChart3 size={12} /> {getLevelLabel(course.level)}
                            </span>
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-gold-400 transition-colors">{course.title}</h2>
                        <p className="text-gray-400 mb-6 line-clamp-2 lg:line-clamp-3 leading-relaxed">{course.description}</p>

                        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                            <Clock size={16} className="text-gold-500" />
                            <span>{formatDuration(course.duration, language)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                            <BookOpen size={16} className="text-gold-500" />
                            <span>{course.lesson_count || 0} {t('lessons_count')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Card Footer / Action Area */}
                    <div className="mt-auto p-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between group-hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${hasAccess ? 'border-gold-500 text-gold-500' : 'border-gray-600 text-gray-600'}`}>
                                {hasAccess ? <Play size={18} fill="currentColor" /> : <Lock size={18} />}
                            </div>
                            <span className={`text-sm font-bold ${hasAccess ? 'text-white' : 'text-gray-500'}`}>
                                {hasAccess ? t('watch_now') : t('login_to_access')}
                            </span>
                        </div>

                        <button className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg ${
                            hasAccess 
                            ? 'bg-gold-500 text-navy-950 hover:bg-gold-400 hover:scale-105 shadow-gold-500/20' 
                            : 'bg-navy-800 text-gray-400 hover:bg-navy-700 border border-white/5'
                        }`}>
                            {hasAccess ? t('start_watching') : t('login_to_access')}
                        </button>
                    </div>
                    </div>
                </div>
                );
            })
          )}
        </div>
      </div>
    </div>
  );
};
