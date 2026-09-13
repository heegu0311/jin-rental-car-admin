# 진렌트카 아키텍처

## 기준과 결정

- 디자인: [Wireframe](https://www.figma.com/design/qcIM75cIbQ1oYD8NT0Xnuy?node-id=0-1)의 네이비·블루. 사용자가 2026-09-10 확정. New design의 Bold Lime은 적용하지 않는다.
- `web/`, `admin/`은 독립 Git 저장소다. 상위 폴더에 중첩 Git 저장소를 만들지 않는다.
- Next.js 16.2.3 App Router / React 19 / TypeScript / Tailwind 4 / Supabase를 유지한다.
- UI: web의 Base UI 기반 shadcn을 유지. admin은 기존 Radix·TipTap을 유지한다. 서로의 UI 패키지를 직접 참조하지 않는다.
- 공유 데이터 계약은 양쪽 `lib/domain/contracts.ts`에 동일한 v1 사본으로 배포한다. 패키지화를 위한 모노레포 이전은 필요할 때 별도 작업한다.

## 레이어와 의존성

`app/`(경로·서버 조회) → `components/<feature>/`(도메인 UI) → `components/shared/`(상태·표·레이아웃) → `components/ui/`(입력 컨트롤).
`lib/domain/`은 React와 Supabase에 의존하지 않는 데이터 계약·가격/상태 규칙이다.
클라이언트 웹의 브라우저 쿼리는 공개 데이터 읽기와 접수만 허용. 관리자 데이터는 세션과 profiles.role, DB RLS로 보호한다.
서버 조회 실패는 오류 화면으로, 조회 결과 0건은 빈 상태로 표시한다. 오류를 정상 빈 목록이나 샘플 데이터로 바꾸지 않는다.

## 공통 컴포넌트

| Figma | 코드/책임 | 사용처 |
|---|---|---|
| navigation-bar, footer | Header / Footer / MobileNav | 클라이언트 전체 |
| button, input-field, select-trigger, checkbox, dialog | 기존 components/ui | 모든 폼 |
| category-tab, car-card | 차량 카테고리 필터 / VehicleCard / Price | 홈·렌트검색·사고대차 |
| benefit-card, Step Card | 콘텐츠 섹션 / 절차 목록 | 홈·이용안내·사고대차 |
| quick-rent-consultation-form | ConsultationForm / PrivacyConsent | 홈·차량상세·신차 |
| badge, table-header, table-row | StatusBadge / DataTable / Panel | 어드민 전체 |
| search-bar, tab-bar | 기능별 검색 상태 + 공통 폼 | 목록·문의·예약 |
| 공통 상태 | PageHeading / EmptyState / Feedback | 양쪽 전체 |

## 데이터와 소유권

| 테이블 | 관리 화면 | 클라이언트 사용처 |
|---|---|---|
| vehicles | /vehicles | 추천·필터·상세·신차 선택 |
| vehicle_categories | /vehicles 카테고리 | 홈·검색 |
| vehicle_units | /vehicles 차량별 실차 | 현재 재고 안내 (날짜별 예약 확정 아님) |
| reservations | /reservations | 빠른 상담·차량/기간 상담·신차 상담 |
| inquiries | /inquiries | /contact |
| events | /events | /event, /event/[id], 홈 팝업 |
| notices | /notices | /notice, /notice/[id] |
| site_content | /content/[slug], /settings | 배너·특장점·회사소개·이용안내·사고대차·약관·고객센터 |
| profiles | 관리자만 DB에서 권한 부여 | 웹에는 노출하지 않음 |

- 차량 UUID는 string. 금액은 원 단위 정수. 0 또는 미등록 요금의 공개 표시는 상담 문의. 일/주/월 요금은 독립 저장값이다. 월 요금에 30을 다시 곱하지 않는다.
- 예약은 **상담 접수**이며 결제/실차 배차 확정 시스템이 아니다. confirmed는 상담완료를 뜻한다.
- 신차 상담은 reservations에 선택 차량·기간·출고 시기·추가 요청을 저장한다. 고객정보를 콘솔에 기록하지 않는다.
- 게시물 HTML은 출력 시 허용 목록으로 정제한다. 콘텐츠 페이지는 구조화된 일반 텍스트를 사용한다.
- 신규 SQL은 admin에서만 소유한다. 적용 환경·마이그레이션 이름·결과를 문서화한다.
- public에는 공개된 콘텐츠만 조회 가능. 연락처가 포함된 inquiries/reservations는 관리자만 조회·수정한다.
- profiles는 본인 role 읽기만 허용하고 브라우저에서 role을 수정하거나 스스로 admin이 되게 하지 않는다.

## 브랜치와 워크트리

공통 커밋을 먼저 만든 다음 아래 브랜치를 **동일한 foundation 커밋에서** 분기한다.
모든 브랜치의 `codex/` 접두사는 유지한다. 두 저장소에서 같은 번호가 한 기능 묶음이다.

| 번호 | web 브랜치 | admin 브랜치 | 전용 파일 |
|---|---|---|---|
| 00 | 00-web-foundation | 00-admin-foundation | shared, domain, globals, layout, 문서 |
| 01 | 01-web-home | 01-admin-home | 홈, Hero, USP / 대시보드 |
| 02 | 02-web-vehicles | 02-admin-vehicles | cars / vehicles (VehicleCard는 foundation 소유) |
| 03 | 03-web-rent | 03-admin-rent | rent, rental / reservations |
| 04 | 04-web-accident | 04-admin-accident | accident / 사고대차 콘텐츠 |
| 05 | 05-web-new-car | 05-admin-new-car | new-car, cars/NewCarApplicationForm / 신차 상담 분류 |
| 06 | 06-web-information | 06-admin-information | about, info, terms, privacy / 콘텐츠 편집·설정 |
| 07 | 07-web-content | 07-admin-content | event, notice, EventPopup / events, notices |
| 08 | 08-web-contact | 08-admin-contact | contact / inquiries |

각 기능의 워크트리는 `../.worktrees/<app>/<번호>-<기능>/`에 둔다. main은 보존하고 결과는 `codex/integration`에 merge --no-ff로 모은다.
독립 기능 브랜치는 다른 기능 파일을 수정하지 않는다. 공통 수정이 필요하면 foundation 보완 커밋을 만들고 영향 브랜치에 먼저 병합한다.
DB 변경은 한 담당자만 수행한다. package.json, lockfile, globals.css, root layout, 공통 컴포넌트, contracts는 foundation 소유다.
워크트리에는 `.env.local`을 복사하거나 커밋하지 않는다. 필요하면 로컬 심볼릭 링크로 연결한다. 의존성 설치와 dev 포트를 분리한다 (이번 검증: web 3100, admin 3101; 기존 3000~3002 서비스 보존).

## 완료 기준

1. 기존 및 새 URL에서 정상·로딩·빈 상태·오류·없는 ID를 처리한다.
2. 관리자 저장 → 클라이언트 재조회 반영, 상담 접수 → 관리자 목록/상태 변경을 검증한다.
3. 390px / 1440px, 키보드 초점, 필수 라벨, 동의·중복 제출 방지, 네트워크 실패를 확인한다.
4. 양쪽 pnpm exec tsc --noEmit, pnpm lint, pnpm build. 금액·기간·권한·입력 검증은 의미 있는 테스트를 추가한다.
5. 운영 DB에 실제 고객처럼 보이는 테스트 예약을 넣지 않는다. 통합 테스트는 분리된 데이터/목킹으로 수행하며 실제 검증과 구별해 기록한다.
6. 배포·푸시 상태, 검증하지 못한 항목, 커밋·워크트리 위치를 최종 문서에 남긴다.

## 통합 상태와 후속 작업 방식

현재 두 저장소의 실행 체크아웃은 `codex/integration`이다. 01~08 기능 브랜치를 충돌 없이 통합했고, 통합 검사 수정은 `codex/09-web-validation` / `codex/09-admin-validation`에 대응시킨다. 16개 기능 워크트리는 작업 이력과 다음 수정의 출발점으로 유지한다.
새 기능은 현재 integration에서 새 번호 쌍으로 분기한다. 기존 기능 브랜치를 재사용할 때는 **그 브랜치의 워크트리에서** integration을 먼저 병합한다. 현재 최신 결과를 보려면 루트 web/admin을 실행한다. 기능 워크트리는 해당 기능 시점의 코드이므로 독립적으로 실행 시 다른 기능이 아직 없을 수 있다.

`site_content`의 공개된 제목·설명·이미지를 Wireframe 레이아웃 안에 반영한다. 회사소개·이용안내·사고대차는 원본 섹션 배치를 유지하고 추가 구조화 본문을 표시한다. 개인정보·약관은 공개된 본문으로 대체한다. 사업자 연락처·상담 채널은 `/settings`에서 관리하며 비어 있는 사업자 표시 값은 Figma 원본의 값을 기본값으로 사용한다. 카카오·네이버 URL 미등록 시 문의 페이지로 연결한다.

새 관리 화면은 실제 Supabase 데이터를 사용한다. 예약·문의 관리 목록은 최신 500건을 조회해 검색과 페이지 나누기를 제공한다. 상담완료/답변완료는 내부 상태이며 SMS·이메일 자동 발송을 의미하지 않는다. 온라인 결제·날짜별 실차 배차·외부 알림 전송은 이번 구현에 포함되지 않는다.

## 10 — Wireframe 디자인 정합성 수정

- 후속 수정은 `codex/10-web-design-parity`와 `codex/10-admin-design-parity`에서 관리한다. 검증 후 integration에 통합한다.
- 원본 치수와 에셋은 `DESIGN_PARITY.md`를 참조한다. web의 `app/wireframe.css`는 페이지 간 공통 시각 규칙이므로 동시에 수정하지 않는다.
- Header/Footer, PageBanner, ChannelButtons, QuickConsultation, PremiumCTA를 공통 구성으로 사용한다. Inter + Noto Sans KR을 두 앱에 적용한다.
- 사용자 결정: 차량명·가격·사진은 실제 관리자 데이터를 유지한다. 디자인의 샘플 차량/가격으로 덮어쓰지 않는다.
- 렌트 검색의 수령 방식·대여/반납일시·장소는 URL에 보관하고 상세 상담 폼의 시작일·기간·추가 요청으로 전달한다.
- 신차 상담의 선택 생년월일은 6자리 입력만 받으며 기존 예약 options에 저장한다. 공개 개인정보 안내에 선택 항목을 명시한다.
- 관리자 그래프는 한국 시간 기준 오늘 포함 최근 7일의 실제 접수 건수를 서버에서 집계한다. 샘플 막대나 증가율을 표시하지 않는다.
