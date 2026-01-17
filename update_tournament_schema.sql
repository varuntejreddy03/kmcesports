-- Add missing columns to tournament_settings
ALTER TABLE tournament_settings 
ADD COLUMN IF NOT EXISTS min_players INTEGER DEFAULT 11,
ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS venue TEXT;

-- Update existing record if any
UPDATE tournament_settings 
SET min_players = 11, max_players = 15, venue = ground_name
WHERE sport = 'cricket' AND venue IS NULL;
