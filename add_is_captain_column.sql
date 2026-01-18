-- Fix for team_players table: Add missing columns and update data
-- Run this in your Supabase SQL Editor

-- 1. Add is_captain column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_players' AND column_name = 'is_captain') THEN
        ALTER TABLE team_players ADD COLUMN is_captain BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- 2. Ensure student_id column exists (matches user snippet)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_players' AND column_name = 'student_id') THEN
        ALTER TABLE team_players ADD COLUMN student_id TEXT;
        -- Sync student_id with hall_ticket for existing data
        UPDATE team_players SET student_id = hall_ticket WHERE student_id IS NULL;
    END IF;
END $$;

-- 3. Update existing captains based on the teams table
-- This ensures that the captain of each team is correctly marked in the team_players table
UPDATE team_players 
SET is_captain = true 
FROM teams 
WHERE team_players.team_id = teams.id 
AND team_players.hall_ticket = teams.captain_id;

-- 4. Notify PostgREST to reload schema cache (Critical for fixing "column not found" errors)
NOTIFY pgrst, 'reload schema';

-- Verification: List columns of team_players
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'team_players'
ORDER BY ordinal_position;
