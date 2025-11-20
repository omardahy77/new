/*
  # Add Enrollments Table & Admin Policies
  
  ## Query Description:
  Creates a table to manage manual access to paid courses.
  
  ## Structure Details:
  - Table: enrollments
  - Columns: id, user_id, course_id, created_at
  
  ## Security Implications:
  - RLS Enabled.
  - Admins can manage all enrollments.
  - Users can view their own enrollments.
*/

CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can do everything on enrollments"
  ON public.enrollments
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view their own enrollments"
  ON public.enrollments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Fix Profiles Policies to ensure Admins can delete/update any profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete any profile"
  ON public.profiles FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
