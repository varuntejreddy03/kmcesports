-- Check if teams table has the correct data
SELECT id, name, sport, captain_id, approved, created_at 
FROM teams 
ORDER BY created_at DESC;

-- Check if payments exist for teams (without created_at)
SELECT p.id, p.team_id, p.status, p.utr_number, p.amount, p.submitted_at,
       t.name as team_name
FROM payments p
LEFT JOIN teams t ON t.id = p.team_id
ORDER BY p.submitted_at DESC;

-- Check team_players count
SELECT team_id, COUNT(*) as player_count
FROM team_players
GROUP BY team_id;
