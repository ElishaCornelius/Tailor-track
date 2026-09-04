CREATE OR REPLACE FUNCTION public.admin_reset_customer_passcode(p_customer_id uuid, p_passcode text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_customer public.customers;
  v_norm text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;
  IF p_passcode !~ '^\d{4}$' THEN
    RAISE EXCEPTION 'Passcode must be exactly 4 digits';
  END IF;

  SELECT * INTO v_customer FROM public.customers WHERE id = p_customer_id;
  IF v_customer.id IS NULL OR v_customer.company_id IS DISTINCT FROM public.get_user_company_id(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  v_norm := public.normalize_phone(v_customer.phone);
  IF length(v_norm) < 10 THEN
    RAISE EXCEPTION 'This customer has no valid phone number on file';
  END IF;

  IF EXISTS (SELECT 1 FROM public.customer_accounts WHERE phone_normalized = v_norm) THEN
    UPDATE public.customer_accounts
    SET passcode_hash = extensions.crypt(p_passcode, extensions.gen_salt('bf'))
    WHERE phone_normalized = v_norm;
  ELSE
    INSERT INTO public.customer_accounts (phone, phone_normalized, passcode_hash)
    VALUES (trim(v_customer.phone), v_norm, extensions.crypt(p_passcode, extensions.gen_salt('bf')));
  END IF;

  DELETE FROM public.customer_sessions s
  USING public.customer_accounts a
  WHERE s.account_id = a.id AND a.phone_normalized = v_norm;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_reset_customer_passcode(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_reset_customer_passcode(uuid, text) TO authenticated;