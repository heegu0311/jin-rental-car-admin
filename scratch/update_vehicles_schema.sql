-- public.vehicles 테이블 스키마 업데이트 (실제 운영 환경용 ALTER 문)

-- 1. 새로운 컬럼 추가
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS fuel TEXT,
ADD COLUMN IF NOT EXISTS badge TEXT,
ADD COLUMN IF NOT EXISTS condition TEXT;

-- 2. 컬럼 설명 추가 (선택 사항)
COMMENT ON COLUMN public.vehicles.fuel IS '연료 종류 (휘발유, LPG, 경유, 전기 등)';
COMMENT ON COLUMN public.vehicles.badge IS '인기, 신차, 특가 등 요약 배지';
COMMENT ON COLUMN public.vehicles.condition IS '차량 상태 요약 (비흡연, 완벽점검 등)';
