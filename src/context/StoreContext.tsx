import { createContext, useContext } from 'react';
import { User, Course, Enrollment, SiteSettings, LessonProgress } from '../types';

export interface StoreContextType {
  user: User | null;
  loading: boolean;
  courses: Course[];
  coursesLoading: boolean;
  enrollments: Enrollment[];
  siteSettings: SiteSettings;
  refreshCourses: () => Promise<void>;
  refreshEnrollments: () => Promise<void>;
  updateSettings: (settings: Partial<SiteSettings>) => Promise<void>;
  login: (email: string, password: string) => Promise<User | null>; // Updated return type
  signOut: () => Promise<void>;
  checkAccess: (course: Course) => boolean;
  saveLessonProgress: (lessonId: string, position: number, duration: number, isCompleted: boolean) => Promise<void>;
  getLessonProgress: (lessonId: string) => Promise<LessonProgress | null>;
}

export const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
