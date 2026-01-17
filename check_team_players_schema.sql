-- Check the actual structure of team_players table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'team_players'
ORDER BY ordinal_position;
