/*
  # Fix Security Warnings
  
  ## Description
  This migration addresses the "Function Search Path Mutable" warnings detected by Supabase.
  It explicitly sets the `search_path` to `public` for all security-critical functions.
  This prevents malicious users from overriding system functions using a crafted search path.

  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "Low" (Safe operation)
  - Requires-Backup: false
*/

DO $$
BEGIN
    -- 1. Secure is_admin function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
        ALTER FUNCTION public.is_admin() SET search_path = public;
    END IF;

    -- 2. Secure delete_user_by_admin function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'delete_user_by_admin') THEN
        ALTER FUNCTION public.delete_user_by_admin(uuid) SET search_path = public;
    END IF;
    
    -- 3. Secure ensure_user_profile_exists function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'ensure_user_profile_exists') THEN
        ALTER FUNCTION public.ensure_user_profile_exists(uuid) SET search_path = public;
    END IF;

    -- 4. Secure handle_new_user trigger function (if exists)
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
        ALTER FUNCTION public.handle_new_user() SET search_path = public;
    END IF;
END
$$;
