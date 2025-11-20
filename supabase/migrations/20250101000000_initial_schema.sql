/*
  # Initial Schema for Sniper FX Gold LMS

  ## Query Description:
  Creates the necessary tables for the LMS platform: profiles, courses, lessons, and site_settings.
  Sets up Row Level Security (RLS) and automatic profile creation triggers.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - public.profiles: Extends auth.users with role (admin/student) and status (pending/active).
  - public.courses: Stores course metadata.
  - public.lessons: Stores lesson content linked to courses.
  - public.site_settings: Stores global configuration (texts, social links).
*/

-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  role text default 'student' check (role in ('admin', 'student')),
  status text default 'pending' check (status in ('pending', 'active')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- Create courses table
create table if not exists public.courses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  thumbnail text,
  is_paid boolean default false,
  rating numeric default 5.0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on courses
alter table public.courses enable row level security;

-- Policies for courses
create policy "Courses are viewable by everyone." on public.courses for select using (true);
create policy "Admins can insert courses." on public.courses for insert with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can update courses." on public.courses for update using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can delete courses." on public.courses for delete using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Create lessons table
create table if not exists public.lessons (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses on delete cascade not null,
  title text not null,
  video_url text,
  thumbnail text,
  "order" integer default 0,
  duration text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on lessons
alter table public.lessons enable row level security;

-- Policies for lessons
create policy "Lessons are viewable by everyone." on public.lessons for select using (true);
create policy "Admins can manage lessons." on public.lessons for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Create site_settings table
create table if not exists public.site_settings (
  id uuid default gen_random_uuid() primary key,
  site_name text default 'Sniper FX Gold',
  hero_title text default 'تداول بذكاء بدقة القناص',
  hero_desc text default 'اكتشف أسرار صناعة السوق والمؤسسات المالية... نظام تعليمي (LMS) متكامل ومحمي يأخذك من الصفر إلى الاحتراف.',
  logo_url text,
  social_links jsonb default '{"telegram": "#", "instagram": "#", "youtube": "#"}'::jsonb,
  stats jsonb default '{"students": "+1500", "hours": "+50"}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on site_settings
alter table public.site_settings enable row level security;

-- Policies for site_settings
create policy "Settings are viewable by everyone." on public.site_settings for select using (true);
create policy "Admins can update settings." on public.site_settings for update using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Insert default settings if not exists
insert into public.site_settings (site_name)
select 'Sniper FX Gold'
where not exists (select 1 from public.site_settings);

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, status)
  values (new.id, new.email, 'student', 'pending');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
