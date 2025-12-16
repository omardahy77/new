import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User, Course, SiteSettings, Enrollment, LessonProgress } from '../types';
import { StoreContext } from './StoreContext';
import { DEFAULT_COURSES } from '../constants';

// VERSION CONTROL: GOLD EDITION
const APP_VERSION = '18.3.0-GOLD'; 

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
      // Use maybeSingle to prevent errors if RLS blocks access initially
      let { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      
      if (error) {
          // Silent fail for profile fetch
      }

      // FALLBACK: If profile missing (DB lag or RLS issue), construct it from email
      if (!data && userEmail) {
         const isMasterAdmin = userEmail === 'admin@sniperfx.com';
         data = {
             id: userId,
             email: userEmail,
             full_name: userEmail.split('@')[0] || 'User',
             role: isMasterAdmin ? 'admin' : 'student',
             status: isMasterAdmin ? 'active' : 'pending', // Default to pending for safety
             created_at: new Date().toISOString()
         };
         
         // Try to self-heal (create profile) silently if it doesn't exist
         supabase.from('profiles').upsert([data], { onConflict: 'id' }).then(({ error }) => {
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

  // --- OPTIMIZED LOGIN WITH STATUS CHECK ---
  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      // 1. Authenticate
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      if (data.user) {
          // 2. Fetch REAL Profile to check Status (CRITICAL FOR APPROVAL WORKFLOW)
          // We cannot rely on optimistic updates here because we need to know if they are 'pending'
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileError) {
             // If profile fetch fails, it might be a new user or RLS issue. 
             // Assume pending unless it's the master admin.
             if (email === 'admin@sniperfx.com') {
                 // Allow master admin
             } else {
                 // For safety, if we can't verify status, treat as pending/error
                 console.warn("Could not verify profile status");
             }
          }

          const isHardcodedAdmin = email.trim().toLowerCase() === 'admin@sniperfx.com';
          const status = isHardcodedAdmin ? 'active' : (profile?.status || 'pending');
          const role = isHardcodedAdmin ? 'admin' : (profile?.role || 'student');

          const userObj: User = {
              id: data.user.id,
              email: data.user.email!,
              full_name: profile?.full_name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
              phone_number: profile?.phone_number,
              role: role as 'admin' | 'student',
              status: status as 'active' | 'pending' | 'banned',
              created_at: new Date().toISOString()
          };

          // 3. Handle Status Logic
          if (status === 'active') {
             setUser(userObj);
             localStorage.setItem('sniper_profile_cache', JSON.stringify(userObj));
             await fetchProfile(data.user.id, data.user.email);
          } else {
             // If pending or banned, DO NOT set global user state yet.
             // The Login page will handle the error message.
             await supabase.auth.signOut(); // Immediately sign out from Supabase auth session
          }
          
          return userObj;
      }
      return null;
    } catch (err: any) {
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

  // Optimized Initialization
  useEffect(() => {
    const init = async () => {
        await Promise.allSettled([fetchCourses(), fetchSettings()]);
        
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
    refreshData: async () => { 
        await Promise.allSettled([fetchCourses(), fetchSettings()]); 
    }
  }), [user, loading, courses, enrollments, siteSettings, coursesLoading]);

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};
