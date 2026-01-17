-- Check if payment-proofs bucket exists
SELECT * FROM storage.buckets WHERE name = 'payment-proofs';

-- If it doesn't exist, create it
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Verify bucket exists
SELECT * FROM storage.buckets WHERE name = 'payment-proofs';
