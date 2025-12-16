/*
  # Final Security Sweep: Fix Mutable Search Paths
  
  ## Description
  This migration dynamically iterates through EVERY function in the 'public' schema
  and explicitly sets their `search_path` to `public, temp`.
  
  ## Why?
  - To satisfy Supabase Security Advisories (CVE-2018-1058 mitigation).
  - To prevent malicious users from hijacking function calls by creating objects in other schemas.
  
  ## Impact
  - Safe to run.
  - Will not affect logic, only security context.
*/

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Loop through all functions in the public schema
    FOR r IN 
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prokind = 'f' -- Only functions (f), not procedures (p) or aggregates (a)
    LOOP
        -- Execute ALTER FUNCTION for each one
        RAISE NOTICE 'Securing function: %', r.func_signature;
        EXECUTE 'ALTER FUNCTION ' || r.func_signature || ' SET search_path = public, temp';
    END LOOP;
END $$;
