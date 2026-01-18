-- Definitive fix for the "column 'role' does not exist" error
-- This script adds the role column to both potential student tables and marks the admin correctly.

-- 1. Fix 'student_data' table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_data' AND column_name = 'role') THEN
        ALTER TABLE student_data ADD COLUMN role TEXT DEFAULT 'student';
        UPDATE student_data SET role = 'admin' WHERE hall_ticket = 'ADMIN';
    END IF;
END $$;

-- 2. Fix 'students' table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'students') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'role') THEN
            ALTER TABLE students ADD COLUMN role TEXT DEFAULT 'student';
            UPDATE students SET role = 'admin' WHERE hall_ticket = 'ADMIN';
        END IF;
    END IF;
END $$;

-- 3. Notify PostgREST to refresh schema cache
NOTIFY pgrst, 'reload schema';

-- 4. Verification
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('student_data', 'students') AND column_name = 'role';
