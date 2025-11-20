export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  role: 'admin' | 'student';
  status: 'pending' | 'active';
  created_at?: string;
}

export interface Lesson {
  id?: string;
  course_id: string;
  title: string;
  video_url: string;
  thumbnail?: string;
  order: number;
  duration: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  is_paid: boolean;
  rating: number;
  lessons?: Lesson[];
  created_at?: string;
  level?: 'مبتدئ' | 'متوسط' | 'خبير';
  duration?: string;
  lesson_count?: number;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  created_at: string;
}

export interface Feature {
  title: string;
  description: string;
  icon: string;
}

export interface SiteSettings {
  id?: string;
  site_name: string;
  hero_title: string;
  hero_title_line1?: string;
  hero_title_line2?: string;
  hero_desc: string;
  logo_url?: string;
  maintenance_mode?: boolean; // New Field
  social_links: {
    telegram?: string;
    instagram?: string;
    youtube?: string;
    facebook?: string;
    tiktok?: string;
    twitter?: string;
  };
  stats: {
    students: string;
    hours: string;
  };
  home_features?: Feature[];
  about_title?: string;
  about_desc?: string;
  contact_title?: string;
  contact_desc?: string;
}
