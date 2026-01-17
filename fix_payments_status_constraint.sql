-- Drop the existing check constraint
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;

-- Add new constraint that allows pending, approved, rejected
ALTER TABLE payments ADD CONSTRAINT payments_status_check 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Verify
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'payments'::regclass 
AND contype = 'c';
