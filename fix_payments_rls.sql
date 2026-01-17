-- Fix RLS on payments table
-- Run this in your Supabase SQL Editor

-- Disable RLS on payments
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'payments') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON payments';
    END LOOP;
END $$;

-- Re-enable with simple policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read payments
CREATE POLICY "Public read access for payments"
ON payments
FOR SELECT
USING (true);

-- Allow all authenticated users to insert payments
CREATE POLICY "Authenticated insert access for payments"
ON payments
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow all authenticated users to update payments
CREATE POLICY "Authenticated update access for payments"
ON payments
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Verify
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'payments';
