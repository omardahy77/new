/*
  # Dynamic Security Fix (Final Sweep)
  
  This script automatically finds ALL functions in the 'public' schema
  and forces them to have a secure 'search_path'.
  
  This resolves the "Function Search Path Mutable" warning for good,
  even for functions we might have missed manually.
*/

DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Loop through all functions in the 'public' schema
    FOR func_record IN 
        SELECT n.nspname as schema_name, p.proname as function_name, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prokind = 'f' -- Only functions (not procedures/aggregates)
    LOOP
        -- Dynamically execute ALTER FUNCTION for each one
        RAISE NOTICE 'Securing function: %.%(%)', func_record.schema_name, func_record.function_name, func_record.args;
        EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public, extensions, temp;', func_record.function_name, func_record.args);
    END LOOP;
END $$;

-- Also secure the specific RPCs just in case
ALTER FUNCTION public.handle_new_user() SET search_path = public, extensions, temp;
ALTER FUNCTION public.is_admin() SET search_path = public, extensions, temp;
ALTER FUNCTION public.admin_delete_user(uuid) SET search_path = public, extensions, temp;
