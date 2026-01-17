-- Fix infinite recursion on team_players table
-- Run this in your Supabase SQL Editor

-- Disable RLS completely on team_players
ALTER TABLE team_players DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'team_players') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON team_players';
    END LOOP;
END $$;

-- Re-enable RLS with simple, non-recursive policies
ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read team_players
CREATE POLICY "Public read access for team_players"
ON team_players
FOR SELECT
USING (true);

-- Allow all authenticated users to insert team_players
CREATE POLICY "Authenticated insert access for team_players"
ON team_players
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Verify
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'team_players';
