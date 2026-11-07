-- Product requirement: password recovery reports whether the supplied address
-- belongs to an active admin. Expose only this boolean, never profile rows.
-- The privileged lookup remains outside the Data API's public schema.
create schema if not exists private;

create or replace function private.is_admin_recovery_email(email_input text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when email_input is null or length(email_input) > 254
      or position('@' in email_input) < 2 then false
    else exists (
      select 1
      from auth.users as u
      join public.profiles as p on p.id = u.id
      where lower(u.email) = lower(btrim(email_input))
        and p.role in ('admin', 'superadmin')
        and u.deleted_at is null
        and (u.banned_until is null or u.banned_until <= now())
    )
  end;
$$;

revoke all on function private.is_admin_recovery_email(text) from public;
grant usage on schema private to anon, authenticated, service_role;
grant execute on function private.is_admin_recovery_email(text) to anon, authenticated, service_role;

create or replace function public.is_admin_recovery_email(email_input text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.is_admin_recovery_email(email_input);
$$;

revoke all on function public.is_admin_recovery_email(text) from public;
grant execute on function public.is_admin_recovery_email(text) to anon, authenticated, service_role;

comment on function public.is_admin_recovery_email(text) is
  'Pre-login recovery eligibility for one exact email. Returns only a boolean; intentionally distinguishes non-admin addresses.';
