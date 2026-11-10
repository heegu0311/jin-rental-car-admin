alter table public.vehicles add column if not exists deposit_amount integer;
alter table public.vehicles add constraint vehicles_deposit_amount_nonnegative check (deposit_amount is null or deposit_amount >= 0);
