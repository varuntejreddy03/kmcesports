-- Final fix for Match Schedule visibility and Admin resilience
-- Run this in your Supabase SQL Editor to ensure everyone can see the schedule.

-- 1. Ensure anyone (even not logged in) can see matches
DROP POLICY IF EXISTS "Anyone can view matches" ON matches;
CREATE POLICY "Anyone can view matches" ON matches FOR SELECT USING (true);

-- 2. Ensure Admins can manage matches (Robust check)
DROP POLICY IF EXISTS "Admins can manage matches" ON matches;
CREATE POLICY "Admins can manage matches" ON matches FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM student_data 
        WHERE hall_ticket = (auth.jwt() -> 'user_metadata' ->> 'hall_ticket')
        AND (role = 'admin' OR hall_ticket = 'ADMIN')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM student_data 
        WHERE hall_ticket = (auth.jwt() -> 'user_metadata' ->> 'hall_ticket')
        AND (role = 'admin' OR hall_ticket = 'ADMIN')
    )
);

-- 3. Reload schema cache
NOTIFY pgrst, 'reload schema';

-- Verification
SELECT tablename, policyname, cmd, roles FROM pg_policies WHERE tablename = 'matches';
