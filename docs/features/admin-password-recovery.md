# 관리자 비밀번호 찾기 (2026-11-06)

## 변경

- 기존 네이비 로그인 화면에 비밀번호 찾기 링크 추가. 이메일 요청과 새 비밀번호 저장은 별도 화면이다.
- 요청은 서버 액션에서 이메일 형식·길이·이용 동의를 검증한다. Next.js의 동일 출처 검사와 HTTPS/로컬 HTTP origin 검증을 거쳐 콜백 주소를 생성한다. 임의 redirect URL 입력은 받지 않는다.
- Supabase `resetPasswordForEmail`을 사용한다. 등록 여부를 노출하지 않는 조건부 안내를 표시하며 발송 오류·요청 제한은 오류로 표시한다.
- `/auth/recovery`가 PKCE 코드를 교환하고 `profiles.role`을 확인한다. 만료·재사용·다른 브라우저의 링크는 재요청 화면으로 안내한다. 복구 콜백은 외부 URL로 이동하지 않는다.
- 저장 화면과 서버 액션 모두 인증/관리자 권한을 확인한다. `updateUser`로 로그인한 본인의 비밀번호만 변경하며 service-role 키는 사용하지 않는다. DB RLS는 기존 정책을 유지한다.
- 비밀번호 길이(12~128자), 영문·숫자 포함, 확인 일치를 서버에서 검증한다. 저장 성공 후 로그아웃하고 로그인 화면에 변경 완료 안내를 표시한다. 로그아웃 실패는 저장 실패와 구분하고 재시도 버튼을 제공한다.
- 공통 `useSubmitLock`으로 중복 전송 방지. 실패 시 입력을 보존하고 재시도할 수 있다. 비밀번호·이메일·인증 코드를 로그에 출력하지 않는다.

## 검증

- admin: 테스트 25개 통과(새 테스트 7개). 이메일·origin·비밀번호 검증, 세션 없음/만료, 비관리자/프로필 조회 실패 차단, admin/superadmin 저장, 저장 실패, 로그아웃 실패를 격리된 모킹으로 검증했다.
- web: 기존 테스트 34개 통과. 두 저장소 타입 검사·린트·프로덕션 빌드 통과. web에 기존 미사용 `delivery` 린트 경고 1건이 있으며 이번 변경과 무관하다.
- 최초 빌드는 실행 환경의 Google Fonts 연결 제한으로 실패했고, 네트워크 접근을 허용해 다시 실행한 두 빌드는 통과했다.
- 실제 브라우저 1440×900 / 390×900에서 로그인 링크, 필수 이메일·동의, 통신 실패 후 오류/버튼 복구 및 입력 보존, 잘못된 복구 링크 안내, 비로그인 저장 화면 차단을 확인했다. 가로 넘침 없음. 카드 폭 448px / 358px. 스크린샷은 로컬 검증 임시 경로 `/private/tmp/jin-password-recovery/request-{1440,390}.png`에 저장했다.
- 별도의 임시 Next.js 실행 환경과 모킹한 Supabase HTTP 서버에서 1440px / 390px 전체 흐름도 검증했다. 발송 제한 오류 → 재시도 → PKCE 검증 쿠키/코드 교환 → 저장 화면 → 비밀번호 불일치 차단 → 저장 → 로그아웃 → 로그인 완료 안내와 비관리자 콜백 차단을 확인했다. 실제 이메일 발송과 수신, 실제 계정의 새 비밀번호 재로그인은 검증하지 않았다. 운영 계정·비밀번호는 변경하지 않았다.

## 운영 설정 및 배포

Supabase Redirect URLs에 관리자 origin의 `/auth/recovery`를 등록하고, Reset Password 템플릿의 `{{ .ConfirmationURL }}` 및 SMTP 설정을 확인한다([공식 가이드](https://supabase.com/docs/guides/auth/passwords#resetting-a-password)). 메일 요청과 링크 열기는 같은 브라우저에서 진행한다.

admin main에서 구현한다. web 소스·계약·DB 마이그레이션 변경 없음. 로컬 커밋만 수행하며 외부 push·배포·Supabase 설정 변경은 수행하지 않는다.

## 2026-11-07 — 운영 메일·리다이렉트 설정 수정

- 대상: Supabase `jin-rental-car` 프로젝트(`daerwmqweobyeecbquuh`), main PRODUCTION. Supabase Dashboard에서 설정을 직접 저장했다. 위의 "Supabase 설정 변경 없음"은 최초 구현 당시 기록이다.
- 원인: Redirect URLs에 `https://admin.jinrentcar.co.kr/auth/callback`만 등록되어 있었다. 기존 수신 메일의 재설정 링크도 `/auth/recovery` 대신 기본 Site URL 루트로 이동하도록 생성된 것을 확인했다.
- 기존 로그인 콜백은 유지하고 아래 세 주소를 정확한 경로로 추가했다. 와일드카드는 사용하지 않았다.
  - `https://admin.jinrentcar.co.kr/auth/recovery`
  - `https://jin-rental-car-admin.vercel.app/auth/recovery`
  - `http://localhost:3102/auth/recovery`
- Reset password 제목을 **진렌트카 비밀번호 변경하기**로 변경했다. 한국어 안내·네이비 버튼·요청하지 않은 경우의 안내를 적용했다. 저장한 본문은 `supabase/templates/recovery.html`에 보관한다. 인증 링크는 기존 `{{ .ConfirmationURL }}`를 유지한다.
- 실제 서비스에서 재설정 메일 1건을 요청해 한국어 제목과 본문 수신, 링크의 `/auth/recovery` 목적지, 클릭 후 `/login/reset-password`의 **새 비밀번호 설정** 화면 도착을 확인했다. 비밀번호 입력·변경 제출은 하지 않았으며 사용자가 직접 마무리한다. 새 계정 생성·권한 변경·SMTP 변경은 없다.
- 이전 메일의 링크는 수정되지 않으므로 새로 요청한 메일을 사용해야 한다. 요청과 링크 열기는 같은 브라우저에서 진행한다.
- 이번 후속 수정은 호스팅된 인증 설정과 정적 메일 템플릿·기록만 변경했다. 런타임 소스·의존성·DB·공유 계약 변경이 없어 타입 검사·린트·빌드를 재실행하지 않았다. 검증은 실제 메일 발송·수신·인증 이동으로 수행했다. 코드 push·사이트 재배포는 하지 않았다.
