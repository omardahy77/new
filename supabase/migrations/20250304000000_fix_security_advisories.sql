/*
  # Security Hardening & Search Path Fix
  
  ## Description
  This migration fixes the "Function Search Path Mutable" security warnings by explicitly 
  setting the `search_path` for all security-critical functions.
  
  ## Metadata
  - Schema-Category: Security
  - Impact-Level: Low (Safe)
  - Requires-Backup: false
*/

-- 1. Secure the Admin Check Function
ALTER FUNCTION public.is_admin_safe() SET search_path = public;

-- 2. Secure the Delete User Function (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'delete_user_completely') THEN
        ALTER FUNCTION public.delete_user_completely(uuid) SET search_path = public;
    END IF;
END $$;

-- 3. Secure any other common RPCs
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_role') THEN
        ALTER FUNCTION public.get_user_role(uuid) SET search_path = public;
    END IF;
END $$;

-- 4. Ensure RLS is active on all sensitive tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
