# 구현·검증 기록 — 2026-09-10

## 반영 결과

Wireframe 네이비·블루 기준. Figma [개발용 컴포넌트·작업 맵](https://www.figma.com/design/qcIM75cIbQ1oYD8NT0Xnuy?node-id=2652-1842)을 추가하고 기존 공통 컴포넌트 13개의 설명에 코드 위치와 역할을 연결했다. 원본 시안과 기존 컴포넌트는 유지했다. 기존 23개 컴포넌트와 토큰을 확인했으며, 이번 결과는 개발 매핑·재사용 정리다.

공통 최초 커밋: web `21b7811`, admin `252dfdf`. 이후 공통 상담 폼·카드·HTML 정제·관리 레코드 UI·스키마 보완을 foundation에서 먼저 커밋해 필요한 기능 브랜치에 반영했다.

| 작업 | 클라이언트 | 어드민 |
|---|---|---|
| 01 home | `codex/01-web-home` · `7846961` | `codex/01-admin-home` · `664bdad` |
| 02 vehicles | `codex/02-web-vehicles` · `984c0ee` | `codex/02-admin-vehicles` · `0db127f` |
| 03 rent | `codex/03-web-rent` · `03384c5` | `codex/03-admin-rent` · `6c52201` |
| 04 accident | `codex/04-web-accident` · `791e0d6` | `codex/04-admin-accident` · `aa3d6fe` |
| 05 new-car | `codex/05-web-new-car` · `d187dbb` | `codex/05-admin-new-car` · `c5c5717` |
| 06 information | `codex/06-web-information` · `11b2f40` | `codex/06-admin-information` · `dbb75ee` |
| 07 content | `codex/07-web-content` · `00402d6` | `codex/07-admin-content` · `e77a9d8` |
| 08 contact | `codex/08-web-contact` · `1f31633` | `codex/08-admin-contact` · `3111600` |

각 번호의 워크트리: `.worktrees/web/<번호>-<기능>` 및 `.worktrees/admin/<번호>-<기능>` (프로젝트 상위 기준). 16개 모두 최초 기능 타입 검사를 통과했고 `--no-ff` 병합 시 파일 충돌 0건. 통합 단계 QA는 `codex/09-web-validation`, `codex/09-admin-validation`에 커밋한다. main 변경·원격 push·배포는 수행하지 않았다.

## 구현 범위

- 웹: 홈, 차종 필터·추천, 차량 상세, 일/주/월 검색·일정 전달, 사고대차, 신차 상담, 회사소개, 이용안내, 이벤트 목록·상세·홈 팝업, 공지 검색·목록·상세, 문의, 약관·개인정보 페이지.
- 어드민: 실제 통계·최근 상담, 차량/실차/요금/옵션/제조사·카테고리, 예약 상담 상태, 신차 상담 분류, 문의 내부 답변, 이벤트 기간·팝업, 공지 고정·페이지 나누기, 10종 구조화 콘텐츠와 사업자 설정.
- 공통: 원 단위 독립 요금, 상담·문의 서버 검증, 명시적 동의, 중복 제출 방지, 실패 복구, 게시물 HTML 허용 목록 정제, 관리자 서버 세션·role 검사와 테이블 RLS.
- 기존 문제 수정: 월 요금 중복 환산, 불필요한 테스트 공지 생성 버튼, 가짜 통계/연락처, 로그인·데이터 로딩 린트 오류, 이벤트 날짜의 한국 시간 왕복, 저장 결과 0행을 성공으로 처리하는 경우.

## DB 변경 (실제 적용)

환경: 두 앱의 기존 Supabase 프로젝트 `daerwmqweobyeecbquuh`.

1. `jin_content_and_admin_roles_v1` — `admin/scratch/rollout_content_v1.sql`: site_content, 차량 options/seats/manufacturer, 콘텐츠 초기값, 관리자 role 기반 테이블 정책·조회 인덱스.
2. `jin_event_popup_v1` — `admin/scratch/rollout_event_popup_v1.sql`: events.is_popup.

기존 차량 22개, 카테고리 7개 등 기존 레코드는 보존했다. 공개 콘텐츠 5개와 초안 5개로 시작한다. about 초안 제목의 저장 검증 후 원문 및 비공개 상태로 복원한 것을 SQL로 확인했다. 고객처럼 보이는 테스트 상담·문의를 운영 DB에 생성하지 않았다.

## 검증 결과

| 검증 | web | admin |
|---|---|---|
| TypeScript `pnpm exec tsc --noEmit` | 통과 | 통과 |
| ESLint 전체 | 오류 0 / 경고 0 | 오류 0 / 경고 0 |
| Node 테스트 | 5개 통과 | 3개 통과 |
| Next 프로덕션 빌드 | 통과 | 통과 |

초기 lint는 web 23 errors/21 warnings, admin 15 errors/24 warnings였다. 테스트는 가격 미등록·0·음수·NaN, 기간/종류 변조, 전화번호 형식, HTML 스크립트/이벤트 속성/위험한 URL 제거 및 정상 서식 보존을 다룬다. Node의 모듈 타입 자동 감지 안내와 런타임 deprecation 안내는 빌드 실패가 아니다.

브라우저에서 직접 확인:

- 홈 데스크톱과 좁은 모바일 화면, 가로 넘침 없음, 모바일 메뉴 열기와 Escape 닫기.
- 렌트 목록 22건, 검색 0건의 빈 상태, 그랜저GN7 검색 1건, 3개월/2026-10-01 일정의 상세 상담 폼 전달.
- 연락처가 잘못된 문의는 서버에서 거부하며 폼 입력을 유지. 동의 전 제출 버튼 비활성.
- 회사소개·이용안내·사고대차·이벤트·공지·개인정보·약관 정상 제목 표시, 신차 선택 폼, 잘못된 차량 ID의 404 안내.
- 사용자가 로그인한 관리자 세션으로 대시보드·차량 22개·실차 수 조회, 차량 편집 폼, 예약/신차/이벤트/공지/문의/설정 경로 정상 표시.
- 비공개 회사소개 CMS 제목 수정 → 저장 성공 → 새로고침 후 지속 → 원복 저장. 최종 SQL에서 원문·is_published=false 확인.
- 공개 키 REST 조회: 공개 콘텐츠·차량·카테고리 200 응답. reservations/inquiries 공개 조회는 0건으로 개인정보 미노출.

## 검증 한계·운영 입력

- 정상 상담 접수→관리자 확인·상태 변경, 차량/게시물 생성·삭제 및 이미지 업로드의 모든 조합을 실제 운영 DB로 실행하지 않았다. 운영 데이터 오염을 피하기 위해 비공개 CMS 저장과 부정 입력 검증을 실제로 수행했다. 결제·배차 확정·SMS/이메일 발송 기능은 없다.
- 사업자 연락처·카카오 채널은 운영자가 `/settings`에 입력해야 한다. 기존 안내/약관 문구는 초안이며 게시 전 운영 기준에 맞게 검토한다. 미등록 요금은 상담 문의로 표시한다.
- Supabase 보안 진단에서 기존 함수 `handle_new_user`, `handle_updated_at`의 [search_path 경고](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable), `handle_new_user`·`rls_auto_enable`의 [SECURITY DEFINER 실행 권한 경고](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [유출 비밀번호 보호 비활성](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)이 남아 있다. 이번 마이그레이션에서 새로 만든 함수는 없다. 별도 인증 운영 점검 대상으로 기록한다.

실행: web에서 `pnpm dev --port 3100`, admin에서 `pnpm dev --port 3101`. 현재 미리보기는 [웹](http://localhost:3100) / [어드민](http://localhost:3101). 외부 배포 주소가 아니다.

## 33 — 관리자 PWA 푸시 알림 (2026-09-25)

예약·신차 상담과 고객 문의 접수 시 관리자 기기로 Web Push. DB 트리거 → pg_net → Edge Function `admin-push` → web-push. 운영 Supabase에 마이그레이션 2개와 Edge Function 적용. web 코드·계약 변경 없음. 상세는 `docs/features/33-admin-push.md`.
