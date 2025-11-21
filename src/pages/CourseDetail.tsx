import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/Store';
import { supabase } from '../lib/supabase';
import { Lesson, Course, LessonProgress } from '../types';
import { VideoPlayer } from '../components/VideoPlayer';
import { 
  Lock, PlayCircle, ChevronRight, ChevronLeft, Menu, X, 
  CheckCircle, FileText, Download, Layout, MonitorPlay, CheckCircle2
} from 'lucide-react';

export const CourseDetail: React.FC = () => {
  const { id } = useParams();
  const { checkAccess, user } = useStore();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'resources'>('overview');
  const [progressMap, setProgressMap] = useState<Record<string, LessonProgress>>({});

  // Fetch Data
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        // 1. Fetch Course
        const { data: courseData } = await supabase.from('courses').select('*').eq('id', id).single();
        setCourse(courseData);

        // 2. Fetch Lessons with Subtitles
        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('*, subtitles:lesson_subtitles(*)')
          .eq('course_id', id)
          .eq('is_published', true) // Only published lessons
          .order('order', { ascending: true });
        
        if (lessonsData && lessonsData.length > 0) {
          setLessons(lessonsData);
          setActiveLesson(lessonsData[0]);
        }

        // 3. Fetch Progress
        if (user) {
            const { data: progressData } = await supabase
                .from('lesson_progress')
                .select('*')
                .eq('user_id', user.id);
            
            const pMap: Record<string, LessonProgress> = {};
            progressData?.forEach((p: any) => {
                pMap[p.lesson_id] = p;
            });
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

  // Listen for progress updates (real-time feel)
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

  // Calculate overall progress
  const completedCount = Object.values(progressMap).filter(p => p.is_completed).length;
  const totalLessons = lessons.length;
  const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#020617] text-gold-500">جاري التحميل...</div>;
  if (!course) return <div className="min-h-screen flex items-center justify-center text-white">الكورس غير موجود</div>;

  const hasAccess = checkAccess(course);
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-center p-4">
        <Lock size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">محتوى مغلق</h2>
        <p className="text-gray-400 mb-6">يجب الاشتراك في الكورس لمشاهدة الدروس.</p>
        <button onClick={() => navigate('/')} className="btn-gold px-8 py-3">العودة للرئيسية</button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#020617] overflow-hidden font-cairo text-right" dir="rtl">
      
      {/* Header */}
      <header className="h-16 bg-[#0f172a] border-b border-white/5 flex items-center justify-between px-4 shrink-0 z-20 shadow-md">
        <div className="flex items-center gap-4 overflow-hidden">
          <button onClick={() => navigate('/courses')} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white"><X size={24} /></button>
          <div className="border-r border-white/10 pr-4 mr-2">
            <h1 className="text-white font-bold text-sm md:text-base truncate max-w-[200px] md:max-w-md">{course.title}</h1>
            <p className="text-xs text-gray-500 truncate">{activeLesson?.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="hidden md:flex items-center gap-2 text-xs font-bold bg-gold-500/10 text-gold-500 px-3 py-1.5 rounded-full border border-gold-500/20">
              <CheckCircle size={14} />
              <span>مكتمل: {progressPercentage}%</span>
           </div>
           <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2 rounded-lg transition-colors ${sidebarOpen ? 'bg-gold-500 text-[#020617]' : 'bg-white/5 text-white'}`}>
            {sidebarOpen ? <Layout size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Player Area */}
        <main className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-[#020617] relative">
          <div className="w-full bg-black relative shadow-2xl shrink-0 aspect-video max-h-[75vh]">
            {activeLesson ? (
                <VideoPlayer 
                    key={activeLesson.id}
                    url={activeLesson.video_url} 
                    lessonId={activeLesson.id!}
                    subtitles={activeLesson.subtitles}
                    onEnded={handleNextLesson}
                />
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500">اختر درساً للبدء</div>
            )}
          </div>

          {/* Details & Tabs */}
          <div className="p-6 max-w-5xl mx-auto w-full">
             <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <button onClick={handlePrevLesson} disabled={!activeLesson || lessons[0]?.id === activeLesson.id} className="flex items-center gap-2 text-gray-400 hover:text-white disabled:opacity-30">
                  <ChevronRight size={20} /> السابق
                </button>
                <button onClick={handleNextLesson} disabled={!activeLesson || lessons[lessons.length-1]?.id === activeLesson.id} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-bold transition-all border border-white/10 disabled:opacity-30">
                  التالي <ChevronLeft size={20} />
                </button>
             </div>

             <div className="flex items-center gap-8 border-b border-white/10 mb-6">
                <button onClick={() => setActiveTab('overview')} className={`pb-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'overview' ? 'border-gold-500 text-gold-500' : 'border-transparent text-gray-400'}`}>
                  <FileText size={18} /> التفاصيل
                </button>
                <button onClick={() => setActiveTab('resources')} className={`pb-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'resources' ? 'border-gold-500 text-gold-500' : 'border-transparent text-gray-400'}`}>
                  <Download size={18} /> المرفقات
                </button>
             </div>

             <div className="animate-fade-in min-h-[200px]">
                {activeTab === 'overview' && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                      <MonitorPlay className="text-gold-500" size={24} />
                      {activeLesson?.title}
                    </h2>
                    <p className="text-gray-300 leading-loose text-lg whitespace-pre-wrap">
                        {activeLesson?.description || "لا يوجد وصف متاح."}
                    </p>
                  </div>
                )}
                {activeTab === 'resources' && (
                  <div className="bg-[#0f172a] rounded-xl border border-white/5 p-8 text-center">
                    <p className="text-gray-500">لا توجد مرفقات لهذا الدرس.</p>
                  </div>
                )}
             </div>
          </div>
        </main>

        {/* Sidebar Playlist */}
        <aside className={`fixed lg:relative inset-y-0 right-0 w-80 bg-[#0f172a] border-l border-white/5 flex flex-col transition-all duration-300 z-30 shadow-2xl ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:!w-0 lg:!border-0 lg:overflow-hidden'}`} style={{ paddingTop: window.innerWidth < 1024 ? '64px' : '0' }}>
          <div className="p-5 border-b border-white/5 bg-[#0f172a] sticky top-0 z-10">
            <h3 className="font-bold text-white text-lg mb-1">محتوى الكورس</h3>
            <p className="text-xs text-gray-500">{completedCount} / {totalLessons} مكتمل</p>
            <div className="w-full bg-navy-900 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-gold-500 transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {lessons.map((lesson, idx) => {
              const isActive = activeLesson?.id === lesson.id;
              const isCompleted = progressMap[lesson.id!]?.is_completed;
              
              return (
                <button
                  key={lesson.id}
                  onClick={() => { setActiveLesson(lesson); if (window.innerWidth < 1024) setSidebarOpen(false); }}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl transition-all text-right group border ${isActive ? 'bg-gold-500/10 border-gold-500/30' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                >
                  <div className="relative">
                      <div className={`mt-0.5 w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${isActive ? 'bg-gold-500 text-[#020617]' : isCompleted ? 'bg-green-500/20 text-green-500' : 'bg-[#020617] text-gray-500 border border-white/10'}`}>
                        {isActive ? <PlayCircle size={14} fill="currentColor" /> : isCompleted ? <CheckCircle2 size={14} /> : idx + 1}
                      </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold mb-1 transition-colors ${isActive ? 'text-gold-400' : isCompleted ? 'text-gray-300' : 'text-gray-400 group-hover:text-white'}`}>
                      {lesson.title}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
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
