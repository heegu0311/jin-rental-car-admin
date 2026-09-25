-- Vault config for admin push. The webhook secret is generated in the DB and
-- VAPID keys are generated once by the admin-push Edge Function, so no key
-- material appears in migrations, logs or the repository.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'admin_push_function_url') THEN
    PERFORM vault.create_secret(
      'https://daerwmqweobyeecbquuh.supabase.co/functions/v1/admin-push',
      'admin_push_function_url');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'admin_push_vapid_subject') THEN
    PERFORM vault.create_secret(
      'https://daerwmqweobyeecbquuh.supabase.co', 'admin_push_vapid_subject');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'admin_push_webhook_secret') THEN
    PERFORM vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'), 'admin_push_webhook_secret');
  END IF;
END;
$$;

-- Stores a VAPID pair only when none exists; returns the effective public key.
CREATE OR REPLACE FUNCTION public.admin_push_store_vapid(p_public text, p_private text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF p_public !~ '^[A-Za-z0-9_-]{80,100}$' OR p_private !~ '^[A-Za-z0-9_-]{40,50}$' THEN
    RAISE EXCEPTION 'invalid vapid key';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('admin_push_vapid'));
  IF private.vault_secret('admin_push_vapid_public') IS NULL THEN
    PERFORM vault.create_secret(p_private, 'admin_push_vapid_private');
    PERFORM vault.create_secret(p_public, 'admin_push_vapid_public');
  END IF;
  RETURN private.vault_secret('admin_push_vapid_public');
END;
$$;
REVOKE ALL ON FUNCTION public.admin_push_store_vapid(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_push_store_vapid(text, text) TO service_role;
