-- Admin web push: customer submissions notify subscribed admin devices.
-- Secrets live in Vault (set outside this file):
--   admin_push_function_url  https://<project>.supabase.co/functions/v1/admin-push
--   admin_push_webhook_secret  random shared secret between DB and the function
--   admin_push_vapid_public / admin_push_vapid_private / admin_push_vapid_subject
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.admin_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE
    CHECK (endpoint ~ '^https://' AND length(endpoint) <= 1000),
  p256dh text NOT NULL CHECK (length(p256dh) BETWEEN 1 AND 200),
  auth text NOT NULL CHECK (length(auth) BETWEEN 1 AND 100),
  user_agent text CHECK (length(user_agent) <= 300),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_push_subscriptions_user_id_idx
  ON public.admin_push_subscriptions (user_id);

ALTER TABLE public.admin_push_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_push_subscriptions FROM anon, authenticated;
GRANT SELECT ON public.admin_push_subscriptions TO authenticated;
DROP POLICY IF EXISTS "Admins read own push subscriptions"
  ON public.admin_push_subscriptions;
CREATE POLICY "Admins read own push subscriptions"
ON public.admin_push_subscriptions FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role IN ('admin', 'superadmin')
  )
);

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  );
$$;

CREATE OR REPLACE FUNCTION private.vault_secret(secret_name text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets
  WHERE name = secret_name LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.send_admin_push(payload jsonb)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  function_url text := private.vault_secret('admin_push_function_url');
  webhook_secret text := private.vault_secret('admin_push_webhook_secret');
BEGIN
  IF function_url IS NULL OR webhook_secret IS NULL THEN
    RETURN;
  END IF;
  PERFORM net.http_post(
    url := function_url,
    body := payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-secret', webhook_secret
    ),
    timeout_milliseconds := 5000
  );
END;
$$;

-- Lock-screen text carries no customer name, phone or message.
CREATE OR REPLACE FUNCTION private.notify_admin_push()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  payload jsonb;
  category text;
BEGIN
  IF TG_TABLE_NAME = 'reservations' THEN
    IF NEW.car_name LIKE '[신차]%' THEN
      payload := jsonb_build_object(
        'title', '새 신차 상담 접수',
        'body', left(btrim(substr(NEW.car_name, 5)) || ' · ' || NEW.period, 120),
        'url', '/new-car',
        'tag', 'new-car-' || NEW.id
      );
    ELSE
      payload := jsonb_build_object(
        'title', '새 예약 상담 접수',
        'body', left(NEW.car_name || ' · ' || NEW.period, 120),
        'url', '/reservations',
        'tag', 'reservation-' || NEW.id
      );
    END IF;
  ELSIF TG_TABLE_NAME = 'inquiries' THEN
    category := coalesce(substring(NEW.title FROM '^\[([^\]]{1,40})\]'), '일반 문의');
    payload := jsonb_build_object(
      'title', '새 고객 문의 접수',
      'body', category,
      'url', '/inquiries',
      'tag', 'inquiry-' || NEW.id
    );
  ELSE
    RETURN NEW;
  END IF;
  PERFORM private.send_admin_push(payload);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- A notification failure must never reject a customer submission.
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_admin_push ON public.reservations;
CREATE TRIGGER notify_admin_push
AFTER INSERT ON public.reservations
FOR EACH ROW EXECUTE FUNCTION private.notify_admin_push();

DROP TRIGGER IF EXISTS notify_admin_push ON public.inquiries;
CREATE TRIGGER notify_admin_push
AFTER INSERT ON public.inquiries
FOR EACH ROW EXECUTE FUNCTION private.notify_admin_push();

-- Admin session RPCs.
CREATE OR REPLACE FUNCTION public.admin_push_public_key()
RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN private.vault_secret('admin_push_vapid_public');
END;
$$;

CREATE OR REPLACE FUNCTION public.register_admin_push_subscription(
  p_endpoint text, p_p256dh text, p_auth text, p_user_agent text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.admin_push_subscriptions
    (user_id, endpoint, p256dh, auth, user_agent)
  VALUES (auth.uid(), p_endpoint, p_p256dh, p_auth, left(p_user_agent, 300))
  ON CONFLICT (endpoint) DO UPDATE
  SET user_id = EXCLUDED.user_id,
      p256dh = EXCLUDED.p256dh,
      auth = EXCLUDED.auth,
      user_agent = EXCLUDED.user_agent,
      updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_admin_push_subscription(p_endpoint text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.admin_push_subscriptions WHERE endpoint = p_endpoint;
END;
$$;

CREATE OR REPLACE FUNCTION public.send_admin_test_push()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  PERFORM private.send_admin_push(jsonb_build_object(
    'title', '진렌트카 알림 테스트',
    'body', '이 기기에서 관리자 알림을 받을 수 있습니다.',
    'url', '/',
    'tag', 'test-' || auth.uid(),
    'user_id', auth.uid()
  ));
END;
$$;

-- Edge Function (service role) context: keys, secret and live admin targets.
CREATE OR REPLACE FUNCTION public.admin_push_dispatch_context(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'secret', private.vault_secret('admin_push_webhook_secret'),
    'public_key', private.vault_secret('admin_push_vapid_public'),
    'private_key', private.vault_secret('admin_push_vapid_private'),
    'subject', private.vault_secret('admin_push_vapid_subject'),
    'subscriptions', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth))
      FROM public.admin_push_subscriptions s
      JOIN public.profiles p ON p.id = s.user_id
      WHERE p.role IN ('admin', 'superadmin')
        AND (p_user_id IS NULL OR s.user_id = p_user_id)
    ), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.vault_secret(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.send_admin_push(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.notify_admin_push() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_push_public_key() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.register_admin_push_subscription(text, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.remove_admin_push_subscription(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.send_admin_test_push() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_push_public_key() TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_admin_push_subscription(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_admin_push_subscription(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_admin_test_push() TO authenticated;
REVOKE ALL ON FUNCTION public.admin_push_dispatch_context(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_push_dispatch_context(uuid) TO service_role;
