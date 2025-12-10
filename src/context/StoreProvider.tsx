import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { User, Course, SiteSettings, Enrollment, LessonProgress } from '../types';
import { StoreContext } from './StoreContext';
import { translations } from '../utils/translations';

// VERSION CONTROL: Bumped to PLATINUM to force fresh cache and logic
const APP_VERSION = '3.0.0-PLATINUM'; 

// Default Settings (Preserved)
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
    twitter: "",
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
    social_twitter_visible: true,
    social_whatsapp_visible: true
  },
  content_config: {
    hero_title_line1: translations.ar.hero_line1_default,
    hero_title_line1_en: translations.en.hero_line1_default,
    hero_title_line2: translations.ar.hero_line2_default,
    hero_title_line2_en: translations.en.hero_line2_default,
    hero_desc: translations.ar.hero_desc_default,
    hero_desc_en: translations.en.hero_desc_default,
    
    why_choose_us_title: translations.ar.why_choose_us_title_default,
    why_choose_us_title_en: translations.en.why_choose_us_title_default,
    why_choose_us_desc: translations.ar.why_choose_us_desc_default,
    why_choose_us_desc_en: translations.en.why_choose_us_desc_default,
    
    cta_title: translations.ar.cta_title_default,
    cta_title_en: translations.en.cta_title_default,
    cta_desc: translations.ar.cta_desc_default,
    cta_desc_en: translations.en.cta_desc_default,
    
    coming_soon_title: translations.ar.coming_soon_title_default,
    coming_soon_title_en: translations.en.coming_soon_title_default,
    coming_soon_desc: translations.ar.coming_soon_desc_default,
    coming_soon_desc_en: translations.en.coming_soon_desc_default,
    coming_soon_badge: translations.ar.coming_soon_badge_default,
    coming_soon_badge_en: translations.en.coming_soon_badge_default,
    coming_soon_feature_1: "محتوى حصري",
    coming_soon_feature_1_en: "Exclusive Content",
    coming_soon_feature_2: "استراتيجيات متقدمة",
    coming_soon_feature_2_en: "Advanced Strategies",

    about_main_title: translations.ar.about_main_title_default,
    about_main_title_en: translations.en.about_main_title_default,
    about_main_desc: translations.ar.about_main_desc_default,
    about_main_desc_en: translations.en.about_main_desc_default,
    
    mission_title: translations.ar.mission_title_default,
    mission_title_en: translations.en.mission_title_default,
    mission_desc: translations.ar.mission_desc_default,
    mission_desc_en: translations.en.mission_desc_default,
    
    vision_title: translations.ar.vision_title_default,
    vision_title_en: translations.en.vision_title_default,
    vision_desc: translations.ar.vision_desc_default,
    vision_desc_en: translations.en.vision_desc_default,
    
    contact_main_title: translations.ar.contact_main_title_default,
    contact_main_title_en: translations.en.contact_main_title_default,
    contact_main_desc: translations.ar.contact_main_desc_default,
    contact_main_desc_en: translations.en.contact_main_desc_default,
    
    footer_tagline: translations.ar.platform_tagline,
    footer_tagline_en: translations.en.platform_tagline,
    footer_sub_tagline: "تعليم حقيقي. نتائج حقيقية.",
    footer_sub_tagline_en: "Real Education. Real Results."
  }
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);

  // --- ROBUST PROFILE FETCHING & SELF-HEALING ---
  const fetchProfile = async (userId: string, userEmail?: string) => {
    try {
      // 1. Try to fetch profile from DB
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      // 2. SELF-HEALING: If profile is missing, CREATE IT IMMEDIATELY
      if (!data && userEmail) {
         const isMasterAdmin = userEmail === 'admin@sniperfx.com';
         
         const newProfile = {
             id: userId,
             email: userEmail,
             full_name: userEmail.split('@')[0] || 'User',
             role: isMasterAdmin ? 'admin' : 'student',
             status: 'active'
         };

         // Try INSERT
         const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();
            
         if (createError) {
             // FALLBACK: Use memory-only profile
             data = newProfile as any;
         } else {
             data = createdProfile;
         }
      }

      // 3. MASTER ADMIN OVERRIDE (Memory Level Safety)
      if (userEmail === 'admin@sniperfx.com' && data) {
          if (data.role !== 'admin') {
              data.role = 'admin';
              data.status = 'active';
              // Try to fix DB in background
              supabase.from('profiles').update({ role: 'admin', status: 'active' }).eq('id', userId).then();
          }
      }

      if (data) {
        setUser(data as User);
        const { data: enrollData } = await supabase.from('enrollments').select('*').eq('user_id', userId);
        if (enrollData) setEnrollments(enrollData as Enrollment[]);
        return data as User;
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
    return null;
  };

  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      // 1. Attempt Supabase Login
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      // 2. ERROR HANDLING STRATEGY: "BYPASS IF SESSION EXISTS"
      if (error) {
        // If it's a 500 (DB Trigger) or ANY error, check if we actually got a session.
        // Supabase Auth service often issues the token even if the Postgres trigger fails.
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session?.user) {
           // SUCCESS! Ignore the error completely.
           return await fetchProfile(sessionData.session.user.id, sessionData.session.user.email);
        }
        
        // If no session, then it's a real error (wrong password, etc.)
        throw error;
      }
      
      if (data.user) {
          return await fetchProfile(data.user.id, data.user.email);
      }
      return null;
    } catch (err: any) {
      // 3. FINAL SAFETY NET
      // Before giving up, check session one last time.
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
          return await fetchProfile(sessionData.session.user.id, sessionData.session.user.email);
      }
      
      // If we are here, login TRULY failed.
      throw err;
    }
  };

  const fetchCourses = async () => {
    setCoursesLoading(true);
    try {
      const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (!error && data) setCourses(data as Course[]);
    } catch (e) {
      console.error("Courses fetch error:", e);
    } finally {
      setCoursesLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) {
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
        let targetId = siteSettings.id;

        if (!targetId) {
            const { data: existing } = await supabase
                .from('site_settings')
                .select('id')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            targetId = existing?.id;
        }
        
        const payload: any = { ...newSettings };
        delete payload.id;
        delete payload.created_at;

        let result;

        if (targetId) {
            result = await supabase.from('site_settings').update(payload).eq('id', targetId).select().single();
        } else {
            const fullPayload = { ...defaultSettings, ...payload };
            result = await supabase.from('site_settings').insert([fullPayload]).select().single();
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
    try {
        setUser(null);
        setEnrollments([]);
        await supabase.auth.signOut();
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-refresh-token');
    } catch (e) {
        console.error("Sign out error:", e);
    }
  };

  useEffect(() => {
    // --- CACHE CLEARING LOGIC ---
    const currentVersion = localStorage.getItem('app_version');
    if (currentVersion !== APP_VERSION) {
        console.log(`🚀 New version detected (${APP_VERSION}). Clearing stale cache...`);
        const sbKey = Object.keys(localStorage).find(key => key.startsWith('sb-'));
        const sbSession = sbKey ? localStorage.getItem(sbKey) : null;
        localStorage.clear();
        if (sbKey && sbSession) localStorage.setItem(sbKey, sbSession);
        localStorage.setItem('app_version', APP_VERSION);
    }
    
    let mounted = true;
    const initializeApp = async () => {
        try {
            fetchCourses(); 
            await fetchSettings();
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await fetchProfile(session.user.id, session.user.email);
            }
        } catch (e) {
            console.error("Initialization error:", e);
        } finally {
            if (mounted) setLoading(false);
        }
    };
    initializeApp();
    
    const safetyTimer = setTimeout(() => { 
        if (mounted && loading) setLoading(false); 
    }, 4000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user && !user) {
          await fetchProfile(session.user.id, session.user.email);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setEnrollments([]);
      }
    });
    return () => { mounted = false; clearTimeout(safetyTimer); subscription.unsubscribe(); };
  }, []);

  const value = useMemo(() => ({
    user, loading, courses, enrollments, siteSettings, 
    refreshCourses: fetchCourses, refreshEnrollments, updateSettings, 
    login, signOut, checkAccess, saveLessonProgress, getLessonProgress,
    coursesLoading
  }), [user, loading, courses, enrollments, siteSettings, coursesLoading]);

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};
