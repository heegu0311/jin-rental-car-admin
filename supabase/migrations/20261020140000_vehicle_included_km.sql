-- 일/주/월 대여료에 포함된 기본 약정 주행거리(km)를 차량별로 저장한다. 미입력이면 상담 안내로 표시한다.
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS km_daily integer CHECK (km_daily BETWEEN 0 AND 100000),
  ADD COLUMN IF NOT EXISTS km_weekly integer CHECK (km_weekly BETWEEN 0 AND 100000),
  ADD COLUMN IF NOT EXISTS km_monthly integer CHECK (km_monthly BETWEEN 0 AND 100000);
