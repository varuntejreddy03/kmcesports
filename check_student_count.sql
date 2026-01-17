-- Check actual student count in database
-- Run this to see if you really have more than 1000 students

SELECT COUNT(*) as total_students FROM student_data;

-- Also check the actual data
SELECT COUNT(*) as total_in_students_table FROM students;

-- See a sample of records
SELECT hall_ticket, name, year FROM student_data ORDER BY hall_ticket LIMIT 10;
