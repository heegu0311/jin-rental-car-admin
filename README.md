# 진렌트카 관리자 (admin)

Next.js 16 App Router · React 19 · TypeScript · Tailwind 4 · Radix · TipTap · Supabase.
고객 웹은 별도 저장소 `web/`이며, 전체 규칙과 결정 이력은 [ARCHITECTURE.md](ARCHITECTURE.md), 작업 규칙은 [AGENTS.md](AGENTS.md)에 있다.
Supabase 스키마·권한 SQL은 이 저장소가 소유한다(`supabase/migrations/`).

## 실행

```bash
pnpm install
pnpm dev          # http://localhost:3000 (상위 폴더 .claude/launch.json은 3102 사용)
pnpm test         # node --test (계약·분류/필터·차량 저장 검증·표 편집·푸시)
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

변경을 커밋하기 전에 test · tsc · lint · build를 모두 통과시킨다.

### 환경변수 (`.env.local`, 커밋 금지)

| 이름 | 용도 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 로그인 세션 + RLS로 관리자 데이터 접근 |
| `WEB_REVALIDATE_URL`, `WEB_REVALIDATE_SECRET` | 저장 후 고객 웹 즉시 반영(서버 전용). 없으면 최대 3시간 뒤 반영 |
| `SENTRY_DSN` | 서버 오류 알림용 Sentry DSN. 미설정 시 수집하지 않음 |

서버 작업 로그는 Vercel Logs에서 `event=operation` 또는 `requestId`로 검색한다. 예약·문의 상태 변경, 차량 저장, 공개 사이트 재검증은 작업명, 결과 코드, 소요 시간만 남긴다. 고객 입력값과 공급자 오류 본문은 남기지 않는다. 재검증 요청의 ID는 고객 웹 로그에도 전달된다. Sentry에는 실패 코드만 전송한다. 알림을 받으려면 Sentry 프로젝트의 DSN을 서버 환경변수에 설정하고 해당 프로젝트에서 오류 알림 규칙을 켠다.

service-role 키는 이 앱에서 쓰지 않는다. 관리자 권한은 서버 세션 + `profiles.role` + RLS로 확인한다(`lib/auth.ts`의 `requireAdmin`).

### 관리자 비밀번호 찾기

로그인의 **비밀번호 찾기** → `/login/forgot-password`에서 이메일 이용 동의 후 메일 요청 → `/auth/recovery`에서 PKCE 인증 코드 교환 및 관리자 권한 확인 → `/login/reset-password`에서 새 비밀번호 저장 → 로그아웃 후 다시 로그인한다. 메일 링크는 요청한 브라우저에서 열어야 한다. 비밀번호는 영문·숫자를 포함한 12~128자이며 Supabase 프로젝트의 추가 비밀번호 정책도 적용된다.

운영 전 Supabase Authentication 설정을 확인한다.

- URL Configuration의 Redirect URLs에 `https://<관리자 도메인>/auth/recovery`를 등록한다. 로컬 검증은 사용 중인 포트의 `http://localhost:<포트>/auth/recovery`도 등록한다.
- Reset Password 이메일 템플릿은 `{{ .ConfirmationURL }}` 링크를 유지한다. 커스텀 템플릿이 Site URL로 직접 이동하면 PKCE 콜백을 거치지 못한다.
- 이메일 발송/SMTP 설정과 발송 제한을 확인한다. 실제 관리자 메일 수신·링크 인증·새 비밀번호 로그인은 운영 설정 후 별도 확인한다.

2026-11-07 운영 프로젝트에 관리자 도메인·Vercel 도메인·로컬 3102의 `/auth/recovery`를 등록하고 한국어 재설정 메일을 적용했다. 실제 메일 수신과 새 비밀번호 설정 화면 도착까지 확인했다. 본문 사본은 `supabase/templates/recovery.html`에 있으며, 제목은 **진렌트카 비밀번호 변경하기**다. 호스팅 설정은 저장소 파일만 수정해서 자동 반영되지 않는다.

메일 요청 전 `is_admin_recovery_email` RPC로 활성 관리자 등록 여부를 확인한다. 미등록·비관리자·차단/삭제 계정이면 메일을 요청하지 않고 Sonner로 **유효한 관리자 이메일이 아닙니다.**를 표시한다(2026-11-07 사용자 요청). 조회 실패는 미등록으로 취급하지 않고 재시도를 안내한다. 새 마이그레이션 `20261107062641_admin_recovery_email_check.sql`은 운영 DB에 적용했다. 기존 테이블 RLS·공유 계약·추가 환경변수 변경은 없다. 저장 시 세션과 `profiles.role`을 다시 검증한다. 상세 구현 및 검증 기록은 [비밀번호 찾기 문서](docs/features/admin-password-recovery.md)를 참고한다.

### 마이페이지

