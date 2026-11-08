# 월렌트 특가 차량 — 2026-11-08

- 차량 등록/편집의 ‘월렌트 특가 차량’을 체크하면 홈 특가 목록에 노출된다. 해제하면 제외되고 마지막 지정 차량을 해제하면 섹션 전체가 숨겨진다.
- 일반 배지·월 요금과 별도인 `vehicles.is_monthly_special boolean not null default false`를 사용한다. 기존 차량을 자동으로 특가로 지정하지 않는다. 목록의 카드/표에도 지정 상태를 표시한다.
- `supabase/migrations/20261107172801_vehicle_monthly_special.sql`을 연결 환경 `daerwmqweobyeecbquuh`에 적용 완료. 적용 전 dry-run으로 이번 파일만 대기 중임을 확인했다. 기존 RLS·권한·차량·가격을 보존했다.
- 차량 편집 저장을 서버 액션 `app/(dashboard)/vehicles/actions.ts`로 연결했다. 서버 세션·profiles.role을 확인하고 기존 RLS로 저장한다. 서버에서 지정 여부의 참거짓 형식 및 기존 차량 입력 검증을 수행한다. 중복 제출은 공통 useSubmitLock, 실패는 편집 상태 유지와 오류 표시로 처리한다.
- 저장 후 기존 refreshPublicSiteOrNotify로 고객 사이트 즉시 갱신을 요청한다. 갱신 실패 시 최대 3시간 지연 안내를 유지한다.
- 두 저장소 contracts.ts의 차량 필드를 동일하게 갱신했다.

검증: 양쪽 테스트 51개씩, 타입 검사·린트·빌드 통과(web 기존 Hero 미사용 import 경고 1건). 지정/해제/미지정 왕복·잘못된 참거짓 입력 및 한국 시간 월 경계를 테스트했다. 연결 DB에서 실제 관리자 RLS 지정·해제, 익명 수정 차단을 트랜잭션으로 검사하고 rollback했다. 운영 데이터에는 테스트 설정을 남기지 않았다. 관리자 로그인 브라우저 저장은 미실시다.

홈은 1440px/390px에서 0건 숨김과 fixture 기반 2건 노출·추천 목록 앞 순서·가로 넘침 없음을 확인했다. 자세한 실측과 스크린샷은 web의 docs/features/monthly-special-vehicles.md 및 artifacts/monthly-special/에 기록했다.

각 저장소 main에서 관련 변경만 커밋한다. 다른 동시 작업의 변경·스테이징은 보존하며 Git push·외부 앱 배포는 수행하지 않는다. 연결 DB 마이그레이션만 적용했다.
