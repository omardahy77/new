-- Fix "Function Search Path Mutable" Security Warnings
-- This script sets a safe search_path for all security definer functions

BEGIN;

-- 1. Secure `handle_new_user` trigger function
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- 2. Secure `is_admin` check function
ALTER FUNCTION public.is_admin() SET search_path = public;

-- 3. Secure `setup_admin_user` RPC (if exists from rebuild)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'setup_admin_user') THEN
        ALTER FUNCTION public.setup_admin_user(text) SET search_path = public, auth, extensions;
    END IF;
END $$;

-- 4. Secure `delete_user_completely` RPC (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'delete_user_completely') THEN
        ALTER FUNCTION public.delete_user_completely(uuid) SET search_path = public, auth, extensions;
    END IF;
END $$;

COMMIT;
