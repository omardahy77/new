import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { User, Course, SiteSettings, Lesson } from '../types';
import { translations } from '../utils/translations'; // Import defaults
import { 
  LayoutDashboard, Users, BookOpen, Settings, Save, 
  Plus, Trash2, CheckCircle, AlertTriangle, RefreshCw, Edit, Video, Clock, Image as ImageIcon,
  ArrowLeft, Search, Loader2, X, Globe, MessageSquare, Shield, Activity, Share2, ToggleLeft, ToggleRight,
  Database, Info, GraduationCap
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

// --- COMPONENTS ---

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

// --- CACHE KEYS ---
const USERS_CACHE_KEY = 'sniper_admin_users_v1';
const STATS_CACHE_KEY = 'sniper_admin_stats_v1';
const LESSONS_CACHE_KEY_PREFIX = 'sniper_admin_lessons_';

export const AdminDashboard: React.FC = () => {
  const { user, siteSettings, refreshData, updateSettings, courses } = useStore();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'cms' | 'courses' | 'users'>('cms');
  
  // CMS State
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(siteSettings);
  const [cmsSection, setCmsSection] = useState<'hero' | 'features' | 'about' | 'contact' | 'social'>('hero');
  const [isSavingCMS, setIsSavingCMS] = useState(false);
  
  // Data States
  const [usersList, setUsersList] = useState<User[]>(() => {
    try {
      const cached = sessionStorage.getItem(USERS_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  
  // Lesson Management State
  const [selectedCourseForLessons, setSelectedCourseForLessons] = useState<Course | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson>>({});
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  
  // Loading States
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  
  // Stats Cache - Initialize instantly
  const [stats, setStats] = useState(() => {
      try {
          const cached = sessionStorage.getItem(STATS_CACHE_KEY);
          // Default to 0 but ready to render
          return cached ? JSON.parse(cached) : { users: 0, active: 0, pending: 0, courses: 0 };
      } catch { return { users: 0, active: 0, pending: 0, courses: 0 }; }
  });

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

  // --- SMART PRE-FILL LOGIC ---
  useEffect(() => {
     const defaults = translations.ar; 
     
     setSettingsForm(prev => ({
        ...prev,
        ...siteSettings,
        content_config: {
            ...prev.content_config,
            ...siteSettings.content_config,
            hero_title: siteSettings.content_config?.hero_title || defaults.hero_line1_default,
            hero_title_2: siteSettings.content_config?.hero_title_2 || defaults.hero_line2_default,
            hero_desc: siteSettings.content_config?.hero_desc || defaults.hero_desc_default,
            footer_tagline: siteSettings.content_config?.footer_tagline || defaults.footer_tagline_default,
            footer_sub_tagline: siteSettings.content_config?.footer_sub_tagline || defaults.footer_sub_tagline_default,
            about_main_title: siteSettings.content_config?.about_main_title || defaults.about_main_title_default,
            about_main_desc: siteSettings.content_config?.about_main_desc || defaults.about_main_desc_default,
            mission_title: siteSettings.content_config?.mission_title || defaults.mission_title_default,
            mission_desc: siteSettings.content_config?.mission_desc || defaults.mission_desc_default,
            vision_title: siteSettings.content_config?.vision_title || defaults.vision_title_default,
            vision_desc: siteSettings.content_config?.vision_desc || defaults.vision_desc_default,
            contact_main_title: siteSettings.content_config?.contact_main_title || defaults.contact_main_title_default,
            contact_main_desc: siteSettings.content_config?.contact_main_desc || defaults.contact_main_desc_default,
            feat_analysis_title: siteSettings.content_config?.feat_analysis_title || defaults.feat_analysis,
            feat_analysis_desc: siteSettings.content_config?.feat_analysis_desc || defaults.feat_analysis_desc,
            feat_risk_title: siteSettings.content_config?.feat_risk_title || defaults.feat_risk,
            feat_risk_desc: siteSettings.content_config?.feat_risk_desc || defaults.feat_risk_desc,
            feat_psych_title: siteSettings.content_config?.feat_psych_title || defaults.feat_psych,
            feat_psych_desc: siteSettings.content_config?.feat_psych_desc || defaults.feat_psych_desc,
            feat_community_title: siteSettings.content_config?.feat_community_title || defaults.feat_community,
            feat_community_desc: siteSettings.content_config?.feat_community_desc || defaults.feat_community_desc,
            why_choose_us_title: siteSettings.content_config?.why_choose_us_title || defaults.why_choose_us_title_default,
            why_choose_us_desc: siteSettings.content_config?.why_choose_us_desc || defaults.why_choose_us_desc_default,
        },
        features_config: { ...prev.features_config, ...siteSettings.features_config },
        social_links: { ...prev.social_links, ...siteSettings.social_links },
        stats: { ...prev.stats, ...siteSettings.stats }
     }));
  }, [siteSettings]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
        fetchUsers();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    // Only fetch if we don't have stats or if it's been a while (optional logic, simplified here)
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: activeUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active');
    const { count: pendingUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    
    const newStats = {
        users: totalUsers || 0,
        active: activeUsers || 0,
        pending: pendingUsers || 0,
        courses: courses.length
    };
    
    setStats(newStats);
    sessionStorage.setItem(STATS_CACHE_KEY, JSON.stringify(newStats));
  };

  const fetchUsers = async () => {
      // Only show loading if we have NO data
      if (usersList.length === 0) setLoadingUsers(true);
      
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, status, created_at')
        .order('created_at', { ascending: false });
      
      if (data) {
          setUsersList(data as User[]);
          sessionStorage.setItem(USERS_CACHE_KEY, JSON.stringify(data));
      }
      setLoadingUsers(false);
  };

  const fetchLessons = async (courseId: string) => {
      setLoadingLessons(true);
      const { data } = await supabase.from('lessons').select('*').eq('course_id', courseId).order('order', { ascending: true });
      if (data) {
          setCourseLessons(data as Lesson[]);
          sessionStorage.setItem(LESSONS_CACHE_KEY_PREFIX + courseId, JSON.stringify(data));
      }
      setLoadingLessons(false);
  };

  const handleClearCache = () => {
      if(!confirm('هل أنت متأكد؟ سيتم مسح جميع البيانات المخزنة مؤقتاً وإعادة تحميلها من الخادم.')) return;
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
  };

  // ... (Rest of the component remains unchanged) ...
  const handleNestedChange = (parent: 'content_config' | 'features_config' | 'social_links' | 'stats', key: string, value: any) => {
    setSettingsForm(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
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
          console.error(err);
          showToast('فشل الحفظ: ' + err.message, 'error');
      } finally {
        setIsSavingCMS(false);
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
            ({ error } = await supabase.from('courses').update(payload).eq('id', editingCourse.id));
        } else {
            ({ error } = await supabase.from('courses').insert(payload));
        }

        if (error) throw error;

        showToast('تم حفظ الكورس بنجاح', 'success');
        setIsCourseModalOpen(false);
        await refreshData(); 
        
      } catch (err: any) {
        console.error("Save Course Error:", err);
        showToast('خطأ في الحفظ: ' + err.message, 'error');
      } finally {
        setIsSavingCourse(false);
      }
  };

  const deleteCourse = async (id: string) => {
      if(!confirm('هل أنت متأكد من حذف الكورس؟ سيتم حذف جميع الدروس المرتبطة به.')) return;
      
      const { error } = await supabase.from('courses').delete().eq('id', id);
      
      if (error) {
          showToast('فشل الحذف: ' + error.message, 'error');
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
            ({ error } = await supabase.from('lessons').update(payload).eq('id', editingLesson.id));
        } else {
            ({ error } = await supabase.from('lessons').insert(payload));
        }

        if (error) throw error;

        showToast('تم حفظ الدرس بنجاح', 'success');
        setIsLessonModalOpen(false);
        await fetchLessons(selectedCourseForLessons.id);
        
      } catch (err: any) {
        console.error("Save Lesson Error:", err);
        showToast('خطأ في حفظ الدرس: ' + err.message, 'error');
      } finally {
        setIsSavingLesson(false);
      }
  };

  const deleteLesson = async (id: string) => {
      if(!confirm('حذف الدرس؟')) return;
      
      const { error } = await supabase.from('lessons').delete().eq('id', id);
      
      if (error) {
          showToast('فشل الحذف: ' + error.message, 'error');
      } else {
          showToast('تم حذف الدرس', 'success');
          if (selectedCourseForLessons) {
              await fetchLessons(selectedCourseForLessons.id);
          }
      }
  };

  const approveUser = async (id: string) => {
      const updatedList = usersList.map(u => u.id === id ? { ...u, status: 'active' as const } : u);
      setUsersList(updatedList);
      sessionStorage.setItem(USERS_CACHE_KEY, JSON.stringify(updatedList));
      setStats(prev => ({ ...prev, active: prev.active + 1, pending: prev.pending - 1 }));
      
      await supabase.from('profiles').update({ status: 'active' }).eq('id', id);
      showToast('تم تفعيل العضو', 'success');
  };

  const deleteUser = async (id: string) => {
    if(!confirm('تحذير: هل أنت متأكد تماماً من حذف هذا العضو؟')) return;
    const updatedList = usersList.filter(u => u.id !== id);
    setUsersList(updatedList);
    sessionStorage.setItem(USERS_CACHE_KEY, JSON.stringify(updatedList));
    setStats(prev => ({ ...prev, users: prev.users - 1 }));
    
    try {
        const { error } = await supabase.rpc('delete_user_completely', { target_user_id: id });
        if (error) throw error;
        showToast('تم حذف العضو', 'success');
    } catch (error: any) {
        showToast('خطأ في الحذف: ' + error.message, 'error');
        fetchUsers();
    }
  };

  const openEnrollModal = (user: User) => {
      setSelectedUserForEnrollment(user);
      setSelectedCourseId('');
      setIsEnrollModalOpen(true);
  };

  const handleEnrollUser = async () => {
      if (!selectedUserForEnrollment || !selectedCourseId) {
          showToast('يرجى اختيار الكورس', 'error');
          return;
      }

      setIsEnrolling(true);
      try {
          const { error } = await supabase.from('enrollments').insert({
              user_id: selectedUserForEnrollment.id,
              course_id: selectedCourseId
          });

          if (error) {
              if (error.code === '23505') { // Unique violation
                  showToast('هذا المستخدم مسجل بالفعل في هذا الكورس', 'error');
              } else {
                  throw error;
              }
          } else {
              showToast('تم تسجيل المستخدم في الكورس بنجاح', 'success');
              setIsEnrollModalOpen(false);
          }
      } catch (err: any) {
          showToast('فشل التسجيل: ' + err.message, 'error');
      } finally {
          setIsEnrolling(false);
      }
  };

  if (user?.role !== 'admin') return <div className="p-10 text-center text-white">غير مصرح لك بالدخول</div>;

  return (
    <div className="min-h-screen pt-32 pb-10 bg-navy-950 text-white font-cairo" dir="rtl">
      <div className="container-custom">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3 mb-2 text-white">
                    <LayoutDashboard className="text-gold-500" size={32} /> لوحة التحكم الشاملة
                </h1>
                <p className="text-gray-400 text-sm">تحكم كامل في المنصة، الكورسات، والأعضاء.</p>
            </div>
            <button 
                onClick={handleClearCache}
                className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-red-500 hover:text-white transition-colors"
            >
                <Database size={14} /> مسح الكاش وإعادة التحميل
            </button>
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
                                { id: 'hero', label: 'الواجهة الرئيسية', icon: Globe },
                                { id: 'features', label: 'لماذا تختارنا', icon: Activity },
                                { id: 'about', label: 'من نحن', icon: Shield },
                                { id: 'contact', label: 'تواصل معنا', icon: MessageSquare },
                                { id: 'social', label: 'روابط التواصل', icon: Share2 },
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
                            
                            {/* HERO SECTION */}
                            {cmsSection === 'hero' && (
                                <div className="space-y-6">
                                    <h3 className="text-gold-500 font-bold text-lg border-b border-white/5 pb-2">نصوص الواجهة الرئيسية (Hero)</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-gray-400 text-sm mb-2 font-bold">العنوان الأول (أبيض)</label>
                                            <input 
                                                value={settingsForm.content_config?.hero_title || ''} 
                                                onChange={e => handleNestedChange('content_config', 'hero_title', e.target.value)} 
                                                className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white focus:border-gold-500 outline-none font-bold"
                                                placeholder="مثال: تداول بذكاء"
                                            />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-gold-500 text-sm mb-2 font-bold">العنوان الثاني (ذهبي + متوهج)</label>
                                            <input 
                                                value={settingsForm.content_config?.hero_title_2 || ''} 
                                                onChange={e => handleNestedChange('content_config', 'hero_title_2', e.target.value)} 
                                                className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-gold-500 focus:border-gold-500 outline-none font-bold shadow-[0_0_10px_rgba(255,215,0,0.1)]"
                                                placeholder="مثال: بدقة القناص"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-gray-400 text-sm mb-2 font-bold">الوصف الرئيسي</label>
                                            <textarea 
                                                value={settingsForm.content_config?.hero_desc || ''} 
                                                onChange={e => handleNestedChange('content_config', 'hero_desc', e.target.value)} 
                                                className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white h-24 focus:border-gold-500 outline-none resize-none"
                                            />
                                        </div>
                                    </div>

                                    <h3 className="text-gold-500 font-bold text-lg border-b border-white/5 pb-2 mt-8">الشعار والتاجات</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-gray-400 text-sm mb-2 font-bold">شعار الفوتر (Tagline)</label>
                                            <input 
                                                value={settingsForm.content_config?.footer_tagline || ''} 
                                                onChange={e => handleNestedChange('content_config', 'footer_tagline', e.target.value)} 
                                                className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white focus:border-gold-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-sm mb-2 font-bold">الوصف الفرعي (Sub-Tagline)</label>
                                            <input 
                                                value={settingsForm.content_config?.footer_sub_tagline || ''} 
                                                onChange={e => handleNestedChange('content_config', 'footer_sub_tagline', e.target.value)} 
                                                className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white focus:border-gold-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <button 
                                            onClick={() => saveSettings('الواجهة الرئيسية')} 
                                            disabled={isSavingCMS}
                                            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-500/20 transition-all disabled:opacity-50"
                                        >
                                            {isSavingCMS ? <LoadingSpinner /> : <Save size={18} />} 
                                            حفظ التغييرات
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* FEATURES SECTION (Why Choose Us) */}
                            {cmsSection === 'features' && (
                                <div className="space-y-6">
                                    <h3 className="text-gold-500 font-bold text-lg border-b border-white/5 pb-2">كروت "لماذا تختارنا"</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { id: 'feat_analysis', label: 'الكرت 1: تحليل فني' },
                                            { id: 'feat_risk', label: 'الكرت 2: إدارة مخاطر' },
                                            { id: 'feat_psych', label: 'الكرت 3: سيكولوجية' },
                                            { id: 'feat_community', label: 'الكرت 4: مجتمع حصري' },
                                        ].map(feat => (
                                            <div key={feat.id} className="bg-navy-900 p-5 rounded-xl border border-white/5 space-y-3 hover:border-gold-500/20 transition-colors">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-2 h-2 bg-gold-500 rounded-full"></div>
                                                    <span className="text-gold-500 font-bold text-sm">{feat.label}</span>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 block mb-1">العنوان</label>
                                                    <input 
                                                        value={settingsForm.content_config?.[`${feat.id}_title`] || ''}
                                                        onChange={e => handleNestedChange('content_config', `${feat.id}_title`, e.target.value)}
                                                        className="w-full bg-navy-950 border border-white/10 p-2 rounded-lg text-white font-bold focus:border-gold-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 block mb-1">الوصف</label>
                                                    <textarea 
                                                        value={settingsForm.content_config?.[`${feat.id}_desc`] || ''}
                                                        onChange={e => handleNestedChange('content_config', `${feat.id}_desc`, e.target.value)}
                                                        className="w-full bg-navy-950 border border-white/10 p-2 rounded-lg text-gray-300 h-20 resize-none text-sm focus:border-gold-500 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-white/5">
                                        <h3 className="text-gold-500 font-bold text-lg mb-4">عنوان القسم الرئيسي</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-gray-400 text-sm mb-2 font-bold">العنوان (لماذا تختارنا؟)</label>
                                                <input 
                                                    value={settingsForm.content_config?.why_choose_us_title || ''}
                                                    onChange={e => handleNestedChange('content_config', 'why_choose_us_title', e.target.value)}
                                                    className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white focus:border-gold-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-400 text-sm mb-2 font-bold">الوصف الفرعي</label>
                                                <input 
                                                    value={settingsForm.content_config?.why_choose_us_desc || ''}
                                                    onChange={e => handleNestedChange('content_config', 'why_choose_us_desc', e.target.value)}
                                                    className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white focus:border-gold-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <button 
                                            onClick={() => saveSettings('المميزات')} 
                                            disabled={isSavingCMS}
                                            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-500/20 transition-all disabled:opacity-50"
                                        >
                                            {isSavingCMS ? <LoadingSpinner /> : <Save size={18} />} 
                                            حفظ التغييرات
                                        </button>
                                    </div>
                                </div>
                            )}

                             {/* ABOUT SECTION */}
                             {cmsSection === 'about' && (
                                <div className="space-y-6">
                                    <h3 className="text-gold-500 font-bold text-lg border-b border-white/5 pb-2">صفحة من نحن</h3>
                                    
                                    {/* Main Intro */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-gray-400 text-sm mb-2 font-bold">عنوان "من نحن"</label>
                                            <input value={settingsForm.content_config?.about_main_title || ''} onChange={e => handleNestedChange('content_config', 'about_main_title', e.target.value)} className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white focus:border-gold-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-sm mb-2 font-bold">وصف "من نحن"</label>
                                            <textarea value={settingsForm.content_config?.about_main_desc || ''} onChange={e => handleNestedChange('content_config', 'about_main_desc', e.target.value)} className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white h-24 focus:border-gold-500 outline-none resize-none" />
                                        </div>
                                    </div>

                                    {/* Mission & Vision */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                        <div className="bg-navy-900 p-4 rounded-xl border border-white/5">
                                            <h4 className="text-gold-500 font-bold mb-3 border-b border-white/5 pb-2">مهمتنا</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-xs text-gray-400 block mb-1">العنوان</label>
                                                    <input value={settingsForm.content_config?.mission_title || ''} onChange={e => handleNestedChange('content_config', 'mission_title', e.target.value)} className="w-full bg-navy-950 border border-white/10 p-2 rounded-lg text-white focus:border-gold-500 outline-none" />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-400 block mb-1">الوصف</label>
                                                    <textarea value={settingsForm.content_config?.mission_desc || ''} onChange={e => handleNestedChange('content_config', 'mission_desc', e.target.value)} className="w-full bg-navy-950 border border-white/10 p-2 rounded-lg text-white h-20 resize-none focus:border-gold-500 outline-none" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-navy-900 p-4 rounded-xl border border-white/5">
                                            <h4 className="text-gold-500 font-bold mb-3 border-b border-white/5 pb-2">رؤيتنا</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-xs text-gray-400 block mb-1">العنوان</label>
                                                    <input value={settingsForm.content_config?.vision_title || ''} onChange={e => handleNestedChange('content_config', 'vision_title', e.target.value)} className="w-full bg-navy-950 border border-white/10 p-2 rounded-lg text-white focus:border-gold-500 outline-none" />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-400 block mb-1">الوصف</label>
                                                    <textarea value={settingsForm.content_config?.vision_desc || ''} onChange={e => handleNestedChange('content_config', 'vision_desc', e.target.value)} className="w-full bg-navy-950 border border-white/10 p-2 rounded-lg text-white h-20 resize-none focus:border-gold-500 outline-none" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="mt-8 pt-6 border-t border-white/5">
                                        <h3 className="text-gold-500 font-bold text-lg mb-4">أرقام وإحصائيات</h3>
                                        
                                        <div className="mb-4">
                                            <label className="block text-gray-400 text-sm mb-2 font-bold">عنوان قسم الأرقام</label>
                                            <input value={settingsForm.content_config?.stats_title || ''} onChange={e => handleNestedChange('content_config', 'stats_title', e.target.value)} className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white focus:border-gold-500 outline-none" placeholder="أرقام تتحدث عن نجاحنا" />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Students */}
                                            <div className="bg-navy-900 p-4 rounded-xl border border-white/5">
                                                <div className="flex justify-between mb-2"><span className="text-white font-bold text-sm">عدد الطلاب</span></div>
                                                <div className="space-y-2">
                                                    <input value={settingsForm.stats?.students || ''} onChange={e => handleNestedChange('stats', 'students', e.target.value)} className="w-full bg-navy-950 border border-white/10 p-2 rounded-lg text-white text-center font-bold" placeholder="+1500" />
                                                    <input value={settingsForm.content_config?.stats_students_label || ''} onChange={e => handleNestedChange('content_config', 'stats_students_label', e.target.value)} className="w-full bg-navy-950 border border-white/10 p-2 rounded-lg text-gray-400 text-center text-xs" placeholder="متدرب نشط" />
                                                </div>
                                            </div>
                                            {/* Hours */}
                                            <div className="bg-navy-900 p-4 rounded-xl border border-white/5">
                                                <div className="flex justify-between mb-2"><span className="text-white font-bold text-sm">ساعات التدريب</span></div>
                                                <div className="space-y-2">
                                                    <input value={settingsForm.stats?.hours || ''} onChange={e => handleNestedChange('stats', 'hours', e.target.value)} className="w-full bg-navy-950 border border-white/10 p-2 rounded-lg text-white text-center font-bold" placeholder="+50" />
                                                    <input value={settingsForm.content_config?.stats_hours_label || ''} onChange={e => handleNestedChange('content_config', 'stats_hours_label', e.target.value)} className="w-full bg-navy-950 border border-white/10 p-2 rounded-lg text-gray-400 text-center text-xs" placeholder="ساعة تدريبية" />
                                                </div>
                                            </div>
                                            {/* Support */}
                                            <div className="bg-navy-900 p-4 rounded-xl border border-white/5">
                                                <div className="flex justify-between mb-2"><span className="text-white font-bold text-sm">الدعم الفني</span></div>
                                                <div className="space-y-2">
                                                    <input value={settingsForm.content_config?.stats_support_value || ''} onChange={e => handleNestedChange('content_config', 'stats_support_value', e.target.value)} className="w-full bg-navy-950 border border-white/10 p-2 rounded-lg text-white text-center font-bold" placeholder="24/7" />
                                                    <input value={settingsForm.content_config?.stats_support_label || ''} onChange={e => handleNestedChange('content_config', 'stats_support_label', e.target.value)} className="w-full bg-navy-950 border border-white/10 p-2 rounded-lg text-gray-400 text-center text-xs" placeholder="دعم فني" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <button 
                                            onClick={() => saveSettings('من نحن')} 
                                            disabled={isSavingCMS}
                                            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-500/20 transition-all disabled:opacity-50"
                                        >
                                            {isSavingCMS ? <LoadingSpinner /> : <Save size={18} />} 
                                            حفظ التغييرات
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* CONTACT SECTION */}
                            {cmsSection === 'contact' && (
                                <div className="space-y-6">
                                    <h3 className="text-gold-500 font-bold text-lg border-b border-white/5 pb-2">صفحة تواصل معنا</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-gray-400 text-sm mb-2 font-bold">عنوان "تواصل معنا"</label>
                                            <input value={settingsForm.content_config?.contact_main_title || ''} onChange={e => handleNestedChange('content_config', 'contact_main_title', e.target.value)} className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white focus:border-gold-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-sm mb-2 font-bold">وصف "تواصل معنا"</label>
                                            <textarea value={settingsForm.content_config?.contact_main_desc || ''} onChange={e => handleNestedChange('content_config', 'contact_main_desc', e.target.value)} className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white h-24 focus:border-gold-500 outline-none resize-none" placeholder="فريق الدعم الفني جاهز للرد على استفساراتكم..." />
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 flex justify-end">
                                        <button 
                                            onClick={() => saveSettings('تواصل معنا')} 
                                            disabled={isSavingCMS}
                                            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-500/20 transition-all disabled:opacity-50"
                                        >
                                            {isSavingCMS ? <LoadingSpinner /> : <Save size={18} />} 
                                            حفظ التغييرات
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* SOCIAL MEDIA LINKS */}
                            {cmsSection === 'social' && (
                                <div className="space-y-6">
                                    <h3 className="text-gold-500 font-bold text-lg border-b border-white/5 pb-2">روابط التواصل الاجتماعي</h3>
                                    <p className="text-sm text-gray-400">أدخل الروابط الخاصة بحساباتك. استخدم زر التفعيل لإظهار/إخفاء الأيقونة في الموقع.</p>
                                    
                                    <div className="grid grid-cols-1 gap-4">
                                        {[
                                            { id: 'whatsapp', label: 'WhatsApp', placeholder: 'https://wa.me/...' },
                                            { id: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
                                            { id: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
                                            { id: 'telegram', label: 'Telegram', placeholder: 'https://t.me/...' },
                                            { id: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/...' },
                                            { id: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/...' },
                                            { id: 'twitter', label: 'Twitter (X)', placeholder: 'https://x.com/...' },
                                        ].map((social) => {
                                            const isVisible = settingsForm.features_config?.[`social_${social.id}_visible` as keyof typeof settingsForm.features_config] !== false;
                                            
                                            return (
                                                <div key={social.id} className="bg-navy-900 p-4 rounded-xl border border-white/5 flex items-center gap-4 hover:border-white/10 transition-colors">
                                                    <div className="w-32 font-bold text-white shrink-0">{social.label}</div>
                                                    
                                                    <div className="flex-1">
                                                        <input 
                                                            value={settingsForm.social_links?.[social.id as keyof typeof settingsForm.social_links] || ''}
                                                            onChange={e => handleNestedChange('social_links', social.id, e.target.value)}
                                                            className="w-full bg-navy-950 border border-white/10 p-2 rounded-lg text-gray-300 text-sm focus:border-gold-500 outline-none font-mono"
                                                            placeholder={social.placeholder}
                                                            dir="ltr"
                                                        />
                                                    </div>

                                                    <button 
                                                        onClick={() => handleNestedChange('features_config', `social_${social.id}_visible`, !isVisible)}
                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isVisible ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                                                    >
                                                        {isVisible ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                                        {isVisible ? 'ظاهر' : 'مخفي'}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <button 
                                            onClick={() => saveSettings('روابط التواصل')} 
                                            disabled={isSavingCMS}
                                            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-500/20 transition-all disabled:opacity-50"
                                        >
                                            {isSavingCMS ? <LoadingSpinner /> : <Save size={18} />} 
                                            حفظ التغييرات
                                        </button>
                                    </div>
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
                            <div className="flex gap-2">
                                <button onClick={refreshData} className="p-2 bg-navy-800 rounded-lg hover:bg-white/5 transition-colors" title="تحديث">
                                    <RefreshCw size={18} />
                                </button>
                                <button onClick={() => { setEditingCourse({}); setIsCourseModalOpen(true); }} className="bg-gold-500 text-navy-950 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gold-400 transition-colors shadow-lg">
                                    <Plus size={18} /> إضافة كورس
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {courses.map(course => (
                                <div key={course.id} className="bg-navy-950 p-4 rounded-xl border border-white/5 flex items-center justify-between hover:border-gold-500/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <img src={course.thumbnail} className="w-16 h-10 object-cover rounded border border-white/10" />
                                        <div>
                                            <h3 className="font-bold text-white">{course.title}</h3>
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${course.is_paid ? 'bg-gold-500/20 text-gold-500' : 'bg-green-500/20 text-green-500'}`}>
                                                {course.is_paid ? 'مدفوع (VIP)' : 'مجاني'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openLessonManager(course)} className="bg-blue-500/10 text-blue-400 px-3 py-2 rounded-lg hover:bg-blue-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold">
                                            <Video size={16} /> إدارة الدروس
                                        </button>
                                        <button onClick={() => { setEditingCourse(course); setIsCourseModalOpen(true); }} className="text-gray-400 p-2 hover:bg-white/10 rounded transition-colors"><Edit size={18} /></button>
                                        <button onClick={() => deleteCourse(course.id)} className="text-red-400 p-2 hover:bg-red-500/10 rounded transition-colors"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ================= LESSON MANAGER (Nested) ================= */}
                {activeTab === 'courses' && selectedCourseForLessons && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-4">
                            <button onClick={() => setSelectedCourseForLessons(null)} className="p-2 bg-white/5 rounded-lg hover:bg-white/10">
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                                    <Video className="text-gold-500" /> {selectedCourseForLessons.title}
                                </h2>
                                <p className="text-gray-400 text-sm">إدارة الدروس والمحتوى</p>
                            </div>
                            <button onClick={() => { setEditingLesson({}); setIsLessonModalOpen(true); }} className="mr-auto bg-gold-500 text-navy-950 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gold-400 transition-colors shadow-lg">
                                <Plus size={18} /> إضافة درس جديد
                            </button>
                        </div>

                        {loadingLessons ? (
                            <div className="text-center py-10"><LoadingSpinner /></div>
                        ) : (
                            <div className="space-y-3">
                                {courseLessons.length === 0 ? (
                                    <div className="text-center py-10 text-gray-500 bg-navy-950 rounded-xl border border-white/5 border-dashed">
                                        لا توجد دروس في هذا الكورس بعد.
                                    </div>
                                ) : (
                                    courseLessons.map((lesson) => (
                                        <div key={lesson.id} className="bg-navy-950 p-4 rounded-xl border border-white/5 flex items-center justify-between hover:border-white/20 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center font-bold text-gray-400">{lesson.order}</div>
                                                <div>
                                                    <h4 className="font-bold text-white">{lesson.title}</h4>
                                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1"><Clock size={12} /> {lesson.duration}</span>
                                                        {lesson.video_url && <span className="text-green-500 flex items-center gap-1"><CheckCircle size={10} /> فيديو متاح</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditingLesson(lesson); setIsLessonModalOpen(true); }} className="text-blue-400 p-2 hover:bg-blue-500/10 rounded transition-colors"><Edit size={16} /></button>
                                                <button onClick={() => deleteLesson(lesson.id!)} className="text-red-400 p-2 hover:bg-red-500/10 rounded transition-colors"><Trash2 size={16} /></button>
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
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold text-white">قائمة الأعضاء</h2>
                                <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-gray-400">{usersList.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => { fetchUsers(); }} className="p-2 bg-navy-800 rounded-lg hover:bg-white/5 transition-colors" title="تحديث">
                                    <RefreshCw size={18} className={loadingUsers ? 'animate-spin' : ''} />
                                </button>
                                <div className="relative">
                                    <input placeholder="بحث..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="bg-navy-950 border border-white/10 rounded-lg pl-4 pr-10 py-2 text-white w-64 focus:border-gold-500 outline-none" />
                                    <Search className="absolute right-3 top-2.5 text-gray-500" size={18} />
                                </div>
                            </div>
                        </div>

                        {loadingUsers ? (
                            <div className="text-center py-10"><LoadingSpinner /></div>
                        ) : (
                            <div className="space-y-3">
                                {usersList.filter(u => u.email.includes(userSearch) || u.full_name?.includes(userSearch)).map(u => (
                                    <div key={u.id} className="bg-navy-950 p-4 rounded-xl border border-white/5 flex items-center justify-between hover:border-white/20 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-white">{u.full_name || 'بدون اسم'}</p>
                                                {u.role === 'admin' && <span className="text-[10px] bg-gold-500 text-navy-950 px-1.5 rounded font-bold">ADMIN</span>}
                                            </div>
                                            <p className="text-xs text-gray-400">{u.email}</p>
                                            <span className={`text-[10px] px-2 py-0.5 rounded inline-block mt-1 ${u.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                                {u.status === 'active' ? 'نشط' : 'في الانتظار'}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            {u.status === 'pending' && (
                                                <button onClick={() => approveUser(u.id)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-bold transition-colors">تفعيل</button>
                                            )}
                                            {u.role !== 'admin' && (
                                                <>
                                                    <button 
                                                        onClick={() => openEnrollModal(u)} 
                                                        className="bg-gold-500/10 text-gold-500 border border-gold-500/20 px-3 py-1 rounded text-xs font-bold hover:bg-gold-500 hover:text-navy-950 transition-colors flex items-center gap-1"
                                                    >
                                                        <GraduationCap size={14} /> تسجيل في كورس
                                                    </button>
                                                    <button onClick={() => deleteUser(u.id)} className="bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-1 rounded text-xs hover:bg-red-500 hover:text-white transition-colors">حذف</button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* --- MODALS --- */}
        
        {/* Course Modal */}
        <Modal 
            isOpen={isCourseModalOpen} 
            onClose={() => setIsCourseModalOpen(false)} 
            title={editingCourse.id ? 'تعديل كورس' : 'إضافة كورس جديد'}
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-gray-400 text-xs mb-1 font-bold">عنوان الكورس</label>
                    <input 
                        value={editingCourse.title || ''} 
                        onChange={e => setEditingCourse({...editingCourse, title: e.target.value})} 
                        className="w-full bg-navy-950 border border-white/10 p-3 rounded-lg text-white focus:border-gold-500 outline-none" 
                        placeholder="أدخل عنوان الكورس"
                    />
                </div>
                <div>
                    <label className="block text-gray-400 text-xs mb-1 font-bold">الوصف</label>
                    <textarea 
                        value={editingCourse.description || ''} 
                        onChange={e => setEditingCourse({...editingCourse, description: e.target.value})} 
                        className="w-full bg-navy-950 border border-white/10 p-3 rounded-lg text-white h-24 focus:border-gold-500 outline-none resize-none" 
                        placeholder="وصف مختصر للكورس"
                    />
                </div>
                <div>
                    <label className="block text-gray-400 text-xs mb-1 font-bold">رابط الصورة المصغرة</label>
                    <div className="relative">
                        <input 
                            value={editingCourse.thumbnail || ''} 
                            onChange={e => setEditingCourse({...editingCourse, thumbnail: e.target.value})} 
                            className="w-full bg-navy-950 border border-white/10 p-3 pl-10 rounded-lg text-white focus:border-gold-500 outline-none" 
                            dir="ltr"
                            placeholder="https://..."
                        />
                        <ImageIcon className="absolute left-3 top-3 text-gray-500" size={18} />
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="flex-1">
                        <label className="block text-gray-400 text-xs mb-1 font-bold">المدة الإجمالية</label>
                        <input 
                            value={editingCourse.duration || ''} 
                            onChange={e => setEditingCourse({...editingCourse, duration: e.target.value})} 
                            className="w-full bg-navy-950 border border-white/10 p-3 rounded-lg text-white focus:border-gold-500 outline-none" 
                            placeholder="مثال: 10 ساعات"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-gray-400 text-xs mb-1 font-bold">عدد الدروس</label>
                        <input 
                            type="number"
                            value={editingCourse.lesson_count || ''} 
                            onChange={e => setEditingCourse({...editingCourse, lesson_count: parseInt(e.target.value)})} 
                            className="w-full bg-navy-950 border border-white/10 p-3 rounded-lg text-white focus:border-gold-500 outline-none" 
                        />
                    </div>
                </div>
                
                <div className="flex items-center gap-3 bg-navy-950 p-3 rounded-lg border border-white/5">
                    <input type="checkbox" checked={editingCourse.is_paid || false} onChange={e => setEditingCourse({...editingCourse, is_paid: e.target.checked})} className="w-5 h-5 accent-gold-500" />
                    <label className="text-white font-bold text-sm">هل الكورس مدفوع؟ (VIP)</label>
                </div>

                <div className="flex gap-3 mt-6">
                    <button 
                        onClick={saveCourse} 
                        disabled={isSavingCourse}
                        className="flex-1 bg-gold-500 text-navy-950 py-3 rounded-xl font-bold hover:bg-gold-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSavingCourse ? <LoadingSpinner /> : <Save size={18} />}
                        {isSavingCourse ? 'جاري الحفظ...' : 'حفظ الكورس'}
                    </button>
                    <button onClick={() => setIsCourseModalOpen(false)} className="flex-1 bg-white/5 text-white py-3 rounded-xl hover:bg-white/10 transition-colors font-bold">إلغاء</button>
                </div>
            </div>
        </Modal>

        {/* Lesson Modal */}
        <Modal
            isOpen={isLessonModalOpen}
            onClose={() => setIsLessonModalOpen(false)}
            title={editingLesson.id ? 'تعديل درس' : 'إضافة درس جديد'}
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-gray-400 text-xs mb-1 font-bold">عنوان الدرس</label>
                    <input 
                        value={editingLesson.title || ''} 
                        onChange={e => setEditingLesson({...editingLesson, title: e.target.value})} 
                        className="w-full bg-navy-950 border border-white/10 p-3 rounded-lg text-white focus:border-gold-500 outline-none" 
                        placeholder="أدخل عنوان الدرس"
                    />
                </div>
                
                <div>
                    <label className="block text-gray-400 text-xs mb-1 font-bold">رابط الفيديو</label>
                    <div className="relative">
                        <Video className="absolute left-3 top-3 text-gray-500" size={18} />
                        <input 
                            value={editingLesson.video_url || ''} 
                            onChange={e => setEditingLesson({...editingLesson, video_url: e.target.value})} 
                            className="w-full bg-navy-950 border border-white/10 p-3 pl-10 rounded-lg text-white focus:border-gold-500 outline-none" 
                            dir="ltr"
                            placeholder="YouTube, Vimeo, or Direct Link"
                        />
                    </div>
                    <div className="flex items-start gap-2 mt-2 text-[10px] text-gray-400 bg-white/5 p-2 rounded-lg">
                        <Info size={14} className="shrink-0 mt-0.5 text-gold-500" />
                        <p>يدعم: YouTube, Vimeo, Google Drive (Preview), أو روابط MP4 مباشرة. يمكنك أيضاً لصق كود Embed.</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <label className="block text-gray-400 text-xs mb-1 font-bold">المدة</label>
                        <Clock className="absolute left-3 top-8 text-gray-500" size={18} />
                        <input 
                            value={editingLesson.duration || ''} 
                            onChange={e => setEditingLesson({...editingLesson, duration: e.target.value})} 
                            className="w-full bg-navy-950 border border-white/10 p-3 pl-10 rounded-lg text-white focus:border-gold-500 outline-none" 
                            dir="ltr"
                            placeholder="10:30"
                        />
                    </div>
                    <div className="relative flex-1">
                        <label className="block text-gray-400 text-xs mb-1 font-bold">الترتيب</label>
                        <input 
                            type="number" 
                            value={editingLesson.order || ''} 
                            onChange={e => setEditingLesson({...editingLesson, order: parseInt(e.target.value)})} 
                            className="w-full bg-navy-950 border border-white/10 p-3 rounded-lg text-white focus:border-gold-500 outline-none" 
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-gray-400 text-xs mb-1 font-bold">صورة مصغرة (اختياري)</label>
                    <div className="relative">
                        <ImageIcon className="absolute left-3 top-3 text-gray-500" size={18} />
                        <input 
                            value={editingLesson.thumbnail_url || ''} 
                            onChange={e => setEditingLesson({...editingLesson, thumbnail_url: e.target.value})} 
                            className="w-full bg-navy-950 border border-white/10 p-3 pl-10 rounded-lg text-white focus:border-gold-500 outline-none" 
                            dir="ltr"
                            placeholder="https://..."
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button 
                        onClick={saveLesson} 
                        disabled={isSavingLesson}
                        className="flex-1 bg-gold-500 text-navy-950 py-3 rounded-xl font-bold hover:bg-gold-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSavingLesson ? <LoadingSpinner /> : <Save size={18} />}
                        {isSavingLesson ? 'جاري الحفظ...' : 'حفظ الدرس'}
                    </button>
                    <button onClick={() => setIsLessonModalOpen(false)} className="flex-1 bg-white/5 text-white py-3 rounded-xl hover:bg-white/10 transition-colors font-bold">إلغاء</button>
                </div>
            </div>
        </Modal>

        {/* Enrollment Modal */}
        <Modal
            isOpen={isEnrollModalOpen}
            onClose={() => setIsEnrollModalOpen(false)}
            title="تسجيل طالب في كورس"
        >
            <div className="space-y-6">
                <div className="bg-navy-950 p-4 rounded-xl border border-white/5">
                    <p className="text-sm text-gray-400 mb-1">الطالب المحدد:</p>
                    <p className="font-bold text-white text-lg">{selectedUserForEnrollment?.full_name || 'بدون اسم'}</p>
                    <p className="text-xs text-gray-500">{selectedUserForEnrollment?.email}</p>
                </div>

                <div>
                    <label className="block text-gray-400 text-sm mb-2 font-bold">اختر الكورس لإضافته:</label>
                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {courses.filter(c => c.is_paid).map(course => (
                            <button
                                key={course.id}
                                onClick={() => setSelectedCourseId(course.id)}
                                className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                                    selectedCourseId === course.id 
                                    ? 'bg-gold-500/10 border-gold-500 text-gold-500' 
                                    : 'bg-navy-950 border-white/10 text-gray-300 hover:bg-white/5'
                                }`}
                            >
                                <span className="font-bold text-sm">{course.title}</span>
                                {selectedCourseId === course.id && <CheckCircle size={18} />}
                            </button>
                        ))}
                        {courses.filter(c => c.is_paid).length === 0 && (
                            <p className="text-center text-gray-500 text-sm py-4">لا توجد كورسات مدفوعة متاحة.</p>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button 
                        onClick={handleEnrollUser} 
                        disabled={isEnrolling || !selectedCourseId}
                        className="flex-1 bg-gold-500 text-navy-950 py-3 rounded-xl font-bold hover:bg-gold-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isEnrolling ? <LoadingSpinner /> : <GraduationCap size={18} />}
                        {isEnrolling ? 'جاري التسجيل...' : 'تأكيد التسجيل'}
                    </button>
                    <button onClick={() => setIsEnrollModalOpen(false)} className="flex-1 bg-white/5 text-white py-3 rounded-xl hover:bg-white/10 transition-colors font-bold">إلغاء</button>
                </div>
            </div>
        </Modal>

      </div>
    </div>
  );
};
