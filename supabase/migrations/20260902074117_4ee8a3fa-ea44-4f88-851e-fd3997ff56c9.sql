CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.normalize_phone(p_phone text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10)
$$;

CREATE TABLE public.customer_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  phone_normalized text NOT NULL UNIQUE,
  passcode_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.customer_sessions (
  token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.customer_accounts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '90 days'
);

GRANT ALL ON public.customer_accounts TO service_role;
GRANT ALL ON public.customer_sessions TO service_role;

ALTER TABLE public.customer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_sessions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_customer_accounts_updated_at
BEFORE UPDATE ON public.customer_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.customer_register(p_phone text, p_passcode text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm text := public.normalize_phone(p_phone);
  v_account_id uuid;
  v_token uuid;
BEGIN
  IF length(v_norm) < 10 THEN
    RAISE EXCEPTION 'Please enter a valid phone number';
  END IF;
  IF p_passcode !~ '^\d{4}$' THEN
    RAISE EXCEPTION 'Passcode must be exactly 4 digits';
  END IF;
  IF EXISTS (SELECT 1 FROM public.customer_accounts WHERE phone_normalized = v_norm) THEN
    RAISE EXCEPTION 'An account already exists for this phone number';
  END IF;

  INSERT INTO public.customer_accounts (phone, phone_normalized, passcode_hash)
  VALUES (trim(p_phone), v_norm, extensions.crypt(p_passcode, extensions.gen_salt('bf')))
  RETURNING id INTO v_account_id;

  INSERT INTO public.customer_sessions (account_id) VALUES (v_account_id) RETURNING token INTO v_token;
  RETURN v_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.customer_login(p_phone text, p_passcode text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm text := public.normalize_phone(p_phone);
  v_account public.customer_accounts;
  v_token uuid;
BEGIN
  SELECT * INTO v_account FROM public.customer_accounts WHERE phone_normalized = v_norm;
  IF v_account.id IS NULL OR v_account.passcode_hash <> extensions.crypt(p_passcode, v_account.passcode_hash) THEN
    RAISE EXCEPTION 'Incorrect phone number or passcode';
  END IF;
  INSERT INTO public.customer_sessions (account_id) VALUES (v_account.id) RETURNING token INTO v_token;
  RETURN v_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.customer_account_exists(p_phone text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.customer_accounts WHERE phone_normalized = public.normalize_phone(p_phone))
$$;

CREATE OR REPLACE FUNCTION public.customer_logout(p_token uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.customer_sessions WHERE token = p_token
$$;

CREATE OR REPLACE FUNCTION public.customer_me(p_token uuid)
RETURNS TABLE(phone text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.phone
  FROM public.customer_sessions s
  JOIN public.customer_accounts a ON a.id = s.account_id
  WHERE s.token = p_token AND s.expires_at > now()
$$;

CREATE OR REPLACE FUNCTION public.customer_jobs(p_token uuid)
RETURNS TABLE(
  code text, customer_name text, description text, num_dresses integer,
  price numeric, amount_paid numeric, outstanding_amount numeric, status text,
  created_at timestamptz, completed_at timestamptz,
  company_name text, company_phone text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT j.code, c.name, j.description, j.num_dresses, j.price,
         j.amount_paid, j.outstanding_amount, j.status::text,
         j.created_at, j.completed_at, co.name, co.phone
  FROM public.customer_sessions s
  JOIN public.customer_accounts a ON a.id = s.account_id AND s.expires_at > now()
  JOIN public.customers c ON public.normalize_phone(c.phone) = a.phone_normalized
  JOIN public.jobs j ON j.customer_id = c.id
  JOIN public.companies co ON co.id = j.company_id
  WHERE s.token = p_token
  ORDER BY j.created_at DESC
$$;

REVOKE ALL ON FUNCTION public.customer_register(text, text) FROM public;
REVOKE ALL ON FUNCTION public.customer_login(text, text) FROM public;
REVOKE ALL ON FUNCTION public.customer_logout(uuid) FROM public;
REVOKE ALL ON FUNCTION public.customer_me(uuid) FROM public;
REVOKE ALL ON FUNCTION public.customer_jobs(uuid) FROM public;
REVOKE ALL ON FUNCTION public.customer_account_exists(text) FROM public;

GRANT EXECUTE ON FUNCTION public.customer_register(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_login(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_logout(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_me(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_jobs(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_account_exists(text) TO anon, authenticated;