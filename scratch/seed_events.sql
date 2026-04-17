-- 이벤트 예시 데이터 추가 SQL
INSERT INTO events (
  title, 
  description, 
  image_url, 
  start_date, 
  end_date, 
  is_active
) VALUES (
  '[봄맞이] 전 차종 주말 대여 15% 특별 할인!', 
  '<h1>봄맞이 드라이브, 진렌트카와 함께하세요!</h1><p>따뜻한 봄날, 소중한 사람들과의 여행을 위해 진렌트카가 특별한 혜택을 준비했습니다.</p><h2>이벤트 안내</h2><ul><li><strong>대상:</strong> 전 차종 대여 고객</li><li><strong>기간:</strong> 2026년 4월 1일 ~ 5월 31일</li><li><strong>혜택:</strong> 주말(금-일) 대여 시 15% 현장 할인</li></ul><p>지금 바로 예약하고 즐거운 봄나들이를 떠나보세요!</p>', 
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80', 
  '2026-04-01T00:00:00Z', 
  '2026-05-31T23:59:59Z', 
  true
);

INSERT INTO events (
  title, 
  description, 
  image_url, 
  start_date, 
  end_date, 
  is_active
) VALUES (
  '[이벤트] 신규 회원 가입 시 5,000원 쿠폰 증정', 
  '<h1>환영합니다! 진렌트카 신규 회원님</h1><p>지금 진렌트카에 가입하시면 즉시 사용 가능한 5,000원 할인 쿠폰을 드립니다.</p><h2>쿠폰 사용 방법</h2><ol><li>진렌트카 회원가입 완료</li><li>마이페이지 -> 쿠폰함에서 확인</li><li>예약 시 쿠폰 적용</li></ol><p>더 빠르고 간편한 렌트 서비스, 진렌트카를 만나보세요.</p>', 
  'https://images.unsplash.com/photo-1563906267088-b029e7101114?auto=format&fit=crop&w=1200&q=80', 
  '2026-01-01T00:00:00Z', 
  '2026-12-31T23:59:59Z', 
  true
);

INSERT INTO events (
  title, 
  description, 
  image_url, 
  start_date, 
  end_date, 
  is_active
) VALUES (
  '[안내] 장기 렌트 고객 대상 무료 세차 서비스 실시', 
  '<h1>쾌적한 운전 환경을 위한 무료 세차 서비스</h1><p>한 달 이상 장기 렌트를 이용하시는 고객님들께 월 1회 무료 내외관 세차 서비스를 제공합니다.</p><h2>이용 안내</h2><ul><li><strong>대상:</strong> 30일 이상 장기 대여 고객</li><li><strong>일정:</strong> 대여 기간 중 매월 1회</li><li><strong>방법:</strong> 진렌트카 제휴 세차장 방문 (사전 예약 필수)</li></ul><p>진렌트카는 항상 고객님의 쾌적한 이동을 응원합니다.</p>', 
  'https://images.unsplash.com/photo-1605164599901-f89ff179be38?auto=format&fit=crop&w=1200&q=80', 
  '2026-03-01T00:00:00Z', 
  '2026-12-31T23:59:59Z', 
  true
);
