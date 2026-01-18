-- Add role column to student_data if it doesn't exist
ALTER TABLE student_data ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

-- Update existing ADMIN to have admin role
UPDATE student_data SET role = 'admin' WHERE hall_ticket = 'ADMIN';
