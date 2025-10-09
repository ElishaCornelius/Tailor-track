-- Link existing user profile to Bella Stitches company
UPDATE profiles 
SET company_id = 'b6c7a0ae-9180-466f-8481-a523fd12c5ad'::uuid 
WHERE id = 'c6d5b5de-5733-48f4-8dd4-137e2aadfa3c'::uuid;