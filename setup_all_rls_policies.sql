-- Complete RLS Setup for All Tables
-- Run this after fixing student_data policies

-- ============================================
-- TEAMS TABLE
-- ============================================
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view teams" ON teams;
DROP POLICY IF EXISTS "Captains can create teams" ON teams;
DROP POLICY IF EXISTS "Admins can update teams" ON teams;
DROP POLICY IF EXISTS "Authenticated users can view all teams" ON teams;
DROP POLICY IF EXISTS "Authenticated users can create teams" ON teams;

CREATE POLICY "Authenticated users can view all teams"
ON teams FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create teams"
ON teams FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update teams"
ON teams FOR UPDATE TO authenticated USING (true);

-- ============================================
-- TEAM_PLAYERS TABLE
-- ============================================
ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view team players" ON team_players;
DROP POLICY IF EXISTS "Captains can add players" ON team_players;
DROP POLICY IF EXISTS "Authenticated users can view team players" ON team_players;
DROP POLICY IF EXISTS "Authenticated users can insert team players" ON team_players;

CREATE POLICY "Authenticated users can view team players"
ON team_players FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert team players"
ON team_players FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can create payments" ON payments;
DROP POLICY IF EXISTS "Admins can update payments" ON payments;
DROP POLICY IF EXISTS "Authenticated users can view all payments" ON payments;
DROP POLICY IF EXISTS "Authenticated users can create payments" ON payments;

CREATE POLICY "Authenticated users can view all payments"
ON payments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create payments"
ON payments FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update payments"
ON payments FOR UPDATE TO authenticated USING (true);

-- Verify all policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
