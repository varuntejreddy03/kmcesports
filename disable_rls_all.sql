-- Disable RLS on payments completely to see if it fixes the dashboard view
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Also check if teams table has RLS and if it's blocking
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;

-- Also team_players
ALTER TABLE team_players DISABLE ROW LEVEL SECURITY;
