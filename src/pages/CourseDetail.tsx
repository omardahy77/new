import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/Store';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { Lesson, Course, LessonProgress } from '../types';
import { VideoPlayer } from '../components/VideoPlayer';
import { 
  Lock, PlayCircle, ChevronRight, ChevronLeft, Menu, X, 
  CheckCircle, MonitorPlay, CheckCircle2, Play
} from 'lucide-react';

export const CourseDetail: React.FC = () => {
  const { id } = useParams();
  const { checkAccess, user } = useStore();
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [progressMap, setProgressMap] = useState<Record<string, LessonProgress>>({});

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const { data: courseData } = await supabase.from('courses').select('*').eq('id', id).single();
        setCourse(courseData);

        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('*, subtitles:lesson_subtitles(*)')
          .eq('course_id', id)
          .eq('is_published', true)
          .order('order', { ascending: true });
        
        if (lessonsData && lessonsData.length > 0) {
          setLessons(lessonsData);
          setActiveLesson(lessonsData[0]);
        }

        if (user) {
            const { data: progressData } = await supabase.from('lesson_progress').select('*').eq('user_id', user.id);
            const pMap: Record<string, LessonProgress> = {};
            progressData?.forEach((p: any) => { pMap[p.lesson_id] = p; });
            setProgressMap(pMap);
        }
      } catch (error) {
        console.error("Error fetching course:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
        .channel('progress_updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'lesson_progress', filter: `user_id=eq.${user.id}` }, (payload) => {
            const newProgress = payload.new as LessonProgress;
            setProgressMap(prev => ({ ...prev, [newProgress.lesson_id]: newProgress }));
        })
        .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleNextLesson = () => {
    if (!activeLesson || !lessons.length) return;
    const currentIndex = lessons.findIndex(l => l.id === activeLesson.id);
    if (currentIndex < lessons.length - 1) {
      setActiveLesson(lessons[currentIndex + 1]);
    }
  };

  const handlePrevLesson = () => {
    if (!activeLesson || !lessons.length) return;
    const currentIndex = lessons.findIndex(l => l.id === activeLesson.id);
    if (currentIndex > 0) {
      setActiveLesson(lessons[currentIndex - 1]);
    }
  };

  const completedCount = Object.values(progressMap).filter(p => p.is_completed).length;
  const totalLessons = lessons.length;
  const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-navy-950 text-gold-500">{t('loading')}</div>;
  if (!course) return <div className="min-h-screen flex items-center justify-center text-white">Course not found</div>;
  if (!user) { navigate('/register'); return null; }

  if (!checkAccess(course)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-navy-950 text-center p-4 pt-[120px]">
        <Lock size={48} className="text-gold-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">{t('locked_content')}</h2>
        <p className="text-gray-400 mb-6">{t('must_subscribe')}</p>
        <button onClick={() => navigate('/')} className="btn-gold px-8 py-3">{t('back_home')}</button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-navy-950 overflow-hidden font-cairo pt-[115px]" dir={dir}>
      
      {/* Professional Header */}
      <header className="h-16 bg-navy-900 border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-20 shadow-lg relative">
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold-500/30 to-transparent"></div>
        
        <div className="flex items-center gap-4 overflow-hidden">
          <button onClick={() => navigate('/courses')} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
          <div className={`border-${dir === 'rtl' ? 'l' : 'r'} border-white/10 px-4 mx-2`}>
            <h1 className="text-white font-bold text-sm md:text-base truncate max-w-[200px] md:max-w-md text-gold-gradient">{course.title}</h1>
            <p className="text-xs text-gray-400 truncate">{activeLesson?.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="hidden md:flex items-center gap-2 text-xs font-bold bg-navy-800 text-gold-400 px-4 py-2 rounded-full border border-gold-500/10 shadow-inner">
              <CheckCircle size={14} />
              <span>{t('completed')}: {progressPercentage}%</span>
           </div>
           <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2 rounded-lg transition-all duration-300 ${sidebarOpen ? 'bg-gold-500 text-navy-950 shadow-[0_0_15px_rgba(255,215,0,0.3)]' : 'bg-navy-800 text-white hover:bg-navy-700'}`}>
            {sidebarOpen ? <Menu size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative bg-navy-950">
        
        {/* Player Area */}
        <main className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative">
          <div className="w-full bg-black relative shadow-2xl shrink-0 aspect-video max-h-[75vh] border-b border-white/5 group">
            {activeLesson ? (
                <VideoPlayer 
                    key={activeLesson.id}
                    url={activeLesson.video_url} 
                    lessonId={activeLesson.id!}
                    subtitles={activeLesson.subtitles}
                    onEnded={handleNextLesson}
                />
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500 bg-navy-900">
                    <div className="text-center">
                        <PlayCircle size={48} className="mx-auto mb-2 opacity-50" />
                        <p>{t('select_lesson')}</p>
                    </div>
                </div>
            )}
          </div>

          {/* Details */}
          <div className="p-8 max-w-5xl mx-auto w-full">
             <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <button onClick={handlePrevLesson} disabled={!activeLesson || lessons[0]?.id === activeLesson.id} className="flex items-center gap-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors">
                  {dir === 'rtl' ? <ChevronRight size={20} /> : <ChevronLeft size={20} />} {t('prev_lesson')}
                </button>
                <button onClick={handleNextLesson} disabled={!activeLesson || lessons[lessons.length-1]?.id === activeLesson.id} className="flex items-center gap-2 bg-navy-800 hover:bg-navy-700 text-white px-6 py-3 rounded-xl font-bold transition-all border border-white/10 shadow-lg disabled:opacity-30 disabled:cursor-not-allowed">
                  {t('next_lesson')} {dir === 'rtl' ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>
             </div>

             <div className="animate-fade-in min-h-[200px]">
                <div className="bg-navy-900/30 p-6 rounded-2xl border border-white/5">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy-800 flex items-center justify-center text-gold-500 border border-white/5">
                        <MonitorPlay size={20} />
                    </div>
                    {activeLesson?.title}
                  </h2>
                  <p className={`text-gray-300 leading-loose text-lg whitespace-pre-wrap ${dir === 'rtl' ? 'pl-4 border-r-2 mr-2 pr-4' : 'pr-4 border-l-2 ml-2 pl-4'} border-gold-500/20`}>
                      {activeLesson?.description || t('no_desc')}
                  </p>
                </div>
             </div>
          </div>
        </main>

        {/* Sidebar Playlist */}
        <aside className={`fixed lg:relative inset-y-0 ${dir === 'rtl' ? 'right-0' : 'left-0'} w-80 bg-[#0C1220] border-l border-white/5 flex flex-col transition-all duration-300 z-30 shadow-2xl ${sidebarOpen ? 'translate-x-0' : (dir === 'rtl' ? 'translate-x-full' : '-translate-x-full') + ' lg:!w-0 lg:!border-0 lg:overflow-hidden'}`} style={{ paddingTop: window.innerWidth < 1024 ? '64px' : '0' }}>
          <div className="p-6 border-b border-white/5 bg-[#0C1220] sticky top-0 z-10">
            <h3 className="font-bold text-white text-lg mb-2">{t('course_content')}</h3>
            <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>{t('general_progress')}</span>
                <span>{completedCount} / {totalLessons}</span>
            </div>
            <div className="w-full bg-navy-950 h-2 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-500 shadow-[0_0_10px_rgba(255,215,0,0.3)]" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 bg-[#080C15]">
            {lessons.map((lesson, idx) => {
              const isActive = activeLesson?.id === lesson.id;
              const isCompleted = progressMap[lesson.id!]?.is_completed;
              
              return (
                <button
                  key={lesson.id}
                  onClick={() => { setActiveLesson(lesson); if (window.innerWidth < 1024) setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${dir === 'rtl' ? 'text-right' : 'text-left'} group border relative overflow-hidden ${
                    isActive 
                      ? 'bg-navy-800 border-gold-500/40 shadow-lg' 
                      : 'bg-navy-900/40 border-white/5 hover:bg-navy-800 hover:border-white/10'
                  }`}
                >
                  {isActive && <div className={`absolute ${dir === 'rtl' ? 'left-0' : 'right-0'} top-0 bottom-0 w-1 bg-gold-500`}></div>}
                  
                  <div className="relative shrink-0">
                      {lesson.thumbnail_url ? (
                          <div className={`w-16 h-10 rounded-lg overflow-hidden border ${isActive ? 'border-gold-500' : 'border-white/10'} shadow-sm`}>
                              <img src={lesson.thumbnail_url} className="w-full h-full object-cover" />
                          </div>
                      ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${isActive ? 'bg-gold-500 text-navy-950' : isCompleted ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-navy-950 text-gray-500 border border-white/10'}`}>
                            {isActive ? <Play size={12} fill="currentColor" /> : isCompleted ? <CheckCircle2 size={14} /> : idx + 1}
                          </div>
                      )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold mb-1 transition-colors line-clamp-1 ${isActive ? 'text-gold-400' : isCompleted ? 'text-gray-400' : 'text-gray-300 group-hover:text-white'}`}>
                      {lesson.title}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                      <span>{lesson.duration}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
};
