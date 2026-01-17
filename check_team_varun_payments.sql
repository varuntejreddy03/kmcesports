SELECT t.id, t.name, p.status, p.submitted_at 
FROM teams t 
LEFT JOIN payments p ON t.id = p.team_id 
WHERE t.name = 'varun'
ORDER BY p.submitted_at DESC;
