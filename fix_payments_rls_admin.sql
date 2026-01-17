-- Fix RLS policies on payments table to allow admin to update
-- Run this in your Supabase SQL Editor

-- Disable RLS temporarily
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'payments') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON payments';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read payments
CREATE POLICY "Public read access for payments"
ON payments
FOR SELECT
USING (true);

-- Allow authenticated users to insert payments
CREATE POLICY "Authenticated insert access for payments"
ON payments
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow ADMIN users to update payments (approve/reject)
CREATE POLICY "Admin can update payments"
ON payments
FOR UPDATE
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

-- Verify policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'payments';
