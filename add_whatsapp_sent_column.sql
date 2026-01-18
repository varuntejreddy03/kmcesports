-- Add whatsapp_sent column to teams table to prevent duplicate notifications
ALTER TABLE teams ADD COLUMN IF NOT EXISTS whatsapp_sent BOOLEAN DEFAULT FALSE;

-- Optional: Index for performance
CREATE INDEX IF NOT EXISTS teams_whatsapp_sent_idx ON teams(whatsapp_sent);
