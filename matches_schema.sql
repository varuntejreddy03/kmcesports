-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_date DATE NOT NULL,
    match_time TIME NOT NULL,
    venue TEXT NOT NULL,
    team_a_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    team_b_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled'))
);

-- Enable RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Anyone can view matches" ON matches;
CREATE POLICY "Anyone can view matches" ON matches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage matches" ON matches;
CREATE POLICY "Admins can manage matches" ON matches FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM student_data 
        WHERE hall_ticket = (auth.jwt() -> 'user_metadata' ->> 'hall_ticket')
        AND (role = 'admin' OR hall_ticket = 'ADMIN')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM student_data 
        WHERE hall_ticket = (auth.jwt() -> 'user_metadata' ->> 'hall_ticket')
        AND (role = 'admin' OR hall_ticket = 'ADMIN')
    )
);

-- Add some default venues if needed or just keep it flexible
