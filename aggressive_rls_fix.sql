-- AGGRESSIVE FIX: Completely reset RLS on student_data
-- Run this in your Supabase SQL Editor

-- Step 1: Disable RLS completely
ALTER TABLE student_data DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies (this will work even if RLS is disabled)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'student_data') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON student_data';
    END LOOP;
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE student_data ENABLE ROW LEVEL SECURITY;

-- Step 4: Create ONE simple policy for reading
CREATE POLICY "Public read access"
ON student_data
FOR SELECT
USING (true);

-- Step 5: Create ONE simple policy for updates
CREATE POLICY "Authenticated update access"
ON student_data
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Step 6: Create ONE simple policy for inserts
CREATE POLICY "Authenticated insert access"
ON student_data
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Verify - should only show 3 policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'student_data';
