import React, { useEffect, useState } from 'react';
import { useStore } from '../context/Store';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { User, Course, SiteSettings, Lesson, Feature } from '../types';
import { 
  Users, BookOpen, Settings, CheckCircle, Plus, Trash2, Save, 
  UserPlus, Search, Facebook, Instagram, Send, FileText, BarChart3, 
  Type, Phone, Edit, Video, X, PlayCircle, Star, MessageCircle, Power
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, siteSettings, updateSettings } = useStore();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'requests' | 'users' | 'courses' | 'settings'>('requests');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [localSettings, setLocalSettings] = useState<SiteSettings>(siteSettings);
  
  // --- Modals State ---
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [lessonsModalOpen, setLessonsModalOpen] = useState(false);
  
  // --- Selection State ---
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [enrollEmail, setEnrollEmail] = useState('');
  
  // --- Course Editing State ---
  const [editingCourse, setEditingCourse] = useState<Partial<Course>>({});
  
  // --- Lessons Editing State ---
  const [currentCourseLessons, setCurrentCourseLessons] = useState<Lesson[]>([]);
  const [newLesson, setNewLesson] = useState<Partial<Lesson>>({ title: '', video_url: '', duration: '10:00', order: 1 });

  useEffect(() => {
    fetchUsers();
    fetchCourses();
    setLocalSettings(siteSettings);
  }, [siteSettings]);

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsersList(data as User[]);
  };

  const fetchCourses = async () => {
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (data) setCoursesList(data as Course[]);
  };

  const fetchLessons = async (courseId: string) => {
    const { data } = await supabase.from('lessons').select('*').eq('course_id', courseId).order('order', { ascending: true });
    if (data) setCurrentCourseLessons(data as Lesson[]);
  };

  // --- User Actions ---
  const handleApproveUser = async (userId: string) => {
    await supabase.from('profiles').update({ status: 'active' }).eq('id', userId);
    showToast('تم تفعيل حساب العضو بنجاح', 'success');
    fetchUsers();
  };

  const handleDeleteUser = async (userId: string) => {
    if(!confirm('هل أنت متأكد من حذف هذا العضو؟')) return;
    await supabase.from('profiles').delete().eq('id', userId);
    showToast('تم حذف العضو بنجاح', 'error');
    fetchUsers();
  };

  const handleAddEnrollment = async () => {
    if (!selectedCourseId || !enrollEmail) return;
    const targetUser = usersList.find(u => u.email === enrollEmail);
    if (!targetUser) {
      showToast('المستخدم غير موجود', 'error');
      return;
    }
    const { error } = await supabase.from('enrollments').insert({
      user_id: targetUser.id,
      course_id: selectedCourseId
    });
    if (error) {
        showToast('خطأ: ربما المستخدم مسجل بالفعل', 'error');
    } else {
      showToast('تم إضافة المستخدم للكورس بنجاح', 'success');
      setEnrollEmail('');
      setEnrollModalOpen(false);
    }
  };

  // --- Course Actions ---
  const handleSaveCourse = async () => {
    if (!editingCourse.title || !editingCourse.description) {
      showToast('يرجى ملء الحقول الأساسية', 'error');
      return;
    }

    const courseData = {
      title: editingCourse.title,
      description: editingCourse.description,
      thumbnail: editingCourse.thumbnail,
      is_paid: editingCourse.is_paid || false,
      level: editingCourse.level || 'متوسط',
      duration: editingCourse.duration || '0 ساعة',
      rating: editingCourse.rating || 5,
      lesson_count: editingCourse.lesson_count || 0
    };

    if (editingCourse.id) {
      // Update
      const { error } = await supabase.from('courses').update(courseData).eq('id', editingCourse.id);
      if (!error) showToast('تم تحديث الكورس بنجاح', 'success');
      else showToast('حدث خطأ أثناء التحديث', 'error');
    } else {
      // Create
      const { error } = await supabase.from('courses').insert(courseData);
      if (!error) showToast('تم إنشاء الكورس بنجاح', 'success');
      else showToast('حدث خطأ أثناء الإنشاء', 'error');
    }
    setCourseModalOpen(false);
    fetchCourses();
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('هل أنت متأكد؟ سيتم حذف الكورس وجميع دروسه!')) return;
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (!error) {
      showToast('تم حذف الكورس', 'success');
      fetchCourses();
    } else {
      showToast('حدث خطأ أثناء الحذف', 'error');
    }
  };

  const openCourseModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
    } else {
      setEditingCourse({ is_paid: true, rating: 5, level: 'متوسط' });
    }
    setCourseModalOpen(true);
  };

  // --- Lesson Actions ---
  const openLessonsModal = async (courseId: string) => {
    setSelectedCourseId(courseId);
    await fetchLessons(courseId);
    setNewLesson({ title: '', video_url: '', duration: '10:00', order: (currentCourseLessons.length || 0) + 1 });
    setLessonsModalOpen(true);
  };

  const handleAddLesson = async () => {
    if (!selectedCourseId || !newLesson.title || !newLesson.video_url) return;
    
    const { error } = await supabase.from('lessons').insert({
      course_id: selectedCourseId,
      title: newLesson.title,
      video_url: newLesson.video_url,
      duration: newLesson.duration,
      order: newLesson.order
    });

    if (!error) {
      showToast('تم إضافة الدرس', 'success');
      fetchLessons(selectedCourseId);
      setNewLesson({ ...newLesson, title: '', video_url: '', order: (newLesson.order || 0) + 1 });
    } else {
      showToast('خطأ في إضافة الدرس', 'error');
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('حذف الدرس؟')) return;
    const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
    if (!error && selectedCourseId) {
      fetchLessons(selectedCourseId);
      showToast('تم الحذف', 'success');
    }
  };

  // --- Settings Actions ---
  const handleSaveSettings = async () => {
      try {
        await updateSettings(localSettings);
        showToast('تم حفظ إعدادات الموقع وتحديث قاعدة البيانات فوراً', 'success');
      } catch (error) {
        showToast('حدث خطأ أثناء الحفظ', 'error');
      }
  };

  const handleFeatureChange = (index: number, field: keyof Feature, value: string) => {
    const newFeatures = [...(localSettings.home_features || [])];
    if (!newFeatures[index]) return;
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setLocalSettings({ ...localSettings, home_features: newFeatures });
  };

  const pendingUsers = usersList.filter(u => u.status === 'pending');

  if (user?.role !== 'admin') return <div className="min-h-screen flex items-center justify-center text-white">غير مصرح لك بالدخول</div>;

  return (
    <div className="min-h-screen page-padding-top pb-10 bg-navy-950">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">لوحة التحكم الشاملة</h1>
            <p className="text-gray-400 text-sm">مركز القيادة والتحكم في المنصة</p>
          </div>
          <div className="flex gap-3">
             <div className={`border px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors ${siteSettings.maintenance_mode ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${siteSettings.maintenance_mode ? 'bg-red-500' : 'bg-green-500'}`}></div> 
                {siteSettings.maintenance_mode ? 'وضع الصيانة مفعل' : 'النظام يعمل'}
             </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3 space-y-4">
            <div className="glass-card p-4 sticky top-44">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">القائمة الرئيسية</p>
              <nav className="space-y-2">
                <button onClick={() => setActiveTab('requests')} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${activeTab === 'requests' ? 'bg-gold-500 text-navy-950 font-bold shadow-lg shadow-gold-500/20' : 'hover:bg-white/5 text-gray-300'}`}>
                  <div className="flex items-center gap-3"><Users size={18} /> طلبات الانضمام</div>
                  {pendingUsers.length > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">{pendingUsers.length}</span>}
                </button>
                <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-gold-500 text-navy-950 font-bold shadow-lg shadow-gold-500/20' : 'hover:bg-white/5 text-gray-300'}`}>
                  <Users size={18} /> إدارة الأعضاء
                </button>
                <button onClick={() => setActiveTab('courses')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'courses' ? 'bg-gold-500 text-navy-950 font-bold shadow-lg shadow-gold-500/20' : 'hover:bg-white/5 text-gray-300'}`}>
                  <BookOpen size={18} /> إدارة الكورسات
                </button>
                <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-gold-500 text-navy-950 font-bold shadow-lg shadow-gold-500/20' : 'hover:bg-white/5 text-gray-300'}`}>
                  <Settings size={18} /> إعدادات الموقع (CMS)
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            <div className="glass-card p-6 min-h-[600px] relative overflow-hidden">
              
              {/* ================= REQUESTS TAB ================= */}
              {activeTab === 'requests' && (
                <div className="animate-fade-in">
                  <h2 className="text-xl font-bold mb-6 border-b border-white/10 pb-4 text-white flex items-center gap-2">
                    <Users className="text-gold-500" size={24} /> طلبات الانضمام المعلقة
                  </h2>
                  {pendingUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                      <CheckCircle size={48} className="mb-4 opacity-20" />
                      <p>لا توجد طلبات جديدة، الكل تحت السيطرة</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {pendingUsers.map(u => (
                        <div key={u.id} className="flex flex-col md:flex-row items-start md:items-center justify-between bg-navy-900/50 p-5 rounded-xl border border-white/5 hover:border-gold-500/30 transition-colors gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-navy-800 flex items-center justify-center text-gray-400 font-bold border border-white/5 shrink-0">
                              {u.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-white text-lg">{u.full_name || 'بدون اسم'}</p>
                                <span className="text-xs bg-white/5 px-2 py-0.5 rounded text-gray-400">{u.email}</span>
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><Phone size={12} /> {u.phone_number || '---'}</span>
                                <span>{new Date(u.created_at!).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-3 w-full md:w-auto">
                            <button onClick={() => handleApproveUser(u.id)} className="flex-1 md:flex-none bg-green-500/10 text-green-400 px-6 py-2 rounded-lg hover:bg-green-500/20 font-bold text-sm border border-green-500/20 transition-colors">قبول</button>
                            <button onClick={() => handleDeleteUser(u.id)} className="flex-1 md:flex-none bg-red-500/10 text-red-400 px-6 py-2 rounded-lg hover:bg-red-500/20 font-bold text-sm border border-red-500/20 transition-colors">رفض</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ================= USERS TAB ================= */}
              {activeTab === 'users' && (
                 <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                      <h2 className="text-xl font-bold text-white">جميع الأعضاء ({usersList.length})</h2>
                      <div className="relative">
                        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input type="text" placeholder="بحث..." className="bg-navy-950 border border-white/10 rounded-lg pl-4 pr-10 py-2 text-sm focus:border-gold-500 outline-none w-64" />
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-right">
                        <thead className="text-gray-500 text-xs uppercase bg-navy-950/50">
                          <tr>
                            <th className="px-4 py-3 rounded-r-lg">المستخدم</th>
                            <th className="px-4 py-3">بيانات الاتصال</th>
                            <th className="px-4 py-3">الحالة</th>
                            <th className="px-4 py-3">الدور</th>
                            <th className="px-4 py-3 rounded-l-lg">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {usersList.map(u => (
                            <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-navy-800 flex items-center justify-center text-xs font-bold text-gold-500 border border-white/5">
                                    {u.email.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-gray-200 font-bold text-sm">{u.full_name || '---'}</p>
                                    <p className="text-gray-500 text-xs">{u.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-400">
                                {u.phone_number ? (
                                  <span className="flex items-center gap-1"><Phone size={12} /> {u.phone_number}</span>
                                ) : '---'}
                              </td>
                              <td className="px-4 py-4">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold border ${u.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                                  {u.status === 'active' ? 'نشط' : 'معلق'}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-400">{u.role}</td>
                              <td className="px-4 py-4">
                                <button onClick={() => handleDeleteUser(u.id)} className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"><Trash2 size={16} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
              )}

              {/* ================= COURSES TAB ================= */}
              {activeTab === 'courses' && (
                 <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                      <h2 className="text-xl font-bold text-white">إدارة الكورسات</h2>
                      <button onClick={() => openCourseModal()} className="bg-gold-500 text-navy-950 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/20">
                        <Plus size={18} /> إضافة كورس جديد
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {coursesList.map(course => (
                        <div key={course.id} className="bg-navy-900/50 p-5 rounded-xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-gold-500/20 transition-colors group">
                          <div className="flex items-center gap-5">
                            <div className="w-20 h-20 bg-navy-800 rounded-lg overflow-hidden shrink-0 border border-white/5 relative">
                              {course.thumbnail ? (
                                <img src={course.thumbnail} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><BookOpen className="text-gray-600" /></div>
                              )}
                            </div>
                            <div>
                              <h3 className="font-bold text-white text-lg group-hover:text-gold-400 transition-colors">{course.title}</h3>
                              <div className="flex gap-2 mt-2">
                                {course.is_paid ? (
                                  <span className="text-[10px] bg-gold-500/10 text-gold-400 px-2 py-0.5 rounded border border-gold-500/20 font-bold">Premium</span>
                                ) : (
                                  <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20 font-bold">Free</span>
                                )}
                                <span className="text-[10px] bg-navy-950 text-gray-400 px-2 py-0.5 rounded border border-white/10">{course.lesson_count || 0} دروس</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-3 border-t md:border-t-0 border-white/5 pt-4 md:pt-0 flex-wrap">
                             <button 
                                onClick={() => openLessonsModal(course.id)}
                                className="bg-navy-800 text-gray-300 px-4 py-2 rounded-lg text-xs font-bold hover:bg-navy-700 flex items-center gap-2 border border-white/5 transition-colors"
                              >
                                <Video size={14} /> إدارة الدروس
                              </button>
                            {course.is_paid && (
                              <button 
                                onClick={() => { setSelectedCourseId(course.id); setEnrollModalOpen(true); }}
                                className="bg-blue-500/10 text-blue-400 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-500/20 flex items-center gap-2 border border-blue-500/20 transition-colors"
                              >
                                <UserPlus size={14} /> المشتركين
                              </button>
                            )}
                            <button onClick={() => openCourseModal(course)} className="bg-white/5 text-gray-300 px-4 py-2 rounded-lg text-xs font-bold hover:bg-white/10 border border-white/5 transition-colors flex items-center gap-2">
                                <Edit size={14} /> تعديل
                            </button>
                            <button onClick={() => handleDeleteCourse(course.id)} className="bg-red-500/10 text-red-400 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-500/20 border border-red-500/20 transition-colors">حذف</button>
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
              )}

              {/* ================= SETTINGS TAB ================= */}
              {activeTab === 'settings' && (
                <div className="animate-fade-in max-w-3xl">
                  <h2 className="text-xl font-bold mb-6 border-b border-white/10 pb-4 text-white flex items-center gap-2">
                    <Settings className="text-gold-500" size={24} /> إعدادات الموقع (CMS)
                  </h2>
                  
                  <div className="space-y-8 h-[500px] overflow-y-auto custom-scrollbar pr-2">
                    
                    {/* 0. Site Status (Maintenance) */}
                    <div className="bg-navy-900/30 p-5 rounded-xl border border-white/5">
                      <h3 className="text-sm font-bold text-gold-500 uppercase tracking-wider flex items-center gap-2 mb-4">
                        <Power size={14} /> حالة الموقع
                      </h3>
                      <div className="flex items-center justify-between bg-navy-950 p-4 rounded-xl border border-white/10">
                         <div>
                            <p className="text-white font-bold text-sm">وضع الصيانة</p>
                            <p className="text-gray-500 text-xs">عند التفعيل، لن يتمكن الزوار من تصفح الموقع</p>
                         </div>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={localSettings.maintenance_mode || false}
                                onChange={e => setLocalSettings({...localSettings, maintenance_mode: e.target.checked})}
                                className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                         </label>
                      </div>
                    </div>

                    {/* 1. General Info */}
                    <div className="bg-navy-900/30 p-5 rounded-xl border border-white/5">
                      <h3 className="text-sm font-bold text-gold-500 uppercase tracking-wider flex items-center gap-2 mb-4">
                        <FileText size={14} /> المعلومات الأساسية
                      </h3>
                      <div className="grid gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">اسم الموقع</label>
                            <input 
                            type="text" 
                            value={localSettings.site_name}
                            onChange={e => setLocalSettings({...localSettings, site_name: e.target.value})}
                            className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 focus:border-gold-500 outline-none text-white transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">رابط الشعار (Logo URL)</label>
                            <input 
                            type="text" 
                            dir="ltr"
                            value={localSettings.logo_url || ''}
                            onChange={e => setLocalSettings({...localSettings, logo_url: e.target.value})}
                            className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 focus:border-gold-500 outline-none text-white transition-colors text-left"
                            placeholder="https://example.com/logo.png"
                            />
                        </div>
                      </div>
                    </div>

                    {/* 2. Hero Section */}
                    <div className="bg-navy-900/30 p-5 rounded-xl border border-white/5">
                      <h3 className="text-sm font-bold text-gold-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Type size={14} /> نصوص الصفحة الرئيسية (Hero)
                      </h3>
                      <div className="grid grid-cols-1 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-300 mb-2">العنوان الرئيسي - السطر الأول</label>
                          <input 
                            type="text" 
                            value={localSettings.hero_title_line1 || ''}
                            onChange={e => setLocalSettings({...localSettings, hero_title_line1: e.target.value})}
                            className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 focus:border-gold-500 outline-none text-white transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-300 mb-2">العنوان الرئيسي - السطر الثاني (باللون الذهبي)</label>
                          <input 
                            type="text" 
                            value={localSettings.hero_title_line2 || ''}
                            onChange={e => setLocalSettings({...localSettings, hero_title_line2: e.target.value})}
                            className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 focus:border-gold-500 outline-none text-white transition-colors"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2">الوصف التفصيلي</label>
                        <textarea 
                          value={localSettings.hero_desc}
                          onChange={e => setLocalSettings({...localSettings, hero_desc: e.target.value})}
                          className="w-full bg-navy-950 border border-white/10 rounded-xl p-4 focus:border-gold-500 outline-none h-24 text-white transition-colors leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* 3. About Us Section */}
                    <div className="bg-navy-900/30 p-5 rounded-xl border border-white/5">
                      <h3 className="text-sm font-bold text-gold-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <BookOpen size={14} /> قسم من نحن
                      </h3>
                      <div className="grid gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">عنوان القسم</label>
                            <input 
                            type="text" 
                            value={localSettings.about_title || ''}
                            onChange={e => setLocalSettings({...localSettings, about_title: e.target.value})}
                            className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 focus:border-gold-500 outline-none text-white transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">وصف من نحن</label>
                            <textarea 
                            value={localSettings.about_desc || ''}
                            onChange={e => setLocalSettings({...localSettings, about_desc: e.target.value})}
                            className="w-full bg-navy-950 border border-white/10 rounded-xl p-4 focus:border-gold-500 outline-none h-24 text-white transition-colors leading-relaxed"
                            />
                        </div>
                      </div>
                    </div>

                    {/* 4. Contact Us Section (NEW) */}
                    <div className="bg-navy-900/30 p-5 rounded-xl border border-white/5">
                      <h3 className="text-sm font-bold text-gold-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <MessageCircle size={14} /> قسم تواصل معنا
                      </h3>
                      <div className="grid gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">عنوان صفحة التواصل</label>
                            <input 
                            type="text" 
                            value={localSettings.contact_title || ''}
                            onChange={e => setLocalSettings({...localSettings, contact_title: e.target.value})}
                            className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 focus:border-gold-500 outline-none text-white transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">وصف صفحة التواصل</label>
                            <textarea 
                            value={localSettings.contact_desc || ''}
                            onChange={e => setLocalSettings({...localSettings, contact_desc: e.target.value})}
                            className="w-full bg-navy-950 border border-white/10 rounded-xl p-4 focus:border-gold-500 outline-none h-24 text-white transition-colors leading-relaxed"
                            />
                        </div>
                      </div>
                    </div>

                    {/* 5. Features Section (Why Choose Us) */}
                    <div className="bg-navy-900/30 p-5 rounded-xl border border-white/5">
                      <h3 className="text-sm font-bold text-gold-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Star size={14} /> ميزات الموقع (لماذا تختارنا)
                      </h3>
                      <div className="space-y-6">
                        {localSettings.home_features?.map((feature, index) => (
                          <div key={index} className="p-4 bg-navy-950 rounded-xl border border-white/5">
                            <h4 className="text-xs font-bold text-gray-500 mb-3">الميزة رقم {index + 1}</h4>
                            <div className="grid gap-3">
                              <input 
                                type="text" 
                                value={feature.title}
                                onChange={e => handleFeatureChange(index, 'title', e.target.value)}
                                className="w-full bg-navy-900 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-gold-500 outline-none"
                                placeholder="عنوان الميزة"
                              />
                              <textarea 
                                value={feature.description}
                                onChange={e => handleFeatureChange(index, 'description', e.target.value)}
                                className="w-full bg-navy-900 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-gold-500 outline-none h-16"
                                placeholder="وصف الميزة"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 6. Stats & Socials */}
                    <div className="bg-navy-900/30 p-5 rounded-xl border border-white/5">
                      <h3 className="text-sm font-bold text-gold-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <BarChart3 size={14} /> الإحصائيات والروابط
                      </h3>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-sm font-bold text-gray-300 mb-2">عدد الطلاب</label>
                          <input 
                            type="text" 
                            value={localSettings.stats?.students || ''}
                            onChange={e => setLocalSettings({
                              ...localSettings, 
                              stats: { ...localSettings.stats, students: e.target.value }
                            })}
                            className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 focus:border-gold-500 outline-none text-white transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-300 mb-2">عدد الساعات</label>
                          <input 
                            type="text" 
                            value={localSettings.stats?.hours || ''}
                            onChange={e => setLocalSettings({
                              ...localSettings, 
                              stats: { ...localSettings.stats, hours: e.target.value }
                            })}
                            className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 focus:border-gold-500 outline-none text-white transition-colors"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4 border-t border-white/5 pt-4">
                        <div>
                          <label className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-2">
                            <Facebook size={16} className="text-blue-500" /> فيسبوك
                          </label>
                          <input 
                            type="text"
                            dir="ltr"
                            value={localSettings.social_links?.facebook || ''}
                            onChange={e => setLocalSettings({
                              ...localSettings, 
                              social_links: { ...localSettings.social_links, facebook: e.target.value }
                            })}
                            className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 focus:border-gold-500 outline-none text-white transition-colors text-left"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-2">
                            <Instagram size={16} className="text-pink-500" /> انستجرام
                          </label>
                          <input 
                            type="text"
                            dir="ltr"
                            value={localSettings.social_links?.instagram || ''}
                            onChange={e => setLocalSettings({
                              ...localSettings, 
                              social_links: { ...localSettings.social_links, instagram: e.target.value }
                            })}
                            className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 focus:border-gold-500 outline-none text-white transition-colors text-left"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-2">
                            <Send size={16} className="text-blue-400" /> تليجرام
                          </label>
                          <input 
                            type="text"
                            dir="ltr"
                            value={localSettings.social_links?.telegram || ''}
                            onChange={e => setLocalSettings({
                              ...localSettings, 
                              social_links: { ...localSettings.social_links, telegram: e.target.value }
                            })}
                            className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 focus:border-gold-500 outline-none text-white transition-colors text-left"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 pb-8 sticky bottom-0 bg-navy-950/95 backdrop-blur-sm p-4 border-t border-white/10">
                      <button onClick={handleSaveSettings} className="bg-gold-500 text-navy-950 px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/20 w-full justify-center text-lg">
                        <Save size={20} /> حفظ كافة التغييرات
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Modals remain unchanged */}
        {enrollModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fade-in">
            <div className="glass-card p-8 max-w-md w-full border-gold-500/30 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-2">إضافة طالب للكورس المدفوع</h3>
              <p className="text-gray-400 text-sm mb-6">سيتم منح الطالب صلاحية الوصول الكاملة لهذا الكورس.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">البريد الإلكتروني للطالب</label>
                  <input 
                    type="email" 
                    placeholder="student@example.com"
                    value={enrollEmail}
                    onChange={e => setEnrollEmail(e.target.value)}
                    className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 text-white focus:border-gold-500 outline-none transition-colors"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={handleAddEnrollment} className="flex-1 bg-gold-500 text-navy-950 py-3 rounded-xl font-bold hover:bg-gold-400 transition-colors">إضافة الصلاحية</button>
                  <button onClick={() => setEnrollModalOpen(false)} className="flex-1 bg-white/5 text-white py-3 rounded-xl font-bold hover:bg-white/10 transition-colors border border-white/10">إلغاء</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {courseModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fade-in">
            <div className="glass-card p-8 max-w-2xl w-full border-gold-500/30 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-2xl font-bold text-white">{editingCourse.id ? 'تعديل الكورس' : 'إضافة كورس جديد'}</h3>
                 <button onClick={() => setCourseModalOpen(false)} className="text-gray-400 hover:text-white"><X /></button>
              </div>
              
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">عنوان الكورس</label>
                        <input 
                            type="text" 
                            value={editingCourse.title || ''}
                            onChange={e => setEditingCourse({...editingCourse, title: e.target.value})}
                            className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 text-white focus:border-gold-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">المستوى</label>
                        <select 
                            value={editingCourse.level || 'متوسط'}
                            onChange={e => setEditingCourse({...editingCourse, level: e.target.value as any})}
                            className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 text-white focus:border-gold-500 outline-none"
                        >
                            <option value="مبتدئ">مبتدئ</option>
                            <option value="متوسط">متوسط</option>
                            <option value="خبير">خبير</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1">الوصف</label>
                    <textarea 
                        value={editingCourse.description || ''}
                        onChange={e => setEditingCourse({...editingCourse, description: e.target.value})}
                        className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 text-white focus:border-gold-500 outline-none h-24"
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1">رابط الصورة المصغرة (Thumbnail URL)</label>
                    <input 
                        type="text" 
                        dir="ltr"
                        value={editingCourse.thumbnail || ''}
                        onChange={e => setEditingCourse({...editingCourse, thumbnail: e.target.value})}
                        className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 text-white focus:border-gold-500 outline-none text-left"
                        placeholder="https://..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 bg-navy-950 p-3 rounded-xl border border-white/10">
                        <input 
                            type="checkbox" 
                            checked={editingCourse.is_paid || false}
                            onChange={e => setEditingCourse({...editingCourse, is_paid: e.target.checked})}
                            className="w-5 h-5 accent-gold-500"
                        />
                        <label className="text-sm text-white font-bold">كورس مدفوع (Premium)</label>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">المدة (نص)</label>
                        <input 
                            type="text" 
                            value={editingCourse.duration || ''}
                            onChange={e => setEditingCourse({...editingCourse, duration: e.target.value})}
                            className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 text-white focus:border-gold-500 outline-none"
                            placeholder="مثال: 15 ساعة"
                        />
                    </div>
                </div>

                <div className="pt-4">
                  <button onClick={handleSaveCourse} className="w-full bg-gold-500 text-navy-950 py-3 rounded-xl font-bold hover:bg-gold-400 transition-colors shadow-lg">
                    {editingCourse.id ? 'حفظ التعديلات' : 'إنشاء الكورس'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {lessonsModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fade-in">
            <div className="glass-card p-6 max-w-4xl w-full border-gold-500/30 shadow-2xl h-[85vh] flex flex-col">
              <div className="flex justify-between items-center mb-6 shrink-0">
                 <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Video className="text-gold-500" /> إدارة الدروس
                 </h3>
                 <button onClick={() => setLessonsModalOpen(false)} className="text-gray-400 hover:text-white"><X /></button>
              </div>

              <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
                 <div className="lg:w-1/3 bg-navy-900/50 p-5 rounded-xl border border-white/5 shrink-0 overflow-y-auto">
                    <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">إضافة درس جديد</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-400">عنوان الدرس</label>
                            <input 
                                type="text" 
                                value={newLesson.title}
                                onChange={e => setNewLesson({...newLesson, title: e.target.value})}
                                className="w-full bg-navy-950 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-gold-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400">رابط الفيديو (YouTube/MP4)</label>
                            <input 
                                type="text" 
                                dir="ltr"
                                value={newLesson.video_url}
                                onChange={e => setNewLesson({...newLesson, video_url: e.target.value})}
                                className="w-full bg-navy-950 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-gold-500 outline-none text-left"
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-xs text-gray-400">المدة</label>
                                <input 
                                    type="text" 
                                    value={newLesson.duration}
                                    onChange={e => setNewLesson({...newLesson, duration: e.target.value})}
                                    className="w-full bg-navy-950 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-gold-500 outline-none"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-gray-400">الترتيب</label>
                                <input 
                                    type="number" 
                                    value={newLesson.order}
                                    onChange={e => setNewLesson({...newLesson, order: parseInt(e.target.value)})}
                                    className="w-full bg-navy-950 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-gold-500 outline-none"
                                />
                            </div>
                        </div>
                        <button onClick={handleAddLesson} className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-500 transition-colors text-sm mt-2">
                            إضافة الدرس
                        </button>
                    </div>
                 </div>

                 <div className="lg:w-2/3 bg-navy-950 rounded-xl border border-white/5 overflow-hidden flex flex-col">
                    <div className="p-4 bg-navy-900 border-b border-white/5">
                        <h4 className="font-bold text-white text-sm">قائمة الدروس ({currentCourseLessons.length})</h4>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {currentCourseLessons.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-500 text-sm">لا توجد دروس مضافة بعد</div>
                        ) : (
                            currentCourseLessons.map((lesson) => (
                                <div key={lesson.id} className="flex items-center gap-3 p-3 bg-navy-900/50 rounded-lg border border-white/5 hover:border-gold-500/20 transition-colors group">
                                    <div className="text-gray-500 font-mono text-xs w-6 text-center">{lesson.order}</div>
                                    <div className="w-10 h-10 bg-black rounded flex items-center justify-center shrink-0">
                                        <PlayCircle size={20} className="text-gray-600 group-hover:text-gold-500 transition-colors" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="text-white font-bold text-sm truncate">{lesson.title}</h5>
                                        <p className="text-gray-500 text-xs truncate dir-ltr text-right">{lesson.video_url}</p>
                                    </div>
                                    <div className="text-gray-500 text-xs bg-navy-950 px-2 py-1 rounded">{lesson.duration}</div>
                                    <button onClick={() => handleDeleteLesson(lesson.id!)} className="text-red-400 p-2 hover:bg-red-500/10 rounded"><Trash2 size={14} /></button>
                                </div>
                            ))
                        )}
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
