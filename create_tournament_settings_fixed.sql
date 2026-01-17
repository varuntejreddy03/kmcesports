-- Create tournament_settings table (FIXED - no role column dependency)
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS tournament_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_name TEXT NOT NULL,
  sport TEXT NOT NULL,
  ground_name TEXT NOT NULL,
  registration_fee INTEGER NOT NULL DEFAULT 2500,
  max_teams INTEGER NOT NULL DEFAULT 16,
  registration_open BOOLEAN NOT NULL DEFAULT true,
  rules_text TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(sport) -- Only one tournament config per sport
);

-- Enable RLS
ALTER TABLE tournament_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access" ON tournament_settings;
DROP POLICY IF EXISTS "Allow admin full access" ON tournament_settings;

-- Allow everyone to read tournament settings
CREATE POLICY "Allow public read access"
ON tournament_settings
FOR SELECT
USING (true);

-- Allow authenticated users with hall_ticket 'ADMIN' to insert/update/delete
-- (Since there's no role column, we check if hall_ticket = 'ADMIN')
CREATE POLICY "Allow admin full access"
ON tournament_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM student_data 
    WHERE hall_ticket = (auth.jwt() -> 'user_metadata' ->> 'hall_ticket')
    AND hall_ticket = 'ADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM student_data 
    WHERE hall_ticket = (auth.jwt() -> 'user_metadata' ->> 'hall_ticket')
    AND hall_ticket = 'ADMIN'
  )
);

-- Insert default cricket tournament settings
INSERT INTO tournament_settings (
  tournament_name,
  sport,
  ground_name,
  registration_fee,
  max_teams,
  registration_open,
  rules_text
) VALUES (
  'KMCE Inter-College Cricket Championship 2026',
  'cricket',
  'KMCE Sports Ground',
  2500,
  16,
  true,
  '1. Each team must have 11-15 players
2. Registration fee: ₹2500 per team
3. All players must be current students
4. Captain must submit valid ID proof
5. Payment must be completed within 24 hours of registration'
) ON CONFLICT (sport) DO NOTHING;

-- Verify
SELECT * FROM tournament_settings;
