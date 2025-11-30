import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { User, Course, SiteSettings, Lesson, Enrollment } from '../types';
import { calculateTotalMinutes, processVideoUrl } from '../utils/videoHelpers';
import { 
  Users, BookOpen, Settings, Plus, Trash2, 
  UserPlus, Video, X, Edit2,
  FileText, Globe, RefreshCw, CheckCircle, Ban, Unlock, AlertTriangle
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, siteSettings, updateSettings, refreshCourses } = useStore();
  const { showToast } = useToast();
  const { t } = useLanguage(); 
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'requests' | 'users' | 'courses' | 'settings' | 'content'>('requests');
  
  // Data Lists
  const [usersList, setUsersList] = useState<User[]>([]);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [enrollmentsList, setEnrollmentsList] = useState<Enrollment[]>([]);
  
  // Settings & Content
  const [localSettings, setLocalSettings] = useState<SiteSettings>(siteSettings);
  const [editingLang, setEditingLang] = useState<'ar' | 'en'>('ar');
  const [contentSubTab, setContentSubTab] = useState<'home' | 'about' | 'contact' | 'footer' | 'courses'>('home');
  const [saving, setSaving] = useState(false);

  // Modals
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [lessonsModalOpen, setLessonsModalOpen] = useState(false);
  
  // Selection & Forms
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedUserForEnroll, setSelectedUserForEnroll] = useState<User | null>(null);
  const [editingCourse, setEditingCourse] = useState<Partial<Course>>({});
  const [currentCourseLessons, setCurrentCourseLessons] = useState<Lesson[]>([]);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [newLesson, setNewLesson] = useState<Partial<Lesson>>({ 
    title: '', description: '', video_url: '', thumbnail_url: '', duration: '10:00', order: 1, is_published: true 
  });

  // --- INITIALIZATION ---
  useEffect(() => {
    fetchUsers();
    fetchCourses();
    fetchAllEnrollments();
    
    // Real-time updates for requests
    const profilesChannel = supabase.channel('admin_profiles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchUsers())
        .subscribe();
        
    return () => { supabase.removeChannel(profilesChannel); };
  }, []);

  // Keep local state in sync with global store until user starts editing
  useEffect(() => {
    if (!saving) {
        setLocalSettings(siteSettings);
    }
  }, [siteSettings]);

  // --- DATA FETCHING ---
  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsersList(data as User[]);
  };

  const fetchCourses = async () => {
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (data) { setCoursesList(data as Course[]); refreshCourses(); }
  };
  
  const fetchAllEnrollments = async () => {
      const { data } = await supabase.from('enrollments').select('*');
      if (data) setEnrollmentsList(data as Enrollment[]);
  };

  const fetchLessons = async (courseId: string) => {
    const { data } = await supabase.from('lessons').select('*').eq('course_id', courseId).order('order', { ascending: true });
    if (data) {
        setCurrentCourseLessons(data as Lesson[]);
        if (!editingLessonId) {
            const maxOrder = data.length > 0 ? Math.max(...data.map((l: Lesson) => l.order)) : 0;
            setNewLesson(prev => ({ ...prev, order: maxOrder + 1 }));
        }
    }
  };

  // --- USER MANAGEMENT ---
  const handleApproveUser = async (userId: string) => {
    const { error } = await supabase.from('profiles').update({ status: 'active' }).eq('id', userId);
    if (error) showToast(`فشل العملية: ${error.message}`, 'error');
    else {
        showToast('تم قبول العضو بنجاح', 'success');
        fetchUsers(); // Refresh list immediately
    }
  };

  const handleRejectUser = async (userId: string) => {
    if(!confirm('هل أنت متأكد من حذف هذا العضو نهائياً من قاعدة البيانات؟ لن يتمكن من الدخول مرة أخرى.')) return;
    
    // Use the new secure RPC function created in the migration
    const { error } = await supabase.rpc('delete_user_by_admin', { target_user_id: userId });
    
    if (error) {
        console.error("Delete error:", error);
        showToast(`فشل الحذف: ${error.message}`, 'error');
    } else {
        showToast('تم حذف العضو نهائياً', 'success');
        setUsersList(prev => prev.filter(u => u.id !== userId));
    }
  };

  const handleEnrollUser = async () => {
      if (!selectedUserForEnroll || !selectedCourseId) return;
      
      const { error } = await supabase.from('enrollments').insert({
          user_id: selectedUserForEnroll.id,
          course_id: selectedCourseId
      });
      
      if (error) {
          if (error.code === '23505') showToast('العضو مشترك بالفعل في هذا الكورس', 'error');
          else showToast(error.message, 'error');
      } else {
          showToast('تم تسجيل العضو في الكورس بنجاح', 'success');
          setEnrollModalOpen(false);
          fetchAllEnrollments();
      }
  };

  const handleUnenroll = async (userId: string, courseId: string) => {
      if(!confirm('هل تريد إلغاء اشتراك العضو في هذا الكورس؟')) return;
      await supabase.from('enrollments').delete().match({ user_id: userId, course_id: courseId });
      showToast('تم إلغاء الاشتراك', 'success');
      fetchAllEnrollments();
  };

  // --- COURSE MANAGEMENT ---
  const handleSaveCourse = async () => {
    if (!editingCourse.title) {
        showToast('يرجى كتابة عنوان الكورس', 'error');
        return;
    }
    
    const courseData = {
      title: editingCourse.title, 
      description: editingCourse.description, 
      thumbnail: editingCourse.thumbnail,
      is_paid: editingCourse.is_paid || false, 
      level: editingCourse.level || 'متوسط',
      rating: editingCourse.rating || 5,
    };

    try {
        if (editingCourse.id) {
            const { error } = await supabase.from('courses').update(courseData).eq('id', editingCourse.id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('courses').insert(courseData);
            if (error) throw error;
        }
        showToast('تم حفظ الكورس بنجاح', 'success'); 
        setCourseModalOpen(false); 
        fetchCourses();
    } catch (error: any) { 
        console.error("Course save error:", error);
        showToast(`خطأ في الحفظ: ${error.message}`, 'error'); 
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
      if (!confirm('هل أنت متأكد من حذف الكورس؟ سيتم حذف جميع الدروس المرتبطة به.')) return;
      const { error } = await supabase.from('courses').delete().eq('id', courseId);
      if (error) showToast(error.message, 'error');
      else {
          showToast('تم حذف الكورس', 'success');
          fetchCourses();
      }
  };

  const handleSaveLesson = async () => {
    if (!selectedCourseId || !newLesson.title || !newLesson.video_url) {
        showToast('يرجى ملء البيانات الأساسية للدرس', 'error');
        return;
    }
    
    const processed = processVideoUrl(newLesson.video_url);
    const lessonData = {
      course_id: selectedCourseId, 
      title: newLesson.title, 
      description: newLesson.description,
      video_url: processed.url, 
      thumbnail_url: newLesson.thumbnail_url,
      duration: newLesson.duration, 
      order: newLesson.order, 
      is_published: newLesson.is_published
    };

    try {
        if (editingLessonId) {
            await supabase.from('lessons').update(lessonData).eq('id', editingLessonId);
        } else {
            await supabase.from('lessons').insert(lessonData);
        }

        showToast('تم حفظ الدرس بنجاح', 'success');
        
        // Update course duration
        const { data: fresh } = await supabase.from('lessons').select('*').eq('course_id', selectedCourseId);
        if (fresh) {
            setCurrentCourseLessons(fresh as Lesson[]);
            const totalMins = calculateTotalMinutes(fresh as any);
            await supabase.from('courses').update({ duration: totalMins.toString() }).eq('id', selectedCourseId);
            fetchCourses();
        }
        setEditingLessonId(null);
        setNewLesson({ title: '', description: '', video_url: '', thumbnail_url: '', duration: '10:00', order: (fresh?.length || 0) + 1, is_published: true });
    } catch (e: any) {
        showToast(`خطأ: ${e.message}`, 'error');
    }
  };

  // --- CONTENT MANAGEMENT ---
  const handleSaveSettings = async () => {
      setSaving(true);
      try {
          // Pass the entire localSettings object. Store.tsx handles the payload construction.
          await updateSettings(localSettings);
          showToast('تم حفظ جميع الإعدادات والمحتوى بنجاح!', 'success');
      } catch (e: any) {
          console.error("Save failed:", e);
          showToast(`خطأ في الحفظ: ${e.message}`, 'error');
      } finally {
          setSaving(false);
      }
  };

  const updateContent = (key: string, value: string) => {
      const langKey = editingLang === 'en' ? `${key}_en` : key;
      setLocalSettings(prev => ({
          ...prev,
          content_config: {
              ...(prev.content_config || {}),
              [langKey]: value
          }
      }));
  };

  const getContent = (key: string) => {
      const langKey = editingLang === 'en' ? `${key}_en` : key;
      return (localSettings.content_config as any)?.[langKey] || '';
  };

  const updateRoot = (key: string, value: string) => {
      const langKey = editingLang === 'en' ? `${key}_en` : key;
      // Update both root and content_config to ensure sync
      setLocalSettings(prev => ({ 
          ...prev, 
          [langKey]: value,
          content_config: {
              ...(prev.content_config || {}),
              [langKey]: value
          }
      }));
  };
  
  const getRoot = (key: string) => {
      const langKey = editingLang === 'en' ? `${key}_en` : key;
      return (localSettings as any)?.[langKey] || '';
  };

  if (user?.role !== 'admin') return <div className="p-10 text-center text-white">غير مصرح لك بالدخول</div>;

  return (
    <div className="min-h-screen page-padding-top pb-10 bg-navy-950" dir="rtl">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">لوحة التحكم</h1>
            <p className="text-gray-400 text-sm">إدارة الأعضاء، الكورسات، ومحتوى الموقع بالكامل</p>
          </div>
          <button onClick={handleSaveSettings} disabled={saving} className="bg-gold-500 text-navy-950 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gold-400 shadow-lg disabled:opacity-50 transition-all">
             {saving ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
             {saving ? 'جاري الحفظ...' : 'حفظ كافة التغييرات'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-3 space-y-4">
            <div className="glass-card p-4 sticky top-44">
              <nav className="space-y-2">
                {[
                  { id: 'requests', label: 'طلبات الانضمام', icon: UserPlus, count: usersList.filter(u => u.status === 'pending').length },
                  { id: 'users', label: 'الأعضاء', icon: Users },
                  { id: 'courses', label: 'الكورسات', icon: BookOpen },
                  { id: 'content', label: 'المحتوى', icon: FileText },
                  { id: 'settings', label: 'الإعدادات', icon: Settings },
                ].map(item => (
                  <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-gold-500 text-navy-950 font-bold' : 'hover:bg-white/5 text-gray-300'}`}>
                    <div className="flex items-center gap-3"><item.icon size={18} /> {item.label}</div>
                    {item.count !== undefined && item.count > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{item.count}</span>}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9">
            <div className="glass-card p-6 min-h-[600px]">
               
               {/* REQUESTS TAB */}
               {activeTab === 'requests' && (
                 <div className="animate-fade-in">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><UserPlus className="text-gold-500" /> طلبات الانتظار</h2>
                    <div className="space-y-4">
                      {usersList.filter(u => u.status === 'pending').length === 0 && <p className="text-gray-500 text-center py-10">لا توجد طلبات جديدة.</p>}
                      {usersList.filter(u => u.status === 'pending').map(u => (
                        <div key={u.id} className="bg-navy-900/50 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-white">{u.full_name || 'بدون اسم'}</p>
                            <p className="text-xs text-gray-400">{u.email} | {u.phone_number}</p>
                            <p className="text-xs text-yellow-500 mt-1">في انتظار الموافقة...</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleApproveUser(u.id)} className="bg-green-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-600 flex items-center gap-1"><CheckCircle size={14} /> قبول</button>
                            <button onClick={() => handleRejectUser(u.id)} className="bg-red-500/10 text-red-400 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-500/20 flex items-center gap-1"><Trash2 size={14} /> حذف نهائي</button>
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
               )}

               {/* USERS TAB */}
               {activeTab === 'users' && (
                 <div className="animate-fade-in">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Users className="text-gold-500" /> الأعضاء النشطين</h2>
                    <div className="space-y-3">
                      {usersList.filter(u => u.status === 'active').map(u => (
                        <div key={u.id} className="bg-navy-900/50 p-4 rounded-xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                          <div className="flex items-center gap-3 w-full md:w-auto">
                             <div className="w-10 h-10 rounded-full bg-navy-800 flex items-center justify-center text-gold-500 font-bold border border-white/10">
                                {u.email.charAt(0).toUpperCase()}
                             </div>
                             <div>
                                <p className="font-bold text-white text-sm">{u.full_name || u.email}</p>
                                <p className="text-xs text-gray-400">{u.email}</p>
                             </div>
                          </div>
                          
                          {/* Enrollments Display */}
                          <div className="flex flex-wrap gap-2 justify-center">
                              {enrollmentsList.filter(e => e.user_id === u.id).map(e => {
                                  const course = coursesList.find(c => c.id === e.course_id);
                                  return (
                                      <span key={e.id} className="text-[10px] bg-gold-500/10 text-gold-400 border border-gold-500/20 px-2 py-1 rounded-full flex items-center gap-1 cursor-pointer hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-colors" onClick={() => handleUnenroll(u.id, e.course_id)} title="إلغاء الاشتراك">
                                          <Unlock size={10} /> {course?.title.substring(0, 15)}...
                                      </span>
                                  );
                              })}
                          </div>

                          <div className="flex items-center gap-2">
                             <button onClick={() => { setSelectedUserForEnroll(u); setEnrollModalOpen(true); }} className="bg-navy-800 text-white px-3 py-2 rounded-lg text-xs font-bold border border-white/10 hover:bg-white/5 flex items-center gap-1">
                                <Plus size={14} /> تسجيل في كورس
                             </button>
                             {u.role !== 'admin' && (
                                <button onClick={() => handleRejectUser(u.id)} className="text-red-400 p-2 hover:bg-red-500/10 rounded-lg" title="حذف العضو نهائياً"><Trash2 size={16} /></button>
                             )}
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
               )}

               {/* COURSES TAB */}
               {activeTab === 'courses' && (
                 <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-white">إدارة الكورسات</h2>
                      <button onClick={() => { setEditingCourse({}); setCourseModalOpen(true); }} className="bg-gold-500 text-navy-950 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2">
                        <Plus size={16} /> إضافة كورس جديد
                      </button>
                    </div>
                    <div className="space-y-4">
                      {coursesList.map(course => (
                        <div key={course.id} className="bg-navy-900/50 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="w-16 h-10 bg-black rounded overflow-hidden">
                               {course.thumbnail && <img src={course.thumbnail} className="w-full h-full object-cover" />}
                             </div>
                             <div>
                               <h3 className="font-bold text-white text-sm">{course.title}</h3>
                               <div className="flex gap-2 text-[10px]">
                                   <span className={`px-1.5 rounded ${course.is_paid ? 'bg-gold-500/10 text-gold-400' : 'bg-green-500/10 text-green-400'}`}>{course.is_paid ? 'مدفوع' : 'مجاني'}</span>
                                   <span className="text-gray-500">{course.lesson_count || 0} درس</span>
                               </div>
                             </div>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => { setSelectedCourseId(course.id); fetchLessons(course.id); setLessonsModalOpen(true); }} className="bg-navy-800 text-white px-3 py-1.5 rounded text-xs border border-white/10">الدروس</button>
                             <button onClick={() => { setEditingCourse(course); setCourseModalOpen(true); }} className="bg-navy-800 text-gold-400 px-3 py-1.5 rounded text-xs border border-white/10">تعديل</button>
                             <button onClick={() => handleDeleteCourse(course.id)} className="bg-red-500/10 text-red-400 px-3 py-1.5 rounded text-xs border border-red-500/20 hover:bg-red-500/20">حذف</button>
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
               )}

               {/* CONTENT TAB (CMS) */}
               {activeTab === 'content' && (
                 <div className="animate-fade-in">
                    <div className="flex items-center justify-between mb-6 bg-navy-900 p-3 rounded-xl border border-white/10">
                        <span className="text-sm font-bold text-gray-300 flex items-center gap-2"><Globe size={16} /> لغة التعديل:</span>
                        <div className="flex gap-2">
                            <button onClick={() => setEditingLang('ar')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${editingLang === 'ar' ? 'bg-gold-500 text-navy-950' : 'bg-white/5 text-gray-400'}`}>العربية</button>
                            <button onClick={() => setEditingLang('en')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${editingLang === 'en' ? 'bg-gold-500 text-navy-950' : 'bg-white/5 text-gray-400'}`}>English</button>
                        </div>
                    </div>
                    
                    {/* Sub Tabs */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 border-b border-white/5">
                        {[
                            {id: 'home', label: 'الرئيسية'},
                            {id: 'about', label: 'من نحن'},
                            {id: 'contact', label: 'تواصل معنا'},
                            {id: 'footer', label: 'الفوتر'},
                            {id: 'courses', label: 'صفحة الكورسات'}
                        ].map(tab => (
                            <button key={tab.id} onClick={() => setContentSubTab(tab.id as any)} className={`px-4 py-2 rounded-t-lg text-sm font-bold ${contentSubTab === tab.id ? 'bg-white/10 text-gold-400 border-b-2 border-gold-500' : 'text-gray-400 hover:text-white'}`}>{tab.label}</button>
                        ))}
                    </div>

                    <div className="space-y-6">
                        {contentSubTab === 'home' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs text-gray-400">عنوان الهيرو (السطر 1)</label><input className="w-full bg-navy-950 border border-white/10 rounded p-2 text-white" value={getContent('hero_title_line1')} onChange={e => updateContent('hero_title_line1', e.target.value)} /></div>
                                    <div><label className="text-xs text-gray-400">عنوان الهيرو (السطر 2 - ذهبي)</label><input className="w-full bg-navy-950 border border-white/10 rounded p-2 text-white" value={getContent('hero_title_line2')} onChange={e => updateContent('hero_title_line2', e.target.value)} /></div>
                                </div>
                                <div><label className="text-xs text-gray-400">وصف الهيرو</label><textarea className="w-full bg-navy-950 border border-white/10 rounded p-2 text-white h-20" value={getRoot('hero_desc')} onChange={e => updateRoot('hero_desc', e.target.value)} /></div>
                                
                                <h3 className="text-gold-500 font-bold mt-4">قسم "لماذا تختارنا"</h3>
                                <div><label className="text-xs text-gray-400">عنوان القسم</label><input className="w-full bg-navy-950 border border-white/10 rounded p-2 text-white" value={getContent('why_choose_us_title')} onChange={e => updateContent('why_choose_us_title', e.target.value)} /></div>
                                <div><label className="text-xs text-gray-400">وصف القسم</label><input className="w-full bg-navy-950 border border-white/10 rounded p-2 text-white" value={getContent('why_choose_us_desc')} onChange={e => updateContent('why_choose_us_desc', e.target.value)} /></div>
                                
                                <h3 className="text-gold-500 font-bold mt-4">قسم الدعوة (CTA)</h3>
                                <div><label className="text-xs text-gray-400">العنوان</label><input className="w-full bg-navy-950 border border-white/10 rounded p-2 text-white" value={getContent('cta_title')} onChange={e => updateContent('cta_title', e.target.value)} /></div>
                                <div><label className="text-xs text-gray-400">الوصف</label><input className="w-full bg-navy-950 border border-white/10 rounded p-2 text-white" value={getContent('cta_desc')} onChange={e => updateContent('cta_desc', e.target.value)} /></div>
                            </div>
                        )}

                        {contentSubTab === 'about' && (
                            <div className="space-y-4">
                                <div><label className="text-xs text-gray-400">العنوان الرئيسي</label><input className="w-full bg-navy-950 border border-white/10 rounded p-2 text-white" value={getContent('about_main_title')} onChange={e => updateContent('about_main_title', e.target.value)} /></div>
                                <div><label className="text-xs text-gray-400">الوصف الرئيسي</label><textarea className="w-full bg-navy-950 border border-white/10 rounded p-2 text-white h-24" value={getContent('about_main_desc')} onChange={e => updateContent('about_main_desc', e.target.value)} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs text-gray-400">عنوان المهمة</label><input className="w-full bg-navy-950 border border-white/10 rounded p-2 text-white" value={getContent('mission_title')} onChange={e => updateContent('mission_title', e.target.value)} /></div>
                                    <div><label className="text-xs text-gray-400">عنوان الرؤية</label><input className="w-full bg-navy-950 border border-white/10 rounded p-2 text-white" value={getContent('vision_title')} onChange={e => updateContent('vision_title', e.target.value)} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs text-gray-400">وصف المهمة</label><textarea className="w-full bg-navy-950 border border-white/10 rounded p-2 text-white h-20" value={getContent('mission_desc')} onChange={e => updateContent('mission_desc', e.target.value)} /></div>
                                    <div><label className="text-xs text-gray-400">وصف الرؤية</label><textarea className="w-full bg-navy-950 border border-white/10 rounded p-2 text-white h-20" value={getContent('vision_desc')} onChange={e => updateContent('vision_desc', e.target.value)} /></div>
                                </div>
                            </div>
                        )}
                        
                        {contentSubTab === 'contact' && (
                             <div className="space-y-4">
                                <div><label className="text-xs text-gray-400">العنوان الرئيسي</label><input className="w-full bg-navy-950 border border-white/10 rounded p-2 text-white" value={getContent('contact_main_title')} onChange={e => updateContent('contact_main_title', e.target.value)} /></div>
                                <div><label className="text-xs text-gray-400">الوصف</label><input className="w-full bg-navy-950 border border-white/10 rounded p-2 text-white" value={getContent('contact_main_desc')} onChange={e => updateContent('contact_main_desc', e.target.value)} /></div>
                                
                                <h3 className="text-gold-500 font-bold mt-4">روابط التواصل الاجتماعي</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs text-gray-400">رابط فيسبوك</label><input dir="ltr" className="w-full bg-navy-950 border border-white/10 rounded p-2 text-white" value={localSettings.social_links?.facebook || ''} onChange={e => setLocalSettings({...localSettings, social_links: {...localSettings.social_links!, facebook: e.target.value}})} /></div>
                                    <div><label className="text-xs text-gray-400">رابط انستجرام</label><input dir="ltr" className="w-full bg-navy-950 border border-white/10 rounded p-2 text-white" value={localSettings.social_links?.instagram || ''} onChange={e => setLocalSettings({...localSettings, social_links: {...localSettings.social_links!, instagram: e.target.value}})} /></div>
                                    <div><label className="text-xs text-gray-400">رابط تيليجرام</label><input dir="ltr" className="w-full bg-navy-950 border border-white/10 rounded p-2 text-white" value={localSettings.social_links?.telegram || ''} onChange={e => setLocalSettings({...localSettings, social_links: {...localSettings.social_links!, telegram: e.target.value}})} /></div>
                                    <div><label className="text-xs text-gray-400">رابط واتساب</label><input dir="ltr" className="w-full bg-navy-950 border border-white/10 rounded p-2 text-white" value={localSettings.social_links?.whatsapp || ''} onChange={e => setLocalSettings({...localSettings, social_links: {...localSettings.social_links!, whatsapp: e.target.value}})} /></div>
                                </div>
                             </div>
                        )}
                        
                        {contentSubTab === 'footer' && (
                             <div className="space-y-4">
                                <div><label className="text-xs text-gray-400">شعار الفوتر (Tagline)</label><input className="w-full bg-navy-950 border border-white/10 rounded p-2 text-white" value={getContent('footer_tagline')} onChange={e => updateContent('footer_tagline', e.target.value)} /></div>
                                <div><label className="text-xs text-gray-400">النص الفرعي</label><input className="w-full bg-navy-950 border border-white/10 rounded p-2 text-white" value={getContent('footer_sub_tagline')} onChange={e => updateContent('footer_sub_tagline', e.target.value)} /></div>
                             </div>
                        )}
                    </div>
                 </div>
               )}

               {/* SETTINGS TAB */}
               {activeTab === 'settings' && (
                   <div className="animate-fade-in space-y-6">
                       <h2 className="text-xl font-bold mb-6">الإعدادات العامة</h2>
                       <div><label className="text-xs text-gray-400">اسم الموقع</label><input className="w-full bg-navy-950 border border-white/10 rounded p-2 text-white" value={localSettings.site_name} onChange={e => setLocalSettings({...localSettings, site_name: e.target.value})} /></div>
                       <div><label className="text-xs text-gray-400">رابط الشعار (Logo URL)</label><input dir="ltr" className="w-full bg-navy-950 border border-white/10 rounded p-2 text-white" value={localSettings.logo_url} onChange={e => setLocalSettings({...localSettings, logo_url: e.target.value})} /></div>
                       
                       <h3 className="text-gold-500 font-bold mt-4">تفعيل/تعطيل الميزات</h3>
                       <div className="grid grid-cols-2 gap-4">
                           <div className="flex items-center gap-2 bg-navy-900 p-3 rounded border border-white/5">
                               <input type="checkbox" checked={localSettings.features_config?.show_coming_soon} onChange={e => setLocalSettings({...localSettings, features_config: {...localSettings.features_config, show_coming_soon: e.target.checked}})} className="accent-gold-500" />
                               <label className="text-sm text-white">إظهار قسم "قريباً"</label>
                           </div>
                           <div className="flex items-center gap-2 bg-navy-900 p-3 rounded border border-white/5">
                               <input type="checkbox" checked={localSettings.features_config?.show_stats} onChange={e => setLocalSettings({...localSettings, features_config: {...localSettings.features_config, show_stats: e.target.checked}})} className="accent-gold-500" />
                               <label className="text-sm text-white">إظهار الإحصائيات في الرئيسية</label>
                           </div>
                       </div>
                       
                       <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mt-8">
                           <h3 className="text-red-400 font-bold flex items-center gap-2 mb-2"><AlertTriangle size={18} /> وضع الصيانة</h3>
                           <p className="text-gray-400 text-sm mb-4">عند التفعيل، لن يتمكن أحد من دخول الموقع سوى المشرفين.</p>
                           <div className="flex items-center gap-2">
                               <input type="checkbox" checked={localSettings.maintenance_mode || false} onChange={e => setLocalSettings({...localSettings, maintenance_mode: e.target.checked})} className="accent-red-500 w-5 h-5" />
                               <label className="text-white font-bold">تفعيل وضع الصيانة</label>
                           </div>
                       </div>
                   </div>
               )}
            </div>
          </div>
        </div>

        {/* ENROLL MODAL */}
        {enrollModalOpen && selectedUserForEnroll && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
             <div className="glass-card p-8 max-w-md w-full">
                <h3 className="text-xl font-bold text-white mb-4">تسجيل العضو: <span className="text-gold-500">{selectedUserForEnroll.full_name || selectedUserForEnroll.email}</span></h3>
                <div className="space-y-4">
                    <select value={selectedCourseId || ''} onChange={e => setSelectedCourseId(e.target.value)} className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 text-white">
                        <option value="">اختر الكورس</option>
                        {coursesList.filter(c => c.is_paid).map(c => <option key={c.id} value={c.id}>{c.title} (مدفوع)</option>)}
                        {coursesList.filter(c => !c.is_paid).map(c => <option key={c.id} value={c.id}>{c.title} (مجاني)</option>)}
                    </select>
                    <div className="flex gap-3">
                        <button onClick={handleEnrollUser} className="flex-1 bg-gold-500 text-navy-950 py-2 rounded-lg font-bold">تأكيد التسجيل</button>
                        <button onClick={() => setEnrollModalOpen(false)} className="flex-1 bg-white/5 text-white py-2 rounded-lg">إلغاء</button>
                    </div>
                </div>
             </div>
           </div>
        )}
        
        {/* COURSE MODAL */}
        {courseModalOpen && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
             <div className="glass-card p-8 max-w-lg w-full">
                <h3 className="text-xl font-bold text-white mb-4">{editingCourse.id ? 'تعديل الكورس' : 'إضافة كورس جديد'}</h3>
                <div className="space-y-3">
                    <input type="text" placeholder="عنوان الكورس" value={editingCourse.title || ''} onChange={e => setEditingCourse({...editingCourse, title: e.target.value})} className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 text-white" />
                    <textarea placeholder="وصف الكورس" value={editingCourse.description || ''} onChange={e => setEditingCourse({...editingCourse, description: e.target.value})} className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 text-white h-24" />
                    <input type="text" dir="ltr" placeholder="رابط الصورة المصغرة (Thumbnail URL)" value={editingCourse.thumbnail || ''} onChange={e => setEditingCourse({...editingCourse, thumbnail: e.target.value})} className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 text-white text-left" />
                    <div className="flex gap-2">
                        <select value={editingCourse.level || 'متوسط'} onChange={e => setEditingCourse({...editingCourse, level: e.target.value as any})} className="bg-navy-950 border border-white/10 rounded-xl p-3 text-white flex-1">
                            <option value="مبتدئ">مبتدئ</option>
                            <option value="متوسط">متوسط</option>
                            <option value="خبير">خبير</option>
                        </select>
                        <input type="number" placeholder="التقييم" value={editingCourse.rating || 5} onChange={e => setEditingCourse({...editingCourse, rating: parseFloat(e.target.value)})} className="bg-navy-950 border border-white/10 rounded-xl p-3 text-white w-24 text-center" />
                    </div>
                    <div className="flex items-center gap-2 bg-navy-900 p-3 rounded border border-white/5">
                        <input type="checkbox" checked={editingCourse.is_paid || false} onChange={e => setEditingCourse({...editingCourse, is_paid: e.target.checked})} className="accent-gold-500 w-5 h-5" />
                        <label className="text-white text-sm font-bold">هل الكورس مدفوع؟ (يتطلب اشتراك)</label>
                    </div>
                    <button onClick={handleSaveCourse} className="w-full bg-gold-500 text-navy-950 py-3 rounded-xl font-bold mt-2">حفظ</button>
                    <button onClick={() => setCourseModalOpen(false)} className="w-full bg-white/5 text-white py-3 rounded-xl font-bold">إلغاء</button>
                </div>
             </div>
           </div>
        )}
        
        {/* LESSONS MODAL */}
        {lessonsModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <div className="glass-card p-6 max-w-5xl w-full border-gold-500/30 shadow-2xl h-[90vh] flex flex-col">
              <div className="flex justify-between items-center mb-6 shrink-0">
                 <h3 className="text-2xl font-bold text-white flex items-center gap-2"><Video className="text-gold-500" /> إدارة الدروس</h3>
                 <button onClick={() => setLessonsModalOpen(false)} className="text-gray-400 hover:text-white"><X /></button>
              </div>
              <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
                 <div className="lg:w-1/3 bg-navy-900/50 p-5 rounded-xl border border-white/5 shrink-0 overflow-y-auto custom-scrollbar">
                    <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider flex items-center justify-between">
                        {editingLessonId ? 'تعديل الدرس' : 'إضافة درس جديد'}
                        {editingLessonId && <button onClick={() => { setEditingLessonId(null); setNewLesson({ title: '', description: '', video_url: '', thumbnail_url: '', duration: '10:00', order: (currentCourseLessons.length || 0) + 1, is_published: true }); }} className="text-[10px] text-gold-500">إلغاء التعديل</button>}
                    </h4>
                    <div className="space-y-3">
                        <input type="text" placeholder="عنوان الدرس" value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})} className="w-full bg-navy-950 border border-white/10 rounded-lg p-2 text-sm text-white" />
                        <textarea placeholder="وصف الدرس" value={newLesson.description || ''} onChange={e => setNewLesson({...newLesson, description: e.target.value})} className="w-full bg-navy-950 border border-white/10 rounded-lg p-2 text-sm text-white h-20" />
                        <textarea dir="ltr" placeholder="رابط الفيديو (يوتيوب / Embed)" value={newLesson.video_url} onChange={e => setNewLesson({...newLesson, video_url: e.target.value})} className="w-full bg-navy-950 border border-white/10 rounded-lg p-2 text-sm text-white h-24 text-left" />
                        <input type="text" dir="ltr" placeholder="رابط الصورة المصغرة" value={newLesson.thumbnail_url || ''} onChange={e => setNewLesson({...newLesson, thumbnail_url: e.target.value})} className="w-full bg-navy-950 border border-white/10 rounded-lg p-2 text-sm text-white text-left" />
                        <div className="flex gap-2">
                            <input type="text" dir="ltr" placeholder="المدة (00:00)" value={newLesson.duration} onChange={e => setNewLesson({...newLesson, duration: e.target.value})} className="w-full bg-navy-950 border border-white/10 rounded-lg p-2 text-sm text-white text-center" />
                            <input type="number" placeholder="الترتيب" value={newLesson.order} onChange={e => setNewLesson({...newLesson, order: parseInt(e.target.value)})} className="w-full bg-navy-950 border border-white/10 rounded-lg p-2 text-sm text-white text-center" />
                        </div>
                        <button onClick={handleSaveLesson} className="w-full bg-gold-500 text-navy-950 py-2 rounded-lg font-bold text-sm mt-2 hover:bg-gold-400">حفظ الدرس</button>
                    </div>
                 </div>
                 <div className="lg:w-2/3 bg-navy-950 rounded-xl border border-white/5 overflow-hidden flex flex-col">
                    <div className="p-4 bg-navy-900 border-b border-white/5 flex justify-between items-center">
                        <h4 className="font-bold text-white text-sm">قائمة الدروس ({currentCourseLessons.length})</h4>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {currentCourseLessons.map((lesson) => (
                            <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-lg border bg-navy-900/50 border-white/5 hover:border-gold-500/20">
                                <div className="text-gray-500 font-mono text-xs w-6 text-center">{lesson.order}</div>
                                <div className="flex-1 min-w-0">
                                    <h5 className="text-white font-bold text-sm truncate">{lesson.title}</h5>
                                    <span className="text-gray-500 text-[10px]">{lesson.duration}</span>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => { setEditingLessonId(lesson.id!); setNewLesson(lesson); }} className="text-gold-400 p-2 hover:bg-gold-500/10 rounded"><Edit2 size={14} /></button>
                                    <button onClick={async () => { if(confirm('حذف الدرس؟')) { await supabase.from('lessons').delete().eq('id', lesson.id); fetchLessons(selectedCourseId!); }}} className="text-red-400 p-2 hover:bg-red-500/10 rounded"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
