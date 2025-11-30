import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Course, SiteSettings, Enrollment, LessonProgress } from '../types';

interface StoreContextType {
  user: User | null;
  loading: boolean;
  courses: Course[];
  enrollments: Enrollment[];
  siteSettings: SiteSettings;
  refreshCourses: () => Promise<void>;
  refreshEnrollments: () => Promise<void>;
  updateSettings: (settings: Partial<SiteSettings>) => Promise<void>;
  signOut: () => Promise<void>;
  checkAccess: (course: Course) => boolean;
  saveLessonProgress: (lessonId: string, position: number, duration: number, isCompleted: boolean) => Promise<void>;
  getLessonProgress: (lessonId: string) => Promise<LessonProgress | null>;
}

// Default Settings - FULL ARABIC DEFAULTS
const defaultSettings: SiteSettings = {
  site_name: "Sniper FX Gold",
  site_name_en: "Sniper FX Gold",
  hero_title: "تداول بذكاء بدقة القناص",
  hero_title_en: "Trade Smart with Sniper Precision",
  hero_title_line1: "تداول بذكاء",
  hero_title_line1_en: "Trade Smart",
  hero_title_line2: "بدقة القناص",
  hero_title_line2_en: "With Sniper Precision",
  hero_desc: "اكتشف أسرار صناعة السوق والمؤسسات المالية... نظام تعليمي متكامل ومحمي يأخذك من الصفر إلى الاحتراف.",
  hero_desc_en: "Discover the secrets of market making... A complete, secure LMS taking you from zero to hero.",
  logo_url: "https://i.postimg.cc/Bb0PZ00P/tsmym-bdwn-wnwan-2.png",
  maintenance_mode: false,
  stats: { students: "+1500", hours: "+50" },
  social_links: { 
    telegram: "https://t.me", 
    instagram: "https://instagram.com", 
    youtube: "",
    facebook: "https://facebook.com",
    tiktok: "",
    whatsapp: ""
  },
  home_features: [
    { title: "تحليل فني متقدم", description: "تعلم استراتيجيات التحليل الفني التي تستخدمها البنوك الكبرى.", icon: "LineChart" },
    { title: "إدارة مخاطر صارمة", description: "كيف تحمي رأس مالك وتضاعف أرباحك بأقل مخاطرة ممكنة.", icon: "Shield" },
    { title: "سيكولوجية التداول", description: "التحكم في المشاعر والانضباط هو مفتاح النجاح في الأسواق.", icon: "Brain" },
    { title: "مجتمع حصري", description: "تواصل مع نخبة المتداولين وتبادل الخبرات والفرص يومياً.", icon: "Users" }
  ],
  features_config: { 
    show_coming_soon: true, 
    show_stats: true, 
    allow_registration: true,
    social_facebook_visible: true,
    social_instagram_visible: true,
    social_telegram_visible: true,
    social_youtube_visible: true,
    social_tiktok_visible: true,
    social_whatsapp_visible: true
  },
  content_config: {}
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      // Robust Fallback: If profile is missing, create it immediately
      if (!data || error) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser && authUser.id === userId) {
           // CRITICAL: Ensure Admin gets Admin role even if profile was deleted
           const isMasterAdmin = authUser.email === 'admin@sniperfx.com';
           
           await supabase.from('profiles').upsert({
               id: authUser.id,
               email: authUser.email,
               role: isMasterAdmin ? 'admin' : 'student',
               status: isMasterAdmin ? 'active' : 'pending'
           }, { onConflict: 'id' });
           
           const { data: retry } = await supabase.from('profiles').select('*').eq('id', userId).single();
           data = retry;
        }
      }

      if (data) {
        setUser(data as User);
        const { data: enrollData } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', userId);
        if (enrollData) setEnrollments(enrollData as Enrollment[]);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setUser(null);
    }
  };

  const fetchCourses = async () => {
    try {
      // Public query - relies on RLS being open for anon
      const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (!error && data) setCourses(data as Course[]);
    } catch (e) {
      console.error("Courses fetch error:", e);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('site_settings').select('*').single();
      
      if (error && (error.code === 'PGRST116' || error.message.includes('Results contain 0 rows'))) {
        const { data: newData } = await supabase
            .from('site_settings')
            .insert([{
                ...defaultSettings,
                social_links: defaultSettings.social_links,
                stats: defaultSettings.stats,
                features_config: defaultSettings.features_config,
                content_config: defaultSettings.content_config
            }])
            .select()
            .single();
            
        if (newData) {
             setSiteSettings({ ...defaultSettings, ...newData });
        }
      } else if (data) {
        setSiteSettings({
          ...defaultSettings,
          ...data,
          social_links: { ...defaultSettings.social_links, ...(data.social_links || {}) },
          stats: { ...defaultSettings.stats, ...(data.stats || {}) },
          features_config: { ...defaultSettings.features_config, ...(data.features_config || {}) },
          content_config: { ...defaultSettings.content_config, ...(data.content_config || {}) }
        });
      }
    } catch (e) {
      console.error("Settings fetch error:", e);
    }
  };

  const refreshEnrollments = async () => {
    if (user) {
      const { data } = await supabase.from('enrollments').select('*').eq('user_id', user.id);
      if (data) setEnrollments(data as Enrollment[]);
    }
  };

  const saveLessonProgress = async (lessonId: string, position: number, duration: number, isCompleted: boolean) => {
    if (!user) return;
    await supabase.from('lesson_progress').upsert({
      user_id: user.id,
      lesson_id: lessonId,
      position,
      duration,
      is_completed: isCompleted,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,lesson_id' });
  };

  const getLessonProgress = async (lessonId: string): Promise<LessonProgress | null> => {
    if (!user) return null;
    const { data } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .single();
    return data as LessonProgress;
  };

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    try {
        if (siteSettings.id) {
            const merged = { ...siteSettings, ...newSettings };
            const { error } = await supabase.from('site_settings').update(merged).eq('id', siteSettings.id);
            if (error) throw error;
            setSiteSettings(merged);
        }
    } catch (error) {
        console.error("Error updating settings:", error);
        throw error;
    }
  };

  const checkAccess = (course: Course) => {
    if (user?.role === 'admin') return true;
    if (!course.is_paid) return true; // Free courses accessible to everyone (even visitors now, if we want)
    
    if (!user) return false; // Visitors cannot access paid
    if (user.status !== 'active') return false; // Pending users cannot access paid
    
    return enrollments.some(e => e.course_id === course.id);
  };

  const signOut = async () => {
    setUser(null);
    setEnrollments([]);
    await supabase.auth.signOut();
  };

  useEffect(() => {
    fetchCourses();
    fetchSettings();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setEnrollments([]);
      }
      setLoading(false);
    });

    const settingsChannel = supabase.channel('public:site_settings')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_settings' }, (payload) => {
            const newData = payload.new as SiteSettings;
            setSiteSettings(prev => ({
                ...defaultSettings,
                ...newData,
                social_links: { ...defaultSettings.social_links, ...(newData.social_links || {}) },
                stats: { ...defaultSettings.stats, ...(newData.stats || {}) },
                features_config: { ...defaultSettings.features_config, ...(newData.features_config || {}) },
                content_config: { ...defaultSettings.content_config, ...(newData.content_config || {}) }
            }));
        })
        .subscribe();

    return () => {
        subscription.unsubscribe();
        supabase.removeChannel(settingsChannel);
    };
  }, []);

  return (
    <StoreContext.Provider value={{ 
      user, loading, courses, enrollments, siteSettings, 
      refreshCourses: fetchCourses, refreshEnrollments, updateSettings, 
      signOut, checkAccess, saveLessonProgress, getLessonProgress 
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
