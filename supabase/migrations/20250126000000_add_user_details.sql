/*
  # Add User Details Columns
  
  ## Query Description:
  This migration adds full_name and phone_number columns to the profiles table to store additional user information collected during registration.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Table: public.profiles
  - New Columns: 
    - full_name (text, nullable)
    - phone_number (text, nullable)
*/

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number text;
