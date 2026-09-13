-- JIN rollout v1: preserve existing records, add CMS and vehicle attributes.
BEGIN;
CREATE TABLE IF NOT EXISTS public.site_content (
 slug text PRIMARY KEY CHECK (slug in ('home','benefits','about','info','accident','privacy','terms','contact','new-car','settings')),
 title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
 subtitle text NOT NULL DEFAULT '', sections jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(sections)='array'),
 image_url text NOT NULL DEFAULT '', is_published boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.site_content TO anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.site_content TO authenticated;
CREATE POLICY "Published site content" ON public.site_content FOR SELECT TO anon,authenticated USING (is_published);
CREATE POLICY "Admins manage site content" ON public.site_content FOR ALL TO authenticated
 USING (EXISTS(SELECT 1 FROM public.profiles WHERE id=(SELECT auth.uid()) AND role IN ('admin','superadmin')))
 WITH CHECK (EXISTS(SELECT 1 FROM public.profiles WHERE id=(SELECT auth.uid()) AND role IN ('admin','superadmin')));
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS options text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS seats integer CHECK (seats between 1 and 45);
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS manufacturer text NOT NULL DEFAULT '';
-- Profiles may be read by their owner, never self-promoted from a browser.
DROP POLICY IF EXISTS "인증된 사용자는 프로필 조회/수정 가능" ON public.profiles;
CREATE POLICY "Own profile read" ON public.profiles FOR SELECT TO authenticated USING(id=(SELECT auth.uid()));
REVOKE INSERT,UPDATE,DELETE ON public.profiles FROM anon,authenticated;
GRANT SELECT ON public.profiles TO authenticated;
-- Replace known broad mutation policies with role-aware policies.
DROP POLICY IF EXISTS "인증된 사용자만 차량 수정 가능" ON public.vehicles;
DROP POLICY IF EXISTS "인증된 사용자만 이벤트 수정 가능" ON public.events;
DROP POLICY IF EXISTS "인증된 사용자만 공지사항 수정 가능" ON public.notices;
DROP POLICY IF EXISTS "인증된 사용자는 문의 관리 불가능" ON public.inquiries;
DROP POLICY IF EXISTS "Authenticated users can manage reservations" ON public.reservations;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.vehicle_units;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Verified admins manage vehicles" ON public.vehicles FOR ALL TO authenticated
 USING (EXISTS(SELECT 1 FROM public.profiles WHERE id=(SELECT auth.uid()) AND role IN ('admin','superadmin')))
 WITH CHECK (EXISTS(SELECT 1 FROM public.profiles WHERE id=(SELECT auth.uid()) AND role IN ('admin','superadmin')));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.vehicles TO authenticated;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Verified admins manage events" ON public.events FOR ALL TO authenticated
 USING (EXISTS(SELECT 1 FROM public.profiles WHERE id=(SELECT auth.uid()) AND role IN ('admin','superadmin')))
 WITH CHECK (EXISTS(SELECT 1 FROM public.profiles WHERE id=(SELECT auth.uid()) AND role IN ('admin','superadmin')));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.events TO authenticated;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Verified admins manage notices" ON public.notices FOR ALL TO authenticated
 USING (EXISTS(SELECT 1 FROM public.profiles WHERE id=(SELECT auth.uid()) AND role IN ('admin','superadmin')))
 WITH CHECK (EXISTS(SELECT 1 FROM public.profiles WHERE id=(SELECT auth.uid()) AND role IN ('admin','superadmin')));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.notices TO authenticated;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Verified admins manage inquiries" ON public.inquiries FOR ALL TO authenticated
 USING (EXISTS(SELECT 1 FROM public.profiles WHERE id=(SELECT auth.uid()) AND role IN ('admin','superadmin')))
 WITH CHECK (EXISTS(SELECT 1 FROM public.profiles WHERE id=(SELECT auth.uid()) AND role IN ('admin','superadmin')));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.inquiries TO authenticated;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Verified admins manage reservations" ON public.reservations FOR ALL TO authenticated
 USING (EXISTS(SELECT 1 FROM public.profiles WHERE id=(SELECT auth.uid()) AND role IN ('admin','superadmin')))
 WITH CHECK (EXISTS(SELECT 1 FROM public.profiles WHERE id=(SELECT auth.uid()) AND role IN ('admin','superadmin')));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.reservations TO authenticated;
