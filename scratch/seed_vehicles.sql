-- 진렌트카 차량 데이터 시딩 SQL (Supabase/PostgreSQL용)
-- (주의: supabase_setup.sql이 먼저 실행되어 vehicles 테이블이 생성되어 있어야 합니다.)

-- 기존 데이터 초기화 (필요시)
-- TRUNCATE public.vehicles CASCADE;

INSERT INTO public.vehicles (name, type, fuel, year, price_daily, price_weekly, price_monthly, badge, condition, image_url, status) VALUES
('아반떼', '준중형', '휘발유', 2023, 55000, 36000, 18300, '인기', '비흡연/실내크리닝', 'https://images.unsplash.com/photo-1590362891991-f20dc2368a96?auto=format&fit=crop&w=800&q=80', 'available'),
('아반떼', '준중형', '휘발유', 2024, 58000, 38000, 19300, '신차급', '비흡연/완벽점검', 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?auto=format&fit=crop&w=800&q=80', 'available'),
('아반떼', '준중형', '휘발유', 2025, 62000, 41000, 20600, '신차', '비흡연/완벽점검', 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80', 'available'),
('K3', '준중형', '휘발유', 2024, 52000, 34000, 17300, '경제적', '비흡연/실내크리닝', 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80', 'available'),
('모닝', '경차', '휘발유', 2022, 35000, 23000, 11600, '특가', '비흡연/실내크리닝', 'https://images.unsplash.com/photo-1606132402127-1426eb84788c?auto=format&fit=crop&w=800&q=80', 'available'),
('레이', '경차', '휘발유', 2022, 38000, 25000, 12600, '인기', '비흡연/실내크리닝', 'https://images.unsplash.com/photo-1606132402127-1426eb84788c?auto=format&fit=crop&w=800&q=80', 'available'),
('K5', '중형', '휘발유', 2023, 65000, 43000, 21600, '스테디셀러', '비흡연/완벽점검', 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80', 'available'),
('K5', '중형', 'LPG', 2023, 63000, 42000, 21000, '저렴한연비', '비흡연/완벽점검', 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80', 'available'),
('K5', '중형', '휘발유', 2025, 72000, 48000, 24000, '신차', '비흡연/완벽점검', 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80', 'available'),
('소나타', '중형', '휘발유', 2023, 68000, 45000, 22600, NULL, '비흡연/실내크리닝', 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=800&q=80', 'available'),
('소나타', '중형', 'LPG', 2024, 66000, 44000, 22000, NULL, '비흡연/실내크리닝', 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=800&q=80', 'available'),
('K8', '대형', 'LPG', 2022, 82000, 54000, 27300, '럭셔리', '비흡연/완벽점검', 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?auto=format&fit=crop&w=800&q=80', 'available'),
('더 뉴 그랜저', '대형', 'LPG', 2021, 78000, 52000, 26000, NULL, '비흡연/실내크리닝', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80', 'available'),
('그랜져', '대형', '휘발유', 2025, 95000, 63000, 31600, '최고급', '비흡연/완벽점검', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80', 'available'),
('G80', '대형', '휘발유', 2023, 120000, 80000, 40000, '프리미엄', '비흡연/VIP점검', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80', 'available'),
('셀토스', '소형SUV', '휘발유', 2024, 59000, 39000, 19600, '인기SUV', '비흡연/실내크리닝', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80', 'available'),
('셀토스', '소형SUV', '휘발유', 2025, 63000, 42000, 21000, '신차', '비흡연/완벽점검', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80', 'available'),
('니로 하이브리드', '소형SUV', '하이브리드', 2022, 58000, 38000, 19300, '연비최강', '비흡연/실내크리닝', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80', 'available'),
('QM6', 'SUV', 'LPG', 2022, 65000, 43000, 21600, NULL, '비흡연/실내크리닝', 'https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?auto=format&fit=crop&w=800&q=80', 'available'),
('스포티지', 'SUV', '휘발유', 2025, 78000, 52000, 26000, '추천', '비흡연/완벽점검', 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80', 'available'),
('싼타페', 'SUV', '경유', 2021, 72000, 48000, 24000, NULL, '비흡연/실내크리닝', 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=800&q=80', 'available'),
('싼타페', 'SUV', '휘발유', 2025, 88000, 58000, 29300, '풀체인지', '비흡연/완벽점검', 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=800&q=80', 'available'),
('쏘렌토', 'SUV', '휘발유', 2023, 79000, 52000, 26300, '패밀리카', '비흡연/실내크리닝', 'https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?auto=format&fit=crop&w=800&q=80', 'available'),
('쏘렌토', 'SUV', '휘발유', 2024, 84000, 56000, 28000, '신차급', '비흡연/완벽점검', 'https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?auto=format&fit=crop&w=800&q=80', 'available'),
('쏘렌토', 'SUV', '휘발유', 2025, 89000, 59000, 29600, '신차', '비흡연/완벽점검', 'https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?auto=format&fit=crop&w=800&q=80', 'available'),
('스타렉스', '승합차', '경유', 2019, 55000, 36000, 18300, NULL, '비흡연/실내크리닝', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', 'available'),
('스타렉스', '승합차', '경유', 2020, 58000, 38000, 19300, NULL, '비흡연/실내크리닝', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', 'available'),
('카니발', '승합차', '경유', 2020, 72000, 48000, 24000, '특가', '비흡연/실내크리닝', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', 'available'),
('카니발', '승합차', '휘발유', 2023, 89000, 59000, 29600, '인기', '비흡연/실내크리닝', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', 'available'),
('스타리아', '승합차', '경유', 2022, 85000, 56000, 28300, NULL, '비흡연/실내크리닝', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', 'available'),
('스타리아', '승합차', '경유', 2025, 98000, 65000, 32600, '최신', '비흡연/완벽점검', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', 'available');
