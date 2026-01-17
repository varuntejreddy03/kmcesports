-- Add missing 'approved' column to teams table
-- Run this in your Supabase SQL Editor

ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'teams' 
ORDER BY ordinal_position;
