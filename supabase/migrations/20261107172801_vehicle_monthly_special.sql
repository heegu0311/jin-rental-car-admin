-- 기존 차량은 관리자가 명시적으로 지정할 때까지 특가 목록에서 제외한다.
alter table public.vehicles
  add column is_monthly_special boolean not null default false;

comment on column public.vehicles.is_monthly_special
  is '관리자가 지정한 월렌트 특가 차량. 기존 월 요금으로 메인 특가 목록에 표시.';
-- vehicles의 기존 관리자 쓰기 / 공개 읽기 RLS를 그대로 적용한다.
