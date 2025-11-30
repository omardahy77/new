import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { User, Course, SiteSettings, Enrollment, LessonProgress } from '../types';
import { StoreContext } from './StoreContext';

// Default Settings
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
  content_config: {
    hero_title_line1: "تداول بذكاء",
    hero_title_line1_en: "Trade Smart",
    hero_title_line2: "بدقة القناص",
    hero_title_line2_en: "With Sniper Precision",
    hero_desc: "اكتشف أسرار صناعة السوق والمؤسسات المالية... نظام تعليمي متكامل ومحمي يأخذك من الصفر إلى الاحتراف.",
    hero_desc_en: "Discover the secrets of market making... A complete, secure LMS taking you from zero to hero."
  }
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const isMasterAdmin = authUser?.email === 'admin@sniperfx.com';

      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      // Fallback for master admin if profile is missing or incorrect
      if (isMasterAdmin) {
          if (!data) {
              data = { id: userId, email: 'admin@sniperfx.com', role: 'admin', status: 'active', full_name: 'System Admin' };
          } else {
              // Enforce admin role for master email in memory
              if (data.role !== 'admin' || data.status !== 'active') {
                  data.role = 'admin';
                  data.status = 'active';
              }
          }
      }

      if (data) {
        setUser(data as User);
        // Fetch enrollments in parallel or after
        const { data: enrollData } = await supabase.from('enrollments').select('*').eq('user_id', userId);
        if (enrollData) setEnrollments(enrollData as Enrollment[]);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setUser(null);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (!error && data) setCourses(data as Course[]);
    } catch (e) {
      console.error("Courses fetch error:", e);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (!data) {
        setSiteSettings(defaultSettings);
      } else {
        setSiteSettings({
          ...defaultSettings,
          ...data,
          social_links: { ...defaultSettings.social_links, ...(data.social_links || {}) },
          stats: { ...defaultSettings.stats, ...(data.stats || {}) },
          features_config: { ...defaultSettings.features_config, ...(data.features_config || {}) },
          content_config: { ...defaultSettings.content_config, ...(data.content_config || {}) },
          home_features: data.home_features || defaultSettings.home_features
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
    const { data } = await supabase.from('lesson_progress').select('*').eq('user_id', user.id).eq('lesson_id', lessonId).single();
    return data as LessonProgress;
  };

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    try {
        const { data: existing } = await supabase
            .from('site_settings')
            .select('id')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        
        const targetId = existing?.id;
        const mergedSettings = { ...siteSettings, ...newSettings };
        
        // Ensure content_config is never null/undefined to prevent DB errors
        const safeContentConfig = mergedSettings.content_config || defaultSettings.content_config || {};

        const payload = {
            site_name: mergedSettings.site_name,
            site_name_en: mergedSettings.site_name_en,
            logo_url: mergedSettings.logo_url,
            maintenance_mode: mergedSettings.maintenance_mode,
            social_links: mergedSettings.social_links,
            stats: mergedSettings.stats,
            home_features: mergedSettings.home_features,
            features_config: mergedSettings.features_config,
            content_config: safeContentConfig,
            hero_title: mergedSettings.hero_title,
            hero_desc: mergedSettings.hero_desc
        };
        
        let result;

        if (targetId) {
            result = await supabase.from('site_settings').update(payload).eq('id', targetId).select().single();
        } else {
            result = await supabase.from('site_settings').insert([payload]).select().single();
        }

        if (result.error) throw result.error;
        
        if (result.data) {
            setSiteSettings(prev => ({
                ...prev,
                ...result.data,
                social_links: { ...prev.social_links, ...(result.data.social_links || {}) },
                features_config: { ...prev.features_config, ...(result.data.features_config || {}) },
                content_config: { ...prev.content_config, ...(result.data.content_config || {}) },
                home_features: result.data.home_features || prev.home_features
            }));
        }
    } catch (error) {
        console.error("Error updating settings:", error);
        throw error;
    }
  };

  const checkAccess = (course: Course) => {
    if (user?.role === 'admin') return true;
    if (!course.is_paid) return true; 
    if (!user) return false;
    if (user.status !== 'active') return false;
    return enrollments.some(e => e.course_id === course.id);
  };

  const signOut = async () => {
    setUser(null);
    setEnrollments([]);
    await supabase.auth.signOut();
  };

  // --- INITIALIZATION LOGIC ---
  useEffect(() => {
    let mounted = true;

    const initializeApp = async () => {
        // 1. Fetch Global Data
        await Promise.all([fetchCourses(), fetchSettings()]);

        // 2. Check Session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            await fetchProfile(session.user.id);
        }
        
        if (mounted) setLoading(false);
    };

    initializeApp();

    // 3. Listen for Auth Changes (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        // CRITICAL FIX: Set loading true immediately to prevent UI flash/redirects
        setLoading(true);
        if (session?.user) {
            await fetchProfile(session.user.id);
        }
        if (mounted) setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setEnrollments([]);
        setLoading(false);
      }
    });

    const settingsChannel = supabase.channel('public:site_settings')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, (payload) => {
            if (payload.new) {
                const newData = payload.new as SiteSettings;
                setSiteSettings(prev => ({
                    ...defaultSettings,
                    ...newData,
                    social_links: { ...defaultSettings.social_links, ...(newData.social_links || {}) },
                    stats: { ...defaultSettings.stats, ...(newData.stats || {}) },
                    features_config: { ...defaultSettings.features_config, ...(newData.features_config || {}) },
                    content_config: { ...defaultSettings.content_config, ...(newData.content_config || {}) },
                    home_features: newData.home_features || defaultSettings.home_features
                }));
            }
        })
        .subscribe();

    return () => {
        mounted = false;
        subscription.unsubscribe();
        supabase.removeChannel(settingsChannel);
    };
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user, loading, courses, enrollments, siteSettings, 
    refreshCourses: fetchCourses, refreshEnrollments, updateSettings, 
    signOut, checkAccess, saveLessonProgress, getLessonProgress 
  }), [user, loading, courses, enrollments, siteSettings]);

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};
