/*
  # Add Maintenance Mode
  
  ## Changes
  - Add `maintenance_mode` column to `site_settings` table
*/

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'maintenance_mode') THEN
        ALTER TABLE site_settings ADD COLUMN maintenance_mode BOOLEAN DEFAULT false;
    END IF;
END $$;
