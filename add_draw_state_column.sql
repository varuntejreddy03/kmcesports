-- Add draw_state column to tournament_settings for real-time persistence
ALTER TABLE tournament_settings ADD COLUMN IF NOT EXISTS draw_state JSONB DEFAULT NULL;

-- Ensure the column is publically readable (usually already is via existing policy "Allow public read access")
-- But we need to make sure admins can UPDATE it.
-- The existing policy "Allow admin full access" should cover this.
