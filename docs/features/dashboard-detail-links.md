# 대시보드 예약·문의 상세 연결

- 최근 고객 문의를 선택하면 해당 ID의 기존 문의 상세 창을 연다.
- 최근 상담 접수는 데스크톱에서 차량명 또는 상세 보기, 모바일에서 카드로 연결한다.
- 신차 상담은 /new-car, 기간 렌트 상담은 /reservations의 record 쿼리를 사용한다.
- 기존 서버 관리자 세션 확인 및 상세 컴포넌트를 재사용한다. DB·계약 변경 없음.

## 검증 (2026-11-23)

- admin: 테스트 54건 통과, TypeScript 통과, lint 오류 없음(기존 StatusChips의 group 미사용 경고 1건).
- web: 테스트 56건 통과, TypeScript 및 lint 통과.
- 양쪽 프로덕션 빌드: Google Fonts의 Inter/Noto Sans KR 다운로드 연결 실패로 완료하지 못함.
- 로그인한 브라우저에서 상세 열기 및 1440px/390px 화면 실측은 미검증.
- admin main에 커밋. push·외부 배포는 수행하지 않음.
