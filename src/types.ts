export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  role: 'admin' | 'student';
  status: 'pending' | 'active' | 'banned';
  created_at?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  is_paid: boolean;
  rating: number;
  level: string;
  duration?: string;
  lesson_count?: number;
  created_at?: string;
}

export interface Lesson {
  id?: string;
  course_id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  order: number;
  duration: string;
  is_published?: boolean;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
}

export interface SiteSettings {
  id?: string;
  site_name: string;
  logo_url?: string;
  
  // Home
  hero_title_line1: string;
  hero_title_line2: string;
  hero_desc: string;
  
  // About
  about_title?: string;
  about_desc?: string;
  
  // Contact
  contact_email?: string;
  footer_text?: string;
  
  // Social
  social_links: {
    telegram?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    whatsapp?: string;
  };
  
  // Flags
  maintenance_mode: boolean;
  allow_registration: boolean;
}
