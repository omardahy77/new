import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User, Course, SiteSettings, Enrollment, LessonProgress } from '../types';
import { StoreContext } from './StoreContext';
import { DEFAULT_COURSES } from '../constants';

// VERSION CONTROL: INSTANT LOAD V14.2 (FAIL-SAFE)
const APP_VERSION = '14.2.0-FAIL-SAFE'; 

// Default Settings
const defaultSettings: SiteSettings = {
  site_name: "Sniper FX Gold",
  site_name_en: "Sniper FX Gold",
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
  const [user, setUser] = useState<User | null>(() => {
    try {
        const cached = localStorage.getItem('sniper_profile_cache');
        return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
        const cached = localStorage.getItem('sniper_courses_cache');
        if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.length > 0) return parsed;
        }
    } catch(e) {}
    return DEFAULT_COURSES; 
  });

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
      try {
          const cached = localStorage.getItem('sniper_settings_cache');
          return cached ? JSON.parse(cached) : defaultSettings;
      } catch { return defaultSettings; }
  });

  const [loading, setLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // --- DATA FETCHING ---
  
  const fetchCourses = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        setCourses(data as Course[]);
        localStorage.setItem('sniper_courses_cache', JSON.stringify(data));
      }
    } catch (e) {
      console.error("Courses sync error:", e);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
      if (data) {
        const mergedSettings = { ...defaultSettings, ...data };
        setSiteSettings(mergedSettings);
        localStorage.setItem('sniper_settings_cache', JSON.stringify(mergedSettings));
      }
    } catch (e) {
      console.error("Settings sync error:", e);
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string, userEmail?: string) => {
    try {
      let { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      
      // FALLBACK: If profile missing (DB lag), construct it from email
      if (!data && userEmail) {
         const isMasterAdmin = userEmail === 'admin@sniperfx.com';
         data = {
             id: userId,
             email: userEmail,
             full_name: userEmail.split('@')[0] || 'User',
             role: isMasterAdmin ? 'admin' : 'student',
             status: isMasterAdmin ? 'active' : 'pending',
             created_at: new Date().toISOString()
         };
         
         // Try to self-heal (create profile) silently
         supabase.from('profiles').insert([data]).then(({ error }) => {
             if (error) console.warn("Self-heal profile warning:", error.message);
         });
      }

      if (data) {
        setUser(data as User);
        localStorage.setItem('sniper_profile_cache', JSON.stringify(data));
        const { data: enrollData } = await supabase.from('enrollments').select('*').eq('user_id', userId);
        if (enrollData) setEnrollments(enrollData as Enrollment[]);
      }
    } catch (error) {
      console.error("Profile sync error:", error);
    }
  }, []);

  // --- OPTIMIZED LOGIN WITH TIMEOUT ---
  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      // Create a promise that rejects after 8 seconds (Shortened for better UX)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 8000)
      );

      // The actual login request
      const loginRequest = supabase.auth.signInWithPassword({ email, password });

      // Race them
      const result: any = await Promise.race([loginRequest, timeoutPromise]);
      
      const { data, error } = result;
      if (error) throw error;
      
      if (data.user) {
          // Optimistic Update - IMMEDIATE
          const metadata = data.user.user_metadata || {};
          const isHardcodedAdmin = email.trim().toLowerCase() === 'admin@sniperfx.com';
          const role = isHardcodedAdmin ? 'admin' : (metadata.role || 'student');
          
          const optimisticUser: User = {
              id: data.user.id,
              email: data.user.email!,
              full_name: metadata.full_name || data.user.email?.split('@')[0],
              phone_number: metadata.phone_number,
              role: role as 'admin' | 'student',
              status: 'active', 
              created_at: new Date().toISOString()
          };

          setUser(optimisticUser);
          localStorage.setItem('sniper_profile_cache', JSON.stringify(optimisticUser));

          // Background sync (don't await)
          fetchProfile(data.user.id, data.user.email);
          
          return optimisticUser;
      }
      return null;
    } catch (err: any) {
      if (err.message === 'TIMEOUT') {
          throw new Error('استجابة الخادم بطيئة جداً. يرجى المحاولة مرة أخرى.');
      }
      throw err;
    }
  };

  const refreshEnrollments = async () => {
    if (user) {
      const { data } = await supabase.from('enrollments').select('*').eq('user_id', user.id);
      if (data) setEnrollments(data as Enrollment[]);
    }
  };

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    const optimisticSettings = { ...siteSettings, ...newSettings };
    setSiteSettings(optimisticSettings);
    localStorage.setItem('sniper_settings_cache', JSON.stringify(optimisticSettings));

    try {
        let targetId = siteSettings.id;
        if (!targetId) {
            const { data: existing } = await supabase.from('site_settings').select('id').limit(1).maybeSingle();
            targetId = existing?.id;
        }
        
        const payload: any = { ...newSettings };
        delete payload.id;
        delete payload.created_at;
        delete payload.hero_title; 
        
        if (targetId) {
            await supabase.from('site_settings').update(payload).eq('id', targetId);
        } else {
            await supabase.from('site_settings').insert([{ ...defaultSettings, ...payload }]);
        }
    } catch (error) {
        console.error("Save failed:", error);
    }
  };

  const checkAccess = (course: Course) => {
    if (user?.role === 'admin') return true;
    if (!course.is_paid) return true; 
    if (!user) return false;
    if (user.status !== 'active') return false;
    return enrollments.some(e => e.course_id === course.id);
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
    } catch (e) {}
  };

  const getLessonProgress = async (lessonId: string): Promise<LessonProgress | null> => {
    if (!user) return null;
    try {
      const { data } = await supabase.from('lesson_progress').select('*').eq('user_id', user.id).eq('lesson_id', lessonId).single();
      return data as LessonProgress;
    } catch { return null; }
  };

  const signOut = async () => {
    setUser(null);
    setEnrollments([]);
    localStorage.removeItem('sniper_profile_cache');
    await supabase.auth.signOut();
  };

  useEffect(() => {
    const init = async () => {
        await Promise.all([fetchCourses(), fetchSettings()]);
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            if (!user || user.id !== session.user.id) {
                await fetchProfile(session.user.id, session.user.email);
            }
        }
    };
    init();
    
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
    
    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({
    user, loading, courses, enrollments, siteSettings, 
    refreshCourses: fetchCourses, refreshEnrollments, updateSettings, 
    login, signOut, checkAccess, saveLessonProgress, getLessonProgress,
    coursesLoading,
    refreshData: () => { fetchCourses(); fetchSettings(); }
  }), [user, loading, courses, enrollments, siteSettings, coursesLoading]);

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};
