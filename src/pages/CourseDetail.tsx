import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/Store';
import { supabase } from '../lib/supabase';
import { Lesson, Course } from '../types';
import ReactPlayer from 'react-player';
import { Lock, PlayCircle, ChevronRight, ChevronLeft, Menu, X } from 'lucide-react';

export const CourseDetail: React.FC = () => {
  const { id } = useParams();
  const { user, checkAccess } = useStore();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      const { data: courseData } = await supabase.from('courses').select('*').eq('id', id).single();
      setCourse(courseData);

      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', id)
        .order('order', { ascending: true });
      
      if (lessonsData) {
        setLessons(lessonsData);
        if (lessonsData.length > 0) setActiveLesson(lessonsData[0]);
      }
      setLoading(false);
    };

    fetchData();
  }, [id]);

  // Responsive Sidebar Logic
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Init
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gold-500 bg-navy-950 font-bold text-xl">جاري التحميل...</div>;
  if (!course) return <div className="min-h-screen flex items-center justify-center bg-navy-950 text-white font-bold text-xl">الكورس غير موجود</div>;

  const hasAccess = checkAccess(course);

  // Access Denied / Locked Screen
  if (!hasAccess) {
    return (
      <div className="min-h-screen pt-[160px] flex flex-col items-center justify-center text-center px-4 bg-navy-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-navy-900 to-navy-950 -z-10"></div>
        
        <div className="glass-card p-12 max-w-2xl w-full border-red-500/20 shadow-2xl relative z-10 animate-fade-in">
          <div className="w-24 h-24 bg-navy-900 rounded-full flex items-center justify-center mb-8 border border-gold-500/20 shadow-[0_0_40px_rgba(255,215,0,0.15)] mx-auto animate-pulse-slow">
            <Lock size={48} className="text-gold-500" />
          </div>
          <h1 className="text-3xl font-bold mb-4 text-white">{course.title}</h1>
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl mb-8">
            <p className="text-red-400 font-bold text-lg mb-2">
              {course.is_paid ? 'هذا الكورس مدفوع (Premium)' : 'يجب تفعيل حسابك أولاً'}
            </p>
            <p className="text-gray-400 text-sm leading-relaxed">
              {course.is_paid 
                ? 'هذا المحتوى حصري للمشتركين. يرجى التواصل مع إدارة المنصة للاشتراك والحصول على صلاحية الوصول الفوري.' 
                : 'حسابك لا يزال قيد المراجعة. يرجى انتظار تفعيل المشرف لتتمكن من الوصول للمحتوى التعليمي.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/')} className="bg-white/5 hover:bg-white/10 text-white px-8 py-3 rounded-xl font-bold transition-colors border border-white/5">
              العودة للرئيسية
            </button>
            <a href="https://t.me/your_telegram" target="_blank" rel="noreferrer" className="bg-gold-500 text-navy-950 px-8 py-3 rounded-xl font-bold hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/20">
              تواصل مع الدعم
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Active Player Interface
  // Fixed padding-top to 120px (Navbar + Ticker) to prevent overlap
  return (
    <div className="h-screen pt-[120px] bg-navy-950 flex flex-col overflow-hidden">
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col bg-black relative z-0">
          <div className="flex-1 relative">
             {activeLesson ? (
              <ReactPlayer 
                url={activeLesson.video_url} 
                width="100%" 
                height="100%" 
                controls 
                playing
                config={{ youtube: { playerVars: { showinfo: 0, modestbranding: 1, rel: 0 } } }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">اختر درساً للمشاهدة</div>
            )}
          </div>
          
          {/* Video Controls / Info Bar */}
          <div className="h-20 bg-navy-900 border-t border-white/10 flex items-center justify-between px-4 md:px-8 shrink-0 z-20 relative">
            <div className="flex items-center gap-4 overflow-hidden">
               <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-white p-2 hover:bg-white/5 rounded-lg"><Menu /></button>
               <div className="min-w-0">
                 <h2 className="text-white font-bold text-sm md:text-lg truncate">{activeLesson?.title}</h2>
                 <p className="text-gray-500 text-xs hidden md:block truncate">{course.title}</p>
               </div>
            </div>
            <div className="flex gap-3 shrink-0">
               <button 
                 disabled={!lessons.length || activeLesson?.id === lessons[0].id}
                 onClick={() => {
                   const idx = lessons.findIndex(l => l.id === activeLesson?.id);
                   if (idx > 0) setActiveLesson(lessons[idx - 1]);
                 }}
                 className="flex items-center gap-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm disabled:opacity-30 disabled:cursor-not-allowed border border-white/5 transition-colors"
               >
                 <ChevronRight size={16} /> <span className="hidden sm:inline">السابق</span>
               </button>
               <button 
                 disabled={!lessons.length || activeLesson?.id === lessons[lessons.length - 1].id}
                 onClick={() => {
                   const idx = lessons.findIndex(l => l.id === activeLesson?.id);
                   if (idx < lessons.length - 1) setActiveLesson(lessons[idx + 1]);
                 }}
                 className="flex items-center gap-1 px-4 py-2 bg-gold-500 text-navy-950 hover:bg-gold-400 rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-gold-500/10"
               >
                 <span className="hidden sm:inline">التالي</span> <ChevronLeft size={16} />
               </button>
            </div>
          </div>
        </div>

        {/* Sidebar Playlist Overlay (Mobile) / Side (Desktop) */}
        <div className={`fixed lg:relative inset-y-0 right-0 w-80 lg:w-96 bg-navy-900/95 lg:bg-navy-900 backdrop-blur-xl lg:backdrop-blur-none border-l lg:border-r border-white/5 flex flex-col transition-transform duration-300 z-30 pt-[120px] lg:pt-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:!w-0 lg:!border-0 lg:overflow-hidden'}`}>
          
          {/* Mobile Close Button */}
          <div className="lg:hidden absolute top-[130px] left-4 z-50">
            <button onClick={() => setSidebarOpen(false)} className="p-2 bg-navy-800 rounded-full text-white shadow-lg"><X size={20} /></button>
          </div>

          <div className="p-6 border-b border-white/5 bg-navy-900 shrink-0">
            <h3 className="font-bold text-white text-lg">محتوى الكورس</h3>
            <div className="flex items-center justify-between mt-2">
               <p className="text-xs text-gray-400">{lessons.length} درس</p>
               <span className={`text-[10px] px-2 py-0.5 rounded border ${course.is_paid ? 'border-gold-500/30 text-gold-400 bg-gold-500/10' : 'border-green-500/30 text-green-400 bg-green-500/10'}`}>
                 {course.is_paid ? 'Premium' : 'Free'}
               </span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {lessons.map((lesson, idx) => (
              <button
                key={lesson.id}
                onClick={() => { setActiveLesson(lesson); if(window.innerWidth < 1024) setSidebarOpen(false); }}
                className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all text-right group ${
                  activeLesson?.id === lesson.id 
                    ? 'bg-gold-500/10 border border-gold-500/30 shadow-[0_0_15px_rgba(255,215,0,0.05)]' 
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="relative w-20 h-12 bg-black rounded-lg overflow-hidden shrink-0 border border-white/5">
                  {lesson.thumbnail ? (
                    <img src={lesson.thumbnail} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-navy-800"><PlayCircle size={20} className="text-gray-600" /></div>
                  )}
                  {activeLesson?.id === lesson.id && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-gold-500 rounded-full animate-pulse shadow-[0_0_10px_#FFD700]"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-bold line-clamp-2 mb-1 ${activeLesson?.id === lesson.id ? 'text-gold-400' : 'text-gray-300 group-hover:text-white'}`}>
                    {idx + 1}. {lesson.title}
                  </h4>
                  <span className="text-[10px] text-gray-500 font-mono">{lesson.duration}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
