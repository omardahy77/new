import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User, Course, SiteSettings, Enrollment, LessonProgress } from '../types';
import { StoreContext } from './StoreContext';

// VERSION CONTROL: FRESH START V11 (Turbo Cache)
const APP_VERSION = '11.0.0-TURBO'; 

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
  allow_registration: true,
  social_links: {},
  features_config: { show_coming_soon: true, show_stats: true, allow_registration: true },
  content_config: {},
  stats: { students: "+1500", hours: "+50" }
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);

  // --- CACHE HELPERS ---
  const loadFromCache = () => {
    try {
      const cachedSettings = localStorage.getItem('sniper_settings_cache');
      const cachedCourses = localStorage.getItem('sniper_courses_cache');
      const cachedProfile = localStorage.getItem('sniper_profile_cache');
      
      let hasCache = false;

      if (cachedSettings) {
        setSiteSettings(JSON.parse(cachedSettings));
        hasCache = true;
      }
      
      if (cachedCourses) {
        setCourses(JSON.parse(cachedCourses));
        hasCache = true;
      }

      if (cachedProfile) {
        setUser(JSON.parse(cachedProfile));
        hasCache = true;
      }

      // If we have cache, we can stop the global loading spinner immediately
      // The fresh data will update in the background (Stale-While-Revalidate)
      if (hasCache) {
        setLoading(false);
        setCoursesLoading(false);
      }
    } catch (e) {
      console.error("Cache load error", e);
    }
  };

  // Optimized Profile Fetch
  const fetchProfile = useCallback(async (userId: string, userEmail?: string) => {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      // SELF-HEALING: Only run if profile is strictly missing
      if (!data && userEmail) {
         const isMasterAdmin = userEmail === 'admin@sniperfx.com';
         const newProfile = {
             id: userId,
             email: userEmail,
             full_name: userEmail.split('@')[0] || 'User',
             role: isMasterAdmin ? 'admin' : 'student',
             status: isMasterAdmin ? 'active' : 'pending'
         };

         const { data: createdProfile } = await supabase.from('profiles').insert([newProfile]).select().single();
         if (createdProfile) data = createdProfile;
      }

      if (data) {
        setUser(data as User);
        localStorage.setItem('sniper_profile_cache', JSON.stringify(data)); // Cache Profile

        // Fetch enrollments
        const { data: enrollData } = await supabase.from('enrollments').select('*').eq('user_id', userId);
        if (enrollData) setEnrollments(enrollData as Enrollment[]);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
          await fetchProfile(data.user.id, data.user.email);
          return user; 
      }
      return null;
    } catch (err: any) {
      throw err;
    }
  };

  const fetchCourses = useCallback(async () => {
    // Only show loading if we don't have courses yet
    if (courses.length === 0) setCoursesLoading(true);
    
    try {
      const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        setCourses(data as Course[]);
        localStorage.setItem('sniper_courses_cache', JSON.stringify(data)); // Cache Courses
      }
    } catch (e) {
      console.error("Courses fetch error:", e);
    } finally {
      setCoursesLoading(false);
    }
  }, [courses.length]);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) {
        const mergedSettings = {
          ...defaultSettings,
          ...data,
          social_links: { ...defaultSettings.social_links, ...(data.social_links || {}) },
          features_config: { ...defaultSettings.features_config, ...(data.features_config || {}) },
          content_config: { ...defaultSettings.content_config, ...(data.content_config || {}) },
          home_features: data.home_features || defaultSettings.home_features,
          stats: { ...defaultSettings.stats, ...(data.stats || {}) }
        };
        
        setSiteSettings(mergedSettings);
        localStorage.setItem('sniper_settings_cache', JSON.stringify(mergedSettings)); // Cache Settings
      }
    } catch (e) {
      console.error("Settings fetch error:", e);
    }
  }, []);

  const refreshEnrollments = async () => {
    if (user) {
      const { data } = await supabase.from('enrollments').select('*').eq('user_id', user.id);
      if (data) setEnrollments(data as Enrollment[]);
    }
  };

  const saveLessonProgress = async (lessonId: string, position: number, duration: number, isCompleted: boolean) => {
    if (!user) return;
    try {
      await supabase.from('lesson_progress').upsert({
        user_id: user.id,
        lesson_id: lessonId,
        position,
        duration,
        is_completed: isCompleted,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,lesson_id' });
    } catch (e) {
      // Silent fail
    }
  };

  const getLessonProgress = async (lessonId: string): Promise<LessonProgress | null> => {
    if (!user) return null;
    try {
      const { data } = await supabase.from('lesson_progress').select('*').eq('user_id', user.id).eq('lesson_id', lessonId).single();
      return data as LessonProgress;
    } catch {
      return null;
    }
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
            const updated = {
                ...siteSettings,
                ...result.data,
                social_links: { ...siteSettings.social_links, ...(result.data.social_links || {}) },
                features_config: { ...siteSettings.features_config, ...(result.data.features_config || {}) },
                content_config: { ...siteSettings.content_config, ...(result.data.content_config || {}) },
                stats: { ...siteSettings.stats, ...(result.data.stats || {}) }
            };
            setSiteSettings(updated);
            localStorage.setItem('sniper_settings_cache', JSON.stringify(updated));
        }
    } catch (error) {
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
        localStorage.removeItem('sniper_profile_cache'); // Clear profile cache
        await supabase.auth.signOut();
    } catch (e) {
        console.error("Sign out error:", e);
    }
  };

  // INITIALIZATION LOGIC
  useEffect(() => {
    // 0. Version Check (Clear cache if version mismatch)
    const currentVersion = localStorage.getItem('app_version');
    if (currentVersion !== APP_VERSION) {
        localStorage.clear(); // Wipe old cache
        localStorage.setItem('app_version', APP_VERSION);
    }

    // 1. Load from Cache IMMEDIATELY
    loadFromCache();
    
    let mounted = true;
    
    // 2. Fetch Fresh Data (Background)
    const initializeApp = async () => {
        try {
            await Promise.all([fetchCourses(), fetchSettings()]);
            
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await fetchProfile(session.user.id, session.user.email);
            }
        } catch (e) {
            console.error("Init Error:", e);
        } finally {
            if (mounted) setLoading(false);
        }
    };
    
    initializeApp();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
          if (!user || user.id !== session.user.id) {
             await fetchProfile(session.user.id, session.user.email);
          }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setEnrollments([]);
        localStorage.removeItem('sniper_profile_cache');
      }
    });
    
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const value = useMemo(() => ({
    user, loading, courses, enrollments, siteSettings, 
    refreshCourses: fetchCourses, refreshEnrollments, updateSettings, 
    login, signOut, checkAccess, saveLessonProgress, getLessonProgress,
    coursesLoading,
    refreshData: () => { fetchCourses(); fetchSettings(); }
  }), [user, loading, courses, enrollments, siteSettings, coursesLoading, fetchCourses, fetchSettings]);

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};
