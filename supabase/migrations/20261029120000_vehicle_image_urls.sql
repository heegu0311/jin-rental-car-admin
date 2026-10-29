-- 차량별 사진 여러 장(최대 10장)을 순서대로 저장한다. 첫 장이 대표 사진이며 image_url에도 같은 값을 둔다.
-- 기존 vehicles RLS(공개 읽기, admin 쓰기)를 그대로 사용한다. 기존 대표 사진은 1장짜리 목록으로 채운다.
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}'
    CHECK (cardinality(image_urls) <= 10);

UPDATE public.vehicles
SET image_urls = ARRAY[image_url]
WHERE cardinality(image_urls) = 0
  AND image_url IS NOT NULL
  AND image_url <> '';