ALTER TABLE public.vehicle_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Verified admins manage vehicle_units" ON public.vehicle_units FOR ALL TO authenticated
 USING (EXISTS(SELECT 1 FROM public.profiles WHERE id=(SELECT auth.uid()) AND role IN ('admin','superadmin')))
 WITH CHECK (EXISTS(SELECT 1 FROM public.profiles WHERE id=(SELECT auth.uid()) AND role IN ('admin','superadmin')));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.vehicle_units TO authenticated;
ALTER TABLE public.vehicle_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Verified admins manage vehicle_categories" ON public.vehicle_categories FOR ALL TO authenticated
 USING (EXISTS(SELECT 1 FROM public.profiles WHERE id=(SELECT auth.uid()) AND role IN ('admin','superadmin')))
 WITH CHECK (EXISTS(SELECT 1 FROM public.profiles WHERE id=(SELECT auth.uid()) AND role IN ('admin','superadmin')));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.vehicle_categories TO authenticated;
CREATE POLICY "Public categories read" ON public.vehicle_categories FOR SELECT TO anon,authenticated USING(true);
GRANT SELECT ON public.vehicle_categories TO anon;
DROP POLICY IF EXISTS "누구나 이벤트 조회 가능" ON public.events;
CREATE POLICY "Public active events" ON public.events FOR SELECT TO anon,authenticated USING(is_active);
DROP POLICY IF EXISTS "본인 문의 조회(필요시) 및 추가" ON public.inquiries;
CREATE POLICY "Public inquiry submission" ON public.inquiries FOR INSERT TO anon,authenticated
 WITH CHECK(status='pending' AND answer_content IS NULL AND answered_by IS NULL AND answered_at IS NULL AND char_length(user_name) BETWEEN 2 AND 80 AND user_phone ~ '^0[0-9 -]{8,20}$' AND char_length(content) BETWEEN 5 AND 5000);
DROP POLICY IF EXISTS "Anyone can insert reservations" ON public.reservations;
CREATE POLICY "Public consultation submission" ON public.reservations FOR INSERT TO anon,authenticated
 WITH CHECK(status='pending' AND char_length(user_name) BETWEEN 2 AND 80 AND user_phone ~ '^0[0-9 -]{8,20}$' AND char_length(car_name) BETWEEN 1 AND 160);
