-- Fix studio_tool column type conversion

-- First check which tables have the studio_tool column (uncomment to run)
-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE column_name = 'studio_tool';

-- For marketing_assets table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'marketing_assets' AND column_name = 'studio_tool'
  ) THEN
    ALTER TABLE marketing_assets 
    ALTER COLUMN "studio_tool" TYPE studio_tool 
    USING "studio_tool"::text::studio_tool;
  END IF;
END $$;

-- For assets table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'assets' AND column_name = 'studio_tool'
  ) THEN
    ALTER TABLE assets 
    ALTER COLUMN "studio_tool" TYPE studio_tool 
    USING "studio_tool"::text::studio_tool;
  END IF;
END $$;
