import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { supabase } from '../lib/supabase';
import { User, Course, SiteSettings, Lesson } from '../types';
import { 
  LayoutDashboard, Users, BookOpen, Settings, Save, 
  Plus, Trash2, CheckCircle, AlertTriangle, Eye, RefreshCw, Edit, Video, Clock, Image as ImageIcon,
  ArrowLeft, Search, Loader2, X, Globe, MessageSquare, Shield, Activity
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';

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

// --- MAIN DASHBOARD ---

export const AdminDashboard: React.FC = () => {
  const { user, siteSettings, refreshData, updateSettings } = useStore();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'cms' | 'courses' | 'users'>('cms');
  
  // CMS State
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(siteSettings);
  const [cmsSection, setCmsSection] = useState<'hero' | 'features' | 'about' | 'contact'>('hero');
  const [isSavingCMS, setIsSavingCMS] = useState(false);
  
  // Data States
  const [usersList, setUsersList] = useState<User[]>([]);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  
  // Lesson Management State
  const [selectedCourseForLessons, setSelectedCourseForLessons] = useState<Course | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson>>({});
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  
  // Loading States
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [stats, setStats] = useState({ users: 0, active: 0, pending: 0, courses: 0 });

  // Search/Filter
  const [userSearch, setUserSearch] = useState('');
  
  // Course Modal
  const [editingCourse, setEditingCourse] = useState<Partial<Course>>({});
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isSavingCourse, setIsSavingCourse] = useState(false);

  // Initial Load
  useEffect(() => {
     setSettingsForm(JSON.parse(JSON.stringify(siteSettings)));
  }, [siteSettings]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users' && usersList.length === 0) fetchUsers();
    if (activeTab === 'courses' && coursesList.length === 0) fetchCourses();
  }, [activeTab]);

  const fetchStats = async () => {
    const [ { count: totalUsers }, { count: activeUsers }, { count: pendingUsers }, { count: totalCourses } ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('courses').select('*', { count: 'exact', head: true })
    ]);

    setStats({
        users: totalUsers || 0,
        active: activeUsers || 0,
        pending: pendingUsers || 0,
        courses: totalCourses || 0
    });
  };

  const fetchUsers = async () => {
      setLoadingUsers(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, status, created_at')
        .order('created_at', { ascending: false });
      if (data) setUsersList(data as User[]);
      setLoadingUsers(false);
  };

  const fetchCourses = async () => {
      setLoadingCourses(true);
      const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (data) setCoursesList(data as Course[]);
      setLoadingCourses(false);
  };

  const fetchLessons = async (courseId: string) => {
      setLoadingLessons(true);
      const { data } = await supabase.from('lessons').select('*').eq('course_id', courseId).order('order', { ascending: true });
      if (data) setCourseLessons(data as Lesson[]);
      setLoadingLessons(false);
  };

  // --- CMS ACTIONS ---
  const handleSettingChange = (field: keyof SiteSettings, value: any) => {
    setSettingsForm(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent: 'content_config' | 'features_config', key: string, value: any) => {
    setSettingsForm(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [key]: value
      }
    }));
  };

  const saveSettings = async () => {
      setIsSavingCMS(true);
      try {
        await updateSettings(settingsForm);
        showToast('تم تحديث إعدادات الموقع بنجاح', 'success');
        refreshData();
      } catch (error: any) {
        console.error(error);
        showToast('فشل الحفظ: ' + error.message, 'error');
      } finally {
        setIsSavingCMS(false);
      }
  };

  // --- COURSE ACTIONS ---
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
      
      let error;
      try {
        if (editingCourse.id) {
            ({ error } = await supabase.from('courses').update(payload).eq('id', editingCourse.id));
        } else {
            ({ error } = await supabase.from('courses').insert(payload));
        }

        if (error) throw error;

        showToast('تم حفظ الكورس بنجاح', 'success');
        setIsCourseModalOpen(false);
        fetchCourses();
        refreshData();
      } catch (err: any) {
        showToast('خطأ في الحفظ: ' + err.message, 'error');
      } finally {
        setIsSavingCourse(false);
      }
  };

  const deleteCourse = async (id: string) => {
      if(!confirm('هل أنت متأكد من حذف الكورس؟ سيتم حذف جميع الدروس المرتبطة به.')) return;
      await supabase.from('courses').delete().eq('id', id);
      fetchCourses();
      refreshData();
      showToast('تم حذف الكورس', 'success');
  };

  // --- LESSON ACTIONS ---
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
        fetchLessons(selectedCourseForLessons.id);
      } catch (err: any) {
        showToast('خطأ في حفظ الدرس: ' + err.message, 'error');
      } finally {
        setIsSavingLesson(false);
      }
  };

  const deleteLesson = async (id: string) => {
      if(!confirm('حذف الدرس؟')) return;
      await supabase.from('lessons').delete().eq('id', id);
      if (selectedCourseForLessons) fetchLessons(selectedCourseForLessons.id);
      showToast('تم حذف الدرس', 'success');
  };

  // --- USER ACTIONS ---
  const approveUser = async (id: string) => {
      await supabase.from('profiles').update({ status: 'active' }).eq('id', id);
      setUsersList(prev => prev.map(u => u.id === id ? { ...u, status: 'active' } : u));
      setStats(prev => ({ ...prev, active: prev.active + 1, pending: prev.pending - 1 }));
      showToast('تم تفعيل العضو', 'success');
  };

  const deleteUser = async (id: string) => {
    if(!confirm('تحذير: هل أنت متأكد تماماً من حذف هذا العضو؟')) return;
    try {
        const { error } = await supabase.rpc('delete_user_completely', { target_user_id: id });
        if (error) throw error;
        showToast('تم حذف العضو', 'success');
        setUsersList(prev => prev.filter(u => u.id !== id));
        setStats(prev => ({ ...prev, users: prev.users - 1 }));
    } catch (error: any) {
        showToast('خطأ في الحذف: ' + error.message, 'error');
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
            
            <div className="flex items-center gap-3">
                <Link to="/" target="_blank" className="bg-navy-800 hover:bg-navy-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors border border-white/5 shadow-lg">
                    <Eye size={18} /> معاينة الموقع
                </Link>
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
                            <button 
                                onClick={saveSettings} 
                                disabled={isSavingCMS}
                                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-500/20 transition-all disabled:opacity-50"
                            >
                                {isSavingCMS ? <LoadingSpinner /> : <Save size={18} />} 
                                {isSavingCMS ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: 'hero', label: 'الواجهة الرئيسية', icon: Globe },
                                { id: 'features', label: 'لماذا تختارنا', icon: Activity },
                                { id: 'about', label: 'من نحن', icon: Shield },
                                { id: 'contact', label: 'تواصل معنا', icon: MessageSquare },
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
                                </div>
                            )}

                             {/* ABOUT & CONTACT */}
                             {(cmsSection === 'about' || cmsSection === 'contact') && (
                                <div className="space-y-6">
                                    <h3 className="text-gold-500 font-bold text-lg border-b border-white/5 pb-2">نصوص الصفحات الداخلية</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-gray-400 text-sm mb-2 font-bold">عنوان "من نحن"</label>
                                            <input value={settingsForm.content_config?.about_main_title || ''} onChange={e => handleNestedChange('content_config', 'about_main_title', e.target.value)} className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white focus:border-gold-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-sm mb-2 font-bold">وصف "من نحن"</label>
                                            <textarea value={settingsForm.content_config?.about_main_desc || ''} onChange={e => handleNestedChange('content_config', 'about_main_desc', e.target.value)} className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white h-24 focus:border-gold-500 outline-none resize-none" />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-sm mb-2 font-bold">عنوان "تواصل معنا"</label>
                                            <input value={settingsForm.content_config?.contact_main_title || ''} onChange={e => handleNestedChange('content_config', 'contact_main_title', e.target.value)} className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white focus:border-gold-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-sm mb-2 font-bold">وصف "تواصل معنا"</label>
                                            <textarea value={settingsForm.content_config?.contact_main_desc || ''} onChange={e => handleNestedChange('content_config', 'contact_main_desc', e.target.value)} className="w-full bg-navy-900 border border-white/10 p-3 rounded-lg text-white h-24 focus:border-gold-500 outline-none resize-none" />
                                        </div>
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
                                <button onClick={fetchCourses} className="p-2 bg-navy-800 rounded-lg hover:bg-white/5 transition-colors" title="تحديث">
                                    <RefreshCw size={18} className={loadingCourses ? 'animate-spin' : ''} />
                                </button>
                                <button onClick={() => { setEditingCourse({}); setIsCourseModalOpen(true); }} className="bg-gold-500 text-navy-950 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gold-400 transition-colors shadow-lg">
                                    <Plus size={18} /> إضافة كورس
                                </button>
                            </div>
                        </div>

                        {loadingCourses ? (
                            <div className="text-center py-10"><LoadingSpinner /></div>
                        ) : (
                            <div className="space-y-4">
                                {coursesList.map(course => (
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
                        )}
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
                                <button onClick={fetchUsers} className="p-2 bg-navy-800 rounded-lg hover:bg-white/5 transition-colors" title="تحديث">
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
                                                <button onClick={() => deleteUser(u.id)} className="bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-1 rounded text-xs hover:bg-red-500 hover:text-white transition-colors">حذف</button>
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

      </div>
    </div>
  );
};
