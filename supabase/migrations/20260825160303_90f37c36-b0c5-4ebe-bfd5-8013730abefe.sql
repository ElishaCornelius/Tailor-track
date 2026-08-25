CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  actor_id uuid,
  actor_label text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  entity_label text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  authorized boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can view their company's activity"
ON public.activity_log FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Super admins can view all activity"
ON public.activity_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Company admins can insert activity"
ON public.activity_log FOR INSERT TO authenticated
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE INDEX idx_activity_log_company_created ON public.activity_log (company_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company_id uuid;
  v_entity_id uuid;
  v_label text;
  v_details jsonb := '{}'::jsonb;
  v_action text;
  v_actor uuid := auth.uid();
  v_actor_label text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_company_id := OLD.company_id;
    v_entity_id := OLD.id;
    v_action := 'deleted';
  ELSE
    v_company_id := NEW.company_id;
    v_entity_id := NEW.id;
    v_action := CASE WHEN TG_OP = 'INSERT' THEN 'created' ELSE 'updated' END;
  END IF;

  IF TG_TABLE_NAME = 'jobs' THEN
    IF TG_OP = 'DELETE' THEN
      v_label := OLD.code;
    ELSE
      v_label := NEW.code;
    END IF;
    IF TG_OP = 'UPDATE' THEN
      IF OLD.status IS DISTINCT FROM NEW.status THEN
        v_details := v_details || jsonb_build_object('status', jsonb_build_object('from', OLD.status, 'to', NEW.status));
      END IF;
      IF OLD.price IS DISTINCT FROM NEW.price THEN
        v_details := v_details || jsonb_build_object('price', jsonb_build_object('from', OLD.price, 'to', NEW.price));
      END IF;
      IF OLD.amount_paid IS DISTINCT FROM NEW.amount_paid THEN
        v_details := v_details || jsonb_build_object('amount_paid', jsonb_build_object('from', OLD.amount_paid, 'to', NEW.amount_paid));
      END IF;
      IF OLD.outstanding_amount IS DISTINCT FROM NEW.outstanding_amount THEN
        v_details := v_details || jsonb_build_object('outstanding_amount', jsonb_build_object('from', OLD.outstanding_amount, 'to', NEW.outstanding_amount));
      END IF;
      IF OLD.description IS DISTINCT FROM NEW.description THEN
        v_details := v_details || jsonb_build_object('description', jsonb_build_object('from', OLD.description, 'to', NEW.description));
      END IF;
      IF OLD.num_dresses IS DISTINCT FROM NEW.num_dresses THEN
        v_details := v_details || jsonb_build_object('num_items', jsonb_build_object('from', OLD.num_dresses, 'to', NEW.num_dresses));
      END IF;
    END IF;
  ELSE
    IF TG_OP = 'DELETE' THEN
      v_label := OLD.name;
    ELSE
      v_label := NEW.name;
    END IF;
    IF TG_OP = 'UPDATE' THEN
      IF OLD.name IS DISTINCT FROM NEW.name THEN
        v_details := v_details || jsonb_build_object('name', jsonb_build_object('from', OLD.name, 'to', NEW.name));
      END IF;
      IF OLD.phone IS DISTINCT FROM NEW.phone THEN
        v_details := v_details || jsonb_build_object('phone', jsonb_build_object('from', OLD.phone, 'to', NEW.phone));
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' AND v_details = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  IF v_actor IS NOT NULL THEN
    SELECT trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, ''))
      INTO v_actor_label
    FROM public.profiles p WHERE p.id = v_actor;
  END IF;
  IF v_actor_label IS NULL OR v_actor_label = '' THEN
    v_actor_label := CASE WHEN v_actor IS NULL THEN 'System' ELSE 'Admin' END;
  END IF;

  INSERT INTO public.activity_log (company_id, actor_id, actor_label, action, entity_type, entity_id, entity_label, details, authorized)
  VALUES (v_company_id, v_actor, v_actor_label, v_action, TG_TABLE_NAME, v_entity_id, v_label, v_details, v_actor IS NOT NULL);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_jobs_activity
AFTER INSERT OR UPDATE OR DELETE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER log_customers_activity
AFTER INSERT OR UPDATE OR DELETE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.log_activity();