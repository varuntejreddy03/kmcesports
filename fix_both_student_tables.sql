-- Fix BOTH tables: 'students' AND 'student_data'
-- The error mentions 'students' but your code uses 'student_data'

-- ============================================
-- FIX TABLE: students (if it exists)
-- ============================================

-- Disable RLS on 'students' table
ALTER TABLE IF EXISTS students DISABLE ROW LEVEL SECURITY;

-- Drop all policies on 'students'
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'students') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON students';
    END LOOP;
END $$;

-- Re-enable with simple policy
ALTER TABLE IF EXISTS students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for students"
ON students
FOR SELECT
USING (true);

CREATE POLICY "Authenticated write access for students"
ON students
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- FIX TABLE: student_data (your actual table)
-- ============================================

-- Disable RLS on 'student_data' table
ALTER TABLE student_data DISABLE ROW LEVEL SECURITY;

-- Drop all policies on 'student_data'
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'student_data') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON student_data';
    END LOOP;
END $$;

-- Re-enable with simple policy
ALTER TABLE student_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for student_data"
ON student_data
FOR SELECT
USING (true);

CREATE POLICY "Authenticated write access for student_data"
ON student_data
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- VERIFY
-- ============================================
SELECT 'students table policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'students';

SELECT 'student_data table policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'student_data';

-- Check which tables actually exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%student%';
