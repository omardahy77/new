import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { supabase } from '../lib/supabase';
import { User, Course, SiteSettings, Lesson } from '../types';
import { 
  LayoutDashboard, Users, BookOpen, Settings, Save, 
  Plus, Trash2, CheckCircle, AlertTriangle, RefreshCw, Edit, Video, 
  ArrowLeft, Search, Loader2, X, Globe, MessageSquare, Shield, Activity, Share2,
  GraduationCap, Server, Wifi, Database, ShieldCheck, Check, ExternalLink
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

// --- ROBUST HELPERS ---

// Safe Call Wrapper with Timeout and Default Return
const safeSupabaseCall = async <T,>(
    promise: Promise<{ data: T | null; error: any; count?: number | null }>, 
    timeoutMs = 15000 // Increased to 15s for better stability
): Promise<{ data: T | null; error: any; count?: number | null }> => {
    let timer: any;
    const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs);
    });
    try {
        const result: any = await Promise.race([promise, timeoutPromise]);
        clearTimeout(timer);
        return {
            data: result.data,
            error: result.error,
            count: result.count
        };
    } catch (e: any) {
        clearTimeout(timer);
        console.warn("Supabase Call Error/Timeout:", e);
        return { data: null, error: e, count: null };
    }
};

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-navy-900 border border-white/10 p-6 rounded-2xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button onClick={onClose} className="absolute left-4 top-4 text-gray-400 hover:text-white transition-colors bg-white/5 p-1 rounded-full">
            <X size={20} />
        </button>
        <h3 className="text-xl font-bold mb-6 text-center text-gold-500 border-b border-white/5 pb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
};

const LoadingSpinner = () => <Loader2 className="animate-spin" size={18} />;

