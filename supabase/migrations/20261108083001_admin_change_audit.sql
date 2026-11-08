-- Admin-only change history. Store selected public/business fields, never customer
-- contact details, inquiry text, answer bodies, HTML, tokens, or full row JSON.
CREATE TABLE public.admin_change_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid NOT NULL,
  table_name text NOT NULL,
  record_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
  changed_fields text[] NOT NULL DEFAULT '{}',
  old_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  new_values jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX admin_change_audit_occurred_at_idx
  ON public.admin_change_audit (occurred_at DESC);
CREATE INDEX admin_change_audit_actor_time_idx
  ON public.admin_change_audit (actor_user_id, occurred_at DESC);
CREATE INDEX admin_change_audit_record_idx
  ON public.admin_change_audit (table_name, record_id, occurred_at DESC);

ALTER TABLE public.admin_change_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_change_audit FROM anon, authenticated;
GRANT SELECT ON public.admin_change_audit TO authenticated;
CREATE POLICY "Admins read change audit" ON public.admin_change_audit
  FOR SELECT TO authenticated USING ((SELECT private.is_admin()));

CREATE FUNCTION private.audit_admin_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  actor uuid := auth.uid();
  before_row jsonb := CASE WHEN TG_OP = 'INSERT' THEN '{}'::jsonb ELSE to_jsonb(OLD) END;
  after_row jsonb := CASE WHEN TG_OP = 'DELETE' THEN '{}'::jsonb ELSE to_jsonb(NEW) END;
  before_safe jsonb := '{}'::jsonb;
  after_safe jsonb := '{}'::jsonb;
  changed text[];
  row_id text;
BEGIN
  IF actor IS NULL OR NOT private.is_admin() THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'vehicles' THEN
    before_safe := jsonb_build_object(
      'name', before_row->>'name', 'category_id', before_row->>'category_id',
      'price_daily', before_row->'price_daily', 'price_weekly', before_row->'price_weekly',
      'price_monthly', before_row->'price_monthly',
      'is_monthly_special', before_row->'is_monthly_special',
      'monthly_special_price', before_row->'monthly_special_price',
      'monthly_special_starts_on', before_row->>'monthly_special_starts_on',
      'monthly_special_ends_on', before_row->>'monthly_special_ends_on',
      'seats', before_row->'seats', 'displacement_cc', before_row->'displacement_cc',
      'is_van', before_row->'is_van', 'extra_km_fee', before_row->'extra_km_fee',
      'km_daily', before_row->'km_daily', 'km_weekly', before_row->'km_weekly',
      'km_monthly', before_row->'km_monthly');
    after_safe := jsonb_build_object(
      'name', after_row->>'name', 'category_id', after_row->>'category_id',
      'price_daily', after_row->'price_daily', 'price_weekly', after_row->'price_weekly',
      'price_monthly', after_row->'price_monthly',
      'is_monthly_special', after_row->'is_monthly_special',
      'monthly_special_price', after_row->'monthly_special_price',
      'monthly_special_starts_on', after_row->>'monthly_special_starts_on',
      'monthly_special_ends_on', after_row->>'monthly_special_ends_on',
      'seats', after_row->'seats', 'displacement_cc', after_row->'displacement_cc',
      'is_van', after_row->'is_van', 'extra_km_fee', after_row->'extra_km_fee',
      'km_daily', after_row->'km_daily', 'km_weekly', after_row->'km_weekly',
      'km_monthly', after_row->'km_monthly');
  ELSIF TG_TABLE_NAME = 'vehicle_categories' THEN
    before_safe := jsonb_build_object('name', before_row->>'name');
    after_safe := jsonb_build_object('name', after_row->>'name');
  ELSIF TG_TABLE_NAME = 'events' THEN
    before_safe := jsonb_build_object('title', before_row->>'title',
      'start_date', before_row->>'start_date', 'end_date', before_row->>'end_date',
      'is_active', before_row->'is_active', 'is_popup', before_row->'is_popup');
    after_safe := jsonb_build_object('title', after_row->>'title',
      'start_date', after_row->>'start_date', 'end_date', after_row->>'end_date',
      'is_active', after_row->'is_active', 'is_popup', after_row->'is_popup');
  ELSIF TG_TABLE_NAME = 'notices' THEN
    before_safe := jsonb_build_object('title', before_row->>'title',
      'is_pinned', before_row->'is_pinned',
      'content_length', length(coalesce(before_row->>'content','')));
    after_safe := jsonb_build_object('title', after_row->>'title',
      'is_pinned', after_row->'is_pinned',
      'content_length', length(coalesce(after_row->>'content','')));
  ELSIF TG_TABLE_NAME = 'site_content' THEN
    before_safe := jsonb_build_object(
      'slug', before_row->>'slug', 'title', before_row->>'title',
      'is_published', before_row->'is_published',
      'section_count', jsonb_array_length(coalesce(before_row->'sections','[]'::jsonb)));
    after_safe := jsonb_build_object(
      'slug', after_row->>'slug', 'title', after_row->>'title',
      'is_published', after_row->'is_published',
      'section_count', jsonb_array_length(coalesce(after_row->'sections','[]'::jsonb)));
  ELSIF TG_TABLE_NAME = 'reservations' THEN
    before_safe := jsonb_build_object('status', before_row->>'status');
    after_safe := jsonb_build_object('status', after_row->>'status');
  ELSIF TG_TABLE_NAME = 'inquiries' THEN
    before_safe := jsonb_build_object('status', before_row->>'status',
      'has_answer', nullif(before_row->>'answer_content','') IS NOT NULL);
    after_safe := jsonb_build_object('status', after_row->>'status',
      'has_answer', nullif(after_row->>'answer_content','') IS NOT NULL);
  ELSE
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  SELECT coalesce(array_agg(key ORDER BY key), '{}') INTO changed
  FROM (SELECT jsonb_object_keys(before_safe || after_safe) AS key) keys
  WHERE before_safe->key IS DISTINCT FROM after_safe->key;

  IF TG_OP = 'UPDATE' AND cardinality(changed) = 0 THEN RETURN NEW; END IF;
  row_id := coalesce(after_row->>'id', before_row->>'id',
    after_row->>'slug', before_row->>'slug');
  INSERT INTO public.admin_change_audit
    (actor_user_id, table_name, record_id, action, changed_fields, old_values, new_values)
  VALUES (actor, TG_TABLE_NAME, row_id, lower(TG_OP), changed, before_safe, after_safe);
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.audit_admin_change() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER audit_vehicles AFTER INSERT OR UPDATE OR DELETE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION private.audit_admin_change();
CREATE TRIGGER audit_vehicle_categories AFTER INSERT OR UPDATE OR DELETE ON public.vehicle_categories
  FOR EACH ROW EXECUTE FUNCTION private.audit_admin_change();
CREATE TRIGGER audit_events AFTER INSERT OR UPDATE OR DELETE ON public.events
  FOR EACH ROW EXECUTE FUNCTION private.audit_admin_change();
CREATE TRIGGER audit_notices AFTER INSERT OR UPDATE OR DELETE ON public.notices
  FOR EACH ROW EXECUTE FUNCTION private.audit_admin_change();
CREATE TRIGGER audit_site_content AFTER INSERT OR UPDATE OR DELETE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION private.audit_admin_change();
CREATE TRIGGER audit_reservations AFTER INSERT OR UPDATE OR DELETE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION private.audit_admin_change();
CREATE TRIGGER audit_inquiries AFTER INSERT OR UPDATE OR DELETE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION private.audit_admin_change();
