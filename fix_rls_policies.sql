-- Fix RLS Infinite Recursion Error
-- Run this in your Supabase SQL Editor

-- Step 1: Drop all existing policies on student_data to start fresh
DROP POLICY IF EXISTS "Enable read access for all users" ON student_data;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON student_data;
DROP POLICY IF EXISTS "Enable update for users based on email" ON student_data;
DROP POLICY IF EXISTS "Users can view all students" ON student_data;
DROP POLICY IF EXISTS "Users can insert students" ON student_data;
DROP POLICY IF EXISTS "Users can update own record" ON student_data;

-- Step 2: Create simple, non-recursive policies
-- Allow authenticated users to read all student records (needed for team creation)
CREATE POLICY "Allow authenticated read access"
ON student_data
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update their own record (by hall_ticket)
CREATE POLICY "Allow users to update own record"
ON student_data
FOR UPDATE
TO authenticated
USING (hall_ticket = (auth.jwt() -> 'user_metadata' ->> 'hall_ticket'));

-- Allow service role full access (for admin operations)
CREATE POLICY "Service role has full access"
ON student_data
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 3: Ensure RLS is enabled
ALTER TABLE student_data ENABLE ROW LEVEL SECURITY;

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'student_data';
