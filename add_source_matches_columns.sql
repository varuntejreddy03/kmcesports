-- Migration to add inter-department linkage columns to matches
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS source_match_a INT,
ADD COLUMN IF NOT EXISTS source_match_b INT,
ADD COLUMN IF NOT EXISTS team_a_label TEXT,
ADD COLUMN IF NOT EXISTS team_b_label TEXT,
ADD COLUMN IF NOT EXISTS is_dept_final BOOLEAN DEFAULT FALSE;