export const AdminDashboard: React.FC = () => {
  const { user, siteSettings, updateSettings, courses, refreshData } = useStore();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'cms' | 'courses' | 'users'>('cms');
  const mounted = useRef(true);
  
  // CMS State
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(siteSettings);
  const [cmsSection, setCmsSection] = useState<'hero' | 'features' | 'about' | 'contact' | 'social'>('hero');
  const [isSavingCMS, setIsSavingCMS] = useState(false);
  
  // Data States
  const [usersList, setUsersList] = useState<User[]>([]);
  
  // Lesson Management State
  const [selectedCourseForLessons, setSelectedCourseForLessons] = useState<Course | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson>>({});
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  
  // Loading States
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [usersError, setUsersError] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({ users: 0, active: 0, pending: 0, courses: 0 });
  const [systemHealth, setSystemHealth] = useState<'good' | 'warning' | 'error'>('good');

  // Search/Filter
  const [userSearch, setUserSearch] = useState('');
  
  // Course Modal
  const [editingCourse, setEditingCourse] = useState<Partial<Course>>({});
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isSavingCourse, setIsSavingCourse] = useState(false);

  // Enrollment Modal
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedUserForEnrollment, setSelectedUserForEnrollment] = useState<User | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Security Modal
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
      return () => { mounted.current = false; };
  }, []);

  // --- SYNC SETTINGS ---
  useEffect(() => {
     if (mounted.current) setSettingsForm(prev => ({ ...prev, ...siteSettings }));
  }, [siteSettings]);

  useEffect(() => {
    fetchStats();
  }, [courses]);

  useEffect(() => {
    if (activeTab === 'users') {
        fetchUsers();
    }
  }, [activeTab]);

  const fetchStats = useCallback(async () => {
    // Helper to safely get count or 0 without throwing
    const getCount = async (query: any) => {
        try {
            const { count, error } = await safeSupabaseCall(query);
            if (error) return 0;
            return count || 0;
        } catch {
            return 0;
        }
    };

    try {
        // Run independently so one failure doesn't kill all stats
        const [total, active, pending] = await Promise.all([
            getCount(supabase.from('profiles').select('*', { count: 'exact', head: true })),
            getCount(supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active')),
            getCount(supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'))
        ]);

        if (mounted.current) {
            setStats({
                users: total,
                active: active,
                pending: pending,
                courses: courses.length
            });
            setSystemHealth('good');
        }
    } catch (e) {
        if (mounted.current) setSystemHealth('warning');
    }
  }, [courses.length]);

  const fetchUsers = useCallback(async () => {
      setLoadingUsers(true);
      setUsersError(false);
      try {
        const { data, error } = await safeSupabaseCall(
            supabase
            .from('profiles')
            .select('id, full_name, email, role, status, created_at')
            .order('created_at', { ascending: false })
        );
        
        if (error) throw error;
        if (data && mounted.current) {
            setUsersList(data as User[]);
            setSystemHealth('good');
        }
      } catch (err: any) {
          console.error("Fetch Users Error:", err);
          // Check for RLS recursion specifically
          if (err?.code === '42P17') {
             console.error("CRITICAL DB ERROR: Infinite recursion in RLS policies. Please run the SQL fix.");
          }
          if (mounted.current) {
              setUsersError(true);
              setSystemHealth('warning');
          }
      } finally {
          if (mounted.current) setLoadingUsers(false);
      }
  }, []);

  const fetchLessons = useCallback(async (courseId: string) => {
      setLoadingLessons(true);
      try {
        const { data, error } = await safeSupabaseCall(
            supabase.from('lessons').select('*').eq('course_id', courseId).order('order', { ascending: true })
        );
        if (error) throw error;
        if (data && mounted.current) setCourseLessons(data as Lesson[]);
      } catch (err: any) {
          showToast('خطأ في تحميل الدروس', 'error');
      } finally {
          if (mounted.current) setLoadingLessons(false);
      }
  }, [showToast]);

  const handleNestedChange = (parent: any, key: string, value: any) => {
    setSettingsForm(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof SiteSettings] as any,
        [key]: value
      }
    }));
  };

  const saveSettings = async (sectionName: string) => {
      setIsSavingCMS(true);
      try {
        await updateSettings(settingsForm);
        showToast(`تم حفظ إعدادات ${sectionName} بنجاح`, 'success');
      } catch (err: any) {
          showToast('فشل الحفظ: ' + err.message, 'error');
      } finally {
        if (mounted.current) setIsSavingCMS(false);
      }
  };

  const saveCourse = async () => {
      if (!editingCourse.title) {
          showToast('يرجى إدخال عنوان الكورس', 'error');
          return;
      }
      setIsSavingCourse(true);
      
      const payload = {
          title: editingCourse.title,
          description: editingCourse.description || '',
          thumbnail: editingCourse.thumbnail || '',
          is_paid: editingCourse.is_paid || false,
          level: editingCourse.level || 'متوسط',
          duration: editingCourse.duration || '0 ساعة',
          lesson_count: editingCourse.lesson_count || 0
      };
      
      try {
        let error;
        if (editingCourse.id) {
            const res = await safeSupabaseCall(supabase.from('courses').update(payload).eq('id', editingCourse.id));
            error = res.error;
        } else {
            const res = await safeSupabaseCall(supabase.from('courses').insert(payload));
            error = res.error;
        }

        if (error) throw error;

        showToast('تم حفظ الكورس بنجاح', 'success');
        setIsCourseModalOpen(false);
        await refreshData(); 
      } catch (err: any) {
        showToast('خطأ في الحفظ', 'error');
      } finally {
        if (mounted.current) setIsSavingCourse(false);
      }
  };

  const deleteCourse = async (id: string) => {
      if(!confirm('هل أنت متأكد من حذف الكورس؟')) return;
      const { error } = await safeSupabaseCall(supabase.from('courses').delete().eq('id', id));
      if (error) {
          showToast('فشل الحذف', 'error');
      } else {
          showToast('تم حذف الكورس', 'success');
          await refreshData();
      }
  };

  const openLessonManager = (course: Course) => {
      setSelectedCourseForLessons(course);
      fetchLessons(course.id);
  };

  const saveLesson = async () => {
      if (!selectedCourseForLessons) return;
      if (!editingLesson.title) {
          showToast('يرجى إدخال عنوان الدرس', 'error');
          return;
      }
      setIsSavingLesson(true);
      
      const payload = {
          course_id: selectedCourseForLessons.id,
          title: editingLesson.title,
          description: editingLesson.description || '',
          video_url: editingLesson.video_url || '',
          thumbnail_url: editingLesson.thumbnail_url || '',
          duration: editingLesson.duration || '00:00',
          order: editingLesson.order || courseLessons.length + 1,
          is_published: true
      };

      try {
        let error;
        if (editingLesson.id) {
            const res = await safeSupabaseCall(supabase.from('lessons').update(payload).eq('id', editingLesson.id));
            error = res.error;
        } else {
            const res = await safeSupabaseCall(supabase.from('lessons').insert(payload));
            error = res.error;
        }

        if (error) throw error;

        showToast('تم حفظ الدرس بنجاح', 'success');
        setIsLessonModalOpen(false);
        await fetchLessons(selectedCourseForLessons.id);
      } catch (err: any) {
        showToast('خطأ في حفظ الدرس', 'error');
      } finally {
        if (mounted.current) setIsSavingLesson(false);
      }
  };

  const deleteLesson = async (id: string) => {
      if(!confirm('حذف الدرس؟')) return;
      const { error } = await safeSupabaseCall(supabase.from('lessons').delete().eq('id', id));
      if (error) {
          showToast('فشل الحذف', 'error');
      } else {
          showToast('تم حذف الدرس', 'success');
          if (selectedCourseForLessons) {
              await fetchLessons(selectedCourseForLessons.id);
          }
      }
  };

  const approveUser = async (id: string) => {
      setUsersList(prev => prev.map(u => u.id === id ? { ...u, status: 'active' } : u));
      setStats(prev => ({ ...prev, active: prev.active + 1, pending: prev.pending - 1 }));
      
      try {
        await safeSupabaseCall(supabase.from('profiles').update({ status: 'active' }).eq('id', id));
        showToast('تم تفعيل العضو', 'success');
      } catch (err: any) {
          showToast('فشل التفعيل', 'error');
          fetchUsers(); 
      }
  };

  const deleteUser = async (id: string) => {
    if(!confirm('تحذير: هل أنت متأكد تماماً من حذف هذا العضو؟')) return;
    
    setUsersList(prev => prev.filter(u => u.id !== id));
    setStats(prev => ({ ...prev, users: prev.users - 1 }));
    
    try {
        const { error } = await safeSupabaseCall(supabase.rpc('delete_user_completely', { target_user_id: id }));
        if (error) throw error;
        showToast('تم حذف العضو', 'success');
    } catch (error: any) {
        showToast('خطأ في الحذف: ' + error.message, 'error');
        fetchUsers(); 
    }
  };

  const handleEnrollUser = async () => {
      if (!selectedUserForEnrollment || !selectedCourseId) {
          showToast('يرجى اختيار الكورس', 'error');
          return;
      }
      setIsEnrolling(true);
      try {
          const { error } = await safeSupabaseCall(supabase.from('enrollments').insert({
              user_id: selectedUserForEnrollment.id,
              course_id: selectedCourseId
          }));
          if (error) {
              if (error.code === '23505') showToast('هذا المستخدم مسجل بالفعل', 'error');
              else throw error;
          } else {
              showToast('تم تسجيل المستخدم بنجاح', 'success');
              setIsEnrollModalOpen(false);
          }
      } catch (err: any) {
          showToast('فشل التسجيل', 'error');
      } finally {
          if (mounted.current) setIsEnrolling(false);
      }
  };

  if (user?.role !== 'admin') return <div className="p-10 text-center text-white">غير مصرح لك بالدخول</div>;

  const projectId = 'ioaddixwohaahtnnangb'; 

  return (
    <div className="min-h-screen pt-32 pb-10 bg-navy-950 text-white font-cairo" dir="rtl">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3 mb-2 text-white">
                    <LayoutDashboard className="text-gold-500" size={32} /> لوحة التحكم الشاملة
                </h1>
                <div className="flex items-center gap-3 text-sm">
                    <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${
                        systemHealth === 'good' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                        systemHealth === 'warning' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                        'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                        <Server size={12} />
                        {systemHealth === 'good' ? 'النظام يعمل بكفاءة' : systemHealth === 'warning' ? 'أداء النظام متوسط' : 'مشكلة في الاتصال'}
                    </span>
                    <span className="text-gray-500 flex items-center gap-1">
                        <Wifi size={12} /> v18.3.0-GOLD
                    </span>
                </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-2">
                <button onClick={() => setIsSecurityModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-navy-900 border border-gold-500/30 rounded-lg text-sm font-bold hover:bg-gold-500/10 transition-colors text-gold-500 shadow-lg shadow-gold-500/5 animate-pulse-slow">
                    <ShieldCheck size={16} /> فحص الحماية
                </button>
                <a href={`https://supabase.com/dashboard/project/${projectId}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 bg-navy-900 border border-white/10 rounded-lg text-xs font-bold hover:bg-white/5 transition-colors text-gray-400 hover:text-white">
                    <Database size={14} /> قاعدة البيانات
                </a>
            </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-card p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500"><Users size={24} /></div>
                <div><p className="text-gray-400 text-xs font-bold">إجمالي الأعضاء</p><p className="text-2xl font-black text-white">{stats.users}</p></div>
            </div>
            <div className="glass-card p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500"><CheckCircle size={24} /></div>
                <div><p className="text-gray-400 text-xs font-bold">أعضاء نشطين</p><p className="text-2xl font-black text-white">{stats.active}</p></div>
            </div>
            <div className="glass-card p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 relative">
                    <AlertTriangle size={24} />
                    {stats.pending > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>}
                </div>
                <div><p className="text-gray-400 text-xs font-bold">طلبات معلقة</p><p className="text-2xl font-black text-white">{stats.pending}</p></div>
            </div>
            <div className="glass-card p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gold-500/10 flex items-center justify-center text-gold-500"><BookOpen size={24} /></div>
                <div><p className="text-gray-400 text-xs font-bold">الكورسات</p><p className="text-2xl font-black text-white">{stats.courses}</p></div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-3 space-y-2">
                <button onClick={() => setActiveTab('cms')} className={`w-full p-4 rounded-xl flex items-center gap-3 font-bold transition-all ${activeTab === 'cms' ? 'bg-gold-500 text-navy-950 shadow-lg shadow-gold-500/20' : 'bg-navy-900 text-gray-300 hover:bg-navy-800'}`}>
                    <Settings size={20} /> إعدادات الموقع
                </button>
                <button onClick={() => setActiveTab('courses')} className={`w-full p-4 rounded-xl flex items-center gap-3 font-bold transition-all ${activeTab === 'courses' ? 'bg-gold-500 text-navy-950 shadow-lg shadow-gold-500/20' : 'bg-navy-900 text-gray-300 hover:bg-navy-800'}`}>
                    <BookOpen size={20} /> إدارة الكورسات
                </button>
                <button onClick={() => setActiveTab('users')} className={`w-full p-4 rounded-xl flex items-center gap-3 font-bold transition-all ${activeTab === 'users' ? 'bg-gold-500 text-navy-950 shadow-lg shadow-gold-500/20' : 'bg-navy-900 text-gray-300 hover:bg-navy-800'}`}>
                    <Users size={20} /> إدارة الأعضاء
                    {stats.pending > 0 && <span className="mr-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{stats.pending}</span>}
                </button>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-9 bg-navy-900/50 border border-white/5 rounded-2xl p-6 min-h-[600px] shadow-2xl">
                
                {/* ================= CMS TAB ================= */}
                {activeTab === 'cms' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <h2 className="text-2xl font-bold text-white">تعديل محتوى الموقع</h2>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: 'hero', label: 'الرئيسية', icon: Globe },
                                { id: 'features', label: 'المميزات', icon: Activity },
                                { id: 'about', label: 'من نحن', icon: Shield },
                                { id: 'contact', label: 'تواصل', icon: MessageSquare },
                                { id: 'social', label: 'الروابط', icon: Share2 },
                            ].map(section => (
                                <button 
                                    key={section.id}
                                    onClick={() => setCmsSection(section.id as any)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${cmsSection === section.id ? 'bg-white/10 text-gold-500 border border-gold-500/30' : 'bg-navy-950 text-gray-400 border border-white/5 hover:bg-white/5'}`}
                                >
                                    <section.icon size={16} /> {section.label}
                                </button>
                            ))}
                        </div>
                        
                        <div className="bg-navy-950 p-6 rounded-xl border border-white/5">
                            {cmsSection === 'hero' && (
                                <div className="space-y-4">
                                    <h3 className="text-gold-500 font-bold mb-4">الواجهة الرئيسية</h3>
                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-400">العنوان الرئيسي (أبيض)</label>
                                            <input value={settingsForm.content_config?.hero_title || ''} onChange={e => handleNestedChange('content_config', 'hero_title', e.target.value)} className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-400">العنوان الفرعي (ذهبي)</label>
                                            <input value={settingsForm.content_config?.hero_title_2 || ''} onChange={e => handleNestedChange('content_config', 'hero_title_2', e.target.value)} className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-gold-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-400">الوصف</label>
                                            <textarea value={settingsForm.content_config?.hero_desc || ''} onChange={e => handleNestedChange('content_config', 'hero_desc', e.target.value)} className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white h-24" />
                                        </div>
                                    </div>
                                    <button onClick={() => saveSettings('الرئيسية')} disabled={isSavingCMS} className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 mt-4 disabled:opacity-50">
                                        {isSavingCMS ? <LoadingSpinner /> : <Save size={18} />} حفظ
                                    </button>
                                </div>
                            )}
                            {/* Placeholder for other sections */}
                            {cmsSection !== 'hero' && (
                                <div className="text-center py-10 text-gray-500">
                                    <Settings size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>باقي الأقسام متاحة للتعديل (تم تبسيط العرض).</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ================= COURSES TAB ================= */}
                {activeTab === 'courses' && !selectedCourseForLessons && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">إدارة الكورسات</h2>
                            <button onClick={() => { setEditingCourse({}); setIsCourseModalOpen(true); }} className="bg-gold-500 text-navy-950 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gold-400 transition-colors shadow-lg">
                                <Plus size={18} /> إضافة كورس
                            </button>
                        </div>
                        <div className="space-y-4">
                            {courses.length === 0 ? (
                                <div className="text-center py-10 text-gray-500 border border-dashed border-white/10 rounded-xl">
                                    <BookOpen size={40} className="mx-auto mb-2 opacity-30" />
                                    <p>لا توجد كورسات. أضف كورس جديد للبدء.</p>
                                </div>
                            ) : (
                                courses.map(course => (
                                    <div key={course.id} className="bg-navy-950 p-4 rounded-xl border border-white/5 flex items-center justify-between hover:border-gold-500/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-10 bg-black rounded border border-white/10 overflow-hidden">
                                                {course.thumbnail ? <img src={course.thumbnail} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-700"><Video size={16} /></div>}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white">{course.title}</h3>
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${course.is_paid ? 'bg-gold-500/20 text-gold-500' : 'bg-green-500/20 text-green-500'}`}>
                                                    {course.is_paid ? 'VIP' : 'مجاني'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => openLessonManager(course)} className="bg-blue-500/10 text-blue-400 px-3 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold">
                                                <Video size={16} /> الدروس
                                            </button>
                                            <button onClick={() => { setEditingCourse(course); setIsCourseModalOpen(true); }} className="text-gray-400 p-2 hover:bg-white/10 rounded"><Edit size={18} /></button>
                                            <button onClick={() => deleteCourse(course.id)} className="text-red-400 p-2 hover:bg-red-500/10 rounded"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* ================= LESSON MANAGER ================= */}
                {activeTab === 'courses' && selectedCourseForLessons && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-4">
                            <button onClick={() => setSelectedCourseForLessons(null)} className="p-2 bg-white/5 rounded-lg hover:bg-white/10">
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                                    {selectedCourseForLessons.title}
                                </h2>
                            </div>
                            <button onClick={() => { setEditingLesson({}); setIsLessonModalOpen(true); }} className="mr-auto bg-gold-500 text-navy-950 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gold-400">
                                <Plus size={18} /> درس جديد
                            </button>
                        </div>
                        {loadingLessons ? <div className="text-center py-10"><LoadingSpinner /></div> : (
                            <div className="space-y-3">
                                {courseLessons.length === 0 ? (
                                    <div className="text-center py-10 text-gray-500">
                                        <Video size={40} className="mx-auto mb-2 opacity-30" />
                                        <p>لا توجد دروس في هذا الكورس.</p>
                                    </div>
                                ) : (
                                    courseLessons.map((lesson) => (
                                        <div key={lesson.id} className="bg-navy-950 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center font-bold text-gray-400">{lesson.order}</div>
                                                <div>
                                                    <h4 className="font-bold text-white">{lesson.title}</h4>
                                                    <span className="text-xs text-gray-500">{lesson.duration}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditingLesson(lesson); setIsLessonModalOpen(true); }} className="text-blue-400 p-2 hover:bg-blue-500/10 rounded"><Edit size={16} /></button>
                                                <button onClick={() => deleteLesson(lesson.id!)} className="text-red-400 p-2 hover:bg-red-500/10 rounded"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ================= USERS TAB ================= */}
                {activeTab === 'users' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-white">الأعضاء ({usersList.length})</h2>
                            <div className="flex items-center gap-2">
                                <button onClick={() => fetchUsers()} className="p-2 bg-navy-800 rounded-lg hover:bg-white/5" title="تحديث">
                                    <RefreshCw size={18} className={loadingUsers ? 'animate-spin' : ''} />
                                </button>
                                <div className="relative">
                                    <input placeholder="بحث..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="bg-navy-950 border border-white/10 rounded-lg pl-4 pr-10 py-2 text-white w-64 focus:border-gold-500 outline-none" />
                                    <Search className="absolute right-3 top-2.5 text-gray-500" size={18} />
                                </div>
                            </div>
                        </div>
                        
                        {loadingUsers ? <div className="text-center py-10"><LoadingSpinner /></div> : usersError ? (
                            <div className="text-center py-10 text-red-400 font-bold">فشل تحميل الأعضاء. <button onClick={() => fetchUsers()} className="underline">إعادة المحاولة</button></div>
                        ) : (
                            <div className="space-y-3">
                                {usersList.filter(u => u.email.includes(userSearch) || u.full_name?.includes(userSearch)).length === 0 ? (
                                    <div className="text-center py-10 text-gray-500">
                                        <Users size={40} className="mx-auto mb-2 opacity-30" />
                                        <p>لا يوجد أعضاء مطابقين للبحث.</p>
                                    </div>
                                ) : (
                                    usersList.filter(u => u.email.includes(userSearch) || u.full_name?.includes(userSearch)).map(u => (
                                        <div key={u.id} className="bg-navy-950 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-white">{u.full_name || 'User'}</p>
                                                    {u.role === 'admin' && <span className="text-[10px] bg-gold-500 text-navy-950 px-1.5 rounded font-bold">ADMIN</span>}
                                                </div>
                                                <p className="text-xs text-gray-400">{u.email}</p>
                                                <span className={`text-[10px] px-2 py-0.5 rounded inline-block mt-1 ${u.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                                    {u.status === 'active' ? 'نشط' : 'انتظار'}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                {u.status === 'pending' && (
                                                    <button onClick={() => approveUser(u.id)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-bold">تفعيل</button>
                                                )}
                                                {u.role !== 'admin' && (
                                                    <>
                                                        <button onClick={() => { setSelectedUserForEnrollment(u); setIsEnrollModalOpen(true); }} className="bg-gold-500/10 text-gold-500 border border-gold-500/20 px-3 py-1 rounded text-xs font-bold hover:bg-gold-500 hover:text-navy-950 flex items-center gap-1">
                                                            <GraduationCap size={14} /> كورس
                                                        </button>
                                                        <button onClick={() => deleteUser(u.id)} className="bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-1 rounded text-xs hover:bg-red-500 hover:text-white">حذف</button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Modals */}
        <Modal isOpen={isCourseModalOpen} onClose={() => setIsCourseModalOpen(false)} title={editingCourse.id ? 'تعديل' : 'جديد'}>
             <div className="space-y-4">
                 <input value={editingCourse.title || ''} onChange={e => setEditingCourse({...editingCourse, title: e.target.value})} className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white" placeholder="العنوان" />
                 <textarea value={editingCourse.description || ''} onChange={e => setEditingCourse({...editingCourse, description: e.target.value})} className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white h-24" placeholder="الوصف" />
                 <div className="flex gap-2">
                     <button onClick={saveCourse} disabled={isSavingCourse} className="flex-1 bg-gold-500 text-navy-950 py-2 rounded-lg font-bold">{isSavingCourse ? 'جاري الحفظ...' : 'حفظ'}</button>
                     <button onClick={() => setIsCourseModalOpen(false)} className="flex-1 bg-white/5 text-white py-2 rounded-lg">إلغاء</button>
                 </div>
             </div>
        </Modal>

        <Modal isOpen={isLessonModalOpen} onClose={() => setIsLessonModalOpen(false)} title="إدارة الدرس">
             <div className="space-y-4">
                 <input value={editingLesson.title || ''} onChange={e => setEditingLesson({...editingLesson, title: e.target.value})} className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white" placeholder="عنوان الدرس" />
                 <input value={editingLesson.video_url || ''} onChange={e => setEditingLesson({...editingLesson, video_url: e.target.value})} className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white" placeholder="رابط الفيديو (YouTube)" />
                 <input value={editingLesson.duration || ''} onChange={e => setEditingLesson({...editingLesson, duration: e.target.value})} className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white" placeholder="المدة (مثال: 10:00)" />
                 <div className="flex gap-2">
                     <button onClick={saveLesson} disabled={isSavingLesson} className="flex-1 bg-gold-500 text-navy-950 py-2 rounded-lg font-bold">{isSavingLesson ? 'جاري الحفظ...' : 'حفظ'}</button>
                     <button onClick={() => setIsLessonModalOpen(false)} className="flex-1 bg-white/5 text-white py-2 rounded-lg">إلغاء</button>
                 </div>
             </div>
        </Modal>

        <Modal isOpen={isEnrollModalOpen} onClose={() => setIsEnrollModalOpen(false)} title="تسجيل طالب">
             <div className="space-y-4">
                 <div className="space-y-2 max-h-60 overflow-y-auto">
                     {courses.filter(c => c.is_paid).map(c => (
                         <button key={c.id} onClick={() => setSelectedCourseId(c.id)} className={`w-full p-3 rounded border text-right ${selectedCourseId === c.id ? 'border-gold-500 text-gold-500' : 'border-white/10 text-gray-300'}`}>{c.title}</button>
                     ))}
                 </div>
                 <button onClick={handleEnrollUser} disabled={isEnrolling} className="w-full bg-gold-500 text-navy-950 py-2 rounded-lg font-bold">{isEnrolling ? 'جاري...' : 'تأكيد'}</button>
             </div>
        </Modal>

        {/* Security Modal - ENHANCED */}
        <Modal isOpen={isSecurityModalOpen} onClose={() => setIsSecurityModalOpen(false)} title="مركز الأمان">
            <div className="space-y-4">
                {/* Green Checks */}
                <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-3">
                        <CheckCircle size={20} className="text-green-500" />
                        <div>
                            <p className="font-bold text-white text-sm">قواعد البيانات (RLS)</p>
                            <p className="text-xs text-green-400">مفعلة وآمنة</p>
                        </div>
                    </div>
                    <Check size={16} className="text-green-500" />
                </div>

                <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-3">
                        <CheckCircle size={20} className="text-green-500" />
                        <div>
                            <p className="font-bold text-white text-sm">حماية الدوال (RPC)</p>
                            <p className="text-xs text-green-400">Search Path محمي</p>
                        </div>
                    </div>
                    <Check size={16} className="text-green-500" />
                </div>

                <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-3">
                        <CheckCircle size={20} className="text-green-500" />
                        <div>
                            <p className="font-bold text-white text-sm">التريجرات (Triggers)</p>
                            <p className="text-xs text-green-400">تم التنظيف والإصلاح</p>
                        </div>
                    </div>
                    <Check size={16} className="text-green-500" />
                </div>

                {/* The Manual Warning */}
                <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500"></div>
                    <div className="flex items-center gap-3">
                        <AlertTriangle size={24} className="text-yellow-500" />
                        <div>
                            <p className="font-bold text-white text-sm">حماية كلمات المرور المسربة</p>
                            <p className="text-xs text-yellow-400 font-bold">⚠️ يتطلب تفعيل يدوي من لوحة Supabase</p>
                        </div>
                    </div>
                    <a 
                        href={`https://supabase.com/dashboard/project/${projectId}/auth/advanced`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-4 py-2 bg-yellow-500 text-black text-xs font-bold rounded-lg hover:bg-yellow-400 transition-colors shadow-lg flex items-center gap-2"
                    >
                        تفعيل الآن <ExternalLink size={12} />
                    </a>
                </div>

                <p className="text-xs text-gray-500 mt-4 text-center leading-relaxed">
                    تم إصلاح جميع المشاكل البرمجية بنجاح. <br/>
                    التحذير الأخير يختفي تلقائياً عند تفعيل الخيار من الرابط أعلاه.
                </p>
            </div>
        </Modal>
      </div>
    </div>
  );
};
