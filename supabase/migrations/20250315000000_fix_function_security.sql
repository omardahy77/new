-- Secure all functions to fix "Search Path Mutable" warning
-- This prevents malicious users from hijacking the function's search path

BEGIN;

-- 1. Fix is_admin
ALTER FUNCTION public.is_admin() SET search_path = public;

-- 2. Fix admin_delete_user (The new secure delete)
ALTER FUNCTION public.admin_delete_user(uuid) SET search_path = public;

-- 3. Fix legacy functions if they exist (Safe to run even if missing due to IF EXISTS checks in DO block)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'delete_user_completely') THEN
        ALTER FUNCTION public.delete_user_completely(uuid) SET search_path = public;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'setup_admin_user') THEN
        ALTER FUNCTION public.setup_admin_user(text) SET search_path = public;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'exec_sql') THEN
        ALTER FUNCTION public.exec_sql(text) SET search_path = public;
    END IF;
END
$$;

COMMIT;
