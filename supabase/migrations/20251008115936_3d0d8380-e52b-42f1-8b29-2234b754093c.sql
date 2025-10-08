-- Add amount_paid and outstanding_amount columns to jobs table
ALTER TABLE public.jobs 
ADD COLUMN amount_paid numeric DEFAULT 0,
ADD COLUMN outstanding_amount numeric DEFAULT 0;