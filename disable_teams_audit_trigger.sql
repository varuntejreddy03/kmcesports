-- Disable the teams_audit_trigger that's causing the foreign key error
-- Run this in your Supabase SQL Editor

DROP TRIGGER IF EXISTS teams_audit_trigger ON teams;

-- Verify it's gone
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers
WHERE event_object_table = 'teams';

-- This should return no rows, meaning the trigger is disabled
