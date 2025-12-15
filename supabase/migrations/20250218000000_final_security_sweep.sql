/*
  # Final Security Sweep
  
  This script iterates through ALL functions in the 'public' schema and forces
  a secure search_path. This resolves the "Function Search Path Mutable" warning
  once and for all.
*/

DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.prokind = 'f'
    LOOP
        EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public, auth, extensions;', 
            func_record.nspname, func_record.proname, func_record.args);
    END LOOP;
END $$;
