-- Simple fix: Just disable RLS on the 'students' table
-- Since your app uses 'student_data', we don't need RLS on 'students'

-- Disable RLS completely on 'students' table
ALTER TABLE students DISABLE ROW LEVEL SECURITY;

-- Drop all policies on 'students' table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'students') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON students';
    END LOOP;
END $$;

-- Verify - should show no policies for 'students'
SELECT 'Policies on students table (should be empty):' as info;
SELECT policyname FROM pg_policies WHERE tablename = 'students';

-- Check if RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('students', 'student_data');
