import React from 'react';
import { useStore } from '../context/Store';
import { useNavigate } from 'react-router-dom';
import { Play, Star, Clock, BookOpen, Crown, Lock } from 'lucide-react';

export const Courses: React.FC = () => {
  const { courses, user, checkAccess } = useStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-navy-950 pt-40 pb-20">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            البرامج <span className="text-gold-500">التدريبية</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            اختر المسار التعليمي المناسب لمستواك وابدأ رحلة الاحتراف
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid gap-8">
          {courses.map((course, idx) => {
            const hasAccess = checkAccess(course);
            return (
              <div 
                key={course.id} 
                className="group glass-card overflow-hidden flex flex-col lg:flex-row hover:border-gold-500/30 transition-all duration-500 bg-navy-900"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Image Section (Right on Desktop due to RTL) */}
                <div className="lg:w-1/3 relative h-64 lg:h-auto overflow-hidden bg-black">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-navy-800"><Play size={48} className="text-gray-600" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 to-transparent lg:bg-gradient-to-r"></div>
                  
                  {/* Badges */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                    {course.is_paid ? (
                      <span className="bg-navy-950/90 text-gold-400 px-3 py-1 rounded-lg text-xs font-bold border border-gold-500/30 flex items-center gap-1 shadow-lg backdrop-blur-sm w-fit">
                        <Crown size={12} fill="currentColor" /> Premium
                      </span>
                    ) : (
                      <span className="bg-green-500/90 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-lg backdrop-blur-sm w-fit">Free</span>
                    )}
                    <span className="bg-white/10 text-white px-3 py-1 rounded-lg text-xs font-bold backdrop-blur-sm w-fit border border-white/10">
                      {course.level || 'متوسط'}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-6 lg:p-8 flex flex-col justify-center relative">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className={i < Math.floor(course.rating) ? "text-gold-500 fill-gold-500" : "text-gray-700"} />
                    ))}
                    <span className="text-sm text-gray-500 mr-2">({course.rating})</span>
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-gold-400 transition-colors">{course.title}</h2>
                  <p className="text-gray-400 mb-6 line-clamp-2 lg:line-clamp-none leading-relaxed">{course.description}</p>

                  <div className="flex flex-wrap items-center gap-6 mb-8 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-gold-500" />
                      <span>{course.duration || '15 ساعة'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className="text-gold-500" />
                      <span>{course.lesson_count || 12} درس</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <button 
                      onClick={() => navigate(`/course/${course.id}`)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${hasAccess ? 'bg-gold-500 text-navy-950 hover:scale-110 shadow-[0_0_20px_rgba(255,215,0,0.4)]' : 'bg-navy-800 text-gray-500 cursor-not-allowed'}`}
                    >
                      {hasAccess ? <Play size={20} fill="currentColor" /> : <Lock size={20} />}
                    </button>
                    <span className={`text-sm font-bold ${hasAccess ? 'text-gold-400' : 'text-gray-500'}`}>
                      {hasAccess ? 'ابدأ المشاهدة' : 'مغلق'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Teaser Card */}
          {user && (
            <div className="glass-card border-gold-500/20 p-8 flex flex-col items-center justify-center text-center min-h-[250px] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-full bg-navy-900 border border-gold-500/30 flex items-center justify-center mb-4 mx-auto shadow-[0_0_30px_rgba(255,215,0,0.15)] animate-pulse-slow">
                  <Lock className="text-gold-500" size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Master Class Pro</h3>
                <p className="text-gray-400 text-sm mb-4">كورس احترافي متقدم.. قريباً</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
