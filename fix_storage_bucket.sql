-- Check if payment-proofs storage bucket exists and fix policies
-- Run this in your Supabase SQL Editor

-- Check existing buckets
SELECT id, name, public FROM storage.buckets;

-- Create payment-proofs bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies for payment-proofs
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view payment proofs" ON storage.objects;

-- Allow authenticated users to upload to payment-proofs bucket
CREATE POLICY "Authenticated users can upload payment proofs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-proofs');

-- Allow anyone to view payment proofs (since bucket is public)
CREATE POLICY "Anyone can view payment proofs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payment-proofs');

-- Verify
SELECT * FROM storage.buckets WHERE name = 'payment-proofs';
