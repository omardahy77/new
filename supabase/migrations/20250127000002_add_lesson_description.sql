-- Add description column to lessons table
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS description text;

-- Ensure RLS policies allow update/insert of this column (covered by existing policies but good practice to verify)
COMMENT ON COLUMN public.lessons.description IS 'Detailed description of the lesson content';