헤더 오른쪽의 이메일 첫 글자 프로필을 클릭하면 `/mypage`로 이동한다. 표시 이름은 본인 Auth user metadata의 `display_name`에 저장하며 이메일과 관리자 권한은 수정하지 않는다. 이메일/비밀번호 계정은 현재 비밀번호를 확인한 후 변경하고 로그아웃한다. Google 전용 계정은 이메일 재설정 흐름으로 연결한다. 구현·검증 기록은 [마이페이지 문서](docs/features/admin-account-settings.md)를 참고한다.

## 폴더 구조

```
app/(dashboard)/        로그인 후 화면. 서버 컴포넌트에서 requireAdmin()으로 조회
  reservations/ new-car/ inquiries/ consultations/   예약·신차·문의 (모두 components/consultations 사용)
  vehicles/             차량 목록·카드·표 편집
  events/ notices/      게시물 목록(클라이언트 조회) + 작성 폼
  content/ insurance/   사이트 콘텐츠·자차보험 설정
components/
  ui/                   Radix 기반 select 등 입력 컨트롤
  shared/               화면 공통: PageHeading·EmptyState·Feedback·StatusBadge(feedback.tsx), DataTable,
                        Pagination, StatusChips, ListFilters(SearchInput·FilterPill), ImageUploadField, Panel
  consultations/        예약·문의 목록(RecordManager, ConsultationList)·상세(RecordDetailDialog)
  vehicles/             차량 편집(VehicleModal = 폼 + VehicleImagesField), 목록, 표
  admin/                셸·사이드바·에디터·푸시
lib/
  domain/contracts.ts   web과 동일한 데이터 계약. 바꾸면 web 사본도 똑같이
  domain/vehicle-form.ts 차량 편집 상태(Car) ↔ DB 행 변환, 저장 전 검증
  domain/vehicle-sheet.ts 표 편집 셀 파싱·붙여넣기
  consultation.ts       신차/문의 분류, 검색·상태·접수월 필터
  format.ts             한국 시간 날짜(kstDate·kstMonth·formatKstDateTime), 전화번호 표시
  records.ts            서버 액션: 예약·문의 상태 저장/삭제
  hooks/                use-submit-lock(중복 제출 방지), use-admin-table(events·notices 목록)
  public-site.ts        저장 후 고객 웹 반영 알림(notifySaved, refreshPublicSiteOrNotify)
  storage/upload-image.ts 이미지 WebP 변환·데스크톱/모바일 두 장 업로드
tests/                  node --test. lib의 순수 함수만 테스트한다
```

의존 방향: `app → components/<기능> → components/shared → components/ui`, 그리고 어디서든 `lib`.
`lib/domain`, `lib/consultation.ts`, `lib/format.ts`는 React·Supabase를 import하지 않는다(테스트가 바로 실행됨).
이들끼리는 `./contracts.ts`처럼 확장자를 붙여 import한다(node 테스트 실행용, `allowImportingTsExtensions`).

## 공통 모듈 사용법

- **저장 버튼 중복 클릭 방지** — `const { busy, run } = useSubmitLock();` 후 `await run(async () => { … })`.
- **게시물 목록** — `useAdminTable<T>("events", ORDER)` → `rows, loading, loadError, toggle(row, "is_active", 완료문구), remove(id, { confirm, done })`.
  `ORDER`는 모듈 상수로 둔다(렌더마다 재조회 방지). 변경 성공 시 고객 웹 반영까지 처리한다.
- **목록 페이지 나누기** — `<Pagination page total pageSize onChange />` (page는 0부터).
- **날짜** — 화면·필터의 날짜는 항상 `lib/format.ts`의 한국 시간 함수로 만든다.
- **저장 후 안내** — 서버 액션이 돌려준 `site`로 `notifySaved(문구, site)`. 직접 `toast.success`만 쓰면 반영 실패 안내가 빠진다.

## 자주 하는 수정

| 하고 싶은 일 | 볼 곳 |
|---|---|
| 차량 입력 항목 추가 | DB 마이그레이션 → `lib/domain/contracts.ts`(web도) → `lib/domain/vehicle-form.ts`(변환·검증·테스트) → `VehicleModal.tsx` |
| 예약/문의 목록 필터·열 | `components/consultations/RecordManager.tsx`, 규칙은 `lib/consultation.ts` |
| 예약/문의 상태 값 | `lib/records.ts`의 `STATUSES` + 계약의 `RESERVATION_LABELS`/`INQUIRY_LABELS` (DB에 check 제약이 있으면 마이그레이션도) |
| 이벤트·공지 목록 | `app/(dashboard)/events|notices/page.tsx`, 공통 동작은 `lib/hooks/use-admin-table.ts` |
| 스키마·권한 변경 | `supabase/migrations/`에 새 파일. 적용 환경·이름·결과를 ARCHITECTURE에 기록 |
