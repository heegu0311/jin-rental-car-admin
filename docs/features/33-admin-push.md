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

## 홈 화면 설치 가이드 (추가)

- 헤더 `?` 아이콘 → `InstallGuide` 다이얼로그. iPhone·iPad / Android 탭, 열 때 기기 자동 선택. 홈 화면 앱으로 실행 중이면 안내 표시.
- Android Chromium에서 `beforeinstallprompt`가 오면 ‘지금 설치’ 버튼으로 기본 설치 창을 띄운다.
- 모바일 헤더: 아이콘 추가로 제목이 줄바꿈되어 ‘관리자’ 글자를 sm 미만에서 숨기고 제목을 한 줄로 유지.
- 검증: tsc·lint·테스트·build 통과, 375px에서 제목 한 줄·가로 넘침 없음·다이얼로그 내부 스크롤 확인.

## Android 알림 클릭의 PWA 실행 수정 (2026-11-07)

- 기존 `notificationclick`은 같은 출처의 첫 WindowClient를 탐색·포커스했으므로, 일반 Chrome 탭이 열려 있으면 설치된 PWA 대신 그 탭으로 이동할 수 있었다.
- 이제 `clients.openWindow()`를 직접 호출해 Chrome Android가 설치된 standalone 앱으로 연결할 수 있게 한다. 반환된 창이 있으면 포커스하고, null이면 그대로 완료한다. 설치 여부·설치 브라우저·기기 설정에 따른 앱 실행 여부는 실제 Android에서 확인해야 한다.
- 수신 시점과 클릭 시점 모두 내부 경로만 허용한다. 이전 알림에 외부 주소가 있어도 관리자 홈으로 이동한다.
- 알림 전용 서비스 워커의 새 버전은 `skipWaiting()`으로 활성화한다. 기존 관리자 창이 열려 있어도 업데이트가 대기하지 않는다. 오프라인 캐시·DB·구독·manifest 식별자는 변경하지 않는다.
- 회귀 테스트: 창을 직접 탐색하지 않는 실행 경로, 반환된 창 포커스/null 처리, 외부 주소 차단, 수신→클릭 주소 유지, 업데이트 활성화.
- 참고: [MDN Clients.openWindow](https://developer.mozilla.org/en-US/docs/Web/API/Clients/openWindow), 현재 설치된 Next.js 16.2.3 PWA 가이드와 manifest 문서.
- 실제 기기 확인: 배포 후 설치된 관리자 앱을 한 번 실행해 새 워커를 받는다. 일반 Chrome 관리자 탭과 PWA가 함께 열린 경우 및 PWA를 닫은 경우 각각 ‘테스트 알림’을 누르고, 앱으로 이동하는지 확인한다. 예약·신차·문의 알림은 각각 해당 목록으로 이동해야 한다. PWA 설치와 알림 구독은 같은 브라우저·관리자 주소에서 사용한다.
- 검증: admin 테스트 34개(새 회귀 테스트 5개 포함)·web 테스트 34개, 양쪽 `pnpm exec tsc --noEmit`·`pnpm lint`·`pnpm build` 통과. 첫 빌드는 Google Fonts 연결 제한으로 실패했고, 다운로드 가능한 환경에서 재실행해 통과했다.
- 작업 저장소: `admin/main`. web의 기존 `components/cars/RentalGuide.tsx` 변경은 보존했다. 외부 push·배포 및 실제 Android 기기 검증은 수행하지 않았다.
