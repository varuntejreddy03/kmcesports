-- Add payment configuration to tournament_settings
ALTER TABLE tournament_settings 
ADD COLUMN IF NOT EXISTS upi_id TEXT,
ADD COLUMN IF NOT EXISTS upi_qr_url TEXT,
ADD COLUMN IF NOT EXISTS payment_instructions TEXT;

-- Update cricket defaults
UPDATE tournament_settings 
SET upi_id = 'sportsportal@upi',
    payment_instructions = 'Please mention your Team Name in the payment remarks. Upload the screenshot after payment.'
WHERE sport = 'cricket';
