-- 자차보험 설정(관리자 /insurance)을 site_content slug 'insurance'에 저장할 수 있게 허용한다.
-- 기존 RLS(공개분만 anon 읽기, admin/superadmin 쓰기)를 그대로 사용한다.
DO $$
DECLARE c text;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.site_content'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%slug%'
  LOOP
    EXECUTE format('ALTER TABLE public.site_content DROP CONSTRAINT %I', c);
  END LOOP;
END $$;
ALTER TABLE public.site_content
  ADD CONSTRAINT site_content_slug_check CHECK (slug IN (
    'home','benefits','about','info','accident','privacy','terms',
    'contact','new-car','settings','insurance'
  ));
