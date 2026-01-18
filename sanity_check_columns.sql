-- Sanity check for column names
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'student_data' 
AND column_name IN ('phone', 'phone_number', 'mobile', 'contact');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'teams' 
AND column_name IN ('id', 'team_id');
