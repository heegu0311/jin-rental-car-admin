-- 자차보험 요금을 차량 배기량 구간별로, 승합차는 별도 요금으로 적용하기 위해 차량에 배기량·승합 여부를 저장한다.
-- 구간·요금 자체는 기존처럼 site_content slug 'insurance'에 저장한다. 기존 vehicles RLS(공개 읽기, admin 쓰기)를 그대로 사용한다.
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS displacement_cc integer
    CHECK (displacement_cc BETWEEN 0 AND 20000),
  ADD COLUMN IF NOT EXISTS is_van boolean NOT NULL DEFAULT false;

-- 기존 승합 카테고리 차량은 승합 요금 대상으로 표시한다. 배기량은 관리자가 차량별로 입력한다.
UPDATE public.vehicles SET is_van = true
WHERE is_van = false AND btrim(type) LIKE '승합%';
