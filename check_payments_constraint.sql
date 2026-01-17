-- Check the constraint on payments.status column
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'payments'::regclass 
AND contype = 'c';

-- Check what status values exist in the database
SELECT DISTINCT status FROM payments;
