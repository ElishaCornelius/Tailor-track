DROP POLICY IF EXISTS "Anyone can view jobs by code (for customer tracking)" ON public.jobs;

CREATE OR REPLACE FUNCTION public.track_job(p_code text)
RETURNS TABLE (
  code text,
  customer_name text,
  description text,
  num_dresses integer,
  price numeric,
  amount_paid numeric,
  outstanding_amount numeric,
  status text,
  created_at timestamptz,
  completed_at timestamptz,
  company_name text,
  company_phone text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT j.code, c.name, j.description, j.num_dresses, j.price,
         j.amount_paid, j.outstanding_amount, j.status::text,
         j.created_at, j.completed_at, co.name, co.phone
  FROM public.jobs j
  JOIN public.customers c ON c.id = j.customer_id
  JOIN public.companies co ON co.id = j.company_id
  WHERE upper(j.code) = upper(trim(p_code))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.track_job(text) TO anon, authenticated;