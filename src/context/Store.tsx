import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Course, SiteSettings, Enrollment } from '../types';

interface StoreContextType {
  user: User | null;
  loading: boolean;
  courses: Course[];
  enrollments: Enrollment[];
  siteSettings: SiteSettings;
  refreshData: () => Promise<void>;
  checkAccess: (course: Course) => boolean;
  signOut: () => Promise<void>;
}

const defaultSettings: SiteSettings = {
  site_name: "Sniper FX",
  hero_title_line1: "تداول بذكاء",
  hero_title_line2: "بدقة القناص",
  hero_desc: "منصة تعليمية...",
  social_links: {},
  maintenance_mode: false,
  allow_registration: true
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    // 1. Fetch Settings
    const { data: settings } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
    if (settings) setSiteSettings(settings);

    // 2. Fetch Courses
    const { data: coursesData } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (coursesData) setCourses(coursesData);

    // 3. Fetch User Data (if logged in)
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) setUser(profile as User);

        const { data: enrolls } = await supabase.from('enrollments').select('*').eq('user_id', session.user.id);
        if (enrolls) setEnrollments(enrolls);
    } else {
        setUser(null);
        setEnrollments([]);
    }
  };

  // --- THE ACCESS LOGIC ---
  const checkAccess = (course: Course) => {
    // 1. Admin sees all
    if (user?.role === 'admin') return true;
    
    // 2. Free courses are open to all logged in users
    if (!course.is_paid) return !!user;

    // 3. Paid courses require enrollment
    if (course.is_paid) {
        if (!user) return false;
        return enrollments.some(e => e.course_id === course.id);
    }
    
    return false;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setEnrollments([]);
  };

  useEffect(() => {
    const init = async () => {
        await refreshData();
        setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
        refreshData();
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <StoreContext.Provider value={{ 
      user, loading, courses, enrollments, siteSettings, 
      refreshData, checkAccess, signOut 
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
