-- 정가와 별도의 월렌트 특별가 및 한국 날짜 기준 적용 기간.
alter table public.vehicles
  add column monthly_special_price integer,
  add column monthly_special_starts_on date,
  add column monthly_special_ends_on date,
  add constraint vehicles_monthly_special_price_check
    check (monthly_special_price is null or
      (monthly_special_price > 0 and monthly_special_price < price_monthly)),
  add constraint vehicles_monthly_special_period_check
    check (monthly_special_starts_on is null or monthly_special_ends_on is null or
      monthly_special_starts_on <= monthly_special_ends_on);

comment on column public.vehicles.monthly_special_price is '월렌트 특별가(원). 기간 내 월 요금에만 적용';
comment on column public.vehicles.monthly_special_starts_on is '특별가 시작일(한국 날짜, 포함)';
comment on column public.vehicles.monthly_special_ends_on is '특별가 종료일(한국 날짜, 포함)';