CREATE INDEX IF NOT EXISTS reservations_created_idx ON public.reservations(created_at DESC);
CREATE INDEX IF NOT EXISTS inquiries_created_idx ON public.inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS vehicle_units_vehicle_idx ON public.vehicle_units(vehicle_id);
INSERT INTO public.site_content(slug,title,subtitle,sections,image_url,is_published) VALUES ('home','30년 이상 한길을 걸어온 렌터카,
믿음으로 선택받는 진렌트카','고객님을 위한 합리적인 선택.
오랜 경험과 철저한 차량 관리로 믿을 수 있는 서비스를 제공합니다.','[]'::jsonb,'/images/figma/home-hero.png',true) ON CONFLICT(slug) DO NOTHING;
INSERT INTO public.site_content(slug,title,subtitle,sections,image_url,is_published) VALUES ('benefits','비교할 수 없는 신뢰와 독보적 편의성','JIN RENTAL CAR ADVANTAGE','[{"title": "무심사 렌트", "body": "개인별 상황에 맞는 이용 조건을 상담해 드립니다."}, {"title": "최저가 보장", "body": "필요한 기간에 맞춰 합리적인 렌트 요금을 안내합니다."}, {"title": "철저한 정비", "body": "차량 상태를 꼼꼼히 확인하고 안전한 운행을 돕습니다."}, {"title": "무료 탁송 서비스", "body": "차량 인수 장소와 탁송 가능 지역을 상담해 주세요."}]'::jsonb,'',true) ON CONFLICT(slug) DO NOTHING;
INSERT INTO public.site_content(slug,title,subtitle,sections,image_url,is_published) VALUES ('settings','진렌트카','고객님의 편안하고 안전한 여정을 함께합니다.','[{"title": "전화번호", "body": ""}, {"title": "상담시간", "body": "AM 08:30 ~ PM 08:00"}, {"title": "주소", "body": "성남대로 1133 메트로칸 오피스 426호"}, {"title": "대표자", "body": "우명미"}, {"title": "사업자등록번호", "body": ""}, {"title": "카카오 채널", "body": ""}, {"title": "네이버 톡톡", "body": ""}]'::jsonb,'',true) ON CONFLICT(slug) DO NOTHING;
INSERT INTO public.site_content(slug,title,subtitle,sections,image_url,is_published) VALUES ('contact','1:1 문의','내용을 남겨주시면 담당자가 확인 후 연락드리겠습니다.','[]'::jsonb,'',true) ON CONFLICT(slug) DO NOTHING;
INSERT INTO public.site_content(slug,title,subtitle,sections,image_url,is_published) VALUES ('new-car','신차 장기렌트','원하시는 차량과 조건으로 맞춤 상담을 받아보세요.','[]'::jsonb,'',true) ON CONFLICT(slug) DO NOTHING;
INSERT INTO public.site_content(slug,title,subtitle,sections,image_url,is_published) VALUES ('about','고객과 함께하는 진렌트카','30년이 넘는 시간 동안 고객과 함께해온 진렌트카. 오랜 경험에서 나오는 전문성과 정직한 서비스, 철저한 차량 관리로 언제나 믿고 이용할 수 있는 렌트카 서비스를 제공합니다. 고객의 안전과 만족을 최우선으로 생각하며 앞으로도 변함없는 신뢰를 이어가겠습니다.
대표이사 우명미','[{"title": "회사 위치", "body": "주소\n성남대로 1133 메트로칸 오피스 426호 주식회사진렌트카"}]'::jsonb,'',false) ON CONFLICT(slug) DO NOTHING;
INSERT INTO public.site_content(slug,title,subtitle,sections,image_url,is_published) VALUES ('info','이용안내','진렌트카와 함께하는 특별한 여정, 쉽고 빠른 대여 방법을 안내해 드립니다.','[{"title": "대여절차", "body": ""}, {"title": "주의사항", "body": ""}, {"title": "영업시간", "body": "AM 08:30 ~ PM 08:00"}, {"title": "자차보험 안내", "body": "종합보험(대인, 대물, 자손) 기본 포함 자차보험 선택사항 (1일 5,000~30,000원)"}, {"title": "연료 규정", "body": "인수 시점 연료량만큼 충전 반납 필요 부족 시 칸당 LPG 1.5만원, 경유 2.0만원"}, {"title": "초과요금 안내", "body": "주간 (08:00~20:00) 시간당 1.0만원\n야간 (20:00~익일 08:30) 3~5만원"}, {"title": "제3자 운전 절대 금지", "body": "타인 운전 시 보험 혜택을 전혀 받으실 수 없습니다."}, {"title": "사고 시 자기부담금 규정", "body": "1 대인/대물/자손 각 50만원 (가해자 과실 시)\n2 자차 수리비 및 차량 감가 상응액\n3 수리 기간 영업 손실금 (1일 대여료의 50%)"}, {"title": "기타 서비스 안내", "body": "즐겁고 안전한 여행이 될 수 있도록 진렌트카가 항상 함께하겠습니다."}]'::jsonb,'',false) ON CONFLICT(slug) DO NOTHING;
INSERT INTO public.site_content(slug,title,subtitle,sections,image_url,is_published) VALUES ('accident','사고보험대차 서비스','자동차 사고 발생 시 보험사 보상으로 이용하는 렌터카 서비스
자동차 사고로 인한 파손 등 모든 파손의 경우, 수리기간 동안 불편을 최소화해 피해고객님께서 편하고 안전하게 사용하는 서비스입니다.','[{"title": "사고보험대차란?", "body": "수리비 부담없는 \"100% 무과실\""}, {"title": "대여 자격", "body": ""}, {"title": "단기대여", "body": "• 만 21세 이상, 2종 보통면허 이상 소지자"}, {"title": "사고보험대차", "body": "• 만 21세 이상, 2종 보통면허 이상 소지자\n• 렌터카 이용 : 수리 기간, 최대 30일 이내 규정"}, {"title": "사고보험대차 서비스 강점", "body": "진렌트카만의 특별한 혜택을 만나보세요."}, {"title": "전국 최대 영업망", "body": "365일 연중무휴 24시간 언제 어디서든 신속한 배차"}, {"title": "CDW 무상가입", "body": "자차 손해면책제도(CDW) 무상가입 지원"}, {"title": "딜리버리 서비스", "body": "사고 현장, 자택, 직장 등 고객님이 원하시는 곳으로 신속 배차 (고객센터: 1588-0000)"}, {"title": "내비게이션 지원", "body": "전 차량 내비게이션 무상 장착"}, {"title": "대여 절차", "body": ""}, {"title": "지불보증 및 보상범위", "body": ""}, {"title": "지불보증", "body": ""}, {"title": "무과실 피해자 (100% 피해 사고)", "body": "상대방 보험사에서 100% 보상\n자부담: 0원"}, {"title": "쌍방과실 피해자 _", "body": "피해자 과실분만큼 본인 부담\n자차 보험 가입 시 자차 처리 가능"}, {"title": "사고보험대차 대여 중 사고 발생", "body": "차량대여 중 고객님의 과실로 인하여 렌터카 차량에 사고가 발생한 경우, 자차 손해면책제도(CDW)에 가입하셨다면 고객님의 책임 부담금만 내시면 사고처리가 가능합니다."}, {"title": "보상범위", "body": "대인 무한\n대물 2천만원\n자손 1천만원"}, {"title": "CDW 범위", "body": "자차 면책금 30만원\n휴차보상료 -"}, {"title": "면책 보상불가", "body": "• 사고 미신고\n• 음주 및 약물 운전\n• 무면허 운전 등 렌터카 임대차계약서 상의 금지사항 위반 시"}]'::jsonb,'',false) ON CONFLICT(slug) DO NOTHING;
INSERT INTO public.site_content(slug,title,subtitle,sections,image_url,is_published) VALUES ('privacy','개인정보 처리방침','진렌트카(이하 ''회사''라 함)는 고객의 개인정보를 소중하게 생각하며, "개인정보보호법" 등 관련 법령을 준수하고 있습니다. 회사는 개인정보 처리방침을 통하여 고객께서 제공하시는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.','[{"title": "1. 수집하는 개인정보의 항목 및 수집 방법", "body": "수집 항목: 성명, 연락처(휴대전화번호), 이메일 주소, 서비스 이용기록, 접속 로그, IP 정보 등\n수집 방법: 홈페이지 내 1:1 문의 게시판, 차량 예약/상담 폼 작성"}, {"title": "2. 개인정보의 수집 및 이용 목적", "body": "상담 및 문의 처리: 고객의 문의사항 확인, 답변 전달 및 상담 진행\n서비스 제공: 렌터카 예약 접수, 요금 안내, 차량 배차 및 회수 관련 연락\n마케팅 및 광고 (동의 시): 이벤트 정보 안내, 신규 서비스 안내"}, {"title": "3. 개인정보의 보유 및 이용 기간", "body": "원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 전자상거래 등에서의 소비자보호에 관한 법률 등 관계 법령의 규정에 의하여 보존할 필요가 있는 경우, 회사는 일정 기간 동안 회원정보를 보관합니다.\n소비자의 불만 또는 분쟁처리에 관한 기록: 3년\n계약 또는 청약철회 등에 관한 기록: 5년\n대금결제 및 재화 등의 공급에 관한 기록: 5년"}, {"title": "4. 개인정보의 파기 절차 및 방법", "body": "이용목적이 달성된 개인정보는 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라(보유 및 이용기간 참조) 일정 기간 저장된 후 파기됩니다. 전자적 파일 형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다."}, {"title": "5. 정보주체의 권리와 그 행사 방법", "body": "고객은 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며 삭제를 요청할 수 있습니다. 고객센터로 서면, 전화 또는 이메일로 연락하시면 지체 없이 조치하겠습니다."}, {"title": "6. 개인정보 보호책임자", "body": "고객의 개인정보를 보호하고 관련 불만을 처리하기 위하여 다음과 같이 개인정보 보호책임자를 지정하고 있습니다.\n개인정보 보호책임자: 진렌트카 대표이사\n전화번호: 1588-0000\n이메일: privacy@jinrental.com\n본 개인정보 처리방침은 2024년 1월 1일부터 적용됩니다."}]'::jsonb,'',false) ON CONFLICT(slug) DO NOTHING;
INSERT INTO public.site_content(slug,title,subtitle,sections,image_url,is_published) VALUES ('terms','서비스 이용약관','','[{"title": "제1조 (목적)", "body": "본 약관은 진렌트카(이하 ''회사''라 합니다)가 제공하는 렌터카 대여 서비스 및 관련 부대서비스(이하 ''서비스''라 합니다)의 이용과 관련하여 회사와 고객(이하 ''임차인''이라 합니다) 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다."}, {"title": "제2조 (용어의 정의)", "body": "본 약관에서 사용하는 용어의 정의는 다음과 같습니다.\n임차인: 회사와 자동차 대여계약을 체결하고 렌터카를 대여받는 자\n대여요금: 임차인이 렌터카 대여의 대가로 회사에 지급하는 요금\n차량 대여계약: 본 약관을 바탕으로 회사와 임차인 간에 체결하는 렌터카 대여에 관한 계약"}, {"title": "제3조 (대여 자격)", "body": "회사는 다음 각 호의 어느 하나에 해당하는 자에게는 대여계약 체결을 거절할 수 있습니다.\n대여할 렌터카를 운전할 수 있는 유효한 운전면허증을 소지하지 않은 자\n만 21세 미만이거나 운전경력이 1년 미만인 자 (단, 차량 등급에 따라 기준이 상이할 수 있음)\n과거 대여요금 체납이나 대여계약 위반 이력이 있는 자\n음주 상태이거나 정상적인 운전이 불가능하다고 판단되는 자"}, {"title": "제4조 (예약 및 취소)", "body": "임차인은 홈페이지, 앱, 전화 등을 통해 예약을 신청할 수 있으며, 회사가 이를 승낙함으로써 예약이 성립됩니다. 임차인의 사정으로 예약을 취소할 경우, 회사 규정에 따른 취소 수수료가 발생할 수 있습니다.\n대여 일시 24시간 이전 취소: 전액 환불\n대여 일시 24시간 이내 취소: 대여요금의 10% 공제 후 환불\n대여 당일 및 노쇼(No-show): 대여요금의 30% 공제 후 환불"}, {"title": "제5조 (차량의 인수 및 반납)", "body": "임차인은 예약된 시간에 지정된 장소에서 차량을 인수하고 반납해야 합니다.\n차량 인수 시 회사와 임차인은 공동으로 차량의 외관 상태 및 연료량을 확인합니다.\n반납 시 임차인은 차량을 인수 당시의 상태로 반환해야 하며, 초과 이용 시간에 대해서는 추가 요금이 부과됩니다."}, {"title": "제6조 (사고 처리 및 보험)", "body": "차량 대여 중 사고가 발생한 경우, 임차인은 즉시 회사 및 경찰에 신고하여야 합니다. 회사는 모든 차량에 대하여 자동차 종합보험(대인, 대물, 자손)에 가입하고 있으며, 임차인은 계약 시 선택한 자차손해면책제도(CDW)에 따라 수리비 및 휴차보상료를 면책받거나 부담할 수 있습니다. 단, 임차인의 고의, 중과실, 음주운전 등으로 인한 사고 시 보험 혜택을 받을 수 없습니다."}, {"title": "제7조 (관할법원)", "body": "본 약관 또는 대여계약과 관련하여 발생한 분쟁에 대한 소송은 회사의 본점 소재지를 관할하는 법원을 제1심 관할법원으로 합니다.\n본 약관은 2024년 1월 1일부터 적용됩니다."}]'::jsonb,'',false) ON CONFLICT(slug) DO NOTHING;
COMMIT;
