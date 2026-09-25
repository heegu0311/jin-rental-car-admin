# admin / 33-admin-push

관리자 모바일 PWA 푸시 알림. 고객 이벤트(예약 상담·신차 상담·고객 문의 접수)가 생기면 알림을 켠 관리자 기기로 Web Push를 보낸다.

## 구조

1. web이 `reservations` / `inquiries`에 insert한다. web 코드와 계약은 변경하지 않았다.
2. AFTER INSERT 트리거 `private.notify_admin_push()`가 알림 문구를 만들고 `pg_net`으로 Edge Function `admin-push`를 호출한다. 호출 실패는 무시하므로 고객 접수를 막지 않는다.
3. `admin-push`(verify_jwt 끔, Vault 공유 비밀 `x-push-secret` 검증)가 `admin_push_dispatch_context`로 VAPID 키와 현재 admin/superadmin 구독을 받아 `web-push`로 전송한다. 404/410 구독은 삭제한다.
4. admin 헤더의 종 아이콘에서 기기별로 알림 켜기/끄기/테스트 알림. 구독 등록·해제는 서버 액션(`requireAdmin`) → role 검사 RPC.

- 잠금화면 문구에는 고객 이름·연락처·내용을 넣지 않는다. 차량명·기간 또는 문의 분류만 표시하고, 누르면 해당 관리 목록(`/reservations`, `/new-car`, `/inquiries`)을 연다.
- 비밀 값은 모두 Supabase Vault: `admin_push_function_url`, `admin_push_webhook_secret`(DB에서 생성), `admin_push_vapid_public/private`(Edge Function이 최초 1회 생성), `admin_push_vapid_subject`. 저장소·마이그레이션·로그에 키가 없다. 환경변수 추가 없음.
- PWA: `app/manifest.ts`, `public/sw.js`(알림 전용, 오프라인 캐시 없음), 아이콘 `pwa-icon-192/512.png`, `apple-touch-icon.png`. `proxy.ts`에서 `sw.js`, `manifest.webmanifest`는 로그인 리다이렉트 제외.

## 적용 (운영 프로젝트 `daerwmqweobyeecbquuh`, 2026-09-25)

- 마이그레이션 `admin_push_notifications` → `supabase/migrations/20260925090000_admin_push_notifications.sql` (pg_net 활성화, 구독 테이블·RLS, 트리거, RPC)
- 마이그레이션 `admin_push_vault_config` → `supabase/migrations/20260925093000_admin_push_vault_config.sql`
- Edge Function `admin-push` v2 배포 (`supabase/functions/admin-push/index.ts`). `{"provision":true}` 호출로 VAPID 키 생성 완료.
- 보안 진단: 새 함수 4개가 authenticated 실행 가능 경고(0029) — 함수 내부에서 admin role을 검사하는 의도된 RPC. anon 실행 경고 없음.

## 사용 방법

- Android Chrome: 관리자 사이트 접속 → 종 아이콘 → 알림 켜기 → 권한 허용 → 테스트 알림.
- iPhone(iOS 16.4+): Safari 공유 → 홈 화면에 추가 → 설치된 앱으로 로그인 → 종 아이콘 → 알림 켜기. Safari 탭에서는 푸시가 동작하지 않는다.
- 푸시는 HTTPS 배포 주소(또는 localhost)에서만 동작한다.

## 검증

- `pnpm exec tsc --noEmit`, `pnpm lint`, `node --test tests/*.test.mjs`(5개, 구독 입력 검증 추가), `pnpm build`: 통과
- Edge Function: 잘못된 비밀 401, GET 405, provision 200.
- 로컬 admin(3102): 헤더 종 아이콘·패널 표시, 390px에서 패널 16–374px·가로 넘침 없음. 비로그인 상태에서 manifest 200.
- 미검증: 앱 내장 브라우저가 Service Worker 등록을 지원하지 않아 실제 구독·수신은 확인하지 못했다. 운영 DB에 테스트 접수를 넣지 않았으므로 트리거→Edge Function→기기 수신 전체 경로는 실제 기기에서 "테스트 알림"과 첫 실제 접수로 확인해야 한다. admin 외부 배포 없음.
