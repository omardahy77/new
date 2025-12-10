/*
  # Security Polish: Fix Search Path for ALL Public Functions
  
  ## Description
  Iterates through all functions in the 'public' schema and explicitly sets
  search_path = public. This resolves "Function Search Path Mutable" warnings
  for any remaining helper functions or triggers.
  
  ## Safety
  - Safe to run multiple times.
  - Does not modify data.
  - Includes error handling to skip system functions if any.
*/

DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Loop through all functions in public schema
    FOR func_record IN 
        SELECT n.nspname as schema_name, p.proname as function_name, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
          AND p.prokind = 'f' 
    LOOP
        BEGIN
            -- Set search_path to public for security
            EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public', 
                           func_record.schema_name, func_record.function_name, func_record.args);
        EXCEPTION WHEN OTHERS THEN
            -- Log but continue if a specific function cannot be modified
            RAISE NOTICE 'Could not modify function %: %', func_record.function_name, SQLERRM;
        END;
    END LOOP;
END $$;
