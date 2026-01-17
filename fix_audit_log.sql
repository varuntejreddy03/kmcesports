-- Fix audit_log foreign key constraint error
-- Run this in your Supabase SQL Editor

-- Option 1: Check what triggers exist on the teams table
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'teams';

-- Option 2: Disable the audit_log trigger (if you don't need audit logging)
-- First, find the trigger name from the query above, then run:
-- DROP TRIGGER IF EXISTS [trigger_name] ON teams;

-- Option 3: Make the foreign key constraint nullable (less restrictive)
-- ALTER TABLE audit_log ALTER COLUMN user_id DROP NOT NULL;

-- Option 4: Drop the foreign key constraint entirely (if audit logging isn't critical)
-- ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_user_id_fkey;

-- Recommended: Just drop the constraint for now
ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_user_id_fkey;

-- Verify it's gone
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE table_name = 'audit_log' AND constraint_type = 'FOREIGN KEY';
