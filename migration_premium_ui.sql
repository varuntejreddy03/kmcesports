-- Migration Summary for Premium UI Update

-- 1. Support for Landing Page & Step 1 Info
ALTER TABLE tournament_settings 
ADD COLUMN IF NOT EXISTS min_players INTEGER DEFAULT 11,
ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS venue TEXT;

-- 2. Support for Dynamic Payment Info (Admin Managed)
ALTER TABLE tournament_settings 
ADD COLUMN IF NOT EXISTS upi_id TEXT,
ADD COLUMN IF NOT EXISTS upi_qr_url TEXT,
ADD COLUMN IF NOT EXISTS payment_instructions TEXT;

-- 3. Ensure 'cricket' entry exists if not already
INSERT INTO tournament_settings (sport, tournament_name, ground_name, registration_fee, max_teams, registration_open)
SELECT 'cricket', 'Cricket Championship 2026', 'Main Campus Ground', 2500, 16, true
WHERE NOT EXISTS (SELECT 1 FROM tournament_settings WHERE sport = 'cricket');

-- 4. Set Defaults
UPDATE tournament_settings 
SET 
    min_players = COALESCE(min_players, 11),
    max_players = COALESCE(max_players, 15),
    upi_id = COALESCE(upi_id, 'sportsportal@upi'),
    payment_instructions = COALESCE(payment_instructions, 'Please mention your Team Name in the payment remarks. Upload the screenshot after payment.')
WHERE sport = 'cricket';
