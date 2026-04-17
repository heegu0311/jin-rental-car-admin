-- 진렌트카 Supabase 초기 셋업 SQL 스크립트

-- ==========================================
-- 1. 관리자 프로필 테이블 (profiles)
-- ==========================================
-- auth.users와 1:1 매칭되는 테이블입니다.
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. 차량 정보 테이블 (vehicles)
-- ==========================================
-- 차량 목록, 가격 정책, 상태 등을 관리합니다.
CREATE TABLE vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- (예: 경차, 소형, 중형, 대형, SUV, 승합차)
  fuel TEXT,          -- (예: 휘발유, LPG, 경유, 전기)
  year INTEGER NOT NULL,
  price_daily INTEGER NOT NULL,
  price_weekly INTEGER NOT NULL,
  price_monthly INTEGER NOT NULL,
  badge TEXT,         -- (예: 인기, 신차, 특가)
  condition TEXT,     -- (예: 비흡연/완벽점검)
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 3. 이벤트 (팝업/배너) 테이블 (events)
-- ==========================================
-- 홈페이지에 표시될 이벤트와 팝업을 관리합니다.
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 4. 공지사항 테이블 (notices)
-- ==========================================
-- 에디터(TipTap/Quill 등)로 작성된 내용을 저장합니다.
CREATE TABLE notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- 에디터에서 생성된 HTML/JSON 등이 들어감
  is_pinned BOOLEAN DEFAULT false, -- 상단 고정 여부
  author_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 5. 1:1 문의 테이블 (inquiries)
-- ==========================================
-- 고객이 웹에서 남긴 문의 처리 및 답변을 관리합니다.
CREATE TABLE inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  user_email TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'answered')),
  answer_content TEXT,
  answered_by UUID REFERENCES profiles(id),
  answered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 6. Updated_at 자동 갱신 트리거 생성
-- ==========================================
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_notices_updated_at BEFORE UPDATE ON notices FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- ==========================================
-- 7. RLS(Row Level Security) 설정
-- ==========================================
-- 관리자 시스템이므로 우선 인증된 사용자(admin)에게 모든 권한을 부여합니다.
-- (실제 운영 시에는 role 확인 조건을 추가하면 더욱 안전합니다.)

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "인증된 사용자는 프로필 조회/수정 가능" ON profiles FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "누구나 차량 조회 가능" ON vehicles FOR SELECT USING (true);
CREATE POLICY "인증된 사용자만 차량 수정 가능" ON vehicles FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "누구나 이벤트 조회 가능" ON events FOR SELECT USING (true);
CREATE POLICY "인증된 사용자만 이벤트 수정 가능" ON events FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "누구나 공지사항 조회 가능" ON notices FOR SELECT USING (true);
CREATE POLICY "인증된 사용자만 공지사항 수정 가능" ON notices FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 문의 조회(필요시) 및 추가" ON inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "인증된 사용자는 문의 관리 불가능" ON inquiries FOR ALL USING (auth.role() = 'authenticated'); -- 어드민만 확인/수정 가능하도록

-- ==========================================
-- 8. 회원가입 시 profile 자동 생성 트리거 (선택사항)
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'admin');
  RETURN new;
END;
$$ LANGUAGE plpgsql security definer;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
