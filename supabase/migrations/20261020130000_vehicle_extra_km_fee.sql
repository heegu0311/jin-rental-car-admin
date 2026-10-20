-- 약정 주행거리 초과 시 100km당 추가 요금을 차종(차량)별로 저장한다. 미입력이면 고객에게 범위 안내 문구를 보여준다.
-- 기존 vehicles RLS(공개 읽기, admin 쓰기)를 그대로 사용한다.
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS extra_km_fee integer
    CHECK (extra_km_fee BETWEEN 0 AND 10000000);
