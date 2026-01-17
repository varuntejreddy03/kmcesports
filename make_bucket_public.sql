-- Make payment-proofs bucket public so images can be viewed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'payment-proofs';

-- Verify the change
SELECT id, name, public FROM storage.buckets WHERE id = 'payment-proofs';
